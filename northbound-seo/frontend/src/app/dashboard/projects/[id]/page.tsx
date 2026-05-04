'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useProject, useUpdateProject } from '@/lib/hooks/use-projects'
import { useAudits } from '@/lib/hooks/use-audits'
import { useCompetitors, useAddCompetitor, useDeleteCompetitor } from '@/lib/hooks/use-competitors'
import { AuditTrigger } from '@/components/audit-trigger'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/hooks/use-toast'
import { formatDate, formatDateTime, scoreColor } from '@/lib/utils'
import { Edit2, Check, X, Plus, Trash2, ArrowRight, ExternalLink } from 'lucide-react'
import type { AuditStatus } from '@/types'

const statusConfig: Record<AuditStatus, { label: string; variant: 'success' | 'info' | 'warning' | 'dim' | 'danger' }> = {
  queued: { label: 'Queued', variant: 'dim' },
  crawling: { label: 'Crawling', variant: 'info' },
  analyzing: { label: 'Analyzing', variant: 'warning' },
  completed: { label: 'Complete', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
}

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: project, isLoading } = useProject(id)
  const { data: audits } = useAudits(id)
  const { data: competitors } = useCompetitors(id)
  const { mutate: updateProject } = useUpdateProject()
  const { mutate: addCompetitor } = useAddCompetitor()
  const { mutate: deleteCompetitor } = useDeleteCompetitor()

  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({ name: '', url: '', industry: '', geography: '', revenue_model: '' })
  const [newCompetitor, setNewCompetitor] = useState('')
  const [addingComp, setAddingComp] = useState(false)

  const startEdit = () => {
    if (!project) return
    setEditData({
      name: project.name,
      url: project.url,
      industry: project.industry ?? '',
      geography: project.geography,
      revenue_model: project.revenue_model ?? '',
    })
    setEditing(true)
  }

  const saveEdit = () => {
    updateProject(
      { id, data: editData },
      {
        onSuccess: () => {
          toast({ title: 'Project updated', variant: 'default' })
          setEditing(false)
        },
        onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
      }
    )
  }

  const handleAddCompetitor = () => {
    if (!newCompetitor.trim()) return
    const url = newCompetitor.startsWith('http') ? newCompetitor : `https://${newCompetitor}`
    addCompetitor(
      { projectId: id, data: { url } },
      {
        onSuccess: () => {
          toast({ title: 'Competitor added', variant: 'default' })
          setNewCompetitor('')
          setAddingComp(false)
        },
        onError: () => toast({ title: 'Failed to add competitor', variant: 'destructive' }),
      }
    )
  }

  const handleDeleteCompetitor = (compId: string) => {
    deleteCompetitor(
      { id: compId, projectId: id },
      {
        onSuccess: () => toast({ title: 'Competitor removed', variant: 'default' }),
        onError: () => toast({ title: 'Failed to remove', variant: 'destructive' }),
      }
    )
  }

  if (isLoading || !project) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono text-text">{project.name}</h1>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            {project.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <AuditTrigger projectId={id} />
      </div>

      {/* Project info card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Project Settings</CardTitle>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="success" size="sm" onClick={saveEdit} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Business Name</Label>
                <Input value={editData.name} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Website URL</Label>
                <Input value={editData.url} onChange={(e) => setEditData((d) => ({ ...d, url: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Select value={editData.industry} onValueChange={(v) => setEditData((d) => ({ ...d, industry: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {['SaaS','Agency','E-commerce','Professional Services','Local Business','Other'].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Geography</Label>
                <Select value={editData.geography} onValueChange={(v) => setEditData((d) => ({ ...d, geography: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Revenue Model</Label>
                <Select value={editData.revenue_model} onValueChange={(v) => setEditData((d) => ({ ...d, revenue_model: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {['SaaS','Service','E-commerce','Lead Gen'].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <p className="text-dim mb-1">Industry</p>
                <p className="text-text">{project.industry ?? '—'}</p>
              </div>
              <div>
                <p className="text-dim mb-1">Geography</p>
                <p className="text-text capitalize">{project.geography}</p>
              </div>
              <div>
                <p className="text-dim mb-1">Revenue Model</p>
                <p className="text-text">{project.revenue_model ?? '—'}</p>
              </div>
              <div>
                <p className="text-dim mb-1">Created</p>
                <p className="text-text">{formatDate(project.created_at)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competitors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Competitors</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddingComp(!addingComp)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {addingComp && (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="https://competitor.com"
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAddCompetitor}>Add</Button>
              <Button variant="ghost" size="sm" onClick={() => setAddingComp(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!competitors || competitors.length === 0 ? (
            <p className="text-xs text-dim text-center py-4">No competitors added yet.</p>
          ) : (
            <div className="space-y-2">
              {competitors.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-2 bg-surface2 rounded-md border border-border"
                >
                  <div>
                    <p className="text-xs font-mono text-text">{comp.name ?? comp.url}</p>
                    <p className="text-xs text-dim">{comp.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {comp.is_auto_detected && (
                      <Badge variant="dim" className="text-xs">Auto-detected</Badge>
                    )}
                    <button
                      onClick={() => handleDeleteCompetitor(comp.id)}
                      className="p-1 rounded text-dim hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit history */}
      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
        </CardHeader>
        <CardContent>
          {!audits || audits.length === 0 ? (
            <p className="text-xs text-dim text-center py-4">No audits yet. Run your first audit above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-dim">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Score</th>
                    <th className="text-left py-2 px-3">Pages</th>
                    <th className="text-left py-2 px-3">Duration</th>
                    <th className="text-left py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => {
                    const duration =
                      audit.started_at && audit.completed_at
                        ? Math.round(
                            (new Date(audit.completed_at).getTime() -
                              new Date(audit.started_at).getTime()) /
                              1000
                          )
                        : null
                    return (
                      <tr key={audit.id} className="border-b border-border hover:bg-surface2 transition-colors">
                        <td className="py-2 px-3 text-dim">{formatDate(audit.created_at)}</td>
                        <td className="py-2 px-3">
                          <Badge variant={statusConfig[audit.status].variant}>
                            {statusConfig[audit.status].label}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 font-semibold" style={{ color: scoreColor(audit.score) }}>
                          {audit.score ?? '—'}
                        </td>
                        <td className="py-2 px-3 text-dim">{audit.pages_crawled}</td>
                        <td className="py-2 px-3 text-dim">
                          {duration != null ? `${duration}s` : '—'}
                        </td>
                        <td className="py-2 px-3">
                          {audit.status === 'completed' && (
                            <Link href={`/dashboard/audits/${audit.id}`}>
                              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                                View <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
