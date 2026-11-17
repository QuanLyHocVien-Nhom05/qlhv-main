import type {ConfigService} from '@nestjs/config';
export function demoPaymentsEnabled(config:Pick<ConfigService,'get'>){
 return config.get('DEMO_PAYMENTS_ENABLED')==='true'&&['development','test'].includes(config.get<string>('NODE_ENV','development'));
}
