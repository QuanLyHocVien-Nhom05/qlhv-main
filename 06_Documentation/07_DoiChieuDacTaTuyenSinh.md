> Bản đồ án đã bỏ xác thực QR/OTP và các cột TOTP. Đăng nhập trực tiếp bằng tài khoản và mật khẩu; QR trên giấy báo tuyển sinh vẫn được giữ.

> Lịch sử rà soát ngày 12/11/2026: xem [các điều chỉnh theo yêu cầu](11_NangCapTheoYeuCau.md), gồm mẫu lý do bổ sung, khóa theo thời hạn, khóa điểm sau công bố và danh sách trình duyệt. Ngày 13/11/2026 đã bổ sung quản trị mẫu, nhiều bài thi và nhập học tự động: xem [bản bổ sung mới nhất](12_HoanThienNghiepVuTuyenSinh.md).

# Đối chiếu đặc tả tuyển sinh sau đại học

Nguồn: tài liệu `ĐẶC TẢ HỆ THỐNG (1).docx` do người dùng cung cấp. Phạm vi chính chuyển sang **Quản lý tuyển sinh sau đại học**. Các chức năng đào tạo đã xây dựng được giữ làm nơi tiếp nhận học viên sau trúng tuyển. Tên database `QuanLyChuongTrinhDaoTao` được giữ để bảo toàn kết nối và dữ liệu; tên này không quyết định phạm vi nghiệp vụ.

Người dùng đã chọn chuẩn bị tích hợp và kiểm thử nội bộ vì chưa có tài khoản dịch vụ. Không coi adapter hoặc dữ liệu kiểm thử là kết nối đã nghiệm thu với nhà cung cấp.

| Mục đặc tả | Chức năng hiện có | Điểm cần nghiệm thu thực tế |
|---|---|---|
| I. Vòng đời tuyển sinh | Module NestJS `admissions`, cổng thí sinh `/tuyen-sinh`, bàn làm việc tuyển sinh trong `/quan-tri`; kết nối SQL Server | Xác nhận phạm vi với giảng viên hướng dẫn |
| II. Kế hoạch, quy tắc | Đợt và các mốc thời gian; ngành/trình độ/phương thức và chỉ tiêu riêng; hệ số, điểm sàn, tiêu chí phụ, lệ phí; quy đổi ngoại ngữ; ngành đúng/gần và môn bổ sung | Cán bộ nhập quy tắc được trường phê duyệt; không tự gán ngưỡng trường |
| III. Tài khoản, hồ sơ, phí | Đăng ký CCCD/hộ chiếu + email; hồ sơ bằng cấp/GPA/việc làm/ưu tiên/đề cương; 6 loại minh chứng, thêm đề cương tiến sĩ; PDF/JPG/PNG tối đa 10 MB/tệp; quyền chủ hồ sơ; khóa sửa sau nộp | VNPAY đã có tạo giao dịch, kiểm tra chữ ký/merchant/số tiền, callback và chống trùng; chưa giao dịch với VNPAY sandbox thật. Đã bổ sung MoMo captureWallet/IPN và lựa chọn ngân hàng nội địa qua VNPAY; chưa nghiệm thu sandbox nhà cung cấp |
| IV. OCR/sơ tuyển | Hàng đợi nền; PDF có lớp chữ; Tesseract ảnh khi có mô hình vie/eng; adapter OCR/AI HTTPS; lưu kết quả mã hóa; cảnh báo tên/điểm lệch; kiểm tra chứng chỉ 2 năm, GPA, loại bằng, ngành, thiếu giấy tờ | OCR cục bộ hỗ trợ trích xuất cơ bản, không đảm bảo đủ mọi trường/độ chính xác. PDF scan dùng adapter hoặc đối chiếu thủ công. Chưa có bộ chứng từ thật được gán nhãn để đo chất lượng |
| V. Thẩm định | Duyệt/từ chối/yêu cầu bổ sung có lý do, thời hạn; kiểm tra tài liệu đã đối chiếu; phiên bản chống ghi đè; lịch sử tài khoản/thời gian/IP; phạm vi hồ sơ theo cây đơn vị | Email/SMS đi qua outbox, chỉ ghi đã gửi khi được chấp nhận; thiếu cấu hình giữ chờ. Đã có danh mục mẫu lý do do trường tạo/sửa/bật/tắt, kèm hướng dẫn cụ thể và kiểm tra phiên bản |
| VI. Thi/hội đồng | Ca/phòng/sức chứa; phân công coi/chấm/chủ tịch/thư ký; SBD, mã phách; phân phòng; chặn trùng phòng/cán bộ; danh sách và điểm danh; giấy báo PDF/QR | Đã hỗ trợ bài tổng hợp hoặc hai bài độc lập cơ sở/chuyên ngành với lịch và mã phách riêng; chặn cả trùng lịch thí sinh. Chưa tối ưu lịch toàn trường bằng thuật toán lập lịch tập trung. Định dạng SBD cần trường xác nhận |
| VII. Điểm/phúc khảo/xét tuyển | Nhập điểm trực tiếp/Excel theo mã phách; điểm lưu mã hóa; công bố tạm; phúc khảo tách người chấm ban đầu; xếp theo điểm/tiêu chí phụ/chỉ tiêu; dừng nếu vẫn hòa tại ranh giới; Khoa → Phòng đào tạo → BGH, ba người khác nhau | Ngoại ngữ được backend quy đổi từ chứng chỉ đã khai theo bảng ngưỡng của chỉ tiêu, không dùng điểm tự nhập thay quy tắc. Trường phải xác nhận quy chế và thẩm quyền; không tự coi thao tác duyệt là chữ ký số |
| VIII. Nhập học/bàn giao | Xác nhận, phí nhập học, giấy báo PDF/QR; cán bộ chọn phiên bản CTĐT đã duyệt đúng ngành/trình độ để bàn giao, sinh MSHV, chuyển tài khoản thành học viên và thu hồi phiên cũ; adapter ERP/LMS có idempotency key | Đã có kế hoạch tự bàn giao CTĐT/lớp quản lý/xếp lớp học phần/phân GVHD nội bộ sau hoàn tất thủ tục; ERP/LMS gửi dữ liệu và yêu cầu cấp tài khoản nhưng cần hệ thống ngoài xác nhận. PKI chờ dịch vụ ký; QR chỉ xác thực nguồn phát hành |
| IX. An toàn/hiệu năng/báo cáo | AES-256-GCM cho CCCD tuyển sinh, hồ sơ (bao gồm điện thoại/GPA), tệp minh chứng, kết quả OCR, điểm và nội dung thông báo; đăng nhập bằng mật khẩu theo yêu cầu tinh gọn; Excel/PDF/Word báo cáo hồ sơ/trúng tuyển/thu phí | Dữ liệu đào tạo lịch sử không được tự chuyển mã hóa. HTTPS/TLS 1.3 cần triển khai proxy/chứng thư. Chưa đo 10.000 người dùng đồng thời; đã có quản trị/duyệt mẫu báo cáo và cột tùy chỉnh, chưa chứng nhận mẫu Bộ GDĐT; chưa nghiệm thu production |

## Quyền tài khoản

| Vai trò | Phạm vi |
|---|---|
| Admin | Tài khoản/phân quyền/cấu hình và toàn bộ nghiệp vụ; cấp quyền duyệt 1–3 |
| Cán bộ | Chuẩn bị kế hoạch, kiểm tra hồ sơ trong đơn vị và đơn vị con, tổ chức thi, xếp hạng, bàn giao |
| Lãnh đạo | Xem hồ sơ theo đơn vị, xử lý phúc khảo, duyệt đúng cấp đã được admin giao |
| Giảng viên | Ca thi được phân công; người chấm chỉ thấy mã phách; người coi/chủ tịch/thư ký thấy danh sách điểm danh |
| Thí sinh | Hồ sơ, tệp, phí, điểm đã công bố, phúc khảo và xác nhận của chính mình |
| Học viên | Học tập hiện có và các hồ sơ tuyển sinh thuộc chính mình |

Các danh mục cấu hình tuyển sinh dùng chung được cán bộ/lãnh đạo xem; phân quyền theo đơn vị áp dụng với dữ liệu hồ sơ/báo cáo. Admin quản lý cấp duyệt. Các nghiệp vụ đào tạo cũ tiếp tục theo tài liệu phân quyền riêng.

## Cấu trúc và kiểm thử

Migration `04_Infrastructure/SQLServer/09_TuyenSinhTheoDacTa.sql` bổ sung 19 bảng vào 26 bảng đào tạo/tài khoản hiện có, tổng 45 bảng ở bản gốc. Migration 12 bổ sung 5 bảng, hiện tổng 50 bảng (23 tuyển sinh và 27 bảng còn lại); nâng cấp có thể chạy lại. Script tinh gọn cũ bị chặn khi phát hiện phân hệ tuyển sinh này.

`npm run test:acceptance` chạy TypeScript, unit, build và SQL/API/Chrome trên database tạm. Kết quả mới nhất xem `05_Testing/NghiemThu_Loi.json`; không dùng kết quả lịch sử để kết luận cho mã mới. Kiểm thử có callback VNPAY ký nội bộ, không phải xác nhận của VNPAY. Dữ liệu thử và tài khoản thử chỉ nằm trong database tạm được xóa sau kiểm thử.

## Trình diễn

1. Admin đăng nhập bằng mật khẩu. Tạo ngành, chương trình đích và duyệt chương trình.
2. Trong Tuyển sinh: tạo đợt → chỉ tiêu/phương thức, quy đổi ngoại ngữ, ngành đầu vào → mở nhận hồ sơ. Nhập ngày giờ theo giờ Việt Nam.
3. Thí sinh đăng ký tại `/dang-ky`, đăng nhập bằng email, mở `/tuyen-sinh`, chọn chỉ tiêu, khai hồ sơ và đính kèm các minh chứng, nộp.
4. Phí dương cần cấu hình gateway; không giả lập thanh toán thành công. Với đợt thử có phí 0, hệ thống ghi nhận miễn phí đúng theo cấu hình.
5. Cán bộ đối chiếu từng tài liệu và thẩm định; cấu hình phòng/ca/phân công; phân phòng, công bố lịch, tải giấy báo; chấm theo phách và công bố điểm tạm.
6. Thí sinh phúc khảo trong hạn. Sau hết hạn và xử lý xong, cán bộ đóng đợt/xếp hạng; ba lãnh đạo duyệt lần lượt. Không sửa đồng hồ hoặc mốc thực để bỏ qua nghiệp vụ khi sử dụng thật.
7. Thí sinh xác nhận nhập học, hoàn tất phí; cán bộ chọn CTĐT đích và bàn giao. Thí sinh đăng nhập lại để vào phần học viên.

Xem [cấu hình tích hợp và bảo mật](08_TichHopTuyenSinh.md) trước khi chạy ngoài máy cá nhân.
