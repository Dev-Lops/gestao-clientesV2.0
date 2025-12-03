"use client"
import { useDirectUpload } from '@/hooks/useDirectUpload'
import { useState } from 'react'

type Props = {
  orgId: string
  clientId: string
  onDone?: (result: {
    media: any
    downloadUrl: string
    optimizedUrl?: string | null
    thumbUrl?: string | null
  }) => void
}

export function DirectUploader({ orgId, clientId, onDone }: Props) {
  const { upload, progress, isUploading, error, abort } = useDirectUpload()
  const [file, setFile] = useState<File | null>(null)
  const [retryTick, setRetryTick] = useState(0)

  const onSelect: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
  }

  const onStart = async () => {
    if (!file) return
    try {
      const res = await upload({ orgId, clientId, file })
      onDone?.(res)
      setFile(null)
    } catch (e) {
      // erro fica no hook
    }
  }

  const onRetry = async () => {
    setRetryTick((x) => x + 1)
    await onStart()
  }

  return (
    <div className="space-y-2 p-3 border rounded-md">
      <input type="file" aria-label="Selecionar arquivo" onChange={onSelect} disabled={isUploading} />
      {file && (
        <div className="text-sm text-slate-600">{file.name} ({Math.round(file.size / 1024 / 1024)} MB)</div>
      )}
      {isUploading && (
        <div className="w-full bg-slate-200 h-2 rounded">
          <div className="bg-blue-500 h-2 rounded" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={onStart}
          disabled={!file || isUploading}
        >
          Enviar
        </button>
        {isUploading && (
          <button className="px-3 py-1 rounded bg-slate-600 text-white" onClick={abort}>Cancelar</button>
        )}
        {error && !isUploading && (
          <button className="px-3 py-1 rounded bg-amber-600 text-white" onClick={onRetry} key={retryTick}>Tentar novamente</button>
        )}
      </div>
    </div>
  )
}

export default DirectUploader
