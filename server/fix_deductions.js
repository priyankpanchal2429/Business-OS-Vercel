
const supabase = require('./config/supabase');

async function fixDeductionsTable() {
    console.log('🧹 Standardizing Deductions Table...');

    // 1. Check if deduction_entries has data
    const { data: entries, error: fetchErr } = await supabase
        .from('deduction_entries')
        .select('*');

    if (fetchErr) {
        console.log('ℹ️ deduction_entries table not found or inaccessible. Good.');
    } else if (entries && entries.length > 0) {
        console.log(`📊 Found ${entries.length} entries in deduction_entries. Moving to deductions...`);

        // Map to correct schema
        const mapped = entries.map(e => ({
            id: e.id || `ded-${Date.now()}-${Math.random()}`,
            employeeId: e.employeeId,
            periodStart: e.periodStart || e.date, // Match schema
            periodEnd: e.periodEnd || e.date,
            type: e.type || 'advance',
            amount: e.amount || 0,
            description: e.description || '',
            status: e.status || 'active',
            created_at: e.created_at || new Date().toISOString()
        }));

        const { error: insErr } = await supabase.from('deductions').insert(mapped);
        if (insErr) {
            console.error('❌ Failed to move data:', insErr.message);
        } else {
            console.log('✅ Data moved successfully!');
            // Optional: Drop table if possible, or just log
            console.log('⚠️ Please manually drop "deduction_entries" if it is no longer needed.');
        }
    } else {
        console.log('✅ deduction_entries is empty.');
    }
}

fixDeductionsTable();
