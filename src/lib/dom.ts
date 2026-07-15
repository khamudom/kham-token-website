/** Minimal typings for the Charm custom elements this site drives from script. */

export interface CharmRadio extends HTMLElement {
  checked: boolean;
  value: string;
}

export interface CharmRadioGroup extends HTMLElement {
  value: string;
}

export interface CharmButton extends HTMLElement {
  expanded: boolean;
}

export interface CharmDialog extends HTMLElement {
  open: boolean;
}

/** getElementById with a hard failure instead of a silent null. */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing required element: #${id}`);
  return el as T;
}
