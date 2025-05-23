// Immediate Stone Verification Script
// This script provides instant verification of stone creation and positioning

console.log("🗿 STONE VERIFICATION SCRIPT LOADED");

function verifyStoneSystem() {
    console.log("\n🔍 COMPREHENSIVE STONE SYSTEM VERIFICATION");
    console.log("=========================================");
    
    // 1. Check if app exists
    if (!window.app) {
        console.error("❌ CRITICAL: App instance not found");
        return false;
    }
    console.log("✅ App instance exists");
    
    // 2. Check scene manager
    if (!window.app.sceneManager) {
        console.error("❌ CRITICAL: SceneManager not found");
        return false;
    }
    console.log("✅ SceneManager exists");
    
    // 3. Check stones array
    const stones = window.app.sceneManager.objects.stones;
    if (!stones) {
        console.error("❌ CRITICAL: Stones array not found");
        return false;
    }
    console.log(`✅ Stones array exists with ${stones.length} stones`);
    
    // 4. Check each stone in detail
    let validStones = 0;
    let stonesWithMesh = 0;
    
    console.log("\n🗿 INDIVIDUAL STONE ANALYSIS:");
    stones.forEach((stone, index) => {
        console.log(`Stone ${index + 1}:`);
        
        if (stone.mesh) {
            stonesWithMesh++;
            console.log(`  ✅ Has mesh (UUID: ${stone.mesh.uuid})`);
            console.log(`  📍 Position: (${stone.mesh.position.x.toFixed(2)}, ${stone.mesh.position.y.toFixed(2)}, ${stone.mesh.position.z.toFixed(2)})`);
            console.log(`  📏 Scale: (${stone.mesh.scale.x.toFixed(2)}, ${stone.mesh.scale.y.toFixed(2)}, ${stone.mesh.scale.z.toFixed(2)})`);
            console.log(`  👁️ Visible: ${stone.mesh.visible}`);
            console.log(`  🎨 Material: ${stone.mesh.material ? stone.mesh.material.type : 'None'}`);
            
            if (stone.mesh.material) {
                console.log(`  🔴 Color: ${stone.mesh.material.color ? stone.mesh.material.color.getHexString() : 'None'}`);
                console.log(`  ✨ Emissive: ${stone.mesh.material.emissive ? stone.mesh.material.emissive.getHexString() : 'None'}`);
            }
            
            // Check if stone is in scene
            let inScene = false;
            window.app.sceneManager.scene.traverse((child) => {
                if (child === stone.mesh) {
                    inScene = true;
                }
            });
            console.log(`  🎭 In scene: ${inScene ? '✅' : '❌'}`);
            
            if (inScene) validStones++;
        } else {
            console.log(`  ❌ No mesh found`);
        }
        
        console.log(`  🔧 isStatic: ${stone.isStatic}`);
        console.log(`  📦 isCollected: ${stone.isCollected}`);
        console.log("");
    });
    
    // 5. Camera information for reference
    const cam = window.app.camera;
    console.log(`📹 CAMERA POSITION: (${cam.position.x.toFixed(2)}, ${cam.position.y.toFixed(2)}, ${cam.position.z.toFixed(2)})`);
    console.log(`📹 CAMERA ROTATION: (${cam.rotation.x.toFixed(2)}, ${cam.rotation.y.toFixed(2)}, ${cam.rotation.z.toFixed(2)})`);
    
    // 6. Calculate distances from camera to stones
    console.log("\n📏 DISTANCES FROM CAMERA:");
    stones.forEach((stone, index) => {
        if (stone.mesh) {
            const distance = cam.position.distanceTo(stone.mesh.position);
            console.log(`  Stone ${index + 1}: ${distance.toFixed(2)} units away`);
        }
    });
    
    // 7. Scene statistics
    console.log(`\n🎭 SCENE STATISTICS:`);
    console.log(`  Total scene children: ${window.app.sceneManager.scene.children.length}`);
    console.log(`  Stones with meshes: ${stonesWithMesh}/${stones.length}`);
    console.log(`  Stones in scene: ${validStones}/${stones.length}`);
    
    // 8. Final verdict
    console.log("\n🏆 FINAL VERDICT:");
    if (validStones === 0) {
        console.error("❌ NO STONES ARE VISIBLE - Critical failure");
        console.log("💡 SUGGESTED FIXES:");
        console.log("  1. Run forceCreateVisibleStones() to create emergency stones");
        console.log("  2. Check if models are loading properly");
        console.log("  3. Verify material properties");
    } else if (validStones < stones.length) {
        console.warn(`⚠️ PARTIAL SUCCESS - Only ${validStones}/${stones.length} stones are properly created`);
    } else {
        console.log("✅ SUCCESS - All stones are properly created and positioned");
    }
    
    return validStones > 0;
}

function forceCreateVisibleStones() {
    console.log("\n🚨 FORCE CREATING IMMEDIATELY VISIBLE STONES");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ Cannot create stones - app not available");
        return;
    }
    
    const scene = window.app.sceneManager.scene;
    
    // Remove existing emergency stones
    const toRemove = [];
    scene.traverse((child) => {
        if (child.name && child.name.startsWith('force_visible_stone_')) {
            toRemove.push(child);
        }
    });
    
    toRemove.forEach(stone => {
        scene.remove(stone);
        if (stone.geometry) stone.geometry.dispose();
        if (stone.material) stone.material.dispose();
    });
    
    console.log(`🧹 Removed ${toRemove.length} existing force-visible stones`);
    
    // Create ultra-visible stones right in front of camera
    const cam = window.app.camera;
    const stonePositions = [
        { x: cam.position.x + 0, y: cam.position.y + 0, z: cam.position.z + 2 },  // Directly in front
        { x: cam.position.x + 1, y: cam.position.y + 0, z: cam.position.z + 2 },  // Right
        { x: cam.position.x - 1, y: cam.position.y + 0, z: cam.position.z + 2 },  // Left
        { x: cam.position.x + 0, y: cam.position.y + 1, z: cam.position.z + 2 },  // Above
        { x: cam.position.x + 0, y: cam.position.y - 1, z: cam.position.z + 2 },  // Below
    ];
    
    const forceStones = [];
    
    stonePositions.forEach((pos, index) => {
        // Create massive, glowing stone
        const geometry = new THREE.SphereGeometry(0.8, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.8,
            metalness: 0,
            roughness: 0.3,
            transparent: false
        });
        
        const stone = new THREE.Mesh(geometry, material);
        stone.position.set(pos.x, pos.y, pos.z);
        stone.name = `force_visible_stone_${index}`;
        stone.castShadow = true;
        stone.receiveShadow = true;
        
        scene.add(stone);
        forceStones.push(stone);
        
        console.log(`🔴 Force-visible stone ${index + 1} created at (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
        
        // Add to stones array for click detection
        const stoneObject = {
            mesh: stone,
            position: new THREE.Vector3(pos.x, pos.y, pos.z),
            isStatic: true,
            isCollected: false,
            isForceVisible: true
        };
        
        window.app.sceneManager.objects.stones.push(stoneObject);
    });
    
    console.log(`✅ Created ${forceStones.length} force-visible stones directly in front of camera`);
    console.log("🎯 These stones should be IMMEDIATELY visible and clickable");
    
    return forceStones;
}

function testClickOnFrontStone() {
    console.log("\n🎯 TESTING CLICK ON STONE DIRECTLY IN FRONT");
    
    // Simulate click in exact center of screen
    const event = {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2
    };
    
    if (window.app && window.app.onClick) {
        console.log("🖱️ Simulating click in center of screen (where force-visible stone should be)...");
        window.app.onClick(event);
    } else {
        console.error("❌ onClick method not available");
    }
}

// Expose functions globally
window.verifyStoneSystem = verifyStoneSystem;
window.forceCreateVisibleStones = forceCreateVisibleStones;
window.testClickOnFrontStone = testClickOnFrontStone;

console.log("\n🛠️ AVAILABLE VERIFICATION COMMANDS:");
console.log("• verifyStoneSystem() - Comprehensive stone system analysis");
console.log("• forceCreateVisibleStones() - Create stones directly in front of camera");
console.log("• testClickOnFrontStone() - Test clicking on the center stone");

// Auto-run verification after a delay
setTimeout(() => {
    console.log("\n⏰ AUTO-RUNNING STONE VERIFICATION (after 2 seconds):");
    verifyStoneSystem();
}, 2000);
