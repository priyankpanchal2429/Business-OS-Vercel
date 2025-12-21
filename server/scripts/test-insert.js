
const path = require('path');
const supabase = require('../config/supabase');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

async function testInsert() {
    console.log('🧪 Testing INSERT on "employees"...');

    const testEmployee = {
        id: 999999999, // Dummy ID
        name: "Test Employee",
        role: "Tester",
        salary: 1000,
        perShiftAmount: 100
    };

    const { data, error } = await supabase.from('employees').insert(testEmployee).select();

    if (error) {
        console.error('❌ Insert Failed:', error.message);
        console.error('Details:', error);
    } else {
        console.log('✅ Insert Succeeded:', data);

        // Cleanup
        console.log('🧹 Cleaning up test record...');
        await supabase.from('employees').delete().eq('id', 999999999);
    }
}

testInsert();
