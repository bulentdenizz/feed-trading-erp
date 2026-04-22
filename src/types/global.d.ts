export {}

declare global {
  interface Window {
    api: {
      call: (channel: string, data: any) => Promise<any>
    }
  }
}