// Chỉ dùng trong database kiểm thử tạm; không phải thông tin cá nhân thật.
module.exports=(overrides={})=>({
 PhienBan:'AGU_2026',GioiTinh:'NAM',NoiSinh:'An Giang',QueQuan:'An Giang',DanToc:'Kinh',TonGiao:'Không',
 HoKhauThuongTru:'Địa chỉ kiểm thử',DiaChiLienHe:'Địa chỉ liên hệ kiểm thử',TrinhDoVanHoa:'12/12',TrinhDoNgoaiNgu:'IELTS 6.5',TrinhDoTinHoc:'Cơ bản',
 HinhThucDaoTao:'Chính quy',NamTotNghiep:2022,NgheNghiep:'Nhân viên kiểm thử',ChucVu:'',DiaChiCoQuan:'',NgayBatDauCongTac:'',SoNamCongTac:0,
 NgayVaoDoan:'',NoiVaoDoan:'',NgayVaoDang:'',NoiVaoDang:'',KhenThuong:'Không',KyLuat:'Không',GhiChuGiaDinh:'Thông tin giả chỉ phục vụ kiểm thử',
 QuaTrinhHoatDong:[{TuThang:'2018-09',DenThang:'2022-06',CongViec:'Học đại học',DonViCongTac:'Trường kiểm thử',ChucVu:'Sinh viên'}],
 GiaDinh:[],GiaDinhDaKhaiBao:true,CamDoan:true,...overrides,
});
