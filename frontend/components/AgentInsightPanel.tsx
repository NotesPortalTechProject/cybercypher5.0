'use client'

import React, { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Brain,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Code,
  ExternalLink,
  X,
  Sparkles,
  Gauge,
  MessageSquareText,
  Stethoscope,
} from 'lucide-react'

const API_URL = 'http://localhost:8000'

interface AnalysisResult {
  ticket_text: string
  merchant_id: string | null
  logs_found: string[]
  relevant_docs: string[]
  diagnosis: string
  confidence_score: number
  recommended_action: string
  steps_log: string[]
}

type AnalysisStatus = 'idle' | 'analyzing' | 'complete' | 'error'

const cleanStep = (step: string) =>
  step.replace(/^[🚀🔍📚🧠✓✅⚠🚨⏭❌⏳]\s*/g, '').trim()

const loadingSteps = [
  'Reading ticket',
  'Extracting metadata',
  'Searching logs',
  'Finding docs',
  'Generating diagnosis',
]

export default function AgentInsightPanel({
  ticketContent,
  merchantId,
  onClose,
}: {
  ticketContent: string
  merchantId?: string
  onClose?: () => void
}) {
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [copied, setCopied] = useState(false)
  const [reply, setReply] = useState('')

  useEffect(() => {
    if (status === 'analyzing') {
      setStep(0)
      const i = setInterval(() => {
        setStep(s => Math.min(s + 1, loadingSteps.length - 1))
      }, 700)
      return () => clearInterval(i)
    }
  }, [status])

  const analyzeTicket = useCallback(async () => {
    if (!ticketContent.trim()) return
    setStatus('analyzing')
    setError(null)

    try {
      const res = await fetch(`${API_URL}/agent/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_text: ticketContent,
          merchant_id: merchantId || null,
        }),
      })

      if (!res.ok) throw new Error('Analysis failed')

      const data: AnalysisResult = await res.json()
      setResult(data)
      setReply(data.recommended_action)
      setStatus('complete')
    } catch (e: any) {
      setError(e.message)
      setStatus('error')
    }
  }, [ticketContent, merchantId])

  useEffect(() => {
    analyzeTicket()
  }, [analyzeTicket])

  const copyReply = async () => {
    await navigator.clipboard.writeText(reply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openInVSCode = async (filepath: string) => {
    await fetch(`${API_URL}/agent/open-vscode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filepath }),
    })
  }

  return (
    <div
      className="w-[1400px] max-w-[95vw] rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(15,15,24,0.92)',
        border: '1px solid rgba(168,85,247,0.25)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 0 60px rgba(168,85,247,0.2)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          borderBottom: '1px solid rgba(168,85,247,0.2)',
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: '#7c3aed',
              boxShadow: '0 0 20px rgba(168,85,247,0.5)',
            }}
          >
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p style={{ color: '#ede9fe', fontWeight: 700 }}>Agent Analysis</p>
            <p style={{ color: '#a78bfa', fontSize: '12px' }}>
              AI-powered diagnostics
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} style={{ color: '#c4b5fd' }}>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6" style={{ color: '#e9d5ff' }}>
        {status === 'analyzing' && (
          <div className="space-y-4 py-8">
            <Loader2 className="w-8 h-8 mx-auto animate-spin" style={{ color: '#a78bfa' }} />
            {loadingSteps.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background:
                      i <= step ? '#a78bfa' : 'rgba(168,85,247,0.2)',
                  }}
                />
                <span style={{ color: i === step ? '#ede9fe' : '#a78bfa' }}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-3 py-8">
            <AlertCircle className="w-10 h-10 mx-auto text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {status === 'complete' && result && (
          <div className="space-y-6">
            {/* Confidence */}
            <div
              className="flex items-center justify-between p-5 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(168,85,247,0.25)',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: '#7c3aed',
                    boxShadow: '0 0 20px rgba(168,85,247,0.5)',
                  }}
                >
                  <Gauge className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#a78bfa' }}>
                    Confidence Score
                  </p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#ede9fe' }}>
                    {Math.round(result.confidence_score * 100)}%
                  </p>
                </div>
              </div>

              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(168,85,247,0.25)',
                }}
              >
                <p style={{ fontSize: 12, color: '#a78bfa' }}>Merchant ID</p>
                <p style={{ fontFamily: 'monospace', color: '#ede9fe' }}>
                  {result.merchant_id || 'N/A'}
                </p>
              </div>
            </div>

            {/* Diagnosis */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(168,85,247,0.25)',
              }}
            >
              <p style={{ fontWeight: 700, marginBottom: 10 }}>Diagnosis</p>
              <div className="prose prose-invert max-w-none text-sm">
                <ReactMarkdown>{result.diagnosis}</ReactMarkdown>
              </div>
            </div>

            {/* Recommended Action */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(168,85,247,0.25)',
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <p style={{ fontWeight: 700 }}>Recommended Action</p>
                <button onClick={copyReply}>
                  {copied ? <Check /> : <Copy />}
                </button>
              </div>

              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 260,
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(168,85,247,0.25)',
                  borderRadius: 12,
                  padding: 16,
                  color: '#ede9fe',
                }}
              />

              <div className="mt-5 flex gap-4">
                <button
                  onClick={() =>
                    openInVSCode('/Users/arhaanbhiwandkar/Desktop/random projects/notesportal3.0')
                  }
                  style={{
                    border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: 12,
                    padding: '10px 16px',
                    color: '#c4b5fd',
                  }}
                >
                  <Code className="inline mr-2" />
                  Open in VS Code
                </button>

                <button
                  style={{
                    border: '1px solid rgba(168,85,247,0.4)',
                    borderRadius: 12,
                    padding: '10px 20px',
                    color: '#ede9fe',
                  }}
                >
                  <Send className="inline mr-2" />
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}