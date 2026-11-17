// Official Tesseract fast LSTM models, pinned release and SHA-256.
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto'),{parseEnv}=require('node:util');
const models={eng:'7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2',vie:'79df64caf7bcfb2a27df5042ecb6121e196eada34da774956995747636d5bfa1'};
async function setup(){
 const backend=path.resolve(__dirname,'..');let env={};try{env=parseEnv(await fs.readFile(path.join(backend,'.env'),'utf8'));}catch{}
 const folder=path.resolve(backend,process.env.OCR_LANG_PATH||env.OCR_LANG_PATH||'storage/ocr');await fs.mkdir(folder,{recursive:true});
 for(const [language,hash] of Object.entries(models)){
  const file=path.join(folder,language+'.traineddata'),valid=data=>createHash('sha256').update(data).digest('hex')===hash;
  try{if(valid(await fs.readFile(file))){console.log('OCR '+language+': sẵn sàng.');continue;}}catch{}
  console.log('Đang tải mô hình OCR '+language+'...');
  const response=await fetch(`https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/4.1.0/${language}.traineddata`,{signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('Không tải được mô hình '+language);const data=Buffer.from(await response.arrayBuffer());
  if(!valid(data))throw Error('Mô hình '+language+' không đúng SHA-256.');
  const temporary=file+'.download';try{await fs.writeFile(temporary,data);await fs.rename(temporary,file);}finally{await fs.rm(temporary,{force:true});}
  console.log('OCR '+language+': đã cài và kiểm tra SHA-256.');
 }
}
module.exports={setup};
if(require.main===module)setup().catch(error=>{console.error('Chưa thiết lập OCR: '+error.message);process.exitCode=1;});
