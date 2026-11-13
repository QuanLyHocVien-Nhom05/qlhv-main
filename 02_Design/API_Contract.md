# API tuyển sinh và bàn giao đào tạo

Đặc tả mới: [đối chiếu chức năng tuyển sinh](../06_Documentation/07_DoiChieuDacTaTuyenSinh.md). Các API đào tạo bên dưới tiếp tục phục vụ học viên sau nhập học.

| Tuyển sinh | API dưới tiền tố `/api` |
|---|---|
| Công khai | GET `/public/admission-options`; POST `/auth/register` `{HoTen,Email,SoGiayTo,MatKhau,XacNhanMatKhau,DongY:true}` |
| Đăng nhập | POST `/auth/login` trả access token sau khi xác minh mật khẩu; các endpoint QR/OTP đã được gỡ |
| Hồ sơ chính chủ | GET/POST `/my/admissions`; GET/PUT `/my/admissions/:id`; PUT và POST `:id/submit` dùng `Version` dạng `0x` + 16 ký tự hex |
| Tài liệu | POST `/my/admissions/files` multipart `file`, `LoaiTaiLieu`; POST `/my/admissions/:id/documents` `{MaTaiLieu}`; GET `/admissions/files/:id` kiểm tra chủ/phạm vi |
| Thanh toán | POST `/my/admissions/:id/pay` `{LoaiPhi:XET_TUYEN hoặc NHAP_HOC}`; GET `/integrations/vnpay/ipn` dành callback có chữ ký |
| Thí sinh | POST `:id/appeal` `{LyDo}`, POST `:id/confirm-enrollment`; GET `:id/letter/invite` hoặc `:id/letter/result`; các đường dẫn này thuộc `/my/admissions` |
| Bàn làm việc | GET `/admin/admissions/applications`, GET `/admin/admissions/applications/:id`; POST `:id/screen`, POST `:id/review` `{Version,KetQua,LyDo,HanBoSung?}`; POST `/admin/admissions/documents/:id/verify` `{DaDoiChieu}` |
| Ca thi | GET `/admin/admissions/exams`, GET `/:id/roster` hoặc `/:id/blind`, POST `/:id/allocate`, POST `/:id/publish`, POST `/:id/attendance/:assignment` `{CoMat}` |
| Điểm | POST `/admin/admissions/scores` `{MaPhach,scores:{CoSo,ChuyenNganh,NgoaiNgu,UuTien}}`; ngoại ngữ được backend tính lại từ quy tắc chứng chỉ; POST `/admin/admissions/scores/import` multipart Excel `MaPhach,CoSo,ChuyenNganh,NgoaiNgu,UuTien` tối đa 100 dòng, trả kết quả từng dòng đã lưu/lỗi |
| Xét tuyển | POST `/admin/admissions/applications/:id/resolve-appeal` `{scores,LyDo}`; POST `/admin/admissions/batches/:id/rank`; POST `/:id/approve` `{CapDuyet,GhiChu}` |
| Mẫu lý do bổ sung | GET `/admin/admissions/review-reasons` trả `{code,label}[]`; khi `KetQua=CAN_BO_SUNG`, gửi thêm `MaLyDo` từ danh sách cùng `LyDo` cụ thể và `HanBoSung` ISO có múi giờ |
| Danh sách trình duyệt | GET `/admin/admissions/batches/:id/selection` trả `{batch,candidates,approvals}` cho Admin/Cán bộ/Lãnh đạo trong phạm vi cả đợt; danh sách có điểm đã giải mã, hạng, chỉ tiêu, điểm sàn, tiêu chí phụ và dự kiến trúng tuyển; không trả ciphertext hoặc mã phách |
| Nhập học | POST `/admin/admissions/applications/:id/enroll` `{MaPhienBan,MaLopQuanLy?}`; đúng chương trình đã duyệt, đã xác nhận và hoàn tất phí |
| Báo cáo/tích hợp | GET `/admin/admissions/reports?kind=applications hoặc accepted hoặc revenue&format=xlsx hoặc pdf hoặc docx&dot=ID`; GET `/admin/admissions/integrations`; POST `/admin/admissions/jobs/run`; POST `/admin/admissions/transfers/:id/sync` |

Cấu hình đợt/chỉ tiêu/quy tắc/phòng/ca/phân công và cấp duyệt dùng `/management/:resource` với metadata theo quyền. Các resource bổ sung: `admission-batches`, `admission-quotas`, `admission-certificates`, `admission-major-rules`, `admission-rooms`, `admission-exams`, `admission-examiners`, `admission-approval-rights`, `admission-outbox`, `admission-transfers`.

Bổ sung ngày 13/11/2026:

- `/management/admission-reasons`: tạo mẫu `{MaLyDo,TenLyDo,NoiDungMau}`, action `edit`/`toggle` dùng `Version`. GET `/admin/admissions/review-reasons` trả các mẫu đang hoạt động với `{code,label,instructions}`.
- Ca thi nhận `ThanhPhan=TONG_HOP|CO_SO|CHUYEN_NGANH` (mặc định tổng hợp). Bài độc lập chấm tại `/admin/admissions/scores` với `{MaPhach,scores:{Diem,UuTien?}}`; điểm ưu tiên chỉ nhập ở bài chuyên ngành. Excel nhận `MaPhach,Diem,UuTien`; giữ mẫu tổng hợp cũ. Cổng thí sinh và giấy báo trả nhiều lịch thi.
- `/management/admission-enrollment-plans`: cấu hình `{MaChiTieu,MaPhienBan,MaLopQuanLy?,MaGVHD?,LopHocPhan:"[101,102]",TuDong}`; action `edit` kèm `Version`. `/admin/admissions/applications/:id/enroll` cho phép bỏ `MaPhienBan` để dùng kế hoạch. Hàng đợi tự bàn giao khi `TuDong=true`; GET `/my/training` bổ sung `advisors` của học viên chính chủ.
- Thanh toán nhận thêm `Kenh=VNPAY|MOMO|NGAN_HANG`. Ngân hàng qua VNPAY dùng `vnp_BankCode=VNBANK`. POST `/integrations/momo/ipn` xác minh callback rồi trả 204; không dùng redirect của trình duyệt để xác nhận đã thu tiền.
- `/management/admission-report-templates`: tạo `{KyHieu,Loai,TieuDe,SoVanBan,NguonMauUrl,CauHinhCot}`; `CauHinhCot` là chuỗi JSON `[{key,title}]`, chỉ nhận các cột báo cáo cho phép. Action `approve` kèm `Version` dành Lãnh đạo/Admin. `/admin/admissions/reports` nhận `template=MaMau` tùy chọn, chỉ dùng mẫu đã duyệt và đúng loại báo cáo.

Tiền tố `/api`. Swagger tại `/api/docs`. Các API riêng yêu cầu Bearer token; DTO từ chối trường không cho phép.

Phạm vi mở rộng 12/11/2026: 5 vai trò và các nghiệp vụ trong [hướng dẫn phân quyền](../06_Documentation/06_PhanQuyen_VaNangCap.md). Danh sách resource hiện tại được cung cấp bởi GET `/management/metadata` theo đúng quyền của tài khoản.

API bổ sung: POST `/auth/logout`; GET `/public/documents`; POST `/public/subscribe` `{HoTen,Email,NoiDung,DongY:true}`; GET `/my/training` chỉ dành cho học viên chính chủ. Resource mới: `faculties`, `course-versions`, `program-versions`, `cohorts`, `topics`, `supervisors`, `defenses`, `committee`, `grad-rules`, `language-evidence`, `graduation`, `grad-history`, `documents`, `subscriptions`, `settings`, `audit`.

Excel: GET `/management/:resource/export.xlsx`, GET `/management/:resource/import-template.xlsx`, POST `/management/:resource/import/preview` (multipart trường `file`), POST `/management/:resource/import` `{rows:[values]}`. Không phải resource nào cũng hỗ trợ nhập. API kiểm tra quyền riêng cho đọc, ghi, xuất và nhập; giảng viên bị giới hạn theo phân công.

| Nhóm | API |
| --- | --- |
| Đăng nhập | POST `/auth/login`, POST `/auth/change-password`, GET `/auth/me` |
| Quên mật khẩu | POST `/auth/password-recovery/request` `{username,email}`, POST `/auth/password-recovery/reset` `{token,newPassword,confirmPassword}` |
| Gửi liên kết qua email | POST `/auth/password-recovery/email` `{username,email}` — SMTP, USER hoạt động, 5 yêu cầu/IP/15 phút và thời gian chờ 60 giây/tài khoản |
| Xác minh khôi phục (admin) | GET `/password-recovery/admin/requests`, POST `/password-recovery/admin/requests/:id/issue` `{Revision,username,note}`, POST `/password-recovery/admin/requests/:id/reject` `{Revision,note}` |
| Tài khoản | GET/POST `/admin/accounts`, PATCH/DELETE `/admin/accounts/:id`, GET `/admin/accounts/options` |
| Quản trị | GET `/management/metadata`, `/management/overview`, `/management/options/:key`, `/management/:resource`; POST `/management/:resource`, `/management/:resource/:id/actions/:action` |
| Chương trình | GET/POST `/programs`, GET/PUT `/programs/:id`, POST `/programs/:id/versions`, POST `/programs/:id/versions/:version/approve` |
| Tra cứu | GET `/public/programs`, `/public/programs/:id` — chỉ phiên bản đã duyệt |
| Học tập cá nhân | GET `/my/studies`, `/my/studies/:id`, POST `/my/studies/:id/registrations` |
| Báo cáo | GET `/reports/options`, `/reports/students`, `/reports/students.xlsx`, `/reports/programs.xlsx` |

Danh sách resource được công bố bởi `/management/metadata` theo vai trò; resource không tồn tại trả 404, resource không được phép trả 403. Học viên được gán từ tài khoản USER đang hoạt động vào phiên bản đã duyệt, có thể tham gia lớp quản lý cùng phiên bản.

Báo cáo nhận `MaPhienBan` tùy chọn, `search`, `page`, `limit`. Excel xuất toàn bộ kết quả lọc tối đa 10.000 dòng, không chỉ trang đang xem. Tài khoản STUDENT không được xuất báo cáo toàn trường. File chứa các cột được chọn, không có CCCD, email hay mật khẩu.

401: chưa đăng nhập/hết phiên; 403: thiếu quyền; 404: API/bản ghi không tồn tại; 400: đầu vào không hợp lệ; 409: xung đột revision hoặc quy tắc nghiệp vụ. Các thao tác ghi và xuất tệp có nhật ký.

## Dữ liệu công khai từ nguồn trường

GET `/public/admission-announcements` trả thông báo lịch sử và chỉ tiêu chung, độc lập các đợt đang mở. GET `/public/programs` có thể trả thông tin nguồn công khai với `MaPhienBan=null`, tín chỉ/thời gian tối đa chưa biết là null; các bản ghi này không dùng trực tiếp gán học viên. POST `/programs/:id/initial-version` nhận `SqlVersionDto` tạo bản nháp đầu tiên; yêu cầu Admin/Cán bộ, kiểm tra chương trình chưa có phiên bản, chống tạo trùng. Sau đó dùng quy trình duyệt hiện có.

Bổ sung nguồn PGD AGU ngày 13/11/2026: GET `/public/documents` trả thêm `MaDinhDanhNoiBo`, `GhiChuNguon`, `NgayKiemChung`, `KieuKiemChung`; GET `/public/admission-announcements` trả thêm ghi chú/kiểu/ngày kiểm chứng của thông báo. `CHI_MUC_TIM_KIEM` nghĩa là đối chiếu chỉ mục, chưa tải lại được PDF nguồn. Thông tin lịch sử không tự trở thành đợt đang nhận hồ sơ.
