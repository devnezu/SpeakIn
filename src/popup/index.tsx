import { createRoot } from 'react-dom/client';
import { Popup } from './Popup';
import '../index.css';

console.log('{SPEAKIN} Popup script loaded');

const root = document.getElementById('root');
console.log('{SPEAKIN} Root element:', root);

if (root) {
  console.log('{SPEAKIN} Creating React root and rendering Popup component');
  createRoot(root).render(<Popup />);
  console.log('{SPEAKIN} Popup rendered');
} else {
  console.error('{SPEAKIN} ERROR: Root element not found!');
}
