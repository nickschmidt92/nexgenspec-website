'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus } from 'lucide-react'
import { useProjects } from '@/lib/hooks/use-projects'
import { getCurrentProjectId, setCurrentProjectId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User as FirebaseUser } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export function Header() {
  const router = useRouter()
  const { data: projects } = useProjects()
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [user, setUser] = useState<FirebaseUser | null>(null)

  useEffect(() => {
    setCurrentId(getCurrentProjectId())
    const unsub = auth.onAuthStateChanged(setUser)
    return unsub
  }, [])

  // Auto-select first project if none stored
  useEffect(() => {
    if (!currentId && projects && projects.length > 0) {
      setCurrentProjectId(projects[0].id)
      setCurrentId(projects[0].id)
    }
  }, [projects, currentId])

  const handleProjectChange = (id: string) => {
    setCurrentProjectId(id)
    setCurrentId(id)
    // Navigate to dashboard to refresh overview
    router.push('/dashboard')
  }

  const currentProject = projects?.find((p) => p.id === currentId)

  return (
    <header className="fixed left-60 top-0 right-0 h-12 bg-surface border-b border-border flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-3">
        {projects && projects.length > 0 ? (
          <Select value={currentId ?? ''} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-52 h-7 text-xs border-border">
              <SelectValue placeholder="Select a project">
                {currentProject ? (
                  <span className="truncate">{currentProject.name}</span>
                ) : (
                  <span className="text-dim">Select a project</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/onboarding')}
            className="gap-1.5 h-7 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-mono font-bold">
              {(user.email ?? 'U')[0].toUpperCase()}
            </div>
            <span className="text-xs font-mono text-dim hidden sm:block truncate max-w-[160px]">
              {user.email}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
