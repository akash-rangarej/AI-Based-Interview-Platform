import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthContextProvider } from './context/AuthContext.jsx'
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <AuthContextProvider>
        <App />
         <Toaster
        position="top-center"
        toastOptions={{
          duration: 3200,
          style: {
            background: "#111827",
            border: "1px solid rgba(148, 163, 184, 0.22)",
            color: "#f8fafc",
          },
        }}
      />
      </AuthContextProvider>
    </BrowserRouter>
)
