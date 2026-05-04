import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditsApi } from '../api'
import type { Audit, AuditIssue, IssueSummary } from '@/types'

export function useAudits(projectId: string) {
  return useQuery<Audit[]>({
    queryKey: ['audits', projectId],
    queryFn: () => auditsApi.list(projectId),
    enabled: !!projectId,
  })
}

export function useAudit(id: string) {
  return useQuery<Audit>({
    queryKey: ['audit', id],
    queryFn: () => auditsApi.get(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      const status = (data as Audit).status
      return ['queued', 'crawling', 'analyzing'].includes(status) ? 3000 : false
    },
  })
}

export function useAuditIssues(auditId: string, filters?: Record<string, string>) {
  return useQuery<AuditIssue[]>({
    queryKey: ['audit-issues', auditId, filters],
    queryFn: () => auditsApi.getIssues(auditId, filters),
    enabled: !!auditId,
  })
}

export function useAuditIssueSummary(auditId: string) {
  return useQuery<IssueSummary>({
    queryKey: ['audit-issue-summary', auditId],
    queryFn: () => auditsApi.getIssueSummary(auditId),
    enabled: !!auditId,
  })
}

export function useTriggerAudit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => auditsApi.trigger(projectId),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: ['audits', projectId] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
