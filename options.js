const ruleList = document.getElementById('ruleList');
const emptyState = document.getElementById('emptyState');
const importFile = document.getElementById('importFile');
const importModal = document.getElementById('importModal');
const toast = document.getElementById('toast');

let pendingImportData = null;

document.addEventListener('DOMContentLoaded', loadRules);

document.getElementById('addRule').addEventListener('click', () => addRuleCard());

document.getElementById('exportBtn').addEventListener('click', exportRules);

document.getElementById('importBtn').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', handleFilePick);

document.getElementById('importCancel').addEventListener('click', closeModal);
document.getElementById('importMerge').addEventListener('click', () => doImport('merge'));
document.getElementById('importReplace').addEventListener('click', () => doImport('replace'));

async function loadRules() {
  const { rules } = await chrome.storage.sync.get('rules');
  renderRules(rules || []);
}

function renderRules(rules) {
  ruleList.innerHTML = '';
  if (!rules.length) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  rules.forEach((rule, idx) => {
    ruleList.appendChild(buildCard(rule, idx));
  });
}

function buildCard(rule, idx) {
  const card = document.createElement('div');
  card.className = 'rule-card';

  // header: origin + enabled toggle + delete
  const header = document.createElement('div');
  header.className = 'rule-header';

  const originLabel = document.createElement('label');
  originLabel.textContent = '起始域名';

  const originInput = document.createElement('input');
  originInput.type = 'text';
  originInput.value = rule.origin;
  originInput.placeholder = '例如 www.example.com';

  // enabled toggle
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'switch';
  toggleLabel.title = '启用/禁用此规则';
  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.checked = rule.enabled !== false;
  const slider = document.createElement('span');
  slider.className = 'slider';
  toggleLabel.append(toggleInput, slider);

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-danger btn-sm';
  delBtn.textContent = '删除';
  delBtn.addEventListener('click', () => deleteRule(idx));

  header.append(originLabel, originInput, toggleLabel, delBtn);

  // patterns
  const wrap = document.createElement('div');
  wrap.className = 'patterns-wrap';
  const patLabel = document.createElement('label');
  patLabel.textContent = '扩展域名（每行一个，支持通配符 *）';
  const patTextarea = document.createElement('textarea');
  patTextarea.value = (rule.patterns || []).join('\n');
  wrap.append(patLabel, patTextarea);

  // actions
  const actions = document.createElement('div');
  actions.className = 'rule-actions';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary btn-sm';
  saveBtn.textContent = '保存';
  saveBtn.addEventListener('click', () => saveRule(idx, originInput.value.trim(), patTextarea.value, toggleInput.checked));
  actions.appendChild(saveBtn);

  card.append(header, wrap, actions);
  return card;
}

function addRuleCard() {
  const { rules = [] } = [];
  // add a blank card dynamically
  const card = document.createElement('div');
  card.className = 'rule-card';

  const header = document.createElement('div');
  header.className = 'rule-header';
  const originLabel = document.createElement('label');
  originLabel.textContent = '起始域名';
  const originInput = document.createElement('input');
  originInput.type = 'text';
  originInput.placeholder = '例如 www.example.com';

  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'switch';
  toggleLabel.title = '启用/禁用此规则';
  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.checked = true;
  const slider = document.createElement('span');
  slider.className = 'slider';
  toggleLabel.append(toggleInput, slider);

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-danger btn-sm';
  delBtn.textContent = '删除';
  delBtn.addEventListener('click', () => { card.remove(); checkEmpty(); });

  header.append(originLabel, originInput, toggleLabel, delBtn);

  const wrap = document.createElement('div');
  wrap.className = 'patterns-wrap';
  const patLabel = document.createElement('label');
  patLabel.textContent = '扩展域名（每行一个，支持通配符 *）';
  const patTextarea = document.createElement('textarea');
  wrap.append(patLabel, patTextarea);

  const actions = document.createElement('div');
  actions.className = 'rule-actions';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary btn-sm';
  saveBtn.textContent = '保存';
  saveBtn.addEventListener('click', async () => {
    const origin = originInput.value.trim();
    if (!origin) { showToast('起始域名不能为空'); return; }
    const patterns = patTextarea.value.split('\n').map(s => s.trim()).filter(Boolean);
    let { rules } = await chrome.storage.sync.get('rules');
    rules = rules || [];
    rules = rules.filter(r => r.origin !== origin);
    rules.push({ id: Date.now().toString(36), origin, patterns, enabled: true });
    await chrome.storage.sync.set({ rules });
    showToast('已保存');
    loadRules();
  });
  actions.appendChild(saveBtn);

  card.append(header, wrap, actions);

  // insert before empty state
  emptyState.style.display = 'none';
  ruleList.insertBefore(card, ruleList.firstChild);
}

async function saveRule(idx, origin, patternsRaw, enabled) {
  if (!origin) { showToast('起始域名不能为空'); return; }
  const patterns = patternsRaw.split('\n').map(s => s.trim()).filter(Boolean);

  let { rules } = await chrome.storage.sync.get('rules');
  rules = rules || [];

  // preserve id if exists
  const existing = rules[idx];
  const id = existing && existing.id ? existing.id : Date.now().toString(36);

  rules[idx] = { id, origin, patterns, enabled };
  await chrome.storage.sync.set({ rules });
  showToast('已保存');
}

async function deleteRule(idx) {
  let { rules } = await chrome.storage.sync.get('rules');
  rules = rules || [];
  rules.splice(idx, 1);
  await chrome.storage.sync.set({ rules });
  showToast('已删除');
  loadRules();
}

function checkEmpty() {
  const cards = ruleList.querySelectorAll('.rule-card');
  emptyState.style.display = cards.length === 0 ? 'block' : 'none';
}

async function exportRules() {
  const { rules } = await chrome.storage.sync.get('rules');
  const data = JSON.stringify(rules || [], null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const d = new Date();
  a.download = `pwa-rules-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('导出成功');
}

function handleFilePick() {
  const file = importFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      pendingImportData = JSON.parse(e.target.result);
      if (!Array.isArray(pendingImportData)) throw new Error('格式错误');
      importModal.classList.add('show');
    } catch (_) {
      showToast('文件格式无效，请选择正确的 JSON 文件');
    }
  };
  reader.readAsText(file);
  importFile.value = '';
}

async function doImport(mode) {
  closeModal();
  if (!pendingImportData) return;

  // normalize imported data
  const imported = pendingImportData.map(r => ({
    id: r.id || Date.now().toString(36),
    origin: r.origin,
    patterns: r.patterns || [],
    enabled: r.enabled !== false
  }));

  let rules;
  if (mode === 'replace') {
    rules = imported;
  } else {
    const stored = await chrome.storage.sync.get('rules');
    const existing = stored.rules || [];
    // merge: imported origins take precedence
    const importedOrigins = new Set(imported.map(r => r.origin));
    rules = existing.filter(r => !importedOrigins.has(r.origin)).concat(imported);
  }

  await chrome.storage.sync.set({ rules });
  pendingImportData = null;
  showToast(`导入成功（${imported.length} 条规则）`);
  loadRules();
}

function closeModal() {
  importModal.classList.remove('show');
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
