// Main conversation library index
// Centralized exports for all conversation-related modules
// Force IDE re-cache: Updated to resolve module resolution issues

// Type definitions
export * from './types';

// Conversation data
export * from './hebrew';
export * from './english';

// Utilities and services
export * from './conversationCycler';

// Re-export commonly used types for convenience
export type {
  ConversationMessage,
  ConversationFlow,
  ConversationLibrary,
  ConversationLibraries,
  ChatMessage
} from './types';

// Re-export main conversation data
export { hebrewConversations } from './hebrew';
export { englishConversations } from './english';

// Re-export utilities
export { ConversationCycler, convertToMockupFormat } from './conversationCycler';
export { testEnhancedConversations } from './test-enhanced';
export { verifyConversationRequirements, testConversationForFinancing } from './verification'; 