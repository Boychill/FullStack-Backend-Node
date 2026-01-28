# Backend TiendaWeb (Node.js + Express)

Backend para la aplicación TiendaWeb, construido con Node.js, Express y MongoDB.

## Despliegue en Render

Sigue estos pasos para desplegar este backend en [Render](https://render.com):

1.  **Crear Servicio**:
    *   En tu dashboard de Render, haz clic en **New +** y selecciona **Web Service**.
    *   Conecta este repositorio (`FullStack-Backend-Node`).

2.  **Configuración**:
    *   Ponle un nombre (ej: `tiendaweb-api`).
    *   Render detectará automáticamente el entorno `Node`.
    *   Build Command: `npm install`
    *   Start Command: `npm start`

3.  **Variables de Entorno (Environment Variables)**:
    Añade las siguientes variables en la sección "Environment":
    *   `MONGO_URI`: La cadena de conexión a tu base de datos (ej: MongoDB Atlas).
    *   `JWT_SECRET`: Una cadena de texto secreta para firmar los tokens.
    *   `NODE_ENV`: `production`

4.  **Finalizar**:
    *   Haz clic en **Create Web Service**.
    *   Una vez desplegado, copia la URL que te da Render (ej: `https://tiendaweb-api.onrender.com`). **La necesitarás para el Frontend.**

## Scripts Disponibles

- `npm run dev`: Inicia el servidor en modo desarrollo.
- `npm run data:import`: Pobla la base de datos con datos de prueba (requiere conexión DB).
