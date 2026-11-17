# Giữ phiên khi tải lại trang và đăng xuất theo vai trò

Điều chỉnh ngày 18/11/2026 cho cả sáu vai trò: Quản trị viên, Cán bộ, Lãnh đạo, Giảng viên, Thí sinh, Học viên.

## Hành vi

- Có nút **Đăng xuất** trong thanh điều hướng website. Trên điện thoại, mở menu để thấy nút. Không gian quản trị có nút đăng xuất ở thanh tài khoản; tên nút hiển thị ở màn hình lớn, biểu tượng có nhãn truy cập ở màn hình nhỏ.
- F5 hoặc đi đến trang khác trong cùng tab giữ phiên khi token còn hiệu lực. Trước khi khôi phục, frontend gọi `/auth/me`; dữ liệu vai trò luôn lấy từ kết quả backend, không tin thông tin do trình duyệt tự khai.
- Trong lúc xác minh, hiển thị trạng thái khôi phục để tránh nháy form đăng nhập hoặc dựng giao diện riêng bằng vai trò chưa xác thực.
- Lỗi kết nối tạm thời hiển thị **Thử lại**, giữ token để xác minh lại; người dùng có thể chủ động đăng xuất.
- Khi token hết hạn, bị sửa, tài khoản bị khóa/xóa, mật khẩu hoặc vai trò thay đổi, backend từ chối và trình duyệt xóa phiên đã lưu. Thí sinh đã chuyển sang Học viên phải đăng nhập lại để nhận quyền mới.
- Đăng xuất chủ động xóa token và bộ đệm dữ liệu, gọi `/auth/logout` để thu hồi phiên. Chờ yêu cầu đăng xuất kết thúc trước khi hiện lại nội dung, giảm tình trạng đăng nhập mới trong lúc yêu cầu thu hồi cũ chưa hoàn tất.
- Các lỗi 401 của yêu cầu cũ chỉ tác động đúng token tương ứng; không làm đăng xuất nhầm tài khoản vừa đăng nhập.

## Cách lưu và giới hạn

Chỉ token được lưu trong `sessionStorage` của tab với khóa `qlhv.access-token`; không lưu mật khẩu, không lưu bản sao hồ sơ hay tự cấp quyền dựa trên dữ liệu lưu. Đây là giữ phiên khi tải lại tab, không phải chế độ ghi nhớ tài khoản lâu dài. Thời hạn token hiện hành vẫn là 2 giờ từ lúc đăng nhập, không được gia hạn chỉ vì F5.

Token vẫn là bearer token và có thể được JavaScript cùng nguồn đọc; cần tiếp tục bảo vệ ứng dụng trước XSS và dùng HTTPS khi truy cập qua mạng. Nếu trình duyệt vô hiệu hóa lưu trữ, đăng nhập hiện tại vẫn dùng được nhưng không thể bảo đảm giữ phiên sau tải lại.

Đăng xuất khi máy chủ không truy cập được vẫn xóa phiên trên tab; việc thu hồi phía server chỉ hoàn tất nếu yêu cầu tới được server. Token ở các tab/thiết bị khác bị từ chối khi backend kiểm tra lại sau thu hồi. Không thay đổi mật khẩu, tài khoản, dữ liệu hay schema SQL.

## Kiểm thử

Từ `03-SourceCode`, chạy `npm run test:session -w backend`. Bộ này khởi động API/Chrome/frontend và database `QLCTDT_Test_...` riêng, kiểm tra cả sáu vai trò trên desktop/mobile, F5, đăng xuất và token bị thu hồi; khóa tài khoản, đổi mật khẩu/quyền, giả mạo token, tự hết hạn và lỗi server tạm thời. Database kiểm thử được dọn sau khi kết thúc.

Kiểm thử cũng được tích hợp vào `test:acceptance` qua `core.integration.cjs`. Báo cáo: `05_Testing/PhienDangNhapVaDangXuat.json`. Ảnh: `05_Testing/Frontend/dang-xuat-can-bo.png`, `dang-xuat-thi-sinh-mobile.png`.
