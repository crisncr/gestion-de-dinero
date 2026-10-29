export const LEGAL_VERSION = '2026.13'

export function requireLegalConsent(input: { acceptedTerms?: boolean; termsVersion?: string }) {
  if (input.acceptedTerms !== true || input.termsVersion !== LEGAL_VERSION) {
    throw new Error('Debes aceptar los Términos y la Política de Privacidad')
  }
}

export function consentPayload() {
  return {
    termsVersion: LEGAL_VERSION,
    privacyVersion: LEGAL_VERSION,
    consentAt: new Date(),
  }
}
