'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCompetitorAnalysis, useCompetitorGaps } from '@/lib/hooks/use-competitors'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatNumber } from '@/lib/utils'
import { ArrowLeft, Loader2, TrendingUp } from 'lucide-react'
import type { GapType } from '@/types'

function GapCard({ gap }: { gap: { id: string; title: string; description: string | null; competitor_value: string | null; your_value: string | null; opportunity_score: number | null; gap_type: GapType; keyword: string | null; search_volume: number | null } }) {
  const typeVariants: Record<GapType, 'danger' | 'info' | 'dim' | 'warning'> = {
    keyword: 'danger',
    content: 'info',
    backlink: 'warning',
    technical: 'dim',
  }

  return (
    <div className="border border-border bg-surface rounded-lg p-4 font-mono">
      <div className="flex items-start gap-2 mb-2">
        <Badge variant={typeVariants[gap.gap_type]} className="shrink-0 capitalize mt-0.5">
          {gap.gap_type}
        </Badge>
        {gap.opportunity_score != null && (
          <div className="ml-auto flex items-center gap-1 text-xs text-accent2 shrink-0">
            <TrendingUp className="h-3 w-3" />
            <span>{gap.opportunity_score}/10</span>
          </div>
        )}
      </div>
      <h4 className="text-sm font-semibold text-text mb-1">{gap.title}</h4>
      {gap.description && (
        <p className="text-xs text-dim leading-relaxed mb-2">{gap.description}</p>
      )}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {gap.competitor_value && (
          <div>
            <p className="text-dim mb-0.5">Competitor</p>
            <p className="text-danger">{gap.competitor_value}</p>
          </div>
        )}
        {gap.your_value && (
          <div>
            <p className="text-dim mb-0.5">Yours</p>
            <p className="text-text">{gap.your_value}</p>
          </div>
        )}
        {gap.keyword && (
          <div>
            <p className="text-dim mb-0.5">Keyword</p>
            <code className="text-accent">{gap.keyword}</code>
          </div>
        )}
        {gap.search_volume != null && (
          <div>
            <p className="text-dim mb-0.5">Search Volume</p>
            <p className="text-text">{formatNumber(gap.search_volume)}/mo</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompetitorAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [gapType, setGapType] = useState<GapType | 'all'>('all')

  const { data: analysis, isLoading } = useCompetitorAnalysis(id)
  const gapParams: Record<string, string> = {}
  if (gapType !== 'all') gapParams.gap_type = gapType

  const { data: gaps } = useCompetitorGaps(
    analysis?.status === 'completed' ? id : '',
    gapParams
  )

  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!analysis) {
    return <div className="text-dim font-mono text-center py-16">Analysis not found.</div>
  }

  const isRunning = ['queued', 'processing'].includes(analysis.status)

  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-12 w-12 text-accent animate-spin" />
        <div className="text-center">
          <h2 className="text-base font-semibold font-mono text-text mb-1">Analyzing competitors</h2>
          <p className="text-sm text-dim font-mono">Finding gaps and opportunities...</p>
        </div>
      </div>
    )
  }

  const sortedGaps = gaps ? [...gaps].sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0)) : []

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-lg font-bold font-mono text-text">Competitor Gap Analysis</h1>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Keyword Gaps', value: analysis.summary.keyword_gaps, color: 'text-danger' },
            { label: 'Content Gaps', value: analysis.summary.content_gaps, color: 'text-warning' },
            { label: 'Missed Volume', value: formatNumber(analysis.summary.total_missed_volume) + '/mo', color: 'text-text' },
            { label: 'Top Opportunity', value: analysis.summary.top_opportunity, color: 'text-accent2' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <p className="text-xs text-dim font-mono mb-1">{label}</p>
                <p className={`text-lg font-bold font-mono ${color} truncate`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Gaps */}
      <Card>
        <CardHeader>
          <CardTitle>Gaps & Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            {([
              { key: 'all', label: 'All' },
              { key: 'keyword', label: 'Keyword Gaps' },
              { key: 'content', label: 'Content Gaps' },
              { key: 'backlink', label: 'Backlinks' },
              { key: 'technical', label: 'Technical' },
            ] as { key: GapType | 'all'; label: string }[]).map(({ key, label }) => (
              <Button
                key={key}
                variant={gapType === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGapType(key)}
              >
                {label}
              </Button>
            ))}
          </div>

          {sortedGaps.length === 0 ? (
            <div className="text-center py-8 text-dim text-sm">No gaps found for this filter.</div>
          ) : (
            <div className="space-y-3">
              {sortedGaps.map((gap) => (
                <GapCard key={gap.id} gap={gap} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
