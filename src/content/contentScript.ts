function isInternalUrl(url: string): boolean {
  return /^(chrome|chrome-extension|edge|about|brave|vivaldi|opera|moz-extension):\/\//i.test(url);
}

if (isInternalUrl(window.location.href)) {
  // Skip all logic on extension/browser pages
} else {
  let lastCheckedUrl = "";
  let pendingCheck: ReturnType<typeof setTimeout> | null = null;

  function checkUrl(url: string): void {
    if (isInternalUrl(url) || url === lastCheckedUrl) return;
    lastCheckedUrl = url;
    chrome.runtime.sendMessage({ type: "CHECK_BLOCK", url }, (response) => {
      if (chrome.runtime.lastError || !response?.shouldBlock || !response.blockedUrl) return;
      window.location.replace(response.blockedUrl);
    });
  }

  function scheduleCheck(): void {
    if (pendingCheck) clearTimeout(pendingCheck);
    pendingCheck = setTimeout(() => {
      pendingCheck = null;
      checkUrl(window.location.href);
    }, 250);
  }

  // Initial check on page load
  checkUrl(window.location.href);

  // Intercept history.pushState for SPA navigation
  const originalPushState = history.pushState.bind(history);
  history.pushState = (...args: Parameters<typeof history.pushState>) => {
    originalPushState(...args);
    scheduleCheck();
  };

  // Intercept history.replaceState for SPA navigation
  const originalReplaceState = history.replaceState.bind(history);
  history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
    originalReplaceState(...args);
    scheduleCheck();
  };

  window.addEventListener("popstate", scheduleCheck);
  window.addEventListener("hashchange", scheduleCheck);
}
