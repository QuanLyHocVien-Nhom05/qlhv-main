const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {PDFDocument,rgb,degrees}=require('pdf-lib'),fontkit=require('@pdf-lib/fontkit'),{zipSync,strToU8}=require('fflate');
const root=path.resolve(__dirname,'../../..'),profileArg=process.argv.indexOf('--profile');
const config=profileArg>=0?JSON.parse(fs.readFileSync(path.resolve(process.argv[profileArg+1]),'utf8')):null;
const folderName=config?.folderName??'HoSo_BuiMinhKhang';if(!/^HoSo_[A-Za-z0-9]+$/.test(folderName))throw Error('Tên thư mục không hợp lệ');
const folder=path.join(root,'05_Testing',folderName);
const p=config?{...config.profile,Email:config.account.Email,NamTotNghiep:config.profile.SoYeuLyLich.NamTotNghiep,DiaChi:config.profile.SoYeuLyLich.HoKhauThuongTru,XepLoai:({GIOI:'Giỏi',KHA:'Khá',XUAT_SAC:'Xuất sắc',TRUNG_BINH:'Trung bình'})[config.profile.XepLoai]}:{HoTen:'Bùi Minh Khang',NgaySinh:'1999-08-20',SoGiayTo:'089200052031',DienThoai:'0907450123',Email:'buiminhkhang@student.agu.edu.vn',TruongCapBang:'Trường Đại học An Giang',NganhTotNghiep:'Công nghệ thông tin',XepLoai:'Giỏi',Gpa:8.2,ThangGpa:10,NamTotNghiep:2021,TenChungChi:'IELTS',DiemNgoaiNgu:6.5,NgayCapChungChi:'2026-05-21',NoiCongTac:'Công ty Công nghệ An Giang',DiaChi:'35 Nguyễn Trãi, phường Long Xuyên, tỉnh An Giang'};
const transcript=config?.transcript??[['Lập trình căn bản',3,8],['Cơ sở dữ liệu',3,8],['Mạng máy tính',3,8],['Công nghệ phần mềm',3,9],['Phân tích và thiết kế hệ thống',3,8]];
const totalCredits=transcript.reduce((s,c)=>s+c[1],0);if(Math.abs(transcript.reduce((s,c)=>s+c[1]*c[2],0)/totalCredits-p.Gpa)>1e-8)throw Error('GPA không khớp bảng điểm');
const date=s=>s.split('-').reverse().join('/');
const notice='PHỤC VỤ ĐỒ ÁN — KHÔNG PHẢI MINH CHỨNG THẬT';
const documents=[
 {file:'01_BangTotNghiepDaiHoc.pdf',type:'BANG_DAI_HOC',label:'Bằng tốt nghiệp đại học',title:'THÔNG TIN TỐT NGHIỆP ĐẠI HỌC',lines:[
  ['Trường cấp bằng khai báo',p.TruongCapBang],['Ngành đào tạo',p.NganhTotNghiep],['Trình độ','Đại học'],['Hình thức đào tạo','Chính quy'],['Năm tốt nghiệp',p.NamTotNghiep],['Xếp loại tốt nghiệp',p.XepLoai],['Điểm trung bình tích lũy',p.Gpa+' / '+p.ThangGpa],
  'Trang thông tin tái hiện dữ liệu bằng tốt nghiệp cho tình huống kiểm thử. Không phát hành số hiệu văn bằng, chữ ký hoặc con dấu của trường.'
 ]},
 {file:'02_BangDiem.pdf',type:'BANG_DIEM',label:'Bảng điểm toàn khóa',title:'THÔNG TIN BẢNG ĐIỂM',lines:[
  ['Trường',p.TruongCapBang],['Ngành',p.NganhTotNghiep],['Khóa học','2017–2021'],['Thang điểm',p.ThangGpa],['GPA tích lũy khai báo',p.Gpa],['Xếp loại',p.XepLoai],
  'Trích các học phần để thử nhận dạng dữ liệu; không thay thế bảng điểm toàn khóa được trường xác nhận.',
  ...transcript.map(c=>c[0]+' — '+c[1]+' tín chỉ — điểm '+c[2].toFixed(1)),
  'Tổng phần trích: '+totalCredits+' tín chỉ. Trung bình có trọng số phần trích: '+p.Gpa+' / '+p.ThangGpa+'. Không tự suy ra đây là tổng tín chỉ của khóa học.'
 ]},
 {file:'03_ChungChiNgoaiNgu.pdf',type:'CHUNG_CHI_NGOAI_NGU',label:'Chứng chỉ ngoại ngữ',title:'THÔNG TIN CHỨNG CHỈ NGOẠI NGỮ',lines:[
  ['Tên chứng chỉ','IELTS'],['Ngày cấp khai báo',date(p.NgayCapChungChi)],['Overall band score','6.5'],['Listening','6.5'],['Reading','6.5'],['Writing','6.0'],['Speaking','7.0'],
  'Dữ liệu điểm phục vụ kiểm thử OCR và quy đổi ngoại ngữ trong ứng dụng. Không phải IELTS Test Report Form; không có mã xác thực hoặc xác nhận từ tổ chức khảo thí.'
 ]},
 {file:'04_LyLichKhoaHoc.pdf',type:'LY_LICH_KHOA_HOC',label:'Lý lịch khoa học',title:'LÝ LỊCH KHOA HỌC',lines:[
  ['Trình độ chuyên môn','Đại học Công nghệ thông tin'],['Năm tốt nghiệp','2021'],['Công tác hiện nay',p.NoiCongTac],['Vị trí','Nhân viên phát triển phần mềm'],['Hướng quan tâm','Ứng dụng công nghệ phần mềm trong quản lý giáo dục'],
  'Quá trình đào tạo: 09/2017–08/2021, học đại học tại Trường Đại học An Giang.',
  'Quá trình công tác: từ 09/2021, phát triển phần mềm tại Công ty Công nghệ An Giang.',
  'Kỹ năng: lập trình, cơ sở dữ liệu, kiểm thử phần mềm, tin học văn phòng.',
  'Công trình và bài báo khoa học: chưa kê khai.',
  'Chữ ký và xác nhận của đơn vị: không có trong tài liệu phục vụ đồ án này.'
 ]},
 {file:'05_ThongTinSucKhoe.pdf',type:'GIAY_KHAM_SUC_KHOE',label:'Giấy khám sức khỏe',title:'TÌNH HUỐNG THÔNG TIN SỨC KHỎE',lines:[
  ['Mục đích','Kiểm tra bước đính kèm và thẩm định giấy khám sức khỏe'],['Trạng thái tình huống','Đủ sức khỏe để học tập (mô phỏng)'],
  'Không thực hiện khám sức khỏe; không cung cấp kết luận y khoa hoặc kết quả xét nghiệm.',
  'Không có tên bác sĩ, giấy phép hành nghề, chữ ký hoặc con dấu của cơ sở khám chữa bệnh.',
  'Khi sử dụng cho hồ sơ thực tế, cần thay tệp này bằng giấy khám hợp lệ theo yêu cầu tuyển sinh.'
 ]},
 {file:'06_DongYCoQuan.pdf',type:'DONG_Y_CO_QUAN',label:'Văn bản đồng ý của cơ quan',title:'TÌNH HUỐNG ĐỒNG Ý CỦA CƠ QUAN',lines:[
  ['Đơn vị công tác khai báo',p.NoiCongTac],['Chức vụ','Nhân viên phát triển phần mềm'],['Thời gian công tác','Từ 01/09/2021'],['Ngành dự tuyển','Thạc sĩ Công nghệ thông tin'],
  'Nội dung tình huống: đơn vị đồng ý để người lao động đăng ký dự tuyển và sắp xếp thời gian học tập phù hợp với công việc.',
  'Đây là nội dung mô phỏng để kiểm thử biểu mẫu và quy trình. Không phải văn bản do doanh nghiệp phát hành, không có chữ ký hoặc con dấu của cơ quan.'
 ]},
 {file:'07_SoYeuLyLich.pdf',type:'SO_YEU_LY_LICH',label:'Sơ yếu lý lịch có ảnh, chữ ký và xác nhận',title:'SƠ YẾU LÝ LỊCH',lines:[
  ['Giới tính','Nam'],['Nơi sinh / quê quán','An Giang'],['Dân tộc','Kinh'],['Tôn giáo','Không'],['Hộ khẩu / địa chỉ liên hệ',p.DiaChi],['Trình độ văn hóa','12/12'],['Ngoại ngữ','IELTS 6.5'],['Tin học','Tin học văn phòng và lập trình'],['Hình thức đào tạo','Chính quy'],['Năm tốt nghiệp','2021'],['Nghề nghiệp','Kỹ sư công nghệ thông tin'],['Chức vụ','Nhân viên phát triển phần mềm'],['Cơ quan',p.NoiCongTac],['Địa chỉ cơ quan','Long Xuyên, An Giang'],['Bắt đầu công tác','01/09/2021'],['Số năm công tác','5'],['Ngày vào Đoàn','26/03/2016'],['Nơi vào Đoàn','Trường THPT Long Xuyên'],['Vào Đảng','Chưa kê khai'],['Khen thưởng / kỷ luật','Không'],
  'Quá trình hoạt động:',
  '09/2017–08/2021: Học đại học ngành Công nghệ thông tin, Trường Đại học An Giang; chức vụ sinh viên.',
  'Từ 09/2021: Phát triển phần mềm, Công ty Công nghệ An Giang; chức vụ nhân viên.',
  'Gia đình:',
  ...(config?p.SoYeuLyLich.GiaDinh.map(g=>(g.QuanHe==='CHA'?'Bố':'Mẹ')+': '+g.HoTen+', sinh năm '+g.NamSinh+', nghề '+g.NgheNghiep+', làm việc '+g.NoiLamViec+'.'):['Bố: Bùi Văn Thành, sinh năm 1970, nghề nông nghiệp, làm việc tại địa phương.','Mẹ: Trần Thị Hương, sinh năm 1973, nghề buôn bán, làm việc tại địa phương.']),
  'Nơi ở của bố mẹ: '+p.DiaChi+'.',
  'Ghi chú: chưa kết hôn, chưa có con.',
  'Tệp được tạo phục vụ đồ án, chưa có ảnh chân dung, chữ ký hoặc xác nhận của địa phương/cơ quan. Khi đối chiếu hồ sơ thực tế phải thay bằng tài liệu hợp lệ.'
 ]},
];
async function pdfFor(item){
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fs.readFileSync(path.resolve(__dirname,'../src/modules/admissions/assets/BeVietnamPro-Regular.ttf')),{subset:true});
 pdf.setTitle(item.title+' — '+p.HoTen);pdf.setSubject(notice);pdf.setAuthor('Bộ tài liệu phục vụ đồ án tuyển sinh');let page,y;
 const addPage=()=>{page=pdf.addPage([595,842]);page.drawRectangle({x:30,y:789,width:535,height:27,color:rgb(.98,.92,.9)});page.drawText(notice,{x:40,y:799,size:10,font,color:rgb(.65,.12,.12)});page.drawText('DỮ LIỆU ĐỒ ÁN',{x:90,y:300,size:44,font,rotate:degrees(35),color:rgb(.85,.85,.85),opacity:.22});page.drawText('Không có giá trị văn bằng, chứng chỉ, y tế hoặc xác nhận cơ quan.',{x:40,y:30,size:8,font,color:rgb(.5,.2,.2)});y=760;};
 const text=(value,size=11)=>{let line='';for(const word of String(value).split(/\s+/)){const next=(line?line+' ':'')+word;if(font.widthOfTextAtSize(next,size)>505&&line){draw(line,size);line=word;}else line=next;}if(line)draw(line,size);y-=7;};
 const draw=(line,size)=>{if(y<62)addPage();page.drawText(line,{x:45,y,size,font,color:rgb(.1,.15,.2)});y-=size+7;};
 addPage();text(item.title,16);text('Họ và tên: '+p.HoTen);text('Ngày sinh: '+date(p.NgaySinh));text('CCCD/hộ chiếu: '+p.SoGiayTo);text('Email tài khoản: '+p.Email);y-=6;
 for(const line of item.lines)text(Array.isArray(line)?line[0]+': '+line[1]:line);
 for(const [i,pg]of pdf.getPages().entries())pg.drawText(`${i+1}/${pdf.getPageCount()}`,{x:530,y:30,size:9,font});
 return {bytes:Buffer.from(await pdf.save()),pages:pdf.getPageCount()};
}
function profileGuide(c){
 const a=c.account,h=c.profile,b=h.SoYeuLyLich;
 const table=rows=>'| Trường | Nội dung |\n|---|---|\n'+rows.map(([k,v])=>'| '+k+' | '+(v===null||v===undefined||v===''?'Để trống':String(v).replaceAll('|','/'))+' |').join('\n')+'\n';
 const formLabels={HoTen:'Họ tên',NgaySinh:'Ngày sinh',SoGiayTo:'CCCD/hộ chiếu',DienThoai:'Điện thoại',TruongCapBang:'Trường cấp bằng',NganhTotNghiep:'Ngành tốt nghiệp',XepLoai:'Xếp loại',Gpa:'GPA',ThangGpa:'Thang GPA',NoiCongTac:'Nơi công tác',DoiTuongUuTien:'Đối tượng ưu tiên',TenChungChi:'Tên chứng chỉ',DiemNgoaiNgu:'Điểm ngoại ngữ',NgayCapChungChi:'Ngày cấp chứng chỉ',TenDeCuong:'Tên đề cương'};
 const bioLabels={GioiTinh:'Giới tính',NoiSinh:'Nơi sinh',QueQuan:'Quê quán',DanToc:'Dân tộc',TonGiao:'Tôn giáo',HoKhauThuongTru:'Hộ khẩu thường trú',DiaChiLienHe:'Địa chỉ liên lạc',TrinhDoVanHoa:'Trình độ văn hóa',TrinhDoNgoaiNgu:'Trình độ ngoại ngữ',TrinhDoTinHoc:'Trình độ tin học',HinhThucDaoTao:'Hình thức đào tạo',NamTotNghiep:'Năm tốt nghiệp',NgheNghiep:'Nghề nghiệp',ChucVu:'Chức vụ',DiaChiCoQuan:'Địa chỉ cơ quan',NgayBatDauCongTac:'Ngày bắt đầu công tác',SoNamCongTac:'Số năm công tác',NgayVaoDoan:'Ngày vào Đoàn',NoiVaoDoan:'Nơi vào Đoàn',NgayVaoDang:'Ngày vào Đảng',NoiVaoDang:'Nơi vào Đảng',KhenThuong:'Khen thưởng',KyLuat:'Kỷ luật',GhiChuGiaDinh:'Ghi chú gia đình'};
 const shown=v=>({GIOI:'Giỏi',NAM:'Nam',NU:'Nữ'})[v]??v;
 return '# Thông tin nhập hồ sơ '+a.HoTen+'\n\nBộ thông tin phục vụ báo cáo đồ án. Công cụ chỉ tạo tệp, chưa đăng ký tài khoản hay nộp hồ sơ. Ngày dạng YYYY-MM-DD; tháng dạng YYYY-MM. Khi nhập trên giao diện có thể hiển thị DD/MM/YYYY.\n\n## 1. Đăng ký tài khoản\n\n'+table([['Họ tên',a.HoTen],['Email',a.Email],['CCCD/hộ chiếu',a.SoGiayTo],['Mật khẩu',a.MatKhau],['Xác nhận mật khẩu',a.XacNhanMatKhau],['Đồng ý xử lý dữ liệu','Tích chọn']])+'\n## 2. Chỉ tiêu dự tuyển\n\nChọn đợt đang mở, ngành Công nghệ thông tin 8480201, trình độ Thạc sĩ, phương thức Xét tuyển. Đợt đã chuẩn bị trong bộ dữ liệu: '+c.selection.batchCode+'. Nếu không có lựa chọn thì cán bộ cần kiểm tra lịch và trạng thái mở đợt; không đổi đợt lịch sử AGU thành đợt mới.\n\n## 3. Lập hồ sơ\n\n'+table(Object.entries(formLabels).map(([k,label])=>[label,shown(h[k])]))+'\n## 4. Sơ yếu lý lịch\n\n'+table(Object.entries(bioLabels).map(([k,label])=>[label,shown(b[k])]))+'\n## 5. Quá trình hoạt động\n\n| Từ tháng | Đến tháng | Công việc | Đơn vị | Chức vụ |\n|---|---|---|---|---|\n'+b.QuaTrinhHoatDong.map(r=>'| '+[r.TuThang,r.DenThang||'Để trống, đang công tác',r.CongViec,r.DonViCongTac,r.ChucVu].join(' | ')+' |').join('\n')+'\n\n## 6. Gia đình\n\n'+b.GiaDinh.map(g=>'### '+(g.QuanHe==='CHA'?'Bố':'Mẹ')+'\n\n'+table([['Họ tên',g.HoTen],['Năm sinh',g.NamSinh],['Tuổi',g.Tuoi],['Nghề nghiệp',g.NgheNghiep],['Nơi làm việc',g.NoiLamViec],['Nơi ở',g.NoiOHienNay]])).join('\n')+'\nHai ô xác nhận ở cuối sơ yếu lý lịch cần được người thao tác xem và tự chọn khi hoàn tất tình huống đồ án.\n\n## 7. Nộp hồ sơ\n\nLưu hồ sơ → tải từng PDF theo HUONG_DAN.md → Nộp hồ sơ → hoàn tất phí QR mô phỏng. Sau đó chuyển sang tài khoản cán bộ để trình diễn đối chiếu, thẩm định, tổ chức thi, điểm và nhập học theo quy trình.\n\nTệp PDF có nhãn phục vụ đồ án; không có ảnh thật, chữ ký hoặc con dấu xác nhận. Sử dụng như dữ liệu tình huống báo cáo; không trình bày là giấy tờ chính thức.\n';
}
(async()=>{
 fs.mkdirSync(folder,{recursive:true});const zip={},manifest=[];
 for(const item of documents){const target=path.join(folder,item.file);if(fs.existsSync(target))throw Error('Tệp đã tồn tại, không ghi đè: '+target);const output=await pdfFor(item);if(output.bytes.length>10*1024*1024)throw Error('Tệp vượt giới hạn tải lên');await PDFDocument.load(output.bytes);fs.writeFileSync(target,output.bytes);zip[item.file]=output.bytes;manifest.push({file:item.file,type:item.type,label:item.label,bytes:output.bytes.length,pages:output.pages,sha256:crypto.createHash('sha256').update(output.bytes).digest('hex')});}
 const readme='# Bộ PDF cho hồ sơ '+p.HoTen+'\n\nEmail: '+p.Email+'\n\n'+notice+'. Tất cả thông tin do tạo cho tình huống đồ án; không có giấy tờ, chữ ký, con dấu hoặc kết quả khám thật.\n\n## Cách tải lên\n\nĐăng ký tài khoản mới bằng thông tin trong ThongTinHoSo.json. Lệnh tạo tệp không đăng ký hộ bạn. Sau đó đăng nhập → lập/lưu hồ sơ → Chi tiết hồ sơ → Tài liệu minh chứng. Chọn đúng loại rồi tải từng PDF:\n\n| Tệp | Loại cần chọn |\n|---|---|\n'+manifest.map(m=>'| '+m.file+' | '+m.label+' |').join('\n')+'\n\nMỗi tệp dưới 10 MB. Giải nén ZIP trước khi chọn PDF; không tải nguyên ZIP vào ô minh chứng.\n\nHồ sơ này dự tuyển thạc sĩ nên bộ này không có đề cương tiến sĩ. Sau khi đủ tệp, chọn Nộp hồ sơ / nộp bổ sung và thực hiện phí theo màn hình. Tệp được đánh dấu phục vụ đồ án có thể dùng để kiểm tra tải lên, OCR và luồng xử lý; không được coi là tài liệu đã xác nhận hợp lệ cho tuyển sinh thực tế.\n\nSơ yếu lý lịch PDF trong bộ này chưa có ảnh/chữ ký/xác nhận. Để kiểm tra chức năng xuất của ứng dụng, hoàn thiện sơ yếu lý lịch trực tuyến rồi dùng nút tải PDF của hồ sơ.\n\nLệnh tạo bộ tệp không đăng ký tài khoản, không nộp hồ sơ, không sửa database.\n';
 const entries={'HUONG_DAN.md':readme,'ThongTinHoSo.json':JSON.stringify(config?{...config,purpose:notice}:{...p,purpose:notice},null,2)+'\n','SHA256.json':JSON.stringify(manifest,null,2)+'\n'};
 if(config){entries['THONG_TIN_DANG_KY.md']=profileGuide(config);const checkPath=path.join(root,'05_Testing','KiemTra'+folderName+'.json');if(fs.existsSync(checkPath)){const check=JSON.parse(fs.readFileSync(checkPath,'utf8'));if(check.email===p.Email&&check.unregistered)entries['KiemTraChuaDangKy.json']=JSON.stringify(check,null,2)+'\n';}}
 for(const [name,value]of Object.entries(entries)){const target=path.join(folder,name);if(fs.existsSync(target))throw Error('Tệp đã tồn tại: '+target);fs.writeFileSync(target,value);zip[name]=strToU8(value);}
 const zipPath=path.join(root,'05_Testing',folderName+'.zip');if(fs.existsSync(zipPath))throw Error('ZIP đã tồn tại, không ghi đè');fs.writeFileSync(zipPath,zipSync(zip,{level:6}));console.log(JSON.stringify({folder,zip:zipPath,documents:manifest.map(m=>({file:m.file,pages:m.pages,bytes:m.bytes})),databaseChanged:false},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
