/**
 * The token drawer: theme, accent hue/saturation, and corner radius.
 * Changes persist per browser (when storage is available);
 * Reset restores the defaults below.
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
const DEFAULT_THEME: ThemeName = 'dark';
const TOKEN_DEFAULTS = { hue: 255, saturation: 69, radius: 4 } as const;

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

export function initTokenPanel(): void {
  const pane = byId('token-pane');
  const toggle = byId<CharmButton>('tokens-toggle');
  const hue = byId<HTMLInputElement>('hue');
  const hueOut = byId('hue-out');
  const saturation = byId<HTMLInputElement>('saturation');
  const saturationOut = byId('saturation-out');
  const radius = byId<HTMLInputElement>('radius');
  const radiusOut = byId('radius-out');

  let tokens: TokenState = { theme: DEFAULT_THEME, ...TOKEN_DEFAULTS, ...loadTokens() };

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
  }

  applyTokens();

  /* the trigger's `shows` attribute opens the dialog — Charm's documented
     drawer pattern (ch-dialog position="end"). The dialog handles its own
     close; we just keep the trigger state in sync. */
  new MutationObserver(() => {
    toggle.expanded = pane.hasAttribute('open');
  }).observe(pane, { attributes: true, attributeFilter: ['open'] });

  pane.addEventListener('dialog-after-show', syncThemeRadios);

  const themeGroup = byId<CharmRadioGroup>('theme-group');
  themeGroup.addEventListener('change', () => {
    if (!themeGroup.value) return;
    tokens.theme = themeGroup.value as ThemeName;
    setTheme(tokens.theme);
    saveTokens();
  });

  hue.addEventListener('input', () => {
    tokens.hue = Number(hue.value);
    root.style.setProperty('--accent-h', hue.value);
    hueOut.textContent = hue.value;
    saveTokens();
  });

  saturation.addEventListener('input', () => {
    tokens.saturation = Number(saturation.value);
    root.style.setProperty('--accent-s', saturation.value);
    saturationOut.textContent = `${saturation.value}%`;
    saveTokens();
  });

  radius.addEventListener('input', () => {
    tokens.radius = Number(radius.value);
    root.style.setProperty('--radius', `${radius.value}px`);
    radiusOut.textContent = `${radius.value}px`;
    saveTokens();
  });

  byId('tokens-reset').addEventListener('click', () => {
    clearTokens();
    tokens = { theme: DEFAULT_THEME, ...TOKEN_DEFAULTS };
    applyTokens();
  });
}
