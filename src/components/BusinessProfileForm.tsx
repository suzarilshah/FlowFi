import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Building, MapPin, Mail, Phone, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import { validateBusinessData, ValidationError, getErrorMessage, hasFieldError } from '../utils/validation';
import HelpTooltip from './HelpTooltip';

interface BusinessProfileFormProps {
  data: any;
  onDataChange: (data: any) => void;
}

const legalEntities = [
  'Sole Proprietorship',
  'Partnership',
  'Limited Liability Company (LLC)',
  'Corporation (C-Corp)',
  'S Corporation (S-Corp)',
  'Nonprofit Organization',
  'Other'
];

const industries = [
  'Technology & Software',
  'Healthcare & Medical',
  'Finance & Banking',
  'Retail & E-commerce',
  'Manufacturing',
  'Real Estate',
  'Professional Services',
  'Food & Beverage',
  'Construction',
  'Transportation',
  'Education',
  'Entertainment & Media',
  'Agriculture',
  'Energy & Utilities',
  'Other'
];

const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({
  data,
  onDataChange
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'businessName':
        if (!value.trim()) error = 'Business name is required';
        else if (value.length < 2) error = 'Business name must be at least 2 characters';
        break;
      case 'legalEntity':
        if (!value) error = 'Please select a legal entity type';
        break;
      case 'industry':
        if (!value) error = 'Please select an industry';
        break;
      case 'taxId':
        if (!value) error = 'Tax ID is required';
        else if (!/^\d{2}-\d{7}$/.test(value) && !/^\d{9}$/.test(value)) {
          error = 'Please enter a valid EIN (XX-XXXXXXX or XXXXXXXXX)';
        }
        break;
      case 'email':
        if (!value) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (!value) error = 'Phone number is required';
        else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(value) && !/^\d{3}-\d{3}-\d{4}$/.test(value)) {
          error = 'Please enter a valid phone number';
        }
        break;
      case 'street':
        if (!value.trim()) error = 'Street address is required';
        break;
      case 'city':
        if (!value.trim()) error = 'City is required';
        break;
      case 'state':
        if (!value) error = 'State is required';
        break;
      case 'zipCode':
        if (!value) error = 'ZIP code is required';
        else if (!/^\d{5}(-\d{4})?$/.test(value)) {
          error = 'Please enter a valid ZIP code';
        }
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const handleChange = (field: string, value: string) => {
    const [section, subfield] = field.split('.');
    
    if (subfield) {
      onDataChange({
        profile: {
          ...data.profile,
          [section]: {
            ...data.profile[section],
            [subfield]: value
          }
        }
      });
    } else {
      onDataChange({
        profile: {
          ...data.profile,
          [field]: value
        }
      });
    }

    // Validate field if it was previously touched
    if (touched[field]) {
      validateField(field, value);
    }
    
    // Real-time validation
    validateForm(data.profile);
  };

  // Comprehensive form validation
  const validateForm = (profile: any) => {
    setIsValidating(true);
    const validation = validateBusinessData(profile);
    setValidationErrors([...validation.errors, ...validation.warnings]);
    setIsValidating(false);
    return validation.isValid;
  };

  // Validate on mount
  useEffect(() => {
    validateForm(data.profile);
  }, []);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field.includes('.') 
      ? data.profile[field.split('.')[0]][field.split('.')[1]]
      : data.profile[field];
    validateField(field, value);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const formatTaxId = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 9)}`;
  };

  const isFormValid = () => {
    const requiredFields = [
      'businessName',
      'legalEntity',
      'industry',
      'taxId',
      'street',
      'city',
      'state',
      'zipCode',
      'email',
      'phone'
    ];

    return requiredFields.every(field => {
      const value = field.includes('.') 
        ? data.profile[field.split('.')[0]]?.[field.split('.')[1]]
        : data.profile[field];
      return value && !errors[field];
    });
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Business Information Section */}
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <Building className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
          Business Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Business Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Business Name *
              <HelpTooltip field="businessName" position="top" />
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.profile.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                onBlur={() => handleBlur('businessName')}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  hasFieldError('businessName', validationErrors) 
                    ? 'border-red-500 bg-red-50' 
                    : touched.businessName ? 'border-green-500' : 'border-gray-300'
                }`}
                placeholder="Enter your business name"
              />
              {hasFieldError('businessName', validationErrors) && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {getErrorMessage('businessName', validationErrors)}
                </div>
              )}
              {touched.businessName && (
                errors.businessName ? (
                  <AlertCircle className="absolute right-3 top-3.5 w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
                )
              )}
            </div>
            {errors.businessName && (
              <p className="text-sm text-red-600">{errors.businessName}</p>
            )}
          </div>

          {/* Legal Entity */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Legal Entity Type *
              <HelpTooltip field="legalEntity" position="top" />
            </label>
            <select
              value={data.profile.legalEntity}
              onChange={(e) => handleChange('legalEntity', e.target.value)}
              onBlur={() => handleBlur('legalEntity')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.legalEntity ? 'border-red-500' : touched.legalEntity ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select entity type</option>
              {legalEntities.map(entity => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
            {errors.legalEntity && (
              <p className="text-sm text-red-600">{errors.legalEntity}</p>
            )}
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry *
              <HelpTooltip field="industry" position="top" />
            </label>
            <select
              value={data.profile.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              onBlur={() => handleBlur('industry')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.industry ? 'border-red-500' : touched.industry ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select industry</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
            {errors.industry && (
              <p className="text-sm text-red-600">{errors.industry}</p>
            )}
          </div>

          {/* Tax ID */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax ID (EIN) *
              <HelpTooltip field="taxId" position="top" />
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.profile.taxId}
                onChange={(e) => handleChange('taxId', formatTaxId(e.target.value))}
                onBlur={() => handleBlur('taxId')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.taxId ? 'border-red-500' : touched.taxId ? 'border-green-500' : 'border-gray-300'
                }`}
                placeholder="XX-XXXXXXX"
                maxLength={10}
              />
              {touched.taxId && (
                errors.taxId ? (
                  <AlertCircle className="absolute right-3 top-3.5 w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
                )
              )}
            </div>
            {errors.taxId && (
              <p className="text-sm text-red-600">{errors.taxId}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center mb-4 sm:mb-6">
          <Mail className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
          Contact Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Email *
              <HelpTooltip field="email" position="top" />
            </label>
            <div className="relative">
              <input
                type="email"
                value={data.profile.contact.email}
                onChange={(e) => handleChange('contact.email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  hasFieldError('email', validationErrors) 
                    ? 'border-red-500 bg-red-50' 
                    : errors.email ? 'border-red-500' : touched.email ? 'border-green-500' : 'border-gray-300'
                }`}
                placeholder="business@example.com"
              />
              {hasFieldError('email', validationErrors) && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {getErrorMessage('email', validationErrors)}
                </div>
              )}
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              {touched.email && (
                errors.email ? (
                  <AlertCircle className="absolute right-3 top-3.5 w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
                )
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Phone *
              <HelpTooltip field="phone" position="top" />
            </label>
            <div className="relative">
              <input
                type="tel"
                value={data.profile.contact.phone}
                onChange={(e) => handleChange('contact.phone', formatPhoneNumber(e.target.value))}
                onBlur={() => handleBlur('phone')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : touched.phone ? 'border-green-500' : 'border-gray-300'
                }`}
                placeholder="(XXX) XXX-XXXX"
                maxLength={14}
              />
              <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              {touched.phone && (
                errors.phone ? (
                  <AlertCircle className="absolute right-3 top-3.5 w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
                )
              )}
            </div>
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
              <HelpTooltip field="website" position="top" />
            </label>
            <div className="relative">
              <input
                type="url"
                value={data.profile.contact.website}
                onChange={(e) => handleChange('contact.website', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://www.example.com"
              />
              <Globe className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <MapPin className="w-6 h-6 mr-3 text-blue-600" />
          Business Address
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Street Address */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Street Address *
              <HelpTooltip field="address" position="top" />
            </label>
            <input
              type="text"
              value={data.profile.address.street}
              onChange={(e) => handleChange('address.street', e.target.value)}
              onBlur={() => handleBlur('street')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.street ? 'border-red-500' : touched.street ? 'border-green-500' : 'border-gray-300'
              }`}
              placeholder="123 Business Street"
            />
            {errors.street && (
              <p className="text-sm text-red-600">{errors.street}</p>
            )}
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <input
              type="text"
              value={data.profile.address.city}
              onChange={(e) => handleChange('address.city', e.target.value)}
              onBlur={() => handleBlur('city')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.city ? 'border-red-500' : touched.city ? 'border-green-500' : 'border-gray-300'
              }`}
              placeholder="Business City"
            />
            {errors.city && (
              <p className="text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          {/* State */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              State *
            </label>
            <select
              value={data.profile.address.state}
              onChange={(e) => handleChange('address.state', e.target.value)}
              onBlur={() => handleBlur('state')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.state ? 'border-red-500' : touched.state ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select state</option>
              <option value="AL">Alabama</option>
              <option value="AK">Alaska</option>
              <option value="AZ">Arizona</option>
              <option value="AR">Arkansas</option>
              <option value="CA">California</option>
              <option value="CO">Colorado</option>
              <option value="CT">Connecticut</option>
              <option value="DE">Delaware</option>
              <option value="FL">Florida</option>
              <option value="GA">Georgia</option>
              <option value="HI">Hawaii</option>
              <option value="ID">Idaho</option>
              <option value="IL">Illinois</option>
              <option value="IN">Indiana</option>
              <option value="IA">Iowa</option>
              <option value="KS">Kansas</option>
              <option value="KY">Kentucky</option>
              <option value="LA">Louisiana</option>
              <option value="ME">Maine</option>
              <option value="MD">Maryland</option>
              <option value="MA">Massachusetts</option>
              <option value="MI">Michigan</option>
              <option value="MN">Minnesota</option>
              <option value="MS">Mississippi</option>
              <option value="MO">Missouri</option>
              <option value="MT">Montana</option>
              <option value="NE">Nebraska</option>
              <option value="NV">Nevada</option>
              <option value="NH">New Hampshire</option>
              <option value="NJ">New Jersey</option>
              <option value="NM">New Mexico</option>
              <option value="NY">New York</option>
              <option value="NC">North Carolina</option>
              <option value="ND">North Dakota</option>
              <option value="OH">Ohio</option>
              <option value="OK">Oklahoma</option>
              <option value="OR">Oregon</option>
              <option value="PA">Pennsylvania</option>
              <option value="RI">Rhode Island</option>
              <option value="SC">South Carolina</option>
              <option value="SD">South Dakota</option>
              <option value="TN">Tennessee</option>
              <option value="TX">Texas</option>
              <option value="UT">Utah</option>
              <option value="VT">Vermont</option>
              <option value="VA">Virginia</option>
              <option value="WA">Washington</option>
              <option value="WV">West Virginia</option>
              <option value="WI">Wisconsin</option>
              <option value="WY">Wyoming</option>
            </select>
            {errors.state && (
              <p className="text-sm text-red-600">{errors.state}</p>
            )}
          </div>

          {/* ZIP Code */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ZIP Code *
            </label>
            <input
              type="text"
              value={data.profile.address.zipCode}
              onChange={(e) => handleChange('address.zipCode', e.target.value.replace(/\D/g, ''))}
              onBlur={() => handleBlur('zipCode')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.zipCode ? 'border-red-500' : touched.zipCode ? 'border-green-500' : 'border-gray-300'
              }`}
              placeholder="12345"
              maxLength={5}
            />
            {errors.zipCode && (
              <p className="text-sm text-red-600">{errors.zipCode}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form Status */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${
            isFormValid() ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          <p className="text-sm text-blue-900">
            {isFormValid() 
              ? 'All required fields are completed correctly.'
              : 'Please complete all required fields to continue.'
            }
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default BusinessProfileForm;