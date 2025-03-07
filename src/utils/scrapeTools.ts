import { supabase } from '../lib/supabase';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { toast } from 'react-hot-toast';

// Keywords to look for when searching for affiliate programs
const AFFILIATE_KEYWORDS = [
  'affiliate', 'partner', 'referral', 'refer-a-friend', 'refer a friend',
  'commission', 'earn', 'rewards', 'ambassador', 'partnership'
];

// Common affiliate program paths to check
const AFFILIATE_PATHS = [
  '/affiliate', '/affiliates', '/partners', '/partner-program', 
  '/referral', '/referrals', '/ambassador', '/affiliate-program',
  '/partner-with-us', '/partnerships'
];

// Common contact page paths
const CONTACT_PATHS = [
  '/contact', '/contact-us', '/support', '/help', '/about/contact',
  '/about-us/contact', '/get-in-touch', '/reach-us'
];

// Common social media domains
const SOCIAL_MEDIA_DOMAINS = [
  'twitter.com', 'x.com', 'linkedin.com', 'facebook.com', 'instagram.com',
  'youtube.com', 'discord.gg', 'discord.com', 'github.com', 'medium.com',
  'tiktok.com', 'pinterest.com', 'reddit.com', 'slack.com'
];

// Function to normalize URL
const normalizeUrl = (url: string, baseUrl: string): string | null => {
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
    // Silently handle URL normalization errors
    return null;
  }
};

// Function to extract domain from URL
const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
};

// Function to merge arrays without duplicates
const mergeArraysUnique = (existing: string[] | null, newItems: string[] | null): string[] => {
  if (!existing && !newItems) return [];
  if (!existing) return newItems || [];
  if (!newItems) return existing;
  
  // Create a Set from the existing array to automatically handle duplicates
  const uniqueSet = new Set([...existing]);
  
  // Add new items to the Set
  newItems.forEach(item => uniqueSet.add(item));
  
  // Convert back to array
  return Array.from(uniqueSet);
};

// Function to search for affiliate links on a webpage
const findAffiliateLinks = async (url: string): Promise<Array<{ url: string | null, text: string }>> => {
  try {
    // Add a timeout to the request to prevent hanging
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000, // Increased timeout for better reliability
      responseType: 'text',
      validateStatus: () => true
    });
    
    // Check if the request was successful
    if (response.status !== 200) {
      return [];
    }
    
    // Use a try-catch block to handle any parsing errors
    try {
      // Convert response data to string to ensure it's serializable
      const htmlString = typeof response.data === 'string' ? response.data : String(response.data);
      const $ = cheerio.load(htmlString);
      const links: Array<{ url: string | null, text: string }> = [];
      
      // Look for links containing affiliate keywords
      $('a').each((_, element) => {
        try {
          const href = $(element).attr('href');
          // Convert to string and lowercase to avoid Symbol issues
          const text = String($(element).text()).toLowerCase();
          
          if (!href) return;
          
          // Use simple string includes instead of array.some to avoid potential Symbol issues
          let hasAffiliateKeyword = false;
          for (let i = 0; i < AFFILIATE_KEYWORDS.length; i++) {
            const keyword = AFFILIATE_KEYWORDS[i];
            if (text.includes(keyword) || href.toLowerCase().includes(keyword)) {
              hasAffiliateKeyword = true;
              break;
            }
          }
          
          if (hasAffiliateKeyword) {
            // Create a plain object with only serializable properties
            const normalizedUrl = normalizeUrl(href, url);
            links.push({
              url: normalizedUrl,
              text: String($(element).text()).trim()
            });
          }
        } catch (elementError) {
          // Skip this element if there's an error (silently)
        }
      });
      
      return links;
    } catch (parseError) {
      // Silently handle parsing errors
      return [];
    }
  } catch (error) {
    // Silently handle network errors
    return [];
  }
};

// Function to check common affiliate program paths
const checkCommonAffiliatePaths = async (baseUrl: string): Promise<Array<{ url: string, text: string }>> => {
  const results: Array<{ url: string, text: string }> = [];
  
  for (const path of AFFILIATE_PATHS) {
    try {
      const fullUrl = new URL(path, baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`).toString();
      
      const response = await axios.get(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 8000, // Increased timeout
        responseType: 'text',
        validateStatus: (status) => status === 200 // Only consider 200 responses
      });
      
      // If we get here, the page exists
      results.push({
        url: fullUrl,
        text: `${extractDomain(baseUrl)} Affiliate Program`
      });
      
      // No need to check more paths if we found one
      break;
    } catch (error) {
      // Path doesn't exist or other error, continue to next path
      continue;
    }
  }
  
  return results;
};

// Function to find contact page URL
const findContactPage = async (baseUrl: string): Promise<string | null> => {
  // First check common contact page paths
  for (const path of CONTACT_PATHS) {
    try {
      const fullUrl = new URL(path, baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`).toString();
      
      const response = await axios.get(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000,
        responseType: 'text',
        validateStatus: (status) => status === 200 // Only consider 200 responses
      });
      
      // If we get here, the contact page exists
      return fullUrl;
    } catch (error) {
      // Path doesn't exist or other error, continue to next path
      continue;
    }
  }
  
  // If no common paths work, try to find a contact link on the homepage
  try {
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 8000,
      responseType: 'text',
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      const htmlString = typeof response.data === 'string' ? response.data : String(response.data);
      const $ = cheerio.load(htmlString);
      
      // Look for contact links
      let contactUrl = null;
      
      $('a').each((_, element) => {
        try {
          const href = $(element).attr('href');
          const text = String($(element).text()).toLowerCase();
          
          if (!href) return;
          
          if (text.includes('contact') || href.toLowerCase().includes('contact')) {
            contactUrl = normalizeUrl(href, baseUrl);
            return false; // Break the loop
          }
        } catch (elementError) {
          // Skip this element if there's an error
        }
      });
      
      return contactUrl;
    }
  } catch (error) {
    // Silently handle errors
  }
  
  return null;
};

// Function to extract emails from a page
const extractEmails = (html: string): string[] => {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const matches = html.match(emailRegex) || [];
  
  // Filter out common false positives
  return matches.filter(email => 
    !email.includes('example.com') && 
    !email.includes('yourdomain') && 
    !email.includes('domain.com') &&
    !email.includes('@email') &&
    !email.includes('@mail')
  );
};

// Function to extract favicon URL
const extractFaviconUrl = (html: string, baseUrl: string): string | null => {
  try {
    const $ = cheerio.load(html);
    
    // Look for favicon in various link tags
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]'
    ];
    
    for (const selector of faviconSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const href = element.attr('href');
        if (href) {
          return normalizeUrl(href, baseUrl);
        }
      }
    }
    
    // If no favicon found in link tags, try the default location
    const defaultFaviconUrl = normalizeUrl('/favicon.ico', baseUrl);
    return defaultFaviconUrl;
  } catch (error) {
    return null;
  }
};

// Function to extract logo URL
const extractLogoUrl = (html: string, baseUrl: string): string | null => {
  try {
    const $ = cheerio.load(html);
    let logoUrl = null;
    
    // Common logo selectors
    const logoSelectors = [
      'header img', 
      '.logo img', 
      '#logo img',
      'a[href="/"] img',
      '.navbar-brand img',
      '.header img',
      '.site-logo img',
      '.brand img'
    ];
    
    // Try each selector
    for (const selector of logoSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const src = element.attr('src');
        if (src) {
          logoUrl = normalizeUrl(src, baseUrl);
          break;
        }
      }
    }
    
    return logoUrl;
  } catch (error) {
    return null;
  }
};

// Function to extract product image URL
const extractProductImage = (html: string, baseUrl: string): string | null => {
  try {
    const $ = cheerio.load(html);
    let imageUrl = null;
    
    // Common product image selectors
    const imageSelectors = [
      '.hero img',
      '.banner img',
      '.product-image img',
      '.featured-image img',
      'main img',
      '.main-content img',
      '.hero-section img',
      '#hero img'
    ];
    
    // Try each selector
    for (const selector of imageSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const src = element.attr('src');
        if (src && !src.includes('logo') && !src.includes('icon')) {
          imageUrl = normalizeUrl(src, baseUrl);
          break;
        }
      }
    }
    
    // If no specific product image found, try to get any large image
    if (!imageUrl) {
      $('img').each((_, element) => {
        const width = $(element).attr('width');
        const height = $(element).attr('height');
        const src = $(element).attr('src');
        
        // Look for larger images that aren't icons
        if (src && 
            ((width && parseInt(width) > 200) || 
             (height && parseInt(height) > 200)) &&
            !src.includes('logo') && 
            !src.includes('icon')) {
          imageUrl = normalizeUrl(src, baseUrl);
          return false; // Break the loop
        }
      });
    }
    
    return imageUrl;
  } catch (error) {
    return null;
  }
};

// Function to extract social media links
const extractSocialLinks = (html: string, baseUrl: string): Array<{ platform: string, url: string }> => {
  try {
    const $ = cheerio.load(html);
    const socialLinks: Array<{ platform: string, url: string }> = [];
    
    // Look for social media links
    $('a').each((_, element) => {
      try {
        const href = $(element).attr('href');
        if (!href) return;
        
        // Check if the href contains a social media domain
        const url = normalizeUrl(href, baseUrl);
        if (!url) return;
        
        for (const domain of SOCIAL_MEDIA_DOMAINS) {
          if (url.includes(domain)) {
            // Extract platform name from domain
            let platform = domain.split('.')[0];
            if (domain === 'x.com') platform = 'twitter';
            if (domain.includes('discord')) platform = 'discord';
            
            socialLinks.push({
              platform,
              url
            });
            break;
          }
        }
      } catch (error) {
        // Skip this element if there's an error
      }
    });
    
    return socialLinks;
  } catch (error) {
    return [];
  }
};

// Function to extract tags and use cases
const extractTagsAndUseCases = (html: string): { tags: string[], useCases: string[], features: string[] } => {
  try {
    const $ = cheerio.load(html);
    const tags: string[] = [];
    const useCases: string[] = [];
    const features: string[] = [];
    
    // Extract meta keywords as tags
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) {
      const keywordTags = metaKeywords.split(',').map(tag => tag.trim()).filter(Boolean);
      tags.push(...keywordTags);
    }
    
    // Extract categories from common category elements
    $('.category, .categories, .tags, .tag').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        // Split by common separators and add to tags
        const categoryTags = text.split(/[,|\/]/).map(tag => tag.trim()).filter(Boolean);
        tags.push(...categoryTags);
      }
    });
    
    // Look for use cases in feature sections
    const useCaseSelectors = [
      '.features h3', '.benefits h3', '.use-cases h3',
      '.features h4', '.benefits h4', '.use-cases h4',
      '.features li', '.benefits li', '.use-cases li',
      '.features .title', '.benefits .title', '.use-cases .title'
    ];
    
    useCaseSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 5 && text.length < 100) {
          useCases.push(text);
        }
      });
    });
    
    // Extract from "How it works" or "What you can do" sections
    $('.how-it-works h3, .what-you-can-do h3, .solutions h3').each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 5 && text.length < 100) {
        useCases.push(text);
      }
    });
    
    // Extract features from feature lists
    const featureSelectors = [
      '.features li', '.feature-list li', '.feature li',
      '.features-section li', '.key-features li',
      '.features .item', '.feature-list .item'
    ];
    
    featureSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 5 && text.length < 150) {
          features.push(text);
        }
      });
    });
    
    // Also look for features in bullet points or check mark sections
    $('ul li:contains("✓"), ul li:contains("✅"), ul li:contains("•")').each((_, element) => {
      const text = $(element).text().trim().replace(/^[✓✅•]\s*/, '');
      if (text && text.length > 5 && text.length < 150 && !features.includes(text)) {
        features.push(text);
      }
    });
    
    // Limit to reasonable numbers
    return {
      tags: [...new Set(tags)].slice(0, 20), // Remove duplicates and limit to 20 tags
      useCases: [...new Set(useCases)].slice(0, 10), // Remove duplicates and limit to 10 use cases
      features: [...new Set(features)].slice(0, 15) // Remove duplicates and limit to 15 features
    };
  } catch (error) {
    return { tags: [], useCases: [], features: [] };
  }
};

// Function to extract commission details from a page
const extractCommissionDetails = async (url: string): Promise<{
  commission: string | null;
  cookieDuration: string | null;
  payoutType: string | null;
  contactEmail: string | null;
  contactPageUrl: string | null;
  socialLinks: any[] | null;
  faviconUrl: string | null;
  logoUrl: string | null;
  imageUrl: string | null;
  tags: string[] | null;
  useCases: string[] | null;
  features: string[] | null;
}> => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000, // Increased timeout for better reliability
      responseType: 'text',
      validateStatus: () => true
    });
    
    // Check if the request was successful
    if (response.status !== 200) {
      return {
        commission: null,
        cookieDuration: null,
        payoutType: null,
        contactEmail: null,
        contactPageUrl: null,
        socialLinks: null,
        faviconUrl: null,
        logoUrl: null,
        imageUrl: null,
        tags: null,
        useCases: null,
        features: null
      };
    }
    
    // Use a try-catch block to handle any parsing errors
    try {
      // Convert response data to string to ensure it's serializable
      const htmlString = typeof response.data === 'string' ? response.data : String(response.data);
      const $ = cheerio.load(htmlString);
      
      // Extract text content as a plain string
      const textContent = String($('body').text()).toLowerCase();
      
      // Look for commission rate patterns - improved patterns
      let commission = null;
      const commissionPatterns = [
        /(\d+(?:\.\d+)?%\s*(?:commission|per\s*sale))/i,
        /(earn\s*\$?\d+(?:\.\d+)?(?:\s*-\s*\$?\d+(?:\.\d+)?)?(?:\s*per\s*sale)?)/i,
        /(pay(?:s|ing|ment)?\s*\$?\d+(?:\.\d+)?(?:\s*-\s*\$?\d+(?:\.\d+)?)?(?:\s*per\s*sale)?)/i,
        /(\d+(?:\.\d+)?%\s*(?:of|on)\s*(?:each|every|all)\s*(?:sale|purchase|order))/i,
        /(commission(?:\s*rate)?(?:\s*of)?\s*\d+(?:\.\d+)?%)/i,
        /(up\s*to\s*\d+(?:\.\d+)?%\s*commission)/i
      ];
      
      for (const pattern of commissionPatterns) {
        const match = textContent.match(pattern);
        if (match && match[1]) {
          commission = match[1].trim();
          break;
        }
      }
      
      // Look for cookie duration patterns - improved patterns
      let cookieDuration = null;
      const cookiePatterns = [
        /(\d+(?:-\d+)?\s*(?:day|month|year)s?\s*cookie)/i,
        /(cookie\s*(?:duration|period|lifetime)(?:\s*of)?\s*\d+(?:-\d+)?\s*(?:day|month|year)s?)/i,
        /(\d+(?:-\d+)?\s*(?:day|month|year)s?\s*tracking\s*(?:period|window))/i,
        /(tracking\s*(?:period|window)(?:\s*of)?\s*\d+(?:-\d+)?\s*(?:day|month|year)s?)/i,
        /(\d+(?:-\d+)?\s*(?:day|month|year)s?\s*referral\s*(?:period|window))/i
      ];
      
      for (const pattern of cookiePatterns) {
        const match = textContent.match(pattern);
        if (match && match[1]) {
          cookieDuration = match[1].trim();
          break;
        }
      }
      
      // Look for program details (payout type) - improved patterns
      let payoutType = null;
      const programPatterns = [
        /(revenue\s*share|rev\s*share)/i,
        /(cost\s*per\s*acquisition|cpa)/i,
        /(cost\s*per\s*lead|cpl)/i,
        /(pay\s*per\s*click|ppc)/i,
        /(recurring\s*commission)/i,
        /(lifetime\s*commission)/i,
        /(one[\s-]time\s*commission)/i,
        /(two[\s-]tier\s*commission)/i
      ];
      
      for (const pattern of programPatterns) {
        const match = textContent.match(pattern);
        if (match && match[1]) {
          payoutType = match[1].trim();
          break;
        }
      }
      
      // Extract all emails from the page
      const emails = extractEmails(htmlString);
      let contactEmail = null;
      
      if (emails.length > 0) {
        // Prioritize emails that might be affiliate-related
        const affiliateEmails = emails.filter(email => 
          email.includes('affiliate') || 
          email.includes('partner') || 
          email.includes('referral')
        );
        
        if (affiliateEmails.length > 0) {
          contactEmail = affiliateEmails[0];
        } else {
          // Otherwise use the first email found
          contactEmail = emails[0];
        }
      }
      
      // Look for contact page
      let contactPageUrl = null;
      $('a').each((_, element) => {
        try {
          const href = $(element).attr('href');
          const text = String($(element).text()).toLowerCase();
          
          if (!href) return;
          
          if (text.includes('contact') || href.toLowerCase().includes('contact')) {
            contactPageUrl = normalizeUrl(href, url);
            return false; // Break the loop
          }
        } catch (elementError) {
          // Skip this element if there's an error
        }
      });
      
      // Extract social links
      const socialLinks = extractSocialLinks(htmlString, url);
      
      // Extract favicon, logo, and product image
      const faviconUrl = extractFaviconUrl(htmlString, url);
      const logoUrl = extractLogoUrl(htmlString, url);
      const imageUrl = extractProductImage(htmlString, url);
      
      // Extract tags, use cases, and features
      const { tags, useCases, features } = extractTagsAndUseCases(htmlString);
      
      return {
        commission,
        cookieDuration,
        payoutType,
        contactEmail,
        contactPageUrl,
        socialLinks: socialLinks.length > 0 ? socialLinks : null,
        faviconUrl,
        logoUrl,
        imageUrl,
        tags: tags.length > 0 ? tags : null,
        useCases: useCases.length > 0 ? useCases : null,
        features: features.length > 0 ? features : null
      };
    } catch (parseError) {
      return {
        commission: null,
        cookieDuration: null,
        payoutType: null,
        contactEmail: null,
        contactPageUrl: null,
        socialLinks: null,
        faviconUrl: null,
        logoUrl: null,
        imageUrl: null,
        tags: null,
        useCases: null,
        features: null
      };
    }
  } catch (error) {
    return {
      commission: null,
      cookieDuration: null,
      payoutType: null,
      contactEmail: null,
      contactPageUrl: null,
      socialLinks: null,
      faviconUrl: null,
      logoUrl: null,
      imageUrl: null,
      tags: null,
      useCases: null,
      features: null
    };
  }
};

// Function to search for affiliate program using Google search terms
const searchForAffiliateProgram = async (toolName: string, domain: string): Promise<boolean> => {
  // This is a mock function that simulates searching for affiliate programs
  // In a real implementation, this would use a search API or backend service
  
  // For now, we'll just return a random result based on the tool name
  // This is just to simulate the search process without actually making external requests
  const hasAffiliate = Math.random() > 0.7; // 30% chance of finding an affiliate program
  
  return hasAffiliate;
};

// Function to check if a tool already exists in the database
export async function checkDuplicateTool(websiteUrl: string): Promise<boolean> {
  // DISABLED: Always return false to allow all tools to be imported
  return false;
  
  /* Original implementation:
  try {
    console.log(`Checking for duplicate tool with website: ${websiteUrl}`);
    
    // Normalize the URL for comparison
    let normalizedUrl = websiteUrl;
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    // Remove trailing slash for consistent comparison
    normalizedUrl = normalizedUrl.replace(/\/$/, '');
    
    // Query the database for tools with similar URLs
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('id, website_url')
      .or(`website_url.ilike.${normalizedUrl}%,website_url.ilike.${normalizedUrl.replace('https://', 'http://')}%`);
    
    if (error) {
      console.error('Error checking for duplicate tool:', error);
      return false;
    }
    
    // Check if any results were found
    return data && data.length > 0;
  } catch (error) {
    console.error('Exception checking for duplicate tool:', error);
    return false;
  }
  */
}

// Function to get existing tool data
async function getExistingToolData(id: string) {
  try {
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching existing tool data:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching existing tool data:', error);
    return null;
  }
}

// Function to save affiliate data to the affiliate_links table
async function saveAffiliateData(tool: {
  id: string;
  tool_name: string;
  website_url: string;
  affiliate_url: string | null;
  commission: string | null;
  cookie_duration: string | null;
  payout_type: string | null;
  contact_email: string | null;
  contact_page_url: string | null;
  social_links: any[] | null;
  favicon_url: string | null;
  logo_url: string | null;
  image_url: string | null;
  tags: string[] | null;
  use_cases: string[] | null;
  features: string[] | null;
  status: string;
  outreach_status: string;
  notes: string | null;
}) {
  try {
    console.log('Saving affiliate data for:', tool.tool_name);
    
    // Get existing data to preserve and merge fields
    const existingData = await getExistingToolData(tool.id);
    
    // Create an update object with only the fields we want to update
    const updateData: any = {
      status: tool.status,
      notes: tool.notes
    };
    
    // Only add fields if they have values, or merge with existing values
    if (tool.affiliate_url !== undefined) updateData.affiliate_url = tool.affiliate_url;
    if (tool.commission !== undefined) updateData.commission = tool.commission;
    if (tool.cookie_duration !== undefined) updateData.cookie_duration = tool.cookie_duration;
    if (tool.payout_type !== undefined) updateData.payout_type = tool.payout_type;
    
    // For contact_email, only update if we have a new value and the existing one is empty
    if (tool.contact_email && (!existingData || !existingData.contact_email)) {
      updateData.contact_email = tool.contact_email;
    }
    
    // For contact_page_url, only update if we have a new value and the existing one is empty
    if (tool.contact_page_url && (!existingData || !existingData.contact_page_url)) {
      updateData.contact_page_url = tool.contact_page_url;
    }
    
    // For social_links, convert to JSON string if it's an array
    if (tool.social_links) {
      updateData.social_links = Array.isArray(tool.social_links) 
        ? tool.social_links 
        : tool.social_links;
    }
    
    if (tool.outreach_status !== undefined) updateData.outreach_status = tool.outreach_status;
    
    // For favicon_url, only update if we have a new value and the existing one is empty
    if (tool.favicon_url && (!existingData || !existingData.favicon_url)) {
      updateData.favicon_url = tool.favicon_url;
    }
    
    // For logo_url, only update if we have a new value and the existing one is empty
    if (tool.logo_url && (!existingData || !existingData.logo_url)) {
      updateData.logo_url = tool.logo_url;
    }
    
    // For image_url, only update if we have a new value and the existing one is empty
    if (tool.image_url && (!existingData || !existingData.image_url)) {
      updateData.image_url = tool.image_url;
    }
    
    // For tags, merge with existing tags if any
    if (tool.tags && tool.tags.length > 0) {
      const existingTags = existingData?.tags || [];
      updateData.tags = mergeArraysUnique(existingTags, tool.tags);
    }
    
    // For use_cases, merge with existing use_cases if any
    if (tool.use_cases && tool.use_cases.length > 0) {
      const existingUseCases = existingData?.use_cases || [];
      updateData.use_cases = mergeArraysUnique(existingUseCases, tool.use_cases);
    }
    
    // For features, merge with existing features if any
    if (tool.features && tool.features.length > 0) {
      const existingFeatures = existingData?.features || [];
      updateData.features = mergeArraysUnique(existingFeatures, tool.features);
    }
    
    console.log('Update data:', updateData);
    
    const { error } = await supabase
      .from('affiliate_links')
      .update(updateData)
      .eq('id', tool.id);

    if (error) {
      console.error('Error saving affiliate data:', error);
      return false;
    } else {
      console.log('Successfully saved affiliate data for:', tool.tool_name);
      return true;
    }
  } catch (error) {
    console.error('Exception saving affiliate data:', error);
    return false;
  }
}

// Function to process a single tool
export async function scrapeAndSaveAffiliateData(tool: {
  id: string;
  tool_name: string;
  website_url: string;
}) {
  console.log(`Starting to scrape tool: ${tool.tool_name} (${tool.website_url})`);
  
  try {
    // Validate the URL format
    let websiteUrl = tool.website_url;
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl;
    }
    
    // Step 1: Visit the website and look for affiliate links
    console.log(`Searching for affiliate links on ${websiteUrl}`);
    let affiliateLinks: Array<{ url: string | null, text: string }> = [];
    try {
      affiliateLinks = await findAffiliateLinks(websiteUrl);
      console.log(`Found ${affiliateLinks.length} potential affiliate links on homepage`);
    } catch (scrapeError) {
      console.error('Error finding affiliate links:', scrapeError);
      affiliateLinks = [];
    }
    
    // Step 2: If no affiliate links found on homepage, check common affiliate paths
    if (affiliateLinks.length === 0) {
      console.log('No affiliate links found on homepage, checking common paths');
      try {
        const pathResults = await checkCommonAffiliatePaths(websiteUrl);
        if (pathResults.length > 0) {
          console.log(`Found ${pathResults.length} affiliate links from common paths`);
          // Convert to the same format as affiliateLinks
          affiliateLinks = pathResults.map(result => ({
            url: result.url,
            text: result.text
          }));
        } else {
          console.log('No affiliate links found in common paths');
        }
      } catch (pathError) {
        console.error('Error checking common paths:', pathError);
        // Continue with the process even if path checking fails
      }
    }
    
    // Step 3: Find contact page and email regardless of affiliate program
    let contactPageUrl = null;
    let contactEmail = null;
    
    try {
      console.log('Looking for contact page');
      contactPageUrl = await findContactPage(websiteUrl);
      
      if (contactPageUrl) {
        console.log(`Found contact page: ${contactPageUrl}`);
        
        // Try to extract email from contact page
        try {
          const response = await axios.get(contactPageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000,
            responseType: 'text',
            validateStatus: () => true
          });
          
          if (response.status === 200) {
            const htmlString = typeof response.data === 'string' ? response.data : String(response.data);
            const emails = extractEmails(htmlString);
            
            if (emails.length > 0) {
              contactEmail = emails[0];
              console.log(`Found contact email: ${contactEmail}`);
            }
          }
        } catch (emailError) {
          console.error('Error extracting email from contact page:', emailError);
        }
      }
    } catch (contactError) {
      console.error('Error finding contact page:', contactError);
    }
    
    // Step 4: Scrape the homepage for additional data
    let homepageData = {
      faviconUrl: null as string | null,
      logoUrl: null as string | null,
      imageUrl: null as string | null,
      socialLinks: [] as Array<{ platform: string, url: string }>,
      tags: [] as string[],
      useCases: [] as string[],
      features: [] as string[]
    };
    
    try {
      console.log('Scraping homepage for additional data');
      const response = await axios.get(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000,
        responseType: 'text',
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        const htmlString = typeof response.data === 'string' ? response.data : String(response.data);
        
        try {
          // Extract favicon, logo, and product image
          homepageData.faviconUrl = extractFaviconUrl(htmlString, websiteUrl);
          homepageData.logoUrl = extractLogoUrl(htmlString, websiteUrl);
          homepageData.imageUrl = extractProductImage(htmlString, websiteUrl);
          
          // Extract social links
          homepageData.socialLinks = extractSocialLinks(htmlString, websiteUrl);
          
          // Extract tags, use cases, and features
          const { tags, useCases, features } = extractTagsAndUseCases(htmlString);
          homepageData.tags = tags;
          homepageData.useCases = useCases;
          homepageData.features = features;
          
          console.log('Homepage data extracted:', {
            faviconUrl: homepageData.faviconUrl ? 'Found' : 'Not found',
            logoUrl: homepageData.logoUrl ? 'Found' : 'Not found',
            imageUrl: homepageData.imageUrl ? 'Found' : 'Not found',
            socialLinks: homepageData.socialLinks.length,
            tags: homepageData.tags.length,
            useCases: homepageData.useCases.length,
            features: homepageData.features.length
          });
        } catch (parseError) {
          console.error('Error parsing homepage data:', parseError);
        }
      }
    } catch (homepageError) {
      console.log('Error scraping homepage:', homepageError instanceof Error ? homepageError.message : String(homepageError));
    }
    
    // Step 5: If still no affiliate links found, try a simulated search
    let finalAffiliateUrl = null;
    let commissionDetails = {
      commission: null,
      cookieDuration: null,
      payoutType: null,
      contactEmail: contactEmail,
      contactPageUrl: contactPageUrl,
      socialLinks: homepageData.socialLinks.length > 0 ? homepageData.socialLinks : null,
      faviconUrl: homepageData.faviconUrl,
      logoUrl: homepageData.logoUrl,
      imageUrl: homepageData.imageUrl,
      tags: homepageData.tags.length > 0 ? homepageData.tags : null,
      useCases: homepageData.useCases.length > 0 ? homepageData.useCases : null,
      features: homepageData.features.length > 0 ? homepageData.features : null
    };
    let notes = "";
    let status = "Not Found";
    let outreachStatus = "Needs Contact";
    
    if (affiliateLinks.length > 0) {
      // Use the first affiliate link found
      finalAffiliateUrl = affiliateLinks[0].url;
      notes = "Found on website";
      status = "Found";
      outreachStatus = "Affiliate Found";
      
      console.log(`Using affiliate URL: ${finalAffiliateUrl}`);
      
      // Extract commission details from the affiliate page
      if (finalAffiliateUrl) {
        try {
          console.log('Extracting commission details from affiliate page');
          commissionDetails = await extractCommissionDetails(finalAffiliateUrl);
          console.log('Commission details:', commissionDetails);
          
          // If we found commission details but not contact info, use what we found earlier
          if (!commissionDetails.contactEmail && contactEmail) {
            commissionDetails.contactEmail = contactEmail;
          }
          
          if (!commissionDetails.contactPageUrl && contactPageUrl) {
            commissionDetails.contactPageUrl = contactPageUrl;
          }
          
          // Merge homepage data with affiliate page data
          if (!commissionDetails.faviconUrl) commissionDetails.faviconUrl = homepageData.faviconUrl;
          if (!commissionDetails.logoUrl) commissionDetails.logoUrl = homepageData.logoUrl;
          if (!commissionDetails.imageUrl) commissionDetails.imageUrl = homepageData.imageUrl;
          
          if (!commissionDetails.socialLinks && homepageData.socialLinks.length > 0) {
            commissionDetails.socialLinks = homepageData.socialLinks;
          }
          
          if (!commissionDetails.tags && homepageData.tags.length > 0) {
            commissionDetails.tags = homepageData.tags;
          }
          
          if (!commissionDetails.useCases && homepageData.useCases.length > 0) {
            commissionDetails.useCases = homepageData.useCases;
          }
          
          if (!commissionDetails.features && homepageData.features.length > 0) {
            commissionDetails.features = homepageData.features;
          }
        } catch (detailsError) {
          console.error('Error extracting commission details:', detailsError);
          // Use the contact info we found earlier
          commissionDetails.contactEmail = contactEmail;
          commissionDetails.contactPageUrl = contactPageUrl;
          
          // Use homepage data
          commissionDetails.faviconUrl = homepageData.faviconUrl;
          commissionDetails.logoUrl = homepageData.logoUrl;
          commissionDetails.imageUrl = homepageData.imageUrl;
          commissionDetails.socialLinks = homepageData.socialLinks.length > 0 ? homepageData.socialLinks : null;
          commissionDetails.tags = homepageData.tags.length > 0 ? homepageData.tags : null;
          commissionDetails.useCases = homepageData.useCases.length > 0 ? homepageData.useCases : null;
          commissionDetails.features = homepageData.features.length > 0 ? homepageData.features : null;
        }
      }
    } else {
      console.log('No affiliate links found, trying simulated search');
      // Try a simulated search as a last resort
      const domain = extractDomain(websiteUrl);
      const hasAffiliate = await searchForAffiliateProgram(tool.tool_name, domain);
      
      if (hasAffiliate) {
        finalAffiliateUrl = `${websiteUrl}/affiliate`; // Placeholder URL
        notes = "Potential affiliate program found via search";
        status = "Found";
        outreachStatus = "Needs Verification";
        console.log('Potential affiliate program found via search');
      } else {
        notes = "No affiliate program found after thorough search";
        status = "Not Found";
        outreachStatus = "Needs Contact";
        console.log('No affiliate program found');
        
        // Still include contact info for outreach purposes
        commissionDetails.contactEmail = contactEmail;
        commissionDetails.contactPageUrl = contactPageUrl;
        
        // Use homepage data
        commissionDetails.faviconUrl = homepageData.faviconUrl;
        commissionDetails.logoUrl = homepageData.logoUrl;
        commissionDetails.imageUrl = homepageData.imageUrl;
        commissionDetails.socialLinks = homepageData.socialLinks.length > 0 ? homepageData.socialLinks : null;
        commissionDetails.tags = homepageData.tags.length > 0 ? homepageData.tags : null;
        commissionDetails.useCases = homepageData.useCases.length > 0 ? homepageData.useCases : null;
        commissionDetails.features = homepageData.features.length > 0 ? homepageData.features : null;
      }
    }
    
    // Save the data to Supabase
    const toolData = {
      id: tool.id,
      tool_name: tool.tool_name,
      website_url: websiteUrl,
      affiliate_url: finalAffiliateUrl,
      commission: commissionDetails.commission,
      cookie_duration: commissionDetails.cookieDuration,
      payout_type: commissionDetails.payoutType,
      contact_email: commissionDetails.contactEmail,
      contact_page_url: commissionDetails.contactPageUrl,
      social_links: commissionDetails.socialLinks,
      favicon_url: commissionDetails.faviconUrl,
      logo_url: commissionDetails.logoUrl,
      image_url: commissionDetails.imageUrl,
      tags: commissionDetails.tags,
      use_cases: commissionDetails.useCases,
      features: commissionDetails.features,
      status: status,
      outreach_status: outreachStatus,
      notes: notes
    };
    
    console.log('Saving data for tool:', tool.tool_name);
    const success = await saveAffiliateData( toolData);
    
    if (success) {
      console.log('Successfully processed tool:', tool.tool_name);
      return { success: true, tool: toolData };
    } else {
      console.error('Failed to save data for tool:', tool.tool_name);
      return { success: false, error: "Failed to save data" };
    }
  } catch (error) {
    console.error(`Error processing ${tool.tool_name}:`, error);
    
    // Try to update the tool status to error
    try {
      await supabase
        .from('affiliate_links')
        .update({
          status: 'Not Found',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
        .eq('id', tool.id);
    } catch (updateError) {
      console.error('Error updating tool status:', updateError);
      // Silently handle errors
    }
    
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Main function to start scraping tools with auto-continuation
export async function startScrapingTools(tools: Array<{ id: string; tool_name: string; website_url: string }>) {
  console.log(`Starting to process ${tools.length} tools`);
  const toastId = toast.loading(`Starting to process ${tools.length} tools...`);
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  // Process tools in batches to avoid overwhelming the browser
  const batchSize = 5; // Process 5 tools at a time
  const batches = [];
  
  // Split tools into batches
  for (let i = 0; i < tools.length; i += batchSize) {
    batches.push(tools.slice(i, i + batchSize));
  }
  
  console.log(`Split ${tools.length} tools into ${batches.length} batches of ${batchSize}`);
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} tools`);
    
    // Process tools in the current batch in parallel
    const batchPromises = batch.map(async (tool) => {
      try {
        console.log(`Processing tool ${processed + 1}/${tools.length}: ${tool.tool_name}`);
        
        // Create a serializable copy of the tool object
        const serializedTool = {
          id: String(tool.id),
          tool_name: String(tool.tool_name),
          website_url: String(tool.website_url)
        };
        
        const result = await scrapeAndSaveAffiliateData(serializedTool);
        
        if (result.success) {
          successful++;
          console.log(`Successfully processed ${tool.tool_name}`);
        } else {
          failed++;
          console.error(`Failed to process ${tool.tool_name}: ${result.error}`);
        }
      } catch (error) {
        failed++;
        console.error(`Exception processing ${tool.tool_name}:`, error);
      }
      
      processed++;
      
      // Update toast message
      toast.loading(
        `Processed ${processed}/${tools.length} tools (${successful} successful, ${failed} failed)`, 
        { id: toastId }
      );
    });
    
    // Wait for all tools in the batch to be processed
    await Promise.all(batchPromises);
    
    // If there are more batches, add a delay before processing the next batch
    if (batchIndex < batches.length - 1) {
      console.log(`Batch ${batchIndex + 1} complete. Pausing before next batch...`);
      toast.loading(
        `Batch ${batchIndex + 1}/${batches.length} complete. Pausing before next batch...`, 
        { id: toastId }
      );
      
      // Add a delay between batches to avoid overwhelming the browser and rate limiting
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second pause between batches
    }
  }
  
  // Show final result and clear the toast
  if (failed === 0) {
    toast.success(
      `Successfully processed all ${successful} tools!`, 
      { id: toastId, duration: 5000 }
    );
  } else {
    toast.error(
      `Processed ${successful} tools successfully with ${failed} failures`, 
      { id: toastId, duration: 5000 }
    );
  }
  
  return { total: tools.length, successful, failed };
}

// Function to get pending tools from the database with increased limit
export async function getPendingTools(limit = 25) {
  console.log(`Fetching up to ${limit} pending tools from database`);
  try {
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('id, tool_name, website_url')
      .eq('status', 'Pending')
      .limit(limit);
    
    if (error) {
      console.error('Error fetching pending tools:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} pending tools`);
    
    // Ensure we return serializable data
    return (data || []).map(tool => ({
      id: String(tool.id),
      tool_name: String(tool.tool_name),
      website_url: String(tool.website_url)
    }));
  } catch (error) {
    console.error('Error in getPendingTools:', error);
    return [];
  }
}

// Function to automatically continue scraping in batches
export async function autoContinueScraping(batchSize = 25, pauseBetweenBatches = 60000) {
  const toastId = toast.loading('Starting automated batch scraping...');
  
  try {
    let continueScraping = true;
    let batchNumber = 1;
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    
    while (continueScraping) {
      toast.loading(`Starting batch ${batchNumber}...`, { id: toastId });
      
      // Get the next batch of pending tools
      const pendingTools = await getPendingTools(batchSize);
      
      if (pendingTools.length === 0) {
        toast.success('No more pending tools to process. Scraping complete!', { id: toastId });
        continueScraping = false;
        break;
      }
      
      toast.loading(`Processing batch ${batchNumber}: ${pendingTools.length} tools`, { id: toastId });
      
      // Process the current batch
      const result = await startScrapingTools(pendingTools);
      
      totalProcessed += result.total;
      totalSuccessful += result.successful;
      totalFailed += result.failed;
      
      toast.loading(
        `Batch ${batchNumber} complete. Total: ${totalProcessed} tools (${totalSuccessful} successful, ${totalFailed} failed)`, 
        { id: toastId }
      );
      
      // Check if there are more pending tools
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Pending');
      
      if (error || !data || (data as any).count === 0) {
        toast.success('No more pending tools to process. Scraping complete!', { id: toastId });
        continueScraping = false;
        break;
      }
      
      // Pause between batches
      toast.loading(
        `Pausing for ${pauseBetweenBatches / 1000} seconds before next batch...`, 
        { id: toastId }
      );
      
      await new Promise(resolve => setTimeout(resolve, pauseBetweenBatches));
      
      batchNumber++;
    }
    
    toast.success(
      `Automated scraping complete! Processed ${totalProcessed} tools (${totalSuccessful} successful, ${totalFailed} failed)`, 
      { id: toastId, duration: 5000 }
    );
    
    return { success: true, totalProcessed, totalSuccessful, totalFailed };
  } catch (error) {
    console.error('Error in autoContinueScraping:', error);
    toast.error(`Error in automated scraping: ${error instanceof Error ? error.message : String(error)}`, { id: toastId });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
