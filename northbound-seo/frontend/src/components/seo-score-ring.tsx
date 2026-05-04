'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { scoreColor } from '@/lib/utils'

interface SeoScoreRingProps {
  score: number | null | undefined
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const sizeMap = {
  sm: { container: 80, fontSize: '1.25rem', subFontSize: '0.6rem' },
  md: { container: 140, fontSize: '1.75rem', subFontSize: '0.7rem' },
  lg: { container: 200, fontSize: '2.5rem', subFontSize: '0.85rem' },
}

export function SeoScoreRing({ score, size = 'md', showLabel = true }: SeoScoreRingProps) {
  const { container, fontSize, subFontSize } = sizeMap[size]
  const color = scoreColor(score)
  const displayScore = score ?? 0

  const data = [
    { value: displayScore, fill: color },
    { value: 100 - displayScore, fill: '#2a2a2a' },
  ]

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: container, height: container }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="65%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          data={data}
          barSize={size === 'sm' ? 8 : size === 'md' ? 10 : 14}
        >
          <RadialBar dataKey="value" cornerRadius={4} background={false} />
        </RadialBarChart>
      </ResponsiveContainer>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-bold leading-none"
            style={{ fontSize, color: score == null ? '#888' : color }}
          >
            {score == null ? '—' : displayScore}
          </span>
          <span className="font-mono text-dim leading-none mt-0.5" style={{ fontSize: subFontSize }}>
            / 100
          </span>
        </div>
      )}
    </div>
  )
}
