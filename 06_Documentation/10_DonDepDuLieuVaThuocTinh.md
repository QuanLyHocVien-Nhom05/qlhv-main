# Phạm vi sau khi dọn dữ liệu và thuộc tính

Theo yêu cầu giữ phần cần thiết cho đồ án, lần dọn này không nạp lại hoặc xóa dữ liệu nghiệp vụ đang lưu. Dữ liệu trường và thông tin đăng nhập `admin`, `khanh` được đối chiếu giữ nguyên. Giữ 45 bảng vì các chức năng đang có vẫn cần đến chúng; bảng trống chưa phát sinh hồ sơ không phải bảng dư.

## Đã loại bỏ

| Bảng | Cột không còn được mã nghiệp vụ sử dụng |
|---|---|
| danh_muc.Nguoi | DiaChi |
| nhan_su.CanBo | HocHam, LaCanBoCoHuu, SoDeTaiToiDa |
| hoc_thuat.PhienBanChuongTrinh | SoCongBoToiThieu |
| he_thong.TaiKhoanDangNhap | TotpSecret, TotpDraft, TotpDraftUntil, TotpCounter |

Xóa cả mã backend/frontend xác thực QR/OTP và cấu hình `MFA_REQUIRED`. Đăng nhập bằng mật khẩu, kiểm tra quyền và trạng thái tài khoản tiếp tục hoạt động. QR trong giấy báo tuyển sinh phục vụ xác thực tài liệu vẫn được giữ.

Script tạo tài khoản/dữ liệu demo đã được gỡ khỏi scripts/package.json để tránh nạp lại dữ liệu thử ngoài ý muốn. Dữ liệu thử cho kiểm thử tự động vẫn được tạo riêng trong database tạm và xóa sau kiểm thử.

## Giữ lại

- Tài khoản, phân quyền, mật khẩu băm, khôi phục mật khẩu và thu hồi phiên.
- Danh mục đơn vị/ngành, 12 chương trình, 19 học phần và lịch sử nội dung học phần.
- Đợt, 12 chỉ tiêu chung, chuẩn ngoại ngữ và văn bản nguồn đã nhập từ trường.
- Hồ sơ/minh chứng, thẩm định, ca thi/hội đồng, điểm/phúc khảo, phê duyệt, giao dịch và nhập học.
- CTĐT/phiên bản/khung học phần, học viên/lớp/đăng ký/kết quả, đề tài/bảo vệ/tốt nghiệp.
- Nguồn tài liệu, mã định danh nội bộ, thời gian tạo/xử lý, lịch sử thao tác và trạng thái tích hợp.

`BacTuongDuong` lưu dữ kiện ngoại ngữ của trường nên vẫn cần giữ, dù không trực tiếp là điểm xét tuyển. Các cột ngày chưa có nguồn và ngưỡng chưa xác nhận vẫn để NULL; không xóa cột chỉ vì hiện chưa có giá trị.

## Migration và xác minh

`11_DonDepThuocTinhCu.sql` có danh sách 9 cột cụ thể, kiểm tra phụ thuộc SQL, không tự xóa khóa ngoại/chỉ mục đang dùng. Chỉ bỏ default/check gắn riêng với các cột bị loại. Migration chạy trong transaction và có thể chạy lại; bộ SQL cài mới không tạo lại các cột này.

Trước khi áp dụng trên database đang dùng, đã BACKUP COPY_ONLY/CHECKSUM và RESTORE VERIFYONLY. Biên bản tại `05_Testing/DonDepThuocTinhCu.json` ghi các cột đã bỏ và kết quả đối chiếu toàn bộ giá trị còn giữ ở 45 bảng, bao gồm thông tin đăng nhập. Khóa ngoại, check constraint và trigger được kiểm tra vẫn hoạt động.

Không chạy lại công cụ tinh gọn cũ `07_TinhGonDuLieuCu.sql`. Nó thuộc phạm vi trước khi phục hồi tuyển sinh, không phù hợp phiên bản hiện tại.
