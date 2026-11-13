# Phạm vi bổ sung theo đặc tả tuyển sinh

Module `admissions` dùng domain (kiểm tra hồ sơ, tính điểm/xếp hạng), application (nộp/thẩm định/thi/xét tuyển/bàn giao), infrastructure (SQL, AES, tệp, OCR, thanh toán, thông báo, PDF/Word), presentation (REST/DTO). Domain không đọc SQL. Module đào tạo cũ là đích bàn giao. Adapter được chuẩn bị cho kiểm thử nội bộ, chưa nghiệm thu nhà cung cấp. Chi tiết tại [bảng đối chiếu](../06_Documentation/07_DoiChieuDacTaTuyenSinh.md).

# Kiến trúc đồ án

Nâng cấp 12/11/2026: hệ thống có 5 vai trò, các phân hệ đào tạo mở rộng và 26 bảng. Chi tiết chức năng, phân quyền, giới hạn phạm vi và quy trình SQL tại [hướng dẫn nâng cấp](../06_Documentation/06_PhanQuyen_VaNangCap.md). 

Monorepo npm: `frontend` Next.js, `backend` NestJS, database Microsoft SQL Server.

Backend là modular monolith gồm auth, accounts, programs, management, studies và reports; public phục vụ chương trình đã duyệt; training-portal cung cấp thông báo công khai và hồ sơ nghiên cứu cá nhân, password-recovery xử lý khôi phục mật khẩu. Nghiệp vụ khung chương trình nằm trong domain, application gọi repository qua port, adapter SQL lưu dữ liệu. Quy tắc đồng thời, tiên quyết và khóa điểm được bảo vệ thêm bằng transaction, rowversion và thủ tục/trigger SQL.

Frontend có khu vực quản trị 13 nhóm menu, hiển thị theo vai trò, và không gian học tập của học viên. React Query gọi API, token nằm trong bộ nhớ; tải lại toàn trang cần đăng nhập lại. Mã trạng thái và phân quyền được kiểm tra ở backend.

Schema chỉ gồm danh_muc, nhan_su, hoc_thuat và he_thong, tổng cộng 26 bảng. Migration thông thường giữ dữ liệu hiện có. Lệnh bảo trì riêng `compact-database.cjs --apply` sao lưu toàn bộ database và xác minh backup trước khi xóa các bảng/phân hệ đã loại bỏ; dữ liệu của 26 bảng hiện hành được giữ nguyên, trừ cột liên kết tuyển sinh `HocVien.MaHoSo` không còn sử dụng.
