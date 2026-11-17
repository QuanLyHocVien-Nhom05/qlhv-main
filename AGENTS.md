# Ngữ cảnh đồ án

Khi tiếp tục làm việc, đọc [ngữ cảnh dự án](01-Requirements/NguCanhDuAn.md) và yêu cầu liên quan trước khi sửa. Đây là bản ghi trạng thái, không thay thế chỉ dẫn mới của người dùng hoặc việc kiểm tra mã nguồn thực tế.

- Danh mục tệp và SHA-256: `01-Requirements/DanhMucTepDuAn.json`; tìm nội dung bằng `rg`.
- Giữ dữ liệu, tài khoản và khóa hiện có. Không dùng `data:replace` để bổ sung dữ liệu vào database đang sử dụng.
- Không biến đợt AGU lịch sử thành đợt đang mở hay tự gộp mã ngành khác nhau giữa các nguồn.
- Không đưa `.env`, khóa, kho minh chứng riêng, backup SQL, dependencies hoặc build lên Git.
- Khi sửa frontend, đọc thêm `03-SourceCode/frontend/AGENTS.md` và tài liệu Next.js được chỉ dẫn tại đó.
- Không khôi phục tệp do người dùng xóa hoặc ghi đè thay đổi hiện có chỉ để chuẩn bị commit.
- Kiểm tra trạng thái và nội dung thay đổi trước khi commit/push. Lưu ngữ cảnh không phải yêu cầu tự động commit/push.
