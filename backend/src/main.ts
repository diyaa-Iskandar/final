import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // تفعيل CORS للسماح للفرونت إند بالاتصال من أي مكان
  app.enableCors({
    origin: true, // السماح لأي origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // الاستماع على 0.0.0.0 ضروري جداً داخل Docker
  // المنفذ 3000 هو المنفذ الداخلي للحاوية
  await app.listen(3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();