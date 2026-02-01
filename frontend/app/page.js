'use client'

// Main page with login, ticket form and list
import { useState, useEffect } from 'react'
import AgentInsightPanel from '../components/AgentInsightPanel'

const API_URL = 'http://localhost:8000'
const STORAGE_KEY = 'cyphercypher_user'

export default function Home() {
  // State for logged in user (null = not logged in)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
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
          merchant_id: user.merchant_id
        })
      })
      
      if (res.ok) {
        setTitle('')
        setDescription('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
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
      <div className="container" style={{ background: '#0b0b12', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a78bfa' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '16px' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Login screen
  if (!user) {
    return (
      <div className="container" style={{ background: '#0b0b12', minHeight: '100vh' }}>
        <h1 style={{ color: '#ede9fe' }}>Ticket System</h1>
        <p className="subtitle" style={{ color: '#a78bfa' }}>Login to continue</p>
        
        <form
          className="form login-form"
          onSubmit={handleLogin}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(168,85,247,0.25)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px'
          }}
        >
          {loginError && (
            <div className="error-message">{loginError}</div>
          )}
          
          <div className="form-group">
            <label style={{ color: '#c4b5fd' }}>Email</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#ede9fe',
                borderRadius: '10px'
              }}
            />
          </div>
          
          <div className="form-group">
            <label style={{ color: '#c4b5fd' }}>Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#ede9fe',
                borderRadius: '10px'
              }}
            />
          </div>
          
          <button
            type="submit"
            className="submit-btn"
            disabled={loginLoading}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              border: 'none',
              borderRadius: '12px',
              color: 'white'
            }}
          >
            {loginLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    )
  }

  // Normal user view - submit tickets
  if (user.role === 'user') {
    return (
      <div className="container" style={{ background: '#0b0b12', minHeight: '100vh' }}>
        <div className="header">
          <h1 style={{ color: '#ede9fe' }}>Report an Issue</h1>
          <div className="user-info">
            <span style={{ color: '#c4b5fd' }}>Hi, {user.name}</span>
            <button className="back-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        
        {/* Merchant ID Badge */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(168,85,247,0.25)',
          backdropFilter: 'blur(12px)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            background: 'rgba(168,85,247,0.2)',
            color: '#e9d5ff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            Merchant ID
          </div>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: '600',
            color: '#ede9fe'
          }}>
            {user.merchant_id}
          </span>
        </div>
        
        {success && (
          <div
            className="success-message"
            style={{
              background: 'rgba(168,85,247,0.15)',
              border: '1px solid rgba(168,85,247,0.3)',
              color: '#e9d5ff',
              borderRadius: '12px'
            }}
          >
            Ticket submitted successfully!
          </div>
        )}
        
        <form
          className="form"
          onSubmit={handleSubmit}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(168,85,247,0.25)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px'
          }}
        >
          <div className="form-group">
            <label style={{ color: '#c4b5fd' }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#ede9fe',
                borderRadius: '10px'
              }}
            />
          </div>
          
          <div className="form-group">
            <label style={{ color: '#c4b5fd' }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of what went wrong..."
              required
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#ede9fe',
                borderRadius: '10px'
              }}
            />
          </div>
          
          <button
            type="submit"
            className="submit-btn"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              border: 'none',
              borderRadius: '12px',
              color: 'white'
            }}
          >
            Submit Ticket
          </button>
        </form>
      </div>
    )
  }

  // Developer view - see all tickets
  if (user.role === 'dev') {
    return (
      <div className="container" style={{ background: '#0b0b12', minHeight: '100vh' }}>
        <div className="header">
          <h1 style={{ color: '#ede9fe' }}>All Tickets</h1>
          <div className="user-info">
            <span style={{ color: '#c4b5fd' }}>Hi, {user.name}</span>
            <button className="back-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        
        <button
          className="refresh-btn"
          onClick={fetchTickets}
          style={{
            background: 'transparent',
            border: '1px solid rgba(168,85,247,0.25)',
            color: '#e9d5ff',
            borderRadius: '10px'
          }}
        >
          Refresh Tickets
        </button>
        
        <div className="tickets-section">
          {tickets.length === 0 ? (
            <p className="no-tickets">No tickets yet</p>
          ) : (
            tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className={`ticket-card ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(168,85,247,0.25)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '16px'
                }}
              >
                <h3 style={{ color: '#ede9fe' }}>{ticket.title}</h3>
                <p style={{ color: '#c4b5fd' }}>{ticket.description}</p>

                <p className="meta" style={{ color: '#a78bfa' }}>
                  {ticket.email} • {new Date(ticket.created_at).toLocaleString()}
                </p>

                <button
                  className="ask-ai-btn"
                  onClick={() =>
                    setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)
                  }
                >
                  {selectedTicket?.id === ticket.id ? 'Hide Analysis' : 'Analyze with AI'}
                </button>
              </div>
            ))
          )}
        </div>

        {selectedTicket && (
          <>
            <div
              className="modal-backdrop"
              onClick={() => setSelectedTicket(null)}
            />
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