import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';
import { SceneManager } from './scene.js';
import { Catapult, Stone, Torch, HandTorch } from './objects.js';

// Ana uygulama sınıfı
class App {
    constructor() {
        // DOM elementlerine erişim
        this.loadingElement = document.getElementById('loading');
        this.scoreElement = document.getElementById('score');
        this.dayNightToggle = document.getElementById('day-night-toggle');
        
        // Three.js bileşenleri
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.sceneManager = null;
        
        // Kullanıcı girdisi
        this.keys = {};
        
        // Zaman takibi
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
          // Işık ve gökyüzü ayarları
        this.isDay = true;
        this.gui = null;
        this.timeOfDay = 12; // 0-24 saat arası (12 = öğlen)
        this.sunAngle = 0; // Güneşin açısı
        
        // Özel meşale
        this.handTorch = null;
        this.hasHandTorch = false;
        
        // Kaynaklar
        this.resources = {
            models: {},
            textures: {}
        };
        
        // Kamera ayarları
        this.cameraSpeed = 5;
        this.cameraRotationSpeed = 0.002;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canRotate = false;
          // Etkileşim için yeni değişkenler
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Mancınık etkileşim sistemi
        this.playerInventory = { hasRock: false };
        this.catapultState = 'empty'; // 'empty', 'loaded', 'ready'
        
        // Başlatma
        this.init();
    }
    
    init() {
        // Renderer oluşturma
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('scene-canvas'),
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
          // Kamera oluşturma
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0.8, 10); // Kamera yüksekliğini düşürdük (1.6'dan 0.8'e)
        this.camera.lookAt(0, 0.8, 0);
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
        };
        
        // Olay dinleyiciler
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.dayNightToggle.addEventListener('click', this.toggleDayNight.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
        
        // GUI oluşturma
        this.setupGUI();
        
        // Modelleri yükle
        this.loadModels();
        
        // Animasyon döngüsünü başlat
        this.animate();
    }    setupGUI() {
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
                    saatAyarı: 12
                };
                
                timeFolder.add(timeSettings, 'saatAyarı', 0, 24).onChange((value) => {
                    this.timeOfDay = value;
                    this.updateTimeOfDay(value);
                    // HTML slider'ı da güncelle
                    if (timeSlider) timeSlider.value = value;
                    if (timeDisplay) timeDisplay.textContent = value.toFixed(1);
                });
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
    }
    
    // Saate göre gün/gece döngüsü
    updateTimeOfDay(hour) {
        // Gece: 20-6 arası, Gündüz: 6-20 arası
        if (hour >= 20 || hour <= 6) {
            // Gece modu
            this.isDay = false;
            this.sceneManager.scene.background = new THREE.Color(0x000033);
            
            if (this.sceneManager.directionalLight) {
                this.sceneManager.directionalLight.intensity = 0.1;
            }
            if (this.sceneManager.ambientLight) {
                this.sceneManager.ambientLight.intensity = 0.2;
            }
            
            // Meşaleleri parlat
            if (this.sceneManager.objects.torches) {
                this.sceneManager.objects.torches.forEach(torch => {
                    torch.setIntensity(5);
                });
            }
            
            this.sceneManager.scene.fog = new THREE.FogExp2(0x000033, 0.01);
            this.dayNightToggle.textContent = "Gündüze Geç";
        } else {
            // Gündüz modu - güneş pozisyonunu hesapla
            this.isDay = true;
            
            // Saat 6-18 arası güneş hareketi (0-180 derece)
            const normalizedHour = Math.max(6, Math.min(18, hour));
            this.sunAngle = ((normalizedHour - 6) / 12) * Math.PI; // 0 - PI arası
            
            // Güneş pozisyonu
            if (this.sceneManager.directionalLight) {
                const x = Math.sin(this.sunAngle) * 100;
                const y = Math.cos(this.sunAngle) * 100 + 50;
                const z = 50;
                
                this.sceneManager.directionalLight.position.set(x, y, z);
                
                // Güneş yüksekliğine göre parlaklık
                const intensity = Math.max(0.3, Math.cos(this.sunAngle - Math.PI/2) * 0.8);
                this.sceneManager.directionalLight.intensity = intensity;
            }
            
            // Gökyüzü rengi - güneş pozisyonuna göre
            const skyIntensity = Math.max(0.2, Math.cos(this.sunAngle - Math.PI/2));
            const skyColor = new THREE.Color().setHSL(0.6, 0.6, 0.4 + skyIntensity * 0.4);
            this.sceneManager.scene.background = skyColor;
            
            if (this.sceneManager.ambientLight) {
                this.sceneManager.ambientLight.intensity = 0.3 + skyIntensity * 0.3;
            }
            
            // Meşaleleri söndür
            if (this.sceneManager.objects.torches) {
                this.sceneManager.objects.torches.forEach(torch => {
                    torch.setIntensity(1);
                });
            }
              this.sceneManager.scene.fog = new THREE.FogExp2(0xcccccc, 0.005);
            this.dayNightToggle.textContent = "Geceye Geç";
        }
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
      onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'KeyF':
                this.toggleHandTorch();
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }
    
    onMouseDown(event) {
        if (event.button === 0) { // Sol tık
            this.canRotate = true;
            document.body.requestPointerLock();
        }
    }
    
    onMouseUp(event) {
        if (event.button === 0) { // Sol tık
            this.canRotate = false;
            document.exitPointerLock();
        }
    }
      onMouseMove(event) {
        if (this.canRotate) {
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            
            // Yatay rotasyon (sağa/sola bakma)
            this.camera.rotation.y -= movementX * this.cameraRotationSpeed;
            
            // Dikey rotasyon (yukarı/aşağı bakma) - sınırlı açıda
            const verticalRotation = this.camera.rotation.x - movementY * this.cameraRotationSpeed;
            // Yukarı/aşağı bakma açısını sınırla (-45 ile 45 derece arası)
            this.camera.rotation.x = Math.max(-Math.PI/4, Math.min(Math.PI/4, verticalRotation));
        } else {
            // Cursor değiştirme için mouse pozisyonunu kontrol et
            this.updateCursor(event);
        }
    }
    
    // Cursor'ı güncelleyen metod
    updateCursor(event) {
        // Mouse pozisyonunu normalize et
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Raycaster'ı güncelle
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Tüm nesneleri kontrol et
        const intersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);
        
        let isHoveringClickable = false;
        
        if (intersects.length > 0) {
            const hoveredObject = intersects[0].object;
            
            // Kayalar üzerindeyken
            for (let stone of this.sceneManager.objects.stones) {
                if (stone.mesh === hoveredObject && stone.isStatic && !stone.isCollected) {
                    isHoveringClickable = true;
                    break;
                }
            }
            
            // Mancınık üzerindeyken
            const catapult = this.sceneManager.objects.catapult;
            if (catapult && catapult.model && this.isObjectInGroup(hoveredObject, catapult.model)) {
                isHoveringClickable = true;
            }
        }
        
        // Cursor'ı değiştir
        document.body.style.cursor = isHoveringClickable ? 'pointer' : 'default';
    }    onClick(event) {
        console.log("onClick tetiklendi");
        
        // Mouse pozisyonunu normalize et
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        console.log("Mouse pozisyonu:", this.mouse);
        
        // Raycaster'ı güncelle
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Tüm nesneleri kontrol et
        const intersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);
        console.log(`${intersects.length} nesne ile kesişim bulundu`);
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            console.log("Tıklanan nesne:", clickedObject);
            
            // 1. KAYALAR - Tıklanabilir kayalara tıklama
            console.log(`Kontrol edilen taş sayısı: ${this.sceneManager.objects.stones.length}`);
            for (let i = 0; i < this.sceneManager.objects.stones.length; i++) {
                const stone = this.sceneManager.objects.stones[i];
                console.log(`Taş ${i}:`, stone.mesh, "isStatic:", stone.isStatic, "isCollected:", stone.isCollected);
                
                if (stone.mesh === clickedObject && stone.isStatic && !stone.isCollected) {
                    console.log(`Taş ${i} toplandı!`);
                    this.collectRock(stone);
                    return;
                }
            }
            
            // 2. MANCINIQ - Mancınığa tıklama
            const catapult = this.sceneManager.objects.catapult;
            if (catapult && catapult.model && this.isObjectInGroup(clickedObject, catapult.model)) {
                console.log("Mancınığa tıklandı");
                this.handleCatapultClick();
                return;
            }
        } else {
            console.log("Hiçbir nesneye tıklanmadı");
        }
    }
    
    // Bir nesnenin belirli bir grup içinde olup olmadığını kontrol eder
    isObjectInGroup(object, group) {
        if (object === group) return true;
        
        let parent = object.parent;
        while (parent) {
            if (parent === group) return true;
            parent = parent.parent;
        }
        return false;
    }
    
    // Kaya toplama işlemi
    collectRock(stone) {
        if (this.playerInventory.hasRock) {
            this.showMessage("Zaten bir taşın var!");
            return;
        }
        
        stone.isCollected = true;
        this.sceneManager.scene.remove(stone.mesh);
        this.playerInventory.hasRock = true;
        this.catapultState = 'hasRock';
        
        this.showMessage("Taş toplandı! Mancınığa git ve yükle.");
        this.updateScore(5);
        
        console.log("Kaya toplandı");
    }
    
    // Mancınık tıklama işlemleri
    handleCatapultClick() {
        const catapult = this.sceneManager.objects.catapult;
        
        if (this.playerInventory.hasRock && this.catapultState === 'hasRock') {
            // Taş var, mancınığa yükle
            this.loadCatapult();
        } else if (this.catapultState === 'loaded') {
            // Mancınık yüklü, fırlat
            this.fireCatapult();
        } else if (!this.playerInventory.hasRock) {
            this.showMessage("Önce bir taş toplaman gerekiyor!");
        }
    }
      // Mancınığa taş yükleme
    loadCatapult() {
        this.playerInventory.hasRock = false;
        this.catapultState = 'loaded';
        
        // Mancınığa görsel taş ekle
        const catapult = this.sceneManager.objects.catapult;
        if (catapult && catapult.model) {
            const rockGeometry = new THREE.SphereGeometry(0.2, 8, 6);
            const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            const loadedRock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            // Taşı mancınık üzerine yerleştir (basit pozisyon)
            loadedRock.position.set(0, 1.5, -1); // Mancınık modeline göre ayarlanacak
            loadedRock.name = 'loadedRock';
            loadedRock.castShadow = true;
            
            catapult.model.add(loadedRock);
        }
        
        this.showMessage("Taş yüklendi! Tekrar tıkla ve fırlat!");
        this.updateScore(10);
        
        console.log("Taş mancınığa yüklendi");
    }
    
    // Mancınıktan taş fırlat
    fireCatapult() {
        const catapult = this.sceneManager.objects.catapult;
        const loadedRock = catapult.model.getObjectByName('loadedRock');
        
        if (loadedRock) {
            catapult.model.remove(loadedRock);
            
            // Taşı sahneye ekle ve fırlat
            const worldPosition = new THREE.Vector3();
            loadedRock.getWorldPosition(worldPosition);
            loadedRock.position.copy(worldPosition);
            
            this.sceneManager.scene.add(loadedRock);
            this.animateProjectile(loadedRock);
        }
        
        this.catapultState = 'empty';
        this.showMessage("Taş fırlatıldı! Başka kayalar topla!");
        this.updateScore(20);
        
        console.log("Taş fırlatıldı");
    }
    
    // Projektil animasyonu
    animateProjectile(projectile) {
        const startPos = projectile.position.clone();
        const targetPos = new THREE.Vector3(
            startPos.x - 15 + Math.random() * 10,
            0,
            startPos.z - 8 + Math.random() * 5
        );
        
        let progress = 0;
        const duration = 2500; // 2.5 saniye
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            progress = Math.min((currentTime - startTime) / duration, 1);
            
            // Parabolik hareket
            const x = THREE.MathUtils.lerp(startPos.x, targetPos.x, progress);
            const z = THREE.MathUtils.lerp(startPos.z, targetPos.z, progress);
            const y = startPos.y + Math.sin(progress * Math.PI) * 6; // Yay hareketi
            
            projectile.position.set(x, y, z);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Taş yere düştü
                projectile.position.y = 0.2;
                setTimeout(() => {
                    this.sceneManager.scene.remove(projectile);
                }, 3000); // 3 saniye sonra temizle
            }
        };
        
        animate();
    }
    
    // Mesaj gösterme sistemi
    showMessage(text) {
        let messageDiv = document.getElementById('game-message');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'game-message';
            messageDiv.style.cssText = `
                position: fixed;
                top: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                z-index: 1000;
                font-size: 16px;
                border: 2px solid #4CAF50;
                display: none;
            `;
            document.body.appendChild(messageDiv);
        }
        
        messageDiv.textContent = text;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
    
    handleInput() {
        const delta = this.deltaTime;
        const moveSpeed = this.cameraSpeed * delta;
        
        // Kameranın baktığı yönü hesapla
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        direction.y = 0; // Y ekseninde hareketi engelle
        direction.normalize();
        
        // İleri/geri hareket
        if (this.moveForward) {
            this.camera.position.addScaledVector(direction, moveSpeed);
        }
        if (this.moveBackward) {
            this.camera.position.addScaledVector(direction, -moveSpeed);
        }
        
        // Sağa/sola hareket için yan vektörü hesapla
        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(this.camera.up, direction).normalize();
        
        if (this.moveRight) {
            this.camera.position.addScaledVector(rightVector, -moveSpeed); // D tuşu için yönü ters çevirdik
        }
        if (this.moveLeft) {
            this.camera.position.addScaledVector(rightVector, moveSpeed); // A tuşu için yönü ters çevirdik
        }
          // Kameranın y pozisyonunu sabit tut
        this.camera.position.y = 0.8;
        
        // Mancınığa yakınlık kontrolü (artık gerekli değil ama konsolda bilgi için bırakılabilir)
        const catapult = this.sceneManager.objects.catapult;
        if (catapult && catapult.model) {
            const distance = this.camera.position.distanceTo(catapult.model.position);
            this.isNearCatapult = distance < 6; // 3 birimden 6 birime çıkardık
        } else {
            this.isNearCatapult = false;
        }
    }
      animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.deltaTime = this.clock.getDelta();
        
        // Kullanıcı girişini işle
        this.handleInput();
        
        // El meşalesini güncelle
        if (this.handTorch && this.hasHandTorch) {
            this.handTorch.update(this.deltaTime, this.camera);
        }
        
        // Sahnedeki objeleri güncelle
        if (this.sceneManager) {
            this.sceneManager.update(this.deltaTime);
        }
        
        // Sahneyi render et
        this.renderer.render(this.sceneManager.scene, this.camera);
    }
    
    updateScore(value) {
        this.sceneManager.score += value;
        this.scoreElement.textContent = this.sceneManager.score;
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
        
        // Global resetScene referansını ata
        if (!window.resetScene) {
            console.log("Global resetScene fonksiyonu atanıyor");
            window.resetScene = app.resetScene.bind(app);
        }
        
        console.log("Uygulama başarıyla başlatıldı");
    } catch (error) {
        console.error("Uygulama başlatılırken hata oluştu:", error);
    }
});
