'use client'

import { Button } from './ui/button'
import { Wifi, WifiOff, Shield } from 'lucide-react'

type Mode = 'online' | 'airgapped'

interface ModeSelectorProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="inline-flex rounded-lg bg-black/30 p-1">
      <button
        onClick={() => onModeChange('online')}
        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          mode === 'online'
            ? 'bg-purple-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Wifi className="h-4 w-4" />
        Online Signing
      </button>
      <button
        onClick={() => onModeChange('airgapped')}
        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          mode === 'airgapped'
            ? 'bg-purple-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <WifiOff className="h-4 w-4" />
        Air-Gapped
      </button>
    </div>
  )
}

interface ModeBadgeProps {
  mode: Mode
}

export function ModeBadge({ mode }: ModeBadgeProps) {
  if (mode === 'online') {
    return (
      <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
        <Wifi className="h-3 w-3" />
        Online Mode
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">
      <Shield className="h-3 w-3" />
      Air-Gapped Mode
    </div>
  )
}
