import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';
import { SceneManager } from './scene.js';
import { Catapult, Stone, Torch, HandTorch } from './objects.js';
import { BasitSoundManager } from './SoundManager.js';

// Ana uygulama sınıfı
class App {    constructor() {
        // DOM elementlerine erişim
        this.loadingElement = document.getElementById('loading');
        this.scoreElement = document.getElementById('score');
        this.dayNightToggle = document.getElementById('day-night-toggle');
        
        // Game Clock elements
        this.gameTimeElement = document.getElementById('game-time');
        this.timePeriodIconElement = document.getElementById('time-period-icon');
        this.timePeriodTextElement = document.getElementById('time-period-text');
        this.clockContainerElement = document.querySelector('.clock-container');
        
        // Three.js bileşenleri
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.sceneManager = null;
        
        // Kullanıcı girdisi
        this.keys = {};        // Zaman takibi
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        this.lastTimeUpdate = 0;
        this.lastShadowUpdate = 0; // Gölgelerin son güncellendiği zamanı tutmak için
          // Işık ve gökyüzü ayarları        this.isDay = true;
        this.gui = null;        this.timeOfDay = 12; // 0-24 saat arası (12 = öğlen)
        this.sunAngle = 0; // Güneşin açısı
        this.autoTimeFlow = true; // Otomatik zaman akışı
        this.timeFlowSpeed = 0.2; // Zaman akış hızı (saat/dakika) - daha yavaş ve gerçekçi
        this.shadowUpdateFrequency = 20; // Gölge güncelleme sıklığı (saniye) - daha yavaş güncelleme
        
        // Güneş pozisyonu interpolasyonu için yeni değişkenler
        this.currentSunPosition = new THREE.Vector3(0, 100, 0);
        this.targetSunPosition = new THREE.Vector3(0, 100, 0);
        this.sunLerpFactor = 0.02; // Yumuşak geçiş faktörü
        
        // Özel meşale
        this.handTorch = null;
        this.hasHandTorch = false;
        
        // Kaynaklar
        this.resources = {
            models: {},
            textures: {}
        };        // Kamera ayarları
        this.cameraSpeed = 5;
        this.cameraRotationSpeed = 0.002;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canRotate = false;
          // Performans optimizasyonları
        this.targetFPS = 60; // 60 FPS'e yükselt (daha akıcı deneyim için)
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.lastFPSCheck = 0;
        this.currentFPS = 0;
        this.lowPerfWarningShown = false; // Tekrarlayan uyarıları önlemek için
        
        // Memory management
        this.memoryCleanupInterval = 30000; // 30 saniyede bir temizlik
        this.lastMemoryCleanup = 0;
        this.maxObjectDistance = 100; // Nesnelerin maksimum görüş mesafesi
        
        // Kamera rotasyon açıları için ayrı değişkenler
        this.cameraYaw = 0; // Y ekseni etrafında dönüş (sağa/sola)
        this.cameraPitch = 0; // X ekseni etrafında dönüş (yukarı/aşağı)        // Etkileşim için yeni değişkenler
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
          // First-Person Mode variables (now default)
        this.isFirstPersonMode = true;  // Changed to true as default
        this.crosshairElement = null;
        this.pointerLocked = false;     // Track pointer lock state
        this.mouseSensitivity = 0.002;  // Mouse sensitivity for FPS controls
          // Mancınık etkileşim sistemi
        this.playerInventory = { 
            hasRock: false,
            collectedStone: null 
        };        // Bildirim sistemi
        this.notificationTimeout = null;
        this.catapultState = 'empty'; // 'empty', 'loaded', 'ready'
        
        // Power Bar Sistemi
        this.powerBarContainer = null;
        this.powerMarker = null;
        this.powerBarActive = false;
        this.markerPosition = 0; // 0-100 arası
        this.markerDirection = 1; // 1 = sağa, -1 = sola
        this.markerSpeed = 1.5; // Hareket hızı
        this.pendingCatapult = null; // Güç barı için bekleyen mancınık        this.pendingStone = null; // Güç barı için bekleyen taş
        this.animationId = null; // Animation frame ID
        
        // ESC Menü Sistemi
        this.isGamePaused = false;
        this.settingsMenuElement = null;
        this.escHintElement = null;
        
        // Başlatma
        this.init();
    }
      init() {        
        // Ses yöneticisini başlat
        if (window.getSesYoneticisi) {
            window.getSesYoneticisi(); // İlk çağrı ses yöneticisini oluşturur
            console.log("🔊 Ses sistemi başlatıldı");
        }
        
        // Renderer oluşturma - performans odaklı ayarlar
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('scene-canvas'),
            antialias: false, // Antialiasing kapalı (performans artışı)
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            logarithmicDepthBuffer: false // Performans için kapalı
        });
        
        // Performans ayarları
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Pixel ratio sınırlandı
        this.renderer.setSize(window.innerWidth, window.innerHeight);
          // Gölge ayarları - daha iyi kalite ve performans dengesi
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Daha yumuşak gölgeler için PCFSoftShadowMap
        this.renderer.shadowMap.autoUpdate = false; // Manuel güncelleme (kontrollü performans için)
          // Renderer optimizasyonları
        this.renderer.sortObjects = false; // Sorting'i kapat
        this.renderer.autoClear = true;
        
        // Gölge güncelleme zamanını izle
        this.lastShadowUpdate = 0;// Kamera oluşturma
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0.8, 10); // Kamera yüksekliğini düşürdük (1.6'dan 0.8'e)
        this.camera.lookAt(0, 0.8, 0);
        
        // Kamera başlangıç açılarını ayarla
        this.cameraYaw = 0; // Doğu-batı yönünde 0 açı
        this.cameraPitch = 0; // Yatay bakış
        this.camera.rotation.order = 'YXZ'; // Rotasyon sıralaması
        
        console.log("Kamera pozisyonu:", this.camera.position);
          // Scene Manager oluşturma
        this.sceneManager = new SceneManager(this.renderer, this.camera);
        
        // El meşalesini oluştur
        this.handTorch = new HandTorch(this.sceneManager, this.camera);
          // Reset fonksiyonu - tüm sahneyi temizler ve yeniden oluşturur
        window.resetScene = async () => {
            console.log("Sahne sıfırlanıyor...");
            
            // AssetLoader'ı temizle ve sıfırla
            try {
                const { assetLoader } = await import('./AssetLoader.js');
                console.log("Asset önbelleği temizleniyor...");
                assetLoader.clearCache();
            } catch (error) {
                console.warn("AssetLoader temizlenemedi:", error);
            }
            
            // Eski SceneManager'ı temizle
            if (this.sceneManager && this.sceneManager.scene) {
                console.log("SceneManager temizleniyor...");
                this.sceneManager.cleanupScene();
            }
            
            // Eski SceneManager'ı yok et
            this.sceneManager = null;
            
            // Yeni bir SceneManager oluştur
            console.log("Yeni SceneManager oluşturuluyor...");
            this.sceneManager = new SceneManager(this.renderer, this.camera);
            
            console.log("Sahne sıfırlandı");
            
            // Score'u sıfırla
            this.score = 0;
            if (this.scoreElement) {
                this.scoreElement.textContent = "0";
            }
        };        // Event listeners for FPS mode
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
        this.dayNightToggle.addEventListener('click', this.toggleDayNight.bind(this));
          // Pointer lock event listeners
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
        document.addEventListener('pointerlockerror', this.onPointerLockError.bind(this));
        
        // Pencere odak olaylarını dinle
        window.addEventListener('focus', this.onWindowFocus.bind(this));
        window.addEventListener('blur', this.onWindowBlur.bind(this));
        
        // Initialize first-person mode (now default)
        this.initializeFirstPersonMode();
        
        // Power Bar DOM elementlerini başlat
        this.initializePowerBar();
        
        // GUI oluşturma
        this.setupGUI();
          // Modelleri yükle
        this.loadModels();
        
        // ESC Menü Sistemini Başlat
        this.initializeEscMenu();
          // Animasyon döngüsünü başlat
        this.animate();
    }

    setupGUI() {
        console.log("setupGUI çağrıldı - HTML kontrolleri bağlanıyor...");
        
        // HTML slider kontrolleri
        const timeSlider = document.getElementById('time-slider');
        const timeDisplay = document.getElementById('time-display');
        
        if (timeSlider && timeDisplay) {
            timeSlider.addEventListener('input', (event) => {
                const value = parseFloat(event.target.value);
                this.timeOfDay = value;
                timeDisplay.textContent = value.toFixed(1);
                this.updateTimeOfDay(value);
            });
            console.log("HTML time slider bağlandı");
        } else {
            console.error("Time slider elementleri bulunamadı");
        }
        
        // dat.GUI'yi de deneyebiliriz (varsa)
        try {
            if (typeof dat !== 'undefined') {
                this.gui = new dat.GUI();
                console.log("dat.GUI başarıyla oluşturuldu");
                
                // Zaman Kontrolü
        const timeFolder = this.gui.addFolder('Zaman Ayarları');
                const timeSettings = {
                    saatAyarı: 12,
                    otomatikZamanAkışı: this.autoTimeFlow,
                    zamanAkışHızı: this.timeFlowSpeed
                };
                
                timeFolder.add(timeSettings, 'saatAyarı', 0, 24).onChange((value) => {
                    this.timeOfDay = value;
                    this.updateTimeOfDay(value);
                    // HTML slider'ı da güncelle
                    if (timeSlider) timeSlider.value = value;
                    if (timeDisplay) timeDisplay.textContent = value.toFixed(1);
                });                timeFolder.add(timeSettings, 'otomatikZamanAkışı').onChange((value) => {
                    this.autoTimeFlow = value;
                }).name('Otomatik Zaman');
                
                timeFolder.add(timeSettings, 'zamanAkışHızı', 0.01, 0.5).onChange((value) => {
                    this.timeFlowSpeed = value;
                }).name('Zaman Hızı');
                  // Gölge güncelleme sıklığı ve yumuşaklık ayarları
                const shadowSettings = {
                    gölgeGüncelleme: this.shadowUpdateFrequency,
                    geçişHızı: this.sunLerpFactor * 100 // 0-100 arası değer
                };
                
                timeFolder.add(shadowSettings, 'gölgeGüncelleme', 1, 60, 1).onChange((value) => {
                    this.shadowUpdateFrequency = value;
                }).name('Gölge Güncelleme (sn)');
                
                timeFolder.add(shadowSettings, 'geçişHızı', 0.1, 10).onChange((value) => {
                    this.sunLerpFactor = value / 100; // 0.0001 - 0.1 arası değer
                }).name('Gölge Yumuşaklığı');
                
                // Hemen gölgeleri güncelleme butonu
                const timeActions = {
                    gölgeleriGüncelle: () => {
                        this.updateSunPosition(this.timeOfDay, null, null, true);
                        console.log("Gölgeler manuel olarak güncellendi");
                    }
                };
                
                timeFolder.add(timeActions, 'gölgeleriGüncelle').name('Gölgeleri Güncelle');
                
                timeFolder.open();
                console.log("dat.GUI zaman kontrol slider'ı eklendi");
            }
        } catch (error) {
            console.log("dat.GUI yüklenemedi, HTML kontrolleri kullanılıyor:", error.message);
        }
        
        // Işık ayarları
        const lightFolder = this.gui.addFolder('Işık Ayarları');
        const lightSettings = {
            meşaleParlaklığı: 2,
            ambientIntensity: 0.5
        };
        
        lightFolder.add(lightSettings, 'meşaleParlaklığı', 0, 5).onChange((value) => {
            // Tüm meşaleleri güncelle
            if (this.sceneManager.objects.torches) {
                this.sceneManager.objects.torches.forEach(torch => {
                    torch.setIntensity(value);
                });
            }
        });
        
        lightFolder.add(lightSettings, 'ambientIntensity', 0, 1).onChange((value) => {
            if (this.sceneManager.scene.ambientLight) {
                this.sceneManager.scene.ambientLight.intensity = value;
            }
        });
        
        // Mancınık ayarları
        const catapultFolder = this.gui.addFolder('Mancınık Ayarları');
        const catapultSettings = {
            maxPower: 100
        };
        
        catapultFolder.add(catapultSettings, 'maxPower', 50, 200).onChange((value) => {
            if (this.sceneManager.objects.catapult) {
                this.sceneManager.objects.catapult.maxPower = value;
            }
        });
        
        // Kamera ayarları
        const cameraFolder = this.gui.addFolder('Kamera Ayarları');
        const cameraSettings = {
            speed: 5
        };
        
        cameraFolder.add(cameraSettings, 'speed', 1, 10);
    }      // Saate göre gün/gece döngüsü - gerçekçi geçişli
    updateTimeOfDay(hour, updateShadows = true) {
        // Zaman faktörü hesapla (0-1 arası değer)
        // 0: tam gece (gece 0:00), 0.5: öğlen (12:00), 1: tekrar gece (24:00)
        const timeFactor = hour / 24;
        
        // Güneşin açısı (0-2PI arası) - tam bir dönüş
        // Daha gerçekçi bir güneş eğrisi için eliptik yörünge kullan
        this.sunAngle = timeFactor * Math.PI * 2;
        
        // Güneş için gerçekçi bir yükseklik faktörü hesapla
        // 0 = gece yarısı, 1 = öğle vakti
        const dayProgress = (hour >= 6 && hour <= 18) 
            ? (hour - 6) / 12  // Gün içi (6-18 arası)
            : (hour < 6) 
                ? 0  // Gece yarısı ile şafak arası (0-6)
                : 0; // Gün batımı ile gece yarısı arası (18-24)
        
        // Güneşin yüksekliği için sinüs eğrisi kullan 
        // Bu daha gerçekçi bir güneş arkı oluşturuyor
        const sunHeight = Math.sin(dayProgress * Math.PI);
        
        // Gündüz-gece geçişleri için hassas zamanlar
        const isMorning = hour >= 5 && hour <= 8;     // Şafak/gün doğumu
        const isEvening = hour >= 17 && hour <= 20;   // Gün batımı/alacakaranlık
        const isDay = hour > 8 && hour < 17;          // Tam gündüz
        const isNight = hour > 20 || hour < 5;        // Tam gece
        
        // Gündüz mü gece mi?
        const isDayTime = hour >= 6 && hour <= 18;
        
        // Geçiş faktörleri hesapla
        let morningFactor = 0, eveningFactor = 0, dayFactor = 0, nightFactor = 0;
        
        if (isMorning) {
            morningFactor = (hour - 5) / 3; // 5 ile 8 arası için 0 ile 1 arası değer
        } else if (isEvening) {
            eveningFactor = (hour - 17) / 3; // 17 ile 20 arası için 0 ile 1 arası değer
        } else if (isDay) {
            dayFactor = 1; // Tam gündüz vakti
        } else {
            nightFactor = 1; // Tam gece vakti
        }
        
        // Güncel durumu ayarla
        this.isDay = isDayTime;
        
        // Renkler ve yoğunluklar için değişkenler
        let skyColor, fogColor, fogDensity;
        let sunIntensity, ambientIntensity, torchIntensity;
        
        if (isMorning) {
            // Şafak/Gün doğumu renkleri (turuncu/pembe tonu)
            const r = 0.5 + morningFactor * 0.3;  // Kızarıklık artıyor
            const g = 0.3 + morningFactor * 0.5;  // Yeşillik artıyor
            const b = 0.5 + morningFactor * 0.3;  // Mavi artıyor
            
            skyColor = new THREE.Color(r, g, b);
            fogColor = new THREE.Color(r * 0.9, g * 0.8, b * 0.8);
            fogDensity = 0.01 - morningFactor * 0.005;
            
            sunIntensity = 0.2 + morningFactor * 0.8;
            ambientIntensity = 0.2 + morningFactor * 0.3;
            torchIntensity = 5 - morningFactor * 4;
        }
        else if (isEvening) {
            // Gün batımı renkleri (kızıl/turuncu tonu)
            const r = 0.8 - eveningFactor * 0.5;  // Kızarıklık azalıyor
            const g = 0.5 - eveningFactor * 0.4;  // Yeşillik azalıyor
            const b = 0.4 - eveningFactor * 0.3;  // Mavi azalıyor
            
            skyColor = new THREE.Color(r, g, b);
            fogColor = new THREE.Color(r * 0.8, g * 0.7, b * 0.8);
            fogDensity = 0.005 + eveningFactor * 0.005;
            
            sunIntensity = 1.0 - eveningFactor * 0.9;
            ambientIntensity = 0.5 - eveningFactor * 0.3;
            torchIntensity = 1 + eveningFactor * 4;
        }
        else if (isDay) {
            // Tam gündüz renkleri (açık mavi)
            skyColor = new THREE.Color(0.4, 0.6, 0.8);
            fogColor = new THREE.Color(0.5, 0.6, 0.8);
            fogDensity = 0.004;
            
            sunIntensity = 1.0;
            ambientIntensity = 0.5;
            torchIntensity = 1.0;
        }
        else {
            // Tam gece renkleri (koyu mavi)
            skyColor = new THREE.Color(0.03, 0.03, 0.1);
            fogColor = new THREE.Color(0.02, 0.02, 0.08);
            fogDensity = 0.01;
            
            sunIntensity = 0.05;
            ambientIntensity = 0.15;
            torchIntensity = 5;
        }
        
        // Gökyüzü rengi güncelle
        this.sceneManager.scene.background = skyColor;
        
        // Sis efekti güncelle
        this.sceneManager.scene.fog = new THREE.FogExp2(fogColor, fogDensity);
        
        // Ambient ışık güncelle
        if (this.sceneManager.ambientLight) {
            this.sceneManager.ambientLight.intensity = ambientIntensity;
        }
          // Meşaleleri güncelle - otomatik gece/gündüz modu ve manuel kontrol
        if (this.sceneManager.objects.torches) {
            this.sceneManager.objects.torches.forEach(torch => {
                // Sadece otomatik modda olan meşaleleri güncelle
                if (torch.autoMode && !torch.manualOverride) {
                    torch.setAutoMode(isDayTime);
                }
                // Tüm meşalelerin temel yoğunluğunu güncelle (manuel olanlar dahil)
                torch.baseIntensity = torchIntensity;
                if (torch.isLit) {
                    torch.intensity = torchIntensity;
                }
            });
        }
          // Güneş ve gölgeler için güncelleme
        this.updateSunPosition(hour, sunHeight, sunIntensity, updateShadows);
        
        // Game Clock UI güncellemesi
        this.updateGameClockUI(hour, isDayTime, isMorning, isEvening);
        
        // Gece/gündüz geçiş butonu metnini güncelle
        if (isDayTime) {
            this.dayNightToggle.textContent = "Geceye Geç";
        } else {
            this.dayNightToggle.textContent = "Gündüze Geç";
        }
    }    // Güneş pozisyonu ve gölgeleri ayrı bir fonksiyonda güncelle
    updateSunPosition(hour, sunHeight = null, sunIntensity = null, updateShadows = true) {
        if (!this.sceneManager.directionalLight) return;
        
        // sunHeight veya sunIntensity değerleri verilmediyse hesaplayalım
        if (sunHeight === null || sunIntensity === null) {
            // Güneş yüksekliği ve yoğunluğu saat değerine göre hesaplama
            
            // 1. Günün saatine göre yükseklik faktörünü hesapla
            let calculatedSunHeight;
            let calculatedSunIntensity;
            
            const isMorning = hour >= 5 && hour <= 8;
            const isEvening = hour >= 17 && hour <= 20;
            const isDay = hour > 8 && hour < 17;
            
            if (isDay) {
                // Gün boyunca
                const dayProgress = (hour - 8) / 9; // 8-17 arası için 0-1
                calculatedSunHeight = Math.sin(dayProgress * Math.PI);
                calculatedSunIntensity = 1.0;
            } else if (isMorning) {
                // Gün doğumu
                const morningFactor = (hour - 5) / 3; // 5-8 arası için 0-1
                calculatedSunHeight = morningFactor * 0.5;
                calculatedSunIntensity = 0.2 + morningFactor * 0.8;
            } else if (isEvening) {
                // Gün batımı
                const eveningFactor = (hour - 17) / 3; // 17-20 arası için 0-1
                calculatedSunHeight = 0.5 - eveningFactor * 0.5;
                calculatedSunIntensity = 1.0 - eveningFactor * 0.9;
            } else {
                // Gece
                calculatedSunHeight = -0.2;
                calculatedSunIntensity = 0.05;
            }
            
            sunHeight = calculatedSunHeight;
            sunIntensity = calculatedSunIntensity;
        }
        
        // Güneşin gökyüzündeki konumunu hesapla
        // Tam bir 24 saatlik dönüş için
        const angleInRadians = ((hour - 6) / 24) * Math.PI * 2;
        
        // Daha gerçekçi bir eliptik yörünge
        const distance = 100;
        const x = Math.sin(angleInRadians) * distance;
        const z = Math.cos(angleInRadians) * distance;
        
        // Güneş yüksekliği, gündüz en yüksekte (y=100), gece yeraltında (y=-100)
        let y = 0;
        
        if (hour > 6 && hour < 18) {
            // Gündüz - sinüs eğrisi şeklinde yüksek bir yay
            const dayProgress = (hour - 6) / 12; // 0-1 arası
            y = Math.sin(dayProgress * Math.PI) * 100;
        } else {
            // Gece - yeraltında
            const nightProgress = (hour < 6) ? (hour + 6) / 12 : (hour - 18) / 12;
            y = -Math.sin(nightProgress * Math.PI) * 50; // Yeraltında daha alçak bir yay
        }
        
        // Hesaplanan pozisyonu hedef ve mevcut pozisyon olarak ayarla
        // Yalnızca gölge güncellemelerinde doğrudan pozisyonu değiştir
        if (updateShadows) {
            // Doğrudan güncelleme - gölge güncellemesi gerektiğinde
            this.sceneManager.directionalLight.position.set(x, y, z);
            // Mevcut konumu da güncelle ki lerp ile yumuşak geçiş yapabilelim
            this.currentSunPosition.copy(this.sceneManager.directionalLight.position);
        }
        
        // Her durumda hedef pozisyonu güncelle (yumuşak geçiş için)
        this.targetSunPosition.set(x, y, z);
        
        // Işık yoğunluğunu güncelle
        this.sceneManager.directionalLight.intensity = sunIntensity;
        
        // Gölgeleri seçici şekilde güncelle
        if (updateShadows) {
            // Gölgeleri zorla güncelle ve gölge haritasını yeniden oluştur
            this.renderer.shadowMap.needsUpdate = true;
            
            // Gölge kamerasını güneş konumuna göre ayarla
            if (this.sceneManager.directionalLight.shadow) {
                const shadowCamera = this.sceneManager.directionalLight.shadow.camera;
                
                // Gölge kamerasını güncelle
                shadowCamera.updateProjectionMatrix();
                
                // Sahnenin durumuna göre gölge ayarlarını optimize et
                this.sceneManager.directionalLight.shadow.needsUpdate = true;
            }
        }
    }

    // Güneşin hedef pozisyonunu hesaplayan yeni metod
    calculateTargetSunPosition(hour) {
        if (!this.sceneManager.directionalLight) return;
        
        // Açıyı hesapla (saat 6'da doğu, 18'de batı)
        const angleInRadians = ((hour - 6) / 24) * Math.PI * 2;
        
        // Daha gerçekçi bir eliptik yörünge
        const distance = 100;
        const x = Math.sin(angleInRadians) * distance;
        const z = Math.cos(angleInRadians) * distance;
        
        // Güneş yüksekliği, gündüz en yüksekte (y=100), gece yeraltında (y=-100)
        let y = 0;
        
        if (hour > 6 && hour < 18) {
            // Gündüz - sinüs eğrisi şeklinde yüksek bir yay
            const dayProgress = (hour - 6) / 12; // 0-1 arası
            y = Math.sin(dayProgress * Math.PI) * 100;
        } else {
            // Gece - yeraltında
            const nightProgress = (hour < 6) ? (hour + 6) / 12 : (hour - 18) / 12;
            y = -Math.sin(nightProgress * Math.PI) * 50; // Yeraltında daha alçak bir yay
        }
        
        // Hesaplanan pozisyonu hedef pozisyon olarak ayarla
        this.targetSunPosition.set(x, y, z);
    }
    
    // Yumuşak güneş hareketi için interpolasyon metodu
    smoothUpdateSunPosition() {
        if (!this.sceneManager.directionalLight) return;
        
        // Güneşin mevcut pozisyonunu al
        this.currentSunPosition.copy(this.sceneManager.directionalLight.position);
        
        // Linear interpolation (LERP) ile güneş pozisyonunu yumuşat
        this.currentSunPosition.lerp(this.targetSunPosition, this.sunLerpFactor);
        
        // Yeni pozisyonu uygula
        this.sceneManager.directionalLight.position.copy(this.currentSunPosition);
    }

    toggleHandTorch() {
        if (!this.handTorch) {
            // İlk kez F tuşuna basıldığında el meşalesini oluştur
            this.handTorch = new HandTorch(this.sceneManager);
            console.log("El meşalesi oluşturuldu!");
        }
        
        this.hasHandTorch = !this.hasHandTorch;
        
        if (this.hasHandTorch) {
            this.handTorch.show();
            console.log("El meşalesi açıldı!");
        } else {
            this.handTorch.hide();
            console.log("El meşalesi kapatıldı!");
        }
    }

    async loadModels() {
        // Yükleme ekranını göster
        if (this.loadingElement) {
            this.loadingElement.style.display = 'block';
        }
        
        try {
            // AssetLoader'ı içe aktar
            const { assetLoader } = await import('./AssetLoader.js');
            
            // Tüm modelleri önceden yükle
            console.log("Tüm modeller AssetLoader ile yükleniyor...");
            await assetLoader.preloadAllModels();
              // Scene Manager aracılığıyla sahneyi yükle
            await this.sceneManager.loadCastle();            // Mancınık SceneManager tarafından initializeCatapult() metodu ile oluşturulacak
            await this.sceneManager.initializeCatapult();
            console.log("Mancınık SceneManager tarafından oluşturuldu");
            
            // Mancınık yüklendikten sonra taşları oluştur
            await this.sceneManager.createStones();
            console.log("Taşlar mancınık yüklendikten sonra oluşturuldu");
            
            // NOT: Meşaleler artık sadece scene.js içindeki createTorches() metodu ile oluşturuluyor
            // NOT: Taşlar artık sadece scene.js içindeki createStones() metodu ile oluşturuluyor
            
            // Bu kısımda taş oluşturma kodu kaldırıldı - kalenin ortasındaki taş sorununu çözüyor
            
            // Yükleme tamamlandı, ekranı gizle
            if (this.loadingElement) {
                this.loadingElement.style.display = 'none';
            }
        } catch (error) {
            console.error("Model yükleme hatası:", error);
            
            // Hata durumunda eski yöntemle yükleyelim
            console.log("Klasik yüklemeye geçiliyor...");
            this.loadModelsLegacy();
        }
    }
    
    // Eski yöntem model yükleme (AssetLoader çalışmazsa)
    loadModelsLegacy() {
        console.log("Modeller klasik yöntemle yükleniyor...");
          const gltfLoader = new GLTFLoader();
        let totalModels = 3; // kale, mancınık+taşlar, meşaleler
        let loadedModels = 0;
        
        // Yükleme tamamlandığında kontrol
        const checkLoaded = () => {
            loadedModels++;
            if (loadedModels >= totalModels) {
                if (this.loadingElement) {
                    this.loadingElement.style.display = 'none';
                }
            }
        };
        
        // Kale modelini yükle
        gltfLoader.load('./models/castle.glb', (gltf) => {
            const castle = gltf.scene;            castle.name = "castle";
            castle.userData.type = "castle";
            
            // Kale ölçeğini sabit olarak ayarla
            castle.scale.set(0.34, 0.34, 0.34); // Değer 0.08'den 0.34'e yükseltildi
            castle.position.set(0, 0, 0);
            
            castle.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Varsa önceki kaleyi kaldır
            if (this.sceneManager.objects.castle) {
                this.sceneManager.scene.remove(this.sceneManager.objects.castle);
            }
            
            this.sceneManager.objects.castle = castle;
            this.sceneManager.scene.add(castle);
            
            checkLoaded();
        }, undefined, (error) => {
            console.error('Kale modeli yüklenirken hata oluştu:', error);
            checkLoaded();
        });        // Mancınık modelini SceneManager ile yükle
        this.sceneManager.initializeCatapult().then(() => {
            console.log("Mancınık SceneManager tarafından yüklendi (legacy mode)");
            
            // Mancınık yüklendikten sonra taşları oluştur
            return this.sceneManager.createStones();
        }).then(() => {
            console.log("Taşlar mancınık yüklendikten sonra oluşturuldu (legacy mode)");
            checkLoaded();
        }).catch(error => {
            console.error("Mancınık veya taşlar yüklenirken hata oluştu:", error);
            checkLoaded();
        });
          // Meşaleler scene.js içindeki createTorches() metodu ile oluşturuluyor
        // SceneManager'a meşaleleri yükleme talimatı ver
        this.sceneManager.createTorches().then(() => {
            console.log("Meşaleler SceneManager tarafından yüklendi (legacy mode)");
            checkLoaded();
        }).catch(error => {
            console.error("Meşaleler yüklenirken hata oluştu:", error);
            checkLoaded();
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
      toggleDayNight() {
        this.isDay = !this.isDay;
        
        if (this.isDay) {
            // Gündüz ayarları
            this.sceneManager.scene.background = new THREE.Color(0x87CEEB);
            if (this.sceneManager.directionalLight) {
                this.sceneManager.directionalLight.intensity = 0.8;
            }
            if (this.sceneManager.ambientLight) {
                this.sceneManager.ambientLight.intensity = 0.6;
            }
            // Meşale ışıklarını azalt
            if (this.sceneManager.objects.torches) {
                this.sceneManager.objects.torches.forEach(torch => {
                    torch.setIntensity(2);
                });
            }
            // Fog'u kaldır veya azalt
            this.sceneManager.scene.fog = new THREE.FogExp2(0xcccccc, 0.005);
            
            this.dayNightToggle.textContent = "Geceye Geç";
        } else {
            // Gece ayarları
            this.sceneManager.scene.background = new THREE.Color(0x000022);
            if (this.sceneManager.directionalLight) {
                this.sceneManager.directionalLight.intensity = 0.1;
            }
            if (this.sceneManager.ambientLight) {
                this.sceneManager.ambientLight.intensity = 0.2;
            }
            // Meşale ışıklarını artır
            if (this.sceneManager.objects.torches) {
                this.sceneManager.objects.torches.forEach(torch => {
                    torch.setIntensity(5);
                });
            }
            // Sis ekle
            this.sceneManager.scene.fog = new THREE.FogExp2(0x000022, 0.01);
            
            this.dayNightToggle.textContent = "Gündüze Geç";
        }
    }
      // Düşük performanslı donanım için optimizasyon metodu
    enableLowEndMode() {
        console.log("Düşük performans modu etkinleştiriliyor...");
        
        // Frame rate'i daha da düşür
        this.targetFPS = 20;
        this.frameInterval = 1000 / this.targetFPS;
        
        // Render distance'ı azalt
        this.maxObjectDistance = 50;
        
        // Kamera far plane'ini azalt
        this.camera.far = 200;
        this.camera.updateProjectionMatrix();
        
        // Fog'u daha yakın yap
        if (this.sceneManager.scene.fog) {
            this.sceneManager.scene.fog.near = 10;
            this.sceneManager.scene.fog.far = 50;
        }
        
        // Shadow map boyutunu daha da küçült
        if (this.sceneManager.directionalLight && this.sceneManager.directionalLight.shadow) {
            this.sceneManager.directionalLight.shadow.mapSize.width = 256;
            this.sceneManager.directionalLight.shadow.mapSize.height = 256;
        }
        
        // Meşale sayısını azalt
        if (this.sceneManager.objects.torches) {
            this.sceneManager.objects.torches.forEach((torch, index) => {
                if (index % 2 === 0) { // Her iki meşaleden birini gizle
                    torch.setIntensity(0);
                }
            });
        }
        
        console.log("Düşük performans modu etkinleştirildi");
    }
      // FPS'e göre otomatik kalite ayarı - daha az agresif
    autoAdjustQuality() {
        if (this.currentFPS < 15) { // Sadece çok düşük FPS'de müdahale et
            console.log("Kritik düşük FPS tespit edildi, kalite düşürülüyor...");
            this.enableLowEndMode();
        } else if (this.currentFPS < 20) {
            // Hafif optimizasyon
            this.maxObjectDistance = 75;
            console.log("Hafif performans optimizasyonu uygulandı");
        }
    }// Memory cleanup fonksiyonu
    performMemoryCleanup() {
        try {
            console.log("Memory cleanup başlatıldı...");
            
            // Texture cache temizliği
            if (THREE.Cache && THREE.Cache.files) {
                const cacheSize = Object.keys(THREE.Cache.files).length;
                if (cacheSize > 50) { // 50'den fazla cache varsa temizle
                    console.log(`Cache temizleniyor: ${cacheSize} dosya`);
                    THREE.Cache.clear();
                }
            }
            
            // Renderer info temizliği
            if (this.renderer && this.renderer.info && this.renderer.info.memory) {
                if (this.renderer.info.memory.geometries > 100) {
                    console.log("Fazla geometry tespit edildi, temizlik yapılıyor");
                    // Not calling dispose on renderer as it can cause issues
                    console.log("Geometry cleanup atlandı - potansiyel sorun");
                }
            }
            
            // Garbage collection önerisi (manuel)
            if (window.gc && typeof window.gc === 'function') {
                window.gc();
            }
            
            console.log("Memory cleanup tamamlandı");
        } catch (error) {
            console.warn("Memory cleanup sırasında hata:", error);
        }
    }// Null objeleri arraylerden temizle
    cleanupNullObjects() {
        if (!this.sceneManager.objects) return;
        
        try {            // Null taşları temizle
            if (this.sceneManager.objects.stones && Array.isArray(this.sceneManager.objects.stones)) {
                const originalLength = this.sceneManager.objects.stones.length;
                this.sceneManager.objects.stones = this.sceneManager.objects.stones.filter(stone => {
                    // More comprehensive validation
                    if (!stone) return false;
                    if (!stone.mesh) return false;
                    if (!stone.mesh.position) return false;
                    if (stone.isCollected) {
                        // Toplanan taşları tamamen kaldır
                        console.log("Removing collected stone from array");
                        if (stone.mesh && stone.mesh.parent) {
                            stone.mesh.parent.remove(stone.mesh);
                        }
                        return false;
                    }
                    return true;
                });
                
                const newLength = this.sceneManager.objects.stones.length;
                if (originalLength !== newLength) {
                    console.log(`Cleaned up ${originalLength - newLength} invalid stones`);
                }
            }
            
            // Null meşaleleri temizle
            if (this.sceneManager.objects.torches && Array.isArray(this.sceneManager.objects.torches)) {
                const originalLength = this.sceneManager.objects.torches.length;
                this.sceneManager.objects.torches = this.sceneManager.objects.torches.filter(torch => {
                    if (!torch) return false;
                    // Torch should have either light or model or position
                    if (!torch.light && !torch.model && !torch.position) return false;
                    return true;
                });
                
                const newLength = this.sceneManager.objects.torches.length;
                if (originalLength !== newLength) {
                    console.log(`Cleaned up ${originalLength - newLength} invalid torches`);
                }
            }
        } catch (error) {
            console.warn("Error during null object cleanup:", error);
        }
    }// Object culling ile nesne güncellemesi
    updateObjectsWithCulling() {
        if (!this.sceneManager.objects) return;
        
        const cameraPosition = this.camera.position;
        
        // Taşları distance culling ile güncelle
        if (this.sceneManager.objects.stones && Array.isArray(this.sceneManager.objects.stones)) {
            this.sceneManager.objects.stones.forEach((stone, index) => {
                try {
                    // Comprehensive null check
                    if (!stone || !stone.mesh || !stone.mesh.position || stone.isCollected) return;
                    
                    const distance = cameraPosition.distanceTo(stone.mesh.position);
                    
                    // Çok uzaktaki taşları gizle
                    if (distance > this.maxObjectDistance) {
                        if (stone.mesh && typeof stone.mesh.visible !== 'undefined') {
                            stone.mesh.visible = false;
                        }
                    } else {
                        if (stone.mesh && typeof stone.mesh.visible !== 'undefined') {
                            stone.mesh.visible = true;
                        }
                        
                        // Yakındaki taşları daha az sıklıkla güncelle
                        if (distance > 50) {
                            // Uzaktaki taşları her 3. frame'de güncelle
                            if (this.frameCount % 3 !== 0) return;
                        }
                    }
                } catch (error) {
                    console.warn(`Stone culling error at index ${index}:`, error);
                    // Remove problematic stone from array
                    this.sceneManager.objects.stones.splice(index, 1);
                }
            });
        }
        
        // Meşaleleri distance culling ile güncelle
        if (this.sceneManager.objects.torches && Array.isArray(this.sceneManager.objects.torches)) {
            this.sceneManager.objects.torches.forEach((torch, index) => {
                try {
                    // Comprehensive null check
                    if (!torch) return;
                    
                    // Torch'lar için model pozisyonunu kullan
                    let torchPosition;
                    if (torch.model && torch.model.position) {
                        torchPosition = torch.model.position;
                    } else if (torch.position) {
                        torchPosition = torch.position;
                    } else {
                        return; // No valid position found
                    }
                    
                    const distance = cameraPosition.distanceTo(torchPosition);
                    
                    if (distance > this.maxObjectDistance) {
                        if (torch.light && typeof torch.light.visible !== 'undefined') {
                            torch.light.visible = false;
                        }
                        if (torch.model && typeof torch.model.visible !== 'undefined') {
                            torch.model.visible = false;
                        }
                    } else {
                        if (torch.light && typeof torch.light.visible !== 'undefined') {
                            torch.light.visible = true;
                        }
                        if (torch.model && typeof torch.model.visible !== 'undefined') {
                            torch.model.visible = true;
                        }
                    }
                } catch (error) {
                    console.warn(`Torch culling error at index ${index}:`, error);
                    // Remove problematic torch from array
                    this.sceneManager.objects.torches.splice(index, 1);
                }
            });
        }
    }    updateScore(value) {
        this.sceneManager.score = Math.max(0, this.sceneManager.score + value); // Ensure score never goes below 0
        this.scoreElement.textContent = this.sceneManager.score;
    }

    // Ana animasyon döngüsü - Performance optimized
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const currentTime = performance.now();
        
        // Oyun duraklatıldıysa sadece render yap
        if (this.isGamePaused) {
            this.renderer.render(this.sceneManager.scene, this.camera);
            return;
        }
        
        // Delta time hesaplama (frame limiting kaldırıldı - daha akıcı performans için)
        this.deltaTime = this.clock.getDelta();
        
        // Delta time'ı sınırla (çok büyük değerleri önle)
        this.deltaTime = Math.min(this.deltaTime, 0.033); // Max 33ms (30 FPS minimum)
          // FPS hesaplama ve izleme (5 saniyede bir kontrol et)
        this.frameCount++;
        if (currentTime - this.lastFPSCheck > 5000) { // 5 saniyede bir FPS kontrol et
            this.currentFPS = Math.round(this.frameCount / 5); // 5 saniye için ortalama
            this.frameCount = 0;
            this.lastFPSCheck = currentTime;
            
            // Performans izleme - sadece gerçekten düşük FPS'de uyar
            if (this.currentFPS < 20 && !this.lowPerfWarningShown) {
                console.log(`⚠️ Düşük FPS tespit edildi: ${this.currentFPS}`);
                this.lowPerfWarningShown = true; // Bir kez uyar
                this.autoAdjustQuality();
            } else if (this.currentFPS >= 25) {
                this.lowPerfWarningShown = false; // FPS düzelirse uyarıyı sıfırla
            }
        }        // Memory cleanup kontrolü (60 saniyede bir - daha az sıklıkla)
        if (currentTime - this.lastMemoryCleanup > 60000) { // 60 saniyede bir
            this.performMemoryCleanup();
            this.lastMemoryCleanup = currentTime;
        }          // Otomatik zaman akışı
        if (this.autoTimeFlow) {
            // Zamanı ilerlet
            this.timeOfDay += this.deltaTime * this.timeFlowSpeed;
            
            // 24 saatlik döngüyü sağla
            if (this.timeOfDay >= 24) {
                this.timeOfDay -= 24;
            }
              // Her frame'de sadece ışık ve renk geçişlerini güncelle - gölgeleri değil
            this.updateTimeOfDay(this.timeOfDay, false);
            
            // Güneş pozisyonunu belirli aralıklarla güncelle ve hedef pozisyonu belirle
            const shadowUpdateInterval = this.shadowUpdateFrequency * 1000;
            if (currentTime - this.lastShadowUpdate > shadowUpdateInterval) {
                // Güneş pozisyonu için yeni hedef belirle
                this.calculateTargetSunPosition(this.timeOfDay);
                
                // Tam güncelleme ile gölgeleri güncelle (gerçek güncelleme shadow map için)
                this.updateSunPosition(this.timeOfDay, null, null, true);
                this.lastShadowUpdate = currentTime;
            } else {
                // Ara karelerde yumuşak geçiş için lerp uygula
                this.smoothUpdateSunPosition();
            }
            
            // HTML slider ve göstergeyi sadece belirli aralıklarla güncelle (performans için)
            if (Math.floor(currentTime / 2000) !== Math.floor(this.lastTimeUpdate / 2000)) {  // 2 saniyede bir
                this.lastTimeUpdate = currentTime;
                
                // HTML slider'ı ve göstergeyi de güncelle
                const timeSlider = document.getElementById('time-slider');
                const timeDisplay = document.getElementById('time-display');
                if (timeSlider) timeSlider.value = this.timeOfDay;
                if (timeDisplay) timeDisplay.textContent = this.timeOfDay.toFixed(1);
            }
        }
        
        // Scene güncellemeleri
        if (this.sceneManager) {
            this.sceneManager.update(this.deltaTime);
        }
        
        // Performans optimizasyonları - daha az sıklıkla çalıştır
        if (this.frameCount % 30 === 0) { // Her 30 frame'de bir (yaklaşık 0.5 saniyede bir)
            this.cleanupNullObjects();
            this.updateObjectsWithCulling();
        }
        
        // El meşalesi güncelleme
        if (this.handTorch && this.hasHandTorch) {
            this.handTorch.update(this.deltaTime, this.camera);
        }
          // Kamera kontrolleri (manuel)
        this.updateCameraMovement();
        
        // Shadow map güncellemesi (performans için çok sınırlı)
        if (this.frameCount % 10 === 0) { // Her 10. frame'de shadow update (daha az sıklıkta)
            this.renderer.shadowMap.needsUpdate = true;
        }
          // Render
        this.renderer.render(this.sceneManager.scene, this.camera);
    }
    
    // Kamera hareketi güncelleme
    updateCameraMovement() {
        const moveSpeed = this.cameraSpeed * this.deltaTime;
        const rotateSpeed = this.cameraRotationSpeed;
        
        // Kamera hareketi
        if (this.moveForward) {
            this.camera.position.x -= Math.sin(this.cameraYaw) * moveSpeed;
            this.camera.position.z -= Math.cos(this.cameraYaw) * moveSpeed;
        }
        if (this.moveBackward) {
            this.camera.position.x += Math.sin(this.cameraYaw) * moveSpeed;
            this.camera.position.z += Math.cos(this.cameraYaw) * moveSpeed;
        }
        if (this.moveLeft) {
            this.camera.position.x -= Math.cos(this.cameraYaw) * moveSpeed;
            this.camera.position.z += Math.sin(this.cameraYaw) * moveSpeed;
        }
        if (this.moveRight) {
            this.camera.position.x += Math.cos(this.cameraYaw) * moveSpeed;
            this.camera.position.z -= Math.sin(this.cameraYaw) * moveSpeed;
        }
        
        // Kamera yüksekliğini sınırla
        this.camera.position.y = Math.max(0.5, Math.min(50, this.camera.position.y));
        
        // Kamera rotasyonunu uygula
        this.camera.rotation.x = this.cameraPitch;
        this.camera.rotation.y = this.cameraYaw;
    }
      // Event handlers for camera movement
    onKeyDown(event) {
        // ESC tuşu - menüyü aç/kapat (her zaman çalışsın)
        if (event.code === 'Escape') {
            event.preventDefault();
            this.toggleSettingsMenu();
            return;
        }
        
        // Oyun duraklatıldıysa diğer tuşları engelle
        if (this.isGamePaused) {
            return;
        }
        
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true;
                break;
            case 'KeyF':
                this.toggleHandTorch();
                break;case 'Space':
                event.preventDefault();
                // Power bar aktifse durdurmak için space tuşu
                if (this.powerBarActive) {
                    this.stopPowerBar();
                }
                break;
        }
    }
      onKeyUp(event) {
        // Oyun duraklatıldıysa tuşları engelle
        if (this.isGamePaused) {
            return;
        }
        
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false;
                break;        }
    }

    onMouseDown(event) {
        // Sol tık (button === 0) ve sağ tık (button === 2) ile kamera kontrolü
        if (event.button === 0 || event.button === 2) {
            this.canRotate = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            
            // Store click position for click detection
            this.clickStartPos = { x: event.clientX, y: event.clientY };
            this.clickStartTime = Date.now();
            
            // Only prevent default for mouse movement, not clicks
            // event.preventDefault(); // Commented out to allow click events
            
            // Pointer lock sistemi için canvas'ı aktif et (sadece drag işlemi için)
            // const canvas = document.getElementById('scene-canvas');
            // if (canvas && document.pointerLockElement !== canvas) {
            //     canvas.requestPointerLock();
            // }
        }
    }
      onMouseUp(event) {
        // Sol tık ve sağ tık için kamera kontrolünü durdur
        if (event.button === 0 || event.button === 2) {
            this.canRotate = false;
            
            // Check if this was a click (not a drag)
            const timeDiff = Date.now() - (this.clickStartTime || 0);
            const moveDistance = this.clickStartPos ? 
                Math.sqrt(
                    Math.pow(event.clientX - this.clickStartPos.x, 2) + 
                    Math.pow(event.clientY - this.clickStartPos.y, 2)
                ) : 0;
            
            // If it was a quick click without much movement, treat as click
            if (timeDiff < 200 && moveDistance < 5) {
                console.log("Quick click detected, allowing click event to fire");
                // Don't prevent default to allow click event
            } else {
                console.log("Drag detected, preventing click event");
                // event.preventDefault(); // Still prevent for drags
            }
            
            // Reset click tracking
            this.clickStartPos = null;
            this.clickStartTime = null;
            
            // Pointer lock'u serbest bırak
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        }
    }    // FPS-style mouse movement
    onMouseMove(event) {
        if (!this.isFirstPersonMode) return;
        
        // Oyun duraklatıldıysa mouse hareketini engelle
        if (this.isGamePaused) {
            return;
        }
        
        // Use movement from pointer lock if available, otherwise calculate manually
        let movementX, movementY;
        
        if (document.pointerLockElement === document.getElementById('scene-canvas')) {
            movementX = event.movementX || 0;
            movementY = event.movementY || 0;
        } else {
            // Fallback for when pointer lock is not active
            movementX = event.clientX - (this.lastMouseX || event.clientX);
            movementY = event.clientY - (this.lastMouseY || event.clientY);
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
        
        // Apply mouse sensitivity
        this.cameraYaw -= movementX * this.mouseSensitivity;
        this.cameraPitch -= movementY * this.mouseSensitivity;
        
        // Limit pitch (prevent camera from flipping)        this.cameraPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraPitch));
    }

    onClick(event) {
        try {
            console.log("=== CLICK EVENT FIRED ===");
            
            // Oyun duraklatıldıysa tıklamaları engelle
            if (this.isGamePaused) {
                return;
            }
            
            // Handle pointer lock request on first click
            if (!this.pointerLocked && this.isFirstPersonMode) {
                this.requestPointerLock();
                return;
            }
            
            // In first-person mode, always use center-screen raycasting
            if (this.isFirstPersonMode) {
                this.onFirstPersonClick();
                return;
            }
            
            // Legacy mouse-based interaction (not used in FPS mode)
            console.log("Click coordinates:", event.clientX, event.clientY);
            console.log("Window size:", window.innerWidth, window.innerHeight);
            
            // Mouse pozisyonunu normalize et
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            console.log("Normalized mouse coords:", this.mouse.x, this.mouse.y);
              // Raycasting - sadece görünür ve aktif nesneleri kontrol et
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Önce tüm intersections'ı al
            const allIntersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);
            
            // Sadece görünür ve clickable nesneleri filtrele
            const intersects = allIntersects.filter(intersection => {
                const obj = intersection.object;
                
                // Görünür olmalı
                if (!obj.visible) return false;
                
                // Parent'ı da görünür olmalı (recursive check)
                let parent = obj.parent;
                while (parent) {
                    if (!parent.visible) return false;
                    parent = parent.parent;
                }
                
                // Eğer userData varsa, type kontrolü yap
                if (obj.userData && obj.userData.type === 'collected_stone') {
                    return false; // Topunanmış taşları dahil etme
                }
                
                return true;
            });
            
            console.log(`Total intersections: ${allIntersects.length}, Filtered: ${intersects.length}`);
            
            console.log(`Click detected, ${intersects.length} intersections found`);
              if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                
                // ÖNCE görünürlük kontrolü yap - görünmez objeleri tamamen atla
                if (!clickedObject.visible) {
                    console.log("🚫 Clicked object is invisible, skipping");
                    return;
                }
                
                console.log("=== CLICK DEBUG ===");
                console.log("Clicked object type:", clickedObject.type);
                console.log("Clicked object name:", clickedObject.name);
                console.log("Clicked object UUID:", clickedObject.uuid);
                console.log("Clicked object userData:", clickedObject.userData);
                console.log("Clicked object visible:", clickedObject.visible);
                console.log("Clicked object parent:", clickedObject.parent?.type);
                console.log("Distance:", intersects[0].distance);
                console.log("==================");
                
                  // Taş toplama kontrolü - önce userData kontrolü yap, sonra stones array'inde ara
                let stone = null;
                
                // Method 1: userData ile direkt erişim
                if (clickedObject.userData && clickedObject.userData.type === 'stone' && clickedObject.userData.stoneRef) {
                    stone = clickedObject.userData.stoneRef;
                    console.log("Stone found via userData");
                }
                  // Method 2: stones array'inde mesh'i match eden taşı bul
                if (!stone && this.sceneManager.objects.stones && Array.isArray(this.sceneManager.objects.stones)) {
                    stone = this.sceneManager.objects.stones.find(s => {
                        // Check if the clicked object matches this stone's mesh or is a child of it
                        if (!s || !s.mesh) return false;
                        
                        // ÖNCE collection durumunu kontrol et
                        if (s.isCollected || s.isBeingCollected) return false;
                        
                        // Mesh'in görünür olduğunu kontrol et
                        if (!s.mesh.visible) return false;
                        
                        if (s.mesh === clickedObject) return true;
                        
                        // Check if clicked object is a child of the stone mesh
                        let parent = clickedObject.parent;
                        while (parent) {
                            if (parent === s.mesh) return true;
                            parent = parent.parent;
                        }
                        
                        return false;
                    });
                      if (stone) {
                        console.log("Stone found via array search");
                    }
                }                // Stone collection logic - let collect() method handle its own locking
                if (stone && !stone.isCollected && !stone.isBeingCollected) {
                    
                    // 🚨 INVENTORY KONTROLÜ - Envanterde zaten taş varsa yeni taş almayı engelle
                    if (this.playerInventory.hasRock && this.playerInventory.collectedStone) {
                        console.log("🚫 ENVANTER DOLU! Mevcut taşı mancınığa yerleştirmeden yeni taş alamazsınız!");
                        this.showNotification("Envanterde zaten taş var! Önce mancınığa yerleştirin.", 3000, 'warning');
                        return; // Yeni taş almayı engelle
                    }
                    
                    console.log("Stone found and collecting...");
                    
                    console.log("Stone mesh visible before collection:", stone.mesh ? stone.mesh.visible : "no mesh");
                    console.log("Stone mesh parent before collection:", stone.mesh ? stone.mesh.parent?.type : "no mesh");
                    console.log("Stone in scene before collection:", stone.mesh ? this.sceneManager.scene.children.includes(stone.mesh) : "no mesh");
                      if (stone.collect && typeof stone.collect === 'function') {
                        const collected = stone.collect();if (collected) {
                            console.log("✅ TAŞ BAŞARIYLA TOPLANDI - tek tıklamada!");
                              // Score ve inventory güncelle
                            this.updateScore(10);
                            console.log("Taş toplandı! +10 puan");
                            this.playerInventory.hasRock = true; // Taşı envantere ekle
                            this.playerInventory.collectedStone = stone; // Taşı referansını sakla
                            

                            // Envanter UI'nı güncelle
                            this.updateInventoryUI();
                            

                            // Ekranda toplama mesajı göster
                            this.showNotification("Taş toplandı! Mancınığa yüklemek için mancınığa tıklayın.", 3000, 'success');
                            

                            // Collection başarılı oldu, işlemi sonlandır
                            return;
                        } else {
                            console.log("❌ Collection failed");
                            stone.isBeingCollected = false; // Lock'u kaldır
                        }                    }                } else if (stone && (stone.isCollected || stone.isBeingCollected)) {
                    console.log("⚠️ Bu taş zaten toplandı veya toplanıyor - yeni tıklama engellendi");
                    return;                }
                
                // Mancınık kontrolü - taş yükleme ve fırlatma
                else if (clickedObject.userData && (clickedObject.userData.type === 'catapult_part' || clickedObject.userData.type === 'catapult')) {
                    console.log("🏹 Mancınık tıklandı");
                    
                    const catapult = this.sceneManager.objects.catapult;
                    
                    // Oyuncunun envanterinde taş varsa mancınığa yükle
                    if (this.playerInventory.hasRock && this.playerInventory.collectedStone && catapult && !catapult.hasStone) {
                        console.log("📦 Taş mancınığa yükleniyor...");
                        
                        const loaded = catapult.loadStone(this.playerInventory.collectedStone);
                          if (loaded) {
                            this.playerInventory.hasRock = false;
                            this.playerInventory.collectedStone = null;
                            
                            // Envanter UI'nı güncelle
                            this.updateInventoryUI();
                            
                            this.showNotification("✅ Taş mancınığa yüklendi! Fırlatmak için tekrar tıklayın!", 3000, 'success');
                        }
                    }                    // Mancınık zaten yüklüyse power bar'ı başlat
                    else if (catapult && catapult.hasStone) {
                        console.log("🎯 Power bar başlatılıyor...");
                        this.startPowerBar(catapult, catapult.loadedStone);
                        this.showNotification("🎯 Doğru zamanda tıklayarak atış gücünü belirleyin!", 3000, 'info');
                    }
                    // Taş yok uyarısı
                    else {
                        this.showNotification("⚠️ Önce bir taş toplamalısınız!", 3000, 'warning');
                    }                }
                
                // Meşale kontrolü - Manuel açma/kapama
                else if (clickedObject.userData && clickedObject.userData.type === 'torch' && clickedObject.userData.torchRef) {
                    console.log("🔥 Meşale tıklandı");
                    this.handleTorchInteraction(clickedObject.userData.torchRef);
                }
                
                // Debug için - genel nesne bilgisi
                console.log("Clicked object info:", {
                    name: clickedObject.name,
                    type: clickedObject.type,
                    userData: clickedObject.userData,
                    position: clickedObject.position
                });
            } else {
                console.log("No objects clicked");
            }
        } catch (error) {
            console.error("Error in onClick:", error);
        }
   }
      // Ekranda bildirim gösterme metodu - gelişmiş versiyon
    showNotification(message, duration = 3000, type = 'info') {
        // Önceki bildirimi temizle
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
        
        // Bildirim elementi var mı kontrol et
        let notificationElement = document.getElementById('game-notification');
        
        if (!notificationElement) {
            // Element yoksa oluştur
            notificationElement = document.createElement('div');
            notificationElement.id = 'game-notification';
            notificationElement.style.position = 'fixed';
            notificationElement.style.bottom = '20px';
            notificationElement.style.left = '50%';
            notificationElement.style.transform = 'translateX(-50%)';
            notificationElement.style.color = 'white';
            notificationElement.style.padding = '10px 20px';
            notificationElement.style.borderRadius = '5px';
            notificationElement.style.fontWeight = 'bold';
            notificationElement.style.zIndex = '1000';
            notificationElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-out';
            document.body.appendChild(notificationElement);
        }
        
        // Bildirim tipine göre renk ve ikon ayarla
        let bgColor, icon;
        switch (type) {
            case 'success':
                bgColor = 'rgba(46, 125, 50, 0.9)'; // Yeşil
                icon = '✅ ';
                break;
            case 'warning':
                bgColor = 'rgba(237, 108, 2, 0.9)'; // Turuncu
                icon = '⚠️ ';
                break;
            case 'error':
                bgColor = 'rgba(211, 47, 47, 0.9)'; // Kırmızı
                icon = '❌ ';
                break;
            case 'info':
            default:
                bgColor = 'rgba(0, 0, 0, 0.8)';
                icon = 'ℹ️ ';
                break;
        }
        
        notificationElement.style.backgroundColor = bgColor;
        
        // Mesajı ayarla ve göster
        notificationElement.textContent = icon + message;
        notificationElement.style.opacity = '1';
        notificationElement.style.transform = 'translateX(-50%) translateY(0)';
        
        // Animasyon efekti ekle
        notificationElement.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => {
            notificationElement.style.transform = 'translateX(-50%) translateY(0)';
        }, 50);
        
        // Belirli bir süre sonra bildirim kaybolsun
        this.notificationTimeout = setTimeout(() => {
            notificationElement.style.opacity = '0';
            notificationElement.style.transform = 'translateX(-50%) translateY(20px)';        }, duration);
    }
      // Envanter UI'nı güncelleyen fonksiyon
    updateInventoryUI() {
        const inventoryElement = document.getElementById('inventory-status');
        if (!inventoryElement) return;
        
        if (this.playerInventory.hasRock && this.playerInventory.collectedStone) {
            inventoryElement.textContent = '🗿 Envanter: Taş Var';
            inventoryElement.style.color = '#4CAF50'; // Yeşil
            inventoryElement.style.fontWeight = 'bold';
        } else {
            inventoryElement.textContent = '🎒 Envanter: Boş';
            inventoryElement.style.color = '#666';
            inventoryElement.style.fontWeight = 'normal';
        }
    }

    // Power Bar Sistemi Metodları
    initializePowerBar() {
        this.powerBarContainer = document.getElementById('power-bar-container');
        this.powerMarker = document.getElementById('power-marker');
        
        if (!this.powerBarContainer || !this.powerMarker) {
            console.error("Power bar elementleri bulunamadı!");
            return;
        }
        
        // Power bar click event'i (marker'ı durdurmak için)
        this.powerBarContainer.addEventListener('click', (event) => {
            if (this.powerBarActive) {
                event.stopPropagation();
                this.stopPowerBar();
            }
        });        console.log("🎯 Power bar sistemi başlatıldı");
    }

    // First-Person Mode System (Always Active)
    initializeFirstPersonMode() {
        console.log("🎯 Initializing first-person mode system (always active)...");

        // Get crosshair element
        this.crosshairElement = document.getElementById('crosshair');

        if (!this.crosshairElement) {
            console.error("❌ Crosshair element not found! Check if #crosshair exists in HTML");
            return;
        }

        console.log("✅ Found crosshair element:", this.crosshairElement);

        // Enable first-person mode immediately (no toggle)
        this.enableFirstPersonMode();

        console.log("🎯 First-person mode system initialized successfully (always active)");
    }

    // Enable first-person mode (called automatically, no toggle)
    enableFirstPersonMode() {
        console.log("🎯 Enabling first-person mode (automatic)...");

        const body = document.body;
        body.classList.add('fps-mode');
        this.crosshairElement.style.display = 'block';

        // Hide or remove the toggle button if it exists
        const fpsToggleElement = document.getElementById('fps-toggle');
        if (fpsToggleElement) {
            fpsToggleElement.style.display = 'none';
            console.log("🎯 FPS toggle button hidden (first-person is always active)");
        }

        this.showNotification("🎯 Birinci Şahıs Modu Aktif! Bakmak için fare, etkileşim için ekranın ortasına tıklayın!", 3000, 'info');
        console.log("✅ First-person mode enabled successfully");
    }    // Pointer Lock Methods for FPS Controls
    requestPointerLock() {
        const canvas = document.getElementById('scene-canvas');
        if (canvas && document.pointerLockElement !== canvas) {
            canvas.requestPointerLock();
            console.log("🔒 Pointer lock requested");
        }
    }    onPointerLockChange() {
        const canvas = document.getElementById('scene-canvas');
        this.pointerLocked = (document.pointerLockElement === canvas);
        
        // İmleç görünürlüğünü güncelle
        this.updateCursorVisibility();
        
        if (this.pointerLocked) {
            console.log("🔒 Pointer kilidi etkin - FPS kontrolleri etkin");
            this.showNotification("🎮 FPS Kontrolleri Aktif! Fare kilidini açmak için ESC", 2000, 'success');
        } else {
            console.log("🔓 Pointer lock deactivated");
            this.showNotification("🖱️ Fare kilidi açıldı - FPS kontrollerini yeniden etkinleştirmek için tıklayın", 2000, 'info');
        }
    }

    onPointerLockError() {
        console.error("❌ Pointer kilidi hatası oluştu");
        this.pointerLocked = false;
        this.showNotification("❌ FPS kontrolleri için fare kilitlenemedi", 2000, 'error');
    }
    
    // Pencere odak olayları yönetimi
    onWindowFocus() {
        console.log("🪟 Pencere odak aldı");
        this.updateCursorVisibility();
    }
    
    onWindowBlur() {
        console.log("🪟 Pencere odaktan çıktı");
        // Pencere odaktan çıktığında fare imlecini her zaman görünür yap
        document.body.style.cursor = 'default';
    }
    
    // İmleç görünürlüğünü güncel duruma göre ayarlayan metod
    updateCursorVisibility() {
        // Pointer lock aktif değilse veya oyun duraklatılmışsa imleci görünür yap
        if (!this.pointerLocked || this.isGamePaused) {
            document.body.style.cursor = 'default';
            console.log("🖱️ İmleç görünür yapıldı (pointer lock kapalı veya oyun duraklatıldı)");
        } else {
            document.body.style.cursor = 'none';
            console.log("🖱️ İmleç gizlendi (pointer lock aktif)");
        }
    }
    
    // Pointer lock ipucu gösterme metodu
    showPointerLockHint() {
        console.log("🔒 Pointer lock ipucu gösteriliyor...");
        this.showNotification("🖱️ FPS kontrollerini yeniden etkinleştirmek için ekrana tıklayın", 4000, 'info');
        
        // Ek olarak bir puls animasyonu ile crosshair'i vurgula
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.style.animation = 'pulse 1s ease-in-out 3';
        }
    }

    // First-person click handler with center-screen raycasting
    onFirstPersonClick() {
        if (!this.isFirstPersonMode) return;
        
        console.log("🎯 Birinci şahıs tıklaması tespit edildi");
        
        // Use center of screen (0, 0) for raycasting
        const centerMouse = new THREE.Vector2(0, 0);
        this.raycaster.setFromCamera(centerMouse, this.camera);
        
        // Get all intersections from center screen
        const allIntersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);
        
        // Filter for visible and interactive objects
        const intersects = allIntersects.filter(intersection => {
            const obj = intersection.object;
            
            // Must be visible
            if (!obj.visible) return false;
            
            // Parent chain must be visible
            let parent = obj.parent;
            while (parent) {
                if (!parent.visible) return false;
                parent = parent.parent;
            }
            
            // Exclude collected stones
            if (obj.userData && obj.userData.type === 'collected_stone') {
                return false;
            }
            
            return true;
        });
        
        console.log(`🎯 First-person raycast found ${intersects.length} valid objects`);
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            console.log("🎯 First-person target:", clickedObject.type, clickedObject.name);
            
            // Add crosshair pulse animation
            this.crosshairElement.classList.add('crosshair-pulse');
            setTimeout(() => {
                this.crosshairElement.classList.remove('crosshair-pulse');
            }, 500);
            
            // Handle stone interaction
            const stone = this.findStoneFromObject(clickedObject);
            if (stone && !stone.isCollected && !stone.isBeingCollected) {
                console.log("🎯 First-person stone interaction");
                this.handleStoneInteraction(stone);
                return;
            }
              // Handle catapult interaction
            if (clickedObject.userData && (clickedObject.userData.type === 'catapult_part' || clickedObject.userData.type === 'catapult')) {
                console.log("🎯 First-person catapult interaction");
                this.handleCatapultInteraction();
                return;
            }
            
            // Handle torch interaction
            if (clickedObject.userData && clickedObject.userData.type === 'torch') {
                console.log("🎯 First-person torch interaction");
                this.handleTorchInteraction(clickedObject.userData.torchRef);
                return;
            }
            
            console.log("🎯 First-person click - no valid interaction target");
        } else {
            console.log("🎯 First-person click - no objects in crosshair");
        }
    }

    // Helper method to find stone from clicked object
    findStoneFromObject(clickedObject) {
        // Method 1: Direct userData reference
        if (clickedObject.userData && clickedObject.userData.type === 'stone' && clickedObject.userData.stoneRef) {
            return clickedObject.userData.stoneRef;
        }
        
        // Method 2: Search in stones array
        if (this.sceneManager.objects.stones && Array.isArray(this.sceneManager.objects.stones)) {
            return this.sceneManager.objects.stones.find(s => {
                if (!s || !s.mesh) return false;
                if (s.isCollected || s.isBeingCollected) return false;
                if (!s.mesh.visible) return false;
                
                // Check if clicked object is the stone mesh or a child
                if (s.mesh === clickedObject) return true;
                
                let parent = clickedObject.parent;
                while (parent) {
                    if (parent === s.mesh) return true;
                    parent = parent.parent;
                }
                
                return false;
            });
        }
        
        return null;
    }

    // Extract stone interaction logic
    handleStoneInteraction(stone) {
        // Check inventory limits
        if (this.playerInventory.hasRock && this.playerInventory.collectedStone) {
            this.showNotification("⚠️ Envanter dolu! Önce mevcut taşı kullanın!", 3000, 'warning');
            return;
        }
        
        console.log("📦 Attempting to collect stone...");
        const collected = stone.collect();
        
        if (collected) {
            console.log("✅ Stone collected successfully");
            this.playerInventory.hasRock = true;
            this.playerInventory.collectedStone = stone;
            this.updateInventoryUI();
            this.showNotification("✅ Taş toplandı! Mancınığa yüklemek için mancınığa tıklayın!", 3000, 'success');
        } else {
            console.log("❌ Stone collection failed");
            stone.isBeingCollected = false;
        }
    }    // Extract catapult interaction logic
    handleCatapultInteraction() {
        const catapult = this.sceneManager.objects.catapult;
        
        // Load stone if player has one
        if (this.playerInventory.hasRock && this.playerInventory.collectedStone && catapult && !catapult.hasStone) {
            console.log("📦 Loading stone into catapult...");
            
            const loaded = catapult.loadStone(this.playerInventory.collectedStone);
            if (loaded) {
                this.playerInventory.hasRock = false;
                this.playerInventory.collectedStone = null;
                this.updateInventoryUI();
                this.showNotification("✅ Taş mancınığa yüklendi! Fırlatmak için tekrar tıklayın!", 3000, 'success');
            }
        }
        // Start power bar if catapult is loaded
        else if (catapult && catapult.hasStone) {
            console.log("🎯 Starting power bar...");
            this.startPowerBar(catapult, catapult.loadedStone);
            this.showNotification("🎯 Doğru zamanda tıklayarak atış gücünü belirleyin!", 3000, 'info');
        }
        // No stone warning
        else {
            this.showNotification("⚠️ Önce bir taş toplamalısınız!", 3000, 'warning');
        }
    }
    
    // Handle torch interaction - manuel açma/kapama
    handleTorchInteraction(torch) {
        if (!torch) return;
        
        console.log("🔥 Meşale ile etkileşim:", torch.position);
        
        // Meşaleyi aç/kapat (toggle)
        const wasLit = torch.toggle();
        
        // Bildirim göster
        if (torch.isLit) {
            this.showNotification("🔥 Meşale yakıldı!", 2000, 'success');
        } else {
            this.showNotification("💨 Meşale söndürüldü!", 2000, 'info');
        }
        
        // İsteğe bağlı: Puan verme
        this.addScore(torch.isLit ? 2 : 1);
        
        console.log(`Meşale durumu: ${torch.isLit ? 'Yakık' : 'Sönük'}, Manuel kontrol: ${torch.manualOverride}`);
    }

    startPowerBar(catapult, stone) {
        if (this.powerBarActive) return;
        
        this.powerBarActive = true;
        this.pendingCatapult = catapult;
        this.pendingStone = stone;
        this.markerPosition = 0;
        this.markerDirection = 1;
        
        // Power bar'ı göster
        this.powerBarContainer.classList.remove('hidden');
        
        // Marker animasyonunu başlat
        this.animatePowerBar();
        
        console.log("🎯 Power bar başlatıldı");
    }

    animatePowerBar() {
        if (!this.powerBarActive) return;
        
        // Marker pozisyonunu güncelle
        this.markerPosition += this.markerDirection * this.markerSpeed;
        
        // Sınırlarda bounce yap
        if (this.markerPosition >= 100) {
            this.markerPosition = 100;
            this.markerDirection = -1;
        } else if (this.markerPosition <= 0) {
            this.markerPosition = 0;
            this.markerDirection = 1;
        }
        
        // Marker'ın görsel pozisyonunu güncelle
        if (this.powerMarker) {
            this.powerMarker.style.left = this.markerPosition + '%';
        }
        
        // Animasyonu devam ettir
        this.animationId = requestAnimationFrame(() => this.animatePowerBar());
    }

    stopPowerBar() {
        if (!this.powerBarActive) return;
        
        this.powerBarActive = false;
        
        // Animasyonu durdur
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Power level'ını hesapla
        const powerLevel = this.evaluateShot(this.markerPosition);
        
        // Power bar'ı gizle
        this.powerBarContainer.classList.add('hidden');
        
        // Atışı gerçekleştir
        this.executeShot(powerLevel);
        
        console.log("🎯 Power bar durduruldu, güç seviyesi:", powerLevel);
    }

    evaluateShot(position) {
        let power = 0;
        let message = "";
        let points = 0;
        
        // Bölgelere göre güç ve puan hesapla
        if (position >= 40 && position <= 60) {
            // Yeşil bölge (merkez) - Perfect shot
            power = 0.9 + (Math.random() * 0.1); // 0.9-1.0 güç
            message = "🎯 Mükemmel! +15 puan";
            points = 15;
        } else if ((position >= 25 && position < 40) || (position > 60 && position <= 75)) {
            // Sarı bölgeler - Good shot
            power = 0.7 + (Math.random() * 0.2); // 0.7-0.9 güç
            message = "👍 İyi atış! +7 puan";
            points = 7;        } else {
            // Kırmızı bölgeler - Miss/Weak shot
            power = 0.3 + (Math.random() * 0.3); // 0.3-0.6 güç
            message = "💥 Kaçtı! -10 puan";
            points = -10;
        }
        
        // Puan ekle
        this.addScore(points);
          // Feedback göster
        this.showNotification(message, 2500, points >= 10 ? 'success' : points > 0 ? 'warning' : 'error');
        
        return power;
    }

    executeShot(powerLevel) {
        if (!this.pendingCatapult || !this.pendingStone) {
            console.error("Pending catapult veya stone bulunamadı!");
            return;
        }
        
        // Mancınık launch metodunu güç seviyesi ile çağır
        const stone = this.pendingCatapult.launch(powerLevel);
        
        if (stone && this.sceneManager) {
            // Scene manager'da stone physics'ini başlat
            this.sceneManager.startStonePhysics(stone, powerLevel);
        }
        
        // Ses efekti (güç seviyesine göre volume)
        if (window.getSesYoneticisi) {
            const volume = Math.min(powerLevel + 0.3, 1.0);
            window.getSesYoneticisi().catapultAtesle(volume);
        }
        
        // Pending referansları temizle
        this.pendingCatapult = null;
        this.pendingStone = null;
          console.log("🚀 Atış gerçekleştirildi, güç seviyesi:", powerLevel);
    }    addScore(points) {
        const currentScore = parseInt(this.scoreElement.textContent) || 0;
        const newScore = Math.max(0, currentScore + points); // Ensure score never goes below 0
        this.scoreElement.textContent = newScore.toString();
        
        // Score artış animasyonu için class ekle
        this.scoreElement.classList.add('score-update');
        setTimeout(() => {
            this.scoreElement.classList.remove('score-update');
        }, 500);
    }

    // ESC Menü Sistemi
    initializeEscMenu() {
        console.log("🎮 ESC Menü sistemi başlatılıyor...");
        
        // DOM elementlerini bul
        this.settingsMenuElement = document.getElementById('settings-menu');
        this.escHintElement = document.getElementById('esc-hint');
        
        if (!this.settingsMenuElement) {
            console.error("❌ Settings menu element bulunamadı!");
            return;
        }
        
        // Menü kapatma butonları
        const closeBtn = document.getElementById('close-settings');
        const resumeBtn = document.getElementById('resume-game');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeSettingsMenu();
            });
        }
        
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.closeSettingsMenu();
            });
        }
        
        // Overlay tıklamasında menüyü kapat
        const overlay = document.querySelector('.settings-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeSettingsMenu();
                }
            });
        }
          console.log("✅ ESC Menü sistemi başarıyla başlatıldı");
    }
    
    // ESC Menü Sistemi Başlatma
    initializeEscMenu() {
        console.log("🎮 ESC Menü sistemi başlatılıyor...");
        
        // DOM elementlerini bul
        this.settingsMenuElement = document.getElementById('settings-menu');
        this.escHintElement = document.getElementById('esc-hint');
        
        if (!this.settingsMenuElement) {
            console.error("❌ Settings menu element bulunamadı!");
            return;
        }
        
        // Menü kapatma butonları
        const closeBtn = document.getElementById('close-settings');
        const resumeBtn = document.getElementById('resume-game');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeSettingsMenu();
            });
        }
        
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.closeSettingsMenu();
            });
        }
        
        // Overlay tıklamasında menüyü kapat
        const overlay = document.querySelector('.settings-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeSettingsMenu();
                }
            });
        }
          console.log("✅ ESC Menü sistemi başarıyla başlatıldı");
    }
      openSettingsMenu() {
        if (!this.settingsMenuElement) return;
        
        console.log("⚙️ Ayarlar menüsü açılıyor...");
        
        this.isGamePaused = true;
        this.settingsMenuElement.classList.remove('hidden');
        
        // ESC ipucunu gizle
        if (this.escHintElement) {
            this.escHintElement.style.display = 'none';
        }        // Önce cursor'u açıkça görünür yap - FPS modundayken ve pencere odağı kaybolsa bile
        document.body.style.cursor = 'default';
        // Cursor görünürlüğünü garantiye almak için !important ekle
        document.documentElement.style.setProperty('cursor', 'auto', 'important');
        console.log("🖱️ İmleç menü için görünür yapıldı (zorunlu görünürlük)");
          
        // Sonra pointer lock'u serbest bırak
        // Bu sıralama önemli, böylece cursor her zaman görünür olur
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        console.log("⚙️ Oyun duraklatıldı - Ayarlar menüsü açık");
    }
      closeSettingsMenu() {
        if (!this.settingsMenuElement) return;
        
        console.log("🎮 Ayarlar menüsü kapatılıyor...");
        
        this.isGamePaused = false;
        this.settingsMenuElement.classList.add('hidden');
        
        // ESC ipucunu tekrar göster
        if (this.escHintElement) {
            this.escHintElement.style.display = 'block';
        }        // Birinci şahıs modundaysa pointer lock ipucunu göster
        if (this.isFirstPersonMode) {
            this.showPointerLockHint();
        }        // Birinci şahıs modundaysa, imleç görünürlüğünü güncel duruma göre ayarla
        if (this.isFirstPersonMode) {
            this.updateCursorVisibility();
            console.log("🖱️ İmleç görünürlüğü güncellendi - Pointer lock durumuna göre");
        }
        
        console.log("🎮 Oyun devam ediyor");
    }
    
    updateGameClockUI(hour, isDayTime, isMorning, isEvening) {
        if (!this.gameTimeElement || !this.timePeriodIconElement || !this.timePeriodTextElement || !this.clockContainerElement) {
            return;
        }
        
        // Saat formatını güncelle (HH:MM formatında)
        const hours = Math.floor(hour);
        const minutes = Math.floor((hour - hours) * 60);
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        this.gameTimeElement.textContent = timeString;
        
        // Zaman periyoduna göre ikon ve metin güncelleme
        let periodIcon, periodText, periodClass;
        
        if (isMorning) {
            periodIcon = '🌅';
            periodText = 'Şafak';
            periodClass = 'sunrise';
        } else if (isEvening) {
            periodIcon = '🌇';
            periodText = 'Alacakaranlık';
            periodClass = 'sunset';
        } else if (isDayTime) {
            periodIcon = '☀️';
            periodText = 'Gündüz';
            periodClass = 'day';
        } else {
            periodIcon = '🌙';
            periodText = 'Gece';
            periodClass = 'night';
        }
        
        this.timePeriodIconElement.textContent = periodIcon;
        this.timePeriodTextElement.textContent = periodText;
        
        // Clock container'ın sınıflarını güncelle
        this.clockContainerElement.className = `clock-container ${periodClass}`;
    }
    
    toggleSettingsMenu() {
        if (this.isGamePaused) {
            this.closeSettingsMenu();
        } else {
            this.openSettingsMenu();
        }
    }
}

// Uygulamayı başlat
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM yüklendi, uygulama başlatılıyor...");
      try {
        // AssetLoader'ı ilk olarak yükle ve ön yükleme yap
        const { assetLoader } = await import('./AssetLoader.js');
        console.log("AssetLoader hazırlanıyor...");
        
        // Uygulamayı başlat
        const app = new App();
        
        // Global App referansını window'a ata (diagnostic tools için)
        window.app = app;
        
        // Global resetScene referansını ata
        if (!window.resetScene) {
            console.log("Global resetScene fonksiyonu atanıyor");
            window.resetScene = app.resetScene.bind(app);
        }
        
        console.log("Uygulama başarıyla başlatıldı");
        console.log("window.app global referansı oluşturuldu");
    } catch (error) {
        console.error("Uygulama başlatılırken hata oluştu:", error);
    }
});
