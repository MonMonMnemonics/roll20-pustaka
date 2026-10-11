const { contextBridge, ipcRenderer } = require('electron');

const browserAPI = {
    loadBrowserChild: (show: boolean, url: string) => ipcRenderer.send('load-browser-child', show, url),
}
contextBridge.exposeInMainWorld('browserAPI', browserAPI);

export type BrowserAPI = typeof browserAPI;