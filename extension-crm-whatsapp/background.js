chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'openOptions') {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }
  if (msg.action === 'sendCustom' && msg.baseUrl && msg.apiKey && msg.payload) {
    var tabId = sender.tab && sender.tab.id;
    fetch(msg.baseUrl + '/api/whatsapp/send-custom-extension', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + msg.apiKey,
        'X-API-Key': msg.apiKey,
      },
      body: JSON.stringify(msg.payload),
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { res: res, data: data };
        });
      })
      .then(function (out) {
        if (out.res.status === 401 && tabId) {
          chrome.tabs.sendMessage(tabId, { type: 'sendCustomResult', invalidateCache: true }).catch(function () {});
        }
        if (!out.data.success && tabId) {
          chrome.tabs.sendMessage(tabId, { type: 'sendCustomResult', error: out.data.error || 'Erro ao enviar' }).catch(function () {});
        }
      })
      .catch(function (err) {
        if (tabId) {
          chrome.tabs.sendMessage(tabId, { type: 'sendCustomResult', error: (err && err.message) || 'Erro de rede' }).catch(function () {});
        }
      });
    sendResponse({ ok: true });
    return true;
  }
  return true;
});
