'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/')
      } else {
        setChecking(false)
      }
    })
    return unsub
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <Header />
      <main className="ml-60 pt-12 min-h-screen overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
