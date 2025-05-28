// Quick stone click verification script
console.log("🔍 QUICK STONE CLICK VERIFICATION");

function quickVerification() {
    console.log("\n=== STEP 1: Basic App Check ===");
    
    if (!window.app) {
        console.log("❌ CRITICAL: App not loaded");
        return false;
    }
    console.log("✅ App loaded");
    
    if (!window.app.onClick) {
        console.log("❌ CRITICAL: onClick method missing");
        return false;
    }
    console.log("✅ onClick method available");
    
    console.log("\n=== STEP 2: Scene Check ===");
    
    if (!window.app.sceneManager || !window.app.sceneManager.scene) {
        console.log("❌ CRITICAL: Scene not available");
        return false;
    }
    console.log("✅ Scene available");
    
    console.log("\n=== STEP 3: Stone Check ===");
    
    const stones = window.app.sceneManager.objects?.stones;
    if (!stones || stones.length === 0) {
        console.log("⚠️ WARNING: No stones found");
        console.log("🔧 Attempting to create stones...");
        
        if (window.app.sceneManager.createStones) {
            window.app.sceneManager.createStones();
            console.log("✅ Stone creation attempted");
        }
        return false;
    }
    
    console.log(`✅ Found ${stones.length} stones`);
    
    let activeStones = 0;
    let visibleStones = 0;
    
    stones.forEach((stone, i) => {
        if (stone.active && !stone.isCollected) {
            activeStones++;
            if (stone.mesh && stone.mesh.visible) {
                visibleStones++;
            }
        }
    });
    
    console.log(`📊 Active stones: ${activeStones}, Visible stones: ${visibleStones}`);
    
    console.log("\n=== STEP 4: Click Test ===");
    
    // Test click simulation
    const testEvent = {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2
    };
    
    console.log("🖱️ Testing click simulation...");
    try {
        window.app.onClick(testEvent);
        console.log("✅ Click simulation successful");
    } catch (error) {
        console.log(`❌ Click simulation failed: ${error.message}`);
        return false;
    }
    
    console.log("\n=== VERIFICATION COMPLETE ===");
    console.log(visibleStones > 0 ? "✅ STONES SHOULD BE CLICKABLE" : "⚠️ NO VISIBLE STONES TO CLICK");
    
    return visibleStones > 0;
}

// Auto-run after 3 seconds
setTimeout(() => {
    quickVerification();
}, 3000);

// Make available globally
window.quickVerification = quickVerification;

console.log("📋 Quick verification loaded. Call quickVerification() or wait 3 seconds.");
