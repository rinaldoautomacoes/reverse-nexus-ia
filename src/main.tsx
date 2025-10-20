import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import 'jspdf-autotable'; // Removido: A importação global não é mais necessária aqui

createRoot(document.getElementById("root")!).render(<App />);