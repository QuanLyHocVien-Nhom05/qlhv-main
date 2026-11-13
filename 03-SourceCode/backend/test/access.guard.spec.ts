import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccessGuard } from '../src/shared/security/access.guard';

const secret = 'test-only-secret-with-at-least-32-characters';
const jwt = new JwtService();
const guard = new AccessGuard(jwt, new ConfigService({JWT_SECRET: secret,JWT_ISSUER:'identity',JWT_AUDIENCE:'api'}),new Reflector());
function context(token?: string, role = 'CURRICULUM_APPROVER') {
  const handler = () => undefined; Reflect.defineMetadata('roles',[role],handler);
  const request = {headers: token ? {authorization:`Bearer ${token}`} : {}};
  return {switchToHttp:()=>({getRequest:()=>request}),getHandler:()=>handler,getClass:()=>class TestController {}} as unknown as ExecutionContext;
}
function sign(roles: string[], options: Record<string, unknown> = {}) {
  return jwt.sign({sub:'user-1',roles},{secret,issuer:'identity',audience:'api',expiresIn:60,...options});
}
describe('Access guard', () => {
  it('accepts a signed token only for the permitted role', async () => {
    await expect(guard.canActivate(context(sign(['CURRICULUM_APPROVER'])))).resolves.toBe(true);
    await expect(guard.canActivate(context(sign(['CURRICULUM_VIEWER'])))).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('rejects missing, forged, expired and wrong-audience tokens', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(context(sign(['CURRICULUM_APPROVER'],{secret:'forged-key'})))).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(context(sign(['CURRICULUM_APPROVER'],{expiresIn:-1})))).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(context(sign(['CURRICULUM_APPROVER'],{audience:'other-app'})))).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('requires token expiration', async () => {
    const token = jwt.sign({sub:'user-1',roles:['CURRICULUM_APPROVER']},{secret,issuer:'identity',audience:'api'});
    await expect(guard.canActivate(context(token))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
