
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({
    path: path.join(__dirname, '..', process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development')
});

const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace('.coproduction', '.co') : '';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase URL or Key missing. Database connection will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
