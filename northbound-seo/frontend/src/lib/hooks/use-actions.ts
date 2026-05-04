import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { actionsApi } from '../api'
import type { ActionItem, ActionCounts } from '@/types'

export function useActions(projectId: string, params?: Record<string, string>) {
  return useQuery<ActionItem[]>({
    queryKey: ['actions', projectId, params],
    queryFn: () => actionsApi.list(projectId, params),
    enabled: !!projectId,
  })
}

export function useActionSummary(projectId: string) {
  return useQuery<ActionCounts>({
    queryKey: ['action-summary', projectId],
    queryFn: () => actionsApi.getSummary(projectId),
    enabled: !!projectId,
  })
}

export function useUpdateAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown; projectId: string }) =>
      actionsApi.update(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['actions', vars.projectId] })
      qc.invalidateQueries({ queryKey: ['action-summary', vars.projectId] })
    },
  })
}

export function useRegenerateActions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => actionsApi.regenerate(projectId),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: ['actions', projectId] })
      qc.invalidateQueries({ queryKey: ['action-summary', projectId] })
    },
  })
}
