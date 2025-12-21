/**
 * Store global para o cliente WhatsApp
 * Usa variável global do Node.js para garantir que seja compartilhada entre todas as requisições
 */

// @ts-ignore
if (typeof global.whatsappClientStore === 'undefined') {
  // @ts-ignore
  global.whatsappClientStore = {
    client: null,
    qrCode: null,
    isConnecting: false,
    connectionStatus: 'disconnected' as 'disconnected' | 'connecting' | 'connected',
    phoneNumber: null,
  }
}

// @ts-ignore
const store = global.whatsappClientStore

export function getClient() {
  return store.client
}

export function setClient(client: any) {
  store.client = client
}

export function getQRCode() {
  return store.qrCode
}

export function setQRCode(qrCode: string | null) {
  store.qrCode = qrCode
}

export function getIsConnecting() {
  return store.isConnecting
}

export function setIsConnecting(connecting: boolean) {
  store.isConnecting = connecting
}

export function getConnectionStatus() {
  return store.connectionStatus
}

export function setConnectionStatus(status: 'disconnected' | 'connecting' | 'connected') {
  store.connectionStatus = status
}

export function getPhoneNumber() {
  return store.phoneNumber
}

export function setPhoneNumber(phone: string | null) {
  store.phoneNumber = phone
}











