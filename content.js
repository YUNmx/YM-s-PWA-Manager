(async () => {
  // 只在 PWA 窗口内生效，普通浏览器标签页不拦截
  const inPwa = window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.matchMedia('(display-mode: minimal-ui)').matches;
  if (!inPwa) return;

  const { rules = [] } = await chrome.storage.sync.get('rules');
  if (!rules.length) return;
  
  // 记录 PWA 窗口的起始域名，跨页面跳转仍以原始域名匹配规则
  // window.name 在同一窗口内跨域导航后保持不变，sessionStorage 不行（origin 隔离）
  const PWA_ORIGIN_KEY = '__pwa_origin__';
  let storedOrigin = null;
  try { storedOrigin = JSON.parse(window.name)[PWA_ORIGIN_KEY]; } catch {}
  const origin = storedOrigin || location.hostname;
  window.name = JSON.stringify({ [PWA_ORIGIN_KEY]: origin });
  const applicable = rules.filter(rule => rule.enabled !== false && hostMatches(origin, rule.origin));
  if (!applicable.length) return;

  document.addEventListener('click', function(e) {
    const a = e.target.closest('a');
    if (!a || !a.href) return;
    const url = new URL(a.href);

    // 检查是否匹配任一扩展域名
    for (const rule of applicable) {
      for (const pattern of rule.patterns) {
        if (hostMatches(url.hostname, pattern)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          window.location.href = a.href;
          return;
        }
      }
    }
  }, true);
})();

// 转义并匹配，支持 * 通配符
function hostMatches(host, pattern) {
  const regexStr = '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
  return new RegExp(regexStr).test(host);
}
