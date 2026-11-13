> Bản đồ án đã bỏ xác thực QR/OTP và các cột TOTP. Đăng nhập trực tiếp bằng tài khoản và mật khẩu; QR trên giấy báo tuyển sinh vẫn được giữ.

# Hệ thống quản lý tuyển sinh sau đại học

**Chạy nhanh trên Windows:** tải ZIP, giải nén, mở terminal tại folder gốc rồi chạy `.\chay.cmd`. Cần cài Node.js 22.16+, SQL Server và ODBC Driver 18 x64 một lần. Lệnh tự cài thư viện, chuẩn bị database/cấu hình và chạy cả hai dịch vụ. Mở http://localhost:3000; Ctrl+C để dừng. Chi tiết ở hướng dẫn bên dưới.

- **[Hướng dẫn cài đặt và chạy trên máy mới](HUONG_DAN_CHAY.md)**
- **[Hướng dẫn đẩy bản đồ án lên GitHub](06_Documentation/14_DayLenGitHub.md)**

Phạm vi chính theo đặc tả mới: kế hoạch tuyển sinh, tài khoản thí sinh, hồ sơ/minh chứng, sơ tuyển và thẩm định, tổ chức thi, điểm/phúc khảo, xét tuyển ba cấp và nhập học. Phần chương trình đào tạo/học tập hiện có được giữ làm nơi bàn giao học viên. Frontend Next.js, backend NestJS, Microsoft SQL Server.

- [Đối chiếu đặc tả và giới hạn hiện tại](06_Documentation/07_DoiChieuDacTaTuyenSinh.md)
- [Bổ sung dữ liệu PGD AGU ngày 13/11/2026](06_Documentation/13_BoSungDuLieuPGD_AGU.md)
- [Bổ sung nghiệp vụ ngày 13/11/2026](06_Documentation/12_HoanThienNghiepVuTuyenSinh.md)
- [Các nâng cấp theo 01-Requirements ngày 12/11/2026](06_Documentation/11_NangCapTheoYeuCau.md)
- [Cấu hình tích hợp, mã hóa và đăng nhập](06_Documentation/08_TichHopTuyenSinh.md)

Tài khoản đăng nhập trực tiếp bằng mật khẩu. Cổng thí sinh: `/tuyen-sinh`, đăng ký: `/dang-ky`. Các dịch vụ chưa có tài khoản được chuẩn bị bằng adapter và kiểm thử nội bộ; chưa nghiệm thu kết nối nhà cung cấp, PKI, tải 10.000 người dùng hoặc triển khai production.

- [Phạm vi](01-Requirements/User_Stories.md)
- [Hướng dẫn chạy và trình diễn](06_Documentation/01_HuongDan.md)
- [API](02_Design/API_Contract.md)
- [Kiến trúc](02_Design/KienTruc.md)

Chạy tại `03-SourceCode`: `npm ci`, cấu hình `backend/.env` (gồm khóa AES), `npm run setup:local`, sau đó `npm run dev:api` và `npm run dev:web` ở hai terminal. Nghiệm thu: `npm run test:acceptance`. Database giữ tên `QuanLyChuongTrinhDaoTao`, bổ sung schema tuyển sinh; không chạy script tinh gọn cũ. Cần sao lưu SQL/tệp/khóa trước khi nâng cấp hệ thống đã có dữ liệu.

Dữ liệu hiện hành: [nguồn công khai Đại học An Giang](06_Documentation/09_DuLieuCongKhaiDaiHocAnGiang.md). Migration 10_DuLieuCongKhai.sql lưu dữ liệu nguồn chưa đủ quy tắc mà không giả định điều kiện áp dụng.

Dọn thuộc tính dư: migration `11_DonDepThuocTinhCu.sql` loại 9 cột cũ, không xóa dữ liệu nghiệp vụ. Biên bản: `05_Testing/DonDepThuocTinhCu.json`. Tài liệu: [phạm vi giữ lại](06_Documentation/10_DonDepDuLieuVaThuocTinh.md).
