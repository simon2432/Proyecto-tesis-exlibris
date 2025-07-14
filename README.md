# Proyecto Tesis - EXLIBRIS

![logoLechuza](https://github.com/user-attachments/assets/d6776236-f336-4b82-bd28-698af4b7ff47)

Este repositorio contiene una aplicación móvil desarrollada con **Expo/React Native** y un backend en **Node.js** con **Express** y **Prisma**. La app permite registrarse, iniciar sesión, buscar libros, gestionar un historial de lectura, comprar y vender libros mediante un módulo dedicado, y conversar con un asistente literario potenciado por OpenAI.

## Requisitos previos

- **Node.js** (versión 18 o superior) y **npm**
- Una base de datos **PostgreSQL** disponible
- Una clave de API para OpenAI

## Configuración del backend

1. Instalar las dependencias

   ```bash
   cd backend
   npm install
   ```

2. Crear un archivo `.env` dentro de `backend/` con las variables necesarias:

   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
   JWT_SECRET="coloque_un_valor_seguro"
   OPENAI_API_KEY="su_clave_de_openai"
   PORT=3001 # puede cambiarse si es necesario
   ```

3. Ejecutar las migraciones y generar el cliente de Prisma:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. Iniciar el servidor de desarrollo

   ```bash
   npm run dev
   ```

   El servidor quedará disponible en `http://localhost:3001` (o el puerto que defina en `PORT`).

## Configuración del frontend

1. Instalar las dependencias

   ```bash
   cd frontend
   npm install
   ```

2. Ajustar las direcciones IP del backend. En los archivos `frontend/app/login.tsx`, `frontend/app/register.tsx`, `frontend/hooks/useGoogleBooksSearch.ts` y `frontend/components/ChatAssistant.tsx` se define la constante `API_BASE_URL`/`BACKEND_URL`. Cambie `10.0.2.2` o `localhost` por la IP y el puerto donde se ejecute su backend si no utiliza el valor por defecto.

3. Iniciar la aplicación móvil

   ```bash
   npx expo start
   ```

   Desde la interfaz de Expo puede abrir la app en un emulador o dispositivo físico o web.

## Notas adicionales

- Las rutas del backend se definen en `backend/src/routes` y utilizan controladores en `backend/src/controllers`.
- El middleware `authMiddleware.js` maneja la verificación del token JWT.
- El asistente literario se comunica con la API de OpenAI mediante la clave `OPENAI_API_KEY`.
- Si ejecuta el backend en otro host o puerto, recuerde actualizar todas las referencias de `http://10.0.2.2:3001` o `http://localhost:3001` en el código del frontend.

Con esto debería poder levantar tanto el backend como el frontend para desarrollar o probar la aplicación.
