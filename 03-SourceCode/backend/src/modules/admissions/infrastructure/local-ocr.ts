import {ServiceUnavailableException} from '@nestjs/common';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {createWorker} from 'tesseract.js';
import {extractOcrText} from '../domain/ocr';

export const ocrDocumentTypes=['BANG_DAI_HOC','BANG_DIEM','CHUNG_CHI_NGOAI_NGU'] as const;
// Keep native import: pdfjs-dist is ESM while Nest builds CommonJS.
const importPdf=()=>new Function('return import("pdfjs-dist/legacy/build/pdf.mjs")')() as Promise<typeof import('pdfjs-dist/legacy/build/pdf.mjs')>;
export async function localOcr(buffer:Buffer,mime:string,models:string,type:string){
 let worker:Awaited<ReturnType<typeof createWorker>>|undefined;
 const recognize=async(image:Buffer)=>{
  if(!existsSync(join(models,'vie.traineddata'))||!existsSync(join(models,'eng.traineddata')))throw new ServiceUnavailableException('Chưa có mô hình OCR. Chạy npm run ocr:setup -w backend.');
  worker??=await createWorker(type==='CHUNG_CHI_NGOAI_NGU'?['eng','vie']:['vie','eng'],1,{langPath:models,cachePath:models,gzip:false,logger:()=>{},errorHandler:()=>{}});
  return (await worker.recognize(image)).data.text;
 };
 let content='';
 try{
  if(mime==='application/pdf'){
   const pdfjs=await importPdf();const loading=pdfjs.getDocument({data:new Uint8Array(buffer),useSystemFonts:true});
   try{
    const doc=await loading.promise;
    if(doc.numPages>10)throw new ServiceUnavailableException('OCR hỗ trợ tối đa 10 trang mỗi tài liệu; cần cán bộ kiểm tra.');
    for(let i=1;i<=doc.numPages;i++){
     const page=await doc.getPage(i),text=await page.getTextContent();
     const layer=text.items.map(item=>'str'in item?item.str+('hasEOL'in item&&item.hasEOL?'\n':' '):'').join('');
     if(layer.replace(/\s/g,'').length>=40)content+=layer+'\n';
     else {
      const original=page.getViewport({scale:1});
      const scale=Math.min(2.5,3200/Math.max(original.width,original.height));
      const viewport=page.getViewport({scale}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
      try{await page.render({canvas:canvas as any,canvasContext:canvas.getContext('2d') as any,viewport,background:'white'}).promise;content+=await recognize(canvas.toBuffer('image/png'))+'\n';}
      finally{canvas.width=1;canvas.height=1;}
     }
     page.cleanup();
    }
   }finally{await loading.destroy();}
  }else if(mime==='image/png'||mime==='image/jpeg'){
   const image=await loadImage(buffer);
   if(image.width<100||image.height<100)throw new ServiceUnavailableException('Ảnh quá nhỏ để nhận dạng; cần tải bản rõ nét.');
   if(image.width*image.height>40_000_000)throw new ServiceUnavailableException('Ảnh quá lớn; cần giảm kích thước trước khi OCR.');
   const scale=Math.min(1,3200/Math.max(image.width,image.height)),canvas=createCanvas(Math.max(1,Math.round(image.width*scale)),Math.max(1,Math.round(image.height*scale)));
   try{const context=canvas.getContext('2d');context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);content=await recognize(canvas.toBuffer('image/png'));}
   finally{canvas.width=1;canvas.height=1;}
  }else throw new ServiceUnavailableException('OCR chỉ nhận PDF, JPG và PNG.');
  if(!content.trim())throw new ServiceUnavailableException('Không đọc được nội dung; cần cán bộ đối chiếu bản gốc.');
  return extractOcrText(content);
 }finally{await worker?.terminate();}
}
