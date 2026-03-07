# Ushbu skript loyihani tozalash va android papkasini qayta yaratish uchun mo'ljallangan

Write-Host "🔄 Loyihani tozalash boshlandi..." -ForegroundColor Cyan

# 1. Eski papkalarni o'chirish
if (Test-Path "android") {
    Write-Host "🗑️  Android papkasini o'chirish..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "android"
}

if (Test-Path "node_modules") {
    Write-Host "🗑️  node_modules papkasini o'chirish..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
}

if (Test-Path "package-lock.json") {
    Write-Host "🗑️  package-lock.json faylini o'chirish..." -ForegroundColor Yellow
    Remove-Item -Force "package-lock.json"
}

# 2. Kutubxonalarni o'rnatish
Write-Host "📦 Kutubxonalarni qayta o'rnatish..." -ForegroundColor Cyan
npm install

# 3. Android papkasini generatsiya qilish
Write-Host "🛠️  Android papkasini generatsiya qilish (Prebuild)..." -ForegroundColor Cyan
npx expo prebuild --platform android --clean

Write-Host "✅ Tozalash va qayta qurish muvaffaqiyatli yakunlandi!" -ForegroundColor Green
Write-Host "🚀 Endi loyihani ishga tushirish uchun quyidagi buyruqni bering:" -ForegroundColor White
Write-Host "npx expo run:android" -ForegroundColor White
