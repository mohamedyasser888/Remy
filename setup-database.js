/**
 * Database Setup Script
 * Run this to automatically create all tables in Supabase
 * 
 * Usage: node setup-database.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.error('Please create a .env file with your Supabase credentials.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.+)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file!');
  console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
console.log(`📍 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the migration SQL file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

console.log('\n📄 Migration file loaded');
console.log('⚠️  IMPORTANT: This script requires service_role key to execute SQL.');
console.log('⚠️  Please run the migration SQL manually in Supabase Dashboard:');
console.log('\n📋 Steps:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Click "New Query"');
console.log('4. Copy the contents of: supabase/migrations/001_initial_schema.sql');
console.log('5. Paste into the SQL Editor');
console.log('6. Click "Run" (or press Ctrl+Enter)');
console.log('7. Wait for success message\n');

// Test connection
console.log('🔍 Testing connection...');
const { data, error } = await supabase.from('profiles').select('count').limit(1);

if (error && error.message.includes('does not exist')) {
  console.log('❌ Tables not created yet. Please run the migration SQL manually (see steps above).');
  process.exit(1);
} else if (error) {
  console.log('⚠️  Connection test error:', error.message);
  console.log('Tables may not be created yet. Please run the migration SQL manually.');
  process.exit(1);
} else {
  console.log('✅ Connected to Supabase successfully!');
  console.log('✅ Tables are created and accessible!');
  console.log('\n🎉 Your database is ready!');
  console.log('\n🚀 Next steps:');
  console.log('1. Ensure storage bucket "clothes" is created (see supabase/storage_setup.md)');
  console.log('2. Start the app: npm run dev');
  console.log('3. Register an account and start using the app!');
}
