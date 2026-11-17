// Receive repository-relative file names from git ls-files, one per line.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),destination='01-Requirements/DanhMucTepDuAn.json';
const names=[...new Set(fs.readFileSync(0,'utf8').split(/\r?\n/).filter(Boolean))].sort();
const files=[],missing=[],excluded=[];
for(const original of names){
 const name=original.replace(/\\/g,'/');if(name===destination)continue;
 const segments=name.split('/'),base=segments.at(-1);
 if(segments.some(s=>['.git','.tools','.agents','.codex','.aws','node_modules','.next','.next-e2e','dist','coverage','storage','test-results','playwright-report'].includes(s))||(/^\.env/.test(base)&&base!=='.env.example')||/\.(bak|trn|mdf|ldf|key|pem|pfx|p12|log|tsbuildinfo)$/.test(base)||base.endsWith('.local.json')){excluded.push(name);continue;}
 const absolute=path.resolve(root,name);if(!absolute.startsWith(root+path.sep))throw Error('Path outside project');
 if(!fs.existsSync(absolute)){missing.push(name);continue;}const stat=fs.lstatSync(absolute);if(!stat.isFile()||stat.isSymbolicLink()){excluded.push(name);continue;}
 const bytes=fs.readFileSync(absolute);files.push({path:name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
if(!files.length)throw Error('No file names received; pipe git ls-files into this script.');
const report={recordedAt:new Date().toISOString(),purpose:'Project inventory for continuity and GitHub preparation; no private configuration contents',fileCount:files.length,totalBytes:files.reduce((n,f)=>n+f.bytes,0),missingTrackedFiles:missing,excludedPaths:excluded,files};
fs.writeFileSync(path.join(root,destination),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({inventory:destination,files:files.length,missing:missing.length,excluded:excluded.length,filesOver100MiB:files.filter(f=>f.bytes>100*1024*1024).map(f=>f.path)},null,2));
