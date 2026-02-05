export interface ActionButtonState {
  command: string;
  label?: string;
  disabled?: boolean;
  cooldownEndsAtMs?: number;
  cooldownDurationMs?: number;
}

export interface NavigationEntryState {
  id: string;
  label: string;
  isCurrent: boolean;
  canEnter: boolean;
}

export interface NavigationState {
  visible: boolean;
  entries: NavigationEntryState[];
}
