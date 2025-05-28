// 🎯 HIZLI TAŞ TIKLAMA DOĞRULAMA
console.log("🚀 Hızlı taş tıklama doğrulaması başlatılıyor...");

// Uygulamanın yüklenmesini bekle ve hazır olduğunda testi başlat
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        // Biraz bekleyerek uygulamanın yüklenmesi için zaman tanı
        if (window.app) {
            console.log("✅ App yüklendi, test başlatılıyor...");
            hizliTaşTest();
        } else {
            console.log("⏳ App henüz yüklenmedi, 3 saniye daha bekleniyor...");
            setTimeout(function() {
                hizliTaşTest();
            }, 3000);
        }
    }, 1000);
});

function hizliTaşTest() {
    console.log("\n🔍 === HIZLI TAŞ TEST ===");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ Oyun yüklenmemiş!");
        console.error("💡 İpucu: Ana uygulama yüklenmiyor. Konsolu kontrol edin ve syntax hatalarını düzeltin.");
        return;
    }
    
    const stones = window.app.sceneManager.objects.stones || [];
    console.log(`🗿 Toplam ${stones.length} taş bulundu`);
    
    // İlk görünür taşı bul
    const testStone = stones.find(s => s && s.mesh && s.mesh.visible && !s.isCollected);
    
    if (!testStone) {
        console.error("❌ Test edilebilecek taş bulunamadı!");
        return;
    }
    
    console.log(`🎯 Test taşı: Pozisyon (${testStone.mesh.position.x.toFixed(1)}, ${testStone.mesh.position.y.toFixed(1)}, ${testStone.mesh.position.z.toFixed(1)})`);
    
    // ÖNCE durumu
    const onceSkor = window.app.score || 0;
    const onceGorunur = testStone.mesh.visible;
    
    console.log(`📊 ÖNCE: Skor=${onceSkor}, Görünür=${onceGorunur}`);
    
    // TAŞ TOPLAMA TESTİ
    console.log("🖱️ Taş toplanıyor...");
    const sonuc = testStone.collect();
    
    // ANINDA kontrol
    setTimeout(() => {
        const sonraSkor = window.app.score || 0;
        const sonraGorunur = testStone.mesh ? testStone.mesh.visible : false;
        
        console.log(`📊 SONRA: Sonuç=${sonuc}, Skor=${sonraSkor}, Görünür=${sonraGorunur}`);
        
        // BAŞARI KONTROLÜ
        if (sonuc && !sonraGorunur && testStone.isCollected) {
            console.log("🎉 ✅ BAŞARILI! Taş tek tıklamada toplandı ve kayboldu!");
        } else {
            console.log("💥 ❌ BAŞARISIZ! Taş hâlâ görünür veya toplama başarısız!");
        }
        
        // ÇOKLU TIKLAMA TESTİ
        console.log("\n🔄 Çoklu tıklama testi...");
        const ikinci = testStone.collect();
        const ucuncu = testStone.collect();
        
        if (!ikinci && !ucuncu) {
            console.log("✅ Çoklu tıklamalar başarıyla engellendi");
        } else {
            console.log("❌ Çoklu tıklamalar engellenemedi");
        }
        
    }, 50);
}

// 2 saniye sonra otomatik test
setTimeout(() => {
    console.log("⏰ Otomatik test başlıyor...");
    hizliTaşTest();
}, 2000);

// Manuel kullanım için
window.hizliTaşTest = hizliTaşTest;
console.log("💡 Manuel test için console'da: hizliTaşTest()");
