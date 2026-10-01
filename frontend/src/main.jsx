import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LoginPromptProvider } from './context/LoginPromptProvider.jsx'
import { SubscriptionsProvider } from './context/SubscriptionsProvider.jsx'
import { themeService } from './services/themeService'
import './styles/index.css'

// Aplica el color de tema guardado antes de dibujar (evita un parpadeo de color)
themeService.apply(themeService.current())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* HashRouter: las rutas viven después de "#", así S3 static website hosting
        siempre sirve index.html y recargar /#/watch/5 no produce 404. */}
    <HashRouter>
      <AuthProvider>
        <SubscriptionsProvider>
          <LoginPromptProvider>
            <App />
          </LoginPromptProvider>
        </SubscriptionsProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
