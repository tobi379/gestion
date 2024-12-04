const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, listener) => {
    const subscription = (event, ...args) => listener(...args);
    ipcRenderer.on(channel, subscription);

    // Devuelve una función para eliminar el listener si es necesario
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  updateUserConfig: (data) => ipcRenderer.invoke('update-user-config', data),
  createAffiliate: (affiliateData) => ipcRenderer.invoke('create-affiliate', affiliateData),
  getAfiliados: () => ipcRenderer.invoke('get-afiliados'),
  getAllAffiliates: () => ipcRenderer.invoke('get-all-affiliates'),
  getAffiliateById: (id) => ipcRenderer.invoke('get-affiliate-by-id', id),
  deleteAffiliateAndRecords: (id) => ipcRenderer.invoke('delete-affiliate-and-records', id),
  updateAffiliate: (id, affiliateData) =>
    ipcRenderer.invoke('update-affiliate', id, affiliateData),
  createAffiliateRecord: (id, recordData) =>
    ipcRenderer.invoke('create-affiliate-record', id, recordData),
  getAffiliateRecords: (afiliadoId) =>
    ipcRenderer.invoke('get-affiliate-records', afiliadoId),
  getSpecificAffiliateRecords: (afiliadoId) =>
    ipcRenderer.invoke('get-specific-affiliate-records', afiliadoId),
  deleteRecord: (recordId) => ipcRenderer.invoke('delete-record', recordId),
  getAffiliatesDetails: () => ipcRenderer.invoke('get-affiliates-details'),
  getPendingFichas: () => ipcRenderer.invoke('get-pending-fichas'),
  markFichaContacted: (fichaId) => ipcRenderer.invoke('mark-ficha-contacted', fichaId),
  updateProximoContacto: (fichaId, proximoContacto) =>
    ipcRenderer.invoke('update-proximo-contacto', { fichaId, proximoContacto }),
  // Puedes agregar más métodos aquí según las funcionalidades necesarias
});