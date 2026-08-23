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
{
  "thanhCong": true,
  "thongBao": "Nộp hồ sơ tuyển sinh thành công",
  "duLieu": {
    "maHoSo": "TS2026-00102",
    "trangThai": "CHO_DUYET"
  }
}
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
