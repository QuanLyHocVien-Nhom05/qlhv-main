# Đặc tả hệ thống hiện hành

Chủ đề chính: **Hệ thống quản lý tuyển sinh sau đại học**. Nguồn nghiệp vụ là [bản trích tài liệu Word](DacTaTuyenSinh_Goc.md); [user stories](User_Stories.md) chuyển yêu cầu thành các luồng thực hiện. Mục VII đã được điều chỉnh ngày 17/11/2026 theo lựa chọn người dùng: phúc khảo giản lược và phê duyệt một cấp cho đồ án môn học.

Vòng đời: lập đợt/quy tắc → đăng ký thí sinh → hồ sơ/minh chứng → lệ phí → sơ tuyển/OCR → thẩm định/bổ sung → tổ chức thi/hội đồng → mã phách/điểm → phúc khảo → xếp hạng → phê duyệt một cấp → công bố → xác nhận/phí nhập học mô phỏng → tạo học viên/gán CTĐT/lớp/người hướng dẫn nội bộ → chuyển quyền học viên.

Tác nhân: Admin, Cán bộ, Lãnh đạo, Giảng viên/Hội đồng, Thí sinh, Học viên. Quyền vai trò được kiểm tra ở backend; dữ liệu hồ sơ và báo cáo tuyển sinh theo cây đơn vị hoặc chủ hồ sơ. Admin cấp quyền duyệt một cấp cho cán bộ phụ trách tuyển sinh hoặc quản trị viên; cán bộ thông thường không tự có quyền. Chỉ công bố sau khi đủ điều kiện duyệt, ghi nhật ký và khóa kết quả. Chấm lại phúc khảo thực hiện ngoài hệ thống; hệ thống lưu kết quả trước/sau và người xử lý độc lập.

Next.js hiển thị dữ liệu từ REST API NestJS. Module tuyển sinh tách domain/application/infrastructure/presentation trong Modular Monolith, dùng SQL Server. Database giữ tên cũ để bảo toàn kết nối; schema tuyen_sinh phục vụ tuyển sinh; bộ cài hiện hành có tổng 52 bảng, gồm dữ liệu đào tạo tối thiểu phục vụ bàn giao.

Giữ CTĐT, lớp và phân công người hướng dẫn làm đích bàn giao nội bộ. Học viên chỉ xem thông tin được bàn giao; các nghiệp vụ tự đăng ký học phần, GPA, đề tài, bảo vệ và tốt nghiệp cũ không thuộc phạm vi đồ án hiện hành.

Người dùng xác nhận chưa có tài khoản nhà cung cấp và chọn chuẩn bị tích hợp/kiểm thử nội bộ. Những phần cần cấu hình hoặc chưa được nghiệm thu thực tế (cổng thanh toán dự tuyển, OCR trên chứng từ thực tế, HTTPS triển khai và kiểm thử tải mục tiêu 50 người dùng đồng thời) được ghi rõ trong [bảng đối chiếu](../06_Documentation/07_DoiChieuDacTaTuyenSinh.md) và [hướng dẫn tích hợp](../06_Documentation/08_TichHopTuyenSinh.md).

Mục VIII điều chỉnh ngày 17/11/2026: nhập học và bàn giao đào tạo nội bộ; không chạy đồng bộ ERP/LMS hoặc ký số PKI. Cổng thí sinh là kênh xem kết quả chính; Email/SMS không chặn nhập học. Xem mục VIII trong đặc tả hiện hành.

Mục IX điều chỉnh ngày 17/11/2026: AES-256-GCM cho dữ liệu tuyển sinh nhạy cảm, băm mật khẩu, phân quyền và nhật ký; đăng nhập bằng mật khẩu. HTTP chỉ cho phát triển/kiểm thử localhost, HTTPS khi truy cập qua mạng. Mục tiêu tải 50 người dùng đồng thời phải đo riêng; báo cáo Excel/PDF/Word theo mẫu đồ án, không yêu cầu chứng nhận mẫu Bộ GDĐT.
