# PetConnect Web (React + Vite + TS + Tailwind)

## Requisitos
- Node.js 18+
- Backend corriendo en `http://127.0.0.1:8000` (FastAPI)

## Pasos
```bash
# 1) Instala dependencias
npm install

# 2) Crea .env con la URL de tu API
cp .env.example .env
# o en Windows PowerShell:
copy .env.example .env

# 3) Arranca el front
npm run dev
# http://localhost:5173
```

Si ves CORS, asegúrate de haber añadido CORSMiddleware en FastAPI permitiendo `http://localhost:5173`.
