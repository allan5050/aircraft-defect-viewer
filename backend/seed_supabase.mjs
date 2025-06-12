import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Run config to get credentials from .env file
config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in a .env file in the /backend directory.'
  );
  console.error('Please refer to your Supabase project settings in the API section.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const dataPath = resolve(__dirname, '../data/SMALL_air_defects.json');

async function seed() {
  console.log('--- Starting Supabase seeding script ---');
  
  try {
    // 1. Read the data file
    console.log(`Reading data from: ${dataPath}`);
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
    console.log(`Found ${data.length} records to insert.`);

    // 2. Clear existing data (optional, but good for rerunning the script)
    console.log('Deleting existing data from the "defects" table...');
    const { error: deleteError } = await supabase.from('defects').delete().gt('id', '0'); // gt is a trick to delete all
    if (deleteError) {
      console.error('Error deleting data:', deleteError.message);
      throw deleteError;
    }
    console.log('Existing data cleared.');

    // 3. Insert new data
    console.log('Inserting new data...');
    const { data: insertedData, error: insertError } = await supabase
      .from('defects')
      .insert(data)
      .select();

    if (insertError) {
      console.error('Error inserting data:', insertError.message);
      throw insertError;
    }

    console.log(`Successfully inserted ${insertedData.length} records.`);
    console.log('--- Seeding script finished successfully! ---');

  } catch (err) {
    console.error('\nAn error occurred during the seeding process:');
    console.error(err.message);
    console.log('--- Seeding script failed. ---');
    process.exit(1);
  }
}

seed(); 