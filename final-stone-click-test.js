// Final stone click test - Direct testing
console.log("🎯 FINAL STONE CLICK TEST - Starting comprehensive test");

function runFinalStoneClickTest() {
    console.log("\n=== FINAL STONE CLICK TEST ===");
    
    if (!window.app) {
        console.error("❌ CRITICAL: App not loaded");
        return false;
    }
    
    console.log("✅ App loaded");
    
    // Step 1: Check if stones exist
    const stones = window.app.sceneManager?.objects?.stones;
    console.log(`📊 Found ${stones ? stones.length : 0} stones`);
    
    // Step 2: If no stones, create emergency ones
    if (!stones || stones.length === 0) {
        console.log("🚨 No stones found, creating emergency stones...");
        
        if (window.createCriticalEmergencyStones) {
            console.log("Using critical emergency stones...");
            window.createCriticalEmergencyStones();
            
            // Wait for creation to complete
            setTimeout(() => {
                console.log("🔍 Re-checking after emergency stone creation...");
                testActualClick();
            }, 1000);
            return;
        }
    }
    
    // Step 3: Test clicking directly
    testActualClick();
}

function testActualClick() {
    console.log("\n🖱️ TESTING ACTUAL CLICK...");
    
    const stones = window.app.sceneManager?.objects?.stones;
    if (!stones || stones.length === 0) {
        console.error("❌ Still no stones available for clicking");
        return;
    }
    
    // Find a clickable stone
    let targetStone = null;
    for (let stone of stones) {
        if (stone.active && !stone.isCollected && stone.mesh && stone.mesh.visible) {
            targetStone = stone;
            break;
        }
    }
    
    if (!targetStone) {
        console.warn("⚠️ No clickable stones found");
        
        // Try to make first stone clickable
        if (stones[0] && stones[0].mesh) {
            targetStone = stones[0];
            targetStone.active = true;
            targetStone.isCollected = false;
            targetStone.mesh.visible = true;
            console.log("🔧 Made first stone clickable");
        } else {
            console.error("❌ Cannot make any stone clickable");
            return;
        }
    }
    
    console.log(`🎯 Found clickable stone at position:`, targetStone.mesh.position);
    
    // Test 1: Direct collection
    console.log("\n--- TEST 1: Direct Collection ---");
    const collectResult = targetStone.collect();
    console.log(`Collection result: ${collectResult}`);
    
    // Test 2: Click simulation  
    console.log("\n--- TEST 2: Click Simulation ---");
    
    // Reset stone for click test
    targetStone.isCollected = false;
    targetStone.active = true;
    if (targetStone.mesh) {
        targetStone.mesh.visible = true;
    }
    
    // Simulate click
    const clickEvent = {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2
    };
    
    console.log("🖱️ Simulating click...");
    try {
        window.app.onClick(clickEvent);
        console.log("✅ Click simulation completed");
    } catch (error) {
        console.error("❌ Click simulation failed:", error.message);
    }
    
    // Test 3: Raycasting validation
    console.log("\n--- TEST 3: Raycasting Validation ---");
    
    if (window.app.raycaster && window.app.camera) {
        const mouse = new THREE.Vector2(0, 0); // Center of screen
        window.app.raycaster.setFromCamera(mouse, window.app.camera);
        
        const intersects = window.app.raycaster.intersectObjects(window.app.sceneManager.scene.children, true);
        console.log(`🎯 Raycaster found ${intersects.length} intersections`);
        
        if (intersects.length > 0) {
            console.log("📍 First intersection:", intersects[0].object.name, intersects[0].object.type);
            
            // Check if any intersections are stones
            let stoneFound = false;
            for (let intersect of intersects) {
                if (intersect.object.userData && intersect.object.userData.type === 'stone') {
                    console.log("✅ Stone found in raycasting!");
                    stoneFound = true;
                    break;
                }
            }
            
            if (!stoneFound) {
                console.warn("⚠️ No stones detected in raycasting");
            }
        } else {
            console.warn("⚠️ No intersections found in raycasting");
        }
    }
    
    console.log("\n=== FINAL TEST COMPLETE ===");
}

// Auto-run after 4 seconds
setTimeout(() => {
    console.log("🚀 Auto-starting final stone click test...");
    runFinalStoneClickTest();
}, 4000);

// Make functions available globally
window.runFinalStoneClickTest = runFinalStoneClickTest;
window.testActualClick = testActualClick;

console.log("📋 Final stone click test loaded. Will auto-run in 4 seconds or call runFinalStoneClickTest()");

export { runFinalStoneClickTest, testActualClick };
