
const supabase = require('./config/supabase');

async function inspect() {
    console.log('--- PAYROLL ENTRIES ---');
    const { data: pay, error: payErr } = await supabase.from('payroll_entries').select('*').limit(5);
    if (payErr) console.error(payErr);
    else console.log(JSON.stringify(pay, null, 2));

    console.log('\n--- TIMESHEET ENTRIES ---');
    const { data: ts, error: tsErr } = await supabase.from('timesheet_entries').select('*').limit(5);
    if (tsErr) console.error(tsErr);
    else console.log(JSON.stringify(ts, null, 2));

    console.log('\n--- EMPLOYEES ---');
    const { data: emp, error: empErr } = await supabase.from('employees').select('id, name').limit(5);
    if (empErr) console.error(empErr);
    else console.log(JSON.stringify(emp, null, 2));
}

inspect();
