const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn,spawnSync}=require('node:child_process'),sql=require('mssql/msnodesqlv8');
const backend=path.resolve(__dirname,'..');process.loadEnvFile(path.join(backend,'.env'));
const name='QLCTDT_Test_'+crypto.randomBytes(6).toString('hex'),password='Load@'+crypto.randomBytes(12).toString('hex'),base='http://127.0.0.1:3102/api';
let master,pool,server,created=false,token;const logs=[];
async function call(route,body,expected=200,actor=token){const response=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{...(actor?{Authorization:'Bearer '+actor}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});const result=await response.json();if(response.status!==expected)throw Error(route+': '+JSON.stringify(result));return result;}
async function main(){
 // Refuse to test against an existing service on this port.
 const net=require('node:net');await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(3102,'127.0.0.1',()=>probe.close(resolve));});
 const connection=process.env.SQLSERVER_CONNECTION_STRING;if(!connection||!/Database=[^;]+/i.test(connection))throw Error('Missing local SQL connection');
 master=await new sql.ConnectionPool({server:'localhost',connectionString:connection.replace(/Database=[^;]+/i,'Database=master'),requestTimeout:60000}).connect();
 if(!/^QLCTDT_Test_[a-f0-9]{12}$/.test(name))throw Error('Invalid test database');await master.request().query(`CREATE DATABASE [${name}] COLLATE Vietnamese_100_CI_AS`);created=true;
 pool=await new sql.ConnectionPool({server:'localhost',connectionString:connection.replace(/Database=[^;]+/i,'Database='+name),requestTimeout:60000}).connect();await require('./core-database.cjs').apply(pool,true);
 server=spawn(process.execPath,['dist/main.js'],{cwd:backend,windowsHide:true,env:{...process.env,NODE_ENV:'test',HOST:'127.0.0.1',PORT:'3102',FRONTEND_ORIGIN:'http://localhost:3000',ENFORCE_HTTPS:'false',TRUST_PROXY_LOOPBACK:'false',ADMISSION_JOBS_AUTO:'false',SQLSERVER_CONNECTION_STRING:connection.replace(/Database=[^;]+/i,'Database='+name),DEV_LOGIN_ENABLED:'true',PASSWORD_LOGIN_ENABLED:'true',DEV_CAN_BO_ID:'1',DEV_ADMIN_USERNAME:'demo.test.admin',DEV_ADMIN_PASSWORD:password},stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',b=>{logs.push(String(b));if(logs.length>20)logs.shift();});server.stderr.on('data',b=>{logs.push(String(b));if(logs.length>20)logs.shift();});
 let ready=false;for(let i=0;i<120;i++){try{if((await fetch(base+'/docs-json')).ok){ready=true;break;}}catch{}if(server.exitCode!==null)break;await new Promise(r=>setTimeout(r,500));}if(!ready)throw Error('Load-test server not ready');
 token=(await call('/auth/login',{username:'demo.test.admin',password},201,'')).accessToken;
 const report=await require('./load-checks.cjs')({pool,call,base,password});console.log('PASS '+report.virtualUsers+' users; see 05_Testing/Tai_50_NguoiDung.json');
}
main().catch(error=>{console.error(error.message);console.error(logs.slice(-3).join(''));process.exitCode=1;}).finally(async()=>{
 if(server?.pid&&server.exitCode===null)spawnSync('taskkill',['/PID',String(server.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
 await pool?.close();if(created&&/^QLCTDT_Test_[a-f0-9]{12}$/.test(name))await master.request().query(`ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;DROP DATABASE [${name}]`);await master?.close();
});
