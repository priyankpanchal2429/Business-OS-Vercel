
const supabase = require('./config/supabase');

async function fixSchema() {
    console.log('🛠️ Adding missing columns to payroll_entries...');

    // We can use rpc if we have it, or direct sql isn't possible via client.
    // However, we can try to insert a record with these columns to see if it fails,
    // OR we can use the 'service_role' key if available to run raw sql? 
    // Usually we don't have raw SQL access via @supabase/supabase-js unless an RPC is set up.

    // Let's check if we can add them via a migration-like approach or if we need to ask the user.
    // Wait, I can try to use 'db-migrate' or similar if installed, or just try to update a record.

    // Since I can't run raw SQL easily without an RPC 'exec_sql', I will check if 'exec_sql' exists.
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });

    if (rpcError) {
        console.log('⚠️ exec_sql RPC not found. Trying to add columns by making a dummy update...');
        console.log('Please run the following SQL in your Supabase SQL Editor:');
        console.log(`
            ALTER TABLE payroll_entries ADD COLUMN IF NOT EXISTS "totalBillableMinutes" INTEGER DEFAULT 0;
            ALTER TABLE payroll_entries ADD COLUMN IF NOT EXISTS "workingDays" INTEGER DEFAULT 0;
            ALTER TABLE payroll_entries ADD COLUMN IF NOT EXISTS "overtimePay" NUMERIC DEFAULT 0;
        `);
    } else {
        const sql = `
            ALTER TABLE payroll_entries ADD COLUMN IF NOT EXISTS "totalBillableMinutes" INTEGER DEFAULT 0;
            ALTER TABLE payroll_entries ADD COLUMN IF NOT EXISTS "workingDays" INTEGER DEFAULT 0;
            ALTER TABLE payroll_entries ADD COLUMN IF NOT EXISTS "overtimePay" NUMERIC DEFAULT 0;
        `;
        const { error: alterError } = await supabase.rpc('exec_sql', { sql });
        if (alterError) console.error('❌ Failed to alter table:', alterError);
        else console.log('✅ Columns added successfully!');
    }
}

fixSchema();
