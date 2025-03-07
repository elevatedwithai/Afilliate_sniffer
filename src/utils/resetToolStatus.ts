import { supabase } from '../lib/supabase';

/**
 * Resets a tool's status back to Pending
 * @param id The ID of the tool to reset
 * @returns Promise with success status
 */
export async function resetToolStatus(id: number) {
  try {
    const { error } = await supabase
      .from('affiliate_links')
      .update({
        status: 'Pending',
        affiliate_url: null,
        commission_rate: null,
        cookie_duration: null,
        payout_type: null,
        contact_email: null,
        notes: 'Reset to pending'
      })
      .eq('id', id);
    
    if (error) {
      console.error(`Error resetting tool with ID ${id}:`, error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error resetting tool with ID ${id}:`, error);
    return { success: false, error: error.message };
  }
}
