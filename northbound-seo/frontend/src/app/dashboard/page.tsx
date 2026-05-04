'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProjectOverview } from '@/lib/hooks/use-projects'
import { useAudits } from '@/lib/hooks/use-audits'
import { getCurrentProjectId } from '@/lib/utils'
import { SeoScoreRing } from '@/components/seo-score-ring'
import { ScoreBreakdownBars } from '@/components/score-breakdown'
import { IssueCard } from '@/components/issue-card'
import { AuditTrigger } from '@/components/audit-trigger'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatDateTime, formatDate } from '@/lib/utils'
import { Plus, ArrowRight, Clock } from 'lucide-react'
import type { AuditStatus } from '@/types'

const statusConfig: Record<AuditStatus, { label: string; variant: 'success' | 'info' | 'warning' | 'dim' | 'danger' }> = {
  queued: { label: 'Queued', variant: 'dim' },
  crawling: { label: 'Crawling', variant: 'info' },
  analyzing: { label: 'Analyzing', variant: 'warning' },
  completed: { label: 'Complete', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setProjectId(getCurrentProjectId())
  }, [])

  const { data: overview, isLoading } = useProjectOverview(projectId ?? '')
  const { data: audits } = useAudits(projectId ?? '')

  if (!mounted || isLoading) {
    return <DashboardSkeleton />
  }

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-surface2 border border-border flex items-center justify-center mb-4">
          <Plus className="h-8 w-8 text-dim" />
        </div>
        <h2 className="text-lg font-semibold font-mono text-text mb-2">No project selected</h2>
        <p className="text-sm text-dim font-mono mb-6 max-w-sm">
          Create your first project to start analyzing your SEO performance.
        </p>
        <Button onClick={() => router.push('/onboarding')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Your First Project
        </Button>
      </div>
    )
  }

  const latestAudit = audits?.[0]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold font-mono text-text">SEO Overview</h1>
        {projectId && <AuditTrigger projectId={projectId} />}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score card */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <SeoScoreRing score={overview?.score} size="lg" />
              <div className="flex-1 min-w-0">
                {overview?.score_breakdown ? (
                  <ScoreBreakdownBars breakdown={overview.score_breakdown} />
                ) : (
                  <div className="text-sm text-dim">No breakdown available</div>
                )}
                {latestAudit?.completed_at && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-dim">
                    <Clock className="h-3 w-3" />
                    Last analyzed: {formatDateTime(latestAudit.completed_at)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action counts */}
        <Card>
          <CardHeader>
            <CardTitle>Action Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {overview?.action_counts ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {(['P0', 'P1', 'P2', 'P3'] as const).map((p) => {
                    const count = overview.action_counts[p]
                    const variantMap = { P0: 'danger', P1: 'warning', P2: 'info', P3: 'success' } as const
                    return (
                      <div
                        key={p}
                        className="flex items-center justify-between p-3 bg-surface2 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={variantMap[p]}>{p}</Badge>
                          <span className="text-xs text-dim">
                            {p === 'P0' ? 'Critical' : p === 'P1' ? 'High' : p === 'P2' ? 'Medium' : 'Low'}
                          </span>
                        </div>
                        <span className="text-xl font-bold font-mono text-text">{count}</span>
                      </div>
                    )
                  })}
                </div>
                <Link href="/dashboard/actions">
                  <Button variant="outline" size="sm" className="w-full gap-2 mt-1">
                    View action queue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-sm text-dim py-4 text-center">Run an audit to generate action items.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top issues */}
      {overview?.top_issues && overview.top_issues.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Issues</CardTitle>
              {latestAudit && (
                <Link href={`/dashboard/audits/${latestAudit.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all issues
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview.top_issues.slice(0, 5).map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent audits */}
      {audits && audits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Audit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-dim">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Score</th>
                    <th className="text-left py-2 px-3">Pages</th>
                    <th className="text-left py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {audits.slice(0, 5).map((audit) => (
                    <tr key={audit.id} className="border-b border-border hover:bg-surface2 transition-colors">
                      <td className="py-2 px-3 text-dim">{formatDate(audit.created_at)}</td>
                      <td className="py-2 px-3">
                        <Badge variant={statusConfig[audit.status].variant}>
                          {statusConfig[audit.status].label}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 font-semibold text-text">
                        {audit.score ?? '—'}
                      </td>
                      <td className="py-2 px-3 text-dim">{audit.pages_crawled}</td>
                      <td className="py-2 px-3">
                        {audit.status === 'completed' && (
                          <Link href={`/dashboard/audits/${audit.id}`}>
                            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                              View <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
