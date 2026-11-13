# Đặc tả hệ thống hiện hành

Chủ đề chính: **Hệ thống quản lý tuyển sinh sau đại học**. Nguồn nghiệp vụ là [bản trích tài liệu Word](DacTaTuyenSinh_Goc.md); [user stories](User_Stories.md) chuyển yêu cầu thành các luồng thực hiện. Không thay thế tài liệu gốc bằng nội dung giao diện tham khảo.

Vòng đời: lập đợt/quy tắc → đăng ký thí sinh → hồ sơ/minh chứng → lệ phí → sơ tuyển/OCR → thẩm định/bổ sung → tổ chức thi/hội đồng → mã phách/điểm → phúc khảo → xếp hạng → phê duyệt ba cấp → công bố → xác nhận/phí nhập học → bàn giao học viên.

Tác nhân: Admin, Cán bộ, Lãnh đạo, Giảng viên/Hội đồng, Thí sinh, Học viên. Quyền vai trò được kiểm tra ở backend; dữ liệu hồ sơ và báo cáo tuyển sinh theo cây đơn vị hoặc chủ hồ sơ. Ba cấp duyệt do admin giao riêng, yêu cầu ba người khác nhau.

Next.js hiển thị dữ liệu từ REST API NestJS. Module tuyển sinh tách domain/application/infrastructure/presentation trong Modular Monolith, dùng SQL Server. Database giữ tên cũ để bảo toàn kết nối; bổ sung schema tuyen_sinh với 19 bảng, tổng 45 bảng cùng phần đào tạo được giữ lại.

Các module CTĐT, học tập, đề tài, bảo vệ, tốt nghiệp đã có tiếp tục phục vụ sau nhập học. Chúng không thay cho các nghiệp vụ tuyển sinh ở trên.

Người dùng xác nhận chưa có tài khoản nhà cung cấp và chọn chuẩn bị tích hợp/kiểm thử nội bộ. Những phần cần cấu hình hoặc chưa được nghiệm thu thực tế (MoMo, PKI, OCR đầy đủ, ERP/LMS, HTTPS triển khai, tải 10.000 người dùng, mẫu Bộ GDĐT) được ghi rõ trong [bảng đối chiếu](../06_Documentation/07_DoiChieuDacTaTuyenSinh.md) và [hướng dẫn tích hợp](../06_Documentation/08_TichHopTuyenSinh.md).
