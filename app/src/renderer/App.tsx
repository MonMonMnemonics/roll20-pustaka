import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Roll20Char from './pages/Roll20Char';

const App = () => {
    return (
        <HashRouter>
            <Routes>
                <Route path='/' element={<Home/>} />
                <Route path='/roll20' element={<Roll20Char/>} />
            </Routes>
        </HashRouter>
    );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);