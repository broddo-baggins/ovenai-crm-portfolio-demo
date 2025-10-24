import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TypingDots } from '@/components/common/TypingDots';
import sendIcon from '@/assets/icons/send-green.svg';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  timestamp: string;
  isRead?: boolean;
  isDelivered?: boolean;
  requestedTime?: string; // For delayed message feature
}

interface WhatsAppChatInterfaceProps {
  contactName: string;
  contactInitial?: string;
  isOnline?: boolean;
  lastSeen?: string;
  messages: ChatMessage[];
  onSendMessage?: (message: string) => void;
  onClose?: () => void;
  isRTL?: boolean;
  isTyping?: boolean;
}

export const WhatsAppChatInterface: React.FC<WhatsAppChatInterfaceProps> = ({
  contactName,
  contactInitial = contactName.charAt(0).toUpperCase(),
  isOnline = true,
  lastSeen,
  messages,
  onSendMessage,
  onClose,
  isRTL = false,
  isTyping = false
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [textareaHeight, setTextareaHeight] = useState(44); // Initial height
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = '44px'; // Reset to initial height
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 44 * 5; // Maximum 5 lines
      const newHeight = Math.min(scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
    }
  }, [inputMessage]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && onSendMessage) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      setTextareaHeight(44); // Reset height after sending
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Helper function to simulate delayed messages based on requested time
  const getDisplayTimestamp = (message: ChatMessage) => {
    if (message.requestedTime) {
      return message.requestedTime;
    }
    return formatTimestamp(message.timestamp);
  };

  // Function to check if we should show a date separator
  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true; // Always show for first message
    
    const currentDate = new Date(messages[index].timestamp).toDateString();
    const previousDate = new Date(messages[index - 1].timestamp).toDateString();
    return currentDate !== previousDate;
  };

  // Function to format date separator
  const formatDateSeparator = () => {
    // Always return "Today" to prevent invalid date displays
    return isRTL ? 'היום' : 'Today';
  };

  return (
    <div className="flex flex-col bg-white rounded-lg overflow-hidden shadow-lg h-auto max-h-[80vh] md:max-h-none w-full max-w-[95%] md:max-w-none">
      {/* WhatsApp Header - Fixed for mobile safe area */}
      <div className="whatsapp-header flex items-center justify-between p-3 md:p-4 safe-area-top">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="whatsapp-avatar">
            {contactInitial}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">
              {contactName}
            </h3>
            <div className="flex items-center gap-2">
              {isOnline && <div className="whatsapp-online-dot"></div>}
              <p className="text-xs text-white/80">
                {isOnline ? (isRTL ? 'פעיל עכשיו' : 'Active now') : lastSeen}
              </p>
            </div>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <MoreVertical className="h-5 w-5" />
          </Button>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10"
              onClick={onClose}
            >
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Chat Messages Area - Expanded to show more messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 whatsapp-background whatsapp-chat-container p-4 space-y-3 overflow-y-auto safe-area-bottom"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <AnimatePresence>
          {messages.map((message, index) => {
            const isUser = message.sender === 'user';
            return (
              <React.Fragment key={message.id}>
                {/* Date Separator */}
                {shouldShowDateSeparator(index) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center my-2"
                  >
                    <div className="bg-black/10 px-3 py-1 rounded-full text-xs text-gray-600 font-medium">
                      {formatDateSeparator()}
                    </div>
                  </motion.div>
                )}
                
                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`whatsapp-message ${
                      isUser 
                        ? 'whatsapp-message-outgoing' 
                        : 'whatsapp-message-incoming'
                    }`}
                  >
                    <p 
                      className={`whatsapp-text ${
                        isRTL ? 'whatsapp-text-hebrew' : 'whatsapp-text-english'
                      }`}
                    >
                      {message.text}
                    </p>
                    
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="whatsapp-timestamp">
                        {getDisplayTimestamp(message)}
                      </span>
                      
                      {/* WhatsApp checkmarks for sent messages */}
                      {isUser && (
                        <div className="whatsapp-checkmarks">
                          <svg 
                            width="16" 
                            height="12" 
                            viewBox="0 0 16 12" 
                            className={`whatsapp-checkmark ${
                              message.isRead ? 'whatsapp-checkmark-read' : ''
                            }`}
                          >
                            <path 
                              fill="currentColor" 
                              d="M11.067,3.87,6.033,8.9,4.4,7.267a.4.4,0,1,0-.57.57L5.763,9.77a.4.4,0,0,0,.57,0L11.637,4.44a.4.4,0,1,0-.57-.57Z"
                            />
                            {message.isDelivered && (
                              <path 
                                fill="currentColor" 
                                d="M6.067,3.87,1.033,8.9L-.6,7.267a.4.4,0,1,0-.57.57L.763,9.77a.4.4,0,0,0,.57,0L6.637,4.44a.4.4,0,1,0-.57-.57Z"
                              />
                            )}
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-start"
            >
              <div className="whatsapp-typing">
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* WhatsApp Input Area - Auto-resizing */}
      <div className="whatsapp-input-area safe-area-bottom">
        <div className={`flex items-end gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="ghost" size="sm" className="text-gray-600 mb-2">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isRTL ? 'הקלד הודעה...' : 'Type a message...'}
              className="whatsapp-input w-full resize-none"
              dir={isRTL ? 'rtl' : 'ltr'}
              style={{ 
                textAlign: isRTL ? 'right' : 'left',
                height: `${textareaHeight}px`,
                minHeight: '44px',
                maxHeight: '220px', // 5 lines max
                paddingRight: isRTL ? '16px' : '48px',
                paddingLeft: isRTL ? '48px' : '16px',
              }}
              rows={1}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className={`absolute top-1/2 transform -translate-y-1/2 text-gray-600 ${
                isRTL ? 'right-2' : 'left-2'
              }`}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className={`whatsapp-send-button mb-2 ${
              !inputMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''
            } ${isRTL ? 'order-first' : ''}`}
          >
            <img src={sendIcon} alt="Send" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}; 