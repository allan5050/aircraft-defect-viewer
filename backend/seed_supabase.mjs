import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * =============================================================================
 * Supabase Database Seeding Script
 * =============================================================================
 *
 * Usage:
 * node seed_supabase.mjs [data_file_name]
 *
 * Description:
 * This script seeds a Supabase database table with data from a JSON file.
 * It's designed to be robust, handling large datasets by batching inserts
 * and providing clear error messages.
 *
 * Arguments:
 * - data_file_name (optional): The name of the JSON file in the `../data/`
 *   directory to use for seeding. Defaults to 'aircraft_defects.json'.
 *   Example: `node seed_supabase.mjs SMALL_air_defects.json`
 *
 * Environment Variables:
 * It requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to be set in a
 * `.env` file in the same directory (`/backend`).
 *
 */

// --- Configuration ---
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
config({ path: resolve(__dirname, '.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

// --- Main Seeding Function ---
async function main() {
    console.log('--- Starting Supabase Seeding Script ---');

    // 1. Validate Environment Config
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error(
            'Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in a .env file in the /backend directory.'
        );
        console.error('Please refer to your Supabase project settings in the API section.');
        process.exit(1);
    }

    // 2. Determine which data file to use (allow command-line override)
    const defaultDataFile = 'aircraft_defects.json';
    const userSpecifiedFile = process.argv[2];
    const dataFileName = userSpecifiedFile || defaultDataFile;
    const dataPath = resolve(__dirname, '../data/', dataFileName);

    // 3. Initialize Supabase Client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    try {
        // 4. Load data from file
        console.log(`\n[Step 1/4] Loading data from: ${dataPath}`);
        const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
        console.log(`-> Found ${data.length} records to insert.`);

        // 5. Clear existing data
        console.log('\n[Step 2/4] Deleting existing data from the "defects" table...');
        // The `gt('id', '0')` is a workaround to delete all rows without needing a primary key
        // that is an integer. It effectively says "delete where id > '0'".
        const { error: deleteError } = await supabase.from('defects').delete().gt('id', '-1');
        if (deleteError) {
            console.error('Error deleting data:', deleteError.message);
            throw deleteError;
        }
        console.log('-> Existing data cleared.');

        // 6. Insert new data in batches
        console.log('\n[Step 3/4] Inserting new data in batches...');
        const batchSize = 1000;
        let totalInserted = 0;

        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(data.length / batchSize);
            
            console.log(`  - Inserting batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);
            
            const { error: insertError } = await supabase.from('defects').insert(batch);

            if (insertError) {
                console.error(`Error inserting batch ${batchNumber}:`, insertError.message);
                throw insertError;
            }
            totalInserted += batch.length;
        }

        console.log(`-> Total inserted: ${totalInserted}/${data.length}`);
        
        // 7. Final summary
        console.log('\n[Step 4/4] Verifying row count...');
        const { count, error: countError } = await supabase.from('defects').select('*', { count: 'exact', head: true });

        if(countError){
             console.warn('Could not verify final row count.', countError.message)
        } else {
             console.log(`-> Final row count in 'defects' table: ${count}.`);
        }


        console.log('\n--- Seeding Script Finished Successfully! ---');

    } catch (err) {
        console.error('\nAn error occurred during the seeding process:');
        console.error(err.message);
        console.log('--- Seeding Script Failed. ---');
        process.exit(1);
    }
}

// --- Run Script ---
main(); 