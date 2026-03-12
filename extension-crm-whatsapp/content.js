(function () {
  'use strict';

  const SIDEBAR_ID = 'plenipay-crm-sidebar';
  const ACTION_BAR_WIDTH = 52;
  const SIDEBAR_WIDTH = 320 + ACTION_BAR_WIDTH;
  const STORAGE_KEYS = {
    baseUrl: 'plenipay_crm_base_url',
    apiKey: 'plenipay_crm_api_key',
    messages: 'plenipay_crm_messages',
    funnels: 'plenipay_crm_funnels',
    contacts: 'plenipay_crm_contacts',
    tags: 'plenipay_crm_tags',
  };
  const DEFAULT_TAGS = ['Cliente', 'Lead', 'Teste', 'Premium', 'Inativo'];
  const TABS = [
    { id: 'inbox', label: 'Inbox', icon: '📥' },
    { id: 'leads', label: 'Contatos leads', icon: '📋' },
    { id: 'contatos', label: 'Contatos', icon: '👥' },
    { id: 'mensagens', label: 'Mensagens', icon: '⚡' },
    { id: 'fluxos', label: 'Fluxos', icon: '🔄' },
    { id: 'tags', label: 'Tags', icon: '🏷️' },
    { id: 'config', label: 'Config', icon: '⚙️' },
  ];

  var cachedApi = { baseUrl: '', apiKey: '', at: 0 };
  var CACHE_TTL = 60000;
  var lastPhone = null;
  var inboxConversations = [];
  var inboxListObserver = null;

  function getStored(keys) {
    const k = keys || [STORAGE_KEYS.baseUrl, STORAGE_KEYS.apiKey];
    return new Promise((resolve) => {
      chrome.storage.sync.get(k, (r) => resolve(r));
    });
  }

  function getStoredMessages() {
    return getStored([STORAGE_KEYS.messages]).then((r) =>
      Array.isArray(r[STORAGE_KEYS.messages]) ? r[STORAGE_KEYS.messages] : []
    );
  }

  function getStoredFunnels() {
    return getStored([STORAGE_KEYS.funnels]).then((r) =>
      Array.isArray(r[STORAGE_KEYS.funnels]) ? r[STORAGE_KEYS.funnels] : []
    );
  }

  function getStoredContacts() {
    return getStored([STORAGE_KEYS.contacts]).then((r) =>
      Array.isArray(r[STORAGE_KEYS.contacts]) ? r[STORAGE_KEYS.contacts] : []
    );
  }

  function getStoredTags() {
    return getStored([STORAGE_KEYS.tags]).then((r) => {
      const t = r[STORAGE_KEYS.tags];
      return Array.isArray(t) && t.length ? t : DEFAULT_TAGS.slice();
    });
  }

  function setStored(key, value) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve);
    });
  }

  function extractPhoneFromText(text) {
    if (!text || typeof text !== 'string') return null;
    const d = text.replace(/\D/g, '');
    if (d.length < 10 || d.length > 13) return null;
    const digits = d.startsWith('55') ? d : '55' + d;
    if (digits.length >= 12 && digits.length <= 13 && /^55\d{10,11}$/.test(digits)) return digits;
    return null;
  }

  function normalizePhone(p) {
    const d = (p || '').replace(/\D/g, '');
    if (d.length === 10 || d.length === 11) return '55' + d;
    return d.startsWith('55') ? d : '55' + d;
  }

  function getCurrentChatPhone() {
    const listRightEdge = Math.min(320, Math.floor(window.innerWidth * 0.28));

    const u = new URL(window.location.href);
    const fromUrl = u.searchParams.get('phone') || u.searchParams.get('ph');
    if (fromUrl) {
      const digits = fromUrl.replace(/\D/g, '');
      if (digits.length >= 10) return digits.startsWith('55') ? digits : '55' + digits;
    }

    function isInConversationPanel(el) {
      if (!el || !el.getBoundingClientRect) return false;
      return el.getBoundingClientRect().left >= listRightEdge;
    }

    const dataIdCandidates = document.querySelectorAll('[data-id][data-id*="55"]');
    for (let i = 0; i < dataIdCandidates.length; i++) {
      const el = dataIdCandidates[i];
      if (!isInConversationPanel(el)) continue;
      const raw = (el.getAttribute('data-id') || '').replace(/@.*$/, '').replace(/\D/g, '');
      if (raw.length >= 12 && raw.length <= 13 && raw.startsWith('55')) return raw;
    }

    const jidCandidates = document.querySelectorAll('[data-jid]');
    for (let j = 0; j < jidCandidates.length; j++) {
      const el = jidCandidates[j];
      if (!isInConversationPanel(el)) continue;
      const jid = (el.getAttribute('data-jid') || '').replace(/@.*$/, '').replace(/\D/g, '');
      if (jid.length >= 12 && jid.length <= 13) return jid.startsWith('55') ? jid : '55' + jid;
    }

    const headers = document.querySelectorAll('header');
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (h.getBoundingClientRect().left < listRightEdge) continue;
      const fullText = (h.textContent || '').trim();
      const digits = extractPhoneFromText(fullText);
      if (digits) return digits;
    }

    const listItems = document.querySelectorAll('[role="listitem"], [data-testid="cell-frame-container"]');
    for (let i = 0; i < listItems.length; i++) {
      const el = listItems[i];
      const rect = el.getBoundingClientRect();
      if (rect.left > listRightEdge || rect.width < 50) continue;
      const isSelected = el.getAttribute('aria-selected') === 'true' || el.classList.contains('selected');
      const bg = window.getComputedStyle(el).backgroundColor;
      const looksSelected = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      if (!isSelected && !looksSelected) continue;
      const text = (el.textContent || el.getAttribute('title') || '').trim();
      const digits = extractPhoneFromText(text);
      if (digits) return digits;
      const link = el.querySelector('a[href*="phone="]');
      if (link) {
        const m = (link.getAttribute('href') || '').match(/phone=(\d{10,13})/);
        if (m && m[1]) return m[1].startsWith('55') ? m[1] : '55' + m[1];
      }
    }

    const convHeader = document.querySelector('[data-testid="conversation-info-header-chat-title"]');
    if (convHeader) {
      const raw = (convHeader.getAttribute('title') || convHeader.textContent || '').replace(/\D/g, '');
      if (raw.length >= 10) return raw.startsWith('55') ? raw : '55' + raw;
    }

    const pageTitle = document.title || '';
    const titleMatch = pageTitle.match(/(\d{10,13})/);
    if (titleMatch && titleMatch[1]) {
      const n = titleMatch[1];
      return n.startsWith('55') ? n : '55' + n;
    }

    var main = document.querySelector('[role="main"]') || document.body;
    var walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT, null, false);
    var node;
    var count = 0;
    while ((node = walker.nextNode()) && count < 300) {
      count++;
      var el = node;
      if (el.getBoundingClientRect && el.getBoundingClientRect().left < listRightEdge) continue;
      var text = (el.textContent || '').trim();
      if (text.length > 8 && text.length < 25) {
        var digits = extractPhoneFromText(text);
        if (digits) return digits;
      }
      var title = el.getAttribute('title');
      if (title) {
        var fromTitle = extractPhoneFromText(title);
        if (fromTitle) return fromTitle;
      }
    }
    return null;
  }

  function formatPhone(p) {
    const d = (p || '').replace(/\D/g, '');
    if (d.length === 13 && d.startsWith('55'))
      return '+' + d.slice(0, 2) + ' ' + d.slice(2, 4) + ' ' + d.slice(4, 9) + '-' + d.slice(9);
    if (d.length === 12 && d.startsWith('55')) return '+' + d.slice(0, 2) + ' ' + d.slice(2, 4) + ' ' + d.slice(4);
    return p || '—';
  }

  function escapeVCard(str) {
    if (!str) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  function formatPhoneForVCard(phone) {
    var tel = (phone || '').replace(/\D/g, '');
    if (tel.length === 11) return '+55' + tel;
    if (tel.length === 12 || tel.length === 13) return '+' + tel;
    return phone;
  }

  function downloadContactVCard(name, phone) {
    var tel = formatPhoneForVCard(phone);
    var fn = escapeVCard(name);
    var vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:' + fn + '\r\nN:' + fn + ';;;;\r\nTEL;TYPE=CELL:' + tel + '\r\nEND:VCARD\r\n';
    var blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (name || 'contato').replace(/[^\w\s-]/g, '').trim().slice(0, 30) + '.vcf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadAllContactsVCard(contacts) {
    if (!contacts || !contacts.length) return;
    var parts = [];
    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      var name = (c.name || formatPhone(c.phone) || 'Contato').trim();
      var tel = formatPhoneForVCard(c.phone);
      var fn = escapeVCard(name);
      parts.push('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:' + fn + '\r\nN:' + fn + ';;;;\r\nTEL;TYPE=CELL:' + tel + '\r\nEND:VCARD\r\n');
    }
    var vcard = parts.join('');
    var blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'contatos-leads-plenipay.vcf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clickWhatsAppAddContact() {
    var listRightEdge = Math.min(380, Math.floor(window.innerWidth * 0.35));
    var addTexts = ['adicionar aos contatos', 'adicionar contato', 'add to contacts', 'add contact', 'salvar contato', 'save contact'];
    var byAria = document.querySelectorAll('[aria-label], [data-testid]');
    for (var i = 0; i < byAria.length; i++) {
      var el = byAria[i];
      var rect = el.getBoundingClientRect();
      if (rect.left < listRightEdge || rect.width < 20) continue;
      var label = ((el.getAttribute('aria-label') || el.getAttribute('data-testid') || '') + ' ' + (el.textContent || '')).toLowerCase();
      for (var j = 0; j < addTexts.length; j++) {
        if (label.indexOf(addTexts[j]) !== -1) {
          el.click();
          return true;
        }
      }
    }
    var clickables = document.querySelectorAll('button, [role="button"], [role="menuitem"]');
    for (i = 0; i < clickables.length; i++) {
      el = clickables[i];
      rect = el.getBoundingClientRect();
      if (rect.left < listRightEdge || rect.width < 60) continue;
      var text = (el.textContent || '').trim().toLowerCase();
      if (text.length > 2 && text.length < 60) {
        for (j = 0; j < addTexts.length; j++) {
          if (text.indexOf(addTexts[j]) !== -1) {
            el.click();
            return true;
          }
        }
        if (text === 'adicionar' || text === 'add') {
          el.click();
          return true;
        }
      }
    }
    return false;
  }

  function getContactFromDOM() {
    var phone = getCurrentChatPhone();
    if (!phone && lastPhone) phone = lastPhone;
    if (!phone) return null;
    const listRightEdge = Math.min(380, Math.floor(window.innerWidth * 0.35));
    let name = '';
    let photo = '';

    var header = document.querySelector('header');
    if (header && header.getBoundingClientRect().left >= listRightEdge) {
      var titleEl = header.querySelector('[data-testid="conversation-info-header-chat-title"]') || header.querySelector('span[title]') || header;
      name = (titleEl && (titleEl.getAttribute('title') || titleEl.textContent || '').trim()) || '';
      var img = header.querySelector('img[src]');
      if (img && img.src) photo = img.src;
    }
    if (!name) {
      titleEl = document.querySelector('[data-testid="conversation-info-header-chat-title"]');
      if (titleEl) name = (titleEl.getAttribute('title') || titleEl.textContent || '').trim();
    }
    if (!photo || !name) {
      var main = document.querySelector('[role="main"]');
      if (main) {
        var imgs = main.querySelectorAll('img[src]');
        for (var i = 0; i < imgs.length; i++) {
          var r = imgs[i].getBoundingClientRect();
          if (r.left >= listRightEdge && r.width >= 40 && r.width <= 200 && r.height >= 40) {
            photo = imgs[i].src;
            break;
          }
        }
      }
    }
    return { phone: normalizePhone(phone), name: name || formatPhone(phone), photo: photo || '' };
  }

  function upsertContact(contact) {
    return getStoredContacts().then((list) => {
      const id = contact.phone || 'c' + Date.now();
      const existing = list.find((c) => normalizePhone(c.phone) === normalizePhone(contact.phone));
      const now = new Date().toISOString();
      const entry = {
        id: existing ? existing.id : id,
        phone: normalizePhone(contact.phone),
        name: contact.name || existing?.name || formatPhone(contact.phone),
        photo: contact.photo || existing?.photo || '',
        lastInteraction: now,
        tags: existing ? (existing.tags || []) : [],
        isFavorite: existing ? !!existing.isFavorite : false,
        isArchived: existing ? !!existing.isArchived : false,
      };
      const next = list.filter((c) => normalizePhone(c.phone) !== entry.phone);
      next.push(entry);
      return setStored(STORAGE_KEYS.contacts, next).then(() => entry);
    });
  }

  function sendContactToApi(contact) {
    getStored().then((r) => {
      const baseUrl = (r[STORAGE_KEYS.baseUrl] || '').replace(/\/+$/, '');
      const apiKey = r[STORAGE_KEYS.apiKey] || '';
      if (!baseUrl || !apiKey) return;
      const url = baseUrl + '/api/whatsapp/sync-contact-extension';
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey, 'X-API-Key': apiKey },
        body: JSON.stringify({ phone: contact.phone, name: contact.name, photo: contact.photo }),
      }).catch(() => {});
    });
  }

  function collectInboxFromDOM() {
    const listRightEdge = Math.min(420, Math.floor(window.innerWidth * 0.35));
    const out = [];
    const items = document.querySelectorAll('[role="listitem"], [data-testid="cell-frame-container"], [role="gridcell"]');
    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      const rect = el.getBoundingClientRect();
      if (rect.left > listRightEdge || rect.width < 80 || rect.height < 40) continue;
      const img = el.querySelector('img[src]');
      const spans = el.querySelectorAll('span');
      let name = '';
      let preview = '';
      let time = '';
      let unread = false;
      for (let s = 0; s < spans.length; s++) {
        const t = (spans[s].textContent || '').trim();
        if (t.length > 0 && t.length < 30 && !time && /^[\d:]+$/.test(t)) time = t;
        else if (t.length > 2 && t.length < 80 && !preview) preview = t;
        else if (t.length > 0 && t.length < 50 && !name && !/\d{10,}/.test(t)) name = t;
      }
      const title = el.getAttribute('title') || el.querySelector('[title]');
      if (title && typeof title === 'object') name = (title.getAttribute && title.getAttribute('title')) || name;
      else if (typeof title === 'string') name = title || name;
      var phone = extractPhoneFromText(el.textContent || '') || extractPhoneFromText(name || '');
      if (!phone) {
        var dataIdEl = el.querySelector('[data-id]') || el.closest('[data-id]');
        if (dataIdEl) {
          var raw = (dataIdEl.getAttribute('data-id') || '').replace(/@.*$/, '').replace(/\D/g, '');
          if (raw.length >= 12 && raw.length <= 13) phone = raw.startsWith('55') ? raw : '55' + raw;
        }
        if (!phone) {
          var dataJidEl = el.querySelector('[data-jid]') || el.closest('[data-jid]');
          if (dataJidEl) {
            raw = (dataJidEl.getAttribute('data-jid') || '').replace(/@.*$/, '').replace(/\D/g, '');
            if (raw.length >= 12 && raw.length <= 13) phone = raw.startsWith('55') ? raw : '55' + raw;
          }
        }
        if (!phone) {
          var link = el.querySelector('a[href*="phone="]');
          if (link) {
            var m = (link.getAttribute('href') || '').match(/phone=(\d{10,13})/);
            if (m && m[1]) phone = m[1].startsWith('55') ? m[1] : '55' + m[1];
          }
        }
      }
      if (!name && !phone) continue;
      const unreadEl = el.querySelector('[data-testid="icon-unread-count"], .unread, [aria-label*="não lida"], [data-testid="unread"]');
      const unreadBadge = el.querySelector('[data-testid="icon-unread-count"]');
      unread = !!(unreadEl || (unreadBadge && (unreadBadge.textContent || '').trim() !== ''));
      var photo = (img && img.src) ? img.src : '';
      out.push({
        el,
        name: name || (phone ? formatPhone(phone) : 'Contato'),
        preview: preview || '—',
        time: time || '—',
        unread,
        phone: phone || null,
        photo: photo,
      });
    }
    return out;
  }

  function syncAllContactsFromList() {
    var list = collectInboxFromDOM();
    var byPhone = {};
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var phone = item.phone ? normalizePhone(item.phone) : null;
      if (!phone) continue;
      if (byPhone[phone]) continue;
      byPhone[phone] = true;
      var contact = {
        phone: phone,
        name: (item.name || '').trim() || formatPhone(phone),
        photo: item.photo || '',
      };
      upsertContact(contact).then(function (c) { if (c) sendContactToApi(c); }).catch(function () {});
    }
  }

  function showStatus(container, type, text) {
    if (!container) return;
    let statusEl = container.querySelector('.crm-status-msg');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = 'crm-status-msg';
      container.appendChild(statusEl);
    }
    statusEl.textContent = text;
    statusEl.className = 'crm-status-msg ' + type;
    statusEl.style.display = 'block';
    setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
  }

  function openOptions() {
    chrome.runtime.sendMessage({ action: 'openOptions' }).catch(() => {});
    try { chrome.runtime.openOptionsPage(); } catch (_) {}
  }

  function createSidebar() {
    if (document.getElementById(SIDEBAR_ID)) return;

    const wrap = document.createElement('div');
    wrap.id = SIDEBAR_ID;
    wrap.innerHTML = `
      <div class="crm-header-zap">
        <div class="crm-header-brand">
          <span class="crm-brand-main">PleniPay</span>
          <span class="crm-brand-sub">CRM</span>
        </div>
        <a href="#" class="crm-header-config" id="plenipay-crm-open-options" title="Abrir configuração completa">⚙️</a>
      </div>
      <nav class="crm-tabs" role="tablist">
        ${TABS.map((t) => `<button type="button" class="crm-tab" data-tab="${t.id}" role="tab" title="${t.label}"><span class="crm-tab-icon">${t.icon}</span><span class="crm-tab-label">${t.label}</span></button>`).join('')}
      </nav>
      <div class="crm-phone-bar" title="Conversa atual no WhatsApp">
        <span class="crm-phone-label">Conversa:</span>
        <span class="crm-phone-value" id="plenipay-crm-phone-display">—</span>
      </div>
      <div class="crm-body-with-actions">
        <div class="crm-vertical-action-bar" role="toolbar">
          <button type="button" class="crm-action-bar-btn" id="crm-btn-save-lead" title="Salvar contato como Lead PleniPay + data do dia">
            <span class="crm-action-bar-icon">👤</span>
            <span class="crm-action-bar-label">Salvar lead</span>
          </button>
          <button type="button" class="crm-action-bar-btn" id="crm-btn-add-tag" title="Adicionar tag ao contato atual">
            <span class="crm-action-bar-icon">🏷️</span>
            <span class="crm-action-bar-label">Tag...</span>
          </button>
        </div>
        <div class="crm-views">
        <div id="view-inbox" class="crm-view" data-view="inbox"></div>
        <div id="view-leads" class="crm-view" data-view="leads"></div>
        <div id="view-contatos" class="crm-view" data-view="contatos"></div>
        <div id="view-mensagens" class="crm-view" data-view="mensagens"></div>
        <div id="view-fluxos" class="crm-view" data-view="fluxos"></div>
        <div id="view-tags" class="crm-view" data-view="tags"></div>
        <div id="view-config" class="crm-view" data-view="config"></div>
        </div>
      </div>
      <div id="plenipay-crm-status" class="crm-status" style="display:none;">
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

    const views = wrap.querySelectorAll('.crm-view');
    const tabBtns = wrap.querySelectorAll('.crm-tab');
    const phoneDisplay = document.getElementById('plenipay-crm-phone-display');
    const statusEl = document.getElementById('plenipay-crm-status');

    function showTab(tabId) {
      tabBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
      views.forEach((v) => v.classList.toggle('active', v.getAttribute('data-view') === tabId));
      if (tabId === 'inbox') renderInbox();
      else if (tabId === 'leads') renderLeads();
      else if (tabId === 'contatos') renderContatos();
      else if (tabId === 'mensagens') renderMensagens();
      else if (tabId === 'fluxos') renderFluxos();
      else if (tabId === 'tags') renderTags();
      else if (tabId === 'config') renderConfig();
    }

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => showTab(btn.getAttribute('data-tab')));
    });

    document.getElementById('plenipay-crm-open-options').addEventListener('click', (e) => {
      e.preventDefault();
      openOptions();
    });

    function formatDateForLead() {
      const d = new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return day + '/' + month + '/' + year;
    }

    document.getElementById('crm-btn-save-lead').addEventListener('click', () => {
      const contact = getContactFromDOM();
      if (!contact || !contact.phone) {
        showQuickStatus('Abra uma conversa no WhatsApp primeiro.', true);
        return;
      }
      var addedInWhatsApp = clickWhatsAppAddContact();
      const leadName = 'Lead PleniPay ' + formatDateForLead();
      downloadContactVCard(leadName, contact.phone);
      getStoredContacts().then((list) => {
        const existing = list.find((c) => normalizePhone(c.phone) === normalizePhone(contact.phone));
        const tags = existing && existing.tags && existing.tags.length ? existing.tags : [];
        const nextTags = tags.indexOf('Lead') >= 0 ? tags : tags.concat('Lead');
        const entry = {
          id: existing ? existing.id : contact.phone,
          phone: normalizePhone(contact.phone),
          name: leadName,
          photo: contact.photo || (existing && existing.photo) || '',
          lastInteraction: new Date().toISOString(),
          tags: nextTags,
          isFavorite: existing ? !!existing.isFavorite : false,
          isArchived: existing ? !!existing.isArchived : false,
        };
        const next = list.filter((c) => normalizePhone(c.phone) !== entry.phone);
        next.push(entry);
        setStored(STORAGE_KEYS.contacts, next).then(() => {
          sendContactToApi(entry);
          var msg = 'Salvo na lista e arquivo .vcf baixado — abra no celular para adicionar na agenda';
          if (addedInWhatsApp) msg = 'Adicionado no WhatsApp, salvo na lista e .vcf baixado';
          showQuickStatus(msg, false);
        });
      });
    });

    let tagPopover = null;
    document.getElementById('crm-btn-add-tag').addEventListener('click', (e) => {
      const phone = getCurrentChatPhone();
      if (!phone) {
        showQuickStatus('Abra uma conversa para adicionar tag.', true);
        return;
      }
      if (tagPopover && tagPopover.parentNode) {
        tagPopover.remove();
        tagPopover = null;
        return;
      }
      const btn = e.currentTarget;
      getStoredTags().then((tags) => {
        getStoredContacts().then((contacts) => {
          const normalized = normalizePhone(phone);
          const c = contacts.find((x) => normalizePhone(x.phone) === normalized);
          const contactTags = (c && c.tags) ? c.tags : [];
          tagPopover = document.createElement('div');
          tagPopover.className = 'crm-tag-popover';
          tagPopover.innerHTML = '<div class="crm-tag-popover-title">Adicionar tag</div><div class="crm-tag-popover-list"></div>';
          const listEl = tagPopover.querySelector('.crm-tag-popover-list');
          tags.forEach((t) => {
            const on = contactTags.includes(t);
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'crm-tag-popover-item' + (on ? ' on' : '');
            item.textContent = t;
            item.addEventListener('click', () => {
              const nextTags = on ? contactTags.filter((x) => x !== t) : contactTags.concat(t);
              const next = contacts.filter((x) => normalizePhone(x.phone) !== normalized);
              const updated = c ? { ...c, tags: nextTags } : { id: normalized, phone: normalized, name: '', photo: '', lastInteraction: new Date().toISOString(), tags: nextTags };
              next.push(updated);
              setStored(STORAGE_KEYS.contacts, next).then(() => {
                tagPopover.remove();
                tagPopover = null;
                showQuickStatus('Tag atualizada.', false);
              });
            });
            listEl.appendChild(item);
          });
          const bodyWrap = wrap.querySelector('.crm-body-with-actions');
          bodyWrap.appendChild(tagPopover);
          const rect = btn.getBoundingClientRect();
          const refRect = bodyWrap.getBoundingClientRect();
          tagPopover.style.left = (rect.right - refRect.left + 6) + 'px';
          tagPopover.style.top = (rect.top - refRect.top) + 'px';
          document.addEventListener('click', function closeTagPopover(ev) {
            if (tagPopover && !tagPopover.contains(ev.target) && ev.target !== btn) {
              document.removeEventListener('click', closeTagPopover);
              if (tagPopover.parentNode) tagPopover.remove();
              tagPopover = null;
            }
          }, true);
        });
      });
    });

    function showQuickStatus(text, isError) {
      if (!statusEl) return;
      const txt = statusEl.querySelector('.crm-status-text');
      if (txt) txt.textContent = text;
      statusEl.className = 'crm-status ' + (isError ? 'error' : 'success');
      statusEl.style.display = 'block';
      setTimeout(() => { statusEl.style.display = 'none'; }, 2800);
    }

    function getPhoneForSend() {
      let phone = getCurrentChatPhone();
      if (!phone) phone = lastPhone;
      if (!phone || phone.length < 10) return null;
      return normalizePhone(phone);
    }

    function getApi() {
      if (cachedApi.apiKey && Date.now() - cachedApi.at < CACHE_TTL)
        return Promise.resolve({ baseUrl: cachedApi.baseUrl, apiKey: cachedApi.apiKey });
      return getStored().then((r) => {
        cachedApi.baseUrl = r[STORAGE_KEYS.baseUrl] || '';
        cachedApi.apiKey = r[STORAGE_KEYS.apiKey] || '';
        cachedApi.at = Date.now();
        return { baseUrl: cachedApi.baseUrl, apiKey: cachedApi.apiKey };
      });
    }

    function sendViaApi(phone, text, buttons) {
      const base = (cachedApi.baseUrl || '').replace(/\/+$/, '');
      const url = base + '/api/whatsapp/send-custom-extension';
      const payload = { phone, text, buttons: buttons || [] };
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cachedApi.apiKey, 'X-API-Key': cachedApi.apiKey },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json().catch(() => ({})))
        .then((data) => {
          if (data && data.success) showQuickStatus('Enviada ✓', false);
          else showQuickStatus((data && data.error) || 'Erro ao enviar', true);
        })
        .catch(() => showQuickStatus('Erro de rede', true));
    }

    function sendMessage(msg) {
      const phone = getPhoneForSend();
      if (!phone) {
        showQuickStatus('Abra uma conversa no WhatsApp primeiro.', true);
        return;
      }
      const text = (msg.text || '').trim();
      const buttons = (msg.buttons && msg.buttons.length) ? msg.buttons : undefined;
      getApi().then((r) => {
        if (r.baseUrl && r.apiKey) {
          cachedApi.baseUrl = r.baseUrl;
          cachedApi.apiKey = r.apiKey;
          cachedApi.at = Date.now();
          sendViaApi(phone, text, buttons);
        } else {
          showQuickStatus('Configure API em Configurações.', true);
        }
      });
    }

    function renderInbox() {
      const container = document.getElementById('view-inbox');
      container.innerHTML = '';
      const filterRow = document.createElement('div');
      filterRow.className = 'crm-filter-row';
      const filters = ['Não respondidos', 'Todos', 'Novos', 'Ativas', 'Favoritos', 'Arquivados'];
      let currentFilter = 'Não respondidos';
      filters.forEach((f) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'crm-filter-btn' + (f === currentFilter ? ' active' : '');
        btn.textContent = f;
        btn.addEventListener('click', () => {
          currentFilter = f;
          filterRow.querySelectorAll('.crm-filter-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          renderInboxList(container, currentFilter);
        });
        filterRow.appendChild(btn);
      });
      container.appendChild(filterRow);

      const listWrap = document.createElement('div');
      listWrap.className = 'crm-inbox-list';
      container.appendChild(listWrap);

      function renderInboxList(cont, filter) {
        listWrap.innerHTML = '';
        const list = collectInboxFromDOM();
        inboxConversations = list;
        let filtered = list;
        getStoredContacts().then((contacts) => {
          if (filter === 'Não respondidos') filtered = list.filter((c) => c.unread);
          else if (filter === 'Favoritos') filtered = list.filter((c) => contacts.some((x) => x.isFavorite && normalizePhone(x.phone) === (c.phone ? normalizePhone(c.phone) : '')));
          else if (filter === 'Arquivados') filtered = list.filter((c) => contacts.some((x) => x.isArchived && normalizePhone(x.phone) === (c.phone ? normalizePhone(c.phone) : '')));
          else if (filter === 'Novos') filtered = list.filter((c) => !c.phone || !contacts.find((x) => normalizePhone(x.phone) === normalizePhone(c.phone)));
          else if (filter === 'Ativas') filtered = list.filter((c) => c.phone && contacts.find((x) => normalizePhone(x.phone) === normalizePhone(c.phone)));
          if (filtered.length === 0) {
            const msg = filter === 'Não respondidos' ? 'Nenhuma conversa não respondida.' : 'Nenhuma conversa encontrada.';
            listWrap.innerHTML = '<p class="crm-empty">' + msg + '</p>';
            return;
          }
          filtered.forEach((conv) => {
            const card = document.createElement('div');
            card.className = 'crm-inbox-card' + (conv.unread ? ' unread' : '');
            const contact = conv.phone ? contacts.find((c) => normalizePhone(c.phone) === normalizePhone(conv.phone)) : null;
            const photo = (contact && contact.photo) ? contact.photo : '';
            card.innerHTML = `
              <div class="crm-inbox-avatar">${photo ? `<img src="${photo}" alt="" />` : '<span class="crm-avatar-placeholder">' + (conv.name.charAt(0).toUpperCase()) + '</span>'}</div>
              <div class="crm-inbox-info">
                <div class="crm-inbox-name">${escapeHtml(conv.name)}</div>
                <div class="crm-inbox-preview">${escapeHtml(conv.preview)}</div>
                <div class="crm-inbox-meta">${escapeHtml(conv.time)}</div>
              </div>
            `;
            card.addEventListener('click', () => {
              if (conv.el && conv.el.click) conv.el.click();
              showContactDetail(conv, contact);
            });
            listWrap.appendChild(card);
          });
        });
      }

      function showContactDetail(conv, contact) {
        listWrap.style.display = 'none';
        filterRow.style.display = 'none';
        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'crm-btn-back';
        backBtn.textContent = '← Voltar';
        backBtn.addEventListener('click', () => {
          detail.remove();
          listWrap.style.display = '';
          filterRow.style.display = '';
        });
        const detail = document.createElement('div');
        detail.className = 'crm-contact-detail';
        const phone = conv.phone || (contact && contact.phone);
        detail.appendChild(backBtn);
        detail.innerHTML += `
          <div class="crm-detail-avatar">${(contact && contact.photo) ? `<img src="${contact.photo}" alt="" />` : '<span class="crm-avatar-placeholder">' + (conv.name.charAt(0).toUpperCase()) + '</span>'}</div>
          <div class="crm-detail-name">${escapeHtml(conv.name)}</div>
          <div class="crm-detail-phone">${phone ? formatPhone(phone) : '—'}</div>
          <div class="crm-detail-tags" id="detail-tags"></div>
          <div class="crm-detail-actions">
            <button type="button" class="crm-action-btn" data-action="msg">Mensagens rápidas</button>
            <button type="button" class="crm-action-btn" data-action="fluxo">Enviar fluxo</button>
          </div>
        `;
        container.appendChild(detail);
        const tagsEl = detail.querySelector('#detail-tags');
        if (contact && contact.tags && contact.tags.length) {
          tagsEl.innerHTML = contact.tags.map((t) => '<span class="crm-tag">' + escapeHtml(t) + '</span>').join('');
        }
        detail.querySelector('[data-action="msg"]').addEventListener('click', () => showTab('mensagens'));
        detail.querySelector('[data-action="fluxo"]').addEventListener('click', () => showTab('fluxos'));
      }

      renderInboxList(container, currentFilter);
    }

    function renderLeads() {
      const container = document.getElementById('view-leads');
      container.innerHTML = `
        <div class="crm-section-title">Contatos leads</div>
        <p class="crm-hint crm-leads-hint">Cada conversa que você abre no WhatsApp é adicionada automaticamente nesta lista, com o nome do contato.</p>
        <button type="button" id="crm-export-leads" class="crm-btn-export-leads">Exportar lista (.vcf)</button>
        <div class="crm-leads-list" id="leads-list"></div>
        <p class="crm-empty-hint" id="leads-empty" style="display:none;">Nenhum contato ainda. Abra conversas no WhatsApp para preencher a lista.</p>
      `;
      const listEl = container.querySelector('#leads-list');
      const emptyEl = container.querySelector('#leads-empty');
      const exportBtn = container.querySelector('#crm-export-leads');

      function render() {
        getStoredContacts().then((contacts) => {
          listEl.innerHTML = '';
          if (!contacts || !contacts.length) {
            emptyEl.style.display = 'block';
            exportBtn.style.display = 'none';
            return;
          }
          emptyEl.style.display = 'none';
          exportBtn.style.display = 'block';
          contacts.forEach((c) => {
            const card = document.createElement('div');
            card.className = 'crm-lead-card';
            card.innerHTML = `
              <div class="crm-inbox-avatar">${c.photo ? '<img src="' + c.photo + '" alt="" />' : '<span class="crm-avatar-placeholder">' + (c.name || '').charAt(0).toUpperCase() + '</span>'}</div>
              <div class="crm-lead-info">
                <div class="crm-lead-name">${escapeHtml(c.name || formatPhone(c.phone))}</div>
                <div class="crm-lead-phone">${formatPhone(c.phone)}</div>
              </div>
            `;
            listEl.appendChild(card);
          });
        });
      }

      exportBtn.addEventListener('click', () => {
        getStoredContacts().then((contacts) => {
          if (!contacts || !contacts.length) {
            showQuickStatus('Nenhum contato para exportar.', true);
            return;
          }
          downloadAllContactsVCard(contacts);
          showQuickStatus('Lista exportada: contatos-leads-plenipay.vcf', false);
        });
      });

      render();
    }

    function renderContatos() {
      const container = document.getElementById('view-contatos');
      container.innerHTML = '<div class="crm-search-wrap"><input type="text" class="crm-input-search" id="contatos-search" placeholder="Buscar contato..." /></div><div class="crm-tag-filter-wrap"><select id="contatos-tag-filter"><option value="">Todas as tags</option></select></div><div class="crm-contatos-list" id="contatos-list"></div>';
      const searchInp = container.querySelector('#contatos-search');
      const tagSelect = container.querySelector('#contatos-tag-filter');
      const listEl = container.querySelector('#contatos-list');

      function render() {
        const q = (searchInp.value || '').trim().toLowerCase();
        const tagFilter = (tagSelect.value || '').trim();
        getStoredContacts().then((contacts) => {
          getStoredTags().then((tags) => {
            tagSelect.innerHTML = '<option value="">Todas as tags</option>' + tags.map((t) => '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>').join('');
            if (tagFilter) tagSelect.value = tagFilter;
            let list = contacts;
            if (tagFilter) list = list.filter((c) => (c.tags || []).includes(tagFilter));
            if (q) list = list.filter((c) => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q));
            listEl.innerHTML = '';
            if (list.length === 0) {
              listEl.innerHTML = '<p class="crm-empty">Nenhum contato.</p>';
              return;
            }
            list.forEach((c) => {
              const card = document.createElement('div');
              card.className = 'crm-contato-card';
              card.innerHTML = `
                <div class="crm-inbox-avatar">${c.photo ? '<img src="' + c.photo + '" alt="" />' : '<span class="crm-avatar-placeholder">' + (c.name || '').charAt(0).toUpperCase() + '</span>'}</div>
                <div class="crm-contato-info">
                  <div class="crm-contato-name">${escapeHtml(c.name || formatPhone(c.phone))}</div>
                  <div class="crm-contato-phone">${formatPhone(c.phone)}</div>
                  <div class="crm-contato-tags">${(c.tags || []).map((t) => '<span class="crm-tag">' + escapeHtml(t) + '</span>').join('')}</div>
                </div>
              `;
              listEl.appendChild(card);
            });
          });
        });
      }

      searchInp.addEventListener('input', render);
      tagSelect.addEventListener('change', render);
      getStoredTags().then((tags) => {
        tagSelect.innerHTML = '<option value="">Todas as tags</option>' + tags.map((t) => '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>').join('');
      });
      render();
    }

    function renderMensagens() {
      const container = document.getElementById('view-mensagens');
      container.innerHTML = '<div class="crm-search-wrap"><input type="text" class="crm-input-search" id="msg-search" placeholder="Buscar mensagem..." /></div><div class="crm-msg-list" id="plenipay-crm-msg-list"></div><p class="crm-empty-hint" id="plenipay-crm-msg-empty" style="display:none;">Nenhuma mensagem. Crie em Configurações (ícone engrenagem).</p>';
      const listEl = container.querySelector('#plenipay-crm-msg-list');
      const emptyEl = container.querySelector('#plenipay-crm-msg-empty');
      const searchInp = container.querySelector('#msg-search');

      function render(list) {
        const q = (searchInp.value || '').trim().toLowerCase();
        let show = list || [];
        if (q) show = show.filter((m) => ((m.label || '') + (m.text || '')).toLowerCase().includes(q));
        listEl.innerHTML = '';
        if (!show.length) {
          emptyEl.style.display = 'block';
          return;
        }
        emptyEl.style.display = 'none';
        show.forEach((msg) => {
          const item = document.createElement('div');
          item.className = 'crm-msg-item';
          item.innerHTML = `
            <div class="crm-msg-row-icon">💬</div>
            <div class="crm-msg-row-label">${escapeHtml(msg.label || '(sem nome)')}</div>
            <div class="crm-msg-row-actions">
              <button type="button" class="crm-row-btn crm-row-btn-send" title="Enviar">📤</button>
            </div>
          `;
          item.querySelector('.crm-row-btn-send').addEventListener('click', () => sendMessage(msg));
          listEl.appendChild(item);
        });
      }

      searchInp.addEventListener('input', () => getStoredMessages().then(render));
      getStoredMessages().then(render);
    }

    function renderFluxos() {
      const container = document.getElementById('view-fluxos');
      container.innerHTML = '<div class="crm-section-title">Fluxos (sequência de mensagens)</div><div class="crm-fluxos-list" id="fluxos-list"></div><p class="crm-empty-hint" id="fluxos-empty">Nenhum fluxo. Crie na página de configuração.</p>';
      const listEl = container.querySelector('#fluxos-list');
      const emptyEl = container.querySelector('#fluxos-empty');

      function normalizeIds(raw) {
        if (Array.isArray(raw) && raw.length) return raw.slice();
        if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
        return [];
      }

      function sendFunnel(funnel, messagesList) {
        const phone = getPhoneForSend();
        if (!phone) {
          showQuickStatus('Abra uma conversa no WhatsApp.', true);
          return;
        }
        const ids = normalizeIds(funnel.messageIds);
        const map = {};
        (messagesList || []).forEach((m) => { if (m && m.id) map[m.id] = m; });
        const list = ids.map((id) => map[id]).filter(Boolean);
        if (!list.length) {
          showQuickStatus('Fluxo sem mensagens.', true);
          return;
        }
        let delay = 0;
        list.forEach((msg) => {
          setTimeout(() => sendMessage(msg), delay);
          delay += 800;
        });
        setTimeout(() => showQuickStatus('Fluxo enviado ✓', false), delay + 400);
      }

      Promise.all([getStoredFunnels(), getStoredMessages()]).then(([funnels, messages]) => {
        listEl.innerHTML = '';
        if (!funnels || !funnels.length) {
          emptyEl.style.display = 'block';
          return;
        }
        emptyEl.style.display = 'none';
        funnels.forEach((f) => {
          const count = normalizeIds(f.messageIds).length;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'crm-btn-funnel';
          btn.textContent = (f.name || 'Fluxo') + ' (' + count + ' msgs)';
          btn.addEventListener('click', () => sendFunnel(f, messages));
          listEl.appendChild(btn);
        });
      });
    }

    function renderTags() {
      const container = document.getElementById('view-tags');
      container.innerHTML = '<div class="crm-section-title">Tags padrão (para contatos)</div><div class="crm-tags-list" id="tags-list"></div><div class="crm-current-contact-tags" id="current-contact-tags"><div class="crm-section-title">Contato atual</div><p id="current-contact-info">Abra uma conversa para ver/editar tags.</p><div id="current-tags-wrap"></div></div>';
      const listEl = container.querySelector('#tags-list');
      const currentWrap = container.querySelector('#current-tags-wrap');
      const currentInfo = container.querySelector('#current-contact-info');

      getStoredTags().then((tags) => {
        listEl.innerHTML = tags.map((t) => '<span class="crm-tag">' + escapeHtml(t) + '</span>').join('');
      });

      function updateCurrentContact() {
        const phone = getCurrentChatPhone();
        if (!phone) {
          currentInfo.textContent = 'Abra uma conversa para ver/editar tags.';
          currentWrap.innerHTML = '';
          return;
        }
        const normalized = normalizePhone(phone);
        getStoredContacts().then((contacts) => {
          const c = contacts.find((x) => normalizePhone(x.phone) === normalized);
          currentInfo.textContent = (c && c.name) ? c.name + ' — ' + formatPhone(phone) : formatPhone(phone);
          getStoredTags().then((tagList) => {
            const contactTags = (c && c.tags) ? c.tags : [];
            currentWrap.innerHTML = tagList.map((t) => {
              const on = contactTags.includes(t);
              return '<button type="button" class="crm-tag-toggle' + (on ? ' on' : '') + '" data-tag="' + escapeHtml(t) + '">' + escapeHtml(t) + '</button>';
            }).join('');
            currentWrap.querySelectorAll('.crm-tag-toggle').forEach((btn) => {
              btn.addEventListener('click', () => {
                const tag = btn.getAttribute('data-tag');
                const nextTags = contactTags.includes(tag) ? contactTags.filter((x) => x !== tag) : contactTags.concat(tag);
                const next = contacts.filter((x) => normalizePhone(x.phone) !== normalized);
                const updated = c ? { ...c, tags: nextTags } : { id: normalized, phone: normalized, name: '', photo: '', lastInteraction: new Date().toISOString(), tags: nextTags };
                next.push(updated);
                setStored(STORAGE_KEYS.contacts, next).then(() => updateCurrentContact());
              });
            });
          });
        });
      }

      updateCurrentContact();
      setInterval(updateCurrentContact, 2000);
    }

    function renderConfig() {
      const container = document.getElementById('view-config');
      container.innerHTML = `
        <div class="crm-config-card">
          <h3 class="crm-config-title">API PleniPay</h3>
          <p class="crm-hint">Conectar à API para enviar mensagens e sincronizar contatos.</p>
          <label>URL do site</label>
          <input type="url" id="config-baseUrl" placeholder="https://plenipay.com" />
          <label>Token (API Key)</label>
          <input type="password" id="config-apiKey" placeholder="Token do servidor" />
          <button type="button" id="config-save" class="crm-btn-primary">Salvar</button>
          <button type="button" id="config-test" class="crm-btn-secondary">Testar conexão</button>
        </div>
        <div class="crm-config-card">
          <h3 class="crm-config-title">Sincronização</h3>
          <p class="crm-hint">O contato da conversa aberta é salvo automaticamente e pode ser enviado à API.</p>
          <button type="button" id="config-sync-now" class="crm-btn-secondary">Sincronizar contato atual</button>
        </div>
        <a href="#" id="config-open-full" class="crm-link">Abrir configuração completa (mensagens e fluxos) →</a>
      `;

      getStored().then((r) => {
        container.querySelector('#config-baseUrl').value = r[STORAGE_KEYS.baseUrl] || 'https://plenipay.com';
        container.querySelector('#config-apiKey').value = r[STORAGE_KEYS.apiKey] || '';
      });

      container.querySelector('#config-save').addEventListener('click', () => {
        const baseUrl = (container.querySelector('#config-baseUrl').value || '').trim().replace(/\/+$/, '') || 'https://plenipay.com';
        const apiKey = (container.querySelector('#config-apiKey').value || '').trim();
        setStored(STORAGE_KEYS.baseUrl, baseUrl);
        setStored(STORAGE_KEYS.apiKey, apiKey);
        cachedApi.baseUrl = baseUrl;
        cachedApi.apiKey = apiKey;
        cachedApi.at = Date.now();
        showQuickStatus('Configuração salva.', false);
      });

      container.querySelector('#config-test').addEventListener('click', async () => {
        const baseUrl = (container.querySelector('#config-baseUrl').value || '').trim().replace(/\/+$/, '');
        if (!baseUrl) { showQuickStatus('Informe a URL.', true); return; }
        try {
          const res = await fetch(baseUrl + '/api/health', { method: 'GET' });
          const data = await res.json().catch(() => ({}));
          showQuickStatus(res.ok && data.status === 'ok' ? 'Conexão OK.' : 'Resposta inesperada.', !res.ok);
        } catch (e) {
          showQuickStatus('Falha: ' + (e.message || 'verifique a URL'), true);
        }
      });

      container.querySelector('#config-sync-now').addEventListener('click', () => {
        const contact = getContactFromDOM();
        if (!contact) { showQuickStatus('Abra uma conversa primeiro.', true); return; }
        upsertContact(contact).then(() => {
          sendContactToApi(contact);
          showQuickStatus('Contato sincronizado.', false);
        });
      });

      container.querySelector('#config-open-full').addEventListener('click', (e) => {
        e.preventDefault();
        openOptions();
      });
    }

    function escapeHtml(s) {
      const div = document.createElement('div');
      div.textContent = s == null ? '' : s;
      return div.innerHTML;
    }

    showTab('inbox');

    function updatePhoneDisplay() {
      const phone = getCurrentChatPhone();
      if (phone) {
        if (phone !== lastPhone) {
          lastPhone = phone;
          var contact = getContactFromDOM();
          if (contact && contact.phone) {
            upsertContact(contact).then(function (c) { sendContactToApi(c); });
          }
        }
      } else {
        lastPhone = phone;
      }
      phoneDisplay.textContent = phone ? formatPhone(phone) : '—';
    }

    const SIDEBAR_CSS_CLASS = 'plenipay-crm-sidebar-visible';
    function applySidebarMargin(visible) {
      document.body.style.marginRight = visible ? SIDEBAR_WIDTH + 'px' : '';
      document.body.classList.toggle(SIDEBAR_CSS_CLASS, visible);
    }

    updatePhoneDisplay();
    applySidebarMargin(true);
    setInterval(updatePhoneDisplay, 500);

    toggle.addEventListener('click', () => {
      const hidden = wrap.classList.toggle('hidden');
      toggle.innerHTML = hidden ? '▶' : '◀';
      toggle.style.right = hidden ? '0' : (SIDEBAR_WIDTH - 2) + 'px';
      applySidebarMargin(!hidden);
    });
    toggle.style.right = (SIDEBAR_WIDTH - 2) + 'px';

    document.addEventListener('click', () => setTimeout(updatePhoneDisplay, 100), true);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') updatePhoneDisplay(); });

    getStored().then((r) => {
      cachedApi.baseUrl = r[STORAGE_KEYS.baseUrl] || '';
      cachedApi.apiKey = r[STORAGE_KEYS.apiKey] || '';
      cachedApi.at = Date.now();
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;
      if (changes[STORAGE_KEYS.baseUrl] || changes[STORAGE_KEYS.apiKey]) {
        getStored().then((r) => {
          cachedApi.baseUrl = r[STORAGE_KEYS.baseUrl] || '';
          cachedApi.apiKey = r[STORAGE_KEYS.apiKey] || '';
          cachedApi.at = Date.now();
        });
      }
    });

    var syncInterval = 15000;
    setInterval(function () {
      syncAllContactsFromList();
    }, syncInterval);
    setTimeout(function () { syncAllContactsFromList(); }, 3000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') syncAllContactsFromList();
    });
    var listPane = document.querySelector('#pane-side, [data-testid="chat-list"], [role="application"]');
    if (listPane) {
      try {
        var syncDebounce = null;
        var obs = new MutationObserver(function () {
          if (syncDebounce) clearTimeout(syncDebounce);
          syncDebounce = setTimeout(function () { syncAllContactsFromList(); }, 2000);
        });
        obs.observe(listPane, { childList: true, subtree: true });
      } catch (e) {}
    }
  }

  getStored().then((r) => {
    cachedApi.baseUrl = r[STORAGE_KEYS.baseUrl] || '';
    cachedApi.apiKey = r[STORAGE_KEYS.apiKey] || '';
    cachedApi.at = Date.now();
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
