/**
 * AgentTooltip Component
 * 
 * Floating tooltip that introduces the AI assistant to first-time users.
 * Appears near the agent button with an arrow pointing to it.
 */

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentTooltipProps {
  show: boolean;
  onDismiss: () => void;
}

export const AgentTooltip: React.FC<AgentTooltipProps> = ({ show, onDismiss }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute -bottom-20 right-0 z-50"
        >
          {/* Arrow pointing up to button */}
          <div className="absolute -top-2 right-4 w-4 h-4 bg-purple-600 transform rotate-45" />
          
          {/* Tooltip content */}
          <div className="relative bg-purple-600 text-white px-4 py-3 rounded-lg shadow-2xl max-w-[240px]">
            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute -top-2 -right-2 w-6 h-6 bg-white text-purple-600 rounded-full flex items-center justify-center hover:bg-purple-50 transition-colors shadow-lg"
              aria-label="Dismiss tooltip"
            >
              <X className="w-3 h-3" />
            </button>
            
            {/* Message */}
            <div className="flex items-start gap-2">
              <span className="text-xl flex-shrink-0">💡</span>
              <div className="text-sm">
                <p className="font-semibold mb-1">AI Assistant</p>
                <p className="text-purple-100">
                  Ask me anything about this CRM!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgentTooltip;

