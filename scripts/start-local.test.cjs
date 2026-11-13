const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parseEnv}=require('node:util');
const {nodeSupported,setValue,createEnvironment,masterConnection,localSettings,pickServer}=require('./start-local.cjs');
const template=fs.readFileSync(path.join(__dirname,'../03-SourceCode/backend/.env.example'),'utf8');

test('rejects Node versions without the required env parser',()=>{
 for(const version of ['20.19.0','22.15.9','invalid'])assert.equal(nodeSupported(version),false);
 for(const version of ['22.16.0','22.20.0','24.0.0'])assert.equal(nodeSupported(version),true);
});
test('selects a running SQL instance and refuses ambiguous instances',()=>{
 assert.equal(pickServer(['MSSQLSERVER','MSSQL$OTHER']),'localhost');
 assert.equal(pickServer(['MSSQL$SQLEXPRESS']),'localhost\\SQLEXPRESS');
 assert.equal(pickServer(['MSSQL$LOCAL']),'localhost\\LOCAL');
 assert.throws(()=>pickServer([]));
 assert.throws(()=>pickServer(['MSSQL$ONE','MSSQL$TWO']));
});
test('generates independent keys and passwords without modifying the template',()=>{
 const first=parseEnv(createEnvironment(template)),second=parseEnv(createEnvironment(template));
 localSettings(first);
 for(const key of ['JWT_SECRET','DATA_ENCRYPTION_KEY','DEV_ADMIN_PASSWORD']){
  assert.notEqual(first[key],second[key]);assert.ok(first[key].length>=20);
 }
 assert.match(first.DATA_ENCRYPTION_KEY,/^[a-f0-9]{64}$/);
 assert.equal(parseEnv(template).DEV_ADMIN_PASSWORD,'');
});
test('preserves named instance backslashes through env parsing',()=>{
 const config=parseEnv(createEnvironment(template,'localhost\\SQLEXPRESS'));
 assert.ok(config.SQLSERVER_CONNECTION_STRING.includes('Server=localhost\\SQLEXPRESS;'));
 assert.ok(!config.SQLSERVER_CONNECTION_STRING.includes('localhost\\\\'));
});
test('refuses SQL connection-string injection',()=>{
 assert.throws(()=>createEnvironment(template,'localhost;Database=Other'));
});
test('changes only the requested env entry and rejects line injection',()=>{
 const original='JWT_SECRET=old\nDATA_ENCRYPTION_KEY=keep\n# comment\n';
 const updated=setValue(original,'JWT_SECRET','new');
 assert.equal(parseEnv(updated).DATA_ENCRYPTION_KEY,'keep');
 assert.ok(updated.includes('# comment'));
 assert.throws(()=>setValue(original,'JWT_SECRET','x\nHOST=other'));
});
test('limits database creation to the intended database',()=>{
 const connection=parseEnv(createEnvironment(template)).SQLSERVER_CONNECTION_STRING;
 const master=masterConnection(connection);
 assert.ok(master.includes('Database=master;'));
 assert.ok(master.includes('Trusted_Connection=yes;'));
 assert.throws(()=>masterConnection(connection.replace('QuanLyChuongTrinhDaoTao','Other')));
 assert.throws(()=>masterConnection('Server=localhost;'));
});
test('rejects unsafe or incompatible existing settings',()=>{
 const config=parseEnv(createEnvironment(template));
 const legacy={...config};delete legacy.NODE_ENV;assert.doesNotThrow(()=>localSettings(legacy));
 for(const overrides of [{NODE_ENV:'production'},{DEV_LOGIN_ENABLED:'false'},{PORT:'9000'},{HOST:'0.0.0.0'},{JWT_SECRET:'short'},{DATA_ENCRYPTION_KEY:''}]){
  assert.throws(()=>localSettings({...config,...overrides}));
 }
});
