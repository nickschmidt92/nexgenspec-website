'use client'

import { useState } from 'react'
import { Zap, Wrench, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AuditIssue, IssueSeverity, IssueCategory } from '@/types'
import { cn } from '@/lib/utils'

const severityConfig: Record<IssueSeverity, { label: string; variant: 'danger' | 'warning' | 'info' | 'dim' }> = {
  critical: { label: 'Critical', variant: 'danger' },
  high: { label: 'High', variant: 'warning' },
  medium: { label: 'Medium', variant: 'info' },
  low: { label: 'Low', variant: 'dim' },
}

const categoryLabels: Record<IssueCategory, string> = {
  meta_tags: 'Meta Tags',
  headings: 'Headings',
  content: 'Content',
  images: 'Images',
  links: 'Links',
  schema: 'Schema',
  performance: 'Performance',
  mobile: 'Mobile',
  security: 'Security',
  crawlability: 'Crawlability',
  indexability: 'Indexability',
}

interface IssueCardProps {
  issue: AuditIssue
}

export function IssueCard({ issue }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false)
  const sev = severityConfig[issue.severity]

  return (
    <div className="border border-border bg-surface rounded-lg p-3 font-mono">
      <div className="flex items-start gap-2 mb-2">
        <Badge variant={sev.variant} className="shrink-0 mt-0.5">{sev.label}</Badge>
        <Badge variant="dim" className="shrink-0 mt-0.5">{categoryLabels[issue.category]}</Badge>
        <span className="text-sm font-medium text-text flex-1 leading-snug">{issue.title}</span>
      </div>

      <p className="text-xs text-dim leading-relaxed mb-2 line-clamp-2">{issue.description}</p>

      {issue.affected_url && (
        <code className="text-xs bg-surface2 border border-border rounded px-2 py-0.5 text-accent block mb-2 truncate">
          {issue.affected_url}
        </code>
      )}

      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1 text-xs text-dim">
          <Zap className="h-3 w-3 text-warning" />
          <span>Impact: <span className="text-text">{issue.impact_score}</span></span>
        </div>
        <div className="flex items-center gap-1 text-xs text-dim">
          <Wrench className="h-3 w-3 text-accent" />
          <span>Effort: <span className="text-text">{issue.effort_score}</span></span>
        </div>
      </div>

      <button
        className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Hide recommendation' : 'Show recommendation'}
      </button>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-accent2 leading-relaxed">{issue.recommended}</p>
          {issue.current_value && (
            <div className="mt-2">
              <span className="text-xs text-dim">Current: </span>
              <code className="text-xs text-text bg-surface2 px-1 rounded">{issue.current_value}</code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
