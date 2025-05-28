// Quick diagnostic tool to check stone click issues
console.log("🔍 Stone Click Diagnostic Tool");

// Sayfa tamamen yüklendiğinde testi çalıştır
window.addEventListener('load', function() {
    console.log("📋 Diagnostic tool loaded. Call diagnoseStonesClickability() manually or wait 3 seconds for auto-run.");
    
    // 3 saniye sonra otomatik olarak çalıştır
    setTimeout(function() {
        diagnoseStonesClickability();
    }, 3000);
});

function diagnoseStonesClickability() {
    console.log("=== STONE CLICK DIAGNOSIS ===");
    
    if (!window.app || !window.app.sceneManager) {
        console.log("❌ App or SceneManager not found");
        console.log("💡 İpucu: window.app nesnesi yüklenmiyor. main.js dosyasındaki syntax hatalarını kontrol edin.");
        return;
    }
    
    const stones = window.app.sceneManager.objects.stones;
    
    if (!stones || stones.length === 0) {
        console.log("❌ No stones found in scene");
        return;
    }
    
    console.log(`📊 Found ${stones.length} stones`);
    
    stones.forEach((stone, index) => {
        console.log(`\n--- Stone ${index} ---`);
        console.log("Active:", stone.active);
        console.log("Collected:", stone.isCollected);
        console.log("Has mesh:", !!stone.mesh);
        
        if (stone.mesh) {
            console.log("Mesh visible:", stone.mesh.visible);
            console.log("Mesh position:", stone.mesh.position.x.toFixed(2), stone.mesh.position.y.toFixed(2), stone.mesh.position.z.toFixed(2));
            console.log("Mesh name:", stone.mesh.name);
            console.log("Mesh userData:", stone.mesh.userData);
            console.log("In scene:", window.app.sceneManager.scene.children.includes(stone.mesh));
            console.log("Has parent:", !!stone.mesh.parent);
            if (stone.mesh.parent) {
                console.log("Parent type:", stone.mesh.parent.type);
            }
        } else {
            console.log("❌ No mesh found");
        }
    });
    
    console.log("\n=== RAYCASTING TEST ===");
    
    // Test raycasting from center of screen
    if (window.app.raycaster && window.app.camera) {
        // Center of screen
        const mouse = new THREE.Vector2(0, 0);
        window.app.raycaster.setFromCamera(mouse, window.app.camera);
        
        const intersects = window.app.raycaster.intersectObjects(window.app.sceneManager.scene.children, true);
        console.log(`Center screen intersections: ${intersects.length}`);
        
        intersects.slice(0, 5).forEach((intersect, index) => {
            console.log(`Intersect ${index}:`, intersect.object.name, intersect.object.type, intersect.object.userData);
        });
    }
    
    console.log("========================");
}

// Add to window for manual calling
window.diagnoseStonesClickability = diagnoseStonesClickability;

// Auto-run after 3 seconds
setTimeout(() => {
    diagnoseStonesClickability();
}, 3000);

console.log("📋 Diagnostic tool loaded. Call diagnoseStonesClickability() manually or wait 3 seconds for auto-run.");
