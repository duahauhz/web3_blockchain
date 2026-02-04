@echo off
REM Script cài đặt và chạy SuiGift App cho Windows

echo 🎁 SuiGift - Setup Script
echo ==========================

REM Step 1: Install dependencies
echo.
echo 📦 Bước 1: Cài đặt dependencies...
cd ui
call npm install

echo.
echo ✅ Đã cài đặt xong dependencies!

REM Step 2: Instructions for Move package
echo.
echo 📝 Bước 2: Publish Move Package
echo ================================
echo Chạy các lệnh sau:
echo.
echo   cd move\hello-world
echo   sui move build
echo   sui client publish --gas-budget 100000000
echo.
echo Sau khi publish, COPY Package ID và cập nhật vào:
echo   ui\src\constants.ts
echo.

REM Step 3: Run dev server
echo 📝 Bước 3: Chạy dev server
echo ==========================
echo Sau khi cập nhật Package ID, chạy:
echo.
echo   cd ui
echo   npm run dev
echo.
echo Mở browser: http://localhost:5173/
echo.
echo 🎉 Hoàn thành!
echo.
pause
