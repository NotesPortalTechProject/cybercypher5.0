# FastAPI Router for Agent Insight Engine
# Provides the /analyze endpoint for ticket analysis

import traceback
import subprocess
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from agent import analyze_ticket

# Create router instance
router = APIRouter(prefix="/agent", tags=["Agent Insight Engine"])

# Request logging
class RequestLog:
    def __init__(self):
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.history: List[dict] = []
    
    def log_request(self, ticket_preview: str, success: bool, duration_ms: float = 0):
        self.total_requests += 1
        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1
        
        log_entry = {
            "id": self.total_requests,
            "timestamp": datetime.now().isoformat(),
            "ticket_preview": ticket_preview[:50] + "..." if len(ticket_preview) > 50 else ticket_preview,
            "success": success,
            "duration_ms": round(duration_ms, 2)
        }
        self.history.append(log_entry)
        
        # Keep only last 100 requests
        if len(self.history) > 100:
            self.history = self.history[-100:]
        
        # Print to console
        status = "✓" if success else "✗"
        print(f"[Agent Request #{self.total_requests}] {status} | {log_entry['timestamp']} | {duration_ms:.0f}ms")
    
    def get_stats(self):
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "success_rate": f"{(self.successful_requests / self.total_requests * 100):.1f}%" if self.total_requests > 0 else "N/A"
        }

# Initialize request logger
request_log = RequestLog()


class AnalyzeRequest(BaseModel):
    """Request model for ticket analysis."""
    ticket_text: str
    merchant_id: Optional[str] = None  # Optional: can be passed from ticket metadata


class AnalyzeResponse(BaseModel):
    """Response model containing analysis results."""
    ticket_text: str
    merchant_id: Optional[str]
    logs_found: list[str]
    relevant_docs: list[str]
    diagnosis: str
    confidence_score: float
    recommended_action: str
    steps_log: list[str]


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze a support ticket using the Agent Insight Engine.
    
    This endpoint:
    1. Extracts merchant metadata from the ticket text
    2. Looks up relevant logs for the merchant
    3. Searches documentation for related issues
    4. Generates a diagnosis and recommended action
    
    The steps_log field contains a chronological list of actions
    taken by the agent, suitable for displaying in a UI timeline.
    """
    import time
    start_time = time.time()
    
    if not request.ticket_text.strip():
        raise HTTPException(
            status_code=400,
            detail="ticket_text cannot be empty"
        )
    
    # Debug: Print what we received
    print(f"[Analyze] Received merchant_id: {request.merchant_id}")
    
    try:
        # Run the agent analysis (pass merchant_id if provided)
        result = analyze_ticket(request.ticket_text, merchant_id=request.merchant_id)
        
        # Log successful request
        duration_ms = (time.time() - start_time) * 1000
        request_log.log_request(request.ticket_text, success=True, duration_ms=duration_ms)
        
        return AnalyzeResponse(
            ticket_text=result["ticket_text"],
            merchant_id=result.get("merchant_id"),
            logs_found=result.get("logs_found", []),
            relevant_docs=result.get("relevant_docs", []),
            diagnosis=result.get("diagnosis", ""),
            confidence_score=result.get("confidence_score", 0.0),
            recommended_action=result.get("recommended_action", ""),
            steps_log=result.get("steps_log", [])
        )
    except Exception as e:
        # Log failed request
        duration_ms = (time.time() - start_time) * 1000
        request_log.log_request(request.ticket_text, success=False, duration_ms=duration_ms)
        
        # Print full traceback for debugging
        print("=" * 50)
        print("AGENT ANALYSIS ERROR:")
        print("=" * 50)
        traceback.print_exc()
        print("=" * 50)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@router.get("/health")
async def agent_health():
    """Health check for the agent service."""
    return {"status": "ok", "service": "Agent Insight Engine"}


@router.get("/stats")
async def get_stats():
    """Get request statistics for the agent."""
    return {
        "service": "Agent Insight Engine",
        **request_log.get_stats()
    }


@router.get("/logs")
async def get_logs(limit: int = 20):
    """Get recent request logs."""
    return {
        "total_logged": len(request_log.history),
        "showing": min(limit, len(request_log.history)),
        "logs": request_log.history[-limit:][::-1]  # Most recent first
    }


@router.delete("/logs")
async def clear_logs():
    """Clear all request logs and reset counters."""
    request_log.total_requests = 0
    request_log.successful_requests = 0
    request_log.failed_requests = 0
    request_log.history = []
    return {"message": "Logs cleared successfully"}


class OpenVSCodeRequest(BaseModel):
    """Request model for opening VS Code."""
    filepath: str


@router.post("/open-vscode")
async def open_vscode(request: OpenVSCodeRequest):
    """
    Open VS Code with the specified file or folder path.
    Runs 'code <filepath>' in the terminal.
    """
    filepath = request.filepath.strip()
    
    if not filepath:
        raise HTTPException(status_code=400, detail="filepath cannot be empty")
    
    try:
        # Run the 'code' command to open VS Code
        result = subprocess.run(
            ["code", filepath],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print(f"[VS Code] Opened: {filepath}")
            return {"success": True, "message": f"Opened VS Code with: {filepath}"}
        else:
            error_msg = result.stderr or "Unknown error"
            print(f"[VS Code] Failed to open: {filepath} - {error_msg}")
            raise HTTPException(status_code=500, detail=f"Failed to open VS Code: {error_msg}")
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Command timed out")
    except FileNotFoundError:
        raise HTTPException(
            status_code=500, 
            detail="VS Code 'code' command not found. Make sure VS Code is installed and 'code' is in PATH."
        )
    except Exception as e:
        print(f"[VS Code] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error opening VS Code: {str(e)}")
