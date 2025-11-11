#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public'
}

const isWindows = process.platform === 'win32'
const prismaBin = join(
  process.cwd(),
  'node_modules',
  '.bin',
  `prisma${isWindows ? '.cmd' : ''}`,
)

if (!existsSync(prismaBin)) {
  console.error('Could not find local Prisma CLI at', prismaBin)
  process.exit(1)
}

const child = spawn(prismaBin, ['generate'], {
  stdio: 'inherit',
  env: process.env,
  shell: isWindows,
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
