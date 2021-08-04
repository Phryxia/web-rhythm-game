import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { start } from './game'
import './styles/game.css'

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)

start()
