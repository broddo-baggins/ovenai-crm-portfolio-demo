#!/usr/bin/env node

/**
 * Queue System Database Schema & Foreign Key Auditor
 * 
 * Connects to actual Site DB to check:
 * 1. Queue table existence and structure 
 * 2. Foreign key constraints
 * 3. Missing relationships causing orphan records
 * 4. Data integrity issues
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load credentials
const credentialsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const supabaseUrl = credentials.supabase.development.url;
const supabaseKey = credentials.supabase.development.service_role_key;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 QUEUE SYSTEM DATABASE AUDIT');
console.log('===============================');
console.log(`Database: ${supabaseUrl}`);
console.log(`Project: ${credentials.supabase.development.project_id}`);
console.log('');

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error && error.code === '42P01') {
      return { exists: false, count: 0, error: error.message };
    } else if (error) {
      return { exists: 'unknown', count: 0, error: error.message };
    }
    
    return { exists: true, count: data?.length || 0 };
  } catch (err) {
    return { exists: false, count: 0, error: err.message };
  }
}

async function getTableColumns(tableName) {
  try {
    // Use PostgreSQL system catalogs to get column info
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      // Fallback: try to get a sample record to infer structure
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (sampleError) {
        return { error: error.message };
      }
      
      return { 
        columns: sampleData[0] ? Object.keys(sampleData[0]).map(col => ({ column_name: col })) : [],
        inferred: true 
      };
    }
    
    return { columns: data || [] };
  } catch (err) {
    return { error: err.message };
  }
}

async function getForeignKeyConstraints(tableName) {
  try {
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = '${tableName}'
        AND tc.table_schema = 'public';
      `
    });
    
    if (error) {
      return { error: error.message };
    }
    
    return { constraints: data || [] };
  } catch (err) {
    return { error: err.message };
  }
}

async function checkDataIntegrity(tableName, foreignKeyColumn, referencedTable, referencedColumn) {
  try {
    // Check for orphan records (records with foreign keys that don't exist in referenced table)
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT COUNT(*) as orphan_count
        FROM ${tableName} t1
        LEFT JOIN ${referencedTable} t2 ON t1.${foreignKeyColumn} = t2.${referencedColumn}
        WHERE t1.${foreignKeyColumn} IS NOT NULL 
        AND t2.${referencedColumn} IS NULL;
      `
    });
    
    if (error) {
      return { error: error.message };
    }
    
    return { orphan_count: data[0]?.orphan_count || 0 };
  } catch (err) {
    return { error: err.message };
  }
}

async function auditQueueSystem() {
  const queueTables = [
    'leads',
    'user_queue_settings', 
    'lead_processing_queue',
    'whatsapp_message_queue',
    'queue_performance_metrics'
  ];
  
  console.log('📋 TABLE EXISTENCE AUDIT');
  console.log('-------------------------');
  
  const tableStatus = {};
  
  for (const table of queueTables) {
    const status = await checkTableExists(table);
    tableStatus[table] = status;
    
    const statusIcon = status.exists === true ? '✅' : 
                      status.exists === false ? '❌' : '⚠️';
    
    console.log(`${statusIcon} ${table.padEnd(25)} | ${status.exists === true ? 'EXISTS' : 'MISSING'} ${status.error ? `(${status.error})` : ''}`);
  }
  
  console.log('\n🔍 SCHEMA STRUCTURE AUDIT');
  console.log('--------------------------');
  
  for (const table of queueTables) {
    if (tableStatus[table].exists === true) {
      console.log(`\n📊 ${table.toUpperCase()} TABLE STRUCTURE:`);
      
      const columns = await getTableColumns(table);
      if (columns.error) {
        console.log(`   ❌ Error fetching columns: ${columns.error}`);
      } else {
        columns.columns?.forEach(col => {
          console.log(`   • ${col.column_name} (${col.data_type || 'unknown'})`);
        });
        if (columns.inferred) {
          console.log('   ⚠️  Schema inferred from sample data');
        }
      }
    }
  }
  
  console.log('\n🔗 FOREIGN KEY CONSTRAINTS AUDIT');
  console.log('----------------------------------');
  
  for (const table of queueTables) {
    if (tableStatus[table].exists === true) {
      console.log(`\n🔐 ${table.toUpperCase()} FOREIGN KEYS:`);
      
      const fks = await getForeignKeyConstraints(table);
      if (fks.error) {
        console.log(`   ❌ Error fetching FKs: ${fks.error}`);
      } else if (fks.constraints?.length === 0) {
        console.log('   ⚠️  No foreign key constraints found');
      } else {
        fks.constraints?.forEach(fk => {
          console.log(`   • ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
    }
  }
  
  console.log('\n🔧 EXPECTED vs ACTUAL FOREIGN KEYS');
  console.log('-----------------------------------');
  
  const expectedFKs = {
    'user_queue_settings': [
      { column: 'user_id', references: 'auth.users.id' }
    ],
    'lead_processing_queue': [
      { column: 'lead_id', references: 'leads.id' },
      { column: 'user_id', references: 'auth.users.id' },
      { column: 'client_id', references: 'clients.id' },
      { column: 'project_id', references: 'projects.id' }
    ],
    'whatsapp_message_queue': [
      { column: 'lead_id', references: 'leads.id' },
      { column: 'user_id', references: 'auth.users.id' },
      { column: 'client_id', references: 'clients.id' }
    ],
    'queue_performance_metrics': [
      { column: 'user_id', references: 'auth.users.id' }
    ]
  };
  
  for (const [table, expectedConstraints] of Object.entries(expectedFKs)) {
    if (tableStatus[table]?.exists === true) {
      console.log(`\n📋 ${table.toUpperCase()} EXPECTED FKs:`);
      
      const actualFKs = await getForeignKeyConstraints(table);
      const actualConstraints = actualFKs.constraints || [];
      
      expectedConstraints.forEach(expected => {
        const [refTable, refColumn] = expected.references.split('.');
        const actual = actualConstraints.find(fk => 
          fk.column_name === expected.column &&
          fk.foreign_table_name === refTable &&
          fk.foreign_column_name === refColumn
        );
        
        if (actual) {
          console.log(`   ✅ ${expected.column} → ${expected.references}`);
        } else {
          console.log(`   ❌ MISSING: ${expected.column} → ${expected.references}`);
        }
      });
    }
  }
  
  console.log('\n🔍 DATA INTEGRITY CHECK');
  console.log('------------------------');
  
  // Check for orphan records
  const integrityChecks = [
    { table: 'user_queue_settings', fkColumn: 'user_id', refTable: 'auth.users', refColumn: 'id' },
    { table: 'whatsapp_message_queue', fkColumn: 'lead_id', refTable: 'leads', refColumn: 'id' },
    { table: 'whatsapp_message_queue', fkColumn: 'user_id', refTable: 'auth.users', refColumn: 'id' }
  ];
  
  for (const check of integrityChecks) {
    if (tableStatus[check.table]?.exists === true) {
      console.log(`\n🔍 Checking ${check.table}.${check.fkColumn} → ${check.refTable}.${check.refColumn}:`);
      
      const integrity = await checkDataIntegrity(
        check.table, 
        check.fkColumn, 
        check.refTable, 
        check.refColumn
      );
      
      if (integrity.error) {
        console.log(`   ❌ Error: ${integrity.error}`);
      } else if (integrity.orphan_count > 0) {
        console.log(`   ⚠️  Found ${integrity.orphan_count} orphan records`);
      } else {
        console.log(`   ✅ Data integrity OK`);
      }
    }
  }
  
  console.log('\n💾 QUEUE DATA COUNTS');
  console.log('--------------------');
  
  for (const table of queueTables) {
    if (tableStatus[table].exists === true) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(0);
      
      if (error) {
        console.log(`${table.padEnd(25)} | ERROR: ${error.message}`);
      } else {
        const count = data?.length || 0;
        console.log(`${table.padEnd(25)} | ${count} records`);
      }
    }
  }
  
  console.log('\n🎯 QUEUE SYSTEM HEALTH SUMMARY');
  console.log('===============================');
  
  const missingTables = Object.entries(tableStatus)
    .filter(([_, status]) => status.exists !== true)
    .map(([table, _]) => table);
  
  if (missingTables.length > 0) {
    console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
  } else {
    console.log('✅ All expected tables exist');
  }
  
  console.log('\n🔧 RECOMMENDED ACTIONS:');
  console.log('- Run queue schema migration if tables are missing');
  console.log('- Add missing foreign key constraints');
  console.log('- Fix orphan records if any found');
  console.log('- Verify queue UI button functionality');
  
  return {
    tablesExist: Object.fromEntries(Object.entries(tableStatus).map(([k,v]) => [k, v.exists === true])),
    missingTables,
    summary: 'Queue system database audit completed'
  };
}

// Run the audit
auditQueueSystem()
  .then(result => {
    console.log(`\n✅ Audit completed: ${result.summary}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }); 