export function sqlRequestTimeout(value?:string):number{
 const timeout=value===undefined?30000:Number(value);
 if(!Number.isInteger(timeout)||timeout<1000||timeout>120000)throw new Error('SQLSERVER_REQUEST_TIMEOUT_MS must be an integer between 1000 and 120000.');
 return timeout;
}
