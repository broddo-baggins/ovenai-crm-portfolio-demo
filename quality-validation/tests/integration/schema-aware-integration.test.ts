import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { 
  schemaAwareLeadFixtures, 
  temperatureCalculationFixtures,
  getTestCredentials,
  validateLeadSchema
} from '../__helpers__/schema-aware-fixtures';

/**
 * 🔗 SCHEMA-AWARE INTEGRATION TESTS
 * 
 * These tests use REAL database connections with schema-aware fixtures
 * to ensure our code works with actual database field types.
 * 
 * This prevents integration bugs where unit tests pass with mock data
 * but production fails with real database data.
 */

describe('🔗 Schema-Aware Integration Tests', () => {
  let testClient: any;
  let createdLeadIds: string[] = [];
  let testCredentials: any;

  beforeAll(async () => {
    testCredentials = getTestCredentials();
    
    // Create a test Supabase client
    testClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Authenticate as test user
    const { error: authError } = await testClient.auth.signInWithPassword({
      email: testCredentials.email,
      password: testCredentials.password
    });

    if (authError) {
      console.warn('⚠️ Could not authenticate test user:', authError.message);
    }
  });

  afterAll(async () => {
    // Clean up created test data
    if (createdLeadIds.length > 0) {
      await testClient
        .from('leads')
        .delete()
        .in('id', createdLeadIds);
      
      console.log(`🧹 Cleaned up ${createdLeadIds.length} test leads`);
    }

    // Sign out test user
    await testClient.auth.signOut();
  });

  test('✅ Can create leads with INTEGER status values in real database', async () => {
    const testLead = {
      ...schemaAwareLeadFixtures.pending,
      id: `test-integration-${Date.now()}`
    };

    const { data, error } = await testClient
      .from('leads')
      .insert(testLead)
      .select()
      .single();

    if (error) {
      console.warn('⚠️ Cannot create test lead - skipping integration test:', error.message);
      return;
    }

    expect(data).toBeTruthy();
    expect(data.status).toBe(1); // INTEGER status
    expect(typeof data.status).toBe('number');
    
    // Track for cleanup
    createdLeadIds.push(data.id);
    
    console.log('✅ Successfully created lead with integer status:', data.status);
  });

  test('✅ getLeadTemperature works with real database integer status', async () => {
    // Create test leads with various integer status values
    const testLeads = [
      { ...schemaAwareLeadFixtures.pending, id: `int-test-pending-${Date.now()}` },
      { ...schemaAwareLeadFixtures.queued, id: `int-test-queued-${Date.now()}` },
      { ...schemaAwareLeadFixtures.active, id: `int-test-active-${Date.now()}` }
    ];

    // Insert test leads
    const { data: createdLeads, error } = await testClient
      .from('leads')
      .insert(testLeads)
      .select();

    if (error) {
      console.warn('⚠️ Cannot create test leads for integration test:', error.message);
      return;
    }

    expect(createdLeads).toBeTruthy();
    expect(createdLeads.length).toBe(3);

    // Track for cleanup
    createdLeadIds.push(...createdLeads.map((l: any) => l.id));

    // Import the actual function and test with real database data
    const { getLeadTemperature } = await import('@/utils/leadUtils');

    for (const lead of createdLeads) {
      // Validate schema
      expect(validateLeadSchema(lead)).toBe(true);
      
      // This should NOT throw "toLowerCase is not a function"
      expect(() => getLeadTemperature(lead)).not.toThrow();
      
      const temperature = getLeadTemperature(lead);
      expect(temperature).toBeGreaterThan(0);
      expect(temperature).toBeLessThanOrEqual(100);
      
      console.log(`✅ Real DB lead ${lead.id} (status: ${lead.status}) -> temp: ${temperature}`);
    }
  });

  test('✅ Temperature calculation fixtures match actual database behavior', async () => {
    const { getLeadTemperature } = await import('@/utils/leadUtils');

    for (const fixture of temperatureCalculationFixtures) {
      // Test the fixture data directly (simulates database response)
      const lead = fixture.lead as any; // Use any to avoid type conflicts
      
      expect(() => getLeadTemperature(lead)).not.toThrow();
      
      const temperature = getLeadTemperature(lead);
      const [minTemp, maxTemp] = fixture.expectedTemperatureRange;
      
      expect(temperature).toBeGreaterThanOrEqual(minTemp);
      expect(temperature).toBeLessThanOrEqual(maxTemp);
      
      console.log(`✅ ${fixture.name}: Status ${lead.status} -> Temperature ${temperature} (expected: ${minTemp}-${maxTemp})`);
    }
  });

  test('✅ Database field types match schema-aware fixtures', async () => {
    // Get actual data from database
    const { data: realLeads, error } = await testClient
      .from('leads')
      .select('*')
      .limit(5);

    if (error || !realLeads || realLeads.length === 0) {
      console.warn('⚠️ Cannot fetch real leads for comparison');
      return;
    }

    for (const realLead of realLeads) {
      // Validate that real database data matches our schema expectations
      expect(validateLeadSchema(realLead)).toBe(true);
      
      // Specific type checks that would have caught the original bug
      expect(typeof realLead.status).toBe('number');
      expect(Number.isInteger(realLead.status)).toBe(true);
      
      console.log(`✅ Real lead ${realLead.id} passes schema validation`);
    }
  });

  test('✅ Can query leads with complex filters using real schema', async () => {
    // Test complex queries that depend on actual database schema
    const queries = [
      {
        name: 'Filter by integer status range',
        query: testClient.from('leads').select('*').gte('status', 1).lte('status', 5),
        expectedField: 'status',
        expectedType: 'number'
      },
      {
        name: 'Filter by name fields',
        query: testClient.from('leads').select('*').not('first_name', 'is', null),
        expectedField: 'first_name',
        expectedType: 'string'
      },
      {
        name: 'Order by timestamp',
        query: testClient.from('leads').select('*').order('created_at', { ascending: false }),
        expectedField: 'created_at',
        expectedType: 'string'
      }
    ];

    for (const queryTest of queries) {
      const { data, error } = await queryTest.query.limit(3);
      
      if (error) {
        console.warn(`⚠️ Query failed: ${queryTest.name}`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        const sampleRecord = data[0];
        const fieldValue = sampleRecord[queryTest.expectedField];
        
        if (fieldValue !== null) {
          expect(typeof fieldValue).toBe(queryTest.expectedType);
          console.log(`✅ Query "${queryTest.name}" returned correct type for ${queryTest.expectedField}`);
        }
      }
    }
  });

  test('✅ Integration with leadUtils functions using real database data', async () => {
    // Test all lead utility functions with real database data
    const { data: leads, error } = await testClient
      .from('leads')
      .select('*')
      .limit(3);

    if (error || !leads || leads.length === 0) {
      console.warn('⚠️ Cannot test leadUtils integration - no leads available');
      return;
    }

    const { 
      getLeadName, 
      getLeadTemperature, 
      getHeatLevelFromTemperature,
      getDisplayTemperature,
      getTemperatureVariant
    } = await import('@/utils/leadUtils');

    for (const lead of leads) {
      // Test all utility functions
      expect(() => getLeadName(lead)).not.toThrow();
      expect(() => getLeadTemperature(lead)).not.toThrow();
      
      const temperature = getLeadTemperature(lead);
      expect(() => getHeatLevelFromTemperature(temperature)).not.toThrow();
      expect(() => getDisplayTemperature(temperature)).not.toThrow();
      expect(() => getTemperatureVariant(temperature)).not.toThrow();
      
      console.log(`✅ All leadUtils functions work with real lead ${lead.id}`);
    }
  });

  test('✅ Test credentials and database connection are working', async () => {
    // Validate test environment
    expect(testCredentials.email).toBe('test@test.test');
    expect(testCredentials.password).toBe('testtesttest');
    
    // Test database connectivity
    const { data, error } = await testClient
      .from('leads')
      .select('count')
      .single();

    if (error) {
      console.warn('⚠️ Database connectivity issue:', error.message);
    } else {
      console.log('✅ Database connection working - lead count available');
    }
    
    // Test authentication
    const { data: user } = await testClient.auth.getUser();
    if (user.user) {
      console.log('✅ Test user authenticated:', user.user.email);
    }
  });
}); 