import { hebrewConversations } from './hebrew';
import { englishConversations } from './english';
import { ConversationFlow } from './types';

export class ConversationCycler {
  // Get a truly random conversation flow
  private static getRandomFlow(isHebrew: boolean): ConversationFlow {
    const library = isHebrew ? hebrewConversations : englishConversations;
    const randomIndex = Math.floor(Math.random() * library.flows.length);
    return library.flows[randomIndex];
  }

  // Get a random hook (for backward compatibility, though new flows include integrated openers)
  private static getRandomHook(isHebrew: boolean): string {
    const library = isHebrew ? hebrewConversations : englishConversations;
    const randomIndex = Math.floor(Math.random() * library.hooks.length);
    return library.hooks[randomIndex];
  }

  // Enhanced method: Get a complete random conversation with integrated opener
  public static getRandomConversation(isHebrew: boolean): { text: string; sender: 'user' | 'agent' }[] {
    const flow = this.getRandomFlow(isHebrew);
    
    // Convert the flow messages directly (the opener is already the first message)
    const conversation: { text: string; sender: 'user' | 'agent' }[] = [];
    
    flow.messages.forEach(([sender, text]) => {
      conversation.push({
        text,
        sender: sender === 'lead' ? 'user' : 'agent'
      });
    });
    
    return conversation;
  }

  // Legacy method for backward compatibility - now also uses random selection
  public static getNextConversation(isHebrew: boolean): { text: string; sender: 'user' | 'agent' }[] {
    return this.getRandomConversation(isHebrew);
  }

  public static getCurrentFlowInfo(isHebrew: boolean): { flowId: string; scenario: string; totalFlows: number; currentIndex: number } {
    const library = isHebrew ? hebrewConversations : englishConversations;
    // Since we're using random selection, we can't provide a meaningful "current index"
    // Instead, we'll provide info about the total available flows
    const randomFlow = this.getRandomFlow(isHebrew);
    
    return {
      flowId: randomFlow.id,
      scenario: randomFlow.scenario,
      totalFlows: library.flows.length,
      currentIndex: Math.floor(Math.random() * library.flows.length) + 1 // Random index for display
    };
  }

  // Get conversation flow by specific ID (useful for testing specific scenarios)
  public static getConversationById(flowId: string, isHebrew: boolean): { text: string; sender: 'user' | 'agent' }[] | null {
    const library = isHebrew ? hebrewConversations : englishConversations;
    const flow = library.flows.find(f => f.id === flowId);
    
    if (!flow) return null;
    
    const conversation: { text: string; sender: 'user' | 'agent' }[] = [];
    flow.messages.forEach(([sender, text]) => {
      conversation.push({
        text,
        sender: sender === 'lead' ? 'user' : 'agent'
      });
    });
    
    return conversation;
  }

  // Get list of all available conversation flow IDs and scenarios
  public static getAllFlowInfo(isHebrew: boolean): { flowId: string; scenario: string }[] {
    const library = isHebrew ? hebrewConversations : englishConversations;
    return library.flows.map(flow => ({
      flowId: flow.id,
      scenario: flow.scenario
    }));
  }

  // Reset method (now less relevant with true random selection, but kept for compatibility)
  public static resetCycle(): void {
    // With true random selection, there's no cycle to reset
    // This method is kept for backward compatibility but doesn't do anything
    console.log('Random conversation system - no cycle to reset');
  }

  // New method: Get conversation starter info for a specific flow
  public static getConversationStarter(flowId: string, isHebrew: boolean): { opener: string; project: string; lead: string; startsWithQuestion?: boolean } | null {
    const library = isHebrew ? hebrewConversations : englishConversations;
    const flow = library.flows.find(f => f.id === flowId);
    
    if (!flow || flow.messages.length === 0) return null;
    
    // Extract info from the first message and flow structure
    const firstMessage = flow.messages[0];
    const isAgentFirst = firstMessage[0] === 'agent';
    
    // For flows that start with lead questions, we need different handling
    const startsWithQuestion = !isAgentFirst;
    
    return {
      opener: firstMessage[1],
      project: this.extractProjectFromScenario(flow.scenario),
      lead: this.extractLeadFromMessage(firstMessage[1]),
      startsWithQuestion
    };
  }

  // Helper method to extract project name from scenario
  private static extractProjectFromScenario(scenario: string): string {
    // Extract project name from scenario descriptions
    const projectMap: { [key: string]: string } = {
      'משפחה צעירה': 'פסגת השרון – Herzliya',
      'אנש מקצוע': 'נופי הדר – Petah Tikva',
      'משפחה חרדית': 'מגדלי רותם – Haifa',
      'הורים צעירים': 'אפקה ירוקה – Rishon LeZion',
      'זוג צעיר פעיל': 'פנורמה – Netanya',
      'משקיע מקצועי': 'הדקל החדש – Be\'er Sheva',
      'קונה מעשי': 'שכונת הזית – Modi\'in',
      'מתמקד בקהילה': 'גני תקווה – Givat Shmuel',
      'זוג מתלבט': 'עיר ימים – Netanya',
      'קונה נלהב': 'נווה צדק החדש – Tel Aviv',
      'משפחה גדולה': 'רמת השרון הירוקה – Ramat HaSharon',
      'זוג פנסיונרים': 'נווה שאנן – Herzliya'
    };
    
    for (const [key, project] of Object.entries(projectMap)) {
      if (scenario.includes(key)) {
        return project;
      }
    }
    return 'פרויקט נדל"ן מעולה';
  }

  // Helper method to extract lead name from message
  private static extractLeadFromMessage(message: string): string {
    const names = ['רחל', 'עמית', 'שרה', 'יעל', 'דן', 'מיכאל', 'טל', 'רוני', 'דנה', 'מאיה', 'אברהם', 'רות'];
    for (const name of names) {
      if (message.includes(name)) {
        return name;
      }
    }
    return 'לקוח פוטנציאלי';
  }

  // New method: Test all conversation flows (useful for debugging)
  public static testAllConversations(isHebrew: boolean): void {
    const library = isHebrew ? hebrewConversations : englishConversations;
    console.log(`=== Testing ${library.flows.length} Enhanced Conversation Flows ===`);
    
    library.flows.forEach((flow, index) => {
      console.log(`\n${index + 1}. Flow ID: ${flow.id}`);
      console.log(`   Scenario: ${flow.scenario}`);
      console.log(`   Messages: ${flow.messages.length}`);
      console.log(`   First message: ${flow.messages[0]?.[1]?.substring(0, 50)}...`);
      
      // Check for special features
      const hasTimeDelay = flow.id.includes('revisit') || flow.id.includes('evening') || flow.id.includes('delayed');
      const hasSpouseConsultation = flow.id.includes('spouse') || flow.id.includes('hesitant') || flow.id.includes('family');
      const hasNumberSwitch = flow.id.includes('number');
      
      const features = [];
      if (hasTimeDelay) features.push('Time Delay');
      if (hasSpouseConsultation) features.push('Spouse Consultation');
      if (hasNumberSwitch) features.push('Number Switch');
      
      if (features.length > 0) {
        console.log(`   Special Features: ${features.join(', ')}`);
      }
    });
    
    console.log(`\n=== Total: ${library.flows.length} conversation flows ===`);
    
    
    
    
  }
}

// Utility function to convert conversation flow to ChatMockup format
export function convertToMockupFormat(conversation: { text: string; sender: 'user' | 'agent' }[]): { text: string; sender: 'user' | 'agent' }[] {
  return conversation.map(message => ({
    text: message.text,
    sender: message.sender
  }));
} 