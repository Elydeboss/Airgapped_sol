'use client'

import { useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Upload, FileText } from 'lucide-react'

interface FileImportProps {
  onImport: (data: string) => void
}

export function FileImport({ onImport }: FileImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      onImport(text)
    } catch (error) {
      console.error('Failed to read file:', error)
      alert('Failed to read file. Please try again.')
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    try {
      const text = await file.text()
      onImport(text)
    } catch (error) {
      console.error('Failed to read file:', error)
      alert('Failed to read file. Please try again.')
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.json,.solana"
        onChange={handleFileChange}
        className="hidden"
      />

      <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5 text-purple-400" />
            Import Signed Transaction
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload a file containing the signed transaction data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-500/30 bg-purple-500/5 py-12 transition-colors hover:border-purple-500/50 hover:bg-purple-500/10"
          >
            <Upload className="mb-4 h-12 w-12 text-purple-400" />
            <p className="mb-2 text-sm font-medium text-white">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-400">.txt, .json, or .solana files</p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
