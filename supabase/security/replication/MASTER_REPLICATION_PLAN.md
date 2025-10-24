#!/usr/bin/env node

// SCHEMA REPLICATION SCRIPT - SAFE MASTER DATABASE READING
// This script reads master database schema and creates equivalent tables locally

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

console.log('🔄 SCHEMA REPLICATION - MASTER TO LOCAL');
console.log('════════════════════════════════════════════════════════');
console.log('⚠️  SAFETY: Read-only access to master, write to local only');
console.log('');

// Load credentials
const masterCredentials = loadCredentials('./master-db-credentials.local');
const localCredentials = loadCredentials('./supabase-credentials.local');

// Create clients
const masterClient = createClient(
  masterCredentials.MASTER_SUPABASE_URL,
  masterCredentials.MASTER_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const localClient = createClient(
  localCredentials.SUPABASE_URL,
  localCredentials.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function loadCredentials(path) {
  const content = readFileSync(path, 'utf8');
  const credentials = {};
  content.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      credentials[key.trim()] = value.trim();
    }
  });
  return credentials;
}

async function analyzeTableSchema(tableName) {
  console.log(`\n🔍 Analyzing ${tableName} schema from master...`);
  
  try {
    // Safe read with LIMIT 1 to get schema
    const { data, error } = await masterClient
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Error accessing ${tableName}: ${error.message}`);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`⚠️  ${tableName} is empty, will analyze structure anyway`);
      return { columns: [], isEmpty: true };
    }
    
    const sample = data[0];
    const columns = Object.keys(sample).map(key => ({
      name: key,
      type: inferSQLType(sample[key]),
      nullable: sample[key] === null,
      sampleValue: sample[key]
    }));
    
    console.log(`✅ Found ${columns.length} columns in ${tableName}`);
    columns.forEach(col => {
      console.log(`   ${col.name}: ${col.type} ${col.nullable ? '(nullable)' : '(not null)'}`);
    });
    
    return { columns, isEmpty: false, sampleData: sample };
    
  } catch (error) {
    console.log(`❌ Error analyzing ${tableName}: ${error.message}`);
    return null;
  }
}

function inferSQLType(value) {
  if (value === null) return 'TEXT'; // Default for null values
  
  switch (typeof value) {
    case 'string':
      // Check if it's a UUID pattern
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return 'UUID';
      }
      // Check if it's a timestamp
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return 'TIMESTAMP WITH TIME ZONE';
      }
      // Check if it's a phone number
      if (/^\+\d{10,15}$/.test(value)) {
        return 'VARCHAR(20)';
      }
      // Default string
      return value.length > 255 ? 'TEXT' : 'VARCHAR(255)';
    
    case 'number':
      return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
    
    case 'boolean':
      return 'BOOLEAN';
    
    case 'object':
      return 'JSONB';
    
    default:
      return 'TEXT';
  }
}

function generateCreateTableSQL(tableName, schema) {
  if (!schema || !schema.columns) {
    return null;
  }
  
  const { columns } = schema;
  
  let sql = `-- Create ${tableName} table (replicated from master)\n`;
  sql += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
  
  const columnDefinitions = columns.map(col => {
    let def = `    ${col.name} ${col.type}`;
    
    // Add constraints based on column name patterns
    if (col.name === 'id') {
      def += ' DEFAULT gen_random_uuid() PRIMARY KEY';
    } else if (col.name.endsWith('_id') && col.type === 'UUID') {
      def += ' REFERENCES public.${getForeignTable(col.name)}(id)';
    } else if (col.name === 'created_at' || col.name === 'updated_at') {
      def += ' DEFAULT NOW()';
    } else if (!col.nullable && col.sampleValue !== null) {
      def += ' NOT NULL';
    }
    
    return def;
  });
  
  sql += columnDefinitions.join(',\n');
  sql += '\n);\n\n';
  
  // Add indexes
  sql += `-- Indexes for ${tableName}\n`;
  columns.forEach(col => {
    if (col.name.endsWith('_id') || col.name === 'status' || col.name === 'created_at') {
      sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_${col.name} ON public.${tableName}(${col.name});\n`;
    }
  });
  
  sql += '\n';
  return sql;
}

function getForeignTable(columnName) {
  const mapping = {
    'client_id': 'clients',
    'project_id': 'projects', 
    'lead_id': 'leads',
    'conversation_id': 'conversations'
  };
  return mapping[columnName] || 'unknown';
}

async function main() {
  const criticalTables = [
    'conversations',
    'whatsapp_messages', 
    'leads',
    'clients',
    'projects'
  ];
  
  const schemas = {};
  let allSQL = '-- MASTER DATABASE SCHEMA REPLICATION\n';
  allSQL += '-- Generated automatically from master database analysis\n';
  allSQL += '-- ⚠️  REVIEW BEFORE EXECUTING!\n\n';
  
  for (const table of criticalTables) {
    const schema = await analyzeTableSchema(table);
    if (schema) {
      schemas[table] = schema;
      const sql = generateCreateTableSQL(table, schema);
      if (sql) {
        allSQL += sql;
      }
    }
  }
  
  // Save SQL to file for review
  const sqlFileName = 'supabase/replication/master-schema-replication.sql';
  writeFileSync(sqlFileName, allSQL);
  
  console.log('\n📄 SCHEMA ANALYSIS COMPLETE');
  console.log('════════════════════════════════════════════════════════');
  console.log(`✅ Analyzed ${Object.keys(schemas).length} tables`);
  console.log(`📝 Generated SQL saved to: ${sqlFileName}`);
  console.log('⚠️  IMPORTANT: Review the SQL file before executing!');
  console.log('');
  console.log('🔄 Next steps:');
  console.log('1. Review generated SQL file');
  console.log('2. Modify foreign key constraints as needed');
  console.log('3. Execute SQL in local database');
  console.log('4. Verify table creation');
  console.log('5. Run data replication scripts');
  
  return schemas;
}

main().catch(console.error); 