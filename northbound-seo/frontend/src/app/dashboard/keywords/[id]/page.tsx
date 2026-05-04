'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useKeywordResearch, useKeywords, useKeywordClusters } from '@/lib/hooks/use-keywords'
import { KeywordTable } from '@/components/keyword-table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { KeywordIntent } from '@/types'

const intentVariants: Record<KeywordIntent, 'info' | 'success' | 'dim' | 'warning'> = {
  informational: 'info',
  transactional: 'success',
  navigational: 'dim',
  commercial: 'warning',
}

function ClusterRow({ cluster, researchId }: { cluster: { id: string; name: string; intent: KeywordIntent | null; keyword_count: number; total_volume: number; avg_difficulty: number | null }; researchId: string }) {
  const [open, setOpen] = useState(false)
  const { data: keywords } = useKeywords(researchId, { cluster_id: cluster.id })

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface2 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronUp className="h-4 w-4 text-dim shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-dim shrink-0" />
        )}
        <span className="text-sm font-semibold font-mono text-text flex-1">{cluster.name}</span>
        <div className="flex items-center gap-3 shrink-0">
          {cluster.intent && (
            <Badge variant={intentVariants[cluster.intent]} className="capitalize">
              {cluster.intent}
            </Badge>
          )}
          <span className="text-xs font-mono text-dim">
            {cluster.keyword_count} keywords
          </span>
          <span className="text-xs font-mono text-text">
            {formatNumber(cluster.total_volume)}/mo
          </span>
        </div>
      </button>
      {open && keywords && (
        <div className="border-t border-border p-4 bg-bg">
          <KeywordTable keywords={keywords} />
        </div>
      )}
    </div>
  )
}

export default function KeywordResearchPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: research, isLoading } = useKeywordResearch(id)
  const { data: keywords, isLoading: kwLoading } = useKeywords(id)
  const { data: clusters } = useKeywordClusters(id)
  const [view, setView] = useState<'clusters' | 'all' | 'primary' | 'secondary' | 'longtail' | 'opportunities'>('clusters')

  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!research) {
    return <div className="text-dim font-mono text-center py-16">Research not found.</div>
  }

  const isRunning = ['queued', 'processing'].includes(research.status)

  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-12 w-12 text-accent animate-spin" />
        <div className="text-center">
          <h2 className="text-base font-semibold font-mono text-text mb-1">Researching keywords</h2>
          <p className="text-sm text-dim font-mono">Discovering and clustering keywords for your site...</p>
        </div>
      </div>
    )
  }

  const filteredKeywords = (() => {
    if (!keywords) return []
    if (view === 'all') return keywords
    if (view === 'primary') return keywords.filter((k) => k.tier === 'primary')
    if (view === 'secondary') return keywords.filter((k) => k.tier === 'secondary')
    if (view === 'longtail') return keywords.filter((k) => k.tier === 'long_tail')
    if (view === 'opportunities') return keywords.filter((k) => k.opportunity)
    return []
  })()

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-lg font-bold font-mono text-text">Keyword Research</h1>
      </div>

      {/* Summary stats */}
      {research.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Keywords', value: research.summary.total_keywords, color: 'text-text' },
            { label: 'Monthly Volume', value: formatNumber(research.summary.total_monthly_volume), color: 'text-text' },
            { label: 'Opportunities', value: research.summary.opportunities_found, color: 'text-accent2' },
            { label: 'Clusters', value: research.summary.clusters_count, color: 'text-accent' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <p className="text-xs text-dim font-mono mb-1">{label}</p>
                <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View selector */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'clusters', label: 'Clusters' },
          { key: 'all', label: 'All Keywords' },
          { key: 'primary', label: 'Primary' },
          { key: 'secondary', label: 'Secondary' },
          { key: 'longtail', label: 'Long-tail' },
          { key: 'opportunities', label: 'Opportunities' },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={view === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView(key as typeof view)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Clusters view */}
      {view === 'clusters' && clusters && (
        <div className="space-y-2">
          {clusters.length === 0 ? (
            <p className="text-dim text-sm text-center py-8">No clusters found.</p>
          ) : (
            clusters.map((cluster) => (
              <ClusterRow key={cluster.id} cluster={cluster} researchId={id} />
            ))
          )}
        </div>
      )}

      {/* Table views */}
      {view !== 'clusters' && (
        <Card>
          <CardContent className="pt-4">
            {kwLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <KeywordTable keywords={filteredKeywords} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
