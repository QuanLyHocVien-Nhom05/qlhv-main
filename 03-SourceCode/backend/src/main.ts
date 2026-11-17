import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { BusinessErrorFilter } from './shared/http/business-error.filter';
import { SqlErrorFilter } from './shared/http/sql-error.filter';
import {transportMiddleware,transportSettings} from './shared/security/transport-policy';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const transport=transportSettings({environment:config.get<string>('NODE_ENV','development'),host:config.get<string>('HOST','127.0.0.1'),origin:config.get<string>('FRONTEND_ORIGIN','http://localhost:3000'),enforceHttps:config.get('ENFORCE_HTTPS')==='true',trustLoopback:config.get('TRUST_PROXY_LOOPBACK')==='true'});
  if(transport.trustLoopback)app.getHttpAdapter().getInstance().set('trust proxy','loopback');
  app.use(helmet());app.use(transportMiddleware(transport));app.setGlobalPrefix('api');
  app.enableCors({origin:transport.origin});
  app.useGlobalPipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true, transform: true}));
  app.useGlobalFilters(new BusinessErrorFilter(),new SqlErrorFilter()); app.enableShutdownHooks();
  const document = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Tuyển sinh Sau Đại học và Bàn giao Đào tạo').setVersion('1.0').addBearerAuth().build());
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(config.get<number>('PORT', 3001),config.get<string>('HOST','127.0.0.1'));
}
bootstrap().catch(error => { console.error(error); process.exitCode = 1; });
