# LangGraph Agent for Self-Healing Ticket Analysis
# Performs log lookups and doc search to diagnose issues

import re
import os
import json
import time
import operator
from typing import TypedDict, Optional, Annotated
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv
from mock_db import get_merchant_logs, search_docs

# Load environment variables
load_dotenv()

# Initialize Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.3,
    max_retries=3,
)


class AgentState(TypedDict):
    """State schema for the agent workflow."""
    ticket_text: str
    merchant_id: Optional[str]
    logs_found: list[str]
    relevant_docs: list[str]
    diagnosis: str
    confidence_score: float
    recommended_action: str
    steps_log: Annotated[list[str], operator.add]  # Accumulates steps


def extract_metadata(state: AgentState) -> dict:
    """
    Node 1: Extract merchant_id from ticket text.
    Uses multiple strategies: regex patterns, then LLM as fallback.
    Skips extraction if merchant_id is already provided from ticket metadata.
    """
    # If merchant_id is already provided (from ticket metadata), skip extraction
    existing_merchant_id = state.get("merchant_id")
    if existing_merchant_id:
        return {"merchant_id": existing_merchant_id, "steps_log": []}
    
    ticket_text = state["ticket_text"]
    steps = []
    merchant_id = None
    
    # Strategy 1: Direct m_XXX or m_ecom_XXX pattern (most common)
    pattern1 = r'm_(?:ecom_)?\d+'
    matches = re.findall(pattern1, ticket_text, re.IGNORECASE)
    if matches:
        merchant_id = matches[0].lower()
        steps.append(f"✓ Extracted Merchant ID: {merchant_id}")
        return {"merchant_id": merchant_id, "steps_log": steps}
    
    # Strategy 2: "merchant ID: XXX" or "merchant: XXX" pattern
    pattern2 = r'merchant\s*(?:id)?[:\s]+([a-zA-Z0-9_-]+)'
    matches = re.findall(pattern2, ticket_text, re.IGNORECASE)
    if matches:
        merchant_id = matches[0]
        # Normalize to m_XXX format if it's just a number
        if merchant_id.isdigit():
            merchant_id = f"m_{merchant_id}"
        steps.append(f"✓ Extracted Merchant ID: {merchant_id}")
        return {"merchant_id": merchant_id, "steps_log": steps}
    
    # Strategy 3: Look for any ID-like patterns (ID: XXX, id=XXX, etc.)
    pattern3 = r'(?:id|account|customer)[:\s=]+([a-zA-Z0-9_-]+)'
    matches = re.findall(pattern3, ticket_text, re.IGNORECASE)
    if matches:
        merchant_id = matches[0]
        if merchant_id.isdigit():
            merchant_id = f"m_{merchant_id}"
        steps.append(f"✓ Extracted ID: {merchant_id}")
        return {"merchant_id": merchant_id, "steps_log": steps}
    
    # Strategy 4: Use LLM to extract merchant ID
    steps.append("🔍 Using AI to extract merchant information...")
    try:
        extract_prompt = f"""Extract the merchant ID, customer ID, or account ID from this support ticket.
        
Ticket: {ticket_text}

If you find an ID, respond with ONLY the ID (e.g., "m_123" or "123").
If no ID is found, respond with "NONE".
Do not include any other text."""

        response = llm.invoke([HumanMessage(content=extract_prompt)])
        content = response.content
        if isinstance(content, list):
            extracted = "".join(str(part) for part in content).strip()
        else:
            extracted = str(content).strip()
        
        if extracted and extracted.upper() != "NONE" and len(extracted) < 50:
            # Clean up and normalize the extracted ID
            extracted = extracted.strip('"\'`').strip()
            if extracted.isdigit():
                merchant_id = f"m_{extracted}"
            elif not extracted.startswith("m_") and re.match(r'^[a-zA-Z0-9_-]+$', extracted):
                merchant_id = extracted
            else:
                merchant_id = extracted
            steps.append(f"✓ AI extracted Merchant ID: {merchant_id}")
        else:
            steps.append("⚠ No Merchant ID found in ticket")
            
    except Exception as e:
        steps.append(f"⚠ Could not extract merchant ID: {str(e)}")
    
    return {
        "merchant_id": merchant_id,
        "steps_log": steps
    }


def tool_check_logs(state: AgentState) -> dict:
    """
    Node 2: Look up logs for the extracted merchant ID.
    Queries the mock log database for relevant error entries.
    """
    merchant_id = state.get("merchant_id")
    steps = []
    logs_found = []
    
    if merchant_id:
        steps.append(f"🔍 Searching logs for merchant {merchant_id}...")
        logs_found = get_merchant_logs(merchant_id)
        
        if logs_found:
            steps.append(f"✓ Found {len(logs_found)} log entries")
            # Identify error types in logs
            error_types = []
            for log in logs_found:
                if "403" in log:
                    error_types.append("403 Forbidden")
                elif "500" in log:
                    error_types.append("500 Server Error")
                elif "429" in log:
                    error_types.append("429 Rate Limited")
                elif "SSL" in log.upper():
                    error_types.append("SSL Certificate Issue")
                elif "JSON" in log.upper():
                    error_types.append("JSON Parsing Error")
            
            if error_types:
                unique_errors = list(set(error_types))
                steps.append(f"🚨 Detected errors: {', '.join(unique_errors)}")
        else:
            steps.append(f"⚠ No logs found for merchant {merchant_id}")
    else:
        steps.append("⏭ Skipping log lookup (no merchant ID)")
    
    return {
        "logs_found": logs_found,
        "steps_log": steps
    }


def tool_search_docs(state: AgentState) -> dict:
    """
    Node 3: Search documentation based on error patterns found.
    Uses simple keyword matching to find relevant docs.
    """
    logs_found = state.get("logs_found", [])
    ticket_text = state.get("ticket_text", "")
    steps = []
    relevant_docs = []
    
    # Build search queries from logs and ticket text
    search_terms = []
    combined_text = ticket_text + " ".join(logs_found)
    
    # Identify key issues to search for
    if "403" in combined_text or "API Key" in combined_text.upper():
        search_terms.append("API Key")
    if "429" in combined_text or "rate limit" in combined_text.lower():
        search_terms.append("Rate Limit")
    if "500" in combined_text or "database" in combined_text.lower():
        search_terms.append("Database")
    if "SSL" in combined_text.upper() or "certificate" in combined_text.lower():
        search_terms.append("SSL")
    if "JSON" in combined_text.upper() or "invalid" in combined_text.lower():
        search_terms.append("JSON")
    if "migration" in combined_text.lower() or "v2" in combined_text.lower():
        search_terms.append("Migration")
    
    if not search_terms:
        search_terms = ["API"]  # Default search
    
    steps.append(f"📚 Searching docs for: {', '.join(search_terms)}")
    
    # Search docs for each term
    for term in search_terms:
        docs = search_docs(term)
        for doc in docs:
            if doc not in relevant_docs:
                relevant_docs.append(doc)
    
    if relevant_docs:
        steps.append(f"✓ Found {len(relevant_docs)} relevant documentation articles")
    else:
        steps.append("⚠ No matching documentation found")
    
    return {
        "relevant_docs": relevant_docs,
        "steps_log": steps
    }


def generate_solution(state: AgentState) -> dict:
    """
    Node 4: Use Gemini LLM to synthesize findings into a diagnosis and recommended action.
    Combines log analysis and doc search results with AI-powered reasoning.
    """
    logs_found = state.get("logs_found", [])
    relevant_docs = state.get("relevant_docs", [])
    merchant_id = state.get("merchant_id")
    ticket_text = state.get("ticket_text", "")
    steps = []
    
    steps.append("🧠 Sending context to Gemini for analysis...")
    
    # Build context for the LLM
    logs_context = "\n".join(logs_found) if logs_found else "No logs found for this merchant."
    docs_context = "\n\n---\n\n".join(relevant_docs[:3]) if relevant_docs else "No relevant documentation found."
    
    # System prompt for the support agent
    system_prompt = """You are an expert technical support agent for an e-commerce platform that helps merchants migrate from fully-hosted solutions (Shopify, BigCommerce, Magento) to headless architecture.

Your expertise covers:
- Headless commerce architecture (Next.js, React storefronts, headless CMS)
- Storefront APIs (GraphQL, REST), authentication, and session management
- Payment gateway integrations (Stripe, PayPal) and webhook configurations
- Inventory sync between ERPs and headless storefronts
- CDN caching, ISR (Incremental Static Regeneration), and performance optimization
- Order fulfillment integrations (ShipStation, custom warehouse APIs)
- Data migration from legacy platforms

Your job is to analyze support tickets, diagnose issues based on logs and documentation, and draft helpful responses for merchants experiencing headless migration issues.

Guidelines:
- Be professional, empathetic, and solution-oriented - merchants are often stressed during migrations
- Provide specific, actionable steps with code examples when helpful
- Reference the logs and documentation when relevant
- Understand that issues often stem from differences between hosted and headless architectures
- If you're uncertain, acknowledge it and ask for more information
- Format your responses clearly with headers and bullet points where appropriate

You must respond in the following JSON format:
{
    "diagnosis": "A clear explanation of the root cause (2-4 sentences). Use **bold** for emphasis. Reference specific log entries when applicable.",
    "confidence_score": 0.0 to 1.0 based on how certain you are,
    "recommended_action": "A complete draft reply to send to the customer. Be helpful and professional. Include specific steps to resolve the issue."
}"""

    # User prompt with all the context
    user_prompt = f"""Analyze this support ticket and provide a diagnosis and recommended response.

## Original Ticket
{ticket_text}

## Merchant ID
{merchant_id or "Not found in ticket"}

## System Logs for this Merchant
{logs_context}

## Relevant Documentation
{docs_context}

Based on the above information, diagnose the issue and draft a helpful customer response.
Remember to respond ONLY with valid JSON in the specified format."""

    try:
        # Call Gemini with retry logic for rate limits
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        # Retry logic with exponential backoff
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = llm.invoke(messages)
                break
            except Exception as retry_error:
                if "429" in str(retry_error) or "RESOURCE_EXHAUSTED" in str(retry_error):
                    if attempt < max_retries - 1:
                        wait_time = (2 ** attempt) * 5  # 5s, 10s, 20s
                        steps.append(f"⏳ Rate limited, waiting {wait_time}s before retry...")
                        time.sleep(wait_time)
                    else:
                        raise retry_error
                else:
                    raise retry_error
        
        # Handle response content - debug what we received
        content = response.content
        print(f"[DEBUG] Response type: {type(content)}")
        print(f"[DEBUG] Response content: {repr(content)[:500]}")
        
        # Extract text from various response formats
        response_text = ""
        if isinstance(content, str):
            response_text = content.strip()
        elif isinstance(content, list):
            # Gemini can return list of content blocks
            parts = []
            for part in content:
                if isinstance(part, dict):
                    parts.append(part.get("text", ""))
                elif hasattr(part, "text"):
                    parts.append(part.text)
                else:
                    parts.append(str(part))
            response_text = "".join(parts).strip()
        elif hasattr(content, "text"):
            response_text = content.text.strip()
        else:
            response_text = str(content).strip()
        
        print(f"[DEBUG] Extracted response_text: {repr(response_text)[:500]}")
        
        # If still empty, try to get text from response object itself
        if not response_text and hasattr(response, "text"):
            response_text = response.text.strip()
            print(f"[DEBUG] Used response.text fallback: {repr(response_text)[:500]}")
        
        if not response_text:
            raise ValueError("Empty response from LLM")
        
        # Try to extract JSON from the response (handle markdown code blocks)
        json_text = response_text
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            if json_end > json_start:
                json_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            if json_end > json_start:
                json_text = response_text[json_start:json_end].strip()
        
        # Try to find JSON object in the text (look for { ... })
        if not json_text.startswith("{"):
            brace_start = json_text.find("{")
            brace_end = json_text.rfind("}") + 1
            if brace_start >= 0 and brace_end > brace_start:
                json_text = json_text[brace_start:brace_end]
        
        print(f"[DEBUG] JSON to parse: {repr(json_text)[:500]}")
        
        result = json.loads(json_text)
        
        diagnosis = result.get("diagnosis", "Unable to generate diagnosis.")
        confidence_score = float(result.get("confidence_score", 0.5))
        recommended_action = result.get("recommended_action", "Please contact support for assistance.")
        
        # Clamp confidence score
        confidence_score = max(0.0, min(1.0, confidence_score))
        
        steps.append(f"✓ Gemini analysis complete")
        steps.append(f"✓ Generated diagnosis with {int(confidence_score * 100)}% confidence")
        steps.append("✅ Analysis complete")
        
    except json.JSONDecodeError as e:
        steps.append(f"⚠ Failed to parse LLM response as JSON: {str(e)}")
        steps.append("⚠ Falling back to raw response")
        print(f"[DEBUG] JSON parse error: {e}")
        print(f"[DEBUG] Raw response for fallback: {repr(response_text)[:1000] if 'response_text' in locals() else 'N/A'}")
        
        # Use the raw response as the recommended action if it looks like useful content
        raw_response = response_text if 'response_text' in locals() else ""
        if raw_response and len(raw_response) > 50:
            # The LLM gave us something, try to use it
            diagnosis = "**Analysis Complete**: The AI analyzed the issue (response format was non-standard)."
            confidence_score = 0.6
            recommended_action = raw_response
        else:
            diagnosis = "**Analysis Error**: The AI response was empty or invalid."
            confidence_score = 0.3
            recommended_action = "Please contact support for assistance with this issue."
        
    except Exception as e:
        steps.append(f"❌ LLM Error: {str(e)}")
        steps.append("⚠ Using fallback response")
        
        # Fallback response
        diagnosis = f"**Analysis Error**: Unable to complete AI analysis. Error: {str(e)}"
        confidence_score = 0.3
        recommended_action = (
            "Hi,\n\n"
            "Thank you for reaching out. I'm currently reviewing your case and will get back to you shortly.\n\n"
            "In the meantime, please ensure you have:\n"
            "1. Your Merchant ID ready\n"
            "2. Any error messages you've encountered\n"
            "3. The approximate time the issue occurred\n\n"
            "Best regards,\nSupport Team"
        )
    
    return {
        "diagnosis": diagnosis,
        "confidence_score": confidence_score,
        "recommended_action": recommended_action,
        "steps_log": steps
    }


def build_agent_graph() -> StateGraph:
    """Build and compile the LangGraph agent workflow."""
    
    # Create the graph
    graph = StateGraph[AgentState, None, AgentState, AgentState](AgentState)
    
    # Add nodes
    graph.add_node("extract_metadata", extract_metadata)
    graph.add_node("check_logs", tool_check_logs)
    graph.add_node("search_docs", tool_search_docs)
    graph.add_node("generate_solution", generate_solution)
    
    # Define edges (sequential flow)
    graph.add_edge(START, "extract_metadata")
    graph.add_edge("extract_metadata", "check_logs")
    graph.add_edge("check_logs", "search_docs")
    graph.add_edge("search_docs", "generate_solution")
    graph.add_edge("generate_solution", END)
    
    # Compile the graph
    return graph.compile()


# Create the compiled agent
agent = build_agent_graph()


def analyze_ticket(ticket_text: str, merchant_id: str = None) -> dict:
    """
    Main entry point to analyze a support ticket.
    Returns the final state with diagnosis and recommendations.
    
    Args:
        ticket_text: The ticket content/description
        merchant_id: Optional merchant ID from ticket metadata (if provided, skips extraction)
    """
    steps = ["🚀 Starting ticket analysis..."]
    
    # If merchant_id is provided from metadata, use it directly
    if merchant_id:
        steps.append(f"✓ Using Merchant ID from ticket metadata: {merchant_id}")
    
    # Initialize state
    initial_state: AgentState = {
        "ticket_text": ticket_text,
        "merchant_id": merchant_id,  # Can be None or provided value
        "logs_found": [],
        "relevant_docs": [],
        "diagnosis": "",
        "confidence_score": 0.0,
        "recommended_action": "",
        "steps_log": steps
    }
    
    # Run the agent
    final_state = agent.invoke(initial_state)
    
    # Debug logging
    print("=" * 50)
    print("AGENT ANALYSIS RESULTS:")
    print(f"  Ticket preview: {ticket_text[:100]}...")
    print(f"  Merchant ID: {final_state.get('merchant_id', 'NOT FOUND')}")
    print(f"  Logs found: {len(final_state.get('logs_found', []))} entries")
    print(f"  Docs found: {len(final_state.get('relevant_docs', []))} articles")
    print(f"  Confidence: {final_state.get('confidence_score', 0) * 100:.0f}%")
    print(f"  Steps: {final_state.get('steps_log', [])}")
    print("=" * 50)
    
    return final_state
