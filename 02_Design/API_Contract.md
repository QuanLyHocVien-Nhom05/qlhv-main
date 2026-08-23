# TÀI LIỆU QUY ƯỚC API (API CONTRACT) - PHÂN HỆ QUẢN LÝ TUYỂN SINH SĐH

---

## 1. Mẫu Hồ sơ Tuyển sinh (Thí sinh)

### POST `/api/v1/ho-so`
* **Mô tả:** Thí sinh nộp hồ sơ đăng ký dự tuyển trực tuyến (US01).
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

## 2. Thẩm định & Phê duyệt (Cán bộ tuyển sinh)

### GET `/api/v1/ho-so`
* **Mô tả:** Lấy danh sách hồ sơ tuyển sinh theo bộ lọc (US02).
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

## 3. Tra cứu Kết quả Tuyển sinh (Công khai)

### GET `/api/v1/ket-qua/{soCCCD}`
* **Mô tả:** Tra cứu điểm thi và kết quả trúng tuyển theo số CCCD hoặc Mã hồ sơ (US04).
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
