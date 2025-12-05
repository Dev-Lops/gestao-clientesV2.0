import { generateFileKey, uploadFile } from '@/lib/storage'
import fs from 'fs'
import path from 'path'

async function main() {
  const clientId = process.argv[2] || 'cmi3syz6o0001cmok4cu1byba'
  const samplePath = path.join(process.cwd(), 'tests', 'sample.mov')
  if (!fs.existsSync(samplePath)) {
    fs.writeFileSync(samplePath, Buffer.from('This is a small test file'))
  }
  const buffer = fs.readFileSync(samplePath)
  const fileKey = generateFileKey(clientId, 'sample.mov')
  console.log('Uploading to fileKey=', fileKey)
  const res = await uploadFile(fileKey, buffer, 'video/quicktime')
  console.log('Result:', res)
}

main().catch((e) => { console.error(e); process.exit(1) })
