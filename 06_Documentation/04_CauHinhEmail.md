# Gửi email khôi phục mật khẩu

Mở `03-SourceCode/backend/.env` và điền các mục đã thêm sẵn:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=dia_chi_gui@gmail.com
SMTP_PASSWORD=mat_khau_ung_dung
MAIL_FROM=dia_chi_gui@gmail.com
PASSWORD_RESET_ORIGIN=http://localhost:3000
```

Với Gmail, bật xác minh hai bước rồi tạo **Mật khẩu ứng dụng**, dùng mật khẩu ứng dụng cho `SMTP_PASSWORD`, không dùng mật khẩu đăng nhập Gmail. Không gửi thông tin này qua trò chuyện hay lưu vào tài liệu. Xem [hướng dẫn của Google](https://support.google.com/accounts/answer/185833?hl=vi). Nếu Google không cho phép tạo mật khẩu ứng dụng, dùng nhà cung cấp SMTP phù hợp thay thế.

SMTP dùng cổng 465 với TLS ngay từ đầu, hoặc cổng 587 với STARTTLS bắt buộc; luôn kiểm tra chứng chỉ. Xem [tài liệu SMTP của Nodemailer](https://nodemailer.com/smtp). `MAIL_FROM` phải là địa chỉ được nhà cung cấp cho phép gửi. Khi đưa lên máy chủ, đặt `PASSWORD_RESET_ORIGIN` thành tên miền HTTPS thực tế của frontend; chỉ localhost được phép dùng HTTP. Liên kết localhost chỉ mở được trên máy chạy ứng dụng.

Trong thư mục `03-SourceCode`, chạy:

```powershell
npm run setup:local
npm run check:smtp -w backend
```

`check:smtp` chỉ kiểm tra kết nối và xác thực, không gửi thư. Khởi động lại backend sau khi thay đổi `.env`. Trên trang `/quen-mat-khau`, nhập tên đăng nhập và **email đang lưu trong hồ sơ tài khoản**, chọn **Gửi liên kết qua email**. Kiểm tra cả thư rác. Gửi thư thật cần cấu hình SMTP hợp lệ; bản cài đặt hiện để trống tài khoản và mật khẩu gửi thư.

Liên kết có hiệu lực 15 phút và chỉ dùng một lần. Yêu cầu gửi lại sau ít nhất 60 giây; mỗi IP tối đa 5 yêu cầu gửi email/15 phút. Gửi lại hợp lệ vô hiệu mã trước. API trả cùng một thông báo cho tài khoản không tồn tại, sai email, tài khoản bị khóa/đã xóa và yêu cầu hợp lệ. Khi gửi thất bại, mã vừa tạo bị thu hồi và máy chủ ghi thông báo không chứa thông tin nhạy cảm; người dùng vẫn nhận câu trả lời chung. Khi SMTP chưa cấu hình, mọi yêu cầu đều nhận lỗi 503 trước khi tra cứu tài khoản.

Luồng tự động dành cho tài khoản USER đang hoạt động. Tài khoản quản trị vẫn dùng quy trình xác minh riêng. Luồng cấp mã thủ công trong **Tài khoản → Khôi phục mật khẩu** được giữ lại để hỗ trợ người dùng.

SQL `06_KhoiPhucMatKhau.sql` phân biệt kênh EMAIL và QUAN_TRI, không ghi nhận giả người xác minh cho email tự động. Cơ sở dữ liệu và nhật ký chỉ lưu mã băm; liên kết dùng fragment và được xóa khỏi thanh địa chỉ sau khi mở. Đặt lại thành công thu hồi mọi phiên cũ.

Bộ nghiệm thu dùng SMTP nội bộ với STARTTLS, chứng chỉ tạm được tin cậy riêng cho tiến trình kiểm thử; không dùng thông tin SMTP thật và không gửi ra Internet. Không tắt kiểm tra chứng chỉ trong ứng dụng.
