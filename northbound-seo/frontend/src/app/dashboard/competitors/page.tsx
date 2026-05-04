'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCompetitors, useTriggerCompetitorAnalysis } from '@/lib/hooks/use-competitors'
import { getCurrentProjectId, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/lib/hooks/use-toast'
import { Users, Plus, ArrowRight, Loader2 } from 'lucide-react'

export default function CompetitorsPage() {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)

  useEffect(() => {
    setProjectId(getCurrentProjectId())
  }, [])

  const { data: competitors, isLoading } = useCompetitors(projectId ?? '')
  const { mutate: triggerAnalysis, isPending } = useTriggerCompetitorAnalysis()

  const handleAnalyze = () => {
    if (!projectId) return
    triggerAnalysis(projectId, {
      onSuccess: (data) => {
        toast({ title: 'Competitor analysis started', variant: 'default' })
        router.push(`/dashboard/competitors/${data.id}`)
      },
      onError: () => toast({ title: 'Failed to start analysis', variant: 'destructive' }),
    })
  }

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-dim font-mono text-sm mb-4">No project selected.</p>
        <Button onClick={() => router.push('/dashboard/projects')}>Go to Projects</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono text-text">Competitor Analysis</h1>
          <p className="text-xs text-dim font-mono">Identify keyword and content gaps vs your competition</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
            className="gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Manage Competitors
          </Button>
          <Button onClick={handleAnalyze} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            Analyze Competitors
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !competitors || competitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-dim mb-4" />
          <h2 className="text-base font-semibold font-mono text-text mb-2">No competitors added</h2>
          <p className="text-sm text-dim font-mono mb-6 max-w-sm">
            Add competitor URLs to your project, then run a gap analysis to find opportunities.
          </p>
          <Button
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Competitors
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {competitors.map((comp) => (
              <div key={comp.id} className="border border-border bg-surface rounded-lg p-3">
                <p className="text-sm font-semibold font-mono text-text truncate mb-1">
                  {comp.name ?? comp.url.replace(/^https?:\/\//, '')}
                </p>
                <p className="text-xs text-dim truncate">{comp.url}</p>
                <div className="flex items-center gap-2 mt-2">
                  {comp.is_auto_detected && (
                    <Badge variant="dim">Auto-detected</Badge>
                  )}
                  <span className="text-xs text-dim">Added {formatDate(comp.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={handleAnalyze} disabled={isPending} size="lg" className="gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              Run Gap Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
