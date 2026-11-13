export class FieldValidationError extends Error {}
export type Field = {key: string; label: string; type: 'text'|'number'|'date'|'datetime'|'select'|'boolean'|'textarea'; required?: boolean; max?: number; min?: number; options?: string[]; reference?: string; integer?: boolean};
export type Action = {key: string; label: string; fields: Field[]; sql: string; destructive?: boolean};
export type Resource = {key: string; group: string; label: string; description: string; id: string; query: string; columns: string[]; fields: Field[]; insert?: string; actions?: Action[]};
export function validateFields(fields: Field[], input: Record<string, unknown>): Record<string, unknown> {
  for (const key of Object.keys(input)) if (!fields.some(field => field.key === key)) throw new FieldValidationError(`Trường không được phép: ${key}`);
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    let value = input[field.key];
    if (typeof value === 'string') value = value.trim();
    if (value === '' || value === undefined || value === null) {
      if (field.required) throw new FieldValidationError(`Vui lòng nhập ${field.label.toLowerCase()}.`);
      result[field.key] = null; continue;
    }
    if (field.type === 'number' || (field.reference && !field.reference.endsWith('-types'))) {
      if (typeof value !== 'number' || !Number.isFinite(value) || ((field.integer || field.reference) && !Number.isSafeInteger(value))
        || value < (field.min ?? 0) || value > (field.max ?? 999999999999)) throw new FieldValidationError(`${field.label} không hợp lệ.`);
    } else if (field.type === 'boolean') {
      if (typeof value !== 'boolean') throw new FieldValidationError(`${field.label} phải là có/không.`);
    } else {
      if (typeof value !== 'string' || value.length > (field.max ?? 2000)) throw new FieldValidationError(`${field.label} không hợp lệ.`);
      if (field.options && !field.options.includes(value)) throw new FieldValidationError(`${field.label} không nằm trong danh mục.`);
      if (field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value)) throw new FieldValidationError(`${field.label} không phải ngày hợp lệ.`);
      if(field.type==='datetime'){
        const iso=/^\d{4}-\d{2}-\d{2}$/.test(value)?`${value}T00:00:00Z`:value;
        const valid=/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?Z$/.test(iso)&&!Number.isNaN(Date.parse(iso));
        if(!valid||new Date(iso).getUTCFullYear()<1||new Date(iso).toISOString().slice(0,10)!==iso.slice(0,10))throw new FieldValidationError(`${field.label} phải là thời gian UTC hợp lệ (Z).`);
        value=new Date(iso).toISOString().slice(0,19);
      }
    }
    result[field.key] = value;
  }
  return result;
}
export const text = (key: string, label: string, max = 200, required = true): Field => ({key,label,type:'text',required,max});
export const ref = (key: string, label: string, reference: string, required = true): Field => ({key,label,type:'select',reference,required,min:1,integer:true});
export const num = (key: string, label: string, min = 0, max = 999999999999, integer = false): Field => ({key,label,type:'number',required:true,min,max,integer});
export const date = (key: string, label: string): Field => ({key,label,type:'date',required:true});
export const datetime = (key: string, label: string): Field => ({key,label,type:'datetime',required:true});
export const choice = (key: string, label: string, options: string[]): Field => ({key,label,type:'select',options,required:true});
