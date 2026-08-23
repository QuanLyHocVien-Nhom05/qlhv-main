# TÀI LIỆU QUY ƯỚC API (API CONTRACT) - PHÂN HỆ QUẢN LÝ TUYỂN SINH SAU ĐẠI HỌC

## I. TỔNG QUAN

### 1. Mục đích
API Contract là tài liệu mô tả thỏa thuận giao tiếp giữa Frontend/Mobile và Backend, làm cơ sở thống nhất về endpoint, HTTP method, dữ liệu request, response, quyền truy cập và mã trạng thái HTTP[cite: 1]. API Contract được xây dựng dựa trên các User Stories đã bóc tách từ quy trình nghiệp vụ[cite: 1].

### 2. Quy ước chung
* **Base URL:** `/api`[cite: 1]
* **Định dạng dữ liệu:** JSON, trừ các API upload file sử dụng `multipart/form-data`[cite: 1].
* **Xác thực:** API yêu cầu xác thực và kiểm tra quyền theo vai trò[cite: 1].
* **HTTP Status thường dùng:** 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Server Error[cite: 1].
* Các dữ liệu đã phê duyệt/khóa phải hạn chế chỉnh sửa theo phân quyền[cite: 1].
* Các thay đổi quan trọng sau khi khóa phải được ghi nhận nhật ký để bảo đảm khả năng truy vết[cite: 1].

### 3. Danh sách API Tổng thể

#### Tuyển sinh
| ID | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| API-01 | POST | `/api/admissions/applications` | Tạo hồ sơ tuyển sinh[cite: 1] |
| API-02 | GET | `/api/admissions/applications/{id}` | Xem thông tin hồ sơ[cite: 1] |
| API-03 | PUT | `/api/admissions/applications/{id}` | Cập nhật hồ sơ[cite: 1] |
| API-04 | POST | `/api/admissions/applications/{id}/documents` | Tải tài liệu hồ sơ[cite: 1] |
| API-05 | GET | `/api/admissions/applications/{id}/documents` | Xem danh sách tài liệu[cite: 1] |
| API-06 | GET | `/api/admissions/applications/{id}/ocr-result` | Xem kết quả OCR/AI[cite: 1] |
| API-07 | PUT | `/api/admissions/applications/{id}/manual-review` | Xử lý hồ sơ cần kiểm tra thủ công[cite: 1] |
| API-08 | POST | `/api/admissions/evaluation-results/import` | Import kết quả xét tuyển[cite: 1] |
| API-09 | POST | `/api/admissions/admitted-list/approve` | Phê duyệt danh sách trúng tuyển[cite: 1] |
| API-10 | POST | `/api/admissions/admission-notices/generate` | Tạo giấy báo trúng tuyển/nhập học[cite: 1] |
| API-11 | PUT | `/api/admissions/tuition-fees` | Cập nhật mức học phí[cite: 1] |

#### Quản lý học viên
| ID | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| API-12 | POST | `/api/students/admissionconfirmation` | Xác nhận nhập học[cite: 1] |
| API-13 | GET | `/api/students/{id}` | Xem thông tin học viên[cite: 1] |
| API-14 | POST | `/api/students/class-assignment` | Xếp lớp học viên[cite: 1] |

#### Chương trình đào tạo
| ID | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| API-15 | POST | `/api/programs` | Tạo chương trình đào tạo[cite: 1] |
| API-16 | GET | `/api/programs/{id}` | Xem chương trình[cite: 1] |
| API-17 | PUT | `/api/programs/{id}` | Cập nhật chương trình[cite: 1] |
| API-18 | POST | `/api/programs/{id}/versions` | Tạo phiên bản chương trình[cite: 1] |

#### Kế hoạch học tập & đăng ký học phần
| ID | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| API-19 | POST | `/api/study-plans` | Tạo kế hoạch học tập[cite: 1] |
| API-20 | GET | `/api/study-plans/{id}` | Xem kế hoạch[cite: 1] |
| API-21 | PUT | `/api/study-plans/{id}` | Cập nhật kế hoạch[cite: 1] |
| API-22 | POST | `/api/study-plans/{id}/validate` | Kiểm tra kế hoạch[cite: 1] |
| API-23 | GET | `/api/study-plans/{id}/export` | Xuất kế hoạch[cite: 1] |
| API-24 | GET | `/api/course-registration/suggestions` | Đề xuất học phần[cite: 1] |
| API-25 | POST | `/api/course-registration` | Đăng ký học phần[cite: 1] |
| API-26 | GET | `/api/course-registration` | Xem học phần đã đăng ký[cite: 1] |

#### Kế hoạch nghiên cứu
| ID | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| API-27 | POST | `/api/research-plans` | Tạo kế hoạch nghiên cứu[cite: 1] |
| API-28 | PUT | `/api/research-plans/{id}` | Cập nhật kế hoạch[cite: 1] |
| API-29 | POST | `/api/researchplans/{id}/evidence` | Thêm minh chứng[cite: 1] |
| API-30 | PUT | `/api/researchplans/{id}/progress` | Cập nhật tiến độ[cite: 1] |
| API-31 | POST | `/api/researchplans/{id}/approve` | Giảng viên xác nhận tiến độ[cite: 1] |

#### Thời khóa biểu
| ID | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| API-32 | POST | `/api/schedules/import` | Import thời khóa biểu[cite: 1] |
| API-33 | POST | `/api/schedules/ai-suggestion` | Nhận đề xuất xếp lịch từ AI[cite: 1] |
| API-34 | POST | `/api/schedules/{id}/approve` | Phê duyệt thời khóa biểu[cite: 1] |
| API-35 | GET | `/api/schedules` | Xem thời khóa biểu[cite: 1] |

#### Học phí
| ID | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| API-36 | POST | `/api/tuition-fees` | Tạo đơn giá học phí[cite: 1] |
| API-37 | PUT | `/api/tuition-fees/{id}` | Cập nhật đơn giá[cite: 1] |
| API-38 | GET | `/api/students/{id}/tuition` | Xem học phí[cite: 1] |
| API-39 | GET | `/api/students/{id}/tuition/debt` | Xem số tiền còn phải thanh toán[cite: 1] |

#### Thời hạn đào tạo
| ID | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| API-40 | GET | `/api/students/{id}/training-deadline` | Xem thời hạn đào tạo[cite: 1] |
| API-41 | GET | `/api/trainingdeadlines/warnings` | Lấy danh sách cảnh báo[cite: 1] |
| API-42 | POST | `/api/students/{id}/dismissaldecision` | Cập nhật quyết định buộc thôi học[cite: 1] |

#### Quản lý điểm
| ID | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| API-43 | POST | `/api/grades` | Nhập điểm[cite: 1] |
| API-44 | PUT | `/api/grades/{id}` | Cập nhật điểm[cite: 1] |
| API-45 | POST | `/api/grades/{id}/confirm` | Xác nhận điểm[cite: 1] |
| API-46 | GET | `/api/students/{id}/grades` | Xem kết quả học tập[cite: 1] |
| API-47 | PUT | `/api/grades/{id}/adjust` | Điều chỉnh điểm đã khóa[cite: 1] |

#### Theo dõi tiến độ
| ID | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| API-48 | GET | `/api/students/{id}/progress` | Xem tiến độ học tập[cite: 1] |
| API-49 | GET | `/api/students/{id}/progress/courses` | Xem trạng thái từng học phần[cite: 1] |
| API-50 | GET | `/api/researchstudents/{id}/progress` | Xem tiến độ nghiên cứu[cite: 1] |

#### Xét tốt nghiệp
| ID | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| API-51 | GET | `/api/graduation/{studentId}/eligibility` | Kiểm tra điều kiện tốt nghiệp[cite: 1] |
| API-52 | GET | `/api/graduation/{studentId}/checklist` | Xem chi tiết điều kiện[cite: 1] |
| API-53 | GET | `/api/graduation/export` | Xuất danh sách xét tốt nghiệp[cite: 1] |
| API-54 | POST | `/api/graduation/{studentId}/decision` | Cập nhật quyết định công nhận tốt nghiệp[cite: 1] |

### 4. Nguyên tắc nghiệp vụ cần lưu ý
* AI/OCR chỉ hỗ trợ nhận dạng, trích xuất, kiểm tra sơ bộ hoặc đề xuất; không tự động thay thế quyết định của cán bộ có thẩm quyền[cite: 1].
* Hồ sơ có dấu hiệu bất thường hoặc kết quả AI không chắc chắn phải chuyển sang kiểm tra thủ công[cite: 1].
* Dữ liệu đã được phê duyệt/khóa như thời khóa biểu, điểm hoặc hồ sơ chính thức phải hạn chế chỉnh sửa theo phân quyền[cite: 1].
* Mọi điều chỉnh dữ liệu quan trọng sau khi khóa cần được ghi nhận nhật ký để bảo đảm khả năng truy vết[cite: 1].
* Chương trình đào tạo phải được quản lý theo khóa/phiên bản để không làm thay đổi chương trình áp dụng cho học viên khóa trước[cite: 1].
* Các quyết định hành chính như buộc thôi học hoặc công nhận tốt nghiệp phải do người/đơn vị có thẩm quyền quyết định; hệ thống chỉ hỗ trợ kiểm tra và cập nhật kết quả chính thức[cite: 1].

---

## II. CHI TIẾT PAYLOAD (DỮ LIỆU GỬI/NHẬN) MỘT SỐ API QUAN TRỌNG

### 1. Mẫu Hồ sơ Tuyển sinh (Thí sinh)

* **Mô tả:** Thí sinh nộp hồ sơ đăng ký dự tuyển trực tuyến (US01).
* **Endpoint:** `POST /api/v1/ho-so`
* **Header yêu cầu:** `Content-Type: application/json`
* **Dữ liệu gửi lên (Request Body):**
```json
{
  "hoTen": "Nguyen Kim Ngan",
  "soCCCD": "012345678901",
  "email": "nguyenkimngan@gmail.com",
  "soDienThoai": "0901234567",
  "maNganhDangKy": "SDH_CNTT",
  "danhSachGiayTo": [
    {
      "loaiGiayTo": "BANG_DAI_HOC",
      "duongDanFile": "[https://storage.example.com/files/bang-dai-hoc.pdf](https://storage.example.com/files/bang-dai-hoc.pdf)"
    }
  ]
}
```
* **Kết quả trả về (Response 201 Created):**
```json
{
  "thanhCong": true,
  "thongBao": "Nộp hồ sơ tuyển sinh thành công",
  "duLieu": {
    "maHoSo": "TS2026-00102",
    "trangThai": "CHO_DUYET"
  }
}
```

---

### 2. Thẩm định & Phê duyệt (Cán bộ tuyển sinh)

* **Mô tả:** Lấy danh sách hồ sơ tuyển sinh theo bộ lọc (US02).
* **Endpoint:** `GET /api/v1/ho-so`
* **Tham số truy vấn (Query Parameters):** `trangThai` (CHO_DUYET, DA_DUYET, TU_CHOI), `trang`, `soLuong`
* **Kết quả trả về (Response 200 OK):**
```json
{
  "tongSo": 45,
  "trangHienTai": 1,
  "duLieu": [
    {
      "maHoSo": "TS2026-00102",
      "hoTen": "Nguyen Kim Ngan",
      "ngayNop": "2026-08-23T20:30:00Z",
      "trangThai": "CHO_DUYET"
    }
  ]
}
```

---

### 3. Tra cứu Kết quả Tuyển sinh (Công khai)

* **Mô tả:** Tra cứu điểm thi và kết quả trúng tuyển theo số CCCD hoặc Mã hồ sơ (US04).
* **Endpoint:** `GET /api/v1/ket-qua/{soCCCD}`
* **Kết quả trả về (Response 200 OK):**
```json
{
  "soCCCD": "012345678901",
  "hoTen": "Nguyen Kim Ngan",
  "nganhXetTuyen": "Khoa học Máy tính",
  "ketQua": "TRUNG_TUYEN",
  "bangDiem": {
    "monCoSo": 8.5,
    "monChuyenNganh": 7.0,
    "ngoaiNgu": "MienThi"
  },
  "duongDanGiayBao": "[https://storage.example.com/certificates/TS2026-00102.pdf](https://storage.example.com/certificates/TS2026-00102.pdf)"
}
```
