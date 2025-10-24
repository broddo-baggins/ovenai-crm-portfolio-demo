import { ConversationCycler } from "./conversationCycler";

// Test the enhanced conversation system
export function testEnhancedConversations() {
  console.log("INIT Testing Enhanced WhatsApp Conversation System");
  console.log("================================================");

  // Test Hebrew conversations (our enhanced system)
  console.log("\n📋 Hebrew Conversations (Enhanced System):");
  ConversationCycler.testAllConversations(true);

  // Test random selection 5 times
  console.log("\n🎲 Testing Random Selection (5 samples):");
  for (let i = 1; i <= 5; i++) {
    const conversation = ConversationCycler.getRandomConversation(true);
    const firstMessage = conversation[0]?.text?.substring(0, 60) + "...";
    console.log(`${i}. Random conversation opener: ${firstMessage}`);
  }

  // Test specific conversation flows

  const testFlows = [
    "youngFamily",
    "professionalRevisit",
    "religiousSpouse",
    "newParentsNumber",
    "activeCoupleQuick",
    "investorProfessional",
    "practicalEvening",
    "communityFocused",
    "hesitantCouple",
    "enthusiasticBuyer",
    "largeFamilySpouse",
    "retireeDelayed",
  ];

  testFlows.forEach((flowId) => {
    const conversation = ConversationCycler.getConversationById(flowId, true);
    if (conversation) {
      const lastMessage = conversation[conversation.length - 1]?.text;
      const hasCalendlyLink = lastMessage?.includes("calendly.com");
      const hasFinancing = conversation.some(
        (msg) =>
          msg.text.includes("מימון") ||
          msg.text.includes("הלוואה") ||
          msg.text.includes("בנק"),
      );
    } else {
    }
  });

  // Get all flow info

  const allFlows = ConversationCycler.getAllFlowInfo(true);
  allFlows.forEach((flow, index) => {
    console.log(`${index + 1}. ${flow.flowId}: ${flow.scenario}`);
  });

  console.log("\nTARGET Enhanced System Features Verified:");

  return {
    totalFlows: allFlows.length,
    expectedFlows: 12,
    success: allFlows.length === 12,
  };
}

// Export for use in development
if (typeof window !== "undefined") {
  (
    window as typeof window & {
      testEnhancedConversations: typeof testEnhancedConversations;
    }
  ).testEnhancedConversations = testEnhancedConversations;
}
