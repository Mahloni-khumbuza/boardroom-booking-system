import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const isDev = configService.get<string>('NODE_ENV', 'development') !== 'production';
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:4200');
  const allowedOrigins = corsOrigin.split(',').map((o) => o.trim());
  const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (isDev && localhostPattern.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length'],
    maxAge: 0,
  });

  const config = new DocumentBuilder()
    .setTitle('Boardroom Booking System API')
    .setDescription('API documentation for the Boardroom Booking System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(configService.get<string>('PORT', '3000'));
  await app.listen(port);

  Logger.log(`Application running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
