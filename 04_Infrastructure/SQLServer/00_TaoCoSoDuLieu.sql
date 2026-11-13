-- Chay tren SQL Server 2019+ bang SSMS hoac sqlcmd.
-- Chi tao neu chua co; khong xoa hay ghi de co so du lieu dang ton tai.
USE master;
GO
IF DB_ID(N'QuanLyChuongTrinhDaoTao') IS NULL
    EXEC(N'CREATE DATABASE [QuanLyChuongTrinhDaoTao] COLLATE Vietnamese_100_CI_AS');
GO
USE QuanLyChuongTrinhDaoTao;
GO
