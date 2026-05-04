'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useActions } from '@/lib/hooks/use-actions'
import { useUpdateAction, useRegenerateActions } from '@/lib/hooks/use-actions'
import { ActionCard } from './action-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ActionItem } from '@/types'
import { toast } from '@/lib/hooks/use-toast'

interface ActionQueueProps {
  projectId: string
}

const priorityColors: Record<string, string> = {
  P0: '#ef4444',
  P1: '#f59e0b',
  P2: '#4f9cf7',
  P3: '#22c55e',
}

export function ActionQueue({ projectId }: ActionQueueProps) {
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('open')

  const params: Record<string, string> = {}
  if (priorityFilter !== 'all') params.priority = priorityFilter
  if (categoryFilter !== 'all') params.category = categoryFilter
  if (statusFilter !== 'all') params.status = statusFilter

  const { data: actions, isLoading } = useActions(projectId, params)
  const { mutate: updateAction } = useUpdateAction()
  const { mutate: regenerate, isPending: isRegenerating } = useRegenerateActions()

  const handleStatusChange = (id: string, status: ActionItem['status']) => {
    updateAction(
      { id, data: { status }, projectId },
      {
        onSuccess: () => toast({ title: 'Action updated', variant: 'default' }),
        onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
      }
    )
  }

  const handleRegenerate = () => {
    regenerate(projectId, {
      onSuccess: () => toast({ title: 'Action plan regenerated', variant: 'default' }),
      onError: () => toast({ title: 'Failed to regenerate', variant: 'destructive' }),
    })
  }

  const grouped = (['P0', 'P1', 'P2', 'P3'] as const).reduce(
    (acc, p) => {
      acc[p] = actions?.filter((a) => a.priority === p) ?? []
      return acc
    },
    {} as Record<string, ActionItem[]>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-2">
          {(['all', 'P0', 'P1', 'P2', 'P3'] as const).map((p) => (
            <Button
              key={p}
              variant={priorityFilter === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPriorityFilter(p)}
            >
              {p}
            </Button>
          ))}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="technical_seo">Technical SEO</SelectItem>
            <SelectItem value="on_page_seo">On-Page SEO</SelectItem>
            <SelectItem value="content">Content</SelectItem>
            <SelectItem value="link_building">Link Building</SelectItem>
            <SelectItem value="schema_markup">Schema Markup</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-2"
          onClick={handleRegenerate}
          disabled={isRegenerating}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          Regenerate Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {(['P0', 'P1', 'P2', 'P3'] as const)
            .filter((p) => priorityFilter === 'all' || priorityFilter === p)
            .map((p) => {
              const items = grouped[p]
              if (items.length === 0) return null
              return (
                <div key={p}>
                  <div
                    className="flex items-center gap-2 mb-3 pb-2 border-b"
                    style={{ borderColor: priorityColors[p] + '40' }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: priorityColors[p] }}
                    />
                    <span className="text-sm font-semibold" style={{ color: priorityColors[p] }}>
                      {p === 'P0' ? 'Critical' : p === 'P1' ? 'High Priority' : p === 'P2' ? 'Medium Priority' : 'Low Priority'}
                    </span>
                    <Badge variant="dim" className="ml-1">{items.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {items.map((action) => (
                      <ActionCard
                        key={action.id}
                        action={action}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          {(!actions || actions.length === 0) && (
            <div className="text-center py-16 text-dim text-sm">
              No action items found for the selected filters.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
