import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';

console.log('🔵 main.ts file loaded');

async function bootstrap() {
  console.log('🔵 bootstrap() function called');
  try {
    console.log('1️⃣ Creating NestFactory...');
    const app = await NestFactory.create(AppModule);
    console.log('2️⃣ NestFactory created, setting up security...');

    // Security: Helmet for HTTP headers
    app.use(helmet());

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
    console.log(`7️⃣ Attempting to listen on port ${port}...`);
    await app.listen(port);
    console.log(`🚀 Nest application successfully started on port ${port}`);
    console.log(`📚 Swagger documentation available at http://localhost:${port}/api`);
  } catch (error) {
    console.error('❌ Error starting Nest application:', error);
    process.exit(1);
  }
}
bootstrap();
