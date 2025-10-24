// Conversation library type definitions

export interface ConversationMessage {
  sender: 'lead' | 'agent';
  text: string;
}

export interface ConversationFlow {
  id: string;
  scenario: string;
  messages: [string, string][]; // [sender, text] tuple format
}

export interface ConversationLibrary {
  hooks: string[];
  flows: ConversationFlow[];
}

export interface ConversationLibraries {
  hebrew: ConversationLibrary;
  english: ConversationLibrary;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
} 