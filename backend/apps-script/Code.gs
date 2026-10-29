const MAIL_SECRET = 'un-secreto-largo-solo-tuyo'

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}')
    if (!data.secret || data.secret !== MAIL_SECRET) {
      return json_({ ok: false, error: 'forbidden' })
    }
    if (!data.to || !data.name || !data.code) {
      return json_({ ok: false, error: 'missing' })
    }

    const name = String(data.name)
    const household = String(data.householdName || '')
    const code = String(data.code)
    const recover = String(data.kind || '') === 'recover'

    MailApp.sendEmail({
      to: String(data.to),
      subject: recover ? 'Código para recuperar tu cuenta Casa360' : 'Tu código Casa360',
      htmlBody: recover ? recoverHtml_(name, code) : verifyHtml_(name, household, code),
      body: recover ? recoverText_(name, code) : verifyText_(name, household, code),
      name: 'Casa360',
    })

    return json_({ ok: true })
  } catch (error) {
    return json_({ ok: false, error: String(error) })
  }
}

function doGet() {
  return json_({ ok: true, service: 'hogar360-mail' })
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}

function verifyText_(name, household, code) {
  return (
    'Hola ' + name + ',\n\n' +
    'Usa este código para activar tu cuenta de Casa360:\n\n' +
    code + '\n\n' +
    (household ? 'Hogar: ' + household + '\n\n' : '') +
    'El código vence en 15 minutos. Si no pediste esta cuenta, ignora este mensaje.\n\n' +
    'Este mensaje es para activar tu cuenta. No es publicidad.\n\n' +
    'Casa360'
  )
}

function verifyHtml_(name, household, code) {
  const home = household
    ? '<p style="margin:0 0 22px;color:#5c6570;font-size:15px;line-height:22px;">Hogar: <strong style="color:#1a1f24;">' + household + '</strong></p>'
    : ''
  return '' +
    '<!doctype html><html><body style="margin:0;padding:0;background:#eef2f5;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f5;padding:32px 12px;">' +
      '<tr><td align="center">' +
        '<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dfe6ec;">' +
          '<tr><td style="background:#0f3d32;padding:22px 28px;">' +
            '<p style="margin:0;color:#7decc0;font-size:13px;letter-spacing:1px;font-weight:700;">CASA360</p>' +
            '<p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Activa tu cuenta</p>' +
          '</td></tr>' +
          '<tr><td style="padding:28px;">' +
            '<p style="margin:0 0 12px;color:#1a1f24;font-size:16px;line-height:24px;">Hola ' + name + ',</p>' +
            '<p style="margin:0 0 22px;color:#5c6570;font-size:15px;line-height:22px;">Ingresa este código en la app para confirmar tu correo y entrar a tu hogar.</p>' +
            home +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="background:#f3fbf7;border:1px solid #c6eadb;border-radius:12px;padding:18px 12px;">' +
              '<p style="margin:0 0 6px;color:#3d8f72;font-size:12px;letter-spacing:1px;font-weight:700;">CÓDIGO DE CONFIRMACIÓN</p>' +
              '<p style="margin:0;color:#0f3d32;font-size:36px;letter-spacing:8px;font-weight:700;">' + code + '</p>' +
            '</td></tr></table>' +
            '<p style="margin:22px 0 0;color:#5c6570;font-size:14px;line-height:21px;">Vence en 15 minutos. Si no creaste esta cuenta, puedes ignorar el mensaje.</p>' +
            '<p style="margin:12px 0 0;color:#5c6570;font-size:14px;line-height:21px;">Este mensaje es para activar tu cuenta. No es publicidad.</p>' +
          '</td></tr>' +
          '<tr><td style="padding:0 28px 24px;">' +
            '<p style="margin:0;color:#8a939c;font-size:12px;line-height:18px;">Este correo lo envía Casa360. No incluye tu contraseña.</p>' +
          '</td></tr>' +
        '</table>' +
      '</td></tr>' +
    '</table>' +
    '</body></html>'
}

function recoverText_(name, code) {
  return (
    'Hola ' + name + ',\n\n' +
    'Recibimos un pedido para cambiar la contraseña de Casa360.\n\n' +
    'Código: ' + code + '\n\n' +
    'Vence en 15 minutos. Si no fuiste tú, ignora este mensaje y tu clave no cambia.\n\n' +
    'Este mensaje es para tu cuenta. No es publicidad.\n\n' +
    'Casa360'
  )
}

function recoverHtml_(name, code) {
  return '' +
    '<!doctype html><html><body style="margin:0;padding:0;background:#eef2f5;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f5;padding:32px 12px;">' +
      '<tr><td align="center">' +
        '<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dfe6ec;">' +
          '<tr><td style="background:#0f3d32;padding:22px 28px;">' +
            '<p style="margin:0;color:#7decc0;font-size:13px;letter-spacing:1px;font-weight:700;">CASA360</p>' +
            '<p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Recuperar contraseña</p>' +
          '</td></tr>' +
          '<tr><td style="padding:28px;">' +
            '<p style="margin:0 0 12px;color:#1a1f24;font-size:16px;line-height:24px;">Hola ' + name + ',</p>' +
            '<p style="margin:0 0 22px;color:#5c6570;font-size:15px;line-height:22px;">Usa este código en la app. Primero lo confirmamos y recién ahí podrás crear una clave nueva.</p>' +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="background:#f3fbf7;border:1px solid #c6eadb;border-radius:12px;padding:18px 12px;">' +
              '<p style="margin:0 0 6px;color:#3d8f72;font-size:12px;letter-spacing:1px;font-weight:700;">CÓDIGO DE RECUPERACIÓN</p>' +
              '<p style="margin:0;color:#0f3d32;font-size:36px;letter-spacing:8px;font-weight:700;">' + code + '</p>' +
            '</td></tr></table>' +
            '<p style="margin:22px 0 0;color:#5c6570;font-size:14px;line-height:21px;">Vence en 15 minutos. Si no pediste este cambio, ignora el mensaje: tu contraseña no se modifica.</p>' +
            '<p style="margin:12px 0 0;color:#5c6570;font-size:14px;line-height:21px;">Este mensaje es para tu cuenta. No es publicidad.</p>' +
          '</td></tr>' +
          '<tr><td style="padding:0 28px 24px;">' +
            '<p style="margin:0;color:#8a939c;font-size:12px;line-height:18px;">Casa360 nunca te pedirá la contraseña por correo.</p>' +
          '</td></tr>' +
        '</table>' +
      '</td></tr>' +
    '</table>' +
    '</body></html>'
}
