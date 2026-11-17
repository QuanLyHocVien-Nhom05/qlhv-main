# Kiểm thử phiên bản lõi

Xem `NghiemThu_Loi.json` cho 6 bước nghiệm thu; `PhamViNguon.json` cho kiểm tra mã nguồn trung tính. Kịch bản tại `03-SourceCode/backend/scripts/core.integration.cjs`. Các báo cáo/screenshot cũ của chức năng đã bỏ là bằng chứng lịch sử, không mô tả phạm vi hiện tại.

Phạm vi 17/11/2026: `handover-accounts-checks.cjs` kiểm tra quyền và chặn nghiệp vụ học tập cũ; `admission-scope-checks.cjs` kiểm tra API/màn hình đã gỡ, cây ngành và lịch mở/đóng. Bàn giao tự động, điểm thi tuyển sinh, phúc khảo, duyệt ba cấp và dữ liệu AGU tiếp tục được kiểm thử bằng các kịch bản tuyển sinh.

Kiểm thử mục IX: `Tai_50_NguoiDung.json` ghi số đo 50 tài khoản đồng thời trên API đọc cục bộ và dữ liệu thử; không phải kiểm thử tải toàn bộ nghiệp vụ hoặc chứng nhận production. Chạy lại bằng `npm run test:load -w backend` từ `03-SourceCode`, hoặc chạy toàn bộ nghiệm thu. Xem [phạm vi và cách đo](../06_Documentation/22_BaoMatBaoCaoVaKiemThuTai.md).
