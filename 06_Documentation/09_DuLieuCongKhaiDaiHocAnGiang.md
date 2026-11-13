# Dữ liệu công khai Đại học An Giang

Bản bổ sung ngày 13/11/2026: [dữ liệu PGD AGU](13_BoSungDuLieuPGD_AGU.md), nhập thêm văn bản và chỉ tiêu lịch sử, giữ dữ liệu hiện có. Nội dung bên dưới mô tả lần nhập ban đầu ngày 12/11/2026.

Ngày nhập: 12/11/2026 (giờ Việt Nam). Dữ liệu được lưu trong SQL Server, frontend đọc qua backend. Tên và mã hiển thị không gắn nhãn “mẫu”, `MAU_` hoặc hậu tố “tham khảo AGU”.

## Nguồn và cách kiểm chứng

- Nguồn yêu cầu: https://pgd.agu.edu.vn/. Website trả HTTP 403; thử truy cập bằng trình duyệt tự động cũng gặp WAF. Không vượt cơ chế chặn và không tuyên bố đã đồng bộ trực tiếp thành công từ website này.
- Thông báo [tuyển sinh thạc sĩ đợt 2/2026](https://tuyensinh.agu.edu.vn/tin-tuc/thong-bao-ve-viec-tuyen-sinh-dao-tao-trinh-do-thac-si-dot-2-nam-2026), [PDF số 1362/TB-ĐHAG](https://tuyensinh.agu.edu.vn/uploads/bdb5f7ff65ffef2436d2bb6fc8961b75.pdf), ngày 26/8/2026. Bản PDF đã tải từ trước trong dự án được đọc lại; không tải lại được để xác nhận website có thay tệp hôm nay hay không.
- [Chương trình Quản lý giáo dục trình độ thạc sĩ](https://rmgo.agu.edu.vn/sites/default/files/Chuong%20trinh%20dao%20tao%20nganh%20Quan%20ly%20giao%20duc%20trinh%20do%20thac%20si.pdf): đọc lại bản PDF đã tải trong dự án. Tài liệu dẫn chiếu Quyết định 325/2014/QĐ-ĐHAG. Không xác nhận đây là khung áp dụng cho khóa 2026.
- Các thông báo [thạc sĩ đợt 1/2026 dự kiến](https://tuyensinh.agu.edu.vn/tin-tuc/thong-bao-ve-viec-tuyen-sinh-dao-tao-trinh-do-thac-si-dot-1-nam-2026-du-kien), [tiến sĩ 2026](https://tuyensinh.agu.edu.vn/tin-tuc/thong-bao-ve-viec-tuyen-sinh-dao-tao-trinh-do-tien-si-nam-2026), [thông tin tuyển sinh thạc sĩ/tiến sĩ 2026](https://tuyensinh.agu.edu.vn/tin-tuc/quyet-dinh-ve-viec-ban-hanh-thong-tin-tuyen-sinh-trinh-do-thac-si-tien-si-nam-2026) được đối chiếu qua nội dung công khai được công cụ tìm kiếm lập chỉ mục. Chỉ nhập tiêu đề/liên kết, không suy đoán nội dung PDF chưa đọc được.

Hai PDF công khai được lưu tại `frontend/public/tai-lieu` để mở trên localhost khi nguồn ngoài bị chặn. SHA-256 của từng tệp và nguồn gốc nằm trong `backend/data/university-data.json` và biên bản nhập; script kiểm tra hash trước khi nhập.

## Dữ liệu đã nhập

- 12 ngành/chương trình trong Thông báo 1362; tổng chỉ tiêu 159. Trong đó 109 thuộc 9 ngành không gắn “dự kiến”, 50 thuộc 3 ngành dự kiến. Ba ngành dự kiến giữ nguyên ghi chú và không bật hoạt động trong danh mục ngành.
- Một đợt tuyển sinh lịch sử đã đóng; 12 chỉ tiêu **chung**, không giả định chia chỉ tiêu riêng cho xét tuyển/xét thẳng. Hạn hồ sơ 24/9/2026; công bố kết quả theo kế hoạch 28/9/2026; nhập học dự kiến tháng 10/2026. Không tạo ngày thi, hạn phúc khảo, hạn bổ sung hoặc hạn nhập học cụ thể khi nguồn không có.
- Phí đăng ký 100.000 đồng và xét tuyển 500.000 đồng; tổng khoản dự tuyển 600.000 đồng là phép cộng hai mục trong thông báo. Không ghi phí nhập học bằng 0 khi chưa có nguồn. Không tạo giao dịch, biên lai hoặc doanh thu giả.
- Các ngưỡng IELTS, TOEFL iBT/ITP trong phụ lục được lưu với bậc ngoại ngữ tương đương. **Bậc 3/4 không phải điểm xét tuyển 3/4 hoặc điểm quy đổi thang 10.** Cột điểm quy đổi để trống khi chưa có công thức. Chỉ tiêu đánh dấu chưa đủ quy tắc vận hành và không cho mở đăng ký.
- 19 học phần Quản lý giáo dục với mã gốc. Khung công khai yêu cầu 62 tín chỉ (53 bắt buộc, 9 tự chọn cần tích lũy); tổng tất cả học phần lựa chọn được cung cấp là 71 tín chỉ. Chưa tự tạo phiên bản áp dụng, GPA tối thiểu, thời gian tối đa hoặc điều kiện tốt nghiệp cho khóa 2026.
- 5 văn bản/liên kết công khai. Ngoài `1362/TB-ĐHAG`, các mã `CTDT-8140114`, `TS-2026-D1`, `TS-TIENSI-2026`, `TTTS-2026` là mã quản lý nội bộ, không phải số quyết định do trường ban hành. Ngày chưa xác minh để trống; ngày đăng bài không được xem là ngày ký văn bản.

Không nhập tài khoản thí sinh, hồ sơ cá nhân, điểm, hội đồng, lớp học, đề tài hoặc quyết định tốt nghiệp giả. Các màn hình này sẽ có dữ liệu khi người dùng thực hiện nghiệp vụ. Giảng viên/cán bộ không được tạo tài khoản mang danh người thật chỉ từ thông tin trên website.

## Làm sạch và bảo toàn tài khoản

Script `backend/scripts/import-university.cjs` chỉ thực hiện thay thế khi có `--replace`, từ chối môi trường production và database ngoài tên được kiểm tra. Trước khi thực hiện trên máy, script BACKUP COPY_ONLY/CHECKSUM và RESTORE VERIFYONLY. Toàn bộ xóa/nhập chạy trong transaction, giữ khóa ngoại; các trigger khóa chương trình được tạm dừng trong transaction bảo trì và khôi phục trước commit. Lỗi sẽ rollback.

Giữ nguyên tài khoản admin đang hoạt động và `khanh` theo yêu cầu bảo toàn trước đó; không thay mật khẩu, vai trò, phiên bản mật khẩu. Xóa tài khoản thử đã khóa và dữ liệu nghiệp vụ cũ để thay bằng thông tin có nguồn. Giữ hồ sơ cán bộ của admin để đăng nhập/quản trị tiếp tục hoạt động.

Biên bản: `05_Testing/NhapDuLieuCongKhai.json`. Không chia sẻ công khai bản backup vì chứa dữ liệu cũ và mật khẩu băm.

## Xem và vận hành

- `/tuyen-sinh`: thông báo lịch sử, 12 ngành và chỉ tiêu. Đợt đã hết hạn nên không tự xuất hiện như đợt đang nhận hồ sơ.
- `/chuong-trinh`: thông tin các chương trình và tài liệu nguồn; Quản lý giáo dục có khung học phần công khai.
- `/thong-tin`: văn bản và tệp PDF.
- `/quan-tri`: Tuyển sinh, Danh mục và Chương trình đào tạo. Các chương trình chưa có phiên bản được liệt kê riêng; có thể tạo phiên bản đầu tiên theo quy định được xác nhận rồi phê duyệt trước gán học viên.

Không sửa lịch sử 2026 thành đợt đang mở để trình diễn. Muốn nộp hồ sơ mới, cán bộ cần tạo đợt riêng với lịch/quy tắc/chỉ tiêu được xác nhận. Script tạo dữ liệu/tài khoản demo đã được gỡ khỏi bộ mã hiện hành.

Xem trước: `npm run data:preview -w backend`. `npm run data:replace -w backend` là thao tác thay thế có sao lưu, sẽ xóa dữ liệu nghiệp vụ được tạo sau lần nhập trước; chỉ dùng khi thực sự muốn làm sạch lại. Lệnh không nằm trong `setup:local` hoặc khởi động ứng dụng.
