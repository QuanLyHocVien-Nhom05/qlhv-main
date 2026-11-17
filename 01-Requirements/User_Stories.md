# Yêu cầu đồ án — Quản lý tuyển sinh sau đại học

Nguồn yêu cầu: [đặc tả đã điều chỉnh cho đồ án (mục VII: một cấp duyệt; mục VIII: bàn giao nội bộ; mục IX: bảo mật/báo cáo và mục tiêu tải phù hợp đồ án)](DacTaTuyenSinh_Goc.md). Trạng thái và giới hạn triển khai: [bảng đối chiếu](../06_Documentation/07_DoiChieuDacTaTuyenSinh.md). Phần đào tạo được giữ làm đích bàn giao sau nhập học.

| Mã | Vai trò | Nhu cầu và điều kiện chấp nhận |
|---|---|---|
| TS01 | Admin/Cán bộ | Lập đợt với các mốc mở/đóng, thẩm định, bổ sung, thi, công bố, phúc khảo, nhập học; kiểm tra thứ tự thời gian |
| TS02 | Cán bộ | Cấu hình chỉ tiêu theo ngành, thạc sĩ/tiến sĩ, thi/xét/tuyển thẳng; khai lệ phí, công thức và tiêu chí phụ trước mở đợt |
| TS03 | Cán bộ | Cấu hình IELTS/TOEFL/VSTEP và điểm quy đổi; ngành đúng/gần/không phù hợp và các môn bổ sung |
| TS04 | Thí sinh | Tạo tài khoản với CCCD/hộ chiếu/email; chỉ được tự cấp vai trò thí sinh |
| TS05 | Thí sinh | Khai bằng cấp, GPA, xếp loại, việc làm, ưu tiên, ngoại ngữ và đề cương tiến sĩ; chặn thông tin sai định dạng |
| TS06 | Thí sinh | Tải PDF/JPG/PNG tối đa 10 MB/tệp; đủ 6 loại tài liệu và đề cương nếu dự tuyển tiến sĩ; chỉ chủ hoặc cán bộ đúng phạm vi đọc được |
| TS07 | Thí sinh | Nộp/sửa trong hạn và theo phiên bản hồ sơ; khóa sửa sau nộp, mở bổ sung có hạn theo yêu cầu cán bộ |
| TS08 | Thí sinh | Thanh toán lệ phí, nhận biên lai; callback xác thực số tiền/chữ ký, không ghi nhận giao dịch giả hoặc trùng |
| TS09 | Cán bộ | Sơ tuyển theo thời hạn chứng chỉ, GPA, xếp loại, ngành và tài liệu; OCR gợi ý đối chiếu và cờ cảnh báo |
| TS10 | Cán bộ | Thẩm định hợp lệ/từ chối/yêu cầu bổ sung có lý do, lịch sử người thực hiện/thời gian/IP; chỉ hồ sơ đúng phạm vi |
| TS11 | Hệ thống | Xếp hàng thông báo email/SMS, không ghi đã gửi khi thiếu cấu hình hoặc chưa được dịch vụ chấp nhận |
| TS12 | Giáo vụ | Khai phòng và ca, phân công coi/chấm/chủ tịch/thư ký; phân phòng không vượt sức chứa, chặn trùng phòng/cán bộ |
| TS13 | Thí sinh/Coi thi | Tra cứu SBD, phòng/ca và giấy báo PDF/QR; cán bộ điểm danh theo phân công |
| TS14 | Người chấm | Chấm theo mã phách; nhập trực tiếp hoặc Excel; lưu điểm mã hóa, chỉnh sửa qua phúc khảo |
| TS14a | Cán bộ phụ trách đợt/Admin | Công bố điểm tạm khi đủ điểm; cán bộ phải phụ trách toàn bộ cây đơn vị của các chỉ tiêu trong đợt; chặn ngoài phạm vi, công bố lặp và đợt đã khóa; lưu nhật ký; không tự cấp quyền duyệt trúng tuyển |
| TS15 | Thí sinh/Người xử lý | Nhận phúc khảo trong hạn sau công bố điểm tạm; chấm lại ngoài hệ thống, cập nhật điểm/nhận xét và lưu điểm trước/sau; người xử lý khác người chấm ban đầu |
| TS16 | Cán bộ | Tính điểm có quy đổi ngoại ngữ, xếp hạng theo chỉ tiêu/điểm sàn/tiêu chí phụ; dừng để xử lý khi vẫn hòa ranh giới |
| TS17 | Người được giao quyền duyệt | Admin cấp quyền cho cán bộ phụ trách hoặc quản trị viên; phê duyệt một cấp rồi công bố, lưu người/thời gian/ghi chú; chặn khi chưa hết hạn hoặc còn phúc khảo, thiếu điểm, hòa ranh giới chưa xử lý, vượt chỉ tiêu; khóa kết quả sau công bố và không duyệt lặp |
| TS18 | Thí sinh | Xem kết quả/giấy báo PDF-QR trên cổng, xác nhận trong hạn, hoàn tất phí nhập học bằng QR mô phỏng hoặc miễn phí; không chuyển tiền thật |
| TS19 | Cán bộ | Bàn giao nội bộ sau xác nhận và hoàn tất phí: đủ CTĐT đã duyệt đúng ngành/trình độ, lớp quản lý và người hướng dẫn hợp lệ; sinh mã học viên, xếp lớp theo kế hoạch, chuyển quyền/thu hồi phiên cũ; rollback khi lỗi và không tạo trùng |
| TS20 | Admin | Quản lý kế hoạch bàn giao nội bộ, chế độ mô phỏng và nhật ký; không yêu cầu ERP/LMS, tài khoản LMS riêng hoặc chữ ký số PKI để nghiệm thu mục VIII |
| TS21 | Admin | Quản lý 6 vai trò, cấp/thu hồi quyền, khóa/xóa mềm; đăng nhập bằng mật khẩu; QR/OTP được loại theo phạm vi đồ án |
| TS21a | Mọi vai trò | Có nút đăng xuất tại giao diện công khai và không gian làm việc, dùng được trên điện thoại; tải lại trang trong cùng tab giữ phiên còn hiệu lực sau khi backend xác minh; không lưu mật khẩu; đăng xuất xóa phiên trình duyệt và thu hồi token; phiên hết hạn/đã thu hồi không được khôi phục |
| TS22 | Quản lý | Xuất danh sách hồ sơ, trúng tuyển, doanh thu lệ phí theo phạm vi dưới Excel/PDF/Word và mẫu đồ án được duyệt; loại trừ tiền mô phỏng, báo rõ giới hạn xuất; không tuyên bố mẫu chuẩn Bộ GDĐT |

Yêu cầu phi chức năng theo mục IX điều chỉnh ngày 17/11/2026: AES-256-GCM cho dữ liệu tuyển sinh nhạy cảm, băm mật khẩu có salt, kiểm tra phân quyền ở backend và lưu nhật ký; đăng nhập bằng mật khẩu, không bắt buộc 2FA/OTP. Cho phép HTTP tại localhost; yêu cầu HTTPS khi triển khai truy cập qua mạng, không bắt buộc chứng nhận riêng TLS 1.3 trong nghiệm thu đồ án.

Mục tiêu hiệu năng: 50 người dùng đồng thời, cần kiểm thử tải riêng và ghi biên bản cấu hình máy, dữ liệu, kịch bản, thời gian chạy, thời gian phản hồi và tỷ lệ lỗi. Chưa đo thì ghi chưa kiểm chứng; kiểm thử chức năng không chứng minh đạt mục tiêu tải.

Báo cáo dùng biểu mẫu đồ án dưới Excel/PDF/Word, không yêu cầu chứng nhận mẫu Bộ GDĐT. ERP/LMS và PKI không thuộc tiêu chí bắt buộc của mục VIII. Dịch vụ ngoài còn sử dụng ở các mục khác vẫn cần cấu hình/nghiệm thu riêng.
