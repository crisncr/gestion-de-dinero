# Notas de seguridad — Casa360

Revisión con un agente, leyendo el código. No se probó la app en internet ni se tocaron datos reales.

## Bien cerrado

- Gastos, compras, mascotas, tareas y avisos exigen sesión y se limitan al hogar activo.
- La foto de una mascota solo se entrega si perteneces a ese hogar.
- Cambiar de hogar exige ser integrante.
- La contraseña se guarda cifrada.
- El código del correo caduca a los 15 minutos, se anula al quinto fallo y cerrar sesión invalida el acceso anterior.
- Borrar la cuenta pasa el hogar a otra persona si la hay. Si estás solo, borra ese hogar.
- Las contraseñas y la dirección de la base están fuera de Git (`.env`).

## Anotar para cuando se publique

1. El tráfico va sin HTTPS. En el Wi-Fi de casa alcanza. En internet hay que cifrarlo.
2. El bloqueo de intentos de login vive en la memoria. Si el servidor se reinicia, el contador vuelve a cero.
3. El secreto del correo tiene un valor por defecto en `backend/src/env.ts`. Hay que dejarlo solo en el archivo privado del servidor.
4. Unirse con el código de invitación no tiene límite de intentos. El código tiene 6 caracteres. En internet alguien podría probar códigos hasta acertar.
5. Crear la cuenta ya pide 8 caracteres, igual que al cambiarla.

## Anotar también, segunda pasada

6. Crear cuentas no tiene límite de intentos. El reenvío del código sí tiene límite por correo, pero no por dirección de red. Importa al publicar.
7. Borrar la cuenta no pide de nuevo la contraseña. Los gastos a nombre de esa persona se van con la cuenta. Se deja así a propósito.
8. Si alguien ya estaba invitado por correo y entra con el código, se une a ese integrante. Ya no se crea otro.
9. El token de sesión en el celular está en el almacenamiento normal de la app, no en la bóveda del teléfono. Importa si el teléfono está intervenido.
10. Cualquier integrante puede editar o quitar tareas y avisos de los demás. En un hogar compartido puede ser lo esperado. Si solo el titular debe poder, hay que cerrarlo.

## Anotar también, tercera pasada

11. El código de activación ya no va en el asunto. Hay que volver a pegar `backend/apps-script/Code.gs` en Apps Script y publicarlo de nuevo para que el correo nuevo salga.
12. Ese mismo archivo trae el secreto del correo escrito. Quien tenga el repo y la dirección del script puede mandar correos como la app.
13. Pedir otro código ya no dice si ese correo tiene cuenta.

## Anotar también, cuarta pasada

14. Si la app corre sin servidor, la contraseña del teléfono se guarda como SHA-256 sin sal, junto con el hogar, en el almacenamiento normal (`mobile/src/lib/crypto.ts`, `mobile/src/store/persist.ts`). Quien lea ese archivo puede probar contraseñas rápido. Con la API encendida, ese archivo se borra al arrancar. Hoy Casa360 usa la API, así que esto no está activo.
15. El código de invitación solo se envía al titular y a quien administra. Un integrante normal ya no lo recibe.

## Descartado de la segunda pasada

- El esquema `casa360://` abre la app. Eso no entrega datos por sí solo.
- CORS abierto no roba la sesión del celular, porque el token no va en una cookie del navegador.
- Importar datos solo funciona dentro de tu hogar y solo si está vacío. No mezcla hogares.

## Aún no hace falta

No instalar la auditoría completa de Cloudflare. No cambiar el login a Supabase ni a Auth0.
