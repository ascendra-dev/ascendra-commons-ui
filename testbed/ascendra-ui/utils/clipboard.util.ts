/**
 * Copies `text`, resolving `true` on success. The Clipboard API exists only in a secure context (https, or
 * localhost) — opened over plain http by machine name or IP (e.g. a dev machine over Tailscale),
 * `navigator.clipboard` is undefined. There, and if the API rejects, it falls back to selecting a hidden textarea and
 * `document.execCommand('copy')`, which still works in every browser (iOS Safari included).
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

function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', ''); // no on-screen keyboard on touch devices
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.opacity = '0';
  // Inside an open dialog / sheet, its focus trap would pull focus (and the selection) straight back out of a
  // textarea appended to <body> — so put it inside the dialog.
  const host = document.activeElement?.closest('[role="dialog"]') ?? document.body;
  host.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}
