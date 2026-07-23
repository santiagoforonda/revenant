import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RevenantApp } from './RevenantApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RevenantApp></RevenantApp>
  </StrictMode>,
)
