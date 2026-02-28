import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import { json } from 'express';

console.log('🔵 main.ts file loaded');

async function bootstrap() {
  console.log('🔵 bootstrap() function called');
  try {
    console.log('1️⃣ Creating NestFactory...');
    const app = await NestFactory.create(AppModule);
    console.log('2️⃣ NestFactory created, setting up security...');

    // Security: Helmet for HTTP headers
    app.use(helmet());

    // Configure raw body for Stripe webhooks (must be before global JSON parser)
    app.use(
      '/api/subscriptions/webhook',
      json({
        verify: (req: any, res, buf) => {
          if (Buffer.isBuffer(buf)) {
            req.rawBody = Buffer.from(buf);
          }
        },
      }),
    );

    // Security: CORS configuration
    const corsOrigin = process.env.CORS_ORIGIN || '*';
    app.enableCors({
      origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    console.log('3️⃣ Security set, setting up Swagger documentation...');
    // Swagger API documentation
    const config = new DocumentBuilder()
      .setTitle('Pricelens API')
      .setDescription('Backend API for Pricelens - Price comparison and tracking platform')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    console.log('4️⃣ Swagger set, setting up pipes...');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    console.log('5️⃣ Pipes set, setting up filters...');
    app.useGlobalFilters(new AllExceptionsFilter());
    console.log('6️⃣ Filters set, preparing to listen...');

    const port = process.env.PORT ?? 3000;
    const host = '0.0.0.0'; // Listen on all network interfaces (not just localhost)
    console.log(`7️⃣ Attempting to listen on ${host}:${port}...`);
    await app.listen(port, host);
    
    // Get current network IP address for better logging
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let currentIP = 'localhost';
    for (const interfaceName in networkInterfaces) {
      const addresses = networkInterfaces[interfaceName];
      for (const address of addresses) {
        if (address.family === 'IPv4' && !address.internal) {
          currentIP = address.address;
          break;
        }
      }
      if (currentIP !== 'localhost') break;
    }
    
    console.log(`🚀 Nest application successfully started on ${host}:${port}`);
    console.log(`📚 Swagger documentation available at http://localhost:${port}/api`);
    console.log(`🌐 API accessible at http://${currentIP}:${port}`);
    console.log(`💡 Update client/constants/api.ts with IP: ${currentIP}`);
  } catch (error: any) {
    console.error('❌ Error starting Nest application:', error?.message ?? error);
    if (error?.stack) console.error(error.stack);
    // Help Render troubleshooting: show which required env vars are missing
    const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = required.filter((k) => !process.env[k]?.trim());
    if (missing.length > 0) {
      console.error('Missing required env vars on this host:', missing.join(', '));
    }
    process.exit(1);
  }
}
bootstrap();
