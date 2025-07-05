// src/types.ts

/** Representa um item dentro de um diretório */
export interface DirectoryEntryInfo {
  full_path: any;
  path: string;
  name: string;
  is_dir: boolean;
  is_file: boolean;
}

/** Item de ação no submenu */
export interface ActionItem {
  label: string;
  shortcut?: string;
  action?: () => Promise<void>;
}

/** Divider (linha separadora) no submenu */
export interface DividerItem {
  divider: true;
}

/** União discriminada para cada linha do submenu */
export type SubmenuItem = ActionItem | DividerItem;
