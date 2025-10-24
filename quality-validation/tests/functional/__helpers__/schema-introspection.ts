/**
 * 🔍 SCHEMA INTROSPECTION UTILITY
 * 
 * Automatically validates database structure against TypeScript types
 * and generates schema reports for debugging type mismatches.
 */

import { createClient } from '@supabase/supabase-js';
import { getTestCredentials } from './schema-aware-fixtures';

export interface DatabaseColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

export interface TableSchema {
  tableName: string;
  columns: DatabaseColumn[];
  accessible: boolean;
  error?: string;
}

export interface SchemaValidationResult {
  table: string;
  field: string;
  expectedType: string;
  actualType: string;
  status: 'match' | 'mismatch' | 'missing';
  notes?: string;
}

/**
 * Schema introspection utility class
 */
export class SchemaIntrospector {
  private client: any;
  
  constructor() {
    this.client = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Authenticate with test credentials
   */
  async authenticate(): Promise<boolean> {
    const credentials = getTestCredentials();
    
    const { error } = await this.client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      console.warn('⚠️ Authentication failed:', error.message);
      return false;
    }

    return true;
  }

  /**
   * Get table schema by trying to select all columns
   */
  async getTableSchemaBySelection(tableName: string): Promise<TableSchema> {
    try {
      const { data, error } = await this.client
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        return {
          tableName,
          columns: [],
          accessible: false,
          error: error.message
        };
      }

      const columns: DatabaseColumn[] = [];
      
      if (data && data.length > 0) {
        const sampleRecord = data[0];
        Object.keys(sampleRecord).forEach(key => {
          const value = sampleRecord[key];
          const dataType = this.inferDataType(value);
          
          columns.push({
            column_name: key,
            data_type: dataType,
            is_nullable: value === null ? 'YES' : 'NO',
            column_default: null,
            character_maximum_length: null
          });
        });
      }

      return {
        tableName,
        columns,
        accessible: true
      };

    } catch (error) {
      return {
        tableName,
        columns: [],
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate expected schema against actual database
   */
  async validateSchema(expectedSchema: Record<string, Record<string, string>>): Promise<SchemaValidationResult[]> {
    const results: SchemaValidationResult[] = [];

    for (const [tableName, expectedFields] of Object.entries(expectedSchema)) {
      const tableSchema = await this.getTableSchemaBySelection(tableName);
      
      if (!tableSchema.accessible) {
        results.push({
          table: tableName,
          field: '*',
          expectedType: 'accessible',
          actualType: 'inaccessible',
          status: 'missing',
          notes: tableSchema.error
        });
        continue;
      }

      for (const [fieldName, expectedType] of Object.entries(expectedFields)) {
        const column = tableSchema.columns.find(c => c.column_name === fieldName);
        
        if (!column) {
          results.push({
            table: tableName,
            field: fieldName,
            expectedType,
            actualType: 'missing',
            status: 'missing'
          });
          continue;
        }

        const actualType = column.data_type;
        const status = this.compareTypes(expectedType, actualType);
        
        results.push({
          table: tableName,
          field: fieldName,
          expectedType,
          actualType,
          status
        });
      }
    }

    return results;
  }

  /**
   * Generate comprehensive schema report
   */
  async generateSchemaReport(tablesToCheck: string[] = ['leads', 'projects', 'clients', 'profiles']): Promise<string> {
    const report: string[] = [];
    report.push('# 🔍 DATABASE SCHEMA INTROSPECTION REPORT');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push('');

    // Authenticate
    const authenticated = await this.authenticate();
    report.push(`Authentication: ${authenticated ? '✅ Success' : '❌ Failed'}`);
    report.push('');

    for (const tableName of tablesToCheck) {
      report.push(`## Table: ${tableName}`);
      
      const schema = await this.getTableSchemaBySelection(tableName);
      
      if (!schema.accessible) {
        report.push(`❌ **Inaccessible**: ${schema.error}`);
        report.push('');
        continue;
      }

      report.push(`✅ **Accessible** - ${schema.columns.length} columns found`);
      report.push('');
      report.push('| Column | Type | Nullable | Notes |');
      report.push('|--------|------|----------|-------|');

      for (const column of schema.columns) {
        const nullable = column.is_nullable === 'YES' ? '✅' : '❌';
        const notes = this.getTypeNotes(column.data_type);
        report.push(`| \`${column.column_name}\` | \`${column.data_type}\` | ${nullable} | ${notes} |`);
      }
      
      report.push('');
    }

    return report.join('\n');
  }

  /**
   * Validate specific field types that caused bugs
   */
  async validateCriticalFields(): Promise<SchemaValidationResult[]> {
    const criticalSchema = {
      leads: {
        id: 'string',
        status: 'number',        // This was the bug! Expected number, tests used string
        first_name: 'string',
        last_name: 'string',
        phone: 'string',
        created_at: 'string',
        updated_at: 'string'
      }
    };

    return this.validateSchema(criticalSchema);
  }

  /**
   * Infer data type from JavaScript value
   */
  private inferDataType(value: any): string {
    if (value === null) return 'unknown';
    
    const jsType = typeof value;
    switch (jsType) {
      case 'string':
        // Check if it's a timestamp
        if (value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          return 'timestamp';
        }
        return 'text';
      case 'number':
        return Number.isInteger(value) ? 'integer' : 'numeric';
      case 'boolean':
        return 'boolean';
      case 'object':
        return Array.isArray(value) ? 'array' : 'jsonb';
      default:
        return jsType;
    }
  }

  /**
   * Compare expected vs actual types
   */
  private compareTypes(expected: string, actual: string): 'match' | 'mismatch' {
    // Normalize type names
    const normalizeType = (type: string) => {
      const typeMap: Record<string, string> = {
        'string': 'text',
        'number': 'integer',
        'timestamp': 'text',
        'jsonb': 'object'
      };
      return typeMap[type] || type;
    };

    const normalizedExpected = normalizeType(expected);
    const normalizedActual = normalizeType(actual);

    return normalizedExpected === normalizedActual ? 'match' : 'mismatch';
  }

  /**
   * Get notes about specific data types
   */
  private getTypeNotes(dataType: string): string {
    const notes: Record<string, string> = {
      'integer': '🔢 Integer - critical for status field',
      'text': '📝 Text/String',
      'timestamp': '⏰ Timestamp',
      'jsonb': '📋 JSON object',
      'boolean': '✅❌ Boolean',
      'unknown': '❓ Unknown/Null'
    };

    return notes[dataType] || '';
  }

  /**
   * Clean up authentication
   */
  async cleanup(): Promise<void> {
    await this.client.auth.signOut();
  }
}

/**
 * Quick validation function for tests
 */
export async function quickSchemaValidation(): Promise<{
  success: boolean;
  criticalFieldsValid: boolean;
  report: string;
}> {
  const introspector = new SchemaIntrospector();
  
  try {
    await introspector.authenticate();
    
    const criticalResults = await introspector.validateCriticalFields();
    const criticalFieldsValid = criticalResults.every(r => r.status === 'match');
    
    const report = await introspector.generateSchemaReport();
    
    await introspector.cleanup();

    return {
      success: true,
      criticalFieldsValid,
      report
    };
    
  } catch (error) {
    await introspector.cleanup();
    
    return {
      success: false,
      criticalFieldsValid: false,
      report: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Export default introspector instance
 */
export default SchemaIntrospector; 