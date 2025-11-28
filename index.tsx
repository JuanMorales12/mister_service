import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { PublicFormPage } from './components/PublicFormPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const params = new URLSearchParams(window.location.search);
const isPublicForm = params.has('public-form');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {isPublicForm ? <PublicFormPage /> : <App />}
  </React.StrictMode>
);