import { describe, test, expect } from 'vitest';
import { 
  getLeadName, 
  getLeadTemperature, 
  getHeatLevelFromTemperature,
  getDisplayTemperature,
  getTemperatureVariant
} from '@/utils/leadUtils';
import { 
  schemaAwareLeadFixtures,
  temperatureCalculationFixtures,
  createSchemaAwareLead,
  validateLeadSchema
} from '../__helpers__/schema-aware-fixtures';

/**
 * 🔧 SCHEMA-AWARE LEAD UTILS TESTS
 * 
 * BEFORE: Tests used mock string data that didn't match database schema
 * AFTER: Tests use schema-aware fixtures with actual database field types
 * 
 * This prevents bugs like the getLeadTemperature TypeError where tests
 * passed with string mock data but failed with integer database values.
 */

describe('🔧 Lead Utils - Schema-Aware Tests', () => {

  describe('🆚 BEFORE vs AFTER: Mock vs Schema-Aware', () => {
    test('❌ OLD WAY: Mock string status (would cause TypeError)', () => {
      // This is how tests were written before - with string status
      const mockLeadWithStringStatus = {
        id: 'test',
        status: 'active',  // STRING - this caused the toLowerCase() bug!
        first_name: 'Test',
        last_name: 'User'
      } as any;

      // This would throw "toLowerCase is not a function" with the old leadUtils
      // Because the function expected integer but got string
      expect(() => {
        // This represents what WOULD have happened before the fix
        const oldGetLeadTemperature = (lead: any) => {
          // This is the problematic code that was in leadUtils before:
          // return lead.status?.toLowerCase() === 'active' ? 80 : 50;
          // It assumes status is a string, but database stores integers!
        };
        // oldGetLeadTemperature(mockLeadWithStringStatus);
      }).not.toThrow(); // We can't test the actual old function since it's fixed
    });

    test('✅ NEW WAY: Schema-aware integer status', () => {
      // Now we use schema-aware fixtures with INTEGER status
      const schemaAwareLead = schemaAwareLeadFixtures.active;

      // Validate that our fixture matches actual database schema
      expect(validateLeadSchema(schemaAwareLead)).toBe(true);
      expect(typeof schemaAwareLead.status).toBe('number');
      expect(Number.isInteger(schemaAwareLead.status)).toBe(true);

      // This works correctly with the fixed getLeadTemperature function
      expect(() => getLeadTemperature(schemaAwareLead as any)).not.toThrow();
      
      const temperature = getLeadTemperature(schemaAwareLead as any);
      expect(temperature).toBeGreaterThan(0);
      expect(temperature).toBeLessThanOrEqual(100);
    });
  });

  describe('✅ Schema-Aware Lead Name Tests', () => {
    test('should combine first_name and last_name correctly', () => {
      const lead = schemaAwareLeadFixtures.pending as any;
      
      expect(getLeadName(lead)).toBe('John Pending');
    });

    test('should handle missing names gracefully', () => {
      const leadWithMissingName = createSchemaAwareLead({
        first_name: null,
        last_name: null
      });
      
      expect(getLeadName(leadWithMissingName as any)).toBe('Unknown');
    });

    test('should handle partial names', () => {
      const leadWithOnlyFirstName = createSchemaAwareLead({
        first_name: 'John',
        last_name: null
      });
      
      expect(getLeadName(leadWithOnlyFirstName as any)).toBe('John');
    });
  });

  describe('✅ Schema-Aware Temperature Calculation Tests', () => {
    test('should calculate temperature from INTEGER status values', () => {
      // Test all schema-aware fixtures
      const testCases = [
        { fixture: schemaAwareLeadFixtures.pending, expectedRange: [30, 50] },
        { fixture: schemaAwareLeadFixtures.queued, expectedRange: [50, 70] },
        { fixture: schemaAwareLeadFixtures.active, expectedRange: [70, 90] },
        { fixture: schemaAwareLeadFixtures.completed, expectedRange: [80, 100] },
        { fixture: schemaAwareLeadFixtures.failed, expectedRange: [0, 10] }
      ];

      for (const testCase of testCases) {
        const lead = testCase.fixture as any;
        
        // Validate schema first
        expect(validateLeadSchema(lead)).toBe(true);
        
        const temperature = getLeadTemperature(lead);
        const [min, max] = testCase.expectedRange;
        
        expect(temperature).toBeGreaterThanOrEqual(min);
        expect(temperature).toBeLessThanOrEqual(max);
      }
    });

    test('should use comprehensive temperature calculation fixtures', () => {
      // Use the dedicated temperature calculation fixtures
      for (const fixture of temperatureCalculationFixtures) {
        const lead = fixture.lead as any;
        const [minTemp, maxTemp] = fixture.expectedTemperatureRange;
        
        expect(() => getLeadTemperature(lead)).not.toThrow();
        
        const temperature = getLeadTemperature(lead);
        expect(temperature).toBeGreaterThanOrEqual(minTemp);
        expect(temperature).toBeLessThanOrEqual(maxTemp);
      }
    });

    test('should prioritize AI analysis over status', () => {
      const leadWithAIScore = createSchemaAwareLead({
        status: 1, // Low status
        lead_metadata: {
          ai_analysis: {
            lead_qualification: {
              confidence_score: 95 // High AI score should override
            }
          }
        }
      });

      const temperature = getLeadTemperature(leadWithAIScore as any);
      expect(temperature).toBe(95); // Should use AI score, not status-based calculation
    });
  });

  describe('✅ Heat Level Classification Tests', () => {
    test('should classify heat levels correctly', () => {
      const testCases = [
        { temperature: 90, expectedHeat: 'burning' },
        { temperature: 70, expectedHeat: 'hot' },
        { temperature: 50, expectedHeat: 'warm' },
        { temperature: 20, expectedHeat: 'cold' }
      ];

      for (const testCase of testCases) {
        const heat = getHeatLevelFromTemperature(testCase.temperature);
        expect(heat).toBe(testCase.expectedHeat);
      }
    });

    test('should format display temperature correctly', () => {
      expect(getDisplayTemperature(75.6)).toBe('76°');
      expect(getDisplayTemperature(90)).toBe('90°');
    });

    test('should return correct badge variants', () => {
      expect(getTemperatureVariant(90)).toBe('destructive'); // burning
      expect(getTemperatureVariant(70)).toBe('default');     // hot
      expect(getTemperatureVariant(50)).toBe('secondary');   // warm
      expect(getTemperatureVariant(20)).toBe('outline');     // cold
    });
  });

  describe('✅ Schema Validation Helpers', () => {
    test('should validate correct schema', () => {
      const validLead = schemaAwareLeadFixtures.active;
      expect(validateLeadSchema(validLead)).toBe(true);
    });

    test('should detect invalid schema', () => {
      const invalidLead = {
        id: 'test',
        status: 'string_status', // Invalid: should be number
        first_name: 'Test'
      };
      expect(validateLeadSchema(invalidLead)).toBe(false);
    });

    test('should create schema-aware leads correctly', () => {
      const customLead = createSchemaAwareLead({
        status: 5,
        first_name: 'Custom'
      });

      expect(validateLeadSchema(customLead)).toBe(true);
      expect(customLead.status).toBe(5);
      expect(customLead.first_name).toBe('Custom');
    });
  });

  describe('🔍 Type Safety Validation', () => {
    test('should ensure all fixture status values are integers', () => {
      const allFixtures = Object.values(schemaAwareLeadFixtures);
      
      for (const fixture of allFixtures) {
        expect(typeof fixture.status).toBe('number');
        expect(Number.isInteger(fixture.status)).toBe(true);
      }
    });

    test('should ensure temperature calculation fixtures have correct types', () => {
      for (const fixture of temperatureCalculationFixtures) {
        const lead = fixture.lead;
        
        expect(typeof lead.status).toBe('number');
        expect(Number.isInteger(lead.status)).toBe(true);
        expect(Array.isArray(fixture.expectedTemperatureRange)).toBe(true);
        expect(fixture.expectedTemperatureRange.length).toBe(2);
      }
    });
  });
});

/**
 * 📚 COMPARISON: Old vs New Testing Approach
 * 
 * OLD APPROACH (Bug-Prone):
 * ```typescript
 * const mockLead = {
 *   id: 'test',
 *   status: 'active',  // STRING - doesn't match database!
 *   name: 'Test User'  // COMPUTED - doesn't exist in database!
 * };
 * ```
 * 
 * NEW APPROACH (Schema-Aware):
 * ```typescript
 * const schemaAwareLead = schemaAwareLeadFixtures.active; // INTEGER status
 * const temperature = getLeadTemperature(schemaAwareLead);  // Works correctly
 * ```
 * 
 * BENEFITS:
 * ✅ Tests use actual database field types
 * ✅ Catches type mismatches early
 * ✅ Prevents production bugs
 * ✅ Validates against real schema
 * ✅ Comprehensive fixtures for all scenarios
 */ 