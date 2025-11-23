#!/usr/bin/env tsx
/**
 * Script de limpeza/relatório de mídias órfãs.
 *
 * Mídia órfã definida como:
 *  - Registro em tabela `media` cujo cliente não existe mais
 *  - Arquivo ausente no storage (local ou S3/R2)
 *
 * Modo padrão é DRY-RUN (não deleta). Use --apply para efetivar remoções.
 * Use --json para saída estruturada.
 */
import { prisma } from '@/lib/prisma'
import { getMaxUploadSizeMB } from '@/lib/upload-config'
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import fs from 'fs/promises'
import path from 'path'

interface OrphanRecord {
  id: string
  fileKey: string
  reason: string
  url: string | null
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const jsonOutput = args.includes('--json')
  const verbose = args.includes('--verbose')

  const USE_S3 = process.env.USE_S3 === 'true'
  const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './uploads'

  let s3: S3Client | null = null
  const bucket = process.env.AWS_S3_BUCKET || process.env.STORAGE_BUCKET || ''
  if (USE_S3) {
    const accessKeyId =
      process.env.AWS_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY_ID || ''
    const secretAccessKey =
      process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.STORAGE_SECRET_ACCESS_KEY ||
      ''
    const endpoint = process.env.AWS_ENDPOINT_URL
    const regionEnv = process.env.AWS_REGION || 'us-east-1'
    if (!bucket || !accessKeyId || !secretAccessKey) {
      console.error(
        '[cleanup] Credenciais/bucket ausentes para S3, abortando verificação remota.'
      )
    } else {
      s3 = new S3Client({
        region: endpoint ? 'auto' : regionEnv,
        credentials: { accessKeyId, secretAccessKey },
        endpoint,
        forcePathStyle: !!endpoint,
      })
    }
  }

  const media = await prisma.media.findMany({
    select: { id: true, clientId: true, fileKey: true, url: true },
  })
  const clientIds = new Set(media.map((m) => m.clientId))
  const existingClients = await prisma.client.findMany({
    where: { id: { in: Array.from(clientIds) } },
    select: { id: true },
  })
  const validClients = new Set(existingClients.map((c) => c.id))

  const orphans: OrphanRecord[] = []

  for (const m of media) {
    if (!validClients.has(m.clientId)) {
      orphans.push({
        id: m.id,
        fileKey: m.fileKey,
        url: m.url,
        reason: 'CLIENT_MISSING',
      })
      continue
    }

    // Verifica arquivo
    if (USE_S3 && s3) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: m.fileKey }))
      } catch {
        orphans.push({
          id: m.id,
          fileKey: m.fileKey,
          url: m.url,
          reason: 'OBJECT_MISSING',
        })
      }
    } else {
      const fullPath = path.join(LOCAL_UPLOAD_DIR, m.fileKey)
      try {
        await fs.access(fullPath)
      } catch {
        orphans.push({
          id: m.id,
          fileKey: m.fileKey,
          url: m.url,
          reason: 'FILE_MISSING',
        })
      }
    }
  }

  if (apply && orphans.length > 0) {
    console.log(`[cleanup] Removendo ${orphans.length} registros órfãos...`)
    for (const o of orphans) {
      await prisma.media
        .delete({ where: { id: o.id } })
        .catch((e: unknown) =>
          console.error('Falha ao remover registro', o.id, e)
        )
      if (USE_S3 && s3) {
        if (o.reason === 'OBJECT_MISSING') continue // já não existe
        try {
          await s3.send(
            new DeleteObjectCommand({ Bucket: bucket, Key: o.fileKey })
          )
        } catch {}
      } else {
        if (o.reason === 'FILE_MISSING') continue
        try {
          await fs.unlink(path.join(LOCAL_UPLOAD_DIR, o.fileKey))
        } catch {}
      }
    }
  }

  if (jsonOutput) {
    console.log(
      JSON.stringify({ count: orphans.length, apply, orphans }, null, 2)
    )
  } else {
    console.log(`Total registros: ${media.length}`)
    console.log(`Órfãos encontrados: ${orphans.length}`)
    if (orphans.length) {
      console.table(orphans.slice(0, verbose ? orphans.length : 10))
      if (!verbose && orphans.length > 10) {
        console.log(
          `(+${orphans.length - 10} adicionais, use --verbose para todos)`
        )
      }
      console.log(
        apply
          ? 'Remoção aplicada.'
          : 'DRY-RUN: nada removido. Use --apply para deletar.'
      )
    }
  }

  // Info extra
  console.log(`Limite de upload configurado: ${getMaxUploadSizeMB()}MB`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Erro no script de limpeza:', err)
  process.exit(1)
})
