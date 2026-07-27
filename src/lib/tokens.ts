/**
 * The token drawer: theme, accent hue/saturation, and corner radius.
 * Changes persist per browser (when storage is available);
 * Reset restores the defaults below.
 *
 * Also drives the diagram annotations: every element with [data-spec]
 * is a printed measurement that re-prints when a token is adjusted.
 */
import { byId, type CharmButton, type CharmRadioGroup } from './dom';

type ThemeName = 'light' | 'dark' | 'contrast';

interface TokenState {
  theme: ThemeName;
  hue: number;
  saturation: number;
  radius: number;
}

const TOKEN_KEY = 'kham.tokens';
const DEFAULT_THEME: ThemeName = 'light'; /* cream key-visual day */
const TOKEN_DEFAULTS = { hue: 39, saturation: 120, radius: 12 } as const;

const root = document.documentElement;

function setTheme(name: ThemeName): void {
  root.setAttribute('data-theme', name);
}

function loadTokens(): Partial<TokenState> | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as Partial<TokenState>) : null;
  } catch {
    return null;
  }
}

/* ---- diagram annotations: live printed measurements ---- */

/** Resolve the current --accent to a short printable color string. */
function resolvedAccent(probe: HTMLElement): string {
  const raw = getComputedStyle(probe).backgroundColor;
  const rgb = raw.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (rgb && rgb[1] && rgb[2] && rgb[3]) {
    const hex = (n: string) => Number(n).toString(16).padStart(2, '0');
    return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`;
  }
  /* oklch()/color() strings: shorten long decimals for print */
  return raw.replace(/(\d+\.\d{3})\d+/g, '$1');
}

/** Deepest active element, descending through open shadow roots. */
function deepActiveElement(): Element | null {
  let el: Element | null = document.activeElement;
  while (el instanceof HTMLElement && el.shadowRoot?.activeElement) {
    el = el.shadowRoot.activeElement;
  }
  return el;
}

function isVisibleFocusable(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  const style = getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Charm's FocusTrapController is disabled and the <dialog> shell itself is
 * tabindex=0, so Tab lands on the empty shell between real controls. Collect
 * only the interactive targets inside the drawer.
 */
function trapFocusables(pane: HTMLElement): HTMLElement[] {
  const list: HTMLElement[] = [];
  const closeBtn = pane.shadowRoot?.querySelector<HTMLElement>(
    '[part="dialog-close-button"], .close-btn',
  );
  if (closeBtn) list.push(closeBtn);

  pane
    .querySelectorAll<HTMLElement>('ch-radio, input[type="range"], ch-button, button, a[href]')
    .forEach((el) => list.push(el));

  return list.filter(isVisibleFocusable);
}

function focusTrapTarget(el: HTMLElement): void {
  el.focus({ preventScroll: true });
}

function makeCaptionUpdater(tokens: TokenState): () => void {
  const captions = document.querySelectorAll<HTMLElement>('[data-spec]');
  if (captions.length === 0) return () => {};

  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;width:0;height:0;overflow:hidden;background:var(--accent)';
  probe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(probe);

  return () => {
    captions.forEach((el) => {
      switch (el.dataset.spec) {
        case 'hue':
          el.textContent = `--accent-h: ${tokens.hue}`;
          break;
        case 'radius':
          el.textContent = `--radius: ${tokens.radius}px`;
          break;
        case 'theme':
          el.textContent = `theme: ${tokens.theme}`;
          break;
        case 'accent':
          el.textContent = `--accent: ${resolvedAccent(probe)}`;
          break;
        case 'border':
          /* set by the theme (2px in high contrast), so read it computed */
          el.textContent = `--border-w: ${getComputedStyle(root).getPropertyValue('--border-w').trim()}`;
          break;
      }
    });
  };
}

export function initTokenPanel(): void {
  const pane = byId('token-pane');
  const toggle = byId<CharmButton>('tokens-toggle');
  const hue = byId<HTMLInputElement>('hue');
  const hueOut = byId('hue-out');
  const saturation = byId<HTMLInputElement>('saturation');
  const saturationOut = byId('saturation-out');
  const radius = byId<HTMLInputElement>('radius');
  const radiusOut = byId('radius-out');
  const swatches = document.querySelectorAll<HTMLButtonElement>('[data-set-theme]');

  /* mutated in place: the caption updater closes over this object */
  const tokens: TokenState = { theme: DEFAULT_THEME, ...TOKEN_DEFAULTS, ...loadTokens() };
  const updateCaptions = makeCaptionUpdater(tokens);

  function saveTokens(): void {
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    } catch {
      /* storage unavailable: session-only */
    }
  }

  function clearTokens(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  function syncThemeRadios(): void {
    /* ch-radio-group owns selection via `value`; setting individual radios races
       with the group's slot sync and clears the checked indicator. */
    void Promise.all([
      customElements.whenDefined('ch-radio-group'),
      customElements.whenDefined('ch-radio'),
    ]).then(() => {
      byId<CharmRadioGroup>('theme-group').value = tokens.theme;
    });
  }

  function syncSwatches(): void {
    swatches.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.setTheme === tokens.theme));
    });
  }

  function syncSliderAvailability(): void {
    /* hi-con locks accent + radius: accent is a fixed turquoise. */
    const locked = tokens.theme === 'contrast';
    for (const input of [hue, saturation, radius]) {
      input.disabled = locked;
      input.setAttribute('aria-disabled', String(locked));
    }
  }

  function applyTheme(name: ThemeName): void {
    tokens.theme = name;
    setTheme(name);
    syncThemeRadios();
    syncSwatches();
    syncSliderAvailability();
    updateCaptions();
    saveTokens();
  }

  function applyTokens(): void {
    setTheme(tokens.theme);
    root.style.setProperty('--accent-h', String(tokens.hue));
    root.style.setProperty('--accent-s', String(tokens.saturation));
    root.style.setProperty('--radius', `${tokens.radius}px`);
    hue.value = String(tokens.hue);
    hueOut.textContent = String(tokens.hue);
    saturation.value = String(tokens.saturation);
    saturationOut.textContent = `${tokens.saturation}%`;
    radius.value = String(tokens.radius);
    radiusOut.textContent = `${tokens.radius}px`;
    syncThemeRadios();
    syncSwatches();
    syncSliderAvailability();
    updateCaptions();
  }

  applyTokens();

  /* the trigger's `shows` attribute opens the dialog. Charm's documented
     drawer pattern (ch-dialog position="end"). The dialog handles its own
     close; we just keep the trigger state in sync. */
  new MutationObserver(() => {
    toggle.expanded = pane.hasAttribute('open');
  }).observe(pane, { attributes: true, attributeFilter: ['open'] });

  /* Trap is active only while the drawer is fully open. During close,
     browser/Charm focus-restore to #tokens-toggle must not be yanked back. */
  let trapActive = false;
  let closeWithKeyboard = false;
  let keyActivated = false;

  document.addEventListener(
    'keydown',
    (event) => {
      if (!pane.hasAttribute('open')) return;
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        keyActivated = true;
      }
    },
    true,
  );
  document.addEventListener(
    'pointerdown',
    () => {
      if (pane.hasAttribute('open')) keyActivated = false;
    },
    true,
  );

  function demoteDialogShell(): void {
    /* Charm sets tabindex=0 on <dialog> while open. that empty shell is
       what Tab was hitting. Keep it out of the cycle. */
    const dialog = pane.shadowRoot?.querySelector<HTMLElement>('dialog');
    if (dialog) dialog.tabIndex = -1;
  }

  function activateFocusTrap(): void {
    demoteDialogShell();
    trapActive = true;
    const first = trapFocusables(pane)[0];
    if (first) focusTrapTarget(first);
  }

  pane.addEventListener('dialog-after-show', () => {
    syncThemeRadios();
    activateFocusTrap();
  });

  pane.addEventListener('dialog-request-close', (event) => {
    trapActive = false;
    const source = (event as CustomEvent<{ source?: string }>).detail?.source;
    /* Esc → source "keyboard". Enter/Space on close → source "close-button"
       but keydown ran first (no pointerdown), so keyActivated stays true. */
    closeWithKeyboard = source === 'keyboard' || (source === 'close-button' && keyActivated);
  });

  /** Focus the opener only after <dialog> leaves :modal. earlier and the
   *  top-layer trap eats the focus and parks it on the dialog shell. */
  let restoreQueued = false;
  function restoreTriggerWhenFree(): void {
    const dialog = pane.shadowRoot?.querySelector<HTMLDialogElement>('dialog');
    if (dialog?.matches(':modal')) {
      requestAnimationFrame(restoreTriggerWhenFree);
      return;
    }
    restoreQueued = false;
    if (closeWithKeyboard) {
      toggle.focus({ preventScroll: true });
    } else if (document.activeElement === toggle) {
      toggle.blur();
    }
    closeWithKeyboard = false;
    keyActivated = false;
  }

  function queueTriggerRestore(): void {
    if (restoreQueued) return;
    restoreQueued = true;
    restoreTriggerWhenFree();
  }

  pane.addEventListener('dialog-hide', () => {
    trapActive = false;
    queueTriggerRestore();
  });

  pane.addEventListener('dialog-after-hide', () => {
    trapActive = false;
    queueTriggerRestore();
  });

  /* Hard trap: own every Tab step so the browser never lands on Charm's
     tabindex=0 dialog shell (or escapes to the page). */
  document.addEventListener(
    'keydown',
    (event) => {
      if (!trapActive || event.key !== 'Tab') return;

      const focusables = trapFocusables(pane);
      if (focusables.length === 0) return;

      const active = deepActiveElement();
      let index = focusables.findIndex(
        (el) => el === active || el.contains(active) || !!el.shadowRoot?.contains(active),
      );
      if (index < 0) index = 0;

      const next = event.shiftKey
        ? focusables[(index - 1 + focusables.length) % focusables.length]!
        : focusables[(index + 1) % focusables.length]!;

      event.preventDefault();
      event.stopPropagation();
      focusTrapTarget(next);
    },
    true,
  );

  document.addEventListener(
    'focusin',
    (event) => {
      if (!trapActive) return;
      const target = event.target;
      if (!(target instanceof Node)) return;

      /* Never fight focus returning to the opener. */
      if (target === toggle || toggle.contains(target)) return;

      const inPane =
        target === pane ||
        pane.contains(target) ||
        !!pane.shadowRoot?.contains(target);
      if (inPane) {
        if (
          target instanceof HTMLElement &&
          (target.localName === 'dialog' || target.part?.contains('dialog-base'))
        ) {
          const first = trapFocusables(pane)[0];
          if (first) focusTrapTarget(first);
        }
        return;
      }

      const fallback = trapFocusables(pane)[0];
      if (fallback) focusTrapTarget(fallback);
    },
    true,
  );

  const themeGroup = byId<CharmRadioGroup>('theme-group');
  themeGroup.addEventListener('change', () => {
    if (!themeGroup.value) return;
    applyTheme(themeGroup.value as ThemeName);
  });

  swatches.forEach((btn) => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.setTheme as ThemeName);
    });
  });

  hue.addEventListener('input', () => {
    tokens.hue = Number(hue.value);
    root.style.setProperty('--accent-h', hue.value);
    hueOut.textContent = hue.value;
    updateCaptions();
    saveTokens();
  });

  saturation.addEventListener('input', () => {
    tokens.saturation = Number(saturation.value);
    root.style.setProperty('--accent-s', saturation.value);
    saturationOut.textContent = `${saturation.value}%`;
    updateCaptions();
    saveTokens();
  });

  radius.addEventListener('input', () => {
    tokens.radius = Number(radius.value);
    root.style.setProperty('--radius', `${radius.value}px`);
    radiusOut.textContent = `${radius.value}px`;
    updateCaptions();
    saveTokens();
  });

  byId('tokens-reset').addEventListener('click', () => {
    clearTokens();
    Object.assign(tokens, { theme: DEFAULT_THEME, ...TOKEN_DEFAULTS });
    applyTokens();
  });
}
