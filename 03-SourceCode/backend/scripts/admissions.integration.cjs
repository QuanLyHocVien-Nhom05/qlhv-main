const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn,spawnSync}=require('node:child_process'),sql=require('mssql/msnodesqlv8');
const backend=path.resolve(__dirname,'..'),root=path.resolve(backend,'../..');process.loadEnvFile(path.join(backend,'.env'));
const name='QLCTDT_Test_'+crypto.randomBytes(6).toString('hex'),connection=process.env.SQLSERVER_CONNECTION_STRING;
const masterConnection=connection.replace(/Database=[^;]+/i,'Database=master'),testConnection=connection.replace(/Database=[^;]+/i,'Database='+name);
const base='http://127.0.0.1:3101/api',password='Test@'+crypto.randomBytes(12).toString('hex');let master,pool,server,web,browser,created=false,token,smtp,count=0;const logs=[];
const ok=text=>{count++;console.log('PASS '+text);};
function stop(child){if(child&&child.exitCode===null)spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});}
async function ready(url,child){for(let i=0;i<120;i++){try{if((await fetch(url)).ok)return;}catch{}if(child.exitCode!==null)throw Error('Server exited');await new Promise(r=>setTimeout(r,500));}throw Error('Server not ready');}
async function call(route,body,expected=200,actor=token,method=body===undefined?'GET':'POST'){const response=await fetch(base+route,{method,headers:{...(actor?{Authorization:'Bearer '+actor}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});const data=await response.json();assert.equal(response.status,expected,route+': '+JSON.stringify(data));return data;}
const create=(key,values)=>call('/management/'+key,{values},201);
const action=(key,id,name,values)=>call(`/management/${key}/${id}/actions/${name}`,{values},201);
const row=async(key,field,value)=>{const result=await call('/management/'+key+'?limit=100');const found=result.data.find(r=>String(r[field])===String(value));assert.ok(found,'Missing '+key+' '+value);return found;};
async function main(){
 assert.match(name,/^QLCTDT_Test_[a-f0-9]{12}$/);master=await new sql.ConnectionPool({server:'localhost',connectionString:masterConnection,requestTimeout:60000}).connect();await master.request().query(`CREATE DATABASE [${name}] COLLATE Vietnamese_100_CI_AS`);created=true;pool=await new sql.ConnectionPool({server:'localhost',connectionString:testConnection,requestTimeout:60000}).connect();await require('./core-database.cjs').apply(pool,true);await require('./core-database.cjs').apply(pool,false);
 smtp=await require('./smtp-test-server.cjs').start();
 server=spawn(process.execPath,['dist/main.js'],{cwd:backend,windowsHide:true,env:{...process.env,...smtp.env,SQLSERVER_CONNECTION_STRING:testConnection,DEV_CAN_BO_ID:'1',DEV_ADMIN_USERNAME:'demo.test.admin',DEV_ADMIN_PASSWORD:password,DEV_LOGIN_ENABLED:'true',PASSWORD_LOGIN_ENABLED:'true',NODE_ENV:'test',ADMISSION_JOBS_AUTO:'false',PORT:'3101',HOST:'127.0.0.1',FRONTEND_ORIGIN:'http://localhost:3100'},stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>logs.push(String(d)));server.stderr.on('data',d=>logs.push(String(d)));await ready(base+'/docs-json',server);
 await call('/management/overview',undefined,401,'');token=(await call('/auth/login',{username:'demo.test.admin',password},201,'')).accessToken;

 const major=(await call('/management/options/majors'))[0],unit=(await call('/management/options/units'))[0];
 await create('courses',{KyHieu:'TEST_COURSE',TenHocPhan:'Test course'});const course=await row('courses','KyHieu','TEST_COURSE');
 let program=await call('/programs',{KyHieu:'TEST_PROGRAM',TenChuongTrinh:'Test admissions destination',MaNganh:Number(major.Id),TrinhDo:'THAC_SI',PhienBan:{KhoaTuyenSinh:'2026',TinChiToiThieu:3,DiemDatHocPhan:5,DiemTrungBinhToiThieu:5,ThoiGianToiDaThang:36,HocPhan:[{MaHocPhan:Number(course.MaHocPhan),SoTinChi:3,HocKyDuKien:1,BatBuoc:true,TienQuyet:[]}]}},201);
 const version=Number(program.PhienBan[0].MaPhienBan);await call('/programs/'+program.MaChuongTrinh+'/versions/'+version+'/approve',{Revision:program.PhienBan[0].Revision},201);
 for(const [username,role]of [['qa.student','USER'],['qa.reviewer','GIANG_VIEN']])await call('/admin/accounts',{TenDangNhap:username,HoTen:username,ThuDienTu:username+'@example.invalid',VaiTro:role,MatKhau:password,XacNhanMatKhau:password,...(role==='GIANG_VIEN'?{MaDonVi:Number(unit.Id),HocVi:'TIEN_SI'}:{})},201);
 web=require('./frontend-test-server.cjs').start(base);web.stdout.on('data',d=>logs.push(String(d)));web.stderr.on('data',d=>logs.push(String(d)));await ready('http://localhost:3100',web);browser=await require('@playwright/test').chromium.launch({channel:'chrome',headless:true});
 await require('./admissions-checks.cjs')({call,pool,browser,password,version,token,base,ok});console.log('ALL ADMISSIONS CHECKS PASSED');
}
main().catch(error=>{console.error(error.stack);console.error(logs.slice(-5).join(''));process.exitCode=1;}).finally(async()=>{await browser?.close();await smtp?.close();stop(web);stop(server);await pool?.close();if(created&&/^QLCTDT_Test_[a-f0-9]{12}$/.test(name))await master.request().query(`ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;DROP DATABASE [${name}]`);await master?.close();});
