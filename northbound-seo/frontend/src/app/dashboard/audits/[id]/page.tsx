'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAudit, useAuditIssueSummary } from '@/lib/hooks/use-audits'
import { IssueList } from '@/components/issue-list'
import { SeoScoreRing } from '@/components/seo-score-ring'
import { ScoreBreakdownBars } from '@/components/score-breakdown'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatDateTime } from '@/lib/utils'
import { Loader2, ArrowLeft, Download, Zap } from 'lucide-react'
import type { IssueSeverity } from '@/types'

function ProgressIndicator({ status }: { status: string }) {
  const steps = [
    { key: 'queued', label: 'Queued' },
    { key: 'crawling', label: 'Crawling Pages' },
    { key: 'analyzing', label: 'Analyzing' },
    { key: 'completed', label: 'Complete' },
  ]

  const currentIdx = steps.findIndex((s) => s.key === status)

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      <Loader2 className="h-12 w-12 text-accent animate-spin" />
      <div className="text-center">
        <h2 className="text-lg font-semibold font-mono text-text mb-2">Audit in progress</h2>
        <p className="text-sm text-dim font-mono">This usually takes 1–3 minutes</p>
      </div>
      <div className="flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 transition-colors ${
                  i <= currentIdx
                    ? 'bg-accent border-accent text-bg'
                    : 'bg-surface2 border-border text-dim'
                }`}
              >
                {i < currentIdx ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs font-mono mt-1 text-center w-16 ${
                  i === currentIdx ? 'text-accent' : i < currentIdx ? 'text-accent2' : 'text-dim'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-px mb-5 ${i < currentIdx ? 'bg-accent' : 'bg-border'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AuditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: audit, isLoading } = useAudit(id)
  const { data: issueSummary } = useAuditIssueSummary(
    audit?.status === 'completed' ? id : ''
  )

  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="text-center py-16">
        <p className="text-dim font-mono">Audit not found.</p>
      </div>
    )
  }

  const isInProgress = ['queued', 'crawling', 'analyzing'].includes(audit.status)

  if (isInProgress) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="bg-surface border border-border rounded-xl">
          <ProgressIndicator status={audit.status} />
        </div>
      </div>
    )
  }

  if (audit.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-danger font-mono mb-2">Audit failed</p>
        <p className="text-dim text-sm font-mono">{audit.error_message ?? 'An unknown error occurred.'}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mt-6">
          Go back
        </Button>
      </div>
    )
  }

  const severityVariants: Record<IssueSeverity, 'danger' | 'warning' | 'info' | 'dim'> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'dim',
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold font-mono text-text">Audit Results</h1>
            <p className="text-xs text-dim font-mono">
              {formatDateTime(audit.completed_at)} · {audit.pages_crawled} pages crawled
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
          <Button size="sm" className="gap-2">
            <Zap className="h-3.5 w-3.5" />
            Generate Action Plan
          </Button>
        </div>
      </div>

      {/* Score + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <SeoScoreRing score={audit.score} size="lg" />
              {audit.score_breakdown && (
                <div className="flex-1">
                  <ScoreBreakdownBars breakdown={audit.score_breakdown} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {audit.summary || issueSummary ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {(['critical', 'high', 'medium', 'low'] as IssueSeverity[]).map((sev) => {
                    const count = issueSummary?.by_severity[sev] ?? audit.summary?.[`${sev}_count` as keyof typeof audit.summary] ?? 0
                    return (
                      <div
                        key={sev}
                        className="flex items-center justify-between p-3 bg-surface2 rounded-lg border border-border"
                      >
                        <Badge variant={severityVariants[sev]} className="capitalize">{sev}</Badge>
                        <span className="text-xl font-bold font-mono text-text">{count as number}</span>
                      </div>
                    )
                  })}
                </div>
                {audit.summary && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-dim mb-0.5">Top Issue</p>
                      <p className="text-xs text-text">{audit.summary.top_issue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dim mb-0.5">Biggest Opportunity</p>
                      <p className="text-xs text-accent2">{audit.summary.biggest_opportunity}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-dim">No summary available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <IssueList auditId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
