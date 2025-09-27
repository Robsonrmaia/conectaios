import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/mobile-fixes.css'
import './utils/healthCheck';

createRoot(document.getElementById("root")!).render(<App />);
