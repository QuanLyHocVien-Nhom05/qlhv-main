# SQL Server — tuyển sinh sau đại học và bàn giao đào tạo

Bộ cài hiện hành có **50 bảng**, các thủ tục/view và hàm phạm vi đơn vị trong 5 schema: danh_muc, nhan_su, hoc_thuat, he_thong, tuyen_sinh. Hướng dẫn cài trên máy mới: [HUONG_DAN_CHAY.md](../../HUONG_DAN_CHAY.md).

| File | Vai trò |
|---|---|
| 00_TaoCoSoDuLieu.sql | Tạo database khi chưa có |
| 01_CauTruc.sql | Cấu trúc nền, chỉ dùng database mới |
| 02_KhungChuongTrinh.sql | Chương trình, đăng ký, điểm và tín chỉ |
| 03_TaiKhoan.sql | Tài khoản, mật khẩu băm, xóa mềm |
| 04_TuongThichDuLieu.sql | Tương thích dữ liệu cũ |
| 05_DuLieuKhoiTao.sql | Danh mục tối thiểu |
| 06_KhoiPhucMatKhau.sql | Khôi phục mật khẩu |
| 08_NangCapDaoTao.sql | Phân quyền và nghiệp vụ đào tạo đã xây dựng |
| 09_TuyenSinhTheoDacTa.sql | 19 bảng tuyển sinh ban đầu và phạm vi đơn vị |
| 10_DuLieuCongKhai.sql | Lưu dữ kiện công khai chưa đủ cấu hình vận hành |
| 11_DonDepThuocTinhCu.sql | Loại thuộc tính cũ, gồm thuộc tính TOTP đã bỏ |
| 12_HoanThienTuyenSinh.sql | Mẫu lý do/báo cáo, nhiều bài thi, kế hoạch nhập học và hướng dẫn |
| 13_NguonDuLieuAGU.sql | Ghi chú nguồn, ngày và cách kiểm chứng dữ liệu AGU |

Trên máy mới, chạy file 00 bằng SSMS trước để tạo database. Sau đó chạy `npm.cmd run setup:local` tại `03-SourceCode` để tự chọn cài mới/nâng cấp và áp dụng các migration hiện hành. Không chạy 01 trên database đang dùng. `ChayKiemThu.ps1` thử bộ cài trong database tạm.

**Không chạy 07_TinhGonDuLieuCu.sql hoặc compact-database.cjs cho phiên bản này.** Chúng đã được chặn khi có tuyen_sinh.DotTuyen để bảo vệ phạm vi mới.

Sao lưu database, tệp mã hóa và khóa trong .env trước nâng cấp. Lần nâng cấp thực tế đã BACKUP COPY_ONLY/CHECKSUM, RESTORE VERIFYONLY và đối chiếu giữ nguyên tài khoản, học viên, điểm và khung chương trình: xem 05_Testing/NangCapTuyenSinh.json. Không chia sẻ bản backup công khai.

Chi tiết: [đối chiếu đặc tả](../../06_Documentation/07_DoiChieuDacTaTuyenSinh.md), [cấu hình mã hóa/tích hợp](../../06_Documentation/08_TichHopTuyenSinh.md).

Dữ liệu hiện hành: [nguồn công khai Đại học An Giang](../../06_Documentation/09_DuLieuCongKhaiDaiHocAnGiang.md). Migration 10_DuLieuCongKhai.sql lưu dữ liệu nguồn chưa đủ quy tắc mà không giả định điều kiện áp dụng.

Dọn thuộc tính dư: migration `11_DonDepThuocTinhCu.sql` loại 9 cột cũ, không xóa dữ liệu nghiệp vụ. Biên bản: `05_Testing/DonDepThuocTinhCu.json`. Tài liệu: [phạm vi giữ lại](../../06_Documentation/10_DonDepDuLieuVaThuocTinh.md).
