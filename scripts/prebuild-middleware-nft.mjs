#!/usr/bin/env node
/**
 * Pre-Build: Create empty middleware.js.nft.json placeholder
 *
 * Creates a minimal placeholder file BEFORE Next.js build starts.
 * This prevents ENOENT errors during the build process on Netlify.
 * The real file with proper content is created post-build by the workaround script.
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

const serverDir = resolve(projectRoot, '.next/server')
const middlewareNftPath = resolve(serverDir, 'middleware.js.nft.json')

// Ensure .next/server directory exists
if (!existsSync(serverDir)) {
  mkdirSync(serverDir, { recursive: true })
}

// Create minimal placeholder
const placeholderContent = {
  version: 1,
  files: [],
}

writeFileSync(
  middlewareNftPath,
  JSON.stringify(placeholderContent, null, 2),
  'utf-8'
)

console.log('[prebuild] Created placeholder middleware.js.nft.json')
