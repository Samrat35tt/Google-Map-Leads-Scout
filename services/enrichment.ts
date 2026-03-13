
import { Lead } from '../types';
import { verifyEmailAddress } from './verification';

// This service handles the "Waterfall" logic for finding contact data.
// It integrates with Apollo.io for real data when a key is present.

// Helper to wrap URL with CORS proxy for browser-based API calls
const withProxy = (url: string) => {
    // We use corsproxy.io to bypass browser CORS restrictions for the Apollo API
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
};

export const findDirectDial = async (name: string, domain: string, apiKey: string): Promise<Partial<Lead> | null> => {
    try {
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

        const response = await fetch('/api/apollo/match', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  domain: domain,
                  first_name: firstName,
                  last_name: lastName
              })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.person) {
                return {
                    id: `apollo-${data.person.id}`,
                    name: `${data.person.first_name} ${data.person.last_name}`,
                    email: data.person.email,
                    phone: data.person.phone_numbers?.[0]?.sanitized_number || null,
                    category: data.person.title || 'Professional',
                    address: data.person.city ? `${data.person.city}, ${data.person.state}` : domain,
                    socials: {
                        linkedin: data.person.linkedin_url
                    },
                    emailStatus: data.person.email_status === 'verified' ? 'verified' : 'risky',
                    emailSource: 'apollo'
                };
            }
        } else {
            console.warn("Apollo API Request Failed:", response.status);
        }
        return null;
    } catch (e: any) {
        // Suppress generic "Failed to fetch" errors to prevent console noise
        console.warn("Direct Dial Search (Network/CORS):", e.message);
        return null;
    }
};

export const enrichLeadData = async (lead: Lead, apiKey: string, provider: 'apollo' | 'hunter' | 'proxycurl'): Promise<Partial<Lead>> => {
  const domain = lead.website ? lead.website.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0] : '';
  
  if (!domain && !lead.name) return {};

  console.log(`[Enrichment] Starting waterfall for ${lead.name} (${domain}) using ${provider}...`);

  // --- 1. REAL APOLLO API INTEGRATION ---
  if (provider === 'apollo') {
      try {
          const nameParts = lead.name.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

          const response = await fetch('/api/apollo/match', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  domain: domain,
                  first_name: firstName,
                  last_name: lastName,
                  organization_name: lead.name
              })
          });

          if (response.ok) {
              const data = await response.json();
              if (data.person) {
                  console.log("[Enrichment] Apollo Match Found!");
                  
                  // Construct result from real data
                  const enriched: Partial<Lead> = {
                      email: data.person.email,
                      emailStatus: data.person.email_status === 'verified' ? 'verified' : 'risky',
                      emailSource: 'apollo',
                      phone: data.person.phone_numbers?.[0]?.sanitized_number || null,
                  };

                  if (data.person.linkedin_url) {
                      enriched.socials = {
                          ...lead.socials,
                          linkedin: data.person.linkedin_url
                      };
                  }

                  return enriched;
              } else {
                  console.log("[Enrichment] Apollo returned no match.");
              }
          } else {
              console.warn("[Enrichment] Apollo API Error:", response.status);
          }
      } catch (e: any) {
          console.warn("[Enrichment] Apollo Network/CORS Issue (falling back to sim):", e.message);
      }
  }

  // --- 2. FALLBACK SIMULATION (If API fails or no key) ---
  console.log("[Enrichment] Falling back to simulation/inference...");
  
  await new Promise(resolve => setTimeout(resolve, 800));

  let email: string | null = null;
  let source: Lead['emailSource'] = 'manual';

  try {
    const commonNames = lead.name.split(' ');
    const firstName = commonNames[0]?.toLowerCase().replace(/[^a-z]/g, '') || 'info';
    
    // Fallback to generic pattern inference
    if (domain) {
        email = `contact@${domain}`; 
        source = 'ai_inferred';
    }

    if (!email) return {};

    // 3. VERIFICATION LAYER
    const status = await verifyEmailAddress(email);

    return {
        email,
        emailStatus: status,
        emailSource: source
    };

  } catch (error) {
    console.error("Enrichment failed:", error);
    return {};
  }
};
