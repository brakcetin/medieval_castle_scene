# Medieval Castle Scene - Cleanup Script
# Bu script gereksiz test ve debug dosyalarını siler

Write-Host "🏰 Medieval Castle Scene - Dosya Temizleme Başlatılıyor..." -ForegroundColor Cyan

# Test HTML dosyaları (index.html hariç)
$testHtmlFiles = @(
    "catapult-load-test.html",
    "catapult-loading-fix-test.html",
    "click-test.html",
    "collection-test.html",
    "complete-system-test.html",
    "debug-collection.html",
    "debug-live-clicks.html",
    "debug-visibility.html",
    "debug.html",
    "error-fix-test.html",
    "FINAL_VALIDATION_TEST.html",
    "final-stone-click-test.html",
    "final-test-interface.html",
    "final-test.html",
    "final-validation.html",
    "gsap-enhanced-test.html",
    "immediate-visibility-test.html",
    "live-catapult-test.html",
    "live-validation-test.html",
    "power-bar-test.html",
    "stone-click-verification.html",
    "stone-fix-validation.html",
    "stone-test.html",
    "tam-test.html",
    "tek-tik-test.html",
    "test-complete-fps.html",
    "test-fps.html",
    "test-status.html",
    "test-stone-click.html",
    "validation-game.html"
)

# Test JavaScript dosyaları
$testJsFiles = @(
    "critical-emergency.js",
    "debug-monitor.js",
    "emergency-stones.js",
    "final-stone-click-test.js",
    "final-stone-test.js",
    "final-validation.js",
    "gsap-enhancement-example.js",
    "hizli-test.js",
    "quick-status.js",
    "quick-verification.js",
    "stone-click-diagnosis.js",
    "test-end-to-end.js",
    "test-stone-fix.js",
    "verify-fps.js",
    "verify-stones.js",
    "visual-debug.js"
)

# Backup dosyalar
$backupFiles = @(
    "js\main.js.backup",
    "js\objects.js.backup",
    "js\objects.js.fixed",
    "js\objects.js.new_backup"
)

$deletedCount = 0

# Test HTML dosyalarını sil
Write-Host "🗑️ Test HTML dosyaları siliniyor..." -ForegroundColor Yellow
foreach ($file in $testHtmlFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Silindi: $file" -ForegroundColor Green
        $deletedCount++
    }
}

# Test JavaScript dosyalarını sil
Write-Host "🗑️ Test JavaScript dosyaları siliniyor..." -ForegroundColor Yellow
foreach ($file in $testJsFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Silindi: $file" -ForegroundColor Green
        $deletedCount++
    }
}

# Backup dosyalarını sil
Write-Host "🗑️ Backup dosyalar siliniyor..." -ForegroundColor Yellow
foreach ($file in $backupFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Silindi: $file" -ForegroundColor Green
        $deletedCount++
    }
}

Write-Host "`n🎉 Temizleme tamamlandı!" -ForegroundColor Cyan
Write-Host "📊 Toplam $deletedCount dosya silindi." -ForegroundColor White

# Kalan dosyaları listele
Write-Host "`n📁 Kalan önemli dosyalar:" -ForegroundColor Cyan
Get-ChildItem -Name | Where-Object { $_ -match "\.(html|js|css|md)$" } | Sort-Object | ForEach-Object {
    Write-Host "  📄 $_" -ForegroundColor White
}

Write-Host "`n✨ Proje temiz ve düzenli! Artık sadece gerekli dosyalar kaldı." -ForegroundColor Green
