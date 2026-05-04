import { Progress } from '@/components/ui/progress'
import { scoreColor } from '@/lib/utils'
import type { ScoreBreakdown } from '@/types'

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown
}

const labels: Record<keyof ScoreBreakdown, string> = {
  technical: 'Technical',
  on_page: 'On-Page',
  content: 'Content',
  performance: 'Performance',
  mobile: 'Mobile',
}

export function ScoreBreakdownBars({ breakdown }: ScoreBreakdownProps) {
  const entries = Object.entries(labels) as [keyof ScoreBreakdown, string][]

  return (
    <div className="space-y-2.5">
      {entries.map(([key, label]) => {
        const score = breakdown[key]
        const color = scoreColor(score)
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-dim">{label}</span>
              <span className="font-medium" style={{ color }}>
                {score}
              </span>
            </div>
            <Progress value={score} color={color} className="h-1.5" />
          </div>
        )
      })}
    </div>
  )
}
