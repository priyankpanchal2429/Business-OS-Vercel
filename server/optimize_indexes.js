
const supabase = require('./config/supabase');

async function optimizeIndexes() {
    console.log('⚡ Optimizing Database Indexes...');

    // We try to run SQL if exec_sql RPC exists, otherwise we tell the user.
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });

    const sqlCommands = [
        'CREATE INDEX IF NOT EXISTS idx_timesheet_employee_date ON timesheet_entries("employeeId", "date");',
        'CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON payroll_entries("employeeId", "periodStart", "periodEnd");',
        'CREATE INDEX IF NOT EXISTS idx_deductions_employee_period ON deductions("employeeId", "periodStart", "periodEnd");'
    ];

    if (rpcError) {
        console.log('⚠️ exec_sql RPC not found. Please run the following SQL in your Supabase Editor:');
        sqlCommands.forEach(cmd => console.log(cmd));
    } else {
        for (const sql of sqlCommands) {
            const { error } = await supabase.rpc('exec_sql', { sql });
            if (error) console.error(`❌ Failed: ${sql}`, error.message);
            else console.log(`✅ Success: ${sql.split(' ')[2]}`);
        }
    }
}

optimizeIndexes();
