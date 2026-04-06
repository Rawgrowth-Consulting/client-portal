'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Check if pb_auth cookie exists (simple client-side check)
    const hasCookie = document.cookie.includes('pb_auth')
    if (!hasCookie) {
      router.replace('/login')
    } else {
      setChecked(true)
    }
  }, [router])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#060B08' }}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.1)] border-t-[#0CBF6A]" />
      </div>
    )
  }

  return <>{children}</>
}
