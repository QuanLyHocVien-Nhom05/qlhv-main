function isoDate(value:string|undefined){if(!value)return undefined;const match=value.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);const normalized=match?`${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`:value;if(!/^\d{4}-\d{2}-\d{2}$/.test(normalized)||!Number.isFinite(Date.parse(normalized))||new Date(normalized).toISOString().slice(0,10)!==normalized)return undefined;return normalized;}
export function extractOcrText(text:string){
 const field=(labels:string)=>text.match(new RegExp(`(?:^|\\n)\\s*(?:${labels})\\s*[:：]\\s*([^\\n]{1,250})`,'i'))?.[1]?.trim();
 const score=field('Overall(?: band score)?|Điểm tổng|Điểm trung bình(?: tích lũy)?|GPA|Điểm');
 const raw=score?.match(/^\d+(?:[.,]\d+)?/)?.[0];
 return {HoTen:field('Họ và tên|Họ tên|Full name|Name'),NgaySinh:isoDate(field('Ngày sinh|Date of birth')),SoVanBang:field('Số hiệu(?: văn bằng)?|Số văn bằng|Certificate number|Diploma number'),NgayCap:isoDate(field('Ngày cấp|Date of issue|Issue date')),TruongCap:field('Trường cấp(?: bằng)?|Trường|University|Institution|Awarding institution'),XepLoai:field('Xếp loại(?: tốt nghiệp)?|Classification'),Diem:raw?Number(raw.replace(',','.')):undefined,Text:text.slice(0,20000),CanKiemTra:true};
}
