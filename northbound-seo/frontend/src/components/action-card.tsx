'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Zap, Wrench, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ActionItem, ActionCategory } from '@/types'
import { cn } from '@/lib/utils'

const priorityConfig: Record<string, { variant: 'danger' | 'warning' | 'info' | 'success'; label: string }> = {
  P0: { variant: 'danger', label: 'P0' },
  P1: { variant: 'warning', label: 'P1' },
  P2: { variant: 'info', label: 'P2' },
  P3: { variant: 'success', label: 'P3' },
}

const categoryLabels: Record<ActionCategory, string> = {
  technical_seo: 'Technical SEO',
  on_page_seo: 'On-Page SEO',
  content: 'Content',
  link_building: 'Link Building',
  schema_markup: 'Schema Markup',
  performance: 'Performance',
}

const sourceLabels: Record<string, string> = {
  audit: 'From Audit',
  keywords: 'From Keywords',
  competitors: 'From Competitors',
  manual: 'Manual',
}

interface ActionCardProps {
  action: ActionItem
  onStatusChange: (id: string, status: ActionItem['status']) => void
}

export function ActionCard({ action, onStatusChange }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const p = priorityConfig[action.priority] ?? { variant: 'dim' as const, label: action.priority }
  const roi = action.roi_score?.toFixed(1)

  const statusOrder: ActionItem['status'][] = ['open', 'in_progress', 'done', 'dismissed']
  const nextStatus = (current: ActionItem['status']): ActionItem['status'] => {
    const idx = statusOrder.indexOf(current)
    return statusOrder[idx + 1] ?? 'done'
  }

  return (
    <div className={cn(
      'border rounded-lg p-4 font-mono transition-opacity',
      action.status === 'done' || action.status === 'dismissed' ? 'opacity-50' : '',
      'border-border bg-surface'
    )}>
      <div className="flex items-start gap-2 mb-2">
        <Badge variant={p.variant} className="shrink-0 mt-0.5">{p.label}</Badge>
        <Badge variant="dim" className="shrink-0 mt-0.5">{categoryLabels[action.category]}</Badge>
        {action.source_type && (
          <Badge variant="dim" className="shrink-0 mt-0.5 text-purple border-purple/30 bg-purple/10">
            {sourceLabels[action.source_type] ?? action.source_type}
          </Badge>
        )}
        <span className="flex-1 text-sm font-semibold text-text leading-snug">{action.title}</span>
        {roi && (
          <div className="shrink-0 flex items-center gap-1 text-xs text-accent2">
            <TrendingUp className="h-3 w-3" />
            <span>{roi}x ROI</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-dim"><Zap className="h-3 w-3 text-warning" />Impact</span>
            <span className="text-text">{action.impact_score}/10</span>
          </div>
          <Progress value={action.impact_score * 10} color="#f59e0b" />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-dim"><Wrench className="h-3 w-3 text-accent" />Effort</span>
            <span className="text-text">{action.effort_score}/10</span>
          </div>
          <Progress value={action.effort_score * 10} color="#4f9cf7" />
        </div>
      </div>

      <button
        className="flex items-center gap-1 text-xs text-dim hover:text-text transition-colors mb-3"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Hide details' : 'Show details'}
      </button>

      {expanded && (
        <div className="mb-3 pt-2 border-t border-border space-y-2">
          <p className="text-xs text-dim leading-relaxed">{action.description}</p>
          {action.affected_urls.length > 0 && (
            <div>
              <p className="text-xs text-dim mb-1">Affected URLs:</p>
              <div className="space-y-1">
                {action.affected_urls.slice(0, 3).map((url) => (
                  <code key={url} className="block text-xs text-accent bg-surface2 rounded px-2 py-0.5 truncate">
                    {url}
                  </code>
                ))}
                {action.affected_urls.length > 3 && (
                  <span className="text-xs text-dim">+{action.affected_urls.length - 3} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {(['open', 'in_progress', 'done'] as ActionItem['status'][]).map((s) => (
          <Button
            key={s}
            variant={action.status === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStatusChange(action.id, s)}
            className="capitalize text-xs"
          >
            {s.replace('_', ' ')}
          </Button>
        ))}
        <Button
          variant={action.status === 'dismissed' ? 'dim' : 'ghost'}
          size="sm"
          onClick={() => onStatusChange(action.id, 'dismissed')}
          className="text-xs ml-auto"
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
