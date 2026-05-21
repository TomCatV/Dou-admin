import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const distDir = path.resolve(root, 'dist')
const userIni = path.join(distDir, '.user.ini')

if (!distDir.startsWith(root + path.sep)) {
  throw new Error(`Refuse to clean unexpected path: ${distDir}`)
}

if (fs.existsSync(userIni) && process.platform === 'linux') {
  try {
    execFileSync('chattr', ['-i', userIni], { stdio: 'ignore' })
  } catch {
    // The file may not be immutable, or chattr may not exist in the environment.
  }
}

fs.rmSync(distDir, {
  recursive: true,
  force: true,
  maxRetries: 3,
  retryDelay: 100,
})
