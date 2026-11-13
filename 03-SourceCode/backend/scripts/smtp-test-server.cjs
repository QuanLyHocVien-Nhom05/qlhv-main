const {SMTPServer}=require('smtp-server'),selfsigned=require('selfsigned'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
exports.start=async()=>{
 const cert=await selfsigned.generate([{name:'commonName',value:'localhost'}],{days:1,keySize:2048,extensions:[{name:'basicConstraints',cA:true},{name:'subjectAltName',altNames:[{type:2,value:'localhost'},{type:7,ip:'127.0.0.1'}]}]});
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'qlctdt-smtp-')),ca=path.join(directory,'ca.pem');fs.writeFileSync(ca,cert.cert);
 const messages=[];const server=new SMTPServer({key:cert.private,cert:cert.cert,logger:false,onAuth(auth,session,done){if(auth.username==='test'&&auth.password==='test-smtp-password')done(null,{user:'test'});else done(new Error('Authentication failed'));},onData(stream,session,done){let text='';stream.setEncoding('utf8');stream.on('data',d=>text+=d);stream.on('end',()=>{messages.push({text,to:session.envelope.rcptTo.map(r=>r.address)});done();});}});
 server.on('error',()=>{});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {messages,env:{SMTP_HOST:'127.0.0.1',SMTP_PORT:String(server.server.address().port),SMTP_USER:'test',SMTP_PASSWORD:'test-smtp-password',MAIL_FROM:'training@example.invalid',PASSWORD_RESET_ORIGIN:'http://localhost:3100',NODE_EXTRA_CA_CERTS:ca},async close(){await new Promise(resolve=>server.close(resolve));fs.unlinkSync(ca);fs.rmdirSync(directory);}};
};
