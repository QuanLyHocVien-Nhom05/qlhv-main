# Bổ sung dữ liệu công khai từ PGD AGU

Ngày đối chiếu: 13/11/2026. Nguồn: `https://pgd.agu.edu.vn/`.

Trang chủ và các PDF được thử mở trực tiếp nhưng trả 403/502. Dữ liệu bổ sung được đối chiếu từ nội dung văn bản của chính tên miền PGD AGU đã được công cụ tìm kiếm lập chỉ mục. Không vượt cơ chế chặn; không tuyên bố đã tải bản gốc hoặc đồng bộ trực tiếp thành công. Các bản ghi có trường kiểu kiểm chứng và ngày kiểm chứng, cùng ghi chú hiển thị trên giao diện.

## Dữ liệu bổ sung

| Dữ liệu | Nguồn và giới hạn |
|---|---|
| Tuyển sinh thạc sĩ năm 2024, số 1103/TB-ĐHAG ngày 07/8/2024 | [Thông báo PGD AGU](https://pgd.agu.edu.vn/storage/844bb3d7f10387d705c2dfb6d17d6b03.pdf). Chỉ tiêu chung 175 cho 6 ngành, dùng cho cả năm 2024. Hai đợt nhận hồ sơ không được nhân đôi thành 350 chỉ tiêu. |
| Quy chế đào tạo thạc sĩ năm 2014 | [Tài liệu 325/2014/QĐ-ĐHAG](https://pgd.agu.edu.vn/storage/0bac13d8c861e0ce03d497f46fe86d9a.pdf). Giữ làm tài liệu lịch sử, chưa xác nhận tình trạng thay thế. |
| Quy định tuyển sinh thạc sĩ, tiến sĩ năm 2021 | [Tài liệu PGD](https://pgd.agu.edu.vn/storage/5c9ee43aac99e73db6a2cd5924cd6442.pdf). Chỉ mục có số 898 ở phần quyết định và 838 ở phần kèm theo. Dùng mã quản lý nội bộ `PGD-TS-2021`, ghi rõ điểm chưa xác minh. |
| Quy chế tuyển sinh thạc sĩ, tiến sĩ ĐHQG-HCM | [Tài liệu được PGD công khai](https://pgd.agu.edu.vn/storage/9b3d39ca97dd46b8fcc966141c0f361e.pdf). Chưa xác minh số/ngày; dùng mã nội bộ, để ngày ban hành trống. |
| Quy trình quản lý, cấp phát văn bằng sau đại học | [Quy trình QT116](https://pgd.agu.edu.vn/storage/2f06ba9a9535552fd56b39a5a95c673d.pdf). Bản có ngày 17/12/2020; chưa xác nhận bản sửa đổi mới hơn. |

Sáu chỉ tiêu năm 2024: Quản lý giáo dục 44; Quản lý tài nguyên và môi trường 26; Chăn nuôi 20; Khoa học cây trồng 30; Công nghệ sinh học 26; Công nghệ thực phẩm 29. Lịch trong nguồn có hạn hồ sơ 06/9 và 25/10, kết quả theo tháng 10 và tháng 12; không tạo một ngày/giờ đóng cổng hoặc ngày công bố chung cho cả năm. Phí, công thức điểm và các mốc chưa xác minh được giữ trống.

## Cách nhập và bảo toàn dữ liệu

- Manifest: `03-SourceCode/backend/data/agu-supplement.json`.
- Migration 13 chỉ thêm cột ghi nguồn, không thêm bảng hoặc thay quy tắc nghiệp vụ.
- Xem trước: `npm run data:agu:preview -w backend` từ `03-SourceCode`.
- Bổ sung: `npm run data:agu:append -w backend`.
- Script chỉ thêm văn bản, một đợt lịch sử đã đóng và sáu chỉ tiêu; không xóa hoặc thay thế tài khoản, mật khẩu, CTĐT, học viên, hồ sơ hoặc thanh toán. Không chạy lệnh `data:replace` để thực hiện yêu cầu này.
- Nhập lại cùng manifest không nhân bản. Nếu trùng mã khác nguồn hoặc chỉ tiêu đã bị sửa, giao dịch bị hủy để tránh ghi đè.
- Biên bản áp dụng thực tế: `05_Testing/BoSungDuLieuAGU.json`.

Xem tại `/thong-tin` và phần thông tin đã công bố của `/tuyen-sinh`. Dữ liệu 2024 không xuất hiện như đợt đang nhận hồ sơ. Các quy chế được lưu để tra cứu và không tự chuyển thành ngưỡng tuyển sinh hoặc cấu hình đang áp dụng.

Kiểm thử: rollback khi trùng nguồn, chạy lại không trùng, giữ dấu vân tay mật khẩu và dữ liệu nghiệp vụ, kiểm tra API nguồn/ngày/chỉ tiêu, cùng giao diện điện thoại. Kết quả toàn bộ nằm trong `05_Testing/NghiemThu_Loi.json`.

Đã áp dụng vào SQL Server cục bộ: thêm 5 văn bản, 1 thông báo lịch sử và 6 chỉ tiêu. API thực tế trả tổng 10 văn bản; 6 chỉ tiêu năm 2024 cộng 175, đều thuộc đợt `DA_DONG`. Cả `/thong-tin` và `/tuyen-sinh` phản hồi HTTP 200. Nghiệm thu đạt 6/6 bước, 55 unit test và 31 nhóm SQL/API/Chrome.
