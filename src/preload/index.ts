import { contextBridge, ipcRenderer } from 'electron'

// Expose API for communication between renderer and main processes
contextBridge.exposeInMainWorld('api', {
  call: (channel: string, data: any) => {
    return ipcRenderer.invoke(channel, data)
  }
})

contextBridge.exposeInMainWorld('auth', {
  login: async (username: string, password: string) => {
    const response = await ipcRenderer.invoke('auth:login', { username, password });
    if (response.ok) {
      return response.data;
    } else {
      throw new Error(response.message || 'Login failed');
    }
  },
  logout: async (token: string) => {
    const response = await ipcRenderer.invoke('auth:logout', { token });
    if (!response.ok) {
      throw new Error(response.message || 'Logout failed');
    }
  },
  validateSession: async (token?: string) => {
    const response = await ipcRenderer.invoke('auth:validate', { token });
    if (response.ok) {
      return response.data;
    } else {
      throw new Error(response.message || 'Session validation failed');
    }
  }
})

declare global {
  interface Window {
    api: {
      call: (channel: string, data: any) => Promise<any>
    },
    auth: {
      login: (username: string, password: string) => Promise<any>;
      logout: (token: string) => Promise<void>;
      validateSession: (token?: string) => Promise<any>;
    }
  }
}
