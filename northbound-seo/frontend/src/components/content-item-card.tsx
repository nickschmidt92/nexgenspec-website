'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ContentItem, ContentType } from '@/types'
import { cn } from '@/lib/utils'

const priorityConfig: Record<string, { variant: 'danger' | 'warning' | 'info' | 'success' }> = {
  P0: { variant: 'danger' },
  P1: { variant: 'warning' },
  P2: { variant: 'info' },
  P3: { variant: 'success' },
}

const contentTypeLabels: Record<ContentType, string> = {
  blog_post: 'Blog Post',
  landing_page: 'Landing Page',
  faq_page: 'FAQ Page',
  pillar_page: 'Pillar Page',
  comparison_page: 'Comparison Page',
  how_to_guide: 'How-To Guide',
  case_study: 'Case Study',
}

const statusOptions = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'published', label: 'Published' },
]

interface ContentItemCardProps {
  item: ContentItem
  onStatusChange?: (id: string, status: string) => void
}

export function ContentItemCard({ item, onStatusChange }: ContentItemCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-border bg-surface rounded-lg p-4 font-mono">
      <div className="flex items-start gap-2 mb-3">
        <Badge variant={priorityConfig[item.priority]?.variant ?? 'dim'} className="shrink-0 mt-0.5">
          {item.priority}
        </Badge>
        <Badge variant="dim" className="shrink-0 mt-0.5">
          {contentTypeLabels[item.content_type] ?? item.content_type}
        </Badge>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text leading-snug">{item.title}</h4>
          {item.suggested_url && (
            <code className="text-xs text-accent">{item.suggested_url}</code>
          )}
        </div>
        <div className="shrink-0 w-36">
          <Select
            value={item.status}
            onValueChange={(v) => onStatusChange?.(item.id, v)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {item.target_keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.target_keywords.slice(0, 6).map((kw) => (
            <span
              key={kw}
              className="text-xs bg-surface2 border border-border text-dim px-1.5 py-0.5 rounded"
            >
              {kw}
            </span>
          ))}
          {item.target_keywords.length > 6 && (
            <span className="text-xs text-dim">+{item.target_keywords.length - 6} more</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-6 mb-2 text-xs text-dim">
        {item.word_count_min != null && item.word_count_max != null && (
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{item.word_count_min}–{item.word_count_max} words</span>
          </div>
        )}
        {item.target_intent && (
          <span className="capitalize">{item.target_intent}</span>
        )}
      </div>

      {(item.impact_score != null || item.effort_score != null) && (
        <div className="grid grid-cols-2 gap-3 mb-2">
          {item.impact_score != null && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-dim">Impact</span>
                <span className="text-accent">{item.impact_score}/10</span>
              </div>
              <Progress value={item.impact_score * 10} color="#4f9cf7" />
            </div>
          )}
          {item.effort_score != null && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-dim">Effort</span>
                <span className="text-warning">{item.effort_score}/10</span>
              </div>
              <Progress value={item.effort_score * 10} color="#f59e0b" />
            </div>
          )}
        </div>
      )}

      {item.outline && Object.keys(item.outline).length > 0 && (
        <button
          className="flex items-center gap-1 text-xs text-dim hover:text-text transition-colors mt-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Hide outline' : 'Show outline'}
        </button>
      )}

      {expanded && item.outline && (
        <div className="mt-2 pt-2 border-t border-border">
          <pre className="text-xs text-dim overflow-auto max-h-40 leading-relaxed">
            {JSON.stringify(item.outline, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
