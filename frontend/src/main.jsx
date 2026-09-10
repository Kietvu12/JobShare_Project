import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.jsx'
import store from './store/index.js'
import {
  ensureFreshDeploy,
  setupDeployRecovery,
  startAppVersionWatcher,
} from './utils/appVersionCheck.js'

setupDeployRecovery()

async function bootstrap() {
  await ensureFreshDeploy()
  startAppVersionWatcher()

  createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
  )
}

bootstrap()
