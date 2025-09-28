import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/mobile-fixes.css'

// Log configuração para debug (apenas em dev)
if (import.meta.env.DEV) {
  console.log('🔧 ConectaIOS - Configuração Supabase:');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗');
  console.log('Mode:', import.meta.env.MODE);
}

createRoot(document.getElementById("root")!).render(<App />);
