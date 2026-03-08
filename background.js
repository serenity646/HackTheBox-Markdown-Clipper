// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "htb-copy-md",
    title: "📋 Copy as Markdown",
    contexts: ["all"],
    documentUrlPatterns: ["https://academy.hackthebox.com/*"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "htb-copy-md") return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: doHTBCopy
    });
  } catch (err) {
    console.error("[HTBCopy] executeScript error:", err.message);
  }
});

// ─── This function runs INSIDE the page ─────────────────────────────────────
function doHTBCopy() {

  // ── Step 1: Get click coordinates (stored by content.js) ──
  const clickX = parseFloat(document.documentElement.dataset.htbMouseX || "-1");
  const clickY = parseFloat(document.documentElement.dataset.htbMouseY || "-1");
  const scrollY = parseFloat(document.documentElement.dataset.htbScrollY || "0");
  // Absolute Y position in the document
  const absClickY = clickY + scrollY;

  // ── Step 2: Find all HTB code blocks on the page ──
  // Real HTB structure from DOM inspection:
  //   <pre class="language-sql shiki shiki-themes ...">
  //     <span class="float-end ...">sql</span>   ← label (ignored for text extraction)
  //     <code>
  //       <span class="line" line="1"><span style="...">text</span>...</span>
  //       <span class="line" line="2"><span emptylineplaceholder="true">\n</span></span>
  //       ...
  //     </code>
  //   </pre>
  const allPre = Array.from(document.querySelectorAll("pre.shiki"));

  if (allPre.length === 0) {
    showToast("❌ No code blocks found on this page.", true);
    return;
  }

  // ── Step 3: Find the <pre> block closest to where the user right-clicked ──
  let closestPre = null;
  let closestDist = Infinity;

  for (const pre of allPre) {
    const rect = pre.getBoundingClientRect();
    const absTop = rect.top + scrollY;
    const absBottom = rect.bottom + scrollY;
    const absLeft = rect.left;
    const absRight = rect.right;

    // Check if click was inside this block's bounding box
    const insideX = clickX >= absLeft && clickX <= absRight;
    const insideY = absClickY >= absTop && absClickY <= absBottom;

    if (insideX && insideY) {
      // Exact hit — use this one immediately
      closestPre = pre;
      break;
    }

    // Otherwise find nearest by center distance
    const cx = (rect.left + rect.right) / 2;
    const cy = (absTop + absBottom) / 2;
    const dist = Math.hypot(cx - clickX, cy - absClickY);
    if (dist < closestDist) {
      closestDist = dist;
      closestPre = pre;
    }
  }

  if (!closestPre) {
    showToast("❌ Couldn't find a code block. Right-click inside one.", true);
    return;
  }

  // ── Step 4: Detect language from the pre's class ──
  // Classes look like: "language-sql shiki shiki-themes ..."
  const cls = closestPre.className;
  let lang = "";
  const langMatch = cls.match(/language-(\S+)/);
  if (langMatch) {
    const raw = langMatch[1];
    // Map HTB language names to Obsidian/markdown fence names
    const langMap = {
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
    };
    lang = langMap[raw] || raw;
  }

  // ── Step 5: Extract the text content ──
  // The real structure is: pre > code > span.line[line="N"]
  // Each span.line contains one or more colored <span> elements.
  // Empty lines have <span emptylineplaceholder="true">
  // We use innerText on each span.line which collapses all child spans correctly.

  let codeText = "";

  // ── Selection override: if user has text selected, use that instead ──
  const selectedText = window.getSelection()?.toString().trim();

  if (selectedText) {
    codeText = selectedText;
  } else {
    const codeEl = closestPre.querySelector("code");
    if (codeEl) {
      const lineSpans = codeEl.querySelectorAll("span.line");
      if (lineSpans.length > 0) {
        // Collect lines, trimming trailing whitespace per line
        const lines = [];
        lineSpans.forEach(span => {
          // innerText handles the colored child spans and gives us plain text
          // emptylineplaceholder spans give us "\n" via innerText — trim to ""
          let lineText = span.innerText;
          // innerText on empty placeholder gives "\n", normalize to ""
          if (span.querySelector("[emptylineplaceholder]")) {
            lineText = "";
          }
          lines.push(lineText.trimEnd());
        });
        // Remove trailing empty lines
        while (lines.length > 0 && lines[lines.length - 1] === "") {
          lines.pop();
        }
        codeText = lines.join("\n");
      } else {
        // Fallback: no span.line found, use code innerText directly
        codeText = codeEl.innerText.trimEnd();
      }
    } else {
      // Fallback: just use pre innerText, but skip the label span text
      // The label span has class "float-end" — remove it first
      const clone = closestPre.cloneNode(true);
      const labelSpan = clone.querySelector(".float-end");
      if (labelSpan) labelSpan.remove();
      codeText = clone.innerText.trimEnd();
    }
  }

  if (!codeText) {
    showToast("❌ Code block is empty.", true);
    return;
  }

  // ── Step 6: Build the markdown fence ──
  const markdown = "```" + lang + "\n" + codeText + "\n```";

  // ── Step 7: Copy to clipboard ──
  // Use the modern Clipboard API with execCommand fallback
  const copyViaExecCommand = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(markdown)
      .then(() => showToast("✅ Copied! (" + lang + ")", false))
      .catch(() => {
        const ok = copyViaExecCommand(markdown);
        if (ok) showToast("✅ Copied! (" + lang + ")", false);
        else showToast("❌ Clipboard write failed.", true);
      });
  } else {
    const ok = copyViaExecCommand(markdown);
    if (ok) showToast("✅ Copied! (" + lang + ")", false);
    else showToast("❌ Clipboard write failed.", true);
  }

  // ── Toast helper (defined inside so it's serialized with the function) ──
  function showToast(msg, isError) {
    const OLD = document.getElementById("htb-md-toast");
    if (OLD) OLD.remove();

    const t = document.createElement("div");
    t.id = "htb-md-toast";
    t.textContent = msg;

    // Use setAttribute for inline style to avoid CSP issues with style property
    t.setAttribute("style", [
      "all: initial",
      "position: fixed",
      "bottom: 24px",
      "right: 24px",
      "z-index: 2147483647",
      "padding: 10px 16px",
      "border-radius: 8px",
      "font-family: 'Courier New', monospace",
      "font-size: 14px",
      "font-weight: bold",
      "pointer-events: none",
      "box-shadow: 0 4px 16px rgba(0,0,0,0.5)",
      "transition: opacity 0.5s ease",
      isError
        ? "background: #ff4d4d; color: #fff;"
        : "background: #9fef00; color: #111;"
    ].join(";"));

    document.body.appendChild(t);

    // Fade out after 2.5s, remove after 3s
    setTimeout(() => { t.style.opacity = "0"; }, 2500);
    setTimeout(() => { if (t.parentNode) t.remove(); }, 3100);
  }
}
