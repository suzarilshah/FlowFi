import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calculator, TrendingUp, Shield, Building2, Users, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProgressIndicator from '../components/ProgressIndicator';
import BusinessProfileForm from '../components/BusinessProfileForm';
import { ExpenseCategorization } from '../components/ExpenseCategorization';
import AIAnalysis from '../components/AIAnalysis';
import { saveEncryptedData, loadEncryptedData, clearEncryptedData, generateDataHash } from '../utils/encryption';

interface BusinessData {
  profile: {
    businessName: string;
    legalEntity: string;
    industry: string;
    taxId: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    contact: {
      email: string;
      phone: string;
      website?: string;
    };
  };
  expenseCategories: Array<{
    id: string;
    name: string;
    description: string;
    rules: string[];
    isCustom: boolean;
  }>;
  aiPreferences: {
    enableCashFlowAnalysis: boolean;
    enableSpendingTrends: boolean;
    enablePredictiveBudgeting: boolean;
    notificationFrequency: 'daily' | 'weekly' | 'monthly';
  };
}

const BusinessOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessData, setBusinessData] = useState<BusinessData>({
    profile: {
      businessName: '',
      legalEntity: '',
      industry: '',
      taxId: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      },
      contact: {
        email: '',
        phone: '',
        website: ''
      }
    },
    expenseCategories: [],
    aiPreferences: {
      enableCashFlowAnalysis: true,
      enableSpendingTrends: true,
      enablePredictiveBudgeting: true,
      notificationFrequency: 'weekly'
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      title: 'Business Profile',
      description: 'Basic business information',
      icon: Building2,
      component: BusinessProfileForm
    },
    {
      id: 2,
      title: 'Expense Categories',
      description: 'Set up expense classification',
      icon: Calculator,
      component: ExpenseCategorization
    },
    {
      id: 3,
      title: 'AI Analysis',
      description: 'Configure smart insights',
      icon: TrendingUp,
      component: AIAnalysis
    },
    {
      id: 4,
      title: 'Security & Review',
      description: 'Secure your data and review',
      icon: Shield,
      component: null
    }
  ];



  const loadProgress = () => {
    const saved = localStorage.getItem('businessOnboardingProgress');
    if (saved) {
      const { currentStep: savedStep, businessData: savedData } = JSON.parse(saved);
      setCurrentStep(savedStep);
      setBusinessData(savedData);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      saveProgress(false);
    }
  };

  const handleComplete = () => {
    try {
      // Clear saved progress after successful completion
      clearEncryptedData('flowfi_onboarding_progress');
      clearEncryptedData('flowfi_onboarding_step');
      clearEncryptedData('flowfi_onboarding_hash');
      
      // Store completion status
      saveEncryptedData('flowfi_onboarding_completed', {
        completedAt: new Date().toISOString(),
        businessData: businessData
      });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      alert('Failed to complete onboarding. Please try again.');
    }
  };

  const handleResumeLater = () => {
    saveProgress(true);
    navigate('/dashboard');
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepData: any) => {
    setBusinessData(prev => ({
      ...prev,
      ...stepData
    }));
  };

  // Save progress securely
  const saveProgress = async (showNotification = true) => {
    try {
      setSaveStatus('saving');
      
      // Save business data with encryption
      saveEncryptedData('flowfi_onboarding_progress', businessData);
      saveEncryptedData('flowfi_onboarding_step', currentStep);
      
      // Generate and save data integrity hash
      const dataHash = generateDataHash(businessData);
      saveEncryptedData('flowfi_onboarding_hash', dataHash);
      
      setSaveStatus('saved');
      
      if (showNotification) {
        // Show success notification (you could add a toast here)
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Load saved progress on component mount
  useEffect(() => {
    const loadSavedProgress = () => {
      try {
        const savedData = loadEncryptedData('flowfi_onboarding_progress');
        const savedStep = loadEncryptedData('flowfi_onboarding_step');
        
        if (savedData) {
          setBusinessData(prev => ({ ...prev, ...savedData }));
        }
        if (savedStep && typeof savedStep === 'number') {
          setCurrentStep(savedStep);
        }
      } catch (error) {
        console.error('Failed to load saved progress:', error);
      }
    };

    loadSavedProgress();
  }, []);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveProgress(false);
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [businessData, currentStep]);

  const currentStepData = steps[currentStep - 1];
  const CurrentComponent = currentStepData.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Business Onboarding
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Set up your business profile and unlock powerful AI-driven financial insights
            </p>
          </motion.div>

          {/* Progress Indicator */}
          <ProgressIndicator
            steps={steps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
        </div>

        {/* Main Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8"
        >
          <AnimatePresence mode="wait">
            {CurrentComponent && (
              <CurrentComponent
                data={businessData}
                onDataChange={handleStepComplete}
              />
            )}

            {currentStep === 4 && (
              <div className="text-center py-8 sm:py-12">
                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Ready to Get Started!
                </h2>
                <p className="text-gray-600 mb-6 sm:mb-8 px-2">
                  Your business profile is complete. You're all set to start tracking expenses and gaining AI-powered insights.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Business Profile</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Complete business information</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Smart Categorization</h3>
                    <p className="text-xs sm:text-sm text-gray-600">AI-powered expense classification</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">AI Insights</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Predictive analytics and trends</p>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-8 gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center justify-center px-6 py-3 text-gray-600 bg-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={() => saveProgress(true)}
              disabled={saveStatus === 'saving'}
              className="flex items-center justify-center px-3 sm:px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {saveStatus === 'saved' && <CheckCircle className="w-4 h-4 mr-2 text-green-600" />}
              {saveStatus === 'error' && <AlertCircle className="w-4 h-4 mr-2 text-red-600" />}
              {saveStatus === 'saving' && <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>}
              {!(saveStatus === 'saved' || saveStatus === 'error') && <Save className="w-4 h-4 mr-2" />}
              <span className="whitespace-nowrap">
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Progress'}
              </span>
            </button>
            
            <button
              onClick={handleResumeLater}
              className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
            >
              Resume Later
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
              >
                <span className="whitespace-nowrap">Next</span>
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={() => {/* Navigate to dashboard */}}
                className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-all"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="whitespace-nowrap">Complete Setup</span>
              </button>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default BusinessOnboarding;