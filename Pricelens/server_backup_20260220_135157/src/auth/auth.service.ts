import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    // Create free subscription for new user (optional - only if subscription tables exist)
    try {
      const freePlan = await this.prisma.subscriptionPlan.findUnique({
        where: { tier: 'FREE' },
      });

      if (freePlan) {
        await this.prisma.subscription.create({
          data: {
            userId: user.id,
            planId: freePlan.id,
            status: 'ACTIVE',
            tier: 'FREE',
          },
        });
      }
    } catch (error) {
      // Subscription tables don't exist yet - that's okay, skip for now
      // This will work once you run the migration: npx prisma migrate dev
    }

    const tokens = await this.issueTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }

  async validateGoogleUser(googleUser: any) {
    // Check if user exists by Google ID
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    if (user) {
      // Update last login
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } else {
      // Check if user exists by email (link accounts)
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (existingByEmail) {
        // Link Google account to existing user
        user = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId: googleUser.googleId,
            googleEmail: googleUser.email,
            avatarUrl: googleUser.avatarUrl,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            googleId: googleUser.googleId,
            googleEmail: googleUser.email,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            avatarUrl: googleUser.avatarUrl,
            lastLoginAt: new Date(),
          },
        });

        // Create free subscription for new user (optional - only if subscription tables exist)
        try {
          const freePlan = await this.prisma.subscriptionPlan.findUnique({
            where: { tier: 'FREE' },
          });

          if (freePlan) {
            await this.prisma.subscription.create({
              data: {
                userId: user.id,
                planId: freePlan.id,
                status: 'ACTIVE',
                tier: 'FREE',
              },
            });
          }
        } catch (error) {
          // Subscription tables don't exist yet - that's okay, skip for now
        }
      }
    }

    const tokens = await this.issueTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async refresh(token: string) {
    // Find the refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token was already revoked
    if (storedToken.revokedAt) {
      // Token reuse detected! Revoke all tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Token reuse detected. All sessions revoked.');
    }

    // Check if token expired
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Verify JWT signature
    try {
      await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token signature');
    }

    // Revoke the old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Issue new tokens
    const tokens = await this.issueTokens(storedToken.user.id, storedToken.user.email);

    return {
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
      },
      ...tokens,
    };
  }

  async logout(token: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke the refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    // Revoke all active refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return { message: 'All sessions logged out successfully' };
  }

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(payload as any);

    const refreshToken = await this.jwtService.signAsync({
      ...payload,
      type: 'refresh',
      jti: Math.random().toString(36).substring(2, 15),
    } as any, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any,
    });

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        ),
      },
    });

    return { accessToken, refreshToken };
  }
}


