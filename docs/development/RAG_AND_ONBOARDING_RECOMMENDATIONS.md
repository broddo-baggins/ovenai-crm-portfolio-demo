# RAG & Agent Onboarding - Implementation Recommendations

**Date**: October 27, 2025  
**Status**: Planning Phase (Not Yet Implemented)

---

## 🧠 Part 1: RAG Implementation for AI Agent

### Current State
**Location**: `src/components/agent/GeminiAgent.tsx` + `src/services/geminiService.ts`

**Current Behavior**:
- Agent uses hardcoded system prompt from `@/config/systemPrompts`
- No access to actual site documentation or code
- Relies on Gemini's general knowledge + prompt engineering
- Mock responses have static FAQ-style answers

**Agent Button Location**: TopBar (line 605-616) with Sparkles icon ✨

---

### 📚 Available Content for RAG Knowledge Base

Your CRM has **extensive documentation** that could power the agent:

```
docs/
├── README.md                              # Project overview
├── PROJECT_STRUCTURE.md                   # Complete architecture (382 lines)
├── DOCS_ORGANIZATION.md                   # Documentation guide
├── CRM_ISSUES_PROPAGATION_PLAN.md         # Issue resolution plans
├── CRM_FIXES_IMPLEMENTATION_SUMMARY.md    # Implementation details
├── fixes/
│   ├── AGENT_IMPROVEMENTS.md              # Agent features (NEW)
│   ├── BRANDING_CLEANUP_SUMMARY.md
│   └── GITIGNORE_FIX_SUMMARY.md
├── deployment/
│   └── DEPLOYMENT_GUIDE.md                # Vercel deployment
├── development/
│   ├── DEMO_NOTES.md                      # Demo configuration
│   └── MOCK_DATA_UPDATE.md                # Data procedures
├── security/
│   └── SECURITY_AUDIT.md                  # Security practices
└── archive/
    └── PROJECT_HISTORY.md                 # Historical context
```

**Plus**:
- Translation files: `public/locales/en/*.json` and `he/*.json`
- Component code: `src/components/**/*.tsx` (580+ files)
- Service documentation in code comments

---

### 🔧 RAG Implementation Options

#### **Option 1: Simple Document Chunking (Recommended for MVP)**

**Pros**: Quick to implement, no external dependencies  
**Cons**: Less intelligent retrieval

**Implementation**:
```typescript
// src/services/ragService.ts

interface DocumentChunk {
  id: string;
  title: string;
  content: string;
  source: string;
  embedding?: number[];
}

// 1. Pre-process documentation at build time
const knowledgeBase: DocumentChunk[] = [
  {
    id: 'project-structure',
    title: 'Project Architecture',
    content: `... content from PROJECT_STRUCTURE.md ...`,
    source: 'docs/PROJECT_STRUCTURE.md'
  },
  {
    id: 'agent-improvements',
    title: 'Agent Features',
    content: `... content from AGENT_IMPROVEMENTS.md ...`,
    source: 'docs/fixes/AGENT_IMPROVEMENTS.md'
  },
  // ... more chunks
];

// 2. Simple keyword-based search (no embeddings needed)
export function searchKnowledgeBase(query: string): DocumentChunk[] {
  const keywords = query.toLowerCase().split(' ');
  
  return knowledgeBase
    .map(chunk => ({
      chunk,
      score: keywords.reduce((score, keyword) => 
        chunk.content.toLowerCase().includes(keyword) ? score + 1 : score, 
        0
      )
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // Top 3 results
    .map(({ chunk }) => chunk);
}

// 3. Enhance Gemini prompt with relevant context
export async function queryAgentWithRAG(
  question: string,
  conversationHistory: Message[]
): Promise<string> {
  // Search knowledge base
  const relevantDocs = searchKnowledgeBase(question);
  
  // Build enhanced context
  const ragContext = relevantDocs
    .map(doc => `### ${doc.title}\nSource: ${doc.source}\n\n${doc.content}`)
    .join('\n\n---\n\n');
  
  // Query Gemini with enhanced prompt
  const enhancedPrompt = `
${CRM_DEMO_ASSISTANT_PROMPT}

## Relevant Documentation:
${ragContext}

---

User Question: ${question}
`;
  
  return await queryGemini(enhancedPrompt);
}
```

**Effort**: 4-6 hours  
**Accuracy**: Medium (70-80%)

---

#### **Option 2: Embedding-Based Semantic Search**

**Pros**: More intelligent, handles synonyms and concepts  
**Cons**: Requires embedding generation, more complex

**Implementation**:
```typescript
// Use Gemini embeddings API or OpenAI embeddings
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(apiKey);
const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });

// 1. Generate embeddings for all chunks (at build time)
async function generateEmbeddings() {
  for (const chunk of knowledgeBase) {
    const result = await embeddingModel.embedContent(chunk.content);
    chunk.embedding = result.embedding.values;
  }
}

// 2. Semantic search using cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function semanticSearch(query: string): Promise<DocumentChunk[]> {
  // Generate query embedding
  const result = await embeddingModel.embedContent(query);
  const queryEmbedding = result.embedding.values;
  
  // Find most similar chunks
  return knowledgeBase
    .map(chunk => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding!)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .map(({ chunk }) => chunk);
}
```

**Effort**: 8-12 hours  
**Accuracy**: High (85-95%)

---

#### **Option 3: Vector Database (Production-Grade)**

**Pros**: Scalable, fast, production-ready  
**Cons**: External dependency, hosting costs

**Stack Options**:
- **Pinecone** (easiest, free tier)
- **Supabase pgvector** (you already use Supabase!)
- **Weaviate** (open source)

**Implementation with Supabase pgvector**:
```sql
-- Enable pgvector extension
CREATE EXTENSION vector;

-- Create knowledge base table
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY,
  title TEXT,
  content TEXT,
  source TEXT,
  embedding VECTOR(768), -- Gemini embedding dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
```

```typescript
// Query with Supabase
const { data } = await supabase.rpc('match_documents', {
  query_embedding: queryEmbedding,
  match_threshold: 0.7,
  match_count: 3
});
```

**Effort**: 12-16 hours (includes setup)  
**Accuracy**: Very High (90-98%)

---

### 🎯 Recommended Approach

**Phase 1 (Quick Win)**: Option 1 - Simple Document Chunking
- Implement in 4-6 hours
- Provides immediate value
- No external dependencies
- 70-80% accuracy

**Phase 2 (Future Enhancement)**: Upgrade to Option 3 - Supabase pgvector
- Production-grade solution
- Leverage existing Supabase infrastructure
- Scalable for future content additions

---

## 🎓 Part 2: Agent Button Discovery/Onboarding

### Current State
**Button Location**: `src/components/layout/TopBar.tsx` (line 605-616)

```tsx
<Button
  variant="ghost"
  size="icon"
  className="relative h-8 w-8"
  onClick={() => setIsAgentOpen(true)}
  title="AI Assistant - Ask about this CRM"
>
  <Sparkles className="h-5 w-5 text-purple-500" />
</Button>
```

**Problem**: First-time users might not notice it!

---

### 🎨 Onboarding Options

#### **Option A: Pulsing Animation (Subtle)**

**Best For**: Minimal distraction, elegant

```tsx
<Button
  variant="ghost"
  size="icon"
  className={cn(
    "relative h-8 w-8",
    !hasSeenAgent && "animate-pulse-glow" // Custom animation
  )}
  onClick={handleAgentClick}
>
  <Sparkles className="h-5 w-5 text-purple-500" />
  
  {/* Animated ring */}
  {!hasSeenAgent && (
    <span className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
  )}
</Button>
```

**CSS**:
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(168, 85, 247, 0); }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

**Effort**: 1 hour  
**User Impact**: Low distraction

---

#### **Option B: Floating Tooltip with Arrow (Moderate)**

**Best For**: Clear instruction without being pushy

```tsx
{!hasSeenAgent && (
  <div className="absolute -bottom-16 right-0 z-50 animate-slide-up">
    <div className="relative bg-purple-600 text-white px-4 py-2 rounded-lg shadow-xl">
      {/* Arrow pointing up */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-purple-600 transform rotate-45" />
      
      <p className="text-sm font-medium">
        💡 Ask me anything about this CRM!
      </p>
      
      <button
        onClick={() => setHasSeenAgent(true)}
        className="absolute -top-2 -right-2 w-5 h-5 bg-white text-purple-600 rounded-full flex items-center justify-center text-xs"
      >
        ×
      </button>
    </div>
  </div>
)}
```

**Effort**: 2 hours  
**User Impact**: Medium attention

---

#### **Option C: Full Onboarding Modal (Comprehensive)**

**Best For**: Important feature you want users to know about

```tsx
// First visit after login
{showAgentIntro && (
  <Dialog open={true} onOpenChange={setShowAgentIntro}>
    <DialogContent className="max-w-md">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        
        <h2 className="text-2xl font-bold">
          Meet Your AI Assistant! 🤖
        </h2>
        
        <p className="text-gray-600">
          I can help you understand this CRM demo, explain features, 
          and answer questions about BANT scoring, HEAT levels, and more!
        </p>
        
        <div className="bg-purple-50 p-4 rounded-lg text-left">
          <p className="text-sm font-medium mb-2">Try asking:</p>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• "How does BANT qualification work?"</li>
            <li>• "What is the HEAT scoring system?"</li>
            <li>• "Show me the tech stack"</li>
          </ul>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAgentIntro(false)}>
            Maybe Later
          </Button>
          <Button onClick={handleOpenAgent} className="flex-1">
            <Sparkles className="w-4 h-4 mr-2" />
            Try It Now
          </Button>
        </div>
        
        <label className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <input
            type="checkbox"
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          Don't show this again
        </label>
      </div>
    </DialogContent>
  </Dialog>
)}
```

**Effort**: 3-4 hours  
**User Impact**: High attention

---

#### **Option D: Interactive Product Tour (Most Comprehensive)**

**Best For**: Full feature showcase

**Library**: [react-joyride](https://github.com/gilbarbara/react-joyride) or [intro.js](https://introjs.com/)

```tsx
import Joyride, { Step } from 'react-joyride';

const tourSteps: Step[] = [
  {
    target: '.dashboard-overview',
    content: 'Welcome to your CRM dashboard!',
    disableBeacon: true,
  },
  {
    target: '.ai-assistant-button',
    content: '🤖 Click here anytime to ask me questions about the CRM!',
    placement: 'bottom',
  },
  {
    target: '.leads-section',
    content: 'Manage your leads with BANT/HEAT scoring here.',
  },
];

<Joyride
  steps={tourSteps}
  run={shouldRunTour}
  continuous
  showProgress
  showSkipButton
  styles={{
    options: {
      primaryColor: '#a855f7', // Purple
      zIndex: 10000,
    }
  }}
/>
```

**Effort**: 6-8 hours (full tour)  
**User Impact**: Very high engagement

---

### 🎯 Recommended Approach

**Best UX Balance**: **Option B + Option A**

1. **First 3 visits**: Show floating tooltip with arrow (Option B)
2. **After dismissed**: Switch to subtle pulsing (Option A) for 5 more sessions
3. **After interaction**: Never show again

**Implementation**:
```typescript
// src/hooks/useAgentOnboarding.ts
export function useAgentOnboarding() {
  const [hasInteracted, setHasInteracted] = useState(
    localStorage.getItem('agent_interacted') === 'true'
  );
  const [visitCount, setVisitCount] = useState(
    parseInt(localStorage.getItem('agent_visit_count') || '0')
  );

  useEffect(() => {
    if (!hasInteracted) {
      const newCount = visitCount + 1;
      setVisitCount(newCount);
      localStorage.setItem('agent_visit_count', newCount.toString());
    }
  }, []);

  const showTooltip = !hasInteracted && visitCount <= 3;
  const showPulse = !hasInteracted && visitCount > 3 && visitCount <= 8;

  const markAsInteracted = () => {
    setHasInteracted(true);
    localStorage.setItem('agent_interacted', 'true');
  };

  return { showTooltip, showPulse, markAsInteracted };
}
```

**Total Effort**: 3-4 hours  
**User Experience**: Excellent balance of visibility and respect

---

## 📊 Summary & Next Steps

### RAG Implementation
| Approach | Effort | Accuracy | Recommended |
|----------|--------|----------|-------------|
| Simple Keyword | 4-6 hrs | 70-80% | ✅ MVP |
| Embeddings | 8-12 hrs | 85-95% | Later |
| Vector DB | 12-16 hrs | 90-98% | Production |

### Onboarding Implementation
| Approach | Effort | Impact | Recommended |
|----------|--------|--------|-------------|
| Pulsing Animation | 1 hr | Low | ✅ Phase 2 |
| Floating Tooltip | 2 hrs | Medium | ✅ Phase 1 |
| Onboarding Modal | 3-4 hrs | High | Optional |
| Product Tour | 6-8 hrs | Very High | Future |

### Recommended Implementation Order

**Sprint 1: Quick Wins (8-10 hours)**
1. RAG with simple keyword search (6 hours)
2. Floating tooltip onboarding (2 hours)
3. Add pulsing fallback (1 hour)
4. Test and polish (1 hour)

**Sprint 2: Enhancements (Optional)**
1. Upgrade to embedding-based RAG
2. Add full product tour
3. Analytics on agent usage

---

**Status**: Ready for implementation  
**Blocking Issues**: None  
**Dependencies**: None (all can be built with existing tech stack)

