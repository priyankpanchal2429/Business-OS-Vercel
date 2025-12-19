const supabase = require('./server/config/supabase');

async function checkSchema() {
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching inventory:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in inventory table:', Object.keys(data[0]));
    } else {
        console.log('Inventory table is empty, could not determine columns.');
    }
}

checkSchema();
