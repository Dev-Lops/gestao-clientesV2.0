import { useCallback, useRef, useState } from 'react'

type PresignResponse = {
  originalKey: string
  uploadUrl: string
  willGenerateOptimized: boolean
}

type FinalizeResponse = {
  success: boolean
  media: any
  downloadUrl: string
  optimizedUrl?: string | null
  thumbUrl?: string | null
}

export function useDirectUpload() {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const abort = useCallback(() => {
    xhrRef.current?.abort()
    setIsUploading(false)
  }, [])

  const upload = useCallback(
    async (params: {
      orgId: string
      clientId: string
      file: File
      title?: string
      description?: string
    }): Promise<FinalizeResponse> => {
      setError(null)
      setProgress(0)
      setIsUploading(true)
      try {
        // 1) Presign
        const presignRes = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: params.clientId,
            filename: params.file.name,
            mimeType: params.file.type,
            size: params.file.size,
          }),
        })
        if (!presignRes.ok) throw new Error(await presignRes.text())
        const { originalKey, uploadUrl } =
          (await presignRes.json()) as PresignResponse

        // 2) Upload direto com progresso
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhrRef.current = xhr
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              setProgress(Math.round((evt.loaded / evt.total) * 100))
            }
          }
          xhr.onerror = () => reject(new Error('Falha no upload'))
          xhr.onabort = () => reject(new Error('Upload cancelado'))
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve()
            else reject(new Error(`Falha no upload: ${xhr.status}`))
          }
          xhr.open('PUT', uploadUrl)
          xhr.setRequestHeader(
            'Content-Type',
            params.file.type || 'application/octet-stream'
          )
          xhr.send(params.file)
        })

        // 3) Finalize
        const finRes = await fetch('/api/uploads/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId: params.orgId,
            clientId: params.clientId,
            originalKey,
            mimeType: params.file.type,
            size: params.file.size,
            title: params.title ?? params.file.name,
            description: params.description ?? null,
          }),
        })
        if (!finRes.ok) throw new Error(await finRes.text())
        const payload = (await finRes.json()) as FinalizeResponse
        return payload
      } catch (e: any) {
        setError(e?.message || String(e))
        throw e
      } finally {
        setIsUploading(false)
      }
    },
    []
  )

  return { progress, isUploading, error, upload, abort }
}
