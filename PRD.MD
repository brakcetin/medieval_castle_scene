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
- [ ] Kamera hareketlerini uygulamaya ekle.
- [ ] Mancınık mekaniğini geliştir ve taş fırlatma özelliğini ekle.
- [ ] Meşale aydınlatma sistemini oluştur.
- [ ] Gece/gündüz geçişini dinamik olarak uygula.
- [ ] Puanlama sistemini entegre et.

### 5. Kullanıcı Arayüzü
- [ ] Işık parlaklığı ayarlarını kontrol edebilecek bir UI öğesi ekle.
- [ ] Gece/gündüz geçiş butonlarını tasarla ve uygula.
- [ ] Puan panelini oluştur ve entegre et.

### 6. Kullanıcı Etkileşimleri
- [ ] Klavye ve fare ile sahne ve nesnelerle etkileşim mekanizmasını geliştir.
- [ ] Fare ile kamera hareketlerini kontrol edilebilir hale getir.
- [ ] Klavye ile mancınık kontrolünü sağla.

### 7. Oyun Mantığı
- [ ] Puanlama sistemini geliştir ve hedeflere isabet durumunda puan ekle.
- [ ] Etkileşim kurallarını belirle ve uygula.

### 8. Işıklandırma ve Efektler
- [ ] Gündüz/gece ışık sistemini dinamik olarak uygula.
- [ ] Meşale parlaklık ayarlarını kontrol edilebilir hale getir.

### 9. Varsayımlar ve Sınırlamalar
- [ ] Modern tarayıcı desteğini kontrol et.
- [ ] Düşük performanslı cihazlar için optimizasyon yap.

### 10. Kaynaklar
- [ ] Three.js dokümantasyonunu incele ve kullan.
- [ ] GLTFLoader kılavuzunu takip et.
- [ ] dat.GUI rehberini kullanarak ayarları yapılandır.

### 11. Proje Özeti
- [ ] Proje tanımını ve amacını uygulamaya yansıt.

### 12. Hedefler ve Amaçlar
- [ ] Kullanıcıların ortaçağ atmosferini deneyimleyebileceği bir sahne oluştur.
- [ ] Kullanıcıların sahne içinde serbestçe hareket edebilmesini sağla.
- [ ] Mancınık mekaniğini ve gece/gündüz geçişlerini kontrol edilebilir hale getir.
