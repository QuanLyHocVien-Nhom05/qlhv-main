# DANH SÁCH USER STORIES - PHÂN HỆ QUẢN LÝ TUYỂN SINH SAU ĐẠI HỌC

---

### US01: Đăng ký hồ sơ dự tuyển trực tuyến
* **As a (Vai trò):** Thí sinh dự tuyển Sau Đại học
* **I want to (Muốn):** Đăng ký thông tin cá nhân, tải lên văn bằng, chứng chỉ ngoại ngữ và nộp hồ sơ trực tuyến.
* **So that (Để):** Tiết kiệm thời gian và không cần nộp hồ sơ giấy trực tiếp tại trường ở giai đoạn khởi đầu.
* **Acceptance Criteria (AC):**
  - Form đăng ký đầy đủ các trường: Thông tin cá nhân, Ngành đăng ký, Văn bằng đại học, Chứng chỉ ngoại ngữ.
  - Cho phép upload định dạng PDF/JPG cho giấy tờ đính kèm (dung lượng max 5MB/file).
  - Hệ thống tự động phát sinh Mã hồ sơ và gửi email xác nhận nộp thành công.

---

### US02: Duyệt và thẩm định hồ sơ tuyển sinh
* **As a (Vai trò):** Cán bộ Quản lý Tuyển sinh
* **I want to (Muốn):** Mở danh sách, đối soát thông tin giấy tờ và phê duyệt hoặc yêu cầu bổ sung hồ sơ.
* **So that (Để):** Lập danh sách thí sinh đủ điều kiện dự thi/xét tuyển chính thức.
* **Acceptance Criteria (AC):**
  - Cung cấp bộ lọc hồ sơ theo trạng thái: *Chờ duyệt*, *Đã duyệt*, *Cần bổ sung*, *Bị từ chối*.
  - Cho phép xem file đính kèm trực tiếp trên giao diện duyệt.
  - Tự động gửi thông báo Email/Notification cho thí sinh kèm lý do nếu từ chối hoặc yêu cầu sửa đổi.

---

### US03: Quản lý danh sách phòng thi & Hội đồng tuyển sinh
* **As a (Vai trò):** Cán bộ Quản lý Tuyển sinh
* **I want to (Muốn):** Sắp xếp danh sách thí sinh vào các phòng thi và phân công Hội đồng chấm thi/xét tuyển.
* **So that (Để):** Tổ chức kỳ thi/xét tuyển minh bạch, đúng quy chế.
* **Acceptance Criteria (AC):**
  - Tự động chia phòng thi theo SBD và số lượng thí sinh/phòng tối đa.
  - Cho phép gán thành viên Hội đồng tuyển sinh vào từng phòng thi/môn thi.
  - Xuất danh sách phòng thi và thẻ dự thi ra file PDF/Excel.

---

### US04: Tra cứu kết quả trúng tuyển
* **As a (Vai trò):** Thí sinh dự tuyển
* **I want to (Muốn):** Nhập Mã hồ sơ hoặc CCCD để tra cứu điểm thi và trạng thái trúng tuyển.
* **So that (Để):** Biết kết quả kịp thời và nhận hướng dẫn làm thủ tục nhập học.
* **Acceptance Criteria (AC):**
  - Trang tra cứu công khai, yêu cầu nhập chính xác CCCD/Mã hồ sơ để bảo mật thông tin.
  - Hiển thị chi tiết điểm thi từng môn/điểm xét tuyển và kết quả *Trúng tuyển* / *Không trúng tuyển*.
  - Cho phép tải Giấy báo trúng tuyển điện tử (file PDF có mã QR xác thực).
