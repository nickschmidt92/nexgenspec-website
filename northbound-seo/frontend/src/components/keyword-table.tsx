'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Keyword, KeywordIntent } from '@/types'
import { formatNumber, cn } from '@/lib/utils'

const intentConfig: Record<KeywordIntent, { label: string; variant: 'info' | 'success' | 'dim' | 'warning' }> = {
  informational: { label: 'Info', variant: 'info' },
  transactional: { label: 'Trans', variant: 'success' },
  navigational: { label: 'Nav', variant: 'dim' },
  commercial: { label: 'Comm', variant: 'warning' },
}

const tierConfig: Record<string, { label: string; variant: 'info' | 'dim' | 'purple' }> = {
  primary: { label: 'Primary', variant: 'info' },
  secondary: { label: 'Secondary', variant: 'dim' },
  long_tail: { label: 'Long-tail', variant: 'purple' },
}

function DifficultyBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-dim text-xs">—</span>
  const color = value < 30 ? '#22c55e' : value < 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{value}</span>
    </div>
  )
}

type SortKey = 'keyword' | 'search_volume' | 'keyword_difficulty' | 'cpc'

interface KeywordTableProps {
  keywords: Keyword[]
}

const PAGE_SIZE = 50

export function KeywordTable({ keywords }: KeywordTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('search_volume')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  const sorted = [...keywords].sort((a, b) => {
    const av = a[sortKey] ?? (sortDir === 'desc' ? -Infinity : Infinity)
    const bv = b[sortKey] ?? (sortDir === 'desc' ? -Infinity : Infinity)
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 inline-block ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 inline-block ml-1" />
    )
  }

  const thCls = (col: SortKey) =>
    cn(
      'text-left text-xs font-mono text-dim px-3 py-2 cursor-pointer hover:text-text transition-colors select-none',
      sortKey === col && 'text-accent'
    )

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-surface2">
              <th className={thCls('keyword')} onClick={() => handleSort('keyword')}>
                Keyword <SortIcon col="keyword" />
              </th>
              <th className={thCls('search_volume')} onClick={() => handleSort('search_volume')}>
                Volume <SortIcon col="search_volume" />
              </th>
              <th className={thCls('keyword_difficulty')} onClick={() => handleSort('keyword_difficulty')}>
                Difficulty <SortIcon col="keyword_difficulty" />
              </th>
              <th className={thCls('cpc')} onClick={() => handleSort('cpc')}>
                CPC <SortIcon col="cpc" />
              </th>
              <th className="text-left text-xs font-mono text-dim px-3 py-2">Intent</th>
              <th className="text-left text-xs font-mono text-dim px-3 py-2">Tier</th>
              <th className="text-left text-xs font-mono text-dim px-3 py-2">Gap</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((kw, i) => (
              <tr
                key={kw.id}
                className={cn('border-b border-border hover:bg-surface2 transition-colors', i % 2 === 0 ? 'bg-surface' : 'bg-bg')}
              >
                <td className="px-3 py-2 text-text max-w-xs">
                  <div className="truncate">{kw.keyword}</div>
                  {kw.mapped_url && (
                    <div className="text-dim truncate text-xs">{kw.mapped_url}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-text whitespace-nowrap">{formatNumber(kw.search_volume)}</td>
                <td className="px-3 py-2">
                  <DifficultyBar value={kw.keyword_difficulty} />
                </td>
                <td className="px-3 py-2 text-text whitespace-nowrap">
                  {kw.cpc != null ? `$${kw.cpc.toFixed(2)}` : '—'}
                </td>
                <td className="px-3 py-2">
                  {kw.intent ? (
                    <Badge variant={intentConfig[kw.intent].variant}>
                      {intentConfig[kw.intent].label}
                    </Badge>
                  ) : (
                    <span className="text-dim">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {tierConfig[kw.tier] ? (
                    <Badge variant={tierConfig[kw.tier].variant}>
                      {tierConfig[kw.tier].label}
                    </Badge>
                  ) : (
                    <span className="text-dim">{kw.tier}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {kw.opportunity && (
                    <Badge variant="success">GAP</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs font-mono text-dim">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
