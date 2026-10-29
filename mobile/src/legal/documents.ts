import { apiUrl } from '../api/client'

export const LEGAL_VERSION = '2026.13'
export const LEGAL_UPDATED = '28 de octubre de 2026'

export function legalUrl(kind: 'terms' | 'privacy') {
  const hosted = (process.env.EXPO_PUBLIC_LEGAL_URL || '').replace(/\/$/, '')
  const base = hosted || apiUrl()
  return kind === 'terms' ? `${base}/legal/terminos.html` : `${base}/legal/privacidad.html`
}

export type LegalDoc = {
  id: 'terminos' | 'privacidad'
  title: string
  kicker: string
  sections: { heading: string; body: string }[]
}

export const termsDoc: LegalDoc = {
  id: 'terminos',
  title: 'Términos y Condiciones',
  kicker: `Versión ${LEGAL_VERSION} · Vigente desde ${LEGAL_UPDATED}`,
  sections: [
    {
      heading: '1. Qué es Casa360',
      body: 'Casa360 es una aplicación para administrar el hogar: finanzas compartidas, compras, familia, mascotas, tareas y avisos. Al crear una cuenta o ingresar, aceptas estos Términos.',
    },
    {
      heading: '2. Quién puede usarla',
      body: 'Debes tener 18 años o más. Al crear la cuenta indicas tu fecha de nacimiento. Si tienes menos de 18 años, la cuenta no se abre y no guardamos esa fecha. No pedimos permiso de un padre para dejar entrar a un menor. Si una cuenta ya creada declara ser de un menor de 18 años, se elimina. Casa360 no está dirigida a menores de 13 años. Si invitas a otras personas a tu hogar, eres responsable de que conozcan que sus datos quedarán en ese espacio compartido.',
    },
    {
      heading: '3. Tu cuenta',
      body: 'El correo y la contraseña son personales. Debes activar la cuenta con el código enviado a tu correo. Eres responsable de lo que se registre con tu sesión. Puedes cerrar sesión o eliminar tu cuenta en Ajustes.',
    },
    {
      heading: '4. El hogar compartido',
      body: 'Los integrantes del mismo hogar pueden ver información común (gastos, lista de compras, mascotas y avisos). El titular administra invitaciones y, si elimina su cuenta siendo el único titular, se elimina el hogar.',
    },
    {
      heading: '5. Uso permitido',
      body: 'La app es para uso familiar o doméstico. No está permitida la suplantación, el acceso no autorizado a otro hogar ni el uso para fines ilícitos.',
    },
    {
      heading: '6. Disponibilidad',
      body: 'Casa360 se ofrece “tal como está”. Puede haber mantenciones, fallas de red o del servidor. No se garantiza disponibilidad continua ni la ausencia total de errores.',
    },
    {
      heading: '7. Responsabilidad',
      body: 'Tú decides los montos, fechas y datos que ingresas. Casa360 no es una entidad financiera ni reemplaza asesoría contable, legal o veterinaria. Hoy no hay cobros ni renovaciones automáticas.',
    },
    {
      heading: '8. Cambios',
      body: 'Si actualizamos estos Términos, te pediremos aceptarlos de nuevo para seguir entrando. La versión vigente aparece al inicio de este documento.',
    },
    {
      heading: '9. Ley aplicable',
      body: 'Estos Términos se rigen por las leyes de la República de Chile, incluida la Ley N° 21.719 sobre protección de datos personales. Si usas Casa360 desde Estados Unidos u otro país, puedes acceder a tus datos, corregirlos y eliminar la cuenta desde Ajustes. No vendemos datos personales.',
    },
  ],
}

export const privacyDoc: LegalDoc = {
  id: 'privacidad',
  title: 'Política de Privacidad',
  kicker: `Ley N° 21.719 · Versión ${LEGAL_VERSION} · ${LEGAL_UPDATED}`,
  sections: [
    {
      heading: '1. Responsable del tratamiento',
      body: 'El responsable del tratamiento de tus datos es Casa360, a través de la cuenta que creas en la aplicación. Puedes ejercer tus derechos desde Ajustes o escribiendo al correo con el que te registraste.',
    },
    {
      heading: '2. Qué datos tratamos',
      body: 'Datos de cuenta: nombre, correo, fecha de nacimiento y contraseña cifrada. La fecha de nacimiento se guarda solo si tienes 18 años o más. Datos del hogar: nombre del hogar, moneda, integrantes e invitaciones. Datos de uso: ingresos, gastos, compras, tareas, avisos, mascotas y cuidados. Datos técnicos: sesión e identificadores necesarios para que la app funcione.',
    },
    {
      heading: '3. Para qué los usamos',
      body: 'Para crear y activar tu cuenta, comprobar que tienes 18 años o más, prestarte el servicio, compartir información con quienes invites a tu hogar, enviarte el código de confirmación o de recuperación que pediste, mantener la seguridad y cumplir obligaciones legales. Esos correos son de tu cuenta: no son publicidad.',
    },
    {
      heading: '4. Base de legitimación',
      body: 'Tratamos tus datos con tu consentimiento, que otorgas al marcar “Acepto” y que queda registrado con fecha y versión. También los tratamos para ejecutar el contrato de uso de la app y para cumplir la ley.',
    },
    {
      heading: '5. Dónde se guardan',
      body: 'Los datos se almacenan en un servidor PostgreSQL gestionado (Aiven). El correo de activación se envía mediante Google Apps Script desde la cuenta configurada para Casa360. La app también puede guardar una copia local en tu teléfono para funcionar sin conexión.',
    },
    {
      heading: '6. Con quién se comparten',
      body: 'No vendemos tus datos ni los compartimos para publicidad. No grabamos tu pantalla ni lo que escribes. Solo se comparten con integrantes de tu hogar y con proveedores estrictamente necesarios para hospedar la base de datos y enviar el correo de la cuenta. No usamos tus finanzas para publicidad.',
    },
    {
      heading: '7. Cuánto tiempo se conservan',
      body: 'Mientras tu cuenta esté activa. Si eliminas la cuenta, borramos tu registro y tus movimientos. Si eres el único titular, también se elimina el hogar. Pueden conservarse respaldos técnicos por un tiempo limitado.',
    },
    {
      heading: '8. Tus derechos',
      body: 'Puedes acceder, rectificar, actualizar y eliminar tus datos; oponerte o limitar ciertos tratamientos; y retirar el consentimiento. En Ajustes puedes editar tu perfil, cambiar la contraseña y eliminar la cuenta. Si estás en Estados Unidos, esos mismos caminos sirven para saber qué datos tenemos, corregirlos y borrarlos. También puedes reclamar ante la Agencia de Protección de Datos Personales cuando la Ley N° 21.719 se encuentre vigente.',
    },
    {
      heading: '9. Seguridad',
      body: 'La contraseña se almacena cifrada. El acceso a la API usa una sesión protegida. Ninguna medida es infalible: te pedimos usar una clave exclusiva y no compartir el código de activación.',
    },
    {
      heading: '10. Menores',
      body: 'Pedimos la fecha de nacimiento antes de abrir la cuenta. Si la persona tiene menos de 18 años, no se crea la cuenta y no guardamos esa fecha. No pedimos permiso de un padre para dejar entrar a un menor. Si una cuenta ya creada declara ser de un menor de 18 años, se elimina. Casa360 no está dirigida a menores de 13 años.',
    },
  ],
}

export const legalDocs = [termsDoc, privacyDoc] as const
