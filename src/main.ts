import '@ylide/backend-scripts';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MainModule } from '@ylide/backend-scripts';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const mainModule = app.get(MainModule);

	await mainModule.setupApp(app);

	const service = app.get(AppService);
	const config = app.get(ConfigService);

	await service.init();

	await app.listen(config.get<number>('port'));
}
bootstrap();
