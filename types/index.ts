export * from "./database";

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  disabled?: boolean;
}

export interface UserSessionState {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  isLoading: boolean;
}
