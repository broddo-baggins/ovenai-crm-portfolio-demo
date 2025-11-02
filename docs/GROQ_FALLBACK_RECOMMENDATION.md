# Groq Fallback Recommendation for CRM Agent

## Current State
The CRM Demo Assistant (`geminiService.ts`) uses Google Gemini AI with mock fallbacks when Gemini fails or is unavailable.

## Recommendation
Implement Groq (not "Grok") as an intermediate fallback before falling back to mock responses.

### Benefits
- **Higher uptime**: Groq provides 14,400 requests/day vs Gemini's 50 requests/day (free tier)
- **Faster inference**: Groq uses optimized LPU (Language Processing Unit) for sub-second responses
- **Better UX**: Real AI responses instead of static mock responses when Gemini quota is exhausted

### Implementation Steps

1. **Install Groq SDK**
```bash
npm install groq-sdk
```

2. **Add Environment Variable**
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

3. **Update `geminiService.ts`**
Add Groq fallback similar to ShellCV's `ai-agent.js` implementation:

```typescript
import Groq from 'groq-sdk';

// Initialize Groq client
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true }) : null;

// In queryAgent function, add Groq fallback:
try {
  // Try Gemini first
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
} catch (geminiError) {
  console.warn('Gemini failed, trying Groq fallback...');
  
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: CRM_DEMO_ASSISTANT_PROMPT },
          { role: 'user', content: question }
        ],
        model: 'llama-3.3-70b-versatile', // Best free model
        temperature: 0.7,
        max_tokens: 2048,
      });
      
      return completion.choices[0]?.message?.content || '';
    } catch (groqError) {
      console.error('Groq also failed:', groqError);
    }
  }
  
  // Final fallback to mock responses
  return getMockResponse(question);
}
```

### Fallback Chain
1. **Gemini** (Primary) - High quality, 50 req/day
2. **Groq** (Secondary) - Fast, 14,400 req/day  
3. **Mock Responses** (Final) - Always available

### Reference
See `/Users/amity/projects/shellcv/ai-agent.js` lines 596-838 for complete working implementation.

