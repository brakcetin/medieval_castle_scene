import * as THREE from 'three';

/**
 * ParticleManager - Partikül efektleri yönetimi için kullanılan sınıf
 * Tüm partikül efektlerinin oluşturulması ve güncellenmesi bu sınıf üzerinden yapılır
 */
export class ParticleManager {
    constructor() {
        // Partikül textureleri
        this.textures = {
            spark: null,
            smoke: null,
            dust: null,
            magic: null
        };
        
        // Aktif partiküller
        this.particles = [];
        
        // Texture yükleyici
        this.textureLoader = new THREE.TextureLoader();
        
        // Texture yolları
        this.texturePaths = {
            spark: './images/spark.png',
            smoke: './images/smoke.png',
            dust: './images/dust.png',
            magic: './images/magic.png'
        };
        
        // Default sprite materyal
        this.defaultMaterial = new THREE.SpriteMaterial({
            color: 0xffffff,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        console.log("✨ ParticleManager initialized");
        this.preloadTextures();
    }
    
    // Texture yükleme fonksiyonu
    preloadTextures() {
        for (const type in this.texturePaths) {
            try {
                this.textureLoader.load(this.texturePaths[type], (texture) => {
                    this.textures[type] = texture;
                    console.log(`✅ Loaded texture: ${type}`);
                });
            } catch (e) {
                console.warn(`❌ Failed to load texture: ${type}`, e);
                // Texture yoksa default texture olarak boş texture oluştur
                this.textures[type] = new THREE.Texture();
            }
        }
    }
    
    // Partikül oluşturma fonksiyonu
    createParticle(type, position) {
        const material = new THREE.SpriteMaterial({
            map: this.textures[type] || null,
            color: this.getColorForType(type),
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(0.5, 0.5, 0.5);
        
        // Partikül verileri
        const particle = {
            sprite: sprite,
            type: type,
            life: 1.0,
            maxLife: 1.0,
            fadeRate: 0.01,
            velocity: new THREE.Vector3(0, 1, 0),
            gravity: new THREE.Vector3(0, -0.05, 0),
            rotation: 0,
            rotationSpeed: 0.01,
            scale: 0.5
        };
        
        // Sprite'ı sahneye ekle
        window.app.sceneManager.scene.add(sprite);
        
        return particle;
    }
    
    // Partikül tipi için renk belirleme
    getColorForType(type) {
        switch (type) {
            case 'spark':
                return 0xffaa33;
            case 'smoke':
                return 0x555555;
            case 'dust':
                return 0xccbb99;
            case 'magic':
                return 0x44aaff;
            default:
                return 0xffffff;
        }
    }
    
    // ✨ Stone collection particles  
    createStoneCollectParticles(position) {
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle('magic', position);
            
            // Upward spiral motion
            const angle = (i / particleCount) * Math.PI * 2;
            particle.velocity = new THREE.Vector3(
                Math.cos(angle) * 1.5,
                2 + Math.random(),
                Math.sin(angle) * 1.5
            );
            
            particle.life = 2.0;
            particle.fadeRate = 0.015;
            particle.scale = 0.3 + Math.random() * 0.3;
            particle.rotationSpeed = Math.random() * 0.1;
            
            this.particles.push(particle);
        }
        
        console.log(`💨 Created ${particleCount} stone collect particles`);
    }
    
    // 🔥 Catapult charging particles
    createCatapultChargeParticles(position) {
        const particleCount = 10;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle('spark', position);
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            particle.velocity = new THREE.Vector3(
                Math.cos(angle) * (0.5 + Math.random()),
                1.5 + Math.random() * 2,
                Math.sin(angle) * (0.5 + Math.random())
            );
            
            particle.life = 1.0 + Math.random();
            particle.fadeRate = 0.02;
            particle.scale = 0.2 + Math.random() * 0.3;
            
            this.particles.push(particle);
        }
        
        console.log(`🔥 Created ${particleCount} catapult charge particles`);
    }
    
    // 💥 Stone impact particles
    createStoneImpactParticles(position, velocity) {
        const particleCount = 25;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle('dust', position);
            
            // Particles fly away from impact direction
            const impactDirection = velocity ? velocity.clone().normalize() : new THREE.Vector3(0, 1, 0);
            const randomDirection = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random(),
                (Math.random() - 0.5) * 2
            ).normalize();
            
            // Mix impact direction with random
            particle.velocity = impactDirection
                .multiplyScalar(-1)  // Opposite to impact
                .add(randomDirection.multiplyScalar(0.5))
                .multiplyScalar(2 + Math.random() * 2);
                
            particle.velocity.y = Math.abs(particle.velocity.y); // Always upward
            
            particle.life = 1.5 + Math.random();
            particle.fadeRate = 0.02;
            particle.scale = 0.3 + Math.random() * 0.4;
            
            this.particles.push(particle);
        }
        
        console.log(`💨 Created ${particleCount} stone impact particles`);
    }
    
    // 💨 Catapult fire particles
    createCatapultFireParticles(position) {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle('smoke', position);
            
            // Forward and upward burst
            const angle = (Math.random() - 0.5) * Math.PI * 0.5; // -45 to +45 degrees
            particle.velocity = new THREE.Vector3(
                Math.sin(angle) * (2 + Math.random() * 2),
                2 + Math.random() * 3,
                Math.cos(angle) * (2 + Math.random() * 2)
            );
            
            particle.life = 1.0 + Math.random();
            particle.fadeRate = 0.015;
            particle.scale = 0.4 + Math.random() * 0.4;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
            
            this.particles.push(particle);
        }
        
        console.log(`🔥 Created ${particleCount} catapult fire particles`);
    }
    
    // 💨 Dust particles (for ground impacts or recoil)
    createDustParticles(position, intensity = 1.0) {
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle('dust', position);
            
            // Circular spread from position
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.5 + Math.random() * 1.0;
            particle.velocity = new THREE.Vector3(
                Math.cos(angle) * radius * intensity,
                (0.5 + Math.random() * 1.0) * intensity, // Upward
                Math.sin(angle) * radius * intensity
            );
            
            particle.life = 1.0 + Math.random() * 0.5;
            particle.fadeRate = 0.02;
            particle.scale = 0.2 + Math.random() * 0.4;
            
            this.particles.push(particle);
        }
        
        console.log(`💨 Created ${particleCount} dust particles`);
    }
    
    // Partikülleri güncelleme fonksiyonu
    update(deltaTime) {
        // Tüm partikülleri güncelle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Yaşam süresini azalt
            particle.life -= particle.fadeRate;
            
            // Eğer yaşam süresi bittiyse, partikülü kaldır
            if (particle.life <= 0) {
                if (particle.sprite.parent) {
                    particle.sprite.parent.remove(particle.sprite);
                }
                if (particle.sprite.material) {
                    particle.sprite.material.dispose();
                }
                this.particles.splice(i, 1);
                continue;
            }
            
            // Hareketi güncelle
            particle.velocity.add(particle.gravity);
            particle.sprite.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            
            // Dönüşü güncelle
            particle.rotation += particle.rotationSpeed;
            particle.sprite.material.rotation = particle.rotation;
            
            // Saydamlığı güncelle (yaşam süresine göre)
            const opacity = particle.life / particle.maxLife;
            particle.sprite.material.opacity = opacity;
            
            // Büyüklüğü güncelle
            const scale = particle.scale * (0.8 + 0.4 * opacity);
            particle.sprite.scale.set(scale, scale, scale);
        }
    }
    
    // Tüm partikülleri temizleme fonksiyonu
    clearAllParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            if (particle.sprite.parent) {
                particle.sprite.parent.remove(particle.sprite);
            }
            if (particle.sprite.material) {
                particle.sprite.material.dispose();
            }
        }
        this.particles = [];
    }
}

// Global erişim için singleton instance
let particleManagerInstance = null;

// Global erişim fonksiyonu
window.getParticleManager = () => {
    if (!particleManagerInstance) {
        particleManagerInstance = new ParticleManager();
    }
    return particleManagerInstance;
};