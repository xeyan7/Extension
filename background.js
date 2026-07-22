'use strict';

const networkAssets = new Map();
const MAX_ASSETS_PER_TYPE = 500;
const MAX_LIBRARY_BYTES = 8 * 1024 * 1024;
const MAX_COMPONENT_BYTES = 2 * 1024 * 1024;
const ASSET_TYPES = ['images', 'videos', 'audio', 'stylesheets', 'scripts', 'fonts', 'other'];

function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `uicc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function byteLength(value) {
  return new TextEncoder().encode(String(value || '')).byteLength;
}

function componentBytes(component) {
  return byteLength(component?.html) + byteLength(component?.css) + byteLength(component?.pageUrl) + 256;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['uiccSettings'], result => {
    if (chrome.runtime.lastError || result.uiccSettings) return;
    chrome.storage.local.set({
      uiccSettings: { includeNetworkAssets: true, defaultFormat: 'html', version: 2 }
    });
  });
});

function isSupportedPage(url) {
  return /^https?:\/\//i.test(url || '');
}

function isSafeRemoteUrl(url) {
  try { return ['http:', 'https:'].includes(new URL(url).protocol); }
  catch (_) { return false; }
}

function getTabAssets(tabId) {
  if (!networkAssets.has(tabId)) {
    networkAssets.set(tabId, Object.fromEntries(ASSET_TYPES.map(type => [type, new Set()])));
  }
  return networkAssets.get(tabId);
}

function addAsset(set, url) {
  if (!url || set.has(url) || set.size >= MAX_ASSETS_PER_TYPE) return;
  set.add(url);
}

function shouldIgnoreNetworkUrl(url) {
  return !url || url.startsWith('chrome-extension:') || url.startsWith('moz-extension:') ||
    url.includes('/@vite/') || url.includes('/@react-refresh') ||
    url.includes('__vite_ping') || url.includes('.hot-update.') ||
    url.includes('webpack-hmr') || url.includes('/sockjs-node/') || url.endsWith('.map');
}

chrome.webRequest.onCompleted.addListener(details => {
  if (details.tabId < 0 || shouldIgnoreNetworkUrl(details.url)) return;
  const assets = getTabAssets(details.tabId);
  const { type, url } = details;
  if (type === 'image') addAsset(assets.images, url);
  else if (type === 'media') {
    if (/\.(?:mp4|webm|ogv|mov|m3u8)(?:[?#]|$)/i.test(url)) addAsset(assets.videos, url);
    else addAsset(assets.audio, url);
  } else if (type === 'stylesheet') addAsset(assets.stylesheets, url);
  else if (type === 'script') addAsset(assets.scripts, url);
  else if (type === 'font' || /\.(?:woff2?|ttf|otf|eot)(?:[?#]|$)/i.test(url)) addAsset(assets.fonts, url);
  else if (/\.(?:jpe?g|png|gif|svg|webp|avif|bmp|ico)(?:[?#]|$)/i.test(url)) addAsset(assets.images, url);
  else addAsset(assets.other, url);
}, { urls: ['<all_urls>'] });

chrome.tabs.onRemoved.addListener(tabId => networkAssets.delete(tabId));
chrome.webNavigation.onBeforeNavigate.addListener(details => {
  if (details.frameId === 0) networkAssets.delete(details.tabId);
});

function resolveCssUrls(css, baseUrl) {
  if (!css || !baseUrl) return css || '';
  return String(css).replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, raw) => {
    const value = raw.trim();
    if (!value || value.startsWith('#') || value.startsWith('data:') ||
        value.startsWith('blob:') || /^https?:\/\//i.test(value) || value.startsWith('//')) return match;
    try { return `url("${new URL(value, baseUrl).href}")`; } catch (_) { return match; }
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

async function expandImports(css, baseUrl, seen = new Set(), depth = 0) {
  if (depth > 5 || !css || !css.includes('@import')) return resolveCssUrls(css, baseUrl);
  const regex = /@import\s+(?:url\(\s*["']?([^"')\s]+)["']?\s*\)|["']([^"']+)["'])\s*([^;]*);/gi;
  const matches = Array.from(css.matchAll(regex));
  let output = css;
  for (const match of matches) {
    const rawUrl = match[1] || match[2];
    const media = (match[3] || '').trim();
    let absolute;
    try { absolute = new URL(rawUrl, baseUrl).href; } catch (_) { output = output.replace(match[0], ''); continue; }
    if (!isSafeRemoteUrl(absolute)) { output = output.replace(match[0], ''); continue; }
    if (seen.has(absolute)) { output = output.replace(match[0], ''); continue; }
    seen.add(absolute);
    try {
      const response = await fetchWithTimeout(absolute, { headers: { Accept: 'text/css,*/*' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let imported = await response.text();
      imported = await expandImports(imported, absolute, seen, depth + 1);
      imported = resolveCssUrls(imported, absolute);
      if (media) imported = `@media ${media} {\n${imported}\n}`;
      output = output.replace(match[0], `\n/* ${absolute} */\n${imported}\n`);
    } catch (_) { output = output.replace(match[0], ''); }
  }
  return resolveCssUrls(output, baseUrl);
}

function storageGet(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, result => resolve(result || {})));
}

function storageSet(value) {
  return new Promise((resolve, reject) => chrome.storage.local.set(value, () => {
    if (chrome.runtime.lastError) reject(chrome.runtime.lastError); else resolve();
  }));
}

async function handleMessage(request, sender) {
  switch (request.action) {
    case 'saveComponent': {
      const result = await storageGet(['savedComponents']);
      const saved = Array.isArray(result.savedComponents) ? result.savedComponents : [];
      const component = {
        id: request.component?.id || createId(),
        type: String(request.component?.type || 'Component').slice(0, 80),
        pageTitle: String(request.component?.pageTitle || '').slice(0, 200),
        pageUrl: String(request.component?.pageUrl || '').slice(0, 2000),
        createdAt: request.component?.createdAt || new Date().toISOString(),
        html: String(request.component?.html || ''),
        css: String(request.component?.css || '')
      };
      const size = componentBytes(component);
      if (size > MAX_COMPONENT_BYTES) {
        return { success: false, error: 'This component is larger than the 2 MB local save limit. Copy it directly instead.' };
      }
      saved.unshift(component);
      let totalBytes = saved.reduce((total, item) => total + componentBytes(item), 0);
      while (saved.length > 100 || totalBytes > MAX_LIBRARY_BYTES) {
        const removed = saved.pop();
        totalBytes -= componentBytes(removed);
      }
      await storageSet({ savedComponents: saved });
      return { success: true, component, totalBytes };
    }
    case 'getComponents': {
      const result = await storageGet(['savedComponents']);
      const original = Array.isArray(result.savedComponents) ? result.savedComponents : [];
      let migrated = false;
      const components = original.map(component => {
        if (component?.id) return component;
        migrated = true;
        return { ...component, id: createId(), createdAt: component.createdAt || new Date().toISOString() };
      });
      if (migrated) await storageSet({ savedComponents: components });
      return { success: true, components };
    }
    case 'deleteComponent': {
      const result = await storageGet(['savedComponents']);
      const saved = (Array.isArray(result.savedComponents) ? result.savedComponents : [])
        .filter(component => component.id !== request.id);
      await storageSet({ savedComponents: saved });
      return { success: true, components: saved };
    }
    case 'getSettings': {
      const result = await storageGet(['uiccSettings']);
      return { success: true, settings: result.uiccSettings || {} };
    }
    case 'saveSettings': {
      const result = await storageGet(['uiccSettings']);
      const settings = { ...(result.uiccSettings || {}), ...(request.settings || {}), version: 2 };
      await storageSet({ uiccSettings: settings });
      return { success: true, settings };
    }
    case 'getNetworkAssets': {
      const tabId = sender.tab?.id ?? request.tabId;
      const assets = networkAssets.get(tabId) || getTabAssets(tabId);
      return Object.fromEntries(ASSET_TYPES.map(type => [type, Array.from(assets[type] || [])]));
    }
    case 'fetchExternalStylesheets': {
      const urls = Array.from(new Set(Array.isArray(request.urls) ? request.urls : []))
        .filter(url => typeof url === 'string' && isSafeRemoteUrl(url)).slice(0, 150);
      const results = {};
      await Promise.all(urls.map(async url => {
        try {
          const response = await fetchWithTimeout(url, { headers: { Accept: 'text/css,*/*' } });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          results[url] = { success: true, css: await expandImports(await response.text(), url) };
        } catch (error) { results[url] = { success: false, error: error.message || String(error) }; }
      }));
      return { success: true, results };
    }
    case 'fetchAssetBlob': {
      if (!isSafeRemoteUrl(request.url)) throw new Error('Unsupported asset URL');
      const response = await fetchWithTimeout(request.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return { success: true, dataUrl: `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`, type: blob.type, size: blob.size };
    }
    case 'downloadAsset': {
      if (!isSafeRemoteUrl(request.url) && !String(request.url || '').startsWith('data:')) throw new Error('Unsupported download URL');
      const downloadId = await chrome.downloads.download({
        url: request.url,
        filename: request.filename || undefined,
        saveAs: Boolean(request.saveAs)
      });
      return { success: true, downloadId };
    }
    default: return null;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const supportedActions = new Set([
    'saveComponent', 'getComponents', 'deleteComponent', 'getSettings', 'saveSettings',
    'getNetworkAssets', 'fetchExternalStylesheets', 'fetchAssetBlob', 'downloadAsset'
  ]);
  if (!supportedActions.has(request?.action)) return false;
  handleMessage(request || {}, sender).then(response => {
    if (response !== null) sendResponse(response);
  }).catch(error => sendResponse({ success: false, error: error.message || String(error) }));
  return true;
});

chrome.action.onClicked.addListener(async tab => {
  if (!tab?.id || !isSupportedPage(tab.url)) return;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleFloatingBar' });
    if (response?.success) return;
  } catch (_) {}
  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content.css'] });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['lib/gsap.min.js', 'lib/tailwind-lib.js', 'lib/extractor.js', 'content.js']
    });
  } catch (error) {
    console.warn('UI Component Copier could not run on this page:', error.message || error);
  }
});
