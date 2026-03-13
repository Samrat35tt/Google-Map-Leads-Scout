
import { Lead } from '../types';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

// We use the Google Search Scraper Actor (apify/google-search-scraper) for generic leads
const SEARCH_ACTOR_ENDPOINT = `/api/apify/search`;

// Endpoint for Meta Ads Library Scraper
const ADS_ACTOR_ENDPOINT = `/api/apify/ads`;

// Safe UUID generator
const safeUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const searchLinkedInLeadsWithApify = async (role: string, location: string, industry: string): Promise<Lead[]> => {
  return searchSocialMediaLeads('linkedin', role, location, industry);
};

export const searchSocialMediaLeads = async (
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter', 
  keyword: string, 
  location: string, 
  additionalContext: string = ''
): Promise<Lead[]> => {
  let query = '';
  switch (platform) {
    case 'linkedin': query = `site:linkedin.com/in/ "${keyword}" "${location}" ${additionalContext}`.trim(); break;
    case 'facebook': query = `site:facebook.com/pages "${keyword}" "${location}"`.trim(); break;
    case 'instagram': query = `site:instagram.com "${keyword}" "${location}" (physiotherapist OR "coach" OR "founder")`.trim(); break;
    case 'twitter': query = `site:twitter.com "${keyword}" "${location}"`.trim(); break;
  }

  try {
    const response = await fetch(SEARCH_ACTOR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: query,           
        resultsPerPage: 10,       
        maxPagesPerQuery: 1,      
        mobileResults: false,     
      }),
    });

    if (!response.ok) {
       // If Google Scraper fails, fall back to empty array to handle gracefully
       console.warn("Apify Search Failed:", response.status);
       return [];
    }

    const datasetItems = await response.json();
    if (!Array.isArray(datasetItems)) return [];

    const leads: Lead[] = [];
    datasetItems.forEach((page: any) => {
      if (page.organicResults && Array.isArray(page.organicResults)) {
        page.organicResults.forEach((result: any) => {
          if (!result.url) return;
          if (platform === 'linkedin' && !result.url.includes('/in/')) return;

          let name = "Unknown Profile";
          let category = keyword; 
          const parts = result.title.split(/ [-–|] /); 
          if (parts.length > 0) name = parts[0].trim();
          if (parts.length > 1) category = parts[1].trim();
          
          name = name.replace(/ \| LinkedIn$/, '').replace(/ \| Facebook$/, '').replace(/ • Instagram photos and videos$/, '').replace(/ on X$/, '');

          leads.push({
            id: `${platform}-${safeUUID()}`,
            name: name,
            address: `${location}`,
            phone: null, 
            email: null, 
            website: null,
            category: category.substring(0, 30),
            socials: { [platform]: result.url },
            rating: null,
            reviewCount: 0,
            mapsUrl: null
          });
        });
      }
    });
    return leads;
  } catch (error) {
    console.error(`${platform} Search Failed:`, error);
    return [];
  }
};

export const getCompetitorAds = async (searchTerms: string, country: string = 'US', maxItems: number = 3): Promise<any[]> => {
  // 1. Construct the exact Facebook Ads Library URL
  // This is much more reliable than just passing keywords to the actor
  const countryCode = country === 'United Kingdom' ? 'GB' : country === 'Canada' ? 'CA' : 'US';
  const libraryUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${countryCode}&q=${encodeURIComponent(searchTerms)}&search_type=keyword_unordered&media_type=all`;

  try {
    const response = await fetch(ADS_ACTOR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url: libraryUrl }], // Passing the exact URL is robust
        maxItems: maxItems,
        proxyConfiguration: { useApifyProxy: true }
      })
    });

    if (!response.ok) {
       console.warn(`Apify Ads Scrape Failed (${response.status}). Falling back to mock.`);
       return getMockAds(searchTerms);
    }

    const items = await response.json();
    
    if (Array.isArray(items) && items.length > 0) {
        return items.map((item: any) => ({
            advertiser: item.pageName || item.publisher?.name || 'Industry Competitor',
            copy: item.adBody || item.description || item.text || 'No text found',
            headline: item.adHeadline || item.title || '',
            cta: item.callToAction || item.ctaText || 'Learn More',
            imageUrl: item.images?.[0]?.originalImageUrl || item.imageUrl || item.snapshotUrl || '',
            link: item.linkUrl || item.snapshotUrl || ''
        })).slice(0, maxItems);
    }
    
    // If successful but 0 items found
    return getMockAds(searchTerms);

  } catch (error) {
    console.error("Apify Connection Error:", error);
    return getMockAds(searchTerms);
  }
};

// Fallback Mock Data generator to ensure the UI never breaks during demos
const getMockAds = (industry: string) => {
    return [
        {
            advertiser: `Top ${industry} Solutions`,
            copy: `Stop guessing with your ${industry} needs. Our AI-driven approach guarantees results in 30 days or you don't pay. Join 500+ satisfied clients today.`,
            headline: `The #1 Rated ${industry} Service`,
            cta: "Book Consultation",
            imageUrl: "",
            link: "https://facebook.com/ads/library"
        },
        {
            advertiser: `${industry} Experts Co.`,
            copy: `Need help with ${industry}? We provide 24/7 support and premium quality service. Don't settle for less. Click below to see our portfolio.`,
            headline: "Premium Quality, Affordable Rates",
            cta: "Learn More",
            imageUrl: "",
            link: "https://facebook.com/ads/library"
        }
    ];
};
