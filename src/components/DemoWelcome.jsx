import React, { useState, useEffect } from 'react';
import { X, Github, ExternalLink, CheckCircle } from 'lucide-react';

/**
 * DemoWelcome Component
 * 
 * Modal that appears when the demo first loads
 * Explains the demo nature and provides context
 * Stores "seen" state in localStorage to avoid showing repeatedly
 */
const DemoWelcome = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal
    const hasSeenWelcome = localStorage.getItem('ovenai_demo_welcome_seen');
    
    if (!hasSeenWelcome) {
      // Delay slightly for better UX
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 500);
    }
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('ovenai_demo_welcome_seen', 'true');
    }, 300);
  };

  const handleEnterDemo = () => {
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-50
          transition-opacity duration-300
          ${isAnimating ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={`
            bg-white rounded-2xl shadow-2xl max-w-2xl w-full
            transform transition-all duration-300
            ${isAnimating 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4'
            }
          `}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-t-2xl">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Portfolio Demo
              </div>
              <h2 className="text-3xl font-bold">
                CRM Demo CRM Demo
              </h2>
              <p className="text-blue-100 text-lg">
                AI-Powered WhatsApp Lead Management System
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Real Results */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Real Production Results
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-3xl font-bold text-green-600">70%</div>
                  <div className="text-green-700">Response Rate</div>
                  <div className="text-xs text-green-600">(vs 2% SMS baseline)</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">2.5×</div>
                  <div className="text-green-700">More Meetings</div>
                  <div className="text-xs text-green-600">through automation</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">100+</div>
                  <div className="text-green-700">Leads Per Day</div>
                  <div className="text-xs text-green-600">per agent capacity</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">70%</div>
                  <div className="text-green-700">Time Saved</div>
                  <div className="text-xs text-green-600">on manual follow-up</div>
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🛠 Technical Stack
              </h3>
              <div className="flex flex-wrap gap-2 text-sm">
                {[
                  'React + TypeScript',
                  'Node.js + Express',
                  'PostgreSQL',
                  'Redis',
                  'WhatsApp Business API',
                  'OpenAI GPT-4',
                  'Calendly API',
                  'WebSockets'
                ].map((tech) => (
                  <span 
                    key={tech}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Demo Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                WARNING Demo Notes
              </h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>All features are fully functional with <strong>mock data</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>Customer data has been removed due to <strong>confidentiality</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>Hover <strong>"?" icons</strong> for implementation details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>Navigate freely - everything works!</span>
                </li>
              </ul>
            </div>

            {/* Fake Login Hint */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>IDEA Tip:</strong> Use <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs">demo@example.com</code> 
                {' '}/ <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs">demo</code> to login (or any credentials - auth is disabled in demo mode)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 flex gap-3">
            <button
              onClick={handleEnterDemo}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Enter Demo
            </button>
            <a
              href="https://github.com/yourusername/ovenai-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all"
              onClick={handleClose}
            >
              <Github className="w-5 h-5" />
              <span className="hidden sm:inline">View GitHub</span>
            </a>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-500">
              Portfolio demonstration • Original system built for production client
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DemoWelcome;

// To use: Add to your main App.tsx or index.tsx
// import DemoWelcome from './components/DemoWelcome';
// 
// function App() {
//   return (
//     <>
//       <DemoWelcome />
//       {/* rest of your app */}
//     </>
//   );
// }

