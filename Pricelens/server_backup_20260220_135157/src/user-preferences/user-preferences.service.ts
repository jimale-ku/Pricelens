import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';

@Injectable()
export class UserPreferencesService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    let preferences = await this.prisma.userPreference.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!preferences) {
      preferences = await this.prisma.userPreference.create({
        data: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });
    }

    return preferences;
  }

  async update(userId: string, updateDto: UpdateUserPreferencesDto) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: updateDto,
      create: {
        userId,
        ...updateDto,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(userId: string) {
    return this.prisma.userPreference.delete({
      where: { userId },
    });
  }
}
