const path=require('node:path');process.loadEnvFile(path.join(__dirname,'../.env'));
const {ConfigService}=require('@nestjs/config'),{RecoveryMailer}=require('../dist/modules/password-recovery/infrastructure/recovery-mailer');
new RecoveryMailer(new ConfigService()).verify().then(()=>console.log('SMTP: connected and authenticated. No email was sent.')).catch(()=>{console.error('SMTP unavailable: check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM and PASSWORD_RESET_ORIGIN in backend/.env. No email was sent.');process.exitCode=1;});
