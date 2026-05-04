'use client'

import { useContentPlan, useContentItems } from '@/lib/hooks/use-content'
import { useUpdateContentItem } from '@/lib/hooks/use-content'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ContentItemCard } from './content-item-card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/hooks/use-toast'

interface ContentRoadmapProps {
  planId: string
}

export function ContentRoadmap({ planId }: ContentRoadmapProps) {
  const { data: plan } = useContentPlan(planId)
  const { data: items, isLoading } = useContentItems(planId)
  const { mutate: updateItem } = useUpdateContentItem()

  const handleStatusChange = (id: string, status: string) => {
    updateItem(
      { id, data: { status }, planId },
      {
        onSuccess: () => toast({ title: 'Status updated', variant: 'default' }),
        onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    )
  }

  const phases: { key: '30_day' | '60_day' | '90_day'; label: string }[] = [
    { key: '30_day', label: '30 Days' },
    { key: '60_day', label: '60 Days' },
    { key: '90_day', label: '90 Days' },
  ]

  return (
    <Tabs defaultValue="30_day">
      <TabsList>
        {phases.map((p) => {
          const count = items?.filter((i) => i.phase === p.key).length ?? 0
          return (
            <TabsTrigger key={p.key} value={p.key}>
              {p.label}
              {count > 0 && (
                <span className="ml-1.5 text-xs bg-surface2 border border-border rounded px-1 text-dim">
                  {count}
                </span>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {phases.map((p) => {
        const phaseItems = items?.filter((i) => i.phase === p.key) ?? []
        const sorted = [...phaseItems].sort((a, b) => {
          const pOrder = ['P0', 'P1', 'P2', 'P3']
          return pOrder.indexOf(a.priority) - pOrder.indexOf(b.priority)
        })

        return (
          <TabsContent key={p.key} value={p.key}>
            {sorted.length === 0 ? (
              <div className="text-center py-12 text-dim text-sm">
                No content items for this phase.
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((item) => (
                  <ContentItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
