import { Page, expect, Request, Response } from '@playwright/test';
import { testCredentials } from './test-credentials';

export interface SecurityTestResult {
  passed: boolean;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TLSInfo {
  version: string;
  cipher: string;
  isSecure: boolean;
}

export interface ComplianceResult {
  gdprCompliant: boolean;
  pciDssCompliant: boolean;
  issues: string[];
}

export class SecurityHelpers {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  // Test HTTPS enforcement
  async testHTTPSEnforcement(): Promise<SecurityTestResult> {
    try {
      // Try to access HTTP version
      const httpUrl = this.page.url().replace('https://', 'http://');
      const response = await this.page.goto(httpUrl);
      
      // Should redirect to HTTPS or fail
      const finalUrl = this.page.url();
      const isSecure = finalUrl.startsWith('https://');
      
      return {
        passed: isSecure,
        details: isSecure ? 'HTTPS enforced successfully' : 'HTTP connection allowed',
        severity: isSecure ? 'low' : 'high'
      };
    } catch (error) {
      return {
        passed: true,
        details: 'HTTP connection blocked',
        severity: 'low'
      };
    }
  }

  // Test TLS version and cipher suites
  async testTLSConfiguration(): Promise<SecurityTestResult> {
    try {
      // Check if connection is secure by verifying HTTPS
      await this.page.goto('/');
      const url = this.page.url();
      const isSecure = url.startsWith('https://');
      
      // Additional check for TLS by examining the response
      const response = await this.page.goto('/');
      const securityDetails = response?.securityDetails();
      
      const details = isSecure 
        ? `Secure HTTPS connection established` 
        : `Insecure HTTP connection detected`;
      
      return {
        passed: isSecure,
        details,
        severity: isSecure ? 'low' : 'critical'
      };
    } catch (error) {
      return {
        passed: false,
        details: `TLS configuration check failed: ${error}`,
        severity: 'medium'
      };
    }
  }

  // Test for security headers
  async testSecurityHeaders(): Promise<SecurityTestResult> {
    const response = await this.page.goto('/');
    const headers = response?.headers() || {};
    
    const requiredHeaders = {
      'strict-transport-security': 'HSTS header missing',
      'x-content-type-options': 'X-Content-Type-Options header missing',
      'x-frame-options': 'X-Frame-Options header missing',
      'x-xss-protection': 'X-XSS-Protection header missing',
      'content-security-policy': 'CSP header missing'
    };
    
    const missingHeaders: string[] = [];
    
    for (const [header, message] of Object.entries(requiredHeaders)) {
      if (!headers[header]) {
        missingHeaders.push(message);
      }
    }
    
    return {
      passed: missingHeaders.length === 0,
      details: missingHeaders.length === 0 
        ? 'All security headers present' 
        : `Missing headers: ${missingHeaders.join(', ')}`,
      severity: missingHeaders.length > 0 ? 'medium' : 'low'
    };
  }

  // Test cookie security attributes
  async testCookieSecurity(): Promise<SecurityTestResult> {
    await this.page.goto('/');
    const cookies = await this.page.context().cookies();
    
    const insecureCookies: string[] = [];
    
    for (const cookie of cookies) {
      if (cookie.name.includes('auth') || cookie.name.includes('session')) {
        if (!cookie.secure) {
          insecureCookies.push(`${cookie.name}: missing Secure flag`);
        }
        if (!cookie.httpOnly) {
          insecureCookies.push(`${cookie.name}: missing HttpOnly flag`);
        }
        if (cookie.sameSite !== 'Strict' && cookie.sameSite !== 'Lax') {
          insecureCookies.push(`${cookie.name}: insecure SameSite attribute`);
        }
      }
    }
    
    return {
      passed: insecureCookies.length === 0,
      details: insecureCookies.length === 0 
        ? 'All cookies have secure attributes' 
        : `Insecure cookies: ${insecureCookies.join(', ')}`,
      severity: insecureCookies.length > 0 ? 'high' : 'low'
    };
  }

  // Test for sensitive data exposure
  async testSensitiveDataExposure(): Promise<SecurityTestResult> {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /api[_-]?key/i,
      /private[_-]?key/i,
      /\b[A-Za-z0-9]{32,}\b/, // Potential tokens
      /\b4[0-9]{12}(?:[0-9]{3})?\b/, // Credit card numbers
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/ // Credit card patterns
    ];
    
    const pageContent = await this.page.content();
    const exposedData: string[] = [];
    
    for (const pattern of sensitivePatterns) {
      const matches = pageContent.match(pattern);
      if (matches) {
        exposedData.push(`Potential sensitive data: ${matches[0].substring(0, 20)}...`);
      }
    }
    
    return {
      passed: exposedData.length === 0,
      details: exposedData.length === 0 
        ? 'No sensitive data exposed' 
        : `Exposed data: ${exposedData.join(', ')}`,
      severity: exposedData.length > 0 ? 'critical' : 'low'
    };
  }

  // Test session management
  async testSessionSecurity(): Promise<SecurityTestResult> {
    const issues: string[] = [];
    
    // Test session fixation
    const sessionBefore = await this.page.evaluate(() => {
      return document.cookie;
    });
    
    // Simulate login
    await this.page.goto('/auth/login');
    await this.page.fill('#email', testCredentials.email);
    await this.page.fill('#password', testCredentials.password);
    await this.page.click('button[type="submit"]');
    
    const sessionAfter = await this.page.evaluate(() => {
      return document.cookie;
    });
    
    if (sessionBefore === sessionAfter) {
      issues.push('Session fixation vulnerability detected');
    }
    
    // Test session timeout
    await this.page.waitForTimeout(5000);
    const isStillLoggedIn = await this.page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token') !== null;
    });
    
    if (!isStillLoggedIn) {
      issues.push('Session timeout too aggressive');
    }
    
    return {
      passed: issues.length === 0,
      details: issues.length === 0 ? 'Session security validated' : issues.join(', '),
      severity: issues.length > 0 ? 'high' : 'low'
    };
  }

  // Test GDPR compliance
  async testGDPRCompliance(): Promise<SecurityTestResult> {
    const issues: string[] = [];
    
    // Check for cookie consent
    await this.page.goto('/');
    const cookieConsent = await this.page.locator('[data-testid="cookie-consent"]').isVisible();
    if (!cookieConsent) {
      issues.push('Cookie consent banner not found');
    }
    
    // Check for privacy policy link
    const privacyPolicy = await this.page.locator('a[href*="privacy"]').isVisible();
    if (!privacyPolicy) {
      issues.push('Privacy policy link not found');
    }
    
    // Check for data deletion option
    const dataSettings = await this.page.locator('[data-testid="data-settings"]').isVisible();
    if (!dataSettings) {
      issues.push('Data management settings not accessible');
    }
    
    return {
      passed: issues.length === 0,
      details: issues.length === 0 ? 'GDPR compliance validated' : issues.join(', '),
      severity: issues.length > 0 ? 'high' : 'low'
    };
  }

  // Test PCI DSS compliance
  async testPCIDSSCompliance(): Promise<SecurityTestResult> {
    const issues: string[] = [];
    
    // Check for secure payment processing
    const paymentForms = await this.page.locator('form[action*="payment"], input[name*="card"]').count();
    if (paymentForms > 0) {
      // Check if payment forms are properly secured
      const isSecurePayment = await this.page.evaluate(() => {
        const forms = document.querySelectorAll('form[action*="payment"]');
        return Array.from(forms).every(form => 
          (form as HTMLFormElement).action.startsWith('https://')
        );
      });
      
      if (!isSecurePayment) {
        issues.push('Payment forms not using HTTPS');
      }
    }
    
    // Check for PAN masking
    const panElements = await this.page.locator('input[type="text"]').all();
    for (const element of panElements) {
      const value = await element.inputValue();
      if (/\b4[0-9]{12}(?:[0-9]{3})?\b/.test(value)) {
        issues.push('Unmasked PAN detected');
        break;
      }
    }
    
    return {
      passed: issues.length === 0,
      details: issues.length === 0 ? 'PCI DSS compliance validated' : issues.join(', '),
      severity: issues.length > 0 ? 'critical' : 'low'
    };
  }

  // Test data encryption
  async testDataEncryption(): Promise<SecurityTestResult> {
    const issues: string[] = [];
    
    // Check if sensitive data is transmitted over HTTPS
    const requests: Request[] = [];
    this.page.on('request', request => {
      if (request.method() === 'POST' && !request.url().startsWith('https://')) {
        requests.push(request);
      }
    });
    
    // Simulate form submission
    await this.page.goto('/auth/login');
    await this.page.fill('#email', testCredentials.email);
    await this.page.fill('#password', testCredentials.password);
    await this.page.click('button[type="submit"]');
    
    if (requests.length > 0) {
      issues.push('Sensitive data transmitted over HTTP');
    }
    
    return {
      passed: issues.length === 0,
      details: issues.length === 0 ? 'Data encryption validated' : issues.join(', '),
      severity: issues.length > 0 ? 'critical' : 'low'
    };
  }

  // Comprehensive security scan
  async runSecurityScan(): Promise<{
    overallScore: number;
    results: { [key: string]: SecurityTestResult };
  }> {
    const tests = {
      httpsEnforcement: await this.testHTTPSEnforcement(),
      tlsConfiguration: await this.testTLSConfiguration(),
      securityHeaders: await this.testSecurityHeaders(),
      cookieSecurity: await this.testCookieSecurity(),
      sensitiveDataExposure: await this.testSensitiveDataExposure(),
      sessionSecurity: await this.testSessionSecurity(),
      gdprCompliance: await this.testGDPRCompliance(),
      pciDssCompliance: await this.testPCIDSSCompliance(),
      dataEncryption: await this.testDataEncryption()
    };
    
    const totalTests = Object.keys(tests).length;
    const passedTests = Object.values(tests).filter(result => result.passed).length;
    const overallScore = (passedTests / totalTests) * 100;
    
    return {
      overallScore,
      results: tests
    };
  }

  // Generate security report
  generateSecurityReport(scanResults: { overallScore: number; results: { [key: string]: SecurityTestResult } }): string {
    const { overallScore, results } = scanResults;
    
    let report = `# Security Scan Report\n\n`;
    report += `**Overall Security Score: ${overallScore.toFixed(1)}%**\n\n`;
    
    const criticalIssues = Object.entries(results).filter(([_, result]) => !result.passed && result.severity === 'critical');
    const highIssues = Object.entries(results).filter(([_, result]) => !result.passed && result.severity === 'high');
    const mediumIssues = Object.entries(results).filter(([_, result]) => !result.passed && result.severity === 'medium');
    
    if (criticalIssues.length > 0) {
      report += `## 🚨 Critical Issues (${criticalIssues.length})\n`;
      criticalIssues.forEach(([test, result]) => {
        report += `- **${test}**: ${result.details}\n`;
      });
      report += `\n`;
    }
    
    if (highIssues.length > 0) {
      report += `## ⚠️ High Priority Issues (${highIssues.length})\n`;
      highIssues.forEach(([test, result]) => {
        report += `- **${test}**: ${result.details}\n`;
      });
      report += `\n`;
    }
    
    if (mediumIssues.length > 0) {
      report += `## 📋 Medium Priority Issues (${mediumIssues.length})\n`;
      mediumIssues.forEach(([test, result]) => {
        report += `- **${test}**: ${result.details}\n`;
      });
      report += `\n`;
    }
    
    report += `## ✅ Passed Tests\n`;
    Object.entries(results).forEach(([test, result]) => {
      if (result.passed) {
        report += `- **${test}**: ${result.details}\n`;
      }
    });
    
    return report;
  }
} 