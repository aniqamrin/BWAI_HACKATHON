const admin = require('firebase-admin');

async function testFirestoreConnection() {
  const db = admin.firestore();
  try {
    console.log("Testing Firestore connection...");
    // Attempt to write a temporary health check document
    const testDoc = db.collection('_health_checks').doc('ping');
    await testDoc.set({
      last_check: new Date().toISOString(),
      status: 'ok'
    });
    
    // Read it back to verify
    const snap = await testDoc.get();
    if (snap.exists) {
      console.log("✅ Firestore Connection Successful!");
      console.log("Data retrieved:", snap.data());
    }
  } catch (error) {
    console.error("❌ Firestore Connection Failed:");
    console.error(error.message);
    
    // Specific debugging tips based on common errors:
    if (error.message.includes("credential")) {
      console.error("Tip: Check if your Service Account JSON path is correct.");
    } else if (error.message.includes("deadline")) {
      console.error("Tip: This is likely a network/firewall issue.");
    }
  }
}

testFirestoreConnection();