// Final validation script for stone clicking functionality
console.log("🏰 Starting final stone click validation...");

function validateStoneClicking() {
    console.log("=== STONE CLICK VALIDATION ===");
    
    // Check 1: Game app exists
    if (!window.app) {
        console.error("❌ CRITICAL: Game app not found");
        return false;
    }
    console.log("✅ Game app found");
    
    // Check 2: Scene manager exists
    if (!window.app.sceneManager) {
        console.error("❌ CRITICAL: Scene manager not found");
        return false;
    }
    console.log("✅ Scene manager found");
    
    // Check 3: Stones exist
    const stones = window.app.sceneManager?.objects?.stones;
    if (!stones || !Array.isArray(stones) || stones.length === 0) {
        console.error("❌ CRITICAL: No stones found");
        return false;
    }
    console.log(`✅ Found ${stones.length} stones`);
    
    // Check 4: onClick method exists
    if (typeof window.app.onClick !== 'function') {
        console.error("❌ CRITICAL: onClick method not found");
        return false;
    }
    console.log("✅ onClick method available");
    
    // Check 5: Raycaster exists
    if (!window.app.raycaster) {
        console.error("❌ CRITICAL: Raycaster not found");
        return false;
    }
    console.log("✅ Raycaster available");
    
    // Check 6: Mouse object exists
    if (!window.app.mouse) {
        console.error("❌ CRITICAL: Mouse object not found");
        return false;
    }
    console.log("✅ Mouse object available");
    
    // Check 7: Event listeners are attached
    let hasClickListener = false;
    // We can't directly check event listeners, but we can test functionality
    console.log("✅ Event listeners check skipped (not directly testable)");
    
    // Check 8: Stone properties
    let validStones = 0;
    stones.forEach((stone, index) => {
        if (stone && stone.mesh) {
            // Check mesh properties
            if (stone.mesh.visible && !stone.isCollected) {
                // Check userData
                if (stone.mesh.userData && stone.mesh.userData.type === 'stone') {
                    validStones++;
                }
            }
        }
    });
    
    console.log(`✅ ${validStones} stones are properly configured for clicking`);
    
    // Check 9: Test a simulated click
    try {
        const canvas = document.getElementById('scene-canvas');
        if (canvas) {
            console.log("✅ Canvas found for click testing");
            
            // Create a test click event
            const testEvent = new MouseEvent('click', {
                clientX: canvas.width / 2,
                clientY: canvas.height / 2,
                bubbles: true
            });
            
            // This should trigger our onClick method
            console.log("🧪 Testing click event dispatch...");
            canvas.dispatchEvent(testEvent);
            console.log("✅ Click event dispatched successfully");
        } else {
            console.warn("⚠️ Canvas not found for click testing");
        }
    } catch (error) {
        console.error("❌ Click test failed:", error);
    }
    
    console.log("=== VALIDATION COMPLETE ===");
    console.log(`📊 Summary: ${validStones}/${stones.length} stones ready for clicking`);
    
    return validStones > 0;
}

// Function to test stone collection
function testStoneCollection() {
    console.log("🧪 Testing stone collection...");
    
    const stones = window.app.sceneManager?.objects?.stones;
    if (!stones || stones.length === 0) {
        console.error("❌ No stones to test");
        return;
    }
    
    const availableStones = stones.filter(stone => 
        stone && stone.mesh && stone.mesh.visible && !stone.isCollected
    );
    
    if (availableStones.length === 0) {
        console.warn("⚠️ No available stones to collect");
        return;
    }
    
    console.log(`🎯 Testing collection on ${availableStones.length} available stones...`);
    
    // Test the first available stone
    const testStone = availableStones[0];
    console.log("Testing stone at position:", testStone.mesh.position);
    
    // Try to collect it directly
    if (typeof testStone.collect === 'function') {
        console.log("🔧 Testing direct collection...");
        const wasCollected = testStone.isCollected;
        testStone.collect();
        
        setTimeout(() => {
            if (testStone.isCollected && !wasCollected) {
                console.log("✅ Direct stone collection works!");
            } else {
                console.log("❌ Direct stone collection failed");
            }
        }, 100);
    }
}

// Run validation when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(validateStoneClicking, 2000);
    });
} else {
    setTimeout(validateStoneClicking, 2000);
}

// Make functions available globally for manual testing
window.validateStoneClicking = validateStoneClicking;
window.testStoneCollection = testStoneCollection;

console.log("🏰 Validation script loaded. Functions available:");
console.log("- validateStoneClicking()");
console.log("- testStoneCollection()");
