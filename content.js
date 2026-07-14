(async () => {
  const { rules = [] } = await chrome.storage.sync.get('rules');
  if (!rules.length) return;

  // 当前页面是否匹配某个起始域名
  const host = location.hostname;
  const applicable = rules.filter(rule => rule.enabled !== false && hostMatches(host, rule.origin));
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
