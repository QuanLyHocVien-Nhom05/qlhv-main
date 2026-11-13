param(
    [string]$MayChu = 'localhost',
    [switch]$GiuCoSoDuLieu
)
$ErrorActionPreference = 'Stop'
$TenCoSoDuLieu = 'QLCTDT_KiemThu_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '_' + [guid]::NewGuid().ToString('N').Substring(0,8)
if ($TenCoSoDuLieu -notmatch '^QLCTDT_KiemThu_[0-9_]+[a-f0-9]{8}$') { throw 'Ten CSDL kiem thu khong hop le.' }
$DaTao = $false
$ThamSoChung = @('-S', $MayChu, '-E', '-C', '-I', '-b', '-l', '10', '-f', '65001', '-w', '180')
try {
    & sqlcmd @ThamSoChung -d master -Q "IF DB_ID(N'$TenCoSoDuLieu') IS NOT NULL THROW 51999,N'Ten CSDL da ton tai.',1; EXEC(N'CREATE DATABASE [$TenCoSoDuLieu] COLLATE Vietnamese_100_CI_AS');"
    if ($LASTEXITCODE -ne 0) { throw 'Khong tao duoc CSDL kiem thu moi.' }
    $DaTao = $true
    Write-Host "CSDL kiem thu: $TenCoSoDuLieu"
    $DanhSachTep = @('01_CauTruc.sql','02_KhungChuongTrinh.sql','03_TaiKhoan.sql','04_TuongThichDuLieu.sql','05_DuLieuKhoiTao.sql','06_KhoiPhucMatKhau.sql','08_NangCapDaoTao.sql','09_TuyenSinhTheoDacTa.sql','10_DuLieuCongKhai.sql','11_DonDepThuocTinhCu.sql')
    foreach ($TenTep in $DanhSachTep) {
        $DuongDanTep = Join-Path $PSScriptRoot $TenTep
        Write-Host "Dang chay $TenTep"
        & sqlcmd @ThamSoChung -d $TenCoSoDuLieu -i $DuongDanTep
        if ($LASTEXITCODE -ne 0) { throw "Kiem thu that bai tai $TenTep" }
    }
    & sqlcmd @ThamSoChung -d $TenCoSoDuLieu -Q "SET NOCOUNT ON; IF (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0)<>45 THROW 51999,N'Can dung 45 bang loi.',1; SELECT (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0) AS SoBang,(SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped=0) AS SoThuTuc,(SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped=0) AS SoKhungNhin;"
    if ($LASTEXITCODE -ne 0) { throw 'Khong doc duoc thong ke kiem thu.' }
    Write-Host 'DA DAT TOAN BO KIEM THU.'
}
finally {
    if ($DaTao -and -not $GiuCoSoDuLieu) {
        # Chi xoa CSDL ngau nhien vua duoc chinh lan chay nay tao thanh cong.
        & sqlcmd @ThamSoChung -d master -Q "IF DB_ID(N'$TenCoSoDuLieu') IS NOT NULL BEGIN ALTER DATABASE [$TenCoSoDuLieu] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$TenCoSoDuLieu]; END;"
        if ($LASTEXITCODE -ne 0) { Write-Warning "Khong don dep duoc CSDL $TenCoSoDuLieu" }
    } elseif ($DaTao) {
        Write-Host "Da giu CSDL de xem ket qua: $TenCoSoDuLieu"
    }
}
