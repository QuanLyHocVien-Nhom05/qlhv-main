# ĐẶC TẢ CHI TIẾT QUY TRÌNH & NGHIỆP VỤ HỆ THỐNG QUẢN LÝ TUYỂN SINH SAU ĐẠI HỌC

## I. Tổng quan Kiến trúc và Mục tiêu Vận hành
Hệ thống Quản lý Tuyển sinh Sau Đại học được xây dựng nhằm tự động hóa và tối ưu hóa toàn bộ vòng đời tuyển sinh từ khâu lập kế hoạch đợt tuyển, tiếp nhận hồ sơ trực tuyến, sơ tuyển thông minh bằng trí tuệ nhân tạo, tổ chức thi tuyển/xét tuyển, cho đến khâu công bố kết quả và chuyển giao dữ liệu nhập học. Hệ thống đóng vai trò là cầu nối thông tin tập trung giữa Thí sinh, Cán bộ tuyển sinh, Giáo vụ khoa, Hội đồng chấm thi và Ban Báo cáo/Ban Giám hiệu nhà trường.

## II. Khởi tạo Đợt tuyển sinh và Thiết lập Cấu hình Tham số
Trước khi chính thức mở cổng thông tin tiếp nhận hồ sơ, Cán bộ Quản trị hệ thống hoặc Phòng Đào tạo Sau Đại học tiến hành cấu hình các tham số vận hành cho đợt tuyển sinh mới:
* **Cấu hình Ngành và Chỉ tiêu:** Thiết lập cây danh mục bao gồm các ngành, chuyên ngành đào tạo trình độ Thạc sĩ và Tiến sĩ. Tương ứng với từng ngành, cán bộ định cấu hình chi tiết chỉ tiêu tuyển sinh chia theo từng phương thức (thi tuyển truyền thống, xét tuyển hồ sơ năng lực, xét tuyển thẳng đối với sinh viên tốt nghiệp đại học loại Giỏi/Xuất sắc).
* **Khung thời gian và Tiến độ:** Lập lịch trình vận hành tự động cho hệ thống bao gồm: ngày giờ chính thức mở và đóng cổng đăng ký trực tuyến, thời hạn cán bộ thẩm định hồ sơ, thời gian cho phép ứng viên bổ sung các giấy tờ còn thiếu, lịch thi tuyển/xét tuyển và thời điểm dự kiến công bố kết quả.
* **Bộ quy tắc Xét tuyển và Lệ phí:** Cấu hình danh mục các chứng chỉ ngoại ngữ quốc tế và trong nước (IELTS, TOEFL iBT, VSTEP...) cùng khung điểm quy đổi tương đương. Thiết lập danh mục ngành đúng, ngành gần để tự động xác định các môn học cần học bổ sung kiến thức. Đồng thời, cấu hình định mức lệ phí xét tuyển/dự thi và tích hợp cổng thanh toán trực tuyến (VNPAY, MoMo, Ngân hàng).

## III. Quy trình Nộp hồ sơ Trực tuyến của Ứng viên
Ứng viên truy cập Cổng thông tin tuyển sinh trực tuyến và bắt đầu quy trình bằng việc khởi tạo tài khoản thông qua số CCCD/Hộ chiếu và Email cá nhân:
* **Khai báo Hồ sơ Điện tử:** Ứng viên hoàn thành sơ yếu lý lịch trực tuyến, thông tin quá trình đào tạo đại học (trường cấp bằng, ngành học, xếp loại tốt nghiệp, điểm trung bình tích lũy GPA), thông tin việc làm hiện tại, đối tượng ưu tiên (nếu có) và ngành/chuyên ngành mong muốn dự tuyển.
* **Tải lên Tài liệu Minh chứng:** Ứng viên tải lên các tệp tài liệu số định dạng PDF hoặc hình ảnh chất lượng cao (dung lượng mỗi tệp không vượt quá 10MB). Các tài liệu bắt buộc bao gồm: Bằng tốt nghiệp đại học, Bảng điểm toàn khóa, Chứng chỉ ngoại ngữ, Lý lịch khoa học, Giấy khám sức khỏe, Văn bản đồng ý của cơ quan công tác và Đề cương nghiên cứu sơ bộ (đối với ứng viên dự tuyển Tiến sĩ).
* **Thanh toán Lệ phí Xét tuyển:** Sau khi hoàn tất điền thông tin và tải tài liệu, ứng viên chọn phương thức thanh toán trực tuyến. Khi giao dịch thành công, hệ thống tự động gạch nợ trên cơ sở dữ liệu, cấp mã biên lai điện tử và chuyển trạng thái hồ sơ sang "Đã nộp & Đã thanh toán".

## IV. Cơ chế Sơ tuyển & Tự động hóa bằng AI/OCR
Ngay khi hồ sơ được tải lên thành công, hệ thống lập tức kích hoạt tiến trình xử lý ngầm nhằm hỗ trợ cán bộ tuyển sinh giảm tải thời gian rà soát thủ công:
* **Nhận dạng và Trích xuất Dữ liệu (OCR):** Công nghệ OCR/AI tự động quét các tệp hình ảnh/PDF của Bằng tốt nghiệp, Bảng điểm và Chứng chỉ ngoại ngữ để trích xuất các trường thông tin cốt lõi như Họ tên, Ngày sinh, Số hiệu văn bằng, Ngày cấp, Tên trường cấp và Mức điểm/Xếp loại.
* **Đối soát Dữ liệu Tự động:** Hệ thống tiến hành so sánh dữ liệu bóc tách được từ OCR với dữ liệu do ứng viên tự khai báo trong biểu mẫu. Nếu phát hiện chênh lệch (ví dụ: sai lệch họ tên, điểm chứng chỉ khai cao hơn điểm thực tế trên bản quét), hệ thống sẽ đánh dấu cờ cảnh báo (Flag warning).
* **Phân loại Hồ sơ Tự động:** Dựa trên bộ quy tắc đã cấu hình ở Mục II, hệ thống kiểm tra thời hạn hiệu lực của chứng chỉ ngoại ngữ (không quá 2 năm tính đến ngày nộp), đối chiếu điều kiện bằng cấp đại học và tự động xếp hồ sơ vào các luồng xử lý: Hồ sơ hợp lệ, Hồ sơ thiếu tài liệu, Hồ sơ không đáp ứng điều kiện, hoặc Hồ sơ cần kiểm tra thủ công.

## V. Quy trình Thẩm định và Xử lý Hồ sơ của Cán bộ Tuyển sinh
Cán bộ Tuyển sinh đăng nhập vào phân hệ quản trị để xử lý danh sách hồ sơ thuộc luồng quản lý của mình:
* **Rà soát và Phê duyệt:** Cán bộ kiểm tra lại các trường thông tin bị hệ thống đánh dấu cảnh báo. Đối với các hồ sơ đầy đủ minh chứng hợp lệ, cán bộ thực hiện thao tác Phê duyệt chính thức để đưa thí sinh vào danh sách đủ điều kiện thi tuyển/xét tuyển.
* **Yêu cầu Bổ sung/Chỉnh sửa:** Khi phát hiện tài liệu bị mờ, thiếu dấu giáp lai hoặc khai báo chưa chính xác, cán bộ chọn lý do từ mẫu quy chuẩn và gửi yêu cầu bổ sung. Hệ thống tự động gửi Email và tin nhắn SMS thông báo cho ứng viên, đồng thời mở lại quyền chỉnh sửa trên tài khoản ứng viên trong một khoảng thời gian giới hạn (ví dụ: 5 ngày làm việc).
* **Nhật ký Thẩm định (Audit Log):** Tất cả các thao tác duyệt, từ chối, yêu cầu chỉnh sửa hoặc thay đổi trạng thái hồ sơ đều được hệ thống ghi lại lịch sử chi tiết (bao gồm tài khoản cán bộ thực hiện, thời gian chính xác và địa chỉ IP) để đảm bảo tính minh bạch.

## VI. Tổ chức Thi tuyển, Lập Hội đồng & Xếp lịch Thi
Sau khi chốt danh sách ứng viên hợp lệ, Cán bộ Giáo vụ tiến hành các thao tác tổ chức thi và hội đồng đánh giá:
* **Đánh Số báo danh và Phân phòng Thi:** Hệ thống tự động khởi tạo Số báo danh (SBD) theo cấu trúc quy định của nhà trường. Thuật toán phân phòng thi sẽ căn cứ vào chỉ tiêu sức chứa của các phòng học/phòng thi thực tế để xếp thí sinh vào từng ca thi, phòng thi một cách tối ưu, tránh tình trạng quá tải hoặc trùng lặp.
* **Thành lập Hội đồng & Phân công:** Giáo vụ khởi tạo các Hội đồng thi, Hội đồng chấm thi chuyên ngành, hoặc Hội đồng đánh giá Đề cương nghiên cứu Tiến sĩ. Phân công nhiệm vụ cụ thể cho từng Cán bộ coi thi, Cán bộ chấm thi và Chủ tịch/Thư ký hội đồng.
* **Phát hành Giấy báo Dự thi:** Hệ thống tự động xuất bộ Danh sách điểm danh phòng thi (cho cán bộ coi thi) và tạo Giấy báo dự thi điện tử (có tích hợp Mã QR xác thực) cho từng thí sinh. Thí sinh đăng nhập tài khoản để tra cứu thông tin phòng thi, ca thi và tải giấy báo dự thi về máy.

## VII. Quản lý Điểm, Phúc khảo & Xét trúng tuyển Đa tầng
* **Nhập điểm & Mã hóa Bài thi:** Cán bộ chuyên trách nhập điểm thi hoặc điểm đánh giá hồ sơ năng lực vào hệ thống theo hai hình thức: nhập trực tiếp trên giao diện web hoặc tải lên bằng file Excel theo mẫu. Hệ thống mã hóa số rọc rọc để đảm bảo nguyên tắc bảo mật và khách quan trong quá trình chấm thi.
* **Tiếp nhận & Xử lý Phúc khảo:** Sau khi công bố điểm thi tạm thời, ứng viên có thể nộp đơn xin phúc khảo trực tuyến trên cổng thông tin trong thời hạn quy định. Hệ thống chuyển danh sách phúc khảo cho Hội đồng chấm lại và cập nhật điểm điều chỉnh sau khi có kết quả chính thức.
* **Tính điểm & Xét tuyển Tự động:** Hệ thống tự động tính Tổng điểm xét tuyển theo công thức cấu hình (kết hợp điểm bài thi cơ sở, bài thi chuyên ngành, điểm ngoại ngữ quy đổi và điểm ưu tiên). Hệ thống sắp xếp danh sách theo thứ tự tổng điểm từ cao xuống thấp, tự động xử lý các trường hợp bằng điểm bằng tiêu chí phụ và đề xuất Danh sách Dự kiến Trúng tuyển dựa trên chỉ tiêu đã cài đặt.
* **Quy trình Phê duyệt Đa tầng:** Danh sách dự kiến trúng tuyển được chuyển trình duyệt lần lượt qua các cấp: Trưởng Khoa/Viện -> Trưởng phòng Đào tạo -> Ban Giám hiệu ký duyệt trực tiếp trên hệ thống trước khi chính thức công bố.

## VIII. Nhập học và Đồng bộ Dữ liệu Sang Hệ thống Đào tạo (ERP/LMS)
* **Thông báo Kết quả & Giấy báo Trúng tuyển:** Hệ thống phát thông báo kết quả thi/xét tuyển qua Email và SMS. Thí sinh trúng tuyển có thể tải Giấy báo trúng tuyển điện tử có chữ ký số và tem xác thực của nhà trường.
* **Xác nhận Nhập học Trực tuyến:** Thí sinh trúng tuyển thực hiện xác nhận nhập học trực tuyến và đóng tiền học phí, lệ phí nhập học kỳ đầu tiên thông qua cổng thanh toán tích hợp.
* **Chuyển giao và Khởi tạo Học viên:** Khi thủ tục nhập học hoàn tất, hệ thống tự động sinh Mã số Học viên (MSHV) theo định dạng chuẩn của trường, đồng thời đẩy toàn bộ dữ liệu hồ sơ cá nhân, kết quả tuyển sinh sang Phân hệ Quản lý Đào tạo (ERP/LMS). Dữ liệu này sẽ được dùng để tự động xếp lớp học phần, cấp tài khoản học tập trực tuyến và phân công Cán bộ hướng dẫn khoa học cho tân học viên cao học/nghiên cứu sinh.

## IX. Yêu cầu Phi chức năng, Bảo mật và Báo cáo Thống kê
* **Bảo mật và An toàn Dữ liệu:** Toàn bộ dữ liệu cá nhân nhạy cảm (CCCD, Bảng điểm, Số điện thoại) được mã hóa lưu trữ theo chuẩn AES-256. Giao tiếp giữa Client và Server bắt buộc qua giao thức bảo mật HTTPS/TLS 1.3. Áp dụng xác thực hai yếu tố (2FA) bắt buộc đối với các tài khoản cán bộ quản trị và hội đồng.
* **Hiệu năng và Khả năng Mở rộng:** Cấu trúc hệ thống đảm bảo khả năng đáp ứng đồng thời tối thiểu 10.000 người dùng (Concurrent Users) trong các khoảng thời gian cao điểm như thời điểm sắp đóng cổng nộp hồ sơ hoặc thời điểm công bố kết quả thi.
* **Báo cáo Thống kê:** Cung cấp công cụ xuất báo cáo động. Cho phép Cán bộ quản lý xuất các biểu mẫu thống kê tuyển sinh, danh sách trúng tuyển, báo cáo doanh thu lệ phí theo chuẩn quy định của Bộ Giáo dục và Đào tạo dưới các định dạng Excel, PDF, Word chỉ với một thao tác.
