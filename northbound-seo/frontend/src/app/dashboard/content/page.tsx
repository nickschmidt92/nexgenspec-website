'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useContentPlans, useTriggerContentPlan } from '@/lib/hooks/use-content'
import { getCurrentProjectId, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/lib/hooks/use-toast'
import { FileText, Plus, ArrowRight, Loader2 } from 'lucide-react'

export default function ContentPage() {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)

  useEffect(() => {
    setProjectId(getCurrentProjectId())
  }, [])

  const { data: plans, isLoading } = useContentPlans(projectId ?? '')
  const { mutate: trigger, isPending } = useTriggerContentPlan()

  const handleTrigger = () => {
    if (!projectId) return
    trigger(projectId, {
      onSuccess: (data) => {
        toast({ title: 'Content plan generation started', variant: 'default' })
        router.push(`/dashboard/content/${data.id}`)
      },
      onError: () => toast({ title: 'Failed to generate content plan', variant: 'destructive' }),
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
          <h1 className="text-lg font-bold font-mono text-text">Content Roadmap</h1>
          <p className="text-xs text-dim font-mono">AI-generated 90-day content strategy</p>
        </div>
        <Button onClick={handleTrigger} disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Generate Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !plans || plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-dim mb-4" />
          <h2 className="text-base font-semibold font-mono text-text mb-2">No content plans yet</h2>
          <p className="text-sm text-dim font-mono mb-6 max-w-sm">
            Generate a data-driven 90-day content roadmap based on your keyword research.
          </p>
          <Button onClick={handleTrigger} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Generate Content Plan
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:border-accent/30 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold font-mono text-text">{plan.name}</span>
                      <Badge
                        variant={
                          plan.status === 'completed'
                            ? 'success'
                            : plan.status === 'failed'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {plan.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-dim font-mono">
                      <span>{formatDate(plan.created_at)}</span>
                    </div>
                    {plan.summary && (
                      <div className="flex flex-wrap gap-4 text-xs font-mono">
                        <span className="text-dim">
                          Total items:{' '}
                          <span className="text-text font-semibold">{plan.summary.total_items}</span>
                        </span>
                        <span className="text-dim">
                          30-day:{' '}
                          <span className="text-accent font-semibold">{plan.summary.phase_30_day}</span>
                        </span>
                        <span className="text-dim">
                          60-day:{' '}
                          <span className="text-accent font-semibold">{plan.summary.phase_60_day}</span>
                        </span>
                        <span className="text-dim">
                          90-day:{' '}
                          <span className="text-accent font-semibold">{plan.summary.phase_90_day}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  {plan.status === 'completed' && (
                    <Link href={`/dashboard/content/${plan.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        View Roadmap
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
