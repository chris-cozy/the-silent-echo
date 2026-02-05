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

export interface StorageState {
  visible: boolean;
  items: string[];
  resources: { id: string; count: number }[];
  showResources: boolean;
}

export interface AiPanelState {
  visible: boolean;
  status: string;
  reason: string;
}
