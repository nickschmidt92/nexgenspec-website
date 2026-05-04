'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useActionSummary } from '@/lib/hooks/use-actions'
import { ActionQueue } from '@/components/action-queue'
import { getCurrentProjectId } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'

export default function ActionsPage() {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setProjectId(getCurrentProjectId())
  }, [])

  const { data: summary, isLoading: summaryLoading } = useActionSummary(projectId ?? '')

  if (!mounted) return null

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-dim font-mono text-sm mb-4">No project selected.</p>
        <Button onClick={() => router.push('/dashboard/projects')}>Go to Projects</Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono text-text">Action Queue</h1>
          <p className="text-xs text-dim font-mono">Prioritized SEO tasks ranked by impact and ROI</p>
        </div>
      </div>

      {/* Summary bar */}
      {summaryLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : summary ? (
        <div className="flex items-center gap-4 p-4 bg-surface border border-border rounded-lg font-mono">
          <Zap className="h-5 w-5 text-accent shrink-0" />
          <div className="flex items-center gap-6 text-sm flex-wrap">
            {([
              { priority: 'P0', label: 'Critical', variant: 'danger' as const },
              { priority: 'P1', label: 'High', variant: 'warning' as const },
              { priority: 'P2', label: 'Medium', variant: 'info' as const },
              { priority: 'P3', label: 'Low', variant: 'success' as const },
            ]).map(({ priority, label, variant }) => (
              <div key={priority} className="flex items-center gap-2">
                <Badge variant={variant}>{priority}</Badge>
                <span className="text-text font-semibold">{summary[priority as keyof typeof summary]}</span>
                <span className="text-dim text-xs">{label}</span>
              </div>
            ))}
            <div className="ml-auto text-dim text-xs">
              Total: <span className="text-text font-semibold">{summary.total}</span>
            </div>
          </div>
        </div>
      ) : null}

      <ActionQueue projectId={projectId} />
    </div>
  )
}
