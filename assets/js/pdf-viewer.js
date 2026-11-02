// ==========================================================================
// The Iteration Lab — Inline PDF Viewer Utility (/assets/js/pdf-viewer.js)
// Allows users to view GitHub Releases & external PDFs inline in the browser
// BEFORE deciding whether to download, using 0 Cloudflare Worker requests.
// ==========================================================================

const GH_OWNER = 'TheIterationLab';
const GH_REPO = 'papers';
const WORKER_ASSET_RE =
  /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\/(papers|softwares|profiles|events|institutes)\/([^/?#]+)\/([^?#]+)(\?.*)?$/i;

let viewerStyleInjected = false;
let viewerModalEl = null;
let viewerTitleEl = null;
let viewerFrameEl = null;
let viewerSpinnerEl = null;
let viewerNewTabLink = null;
let viewerDownloadLink = null;
let viewerEscBound = false;

export function normalizeWorkerAssetUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  const m = trimmed.match(WORKER_ASSET_RE);
  if (!m) return trimmed;
  const [, cat, owner, filename, query = ''] = m;
  return `https://github.com/${GH_OWNER}/${GH_REPO}/releases/download/${cat}/${owner}__${filename}${query}`;
}

export function isPdfUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const normalized = normalizeWorkerAssetUrl(rawUrl);
  return /\.pdf(?:$|[?#])/i.test(normalized);
}

export function buildPdfViewerTabUrl(rawUrl) {
  const cleanUrl = normalizeWorkerAssetUrl(rawUrl);
  if (!cleanUrl) return '';
  if (cleanUrl.startsWith('/')) return cleanUrl;
  return `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}`;
}

export function buildPdfEmbedUrl(rawUrl) {
  const cleanUrl = normalizeWorkerAssetUrl(rawUrl);
  if (!cleanUrl) return '';
  if (cleanUrl.startsWith('/')) return cleanUrl;
  return `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}&embedded=true`;
}

function ensureViewerStyles() {
  if (viewerStyleInjected) return;
  viewerStyleInjected = true;

  const style = document.createElement('style');
  style.id = 'til-pdf-viewer-styles';
  style.textContent = `
    .til-pdf-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(10, 14, 23, 0.82);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.18s ease;
    }
    .til-pdf-backdrop.is-open {
      opacity: 1;
      pointer-events: auto;
    }
    .til-pdf-dialog {
      width: min(1100px, 100%);
      height: min(92vh, 960px);
      background: #0F172A;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 10px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.48);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .til-pdf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: #0B1120;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: #F8FAFC;
      flex-wrap: wrap;
    }
    .til-pdf-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1 1 220px;
    }
    .til-pdf-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 3px 7px;
      border-radius: 4px;
      background: rgba(255, 122, 0, 0.16);
      color: #FDBA74;
      border: 1px solid rgba(255, 122, 0, 0.35);
      flex-shrink: 0;
    }
    .til-pdf-title {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #F8FAFC;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0;
    }
    .til-pdf-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .til-pdf-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 34px;
      padding: 0 12px;
      border-radius: 6px;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      font-size: 12.5px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.06);
      color: #F8FAFC;
      transition: background 0.15s ease, border-color 0.15s ease;
      white-space: nowrap;
    }
    .til-pdf-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(255, 255, 255, 0.36);
      color: #FFFFFF;
    }
    .til-pdf-btn-primary {
      background: #FF7A00;
      border-color: #FF7A00;
      color: #FFFFFF;
    }
    .til-pdf-btn-primary:hover {
      background: #EA580C;
      border-color: #EA580C;
      color: #FFFFFF;
    }
    .til-pdf-close {
      width: 34px;
      padding: 0;
      font-size: 16px;
      line-height: 1;
    }
    .til-pdf-stage {
      position: relative;
      flex: 1;
      background: #1E293B;
      min-height: 0;
    }
    .til-pdf-spinner {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: #CBD5E1;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      font-size: 13.5px;
      pointer-events: none;
      z-index: 1;
    }
    .til-pdf-spinner[hidden] {
      display: none !important;
    }
    .til-pdf-frame {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      border: 0;
      background: transparent;
    }
    @media (max-width: 640px) {
      .til-pdf-backdrop {
        padding: 0;
      }
      .til-pdf-dialog {
        width: 100%;
        height: 100dvh;
        border-radius: 0;
        border: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureViewerModal() {
  ensureViewerStyles();
  if (viewerModalEl) return;

  viewerModalEl = document.createElement('div');
  viewerModalEl.className = 'til-pdf-backdrop';
  viewerModalEl.setAttribute('role', 'dialog');
  viewerModalEl.setAttribute('aria-modal', 'true');
  viewerModalEl.setAttribute('aria-label', 'PDF Document Reader');

  const dialog = document.createElement('div');
  dialog.className = 'til-pdf-dialog';

  const header = document.createElement('div');
  header.className = 'til-pdf-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'til-pdf-title-wrap';

  const badge = document.createElement('span');
  badge.className = 'til-pdf-badge';
  badge.textContent = 'PDF Reader';

  viewerTitleEl = document.createElement('h2');
  viewerTitleEl.className = 'til-pdf-title';
  viewerTitleEl.textContent = 'Manuscript Preview';

  titleWrap.append(badge, viewerTitleEl);

  const actions = document.createElement('div');
  actions.className = 'til-pdf-actions';

  viewerNewTabLink = document.createElement('a');
  viewerNewTabLink.className = 'til-pdf-btn';
  viewerNewTabLink.target = '_blank';
  viewerNewTabLink.rel = 'noopener noreferrer';
  viewerNewTabLink.textContent = 'Open in Tab ↗';

  viewerDownloadLink = document.createElement('a');
  viewerDownloadLink.className = 'til-pdf-btn til-pdf-btn-primary';
  viewerDownloadLink.target = '_blank';
  viewerDownloadLink.rel = 'noopener noreferrer';
  viewerDownloadLink.textContent = 'Download PDF ↓';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'til-pdf-btn til-pdf-close';
  closeBtn.setAttribute('aria-label', 'Close PDF reader');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', closePdfViewerModal);

  actions.append(viewerNewTabLink, viewerDownloadLink, closeBtn);
  header.append(titleWrap, actions);

  const stage = document.createElement('div');
  stage.className = 'til-pdf-stage';

  viewerSpinnerEl = document.createElement('div');
  viewerSpinnerEl.className = 'til-pdf-spinner';
  viewerSpinnerEl.textContent = 'Loading document preview…';

  viewerFrameEl = document.createElement('iframe');
  viewerFrameEl.className = 'til-pdf-frame';
  viewerFrameEl.title = 'PDF Document Preview';
  viewerFrameEl.setAttribute('allow', 'fullscreen');
  viewerFrameEl.addEventListener('load', () => {
    if (viewerSpinnerEl) viewerSpinnerEl.hidden = true;
  });

  stage.append(viewerSpinnerEl, viewerFrameEl);
  dialog.append(header, stage);
  viewerModalEl.appendChild(dialog);

  viewerModalEl.addEventListener('click', (e) => {
    if (e.target === viewerModalEl) closePdfViewerModal();
  });

  if (!viewerEscBound) {
    viewerEscBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && viewerModalEl && viewerModalEl.classList.contains('is-open')) {
        closePdfViewerModal();
      }
    });
  }

  document.body.appendChild(viewerModalEl);
}

export function openPdfViewerModal(rawUrl, title = 'Document Preview') {
  const cleanUrl = normalizeWorkerAssetUrl(rawUrl);
  if (!cleanUrl) return;
  ensureViewerModal();

  viewerTitleEl.textContent = title || 'Document Preview';
  viewerNewTabLink.href = buildPdfViewerTabUrl(cleanUrl);
  viewerDownloadLink.href = cleanUrl;
  viewerSpinnerEl.hidden = false;
  viewerFrameEl.src = buildPdfEmbedUrl(cleanUrl);

  viewerModalEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

export function closePdfViewerModal() {
  if (!viewerModalEl) return;
  viewerModalEl.classList.remove('is-open');
  document.body.style.overflow = '';
  if (viewerFrameEl) {
    viewerFrameEl.src = 'about:blank';
  }
}

export function bindPdfPreviewTrigger(anchorEl, rawUrl, title = 'Document Preview') {
  if (!anchorEl || !rawUrl) return;
  const cleanUrl = normalizeWorkerAssetUrl(rawUrl);
  anchorEl.href = buildPdfViewerTabUrl(cleanUrl);
  anchorEl.target = '_blank';
  anchorEl.rel = 'noopener noreferrer';

  anchorEl.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (typeof e.button === 'number' && e.button !== 0)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    openPdfViewerModal(cleanUrl, title);
  });
}
