const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

console.log('Testing Firebase Connection...');
console.log('Project ID:', serviceAccount.project_id);

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Initialized.');

    const db = admin.firestore();
    db.collection('inventory').limit(1).get()
        .then(snapshot => {
            console.log('Successfully connected to Firestore!');
            console.log('Docs found:', snapshot.size);
            process.exit(0);
        })
        .catch(error => {
            console.error('Firestore Error:', error);
            process.exit(1);
        });

} catch (error) {
    console.error('Initialization Error:', error);
    process.exit(1);
}
