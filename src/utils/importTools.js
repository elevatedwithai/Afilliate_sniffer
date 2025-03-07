import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xjvyuuryjdavjgswzqsw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqdnl1dXJ5amRhdmpnc3d6cXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NzE3MjgsImV4cCI6MjA1NjA0NzcyOH0.GIf_TSoSCuW3iX1AyN0HY41wWwZY-3pHny3nX2wpxLE';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data - replace with your actual data import logic
const sampleTools = [
  { name: 'ChatGPT', website: 'https://chat.openai.com' },
  { name: 'Midjourney', website: 'https://www.midjourney.com' },
  { name: 'Jasper', website: 'https://www.jasper.ai' },
  { name: 'Copy.ai', website: 'https://www.copy.ai' },
  { name: 'Stable Diffusion', website: 'https://stability.ai' },
  { name: 'Anthropic Claude', website: 'https://www.anthropic.com/claude' },
  { name: 'Runway', website: 'https://runwayml.com' },
  { name: 'Synthesia', website: 'https://www.synthesia.io' },
  { name: 'Descript', website: 'https://www.descript.com' },
  { name: 'Notion AI', website: 'https://www.notion.so' }
];

// Function to check if tables exist and create them if they don't
const ensureTablesExist = async () => {
  try {
    // Check if ai_tools table exists
    const { error: checkError } = await supabase
      .from('ai_tools')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('Tables do not exist. Please run the migration script first.');
      console.log('Run: npx supabase migration up');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error checking tables:', error);
    process.exit(1);
  }
};

// Function to import tools
const importTools = async (tools) => {
  // First ensure tables exist
  await ensureTablesExist();
  
  console.log(`Importing ${tools.length} tools...`);
  
  for (const tool of tools) {
    try {
      // Insert tool
      const { data: toolData, error: toolError } = await supabase
        .from('ai_tools')
        .insert([
          { name: tool.name, website: tool.website }
        ])
        .select();
      
      if (toolError) {
        console.error(`Error inserting tool ${tool.name}:`, toolError);
        continue;
      }
      
      const toolId = toolData[0].id;
      
      // Insert affiliate program entry (initially pending)
      const { error: programError } = await supabase
        .from('affiliate_programs')
        .insert([
          { tool_id: toolId, status: 'pending', retry_count: 0 }
        ]);
      
      if (programError) {
        console.error(`Error inserting affiliate program for ${tool.name}:`, programError);
        continue;
      }
      
      console.log(`Successfully imported ${tool.name}`);
    } catch (error) {
      console.error(`Error processing ${tool.name}:`, error);
    }
  }
  
  console.log('Import completed');
};

// Import sample tools
importTools(sampleTools).catch(console.error);
