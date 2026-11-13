# Yêu cầu đồ án — Quản lý tuyển sinh sau đại học

Nguồn yêu cầu: [đặc tả Word được cung cấp](DacTaTuyenSinh_Goc.md). Trạng thái và giới hạn triển khai: [bảng đối chiếu](../06_Documentation/07_DoiChieuDacTaTuyenSinh.md). Phần đào tạo được giữ làm đích bàn giao sau nhập học.

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
| TS15 | Thí sinh/Lãnh đạo | Công bố điểm tạm, nhận phúc khảo trong hạn; người xử lý không phải người chấm ban đầu |
| TS16 | Cán bộ | Tính điểm có quy đổi ngoại ngữ, xếp hạng theo chỉ tiêu/điểm sàn/tiêu chí phụ; dừng để xử lý khi vẫn hòa ranh giới |
| TS17 | Lãnh đạo | Duyệt Khoa → Phòng đào tạo → BGH, đúng quyền và ba người khác nhau; chỉ công bố sau cấp cuối |
| TS18 | Thí sinh | Xem kết quả, tải giấy báo, xác nhận nhập học và hoàn tất khoản phí trong hạn |
| TS19 | Cán bộ | Bàn giao sang CTĐT đã duyệt đúng ngành/trình độ, sinh MSHV, chuyển vai trò học viên và thu hồi phiên cũ |
| TS20 | Admin | Chuẩn bị đồng bộ ERP/LMS, chữ ký số và quản lý trạng thái tích hợp; không coi adapter là kết nối đã nghiệm thu |
| TS21 | Admin | Quản lý 6 vai trò, cấp/thu hồi quyền, khóa/xóa mềm; đăng nhập bằng mật khẩu; QR/OTP được loại theo phạm vi đồ án |
| TS22 | Quản lý | Xuất danh sách hồ sơ, trúng tuyển, doanh thu lệ phí theo phạm vi dưới Excel/PDF/Word |

Yêu cầu phi chức năng: AES-256 cho dữ liệu nhạy cảm; HTTPS/TLS 1.3; ít nhất 10.000 người dùng đồng thời; báo cáo phù hợp mẫu Bộ GDĐT. Đây là các yêu cầu cần đo/nghiệm thu riêng, không tự coi đạt từ kiểm thử chức năng. Hiện chưa có tài khoản dịch vụ; triển khai chuẩn bị tích hợp và kiểm thử nội bộ theo lựa chọn người dùng.
