# Bổ sung các chức năng còn thiếu theo yêu cầu

Ngày thực hiện: 13/11/2026. Nguồn đối chiếu: ba tài liệu trong `01-Requirements`. Các giới hạn cần nhà cung cấp hoặc nghiệm thu hạ tầng được giữ riêng, không tính là chức năng đã được xác nhận thực tế.

## Chức năng bổ sung

| Nhóm yêu cầu | Cách sử dụng và điều kiện |
|---|---|
| TS10 — Mẫu lý do của trường | Trong Tuyển sinh → Mẫu lý do thẩm định, tạo mã/tên/hướng dẫn, sửa theo phiên bản và bật/tắt sử dụng. Cán bộ chọn mẫu đang hoạt động khi yêu cầu bổ sung; hướng dẫn tự điền và được chỉnh cho từng hồ sơ. Nội dung lịch sử đã gửi không bị đổi khi sửa mẫu. |
| TS12–TS14 — Nhiều bài thi | Khi tạo ca thi, chọn bài tổng hợp hoặc bài cơ sở/chuyên ngành. Mỗi hồ sơ có thể được phân một ca cơ sở và một ca chuyên ngành, dùng cùng SBD nhưng hai mã phách khác nhau. Không trộn bài tổng hợp với hai bài độc lập. Phân phòng kiểm tra sức chứa, trùng lịch thí sinh; công bố kiểm tra cả phòng/cán bộ/thí sinh. Giấy báo liệt kê các ca đã công bố. |
| TS14–TS16 — Điểm và phúc khảo | Bài tổng hợp giữ mẫu Excel cũ. Bài độc lập nhập trực tiếp hoặc Excel `MaPhach,Diem,UuTien`. Điểm ưu tiên nhập cùng bài chuyên ngành. Hệ thống tổng hợp khi đủ cả cơ sở và chuyên ngành, quy đổi ngoại ngữ từ chứng chỉ. Chặn công bố khi còn hồ sơ chưa đủ điểm. Bất kỳ người chấm bài ban đầu nào cũng bị chặn tự xử lý phúc khảo; điểm tổng hợp điều chỉnh được giữ cùng lịch sử. |
| TS18–TS19 — Nhập học tự động | Trong Kế hoạch nhập học tự động, chọn chỉ tiêu, phiên bản CTĐT đã duyệt đúng ngành/trình độ, lớp quản lý, người hướng dẫn và mảng mã lớp học phần. Bật tự động nếu muốn hàng đợi thực hiện sau xác nhận và hoàn tất phí trong hạn. Lớp học phần vẫn kiểm tra sĩ số và tiên quyết bằng thủ tục đăng ký hiện hành. Nếu một bước lỗi, toàn bộ bàn giao được rollback, không đổi vai trò hay tạo học viên dở dang. Cán bộ xem lỗi ở hồ sơ và xử lý lại. |
| TS19–TS20 — ERP/LMS | Dữ liệu đồng bộ có hồ sơ, MSHV, CTĐT/ngành/trình độ, lớp quản lý, người hướng dẫn, lớp học phần và kết quả tuyển sinh cuối. Gửi yêu cầu cấp tài khoản học tập kèm idempotency key theo hồ sơ. Hàng đợi tự gửi khi đã cấu hình, tối đa 5 lần; chỉ ghi đã gửi khi adapter trả `accepted=true` và `id`. Tài khoản học tập nội bộ dùng tài khoản đã chuyển sang học viên; việc cấp tài khoản ở LMS ngoài trường cần hệ thống đích xác nhận. |
| TS08 — MoMo/ngân hàng | Cổng thí sinh chọn VNPAY, MoMo hoặc ngân hàng nội địa qua VNPAY. MoMo dùng captureWallet, ký HMAC-SHA256 và nhận IPN POST, kiểm tra partner/order/request/amount/chữ ký, trả 204 sau xử lý. Trạng thái authorization không được tính đã thanh toán. Không có tài khoản dịch vụ thì không tạo kết quả thanh toán giả. |
| TS09 — OCR | Bổ sung trích xuất ngày sinh, số văn bằng, ngày cấp, trường cấp, xếp loại và điểm từ các dòng OCR; đối chiếu thêm ngày sinh/trường/GPA/ngày chứng chỉ. Cán bộ xem dữ liệu trích xuất trong chi tiết minh chứng. OCR cục bộ vẫn yêu cầu đối chiếu, vì chưa đo độ chính xác trên chứng từ thật; PDF scan vẫn cần OCR ảnh/dịch vụ ngoài. |
| TS22 — Mẫu báo cáo | Khai tên, văn bản nguồn, URL nguồn, loại báo cáo và danh sách cột theo thứ tự/tên của mẫu. Lãnh đạo/Admin duyệt trước khi dùng. Chọn mẫu ở Báo cáo tuyển sinh để xuất Excel/PDF/Word. Chỉ cho phép các trường dữ liệu báo cáo đã định nghĩa, không nhận SQL hoặc trường nhạy cảm tùy ý. Chưa có văn bản/mẫu chính thức thì không gọi mẫu tự khai là mẫu Bộ GDĐT đã nghiệm thu. |

Mảng mã lớp học phần: `[101,102]` (số, không phải chuỗi). Danh sách cột báo cáo ví dụ: `[{"key":"HoTen","title":"Họ và tên"},{"key":"SoHoSo","title":"Số hồ sơ"}]`. Đây là ví dụ cấu hình kỹ thuật, không phải biểu mẫu chính thức.

Sau nhập học, học viên đăng nhập lại, xem lớp học phần ở Học tập và người hướng dẫn tại Đề tài, bảo vệ & tốt nghiệp. Kế hoạch đã có hồ sơ bàn giao sẽ bị khóa sửa. Bàn giao thủ công vẫn được hỗ trợ; để trống CTĐT để dùng kế hoạch của chỉ tiêu.

## Cấu trúc dữ liệu và nâng cấp

Chạy `npm run setup:local` từ `03-SourceCode`; migration `12_HoanThienTuyenSinh.sql` bổ sung 5 bảng vào 45 bảng cũ, tổng 50 bảng. Các bảng mới là mẫu lý do, điểm từng bài thi, kế hoạch nhập học, phân công hướng dẫn và mẫu báo cáo. Migration giữ hồ sơ/tài khoản và các bài thi tổng hợp cũ; chạy lại không nhân bản cấu hình. Phần bảng tuyển sinh hiện có 23 bảng; phần còn lại có 27 bảng.

## HTTPS và hiệu năng

`04_Infrastructure/nginx/qlhv.conf` chuẩn bị reverse proxy chỉ nhận TLS 1.3 trên cổng 443. Thay tên miền và đường dẫn chứng thư, kiểm tra bằng `nginx -t`, sau đó mới triển khai. Backend/frontend chỉ mở ở loopback. Đặt `TRUST_PROXY_LOOPBACK=true`, `ENFORCE_HTTPS=true`, cập nhật các origin và URL callback sang HTTPS. Đặt `NEXT_PUBLIC_API_URL=/api` trước khi build frontend để trình duyệt dùng API cùng origin. Môi trường phát triển hiện tại vẫn dùng HTTP localhost.

Kịch bản `05_Testing/load/admissions.k6.js` tăng tải dần, giữ tải và hạ tải. Lệnh cho môi trường kiểm thử được cấp phép:

```powershell
k6 run --summary-export 05_Testing/load/result-10000.json -e BASE_URL=https://ten-mien-kiem-thu/api -e VUS=10000 -e RAMP_UP=5m -e DURATION=10m -e RAMP_DOWN=1m 05_Testing/load/admissions.k6.js
```

Kịch bản hiện đo cổng tra cứu chỉ tiêu công khai; cần thêm dữ liệu/tài khoản tải riêng để đo nộp hồ sơ, thanh toán và tra cứu kết quả cá nhân. Máy hiện chưa có k6/nginx, chứng thư hoặc môi trường tải được chỉ định. Chưa chạy bài tải 10.000 VU và không kết luận hệ thống đã đạt 10.000 người dùng đồng thời.

## Kiểm chứng và điều kiện còn chờ

Chạy `npm run test:acceptance`. Kết quả thực tế ở `05_Testing/NghiemThu_Loi.json`. Bộ mới kiểm tra mẫu lý do tùy chỉnh/phiên bản/bật tắt; hai ca thi, trùng lịch, mã phách riêng, chấm giao diện/Excel, khóa khi thiếu điểm và phúc khảo độc lập; kế hoạch nhập học, rollback khi lớp đầy, bàn giao lại, đổi vai trò và chống bàn giao trùng; mẫu báo cáo trước/sau duyệt. Unit test bổ sung cho OCR, cấu hình cột, ký MoMo, callback giả/sai số tiền/authorization/trùng và lựa chọn ngân hàng.

Lượt nghiệm thu cho bản bổ sung đạt 6/6 bước, 55 unit test (52 backend, 3 frontend) và 30 nhóm SQL/API/Chrome. Biên bản phạm vi và các mục còn chờ: `05_Testing/BoSungTheoRequirements.json`. Kiểm thử có khôi phục tổng hợp điểm sau gián đoạn, ERP chưa xác nhận/đã xác nhận/gửi lại và tạo cột báo cáo trên giao diện.

Đang chờ: tài khoản sandbox VNPAY/MoMo, dịch vụ SMS/PKI/ERP/LMS cụ thể, chứng từ thật để đo OCR, tên miền/chứng thư triển khai, môi trường đo tải, và văn bản/mẫu báo cáo chính thức. Các adapter kiểm thử nội bộ không thay thế xác nhận của nhà cung cấp.

Tài liệu giao thức dùng để triển khai: [MoMo captureWallet](https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/), [MoMo IPN](https://developers.momo.vn/v3/docs/payment/api/result-handling/notification/), [VNPAY ngân hàng nội địa](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html), [Nginx TLS](https://nginx.org/en/docs/http/ngx_http_ssl_module.html), [k6 stages](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/).
