/**
 * Comprehensive Form Validation Utility
 * Provides validation functions for business onboarding forms
 */

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Business name validation
 */
export function validateBusinessName(name: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push({
      field: 'businessName',
      message: 'Business name is required',
      severity: 'error'
    });
  } else if (name.trim().length < 2) {
    errors.push({
      field: 'businessName',
      message: 'Business name must be at least 2 characters long',
      severity: 'error'
    });
  } else if (name.trim().length > 100) {
    errors.push({
      field: 'businessName',
      message: 'Business name must not exceed 100 characters',
      severity: 'error'
    });
  } else if (!/^[a-zA-Z0-9\s\-&.,'()]+$/.test(name)) {
    errors.push({
      field: 'businessName',
      message: 'Business name contains invalid characters',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!email || email.trim().length === 0) {
    errors.push({
      field: 'email',
      message: 'Email address is required',
      severity: 'error'
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Phone number validation
 */
export function validatePhone(phone: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!phone || phone.trim().length === 0) {
    errors.push({
      field: 'phone',
      message: 'Phone number is required',
      severity: 'error'
    });
  } else if (!/^[\d\s\-\(\)\+]{10,20}$/.test(phone.replace(/\s/g, ''))) {
    errors.push({
      field: 'phone',
      message: 'Please enter a valid phone number',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Tax ID validation (EIN format)
 */
export function validateTaxId(taxId: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!taxId || taxId.trim().length === 0) {
    errors.push({
      field: 'taxId',
      message: 'Tax ID is required',
      severity: 'error'
    });
  } else if (!/^\d{2}-\d{7}$/.test(taxId)) {
    errors.push({
      field: 'taxId',
      message: 'Tax ID must be in format XX-XXXXXXX',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Address validation
 */
export function validateAddress(address: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!address || typeof address !== 'object') {
    errors.push({
      field: 'address',
      message: 'Address information is required',
      severity: 'error'
    });
    return errors;
  }
  
  // Street address
  if (!address.street || address.street.trim().length === 0) {
    errors.push({
      field: 'address.street',
      message: 'Street address is required',
      severity: 'error'
    });
  }
  
  // City
  if (!address.city || address.city.trim().length === 0) {
    errors.push({
      field: 'address.city',
      message: 'City is required',
      severity: 'error'
    });
  }
  
  // State
  if (!address.state || address.state.trim().length === 0) {
    errors.push({
      field: 'address.state',
      message: 'State is required',
      severity: 'error'
    });
  }
  
  // ZIP code
  if (!address.zipCode || address.zipCode.trim().length === 0) {
    errors.push({
      field: 'address.zipCode',
      message: 'ZIP code is required',
      severity: 'error'
    });
  } else if (!/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
    errors.push({
      field: 'address.zipCode',
      message: 'Please enter a valid ZIP code',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Industry validation
 */
export function validateIndustry(industry: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!industry || industry.trim().length === 0) {
    errors.push({
      field: 'industry',
      message: 'Industry classification is required',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Legal entity validation
 */
export function validateLegalEntity(entity: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!entity || entity.trim().length === 0) {
    errors.push({
      field: 'legalEntity',
      message: 'Legal entity type is required',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Website validation
 */
export function validateWebsite(website: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (website && website.trim().length > 0) {
    if (!/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(website)) {
      errors.push({
        field: 'website',
        message: 'Please enter a valid website URL',
        severity: 'error'
      });
    }
  }
  
  return errors;
}

/**
 * Business start date validation
 */
export function validateStartDate(startDate: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!startDate) {
    errors.push({
      field: 'startDate',
      message: 'Business start date is required',
      severity: 'error'
    });
  } else {
    const date = new Date(startDate);
    const today = new Date();
    const minDate = new Date('1900-01-01');
    
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'startDate',
        message: 'Please enter a valid date',
        severity: 'error'
      });
    } else if (date > today) {
      errors.push({
        field: 'startDate',
        message: 'Business start date cannot be in the future',
        severity: 'error'
      });
    } else if (date < minDate) {
      errors.push({
        field: 'startDate',
        message: 'Please enter a realistic business start date',
        severity: 'warning'
      });
    }
  }
  
  return errors;
}

/**
 * Comprehensive business data validation
 */
export function validateBusinessData(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Business name
  errors.push(...validateBusinessName(data.businessName || ''));
  
  // Legal entity
  errors.push(...validateLegalEntity(data.legalEntity || ''));
  
  // Industry
  errors.push(...validateIndustry(data.industry || ''));
  
  // Tax ID
  errors.push(...validateTaxId(data.taxId || ''));
  
  // Email
  errors.push(...validateEmail(data.email || ''));
  
  // Phone
  errors.push(...validatePhone(data.phone || ''));
  
  // Website (optional)
  errors.push(...validateWebsite(data.website || ''));
  
  // Address
  errors.push(...validateAddress(data.address));
  
  // Start date
  errors.push(...validateStartDate(data.startDate || ''));
  
  // Separate warnings from errors
  const errorList = errors.filter(e => e.severity === 'error');
  const warningList = errors.filter(e => e.severity === 'warning');
  
  return {
    isValid: errorList.length === 0,
    errors: errorList,
    warnings: warningList
  };
}

/**
 * Get user-friendly error messages
 */
export function getErrorMessage(field: string, errors: ValidationError[]): string {
  const fieldErrors = errors.filter(e => e.field === field);
  return fieldErrors.length > 0 ? fieldErrors[0].message : '';
}

/**
 * Check if field has errors
 */
export function hasFieldError(field: string, errors: ValidationError[]): boolean {
  return errors.some(e => e.field === field && e.severity === 'error');
}

/**
 * Check if field has warnings
 */
export function hasFieldWarning(field: string, errors: ValidationError[]): boolean {
  return errors.some(e => e.field === field && e.severity === 'warning');
}