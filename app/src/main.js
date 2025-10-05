// --- Timestamp monkey-patch ---
const originalLog = console.log;
console.log = function(...args) {
  const timestamp = new Date().toLocaleTimeString('ru-RU');
  originalLog.apply(console, [`[${timestamp}]`, ...args]);
};
const originalError = console.error;
console.error = function(...args) {
    const timestamp = new Date().toLocaleTimeString('ru-RU');
    originalError.apply(console, [`[${timestamp}]`, ...args]);
};
// --- End of patch ---

import { mount } from 'svelte';
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app