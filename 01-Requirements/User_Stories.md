# DANH SÁCH USER STORIES - PHÂN HỆ QUẢN LÝ TUYỂN SINH SAU ĐẠI HỌC

---

## 1. Nhóm chức năng dành cho Thí sinh

### US-01: Đăng ký và nộp hồ sơ trực tuyến
* **Vai trò (As a):** Thí sinh dự tuyển Sau Đại học
* **Mong muốn (I want to):** Đăng ký thông tin cá nhân, tải lên văn bằng, chứng chỉ và nộp hồ sơ trực tuyến.
* **Mục đích (So that):** Tiết kiệm thời gian và không cần nộp hồ sơ giấy trực tiếp tại trường.
* **Tiêu chí chấp nhận (AC):**
  * Form đăng ký đầy đủ các trường: Thông tin cá nhân, Ngành đăng ký, Văn bằng ĐH, Ngoại ngữ.
  * Cho phép upload định dạng PDF/JPG (dung lượng tối đa 5MB/file).
  * Tự động phát sinh Mã hồ sơ và gửi email xác nhận nộp thành công.

### US-02: Theo dõi trạng thái hồ sơ
* **Vai trò (As a):** Thí sinh dự tuyển
* **Mong muốn (I want to):** Theo dõi trạng thái duyệt hồ sơ (Đã nhận, Cần bổ sung, Đã duyệt).
* **Mục đích (So that):** Kịp thời bổ sung giấy tờ còn thiếu theo yêu cầu của Giáo vụ.

### US-03: Tra cứu lịch thi
* **Vai trò (As a):** Thí sinh dự tuyển
* **Mong muốn (I want to):** Tra cứu số báo danh, phòng thi và lịch thi tuyển sinh.
* **Mục đích (So that):** Chuẩn bị đi thi đúng giờ và đúng địa điểm.

### US-04: Tra cứu kết quả trúng tuyển
* **Vai trò (As a):** Thí sinh dự tuyển
* **Mong muốn (I want to):** Nhập Mã hồ sơ hoặc số CCCD để tra cứu điểm thi và kết quả.
* **Mục đích (So that):** Biết kết quả kịp thời và nhận hướng dẫn làm thủ tục nhập học.
* **Tiêu chí chấp nhận (AC):**
  * Giao diện tra cứu công khai, yêu cầu nhập chính xác CCCD/Mã hồ sơ để bảo mật.
  * Hiển thị chi tiết điểm thi từng môn và trạng thái Trúng tuyển/Không trúng tuyển.
  * Cho phép tải Giấy báo trúng tuyển điện tử (file PDF có mã QR).

---

## 2. Nhóm chức năng dành cho Cán bộ / Giáo vụ

### US-05: Tạo đợt tuyển sinh mới
* **Vai trò (As a):** Giáo vụ
* **Mong muốn (I want to):** Tạo đợt tuyển sinh mới (chỉ tiêu, ngành, thời hạn nhận hồ sơ).
* **Mục đích (So that):** Mở cổng đăng ký trực tuyến cho thí sinh đúng kế hoạch.

### US-06: Xem danh sách hồ sơ cần duyệt
* **Vai trò (As a):** Cán bộ Tuyển sinh
* **Mong muốn (I want to):** Xem danh sách hồ sơ thí sinh đã nộp.
* **Mục đích (So that):** Kiểm tra điều kiện văn bằng và chứng chỉ đầu vào.

### US-07: Duyệt và thẩm định hồ sơ
* **Vai trò (As a):** Cán bộ Tuyển sinh
* **Mong muốn (I want to):** Đối soát giấy tờ, phê duyệt hoặc gửi yêu cầu bổ sung.
* **Mục đích (So that):** Lập danh sách thí sinh đủ điều kiện dự thi chính thức.
* **Tiêu chí chấp nhận (AC):**
  * Có bộ lọc hồ sơ theo trạng thái: Chờ duyệt, Đã duyệt, Cần bổ sung, Từ chối.
  * Cho phép xem file đính kèm trực tiếp trên giao diện duyệt.
  * Tự động gửi thông báo Email cho thí sinh kèm lý do nếu từ chối hoặc cần bổ sung.

### US-08: Quản lý phòng thi & Hội đồng
* **Vai trò (As a):** Cán bộ Quản lý Tuyển sinh
* **Mong muốn (I want to):** Xếp thí sinh vào phòng thi và phân công Hội đồng chấm thi.
* **Mục đích (So that):** Tổ chức kỳ thi minh bạch, đúng quy chế.
* **Tiêu chí chấp nhận (AC):**
  * Tự động chia phòng thi theo SBD và số lượng thí sinh/phòng tối đa.
  * Cho phép gán thành viên Hội đồng vào từng phòng thi/môn thi.
  * Xuất danh sách phòng thi và thẻ dự thi ra file định dạng PDF/Excel.

### US-09: Xuất danh sách trúng tuyển
* **Vai trò (As a):** Giáo vụ
* **Mong muốn (I want to):** Xuất danh sách thí sinh trúng tuyển.
* **Mục đích (So that):** Chuyển thông tin sang Phân hệ Quản lý Học viên để làm thủ tục.
