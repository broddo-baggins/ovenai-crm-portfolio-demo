# Groq AI Fallback - Setup Guide

## ✅ Implementation Complete

The CRM AI Assistant now has a robust three-tier fallback system that automatically switches between AI providers when one fails or runs out of quota.

## Fallback Chain

```
1. Gemini (Primary) → 2. Groq (Fallback) → 3. Mock Responses (Final)
```

### When Each Tier Activates

- **Gemini**: Always tried first if API key is configured
- **Groq**: Activates when:
  - Gemini API key is missing
  - Gemini rate limit/quota exceeded
  - Gemini service unavailable
  - Any Gemini API error occurs
- **Mock Responses**: Only when both Gemini AND Groq are unavailable

## Current Configuration

### Vercel (Production)
Your Groq API key is already configured in Vercel:
```
VITE_GROQ_API_KEY=gsk_YOUR_GROQ_API_KEY_HERE
```

**✅ No action needed** - The fallback will automatically work in production when Gemini quota is exhausted.

### Local Development

If you want to test the Groq fallback locally, add to your `.env.local`:

```bash
VITE_GROQ_API_KEY=gsk_YOUR_GROQ_API_KEY_HERE
```

## How It Works

### Code Flow

1. **User asks a question** to the AI Assistant
2. **RAG Search**: System searches knowledge base for relevant docs
3. **Gemini Attempt**: 
   - Tries to call Gemini API with RAG context
   - If successful → Returns Gemini response ✅
   - If fails → Go to step 4
4. **Groq Fallback**:
   - Automatically tries Groq API with same RAG context
   - If successful → Returns Groq response with "⚡ Powered by Groq" indicator ✅
   - If fails → Go to step 5
5. **Mock Response**: Returns context-aware mock response ✅

### Console Logging

You'll see these messages in the browser console:

**Success with Gemini:**
```
🔍 Searching knowledge base for: [question]
📚 Found X relevant documents
🤖 Querying Gemini AI with RAG context...
✅ Gemini response received
```

**Success with Groq (Fallback):**
```
🔍 Searching knowledge base for: [question]
📚 Found X relevant documents
🤖 Querying Gemini AI with RAG context...
⚠️ Gemini failed, trying Groq fallback...
🔄 Attempting Groq fallback...
✅ Groq response received
```

**Mock Response (Both Failed):**
```
🔍 Searching knowledge base for: [question]
📚 Found X relevant documents
🤖 Querying Gemini AI with RAG context...
⚠️ Gemini failed, trying Groq fallback...
🔄 Attempting Groq fallback...
❌ Groq also failed: [error]
📋 Using mock responses (both Gemini and Groq unavailable)
```

## Testing the Fallback

### Test Scenario 1: Normal Operation (Gemini)
```bash
# In Vercel or .env.local
VITE_GEMINI_API_KEY=<valid_gemini_key>
VITE_GROQ_API_KEY=<your_groq_key>
```
**Expected**: Uses Gemini, Groq stays ready as backup

### Test Scenario 2: Groq Fallback
```bash
# Remove or use invalid Gemini key
VITE_GEMINI_API_KEY=invalid_key_or_empty
VITE_GROQ_API_KEY=gsk_YOUR_GROQ_API_KEY_HERE
```
**Expected**: Skips Gemini, uses Groq successfully

### Test Scenario 3: Mock Responses
```bash
# Remove both keys
VITE_GEMINI_API_KEY=
VITE_GROQ_API_KEY=
```
**Expected**: Uses intelligent mock responses based on question context

## API Quotas & Limits

| Provider | Free Tier Limit | Speed | Quality |
|----------|----------------|-------|---------|
| **Gemini** | ~50 req/day | Medium | High |
| **Groq** | 14,400 req/day | Very Fast (LPU) | High |
| **Mock** | Unlimited | Instant | Static |

## Benefits

✅ **High Availability**: With Groq fallback, you get 14,400+ daily requests  
✅ **Automatic Failover**: No manual intervention needed  
✅ **Consistent UX**: Real AI responses even when primary fails  
✅ **Fast Performance**: Groq's LPU provides sub-second responses  
✅ **Cost Effective**: Free tiers for both providers  
✅ **RAG Maintained**: Knowledge base search works across all tiers  

## Production Ready

The implementation is **production-ready** and will automatically activate in Vercel with your existing Groq key. When Gemini quota runs out, users will seamlessly get Groq-powered responses without any downtime.

## Files Modified

- `src/services/geminiService.ts` - Added Groq fallback logic
- `src/config/env.ts` - Added Groq API key configuration
- `package.json` - Added `groq-sdk` dependency
- `docs/GROQ_FALLBACK_RECOMMENDATION.md` - Updated to "COMPLETED" status

## Questions?

If you notice the fallback isn't working as expected:
1. Check Vercel environment variables are set correctly
2. Check browser console for error messages
3. Verify the Groq API key is still valid at https://console.groq.com/keys

