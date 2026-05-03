import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics 
      beforeSend={(event: any) => {
        // Ensure analytics correctly report the public domain
        if (event.url.includes('planora-rose.vercel.app')) {
          return {
            ...event,
            url: event.url.replace('planora-rose.vercel.app', 'planora.golamwasy.dev')
          };
        }
        return event;
      }}
    />
  </StrictMode>,
)
