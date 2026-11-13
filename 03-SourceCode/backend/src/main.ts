import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { BusinessErrorFilter } from './shared/http/business-error.filter';
import { SqlErrorFilter } from './shared/http/sql-error.filter';
import type {Request,Response,NextFunction} from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  if(config.get('TRUST_PROXY_LOOPBACK')==='true')app.getHttpAdapter().getInstance().set('trust proxy','loopback');
  if(config.get('ENFORCE_HTTPS')==='true')app.use((req:Request,res:Response,next:NextFunction)=>{
    if(!req.secure){res.status(426).json({statusCode:426,message:'Yêu cầu kết nối HTTPS.'});return;}next();
  });
  app.use(helmet()); app.setGlobalPrefix('api');
  app.enableCors({origin: config.get<string>('FRONTEND_ORIGIN', 'http://localhost:3000')});
  app.useGlobalPipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true, transform: true}));
  app.useGlobalFilters(new BusinessErrorFilter(),new SqlErrorFilter()); app.enableShutdownHooks();
  const document = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Tuyển sinh Sau Đại học và Bàn giao Đào tạo').setVersion('1.0').addBearerAuth().build());
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(config.get<number>('PORT', 3001),config.get<string>('HOST','127.0.0.1'));
}
bootstrap().catch(error => { console.error(error); process.exitCode = 1; });
