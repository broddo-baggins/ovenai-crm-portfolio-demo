// Simple test file for conversation library
import { ConversationCycler } from "./conversationCycler";

// Test the conversation cycling system
export function testConversationLibrary() {
  console.log("TEST Testing Conversation Library...\n");

  // Reset cycling for clean test
  ConversationCycler.resetCycle();

  // Test Hebrew conversations

  for (let i = 0; i < 3; i++) {
    const conversation = ConversationCycler.getNextConversation(true);
    const flowInfo = ConversationCycler.getCurrentFlowInfo(true);
    console.log(
      `${i + 1}. ${flowInfo.scenario} (${conversation.length} messages)`,
    );
    console.log(`   Opening: "${conversation[0].text.substring(0, 50)}..."`);
  }

  console.log("\nMOBILE Testing English Conversations:");
  ConversationCycler.resetCycle();
  for (let i = 0; i < 3; i++) {
    const conversation = ConversationCycler.getNextConversation(false);
    const flowInfo = ConversationCycler.getCurrentFlowInfo(false);
    console.log(
      `${i + 1}. ${flowInfo.scenario} (${conversation.length} messages)`,
    );
    console.log(`   Opening: "${conversation[0].text.substring(0, 50)}..."`);
  }
}

// Uncomment to run test
// testConversationLibrary();
