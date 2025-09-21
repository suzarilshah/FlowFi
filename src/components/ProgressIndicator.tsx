import React from 'react';
import { motion } from 'framer-motion';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Mobile View */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-900">
            Step {currentStep} of {steps.length}
          </div>
          <div className="text-sm text-gray-500">
            {steps[currentStep - 1]?.title}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200" />
          <motion.div
            className="absolute top-5 left-0 h-0.5 bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              const isClickable = stepNumber <= currentStep || onStepClick;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <motion.button
                    onClick={() => isClickable && onStepClick?.(stepNumber)}
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                        : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                    } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    whileHover={isClickable ? { scale: 1.1 } : {}}
                    whileTap={isClickable ? { scale: 0.95 } : {}}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </motion.button>

                  {/* Step Info */}
                  <div className="mt-3 text-center">
                    <h3
                      className={`text-sm font-medium ${
                        isCurrent ? 'text-blue-900' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 hidden md:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Preview */}
      <div className="mt-6 text-center">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {steps[currentStep - 1]?.title}
          </h2>
          <p className="text-gray-600">
            {steps[currentStep - 1]?.description}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressIndicator;