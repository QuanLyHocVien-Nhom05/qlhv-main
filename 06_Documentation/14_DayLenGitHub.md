# Đưa bản đồ án hiện tại lên GitHub

Tại thời điểm viết hướng dẫn, `D:\qlhv-main-main` chưa có thư mục `.git`. Git đã có tại `C:\Program Files\Git\cmd\git.exe`, nhưng chưa nằm trong PATH của terminal đang dùng. Chọn đúng một trong ba trường hợp dưới đây; trường hợp A phù hợp với thư mục hiện tại nếu bạn muốn cập nhật repository cũ.

## Chuẩn bị terminal và URL repository

Mở PowerShell tại thư mục gốc đồ án, nơi có `.gitignore` và `README.md`:

```powershell
cd D:\qlhv-main-main
$env:Path = 'C:\Program Files\Git\cmd;' + $env:Path
git --version
Test-Path -LiteralPath .git
```

Lệnh thêm PATH chỉ áp dụng terminal hiện tại. Máy khác chưa có Git thì cài [Git for Windows](https://git-scm.com/downloads/win), rồi mở terminal mới.

Mở repository cũ trên GitHub → **Code → HTTPS → Copy URL**. Trong ví dụ, thay `https://github.com/TEN_TAI_KHOAN/TEN_REPOSITORY.git` bằng URL vừa sao chép.

## A. Cập nhật repo cũ khi thư mục hiện tại không có `.git`

Trường hợp này thường xảy ra khi tải mã nguồn bằng ZIP. Khôi phục lịch sử từ GitHub trước khi tạo commit mới:

```powershell
git init -b main
git remote add origin https://github.com/TEN_TAI_KHOAN/TEN_REPOSITORY.git
git fetch origin
git branch -r
```

Nếu danh sách có `origin/main`, tiếp tục:

```powershell
git reset --mixed origin/main
git switch -c cap-nhat-do-an-20261113
```

Nếu nhánh chính là `origin/master`, dùng `git reset --mixed origin/master` thay cho dòng `origin/main`. Đổi tên nhánh cập nhật nếu tên này đã tồn tại.

`reset --mixed` trong bước này đặt HEAD/index theo lịch sử cũ nhưng **giữ nội dung các tệp hiện có**. Chỉ áp dụng chuỗi lệnh này cho trường hợp A vừa khởi tạo Git; không thay bằng `--hard`. Nhánh cập nhật sẽ nối tiếp lịch sử repo cũ.

Làm tiếp phần **Tạo commit và đẩy lên GitHub**.

## B. Thư mục đã có `.git`

Không khởi tạo lại và không chạy bước reset của trường hợp A. Kiểm tra repository, nhánh và các thay đổi:

```powershell
git status
git remote -v
git branch --show-current
git fetch origin
```

Nếu đúng repository, tạo nhánh cập nhật từ nhánh đang làm việc:

```powershell
git switch -c cap-nhat-do-an-20261113
```

Làm tiếp phần tạo commit. Nếu chưa có remote, dùng `git remote add origin URL_REPO`; nếu URL remote sai, dùng `git remote set-url origin URL_REPO` sau khi đối chiếu repository của bạn.

## C. Đưa lên repository mới hoàn toàn

Trên GitHub chọn **New repository**, tạo repo trống, chưa thêm README, license hoặc `.gitignore`. Tại thư mục đồ án chưa có Git:

```powershell
git init -b main
git remote add origin https://github.com/TEN_TAI_KHOAN/TEN_REPOSITORY.git
```

Làm tiếp phần tạo commit; ở lệnh push dùng `git push -u origin main` thay vì tên nhánh cập nhật. Nếu repo mới đã có commit, dùng trường hợp A để giữ lịch sử đó.

## Tạo commit và đẩy lên GitHub

Điền thông tin tác giả commit cho repository này:

```powershell
git config user.name "TEN_CUA_BAN"
git config user.email "EMAIL_GITHUB_CUA_BAN"
```

`.gitignore` đã loại thư viện cài đặt, build, `.tools`, tệp môi trường riêng, dữ liệu upload mã hóa, backup SQL và khóa riêng. Các tệp `.env.example`, migration SQL, JSON dữ liệu công khai, PDF nguồn và hướng dẫn chạy vẫn được đưa lên repo.

Để `.gitignore` cũng áp dụng với tệp từng được theo dõi trong repo cũ, dựng lại index rồi xem những gì sẽ commit:

```powershell
git rm -r --cached --ignore-unmatch -q -- .
git add --all
git status --short
git diff --cached --stat
```

`git rm --cached` ở đây chỉ bỏ tệp khỏi index; nội dung trên ổ đĩa được giữ nguyên. `git add --all` đưa lại các tệp được phép theo `.gitignore`, đồng thời ghi nhận các tệp cũ đã bị loại khỏi bản đồ án hiện tại.

Kiểm tra nhanh rằng tệp riêng và thư viện không nằm trong index:

```powershell
git ls-files -- .tools 03-SourceCode/node_modules 03-SourceCode/backend/node_modules 03-SourceCode/frontend/node_modules 03-SourceCode/backend/.env 03-SourceCode/frontend/.env.local
```

Lệnh trên phải không liệt kê các đường dẫn này. Kiểm tra danh sách `git status` nếu bạn có thư mục dữ liệu riêng ngoài các vị trí mặc định.

Tạo commit và đẩy nhánh cập nhật:

```powershell
git commit -m "Hoan thien do an tuyen sinh sau dai hoc, du lieu AGU va huong dan chay"
git push -u origin cap-nhat-do-an-20261113
```

Git có thể mở trình duyệt để đăng nhập GitHub qua Git Credential Manager. Nếu Git hỏi token cho HTTPS, dùng cơ chế xác thực GitHub hỗ trợ; không ghi token vào URL remote hoặc mã nguồn. Xem [hướng dẫn xác thực của GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github).

Sau khi push, mở repository → **Compare & pull request**, chọn nhánh đích `main` hoặc `master`, xem thay đổi rồi merge. Repo cũ sẽ được cập nhật mà vẫn giữ lịch sử.

## Những lần cập nhật tiếp theo

Sau khi merge, đồng bộ nhánh chính ở máy rồi tạo nhánh mới cho lần chỉnh sửa tiếp theo. Nếu tiếp tục trên cùng nhánh chưa merge:

```powershell
git status
git add --all
git diff --cached --stat
git commit -m "Mo ta thay doi moi"
git push
```

Nếu remote đã có thay đổi từ người khác và push bị từ chối, fetch rồi tích hợp thay đổi theo nhánh đang làm việc; xử lý xung đột trước khi push lại. Không khắc phục bằng cách ghi đè lịch sử remote.

## Có cần đưa file SQL lên GitHub không?

**Có. Giữ nguyên thư mục `04_Infrastructure/SQLServer/` trong repository.** Bộ khởi động cần các script SQL này để tạo và cập nhật cấu trúc database trên máy tải về. Cũng cần giữ JSON dữ liệu công khai trong `03-SourceCode/backend/data/`, các PDF công khai trong `03-SourceCode/frontend/public/tai-lieu/`, `chay.cmd`, thư mục `scripts/`, các tệp `.env.example` và `package-lock.json`.

Không cần xuất database đang dùng thành file `.bak`, `.mdf` hoặc `.ldf` để đưa lên GitHub. Các file này cùng `.env`, khóa riêng, `storage/`, `node_modules/` và `.tools/` đã được loại trong `.gitignore`. Không đưa bản sao dữ liệu cá nhân thí sinh hoặc mật khẩu thật vào file `.sql` mới. GitHub lưu các script trong mã nguồn, không đồng bộ nội dung database SQL Server trên máy.

Không chạy lần lượt tất cả file SQL bằng tay: `07_TinhGonDuLieuCu.sql` là script cũ, không thuộc luồng setup hiện tại. Dùng `chay.cmd` hoặc luồng setup được hướng dẫn để chọn đúng migration.

## Người tải đồ án từ GitHub cần làm gì?

Đọc [HUONG_DAN_CHAY.md](../HUONG_DAN_CHAY.md): cài Node/SQL Server/ODBC một lần, tải ZIP và giải nén, mở terminal tại thư mục gốc rồi chạy `.\chay.cmd`. Lệnh tự chuẩn bị cấu hình/database và chạy hai dịch vụ; máy mới cần Internet để cài thư viện. Tệp trong `node_modules`, như `es-module-lexer/package.json`, là thư viện cài từ npm; không chỉnh các tệp này để đẩy đồ án.

Đưa mã nguồn lên GitHub cũng không tự triển khai NestJS và SQL Server thành website hoạt động trực tuyến. Hướng dẫn hiện tại dành cho clone và chạy localhost.

Tham khảo: [đưa mã nguồn cục bộ lên GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github), [ngữ nghĩa `git reset --mixed`](https://git-scm.com/docs/git-reset).
