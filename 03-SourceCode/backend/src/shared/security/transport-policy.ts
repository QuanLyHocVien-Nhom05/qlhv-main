import type {Request,Response,NextFunction} from 'express';
export function isLoopback(address:string|undefined){return !!address&&(/^(?:127\.\d{1,3}\.\d{1,3}\.\d{1,3}|::ffff:127\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.test(address)||address==='::1');}
export function transportSettings(input:{environment:string;host:string;origin:string;enforceHttps:boolean;trustLoopback:boolean}){
 const development=['development','test'].includes(input.environment);
 let origin:URL;try{origin=new URL(input.origin);}catch{throw Error('FRONTEND_ORIGIN phải là địa chỉ hợp lệ.');}
 const localOrigin=['localhost','127.0.0.1','[::1]'].includes(origin.hostname);
 if(origin.username||origin.password||origin.search||origin.hash||origin.pathname!=='/'||!(origin.protocol==='https:'||(development&&localOrigin&&origin.protocol==='http:')))throw Error('FRONTEND_ORIGIN phải dùng HTTPS khi triển khai qua mạng; HTTP chỉ dùng cho localhost trong development/test.');
 if(input.trustLoopback&&!['localhost','127.0.0.1','::1'].includes(input.host))throw Error('Khi tin cậy proxy loopback, backend phải bind localhost/127.0.0.1/::1.');
 return {...input,origin:origin.origin,allowLocalHttp:development&&!input.enforceHttps};
}
type TransportRequest={secure:boolean;socket:{remoteAddress?:string;encrypted?:boolean};headers:Record<string,string|string[]|undefined>};
export function transportAllowed(req:TransportRequest,settings:ReturnType<typeof transportSettings>){
 if(req.socket.encrypted)return true;
 // Forwarded headers count as transport evidence only from the explicitly trusted local proxy.
 if(settings.trustLoopback&&isLoopback(req.socket.remoteAddress)&&req.secure)return true;
 if(!settings.allowLocalHttp||!isLoopback(req.socket.remoteAddress))return false;
 const host=req.headers.host;if(typeof host!=='string')return false;
 let hostname:string;try{hostname=new URL('http://'+host).hostname;}catch{return false;}
 const forwarded=Object.keys(req.headers).some(key=>key.toLowerCase()==='forwarded'||key.toLowerCase().startsWith('x-forwarded-'));
 return !forwarded&&['localhost','127.0.0.1','[::1]'].includes(hostname);
}
export function transportMiddleware(settings:ReturnType<typeof transportSettings>){return(req:Request,res:Response,next:NextFunction)=>{
 if(transportAllowed(req,settings)){next();return;}
 res.setHeader('Cache-Control','no-store');res.status(426).json({statusCode:426,message:'Yêu cầu kết nối HTTPS. HTTP chỉ được phép tại localhost trong môi trường phát triển/kiểm thử.'});
};}
