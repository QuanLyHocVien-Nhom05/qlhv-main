import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const parameters = {N:65536,r:8,p:2,maxmem:128*1024*1024};
function derive(password:string,salt:Buffer):Promise<Buffer> {
  return new Promise((resolve,reject)=>scrypt(password,salt,64,parameters,(error,key)=>error?reject(error):resolve(key)));
}
export async function hashPassword(password:string):Promise<string> {
  const salt=randomBytes(16);
  const key=await derive(password,salt);
  return `scrypt$65536$8$2$${salt.toString('hex')}$${key.toString('hex')}`;
}
export async function verifyPassword(password:string,stored:string):Promise<boolean> {
  const match=/^scrypt\$65536\$8\$2\$([0-9a-f]{32})\$([0-9a-f]{128})$/.exec(stored);
  if(!match)return false;
  const candidate=await derive(password,Buffer.from(match[1],'hex'));
  return timingSafeEqual(candidate,Buffer.from(match[2],'hex'));
}
