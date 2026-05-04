'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useKeywordResearches, useTriggerKeywordResearch } from '@/lib/hooks/use-keywords'
import { getCurrentProjectId, formatDate, formatNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from '@/lib/hooks/use-toast'
import { Search, Plus, ArrowRight, Loader2 } from 'lucide-react'

export default function KeywordsPage() {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)

  useEffect(() => {
    setProjectId(getCurrentProjectId())
  }, [])

  const { data: researches, isLoading } = useKeywordResearches(projectId ?? '')
  const { mutate: trigger, isPending } = useTriggerKeywordResearch()

  const handleTrigger = () => {
    if (!projectId) return
    trigger(
      { projectId },
      {
        onSuccess: (data) => {
          toast({ title: 'Keyword research started', variant: 'default' })
          router.push(`/dashboard/keywords/${data.id}`)
        },
        onError: () => toast({ title: 'Failed to start research', variant: 'destructive' }),
      }
    )
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
          <h1 className="text-lg font-bold font-mono text-text">Keyword Research</h1>
          <p className="text-xs text-dim font-mono">Discover and cluster keywords for your website</p>
        </div>
        <Button onClick={handleTrigger} disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New Research
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !researches || researches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-12 w-12 text-dim mb-4" />
          <h2 className="text-base font-semibold font-mono text-text mb-2">No keyword research yet</h2>
          <p className="text-sm text-dim font-mono mb-6 max-w-sm">
            Run keyword research to discover high-value opportunities for your website.
          </p>
          <Button onClick={handleTrigger} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Start Keyword Research
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {researches.map((r) => (
            <Card key={r.id} className="hover:border-accent/30 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          r.status === 'completed'
                            ? 'success'
                            : r.status === 'failed'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {r.status}
                      </Badge>
                      <span className="text-xs text-dim font-mono">{formatDate(r.created_at)}</span>
                    </div>
                    {r.summary && (
                      <div className="flex flex-wrap gap-4 text-xs font-mono">
                        <span className="text-dim">
                          Total keywords:{' '}
                          <span className="text-text font-semibold">{r.summary.total_keywords}</span>
                        </span>
                        <span className="text-dim">
                          Volume:{' '}
                          <span className="text-text font-semibold">
                            {formatNumber(r.summary.total_monthly_volume)}/mo
                          </span>
                        </span>
                        <span className="text-dim">
                          Opportunities:{' '}
                          <span className="text-accent2 font-semibold">{r.summary.opportunities_found}</span>
                        </span>
                        <span className="text-dim">
                          Clusters:{' '}
                          <span className="text-text font-semibold">{r.summary.clusters_count}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  {r.status === 'completed' && (
                    <Link href={`/dashboard/keywords/${r.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        View Results
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
