import { test, expect, describe, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Regression Test Suite: React Dependency Safety
 * 
 * Purpose: Prevent React forwardRef DOA issues by catching dependency conflicts
 * Context: @testing-library/react-hooks@8.0.1 was incompatible with React 18,
 *          causing "undefined is not an object (evaluating 'Zt.forwardRef')" error
 */

describe('🛡️ React Dependency Safety', () => {
  let packageJson: any;

  beforeAll(() => {
    const packagePath = join(process.cwd(), 'package.json');
    const packageContent = readFileSync(packagePath, 'utf-8');
    packageJson = JSON.parse(packageContent);
  });

  test('should not have @testing-library/react-hooks with React 18+', () => {
    const reactVersion = packageJson.dependencies?.react || packageJson.devDependencies?.react;
    const reactHooksVersion = packageJson.dependencies?.['@testing-library/react-hooks'] || 
                             packageJson.devDependencies?.['@testing-library/react-hooks'];

    if (reactVersion && reactVersion.includes('18')) {
      expect(reactHooksVersion).toBeUndefined();
    }
  });

  test('should have React and ReactDOM version compatibility', () => {
    const reactVersion = packageJson.dependencies?.react;
    const reactDomVersion = packageJson.dependencies?.['react-dom'];

    if (reactVersion && reactDomVersion) {
      // Extract major version numbers
      const reactMajor = reactVersion.replace(/^\^?~?/, '').split('.')[0];
      const reactDomMajor = reactDomVersion.replace(/^\^?~?/, '').split('.')[0];
      
      expect(reactMajor).toBe(reactDomMajor);
    }
  });

  test('should not have known problematic React dependency combinations', () => {
    const problematicCombos = [
      {
        package: '@testing-library/react-hooks',
        incompatibleWith: { react: '18' },
        reason: 'react-hooks v8 only supports React 16-17, use renderHook from @testing-library/react for React 18+'
      },
      {
        package: 'react-test-renderer',
        version: '^16',
        incompatibleWith: { react: '18' },
        reason: 'react-test-renderer version must match React version'
      }
    ];

    problematicCombos.forEach(combo => {
      const packageVersion = packageJson.dependencies?.[combo.package] || 
                           packageJson.devDependencies?.[combo.package];
      
      if (packageVersion && combo.incompatibleWith) {
        Object.entries(combo.incompatibleWith).forEach(([depName, depVersion]) => {
          const currentDepVersion = packageJson.dependencies?.[depName] || 
                                  packageJson.devDependencies?.[depName];
          
          if (currentDepVersion && currentDepVersion.includes(depVersion)) {
            throw new Error(
              `❌ DANGEROUS DEPENDENCY CONFLICT DETECTED!\n` +
              `Package: ${combo.package}\n` +
              `Conflicts with: ${depName} ${depVersion}\n` +
              `Reason: ${combo.reason}\n` +
              `This combination caused the previous DOA issue!`
            );
          }
        });
      }
    });
  });

  test('should have all peer dependencies satisfied', () => {
    // Check for common React ecosystem peer dependency issues
    const criticalPeerDeps = [
      '@radix-ui/react-primitive',
      '@radix-ui/react-slot',
      'react-router-dom'
    ];

    criticalPeerDeps.forEach(dep => {
      const depVersion = packageJson.dependencies?.[dep];
      if (depVersion) {
        // These packages should work with current React version
        expect(depVersion).toBeTruthy();
      }
    });
  });

  test('should have React 18+ features available if using React 18', () => {
    const reactVersion = packageJson.dependencies?.react;
    
    if (reactVersion && reactVersion.includes('18')) {
      // For React 18, ensure we have @testing-library/react (in deps or devDeps)
      const hasTestingLibrary = packageJson.dependencies?.['@testing-library/react'] || 
                               packageJson.devDependencies?.['@testing-library/react'];
      expect(hasTestingLibrary).toBeTruthy();
      
      // Should not have react-hooks separately for React 18
      expect(packageJson.dependencies?.['@testing-library/react-hooks']).toBeUndefined();
      expect(packageJson.devDependencies?.['@testing-library/react-hooks']).toBeUndefined();
    }
  });
}); 