'use client'

import { useEffect } from 'react'

export function ChunkReloadProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('ChunkLoadError') || event.message?.includes('Loading chunk')) {
        window.location.reload()
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  return <>{children}</>
}
