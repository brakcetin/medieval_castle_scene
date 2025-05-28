// 🎯 FINAL STONE CLICK TEST - Complete Fix Verification
console.log("🚀 Final Stone Click Test başlatılıyor...");

function runCompleteTest() {
    console.log("\n🔬 === COMPLETE STONE CLICK FIX TEST ===");
    
    if (!window.app || !window.app.sceneManager) {
        console.error("❌ Game not loaded!");
        return false;
    }
    
    const stones = window.app.sceneManager.objects.stones || [];
    console.log(`🗿 Found ${stones.length} stones total`);
    
    // Find first uncollected stone
    const testStone = stones.find(s => s && s.mesh && s.mesh.visible && !s.isCollected && !s.isBeingCollected);
    
    if (!testStone) {
        console.error("❌ No suitable stone found for testing!");
        return false;
    }
    
    console.log(`🎯 Testing stone at position: (${testStone.mesh.position.x.toFixed(2)}, ${testStone.mesh.position.y.toFixed(2)}, ${testStone.mesh.position.z.toFixed(2)})`);
    
    // PRE-TEST STATE
    console.log("\n📊 PRE-TEST STATE:");
    console.log(`  Visible: ${testStone.mesh.visible}`);
    console.log(`  Collected: ${testStone.isCollected}`);
    console.log(`  Processing: ${testStone.isBeingCollected}`);
    console.log(`  In Scene: ${window.app.sceneManager.scene.children.includes(testStone.mesh)}`);
    console.log(`  Has Parent: ${testStone.mesh.parent ? true : false}`);
    
    const initialScore = window.app.score || 0;
    console.log(`  Current Score: ${initialScore}`);
    
    // PERFORM CLICK TEST
    console.log("\n🖱️ PERFORMING CLICK TEST...");
    
    const collectResult = testStone.collect();
    
    // IMMEDIATE POST-TEST STATE (sync)
    console.log("\n📊 IMMEDIATE POST-TEST STATE:");
    console.log(`  Collect Result: ${collectResult}`);
    console.log(`  Visible: ${testStone.mesh ? testStone.mesh.visible : 'mesh is null'}`);
    console.log(`  Collected: ${testStone.isCollected}`);
    console.log(`  Processing: ${testStone.isBeingCollected}`);
    
    if (testStone.mesh) {
        console.log(`  Still In Scene: ${window.app.sceneManager.scene.children.includes(testStone.mesh)}`);
        console.log(`  Has Parent: ${testStone.mesh.parent ? true : false}`);
        console.log(`  Scale: (${testStone.mesh.scale.x}, ${testStone.mesh.scale.y}, ${testStone.mesh.scale.z})`);
        console.log(`  Position: (${testStone.mesh.position.x}, ${testStone.mesh.position.y}, ${testStone.mesh.position.z})`);
    } else {
        console.log(`  ✅ Mesh is NULL (completely removed)`);
    }
    
    // TEST RESULTS ANALYSIS
    console.log("\n🎯 TEST RESULTS ANALYSIS:");
    
    let success = true;
    let issues = [];
    
    // Check 1: Collection should succeed
    if (!collectResult) {
        success = false;
        issues.push("❌ Stone.collect() returned false");
    } else {
        console.log("✅ Stone.collect() returned true");
    }
    
    // Check 2: Stone should be marked as collected
    if (!testStone.isCollected) {
        success = false;
        issues.push("❌ Stone.isCollected is still false");
    } else {
        console.log("✅ Stone.isCollected is true");
    }
    
    // Check 3: Mesh should be invisible or null
    if (testStone.mesh && testStone.mesh.visible) {
        success = false;
        issues.push("❌ Stone mesh is still visible");
    } else {
        console.log("✅ Stone mesh is invisible or removed");
    }
    
    // Check 4: Test multiple clicks (should fail)
    console.log("\n🔄 Testing multiple clicks (should fail):");
    const secondClick = testStone.collect();
    const thirdClick = testStone.collect();
    
    if (secondClick || thirdClick) {
        success = false;
        issues.push("❌ Multiple clicks succeeded (should fail)");
    } else {
        console.log("✅ Multiple clicks properly rejected");
    }
    
    // Check 5: Score should increase (if scoring system works)
    setTimeout(() => {
        const newScore = window.app.score || 0;
        if (newScore > initialScore) {
            console.log(`✅ Score increased: ${initialScore} → ${newScore}`);
        } else {
            console.log(`⚠️ Score not increased: ${initialScore} → ${newScore}`);
        }
    }, 100);
    
    // FINAL VERDICT
    console.log("\n🏆 === FINAL VERDICT ===");
    
    if (success) {
        console.log("🎉 ✅ ALL TESTS PASSED! Stone click fix is working correctly!");
        console.log("🎯 Stones should now disappear immediately on first click!");
    } else {
        console.log("💥 ❌ SOME TESTS FAILED:");
        issues.forEach(issue => console.log(`     ${issue}`));
    }
    
    return success;
}

// Test duplicate click detection in raycaster
function testRaycastFiltering() {
    console.log("\n🔍 === RAYCAST FILTERING TEST ===");
    
    if (!window.app || !window.app.raycaster) {
        console.error("❌ Raycaster not available");
        return;
    }
    
    // Get all intersections
    window.app.raycaster.setFromCamera({x: 0, y: 0}, window.app.camera);
    const allIntersects = window.app.raycaster.intersectObjects(window.app.sceneManager.scene.children, true);
    
    console.log(`🎯 Total intersectable objects: ${allIntersects.length}`);
    
    // Count by type
    const typeCount = {};
    allIntersects.forEach(intersection => {
        const type = intersection.object.userData?.type || 'unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    console.log("📊 Objects by type:", typeCount);
    
    // Check for collected stones
    const collectedStones = allIntersects.filter(i => 
        i.object.userData?.type === 'collected_stone' || 
        i.object.userData?.type === 'destroyed_stone'
    );
    
    if (collectedStones.length > 0) {
        console.log(`⚠️ Warning: ${collectedStones.length} collected/destroyed stones still intersectable`);
    } else {
        console.log("✅ No collected stones in raycast results");
    }
}

// Auto-run test
console.log("⏰ Test başlayacak 2 saniye içinde...");
setTimeout(() => {
    runCompleteTest();
    testRaycastFiltering();
}, 2000);

// Export for manual use
window.runStoneClickTest = runCompleteTest;
window.testRaycastFiltering = testRaycastFiltering;

console.log("💡 Manuel test için: runStoneClickTest() veya testRaycastFiltering() fonksiyonlarını kullanabilirsiniz");
