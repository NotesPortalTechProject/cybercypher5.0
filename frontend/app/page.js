'use client'

// Main page with login, ticket form and list
import { useState, useEffect } from 'react'
import AgentInsightPanel from '../components/AgentInsightPanel'

const API_URL = 'http://localhost:8000'
const STORAGE_KEY = 'cyphercypher_user'

export default function Home() {
  // State for logged in user (null = not logged in)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true) // Loading state for initial auth check
  
  // State for login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  
  // State for ticket form inputs
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  
  // State for tickets list and messages
  const [tickets, setTickets] = useState([])
  const [success, setSuccess] = useState(false)
  
  // State for AI response
  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  
  // State for selected ticket (for Agent Insight Panel)
  const [selectedTicket, setSelectedTicket] = useState(null)

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY)
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error)
      localStorage.removeItem(STORAGE_KEY)
    }
    setIsLoading(false)
  }, [])

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    }
  }, [user])

  // Fetch tickets on page load
  useEffect(() => {
    fetchTickets()
  }, [])

  // Get all tickets from API
  async function fetchTickets() {
    try {
      const res = await fetch(`${API_URL}/tickets`)
      const data = await res.json()
      setTickets(data)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    }
  }

  // Handle login
  async function handleLogin(e) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      const data = await res.json()
      
      if (data.success) {
        setUser(data.user)
      } else {
        setLoginError(data.error || 'Login failed')
      }
    } catch (error) {
      setLoginError('Failed to connect to server')
    }
    
    setLoginLoading(false)
  }

  // Logout
  function handleLogout() {
    setUser(null)
    setLoginEmail('')
    setLoginPassword('')
    localStorage.removeItem(STORAGE_KEY)
  }

  // Submit new ticket
  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description, 
          email: user.email,
          merchant_id: user.merchant_id  // Include user's assigned merchant_id
        })
      })
      
      if (res.ok) {
        // Clear form and show success
        setTitle('')
        setDescription('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        
        // Refresh ticket list
        fetchTickets()
      }
    } catch (error) {
      console.error('Failed to create ticket:', error)
    }
  }

  // Update ticket status (dev only)
  async function updateStatus(ticketId, newStatus) {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (res.ok) {
        fetchTickets()
      }
    } catch (error) {
      console.error('Failed to update ticket:', error)
    }
  }

  // Send ticket to AI endpoint
  async function askAI(ticketId) {
    setAiLoading(true)
    setAiResponse(null)
    
    try {
      const res = await fetch(`${API_URL}/ask-ai/${ticketId}`, {
        method: 'POST'
      })
      const data = await res.json()
      setAiResponse(data)
    } catch (error) {
      console.error('Failed to ask AI:', error)
      setAiResponse({ error: 'Failed to connect to AI' })
    }
    
    setAiLoading(false)
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: '#666', marginTop: '16px' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Login screen
  if (!user) {
    return (
      <div className="container">
        <h1>Ticket System</h1>
        <p className="subtitle">Login to continue</p>
        
        <form className="form login-form" onSubmit={handleLogin}>
          {loginError && (
            <div className="error-message">{loginError}</div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" className="submit-btn" disabled={loginLoading}>
            {loginLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    )
  }

  // Normal user view - submit tickets
  if (user.role === 'user') {
    return (
      <div className="container">
        <div className="header">
          <h1>Report an Issue</h1>
          <div className="user-info">
            <span>Hi, {user.name}</span>
            <button className="back-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        
        {/* Merchant ID Badge */}
        <div style={{
          background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
          border: '1px solid #a5b4fc',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            background: '#4f46e5',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Your Merchant ID
          </div>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: '600',
            color: '#3730a3'
          }}>
            {user.merchant_id}
          </span>
        </div>
        
        {/* Success message */}
        {success && (
          <div className="success-message">
            Ticket submitted successfully!
          </div>
        )}
        
        {/* Ticket submission form */}
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of what went wrong..."
              required
            />
          </div>
          
          <button type="submit" className="submit-btn">
            Submit Ticket
          </button>
        </form>
      </div>
    )
  }

  // Developer view - see all tickets
  if (user.role === 'dev') {
    return (
      <div className="container">
        <div className="header">
          <h1>All Tickets</h1>
          <div className="user-info">
            <span>Hi, {user.name}</span>
            <button className="back-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        
        <button className="refresh-btn" onClick={fetchTickets}>
          Refresh Tickets
        </button>
        
        {/* List of submitted tickets */}
        <div className="tickets-section">
          {tickets.length === 0 ? (
            <p className="no-tickets">No tickets yet</p>
          ) : (
            tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className={`ticket-card ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
              >
                <h3>{ticket.title}</h3>
                <p>{ticket.description}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={`status status-${ticket.status}`}>{ticket.status}</span>
                  <span style={{ 
                    background: '#e0e7ff', 
                    color: '#4338ca', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}>
                    {ticket.merchant_id}
                  </span>
                </div>
                <p className="meta">
                  {ticket.email} • {new Date(ticket.created_at).toLocaleString()}
                </p>
                
                {/* Status change buttons */}
                <div className="status-buttons">
                  <span>Change status:</span>
                  <button 
                    className={`status-btn ${ticket.status === 'open' ? 'active' : ''}`}
                    onClick={() => updateStatus(ticket.id, 'open')}
                  >
                    Open
                  </button>
                  <button 
                    className={`status-btn ${ticket.status === 'in-progress' ? 'active' : ''}`}
                    onClick={() => updateStatus(ticket.id, 'in-progress')}
                  >
                    In Progress
                  </button>
                  <button 
                    className={`status-btn ${ticket.status === 'resolved' ? 'active' : ''}`}
                    onClick={() => updateStatus(ticket.id, 'resolved')}
                  >
                    Resolved
                  </button>
                </div>
                
                {/* Analyze with AI button */}
                <button 
                  className="ask-ai-btn"
                  onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                >
                  {selectedTicket?.id === ticket.id ? 'Hide Analysis' : 'Analyze with AI'}
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Agent Insight Panel Modal/Popup */}
        {selectedTicket && (
          <>
            {/* Backdrop */}
            <div 
              className="modal-backdrop"
              onClick={() => setSelectedTicket(null)}
            />
            {/* Modal */}
            <div className="modal-container">
              <AgentInsightPanel
                ticketContent={`${selectedTicket.title}\n\n${selectedTicket.description}\n\nSubmitted by: ${selectedTicket.email}`}
                merchantId={selectedTicket.merchant_id}
                onClose={() => setSelectedTicket(null)}
              />
            </div>
          </>
        )}
      </div>
    )
  }
}
