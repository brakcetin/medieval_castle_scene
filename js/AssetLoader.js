
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Global kontrolcü sınıf - modellerin tek bir yerden yönetilmesi için
class AssetLoader {
    constructor() {
        this.loader = new GLTFLoader();
        this.assets = {};
        this.loadingPromises = {};
        
        // Global model ölçek sabitleri
        this.CASTLE_SCALE = 0.34;
        this.CATAPULT_SCALE = 0.5;
        this.STONE_SCALE = 0.2;
        this.TORCH_SCALE = 0.01;
        
        console.log("AssetLoader başlatıldı");
    }
    
    // Model yükleyen asenkron fonksiyon
    async loadModel(name, path, scale) {
        // Eğer bu model için zaten bir yükleme işlemi başlatılmışsa, aynı Promise'i döndür
        if (this.loadingPromises[name]) {
            console.log(`Model ${name} zaten yükleniyor, mevcut Promise döndürülüyor`);
            return this.loadingPromises[name];
        }
        
        // Yeni Promise oluştur
        const promise = new Promise((resolve, reject) => {
            console.log(`${name} modeli yükleniyor: ${path}`);
            
            this.loader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Model için kimlik ve tip bilgisi ekle
                    model.name = name;
                    model.userData.type = name;
                    
                    // Ölçeği ayarla
                    model.scale.set(scale, scale, scale);
                      // Alt mesh'leri etiketle ve gölgeleri ayarla
                    model.traverse((child) => {
                        if (child.isMesh) {
                            // Performans için gölgeleri sadece gerekli nesnelerde etkinleştir
                            child.castShadow = name !== 'stone'; // Taşlar gölge yapmaz
                            child.receiveShadow = true;
                            child.userData.type = `${name}_part`;
                            child.userData.parentModel = name;
                            
                            // Geometri optimizasyonu
                            if (child.geometry) {
                                child.geometry.computeBoundingSphere();
                                child.geometry.computeBoundingBox();
                            }
                            
                            // Material optimizasyonu
                            if (child.material) {
                                // Texture kalitesini düşür
                                if (child.material.map) {
                                    child.material.map.generateMipmaps = false;
                                    child.material.map.minFilter = THREE.LinearFilter;
                                }
                                // Normalmap ve diğer detay map'leri kaldır (RAM tasarrufu)
                                child.material.normalMap = null;
                                child.material.roughnessMap = null;
                                child.material.metalnessMap = null;
                                child.material.needsUpdate = true;
                            }
                        }
                    });
                    
                    // Modeli önbelleğe al
                    this.assets[name] = model;
                    
                    console.log(`${name} modeli başarıyla yüklendi`);
                    resolve(model);
                },
                (xhr) => {
                    console.log(`${name} yükleme ilerlemesi: ${Math.round((xhr.loaded / xhr.total) * 100)}%`);
                },
                (error) => {
                    console.error(`${name} yüklenirken hata oluştu:`, error);
                    reject(error);
                }
            );
        });
        
        // Promise'i önbelleğe al
        this.loadingPromises[name] = promise;
        
        return promise;
    }
    
    // Asset klonlama - her kullanım için yeni bir kopya oluşturur
    getModelCopy(name) {
        if (!this.assets[name]) {
            console.error(`Model bulunamadı: ${name}`);
            return null;
        }
        
        // Modelin derin bir kopyasını oluştur
        const original = this.assets[name];
        const copy = original.clone();
        
        // Orijinal model özelliklerini kopyaya aktar
        copy.name = original.name;
        copy.userData = JSON.parse(JSON.stringify(original.userData));
        
        console.log(`${name} modelinin bir kopyası oluşturuldu`);
        return copy;
    }
    
    // Tüm modelleri yükle
    async preloadAllModels() {
        try {
            await Promise.all([
                this.loadModel('castle', './models/castle.glb', this.CASTLE_SCALE),
                this.loadModel('catapult', './models/catapult.glb', this.CATAPULT_SCALE),
                this.loadModel('stone', './models/stone.glb', this.STONE_SCALE),
                this.loadModel('torch', './models/torch.glb', this.TORCH_SCALE)
            ]);
            console.log("Tüm modeller yüklendi!");
            return true;
        } catch (error) {
            console.error("Model yükleme hatası:", error);
            return false;
        }
    }
      // Yüklemeyi temizle - yeniden başlatma için
    clearCache() {
        // Önbelleği temizlemeden önce dispose işlemlerini yapmalıyız
        for (const key in this.assets) {
            if (this.assets[key]) {
                try {
                    const model = this.assets[key];
                    
                    // Modelin tüm mesh'lerini temizle
                    model.traverse((child) => {
                        if (child.isMesh) {
                            // Geometrileri temizle
                            if (child.geometry) {
                                child.geometry.dispose();
                            }
                            
                            // Materyalleri temizle
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(material => {
                                        if (material.map) material.map.dispose();
                                        material.dispose();
                                    });
                                } else {
                                    if (child.material.map) child.material.map.dispose();
                                    child.material.dispose();
                                }
                            }
                        }
                    });
                    
                    console.log(`${key} modeli temizlendi`);
                } catch (error) {
                    console.warn(`${key} modeli temizlenirken hata oluştu:`, error);
                }
            }
        }
        
        this.assets = {};
        this.loadingPromises = {};
        console.log("AssetLoader önbelleği tamamen temizlendi");
    }
}

// Singleton instance - tüm uygulama için tek bir AssetLoader
export const assetLoader = new AssetLoader();
