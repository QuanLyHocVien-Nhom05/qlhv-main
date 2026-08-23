# DANH SÁCH USER STORIES - PHÂN HỆ QUẢN LÝ TUYỂN SINH SAU ĐẠI HỌC

---
## 1. Dành cho Thí sinh Sau Đại học
* **As a (Vai trò):** Thí sinh dự tuyển Sau Đại học
* **I want to (Muốn):** Đăng ký thông tin cá nhân, tải lên văn bằng, chứng chỉ ngoại ngữ và nộp hồ sơ trực tuyến.
  * **US-01:** Là **Thí sinh**, tôi muốn **theo dõi trạng thái duyệt hồ sơ** (Đã nhận, Cần bổ sung, Đã duyệt) để **kịp thời bổ sung giấy tờ còn thiếu**.
  * **US-02:** Là **Thí sinh**, tôi muốn **tra cứu số báo danh, phòng thi và lịch thi tuyển sinh SĐH** để **chuẩn bị đi thi đúng giờ**.
  * **US-03:** Là **Thí sinh**, tôi muốn **tra cứu điểm thi và kết quả trúng tuyển bằng CCCD/Mã hồ sơ** để **biết mình có trúng tuyển hay không**.

   ## 2. Dành cho Cán bộ Tuyển sinh / Giáo vụ
* **US-04:** Là **Cán bộ Tuyển sinh**, tôi muốn **xem danh sách hồ sơ cần duyệt** để **kiểm tra điều kiện văn bằng và chứng chỉ ngoại ngữ đầu vào**.
* **US-05:** Là **Cán bộ Tuyển sinh**, tôi muốn **phê duyệt hoặc gửi yêu cầu bổ sung hồ sơ** để **hoàn thiện danh sách thí sinh đủ điều kiện dự thi**.
* **US-06:** Là **Giáo vụ**, tôi muốn **tạo đợt tuyển sinh mới (định nghĩa chỉ tiêu, ngành tuyển sinh, thời hạn nhận hồ sơ)** để **mở cổng đăng ký cho thí sinh**.
* **US-07:** Là **Giáo vụ**, tôi muốn **xuất danh sách thí sinh trúng tuyển** để **chuyển thông tin sang Phân hệ Quản lý Học viên**.

* **So that (Để):** Tiết kiệm thời gian và không cần nộp hồ sơ giấy trực tiếp tại trường ở giai đoạn khởi đầu.
* **Acceptance Criteria (AC):**
  - Form đăng ký đầy đủ các trường: Thông tin cá nhân, Ngành đăng ký, Văn bằng đại học, Chứng chỉ ngoại ngữ.
  - Cho phép upload định dạng PDF/JPG cho giấy tờ đính kèm (dung lượng max 5MB/file).
  - Hệ thống tự động phát sinh Mã hồ sơ và gửi email xác nhận nộp thành công.

---

## 3. Duyệt và thẩm định hồ sơ tuyển sinh
* **As a (Vai trò):** Cán bộ Quản lý Tuyển sinh
* **I want to (Muốn):** Mở danh sách, đối soát thông tin giấy tờ và phê duyệt hoặc yêu cầu bổ sung hồ sơ.
* **So that (Để):** Lập danh sách thí sinh đủ điều kiện dự thi/xét tuyển chính thức.
* **Acceptance Criteria (AC):**
  - Cung cấp bộ lọc hồ sơ theo trạng thái: *Chờ duyệt*, *Đã duyệt*, *Cần bổ sung*, *Bị từ chối*.
  - Cho phép xem file đính kèm trực tiếp trên giao diện duyệt.
  - Tự động gửi thông báo Email/Notification cho thí sinh kèm lý do nếu từ chối hoặc yêu cầu sửa đổi.

---
