function cleanPhone(num) {
  var n = (num || '').replace(/\D/g, '');
  if (n.length === 10 || n.length === 11) n = '55' + n;
  return n;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'openOptions') {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }
  var tabId = sender.tab && sender.tab.id;

  if (msg.action === 'sendCustom' && msg.payload) {
    var phone = cleanPhone(msg.payload.phone);
    var text = (msg.payload.text || '').trim();
    var buttons = msg.payload.buttons;

    if (msg.directZapi && msg.directZapi.instanceId && msg.directZapi.token) {
      var base = 'https://api.z-api.io/instances/' + msg.directZapi.instanceId.trim() + '/token/' + msg.directZapi.token.trim();
      var hasButtons = Array.isArray(buttons) && buttons.length > 0;
      var url = base + (hasButtons ? '/send-button-actions' : '/send-text');
      var body;
      if (hasButtons) {
        var buttonActions = buttons.slice(0, 3).map(function (b) {
          if (b.url && b.url.trim()) {
            return { type: 'URL', url: b.url.trim(), label: (b.title || b.id || '').trim() };
          }
          return { type: 'REPLY', label: (b.title || b.id || '').trim(), id: (b.id || b.title || '').trim() };
        });
        body = JSON.stringify({ phone: phone, message: text, buttonActions: buttonActions });
      } else {
        body = JSON.stringify({ phone: phone, message: text });
      }
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { ok: res.ok, status: res.status, data: data };
          });
        })
        .then(function (out) {
          if (out.ok) return;
          var errMsg = (out.data && (out.data.message || out.data.error)) || ('Erro ' + out.status);
          if (tabId) chrome.tabs.sendMessage(tabId, { type: 'sendCustomResult', error: errMsg }).catch(function () {});
        })
        .catch(function (err) {
          if (tabId) chrome.tabs.sendMessage(tabId, { type: 'sendCustomResult', error: (err && err.message) || 'Erro de rede' }).catch(function () {});
        });
      sendResponse({ ok: true });
      return true;
    }

    if (msg.baseUrl && msg.apiKey) {
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
  }
  return true;
});
