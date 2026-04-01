import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl || frontendUrl === '*') {
    console.warn(
      '⚠️  FRONTEND_URL is not set or is wildcard — CORS will be restrictive. Set FRONTEND_URL in production.',
    );
  }
  app.enableCors({
    origin: frontendUrl && frontendUrl !== '*' ? frontendUrl.split(',') : false,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Jus Africa API')
    .setDescription('API de la plateforme de droit africain francophone')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Jus Africa API running on port ${port}`);
}
bootstrap();
