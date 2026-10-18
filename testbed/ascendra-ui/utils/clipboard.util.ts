/**
 * Copies `text`, resolving `true` on success. The Clipboard API exists only in a secure context (https, or
 * localhost) — opened over plain http by machine name or IP (e.g. a dev machine over Tailscale),
 * `navigator.clipboard` is undefined. There, and if the API rejects, it falls back to `document.execCommand('copy')`
 * on a selected, hidden span, which still works in every browser (iOS Safari included).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // permission denied, or no user activation — try the legacy path
    }
  }
  return legacyCopy(text);
}

/**
 * Selects `text` in a hidden, non-editable span with a Range — nothing takes focus. Focusing an input or textarea
 * instead makes iOS Safari scroll and resize the page for the keyboard, which broke an open sheet's scroll lock
 * (the page behind started scrolling).
 */
function legacyCopy(text: string): boolean {
  const span = document.createElement('span');
  span.textContent = text;
  span.style.position = 'fixed';
  span.style.top = '0';
  span.style.clip = 'rect(0, 0, 0, 0)';
  span.style.whiteSpace = 'pre';
  // A copy target is often `select-none` (WithCopyText is) — the span must stay selectable.
  span.style.userSelect = 'text';
  span.style.webkitUserSelect = 'text';
  // Inside an open dialog / sheet, so the selection sits in what its scroll lock and focus trap allow.
  const host = document.activeElement?.closest('[role="dialog"]') ?? document.body;
  host.appendChild(span);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(span);
  selection?.removeAllRanges();
  selection?.addRange(range);
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    selection?.removeAllRanges();
    span.remove();
  }
}
