import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

async function reloadPustaka() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab) return;

    await chrome.tabs.sendMessage(tab.id ?? 0, { flag: 'start' });
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <div className='container'>
            <div className='title'>Roll20 + Pustaka</div>
            <button className='btn-primary'
                onClick={reloadPustaka}
            >Load \ Reload Pustaka</button>
        </div>
    </StrictMode>
)
