import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { competitorsApi } from '../api'
import type { Competitor, CompetitorAnalysis, CompetitorGap } from '@/types'

export function useCompetitors(projectId: string) {
  return useQuery<Competitor[]>({
    queryKey: ['competitors', projectId],
    queryFn: () => competitorsApi.list(projectId),
    enabled: !!projectId,
  })
}

export function useCompetitorAnalysis(id: string) {
  return useQuery<CompetitorAnalysis>({
    queryKey: ['competitor-analysis', id],
    queryFn: () => competitorsApi.getAnalysis(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as CompetitorAnalysis | undefined
      if (!data) return false
      return ['queued', 'processing'].includes(data.status) ? 3000 : false
    },
  })
}

export function useCompetitorGaps(analysisId: string, params?: Record<string, string>) {
  return useQuery<CompetitorGap[]>({
    queryKey: ['competitor-gaps', analysisId, params],
    queryFn: () => competitorsApi.getGaps(analysisId, params),
    enabled: !!analysisId,
  })
}

export function useAddCompetitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: unknown }) =>
      competitorsApi.add(projectId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['competitors', vars.projectId] })
    },
  })
}

export function useDeleteCompetitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      competitorsApi.delete(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['competitors', vars.projectId] })
    },
  })
}

export function useTriggerCompetitorAnalysis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => competitorsApi.triggerAnalysis(projectId),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: ['competitors', projectId] })
    },
  })
}
