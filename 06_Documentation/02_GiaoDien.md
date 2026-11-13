# Giao diện phiên bản tinh gọn

Giao diện dùng chung tông xanh đậm, nền sáng, font Be Vietnam Pro đóng gói tại dự án. Các màn hình giữ nguyên 7 mục quản trị và API nghiệp vụ hiện có.

- **Tổng quan:** tiêu đề và mô tả theo màn hình, banner, 4 thẻ số liệu, hoạt động gần đây và lối tắt. Số liệu lấy từ API `/management/overview`, không tạo số tăng trưởng hoặc biểu đồ giả. Sự kiện chưa có mô tả chuyên biệt được trình bày bằng nhãn cập nhật dữ liệu chung; nhật ký gốc trong SQL không bị sửa.
- **Điều hướng:** biểu tượng, mục đang chọn, thông tin tài khoản và menu trượt trên điện thoại. Điều hướng công khai có trạng thái trang hiện tại và nút mở/đóng menu.
- **Bảng và biểu mẫu:** ô tìm kiếm có biểu tượng, tổng số bản ghi, huy hiệu trạng thái, phân trang và hộp thoại thống nhất. Bảng rộng cuộn ngang trong vùng riêng trên điện thoại.
- **Trang chủ:** giới thiệu, minh họa bằng HTML/CSS, chương trình lấy từ API và hướng dẫn bắt đầu theo đúng phạm vi đồ án.
- **Đăng nhập:** bố cục hai phần trên máy tính, thu gọn trên điện thoại, biểu tượng trường nhập và hiện/ẩn mật khẩu. Không thêm đăng ký công khai hay thay cơ chế xác thực.
- **Khả năng sử dụng:** trạng thái focus, trường nhập/tải đang xử lý, hỗ trợ thiết lập giảm chuyển động của hệ điều hành, kiểm tra chiều rộng 390 px.

Các thành phần mới: `frontend/src/features/academic/overview.tsx`, stylesheet `frontend/src/app/visual-refresh.css`. Stylesheet được nạp sau các stylesheet chức năng để thống nhất màu, khoảng cách và thành phần. Trang đăng nhập, khung quản trị và điều hướng công khai được cập nhật trực tiếp.

Ảnh kiểm tra nằm tại `05_Testing/Frontend/visual-refresh/`. Báo cáo trực quan: `05_Testing/GiaoDien.json`; nghiệm thu nghiệp vụ: `05_Testing/NghiemThu_Loi.json`.

Truy cập http://localhost:3000. Nếu đang giữ trang cũ, tải lại bằng Ctrl+F5 rồi đăng nhập lại. Phiên đăng nhập tiếp tục được lưu trong bộ nhớ như trước.

## Kết quả kiểm tra

Hoàn tất 23:25 10/11/26 (giờ Việt Nam): build frontend production đạt; bộ nghiệm thu lõi **6/6 bước**, **30 unit test**, **12 nhóm SQL/API/Chrome** đạt. Kiểm tra trực quan bổ sung **17 nhóm** trên 1440×1000 và 390×844, không tràn ngang hoặc lỗi runtime trình duyệt. Đã thử menu công khai/quản trị, các mục quản trị và hiện/ẩn mật khẩu. Ảnh trang đăng nhập chụp khi chưa nhập thông tin xác thực; không ghi mật khẩu/token vào báo cáo.

Nhãn chương trình từ dữ liệu minh họa cũ đã được bỏ khỏi thẻ chương trình trên trang chủ, trang tra cứu và trang chi tiết. Bộ định dạng chỉ làm gọn tên/mã/khóa khi hiển thị; giữ nguyên ID, dữ liệu SQL và cơ chế khóa phiên bản đã duyệt. Đã build frontend và kiểm tra thực tế danh sách/chi tiết trên localhost.
