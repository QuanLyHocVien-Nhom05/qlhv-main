import {sessionRole,staffRoles} from './roles';
import { CanActivate, ExecutionContext, Injectable, Optional, SetMetadata, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { SqlServerService } from '../infrastructure/sql-server.service';
export type ActorRequest = Request & { actor: {sub: string; roles: string[]} };
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService, private readonly reflector: Reflector,@Optional() private readonly db?:SqlServerService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<ActorRequest>();
    const token = request.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) throw new UnauthorizedException('Cần đăng nhập.');
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'), algorithms: ['HS256'],
        issuer: this.config.getOrThrow<string>('JWT_ISSUER'), audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
      });
      if (typeof payload.sub !== 'string' || !payload.sub || !Number.isFinite(payload.exp) || !Array.isArray(payload.roles)
          || !payload.roles.every((r: unknown) => typeof r === 'string')) throw new Error('Invalid claims');
      const localEnabled=this.config.get('DEV_LOGIN_ENABLED')==='true'&&this.config.get('NODE_ENV')!=='production';
      if(payload.authSource==='local'&&!localEnabled)throw new Error('Local account disabled');
      if(payload.authSource==='password'&&this.config.get('PASSWORD_LOGIN_ENABLED','true')!=='true')throw new Error('Password login disabled');
      if(this.db) {
        const result=await this.db.query<{PhienBanMatKhau:number;DangHoatDong:boolean;DaXoa?:boolean;CanBoHoatDong:boolean|null;VaiTro:'ADMIN'|'USER'}>(
          `SELECT t.PhienBanMatKhau,t.DangHoatDong,t.DaXoa,t.VaiTro,c.DangHoatDong AS CanBoHoatDong FROM he_thong.TaiKhoanDangNhap t LEFT JOIN nhan_su.CanBo c ON c.MaNguoi=t.MaNguoi WHERE t.MaNguoi=TRY_CONVERT(bigint,@Nguoi)`,{Nguoi:payload.sub});
        const account=result.recordset[0];
        if(account) {
          const source=account.VaiTro==='ADMIN'?'local':'password';const role=sessionRole(account.VaiTro);
          if(payload.authSource!==source||payload.roles.length!==1||payload.roles[0]!==role||!Number.isInteger(payload.credentialVersion)||payload.credentialVersion!==account.PhienBanMatKhau||!role||!account.DangHoatDong||account.DaXoa||(!['STUDENT','APPLICANT'].includes(role)&&!account.CanBoHoatDong)||(account.VaiTro==='ADMIN'&&(!localEnabled||!account.CanBoHoatDong)))throw new Error('Account permission changed or password expired');
        }
        if(['local','password'].includes(payload.authSource)&&!account)throw new Error('Account missing');
      } else if(['local','password'].includes(payload.authSource))throw new Error('Session validation unavailable');
      request.actor = {sub: payload.sub, roles: payload.roles};
    } catch { throw new UnauthorizedException('Token không hợp lệ hoặc hết hạn.'); }
    const allowed = this.reflector.getAllAndOverride<string[]>('roles', [context.getHandler(), context.getClass()]) ?? [];
    if (allowed.length && !allowed.some(role => request.actor.roles.includes(role))) throw new ForbiddenException('Không có quyền thực hiện.');
    return true;
  }
}
