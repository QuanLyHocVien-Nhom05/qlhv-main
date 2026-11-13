# Khôi phục mật khẩu

Tại trang đăng nhập, chọn **Quên mật khẩu?**, nhập tên đăng nhập và email đã đăng ký. Chọn Gửi liên kết qua email và mở liên kết trong hộp thư để đặt lại mật khẩu. Hệ thống trả cùng một thông báo cho mọi yêu cầu hợp lệ để tránh tiết lộ tài khoản tồn tại.

Khi cần hỗ trợ theo quy trình thủ công, quản trị viên vào **Tài khoản → Khôi phục mật khẩu**, xác minh danh tính qua kênh độc lập, nhập lại tên đăng nhập và ghi nhận cách xác minh. Chọn **Cấp mã một lần**, chuyển mã hoặc liên kết cho đúng người dùng qua kênh đã xác minh. Không lưu mã vào ghi chú.

Người dùng mở liên kết hoặc trang `/dat-lai-mat-khau`, nhập mã và mật khẩu mới. Mã có hiệu lực 15 phút và dùng một lần; cấp lại sẽ vô hiệu mã trước. Đặt lại thành công thu hồi mọi phiên đăng nhập cũ. Cơ sở dữ liệu chỉ lưu mã băm, không lưu mã khôi phục nguyên văn.

Đã bổ sung **gửi liên kết qua email tự động** tại trang quên mật khẩu; xem [cấu hình SMTP](04_CauHinhEmail.md). Quy trình cấp mã bởi quản trị viên vẫn được giữ lại để hỗ trợ người dùng. Luồng công khai dành cho tài khoản USER đang hoạt động; tài khoản quản trị cần xử lý theo quy trình quản trị riêng.

Ngày 10/11/2026, theo yêu cầu chủ đồ án, đã xóa mềm 6 tài khoản ngoài `admin` và `khanh`, thu hồi phiên đăng nhập và giữ lại hồ sơ, điểm và lịch sử. Hai tài khoản được giữ nguyên mật khẩu. Tài khoản đã xóa có thể xem ở bộ lọc **Đã xóa**; các tài khoản demo trước đây không còn đăng nhập được. Biên bản kỹ thuật: `05_Testing/DonDepTaiKhoan.json`.

Nâng cấp bằng `npm run setup:local`, bao gồm `06_KhoiPhucMatKhau.sql`. Bộ `npm run test:acceptance` kiểm tra quyền truy cập, trả lời không tiết lộ tài khoản, yêu cầu trùng, giới hạn lượt thử, revision, mã hết hạn/cấp lại/dùng một lần, thu hồi phiên và biểu mẫu khôi phục trên Chrome.
