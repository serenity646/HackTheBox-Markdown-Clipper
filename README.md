# HackTheBox-Markdown-Clipper
A Chrome extension that lets you copy [HackTheBox Academy](https://academy.hackthebox.com/) code blocks as properly formatted Markdown fences — instantly, with one click. Perfect for Obsidian notes and writeups.

## Features

📋 Hover button — a copy button appears on every code block when you hover over it

🖱️ Right-click menu — right-click any code block and select Copy as Markdown

🎨 Language detection — automatically detects the language and formats the fence (e.g. ```bash, ```python)

⚡ Works dynamically — picks up code blocks loaded after page render


## Installation
Since this extension is not on the Chrome Web Store, you can load it manually in Chrome:

1. Download or clone this repository

```bash
git clone https://github.com/serenity646/HackTheBox-Markdown-Clipper.git
```

2. Open Chrome and go to chrome://extensions
3. Enable Developer Mode (toggle in the top-right corner)
4. Click Load unpacked
5. Select the cloned/downloaded repository folder
6. The extension is now active on academy.hackthebox.com


## Usage

Navigate to any HackTheBox Academy module page with code blocks, then either:

- **Hover** over a code block and click the 📋 button that appears
- **Right-click** anywhere inside a code block and choose *📋 Copy as Markdown*
- **Select specific lines** inside a code block, then right-click and choose *📋 Copy as Markdown* to copy only the selected portion

The code is copied to your clipboard with a Markdown fence, ready to paste into Obsidian or any Markdown editor:

~~~
```bash
nmap -sV -sC -oA scan 10.10.10.10
```
~~~

> 💡 **Tip:** If you only need part of a code block, highlight the lines you want first, then right-click — only your selection will be copied, with the language tag automatically detected from the block.

Supported Languages
bash · powershell · python · sql · javascript · typescript · php · java · go · html · xml · yaml · json · css · c · cpp · csharp · nasm

## Special Thanks

[@echoesofwhoami](https://github.com/echoesofwhoami) — for helping develop this extension


## Disclaimer
This is an unofficial community tool and is not affiliated with or endorsed by HackTheBox. The HackTheBox logo is property of HackTheBox Ltd and is used with permission for non-commercial community projects.

Initially scaffolded with AI assistance, extended and maintained by [@serenity646](https://github.com/serenity646) and contributors.
