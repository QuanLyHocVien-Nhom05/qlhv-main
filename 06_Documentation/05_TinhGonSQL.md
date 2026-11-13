# SQL cho phạm vi đồ án hiện tại

Bảy nhóm chức năng: Tổng quan, Danh mục, Chương trình đào tạo, Học viên, Học tập, Báo cáo, Tài khoản. Phê duyệt/phiên bản, điểm/tín chỉ, đổi mật khẩu và khôi phục qua email nằm trong các nhóm tương ứng.

Database chỉ cần **15 bảng, 5 thủ tục và 2 view**. Dữ liệu danh mục, cán bộ, chương trình/phiên bản/khung học phần, học viên, lớp, đăng ký/điểm, tài khoản, yêu cầu khôi phục và nhật ký được giữ lại.

Các bảng, view và thủ tục của tuyển sinh, đề tài/nghiên cứu, mốc thời gian, tài chính/tài trợ, công bố và tốt nghiệp/lưu trữ được loại bỏ. Bảng tệp tin, hội đồng/hướng dẫn, hàng đợi email tuyển sinh và thông báo cũ cũng không còn cần thiết. SMTP khôi phục mật khẩu hiện gửi trực tiếp, không dùng hàng đợi email tuyển sinh.

File `06_KhoiPhucMatKhau.sql` đã gộp phần kênh email; script `ChayKiemThu.ps1` đã chuyển sang danh sách file hiện hành, không gọi các file phân hệ cũ. `07_TinhGonDuLieuCu.sql` là công cụ bảo trì có xác nhận nội bộ, không tự chạy trong setup.

Lệnh bảo trì tạo backup SQL Server đầy đủ bằng COPY_ONLY/CHECKSUM và kiểm tra bằng RESTORE VERIFYONLY trước khi xóa. Xem đường dẫn backup và kết quả thực hiện tại `05_Testing/TinhGonSQL.json`. Bản backup cho phép khôi phục các phân hệ cũ khi cần; không đưa vào kho mã nguồn hoặc chia sẻ công khai.

Giữ các tài khoản đã xóa mềm và người liên quan để nhật ký/hồ sơ vẫn còn tham chiếu hợp lệ. `admin` và `khanh` giữ nguyên trạng thái và mật khẩu. Việc tinh gọn không xóa thêm tài khoản hay điểm.

Kiểm thử: chạy bộ SQL trên database mới; thử dọn dữ liệu cũ có khóa ngoại; xác nhận rollback khi gặp liên kết không được phép; chạy lại không gây lỗi; chạy bộ SQL/API/Chrome cho các chức năng còn giữ.
