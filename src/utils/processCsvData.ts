import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface CsvTool {
  name: string;
  website: string;
  category?: string;
  description?: string;
  [key: string]: any;
}

export async function processCsvData(csvData: CsvTool[]) {
  console.log('Processing CSV data:', csvData.length, 'tools');
  const processedCount = {
    success: 0,
    error: 0,
    duplicate: 0,
    total: csvData.length
  };

  const toastId = toast.loading(`Processing 0/${processedCount.total} tools...`);
  
  // Validate the CSV data first
  if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
    toast.error('Invalid CSV data: No tools found to import', { id: toastId });
    return processedCount;
  }
  
  // Check if the CSV has the required columns
  const firstRow = csvData[0];
  if (!firstRow.name || !firstRow.website) {
    toast.error('CSV must contain "name" and "website" columns', { id: toastId });
    return processedCount;
  }

  // Process in batches to avoid overwhelming the database
  const BATCH_SIZE = 50;
  const batches = [];
  
  // Split data into batches
  for (let i = 0; i < csvData.length; i += BATCH_SIZE) {
    batches.push(csvData.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`Split ${csvData.length} tools into ${batches.length} batches of up to ${BATCH_SIZE}`);
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchStart = batchIndex * BATCH_SIZE;
    
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} (tools ${batchStart + 1}-${batchStart + batch.length})`);
    
    // Prepare batch insert data
    const toolsToInsert = [];
    
    for (const tool of batch) {
      // Skip empty rows
      if (!tool.name || !tool.website) {
        processedCount.error++;
        continue;
      }
      
      // Normalize website URL
      let websiteUrl = tool.website;
      if (!websiteUrl.startsWith('http')) {
        websiteUrl = `https://${websiteUrl}`;
      }
      
      // Add to the batch insert array - NO DUPLICATE CHECKING
      toolsToInsert.push({
        tool_name: tool.name,
        website_url: websiteUrl,
        category: tool.category || null,
        description: tool.description || null,
        status: 'Pending',
        notes: 'Imported from CSV',
        outreach_status: 'Needs Contact',
        tags: tool.tags ? tool.tags.split(',').map(tag => tag.trim()) : null,
        use_cases: tool.use_cases ? tool.use_cases.split(',').map(uc => uc.trim()) : null,
        features: tool.features ? tool.features.split(',').map(feature => feature.trim()) : null
      });
    }
    
    // Insert the batch if there are tools to insert
    if (toolsToInsert.length > 0) {
      try {
        const { data, error } = await supabase
          .from('affiliate_links')
          .insert(toolsToInsert);
        
        if (error) {
          console.error(`Error inserting batch ${batchIndex + 1}:`, error);
          
          // If we get a unique constraint violation, try inserting one by one
          if (error.code === '23505') { // Unique constraint violation
            console.log('Unique constraint violation, trying one-by-one insert');
            
            // Try inserting each tool individually
            for (const tool of toolsToInsert) {
              try {
                const { error: singleError } = await supabase
                  .from('affiliate_links')
                  .insert([tool]);
                
                if (singleError) {
                  if (singleError.code === '23505') {
                    // This is a duplicate
                    processedCount.duplicate++;
                  } else {
                    // Some other error
                    processedCount.error++;
                  }
                } else {
                  processedCount.success++;
                }
              } catch (singleInsertError) {
                processedCount.error++;
              }
            }
          } else {
            processedCount.error += toolsToInsert.length;
          }
        } else {
          console.log(`Successfully inserted ${toolsToInsert.length} tools in batch ${batchIndex + 1}`);
          processedCount.success += toolsToInsert.length;
        }
      } catch (error) {
        console.error(`Exception inserting batch ${batchIndex + 1}:`, error);
        processedCount.error += toolsToInsert.length;
      }
    }
    
    // Update the toast message for each batch
    toast.loading(
      `Processing ${batchStart + batch.length}/${processedCount.total} tools... (${processedCount.success} added)`, 
      { id: toastId }
    );
    
    // Add a small delay between batches to avoid overwhelming the database
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Show final result
  toast.success(
    `Imported ${processedCount.success} tools successfully (${processedCount.error} errors, ${processedCount.duplicate} duplicates)`, 
    { id: toastId, duration: 5000 }
  );
  
  return processedCount;
}
