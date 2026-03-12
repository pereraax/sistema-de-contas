const STORAGE_KEYS = {
  baseUrl: 'plenipay_crm_base_url',
  apiKey: 'plenipay_crm_api_key',
  messages: 'plenipay_crm_messages',
  funnels: 'plenipay_crm_funnels',
};

// ——— Tabs ———
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const tabId = tab.getAttribute('data-tab');
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('panel-' + tabId);
    if (panel) panel.classList.add('active');
  });
});

// ——— API ———
chrome.storage.sync.get([STORAGE_KEYS.baseUrl, STORAGE_KEYS.apiKey], (r) => {
  document.getElementById('baseUrl').value = r[STORAGE_KEYS.baseUrl] || 'https://plenipay.com';
  document.getElementById('apiKey').value = r[STORAGE_KEYS.apiKey] || '';
});

document.getElementById('saveApi').addEventListener('click', () => {
  const baseUrl = document.getElementById('baseUrl').value.trim().replace(/\/+$/, '') || 'https://plenipay.com';
  const apiKey = document.getElementById('apiKey').value.trim();
  chrome.storage.sync.set({ [STORAGE_KEYS.baseUrl]: baseUrl, [STORAGE_KEYS.apiKey]: apiKey }, () => {
    showFeedback('savedApi', 'Configuração salva.');
  });
});

function showFeedback(id, text) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2000);
}

// ——— Mensagens ———
let messages = [];
let editingId = null;

function loadMessages() {
  chrome.storage.sync.get([STORAGE_KEYS.messages], (r) => {
    const raw = Array.isArray(r[STORAGE_KEYS.messages]) ? r[STORAGE_KEYS.messages] : [];
    let hadMissingId = false;
    messages = raw.map((m, i) => {
      if (!m || typeof m !== 'object') {
        hadMissingId = true;
        return { id: 'msg' + Date.now() + '_' + i, label: '', text: '', buttons: [] };
      }
      if (!m.id) {
        hadMissingId = true;
        return { ...m, id: 'msg' + Date.now() + '_' + i };
      }
      return m;
    });
    if (hadMissingId) {
      chrome.storage.sync.set({ [STORAGE_KEYS.messages]: messages }, () => {
        renderMessageList();
        updateFunnelSelect();
      });
    } else {
      renderMessageList();
      updateFunnelSelect();
    }
  });
}

function saveMessages() {
  chrome.storage.sync.set({ [STORAGE_KEYS.messages]: messages }, () => loadMessages());
}

function renderMessageList() {
  const ul = document.getElementById('msgList');
  ul.innerHTML = '';
  if (messages.length === 0) {
    ul.className = 'msg-list empty';
    ul.appendChild(document.createTextNode('Nenhuma mensagem. Clique em "Nova mensagem" para criar.'));
    return;
  }
  ul.className = 'msg-list';
  messages.forEach((m) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="label">' + escapeHtml(m.label || '(sem nome)') + '</span><div class="actions"></div>';
    const actions = li.querySelector('.actions');
    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Editar';
    btnEdit.className = 'btn-secondary';
    btnEdit.addEventListener('click', () => openMessageForm(m));
    const btnDel = document.createElement('button');
    btnDel.textContent = 'Excluir';
    btnDel.className = 'btn-danger';
    btnDel.addEventListener('click', () => {
      if (confirm('Excluir esta mensagem?')) {
        messages = messages.filter((x) => x.id !== m.id);
        saveMessages();
      }
    });
    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);
    ul.appendChild(li);
  });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function openMessageForm(msg = null) {
  editingId = msg ? (msg.id || null) : null;
  document.getElementById('formTitle').textContent = msg ? 'Editar mensagem' : 'Nova mensagem';
  document.getElementById('msgLabel').value = msg ? (msg.label || '') : '';
  document.getElementById('msgText').value = msg ? (msg.text || '') : '';
  const container = document.getElementById('buttonsContainer');
  container.innerHTML = '';
  if (msg && Array.isArray(msg.buttons) && msg.buttons.length > 0) {
    msg.buttons.forEach((b) => addButtonRow(b.title || '', b.url || ''));
  }
  const formPanel = document.getElementById('formPanel');
  formPanel.style.display = 'block';
  formPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function addButtonRow(title = '', url = '') {
  const container = document.getElementById('buttonsContainer');
  if (container.querySelectorAll('.btn-item').length >= 3) return;
  const div = document.createElement('div');
  div.className = 'btn-item';
  const inpTitle = document.createElement('input');
  inpTitle.type = 'text';
  inpTitle.placeholder = 'Título do botão';
  inpTitle.value = title;
  const inpUrl = document.createElement('input');
  inpUrl.type = 'url';
  inpUrl.className = 'url-input';
  inpUrl.placeholder = 'URL (opcional)';
  inpUrl.value = url;
  const btnRemove = document.createElement('button');
  btnRemove.type = 'button';
  btnRemove.className = 'remove';
  btnRemove.textContent = 'Remover';
  btnRemove.addEventListener('click', () => div.remove());
  div.appendChild(inpTitle);
  div.appendChild(inpUrl);
  div.appendChild(btnRemove);
  container.appendChild(div);
}

function getButtonsFromForm() {
  const items = document.getElementById('buttonsContainer').querySelectorAll('.btn-item');
  const arr = [];
  items.forEach((row, i) => {
    const titleInp = row.querySelector('input[type="text"]');
    const urlInp = row.querySelector('input[type="url"]');
    const title = titleInp && titleInp.value && titleInp.value.trim() ? titleInp.value.trim() : null;
    if (!title) return;
    arr.push({
      id: 'btn' + i,
      title,
      url: urlInp && urlInp.value && urlInp.value.trim() ? urlInp.value.trim() : undefined,
    });
  });
  return arr;
}

document.getElementById('addButtonRow').addEventListener('click', () => addButtonRow());

document.getElementById('saveMsg').addEventListener('click', () => {
  const label = document.getElementById('msgLabel').value.trim();
  const text = document.getElementById('msgText').value.trim();
  if (!label) { alert('Informe o nome da mensagem.'); return; }
  if (!text) { alert('Informe o texto da mensagem.'); return; }
  const buttons = getButtonsFromForm();
  if (editingId) {
    const idx = messages.findIndex((m) => m.id === editingId);
    if (idx >= 0) {
      messages[idx] = { ...messages[idx], label, text, buttons };
    } else {
      // Mensagem não encontrada (ex.: lista desatualizada); salvar como nova
      messages.push({ id: 'msg' + Date.now(), label, text, buttons });
    }
  } else {
    messages.push({ id: 'msg' + Date.now(), label, text, buttons });
  }
  saveMessages();
  document.getElementById('formPanel').style.display = 'none';
  editingId = null;
});

document.getElementById('cancelMsg').addEventListener('click', () => {
  document.getElementById('formPanel').style.display = 'none';
  editingId = null;
});

document.getElementById('btnNewMsg').addEventListener('click', () => openMessageForm());

// ——— Funis ———
let funnels = [];
let funnelSequence = [];
let editingFunnelId = null;

function normalizeMessageIds(raw) {
  if (Array.isArray(raw)) return raw.slice().filter(function (id) { return id != null && String(id).trim() !== ''; });
  if (raw != null && typeof raw === 'string' && raw.trim() !== '') return [raw.trim()];
  return [];
}

function loadFunnels() {
  chrome.storage.sync.get([STORAGE_KEYS.funnels], function (r) {
    var raw = r[STORAGE_KEYS.funnels];
    funnels = Array.isArray(raw) ? raw.map(function (f) {
      return {
        id: f.id || 'funnel' + Date.now() + Math.random(),
        name: f.name || '',
        messageIds: normalizeMessageIds(f.messageIds),
      };
    }) : [];
    renderFunnelList();
  });
}

function saveFunnels() {
  chrome.storage.sync.set({ [STORAGE_KEYS.funnels]: funnels }, () => loadFunnels());
}

function renderFunnelList() {
  const ul = document.getElementById('funnelList');
  ul.innerHTML = '';
  if (funnels.length === 0) {
    ul.className = 'funnel-list empty';
    ul.appendChild(document.createTextNode('Nenhum funil. Clique em "Novo funil" para criar uma sequência de mensagens.'));
    return;
  }
  ul.className = 'funnel-list';
  funnels.forEach((f) => {
    const li = document.createElement('li');
    const count = (f.messageIds && f.messageIds.length) || 0;
    li.innerHTML =
      '<div class="funnel-info">' +
      '<div class="funnel-name">' + escapeHtml(f.name || 'Sem nome') + '</div>' +
      '<div class="funnel-count">' + count + ' mensagem(ns) na sequência</div>' +
      '</div><div class="actions"></div>';
    const actions = li.querySelector('.actions');
    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Editar';
    btnEdit.className = 'btn-secondary';
    btnEdit.addEventListener('click', () => openFunnelForm(f));
    const btnDel = document.createElement('button');
    btnDel.textContent = 'Excluir';
    btnDel.className = 'btn-danger';
    btnDel.addEventListener('click', () => {
      if (confirm('Excluir este funil?')) {
        funnels = funnels.filter((x) => x.id !== f.id);
        saveFunnels();
      }
    });
    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);
    ul.appendChild(li);
  });
}

function updateFunnelSelect() {
  const sel = document.getElementById('funnelAddSelect');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">— Escolha uma mensagem —</option>';
  messages.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.label || m.id || '(sem nome)';
    sel.appendChild(opt);
  });
  if (current) sel.value = current;
}

function openFunnelForm(funnel = null) {
  editingFunnelId = funnel ? funnel.id : null;
  document.getElementById('funnelFormTitle').textContent = funnel ? 'Editar funil' : 'Novo funil';
  document.getElementById('funnelName').value = funnel ? funnel.name || '' : '';
  // Garantir messageIds como array (evitar string ou objeto vindo do storage)
  var rawIds = funnel && funnel.messageIds;
  if (Array.isArray(rawIds)) {
    funnelSequence = rawIds.slice().filter(function (id) { return id != null && String(id).trim() !== ''; });
  } else if (rawIds != null && typeof rawIds === 'string') {
    funnelSequence = rawIds.trim() ? [rawIds.trim()] : [];
  } else {
    funnelSequence = [];
  }
  renderFunnelSequence();
  // Recarregar mensagens do storage para o dropdown estar atualizado
  chrome.storage.sync.get([STORAGE_KEYS.messages], function (r) {
    messages = Array.isArray(r[STORAGE_KEYS.messages]) ? r[STORAGE_KEYS.messages] : [];
    updateFunnelSelect();
  });
  document.getElementById('funnelFormPanel').style.display = 'block';
}

function renderFunnelSequence() {
  const container = document.getElementById('funnelSequence');
  container.innerHTML = '';
  if (funnelSequence.length === 0) {
    container.classList.add('funnel-sequence-empty');
    container.textContent = 'Nenhuma mensagem na sequência. Use o seletor abaixo para adicionar.';
    return;
  }
  container.classList.remove('funnel-sequence-empty');
  funnelSequence.forEach((msgId, index) => {
    const msg = messages.find((m) => m.id === msgId);
    const name = msg ? msg.label || msg.id : msgId;
    const div = document.createElement('div');
    div.className = 'funnel-sequence-item';
    div.dataset.msgId = msgId;
    div.innerHTML =
      '<span class="order">' + (index + 1) + '</span>' +
      '<span class="name">' + escapeHtml(name) + '</span>' +
      '<button type="button" class="remove-seq">Remover</button>';
    div.querySelector('.remove-seq').addEventListener('click', () => {
      funnelSequence = funnelSequence.filter((id) => id !== msgId);
      renderFunnelSequence();
    });
    container.appendChild(div);
  });
}

document.getElementById('funnelAddBtn').addEventListener('click', () => {
  const sel = document.getElementById('funnelAddSelect');
  if (!sel) return;
  // Usar value do option selecionado (mais confiável que sel.value em alguns casos)
  const selectedOpt = sel.options[sel.selectedIndex];
  const msgId = selectedOpt ? (selectedOpt.value || '').trim() : (sel.value || '').trim();
  if (!msgId) return;
  funnelSequence.push(msgId);
  renderFunnelSequence();
  sel.selectedIndex = 0;
  sel.value = '';
});

document.getElementById('saveFunnel').addEventListener('click', () => {
  const name = document.getElementById('funnelName').value.trim();
  if (!name) {
    alert('Informe o nome do funil.');
    return;
  }
  if (funnelSequence.length === 0) {
    alert('Adicione pelo menos uma mensagem à sequência.');
    return;
  }
  // Copiar array para não referenciar o mesmo objeto
  var messageIds = funnelSequence.slice();
  var payload = { name: name, messageIds: messageIds };
  if (editingFunnelId) {
    var idx = funnels.findIndex(function (f) { return f.id === editingFunnelId; });
    if (idx >= 0) {
      funnels[idx] = { id: funnels[idx].id, name: payload.name, messageIds: payload.messageIds };
    } else {
      funnels.push({ id: 'funnel' + Date.now(), name: payload.name, messageIds: payload.messageIds });
    }
  } else {
    funnels.push({ id: 'funnel' + Date.now(), name: payload.name, messageIds: payload.messageIds });
  }
  saveFunnels();
  document.getElementById('funnelFormPanel').style.display = 'none';
  editingFunnelId = null;
});

document.getElementById('cancelFunnel').addEventListener('click', () => {
  document.getElementById('funnelFormPanel').style.display = 'none';
  editingFunnelId = null;
});

document.getElementById('btnNewFunnel').addEventListener('click', () => openFunnelForm());

// ——— Init ———
loadMessages();
loadFunnels();
