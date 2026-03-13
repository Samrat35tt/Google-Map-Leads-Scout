
// This service simulates an integration with providers like ZeroBounce or NeverBounce.
// In production, this would make a backend call to the provider API.

export const verifyEmailAddress = async (email: string): Promise<'verified' | 'risky' | 'invalid'> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const lowerEmail = email.toLowerCase();

  // 1. Syntax Check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(lowerEmail)) {
    return 'invalid';
  }

  // 2. Disposable Domain Check (Mock list)
  const disposableDomains = ['tempmail.com', 'mailinator.com', '10minutemail.com', 'throwawaymail.com'];
  const domain = lowerEmail.split('@')[1];
  if (disposableDomains.includes(domain)) {
    return 'invalid';
  }

  // 3. "Role Based" Check (Risky for B2B cold outreach)
  const riskyPrefixes = ['info', 'contact', 'support', 'sales', 'admin', 'hello', 'jobs'];
  const prefix = lowerEmail.split('@')[0];
  if (riskyPrefixes.includes(prefix)) {
    return 'risky';
  }

  // 4. Free Provider Check (Often B2C, verify strictly)
  const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  if (freeProviders.includes(domain)) {
     // In a real app, we'd ping the SMTP server. 
     // For simulation, we'll mark them as 'risky' for B2B contexts unless explicitly valid formats.
     return 'risky';
  }

  // Default to verified for business domains in this simulation
  return 'verified';
};
