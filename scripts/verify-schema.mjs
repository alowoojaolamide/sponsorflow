#!/usr/bin/env node

/**
 * SponsorFlow Schema Verification Script
 * Validates database tables, connectivity, and REST endpoints.
 * Uses native fetch (Node 18+) with zero external dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env.local or .env if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  const env = {};

  for (const file of envFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...vals] = trimmed.split('=');
        if (key && vals.length > 0) {
          env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
      break;
    }
  }
  return env;
}

function realValue(...candidates) {
  return candidates.find((v) => v && !v.startsWith('your-') && !v.includes('YOUR-'));
}

const env = loadEnv();
const supabaseUrl = realValue(process.env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = realValue(
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const REQUIRED_TABLES = [
  'users',
  'user_sessions',
  'user_profiles',
  'user_industries',
  'user_skills',
  'user_projects',
  'user_documents',
  'company_imports',
  'companies',
  'contacts',
  'outreach_emails',
  'email_events',
  'email_replies',
  'send_limits',
  'analytics_daily',
  'analytics_by_industry'
];

console.log('\n========================================');
console.log('🚀 SponsorFlow Phase 1: Schema Verifier');
console.log('========================================\n');

if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
  console.log('ℹ️  No active Supabase URL detected in .env.local.');
  console.log('   Migration files are ready in:');
  console.log('   - supabase/migrations/20260908000001_initial_schema.sql');
  console.log('   - supabase/migrations/20260908000002_rls_and_policies.sql');
  console.log('   - supabase/migrations/20260908000003_indexes.sql');
  console.log('   - supabase/schema.sql (Consolidated for Supabase SQL Editor)\n');
  console.log('👉 To verify against your database:');
  console.log('   1. Paste supabase/schema.sql into the Supabase SQL Editor, or run:');
  console.log('      npx supabase db push');
  console.log('   2. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.log('   3. Re-run: node scripts/verify-schema.mjs\n');
  process.exit(0);
}

console.log(`Connecting to Supabase at: ${supabaseUrl}`);

async function verifyTables() {
  let passed = 0;
  let failed = 0;

  for (const table of REQUIRED_TABLES) {
    try {
      const endpoint = `${supabaseUrl}/rest/v1/${table}?select=*&limit=1`;
      const res = await fetch(endpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      });

      if (res.ok) {
        console.log(`  ✅ Table '${table}' exists and is accessible via PostgREST.`);
        passed++;
      } else {
        const errorText = await res.text();
        console.log(`  ❌ Table '${table}' returned status ${res.status}: ${errorText}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ Table '${table}' failed: ${err.message}`);
      failed++;
    }
  }

  console.log('\n----------------------------------------');
  console.log(`Summary: ${passed}/${REQUIRED_TABLES.length} tables verified.`);
  if (failed === 0) {
    console.log('🎉 All 16 tables deployed and functional!');
  } else {
    console.log('⚠️  Some tables were not reachable. Please check your migrations.');
  }
  console.log('----------------------------------------\n');
}

verifyTables();
