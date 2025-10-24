import { test, expect, Page } from '@playwright/test';
import { AuthHelper } from '../setup/test-auth-helper';

async function authenticateUser(page: Page) {
  const authHelper = new AuthHelper(page);
  await authHelper.login();
}

async function waitForPageLoad(page: Page, selector: string, timeout: number = 30000) {
  await page.waitForSelector(selector, { timeout });
  await page.waitForLoadState('networkidle');
}

test.describe('🎯 Leads - ALL User Data Scenarios', () => {
  
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test('should handle complete lead creation with all data fields', async ({ page }) => {
    await page.goto('/leads');
    await waitForPageLoad(page, '[data-testid="leads-page"], main');

    // Create new lead
    await page.click('[data-testid="create-lead-button"], button:has-text("Add Lead"), button:has-text("Create Lead")');
    await page.waitForSelector('[data-testid="lead-form"], [data-testid="create-lead-dialog"]');

    // Fill basic information (email deprecated for leads - phone is primary identifier)
    await page.fill('[data-testid="lead-first-name"], input[name="first_name"]', 'John');
    await page.fill('[data-testid="lead-last-name"], input[name="last_name"]', 'Doe');
    await page.fill('[data-testid="lead-phone"], input[name="phone"]', '+1234567890');
    
    // Company information
    await page.fill('[data-testid="lead-company"], input[name="company"]', 'Acme Corporation');
    await page.fill('[data-testid="lead-position"], input[name="position"]', 'Chief Technology Officer');
    await page.fill('[data-testid="lead-website"], input[name="website"]', 'https://acme.com');
    
    // Lead qualification
    await page.selectOption('[data-testid="lead-status"], select[name="status"]', 'warm');
    await page.selectOption('[data-testid="lead-source"], select[name="source"]', 'website');
    await page.selectOption('[data-testid="lead-priority"], select[name="priority"]', 'high');
    
    // BANT qualification
    await page.selectOption('[data-testid="lead-budget"], select[name="budget"]', 'qualified');
    await page.selectOption('[data-testid="lead-authority"], select[name="authority"]', 'qualified');
    await page.selectOption('[data-testid="lead-need"], select[name="need"]', 'qualified');
    await page.selectOption('[data-testid="lead-timeline"], select[name="timeline"]', 'qualified');
    
    // Additional information
    await page.fill('[data-testid="lead-notes"], textarea[name="notes"]', 'Comprehensive test lead with all fields filled');
    await page.fill('[data-testid="lead-industry"], input[name="industry"]', 'Technology');
    await page.fill('[data-testid="lead-company-size"], input[name="company_size"]', '500-1000');
    await page.fill('[data-testid="lead-annual-revenue"], input[name="annual_revenue"]', '10000000');

    // Tags
    await page.fill('[data-testid="lead-tags"], input[name="tags"]', 'enterprise, technology, high-value');

    // Save lead
    await page.click('[data-testid="save-lead-button"], button:has-text("Save Lead"), button:has-text("Create")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('successfully');

    // Verify lead appears in table
    await page.waitForSelector('[data-testid="leads-table"], .leads-table');
    await expect(page.locator('[data-testid="leads-table"], .leads-table')).toContainText('John Doe');
    await expect(page.locator('[data-testid="leads-table"], .leads-table')).toContainText('Acme Corporation');
  });

  test('should handle lead bulk operations with all actions', async ({ page }) => {
    await page.goto('/leads');
    await waitForPageLoad(page, '[data-testid="leads-page"], main');

    // Select multiple leads
    const leadCheckboxes = page.locator('[data-testid="lead-checkbox"], input[type="checkbox"]');
    const count = await leadCheckboxes.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      await leadCheckboxes.nth(i).check();
    }

    // Bulk actions menu
    await page.click('[data-testid="bulk-actions-button"], button:has-text("Bulk Actions")');
    await page.waitForSelector('[data-testid="bulk-actions-menu"]');

    // Test bulk status update
    await page.click('[data-testid="bulk-update-status"], button:has-text("Update Status")');
    await page.selectOption('[data-testid="bulk-status-select"], select[name="status"]', 'hot');
    await page.click('[data-testid="confirm-bulk-update"], button:has-text("Update")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('updated successfully');

    // Test bulk tag assignment
    await page.click('[data-testid="bulk-actions-button"], button:has-text("Bulk Actions")');
    await page.click('[data-testid="bulk-assign-tags"], button:has-text("Assign Tags")');
    await page.fill('[data-testid="bulk-tags-input"], input[name="tags"]', 'bulk-test, updated');
    await page.click('[data-testid="confirm-bulk-tags"], button:has-text("Assign")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('tagged successfully');

    // Test bulk export
    await page.click('[data-testid="bulk-actions-button"], button:has-text("Bulk Actions")');
    await page.click('[data-testid="bulk-export-button"], button:has-text("Export Selected")');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-bulk-export"], button:has-text("Export")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('leads');

    // Test bulk delete
    await page.click('[data-testid="bulk-actions-button"], button:has-text("Bulk Actions")');
    await page.click('[data-testid="bulk-delete-button"], button:has-text("Delete Selected")');
    await page.click('[data-testid="confirm-bulk-delete"], button:has-text("Delete")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('deleted successfully');
  });

  test('should handle comprehensive lead filtering and searching', async ({ page }) => {
    await page.goto('/leads');
    await waitForPageLoad(page, '[data-testid="leads-page"], main');

    // Text search
    await page.fill('[data-testid="lead-search-input"], input[placeholder*="Search" i]', 'John');
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="leads-table"], .leads-table')).toContainText('John');

    // Status filter
    await page.selectOption('[data-testid="status-filter"], select[name="status_filter"]', 'warm');
    await page.waitForTimeout(1000);

    // Source filter
    await page.selectOption('[data-testid="source-filter"], select[name="source_filter"]', 'website');
    await page.waitForTimeout(1000);

    // Priority filter
    await page.selectOption('[data-testid="priority-filter"], select[name="priority_filter"]', 'high');
    await page.waitForTimeout(1000);

    // Date range filter
    await page.click('[data-testid="date-range-filter"], button:has-text("Date Range")');
    await page.click('[data-testid="last-30-days"], button:has-text("Last 30 Days")');
    await page.waitForTimeout(1000);

    // Advanced filters
    await page.click('[data-testid="advanced-filters"], button:has-text("Advanced Filters")');
    await page.fill('[data-testid="company-filter"], input[name="company_filter"]', 'Acme');
    await page.fill('[data-testid="industry-filter"], input[name="industry_filter"]', 'Technology');
    await page.selectOption('[data-testid="budget-filter"], select[name="budget_filter"]', 'qualified');
    await page.selectOption('[data-testid="authority-filter"], select[name="authority_filter"]', 'qualified');

    // Apply filters
    await page.click('[data-testid="apply-filters"], button:has-text("Apply Filters")');
    await page.waitForTimeout(1000);

    // Clear all filters
    await page.click('[data-testid="clear-filters-button"], button:has-text("Clear Filters")');
    await page.waitForTimeout(1000);

    // Save filter preset
    await page.click('[data-testid="save-filter-preset"], button:has-text("Save Filter")');
    await page.fill('[data-testid="filter-preset-name"], input[name="preset_name"]', 'High Priority Leads');
    await page.click('[data-testid="confirm-save-preset"], button:has-text("Save")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('saved successfully');
  });

  test('should handle CSV import with all data mapping', async ({ page }) => {
    await page.goto('/leads');
    await waitForPageLoad(page, '[data-testid="leads-page"], main');

    // Open import dialog
    await page.click('[data-testid="import-leads-button"], button:has-text("Import Leads")');
    await page.waitForSelector('[data-testid="import-dialog"], [data-testid="csv-import-dialog"]');

    // Upload CSV file
    const csvContent = `first_name,last_name,email,phone,company,position,status,source,priority,budget,authority,need,timeline,notes,industry,company_size,annual_revenue,tags
Jane,Smith,jane.smith@example.com,+1987654321,TechCorp,Marketing Director,hot,referral,high,qualified,qualified,qualified,qualified,Referred by John Doe,Technology,100-500,5000000,enterprise technology marketing
Bob,Johnson,bob.johnson@example.com,+1555000000,StartupXYZ,Founder,warm,linkedin,medium,not_qualified,qualified,qualified,not_qualified,Interested in our platform,Software,10-50,1000000,startup founder early-stage
Alice,Williams,alice.williams@example.com,+1444000000,BigCorp,VP Sales,cold,website,low,qualified,qualified,not_qualified,qualified,Downloaded whitepaper,Manufacturing,1000+,50000000,enterprise sales manufacturing`;

    const fileInput = page.locator('[data-testid="csv-file-input"], input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-leads.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Map CSV columns
    await page.waitForSelector('[data-testid="column-mapping"]');
    await page.selectOption('[data-testid="map-first-name"], select[name="map_first_name"]', 'first_name');
    await page.selectOption('[data-testid="map-last-name"], select[name="map_last_name"]', 'last_name');
    await page.selectOption('[data-testid="map-email"], select[name="map_email"]', 'email');
    await page.selectOption('[data-testid="map-phone"], select[name="map_phone"]', 'phone');
    await page.selectOption('[data-testid="map-company"], select[name="map_company"]', 'company');
    await page.selectOption('[data-testid="map-position"], select[name="map_position"]', 'position');
    await page.selectOption('[data-testid="map-status"], select[name="map_status"]', 'status');
    await page.selectOption('[data-testid="map-source"], select[name="map_source"]', 'source');
    await page.selectOption('[data-testid="map-priority"], select[name="map_priority"]', 'priority');
    await page.selectOption('[data-testid="map-budget"], select[name="map_budget"]', 'budget');
    await page.selectOption('[data-testid="map-authority"], select[name="map_authority"]', 'authority');
    await page.selectOption('[data-testid="map-need"], select[name="map_need"]', 'need');
    await page.selectOption('[data-testid="map-timeline"], select[name="map_timeline"]', 'timeline');
    await page.selectOption('[data-testid="map-notes"], select[name="map_notes"]', 'notes');
    await page.selectOption('[data-testid="map-industry"], select[name="map_industry"]', 'industry');
    await page.selectOption('[data-testid="map-company-size"], select[name="map_company_size"]', 'company_size');
    await page.selectOption('[data-testid="map-annual-revenue"], select[name="map_annual_revenue"]', 'annual_revenue');
    await page.selectOption('[data-testid="map-tags"], select[name="map_tags"]', 'tags');

    // Import options
    await page.check('[data-testid="skip-duplicates"], input[name="skip_duplicates"]');
    await page.check('[data-testid="update-existing"], input[name="update_existing"]');
    await page.check('[data-testid="validate-email"], input[name="validate_email"]');
    await page.check('[data-testid="validate-phone"], input[name="validate_phone"]');

    // Start import
    await page.click('[data-testid="start-import-button"], button:has-text("Start Import")');
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();

    // Wait for import completion
    await page.waitForSelector('[data-testid="import-complete"]', { timeout: 30000 });
    await expect(page.locator('[data-testid="import-complete"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-summary"]')).toContainText('imported successfully');

    // Verify imported leads
    await page.click('[data-testid="close-import-dialog"], button:has-text("Close")');
    await expect(page.locator('[data-testid="leads-table"], .leads-table')).toContainText('Jane Smith');
    await expect(page.locator('[data-testid="leads-table"], .leads-table')).toContainText('Bob Johnson');
    await expect(page.locator('[data-testid="leads-table"], .leads-table')).toContainText('Alice Williams');
  });

  test('should handle CSV export with all data fields', async ({ page }) => {
    await page.goto('/leads');
    await waitForPageLoad(page, '[data-testid="leads-page"], main');

    // Open export dialog
    await page.click('[data-testid="export-leads-button"], button:has-text("Export Leads")');
    await page.waitForSelector('[data-testid="export-dialog"], [data-testid="export-options"]');

    // Select export format
    await page.selectOption('[data-testid="export-format"], select[name="export_format"]', 'csv');

    // Select fields to export
    await page.check('[data-testid="export-basic-info"], input[name="export_basic_info"]');
    await page.check('[data-testid="export-company-info"], input[name="export_company_info"]');
    await page.check('[data-testid="export-contact-info"], input[name="export_contact_info"]');
    await page.check('[data-testid="export-qualification"], input[name="export_qualification"]');
    await page.check('[data-testid="export-bant"], input[name="export_bant"]');
    await page.check('[data-testid="export-notes"], input[name="export_notes"]');
    await page.check('[data-testid="export-metadata"], input[name="export_metadata"]');
    await page.check('[data-testid="export-tags"], input[name="export_tags"]');
    await page.check('[data-testid="export-timestamps"], input[name="export_timestamps"]');

    // Export options
    await page.check('[data-testid="include-headers"], input[name="include_headers"]');
    await page.selectOption('[data-testid="date-format"], select[name="date_format"]', 'yyyy-mm-dd');
    await page.selectOption('[data-testid="encoding"], select[name="encoding"]', 'utf-8');

    // Filter leads for export
    await page.selectOption('[data-testid="export-filter-status"], select[name="export_filter_status"]', 'all');
    await page.selectOption('[data-testid="export-filter-source"], select[name="export_filter_source"]', 'all');
    await page.selectOption('[data-testid="export-filter-priority"], select[name="export_filter_priority"]', 'all');

    // Start export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="start-export-button"], button:has-text("Export")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('leads');
    expect(download.suggestedFilename()).toContain('.csv');

    // Verify export completion
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-summary"]')).toContainText('exported successfully');
  });

  test('should handle lead relationship management', async ({ page }) => {
    await page.goto('/leads');
    await waitForPageLoad(page, '[data-testid="leads-page"], main');

    // Open lead details
    await page.click('[data-testid="lead-row"]:first-child, .lead-row:first-child');
    await page.waitForSelector('[data-testid="lead-details"], [data-testid="lead-detail-panel"]');

    // Add contact person
    await page.click('[data-testid="add-contact-button"], button:has-text("Add Contact")');
    await page.fill('[data-testid="contact-name"], input[name="contact_name"]', 'Secondary Contact');
    await page.fill('[data-testid="contact-email"], input[name="contact_email"]', 'secondary@example.com');
    await page.fill('[data-testid="contact-phone"], input[name="contact_phone"]', '+1555111111');
    await page.fill('[data-testid="contact-position"], input[name="contact_position"]', 'Assistant');
    await page.click('[data-testid="save-contact"], button:has-text("Save Contact")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('added successfully');

    // Add activity/interaction
    await page.click('[data-testid="add-activity-button"], button:has-text("Add Activity")');
    await page.selectOption('[data-testid="activity-type"], select[name="activity_type"]', 'call');
    await page.fill('[data-testid="activity-subject"], input[name="activity_subject"]', 'Follow-up call');
    await page.fill('[data-testid="activity-description"], textarea[name="activity_description"]', 'Discussed project requirements and timeline');
    await page.selectOption('[data-testid="activity-outcome"], select[name="activity_outcome"]', 'positive');
    await page.fill('[data-testid="activity-duration"], input[name="activity_duration"]', '30');
    await page.click('[data-testid="save-activity"], button:has-text("Save Activity")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('added successfully');

    // Schedule follow-up
    await page.click('[data-testid="schedule-followup-button"], button:has-text("Schedule Follow-up")');
    await page.fill('[data-testid="followup-date"], input[name="followup_date"]', '2024-12-31');
    await page.fill('[data-testid="followup-time"], input[name="followup_time"]', '14:00');
    await page.selectOption('[data-testid="followup-type"], select[name="followup_type"]', 'email');
    await page.fill('[data-testid="followup-notes"], textarea[name="followup_notes"]', 'Send project proposal');
    await page.click('[data-testid="save-followup"], button:has-text("Schedule")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('scheduled successfully');

    // Add lead to campaign
    await page.click('[data-testid="add-to-campaign-button"], button:has-text("Add to Campaign")');
    await page.selectOption('[data-testid="campaign-select"], select[name="campaign_id"]', 'email_nurture');
    await page.click('[data-testid="confirm-add-campaign"], button:has-text("Add")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('added to campaign');
  });

  test('should handle lead scoring and qualification', async ({ page }) => {
    await page.goto('/leads');
    await waitForPageLoad(page, '[data-testid="leads-page"], main');

    // Open lead details
    await page.click('[data-testid="lead-row"]:first-child, .lead-row:first-child');
    await page.waitForSelector('[data-testid="lead-details"], [data-testid="lead-detail-panel"]');

    // Update lead score
    await page.click('[data-testid="update-score-button"], button:has-text("Update Score")');
    await page.fill('[data-testid="lead-score"], input[name="lead_score"]', '85');
    await page.selectOption('[data-testid="score-reason"], select[name="score_reason"]', 'engagement');
    await page.fill('[data-testid="score-notes"], textarea[name="score_notes"]', 'High engagement with website content');
    await page.click('[data-testid="save-score"], button:has-text("Save Score")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('updated successfully');

    // Complete BANT qualification
    await page.click('[data-testid="bant-qualification-button"], button:has-text("BANT Qualification")');
    
    // Budget qualification
    await page.selectOption('[data-testid="bant-budget"], select[name="bant_budget"]', 'qualified');
    await page.fill('[data-testid="budget-amount"], input[name="budget_amount"]', '50000');
    await page.fill('[data-testid="budget-notes"], textarea[name="budget_notes"]', 'Confirmed budget availability');
    
    // Authority qualification
    await page.selectOption('[data-testid="bant-authority"], select[name="bant_authority"]', 'qualified');
    await page.fill('[data-testid="authority-level"], input[name="authority_level"]', 'Decision Maker');
    await page.fill('[data-testid="authority-notes"], textarea[name="authority_notes"]', 'CEO has final authority');
    
    // Need qualification
    await page.selectOption('[data-testid="bant-need"], select[name="bant_need"]', 'qualified');
    await page.fill('[data-testid="need-description"], textarea[name="need_description"]', 'Requires CRM solution for sales team');
    await page.selectOption('[data-testid="need-urgency"], select[name="need_urgency"]', 'high');
    
    // Timeline qualification
    await page.selectOption('[data-testid="bant-timeline"], select[name="bant_timeline"]', 'qualified');
    await page.fill('[data-testid="timeline-date"], input[name="timeline_date"]', '2024-03-31');
    await page.fill('[data-testid="timeline-notes"], textarea[name="timeline_notes"]', 'Planning to implement by Q1 2024');

    // Save BANT qualification
    await page.click('[data-testid="save-bant"], button:has-text("Save BANT")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('qualification saved');

    // Generate qualification report
    await page.click('[data-testid="generate-report-button"], button:has-text("Generate Report")');
    await expect(page.locator('[data-testid="qualification-report"]')).toBeVisible();
    await expect(page.locator('[data-testid="qualification-score"]')).toContainText('85');
    await expect(page.locator('[data-testid="bant-status"]')).toContainText('Qualified');
  });

  test('should handle lead lifecycle and progression', async ({ page }) => {
    await page.goto('/leads');
    await waitForPageLoad(page, '[data-testid="leads-page"], main');

    // Open lead details
    await page.click('[data-testid="lead-row"]:first-child, .lead-row:first-child');
    await page.waitForSelector('[data-testid="lead-details"], [data-testid="lead-detail-panel"]');

    // Progress lead through stages
    const stages = ['cold', 'warm', 'hot', 'qualified', 'opportunity', 'proposal', 'negotiation', 'closed_won'];
    
    for (const stage of stages) {
      await page.click('[data-testid="change-stage-button"], button:has-text("Change Stage")');
      await page.selectOption('[data-testid="new-stage"], select[name="new_stage"]', stage);
      await page.fill('[data-testid="stage-notes"], textarea[name="stage_notes"]', `Progressed to ${stage} stage`);
      await page.click('[data-testid="confirm-stage-change"], button:has-text("Update Stage")');
      await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('updated successfully');
      await page.waitForTimeout(1000);
    }

    // View lead timeline
    await page.click('[data-testid="view-timeline-button"], button:has-text("View Timeline")');
    await expect(page.locator('[data-testid="lead-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-events"]')).toContainText('cold');
    await expect(page.locator('[data-testid="timeline-events"]')).toContainText('closed_won');

    // Convert lead to opportunity
    await page.click('[data-testid="convert-to-opportunity-button"], button:has-text("Convert to Opportunity")');
    await page.fill('[data-testid="opportunity-name"], input[name="opportunity_name"]', 'CRM Implementation Project');
    await page.fill('[data-testid="opportunity-value"], input[name="opportunity_value"]', '50000');
    await page.selectOption('[data-testid="opportunity-stage"], select[name="opportunity_stage"]', 'proposal');
    await page.fill('[data-testid="opportunity-close-date"], input[name="close_date"]', '2024-06-30');
    await page.click('[data-testid="confirm-conversion"], button:has-text("Convert")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('converted successfully');
  });

  test('should handle lead analytics and reporting', async ({ page }) => {
    await page.goto('/leads');
    await waitForPageLoad(page, '[data-testid="leads-page"], main');

    // Open analytics panel
    await page.click('[data-testid="analytics-button"], button:has-text("Analytics")');
    await page.waitForSelector('[data-testid="analytics-panel"]');

    // Lead performance metrics
    await expect(page.locator('[data-testid="total-leads"]')).toBeVisible();
    await expect(page.locator('[data-testid="conversion-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="qualified-leads"]')).toBeVisible();

    // Lead source analysis
    await page.click('[data-testid="source-analysis-tab"]');
    await expect(page.locator('[data-testid="source-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="source-table"]')).toBeVisible();

    // Lead progression analysis
    await page.click('[data-testid="progression-analysis-tab"]');
    await expect(page.locator('[data-testid="progression-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="stage-duration"]')).toBeVisible();

    // Generate detailed report
    await page.click('[data-testid="generate-detailed-report"], button:has-text("Generate Report")');
    await page.selectOption('[data-testid="report-type"], select[name="report_type"]', 'comprehensive');
    await page.fill('[data-testid="report-start-date"], input[name="start_date"]', '2024-01-01');
    await page.fill('[data-testid="report-end-date"], input[name="end_date"]', '2024-12-31');
    await page.selectOption('[data-testid="report-format"], select[name="report_format"]', 'pdf');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="generate-report"], button:has-text("Generate")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('leads_report');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should handle mobile lead management', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto('/leads');
    await waitForPageLoad(page, '[data-testid="leads-page"], main');

    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-toggle"], .mobile-menu-toggle');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Test mobile lead creation
    await page.click('[data-testid="mobile-add-lead-button"], [data-testid="fab-add-lead"]');
    await page.fill('[data-testid="mobile-lead-name"], input[name="full_name"]', 'Mobile Test Lead');
    await page.fill('[data-testid="mobile-lead-phone"], input[name="phone"]', '+1555999999');
    await page.fill('[data-testid="mobile-lead-email"], input[name="email"]', 'mobile@test.com');
    await page.fill('[data-testid="mobile-lead-company"], input[name="company"]', 'Mobile Corp');
    await page.selectOption('[data-testid="mobile-lead-status"], select[name="status"]', 'warm');
    await page.click('[data-testid="save-mobile-lead"], button:has-text("Save")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('created successfully');

    // Test mobile lead list
    await expect(page.locator('[data-testid="mobile-lead-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-lead-card"]')).toContainText('Mobile Test Lead');

    // Test mobile lead details
    await page.click('[data-testid="mobile-lead-card"]:first-child');
    await expect(page.locator('[data-testid="mobile-lead-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-lead-actions"]')).toBeVisible();

    // Test mobile quick actions
    await page.click('[data-testid="mobile-quick-call"], button:has-text("Call")');
    await expect(page.locator('[data-testid="call-confirmation"]')).toBeVisible();
    
    await page.click('[data-testid="mobile-quick-email"], button:has-text("Email")');
    await expect(page.locator('[data-testid="email-composer"]')).toBeVisible();
    
    await page.click('[data-testid="mobile-quick-note"], button:has-text("Note")');
    await page.fill('[data-testid="quick-note-text"], textarea[name="note"]', 'Quick note from mobile');
    await page.click('[data-testid="save-quick-note"], button:has-text("Save")');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('added successfully');
  });
}); 