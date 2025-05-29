# Medieval Castle Scene - Product Requirements Document (PRD)

## 1. Proje Özeti
"Medieval Castle Scene", WebGL tabanlı bir 3D oyun sahnesidir. Bu proje, kullanıcıların bir ortaçağ kalesini keşfetmelerine, mancınık mekaniğini deneyimlemelerine ve interaktif bir gece/gündüz döngüsü ile sahneyi gözlemlemelerine olanak tanır. Projenin amacı, kullanıcıya görsel olarak etkileyici ve etkileşimli bir deneyim sunmaktır.

## 2. Hedefler ve Amaçlar
- **Temel Amaç:** Kullanıcıların ortaçağ atmosferini deneyimleyebileceği bir 3D sahne oluşturmak.
- **Kullanıcı Deneyimi:** Kullanıcılar, sahne içinde serbestçe hareket edebilecek, mancınık mekaniğini kullanarak taş fırlatabilecek ve gece/gündüz geçişlerini kontrol edebilecektir.

## 3. Temel Özellikler
- **Kamera Hareketleri:** Kullanıcı, sahne içinde serbestçe dolaşabilir ve farklı açılardan sahneyi gözlemleyebilir.
- **Mancınık Mekaniği:** Kullanıcı, mancınığı kontrol ederek taş fırlatabilir.
- **Meşale Aydınlatma Sistemi:** Meşaleler, sahneye dinamik bir aydınlatma efekti sağlar.
- **Gece/Gündüz Geçişi:** Kullanıcı, sahnenin zaman dilimini değiştirebilir.
- **Puanlama Sistemi:** Kullanıcı, mancınık ile hedeflere isabet ettikçe puan kazanır.

## 4. 3D Modeller ve Varlıklar
- **Model Türleri:**
  - Kale duvarları
  - Mancınık
  - Taşlar
  - Meşaleler
- **Kaplama ve Animasyon Gereksinimleri:**
  - Yüksek kaliteli kaplamalar (texture) kullanılacaktır.
  - Mancınık ve taşlar için animasyonlar gereklidir (örneğin, taşın fırlatılması).

## 5. Kullanıcı Arayüzü
- **Gerekli UI Öğeleri:**
  - Işık parlaklığı ayarları
  - Gece/gündüz geçiş butonları
  - Puan paneli

## 6. Kullanıcı Etkileşimleri
- **Etkileşim Yöntemleri:**
  - Kullanıcı, klavye ve fare ile sahne ve nesnelerle etkileşim kurabilir.
  - Fare ile kamera hareketleri kontrol edilebilir.
  - Klavye ile mancınık kontrolü sağlanabilir.

## 7. Oyun Mantığı
- **Puanlama Sistemi:** Kullanıcı, mancınık ile hedeflere isabet ettikçe puan kazanır. Her isabet farklı puan değerine sahip olabilir.
- **Etkileşim Kuralları:** Kullanıcı, sahne içindeki nesnelerle yalnızca belirli mesafelerdeyken etkileşim kurabilir.

## 8. Işıklandırma ve Efektler
- **Gündüz/Gece Işık Sistemi:** Sahne, dinamik olarak gündüz ve gece arasında geçiş yapabilir.
- **Meşale Davranışı:** Meşaleler, parlaklık ayarına göre ışık yayar ve dinamik bir aydınlatma sağlar.

## 9. Teknolojik Altyapı
- **Kullanılacak Teknolojiler:**
  - Three.js
  - GLTFLoader
  - dat.GUI
  - HTML/CSS/JavaScript

## 10. Geliştirme Ortamı
- **Geliştirme Araçları:**
  - Visual Studio Code
  - Live Server

## 11. Varsayımlar ve Sınırlamalar
- **Varsayımlar:**
  - Kullanıcı, modern bir tarayıcıda oyunu çalıştıracaktır.
- **Sınırlamalar:**
  - Yüksek kaliteli grafikler nedeniyle düşük performanslı cihazlarda oyun akıcılığı sınırlı olabilir.

## 12. Kaynaklar
- Three.js resmi dokümantasyonu: [https://threejs.org/docs/](https://threejs.org/docs/)
- GLTFLoader kılavuzu: [https://threejs.org/examples/?q=gltf#webgl_loader_gltf](https://threejs.org/examples/?q=gltf#webgl_loader_gltf)
- dat.GUI rehberi: [https://github.com/dataarts/dat.gui](https://github.com/dataarts/dat.gui)

## Yapıldı
- [ ] Henüz tamamlanan bir görev yok.

## Yapılacak
### 1. Teknolojik Altyapı
- [x] Three.js kütüphanesini projeye entegre et. (tamamlandı)
- [x] GLTFLoader ile 3D modelleri yükle. (tamamlandı)
- [x] dat.GUI ile ayarları kontrol edilebilir hale getir. (tamamlandı)
- [x] HTML/CSS/JavaScript altyapısını oluştur. (tamamlandı)

### 2. Geliştirme Ortamı
- [x] Visual Studio Code ile geliştirme ortamını kur. (tamamlandı)
- [x] Live Server ile projeyi çalıştır ve test et. (tamamlandı)

### 3. 3D Modeller ve Varlıklar
- [x] Kale duvarları modelini oluştur veya edin. (tamamlandı)
- [x] Mancınık modelini oluştur veya edin. (tamamlandı)
- [x] Taş modellerini oluştur veya edin. (tamamlandı)
- [x] Meşale modellerini oluştur veya edin. (tamamlandı)
- [x] Yüksek kaliteli kaplamalar (texture) ekle. (tamamlandı)
- [x] Mancınık ve taşlar için animasyonları oluştur. (tamamlandı)

### 4. Temel Özellikler
- [x] Kamera hareketlerini uygulamaya ekle. (tamamlandı)
- [x] Mancınık mekaniğini geliştir ve taş fırlatma özelliğini ekle. (tamamlandı)
- [x] Meşale aydınlatma sistemini oluştur. (tamamlandı)
- [x] Gece/gündüz geçişini dinamik olarak uygula. (tamamlandı)
- [x] Puanlama sistemini entegre et. (tamamlandı)

### 5. Kullanıcı Arayüzü
- [x] Işık parlaklığı ayarlarını kontrol edebilecek bir UI öğesi ekle. (tamamlandı)
- [x] Gece/gündüz geçiş butonlarını tasarla ve uygula. (tamamlandı)
- [x] Puan panelini oluştur ve entegre et. (tamamlandı)

### 6. Kullanıcı Etkileşimleri
- [x] Klavye ve fare ile sahne ve nesnelerle etkileşim mekanizmasını geliştir. (tamamlandı)
- [x] Fare ile kamera hareketlerini kontrol edilebilir hale getir. (tamamlandı)
- [x] Klavye ile mancınık kontrolünü sağla. (tamamlandı)

### 7. Oyun Mantığı
- [x] Puanlama sistemini geliştir ve hedeflere isabet durumunda puan ekle. (tamamlandı)
- [x] Etkileşim kurallarını belirle ve uygula. (tamamlandı)

### 8. Işıklandırma ve Efektler
- [x] Gündüz/gece ışık sistemini dinamik olarak uygula. (tamamlandı)
- [x] Meşale parlaklık ayarlarını kontrol edilebilir hale getir. (tamamlandı)

### 9. Varsayımlar ve Sınırlamalar
- [ ] Modern tarayıcı desteğini kontrol et.
- [ ] Düşük performanslı cihazlar için optimizasyon yap.

### 10. Kaynaklar
- [x] Three.js dokümantasyonunu incele ve kullan. (tamamlandı)
- [x] GLTFLoader kılavuzunu takip et. (tamamlandı)
- [x] dat.GUI rehberini kullanarak ayarları yapılandır. (tamamlandı)

### 11. Proje Özeti
- [x] Proje tanımını ve amacını uygulamaya yansıt. (tamamlandı)

### 12. Hedefler ve Amaçlar
- [x] Kullanıcıların ortaçağ atmosferini deneyimleyebileceği bir sahne oluştur. (tamamlandı)
- [x] Kullanıcıların sahne içinde serbestçe hareket edebilmesini sağla. (tamamlandı)
- [x] Mancınık mekaniğini ve gece/gündüz geçişlerini kontrol edilebilir hale getir. (tamamlandı)
- [ ] Mancınık mekaniğini ve gece/gündüz geçişlerini kontrol edilebilir hale getir.
