const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

try {
    let serviceAccount;

    // 1. Try environment variable path
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Handled automatically by admin.credential.applicationDefault() 
        // if we don't pass anything, but let's be explicit if we can.
    }

    // 2. Try local file in server root
    const localPath = path.join(__dirname, '../service-account.json');

    if (fs.existsSync(localPath)) {
        serviceAccount = require(localPath);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('🔥 Firebase Admin Initialized with local service-account.json');
    } else {
        // 3. Fallback to default (checking env vars)
        admin.initializeApp();
        console.log('🔥 Firebase Admin Initialized with Default Credentials (Environment)');
    }

} catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    // process.exit(1); // Don't crash yet, let it fail gracefully if possible during migration
}

// Check for Local DB Trigger
if (process.env.USE_LOCAL_DB === 'true') {
    const LocalFirestore = require('../utils/localFirestore');
    console.log('⚠️  USING LOCAL JSON DATABASE (No Firebase) ⚠️');
    const db = new LocalFirestore();
    // Admin mock is minimal/empty since auth logic usually needs real admin or bypassed
    const admin = {
        messaging: () => ({ send: () => console.log('Mock notification sent') }),
        auth: () => ({ verifyIdToken: () => Promise.resolve({ uid: 'test-user', email: 'test@local.com' }) })
    };
    module.exports = { admin, db };
} else {
    // Original Firebase Export
    const db = admin.firestore();
    module.exports = { admin, db };
}
