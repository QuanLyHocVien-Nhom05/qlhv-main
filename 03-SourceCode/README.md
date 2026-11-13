# Mã nguồn

Chạy nhanh: mở terminal tại **thư mục gốc đồ án** (bên ngoài `03-SourceCode`) và chạy `.\chay.cmd`. Xem phần chạy nhanh trong hướng dẫn bên dưới; các lệnh npm ở đây dành cho cách chạy thủ công.

Hai npm workspace `frontend` (Next.js) và `backend` (NestJS). Chạy `npm.cmd ci` tại thư mục này để cài cả hai.

[Hướng dẫn đầy đủ](../HUONG_DAN_CHAY.md) · [Đẩy lên GitHub](../06_Documentation/14_DayLenGitHub.md).

Sau khi cấu hình môi trường và tạo database: `npm.cmd run setup:local`; mở hai terminal chạy `npm.cmd run dev:api` và `npm.cmd run dev:web`. Nghiệm thu: `npm.cmd run test:acceptance`.

Dữ liệu công khai có script xem trước/nhập tại workspace backend; phân biệt `data:replace` (thay thế dữ liệu, chỉ dùng khi đã xác định rõ) và `data:agu:append` (bổ sung không ghi đè). Không có script `seed:demo` trong bản hiện hành.
