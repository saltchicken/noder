import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LiteGraphLoader from './components/LiteGraphLoader'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <LiteGraphLoader />
  </StrictMode>,
)
