'use client'

import { useParams, useRouter } from 'next/navigation'
import { useContentPlan } from '@/lib/hooks/use-content'
import { ContentRoadmap } from '@/components/content-roadmap'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function ContentPlanPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: plan, isLoading } = useContentPlan(id)

  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!plan) {
    return <div className="text-dim font-mono text-center py-16">Content plan not found.</div>
  }

  const isRunning = ['queued', 'processing'].includes(plan.status)

  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-12 w-12 text-accent animate-spin" />
        <div className="text-center">
          <h2 className="text-base font-semibold font-mono text-text mb-1">Generating content plan</h2>
          <p className="text-sm text-dim font-mono">Building your 90-day content roadmap...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-lg font-bold font-mono text-text">{plan.name}</h1>
          {plan.summary && (
            <p className="text-xs text-dim font-mono">
              {plan.summary.total_items} content pieces across 90 days
            </p>
          )}
        </div>
      </div>

      {plan.summary && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '30-Day Items', value: plan.summary.phase_30_day, color: 'text-accent' },
            { label: '60-Day Items', value: plan.summary.phase_60_day, color: 'text-accent' },
            { label: '90-Day Items', value: plan.summary.phase_90_day, color: 'text-accent' },
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

      <ContentRoadmap planId={id} />
    </div>
  )
}
