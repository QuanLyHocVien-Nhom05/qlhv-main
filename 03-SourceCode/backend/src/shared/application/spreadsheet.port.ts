export type SpreadsheetColumn={key:string;title:string;width?:number;numeric?:boolean;format?:string};
export type SpreadsheetSheet={name:string;columns:SpreadsheetColumn[];rows:Record<string,unknown>[]};
export interface SpreadsheetWriter{write(sheets:SpreadsheetSheet[]):Promise<Buffer>;}
export const SPREADSHEET_WRITER=Symbol('SPREADSHEET_WRITER');
