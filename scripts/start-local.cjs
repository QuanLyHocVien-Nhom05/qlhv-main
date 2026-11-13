const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn,spawnSync}=require('node:child_process');
const {createRequire}=require('node:module');
const {parseEnv}=require('node:util');
const project=path.resolve(__dirname,'..'),source=path.join(project,'03-SourceCode'),backend=path.join(source,'backend'),frontend=path.join(source,'frontend');
const backendEnv=path.join(backend,'.env'),frontendEnv=path.join(frontend,'.env.local');
const sourceRequire=createRequire(path.join(source,'package.json'));
const databaseName='QuanLyChuongTrinhDaoTao';
function nodeSupported(version){const [major,minor]=version.split('.').map(Number);return major>22||major===22&&minor>=16;}
function setValue(content,key,value){if(!/^[A-Z][A-Z0-9_]*$/.test(key)||/[\r\n']/.test(value))throw Error('Giá trị cấu hình không hợp lệ.');const line=`${key}='${value}'`,pattern=new RegExp('^'+key+'=.*$','m');return pattern.test(content)?content.replace(pattern,()=>line):content+'\n'+line+'\n';}
function createEnvironment(template,server='localhost'){
 if(!/^[A-Za-z0-9_.\\()-]{1,120}$/.test(server))throw Error('Tên SQL Server không hợp lệ.');
 const values={SQLSERVER_CONNECTION_STRING:`Driver={ODBC Driver 18 for SQL Server};Server=${server};Database=${databaseName};Trusted_Connection=yes;TrustServerCertificate=yes;`,JWT_SECRET:crypto.randomBytes(32).toString('hex'),DATA_ENCRYPTION_KEY:crypto.randomBytes(32).toString('hex'),DEV_ADMIN_PASSWORD:crypto.randomBytes(15).toString('base64url')};
 let content=template;for(const [key,value]of Object.entries(values))content=setValue(content,key,value);return content;
}
function masterConnection(connection){
 const match=connection?.match(/\bDatabase\s*=\s*([^;]+)/i);
 if(!match||match[1].trim()!==databaseName)throw Error(`Chạy nhanh chỉ áp dụng cho database ${databaseName}. Xem HUONG_DAN_CHAY.md nếu dùng cấu hình khác.`);
 return connection.replace(/\bDatabase\s*=\s*[^;]+/i,'Database=master');
}
function localSettings(config){
 if(config.NODE_ENV!==undefined&&config.NODE_ENV!=='development'||config.DEV_LOGIN_ENABLED!=='true')throw Error('Chạy nhanh cần NODE_ENV=development và DEV_LOGIN_ENABLED=true trong backend/.env.');
 if(Number(config.PORT)!==3001||config.FRONTEND_ORIGIN!=='http://localhost:3000'||!['127.0.0.1','localhost'].includes(config.HOST))throw Error('Chạy nhanh dùng localhost:3000/3001. Xem hướng dẫn đầy đủ nếu đang dùng cổng hoặc máy chủ khác.');
 if(!config.JWT_SECRET||config.JWT_SECRET.length<32||config.JWT_SECRET.startsWith('replace-with-'))throw Error('JWT_SECRET chưa được cấu hình. Giữ khóa hiện có hoặc điền khóa riêng theo HUONG_DAN_CHAY.md.');
 if(!/^[a-f0-9]{64}$/i.test(config.DATA_ENCRYPTION_KEY??''))throw Error('Thiếu khóa AES hợp lệ. Không đổi khóa nếu database đã có dữ liệu mã hóa.');
 masterConnection(config.SQLSERVER_CONNECTION_STRING);
}
function pickServer(services){
 if(services.includes('MSSQLSERVER'))return 'localhost';
 if(services.includes('MSSQL$SQLEXPRESS'))return 'localhost\\SQLEXPRESS';
 const named=services.filter(s=>/^MSSQL\$[A-Za-z0-9_]+$/.test(s));
 if(named.length===1)return 'localhost\\'+named[0].slice(6);
 throw Error('Chưa tìm được một SQL Server đang chạy. Cài/bật SQL Server; hoặc tạo backend/.env từ .env.example và điền đúng instance.');
}
function windowsPrerequisites(needsServer){
 const check=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop';$d=@(Get-OdbcDriver -Name 'ODBC Driver 18 for SQL Server' -Platform '64-bit' -ErrorAction SilentlyContinue);$s=@(Get-Service | Where-Object {$_.Status -eq 'Running' -and ($_.Name -eq 'MSSQLSERVER' -or $_.Name -like 'MSSQL$*')} | Select-Object -ExpandProperty Name);[pscustomobject]@{Driver=($d.Count -gt 0);Services=$s}|ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true});
 if(check.error||check.status!==0)throw Error('Không kiểm tra được ODBC/SQL Server. Chạy terminal Windows thông thường hoặc xem HUONG_DAN_CHAY.md.');
 const result=JSON.parse(check.stdout.trim());
 if(!result.Driver)throw Error('Cần cài Microsoft ODBC Driver 18 for SQL Server (x64). Xem HUONG_DAN_CHAY.md.');
 return needsServer?pickServer(Array.isArray(result.Services)?result.Services:[result.Services].filter(Boolean)):null;
}
function childEnvironment(config={}){const env={...process.env,...config};for(const key of Object.keys(env))if(key.toLowerCase()==='path')delete env[key];return {...env,Path:path.dirname(process.execPath)+path.delimiter+(process.env.Path??process.env.PATH??'')};}
function npmCli(){const candidate=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');if(!fs.existsSync(candidate))throw Error('Không tìm thấy npm đi kèm Node.js. Cài bản Node.js có npm theo hướng dẫn.');return candidate;}
async function run(command,args,options={}){
 return new Promise((resolve,reject)=>{const child=spawn(command,args,{cwd:source,stdio:'inherit',windowsHide:true,...options});child.on('error',reject);child.on('exit',(code,signal)=>code===0?resolve():reject(Error(`Lệnh chưa hoàn tất (${signal??code}). Xem thông báo phía trên.`)));});
}
async function ensureDependencies(){
 const required=['next/dist/bin/next','@nestjs/cli/bin/nest.js','mssql/msnodesqlv8'];
 const marker=path.join(project,'.tools/launcher-install.local.json');
 const fingerprint=crypto.createHash('sha256').update(fs.readFileSync(path.join(source,'package-lock.json'))).update(fs.readFileSync(path.join(source,'package.json'))).digest('hex');
 const installed=required.every(name=>{try{sourceRequire.resolve(name);return true;}catch{return false;}});
 let previous;try{previous=JSON.parse(fs.readFileSync(marker,'utf8')).fingerprint;}catch{}
 if(!installed||previous&&previous!==fingerprint){console.log('\nĐang cài thư viện; lần đầu cần Internet...');await run(process.execPath,[npmCli(),'ci'],{env:childEnvironment()});}
 fs.mkdirSync(path.dirname(marker),{recursive:true});fs.writeFileSync(marker,JSON.stringify({fingerprint})+'\n');
}
async function request(url){try{const response=await fetch(url,{signal:AbortSignal.timeout(2500)});return response.ok?response:null;}catch{return null;}}
async function probePorts(){
 const net=require('node:net');async function occupied(port){return new Promise(resolve=>{const socket=net.connect({host:'127.0.0.1',port});socket.setTimeout(1000);socket.on('connect',()=>{socket.destroy();resolve(true);});socket.on('error',()=>{socket.destroy();resolve(false);});socket.on('timeout',()=>{socket.destroy();resolve(false);});});}
 const ports=await Promise.all([occupied(3000),occupied(3001)]);
 if(!ports.some(Boolean))return false;
 if(ports.every(Boolean)){const response=await request('http://127.0.0.1:3001/api/docs-json');const schema=response?await response.json().catch(()=>null):null;if(schema?.info?.title==='Tuyển sinh Sau Đại học và Bàn giao Đào tạo'&&await request('http://localhost:3000')&&await request('http://127.0.0.1:3001/api/public/admission-options')){console.log('Ứng dụng đã chạy. Mở http://localhost:3000 (quản trị: /quan-tri).');return true;}}
 throw Error('Cổng 3000 hoặc 3001 đang được sử dụng. Dừng đúng phiên chạy cũ rồi thử lại; lệnh không tự tắt tiến trình khác.');
}
async function prepareDatabase(content,newEnvironment){
 const config=parseEnv(content);localSettings(config);const sql=sourceRequire('mssql/msnodesqlv8');let master,pool;
 try{
  master=await new sql.ConnectionPool({server:'localhost',connectionString:masterConnection(config.SQLSERVER_CONNECTION_STRING),requestTimeout:60000}).connect();
  const exists=(await master.request().input('Name',sql.NVarChar(128),databaseName).query('SELECT DB_ID(@Name) AS Id')).recordset[0].Id;
  if(!exists){console.log('Đang tạo database mới...');await master.request().query(`CREATE DATABASE [${databaseName}] COLLATE Vietnamese_100_CI_AS`);}
  pool=await new sql.ConnectionPool({server:'localhost',connectionString:config.SQLSERVER_CONNECTION_STRING,requestTimeout:60000}).connect();
  const tables=(await pool.request().query("SELECT COUNT(*) AS Total,OBJECT_ID(N'hoc_thuat.ChuongTrinh',N'U') AS Core FROM sys.tables WHERE is_ms_shipped=0")).recordset[0];
  const empty=tables.Total===0;
  if(newEnvironment){for(const name of ['HoSo','NhanDang','TaiLieu']){const found=(await pool.request().input('Name',sql.NVarChar(128),'tuyen_sinh.'+name).query("SELECT OBJECT_ID(@Name,N'U') AS Id")).recordset[0].Id;if(found&&(await pool.request().query(`SELECT TOP(1) 1 AS Present FROM tuyen_sinh.${name}`)).recordset.length)throw Error('Database đã có dữ liệu mã hóa nhưng chưa có backend/.env. Khôi phục tệp .env và khóa AES gốc trước khi chạy; lệnh chưa tạo khóa thay thế.');}}
  console.log('Đang kiểm tra/cập nhật cấu trúc database...');await require(path.join(backend,'scripts/core-database.cjs')).apply(pool,!tables.Core);
  const admin=(await pool.request().input('Name',sql.NVarChar(100),config.DEV_ADMIN_USERNAME??'admin').query('SELECT 1 AS Present FROM he_thong.TaiKhoanDangNhap WHERE TenDangNhap=@Name')).recordset.length>0;
  if(!admin&&(!config.DEV_ADMIN_PASSWORD||config.DEV_ADMIN_PASSWORD.trim().length<8))throw Error('Chưa có admin và DEV_ADMIN_PASSWORD chưa đủ 8 ký tự. Điền mật khẩu riêng trong backend/.env.');
  if(newEnvironment){const staff=(await pool.request().query('SELECT TOP(1) MaCanBo FROM nhan_su.CanBo WHERE DangHoatDong=1 ORDER BY MaCanBo')).recordset[0];if(!staff)throw Error('Không tìm thấy cán bộ quản trị ban đầu.');content=setValue(content,'DEV_CAN_BO_ID',String(staff.MaCanBo));fs.writeFileSync(backendEnv,content,{flag:'wx'});console.log('Đã tạo backend/.env với khóa riêng. Giữ lại tệp này khi dùng database hiện tại.');}
  if(!fs.existsSync(frontendEnv))fs.copyFileSync(path.join(frontend,'.env.example'),frontendEnv,fs.constants.COPYFILE_EXCL);
  return {config:{NODE_ENV:'development',...parseEnv(content)},empty,showNewPassword:newEnvironment&&!admin};
 }catch(error){if(/ODBC|SQL Server|Login failed|Cannot open database/i.test(error.message))throw Error('Không kết nối/cấu hình được SQL Server. Kiểm tra instance, ODBC và quyền tạo database. Chi tiết: '+error.message);throw error;}
 finally{await pool?.close();await master?.close();}
}
async function waitUntilReady(url,child){for(let i=0;i<90;i++){if(child.exitCode!==null||child.signalCode)throw Error('Dịch vụ đã dừng trước khi sẵn sàng. Xem lỗi phía trên.');if(await request(url))return;await new Promise(resolve=>setTimeout(resolve,1000));}throw Error('Dịch vụ chưa sẵn sàng sau thời gian chờ. Kiểm tra log phía trên.');}
async function main(){
 if(process.argv.includes('--help')){console.log('Chạy: .\\chay.cmd hoặc node scripts/start-local.cjs\nCần Node >=22.16, SQL Server và ODBC Driver 18 x64. Tự cài thư viện, tạo cấu hình/database và chạy ứng dụng. Ctrl+C để dừng.\nGiữ nguyên .env và dữ liệu hiện có. Chỉ nhập bộ AGU ban đầu khi database chưa có bảng nào.');return;}
 if(process.platform!=='win32'||!nodeSupported(process.versions.node))throw Error('Cần Windows x64 và Node.js từ 22.16. Xem HUONG_DAN_CHAY.md.');
 if(await probePorts())return;
 const newEnvironment=!fs.existsSync(backendEnv);const server=windowsPrerequisites(newEnvironment);
 await ensureDependencies();
 const content=newEnvironment?createEnvironment(fs.readFileSync(path.join(backend,'.env.example'),'utf8'),server):fs.readFileSync(backendEnv,'utf8');
 const prepared=await prepareDatabase(content,newEnvironment),env=childEnvironment(prepared.config);
 const children=[];let closing=false;
 async function stop(code){if(closing)return;closing=true;await Promise.all(children.filter(c=>c.pid&&c.exitCode===null&&!c.signalCode).map(c=>new Promise(resolve=>{const killer=spawn('taskkill.exe',['/PID',String(c.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});killer.on('error',resolve);killer.on('exit',resolve);})));process.exitCode=code;}
 function start(entry,args,cwd){const child=spawn(process.execPath,[sourceRequire.resolve(entry),...args],{cwd,stdio:'inherit',env,windowsHide:true});children.push(child);child.on('error',error=>{console.error(error.message);void stop(1);});child.on('exit',()=>{if(!closing)void stop(1);});return child;}
 const interrupt=()=>void stop(0);process.on('SIGINT',interrupt);process.on('SIGTERM',interrupt);
 try{
  console.log('\nĐang khởi động backend...');const api=start('@nestjs/cli/bin/nest.js',['start','--watch'],backend);await waitUntilReady('http://127.0.0.1:3001/api/docs-json',api);
  if(prepared.empty){console.log('\nDatabase ban đầu trống: đang nhập dữ liệu AGU công khai...');await run(process.execPath,['scripts/import-university.cjs','--replace'],{cwd:backend,env});await run(process.execPath,['scripts/augment-agu.cjs','--apply'],{cwd:backend,env});}
  console.log('\nĐang khởi động frontend...');const web=start('next/dist/bin/next',['dev','--webpack','--port','3000','--hostname','127.0.0.1'],frontend);await waitUntilReady('http://localhost:3000',web);
  console.log('\nSẴN SÀNG: http://localhost:3000\nQuản trị: http://localhost:3000/quan-tri\nNhấn Ctrl+C trong terminal này để dừng cả hai dịch vụ.');
  if(prepared.showNewPassword)console.log(`\nAdmin mới: ${prepared.config.DEV_ADMIN_USERNAME}\nMật khẩu riêng cho lần cài này: ${prepared.config.DEV_ADMIN_PASSWORD}\nMật khẩu được lưu trong backend/.env trên máy này.`);else console.log('Đăng nhập bằng tài khoản/mật khẩu hiện có.');
 }catch(error){await stop(1);throw error;}
}
module.exports={nodeSupported,setValue,createEnvironment,masterConnection,localSettings,pickServer};
if(require.main===module)main().catch(error=>{console.error('\nCHƯA CHẠY ĐƯỢC: '+error.message);if(/Application Control|blocked this file/i.test(error.message))console.error('Windows đang chặn thư viện SQL native. Kiểm tra nhật ký Application Control với quản trị viên hoặc chạy trên máy cho phép thư viện msnodesqlv8; xem HUONG_DAN_CHAY.md.');process.exitCode=1;});
