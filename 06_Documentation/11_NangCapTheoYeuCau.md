# Rà soát chức năng theo 01-Requirements

Ngày rà soát: 12/11/2026. Nguồn: `Đactahethong.md`, `User_Stories.md` và `DacTaTuyenSinh_Goc.md` trong `01-Requirements`.

## Phạm vi giữ lại và loại bỏ

Tuyển sinh sau đại học là nghiệp vụ chính. Giữ CTĐT, học tập, đề tài, bảo vệ và tốt nghiệp vì đặc tả hiện hành yêu cầu các module này tiếp nhận học viên sau nhập học. Giữ sáu vai trò Admin, Cán bộ, Lãnh đạo, Giảng viên/Hội đồng, Thí sinh, Học viên.

Đăng nhập QR/OTP và các endpoint tương ứng đã được loại khỏi hệ thống theo TS21. QR xác thực giấy báo vẫn thuộc TS13 và TS18. Kiểm thử nghiệm thu kiểm tra các endpoint và trang đã loại trả về 404.

## Các điều chỉnh lần này

| Yêu cầu | Điều chỉnh |
|---|---|
| TS02–TS03 | Khóa thêm quy tắc quy đổi ngoại ngữ/ngành đầu vào ngay khi đợt rời trạng thái nháp, kể cả chưa có thí sinh nộp. |
| TS05 | Chặn GPA/điểm không hữu hạn, thang GPA sai kiểu và xếp loại ngoài danh mục. |
| TS06–TS07 | Chặn đính kèm bản nháp ngoài thời gian nhận hồ sơ; chỉ mở bổ sung trong hạn và khi đợt chưa chốt. Giao diện dùng cùng điều kiện thời gian. Chặn nộp thiếu tài liệu ngay cả khi hồ sơ đồng thời không đạt GPA/chứng chỉ. |
| TS10 | Bổ sung năm mẫu lý do: tài liệu mờ, thiếu xác nhận, thiếu minh chứng, sai thông tin, hết hiệu lực. Yêu cầu bổ sung phải chọn mẫu và có hướng dẫn cụ thể. Kiểm tra hạn có múi giờ, chuẩn hóa về UTC, không nhận hạn sai định dạng. Lịch sử hiển thị cán bộ/thời điểm/lý do; IP chỉ trả cho cán bộ đúng phạm vi. |
| TS14–TS15 | Công bố điểm tạm bị chặn khi còn hồ sơ đủ điều kiện chưa có điểm. Sau công bố, khóa nhập điểm trực tiếp/Excel; điều chỉnh qua phúc khảo. Nhận/xử lý phúc khảo bị khóa khi danh sách đã chốt. |
| TS16–TS17 | Chỉ chốt xếp hạng sau khi công bố điểm tạm, đóng đợt và hết hạn phúc khảo. Bổ sung API/giao diện xem danh sách trình duyệt: thí sinh, ngành/phương thức, tổng điểm, tiêu chí phụ, chỉ tiêu, điểm sàn, thứ hạng, dự kiến trúng tuyển và lịch sử ba cấp duyệt. |
| TS18 | Kiểm tra lại hạn và trạng thái ngay khi xác nhận nhập học; chặn khởi tạo thanh toán phí nhập học sau hạn. Giao diện ẩn thao tác đã hết hạn và đơn phúc khảo đã gửi. |

Mẫu lý do hiện là danh mục nghiệp vụ trong mã, chưa phải danh mục do trường phê duyệt hoặc chức năng quản trị mẫu tùy ý.

## Kiểm chứng

Chạy `npm run test:acceptance` từ `03-SourceCode`. Kết quả thực tế được ghi tại `05_Testing/NghiemThu_Loi.json`. Bộ kiểm thử bao gồm TypeScript hai phía, unit test, build backend và SQL/API/Chrome trên database tạm; không sửa dữ liệu thật để đi qua các mốc nghiệp vụ.

Các kiểm tra bổ sung bao gồm khóa quy tắc sau mở đợt; khóa sửa/nộp/đính kèm quá hạn; yêu cầu mẫu lý do và hạn bổ sung hợp lệ; sửa và nộp bổ sung không thu lại phí; lịch sử cán bộ/IP theo quyền; chặn công bố khi chưa đủ điểm; chặn nhập điểm sau công bố; giới hạn người xem danh sách trình duyệt; kiểm tra danh sách xếp hạng, ba cấp duyệt và hạn thanh toán nhập học.

## Phần cần dịch vụ hoặc nghiệm thu riêng

Theo lựa chọn được ghi trong đặc tả hiện hành, chưa có tài khoản nhà cung cấp: MoMo/ngân hàng, chữ ký số PKI, OCR đầy đủ và ERP/LMS vẫn cần tích hợp/đối soát thực tế. HTTPS/TLS 1.3, tải 10.000 người đồng thời và mẫu báo cáo Bộ GDĐT cần triển khai và đo riêng. Không kết luận các mục này đạt từ kiểm thử nội bộ. Xem `07_DoiChieuDacTaTuyenSinh.md` và `08_TichHopTuyenSinh.md` để biết giới hạn chi tiết, gồm mô hình một ca đánh giá cho mỗi hồ sơ và bước chọn CTĐT đích khi bàn giao.
