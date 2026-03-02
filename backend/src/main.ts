import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use((req: { method: string; url: string }, _res: unknown, next: () => void) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
  });

  await app.listen(3000, '0.0.0.0');
  console.log('Travel Agent API running on http://0.0.0.0:3000');
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
