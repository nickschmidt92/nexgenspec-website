import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentApi } from '../api'
import type { ContentPlan, ContentItem } from '@/types'

export function useContentPlans(projectId: string) {
  return useQuery<ContentPlan[]>({
    queryKey: ['content-plans', projectId],
    queryFn: () => contentApi.list(projectId),
    enabled: !!projectId,
  })
}

export function useContentPlan(id: string) {
  return useQuery<ContentPlan>({
    queryKey: ['content-plan', id],
    queryFn: () => contentApi.get(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as ContentPlan | undefined
      if (!data) return false
      return ['queued', 'processing'].includes(data.status) ? 3000 : false
    },
  })
}

export function useContentItems(planId: string, params?: Record<string, string>) {
  return useQuery<ContentItem[]>({
    queryKey: ['content-items', planId, params],
    queryFn: () => contentApi.getItems(planId, params),
    enabled: !!planId,
  })
}

export function useTriggerContentPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => contentApi.trigger(projectId),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: ['content-plans', projectId] })
    },
  })
}

export function useUpdateContentItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown; planId: string }) =>
      contentApi.updateItem(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['content-items', vars.planId] })
    },
  })
}
