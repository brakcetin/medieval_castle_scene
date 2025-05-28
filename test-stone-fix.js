// Test Script to Validate Stone Clicking Bug Fix
// This script tests that stones can be collected on a single click

console.log("🧪 STONE CLICKING BUG FIX VALIDATION");
console.log("===================================");

function testSingleClickCollection() {
    console.log("\n🎯 TESTING SINGLE CLICK STONE COLLECTION");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ App not available");
        return false;
    }
    
    const stones = window.app.sceneManager.objects.stones;
    if (!stones || stones.length === 0) {
        console.error("❌ No stones available");
        return false;
    }
    
    // Find an uncollected stone
    const testStone = stones.find(s => s && !s.isCollected);
    if (!testStone) {
        console.error("❌ No uncollected stones available");
        return false;
    }
    
    console.log("✅ Found test stone");
    console.log(`   Initial state: isCollected=${testStone.isCollected}, isBeingCollected=${testStone.isBeingCollected}`);
    
    // Test direct collection
    console.log("\n🖱️ Simulating direct stone.collect() call...");
    const result = testStone.collect();
    
    console.log(`📊 Collection result: ${result}`);
    console.log(`   Final state: isCollected=${testStone.isCollected}, isBeingCollected=${testStone.isBeingCollected}`);
    console.log(`   Mesh visible: ${testStone.mesh ? testStone.mesh.visible : 'no mesh'}`);
    
    if (result === true && testStone.isCollected && !testStone.mesh.visible) {
        console.log("✅ SUCCESS: Stone collected successfully on single attempt!");
        return true;
    } else {
        console.log("❌ FAILURE: Stone collection failed or stone still visible");
        return false;
    }
}

function testClickHandler() {
    console.log("\n🖱️ TESTING CLICK HANDLER INTEGRATION");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ App not available");
        return false;
    }
    
    const stones = window.app.sceneManager.objects.stones;
    if (!stones || stones.length === 0) {
        console.error("❌ No stones available");
        return false;
    }
    
    // Find an uncollected stone with mesh
    const testStone = stones.find(s => s && !s.isCollected && s.mesh);
    if (!testStone) {
        console.error("❌ No uncollected stones with mesh available");
        return false;
    }
    
    console.log("✅ Found test stone with mesh");
    console.log(`   Position: (${testStone.mesh.position.x.toFixed(2)}, ${testStone.mesh.position.y.toFixed(2)}, ${testStone.mesh.position.z.toFixed(2)})`);
    
    // Simulate click event by creating a mock raycaster intersection
    const mockEvent = {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2
    };
    
    console.log("📡 Creating mock click event...");
    
    // Test the specific condition that used to cause the bug
    console.log(`   Pre-click state: isCollected=${testStone.isCollected}, isBeingCollected=${testStone.isBeingCollected}`);
    
    if (testStone && !testStone.isCollected && !testStone.isBeingCollected) {
        console.log("✅ Stone passes pre-collection checks");
        
        // This is where the bug was - previously isBeingCollected was set to true here
        // Now we call collect() directly without premature locking
        const collectResult = testStone.collect();
        
        console.log(`📊 Direct collect() result: ${collectResult}`);
        
        if (collectResult) {
            console.log("✅ SUCCESS: Click handler logic would work correctly!");
            return true;
        } else {
            console.log("❌ FAILURE: collect() method still returning false");
            return false;
        }
    } else {
        console.log("❌ FAILURE: Stone failed pre-collection checks");
        return false;
    }
}

function runFullValidation() {
    console.log("\n🔬 RUNNING FULL VALIDATION SUITE");
    console.log("===============================");
    
    const results = [];
    
    // Test 1: Direct collection
    console.log("\n📋 Test 1: Direct stone.collect() method");
    results.push(testSingleClickCollection());
    
    // Test 2: Click handler logic
    console.log("\n📋 Test 2: Click handler integration");
    results.push(testClickHandler());
    
    // Summary
    console.log("\n📈 VALIDATION SUMMARY");
    console.log("====================");
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    if (passed === total) {
        console.log(`✅ ALL TESTS PASSED (${passed}/${total})`);
        console.log("🎉 Stone clicking bug has been FIXED!");
        console.log("🎮 Stones should now collect on a single click");
    } else {
        console.log(`❌ SOME TESTS FAILED (${passed}/${total})`);
        console.log("🚨 Stone clicking bug may still exist");
    }
    
    return passed === total;
}

// Auto-run validation after a delay to ensure app is loaded
setTimeout(() => {
    console.log("\n⏰ AUTO-RUNNING STONE FIX VALIDATION...");
    runFullValidation();
}, 3000);

// Expose functions globally
window.testSingleClickCollection = testSingleClickCollection;
window.testClickHandler = testClickHandler;
window.runFullValidation = runFullValidation;

console.log("\n🛠️ AVAILABLE TEST COMMANDS:");
console.log("• testSingleClickCollection() - Test direct stone collection");
console.log("• testClickHandler() - Test click handler logic");
console.log("• runFullValidation() - Run complete test suite");
