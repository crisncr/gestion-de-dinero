# Casa360

App de hogar: cartera, familia, compras, mascotas y avisos.

## Carpetas

| Carpeta | Qué es |
| --- | --- |
| `backend/` | API + Prisma + PostgreSQL de Aiven |
| `mobile/` | Frontend (Expo Go) |
| `src/` en la raíz | App web anterior. Ya no se usa. |

## Cómo dejarla conectada

1. Crea el servicio PostgreSQL en Aiven (plan Developer).
2. Copia el **Service URI** a `backend/.env` como `DATABASE_URL`.
3. En `backend/`: `npm install`, `npm run db:push`, `npm run dev`.
4. En `mobile/.env` deja `EXPO_PUBLIC_API_URL=http://TU_IP:4000`.
   En este PC la IP de la Wi‑Fi es `192.168.1.135`.
5. Reinicia Expo: `cd mobile` y `npx expo start`.

Si el backend no está configurado, quita o comenta `EXPO_PUBLIC_API_URL` y la app sigue funcionando solo en el teléfono.

Al registrar o entrar con el servidor encendido, los datos del teléfono se suben a Aiven si el hogar en la nube está vacío.
