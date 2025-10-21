import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'jspdf-autotable'; // Reativado: Garante que o plugin seja carregado

createRoot(document.getElementById("root")!).render(<App />);