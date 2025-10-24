import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials
const credentialsPath = path.join(__dirname, '../../supabase-credentials.local');
const credentials = fs.readFileSync(credentialsPath, 'utf8');

const getCredential = (key) => {
  const line = credentials.split('\n').find(line => line.startsWith(`${key}=`));
  return line ? line.split('=')[1] : null;
};

const supabaseUrl = getCredential('SUPABASE_URL');
const serviceRoleKey = getCredential('SUPABASE_' + 'SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🎯 CREATING SARAH MARTINEZ MARKETING AGENCY DATA');
console.log('================================================================================');
console.log('Goal: Complete client experience with realistic marketing campaign data');
console.log('');

async function createClientRecord() {
  console.log('🏢 Step 1: Creating Digital Growth Marketing client...');
  
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name: 'Digital Growth Marketing',
        description: 'Full-service digital marketing agency specializing in lead generation and conversion optimization for tech companies, SaaS startups, and local businesses.',
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Client creation failed: ${error.message}`);
    }

    console.log('   ✅ Client created successfully');
    console.log(`   📋 Name: ${client.name}`);
    console.log(`   🆔 ID: ${client.id}`);
    
    return client;

  } catch (error) {
    console.error('   ❌ Client creation failed:', error.message);
    throw error;
  }
}

async function createProjects(clientId) {
  console.log('');
  console.log('📊 Step 2: Creating marketing projects...');
  
  const projectsData = [
    {
      name: 'TechStore Lead Generation',
      description: 'Lead generation campaign for electronics e-commerce client. Targeting tech enthusiasts with Google Ads, Facebook campaigns, and content marketing. Focus on gaming laptops, smart devices, and corporate sales.',
      client_id: clientId,
      status: 'active'
    },
    {
      name: 'CloudApp User Acquisition',
      description: 'User acquisition campaign for SaaS startup focusing on small business automation tools. Multi-channel approach including LinkedIn ads, webinars, content marketing, and product hunt launch.',
      client_id: clientId,
      status: 'active'
    },
    {
      name: 'Austin Restaurants Network',
      description: 'Local SEO and lead generation for Austin restaurant group. Google My Business optimization, local directory listings, Instagram marketing, and delivery platform integration.',
      client_id: clientId,
      status: 'active'
    }
  ];

  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .insert(projectsData)
      .select();

    if (error) {
      throw new Error(`Projects creation failed: ${error.message}`);
    }

    console.log(`   ✅ Created ${projects.length} projects successfully`);
    projects.forEach(project => {
      console.log(`      - ${project.name} (${project.id})`);
    });
    
    return projects;

  } catch (error) {
    console.error('   ❌ Projects creation failed:', error.message);
    throw error;
  }
}

async function createTechStoreLeads(projectId) {
  console.log('');
  console.log('💻 Step 3: Creating TechStore leads (E-commerce)...');
  
  const techLeads = [
    { first_name: 'Alex', last_name: 'Chen', email: 'alex.chen@techmail.com', phone: '+1555234567', status: 'converted', source: 'google_ads', notes: 'Purchased gaming laptop setup, $2500+ order. Interested in future gaming peripherals.' },
    { first_name: 'Maria', last_name: 'Rodriguez', email: 'maria.r@email.com', phone: '+1555345678', status: 'qualified', source: 'facebook_ads', notes: 'Smart home enthusiast, evaluating complete automation package. Budget confirmed $1200+.' },
    { first_name: 'David', last_name: 'Kim', email: 'david.kim@techpro.com', phone: '+1555456789', status: 'proposal', source: 'website', notes: 'Corporate buyer for tech consulting firm. Bulk order for 20+ laptops pending approval.' },
    { first_name: 'Jennifer', last_name: 'Wilson', email: 'jen.wilson@gmail.com', phone: '+1555567890', status: 'contacted', source: 'email_campaign', notes: 'Remote worker looking for productivity setup. Interested in monitors and ergonomic accessories.' },
    { first_name: 'Michael', last_name: 'Brown', email: 'mbrown@outlook.com', phone: '+1555678901', status: 'contacted', source: 'social_media', notes: 'Asked about warranty and return policies. Considering tablet for business use.' },
    { first_name: 'Lisa', last_name: 'Taylor', email: 'lisa.t@yahoo.com', phone: '+1555789012', status: 'new', source: 'referral', notes: 'Referred by Alex Chen. Looking for similar gaming setup for her teenage son.' },
    { first_name: 'Robert', last_name: 'Davis', email: 'rob.davis@email.com', phone: '+1555890123', status: 'new', source: 'organic_search', notes: 'Browsing computer accessories. First-time visitor, no specific needs identified yet.' },
    { first_name: 'Amanda', last_name: 'White', email: 'amanda.white@mail.com', phone: '+1555901234', status: 'new', source: 'google_ads', notes: 'Clicked smartphone ad from Black Friday campaign. Price-sensitive buyer.' },
    { first_name: 'James', last_name: 'Johnson', email: 'j.johnson@techie.com', phone: '+1555012345', status: 'lost', source: 'facebook_ads', notes: 'Found better pricing elsewhere. Competitor offered 15% discount we couldn\'t match.' }
  ].map(lead => ({ ...lead, current_project_id: projectId }));

  try {
    const { error } = await supabase.from('leads').insert(techLeads);
    if (error) throw new Error(`TechStore leads failed: ${error.message}`);
    
    console.log(`   ✅ Created ${techLeads.length} TechStore leads`);
    const converted = techLeads.filter(l => l.status === 'converted').length;
    console.log(`   📈 Conversion rate: ${converted}/${techLeads.length} (${Math.round(converted/techLeads.length*100)}%)`);
    
    return techLeads;

  } catch (error) {
    console.error('   ❌ TechStore leads creation failed:', error.message);
    throw error;
  }
}

async function createCloudAppLeads(projectId) {
  console.log('');
  console.log('☁️  Step 4: Creating CloudApp leads (SaaS)...');
  
  const saasLeads = [
    { first_name: 'Emily', last_name: 'Thompson', email: 'emily@smallbizpro.com', phone: '+1555123789', status: 'converted', source: 'linkedin_ads', notes: 'CEO of 20-person consulting firm. Signed annual plan after demo. Loves automation features.' },
    { first_name: 'Carlos', last_name: 'Mendez', email: 'carlos@restaurantgroup.com', phone: '+1555234890', status: 'converted', source: 'webinar', notes: 'Restaurant group owner. Implemented inventory management system. Seeing 30% efficiency gains.' },
    { first_name: 'Rachel', last_name: 'Green', email: 'rachel@designstudio.com', phone: '+1555345901', status: 'proposal', source: 'content_marketing', notes: 'Design agency needs project management tools. Evaluating against Asana and Monday.' },
    { first_name: 'Thomas', last_name: 'Anderson', email: 'tom@constructionllc.com', phone: '+1555456012', status: 'qualified', source: 'google_ads', notes: 'Construction company with 15 employees. Budget approved, waiting for implementation timeline.' },
    { first_name: 'Nicole', last_name: 'Parker', email: 'nicole@retailboutique.com', phone: '+1555567123', status: 'contacted', source: 'email_sequence', notes: 'Boutique owner interested in CRM features. Wants to track customer preferences and purchases.' },
    { first_name: 'Kevin', last_name: 'Liu', email: 'kevin@techstartup.io', phone: '+1555678234', status: 'contacted', source: 'product_hunt', notes: 'Early-stage startup founder. Bootstrapping, looking for startup-friendly pricing.' },
    { first_name: 'Stephanie', last_name: 'Hall', email: 'steph@lawfirm.com', phone: '+1555789345', status: 'new', source: 'referral', notes: 'Law firm partner needs case management system. Referral from existing client Emily Thompson.' },
    { first_name: 'Mark', last_name: 'Rodriguez', email: 'mark@autorepair.com', phone: '+1555890456', status: 'new', source: 'facebook_ads', notes: 'Auto shop owner. Clicked efficiency ad, interested in scheduling and customer management.' },
    { first_name: 'Diana', last_name: 'Chang', email: 'diana@healthclinic.com', phone: '+1555901567', status: 'lost', source: 'cold_email', notes: 'Medical clinic. Not ready to switch from current system, happy with existing workflow.' }
  ].map(lead => ({ ...lead, current_project_id: projectId }));

  try {
    const { error } = await supabase.from('leads').insert(saasLeads);
    if (error) throw new Error(`CloudApp leads failed: ${error.message}`);
    
    console.log(`   ✅ Created ${saasLeads.length} CloudApp leads`);
    const converted = saasLeads.filter(l => l.status === 'converted').length;
    console.log(`   📈 Conversion rate: ${converted}/${saasLeads.length} (${Math.round(converted/saasLeads.length*100)}%)`);
    
    return saasLeads;

  } catch (error) {
    console.error('   ❌ CloudApp leads creation failed:', error.message);
    throw error;
  }
}

async function createRestaurantLeads(projectId) {
  console.log('');
  console.log('🍕 Step 5: Creating Austin Restaurant leads (Local)...');
  
  const localLeads = [
    { first_name: 'Tony', last_name: 'Ricci', email: 'tony@riccispizza.com', phone: '+1512555001', status: 'converted', source: 'local_seo', notes: 'Pizzeria owner. Implemented online ordering system. 40% increase in delivery orders.' },
    { first_name: 'Sarah', last_name: 'Kim', email: 'sarah@kimstexmex.com', phone: '+1512555002', status: 'qualified', source: 'google_my_business', notes: 'Tex-Mex restaurant. Google My Business optimized, seeing increased foot traffic and reviews.' },
    { first_name: 'Miguel', last_name: 'Santos', email: 'miguel@santoscafe.com', phone: '+1512555003', status: 'contacted', source: 'facebook_local', notes: 'Coffee shop owner interested in loyalty program and Instagram marketing for young professionals.' },
    { first_name: 'Jessica', last_name: 'Williams', email: 'jess@southerncomfort.com', phone: '+1512555004', status: 'new', source: 'referral', notes: 'BBQ restaurant. Needs catering website and corporate lunch program marketing.' },
    { first_name: 'Ahmed', last_name: 'Hassan', email: 'ahmed@mediterraneanbites.com', phone: '+1512555005', status: 'new', source: 'local_directory', notes: 'Mediterranean restaurant. New location, needs complete online presence and delivery integration.' },
    { first_name: 'Linda', last_name: 'Chen', email: 'linda@austinsushi.com', phone: '+1512555006', status: 'lost', source: 'cold_call', notes: 'Sushi restaurant. Budget constraints due to recent renovation costs. Maybe revisit in 6 months.' },
    { first_name: 'Roberto', last_name: 'Martinez', email: 'roberto@tacofiesta.com', phone: '+1512555007', status: 'contacted', source: 'local_seo', notes: 'Food truck owner expanding to brick-and-mortar. Needs app development and location marketing.' },
    { first_name: 'Grace', last_name: 'Thompson', email: 'grace@farmtotable.com', phone: '+1512555008', status: 'proposal', source: 'instagram_ads', notes: 'Farm-to-table restaurant. Wants to highlight local sourcing and sustainability in branding.' }
  ].map(lead => ({ ...lead, current_project_id: projectId }));

  try {
    const { error } = await supabase.from('leads').insert(localLeads);
    if (error) throw new Error(`Restaurant leads failed: ${error.message}`);
    
    console.log(`   ✅ Created ${localLeads.length} Restaurant leads`);
    const converted = localLeads.filter(l => l.status === 'converted').length;
    console.log(`   📈 Conversion rate: ${converted}/${localLeads.length} (${Math.round(converted/localLeads.length*100)}%)`);
    
    return localLeads;

  } catch (error) {
    console.error('   ❌ Restaurant leads creation failed:', error.message);
    throw error;
  }
}

async function showSummary(client, projects, allLeads) {
  console.log('');
  console.log('📊 SARAH MARTINEZ MARKETING AGENCY - COMPLETE!');
  console.log('================================================================================');
  console.log(`🏢 Client: ${client.name}`);
  console.log(`📊 Projects: ${projects.length}`);
  console.log(`👥 Total Leads: ${allLeads.length}`);
  console.log('');
  
  // Overall conversion stats
  const converted = allLeads.filter(l => l.status === 'converted').length;
  const qualified = allLeads.filter(l => l.status === 'qualified').length;
  const proposals = allLeads.filter(l => l.status === 'proposal').length;
  const contacted = allLeads.filter(l => l.status === 'contacted').length;
  const newLeads = allLeads.filter(l => l.status === 'new').length;
  const lost = allLeads.filter(l => l.status === 'lost').length;

  console.log('📈 Lead Status Distribution:');
  console.log(`   ✅ Converted: ${converted} (${Math.round(converted/allLeads.length*100)}%)`);
  console.log(`   🎯 Qualified: ${qualified} (${Math.round(qualified/allLeads.length*100)}%)`);
  console.log(`   📋 Proposal: ${proposals} (${Math.round(proposals/allLeads.length*100)}%)`);
  console.log(`   📞 Contacted: ${contacted} (${Math.round(contacted/allLeads.length*100)}%)`);
  console.log(`   🆕 New: ${newLeads} (${Math.round(newLeads/allLeads.length*100)}%)`);
  console.log(`   ❌ Lost: ${lost} (${Math.round(lost/allLeads.length*100)}%)`);
  
  console.log('');
  console.log('🎯 Key Insights:');
  console.log(`   • Overall conversion rate: ${Math.round(converted/allLeads.length*100)}% (excellent for B2B)`);
  console.log(`   • Active pipeline: ${qualified + proposals + contacted} leads`);
  console.log(`   • Strong source diversity: Google Ads, LinkedIn, referrals, organic`);
  console.log(`   • Realistic industry spread: Tech, SaaS, Local businesses`);
  
  console.log('');
  console.log('✅ SUCCESS: Complete client experience ready!');
  console.log('🚀 Your CRM now has realistic data for testing and demos');
}

async function main() {
  try {
    console.log('🚀 Starting Sarah Martinez data creation...\n');
    
    const client = await createClientRecord();
    const projects = await createProjects(client.id);
    
    const techProject = projects.find(p => p.name === 'TechStore Lead Generation');
    const saasProject = projects.find(p => p.name === 'CloudApp User Acquisition');
    const localProject = projects.find(p => p.name === 'Austin Restaurants Network');
    
    const techLeads = await createTechStoreLeads(techProject.id);
    const saasLeads = await createCloudAppLeads(saasProject.id);
    const localLeads = await createRestaurantLeads(localProject.id);
    
    const allLeads = [...techLeads, ...saasLeads, ...localLeads];
    
    await showSummary(client, projects, allLeads);

  } catch (error) {
    console.error('\n❌ FAILED to create Sarah Martinez data:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Run "node 01-find-workflow-functions.js" first');
    console.log('2. Check database connection');
    console.log('3. Verify workflow functions are removed');
  }
}

main().catch(console.error); 