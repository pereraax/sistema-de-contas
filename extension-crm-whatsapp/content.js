(function () {
  'use strict';

  const SIDEBAR_ID = 'plenipay-crm-sidebar';
  const STORAGE_KEYS = {
    baseUrl: 'plenipay_crm_base_url',
    apiKey: 'plenipay_crm_api_key',
    messages: 'plenipay_crm_messages',
    funnels: 'plenipay_crm_funnels',
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
  // Pré-carrega API/Z-API ao abrir a página para envio instantâneo no primeiro clique
  getStored().then(function (r) {
    cachedApi.baseUrl = r.baseUrl;
    cachedApi.apiKey = r.apiKey;
    cachedApi.at = r.baseUrl && r.apiKey ? Date.now() : 0;
    if (r.zapiInstanceId && r.zapiToken) {
      cachedZapi.instanceId = r.zapiInstanceId;
      cachedZapi.token = r.zapiToken;
      cachedZapi.clientToken = r.zapiClientToken || '';
      cachedZapi.at = Date.now();
    }
  });

  function getStoredMessages() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEYS.messages], (r) => {
        const list = r[STORAGE_KEYS.messages];
        resolve(Array.isArray(list) ? list : []);
      });
    });
  }
  function getStoredFunnels() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEYS.funnels], (r) => {
        const list = r[STORAGE_KEYS.funnels];
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

    const listRightEdge = Math.min(280, Math.floor(window.innerWidth * 0.26));
    function isPlenSelfChat() {
      var headers = document.querySelectorAll('header');
      for (var i = 0; i < headers.length; i++) {
        var h = headers[i];
        if (h.getBoundingClientRect().left < listRightEdge) continue;
        var t = (h.textContent || '').toLowerCase();
        // Header com número = conversa com contato, não considerar como self
        if (/\d{10,}/.test(t)) continue;
        // Só tratar como chat "eu mesmo" se for o título exato (evita falso positivo em "assistente financeira")
        if (t.indexOf('mensagens para mim') !== -1) return true;
        if (t.indexOf('assistente plen') !== -1 && t.indexOf('(você)') !== -1) return true;
      }
      return false;
    }
    if (isPlenSelfChat()) return null;

    // Lista de chats = só a faixa à esquerda (~320–380px); painel da conversa começa depois.
    function isInConversationPanel(el) {
      if (!el || !el.getBoundingClientRect) return false;
      return el.getBoundingClientRect().left >= listRightEdge;
    }

    // 2) data-id / data-jid no painel da CONVERSA (direita), não na lista à esquerda
    const dataIdCandidates = document.querySelectorAll('[data-id][data-id*="55"]');
    for (let i = 0; i < dataIdCandidates.length; i++) {
      const el = dataIdCandidates[i];
      if (!isInConversationPanel(el)) continue;
      const raw = (el.getAttribute('data-id') || '').replace(/@.*$/, '').replace(/\D/g, '');
      if (raw.length >= 12 && raw.length <= 13 && raw.startsWith('55')) return raw;
    }
    const byDataId = document.querySelector('[data-id][data-id*="55"]');
    if (byDataId) {
      const raw = (byDataId.getAttribute('data-id') || '').replace(/@.*$/, '').replace(/\D/g, '');
      if (raw.length >= 12 && raw.length <= 13 && raw.startsWith('55')) return raw;
    }
    const jidCandidates = document.querySelectorAll('[data-jid]');
    for (let j = 0; j < jidCandidates.length; j++) {
      const el = jidCandidates[j];
      if (!isInConversationPanel(el)) continue;
      const jid = (el.getAttribute('data-jid') || '').replace(/@.*$/, '').replace(/\D/g, '');
      if (jid.length >= 12 && jid.length <= 13) return jid.startsWith('55') ? jid : '55' + jid;
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
    const convInfo = document.querySelector('[data-testid="conversation-info-header"]');
    if (convInfo && convInfo.getBoundingClientRect().left >= listRightEdge) {
      const raw = (convInfo.getAttribute('title') || convInfo.textContent || '').replace(/\D/g, '');
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
    if (!el) return;
    el.classList.remove('crm-status-loading');
    var spinner = el.querySelector('.crm-status-spinner');
    if (spinner) spinner.style.display = 'none';
    var textNode = el.querySelector('.crm-status-text');
    if (textNode) textNode.textContent = text; else el.textContent = text;
    el.className = 'crm-status ' + type;
    if (html) {
      el.innerHTML = html;
      el.style.display = 'block';
      var btn = el.querySelector('[data-open-options]');
      if (btn) btn.addEventListener('click', function () { chrome.runtime.sendMessage({ action: 'openOptions' }).catch(function () { try { chrome.runtime.openOptionsPage(); } catch (_) {} }); });
      return;
    }
    el.style.display = 'block';
  }

  function createSidebar() {
    if (document.getElementById(SIDEBAR_ID)) return;

    const wrap = document.createElement('div');
    wrap.id = SIDEBAR_ID;
    wrap.innerHTML = `
      <div class="crm-header-zap">
        <button type="button" class="crm-header-menu" id="plenipay-crm-header-menu" aria-label="Menu">&#9776;</button>
        <div class="crm-header-brand">
          <span class="crm-brand-main">PleniPay</span>
          <span class="crm-brand-sub">CRM</span>
        </div>
        <a href="#" class="crm-header-config" id="plenipay-crm-open-options">Config</a>
      </div>
      <div class="crm-search-row">
        <input type="text" class="crm-search-input" id="plenipay-crm-search" placeholder="Buscar..." />
        <label class="crm-toggle-wrap">
          <input type="checkbox" class="crm-toggle-input" id="plenipay-crm-favoritos" />
          <span class="crm-toggle-track"></span>
          <span class="crm-toggle-label">Apenas favoritos</span>
        </label>
      </div>
      <div class="crm-actions-row">
        <button type="button" class="crm-btn-main" id="plenipay-crm-refresh">Atualizar número</button>
        <div class="crm-actions-icons">
          <button type="button" class="crm-icon-btn crm-icon-config" id="plenipay-crm-open-panel" title="Configuração">&#9881;</button>
          <button type="button" class="crm-icon-btn crm-icon-test" id="plenipay-crm-btn-test" title="Testar conexão">&#9658;</button>
        </div>
      </div>
      <div class="crm-phone-bar" title="Número detectado da conversa aberta no WhatsApp">
        <span class="crm-phone-label">Conversa:</span>
        <span class="crm-phone-value" id="plenipay-crm-phone-display">—</span>
      </div>
      <div class="crm-body">
        <div class="crm-section-title">Mensagens</div>
        <div class="crm-msg-list" id="plenipay-crm-msg-list"></div>
        <p class="crm-empty-hint" id="plenipay-crm-msg-empty" style="display:none;">Nenhuma mensagem. Configure no painel.</p>
        <div class="crm-section-title crm-funnel-title">Funis</div>
        <div class="crm-funnel-list" id="plenipay-crm-funnel-list"></div>
        <p class="crm-empty-hint" id="plenipay-crm-funnel-empty">Nenhum funil. Crie na aba Funis.</p>
      </div>
      <div id="plenipay-crm-status" class="crm-status">
        <span class="crm-status-spinner"></span>
        <span class="crm-status-text"></span>
      </div>
    `;

    const toggle = document.createElement('button');
    toggle.className = 'crm-toggle';
    toggle.setAttribute('aria-label', 'Abrir/fechar PleniPay CRM');
    toggle.innerHTML = '◀';

    document.body.appendChild(wrap);
    document.body.appendChild(toggle);

    const phoneDisplay = document.getElementById('plenipay-crm-phone-display');
    const msgListEl = document.getElementById('plenipay-crm-msg-list');
    const msgEmptyEl = document.getElementById('plenipay-crm-msg-empty');
    const funnelListEl = document.getElementById('plenipay-crm-funnel-list');
    const funnelEmptyEl = document.getElementById('plenipay-crm-funnel-empty');
    const statusEl = document.getElementById('plenipay-crm-status');
    const statusTextEl = statusEl ? statusEl.querySelector('.crm-status-text') : null;
    const FUNNEL_DELAY_MS = 600;
    var lockedSendPhone = null;

    function getPhoneForSend() {
      if (lockedSendPhone) return lockedSendPhone;
      var phone = getCurrentChatPhone();
      if (!phone || phone.length < 10) return null;
      if (!phone.startsWith('55')) phone = '55' + phone;
      return phone;
    }

    function showQuickStatus(text, isError) {
      if (!statusEl) return;
      if (!funnelSending) lockedSendPhone = null;
      statusEl.classList.remove('crm-status-loading');
      var spinner = statusEl.querySelector('.crm-status-spinner');
      if (spinner) spinner.style.display = 'none';
      if (statusTextEl) statusTextEl.textContent = text;
      statusEl.className = 'crm-status ' + (isError ? 'error' : 'success');
      statusEl.style.display = 'block';
      setTimeout(function () {
        statusEl.style.display = 'none';
      }, 2800);
    }

    function showSendingStatus(phoneFormatted) {
      if (!statusEl) return;
      statusEl.classList.add('crm-status-loading');
      var spinner = statusEl.querySelector('.crm-status-spinner');
      if (spinner) spinner.style.display = 'inline-block';
      if (statusTextEl) statusTextEl.textContent = 'Enviando para o n\u00famero ' + (phoneFormatted || '—') + '...';
      statusEl.className = 'crm-status loading';
      statusEl.style.display = 'block';
    }

    function hideSendingStatus() {
      if (!statusEl) return;
      statusEl.classList.remove('crm-status-loading');
      var spinner = statusEl.querySelector('.crm-status-spinner');
      if (spinner) spinner.style.display = 'none';
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
      function doReq(body, cb, showSuccess, successLabel) {
        if (showSuccess === undefined) showSuccess = true;
        if (!successLabel) successLabel = 'Enviada ✓';
        if (!body.message) body.message = messageText;
        if (showSuccess && !funnelSending) showQuickStatus(successLabel, false);
        var urlReq = base + (body.buttonActions ? '/send-button-actions' : '/send-text');
        fetch(urlReq, { method: 'POST', headers: headers, body: JSON.stringify(body) })
          .then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, status: res.status, data: data }; }); })
          .then(function (out) {
            var isError = out.data && (out.data.error === true || out.data.erro === true || out.data.success === false || (out.data.message && String(out.data.message).toLowerCase().indexOf('error') !== -1));
            var hasMessageId = out.data && (out.data.messageId || out.data.zaapId || out.data.id);
            var realSuccess = out.ok && !isError && hasMessageId;
            if (!realSuccess) {
              var msg = (out.data && (out.data.message || out.data.error || out.data.errorMessage)) || ('Erro ' + out.status);
              if ((msg + '').toLowerCase().indexOf('instance not found') !== -1) msg = 'Instance ID ou Token incorretos.';
              else if (out.ok && !hasMessageId) msg = 'Resposta sem confirmação. Tente de novo.';
              showQuickStatus(msg, true);
            }
            if (cb) cb(out);
          })
          .catch(function (err) { showQuickStatus((err && err.message) || 'Erro de rede', true); if (cb) cb({}); });
      }
      if (!Array.isArray(buttons) || buttons.length === 0) {
        doReq({ phone: phoneClean, message: messageText });
        return;
      }
      // Um único array na ordem configurada (todos os botões na mesma mensagem, um abaixo do outro)
      var allButtons = [];
      buttons.slice(0, 3).forEach(function (b) {
        var label = (b.title || b.id || '').trim();
        if (!label) return;
        if (b.url && b.url.trim()) {
          var u = b.url.trim();
          if (u.indexOf('http') !== 0) u = 'https://' + u;
          var btn = { type: 'URL', url: u, label: label };
          if ((b.id || b.title || '').trim()) btn.id = (b.id || b.title || '').trim();
          allButtons.push(btn);
        } else {
          var rbtn = { type: 'REPLY', label: label };
          if ((b.id || b.title || '').trim()) rbtn.id = (b.id || b.title || '').trim();
          allButtons.push(rbtn);
        }
      });
      var messageOnly = messageText;
      if (allButtons.length > 0) {
        doReq({ phone: phoneClean, message: messageOnly, buttonActions: allButtons }, function (out) {
          var failed = out && (!out.ok || (out.data && (out.data.error === true || out.data.erro === true || out.data.success === false)));
          var noId = out && out.ok && out.data && !out.data.messageId && !out.data.zaapId && !out.data.id;
          if (failed || noId) {
            if (cachedApi.baseUrl && cachedApi.apiKey && (Date.now() - cachedApi.at) < 300000) {
              showQuickStatus('Enviando pelo servidor...', false);
              sendViaSiteApi(phone, text, buttons, cachedApi.baseUrl, cachedApi.apiKey);
            } else {
              showQuickStatus('Enviando só o texto...', false);
              doReq({ phone: phoneClean, message: messageOnly }, null, true, 'Enviada ✓ (só texto)');
            }
          }
        }, true);
      } else {
        doReq({ phone: phoneClean, message: messageOnly });
      }
    }

    function sendViaSiteApi(phone, text, buttons, baseUrl, apiKey) {
      var url = (baseUrl || '').replace(/\/+$/, '') + '/api/whatsapp/send-custom-extension';
      if (!funnelSending) showQuickStatus('Enviada ✓', false);
      var payload = { phone: phone, text: text, buttons: buttons };
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey, 'X-API-Key': apiKey },
        body: JSON.stringify(payload),
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { return { res: res, data: data }; }); })
        .then(function (out) {
          if (out.res.status === 401) cachedApi.at = 0;
          if (!(out.data && out.data.success)) showQuickStatus((out.data && out.data.error) || 'Erro ao enviar', true);
        })
        .catch(function (err) { cachedApi.at = 0; showQuickStatus((err && err.message) || 'Erro de rede', true); });
    }

    function sendCustomMessage(msg) {
      var phone = getPhoneForSend();
      if (!phone) {
        syncPhoneFromPage();
        phone = getPhoneForSend();
      }
      if (!phone) {
        showStatus(statusEl, 'warning', 'Clique na conversa no WhatsApp para identificar o número.');
        return;
      }
      if (isBlockedMessage(msg.text)) {
        showQuickStatus('Essa mensagem foi desativada para evitar repetição.', true);
        return;
      }
      var text = msg.text || '';
      var buttons = (msg.buttons && msg.buttons.length) ? msg.buttons : undefined;
      var hasButtons = buttons && buttons.length > 0;
      var zapiValid = cachedZapi.instanceId && cachedZapi.token && (Date.now() - cachedZapi.at) < CACHE_TTL;
      var siteValid = cachedApi.apiKey && cachedApi.baseUrl && (Date.now() - cachedApi.at) < CACHE_TTL;
      if (zapiValid) {
        sendViaZapi(phone, text, buttons);
        return;
      }
      if (siteValid) {
        sendViaSiteApi(phone, text, buttons, cachedApi.baseUrl, cachedApi.apiKey);
        return;
      }
      getApi().then(function (r) {
        if (r.zapiInstanceId && r.zapiToken) {
          cachedZapi.instanceId = r.zapiInstanceId;
          cachedZapi.token = r.zapiToken;
          cachedZapi.clientToken = r.zapiClientToken || '';
          cachedZapi.at = Date.now();
        }
        if (r.baseUrl && r.apiKey) {
          cachedApi.baseUrl = r.baseUrl;
          cachedApi.apiKey = r.apiKey;
          cachedApi.at = Date.now();
        }
        if (r.zapiInstanceId && r.zapiToken) {
          sendViaZapi(phone, text, buttons);
          return;
        }
        if (!r.apiKey || !r.baseUrl) {
          showQuickStatus('Configure API (URL e token) ou Z-API nas opções.', true);
          return;
        }
        sendViaSiteApi(phone, text, buttons, r.baseUrl, r.apiKey);
      });
    }

    function renderMessageButtons(list) {
      msgListEl.innerHTML = '';
      if (!list || list.length === 0) {
        msgEmptyEl.style.display = 'block';
        return;
      }
      msgEmptyEl.style.display = 'none';
      list.forEach((msg, index) => {
        const item = document.createElement('div');
        item.className = 'crm-msg-item crm-msg-row';
        item.setAttribute('data-msg-label', (msg.label || (index + 1).toString()).toLowerCase());
        const iconCell = document.createElement('div');
        iconCell.className = 'crm-msg-row-icon';
        iconCell.innerHTML = '&#128172;';
        const labelCell = document.createElement('div');
        labelCell.className = 'crm-msg-row-label';
        labelCell.textContent = msg.label || (index + 1).toString();
        const actionsCell = document.createElement('div');
        actionsCell.className = 'crm-msg-row-actions';
        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'crm-row-btn crm-row-btn-preview';
        previewBtn.setAttribute('aria-label', 'Ver');
        previewBtn.innerHTML = '&#128269;';
        const sendBtn = document.createElement('button');
        sendBtn.type = 'button';
        sendBtn.className = 'crm-row-btn crm-row-btn-send';
        sendBtn.setAttribute('aria-label', 'Enviar');
        sendBtn.innerHTML = '&#9992;';
        const chevronBtn = document.createElement('button');
        chevronBtn.type = 'button';
        chevronBtn.className = 'crm-row-btn crm-row-btn-chevron';
        chevronBtn.innerHTML = '&#8250;';
        const previewBlock = document.createElement('div');
        previewBlock.className = 'crm-msg-preview';
        previewBlock.style.display = 'none';
        const textPreview = document.createElement('div');
        textPreview.className = 'crm-msg-preview-text';
        textPreview.textContent = (msg.text || '').trim() || '(sem texto)';
        if ((msg.buttons && msg.buttons.length) > 0) {
          const btnsPreview = document.createElement('div');
          btnsPreview.className = 'crm-msg-preview-btns';
          btnsPreview.textContent = 'Botões: ' + msg.buttons.map(function (b) { return b.title || b.id; }).join(', ');
          previewBlock.appendChild(textPreview);
          previewBlock.appendChild(btnsPreview);
        } else {
          previewBlock.appendChild(textPreview);
        }
        sendBtn.addEventListener('click', function () { sendCustomMessage(msg); });
        previewBtn.addEventListener('click', function () {
          var open = previewBlock.style.display === 'block';
          previewBlock.style.display = open ? 'none' : 'block';
        });
        chevronBtn.addEventListener('click', function () {
          var open = previewBlock.style.display === 'block';
          previewBlock.style.display = open ? 'none' : 'block';
        });
        actionsCell.appendChild(previewBtn);
        actionsCell.appendChild(sendBtn);
        actionsCell.appendChild(chevronBtn);
        item.appendChild(iconCell);
        item.appendChild(labelCell);
        item.appendChild(actionsCell);
        item.appendChild(previewBlock);
        msgListEl.appendChild(item);
      });
    }

    function loadAndRenderMessages() {
      getStoredMessages().then(renderMessageButtons);
    }

    /** Mensagem bloqueada: não enviar nem no funil nem avulsa (evita repetição e spam). */
    function isBlockedMessage(text) {
      var t = (text || '').trim();
      return t === 'Em que posso ajudar? 😊';
    }
    var funnelSending = false;
    function normalizeFunnelMessageIds(raw) {
      if (Array.isArray(raw) && raw.length > 0) return raw.slice();
      if (raw != null && typeof raw === 'string' && raw.trim() !== '') return [raw.trim()];
      return [];
    }
    function sendFunnel(funnel, messagesList) {
      if (funnelSending) {
        showQuickStatus('Aguarde: funil já está sendo enviado.', true);
        return;
      }
      var phone = getPhoneForSend();
      if (!phone) {
        syncPhoneFromPage();
        phone = getPhoneForSend();
      }
      if (!phone) {
        showStatus(statusEl, 'warning', 'Clique na conversa no WhatsApp para identificar o número.');
        return;
      }
      var ids = normalizeFunnelMessageIds(funnel && funnel.messageIds);
      if (ids.length === 0) {
        showQuickStatus('Funil sem mensagens.', true);
        return;
      }
      var map = {};
      (messagesList || []).forEach(function (m) {
        if (m && m.id != null) {
          map[String(m.id)] = m;
          map[m.id] = m;
        }
      });
      var list = [];
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var msg = map[String(id)] || map[id];
        if (msg) list.push(msg);
      }
      if (list.length === 0) {
        showQuickStatus('Nenhuma mensagem do funil encontrada.', true);
        return;
      }
      // Remover mensagem bloqueada; sem limite de quantidade. Evitar repetir texto consecutivo.
      var prevText = '';
      list = list.filter(function (msg) { return !isBlockedMessage(msg.text); }).filter(function (msg) {
        var t = (msg.text || '').trim();
        var same = t === prevText && t !== '';
        prevText = t;
        return !same;
      });
      if (list.length === 0) {
        showQuickStatus('Nenhuma mensagem válida no funil (a mensagem "Em que posso ajudar?" foi removida).', true);
        return;
      }
      var phoneToUse = getPhoneForSend();
      if (!phoneToUse) {
        showQuickStatus('Número inválido. Abra a conversa ou digite o número.', true);
        return;
      }
      lockedSendPhone = phoneToUse;
      funnelSending = true;
      showSendingStatus(formatPhone(phoneToUse));
      list.forEach(function (msg, index) {
        setTimeout(function () {
          sendCustomMessage(msg);
        }, index * FUNNEL_DELAY_MS);
      });
      setTimeout(function () {
        funnelSending = false;
        lockedSendPhone = null;
        hideSendingStatus();
        showQuickStatus('Funil enviado ✓', false);
      }, list.length * FUNNEL_DELAY_MS + 400);
    }

    function renderFunnelButtons(funnelsList, messagesList) {
      funnelListEl.innerHTML = '';
      if (!funnelsList || funnelsList.length === 0) {
        funnelEmptyEl.style.display = 'block';
        return;
      }
      funnelEmptyEl.style.display = 'none';
      funnelsList.forEach(function (funnel) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'crm-btn-funnel';
        var count = normalizeFunnelMessageIds(funnel && funnel.messageIds).length;
        btn.textContent = (funnel.name || 'Funil') + ' (' + count + ' msgs)';
        btn.addEventListener('click', function () {
          if (funnelSending) return;
          sendFunnel(funnel, messagesList);
        });
        funnelListEl.appendChild(btn);
      });
    }

    function loadAndRenderFunnels() {
      Promise.all([getStoredFunnels(), getStoredMessages()]).then(function (arr) {
        renderFunnelButtons(arr[0], arr[1]);
      });
    }

    const SIDEBAR_WIDTH = 300;

    function updatePhoneDisplay() {
      const phone = getCurrentChatPhone();
      if (phone) {
        phoneDisplay.textContent = formatPhone(phone);
      } else {
        phoneDisplay.textContent = '—';
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
    loadAndRenderFunnels();
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
      if (changes[STORAGE_KEYS.funnels]) {
        loadAndRenderFunnels();
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
      if (lockedSendPhone) return;
      var phone = getCurrentChatPhone();
      if (phone !== lastPhone) {
        lastPhone = phone;
        if (phone) {
          phoneDisplay.textContent = formatPhone(phone);
        } else {
          phoneDisplay.textContent = '—';
        }
      }
    }
    setInterval(function () {
      if (wrap.classList.contains('hidden')) return;
      syncPhoneFromPage();
    }, 200);
    document.addEventListener('click', function () {
      setTimeout(syncPhoneFromPage, 50);
      setTimeout(syncPhoneFromPage, 200);
      setTimeout(syncPhoneFromPage, 500);
    }, true);
    window.addEventListener('focus', function () { setTimeout(syncPhoneFromPage, 50); setTimeout(syncPhoneFromPage, 150); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') setTimeout(syncPhoneFromPage, 80);
    });
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
    var headerMenu = document.getElementById('plenipay-crm-header-menu');
    if (headerMenu) headerMenu.addEventListener('click', openConfigPanel);
    document.getElementById('plenipay-crm-open-panel').addEventListener('click', openConfigPanel);

    var searchInput = document.getElementById('plenipay-crm-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = (this.value || '').trim().toLowerCase();
        msgListEl.querySelectorAll('.crm-msg-row').forEach(function (row) {
          var label = (row.getAttribute('data-msg-label') || '').toLowerCase();
          row.style.display = !q || label.indexOf(q) !== -1 ? '' : 'none';
        });
      });
    }

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
    setTimeout(createSidebar, 0);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
