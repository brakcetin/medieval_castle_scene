/**
 * BasitSoundManager - Basit ses yönetimi için kullanılan sınıf
 * Mancınık ateşleme ve taş toplama sesleri için kullanılıyor
 */
export class BasitSoundManager {
    constructor() {
        // Ses öğelerini tutar
        this.sesler = {};
        
        // Mancınık ateş sesini hazırla
        this.mancınikAtesSesi = new Audio('./sounds/catapult_fire_sound.mp3');
        
        // Taş toplama sesini hazırla
        this.tasToplamaSesi = new Audio('./sounds/stone_sound.mp3');
        
        console.log("🔊 Basit ses yöneticisi hazırlandı");
    }
      // Mancınık ateşleme sesi çalma
    catapultAtesle(volume = 1.0) {
        console.log("🔊 Mancınık ateşleme sesi çalınıyor, volume:", volume);
        
        // Volume ayarla
        this.mancınikAtesSesi.volume = Math.min(Math.max(volume, 0), 1);
        
        // Eğer ses çalıyorsa, başa sarıp tekrar çal
        this.mancınikAtesSesi.pause();
        this.mancınikAtesSesi.currentTime = 0;
        this.mancınikAtesSesi.play().catch(err => {
            console.warn("Ses çalınamadı:", err);
        });
    }
    
    // Taş toplama sesi çalma
    tasTopla() {
        console.log("🔊 Taş toplama sesi çalınıyor");
        
        // Eğer ses çalıyorsa, başa sarıp tekrar çal
        this.tasToplamaSesi.pause();
        this.tasToplamaSesi.currentTime = 0;
        this.tasToplamaSesi.play().catch(err => {
            console.warn("Taş toplama sesi çalınamadı:", err);
        });
    }
}

// Global erişim için tek nesne
let sesYoneticisi = null;

// Global erişim fonksiyonu
window.getSesYoneticisi = () => {
    if (!sesYoneticisi) {
        sesYoneticisi = new BasitSoundManager();
    }
    return sesYoneticisi;
};