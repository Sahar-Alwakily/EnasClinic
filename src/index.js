import React from 'react';
import { createRoot } from 'react-dom/client';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';


const root = createRoot(document.getElementById('root'));
root.render(
<React.StrictMode>
<Router>
<App />
</Router>
</React.StrictMode>
);

serviceWorkerRegistration.register();

