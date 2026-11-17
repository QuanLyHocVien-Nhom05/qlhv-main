const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn,spawnSync}=require('node:child_process'),sql=require('mssql/msnodesqlv8');
const backend=path.resolve(__dirname,'..');process.loadEnvFile(path.join(backend,'.env'));
const name='QLCTDT_Test_'+crypto.randomBytes(6).toString('hex'),password='Session@'+crypto.randomBytes(12).toString('hex'),base='http://127.0.0.1:3101/api';
let master,pool,server,web,browser,created=false,token;const logs=[];
async function call(route,body,expected=200,actor=token,method=body===undefined?'GET':'POST'){const response=await fetch(base+route,{method,headers:{...(actor?{Authorization:'Bearer '+actor}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});const result=await response.json();assert.equal(response.status,expected,route+': '+JSON.stringify(result));return result;}
async function ready(url,child){for(let i=0;i<150;i++){try{if((await fetch(url)).ok)return;}catch{}if(child.exitCode!==null)break;await new Promise(r=>setTimeout(r,400));}throw Error('Test service unavailable: '+url);}
function stop(child){if(child?.pid&&child.exitCode===null)spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});}
function log(child){for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{logs.push(String(b));if(logs.length>12)logs.shift();});}
(async()=>{
 for(const port of [3100,3101])await new Promise((resolve,reject)=>{const probe=require('node:net').createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
 const connection=process.env.SQLSERVER_CONNECTION_STRING;assert.match(connection,/Database=[^;]+/i);assert.match(name,/^QLCTDT_Test_[a-f0-9]{12}$/);
 master=await new sql.ConnectionPool({server:'localhost',connectionString:connection.replace(/Database=[^;]+/i,'Database=master'),requestTimeout:60000}).connect();await master.request().query(`CREATE DATABASE [${name}] COLLATE Vietnamese_100_CI_AS`);created=true;
 const testConnection=connection.replace(/Database=[^;]+/i,'Database='+name);pool=await new sql.ConnectionPool({server:'localhost',connectionString:testConnection,requestTimeout:60000}).connect();await require('./core-database.cjs').apply(pool,true);
 const staff=(await pool.request().query('SELECT TOP(1) MaCanBo FROM nhan_su.CanBo ORDER BY MaCanBo')).recordset[0].MaCanBo;
 server=spawn(process.execPath,['dist/main.js'],{cwd:backend,windowsHide:true,env:{...process.env,SQLSERVER_CONNECTION_STRING:testConnection,NODE_ENV:'test',HOST:'127.0.0.1',PORT:'3101',FRONTEND_ORIGIN:'http://localhost:3100',ENFORCE_HTTPS:'false',TRUST_PROXY_LOOPBACK:'false',ADMISSION_JOBS_AUTO:'false',DEV_LOGIN_ENABLED:'true',PASSWORD_LOGIN_ENABLED:'true',DEV_ADMIN_USERNAME:'session.root',DEV_ADMIN_PASSWORD:password,DEV_CAN_BO_ID:String(staff)},stdio:['ignore','pipe','pipe']});log(server);await ready(base+'/docs-json',server);
 token=(await call('/auth/login',{username:'session.root',password},201,'')).accessToken;
 web=require('./frontend-test-server.cjs').start(base);log(web);await ready('http://localhost:3100',web);
 browser=await require('@playwright/test').chromium.launch({channel:'chrome',headless:true});
 await require('./session-checks.cjs')({pool,call,browser,password,base,ok:text=>console.log('PASS '+text)});
})().catch(error=>{console.error(error.stack);console.error(logs.slice(-4).join(''));process.exitCode=1;}).finally(async()=>{await browser?.close();stop(web);stop(server);await pool?.close();if(created&&/^QLCTDT_Test_[a-f0-9]{12}$/.test(name))await master.request().query(`ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;DROP DATABASE [${name}]`);await master?.close();});
