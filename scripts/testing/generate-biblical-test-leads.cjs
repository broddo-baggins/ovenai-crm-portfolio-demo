#!/usr/bin/env node

/**
 * 🎭 BIBLICAL HEBREW TEST LEADS GENERATOR
 * 
 * Generates 100 test leads with biblical Hebrew names for testing purposes.
 * These leads are clearly identifiable as test data and associated with
 * the "Oven Project" for comprehensive testing scenarios.
 * 
 * Project ID: 2ba26935-4cdf-42b1-8d36-a6f57308b632
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

// Target Project ID for Oven Project
const OVEN_PROJECT_ID = '2ba26935-4cdf-42b1-8d36-a6f57308b632';

console.log('🎭 BIBLICAL HEBREW TEST LEADS GENERATOR');
console.log('======================================');
console.log(`Project: Oven Project (${OVEN_PROJECT_ID})`);
console.log('Generating 100 test leads with biblical Hebrew names...');
console.log('');

// Biblical Hebrew Names (Male)
const hebrewMaleNames = [
  'Avraham', 'Yitzchak', 'Yaakov', 'Moshe', 'Aharon', 'David', 'Shlomo', 'Yehoshua', 'Eliyahu', 'Elisha',
  'Yirmiyahu', 'Yechezkel', 'Daniel', 'Yoel', 'Amos', 'Ovadyah', 'Yonah', 'Michah', 'Nachum', 'Chavakuk',
  'Tzfanyah', 'Chaggai', 'Zecharyah', 'Malachi', 'Ezra', 'Nechemiah', 'Mordechai', 'Yosef', 'Binyamin', 'Reuven',
  'Shimon', 'Levi', 'Yehudah', 'Dan', 'Naftali', 'Gad', 'Asher', 'Yissachar', 'Zevulun', 'Efrayim',
  'Menashe', 'Yehoshua', 'Calev', 'Eldad', 'Meidad', 'Pinchas', 'Eleazar', 'Itamar', 'Gershon', 'Kehat'
];

// Biblical Hebrew Names (Female) 
const hebrewFemaleNames = [
  'Sarah', 'Rivkah', 'Rachel', 'Leah', 'Bilhah', 'Zilpah', 'Miriam', 'Tzipporah', 'Yocheved', 'Elisheva',
  'Avigail', 'Bat-Sheva', 'Tamar', 'Dinah', 'Deborah', 'Yael', 'Ruth', 'Naomi', 'Esther', 'Hadassah',
  'Channah', 'Peninnah', 'Michol', 'Abigail', 'Maacah', 'Chuldah', 'Noadiah', 'Atarah', 'Azubah', 'Bathsheba',
  'Bracha', 'Chava', 'Dalila', 'Gomer', 'Hadassah', 'Iscah', 'Keturah', 'Mahalath', 'Naamah', 'Orpah',
  'Puah', 'Shiphrah', 'Tirzah', 'Vashti', 'Zeruah', 'Achsah', 'Basemath', 'Cozbi', 'Ephah', 'Giddalti'
];

// Biblical Hebrew Surnames
const hebrewSurnames = [
  'Ben-Avraham', 'Ben-David', 'Ben-Moshe', 'Ben-Aharon', 'Ben-Levi', 'Ben-Yehudah', 'Ben-Binyamin', 'Ben-Yosef',
  'HaKohen', 'HaLevi', 'HaNavi', 'HaMelech', 'HaTzadik', 'HaGadol', 'HaKatan', 'HaZaken', 'HaNaar', 'HaGibbor',
  'Mikdash', 'Yerushalmi', 'Tzioni', 'Galili', 'Yehudi', 'Yisraeli', 'Hebron', 'Bethlechemi', 'Nazareni', 'Kapari',
  'Zidonit', 'Ashkeloni', 'Gazani', 'Shomroni', 'Har-Tzion', 'Gat-Shemanim', 'Ein-Gedi', 'Yarden', 'Carmel', 'Sharon',
  'Emek-Bracha', 'Maale-Adumim', 'Tzur-Hadassah', 'Kiryat-Yearim', 'Beth-El', 'Shilo', 'Shechem', 'Chevron', 'Ariel', 'Beit-Lechem'
];

// Israeli phone number prefixes (realistic)
const phonePrefix = ['050', '052', '053', '054', '055', '057', '058'];

// Israeli cities for addresses
const israeliCities = [
  'Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion', 'Petah Tikva', 'Ashdod', 'Netanya', 'Beer Sheva',
  'Bnei Brak', 'Holon', 'Ramat Gan', 'Ashkelon', 'Rehovot', 'Bat Yam', 'Beit Shemesh', 'Kfar Saba',
  'Herzliya', 'Hadera', 'Modi\'in', 'Nazareth', 'Lod', 'Ramla', 'Acre', 'Tiberias', 'Eilat'
];

// Business types/industries for leads
const businessTypes = [
  'Technology Startup', 'Restaurant', 'Consulting Firm', 'Real Estate', 'Healthcare Clinic',
  'Education Center', 'Retail Store', 'Manufacturing', 'Import/Export', 'Tourism',
  'Construction', 'Finance Services', 'Marketing Agency', 'Legal Services', 'Transportation'
];

// Lead statuses that work with the database
const leadStatuses = ['new', 'unqualified', 'consideration', 'qualified', 'active'];

// Generate random phone number
function generateIsraeliPhone() {
  const prefix = phonePrefix[Math.floor(Math.random() * phonePrefix.length)];
  const suffix = Math.floor(1000000 + Math.random() * 9000000);
  return `+972-${prefix}-${suffix}`;
}

// Generate random address
function generateAddress() {
  const city = israeliCities[Math.floor(Math.random() * israeliCities.length)];
  const streetNumber = Math.floor(1 + Math.random() * 999);
  const streetNames = ['Herzl', 'Ben Gurion', 'Rothschild', 'Dizengoff', 'King George', 'Jaffa', 'Allenby', 'Weizmann'];
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  
  return `${streetNumber} ${streetName} St, ${city}, Israel`;
}

// Generate business email
function generateBusinessEmail(firstName, lastName, company) {
  const domains = ['gmail.com', 'outlook.com', 'company.co.il', 'business.net', 'startup.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  
  return `${cleanFirst}.${cleanLast}@${domain}`;
}

// Generate lead data (using actual table schema)
function generateLead(index) {
  const isMale = Math.random() > 0.5;
  const firstName = isMale 
    ? hebrewMaleNames[Math.floor(Math.random() * hebrewMaleNames.length)]
    : hebrewFemaleNames[Math.floor(Math.random() * hebrewFemaleNames.length)];
  
  const lastName = hebrewSurnames[Math.floor(Math.random() * hebrewSurnames.length)];
  const phone = generateIsraeliPhone();
  const address = generateAddress();
  const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
  const status = leadStatuses[Math.floor(Math.random() * leadStatuses.length)];
  const email = generateBusinessEmail(firstName, lastName, businessType);
  
  // Generate lead source variety
  const sources = ['Website', 'Google Ads', 'Facebook', 'Referral', 'Cold Call', 'LinkedIn', 'Trade Show'];
  const source = sources[Math.floor(Math.random() * sources.length)];
  
  // BANT status values that match the database
  const bantStatuses = ['not_qualified', 'partially_qualified', 'mostly_qualified', 'fully_qualified'];
  const states = ['new', 'qualified', 'consideration', 'unqualified', 'active'];
  const processingStates = ['pending', 'active', 'completed', 'failed'];
  
  return {
    // Only use fields that exist in the actual table
    first_name: firstName,
    last_name: lastName,
    phone: phone,
    status: status,
    state: states[Math.floor(Math.random() * states.length)],
    bant_status: bantStatuses[Math.floor(Math.random() * bantStatuses.length)],
    current_project_id: OVEN_PROJECT_ID,
    client_id: null, // Will be set to valid client ID
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interaction_count: Math.floor(0 + Math.random() * 5),
    follow_up_count: Math.floor(0 + Math.random() * 3),
    requires_human_review: Math.random() > 0.8, // 20% chance
    processing_state: processingStates[Math.floor(Math.random() * processingStates.length)],
    queue_status: 'idle', // Default queue status
    
    // Store additional data in metadata fields (JSONB)
    state_status_metadata: {
      source: source,
      business_type: businessType,
      lead_quality: ['Hot', 'Warm', 'Cold'][Math.floor(Math.random() * 3)],
      timeframe: ['Immediate', 'Within 30 days', 'Within 3 months', 'Within 6 months', 'Planning stage'][Math.floor(Math.random() * 5)],
      budget_range: `${Math.floor(5 + Math.random() * 95)}K-${Math.floor(50 + Math.random() * 150)}K`
    },
    
    lead_metadata: {
      test_lead: true,
      lead_number: index + 1,
      generation_timestamp: new Date().toISOString(),
      email: email,
      company: `${businessType} ${firstName}`,
      address: address,
      notes: `Biblical Hebrew test lead #${index + 1} - Generated for testing purposes`,
      name_origin: 'biblical_hebrew',
      purpose: 'automated_testing'
    },
    
    queue_metadata: {
      ready_for_queue: true,
      test_data: true,
      priority: Math.floor(1 + Math.random() * 10)
    }
  };
}

async function validateProject() {
  console.log('🔍 Validating target project...');
  
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', OVEN_PROJECT_ID)
    .single();
  
  if (error || !project) {
    console.error('❌ Project validation failed:', error?.message || 'Project not found');
    console.log('💡 Available projects:');
    
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .limit(10);
    
    projects?.forEach(p => {
      console.log(`   • ${p.name} (${p.id})`);
    });
    
    return false;
  }
  
  console.log(`✅ Project validated: "${project.name}"`);
  return true;
}

async function getValidClientId() {
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .limit(1);
  
  if (clients && clients.length > 0) {
    console.log(`✅ Using client: ${clients[0].name} (${clients[0].id})`);
    return clients[0].id;
  }
  
  console.log('⚠️ No valid client found - using NULL');
  return null;
}

async function generateTestLeads() {
  try {
    // Validate project exists
    const projectValid = await validateProject();
    if (!projectValid) {
      console.error('❌ Cannot proceed - invalid project');
      process.exit(1);
    }
    
    // Get valid client ID
    const clientId = await getValidClientId();
    
    console.log('\n🎭 Generating 100 biblical Hebrew test leads...');
    
    const leads = [];
    for (let i = 0; i < 100; i++) {
      const lead = generateLead(i);
      lead.client_id = clientId; // Set valid client ID
      leads.push(lead);
    }
    
    console.log('📝 Sample lead preview:');
    console.log(`   • ${leads[0].first_name} ${leads[0].last_name}`);
    console.log(`   • Phone: ${leads[0].phone}`);
    console.log(`   • Status: ${leads[0].status} | State: ${leads[0].state}`);
    console.log(`   • BANT: ${leads[0].bant_status}`);
    console.log(`   • Email: ${leads[0].lead_metadata.email}`);
    console.log(`   • Company: ${leads[0].lead_metadata.company}`);
    console.log(`   • Address: ${leads[0].lead_metadata.address}`);
    
    // Insert leads in batches to handle any constraints
    console.log('\n💾 Inserting leads into database...');
    
    const batchSize = 10;
    let successCount = 0;
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('leads')
          .insert(batch)
          .select('id, first_name, last_name');
        
        if (error) {
          console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
        } else {
          successCount += data?.length || 0;
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${data?.length || 0} leads inserted`);
        }
      } catch (err) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} exception:`, err.message);
      }
    }
    
    console.log(`\n📊 GENERATION COMPLETE`);
    console.log(`✅ Successfully created: ${successCount}/100 leads`);
    console.log(`🎯 Project: Oven Project (${OVEN_PROJECT_ID})`);
    console.log(`🎭 Names: Biblical Hebrew (clearly identifiable as test data)`);
    console.log(`📱 Phones: Israeli format (+972-xxx-xxxxxxx)`);
    console.log(`🏠 Addresses: Israeli cities`);
    console.log(`💼 Companies: Realistic business types`);
    
    if (successCount > 0) {
      console.log('\n🧪 READY FOR TESTING:');
      console.log('• Queue functionality testing');
      console.log('• Lead processing workflows');
      console.log('• Export/import operations');
      console.log('• Performance testing');
      console.log('• UI component testing');
      
      // Save generation report
      const report = {
        timestamp: new Date().toISOString(),
        project_id: OVEN_PROJECT_ID,
        project_name: 'Oven Project',
        leads_requested: 100,
        leads_created: successCount,
        success_rate: `${Math.round((successCount/100) * 100)}%`,
        sample_names: leads.slice(0, 5).map(l => `${l.first_name} ${l.last_name}`),
        phone_format: 'Israeli (+972-xxx-xxxxxxx)',
        address_format: 'Israeli cities',
        note: 'Biblical Hebrew names for clear test data identification'
      };
      
      const reportPath = path.join(__dirname, '../../quality-validation/results/biblical-leads-generation-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Report saved: ${reportPath}`);
    }
    
    return successCount;
    
  } catch (error) {
    console.error('💥 Generation failed:', error);
    throw error;
  }
}

// Execute generation
generateTestLeads()
  .then(count => {
    if (count >= 80) {
      console.log('\n🎉 SUCCESS: Test lead generation completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Some leads failed to generate');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 