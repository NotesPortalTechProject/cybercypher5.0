# CypherCypher 5.0 - AI-Powered Ticket System

A support ticket system with an AI agent that automatically analyzes tickets and suggests solutions.

---

## How It Works (Simple Version)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   User      │ ──▶  │   Backend   │ ──▶  │   AI Agent  │
│  (Browser)  │ ◀──  │  (FastAPI)  │ ◀──  │  (Gemini)   │
└─────────────┘      └─────────────┘      └─────────────┘
```

### 1. Users Submit Tickets
- A user visits the website and logs in
- They fill out a form describing their problem
- The ticket gets saved to the system

### 2. Support Team Views Tickets
- Dev/support users log in and see all tickets
- They can click "Ask AI" on any ticket
- This opens the **Agent Analysis Panel**

### 3. AI Agent Analyzes the Ticket
The AI agent does 5 things automatically:

| Step | What It Does |
|------|--------------|
| **Read** | Reads the ticket content |
| **Extract** | Pulls out key info (merchant ID, error codes) |
| **Search Logs** | Looks up related system logs |
| **Find Docs** | Searches documentation for relevant guides |
| **Diagnose** | Uses Google Gemini to create a diagnosis and suggested reply |

### 4. Support Gets a Ready-to-Send Reply
- The AI shows its thinking process step-by-step
- Provides a diagnosis with confidence score
- Suggests a reply that can be edited and sent

---

## Tech Stack

| Part | Technology |
|------|------------|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Python, FastAPI |
| AI Agent | LangGraph + Google Gemini |
| Database | Supabase (users), In-memory (tickets) |

---

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
Runs on http://localhost:8000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:3000

---

## Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run this SQL in the Supabase SQL Editor:

```sql
CREATE TABLE cc_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'dev')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add sample users
INSERT INTO cc_users (name, email, password, role) VALUES
  ('Arya', 'arya@gmail.com', 'password123', 'user'),
  ('Arhaan', 'arhaan@gmail.com', 'devpass456', 'dev');
```

---

## Environment Variables

Create `backend/.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GOOGLE_API_KEY=your_gemini_api_key
```

---

## Project Structure

```
cyphercypher5.0/
├── backend/
│   ├── main.py          # FastAPI app (login, tickets)
│   ├── agent.py         # LangGraph AI agent
│   ├── router.py        # /agent/analyze endpoint
│   ├── mock_db.py       # Fake logs & docs for testing
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── page.js      # Main page (login, tickets)
│   │   └── globals.css
│   └── components/
│       └── AgentInsightPanel.tsx  # AI analysis modal
```

---

## How the AI Agent Works (Technical)

The agent uses **LangGraph** to run a sequence of steps:

```
extract_metadata → search_logs → search_docs → generate_solution
```

Each step updates a shared state object:

```python
{
  "ticket_text": "...",
  "merchant_id": "m_123",
  "logs_found": ["Error: 403..."],
  "relevant_docs": ["API Guide..."],
  "diagnosis": "The API key is invalid...",
  "confidence_score": 0.85,
  "recommended_action": "Dear customer...",
  "steps_log": ["Found merchant ID", "Checked logs", ...]
}
```

The final `generate_solution` step calls **Google Gemini** with all the gathered context to produce a diagnosis and suggested reply.

---

## License

MIT
