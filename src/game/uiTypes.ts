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
  actionLabel?: string;
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
  message: string;
  queryAvailable: boolean;
}

export interface MapPanelState {
  visible: boolean;
  text: string;
}

export interface PowerPanelRowState {
  id: string;
  label: string;
  units: number;
  locked: boolean;
  canIncrease: boolean;
  canDecrease: boolean;
  warningInspectable: boolean;
}

export interface PowerPanelState {
  unlocked: boolean;
  inPowerRoom: boolean;
  availablePower: number;
  rows: PowerPanelRowState[];
}
