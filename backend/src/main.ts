import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { GlobalExceptionsFilter } from './common/filters/http-exception.filter';
import { validateEnvironment } from './config/env.validation';

async function bootstrap() {
  // Validate secrets and configuration
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  // Helmet Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI inline assets
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Production-grade CORS policy
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow mobile apps, curl, or same-origin (no Origin header) or configured origins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Global Error Masking Filter
  app.useGlobalFilters(new GlobalExceptionsFilter());

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Autonomous College Attendance Management API')
    .setDescription(
      'REST & WebSocket API with Dynamic QR verification, GPS geofencing (75m), ECDSA device challenge signing, and Server-Side Risk Scoring.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 College Attendance Backend API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
