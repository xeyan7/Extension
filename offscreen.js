'use strict';

// Offscreen document that owns the real clipboard write.
// MV3 service workers cannot reliably call navigator.clipboard.writeText, so
// background.js forwards { action: 'offscreenWrite', text } here. The document
// is focused/clipboard-capable, making the async Clipboard API work.
//
// We listen ONLY for 'offscreenWrite' (not 'copyToClipboard'): messages a
// content script sends are broadcast to every extension context, so listening
// for the same action as background.js would write to the clipboard twice.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.action !== 'offscreenWrite') return false;
  const text = String(message.text ?? '');
  (async () => {
    try {
      await navigator.clipboard.writeText(text);
      sendResponse({ success: true });
      return;
    } catch (_) {
      // Last-resort: hidden textarea + execCommand fallback.
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        sendResponse({ success: copied });
      } catch (err) {
        sendResponse({ success: false, error: String(err && err.message || err) });
      }
    }
  })();
  return true; // async response
});
