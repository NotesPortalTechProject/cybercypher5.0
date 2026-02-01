# FastAPI backend for ticket system
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
import uuid
import os
import random

# Import the agent router
from router import router as agent_router

# Available merchant IDs (from mock_db - headless e-commerce migration tickets)
MERCHANT_IDS = [
    "m_ecom_001",  # Products Not Displaying
    "m_ecom_002",  # Variants Not Syncing
    "m_ecom_003",  # Cart Abandonment
    "m_ecom_004",  # Stripe Webhooks Not Received
    "m_ecom_005",  # Inventory Mismatch
    "m_ecom_006",  # Product Import Timeout
    "m_ecom_007",  # Duplicate Webhooks
    "m_ecom_008",  # Webhook SSL Failure
    "m_ecom_009",  # Slow API Response
    "m_ecom_010",  # CDN Cache Stale
    "m_ecom_011",  # Login Session Not Persisting
    "m_ecom_012",  # SSO Broken
    "m_ecom_013",  # CMS Content Not Rendering
    "m_ecom_014",  # Broken Image URLs
    "m_ecom_015",  # Orders Not Syncing to Fulfillment
    "m_ecom_016",  # Refund Processing Failing
]

# Load environment variables
load_dotenv()

app = FastAPI(title="CypherCypher Ticket System", version="5.0")

# Include the agent router
app.include_router(agent_router)

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for tickets
tickets = []

# Login model
class LoginRequest(BaseModel):
    email: str
    password: str

# User model for response
class User(BaseModel):
    id: str
    name: str
    email: str
    role: str

# Ticket model for creating new tickets
class TicketCreate(BaseModel):
    title: str
    description: str
    email: str
    merchant_id: Optional[str] = None  # Optional: will use user's assigned merchant_id if provided

# Ticket model for responses
class Ticket(BaseModel):
    id: str
    title: str
    description: str
    email: str
    merchant_id: str
    status: str
    created_at: str

# Assign a consistent merchant_id based on user email (so it's always the same for the same user)
def get_merchant_id_for_user(email: str) -> str:
    """Assign a merchant_id based on email hash - consistent for the same user."""
    # Use hash of email to pick a merchant_id deterministically
    index = hash(email) % len(MERCHANT_IDS)
    return MERCHANT_IDS[index]

# Login endpoint - checks Supabase for user and password
@app.post("/login")
def login(request: LoginRequest):
    if not supabase:
        return {"error": "Supabase not configured"}
    
    # Check if user exists in Supabase
    result = supabase.table("cc_users").select("*").eq("email", request.email).execute()
    
    if result.data and len(result.data) > 0:
        user = result.data[0]
        
        # Check password
        if user["password"] != request.password:
            return {"success": False, "error": "Invalid password"}
        
        # Assign consistent merchant_id for this user
        merchant_id = get_merchant_id_for_user(user["email"])
        
        return {
            "success": True,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "merchant_id": merchant_id
            }
        }
    else:
        return {"success": False, "error": "User not found"}

# Create a new ticket
@app.post("/tickets", response_model=Ticket)
def create_ticket(ticket: TicketCreate):
    # Use provided merchant_id, or derive from email for consistency
    merchant_id = ticket.merchant_id or get_merchant_id_for_user(ticket.email)
    
    new_ticket = Ticket(
        id=str(uuid.uuid4()),
        title=ticket.title,
        description=ticket.description,
        email=ticket.email,
        merchant_id=merchant_id,
        status="open",
        created_at=datetime.now().isoformat()
    )
    tickets.append(new_ticket)
    return new_ticket

# Get all tickets
@app.get("/tickets", response_model=List[Ticket])
def get_tickets():
    return tickets

# Model for updating ticket status
class TicketUpdate(BaseModel):
    status: str

# Update ticket status
@app.patch("/tickets/{ticket_id}")
def update_ticket(ticket_id: str, update: TicketUpdate):
    for i, ticket in enumerate(tickets):
        if ticket.id == ticket_id:
            # Create updated ticket with new status
            updated = Ticket(
                id=ticket.id,
                title=ticket.title,
                description=ticket.description,
                email=ticket.email,
                merchant_id=ticket.merchant_id,
                status=update.status,
                created_at=ticket.created_at
            )
            tickets[i] = updated
            return updated
    return {"error": "Ticket not found"}

# Ask AI endpoint - receives ticket data
@app.post("/ask-ai/{ticket_id}")
def ask_ai(ticket_id: str):
    # Find the ticket
    for ticket in tickets:
        if ticket.id == ticket_id:
            # Return ticket data (you can add AI integration here later)
            return {
                "ticket_id": ticket.id,
                "title": ticket.title,
                "description": ticket.description,
                "status": ticket.status,
                "message": "Ticket data received by AI endpoint"
            }
    return {"error": "Ticket not found"}

# Health check
@app.get("/")
def health_check():
    return {"status": "ok"}
