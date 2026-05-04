'use client'

import { useState } from 'react'
import { useAuditIssues } from '@/lib/hooks/use-audits'
import { IssueCard } from './issue-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { IssueSeverity, IssueCategory } from '@/types'

const SEVERITIES: { label: string; value: IssueSeverity | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
]

const CATEGORIES: { label: string; value: IssueCategory | 'all' }[] = [
  { label: 'All Categories', value: 'all' },
  { label: 'Meta Tags', value: 'meta_tags' },
  { label: 'Headings', value: 'headings' },
  { label: 'Content', value: 'content' },
  { label: 'Images', value: 'images' },
  { label: 'Links', value: 'links' },
  { label: 'Schema', value: 'schema' },
  { label: 'Performance', value: 'performance' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Security', value: 'security' },
  { label: 'Crawlability', value: 'crawlability' },
  { label: 'Indexability', value: 'indexability' },
]

interface IssueListProps {
  auditId: string
  initialSeverity?: IssueSeverity | 'all'
}

export function IssueList({ auditId, initialSeverity = 'all' }: IssueListProps) {
  const [severity, setSeverity] = useState<IssueSeverity | 'all'>(initialSeverity)
  const [category, setCategory] = useState<IssueCategory | 'all'>('all')

  const filters: Record<string, string> = {}
  if (severity !== 'all') filters.severity = severity
  if (category !== 'all') filters.category = category

  const { data: issues, isLoading } = useAuditIssues(auditId, filters)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1">
          {SEVERITIES.map((s) => (
            <Button
              key={s.value}
              variant={severity === s.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSeverity(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory | 'all')}>
          <SelectTrigger className="w-44 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-dim ml-auto">{issues?.length ?? 0} issues</span>
      </div>

      {!issues || issues.length === 0 ? (
        <div className="text-center py-12 text-dim text-sm">
          No issues found for the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}
