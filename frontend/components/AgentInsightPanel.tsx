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
    <div className="w-[1200px] max-w-[95vw] rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Agent Analysis</p>
            <p className="text-xs text-zinc-500">AI diagnostics</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        )}
      </div>

      <div className="p-5">
        {status === 'analyzing' && (
          <div className="space-y-4">
            <Loader2 className="w-6 h-6 mx-auto text-indigo-500 animate-spin" />
            {loadingSteps.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    i <= step ? 'bg-indigo-500' : 'bg-zinc-300'
                  }`}
                />
                <span className={i === step ? 'text-indigo-600' : 'text-zinc-400'}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
            <p className="text-sm text-zinc-600">{error}</p>
          </div>
        )}

        {status === 'complete' && result && (
          <div className="space-y-6">
            
            {/* Confidence Score - Prominent at top */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-zinc-50 to-zinc-100 border border-zinc-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  result.confidence_score >= 0.7 ? 'bg-emerald-100' :
                  result.confidence_score >= 0.4 ? 'bg-amber-100' : 'bg-rose-100'
                }`}>
                  <Gauge className={`w-5 h-5 ${
                    result.confidence_score >= 0.7 ? 'text-emerald-600' :
                    result.confidence_score >= 0.4 ? 'text-amber-600' : 'text-rose-600'
                  }`} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium">Confidence Score</p>
                  <p className={`text-2xl font-bold ${
                    result.confidence_score >= 0.7 ? 'text-emerald-600' :
                    result.confidence_score >= 0.4 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {Math.round(result.confidence_score * 100)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400">Merchant ID</p>
                <p className="text-sm font-mono font-semibold text-indigo-600">{result.merchant_id || 'N/A'}</p>
              </div>
            </div>

            {/* Analysis Steps - Compact */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium mb-3">Analysis Steps</p>
              <div className="flex flex-wrap gap-2">
                {result.steps_log.slice(0, 6).map((s, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-xs text-zinc-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {cleanStep(s).slice(0, 30)}{cleanStep(s).length > 30 ? '...' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnosis */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Diagnosis</p>
                  <p className="text-xs text-zinc-500">AI-generated root cause analysis</p>
                </div>
              </div>
              <div className="text-sm text-zinc-700 leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown>
                  {result.diagnosis}
                </ReactMarkdown>
              </div>
            </div>

            {/* Recommended Action / Reply */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <MessageSquareText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Recommended Action</p>
                    <p className="text-xs text-zinc-500">Suggested reply to the customer</p>
                  </div>
                </div>
                <button onClick={copyReply} className="p-2 rounded-lg hover:bg-emerald-100 transition">
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-zinc-500" />
                  )}
                </button>
              </div>

              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                className="
                  w-full min-h-[180px]
                  p-4
                  rounded-xl
                  border border-emerald-200
                  bg-white/60
                  text-sm text-zinc-800
                  leading-relaxed
                  resize-y
                  focus:outline-none
                  focus:ring-2 focus:ring-emerald-400
                  focus:border-emerald-400
                "
              />

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() =>
                    openInVSCode('/Users/arhaanbhiwandkar/Desktop/random projects/notesportal3.0')
                  }
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2.5
                    rounded-lg
                    bg-white
                    border border-zinc-300
                    text-sm text-zinc-700
                    hover:border-indigo-400
                    hover:text-indigo-600
                    transition
                    shadow-sm
                  "
                >
                  <Code className="w-4 h-4" />
                  Open in VS Code
                  <ExternalLink className="w-3 h-3" />
                </button>

                <button
                  className="
                    inline-flex items-center gap-2
                    px-5 py-2.5
                    rounded-lg
                    bg-emerald-500
                    text-sm font-medium text-white
                    hover:bg-emerald-600
                    transition
                    shadow-sm
                  "
                >
                  <Send className="w-4 h-4" />
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
