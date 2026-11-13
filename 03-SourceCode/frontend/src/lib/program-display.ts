// Presentation labels for records created by earlier demonstration datasets.
// Keep original identifiers and curriculum data when sending API requests.
export function programTitle(value:string):string{
 return value.replace(/^\s*\[mẫu\]\s*/iu,'').replace(/\s*[-–—]\s*tham khảo(?:\s+.*)?$/iu,'').trim();
}
export function programCode(value:string):string{
 return value.replace(/^MAU_(?:[A-Z]{3}_)?/u,'');
}
export function programCohort(value:string):string{
 return value==='MAU_THAM_KHAO'?'01':value.replace(/^MAU_/u,'');
}
