import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import store from './store/index.js'
import App from './App.jsx'
import './styles/globals.css'

window.onerror = function (message, source, lineno, colno, error) {
  document.body.innerHTML = `
    <div style="color:red; padding:20px; font-family:monospace; background:black; height:100vh;">
      <h2>FATAL APP CRASH</h2>
      <p>${message}</p>
      <pre style="white-space:pre-wrap;">${error && error.stack ? error.stack : 'No stack trace'}</pre>
    </div>
  `;
  return false;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1A1A2E',
                color: '#FFFFFF',
                border: '1px solid #C9A84C',
              },
            }}
          />
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </Provider>
  </React.StrictMode>
)
