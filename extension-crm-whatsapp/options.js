const STORAGE_KEYS = {
  baseUrl: 'plenipay_crm_base_url',
  apiKey: 'plenipay_crm_api_key',
  messages: 'plenipay_crm_messages',
  zapiInstanceId: 'plenipay_zapi_instance',
  zapiToken: 'plenipay_zapi_token',
  zapiClientToken: 'plenipay_zapi_client_token',
};

// ——— API ———
chrome.storage.sync.get([STORAGE_KEYS.baseUrl, STORAGE_KEYS.apiKey, STORAGE_KEYS.zapiInstanceId, STORAGE_KEYS.zapiToken, STORAGE_KEYS.zapiClientToken], (r) => {
  document.getElementById('baseUrl').value = r[STORAGE_KEYS.baseUrl] || 'https://plenipay.com';
  document.getElementById('apiKey').value = r[STORAGE_KEYS.apiKey] || '';
  document.getElementById('zapiInstanceId').value = r[STORAGE_KEYS.zapiInstanceId] || '';
  document.getElementById('zapiToken').value = r[STORAGE_KEYS.zapiToken] || '';
  document.getElementById('zapiClientToken').value = r[STORAGE_KEYS.zapiClientToken] || '';
});

document.getElementById('saveApi').addEventListener('click', () => {
  const baseUrl = document.getElementById('baseUrl').value.trim().replace(/\/+$/, '') || 'https://plenipay.com';
  const apiKey = document.getElementById('apiKey').value.trim();
  chrome.storage.sync.set({ [STORAGE_KEYS.baseUrl]: baseUrl, [STORAGE_KEYS.apiKey]: apiKey }, () => {
    const el = document.getElementById('savedApi');
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 2000);
  });
});

function parseZapiUrl(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();
  const match = s.match(/instances\/([^/]+)\/token\/([^/]+)/i);
  if (match) return { instanceId: match[1], token: match[2] };
  return null;
}

document.getElementById('saveZapi').addEventListener('click', () => {
  let instanceId = document.getElementById('zapiInstanceId').value.trim();
  let token = document.getElementById('zapiToken').value.trim();
  const clientToken = document.getElementById('zapiClientToken').value.trim();
  const parsed = parseZapiUrl(instanceId);
  if (parsed) {
    instanceId = parsed.instanceId;
    if (!token) token = parsed.token;
  }
  chrome.storage.sync.set({ [STORAGE_KEYS.zapiInstanceId]: instanceId, [STORAGE_KEYS.zapiToken]: token, [STORAGE_KEYS.zapiClientToken]: clientToken }, () => {
    const el = document.getElementById('savedZapi');
    el.style.display = 'block';
    el.textContent = 'Salvo. Envio direto ativado.';
    setTimeout(() => { el.style.display = 'none'; }, 2000);
  });
});

// ——— Mensagens ———
let messages = [];
let editingId = null;

function loadMessages() {
  chrome.storage.sync.get([STORAGE_KEYS.messages], (r) => {
    messages = Array.isArray(r[STORAGE_KEYS.messages]) ? r[STORAGE_KEYS.messages] : [];
    renderList();
  });
}

function saveMessages() {
  chrome.storage.sync.set({ [STORAGE_KEYS.messages]: messages }, () => loadMessages());
}

function renderList() {
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
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = m.label || '(sem nome)';
    const actions = document.createElement('div');
    actions.className = 'actions';
    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Editar';
    btnEdit.className = 'secondary';
    btnEdit.addEventListener('click', () => openForm(m));
    const btnDel = document.createElement('button');
    btnDel.textContent = 'Excluir';
    btnDel.className = 'danger';
    btnDel.addEventListener('click', () => {
      if (confirm('Excluir esta mensagem?')) {
        messages = messages.filter((x) => x.id !== m.id);
        saveMessages();
      }
    });
    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);
    li.appendChild(label);
    li.appendChild(actions);
    ul.appendChild(li);
  });
}

function openForm(msg = null) {
  editingId = msg ? msg.id : null;
  document.getElementById('formTitle').textContent = msg ? 'Editar mensagem' : 'Nova mensagem';
  document.getElementById('msgLabel').value = msg ? msg.label || '' : '';
  document.getElementById('msgText').value = msg ? msg.text || '' : '';
  const container = document.getElementById('buttonsContainer');
  container.innerHTML = '';
  if (msg && Array.isArray(msg.buttons) && msg.buttons.length > 0) {
    msg.buttons.forEach((b) => addButtonRow(b.title, b.url));
  }
  document.getElementById('formPanel').style.display = 'block';
}

function addButtonRow(title = '', url = '') {
  const container = document.getElementById('buttonsContainer');
  if (container.querySelectorAll('.btn-item').length >= 3) return;
  const div = document.createElement('div');
  div.className = 'btn-item';
  const id = 'b' + Date.now() + Math.random().toString(36).slice(2, 6);
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
  btnRemove.className = 'remove secondary';
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
    const title = (titleInp && titleInp.value && titleInp.value.trim()) ? titleInp.value.trim() : null;
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
  if (!label) {
    alert('Informe o nome da mensagem.');
    return;
  }
  if (!text) {
    alert('Informe o texto da mensagem.');
    return;
  }
  const buttons = getButtonsFromForm();
  if (editingId) {
    const idx = messages.findIndex((m) => m.id === editingId);
    if (idx >= 0) {
      messages[idx] = { ...messages[idx], label, text, buttons };
    }
  } else {
    messages.push({
      id: 'msg' + Date.now(),
      label,
      text,
      buttons,
    });
  }
  saveMessages();
  document.getElementById('formPanel').style.display = 'none';
  editingId = null;
});

document.getElementById('cancelMsg').addEventListener('click', () => {
  document.getElementById('formPanel').style.display = 'none';
  editingId = null;
});

document.getElementById('btnNewMsg').addEventListener('click', () => openForm());

loadMessages();
