# Casa360 API

Backend de la app. Guarda el hogar en **Aiven PostgreSQL**.

## 1. Crear la base en Aiven

En la pantalla *Create service*:

1. Elige **PostgreSQL**.
2. Plan **Developer** (el de ~US$5).
3. Cloud **Google Cloud** o el que prefieras, región cercana.
4. Pulsa **Create service**.
5. Cuando esté *Running*, abre el servicio y copia **Service URI**.

Debe verse así:

`postgres://avnadmin:CLAVE@HOST:PORT/defaultdb?sslmode=require`

Si Aiven no trae `sslmode=require`, agrégalo al final.

## 2. Configurar

En esta carpeta:

```
copy .env.example .env
```

Pega el Service URI en `DATABASE_URL` y deja una `JWT_SECRET` larga.

## 3. Encender

```
npm install
npx prisma generate
npm run db:push
npm run dev
```

La API queda en `http://0.0.0.0:4000` (también `http://localhost:4000`).

Comprueba: `http://localhost:4000/health`.
