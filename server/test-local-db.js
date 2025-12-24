require('dotenv').config({ path: '.env.development' });
const { db } = require('./config/firebase');

async function testMock() {
    console.log('🧪 Testing Local DB Mock...');

    try {
        // 1. Write
        console.log('Writing to inventory...');
        const newItem = await db.collection('inventory').add({
            name: 'Test Item',
            price: 100,
            stock: 10
        });
        console.log('✅ Added item ID:', newItem.id);

        // 2. Read
        console.log('Reading from inventory...');
        const snapshot = await db.collection('inventory').get();
        console.log(`✅ Found ${snapshot.size} items.`);

        snapshot.forEach(doc => {
            console.log(' - Doc:', doc.id, doc.data());
        });

        if (snapshot.size > 0) {
            console.log('🎉 LOCAL DB TEST PASSED');
            process.exit(0);
        } else {
            console.error('❌ Failed: No items found after adding.');
            process.exit(1);
        }

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

testMock();
