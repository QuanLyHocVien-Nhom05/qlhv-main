# Ngữ cảnh dự án và lệnh đưa lên GitHub

Cập nhật ngày **18/11/2026**, múi giờ Việt Nam. Đây là bản ghi để tiếp tục công việc khi đổi phiên/máy; cần đọc mã nguồn thực tế khi sửa. Không phải bản sao nguyên văn mọi tệp. Các tài liệu ngữ cảnh cũ tại `06_Documentation` hiện không có trong workspace; dùng bản ghi mới này, không tự phục hồi các tệp đã bị người dùng xóa.

## Phạm vi đã thống nhất

Hệ thống tuyển sinh sau đại học: lập đợt/quy tắc → thí sinh đăng ký/nộp hồ sơ → phí → OCR/sơ tuyển → thẩm định/bổ sung → hội đồng/lịch thi → điểm/phúc khảo → xếp hạng/duyệt một cấp → nhập học/bàn giao nội bộ → báo cáo.

- Đăng nhập mật khẩu, không khôi phục OTP/2FA chỉ vì đặc tả gốc có đề cập.
- Giữ quyền Học viên sau bàn giao; không phục hồi tự đăng ký/chấm điểm học phần, GPA, nghiên cứu, bảo vệ hoặc xét tốt nghiệp cũ.
- QR mô phỏng giữ dấu nhận biết; không thu tiền thật hoặc tính vào doanh thu thật.
- OCR cục bộ cho bằng tốt nghiệp, bảng điểm, chứng chỉ ngoại ngữ; cán bộ đối chiếu, không coi OCR là phê duyệt.
- Duyệt trúng tuyển một cấp, quyền riêng do Admin giao cho cán bộ phụ trách hoặc Admin. Admin cũng không tự có quyền duyệt này.
- Cán bộ công bố điểm tạm trong phạm vi cây đơn vị bao quát toàn bộ chỉ tiêu của đợt; Admin hỗ trợ. Đủ điểm, chưa công bố/chưa khóa mới được thực hiện. Công bố điểm không tự cấp quyền duyệt trúng tuyển.
- Nhập học và bàn giao nội bộ: xác nhận → phí → học viên → CTĐT đã duyệt, lớp, người hướng dẫn → chuyển quyền/thu hồi phiên cũ. Không yêu cầu ERP/LMS hay PKI bên ngoài.
- Báo cáo Excel/PDF/Word phục vụ đồ án. Kết quả tải 50 người dùng là đo API đọc cục bộ, không suy rộng cho mọi chức năng/triển khai.

Yêu cầu chính: `DacTaTuyenSinh_Goc.md`, `Đactahethong.md`, `User_Stories.md`, `PhanQuyenCongBoDiem.md`, `PhienDangNhapVaDangXuat.md`. Đọc các điều chỉnh hiện hành trước khi áp dụng nội dung bản gốc.

## Công nghệ, cấu trúc và môi trường

- `03-SourceCode/frontend`: Next.js 16.4.5, React, TypeScript. Đọc thêm AGENTS.md của frontend và tài liệu Next được cài trong node_modules trước khi sửa.
- `03-SourceCode/backend`: NestJS/TypeScript, SQL Server, bảo vệ dữ liệu và scripts kiểm thử/khởi tạo.
- `04_Infrastructure/SQLServer`: SQL tạo và nâng cấp cấu trúc; runner hiện dùng migrations qua 18.
- `05_Testing`: báo cáo kiểm thử, ảnh giao diện, các bộ PDF cho trình diễn.
- `scripts/start-local.cjs`, `chay.cmd`: trình chạy trên Windows. Dữ liệu nguồn nằm trong `backend/data`; tài liệu công khai trong `frontend/public/tai-lieu`.

Môi trường đã kiểm thử: Node.js **22.16.0 x64**, SQL Server, ODBC Driver 18 x64. `msnodesqlv8` là thư viện native: máy mới có thể cần Python 3.12 và Build Tools 2022 với Desktop development with C++; node-gyp 11 có thể không nhận Visual Studio 18.x. Nếu Windows Application Control chặn `sqlserver.node`, cần xác định chính sách đang chặn, không coi cài lại npm là cách sửa.

Database cục bộ: `QuanLyChuongTrinhDaoTao`. Nếu SQL Express trên máy khác dùng named instance, cấu hình có thể là `localhost\SQLEXPRESS`, không mặc định mọi máy đều dùng `localhost`. Giữ `.env` và khóa AES hiện có; không công khai hoặc tự thay khóa để sửa lỗi kết nối. Có SQL Server Database Engine mới chạy được; SSMS là công cụ quản lý, không thay Database Engine.

## Dữ liệu đã chuẩn bị

- AGU cơ sở: 12 ngành/chương trình, 19 học phần; khung Quản lý giáo dục cũ và thông báo thạc sĩ đợt 2/2026.
- Bổ sung trước: 5 văn bản tham chiếu cổng Phòng Sau đại học, 6 dòng chỉ tiêu lịch sử 2024; giữ mức xác minh qua chỉ mục riêng khi trang trực tiếp trả 403.
- AGU công khai bổ sung: 8 khoa, 2 bộ môn; 3 ngành/thông tin chương trình; 15 mục văn bản/tệp; 2 đợt lịch sử/14 dòng chỉ tiêu; ngưỡng ngoại ngữ và ngành đầu vào tiến sĩ đã đối chiếu.
- Mã Kỹ thuật môi trường giữa các nguồn khác nhau 8520320/8440301 được giữ riêng; không tự gộp hay sửa mã cũ. Đợt lịch sử đóng, quy tắc chưa đủ không tự xác nhận để mở đợt.
- Bộ nghiệp vụ: 15 tài khoản mới có email `@student.agu.edu.vn`, mật khẩu chung theo yêu cầu `12345678`; không đổi mật khẩu cũ. Có 10 hồ sơ, CTĐT `CHCNTT2026` 60 tín chỉ/17 học phần, lớp, phòng, hội đồng, ca thi, điểm, phúc khảo và 2 học viên đã bàn giao.
- `TS_CNTT_2026_03` đã chốt kết quả; `TS_CNTT_2026_04` được khởi tạo với lịch tương đối và hồ sơ ở nhiều trạng thái. Kiểm tra thời gian/trạng thái thực tế trước trình diễn.
- Bộ Bùi Minh Khang: `05_Testing/HoSo_BuiMinhKhang` và ZIP cùng tên.
- Bộ mới Đỗ Quốc An: `05_Testing/HoSo_DoQuocAn`, ZIP cùng tên; thông tin gốc `backend/data/report-candidate-do-quoc-an.json`. Email `doquocan@student.agu.edu.vn`, CCCD `089200063042`, GPA 8.4/10, IELTS 6.5 cấp 15/06/2026.
- Đỗ Quốc An đã được kiểm tra chưa đăng ký trên database cục bộ tại thời điểm chuẩn bị; không bảo đảm database trên máy khác có cùng trạng thái. Công cụ chỉ tạo tệp, không đăng ký/nộp hồ sơ. Muốn trình diễn đăng ký mới thì không tự tạo tài khoản trước.
- Mỗi bộ có 7 PDF minh chứng, nhãn phục vụ đồ án, không có chữ ký/con dấu/chứng chỉ thật. Giải nén rồi chọn từng PDF theo đúng loại khi tải lên. Không đổi chúng thành giấy tờ chính thức.

Script tạo PDF: `backend/scripts/prepare-admission-evidence.cjs`; không ghi đè bộ đã tồn tại. Bộ Đỗ Quốc An có `THONG_TIN_DANG_KY.md` chứa đầy đủ thông tin nhập form và sơ yếu lý lịch. Đã kiểm tra 7 PDF/8 trang, tiếng Việt, SHA-256, ZIP, dưới 10 MB/tệp, GPA khớp và không lẫn thông tin Bùi Minh Khang.

## Thay đổi gần nhất: giữ phiên và đăng xuất

- Nút đăng xuất dùng cho cả sáu vai trò trên website, menu điện thoại và không gian quản trị. Cán bộ có nhãn chữ ở desktop; không gian công khai của thí sinh/học viên có nút trong điều hướng.
- Token lưu trong `sessionStorage` của tab, khóa `qlhv.access-token`; không lưu mật khẩu hoặc tin vai trò do trình duyệt tự khai.
- Khi F5, xác minh qua `/auth/me` trước khi dựng giao diện theo quyền. Phiên hợp lệ còn hạn thì giữ; hết hạn/thu hồi/khóa/đổi mật khẩu hoặc vai trò thì xóa và yêu cầu đăng nhập lại.
- Lỗi server tạm thời giữ token, hiển thị Thử lại. Yêu cầu 401 từ token cũ không đăng xuất nhầm phiên mới.
- Logout xóa token/cache, gọi `/auth/logout` thu hồi phiên. Thời hạn token vẫn 2 giờ; F5 không gia hạn. Đây không phải ghi nhớ đăng nhập lâu dài sau đóng tab.
- Đăng nhập lại một lần sau cập nhật để có token lưu theo cơ chế mới. Không cần thêm thư viện hay migration SQL.

Tệp chính: `frontend/src/features/auth/session-provider.tsx`, `frontend/src/lib/api-client.ts`, `frontend/src/components/public/public-shell.tsx`, `frontend/src/features/academic/academic-workspace.tsx`, `frontend/src/features/public/user-account.tsx`, `frontend/src/app/session.css`, `frontend/src/app/layout.tsx`.

Kiểm thử mới: `backend/scripts/session-checks.cjs`, `test-session-browser.cjs`; nối vào `core.integration.cjs`. Kiểm thử duyệt một cấp đã đổi để mong đợi giữ đăng nhập sau reload. Báo cáo `05_Testing/PhienDangNhapVaDangXuat.json`, ảnh `Frontend/dang-xuat-can-bo.png` và `dang-xuat-thi-sinh-mobile.png`.

## Chạy và kiểm thử

Từ thư mục gốc chạy `chay.cmd`. Web mặc định `http://localhost:3000`, API `http://127.0.0.1:3001/api`.

Các lệnh sau chạy trong `03-SourceCode`:

```powershell
npm.cmd run test:acceptance
npm.cmd run test:session -w backend
npm.cmd run test:score-publication -w backend
npm.cmd run data:admissions:preview -w backend
npm.cmd run data:admissions:create -w backend
npm.cmd run data:agu:public:preview -w backend
npm.cmd run data:agu:public:append -w backend
```

Lệnh khởi tạo nghiệp vụ tạo lại bộ được mô tả trong JSON vào database máy đang chạy, không sao chép các bản ghi tự nhập từ máy khác. Chỉ thêm khi cần; không dùng `data:replace` vào database đang sử dụng.

Nghiệm thu gần nhất: **82 kiểm thử backend + 3 frontend = 85; 42 nhóm tích hợp; cả 6 bước nghiệm thu đạt**. Kiểm thử dùng database `QLCTDT_Test_...` riêng và chỉ dọn đúng database tạo bởi lần kiểm thử. Không dùng database nghiệp vụ để kiểm thử phá hủy dữ liệu. Không suy ra những chỉnh sửa sau này tự động được kiểm chứng.

## GitHub và ghi nhớ tệp

Remote khi cập nhật: `https://github.com/QuanLyHocVien-Nhom05/qlhv-main.git`; nhánh hiện tại **CTĐT** (có dấu). Các thay đổi còn chưa commit, gồm mã phiên đăng nhập, yêu cầu, kiểm thử và các bộ PDF. Chưa tự commit/push trong lần lưu ngữ cảnh.

`.gitignore` loại `.env` trừ `.env.example`, `.tools`, `storage`, dependencies, build, backup SQL và khóa riêng. Kiểm tra thêm tệp đã được theo dõi vì ignore không tự bỏ tệp khỏi index. Không mang database, khóa AES hoặc kho minh chứng riêng lên GitHub để thay cho scripts khởi tạo. Giữ các SQL/JSON/scripts cần cho máy mới.

Lệnh đưa tất cả thay đổi đã xem xét lên nhánh hiện tại, chạy ở gốc dự án:

```powershell
git status
git add -A
git diff --cached --stat
git commit -m "Bo sung tai lieu ho so, giu phien dang nhap va dang xuat"
git push -u origin HEAD
git status
```

Nếu đang ở CTĐT, tạo pull request từ CTĐT vào main và merge để người tải nhánh main nhận bản mới. Không dùng force push chỉ để xử lý từ chối đồng bộ; đọc thông báo lỗi trước.

Danh mục đường dẫn/dung lượng/SHA-256: [DanhMucTepDuAn.json](DanhMucTepDuAn.json). Cập nhật từ gốc dự án, không ghi cấu hình bí mật:

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
git -c core.quotepath=false ls-files --cached --others --exclude-standard | node scripts/snapshot-project.cjs
```
