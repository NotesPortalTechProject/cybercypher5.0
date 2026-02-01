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
  X,
  Gauge,
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
    /* 🔥 FULLSCREEN SAFE WRAPPER */
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 overflow-auto">
      <div
        className="
          w-full
          max-w-[90vw]
          min-w-[600px]
          max-h-[90vh]
          rounded-2xl
          overflow-auto
          bg-gradient-to-b
          from-[rgba(15,15,25,0.92)]
          to-[rgba(5,5,10,0.96)]
          border
          border-[rgba(168,85,247,0.35)]
          backdrop-blur-[26px]
          shadow-[0_0_0_1px_rgba(168,85,247,0.18),0_30px_80px_rgba(0,0,0,0.85),0_0_120px_rgba(168,85,247,0.35)]
        "
        style={{
          WebkitBackdropFilter: 'blur(26px)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{
            borderBottom: '1px solid rgba(168,85,247,0.25)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: '#7c3aed',
                boxShadow: '0 0 25px rgba(168,85,247,0.55)',
              }}
            >
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-violet-100">
                Agent Analysis
              </p>
              <p className="text-xs text-violet-300">
                AI-powered diagnostics
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-violet-300 hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-8 text-violet-100">
          {status === 'analyzing' && (
            <div className="space-y-6 py-10">
              <Loader2 className="w-9 h-9 mx-auto animate-spin text-violet-400" />
              {loadingSteps.map((s, i) => (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background:
                        i <= step ? '#a78bfa' : 'rgba(168,85,247,0.2)',
                    }}
                  />
                  <span
                    className={
                      i === step ? 'text-violet-100' : 'text-violet-300'
                    }
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4 py-10">
              <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {status === 'complete' && result && (
            <>
              {/* Confidence */}
              <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between rounded-xl p-6 bg-white/5 border border-violet-500/30">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/40">
                    <Gauge className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-violet-300">Confidence Score</p>
                    <p className="text-3xl font-extrabold text-violet-100">
                      {Math.round(result.confidence_score * 100)}%
                    </p>
                  </div>
                </div>

                <div className="rounded-lg px-4 py-3 bg-black/40 border border-violet-500/30">
                  <p className="text-xs text-violet-300">Merchant ID</p>
                  <p className="font-mono text-sm">
                    {result.merchant_id || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="rounded-xl p-7 bg-white/5 border border-violet-500/30">
                <p className="font-bold mb-4">Diagnosis</p>
                <div className="prose prose-invert max-w-none text-sm">
                  <ReactMarkdown>{result.diagnosis}</ReactMarkdown>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="rounded-xl p-7 bg-white/5 border border-violet-500/30">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold">Recommended Action</p>
                  <button onClick={copyReply}>
                    {copied ? <Check /> : <Copy />}
                  </button>
                </div>

                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  className="
                    w-full
                    min-h-[280px]
                    rounded-xl
                    bg-black/50
                    border border-violet-500/30
                    p-4
                    text-violet-100
                    outline-none
                  "
                />

                <div className="mt-6 flex flex-wrap gap-4">
                  <button
                    onClick={() =>
                      openInVSCode(
                        '/Users/arhaanbhiwandkar/Desktop/random projects/notesportal3.0'
                      )
                    }
                    className="px-5 py-3 rounded-xl border border-violet-500/40 text-violet-300 hover:bg-white/5"
                  >
                    <Code className="inline mr-2" />
                    Open in VS Code
                  </button>

                  <button className="px-6 py-3 rounded-xl border border-violet-500/60 text-violet-100 hover:bg-white/5">
                    <Send className="inline mr-2" />
                    Send Reply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
