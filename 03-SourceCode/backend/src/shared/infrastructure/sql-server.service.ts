import { BadRequestException,Global, Injectable, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql/msnodesqlv8';
import { sqlRequestTimeout } from './sql-timeout';

@Injectable()
export class SqlServerService implements OnModuleInit, OnModuleDestroy {
  private pool!: sql.ConnectionPool;
  constructor(private readonly config: ConfigService) {}
  async onModuleInit() {
    const configuration: sql.config & {connectionString:string} = {
      server: 'localhost',
      connectionString: this.config.getOrThrow<string>('SQLSERVER_CONNECTION_STRING'),
      pool: {min: 0, max: 10, idleTimeoutMillis: 30000}, requestTimeout: sqlRequestTimeout(this.config.get<string>('SQLSERVER_REQUEST_TIMEOUT_MS')),
    };
    this.pool = await new sql.ConnectionPool(configuration).connect();
    this.pool.on('error', error => console.error('SQL Server pool:', error.message));
  }
  request() { return this.pool.request(); }
  async resolveStaff(subject:string) {
    if(!/^[1-9]\d{0,14}$/.test(subject))throw new BadRequestException('Danh tính chưa liên kết cán bộ trong dữ liệu đào tạo.');
    const result=await this.query<{MaNguoi:number;MaCanBo:number}>('SELECT MaNguoi,MaCanBo FROM nhan_su.CanBo WHERE MaNguoi=@Nguoi AND DangHoatDong=1',{Nguoi:subject});
    if(!result.recordset[0])throw new BadRequestException('Tài khoản chưa liên kết với cán bộ đang hoạt động.');
    return result.recordset[0];
  }
  async query<T = Record<string, unknown>>(statement: string, values: Record<string, unknown> = {}) {
    const request = this.request();
    for (const [name, value] of Object.entries(values)) {
      if (typeof value === 'number') request.input(name, sql.Decimal(19, 4), value);
      else if (typeof value === 'boolean') request.input(name, sql.Bit, value);
      else request.input(name, sql.NVarChar(sql.MAX), value === undefined ? null : value);
    }
    return request.query<T>(`SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON; SET ARITHABORT ON; SET CONCAT_NULL_YIELDS_NULL ON; SET NUMERIC_ROUNDABORT OFF; ${statement}`);
  }
  async onModuleDestroy() { await this.pool?.close(); }
}
@Global() @Module({providers: [SqlServerService], exports: [SqlServerService]})
export class SqlServerModule {}
