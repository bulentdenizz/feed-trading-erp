import { contextBridge, ipcRenderer } from 'electron'

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
