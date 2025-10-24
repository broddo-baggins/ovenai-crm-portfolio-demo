#!/usr/bin/env node

/**
 * Test Data Cleanup Script
 * 
 * This script removes test projects, clients, leads, and conversations
 * that are created during testing to prevent database bloat.
 * 
 * Usage:
 *   node scripts/maintenance/cleanup-test-projects.js [--dry-run] [--force]
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../..', '.env') });

class TestDataCleanup {
  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    );
    
    this.isDryRun = process.argv.includes('--dry-run');
    this.isForce = process.argv.includes('--force');
    
    this.stats = {
      clients: 0,
      projects: 0,
      leads: 0,
      conversations: 0,
      memberships: 0
    };

    // Patterns to identify test data
    this.testPatterns = {
      names: [
        'test', 'Test', 'TEST',
        'demo', 'Demo', 'DEMO',
        'sample', 'Sample', 'SAMPLE',
        'TDD', 'Quick Test', 'Integration Test',
        'Auth Fix Test', 'Automated test',
        'Test Client for', 'Test Project',
        'Real Estate Project', // Known test project
        'Website Redesign', // Common test pattern
        'Alpha', 'alpha', 'ALPHA',
        'Debug', 'debug', 'DEBUG'
      ],
      emails: [
        'test@', 'demo@', 'sample@',
        '@example.com', '@test.com', '@demo.com',
        'testlead@', 'testclient@'
      ],
      phones: [
        '+1234567890', '+1555555555', '+1-555-TEST'
      ],
      // Time-based cleanup (older than X days)
      olderThanDays: 7
    };
  }

  async run() {
    console.log('🧹 Test Data Cleanup Tool');
    console.log('=========================');
    
    if (this.isDryRun) {
      console.log('🔍 DRY RUN MODE - No data will be deleted');
    }
    
    if (this.isForce) {
      console.log('⚠️  FORCE MODE - Will delete without confirmation');
    }
    
    try {
      // Step 1: Identify test data
      const testData = await this.identifyTestData();
      
      // Step 2: Show summary
      await this.showSummary(testData);
      
      // Step 3: Confirm deletion (unless force mode)
      if (!this.isDryRun && !this.isForce) {
        const confirmed = await this.confirmDeletion();
        if (!confirmed) {
          console.log('❌ Cleanup cancelled by user');
          return;
        }
      }
      
      // Step 4: Clean up data
      if (!this.isDryRun) {
        await this.cleanupData(testData);
      }
      
      // Step 5: Report results
      this.reportResults();
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
    }
  }

  async identifyTestData() {
    console.log('\n🔍 Identifying test data...');
    
    const testData = {
      clients: [],
      projects: [],
      leads: [],
      conversations: [],
      memberships: []
    };

    // Find test clients
    const { data: allClients, error: clientsError } = await this.supabase
      .from('clients')
      .select('id, name, email, phone, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    for (const client of allClients || []) {
      if (this.isTestData(client)) {
        testData.clients.push(client);
      }
    }

    // Find test projects
    const { data: allProjects, error: projectsError } = await this.supabase
      .from('projects')
      .select('id, name, description, client_id, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    for (const project of allProjects || []) {
      if (this.isTestData(project) || this.isTestClientProject(project, testData.clients)) {
        testData.projects.push(project);
      }
    }

    // Find test leads
    const { data: allLeads, error: leadsError } = await this.supabase
      .from('leads')
      .select('id, first_name, last_name, email, phone, project_id, client_id, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (leadsError) {
      throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    }

    for (const lead of allLeads || []) {
      if (this.isTestData(lead) || 
          this.isTestClientProject({id: lead.client_id}, testData.clients) ||
          this.isTestProject(lead.project_id, testData.projects)) {
        testData.leads.push(lead);
      }
    }

    // Find test conversations
    const { data: allConversations, error: conversationsError } = await this.supabase
      .from('conversations')
      .select('id, lead_id, project_id, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (conversationsError) {
      throw new Error(`Failed to fetch conversations: ${conversationsError.message}`);
    }

    for (const conversation of allConversations || []) {
      if (this.isTestLead(conversation.lead_id, testData.leads) ||
          this.isTestProject(conversation.project_id, testData.projects)) {
        testData.conversations.push(conversation);
      }
    }

    // Find test memberships
    const membershipTables = ['client_members', 'project_members', 'lead_members', 'conversation_members'];
    
    for (const table of membershipTables) {
      try {
        const { data: memberships, error } = await this.supabase
          .from(table)
          .select('*');
        
        if (!error && memberships) {
          for (const membership of memberships) {
            if (this.isTestMembership(membership, testData, table)) {
              testData.memberships.push({...membership, table});
            }
          }
        }
      } catch (err) {
        console.log(`⚠️  Table ${table} might not exist:`, err.message);
      }
    }

    return testData;
  }

  isTestData(item) {
    // Check name patterns
    const name = item.name || '';
    const description = item.description || '';
    const firstName = item.first_name || '';
    const lastName = item.last_name || '';
    const email = item.email || '';
    const phone = item.phone || '';
    
    // Check for test patterns in names
    const textToCheck = [name, description, firstName, lastName].join(' ').toLowerCase();
    if (this.testPatterns.names.some(pattern => textToCheck.includes(pattern.toLowerCase()))) {
      return true;
    }
    
    // Check for test patterns in emails
    if (this.testPatterns.emails.some(pattern => email.toLowerCase().includes(pattern.toLowerCase()))) {
      return true;
    }
    
    // Check for test patterns in phones
    if (this.testPatterns.phones.some(pattern => phone.includes(pattern))) {
      return true;
    }
    
    // Check age-based cleanup
    if (item.created_at) {
      const createdDate = new Date(item.created_at);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.testPatterns.olderThanDays);
      
      if (createdDate < cutoffDate && this.looksLikeTestData(item)) {
        return true;
      }
    }
    
    return false;
  }

  looksLikeTestData(item) {
    // Additional heuristics for test data
    const name = (item.name || '').toLowerCase();
    const email = (item.email || '').toLowerCase();
    
    return name.includes('test') || 
           name.includes('demo') || 
           name.includes('sample') ||
           email.includes('test') ||
           email.includes('demo') ||
           email.includes('example');
  }

  isTestClientProject(project, testClients) {
    return testClients.some(client => client.id === project.client_id);
  }

  isTestProject(projectId, testProjects) {
    return testProjects.some(project => project.id === projectId);
  }

  isTestLead(leadId, testLeads) {
    return testLeads.some(lead => lead.id === leadId);
  }

  isTestMembership(membership, testData, table) {
    switch (table) {
      case 'client_members':
        return testData.clients.some(client => client.id === membership.client_id);
      case 'project_members':
        return testData.projects.some(project => project.id === membership.project_id);
      case 'lead_members':
        return testData.leads.some(lead => lead.id === membership.lead_id);
      case 'conversation_members':
        return testData.conversations.some(conv => conv.id === membership.conversation_id);
      default:
        return false;
    }
  }

  async showSummary(testData) {
    console.log('\n📊 Test Data Summary:');
    console.log('=====================');
    
    console.log(`👥 Clients: ${testData.clients.length}`);
    if (testData.clients.length > 0) {
      testData.clients.slice(0, 5).forEach(client => {
        console.log(`   - ${client.name} (${client.email || 'No email'})`);
      });
      if (testData.clients.length > 5) {
        console.log(`   ... and ${testData.clients.length - 5} more`);
      }
    }

    console.log(`📁 Projects: ${testData.projects.length}`);
    if (testData.projects.length > 0) {
      testData.projects.slice(0, 5).forEach(project => {
        console.log(`   - ${project.name}`);
      });
      if (testData.projects.length > 5) {
        console.log(`   ... and ${testData.projects.length - 5} more`);
      }
    }

    console.log(`📋 Leads: ${testData.leads.length}`);
    console.log(`💬 Conversations: ${testData.conversations.length}`);
    console.log(`🔗 Memberships: ${testData.memberships.length}`);

    const total = testData.clients.length + testData.projects.length + 
                  testData.leads.length + testData.conversations.length + 
                  testData.memberships.length;
    
    console.log(`\n🎯 Total items to clean: ${total}`);
  }

  async confirmDeletion() {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('\n❓ Proceed with deletion? (y/N): ', (answer) => {
        readline.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async cleanupData(testData) {
    console.log('\n🧹 Cleaning up test data...');
    
    // Clean up in dependency order (children first)
    await this.cleanupMemberships(testData.memberships);
    await this.cleanupConversations(testData.conversations);
    await this.cleanupLeads(testData.leads);
    await this.cleanupProjects(testData.projects);
    await this.cleanupClients(testData.clients);
    
    console.log('✅ Cleanup completed!');
  }

  async cleanupMemberships(memberships) {
    if (memberships.length === 0) return;
    
    console.log(`🔗 Cleaning up ${memberships.length} memberships...`);
    
    const membershipsByTable = {};
    memberships.forEach(membership => {
      if (!membershipsByTable[membership.table]) {
        membershipsByTable[membership.table] = [];
      }
      membershipsByTable[membership.table].push(membership);
    });
    
    for (const [table, tableMembers] of Object.entries(membershipsByTable)) {
      try {
        const ids = tableMembers.map(m => m.id);
        const { error } = await this.supabase
          .from(table)
          .delete()
          .in('id', ids);
        
        if (error) {
          console.log(`⚠️  Error cleaning ${table}:`, error.message);
        } else {
          console.log(`   ✅ ${table}: ${tableMembers.length} deleted`);
          this.stats.memberships += tableMembers.length;
        }
      } catch (err) {
        console.log(`⚠️  Error cleaning ${table}:`, err.message);
      }
    }
  }

  async cleanupConversations(conversations) {
    if (conversations.length === 0) return;
    
    console.log(`💬 Cleaning up ${conversations.length} conversations...`);
    
    const ids = conversations.map(c => c.id);
    const { error } = await this.supabase
      .from('conversations')
      .delete()
      .in('id', ids);
    
    if (error) {
      console.log(`⚠️  Error cleaning conversations:`, error.message);
    } else {
      console.log(`   ✅ Conversations: ${conversations.length} deleted`);
      this.stats.conversations = conversations.length;
    }
  }

  async cleanupLeads(leads) {
    if (leads.length === 0) return;
    
    console.log(`📋 Cleaning up ${leads.length} leads...`);
    
    const ids = leads.map(l => l.id);
    const { error } = await this.supabase
      .from('leads')
      .delete()
      .in('id', ids);
    
    if (error) {
      console.log(`⚠️  Error cleaning leads:`, error.message);
    } else {
      console.log(`   ✅ Leads: ${leads.length} deleted`);
      this.stats.leads = leads.length;
    }
  }

  async cleanupProjects(projects) {
    if (projects.length === 0) return;
    
    console.log(`📁 Cleaning up ${projects.length} projects...`);
    
    const ids = projects.map(p => p.id);
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .in('id', ids);
    
    if (error) {
      console.log(`⚠️  Error cleaning projects:`, error.message);
    } else {
      console.log(`   ✅ Projects: ${projects.length} deleted`);
      this.stats.projects = projects.length;
    }
  }

  async cleanupClients(clients) {
    if (clients.length === 0) return;
    
    console.log(`👥 Cleaning up ${clients.length} clients...`);
    
    const ids = clients.map(c => c.id);
    const { error } = await this.supabase
      .from('clients')
      .delete()
      .in('id', ids);
    
    if (error) {
      console.log(`⚠️  Error cleaning clients:`, error.message);
    } else {
      console.log(`   ✅ Clients: ${clients.length} deleted`);
      this.stats.clients = clients.length;
    }
  }

  reportResults() {
    console.log('\n📈 Cleanup Results:');
    console.log('==================');
    console.log(`👥 Clients deleted: ${this.stats.clients}`);
    console.log(`📁 Projects deleted: ${this.stats.projects}`);
    console.log(`📋 Leads deleted: ${this.stats.leads}`);
    console.log(`💬 Conversations deleted: ${this.stats.conversations}`);
    console.log(`🔗 Memberships deleted: ${this.stats.memberships}`);
    
    const total = Object.values(this.stats).reduce((sum, count) => sum + count, 0);
    console.log(`\n🎯 Total items cleaned: ${total}`);
    
    if (this.isDryRun) {
      console.log('\n💡 This was a dry run. Use without --dry-run to actually delete data.');
    }
  }
}

// Run the cleanup
if (require.main === module) {
  const cleanup = new TestDataCleanup();
  cleanup.run().catch(console.error);
}

module.exports = TestDataCleanup; 