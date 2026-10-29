import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv() {
  const path = resolve(process.cwd(), '.env')
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv()

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Falta ${name} en backend/.env`)
  return value
}

export const env = {
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || '0.0.0.0',
  appsScriptUrl: process.env.APPS_SCRIPT_URL || '',
  appsScriptSecret: process.env.APPS_SCRIPT_SECRET || '',
}
