import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

/**
 * Clears all data from the affiliate_links table
 * @returns Promise with success status and count of deleted records
 */
export async function clearAllData() {
  console.log('Clearing all data from affiliate_links table');
  try {
    // First, get a count of how many records we'll be deleting
    const { count, error: countError } = await supabase
      .from('affiliate_links')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting records:', countError);
      return { success: false, error: countError.message };
    }
    
    console.log(`Found ${count} records to delete`);
    
    // Delete all records without using any condition
    // This is the safest approach when we want to delete everything
    const { error } = await supabase
      .from('affiliate_links')
      .delete()
      .filter('id', 'not.is', null); // Correct syntax for "is not null"
    
    if (error) {
      console.error('Error deleting records:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Successfully deleted ${count} records`);
    
    return { 
      success: true, 
      count: count || 0,
      message: `Successfully deleted ${count} records`
    };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Deletes a specific tool by ID
 * @param id The ID of the tool to delete
 * @returns Promise with success status
 */
export async function deleteToolById(id: string) {
  console.log(`Deleting tool with ID: ${id}`);
  try {
    const { error } = await supabase
      .from('affiliate_links')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting tool with ID ${id}:`, error);
      return { success: false, error: error.message };
    }
    
    console.log(`Successfully deleted tool with ID: ${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting tool with ID ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Resets a tool's status back to Pending
 * @param id The ID of the tool to reset
 * @returns Promise with success status
 */
export async function resetToolStatus(id: string) {
  console.log(`Resetting tool with ID: ${id}`);
  try {
    const { error } = await supabase
      .from('affiliate_links')
      .update({
        status: 'Pending',
        affiliate_url: null,
        commission: null,
        cookie_duration: null,
        payout_type: null,
        contact_email: null,
        outreach_status: 'Needs Contact',
        notes: 'Reset to pending'
      })
      .eq('id', id);
    
    if (error) {
      console.error(`Error resetting tool with ID ${id}:`, error);
      return { success: false, error: error.message };
    }
    
    console.log(`Successfully reset tool with ID: ${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error resetting tool with ID ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Resets all tools with a specific status back to Pending
 * @param status The status to filter by (e.g., 'Not Found')
 * @returns Promise with success status and count of reset records
 */
export async function resetToolsByStatus(status: string) {
  console.log(`Resetting all tools with status: ${status}`);
  try {
    // First, get a count of how many records we'll be resetting
    const { count, error: countError } = await supabase
      .from('affiliate_links')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    
    if (countError) {
      console.error('Error counting records:', countError);
      return { success: false, error: countError.message };
    }
    
    if (!count || count === 0) {
      return { success: true, count: 0, message: `No tools found with status: ${status}` };
    }
    
    console.log(`Found ${count} records to reset`);
    
    // Update all records with the specified status
    const { error } = await supabase
      .from('affiliate_links')
      .update({
        status: 'Pending',
        affiliate_url: null,
        commission: null,
        cookie_duration: null,
        payout_type: null,
        outreach_status: 'Needs Contact',
        notes: `Reset from ${status} status`
      })
      .eq('status', status);
    
    if (error) {
      console.error(`Error resetting tools with status ${status}:`, error);
      return { success: false, error: error.message };
    }
    
    console.log(`Successfully reset ${count} tools with status: ${status}`);
    
    return { 
      success: true, 
      count: count || 0,
      message: `Successfully reset ${count} tools with status: ${status}`
    };
  } catch (error) {
    console.error(`Error resetting tools with status ${status}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Checks for duplicate tools in the database
 * @returns Promise with count of duplicates found
 */
export async function checkForDuplicates() {
  console.log('Checking for duplicate tools in the database');
  try {
    // This query finds duplicate website URLs after normalizing them
    const { data, error } = await supabase.rpc('find_duplicate_tools');
    
    if (error) {
      console.error('Supabase request failed', error);
      
      // Fallback method if RPC is not available
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('affiliate_links')
        .select('website_url');
      
      if (fallbackError) {
        return { success: false, error: fallbackError.message };
      }
      
      // Process the data to find duplicates
      const urlMap = new Map();
      const duplicates = [];
      
      fallbackData?.forEach(tool => {
        const normalizedUrl = tool.website_url.toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .replace(/\/$/, '');
        
        if (urlMap.has(normalizedUrl)) {
          duplicates.push({
            normalized_url: normalizedUrl,
            count: urlMap.get(normalizedUrl) + 1
          });
          urlMap.set(normalizedUrl, urlMap.get(normalizedUrl) + 1);
        } else {
          urlMap.set(normalizedUrl, 1);
        }
      });
      
      // Filter to only include actual duplicates
      const actualDuplicates = Array.from(urlMap.entries())
        .filter(([_, count]) => count > 1)
        .map(([url, count]) => ({ normalized_url: url, count }));
      
      return { 
        success: true, 
        duplicates: actualDuplicates,
        count: actualDuplicates.length
      };
    }
    
    return { 
      success: true, 
      duplicates: data,
      count: data?.length || 0
    };
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Fixes duplicate tools in the database by keeping the most complete record
 * @returns Promise with count of duplicates fixed
 */
export async function fixDuplicates() {
  console.log('Fixing duplicate tools in the database');
  try {
    // First check for duplicates
    const { success, duplicates, error } = await checkForDuplicates();
    
    if (!success) {
      return { success: false, error };
    }
    
    if (!duplicates || duplicates.length === 0) {
      return { success: true, count: 0, message: 'No duplicates found' };
    }
    
    console.log(`Found ${duplicates.length} duplicate URLs to fix`);
    
    let fixedCount = 0;
    
    // Process each duplicate URL
    for (const duplicate of duplicates) {
      const normalizedUrl = duplicate.normalized_url;
      
      // Get all tools with this normalized URL
      const { data: tools, error: toolsError } = await supabase
        .from('affiliate_links')
        .select('*')
        .filter('website_url', 'ilike', `%${normalizedUrl}%`);
      
      if (toolsError || !tools || tools.length <= 1) {
        continue; // Skip if error or not actually a duplicate
      }
      
      console.log(`Processing ${tools.length} duplicates for URL: ${normalizedUrl}`);
      
      // Find the most complete record to keep
      let bestTool = tools[0];
      let bestScore = scoreToolCompleteness(bestTool);
      
      for (let i = 1; i < tools.length; i++) {
        const score = scoreToolCompleteness(tools[i]);
        if (score > bestScore) {
          bestScore = score;
          bestTool = tools[i];
        }
      }
      
      // Delete all duplicates except the best one
      for (const tool of tools) {
        if (tool.id !== bestTool.id) {
          const { error: deleteError } = await supabase
            .from('affiliate_links')
            .delete()
            .eq('id', tool.id);
          
          if (!deleteError) {
            fixedCount++;
          }
        }
      }
    }
    
    return { 
      success: true, 
      count: fixedCount,
      message: `Successfully fixed ${fixedCount} duplicate tools`
    };
  } catch (error) {
    console.error('Error fixing duplicates:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Scores a tool record based on how complete it is
 * @param tool The tool record to score
 * @returns A score representing the completeness of the record
 */
function scoreToolCompleteness(tool: any): number {
  let score = 0;
  
  // Status scores
  if (tool.status === 'Found') score += 10;
  else if (tool.status === 'Not Found') score += 5;
  
  // Data completeness scores
  if (tool.affiliate_url) score += 15;
  if (tool.commission) score += 5;
  if (tool.cookie_duration) score += 5;
  if (tool.payout_type) score += 5;
  if (tool.contact_email) score += 5;
  if (tool.contact_page_url) score += 3;
  if (tool.social_links && Array.isArray(tool.social_links) && tool.social_links.length > 0) score += 3;
  if (tool.tags && Array.isArray(tool.tags) && tool.tags.length > 0) score += 2;
  if (tool.use_cases && Array.isArray(tool.use_cases) && tool.use_cases.length > 0) score += 2;
  if (tool.features && Array.isArray(tool.features) && tool.features.length > 0) score += 2;
  if (tool.favicon_url) score += 1;
  if (tool.logo_url) score += 1;
  if (tool.image_url) score += 1;
  if (tool.notes && tool.notes.length > 10) score += 1;
  
  return score;
}
