import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'jspdf-autotable'; // Adicionado: Importa o plugin jspdf-autotable globalmente

createRoot(document.getElementById("root")!).render(<App />);