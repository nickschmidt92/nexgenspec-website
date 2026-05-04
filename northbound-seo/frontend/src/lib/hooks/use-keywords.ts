import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keywordsApi } from '../api'
import type { KeywordResearch, Keyword, KeywordCluster } from '@/types'

export function useKeywordResearches(projectId: string) {
  return useQuery<KeywordResearch[]>({
    queryKey: ['keyword-research', projectId],
    queryFn: () => keywordsApi.list(projectId),
    enabled: !!projectId,
  })
}

export function useKeywordResearch(id: string) {
  return useQuery<KeywordResearch>({
    queryKey: ['keyword-research-item', id],
    queryFn: () => keywordsApi.get(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as KeywordResearch | undefined
      if (!data) return false
      return ['queued', 'processing'].includes(data.status) ? 3000 : false
    },
  })
}

export function useKeywords(researchId: string, params?: Record<string, string>) {
  return useQuery<Keyword[]>({
    queryKey: ['keywords', researchId, params],
    queryFn: () => keywordsApi.getKeywords(researchId, params),
    enabled: !!researchId,
  })
}

export function useKeywordClusters(researchId: string) {
  return useQuery<KeywordCluster[]>({
    queryKey: ['keyword-clusters', researchId],
    queryFn: () => keywordsApi.getClusters(researchId),
    enabled: !!researchId,
  })
}

export function useTriggerKeywordResearch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data?: unknown }) =>
      keywordsApi.trigger(projectId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['keyword-research', vars.projectId] })
    },
  })
}
