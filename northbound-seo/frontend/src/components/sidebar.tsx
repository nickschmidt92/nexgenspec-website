'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  Users,
  FileText,
  Zap,
  LogOut,
  TrendingUp,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview', exact: true },
  { href: '/dashboard/projects', icon: FolderOpen, label: 'Projects', exact: false },
  { href: '/dashboard/keywords', icon: Search, label: 'Keywords', exact: false },
  { href: '/dashboard/competitors', icon: Users, label: 'Competitors', exact: false },
  { href: '/dashboard/content', icon: FileText, label: 'Content', exact: false },
  { href: '/dashboard/actions', icon: Zap, label: 'Actions', exact: false },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<FirebaseUser | null>(null)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser)
    return unsub
  }, [])

  const handleSignOut = async () => {
    await signOut(auth)
    router.push('/')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <TrendingUp className="h-5 w-5 text-accent shrink-0" />
        <span className="font-mono text-sm font-bold text-accent tracking-tight">
          Northbound SEO
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href) && href !== '/dashboard'
            || (exact && pathname === href)
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-mono transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-dim hover:text-text hover:bg-surface2'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        {user && (
          <div className="mb-2 px-2">
            <p className="text-xs font-mono text-dim truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-mono text-dim hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
