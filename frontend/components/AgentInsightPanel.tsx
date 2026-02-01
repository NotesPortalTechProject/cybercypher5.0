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
    <div className="w-[1400px] max-w-[95vw] rounded-2xl border border-purple-300/50 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 backdrop-blur-md shadow-xl overflow-hidden">
      {/* Header - Colorful gradient */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/20 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-pink-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Agent Analysis</p>
            <p className="text-xs text-purple-600/70">AI-powered diagnostics</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 rounded-lg bg-transparent hover:bg-white/20 transition">
            <X className="w-5 h-5 text-purple-600" />
          </button>
        )}
      </div>

      <div className="p-6">
        {status === 'analyzing' && (
          <div className="space-y-4 py-8">
            <Loader2 className="w-8 h-8 mx-auto text-fuchsia-500 animate-spin" />
            {loadingSteps.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div
                  className={`w-3 h-3 rounded-full transition-all ${
                    i <= step ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 scale-110' : 'bg-purple-200'
                  }`}
                />
                <span className={i === step ? 'text-fuchsia-600 font-medium' : 'text-purple-400'}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-3 py-8">
            <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        )}

        {status === 'complete' && result && (
          <div className="space-y-6">
            
            {/* Confidence Score - Vibrant gradient */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 border border-purple-300/30">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                  result.confidence_score >= 0.7 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' :
                  result.confidence_score >= 0.4 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-rose-400 to-pink-500'
                }`}>
                  <Gauge className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-purple-600 font-semibold">Confidence Score</p>
                  <p className={`text-3xl font-black ${
                    result.confidence_score >= 0.7 ? 'bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent' :
                    result.confidence_score >= 0.4 ? 'bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent' : 'bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent'
                  }`}>
                    {Math.round(result.confidence_score * 100)}%
                  </p>
                </div>
              </div>
              <div className="text-right px-4 py-2 rounded-xl bg-white/30 backdrop-blur-sm">
                <p className="text-xs text-purple-500 font-medium">Merchant ID</p>
                <p className="text-base font-mono font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">{result.merchant_id || 'N/A'}</p>
              </div>
            </div>

            {/* Analysis Steps - Colorful pills */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-300/30">
              <p className="text-xs uppercase tracking-wider text-cyan-700 font-semibold mb-4">Analysis Steps</p>
              <div className="flex flex-wrap gap-2">
                {result.steps_log.slice(0, 6).map((s, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-300/40 text-xs font-medium text-cyan-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {cleanStep(s).slice(0, 30)}{cleanStep(s).length > 30 ? '...' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnosis - Purple/Indigo gradient */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-purple-500/15 border border-indigo-300/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Diagnosis</p>
                  <p className="text-xs text-indigo-500">AI-generated root cause analysis</p>
                </div>
              </div>
              <div className="text-sm text-indigo-900 leading-relaxed prose prose-sm max-w-none prose-indigo">
                <ReactMarkdown>
                  {result.diagnosis}
                </ReactMarkdown>
              </div>
            </div>

            {/* Recommended Action - Teal/Emerald gradient */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border border-emerald-300/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <MessageSquareText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Recommended Action</p>
                    <p className="text-xs text-teal-600">Suggested reply to the customer</p>
                  </div>
                </div>
                <button onClick={copyReply} className="p-2.5 rounded-xl bg-transparent hover:bg-white/30 border border-transparent hover:border-teal-300/50 transition">
                  {copied ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-teal-600" />
                  )}
                </button>
              </div>

              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                style={{ minWidth: '700px', width: '100%' }}
                className="
                  min-h-[280px]
                  p-5
                  rounded-xl
                  border border-teal-300/50
                  bg-transparent
                  text-sm text-teal-900
                  leading-relaxed
                  resize-y
                  focus:outline-none
                  focus:ring-2 focus:ring-teal-400/50
                  focus:border-teal-400
                  placeholder-teal-400
                "
              />

              <div className="mt-5 flex items-center gap-4">
                <button
                  onClick={() =>
                    openInVSCode('/Users/arhaanbhiwandkar/Desktop/random projects/notesportal3.0')
                  }
                  className="
                    inline-flex items-center gap-2
                    px-5 py-3
                    rounded-xl
                    bg-transparent
                    border border-indigo-400/50
                    text-sm font-medium text-indigo-600
                    hover:bg-indigo-500/10
                    hover:border-indigo-500
                    transition
                  "
                >
                  <Code className="w-4 h-4" />
                  Open in VS Code
                  <ExternalLink className="w-3 h-3" />
                </button>

                <button
                  className="
                    inline-flex items-center gap-2
                    px-6 py-3
                    rounded-xl
                    bg-transparent
                    border border-emerald-400/50
                    text-sm font-bold text-emerald-600
                    hover:bg-emerald-500/10
                    hover:border-emerald-500
                    transition
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
