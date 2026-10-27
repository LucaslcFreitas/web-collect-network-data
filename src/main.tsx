import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import App from './App.tsx'
import { initializeCacheVersion } from './services/cache'

const startApp = async () => {
    try {
        await initializeCacheVersion()
    } catch (error) {
        console.error('Unable to initialize cache version:', error)
    }

    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <App />
        </StrictMode>
    )
}

void startApp()
