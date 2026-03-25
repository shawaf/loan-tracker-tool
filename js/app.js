/**
 * app.js
 * Entry point. Initialises theme and kicks off the first render.
 * All modules (state, schedule, render, modal, controls, export) must
 * be loaded before this file.
 */

document.body.classList.remove('dark');   // start in light mode
document.getElementById('theme-label').textContent = 'Dark';

render();
