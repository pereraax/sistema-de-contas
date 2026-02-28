(function () {
  'use strict';

  const SIDEBAR_ID = 'plenipay-crm-sidebar';
  const STORAGE_KEYS = { baseUrl: 'plenipay_crm_base_url', apiKey: 'plenipay_crm_api_key' };

  function getStored() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEYS.baseUrl, STORAGE_KEYS.apiKey], (r) => {
        resolve({
          baseUrl: (r[STORAGE_KEYS.baseUrl] || 'https://plenipay.com').replace(/\/+$/, ''),
          apiKey: r[STORAGE_KEYS.apiKey] || '',
        });
      });
    });
  }

  /** Tenta obter o número do chat atual no WhatsApp Web (DOM ou URL). */
  function getCurrentChatPhone() {
    // 1) URL: ?phone= ou &phone= (alguns fluxos)
    const u = new URL(window.location.href);
    const fromUrl = u.searchParams.get('phone') || u.searchParams.get('ph');
    if (fromUrl) {
      const digits = fromUrl.replace(/\D/g, '');
      if (digits.length >= 10) return digits.startsWith('55') ? digits : '55' + digits;
    }

    const viewportCenter = window.innerWidth / 2;
    function digitsFromTitle(title) {
      const d = (title || '').replace(/\D/g, '');
      if (d.length < 10 || d.length > 13) return null;
      const digits = d.startsWith('55') ? d : '55' + d;
      if (digits.length >= 12 && digits.length <= 13 && /^55\d{10,11}$/.test(digits)) return digits;
      return null;
    }

    // 2) Priorizar número que está no painel da direita (conversa aberta), não na lista da esquerda
    const allSpansWithTitle = document.querySelectorAll('header span[title], [role="main"] span[title]');
    for (let i = 0; i < Math.min(allSpansWithTitle.length, 40); i++) {
      const span = allSpansWithTitle[i];
      const rect = span.getBoundingClientRect();
      if (rect.left < viewportCenter) continue; // ignorar elementos na metade esquerda (lista de chats)
      const title = (span.getAttribute('title') || '').trim();
      const digits = digitsFromTitle(title);
      if (digits) return digits;
    }

    // 3) Qualquer header (fallback)
    const mainHeader = document.querySelector('header');
    if (mainHeader) {
      const spans = mainHeader.querySelectorAll('span[title]');
      for (let i = 0; i < Math.min(spans.length, 25); i++) {
        const t = (spans[i].getAttribute('title') || '').trim();
        const digits = digitsFromTitle(t);
        if (digits) return digits;
      }
    }

    // 4) data-testid do header da conversa
    const convHeader = document.querySelector('[data-testid="conversation-info-header-chat-title"]');
    if (convHeader) {
      const title = convHeader.getAttribute('title') || convHeader.textContent || '';
      const digits = title.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 13) return digits.startsWith('55') ? digits : '55' + digits;
    }

    // 5) Título da página
    const pageTitle = document.title || '';
    const titleMatch = pageTitle.match(/(\d{10,13})/) || pageTitle.match(/\+?(\d{2})\s*(\d{4,5})[\s\-]*(\d{4})/);
    if (titleMatch) {
      const n = (titleMatch[1] + (titleMatch[2] || '') + (titleMatch[3] || '')).replace(/\D/g, '');
      if (n.length >= 10) return n.startsWith('55') ? n : '55' + n;
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
        <p>Envie as 3 mensagens de boas-vindas na conversa aberta</p>
      </div>
      <div class="crm-body">
        <div class="crm-phone-label">Conversa atual</div>
        <div class="crm-phone-value" id="plenipay-crm-phone-display">—</div>
        <button type="button" class="crm-btn-refresh" id="plenipay-crm-refresh">Atualizar número</button>
        <div class="crm-phone-hint">Se não detectou, cole o número abaixo (com DDD)</div>
        <input type="tel" class="crm-phone-input" id="plenipay-crm-phone-input" placeholder="Ex: 5511999999999" />
        <button type="button" class="crm-btn-send" id="plenipay-crm-btn-send">
          <span class="crm-btn-icon">✈</span> Enviar 3 mensagens
        </button>
        <button type="button" class="crm-btn-refresh" id="plenipay-crm-btn-test" style="margin-top:8px;width:100%;">Testar conexão com a URL</button>
        <div id="plenipay-crm-status" class="crm-status"></div>
      </div>
      <div class="crm-config-link">
        <a href="#" id="plenipay-crm-open-options">Configurar API (token e URL)</a>
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
    const btnSend = document.getElementById('plenipay-crm-btn-send');
    const statusEl = document.getElementById('plenipay-crm-status');
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

    function applySidebarMargin(visible) {
      document.body.style.marginRight = visible ? SIDEBAR_WIDTH + 'px' : '';
    }

    updatePhoneDisplay();
    setTimeout(function () {
      updatePhoneDisplay();
      lastPhone = getCurrentChatPhone();
    }, 1000);
    applySidebarMargin(true);

    // Atualizar "Conversa atual" ao trocar de chat (polling a cada 1,5 s + ao clicar na página)
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
    }, 1500);
    document.addEventListener('click', function () {
      setTimeout(syncPhoneFromPage, 400);
    }, true);

    document.getElementById('plenipay-crm-refresh').addEventListener('click', function () {
      lastPhone = getCurrentChatPhone();
      updatePhoneDisplay();
    });

    toggle.addEventListener('click', () => {
      const hidden = wrap.classList.toggle('hidden');
      toggle.innerHTML = hidden ? '▶' : '◀';
      applySidebarMargin(!hidden);
    });

    document.getElementById('plenipay-crm-open-options').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'openOptions' }).catch(() => {
        try { chrome.runtime.openOptionsPage(); } catch (_) {}
      });
    });

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

    btnSend.addEventListener('click', async () => {
      const { baseUrl, apiKey } = await getStored();
      if (!apiKey) {
        showStatus(statusEl, 'warning', null,
          'Para enviar, configure o token. ' +
          '<button type="button" data-open-options style="margin-top:8px;padding:6px 12px;background:#059669;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Abrir configuração</button>');
        return;
      }

      let phone = phoneInput.value.trim().replace(/\D/g, '') || getCurrentChatPhone();
      if (!phone) {
        showStatus(statusEl, 'warning', 'Digite o número ou abra a conversa no WhatsApp.');
        return;
      }
      if (phone.length < 10) {
        showStatus(statusEl, 'error', 'Número inválido. Use DDD + número.');
        return;
      }
      if (!phone.startsWith('55')) phone = '55' + phone;

      btnSend.disabled = true;
      showStatus(statusEl, 'warning', 'Enviando...');

      try {
        const res = await fetch(baseUrl + '/api/whatsapp/send-welcome-extension', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey,
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          showStatus(statusEl, 'success', '✓ 3 mensagens enviadas para ' + formatPhone(phone));
        } else {
          showStatus(statusEl, 'error', data.error || 'Erro ao enviar. Verifique o token e a URL.');
        }
      } catch (err) {
        const msg = (err && err.message) ? err.message : '';
        const dica = msg.includes('Failed to fetch') || msg.includes('NetworkError')
          ? 'Verifique: (1) URL nas opções (ex: https://plenipay.com, sem barra no final); (2) site no ar; (3) recarregue a extensão após mudar a URL.'
          : 'Erro de rede. Verifique a URL nas opções (https, sem barra no final) e se o site está no ar.';
        showStatus(statusEl, 'error', dica);
      }

      btnSend.disabled = false;
    });
  }

  // Só injetar a barra depois que o WhatsApp Web tiver tempo de carregar (evita travar a página)
  function init() {
    setTimeout(createSidebar, 8000);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
