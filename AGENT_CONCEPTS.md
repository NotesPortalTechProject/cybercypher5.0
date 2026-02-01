# Agent Insight Engine - Technical Concepts

A comprehensive overview of how the AI-powered ticket analysis agent works.

---

## 1. What the Agent Does

### Core Purpose

The Agent Insight Engine is an **automated support ticket analyzer** that:

- **Reads** incoming support tickets from customers
- **Extracts** relevant metadata (merchant IDs, error codes)
- **Correlates** ticket content with system logs and documentation
- **Diagnoses** the root cause of reported issues
- **Generates** professional response drafts for support staff

The agent acts as a "first-line analyst" that does the heavy lifting of investigation, allowing human support agents to focus on customer communication and complex edge cases.

### Role in the System

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Customer   │────▶│   Ticket     │────▶│    Agent     │
│   (User)     │     │   System     │     │   Engine     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                     │
                            ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   Support    │◀────│   Analysis   │
                     │   Staff      │     │   Results    │
                     └──────────────┘     └──────────────┘
```

**Position in Workflow:**
1. Sits between ticket submission and human review
2. Processes tickets asynchronously on-demand
3. Provides decision support (not autonomous action)
4. Humans retain final authority on responses

---

## 2. How the Agent Thinks

### Decision Logic

The agent uses a **sequential reasoning pipeline** built with LangGraph:

```
┌─────────────────┐
│ Extract Metadata│  ← Identifies merchant ID, error codes
└────────┬────────┘
         ▼
┌─────────────────┐
│  Search Logs    │  ← Looks up system logs for the merchant
└────────┬────────┘
         ▼
┌─────────────────┐
│  Search Docs    │  ← Finds relevant documentation articles
└────────┬────────┘
         ▼
┌─────────────────┐
│Generate Solution│  ← Uses LLM to synthesize diagnosis
└─────────────────┘
```

**Reasoning Framework:**
- **Evidence-based**: Decisions are grounded in logs and documentation
- **Structured output**: Forces JSON format for consistent parsing
- **Confidence scoring**: Quantifies certainty (0.0 to 1.0)
- **Fallback handling**: Graceful degradation when data is missing

### When and How It Acts

**Trigger Conditions:**
| Trigger | Action |
|---------|--------|
| User clicks "Analyze with AI" | POST `/agent/analyze` called |
| Ticket has merchant_id | Skip extraction, use metadata directly |
| No merchant_id found | Attempt regex patterns, then LLM extraction |
| Logs found for merchant | Include in context for diagnosis |
| Rate limit hit (429) | Exponential backoff retry (5s, 10s, 20s) |

**Action Mechanisms:**
```python
# State accumulates through each node
state = {
    "ticket_text": "...",      # Input
    "merchant_id": "m_123",    # Extracted or provided
    "logs_found": [...],       # From log lookup
    "relevant_docs": [...],    # From doc search
    "diagnosis": "...",        # Generated
    "confidence_score": 0.85,  # Calculated
    "recommended_action": ".." # Draft reply
}
```

---

## 3. System Structure

### Key Components

| Component | File | Responsibility |
|-----------|------|----------------|
| **FastAPI App** | `main.py` | HTTP server, ticket CRUD, user auth |
| **Agent Router** | `router.py` | `/agent/*` endpoints, request logging |
| **LangGraph Agent** | `agent.py` | Workflow orchestration, LLM calls |
| **Mock Database** | `mock_db.py` | Simulated logs and documentation |
| **Frontend Panel** | `AgentInsightPanel.tsx` | UI for analysis results |

### How They Work Together

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                  │
│  ┌─────────────────┐    ┌────────────────────────────┐  │
│  │   page.js       │───▶│  AgentInsightPanel.tsx     │  │
│  │   (Tickets)     │    │  (Analysis Modal)          │  │
│  └─────────────────┘    └────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │ POST /agent/analyze
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                   │
│  ┌─────────────────┐    ┌────────────────────────────┐  │
│  │   main.py       │───▶│  router.py                 │  │
│  │   (App)         │    │  (Agent Endpoints)         │  │
│  └─────────────────┘    └────────────────────────────┘  │
│                                │                         │
│                                ▼                         │
│  ┌─────────────────┐    ┌────────────────────────────┐  │
│  │   mock_db.py    │◀───│  agent.py                  │  │
│  │   (Data)        │    │  (LangGraph Workflow)      │  │
│  └─────────────────┘    └────────────────────────────┘  │
│                                │                         │
│                                ▼                         │
│                         Google Gemini API                │
└─────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. Frontend sends `{ ticket_text, merchant_id }` to backend
2. Router validates request and invokes agent
3. Agent runs 4-node graph sequentially
4. Each node reads/writes to shared state
5. Final state returned as JSON response
6. Frontend renders results with markdown support

---

## 4. Performance & Efficiency

### Speed Considerations

| Metric | Current Value | Optimization |
|--------|---------------|--------------|
| **Typical Response** | 8-15 seconds | LLM is the bottleneck |
| **Without LLM** | < 100ms | Pure data lookups are fast |
| **Rate Limited** | +5-20s | Exponential backoff waits |

**Optimizations Implemented:**
- **Skip extraction**: If `merchant_id` is provided, skip LLM call for extraction
- **Cached docs**: Documentation is in-memory (no DB round-trip)
- **Parallel-capable**: LangGraph supports parallel nodes (not used yet)
- **Streaming potential**: Could stream `steps_log` for real-time UI updates

### Resource Usage

```
Memory Footprint:
├── FastAPI Server:     ~50 MB base
├── LangGraph State:    ~1 KB per request
├── Mock DB:            ~10 KB (in-memory)
└── LLM Context:        ~4 KB per request (sent to API)

CPU Usage:
├── Regex extraction:   < 1ms
├── Log/doc search:     < 5ms
├── JSON parsing:       < 1ms
└── Network I/O:        Dominant factor (waiting for Gemini)
```

**Efficiency Notes:**
- Stateless design: Each request is independent
- No persistent connections: Uses standard HTTP to Gemini
- Memory-efficient: State objects are short-lived

---

## 5. Built to Work in Reality

### Integration Points

| External System | Integration Method | Purpose |
|-----------------|-------------------|---------|
| **Google Gemini** | REST API via LangChain | LLM inference |
| **Supabase** | Python client | User authentication |
| **VS Code** | `code` CLI command | Open projects from UI |
| **Frontend** | CORS-enabled REST | Web application |

**API Contracts:**
```python
# Analyze Endpoint
POST /agent/analyze
Request:  { "ticket_text": str, "merchant_id": str | null }
Response: { "diagnosis": str, "confidence_score": float, ... }

# Stats Endpoint
GET /agent/stats
Response: { "total_requests": int, "success_rate": str }
```

### Operational Feasibility

**Deployment Requirements:**
- Python 3.11+ with FastAPI
- Node.js 18+ for frontend
- Google API key for Gemini
- Supabase project for user auth

**Maintenance Considerations:**
- **Logs**: Request history stored (last 100 requests)
- **Monitoring**: Stats endpoint for success rate tracking
- **Debugging**: Full traceback logging on errors
- **Rate Limits**: Built-in retry logic for API quotas

---

## 6. Learning & Improvement

### Feedback Signals

Currently, the agent has **limited learning capabilities**:

| Signal | Collection Method | Usage |
|--------|------------------|-------|
| **Confidence Score** | LLM self-assessment | Displayed to user |
| **Request Success/Fail** | Backend logging | Stats monitoring |
| **User Actions** | Not tracked yet | Could inform improvements |

**Potential Feedback Loops:**
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Agent   │────▶│  User    │────▶│ Feedback │
│  Output  │     │  Review  │     │  Signal  │
└──────────┘     └──────────┘     └──────────┘
                                        │
     ┌──────────────────────────────────┘
     ▼
┌──────────────────────────────────────────┐
│  Potential Improvements:                  │
│  • Track which responses get edited       │
│  • Log approved vs rejected suggestions   │
│  • A/B test different prompts             │
│  • Fine-tune on successful interactions   │
└──────────────────────────────────────────┘
```

### How It Gets Better Over Time

**Current State:**
- No active learning (prompts are static)
- No feedback collection from users
- Performance visible via `/agent/stats`

**Improvement Pathways:**

1. **Prompt Engineering**
   - Analyze low-confidence outputs
   - Refine system prompts based on patterns

2. **Knowledge Base Expansion**
   - Add more documentation articles
   - Include real historical tickets

3. **Human-in-the-Loop**
   - Track when users edit responses
   - Use edited versions as training signal

4. **Retrieval Augmentation**
   - Replace mock_db with real vector database
   - Implement semantic search over docs

---

## 7. Advanced Intelligence

### ML Usage

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **LLM** | Google Gemini 2.0 Flash | Diagnosis generation, response drafting |
| **Extraction** | Regex + LLM fallback | Merchant ID parsing |
| **Search** | Keyword matching | Documentation retrieval |

**LLM Configuration:**
```python
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.3,      # Low randomness for consistency
    max_retries=3,        # Built-in retry logic
)
```

**Prompt Engineering:**
- System prompt defines "expert support agent" persona
- Structured JSON output enforced
- Context includes: ticket, logs, docs
- Guidelines for tone and formatting

### Why It Adds Value

| Without Agent | With Agent |
|---------------|------------|
| Manual log lookup | Automatic correlation |
| Search docs yourself | Relevant articles surfaced |
| Write response from scratch | Draft provided instantly |
| Inconsistent quality | Standardized format |
| 10-30 min per ticket | 10-15 seconds + review |

**ROI Factors:**
1. **Time Savings**: 80%+ reduction in investigation time
2. **Consistency**: Every ticket gets same thorough analysis
3. **Knowledge Access**: Junior staff get senior-level insights
4. **Scalability**: Handle 10x tickets with same team

---

## Summary

The Agent Insight Engine demonstrates a practical **LLM-powered workflow automation** pattern:

- **Structured reasoning** via LangGraph's node-based architecture
- **Hybrid intelligence** combining deterministic rules with AI generation
- **Production readiness** with error handling, logging, and retry logic
- **Human-centered design** providing decision support, not autonomous action

The system is designed to augment human support staff, not replace them—turning complex technical investigation into a streamlined, consistent process.
