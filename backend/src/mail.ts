import { env } from './env.js'

export function mailReady() {
  return Boolean(env.appsScriptUrl && env.appsScriptSecret)
}

export function maskEmail(email: string) {
  const [user, domain] = email.split('@')
  if (!user || !domain) return email
  const keep = user.slice(0, 1)
  return `${keep}${'•'.repeat(Math.max(2, Math.min(user.length - 1, 6)))}@${domain}`
}

async function postMail(payload: Record<string, string>) {
  if (!mailReady()) {
    console.warn('Falta APPS_SCRIPT_URL: no se envió el correo')
    return false
  }
  const response = await fetch(env.appsScriptUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.appsScriptSecret,
      ...payload,
    }),
  })
  const body = await response.text()
  if (!response.ok) throw new Error(body || 'Apps Script no pudo enviar el correo')
  try {
    const parsed = JSON.parse(body) as { ok?: boolean; error?: string }
    if (parsed.ok === false) throw new Error(parsed.error || 'Apps Script rechazó el envío')
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
  }
  return true
}

export async function sendVerificationEmail(input: {
  to: string
  name: string
  householdName?: string
  code: string
}) {
  await postMail({
    kind: 'verify',
    to: input.to,
    name: input.name,
    householdName: input.householdName || '',
    code: input.code,
  })
  console.log(`Código de verificación enviado a ${input.to}`)
  return true
}

export async function sendRecoveryEmail(input: { to: string; name: string; code: string }) {
  await postMail({
    kind: 'recover',
    to: input.to,
    name: input.name,
    householdName: '',
    code: input.code,
  })
  console.log(`Código de recuperación enviado a ${input.to}`)
  return true
}
