document.addEventListener('DOMContentLoaded', async () => {
  const originInput = document.getElementById('origin');
  const patternsInput = document.getElementById('patterns');
  const saveBtn = document.getElementById('save');
  const settingsBtn = document.getElementById('openSettings');
  const status = document.getElementById('status');

  // 自动获取当前标签页域名，失败则留空供手动填写
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      originInput.value = url.hostname;
    }
  } catch (e) {
    // 无法获取域名（如 chrome:// 页面），不影响手动输入
  }

  // 加载已保存的规则
  const { rules } = await chrome.storage.sync.get('rules');
  if (rules) {
    const rule = rules.find(r => r.origin === originInput.value);
    if (rule) {
      patternsInput.value = rule.patterns.join('\n');
    }
  }

  saveBtn.addEventListener('click', async () => {
    const origin = originInput.value.trim();
    const patterns = patternsInput.value
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (!origin) {
      status.textContent = '起始域名不能为空';
      return;
    }

    let { rules } = await chrome.storage.sync.get('rules');
    rules = rules || [];
    const existing = rules.find(r => r.origin === origin);
    rules = rules.filter(r => r.origin !== origin);
    rules.push({
      id: existing ? existing.id : Date.now().toString(36),
      origin,
      patterns,
      enabled: existing ? existing.enabled !== false : true
    });

    await chrome.storage.sync.set({ rules });
    status.textContent = '已保存！';
    setTimeout(() => status.textContent = '', 1500);
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
