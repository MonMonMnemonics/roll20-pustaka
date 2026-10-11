import { BrowserAPI } from './preload';

declare global {
    interface Window {
        browserAPI: BrowserAPI
    }
}