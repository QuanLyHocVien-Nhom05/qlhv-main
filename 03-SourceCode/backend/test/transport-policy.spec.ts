import {describe,it,expect} from 'vitest';
import {transportAllowed,transportSettings} from '../src/shared/security/transport-policy';
const local={environment:'development',host:'127.0.0.1',origin:'http://localhost:3000',enforceHttps:false,trustLoopback:false};
const request=(remoteAddress='127.0.0.1',host='localhost:3001',headers:Record<string,string>={},secure=false)=>({secure,socket:{remoteAddress},headers:{host,...headers}});
describe('Transport policy for the course project',()=>{
 it('allows local development HTTP using IPv4/IPv6 but refuses LAN and remote requests',()=>{
  const policy=transportSettings(local);expect(transportAllowed(request(),policy)).toBe(true);expect(transportAllowed(request('::1','[::1]:3001'),policy)).toBe(true);
  for(const address of ['192.168.1.10','203.0.113.1',undefined])expect(transportAllowed({...request(),socket:{remoteAddress:address}},policy)).toBe(false);
 });
 it('does not trust spoofed forwarded protocol, forwarded client address or a foreign Host',()=>{
  const policy=transportSettings(local);
  for(const headers of [{'x-forwarded-proto':'https'},{'x-forwarded-for':'127.0.0.1'},{forwarded:'proto=https;for=127.0.0.1'}])expect(transportAllowed(request('127.0.0.1','localhost',headers,true),policy)).toBe(false);
  expect(transportAllowed(request('127.0.0.1','portal.example'),policy)).toBe(false);
 });
 it('requires HTTPS in production even when ENFORCE_HTTPS is false',()=>{
  const policy=transportSettings({...local,environment:'production',origin:'https://portal.example'});
  expect(transportAllowed(request(),policy)).toBe(false);expect(transportAllowed({...request(),socket:{remoteAddress:'203.0.113.1',encrypted:true}},policy)).toBe(true);
  expect(transportAllowed(request(),transportSettings({...local,enforceHttps:true}))).toBe(false);
 });
 it('accepts a secure request only from an explicitly trusted loopback proxy',()=>{
  const policy=transportSettings({...local,environment:'production',origin:'https://portal.example',trustLoopback:true});
  expect(transportAllowed(request('127.0.0.1','portal.example',{'x-forwarded-proto':'https'},true),policy)).toBe(true);
  expect(transportAllowed(request('203.0.113.1','portal.example',{'x-forwarded-proto':'https'},true),policy)).toBe(false);
  expect(transportAllowed(request('127.0.0.1','portal.example',{'x-forwarded-proto':'http'}),policy)).toBe(false);
 });
 it('rejects insecure public origins and publicly bound trusted proxies at startup',()=>{
  for(const input of [{...local,origin:'http://192.168.1.2:3000'},{...local,environment:'production'},{...local,host:'0.0.0.0',trustLoopback:true},{...local,origin:'https://user:password@portal.example'}])expect(()=>transportSettings(input)).toThrow();
 });
});
