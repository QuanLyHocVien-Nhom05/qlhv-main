# Chạy và trình diễn đồ án

Hướng dẫn đầy đủ cho máy mới nằm tại [HUONG_DAN_CHAY.md](../HUONG_DAN_CHAY.md), gồm phần mềm cần cài, SQL Server, khóa môi trường, admin ban đầu, dữ liệu AGU, chạy và xử lý lỗi. Đưa mã nguồn lên repository: [hướng dẫn GitHub](14_DayLenGitHub.md).

## Chạy lại trên máy đã cấu hình

Tại **thư mục gốc đồ án**, chạy `.\chay.cmd` để mở cả backend và frontend trong một terminal; Ctrl+C để dừng. Trên máy mới, cài các phần mềm cần thiết theo mục chạy nhanh trong hướng dẫn đầy đủ; lệnh sẽ tự chuẩn bị thư viện, cấu hình và database.

Nếu muốn chạy từng dịch vụ riêng, dùng cách thủ công bên dưới.

Giữ `backend/.env`, khóa AES và tài khoản hiện có. Tại `03-SourceCode`, mở hai terminal:

```powershell
npm.cmd run dev:api
```

```powershell
npm.cmd run dev:web
```

Mở http://localhost:3000; quản trị tại `/quan-tri`, tuyển sinh tại `/tuyen-sinh`, đăng ký thí sinh tại `/dang-ky`. API tại http://localhost:3001/api/docs. Dừng bằng `Ctrl+C` ở từng terminal.

Nếu nâng cấp mã nguồn, cài thư viện theo lockfile bằng `npm.cmd ci` và chạy `npm.cmd run setup:local` sau khi sao lưu dữ liệu. Bộ hiện hành có 50 bảng; không chạy script tinh gọn 07.

## Kịch bản trình diễn

1. Admin đăng nhập bằng mật khẩu cục bộ. Tạo/duyệt CTĐT đích và cấp các tài khoản cần dùng.
2. Cán bộ lập đợt, chỉ tiêu, lệ phí, quy đổi ngoại ngữ và ngành đầu vào; kiểm tra lịch rồi mở nhận hồ sơ.
3. Thí sinh đăng ký, khai thông tin, đính kèm minh chứng, nộp và hoàn tất phí theo cấu hình.
4. Cán bộ đối chiếu OCR/minh chứng, yêu cầu bổ sung bằng mẫu hoặc duyệt đủ điều kiện.
5. Tạo ca/phòng, phân công, phân phòng và công bố lịch. Chấm tổng hợp hoặc hai bài độc lập; công bố điểm tạm và xử lý phúc khảo đúng người/quyền/thời hạn.
6. Xếp hạng và duyệt Khoa → Phòng đào tạo → BGH bằng ba người khác nhau được giao cấp duyệt.
7. Thí sinh xác nhận, hoàn tất phí; bàn giao thủ công hoặc theo kế hoạch tự động sang CTĐT, lớp và người hướng dẫn.
8. Đăng nhập lại bằng tài khoản học viên, xem học tập và hướng dẫn. Xuất báo cáo theo phạm vi hoặc mẫu đã duyệt.

Các đợt AGU lịch sử được giữ đã đóng; tạo đợt riêng để trình diễn thay vì sửa năm/ngày của thông báo nguồn. Dịch vụ ngoài chưa có cấu hình không được coi là thanh toán/gửi dữ liệu thành công.

Chi tiết: [đối chiếu yêu cầu](07_DoiChieuDacTaTuyenSinh.md), [nghiệp vụ bổ sung](12_HoanThienNghiepVuTuyenSinh.md), [tích hợp](08_TichHopTuyenSinh.md).

## Nghiệm thu

Chạy `npm.cmd run test:acceptance` từ `03-SourceCode`. Bộ kiểm thử dùng SQL Server tạm, SMTP cục bộ và Google Chrome; các cổng 3100/3101 phải trống. Kết quả nằm trong `05_Testing/NghiemThu_Loi.json`, không dùng biên bản cũ để kết luận cho mã đã sửa.
