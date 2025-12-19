const supabase = require('./server/config/supabase');

async function addColumn() {
    // Supabase JS client doesn't directly support ALTER TABLE.
    // However, some projects use an RPC or a custom endpoint.
    // Since I don't see an RPC, I'll try to use a raw query if available (unlikely with this client).
    // Alternatively, I'll check if I can use the 'supabase' CLI if it's installed.

    console.log('Checking if column hsn_code can be added via RPC or if it already exists...');

    // Check if it exists first
    const { data: checkData, error: checkError } = await supabase
        .from('inventory')
        .select('hsn_code')
        .limit(1);

    if (checkError) {
        if (checkError.code === '42703') { // Column does not exist
            console.log('Column hsn_code does not exist. Attempting to add it via RPC if available.');
            // This is a long shot, but sometimes people expose a 'exec_sql' RPC
            const { error: rpcError } = await supabase.rpc('exec_sql', {
                sql: 'ALTER TABLE inventory ADD COLUMN hsn_code TEXT;'
            });
            if (rpcError) {
                console.error('Failed to add column via RPC:', rpcError);
                console.log('Manual schema update might be required.');
            } else {
                console.log('Column hsn_code added successfully via RPC!');
            }
        } else {
            console.error('Error checking column:', checkError);
        }
    } else {
        console.log('Column hsn_code already exists.');
    }
}

addColumn();
