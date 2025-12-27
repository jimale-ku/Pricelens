import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './config.schema';

export type AppConfigService = ConfigService<EnvConfig, true>;






