import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

/**
 * HelpTooltip Component
 * 
 * Displays implementation details and technical notes for demo features
 * Shows on hover or click with detailed explanations
 * 
 * @param {Object} props
 * @param {string} props.title - Feature title
 * @param {string} props.description - Feature description
 * @param {string} props.implementation - Technical implementation details
 * @param {string} props.businessValue - Business impact/value
 * @param {string} props.techStack - Technologies used
 * @param {string} props.position - Tooltip position ('top', 'bottom', 'left', 'right')
 */
const HelpTooltip = ({
  title,
  description,
  implementation,
  businessValue,
  techStack,
  position = 'top'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Icon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          p-1 rounded-full transition-all duration-200
          ${isHovered || isOpen 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }
        `}
        aria-label="Show implementation details"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Tooltip Content */}
      {isOpen && (
        <>
          {/* Overlay for mobile */}
          <div 
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Tooltip */}
          <div 
            className={`
              absolute z-50 w-80 max-w-sm
              ${positionClasses[position]}
              
              /* Mobile: Bottom sheet */
              md:block
              fixed md:absolute
              bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto
              rounded-t-2xl md:rounded-lg
              
              bg-gray-900 text-white shadow-2xl
              p-4 md:p-5
              animate-slide-up md:animate-fade-in
            `}
          >
            {/* Close button (mobile) */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-800 rounded-lg transition-colors md:hidden"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Arrow (desktop only) */}
            <div 
              className={`
                hidden md:block
                absolute w-0 h-0
                border-8
                ${arrowClasses[position]}
              `}
            />

            {/* Content */}
            <div className="space-y-3">
              {/* Title */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">
                  {title}
                </h4>
                <p className="text-sm text-gray-300">
                  {description}
                </p>
              </div>

              {/* Implementation */}
              {implementation && (
                <div className="border-t border-gray-700 pt-3">
                  <h5 className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1">
                    💻 Implementation
                  </h5>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {implementation}
                  </p>
                </div>
              )}

              {/* Business Value */}
              {businessValue && (
                <div className="border-t border-gray-700 pt-3">
                  <h5 className="text-xs font-semibold text-green-300 uppercase tracking-wide mb-1">
                    📈 Business Value
                  </h5>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {businessValue}
                  </p>
                </div>
              )}

              {/* Tech Stack */}
              {techStack && (
                <div className="border-t border-gray-700 pt-3">
                  <h5 className="text-xs font-semibold text-purple-300 uppercase tracking-wide mb-1">
                    🛠 Tech Stack
                  </h5>
                  <p className="text-sm text-gray-300 font-mono leading-relaxed">
                    {techStack}
                  </p>
                </div>
              )}
            </div>

            {/* Demo Note */}
            <div className="mt-4 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400 italic">
                ℹ️ This is a portfolio demo with mock data
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HelpTooltip;

// Example usage:
/*
<HelpTooltip
  title="BANT Scoring System"
  description="AI-powered lead qualification using the BANT framework"
  implementation="Uses GPT-4 to analyze WhatsApp conversations in real-time, extracting Budget, Authority, Need, and Timeline signals. Scores are calculated on a 0-100 scale with configurable thresholds."
  businessValue="Automated qualification saved ~4 hours per agent per day, resulting in 70% reduction in manual follow-up time and 2.5× more qualified meetings."
  techStack="OpenAI GPT-4, PostgreSQL, Redis Cache, WebSocket"
  position="right"
/>
*/

