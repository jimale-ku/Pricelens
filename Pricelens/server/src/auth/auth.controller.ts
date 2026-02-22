import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Email already in use' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout from all devices (revoke all refresh tokens)' })
  @ApiResponse({ status: 200, description: 'All sessions logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logoutAll(@Req() req: any) {
    return this.authService.logoutAll(req.user.userId);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  googleAuth() {
    // This endpoint initiates Google OAuth flow
    // Passport will redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'Google login successful' })
  async googleAuthCallback(@Req() req: any, @Res() res: any) {
    try {
      const googleUser = req.user;
      const result = await this.authService.validateGoogleUser(googleUser);
      
      // Encode tokens for deep link (using URL fragment to avoid server logs)
      const tokens = encodeURIComponent(JSON.stringify({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      }));
      
      // Redirect to app deep link
      const deepLink = `pricelens://auth/callback?data=${tokens}`;
      
      // For mobile: redirect to deep link
      // For web/browser: redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      const webRedirect = `${frontendUrl}/auth/callback?data=${tokens}`;
      
      // Try to detect if request is from mobile app (check user agent or use query param)
      const isMobile = req.query.mobile === 'true' || req.headers['user-agent']?.includes('Mobile');
      
      if (isMobile) {
        // Redirect to deep link
        res.redirect(deepLink);
      } else {
        // For web, redirect to frontend URL or show HTML page that redirects
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Signing in...</title>
              <meta http-equiv="refresh" content="0;url=${deepLink}">
              <script>
                window.location.href = '${deepLink}';
                setTimeout(function() {
                  window.location.href = '${webRedirect}';
                }, 1000);
              </script>
            </head>
            <body>
              <p>Redirecting to app...</p>
              <p>If you're not redirected, <a href="${deepLink}">click here</a></p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      const errorMsg = encodeURIComponent(error.message || 'Authentication failed');
      res.redirect(`pricelens://auth/error?error=${errorMsg}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@Req() req: any) {
    return { user: req.user };
  }
}



