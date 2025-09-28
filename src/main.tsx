import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/mobile-fixes.css'

// Configuration loaded securely via runtime config

createRoot(document.getElementById("root")!).render(<App />);
