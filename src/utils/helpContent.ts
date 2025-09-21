/**
 * Help Tooltips and Guidance System
 * Provides contextual help and guidance for complex business fields
 */

export interface HelpContent {
  title: string;
  description: string;
  examples?: string[];
  tips?: string[];
  relatedLinks?: { title: string; url: string }[];
}

export const helpTooltips: Record<string, HelpContent> = {
  businessName: {
    title: "Business Name",
    description: "Enter your business's legal name as it appears on official documents.",
    examples: [
      "ACME Corporation, Inc.",
      "Smith & Associates LLC",
      "The Coffee Shop"
    ],
    tips: [
      "Use your official business name from registration documents",
      "Include legal suffixes like Inc., LLC, Corp.",
      "Avoid using abbreviations unless they're part of your legal name"
    ]
  },
  
  legalEntity: {
    title: "Legal Entity Type",
    description: "Select the legal structure of your business. This affects taxes, liability, and compliance requirements.",
    examples: [
      "Sole Proprietorship - Simplest structure, owner has full control",
      "LLC - Limited liability protection with flexible taxation",
      "Corporation - Separate legal entity with shareholders"
    ],
    tips: [
      "Choose based on liability protection needs",
      "Consider tax implications of each structure",
      "Consult with a business attorney or accountant if unsure"
    ],
    relatedLinks: [
      { title: "SBA Business Structure Guide", url: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure" }
    ]
  },
  
  industry: {
    title: "Industry Classification",
    description: "Select the industry that best describes your primary business activities.",
    examples: [
      "Technology Services",
      "Retail Trade",
      "Professional Services",
      "Manufacturing"
    ],
    tips: [
      "Choose the industry that represents your main revenue source",
      "Use NAICS codes for more specific classification",
      "Update if your business focus changes significantly"
    ]
  },
  
  taxId: {
    title: "Tax Identification Number (EIN)",
    description: "Your Employer Identification Number (EIN) or Federal Tax ID. This is required for tax purposes and business banking.",
    examples: [
      "Format: XX-XXXXXXX",
      "Example: 12-3456789"
    ],
    tips: [
      "Apply for free at IRS.gov",
      "Required for most business structures except sole proprietorships",
      "Keep this number secure - it's sensitive information",
      "You'll need this for opening business bank accounts"
    ],
    relatedLinks: [
      { title: "Apply for EIN Online", url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" }
    ]
  },
  
  email: {
    title: "Business Email Address",
    description: "Your primary business email address for official communications and notifications.",
    examples: [
      "info@yourcompany.com",
      "contact@businessname.com"
    ],
    tips: [
      "Use a professional email address",
      "Consider using your domain name",
      "Set up email forwarding if needed",
      "Ensure this email is regularly monitored"
    ]
  },
  
  phone: {
    title: "Business Phone Number",
    description: "Your primary business contact number. This should be a number where you can be reached during business hours.",
    examples: [
      "(555) 123-4567",
      "+1 555 123 4567"
    ],
    tips: [
      "Use your main business line",
      "Consider a separate business phone",
      "Include area code",
      "Update if your contact information changes"
    ]
  },
  
  address: {
    title: "Business Address",
    description: "Your primary business location. This is used for tax purposes, mail delivery, and business registration.",
    examples: [
      "123 Main Street, Suite 100",
      "456 Business Park Drive"
    ],
    tips: [
      "Use your actual business location",
      "Include suite or unit numbers if applicable",
      "Can be a home office for home-based businesses",
      "Must be a physical address (not PO Box for most purposes)"
    ]
  },
  
  startDate: {
    title: "Business Start Date",
    description: "The date when your business officially began operations. This is important for tax calculations and business age verification.",
    examples: [
      "January 1, 2020",
      "06/15/2021"
    ],
    tips: [
      "Use the date you started conducting business",
      "This affects tax year calculations",
      "Important for business age verification",
      "Should match your business registration date"
    ]
  },
  
  website: {
    title: "Business Website",
    description: "Your business website URL. This is optional but recommended for credibility and customer access.",
    examples: [
      "https://www.yourcompany.com",
      "https://businessname.net"
    ],
    tips: [
      "Include https:// or http://",
      "Use your main business domain",
      "Ensure the website is live and functional",
      "Can be updated later if your web address changes"
    ]
  },
  
  expenseCategories: {
    title: "Expense Categories",
    description: "Categories help organize your business expenses for better financial tracking and tax reporting.",
    examples: [
      "Office Supplies",
      "Travel & Transportation",
      "Marketing & Advertising",
      "Professional Services"
    ],
    tips: [
      "Create categories that match your business needs",
      "Use categories that make sense for tax purposes",
      "Keep categories simple and intuitive",
      "You can add more categories later as needed"
    ]
  },
  
  aiAnalysis: {
    title: "AI-Powered Financial Analysis",
    description: "Advanced analytics that use artificial intelligence to provide insights into your business finances.",
    examples: [
      "Cash flow pattern recognition",
      "Spending trend analysis",
      "Predictive budgeting recommendations",
      "Financial health indicators"
    ],
    tips: [
      "AI analysis improves with more data over time",
      "Use insights to make informed business decisions",
      "Review recommendations regularly",
      "Combine AI insights with your business knowledge"
    ]
  }
};

/**
 * Get help content for a specific field
 */
export function getHelpContent(field: string): HelpContent | null {
  return helpTooltips[field] || null;
}

/**
 * Check if help is available for a field
 */
export function hasHelpContent(field: string): boolean {
  return field in helpTooltips;
}

/**
 * Get all available help topics
 */
export function getAllHelpTopics(): string[] {
  return Object.keys(helpTooltips);
}

/**
 * Search help content by keyword
 */
export function searchHelpContent(keyword: string): Record<string, HelpContent> {
  const results: Record<string, HelpContent> = {};
  const lowerKeyword = keyword.toLowerCase();
  
  for (const [key, content] of Object.entries(helpTooltips)) {
    const searchableText = `${content.title} ${content.description} ${content.examples?.join(' ') || ''} ${content.tips?.join(' ') || ''}`.toLowerCase();
    
    if (searchableText.includes(lowerKeyword)) {
      results[key] = content;
    }
  }
  
  return results;
}