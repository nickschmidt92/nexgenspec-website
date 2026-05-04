'use client'

import { Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTriggerAudit, useAudits } from '@/lib/hooks/use-audits'
import { toast } from '@/lib/hooks/use-toast'

interface AuditTriggerProps {
  projectId: string
}

export function AuditTrigger({ projectId }: AuditTriggerProps) {
  const { data: audits } = useAudits(projectId)
  const { mutate: triggerAudit, isPending } = useTriggerAudit()

  const latestAudit = audits?.[0]
  const isRunning =
    latestAudit && ['queued', 'crawling', 'analyzing'].includes(latestAudit.status)

  const statusConfig = {
    queued: { label: 'Queued', variant: 'dim' as const },
    crawling: { label: 'Crawling pages...', variant: 'info' as const },
    analyzing: { label: 'Analyzing...', variant: 'warning' as const },
    completed: { label: 'Completed', variant: 'success' as const },
    failed: { label: 'Failed', variant: 'danger' as const },
  }

  const handleTrigger = () => {
    triggerAudit(projectId, {
      onSuccess: () => {
        toast({ title: 'Audit started', description: 'Your SEO audit is now running.', variant: 'default' })
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to start audit. Try again.', variant: 'destructive' })
      },
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleTrigger}
        disabled={isPending || !!isRunning}
        className="gap-2"
      >
        {isPending || isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isRunning ? 'Audit Running...' : 'Run SEO Audit'}
      </Button>
      {latestAudit && (
        <Badge variant={statusConfig[latestAudit.status].variant}>
          {statusConfig[latestAudit.status].label}
        </Badge>
      )}
    </div>
  )
}
