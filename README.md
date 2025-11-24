# PetConnect Web - Frontend

Frontend de PetConnect desarrollado con React, TypeScript, Vite y Tailwind CSS.

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (opcional)
cp .env.example .env

# 3. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: **http://localhost:5173**

## 📋 Requisitos

- Node.js 18+
- Backend corriendo en `http://localhost:8000` (ver [README del backend](../petconnect-starter/README.md))

## 🛠️ Tecnologías

- **React 18**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool y dev server
- **Tailwind CSS**: Framework CSS utility-first
- **React Router**: Navegación SPA
- **WebSocket API**: Comunicación en tiempo real

## 📁 Estructura

```
src/
├── App.tsx              # Componente principal y rutas
├── pages/               # Páginas de la aplicación
│   ├── Home.tsx         # Página principal / búsqueda
│   ├── Profile.tsx      # Perfil de usuario
│   ├── SitterProfile.tsx # Perfil de cuidador
│   ├── Bookings.tsx     # Gestión de reservas
│   ├── Messages.tsx     # Mensajería
│   └── ...
├── components/          # Componentes reutilizables
│   ├── SitterCard.tsx   # Tarjeta de cuidador
│   ├── PaymentCheckout.tsx # Formulario de pago
│   └── ...
└── lib/                 # Utilidades
    ├── api.ts           # Cliente API
    ├── types.ts         # Tipos TypeScript
    └── websocket.ts     # Cliente WebSocket
```

## ⚙️ Configuración

### Variables de Entorno

Crear archivo `.env`:

```env
VITE_API_URL=http://localhost:8000
```

### Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linter (si está configurado)
```

## 🎨 Características del Frontend

- ✅ Diseño responsive con Tailwind CSS
- ✅ Navegación SPA con React Router
- ✅ Autenticación con JWT (almacenado en localStorage)
- ✅ Chat en tiempo real con WebSockets
- ✅ Búsqueda de cuidadores con filtros
- ✅ Gestión de reservas y pagos
- ✅ Sistema de reseñas
- ✅ Geolocalización y mapas

## 🔗 Integración con Backend

El frontend se comunica con el backend a través de:

- **REST API**: Para operaciones CRUD (fetch API)
- **WebSockets**: Para mensajería en tiempo real
- **Autenticación**: Tokens JWT en header Authorization

## 📸 Capturas de Pantalla

> Añade aquí capturas de las principales pantallas de tu aplicación.

### Página de Inicio

<!-- ![Home](docs/screenshots/home.png) -->

### Búsqueda de Cuidadores

<!-- ![Search](docs/screenshots/search.png) -->

### Perfil de Cuidador

<!-- ![Sitter Profile](docs/screenshots/sitter-profile.png) -->

### Chat

<!-- ![Messages](docs/screenshots/messages.png) -->

## 🐛 Solución de Problemas

### Error de CORS

Si ves errores de CORS, asegúrate de que el backend tenga configurado:

- `FRONTEND_BASE_URL=http://localhost:5173` en el `.env`
- CORS middleware permitiendo el origen del frontend

### WebSocket no conecta

Verifica que:

- El backend esté corriendo
- El token JWT sea válido
- La URL del WebSocket sea correcta

## 📚 Más Información

Para más detalles sobre el backend, consulta el [README del backend](../petconnect-starter/README.md).
