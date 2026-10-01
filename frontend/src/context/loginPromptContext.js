import { createContext } from 'react'

// Ventana "Inicia sesión" que aparece cuando un invitado intenta una acción que requiere cuenta
export const LoginPromptContext = createContext({ ask: () => {} })
