'use client'

// Main page with login, ticket form and list
import { useState, useEffect } from 'react'
import AgentInsightPanel from '../components/AgentInsightPanel'

const API_URL = 'http://localhost:8000'
const STORAGE_KEY = 'cyphercypher_user'

export default function Home() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [tickets, setTickets] = useState([])
  const [success, setSuccess] = useState(false)

  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const [selectedTicket, setSelectedTicket] = useState(null)

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

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    }
  }, [user])

  useEffect(() => {
    fetchTickets()
  }, [])

  async function fetchTickets() {
    try {
      const res = await fetch(`${API_URL}/tickets`)
      const data = await res.json()
      setTickets(data)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
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

  function handleLogout() {
    setUser(null)
    setLoginEmail('')
    setLoginPassword('')
    localStorage.removeItem(STORAGE_KEY)
  }

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
          merchant_id: user.merchant_id,
        }),
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

  async function updateStatus(ticketId, newStatus) {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchTickets()
      }
    } catch (error) {
      console.error('Failed to update ticket:', error)
    }
  }

  async function askAI(ticketId) {
    setAiLoading(true)
    setAiResponse(null)

    try {
      const res = await fetch(`${API_URL}/ask-ai/${ticketId}`, {
        method: 'POST',
      })
      const data = await res.json()
      setAiResponse(data)
    } catch (error) {
      console.error('Failed to ask AI:', error)
      setAiResponse({ error: 'Failed to connect to AI' })
    }

    setAiLoading(false)
  }

  if (isLoading) {
    return (
      <div
        style={{
          background: '#000',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a78bfa',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontWeight: 600,
          fontSize: 18,
        }}
      >
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div
        style={{
          background: '#000',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            color: '#ede9fe',
          }}
        >
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Ticket System</h1>
          <p
            style={{
              color: '#a78bfa',
              fontWeight: 500,
              marginBottom: 24,
              fontSize: 16,
            }}
          >
            Login to continue
          </p>

          <form
            onSubmit={handleLogin}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(168,85,247,0.25)',
              backdropFilter: 'blur(12px)',
              borderRadius: 16,
              padding: 24,
              boxShadow:
                '0 0 10px rgba(168,85,247,0.3), inset 0 0 8px rgba(168,85,247,0.15)',
            }}
          >
            {loginError && (
              <div
                style={{
                  marginBottom: 12,
                  color: '#f87171',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {loginError}
              </div>
            )}

            <label
              htmlFor="email"
              style={{ color: '#c4b5fd', fontWeight: 600, display: 'block' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#ede9fe',
                borderRadius: 10,
                padding: '10px',
                marginBottom: 20,
                fontSize: 14,
                outline: 'none',
              }}
            />

            <label
              htmlFor="password"
              style={{ color: '#c4b5fd', fontWeight: 600, display: 'block' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#ede9fe',
                borderRadius: 10,
                padding: '10px',
                fontSize: 14,
                outline: 'none',
              }}
            />

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                marginTop: 16,
                width: '100%',
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                padding: '12px',
                fontWeight: 700,
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                fontSize: 16,
                transition: 'background-color 0.3s ease',
              }}
              onMouseEnter={(e) =>
                !loginLoading &&
                (e.currentTarget.style.backgroundColor = '#6d28d9')
              }
              onMouseLeave={(e) =>
                !loginLoading &&
                (e.currentTarget.style.backgroundColor =
                  'linear-gradient(135deg, #7c3aed, #9333ea)')
              }
            >
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (user.role === 'user') {
    return (
      <div
        style={{
          background: '#000',
          minHeight: '100vh',
          padding: 24,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: '#ede9fe',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: 900 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <h1 style={{ fontSize: 28 }}>Report an Issue</h1>
            <div>
              <span
                style={{
                  color: '#c4b5fd',
                  fontWeight: 600,
                  marginRight: 16,
                  fontSize: 14,
                }}
              >
                Hi, {user.name}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(168,85,247,0.25)',
                  color: '#a78bfa',
                  borderRadius: 10,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                Logout
              </button>
            </div>
          </div>

          {/* Merchant ID Badge */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(168,85,247,0.25)',
              backdropFilter: 'blur(12px)',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontWeight: 600,
              fontSize: 14,
              color: '#e9d5ff',
            }}
          >
            <div
              style={{
                background: 'rgba(168,85,247,0.2)',
                padding: '8px 12px',
                borderRadius: 8,
                letterSpacing: '0.5px',
              }}
            >
              Merchant ID
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 16 }}>
              {user.merchant_id}
            </span>
          </div>

          {success && (
            <div
              style={{
                background: 'rgba(168,85,247,0.15)',
                border: '1px solid rgba(168,85,247,0.3)',
                color: '#e9d5ff',
                borderRadius: 12,
                padding: 12,
                marginBottom: 20,
                fontWeight: 600,
              }}
            >
              Ticket submitted successfully!
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(168,85,247,0.25)',
              backdropFilter: 'blur(12px)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <label
              htmlFor="title"
              style={{
                color: '#c4b5fd',
                fontWeight: 600,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#ede9fe',
                borderRadius: 10,
                padding: '10px',
                marginBottom: 20,
                fontSize: 14,
                outline: 'none',
              }}
            />

            <label
              htmlFor="description"
              style={{
                color: '#c4b5fd',
                fontWeight: 600,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of what went wrong..."
              required
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#ede9fe',
                borderRadius: 10,
                padding: '10px',
                fontSize: 14,
                outline: 'none',
                minHeight: 100,
                resize: 'vertical',
              }}
            />

            <button
              type="submit"
              style={{
                marginTop: 12,
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#6d28d9')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  'linear-gradient(135deg, #7c3aed, #9333ea)')
              }
            >
              Submit Ticket
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (user.role === 'dev') {
    return (
      <div
        style={{
          background: '#000',
          minHeight: '100vh',
          padding: 24,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: '#ede9fe',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: 1100 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <h1 style={{ fontSize: 28 }}>All Tickets</h1>
            <div>
              <span
                style={{
                  color: '#c4b5fd',
                  fontWeight: 600,
                  marginRight: 16,
                  fontSize: 14,
                }}
              >
                Hi, {user.name}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(168,85,247,0.25)',
                  color: '#a78bfa',
                  borderRadius: 10,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                Logout
              </button>
            </div>
          </div>

          <button
            onClick={fetchTickets}
            style={{
              marginBottom: 20,
              background: 'transparent',
              border: '1px solid rgba(168,85,247,0.25)',
              color: '#e9d5ff',
              borderRadius: 10,
              padding: '8px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'transparent')
            }
          >
            Refresh Tickets
          </button>

          <div>
            {tickets.length === 0 ? (
              <p style={{ color: '#a78bfa', fontStyle: 'italic' }}>
                No tickets yet
              </p>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(168,85,247,0.25)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    cursor: 'pointer',
                    boxShadow:
                      selectedTicket?.id === ticket.id
                        ? '0 0 12px 2px #9333ea'
                        : 'none',
                  }}
                  onClick={() =>
                    setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)
                  }
                >
                  <h3 style={{ color: '#ede9fe', marginBottom: 8 }}>{ticket.title}</h3>
                  <p style={{ color: '#c4b5fd', marginBottom: 8 }}>
                    {ticket.description}
                  </p>

                  <p style={{ color: '#a78bfa', fontSize: 12, fontStyle: 'italic' }}>
                    {ticket.email} • {new Date(ticket.created_at).toLocaleString()}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTicket(ticket)
                      askAI(ticket.id)
                    }}
                    disabled={aiLoading && selectedTicket?.id === ticket.id}
                    style={{
                      marginTop: 12,
                      background: selectedTicket?.id === ticket.id
                        ? '#7c3aed'
                        : 'transparent',
                      border: '1px solid #7c3aed',
                      color: '#e9d5ff',
                      borderRadius: 12,
                      padding: '8px 14px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                      transition: 'background-color 0.3s ease',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = '#9333ea')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        selectedTicket?.id === ticket.id ? '#7c3aed' : 'transparent')
                    }
                  >
                    {aiLoading && selectedTicket?.id === ticket.id
                      ? 'Analyzing...'
                      : 'Analyze with AI'}
                  </button>

                  {selectedTicket?.id === ticket.id && aiResponse && (
                    <div
                      style={{
                        marginTop: 12,
                        background: 'rgba(116, 80, 164, 0.15)',
                        padding: 12,
                        borderRadius: 12,
                        color: '#d8b4fe',
                        fontSize: 14,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {aiResponse.error || aiResponse.result || 'No analysis available.'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {selectedTicket && (
            <AgentInsightPanel
              ticketContent={`${selectedTicket.title}\n\n${selectedTicket.description}\n\nSubmitted by: ${selectedTicket.email}`}
              merchantId={selectedTicket.merchant_id}
              onClose={() => setSelectedTicket(null)}
            />
          )}
        </div>
      </div>
    )
  }
}
