(function () {
  'use strict';

  const SIDEBAR_ID = 'plenipay-crm-sidebar';
  const STORAGE_KEYS = {
    baseUrl: 'plenipay_crm_base_url',
    apiKey: 'plenipay_crm_api_key',
    messages: 'plenipay_crm_messages',
    zapiInstanceId: 'plenipay_zapi_instance',
    zapiToken: 'plenipay_zapi_token',
    zapiClientToken: 'plenipay_zapi_client_token',
  };
  var cachedApi = { baseUrl: '', apiKey: '', at: 0 };
  var cachedZapi = { instanceId: '', token: '', clientToken: '', at: 0 };
  var CACHE_TTL = 60000;

  function getStored() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEYS.baseUrl, STORAGE_KEYS.apiKey, STORAGE_KEYS.zapiInstanceId, STORAGE_KEYS.zapiToken, STORAGE_KEYS.zapiClientToken], (r) => {
        resolve({
          baseUrl: (r[STORAGE_KEYS.baseUrl] || 'https://plenipay.com').replace(/\/+$/, ''),
          apiKey: r[STORAGE_KEYS.apiKey] || '',
          zapiInstanceId: (r[STORAGE_KEYS.zapiInstanceId] || '').trim(),
          zapiToken: (r[STORAGE_KEYS.zapiToken] || '').trim(),
          zapiClientToken: (r[STORAGE_KEYS.zapiClientToken] || '').trim(),
        });
      });
    });
  }

  function getStoredMessages() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEYS.messages], (r) => {
        const list = r[STORAGE_KEYS.messages];
        resolve(Array.isArray(list) ? list : []);
      });
    });
  }

  /** Extrai número BR de um texto (10-13 dígitos). */
  function extractPhoneFromText(text) {
    if (!text || typeof text !== 'string') return null;
    const d = text.replace(/\D/g, '');
    if (d.length < 10 || d.length > 13) return null;
    const digits = d.startsWith('55') ? d : '55' + d;
    if (digits.length >= 12 && digits.length <= 13 && /^55\d{10,11}$/.test(digits)) return digits;
    return null;
  }

  /** Tenta obter o número do chat atual no WhatsApp Web (DOM ou URL). */
  function getCurrentChatPhone() {
    // 1) URL: ?phone= ou &ph=
    const u = new URL(window.location.href);
    const fromUrl = u.searchParams.get('phone') || u.searchParams.get('ph');
    if (fromUrl) {
      const digits = fromUrl.replace(/\D/g, '');
      if (digits.length >= 10) return digits.startsWith('55') ? digits : '55' + digits;
    }

    // Lista de chats = só a faixa à esquerda (~320–380px); painel da conversa começa depois.
    const listRightEdge = Math.min(380, Math.floor(window.innerWidth * 0.32));

    // 2) data-id / data-jid no painel da conversa (ex.: 554598463061 ou 554598463061@c.us)
    const byDataId = document.querySelector('[data-id][data-id*="55"]');
    if (byDataId) {
      const raw = (byDataId.getAttribute('data-id') || '').replace(/@.*$/, '').replace(/\D/g, '');
      if (raw.length >= 12 && raw.length <= 13 && raw.startsWith('55')) return raw;
    }
    const byJid = document.querySelector('[data-jid]');
    if (byJid) {
      const jid = (byJid.getAttribute('data-jid') || '').replace(/@.*$/, '').replace(/\D/g, '');
      if (jid.length >= 12 && jid.length <= 13) return jid.startsWith('55') ? jid : '55' + jid;
    }

    // 3) Painel da conversa (centro): header com número — está à direita da lista, não no meio da tela
    const headers = document.querySelectorAll('header');
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (h.getBoundingClientRect().left < listRightEdge) continue;
      const fullText = (h.textContent || '').trim();
      const digits = extractPhoneFromText(fullText);
      if (digits) return digits;
      const title = (h.getAttribute('title') || '').trim();
      const fromTitle = extractPhoneFromText(title);
      if (fromTitle) return fromTitle;
    }

    // 4) Lista da esquerda: linha selecionada (aria-selected ou fundo destacado)
    const listItems = document.querySelectorAll('[role="listitem"], [data-testid="cell-frame-container"], [role="gridcell"]');
    for (let i = 0; i < listItems.length; i++) {
      const el = listItems[i];
      const rect = el.getBoundingClientRect();
      if (rect.left > listRightEdge || rect.width < 50) continue;
      const isAriaSelected = el.getAttribute('aria-selected') === 'true';
      const bg = window.getComputedStyle(el).backgroundColor;
      const looksSelected = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      if (!isAriaSelected && !looksSelected) continue;
      const text = (el.textContent || el.getAttribute('title') || '').trim();
      const digits = extractPhoneFromText(text);
      if (digits) return digits;
      const link = el.querySelector('a[href*="phone="]');
      if (link) {
        const m = (link.getAttribute('href') || '').match(/phone=(\d{10,13})/);
        if (m && m[1]) return m[1].startsWith('55') ? m[1] : '55' + m[1];
      }
      const anyLink = el.querySelector('a[href]');
      if (anyLink) {
        const href = anyLink.getAttribute('href') || '';
        const fromHref = href.replace(/\D/g, '');
        if (fromHref.length >= 12 && fromHref.length <= 13 && fromHref.startsWith('55')) return fromHref;
      }
    }

    // 5) Qualquer span com title no painel da conversa (à direita da lista)
    const allSpans = document.querySelectorAll('header span[title], [role="main"] span[title]');
    for (let i = 0; i < Math.min(allSpans.length, 50); i++) {
      const span = allSpans[i];
      if (span.getBoundingClientRect().left < listRightEdge) continue;
      const digits = extractPhoneFromText(span.getAttribute('title') || '');
      if (digits) return digits;
    }

    // 5b) Painel da conversa: qualquer elemento com atributo contendo número (title, data-*, aria-*)
    const rightPanel = document.querySelector('[role="main"]') || document.body;
    const walker = document.createTreeWalker(rightPanel, NodeFilter.SHOW_ELEMENT, null, false);
    let node;
    let count = 0;
    while ((node = walker.nextNode()) && count < 100) {
      count++;
      if (node.getBoundingClientRect && node.getBoundingClientRect().left < listRightEdge) continue;
      const el = node;
      const title = el.getAttribute('title');
      if (title) {
        const d = extractPhoneFromText(title);
        if (d) return d;
      }
      for (let j = 0; j < el.attributes.length; j++) {
        const a = el.attributes[j];
        if (a.name.startsWith('data-') || a.name.startsWith('aria-')) {
          const d = extractPhoneFromText(a.value);
          if (d) return d;
        }
      }
    }

    // 6) data-testid do header da conversa
    const convHeader = document.querySelector('[data-testid="conversation-info-header-chat-title"]');
    if (convHeader) {
      const raw = (convHeader.getAttribute('title') || convHeader.textContent || '').replace(/\D/g, '');
      if (raw.length >= 10) return raw.startsWith('55') ? raw : '55' + raw;
    }

    // 7) Título da página
    const pageTitle = document.title || '';
    const titleMatch = pageTitle.match(/(\d{10,13})/);
    if (titleMatch && titleMatch[1]) {
      const n = titleMatch[1];
      return n.startsWith('55') ? n : '55' + n;
    }

    return null;
  }

  function formatPhone(p) {
    const d = p.replace(/\D/g, '');
    // Brasil: 55 + DDD 2 dígitos + 9 dígitos (celular) = 13
    if (d.length === 13 && d.startsWith('55')) return '+' + d.slice(0, 2) + ' ' + d.slice(2, 4) + ' ' + d.slice(4, 9) + '-' + d.slice(9);
    if (d.length === 12 && d.startsWith('55')) return '+' + d.slice(0, 2) + ' ' + d.slice(2, 4) + ' ' + d.slice(4);
    return p;
  }

  function showStatus(el, type, text, html) {
    el.className = 'crm-status ' + type;
    if (html) {
      el.innerHTML = html;
      el.style.display = 'block';
      const btn = el.querySelector('[data-open-options]');
      if (btn) btn.addEventListener('click', () => { chrome.runtime.sendMessage({ action: 'openOptions' }).catch(() => { try { chrome.runtime.openOptionsPage(); } catch (_) {} }); });
      return;
    }
    el.textContent = text;
    el.style.display = 'block';
  }

  function createSidebar() {
    if (document.getElementById(SIDEBAR_ID)) return;

    const wrap = document.createElement('div');
    wrap.id = SIDEBAR_ID;
    wrap.innerHTML = `
      <div class="crm-header">
        <h2>PleniPay CRM</h2>
        <p>Envie as mensagens de boas-vindas (clique e envia na hora)</p>
      </div>
      <div class="crm-body">
        <div class="crm-phone-label">Conversa atual</div>
        <div class="crm-phone-value" id="plenipay-crm-phone-display">—</div>
        <button type="button" class="crm-btn-refresh" id="plenipay-crm-refresh">Atualizar número</button>
        <div class="crm-phone-hint">Se não detectou, cole o número abaixo (com DDD)</div>
        <input type="tel" class="crm-phone-input" id="plenipay-crm-phone-input" placeholder="Ex: 5511999999999" />
        <div class="crm-phone-label" style="margin-top:12px;">Mensagens (clique para enviar uma)</div>
        <div class="crm-buttons-row" id="plenipay-crm-msg-list"></div>
        <p class="crm-phone-hint" id="plenipay-crm-msg-empty" style="display:none;">Nenhuma mensagem. Abra o painel abaixo para criar.</p>
        <button type="button" class="crm-btn-panel" id="plenipay-crm-open-panel">Abrir painel de configuração</button>
        <p class="crm-phone-hint" style="margin-top:6px;">No painel você configura API (URL e token) e cria/edita mensagens (com botões).</p>
        <button type="button" class="crm-btn-refresh" id="plenipay-crm-btn-test" style="margin-top:8px;width:100%;">Testar conexão com a URL</button>
        <div id="plenipay-crm-status" class="crm-status"></div>
      </div>
      <div class="crm-config-link">
        <a href="#" id="plenipay-crm-open-options">Abrir painel de configuração (API e mensagens)</a>
      </div>
    `;

    const toggle = document.createElement('button');
    toggle.className = 'crm-toggle';
    toggle.setAttribute('aria-label', 'Abrir/fechar PleniPay CRM');
    toggle.innerHTML = '◀';

    document.body.appendChild(wrap);
    document.body.appendChild(toggle);

    const phoneDisplay = document.getElementById('plenipay-crm-phone-display');
    const phoneInput = document.getElementById('plenipay-crm-phone-input');
    const msgListEl = document.getElementById('plenipay-crm-msg-list');
    const msgEmptyEl = document.getElementById('plenipay-crm-msg-empty');
    const statusEl = document.getElementById('plenipay-crm-status');

    function getPhoneForSend() {
      let phone = phoneInput.value.trim().replace(/\D/g, '') || getCurrentChatPhone();
      if (!phone || phone.length < 10) return null;
      if (!phone.startsWith('55')) phone = '55' + phone;
      return phone;
    }

    function showQuickStatus(text, isError) {
      statusEl.textContent = text;
      statusEl.className = 'crm-status ' + (isError ? 'error' : 'success');
      statusEl.style.display = 'block';
      setTimeout(function () {
        statusEl.style.display = 'none';
      }, 2800);
    }

    function getApi() {
      if (cachedApi.apiKey && (Date.now() - cachedApi.at) < CACHE_TTL) {
        return Promise.resolve({ baseUrl: cachedApi.baseUrl, apiKey: cachedApi.apiKey, zapiInstanceId: cachedZapi.instanceId, zapiToken: cachedZapi.token, zapiClientToken: cachedZapi.clientToken });
      }
      return getStored().then(function (r) {
        cachedApi.baseUrl = r.baseUrl;
        cachedApi.apiKey = r.apiKey;
        cachedApi.at = Date.now();
        if (r.zapiInstanceId && r.zapiToken) {
          cachedZapi.instanceId = r.zapiInstanceId;
          cachedZapi.token = r.zapiToken;
          cachedZapi.clientToken = r.zapiClientToken || '';
          cachedZapi.at = Date.now();
        }
        return r;
      });
    }

    function cleanPhone(num) {
      var n = (num || '').replace(/\D/g, '');
      if (n.length === 10 || n.length === 11) n = '55' + n;
      return n;
    }

    function sendViaZapi(phone, text, buttons) {
      var instanceId = cachedZapi.instanceId;
      var token = cachedZapi.token;
      if ((instanceId.indexOf('z-api.io') !== -1 || instanceId.indexOf('http') === 0)) {
        var m = instanceId.match(/instances\/([^/]+)\/token\/([^/]+)/i);
        if (m) { instanceId = m[1]; token = token || m[2]; }
      }
      var base = 'https://api.z-api.io/instances/' + instanceId + '/token/' + token;
      var headers = { 'Content-Type': 'application/json' };
      if (cachedZapi.clientToken) headers['Client-Token'] = cachedZapi.clientToken;
      var phoneClean = cleanPhone(phone);
      var messageText = (text && text.trim()) ? text.trim() : ' ';
      function doReq(body, cb) {
        if (!body.message) body.message = messageText;
        var urlReq = base + (body.buttonActions ? '/send-button-actions' : '/send-text');
        fetch(urlReq, { method: 'POST', headers: headers, body: JSON.stringify(body) })
          .then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, status: res.status, data: data }; }); })
          .then(function (out) {
            var isError = out.data && (out.data.error === true || out.data.erro === true || (out.data.message && String(out.data.message).toLowerCase().indexOf('error') !== -1));
            if (out.ok && !isError) {
              showQuickStatus('Enviada ✓', false);
            } else if (!out.ok || isError) {
              var msg = (out.data && (out.data.message || out.data.error || out.data.errorMessage)) || ('Erro ' + out.status);
              if ((msg + '').toLowerCase().indexOf('instance not found') !== -1) {
                msg = 'Instance ID ou Token incorretos.';
              }
              showQuickStatus(msg, true);
            }
            if (cb) cb();
          })
          .catch(function (err) { showQuickStatus((err && err.message) || 'Erro de rede', true); if (cb) cb(); });
      }
      if (!Array.isArray(buttons) || buttons.length === 0) {
        doReq({ phone: phoneClean, message: messageText });
        return;
      }
      var urlButtons = [];
      var replyButtons = [];
      buttons.slice(0, 3).forEach(function (b) {
        var label = (b.title || b.id || '').trim();
        if (!label) return;
        if (b.url && b.url.trim()) {
          var u = b.url.trim();
          if (u.indexOf('http') !== 0) u = 'https://' + u;
          var btn = { type: 'URL', url: u, label: label };
          if ((b.id || b.title || '').trim()) btn.id = (b.id || b.title || '').trim();
          urlButtons.push(btn);
        } else {
          var rbtn = { type: 'REPLY', label: label };
          if ((b.id || b.title || '').trim()) rbtn.id = (b.id || b.title || '').trim();
          replyButtons.push(rbtn);
        }
      });
      if (urlButtons.length > 0 && replyButtons.length > 0) {
        doReq({ phone: phoneClean, message: messageText, buttonActions: urlButtons }, function () {
          setTimeout(function () {
            doReq({ phone: phoneClean, message: 'Ou escolha:', buttonActions: replyButtons });
          }, 1200);
        });
      } else if (urlButtons.length > 0) {
        doReq({ phone: phoneClean, message: messageText, buttonActions: urlButtons });
      } else if (replyButtons.length > 0) {
        doReq({ phone: phoneClean, message: messageText, buttonActions: replyButtons });
      } else {
        doReq({ phone: phoneClean, message: messageText });
      }
    }

    function sendCustomMessage(msg) {
      var phone = getPhoneForSend();
      if (!phone) {
        showStatus(statusEl, 'warning', 'Digite o número ou abra a conversa no WhatsApp.');
        return;
      }
      var text = msg.text || '';
      var buttons = (msg.buttons && msg.buttons.length) ? msg.buttons : undefined;
      if (cachedZapi.instanceId && cachedZapi.token && (Date.now() - cachedZapi.at) < CACHE_TTL) {
        showQuickStatus('Enviando...', false);
        sendViaZapi(phone, text, buttons);
        return;
      }
      if (cachedApi.apiKey && (Date.now() - cachedApi.at) < CACHE_TTL) {
        var payload = { phone: phone, text: text, buttons: buttons };
        fetch(cachedApi.baseUrl + '/api/whatsapp/send-custom-extension', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cachedApi.apiKey, 'X-API-Key': cachedApi.apiKey },
          body: JSON.stringify(payload),
        })
          .then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { return { res: res, data: data }; }); })
          .then(function (out) {
            if (out.res.status === 401) cachedApi.at = 0;
            if (out.data.success) showQuickStatus('Enviada ✓', false);
            else showQuickStatus(out.data.error || 'Erro ao enviar', true);
          })
          .catch(function (err) { cachedApi.at = 0; showQuickStatus((err && err.message) || 'Erro de rede', true); });
        return;
      }
      getApi().then(function (r) {
        if (r.zapiInstanceId && r.zapiToken) {
          cachedZapi.instanceId = r.zapiInstanceId;
          cachedZapi.token = r.zapiToken;
          cachedZapi.clientToken = r.zapiClientToken || '';
          cachedZapi.at = Date.now();
          showQuickStatus('Enviando...', false);
          sendViaZapi(phone, text, buttons);
          return;
        }
        if (!r.apiKey) { showQuickStatus('Configure o token nas opções.', true); return; }
        var payload = { phone: phone, text: text, buttons: buttons };
        fetch(r.baseUrl + '/api/whatsapp/send-custom-extension', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + r.apiKey, 'X-API-Key': r.apiKey },
          body: JSON.stringify(payload),
        })
          .then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { return { res: res, data: data }; }); })
          .then(function (out) {
            if (out.res.status === 401) cachedApi.at = 0;
            if (out.data.success) showQuickStatus('Enviada ✓', false);
            else showQuickStatus(out.data.error || 'Erro ao enviar', true);
          })
          .catch(function (err) { cachedApi.at = 0; showQuickStatus((err && err.message) || 'Erro de rede', true); });
      });
    }

    function renderMessageButtons(list) {
      msgListEl.innerHTML = '';
      if (!list || list.length === 0) {
        msgEmptyEl.style.display = 'block';
        return;
      }
      msgEmptyEl.style.display = 'none';
      list.forEach((msg) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'crm-btn-msg';
        btn.textContent = msg.label || '(sem nome)';
        btn.addEventListener('click', function () {
          sendCustomMessage(msg);
        });
        msgListEl.appendChild(btn);
      });
    }

    function loadAndRenderMessages() {
      getStoredMessages().then(renderMessageButtons);
    }
    const SIDEBAR_WIDTH = 280;

    function updatePhoneDisplay() {
      const phone = getCurrentChatPhone();
      if (phone) {
        phoneDisplay.textContent = formatPhone(phone);
        phoneInput.placeholder = phone;
      } else {
        phoneDisplay.textContent = '—';
        phoneInput.placeholder = 'Ex: 5511999999999';
      }
    }

    const SIDEBAR_CSS_CLASS = 'plenipay-crm-sidebar-visible';

    function applySidebarMargin(visible) {
      if (visible) {
        document.body.style.marginRight = SIDEBAR_WIDTH + 'px';
        document.body.classList.add(SIDEBAR_CSS_CLASS);
      } else {
        document.body.style.marginRight = '';
        document.body.classList.remove(SIDEBAR_CSS_CLASS);
      }
    }

    updatePhoneDisplay();
    loadAndRenderMessages();
    if (!cachedApi.apiKey) {
      getStored().then(function (r) {
        cachedApi.baseUrl = r.baseUrl;
        cachedApi.apiKey = r.apiKey;
        cachedApi.at = Date.now();
        if (r.baseUrl) {
          fetch(r.baseUrl.replace(/\/+$/, '') + '/api/health', { method: 'HEAD' }).catch(function () {});
        }
      });
    }
    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName !== 'sync') return;
      if (changes[STORAGE_KEYS.messages]) {
        renderMessageButtons(Array.isArray(changes[STORAGE_KEYS.messages].newValue) ? changes[STORAGE_KEYS.messages].newValue : []);
      }
      if (changes[STORAGE_KEYS.baseUrl] || changes[STORAGE_KEYS.apiKey] || changes[STORAGE_KEYS.zapiInstanceId] || changes[STORAGE_KEYS.zapiToken] || changes[STORAGE_KEYS.zapiClientToken]) {
        getStored().then(function (r) {
          cachedApi.baseUrl = r.baseUrl;
          cachedApi.apiKey = r.apiKey;
          cachedApi.at = Date.now();
          if (r.zapiInstanceId && r.zapiToken) {
            cachedZapi.instanceId = r.zapiInstanceId;
            cachedZapi.token = r.zapiToken;
            cachedZapi.clientToken = r.zapiClientToken || '';
            cachedZapi.at = Date.now();
          }
        });
      }
    });
    setTimeout(function () {
      updatePhoneDisplay();
      lastPhone = getCurrentChatPhone();
    }, 1000);
    applySidebarMargin(true);

    // Atualizar "Conversa atual" ao trocar de chat (polling 1s + clique + mudança no DOM)
    let lastPhone = getCurrentChatPhone();
    function syncPhoneFromPage() {
      const phone = getCurrentChatPhone();
      if (phone !== lastPhone) {
        lastPhone = phone;
        if (phone) {
          phoneDisplay.textContent = formatPhone(phone);
          phoneInput.placeholder = phone;
        } else {
          phoneDisplay.textContent = '—';
          phoneInput.placeholder = 'Ex: 5511999999999';
        }
      }
    }
    setInterval(function () {
      if (wrap.classList.contains('hidden')) return;
      syncPhoneFromPage();
    }, 800);
    document.addEventListener('click', function () {
      setTimeout(syncPhoneFromPage, 200);
      setTimeout(syncPhoneFromPage, 600);
    }, true);
    window.addEventListener('focus', function () { setTimeout(syncPhoneFromPage, 300); });
    try {
      const main = document.querySelector('[role="main"]') || document.body;
      const obs = new MutationObserver(function () { syncPhoneFromPage(); });
      obs.observe(main, { childList: true, subtree: true });
    } catch (_) {}

    document.getElementById('plenipay-crm-refresh').addEventListener('click', function () {
      lastPhone = getCurrentChatPhone();
      updatePhoneDisplay();
    });

    toggle.addEventListener('click', () => {
      const hidden = wrap.classList.toggle('hidden');
      toggle.innerHTML = hidden ? '▶' : '◀';
      applySidebarMargin(!hidden);
    });

    function openConfigPanel() {
      chrome.runtime.sendMessage({ action: 'openOptions' }).catch(() => {});
      try { chrome.runtime.openOptionsPage(); } catch (_) {}
    }
    document.getElementById('plenipay-crm-open-options').addEventListener('click', (e) => {
      e.preventDefault();
      openConfigPanel();
    });
    document.getElementById('plenipay-crm-open-panel').addEventListener('click', openConfigPanel);

    document.getElementById('plenipay-crm-btn-test').addEventListener('click', async () => {
      const { baseUrl } = await getStored();
      if (!baseUrl) {
        showStatus(statusEl, 'warning', 'Configure a URL nas opções primeiro.');
        return;
      }
      const url = baseUrl.replace(/\/+$/, '') + '/api/health';
      statusEl.style.display = 'block';
      statusEl.className = 'crm-status warning';
      statusEl.textContent = 'Testando ' + url + '...';
      try {
        const res = await fetch(url, { method: 'GET' });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.status === 'ok') {
          showStatus(statusEl, 'success', 'Conexão OK: site no ar.');
        } else {
          showStatus(statusEl, 'error', 'Resposta inesperada: ' + res.status);
        }
      } catch (err) {
        const m = (err && err.message) ? err.message : '';
        showStatus(statusEl, 'error', 'Falhou: ' + (m || 'verifique a URL (ex: https://seu-app.up.railway.app, sem barra no final) e recarregue a extensão.'));
      }
    });
  }

  getStored().then(function (r) {
    cachedApi.baseUrl = r.baseUrl;
    cachedApi.apiKey = r.apiKey;
    cachedApi.at = Date.now();
    if (r.zapiInstanceId && r.zapiToken) {
      cachedZapi.instanceId = r.zapiInstanceId;
      cachedZapi.token = r.zapiToken;
      cachedZapi.clientToken = r.zapiClientToken || '';
      cachedZapi.at = Date.now();
    }
    if (r.baseUrl) {
      fetch(r.baseUrl.replace(/\/+$/, '') + '/api/health', { method: 'HEAD' }).catch(function () {});
    }
  });

  function init() {
    setTimeout(createSidebar, 1000);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
