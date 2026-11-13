// All suites share ports 3100/3101 and run sequentially. Cache only a build
// matching the current source, dependency lock and public API URL.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn,spawnSync}=require('node:child_process');
const frontend=path.resolve(__dirname,'../../frontend');
const source=path.resolve(frontend,'..');
const next=require.resolve('next/dist/bin/next');
exports.start=function(apiUrl){
 const env={...process.env,QLHV_E2E:'true',NEXT_PUBLIC_API_URL:apiUrl};
 function fingerprint(){
 const hash=crypto.createHash('sha256').update(apiUrl).update(process.version);
 function include(file){hash.update(path.relative(source,file));hash.update(fs.readFileSync(file));}
 function walk(folder){if(!fs.existsSync(folder))return;for(const entry of fs.readdirSync(folder,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(folder,entry.name);if(entry.isDirectory())walk(file);else if(entry.isFile())include(file);}}
 walk(path.join(frontend,'src'));walk(path.join(frontend,'public'));
 for(const name of ['next.config.ts','package.json','tsconfig.json','.env.local'])if(fs.existsSync(path.join(frontend,name)))include(path.join(frontend,name));
 include(path.join(source,'package-lock.json'));include(__filename);
 return hash.digest('hex');
 }
 const signature=fingerprint(),output=path.join(frontend,'.next-e2e');
 const marker=path.join(output,'qlhv-test-build.json');
 let previous;try{previous=JSON.parse(fs.readFileSync(marker,'utf8'));}catch{}
 if(previous?.signature!==signature||!fs.existsSync(path.join(output,'BUILD_ID'))){
  console.log('BUILD isolated production frontend for browser tests');
  const result=spawnSync(process.execPath,[next,'build','--webpack'],{cwd:frontend,env,windowsHide:true,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)throw Error('Browser-test frontend build failed: '+result.status);
  if(signature!==fingerprint())throw Error('Source changed during the browser build. Run the suite again.');
  fs.writeFileSync(marker,JSON.stringify({signature})+'\n');
 }
 return spawn(process.execPath,[next,'start','--hostname','127.0.0.1','--port','3100'],{cwd:frontend,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
};
