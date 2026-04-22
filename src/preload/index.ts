import { contextBridge, ipcRenderer } from 'electron'

// Preload script to expose IPC to renderer
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
    on: (channel: string, func: (...args: any[]) => void) =>
      ipcRenderer.on(channel, (_, ...args) => func(...args)),
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
  }
})

// Expose API for communication between renderer and main processes
contextBridge.exposeInMainWorld('api', {
  call: (channel: string, data: any) => {
    return ipcRenderer.invoke(channel, data)
  }
})

declare global {
  interface Window {
    api: {
      call: (channel: string, data: any) => Promise<any>
    }
  }
}
