> Bản đồ án đã bỏ xác thực QR/OTP và các cột TOTP. Đăng nhập trực tiếp bằng tài khoản và mật khẩu; QR trên giấy báo tuyển sinh vẫn được giữ.

# Chuẩn bị tích hợp và kiểm thử nội bộ

## Khóa dữ liệu và đăng nhập

`DATA_ENCRYPTION_KEY` trong `backend/.env` là 64 ký tự hex ngẫu nhiên (32 byte). Tạo một lần cho môi trường mới bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` rồi lưu riêng trên máy. Máy hiện tại đã được tạo khóa; **không ghi đè hoặc tạo lại khóa đang dùng**. Không đưa `.env` vào Git, báo cáo hoặc ảnh chụp. Mất khóa sẽ không giải mã được hồ sơ và tệp.

Sao lưu đồng bộ database, thư mục `backend/storage/admissions` và khóa riêng (khóa lưu ở nơi có kiểm soát quyền, tách khỏi bản dữ liệu công khai). Sao lưu SQL không tự chứa khóa `.env` hay tệp đính kèm. Thử khôi phục trước khi vận hành thật. AES mã hóa các trường và tệp tuyển sinh mới; tên/email phục vụ tra cứu và dữ liệu đào tạo cũ chưa được mã hóa toàn bộ.

Xác thực QR/OTP đã được loại khỏi mã nguồn và SQL theo phạm vi đồ án. Tài khoản đăng nhập bằng mật khẩu; cơ chế cấp quyền, kiểm tra trạng thái và thu hồi phiên vẫn được giữ. QR trong giấy báo là chức năng xác thực tài liệu riêng.

## VNPAY

Điền `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL` và `VNPAY_URL` theo tài khoản sandbox. Đăng ký IPN đến `/api/integrations/vnpay/ipn` qua HTTPS truy cập được từ nhà cung cấp. URL quay lại chỉ dùng hiển thị; backend chỉ gạch nợ khi IPN hợp lệ. Kiểm thử chữ ký sai, merchant sai, số tiền sai, callback lặp, giao dịch từ chối và timeout trước giao dịch thật. Phí bằng 0 được ghi miễn phí, không phải giao dịch VNPAY.

Giao thức tham khảo: [VNPAY 2.1](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html). Đã có MoMo captureWallet/IPN và ngân hàng nội địa qua VNPAY (VNBANK); đối soát chuyển khoản ngoài gateway vẫn cần nhà cung cấp cụ thể; tên kênh `NGAN_HANG` trong bản ghi miễn phí không có nghĩa đã kết nối ngân hàng.

## Email và hợp đồng adapter

Email dùng các biến SMTP hiện có (`SMTP_HOST/PORT/USER/PASSWORD`, `MAIL_FROM`, `PASSWORD_RESET_ORIGIN`). Chỉ bật gửi thực với tài khoản và người nhận được phép. Bộ kiểm thử dùng SMTP cục bộ, không gửi hộp thư thật.

Các adapter bên ngoài dùng HTTPS/TLS 1.3, `Authorization: Bearer <TOKEN>`, JSON POST, timeout 30 giây. Cấu hình cặp `<DICHVU>_ENDPOINT` và `<DICHVU>_TOKEN` trong `.env`. Giá trị trạng thái trên giao diện chỉ cho biết đã có cấu hình, không chứng minh dịch vụ hoạt động.

| Dịch vụ | JSON gửi | Phản hồi bắt buộc |
|---|---|---|
| OCR | `{mime,type,fileBase64}` | `{HoTen?,Diem?,NgaySinh?,SoVanBang?,NgayCap?,TruongCap?,Text?,CanKiemTra}`; tên trường đúng chính tả, kiểu dữ liệu đúng |
| SMS | `{phone,message}` | `{accepted:true,id:"..."}` |
| ERP | `{idempotencyKey,MaSoHocVien,profile,student,admissionScores,classes,provisionLearningAccount:true}` | `{accepted:true,id:"..."}`; nhà cung cấp phải chống gửi trùng theo key |
| SIGNATURE | `{pdfBase64,format:"PAdES"}` | `{pdfBase64:"..."}` PDF đã ký; cần nghiệm thu chuỗi chứng thư, dấu thời gian và chính sách ký với nhà cung cấp |

Không cấu hình: thông báo giữ `CHO_CAU_HINH`, ERP giữ `CHO_CAU_HINH`; không ghi `DA_GUI`. Adapter chữ ký hiện kiểm tra định dạng PDF phản hồi, chưa tự xác minh chứng thư PKI. Bản PDF nội bộ hiển thị chờ cấu hình chữ ký số; QR xác thực nguồn phát hành không thay chữ ký số.

OCR ảnh cục bộ cần hai file `vie.traineddata` và `eng.traineddata` từ mô hình Tesseract chính thức trong `backend/storage/ocr` (hoặc `OCR_LANG_PATH`). PDF có lớp chữ được trích xuất cục bộ; PDF scan không có chữ cần OCR ngoài hoặc kiểm tra thủ công. OCR là gợi ý, cán bộ vẫn phải đối chiếu. Chưa có đo lường độ chính xác nhận dạng tài liệu thực.

Hàng đợi xử lý tuần tự trong tiến trình backend. Cần quản lý retry, lease/phục hồi tác vụ treo, giám sát và worker riêng trước vận hành nhiều máy. Không xóa hàng đợi để che lỗi hoặc đánh dấu đã gửi thủ công khi chưa có xác nhận dịch vụ.

Chi tiết cấu hình MoMo, kế hoạch nhập học tự động và mẫu báo cáo: [bản bổ sung 13/11/2026](12_HoanThienNghiepVuTuyenSinh.md). Các biến `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_RETURN_URL`, `MOMO_IPN_URL` đều bắt buộc khi dùng MoMo.

## HTTPS, tải và báo cáo

Localhost hiện dùng HTTP để phát triển. Mẫu proxy tại `04_Infrastructure/nginx/tuyen-sinh.conf.example` yêu cầu TLS 1.3; phải thay tên miền/chứng thư, kiểm tra CORS, origin, cookie/header và cấu hình trusted proxy theo hạ tầng thực. Chưa triển khai proxy/chứng thư trên máy.

Script `05_Testing/load/admissions.k6.js` chuẩn bị kiểm thử tải với số VU cấu hình. Không chạy 10.000 VU trên máy cá nhân và không suy ra khả năng đáp ứng từ unit test. Phải có môi trường riêng, dữ liệu an toàn và đo tải nộp tệp/đọc kết quả/SQL, lỗi và độ trễ; script hiện chỉ là kiểm tra tải endpoint công khai.

Báo cáo hiện xuất đúng dữ liệu SQL theo phạm vi tài khoản ở Excel/PDF/Word, có danh mục mẫu được duyệt và cột tùy chỉnh. Chưa có biểu mẫu chính thức Bộ GDĐT do trường cung cấp để xác nhận thể thức, chữ ký và giá trị pháp lý.
