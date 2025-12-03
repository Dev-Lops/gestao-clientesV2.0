import { useCallback, useRef, useState } from 'react'

type InitiateResponse = { uploadId: string; originalKey: string }
type SignPartResponse = { url: string }

type PartETag = { partNumber: number; ETag: string }

export function useMultipartUpload() {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const upload = useCallback(
    async (params: {
      orgId: string
      clientId: string
      file: File
      title?: string
      description?: string
      partSizeBytes?: number // default 8MB
      concurrency?: number // default 3
    }) => {
      setError(null)
      setProgress(0)
      setIsUploading(true)
      abortRef.current = new AbortController()
      const { orgId, clientId, file } = params
      const partSize = params.partSizeBytes ?? 8 * 1024 * 1024
      const concurrency = params.concurrency ?? 3
      try {
        // 1) initiate
        const initRes = await fetch('/api/uploads/multipart/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            filename: file.name,
            mimeType: file.type,
          }),
          signal: abortRef.current.signal,
        })
        if (!initRes.ok) throw new Error(await initRes.text())
        const { uploadId, originalKey } =
          (await initRes.json()) as InitiateResponse

        // 2) split into parts
        const totalParts = Math.max(1, Math.ceil(file.size / partSize))
        let uploadedBytes = 0
        const etags: PartETag[] = []

        let currentPart = 1
        async function uploadPart(partNumber: number) {
          const start = (partNumber - 1) * partSize
          const end = Math.min(file.size, start + partSize)
          const blob = file.slice(start, end)
          // sign URL
          const signRes = await fetch('/api/uploads/multipart/sign-part', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originalKey,
              uploadId,
              partNumber,
              mimeType: file.type,
            }),
            signal: abortRef.current!.signal,
          })
          if (!signRes.ok) throw new Error(await signRes.text())
          const { url } = (await signRes.json()) as SignPartResponse

          const xhr = new XMLHttpRequest()
          const done = new Promise<string>((resolve, reject) => {
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                // track incremental progress for this part
                const delta = e.loaded - (xhr as any)._lastLoaded || 0
                ;(xhr as any)._lastLoaded = e.loaded
                uploadedBytes += delta
                setProgress(Math.round((uploadedBytes / file.size) * 100))
              }
            }
            xhr.onerror = () => reject(new Error('Falha no upload da parte'))
            xhr.onabort = () => reject(new Error('Upload cancelado'))
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const etag = xhr.getResponseHeader('ETag') || ''
                resolve(etag)
              } else {
                reject(new Error(`Falha no upload da parte: ${xhr.status}`))
              }
            }
          })
          xhr.open('PUT', url)
          if (file.type) xhr.setRequestHeader('Content-Type', file.type)
          xhr.send(blob)
          const etag = await done
          etags.push({ partNumber, ETag: etag })
        }

        // pipeline with limited concurrency
        const workers: Promise<void>[] = []
        for (let i = 0; i < concurrency; i++) {
          workers.push(
            (async function run() {
              while (currentPart <= totalParts) {
                const part = currentPart++
                await uploadPart(part)
              }
            })()
          )
        }
        await Promise.all(workers)

        // 3) complete
        const completeRes = await fetch('/api/uploads/multipart/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId,
            clientId,
            originalKey,
            uploadId,
            parts: etags,
            title: params.title ?? file.name,
            description: params.description ?? null,
            mimeType: file.type,
            size: file.size,
          }),
          signal: abortRef.current.signal,
        })
        if (!completeRes.ok) throw new Error(await completeRes.text())
        return await completeRes.json()
      } catch (e: any) {
        setError(e?.message || String(e))
        throw e
      } finally {
        setIsUploading(false)
      }
    },
    []
  )

  const abort = useCallback(async () => {
    abortRef.current?.abort()
    setIsUploading(false)
  }, [])

  return { progress, isUploading, error, upload, abort }
}
