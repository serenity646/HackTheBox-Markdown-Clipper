(function () {
  const CONFIG = {
    buttonClass: 'htb-copy-button',
    toastId: 'htb-md-toast',
    selector: 'pre.shiki',
    langMap: {
      "shellsession": "bash",
      "shell":        "bash",
      "bash":         "bash",
      "powershell":   "powershell",
      "python":       "python",
      "sql":          "sql",
      "javascript":   "javascript",
      "typescript":   "typescript",
      "php":          "php",
      "java":         "java",
      "go":           "go",
      "html":         "html",
      "xml":          "xml",
      "yaml":         "yaml",
      "json":         "json",
      "nasm":         "nasm",
      "css":          "css",
      "csharp":       "csharp",
      "cpp":          "cpp",
      "c":            "c",
    }
  };

  const trackMousePosition = (e) => {
    Object.assign(document.documentElement.dataset, {
      htbMouseX: e.clientX,
      htbMouseY: e.clientY,
      htbScrollY: window.scrollY
    });
  };

  const extractLanguage = (className) => {
    const match = className.match(/language-(\S+)/);
    return match ? (CONFIG.langMap[match[1]] || match[1]) : '';
  };

  const extractCodeText = (preElement) => {
    const codeEl = preElement.querySelector('code');
    if (!codeEl) {
      const clone = preElement.cloneNode(true);
      clone.querySelector('.float-end')?.remove();
      return clone.innerText.trimEnd();
    }

    const lineSpans = codeEl.querySelectorAll('span.line');
    if (lineSpans.length === 0) return codeEl.innerText.trimEnd();

    const lines = Array.from(lineSpans).map(span => 
      span.querySelector('[emptylineplaceholder]') ? '' : span.innerText.trimEnd()
    );
    
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    return lines.join('\n');
  };

  const copyToClipboard = async (text, lang) => {
    const fallbackCopy = (txt) => {
      const ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.cssText = 'position:fixed;top:-9999px;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast(`✅ Copied! (${lang})`, false);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const ok = fallbackCopy(text);
      showToast(ok ? `✅ Copied! (${lang})` : '❌ Clipboard write failed.', !ok);
    }
  };

  const copyCodeBlock = (preElement) => {
    const codeText = extractCodeText(preElement);
    if (!codeText) return showToast('❌ Code block is empty.', true);

    const lang = extractLanguage(preElement.className);
    const markdown = `\`\`\`${lang}\n${codeText}\n\`\`\``;
    copyToClipboard(markdown, lang);
  };

  const showToast = (msg, isError) => {
    document.getElementById(CONFIG.toastId)?.remove();
    
    const toast = document.createElement('div');
    toast.id = CONFIG.toastId;
    toast.className = `htb-md-toast ${isError ? 'error' : 'success'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('fade-out'), 2500);
    setTimeout(() => toast.remove(), 3100);
  };

  const createCopyButton = () => {
    const btn = document.createElement('button');
    btn.className = CONFIG.buttonClass;
    btn.innerHTML = '📋';
    btn.title = 'Copy as Markdown';
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyCodeBlock(btn.closest(CONFIG.selector));
    };
    return btn;
  };

  const addCopyButton = (preElement) => {
    if (preElement.querySelector(`.${CONFIG.buttonClass}`)) return;
    if (getComputedStyle(preElement).position === 'static') {
      preElement.style.setProperty('position', 'relative', 'important');
    }
    preElement.appendChild(createCopyButton());
  };

  const observeNewBlocks = () => {
    new MutationObserver((mutations) => {
      mutations.forEach(({ addedNodes }) => {
        addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (node.matches?.(CONFIG.selector)) {
            addCopyButton(node);
          } else {
            node.querySelectorAll?.(CONFIG.selector).forEach(addCopyButton);
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  };

  const init = () => {
    document.querySelectorAll(CONFIG.selector).forEach(addCopyButton);
    observeNewBlocks();
  };

  document.addEventListener('contextmenu', trackMousePosition, true);
  document.readyState === 'loading' 
    ? document.addEventListener('DOMContentLoaded', init)
    : setTimeout(init, 100);
})();
