# Phân quyền công bố điểm và kết quả tuyển sinh

Điều chỉnh được thống nhất ngày 17/11/2026. Quyền công bố điểm tạm thời khác quyền duyệt và công bố trúng tuyển.

| Công việc | Người thực hiện | Điều kiện |
|---|---|---|
| Nhập điểm | Giảng viên được phân công chấm thi; Admin hỗ trợ theo cơ chế hiện có | Theo mã phách, trước khi công bố điểm |
| Công bố điểm tạm | Cán bộ tuyển sinh phụ trách đợt; Admin hỗ trợ | Đợt đang mở/đã đóng, chưa công bố/chưa khóa, đủ điểm; cán bộ phụ trách toàn bộ đơn vị của các chỉ tiêu trong đợt |
| Xử lý phúc khảo | Cán bộ/Lãnh đạo/Admin có quyền xử lý trong phạm vi | Khác người chấm/nhập điểm ban đầu, trong quy trình phúc khảo |
| Duyệt và công bố trúng tuyển | Cán bộ phụ trách hoặc Admin được cấp quyền duyệt một cấp | Quyền do Admin giao riêng; đủ điều kiện chốt kết quả |

Không cần cấp thêm quyền duyệt trúng tuyển chỉ để cán bộ công bố điểm tạm. Giảng viên, Lãnh đạo, Thí sinh và Học viên không có quyền công bố điểm tạm chỉ từ vai trò của mình.

Phạm vi phụ trách hiện được xác định qua cây đơn vị `fn_PhamViDonVi`, dùng cùng nguyên tắc với các API tuyển sinh. Đợt gồm nhiều đơn vị chỉ cho cán bộ công bố toàn đợt khi phạm vi bao quát mọi chỉ tiêu. Chưa có danh mục phân công riêng một cán bộ theo từng đợt.

Trong dữ liệu đã khởi tạo: Trần Thị Lan có vai trò Cán bộ và phạm vi đơn vị phù hợp nên được công bố điểm tạm; Lê Văn Minh đã được cấp quyền duyệt riêng; Nguyễn Văn Hùng là Admin hỗ trợ. Không thay tài khoản, mật khẩu, dữ liệu hoặc quyền duyệt hiện có.

Giao diện danh mục lấy danh sách thao tác được phép từ backend; cán bộ sẽ thấy nút **Công bố điểm tạm thời** tại Đợt tuyển sinh sau khi cập nhật ứng dụng. Thao tác kiểm tra phạm vi và trạng thái trong giao dịch SQL, ghi người/thời gian trong nhật ký, không cho công bố lặp. Sau khi công bố, điểm chỉ điều chỉnh qua phúc khảo; công bố trúng tuyển vẫn đi qua phê duyệt một cấp.

Mã: `roles.ts`, `admissions/infrastructure/score-publication.ts`. Kiểm thử: `test/role-policy.spec.ts` và `scripts/score-publication-checks.cjs`, tích hợp trong `core.integration.cjs`. Không cần SQL migration hoặc chạy lại bộ dữ liệu.

Kiểm thử riêng từ `03-SourceCode`: `npm run test:score-publication -w backend`. Lệnh tạo database/máy chủ thử riêng rồi dọn database đó; không chạy trên database nghiệp vụ. Kết quả nằm tại `05_Testing/PhanQuyenCongBoDiem.json`.
