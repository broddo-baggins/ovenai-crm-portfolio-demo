# Conversation Library

This folder contains the organized conversation library for the Lead-Reviver landing page chat mockup. The system cycles through different conversation flows to showcase various real estate scenarios.

## 📁 Folder Structure

```
conversations/
├── README.md                 # This documentation
├── index.ts                  # Main exports
├── types.ts                  # TypeScript type definitions
├── hebrew.ts                 # Hebrew conversation flows
├── english.ts                # English conversation flows
└── conversationCycler.ts     # Cycling logic and utilities
```

## 🔄 How It Works

The conversation library cycles through different flows every ~70 seconds on the landing page:

1. **Sequential Flow Cycling**: Each conversation uses a different flow (Young Couple → Investor → Family → Tech Worker → Follow-up → Price Concern → repeat)
2. **Hook Variation**: Each flow starts with a rotating hook message from the agent
3. **Language Support**: Separate libraries for Hebrew and English
4. **Organized Structure**: Easy to edit and maintain

## 📝 Adding New Conversations

### 1. Adding a New Flow

Edit `hebrew.ts` or `english.ts`:

```typescript
{
  id: "new-flow-id",
  scenario: "Short Description · Key Points",
  messages: [
    ["lead", "Lead's opening message"],
    ["agent", "Agent's response"],
    ["lead", "Lead's follow-up"],
    ["agent", "Agent closes or schedules"]
  ]
}
```

### 2. Adding New Hooks

Add to the `hooks` array in either language file:

```typescript
hooks: [
  "New opening message from agent 🏠",
  // ... existing hooks
]
```

## 🎭 Available Conversation Types

### Hebrew Flows:
- **זוג צעיר**: Young couple looking for 3-room apartment near light rail
- **משקיע**: Investor interested in Airbnb potential and yields
- **משפחה גדולה**: Big family needing 6 rooms, asking about schools
- **עובד הייטק**: Tech worker with 3M budget, commute focused
- **תזכורת**: Follow-up conversation for scheduling
- **יקר מדי**: Price objection handling with financing solution

### English Flows:
- **Young Couple**: Home seekers focused on commute convenience
- **Investor**: Airbnb yield and financing options
- **Big Family**: School proximity and penthouse options
- **Tech Commuter**: Budget-focused with specific requirements
- **Follow-up**: Scheduling assistance and link issues
- **Price Concern**: Financing solutions for budget constraints

## 🛠 Usage in Components

```typescript
import { ConversationCycler } from '@/data/conversations';

// Get next conversation for current language
const conversation = ConversationCycler.getNextConversation(isHebrew);

// Get flow information for debugging
const flowInfo = ConversationCycler.getCurrentFlowInfo(isHebrew);

// Reset cycling (useful for testing)
ConversationCycler.resetCycle();
```

## ⚙️ Technical Details

- **Type Safety**: Full TypeScript support with defined interfaces
- **Memory Efficient**: Global state tracking without heavy objects
- **Responsive**: Adapts to current language setting
- **Maintainable**: Clear separation of concerns and easy editing

## 🎯 Editing Guidelines

1. **Keep scenarios short**: Use bullet points (·) to separate key aspects
2. **Natural flow**: Each conversation should feel realistic
3. **Clear outcomes**: Most flows should end with scheduling or next steps
4. **Cultural adaptation**: Hebrew and English versions should feel native, not translated
5. **Consistent timing**: Aim for 6-8 message exchanges per flow

## 🔧 Debugging

The system includes flow information tracking:

```typescript
const info = ConversationCycler.getCurrentFlowInfo(isHebrew);
console.log(`Current: ${info.scenario} (${info.currentIndex}/${info.totalFlows})`);
```

This helps verify cycling is working correctly and identify which conversation is currently playing. 