import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import axios from 'axios';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR ENV HER';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR ENV HERE';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to save affiliate data to the affiliate_links table
async function saveAffiliateData(tool) {
  const { data, error } = await supabase
    .from('affiliate_links')
    .insert([
      {
        tool_name: tool.name,
        website_url: tool.website,
        affiliate_url: tool.affiliateLink,
        commission_rate: tool.commission,
        cookie_duration: tool.cookieDuration,
        payout_type: tool.payoutType,
        contact_email: tool.contactEmail,
        status: 'Found',
        notes: tool.notes,
      },
    ]);

  if (error) {
    console.error('Error inserting affiliate data:', error);
    return false;
  } else {
    console.log('Affiliate data saved successfully:', data);
    return true;
  }
}

// Keywords to look for when searching for affiliate programs
const AFFILIATE_KEYWORDS = [
  'affiliate', 'partner', 'referral', 'refer-a-friend', 'refer a friend',
  'commission', 'earn', 'rewards'
];

// Function to check if a URL is valid
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Function to normalize URL
const normalizeUrl = (url, baseUrl) => {
  if (!url) return null;
  
  try {
    // If it's already a full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's a relative URL
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.origin}${url}`;
    }
    
    // If it's a relative URL without leading slash
    const base = new URL(baseUrl);
    return `${base.origin}/${url}`;
  } catch (e) {
    console.error(`Error normalizing URL: ${url} with base ${baseUrl}`, e);
    return null;
  }
};

// Function to search for affiliate links on a webpage
const findAffiliateLinks = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const links = [];
    
    // Look for links containing affiliate keywords
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().toLowerCase();
      
      if (!href) return;
      
      const hasAffiliateKeyword = AFFILIATE_KEYWORDS.some(keyword => 
        text.includes(keyword) || href.toLowerCase().includes(keyword)
      );
      
      if (hasAffiliateKeyword) {
        links.push({
          url: normalizeUrl(href, url),
          text: $(element).text().trim()
        });
      }
    });
    
    return links;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return [];
  }
};

// Function to search Google for affiliate programs
const searchGoogleForAffiliateProgram = async (toolName, browser) => {
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    const searchQuery = `${toolName} affiliate program`;
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Extract search results
    const results = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .filter(link => {
          const href = link.href;
          return href && 
                 href.startsWith('http') && 
                 !href.includes('google.com') &&
                 !href.includes('youtube.com');
        })
        .map(link => ({
          url: link.href,
          text: link.textContent
        }))
        .slice(0, 5); // Get top 5 results
    });
    
    await page.close();
    
    // Filter results that might be affiliate program pages
    return results.filter(result => {
      const lowerText = result.text.toLowerCase();
      return AFFILIATE_KEYWORDS.some(keyword => lowerText.includes(keyword));
    });
  } catch (error) {
    console.error(`Error searching Google for ${toolName}:`, error.message);
    return [];
  }
};

// Function to extract commission details from a page
const extractCommissionDetails = async (url, browser) => {
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    const pageContent = await page.content();
    const $ = cheerio.load(pageContent);
    
    // Extract text content
    const textContent = $('body').text().toLowerCase();
    
    // Look for commission rate patterns
    let commissionRate = null;
    const commissionPatterns = [
      /(\d+(?:\.\d+)?%\s*(?:commission|per\s*sale))/i,
      /(earn\s*\$?\d+(?:\.\d+)?(?:\s*-\s*\$?\d+(?:\.\d+)?)?(?:\s*per\s*sale)?)/i,
      /(pay(?:s|ing|ment)?\s*\$?\d+(?:\.\d+)?(?:\s*-\s*\$?\d+(?:\.\d+)?)?(?:\s*per\s*sale)?)/i
    ];
    
    for (const pattern of commissionPatterns) {
      const match = textContent.match(pattern);
      if (match && match[1]) {
        commissionRate = match[1].trim();
        break;
      }
    }
    
    // Look for cookie duration patterns
    let cookieDuration = null;
    const cookiePatterns = [
      /(\d+(?:-\d+)?\s*(?:day|month|year)s?\s*cookie)/i,
      /(cookie\s*(?:duration|period|lifetime)(?:\s*of)?\s*\d+(?:-\d+)?\s*(?:day|month|year)s?)/i
    ];
    
    for (const pattern of cookiePatterns) {
      const match = textContent.match(pattern);
      if (match && match[1]) {
        cookieDuration = match[1].trim();
        break;
      }
    }
    
    // Look for program details (payout type)
    let payoutType = null;
    const programPatterns = [
      /(revenue\s*share|rev\s*share)/i,
      /(cost\s*per\s*acquisition|cpa)/i,
      /(cost\s*per\s*lead|cpl)/i,
      /(pay\s*per\s*click|ppc)/i
    ];
    
    for (const pattern of programPatterns) {
      const match = textContent.match(pattern);
      if (match && match[1]) {
        payoutType = match[1].trim();
        break;
      }
    }
    
    // Look for contact email
    let contactEmail = null;
    const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i;
    const emailMatch = pageContent.match(emailPattern);
    
    if (emailMatch && emailMatch[1]) {
      contactEmail = emailMatch[1].trim();
    }
    
    await page.close();
    
    return {
      commissionRate,
      cookieDuration,
      payoutType,
      contactEmail
    };
  } catch (error) {
    console.error(`Error extracting commission details from ${url}:`, error.message);
    return {
      commissionRate: null,
      cookieDuration: null,
      payoutType: null,
      contactEmail: null
    };
  }
};

// Main function to process a tool
const processTool = async (tool, browser) => {
  console.log(`Processing tool: ${tool.name} (${tool.website})`);
  
  try {
    // Normalize website URL
    let websiteUrl = tool.website;
    if (!websiteUrl.startsWith('http')) {
      websiteUrl = `https://${websiteUrl}`;
    }
    
    // Step 1: Visit the website and look for affiliate links
    console.log(`Searching for affiliate links on ${websiteUrl}`);
    const affiliateLinks = await findAffiliateLinks(websiteUrl);
    
    // Step 2: If no affiliate links found, search Google
    let finalAffiliateUrl = null;
    let commissionDetails = {
      commissionRate: null,
      cookieDuration: null,
      payoutType: null,
      contactEmail: null
    };
    let notes = "";
    
    if (affiliateLinks.length > 0) {
      console.log(`Found ${affiliateLinks.length} potential affiliate links`);
      // Use the first affiliate link found
      finalAffiliateUrl = affiliateLinks[0].url;
      notes = "Found on website";
      
      // Extract commission details from the affiliate page
      commissionDetails = await extractCommissionDetails(finalAffiliateUrl, browser);
    } else {
      console.log(`No affiliate links found on website, searching Google for ${tool.name}`);
      const googleResults = await searchGoogleForAffiliateProgram(tool.name, browser);
      
      if (googleResults.length > 0) {
        console.log(`Found ${googleResults.length} potential affiliate links from Google`);
        finalAffiliateUrl = googleResults[0].url;
        notes = "Found via Google search";
        
        // Extract commission details from the affiliate page
        commissionDetails = await extractCommissionDetails(finalAffiliateUrl, browser);
      } else {
        notes = "No affiliate program found";
      }
    }
    
    // Save the data to Supabase using the provided function
    const toolData = {
      name: tool.name,
      website: websiteUrl,
      affiliateLink: finalAffiliateUrl,
      commission: commissionDetails.commissionRate,
      cookieDuration: commissionDetails.cookieDuration,
      payoutType: commissionDetails.payoutType,
      contactEmail: commissionDetails.contactEmail,
      notes: notes
    };
    
    const success = await saveAffiliateData(toolData);
    
    if (success) {
      console.log(`Successfully processed ${tool.name}`);
    } else {
      console.error(`Failed to save data for ${tool.name}`);
    }
    
    return success;
  } catch (error) {
    console.error(`Error processing ${tool.name}:`, error.message);
    return false;
  }
};

// Main function to run the scraper
const runScraper = async () => {
  console.log('Starting affiliate program scraper...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Get tools to process from the sample list
    // In a real scenario, you might fetch this from a database or file
    const tools = [
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
    
    console.log(`Found ${tools.length} tools to process`);
    
    // Process each tool
    for (const tool of tools) {
      await processTool(tool, browser);
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('All tools have been processed!');
  } catch (error) {
    console.error('Error in scraper:', error);
  } finally {
    await browser.close();
  }
};

// Start the scraper
runScraper().catch(console.error);
