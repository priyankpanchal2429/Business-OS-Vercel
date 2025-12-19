
const path = require('path');
const supabase = require('../config/supabase'); // Uses the config we created earlier
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

async function checkSchema() {
    console.log('🔍 Checking for "employees" table...');

    // Try to select 1 record. Even if empty, it should not error if table exists.
    const { data, error } = await supabase.from('employees').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Error accessing "employees" table:', error.message);
        console.error('Details:', error);

        if (error.code === '42P01') { // undefined_table
            console.log('💡 DIAGNOSIS: The table does not exist. The SQL schema was likely not run successfully.');
        } else if (error.code === 'PGRST301') {
            console.log('💡 DIAGNOSIS: Supabase suggests the table is not in the schema cache or does not exist.');
        }
    } else {
        console.log('✅ "employees" table found!');
        console.log('Count:', data);
    }
}

checkSchema();
