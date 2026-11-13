# Phân quyền và các phân hệ đào tạo

Theo yêu cầu mở rộng ngày 12/11/2026, hệ thống bổ sung lại các nghiệp vụ trong ảnh tham chiếu. Database hiện có **26 bảng**, sử dụng 4 schema hiện hành; các bảng nghiên cứu mới nằm trong `hoc_thuat`, không phục hồi toàn bộ 75 bảng cũ.

## Cấp vai trò

Đăng nhập `admin` → **Tài khoản → Danh sách tài khoản → Phân quyền**. Chọn một vai trò, cập nhật thông tin người dùng và đơn vị/học vị nếu là cán bộ, rồi lưu. Khi tạo tài khoản mới cũng có đủ 5 lựa chọn.

| Vai trò giao diện | Mã SQL / phiên đăng nhập | Quyền chính |
| --- | --- | --- |
| Quản trị viên | ADMIN / ACADEMIC_ADMIN | Quản lý toàn bộ, tài khoản, cấu hình, nhật ký, điều chỉnh điểm |
| Lãnh đạo | LANH_DAO / LEADER | Xem nghiệp vụ và báo cáo; phê duyệt CTĐT, đề tài, hội đồng; xác nhận hoàn thành đào tạo |
| Cán bộ đào tạo | CAN_BO / OFFICER | Chuẩn bị danh mục, CTĐT, lớp, học viên, đề tài, hội đồng, minh chứng; nhập/xuất Excel; không tự phê duyệt hoặc cấp quyền |
| Giảng viên | GIANG_VIEN / LECTURER | Tra cứu học phần/CTĐT; xem lớp và chấm điểm được phân công; cập nhật đề tài mình hướng dẫn; xem hội đồng tham gia/hướng dẫn |
| Học viên | USER / STUDENT | Xem chương trình, đăng ký học phần, điểm, đề tài, lịch bảo vệ và điều kiện tốt nghiệp của bản thân |

Đơn vị công tác là thông tin tổ chức. Lãnh đạo và cán bộ trong phiên bản này được cấp quyền nghiệp vụ chung toàn hệ thống; giảng viên được giới hạn theo phân công, học viên theo chính chủ. Không dùng đơn vị công tác để giả định thêm phạm vi bảo mật chưa được cấu hình.

Không thay đổi vai trò hay mật khẩu của `admin` và `khanh` trong lần nâng cấp. Không tạo thêm tài khoản thử trên database thật. Đổi vai trò, khóa/xóa tài khoản, đổi mật khẩu và đăng xuất sẽ thu hồi phiên cũ. Tài khoản cán bộ cần hồ sơ cán bộ đang hoạt động; admin tiếp tục bị giới hạn đăng nhập localhost như trước.

## Các chức năng được bổ sung/nâng cấp

- **Danh mục:** khoa/đơn vị và đơn vị cha, ngành và CTĐT liên kết, trạng thái hoạt động, sửa/xóa danh mục chưa sử dụng. Chu trình đơn vị cha bị chặn.
- **Học phần:** tên tiếng Anh, đơn vị quản lý, tín chỉ tham khảo, trạng thái; lưu phiên bản nội dung mới và lịch sử. Khung chương trình đã duyệt giữ tên/tín chỉ đã chụp trước đó.
- **CTĐT:** bảng từng phiên bản với bậc đào tạo, đơn vị, khóa, định mức, trạng thái, bộ lọc và xem đầy đủ; quyền soạn thảo và phê duyệt được tách riêng.
- **Lớp quản lý:** gắn phiên bản đã duyệt, khóa, khoa và trạng thái tiếp nhận; gán học viên có cùng phiên bản. Không xóa lớp đã có học viên. Lớp học phần vẫn là nghiệp vụ riêng.
- **Đề tài/GVHD:** đề tài nháp, phân công, lãnh đạo phê duyệt, giảng viên báo cáo tiến độ/nghiệm thu, hồ sơ người đang hướng dẫn.
- **Hội đồng/bảo vệ:** lập lịch cho đề tài đã nghiệm thu, phân công thành viên, duyệt và ghi kết quả. Quy tắc phần mềm hiện tại yêu cầu ít nhất 3 thành viên, đúng 1 chủ tịch và có phản biện; GVHD không làm phản biện đề tài của mình. Đây là quy tắc triển khai, không phải tuyên bố quy định chính thức của trường.
- **Xét tốt nghiệp:** quy định theo phiên bản và số văn bản, minh chứng ngoại ngữ có xác minh/hạn dùng, đối chiếu học phần bắt buộc, tín chỉ, GPA và bảo vệ; lưu lịch sử kiểm tra. Thiếu quy định/minh chứng hiển thị thiếu thông tin, không tự suy đoán chuẩn B2/IELTS. Kết quả đối chiếu và xác nhận hoàn thành không thay thế quy trình cấp bằng.
- **Cổng thông tin:** quản lý văn bản, công bố/ẩn và mở đường dẫn HTTPS; đăng ký tư vấn có sự đồng ý, cán bộ theo dõi liên hệ. Trang công khai `/thong-tin` chỉ hiện văn bản đã công bố và đến ngày ban hành.
- **Cấu hình:** điểm đạt tham khảo và chuẩn ngoại ngữ tham khảo; tải Excel có giá trị hiện tại, xem trước, lưu có revision. Không tự sửa điều kiện của CTĐT đã duyệt.
- **Excel:** tải mẫu, xem trước rồi xác nhận nhập cho đơn vị, ngành, học phần, học viên, lớp học phần, lớp quản lý và cấu hình. Nhập tối đa 100 dòng/2 MB, lưu nguyên lô trong transaction. Các cột khóa ngoại dùng ID từ các danh mục tương ứng. Xuất dữ liệu theo bộ lọc tối đa 10.000 dòng, kể cả nhật ký với quyền admin.
- **Nhật ký:** tra cứu người thực hiện, hành động, thời điểm, chi tiết và IP khi được ghi nhận. Đăng nhập/đăng xuất được ghi nhật ký; không ghi mật khẩu hoặc mã khôi phục.
- **Hồ sơ cá nhân:** `/nghien-cuu` cung cấp đề tài, bảo vệ và đối chiếu tốt nghiệp thuộc chính tài khoản học viên.

## Nâng cấp và kiểm thử

Chạy `npm run setup:local` để áp dụng `08_NangCapDaoTao.sql` sau các file 01–06. Không chạy lại `01_CauTruc.sql` trên database đã có dữ liệu. Trước lần nâng cấp thực tế đã tạo backup COPY_ONLY/CHECKSUM và xác minh bằng RESTORE VERIFYONLY; đường dẫn tại `05_Testing/NangCapPhanQuyen.json`.

Kiểm thử bằng `npm run test:acceptance`: TypeScript, unit, build và SQL/API/Chrome trên database tạm. Bao gồm phân quyền API, phạm vi giảng viên, quyền chính chủ, thu hồi token khi đổi quyền, luồng đề tài/bảo vệ/tốt nghiệp, Excel thực và rollback khi lỗi. `04_Infrastructure/SQLServer/ChayKiemThu.ps1` kiểm tra SQL tạo mới 26 bảng, 5 thủ tục, 3 view.

Các màn hình nghiệp vụ mới ban đầu chưa có hồ sơ thực tế. Tạo dữ liệu bằng **Thêm mới** và khai báo quy định tốt nghiệp từ văn bản áp dụng; không chèn tên người hay hồ sơ giả để mô phỏng số liệu trong ảnh.
