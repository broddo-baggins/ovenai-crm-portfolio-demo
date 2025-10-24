import { test, expect, describe, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Regression Test Suite: Notification System Infrastructure
 * 
 * Purpose: Prevent regression of notification automation infrastructure
 * Context: Ensures notification service, database schema, and integration points remain intact
 * Key Components Tested:
 * - NotificationService infrastructure
 * - Database schema files
 * - Component integration points
 * - Critical dependencies
 */

describe('🔔 Notification System Infrastructure Regression', () => {
  let packageJson: any;
  let srcFiles: string[] = [];

  beforeAll(() => {
    const packagePath = join(process.cwd(), 'package.json');
    const packageContent = readFileSync(packagePath, 'utf-8');
    packageJson = JSON.parse(packageContent);
  });

  test('should have notification service infrastructure', () => {
    console.log('🔧 Checking notification service infrastructure...');
    
    // Critical notification files must exist
    const criticalFiles = [
      'src/services/notificationService.ts',
      'src/components/notifications/NotificationsList.tsx',
      'src/components/notifications/NotificationCenter.tsx'
    ];
    
    const missingFiles: string[] = [];
    criticalFiles.forEach(filePath => {
      if (!existsSync(filePath)) {
        missingFiles.push(filePath);
      }
    });
    
    expect(missingFiles).toEqual([]);
    console.log('✅ All critical notification files exist');
  });

  test('should have notification service properly exported', () => {
    console.log('📦 Checking notification service exports...');
    
    const servicePath = 'src/services/notificationService.ts';
    if (existsSync(servicePath)) {
      const serviceContent = readFileSync(servicePath, 'utf-8');
      
      // Check for essential notification service functions
      const requiredExports = [
        'notifyLeadEvent',
        'subscribeToNotifications',
        'markAsRead'
      ];
      
      const missingExports = requiredExports.filter(exportName => 
        !serviceContent.includes(exportName)
      );
      
      expect(missingExports).toEqual([]);
      console.log('✅ NotificationService has required exports');
    } else {
      throw new Error('NotificationService file missing');
    }
  });

  test('should have database notification schema', () => {
    console.log('🗄️ Checking notification database schema...');
    
    // Check for notification schema in multiple possible locations
    const schemaPaths = [
      'supabase/sql/setup/create-notifications-table.sql',
      'supabase/migrations/20250123_create_notifications_table.sql'
    ];
    
    let schemaFound = false;
    for (const schemaPath of schemaPaths) {
      if (existsSync(schemaPath)) {
        const schemaContent = readFileSync(schemaPath, 'utf-8');
        
        // Check for critical database structures
        const requiredTables = [
          'public.notifications',
          'user_id',
          'created_at',
          'read'
        ];
        
        const missingTables = requiredTables.filter(table => 
          !schemaContent.includes(table)
        );
        
        if (missingTables.length === 0) {
          schemaFound = true;
          console.log(`✅ Notification database schema found at: ${schemaPath}`);
          break;
        }
      }
    }
    
    expect(schemaFound).toBe(true);
    console.log('✅ Notification database schema is complete');
  });

  test('should have notification components properly integrated', () => {
    console.log('🧩 Checking notification component integration...');
    
    // Check critical integration files and notification service usage
    const integrationChecks = [
      {
        file: 'src/services/notificationService.ts',
        expectedContent: ['notifyLeadEvent', 'subscribeToNotifications', 'createNotification']
      },
      {
        file: 'src/components/notifications/NotificationCenter.tsx',
        expectedContent: ['notificationService', 'Notification']
      },
      {
        file: 'src/components/notifications/NotificationsList.tsx',
        expectedContent: ['notificationService', 'useAuth']
      }
    ];
    
    integrationChecks.forEach(({ file, expectedContent }) => {
      if (existsSync(file)) {
        const fileContent = readFileSync(file, 'utf-8');
        
        const hasRequiredContent = expectedContent.some(content => 
          fileContent.includes(content)
        );
        
        expect(hasRequiredContent).toBe(true);
        console.log(`✅ ${file} has notification integration`);
      } else {
        console.warn(`⚠️  ${file} not found`);
      }
    });
  });

  test('should have required notification dependencies', () => {
    console.log('📋 Checking notification system dependencies...');
    
    // Critical dependencies for notification system
    const requiredDeps = [
      '@supabase/supabase-js', // For real-time subscriptions
      'react',                 // For notification components
      'typescript'             // For type safety
    ];
    
    const allDeps = { 
      ...packageJson.dependencies, 
      ...packageJson.devDependencies 
    };
    
    const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);
    
    expect(missingDeps).toEqual([]);
    console.log('✅ All required notification dependencies present');
  });

  test('should prevent notification service breaking changes', () => {
    console.log('🛡️ Checking for breaking changes in notification service...');
    
    const servicePath = 'src/services/notificationService.ts';
    if (existsSync(servicePath)) {
      const serviceContent = readFileSync(servicePath, 'utf-8');
      
      // Prevent breaking changes to critical functions
      const criticalInterfaces = [
        'notifyLeadEvent',
        'subscribeToNotifications',
        'markAsRead',
        'createNotification'
      ];
      
      const missingInterfaces = criticalInterfaces.filter(func => 
        !serviceContent.includes(func)
      );
      
      if (missingInterfaces.length > 0) {
        console.error(`❌ BREAKING CHANGE DETECTED: Missing functions: ${missingInterfaces.join(', ')}`);
      }
      
      expect(missingInterfaces).toEqual([]);
      console.log('✅ No breaking changes detected in notification service');
    }
  });

  test('should maintain notification type safety', () => {
    console.log('🔒 Checking notification type definitions...');
    
    // Check for notification types
    const typesPath = 'src/types';
    if (existsSync(typesPath)) {
      const typesFiles = [
        'src/types/notification.ts',
        'src/types/index.ts'
      ];
      
      let hasNotificationTypes = false;
      
      typesFiles.forEach(filePath => {
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          if (content.includes('Notification') || content.includes('notification')) {
            hasNotificationTypes = true;
          }
        }
      });
      
      expect(hasNotificationTypes).toBe(true);
      console.log('✅ Notification type definitions found');
    }
  });

  test('should have notification page routing', () => {
    console.log('🔗 Checking notification page routing...');
    
    // Check for notification page
    const notificationPagePath = 'src/pages/Notifications.tsx';
    const appPath = 'src/App.tsx';
    
    const hasNotificationPage = existsSync(notificationPagePath);
    
    if (existsSync(appPath)) {
      const appContent = readFileSync(appPath, 'utf-8');
      const hasNotificationRoute = 
        appContent.includes('/notifications') ||
        appContent.includes('Notifications');
      
      expect(hasNotificationRoute || hasNotificationPage).toBe(true);
      console.log('✅ Notification routing is configured');
    } else {
      console.warn('⚠️  App.tsx not found, but notification page exists');
      expect(hasNotificationPage).toBe(true);
    }
  });

  test('should maintain notification system integration integrity', () => {
    console.log('🎯 Checking notification system integration integrity...');
    
    // Overall system integrity check
    const integrityChecks = {
      hasNotificationService: existsSync('src/services/notificationService.ts'),
      hasNotificationComponents: existsSync('src/components/notifications/NotificationsList.tsx') || existsSync('src/components/notifications/NotificationCenter.tsx'),
      hasNotificationTypes: existsSync('src/types/notification.ts') || existsSync('src/types/index.ts'),
      hasSupabaseIntegration: packageJson.dependencies?.['@supabase/supabase-js'] !== undefined
    };
    
    const failedChecks = Object.entries(integrityChecks)
      .filter(([_, passed]) => !passed)
      .map(([check, _]) => check);
    
    if (failedChecks.length > 0) {
      console.error(`❌ Integrity failures: ${failedChecks.join(', ')}`);
    }
    
    // At least 75% of integrity checks should pass
    const successRate = Object.values(integrityChecks).filter(Boolean).length / Object.keys(integrityChecks).length;
    expect(successRate).toBeGreaterThanOrEqual(0.75);
    
    console.log(`✅ Notification system integrity: ${Math.round(successRate * 100)}%`);
    
    // Final assertion
    expect(successRate).toBeGreaterThanOrEqual(0.75);
  });

}); 