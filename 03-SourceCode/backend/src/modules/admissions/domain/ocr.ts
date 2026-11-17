function isoDate(value:string|undefined){if(!value)return undefined;const match=value.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);const normalized=match?`${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`:value;if(!/^\d{4}-\d{2}-\d{2}$/.test(normalized)||!Number.isFinite(Date.parse(normalized))||new Date(normalized).toISOString().slice(0,10)!==normalized)return undefined;return normalized;}
const normalizeLabel=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/\s+/g,' ').trim();
function nearbyLabel(a:string,b:string){
 if(a===b)return true;if(Math.min(a.length,b.length)<6||Math.abs(a.length-b.length)>1)return false;
 let i=0,j=0,errors=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++errors>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}return errors+(a.length-i)+(b.length-j)<=1;
}
export function extractOcrText(text:string){
 const lines=text.normalize('NFC').split(/\r?\n/).map(line=>line.match(/^\s*([^:：]{2,70})\s*[:：]\s*(.{1,250})\s*$/)).filter((m):m is RegExpMatchArray=>!!m).map(m=>({label:normalizeLabel(m[1]),value:m[2].trim()}));
 // A single OCR character error is tolerated in a long label, never in the value.
 const field=(labels:string)=>{const keys=labels.split('|').map(normalizeLabel);return (keys.map(key=>lines.find(line=>line.label===key)).find(Boolean)??keys.map(key=>lines.find(line=>nearbyLabel(line.label,key))).find(Boolean))?.value;};
 const score=field('Overall|Overall band score|Điểm tổng|Điểm trung bình|Điểm trung bình tích lũy|GPA|Điểm');
 const raw=score?.match(/^\d+(?:[.,]\d+)?/)?.[0];
 return {HoTen:field('Họ và tên|Họ tên|Full name|Name'),NgaySinh:isoDate(field('Ngày sinh|Date of birth')),SoVanBang:field('Số hiệu|Số hiệu văn bằng|Số văn bằng|Certificate number|Diploma number'),NgayCap:isoDate(field('Ngày cấp|Date of issue|Issue date')),TruongCap:field('Trường cấp|Trường cấp bằng|Trường|University|Institution|Awarding institution'),XepLoai:field('Xếp loại|Xếp loại tốt nghiệp|Classification'),Diem:raw?Number(raw.replace(',','.')):undefined,Text:text.slice(0,20000),CanKiemTra:true};
}
