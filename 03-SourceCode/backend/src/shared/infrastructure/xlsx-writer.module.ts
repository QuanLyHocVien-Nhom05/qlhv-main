import { Injectable,Module } from '@nestjs/common';
import writeXlsxFile,{type Cell} from 'write-excel-file/node';
import { SPREADSHEET_WRITER,type SpreadsheetSheet,type SpreadsheetWriter } from '../application/spreadsheet.port';

@Injectable()
export class XlsxWriter implements SpreadsheetWriter{
 async write(sheets:SpreadsheetSheet[]):Promise<Buffer>{
  return writeXlsxFile(sheets.map(sheet=>({
   sheet:sheet.name,stickyRowsCount:1,orientation:'landscape' as const,
   columns:sheet.columns.map(column=>({width:column.width??22})),
   data:[sheet.columns.map(column=>({value:column.title,type:String,fontWeight:'bold' as const,color:'#FFFFFF',backgroundColor:'#1C6655',wrap:true})),
    ...sheet.rows.map((row,index)=>sheet.columns.map(column=>{
     const value=row[column.key];
     const style={backgroundColor:index%2?'#EDF5F1':'#FFFFFF',wrap:true};
     if(value===null||value===undefined)return null;
     if(column.numeric){const number=Number(value);return Number.isFinite(number)?{value:number,type:Number,format:column.format??'0.##',...style}:null;}
     // Strings are always text, including =, +, - and @ prefixes. Never accept
     // formula/hyperlink objects from database data or infer numeric identifiers.
     return {value:value instanceof Date?value.toISOString().slice(0,10):String(value),type:String,...style};
    }) as Cell[])]
  }))).toBuffer();
 }
}
@Module({providers:[{provide:SPREADSHEET_WRITER,useClass:XlsxWriter}],exports:[SPREADSHEET_WRITER]})
export class XlsxWriterModule{}
