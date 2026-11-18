import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Splash from './Splash.jsx'
import './style.css'
createRoot(document.getElementById('root')).render(
  <>
    <Splash />
    <App />
  </>
)

try {
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
  }
} catch (e) {}
