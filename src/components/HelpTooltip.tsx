import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ExternalLink, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import { getHelpContent, HelpContent } from '../utils/helpContent';

interface HelpTooltipProps {
  field: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  trigger?: 'hover' | 'click';
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  field,
  position = 'top',
  size = 'medium',
  trigger = 'hover'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  const helpContent = getHelpContent(field);
  
  if (!helpContent) return null;

  const showTooltip = () => {
    setIsAnimating(true);
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 200);
  };

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isVisible && tooltipRef.current && !tooltipRef.current.contains(event.target as Node) && 
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        hideTooltip();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible]);

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50';
    
    switch (position) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-64';
      case 'medium':
        return 'w-80';
      case 'large':
        return 'w-96';
      default:
        return 'w-80';
    }
  };

  const getArrowClasses = () => {
    const baseArrow = 'absolute w-3 h-3 bg-white border transform rotate-45';
    
    switch (position) {
      case 'top':
        return `${baseArrow} top-full left-1/2 -translate-x-1/2 -mt-1.5 border-t-0 border-l-0`;
      case 'bottom':
        return `${baseArrow} bottom-full left-1/2 -translate-x-1/2 -mb-1.5 border-b-0 border-r-0`;
      case 'left':
        return `${baseArrow} left-full top-1/2 -translate-y-1/2 -ml-1.5 border-l-0 border-b-0`;
      case 'right':
        return `${baseArrow} right-full top-1/2 -translate-y-1/2 -mr-1.5 border-r-0 border-t-0`;
      default:
        return `${baseArrow} top-full left-1/2 -translate-x-1/2 -mt-1.5 border-t-0 border-l-0`;
    }
  };

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={trigger === 'click' ? toggleTooltip : undefined}
        onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
        onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
        className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors duration-200 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Help for ${helpContent.title}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`${getPositionClasses()} ${getSizeClasses()} ${
            isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } transition-all duration-200 ease-out`}
        >
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {/* Arrow */}
            <div className={getArrowClasses()}></div>
            
            {/* Header */}
            <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {helpContent.title}
                  </h3>
                </div>
                <button
                  onClick={hideTooltip}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  aria-label="Close help"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <p className="text-gray-700 mb-4 leading-relaxed">
                {helpContent.description}
              </p>

              {/* Examples */}
              {helpContent.examples && helpContent.examples.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Examples
                  </h4>
                  <ul className="space-y-1">
                    {helpContent.examples.map((example, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {helpContent.tips && helpContent.tips.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />
                    Tips
                  </h4>
                  <ul className="space-y-1">
                    {helpContent.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Links */}
              {helpContent.relatedLinks && helpContent.relatedLinks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <ExternalLink className="w-4 h-4 text-blue-500 mr-2" />
                    Helpful Resources
                  </h4>
                  <ul className="space-y-1">
                    {helpContent.relatedLinks.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center"
                          onClick={hideTooltip}
                        >
                          {link.title}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Need more help? Contact support</span>
                <button
                  onClick={hideTooltip}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;