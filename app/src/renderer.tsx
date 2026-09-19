import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const App = () => {
    return (
        <div>
            <h1 className='text-red-500 text-lg'>Hello from Electron, Vite, and React2!</h1>
        </div>
    );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);