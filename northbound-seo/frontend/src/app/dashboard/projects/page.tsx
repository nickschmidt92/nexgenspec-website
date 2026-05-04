'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProjects, useDeleteProject } from '@/lib/hooks/use-projects'
import { setCurrentProjectId, formatDate } from '@/lib/utils'
import { SeoScoreRing } from '@/components/seo-score-ring'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/lib/hooks/use-toast'
import { Plus, Trash2, ExternalLink, Globe } from 'lucide-react'
import type { Project } from '@/types'

export default function ProjectsPage() {
  const router = useRouter()
  const { data: projects, isLoading } = useProjects()
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject()
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  const handleSelect = (project: Project) => {
    setCurrentProjectId(project.id)
    router.push('/dashboard')
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteProject(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: 'Project deleted', variant: 'default' })
        setDeleteTarget(null)
      },
      onError: () => {
        toast({ title: 'Failed to delete project', variant: 'destructive' })
      },
    })
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold font-mono text-text">Projects</h1>
        <Button onClick={() => router.push('/onboarding')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Globe className="h-12 w-12 text-dim mb-4" />
          <h2 className="text-base font-semibold font-mono text-text mb-2">No projects yet</h2>
          <p className="text-sm text-dim font-mono mb-6 max-w-sm">
            Add your first website to start tracking your SEO performance.
          </p>
          <Button onClick={() => router.push('/onboarding')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Website
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-border bg-surface rounded-xl p-4 hover:border-accent/40 transition-colors cursor-pointer group relative"
              onClick={() => handleSelect(project)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-sm font-semibold font-mono text-text truncate mb-1">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-accent hover:underline truncate flex items-center gap-1"
                    >
                      {project.url.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </div>
                </div>
                <SeoScoreRing score={project.latest_audit_score} size="sm" />
              </div>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {project.industry && (
                  <Badge variant="dim">{project.industry}</Badge>
                )}
                <Badge variant="dim" className="capitalize">{project.geography}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-dim font-mono">
                  Updated {formatDate(project.updated_at)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(project)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-dim hover:text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This will permanently remove
              all audits, keywords, and action items associated with this project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
