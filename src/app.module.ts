import { Module } from '@nestjs/common';
import { MainModule } from '@ylide/backend-scripts';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as configuration from './config';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [MainModule, ConfigModule.forRoot({
		isGlobal: true,
		load: [configuration.configuration],
		validationSchema: configuration.validationSchema,
		validationOptions: configuration.validationOptions,
	}),],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
