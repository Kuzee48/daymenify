import { create } from 'zustand';

export type ModalType =
  | 'login'
  | 'register'
  | 'cart'
  | 'search'
  | 'payment'
  | 'confirm'
  | null;

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isSidebarCollapsed: boolean;
  activeModal: ModalType;
  modalData: Record<string, unknown> | null;
  toasts: Toast[];
}

export interface UIActions {
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export type UIStore = UIState & UIActions;

const generateId = () => Math.random().toString(36).slice(2, 11);

export const useUIStore = create<UIStore>((set) => ({
  // State
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isSidebarCollapsed: false,
  activeModal: null,
  modalData: null,
  toasts: [],

  // Actions
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  setMobileMenuOpen: (isOpen: boolean) =>
    set({ isMobileMenuOpen: isOpen }),

  toggleSearch: () =>
    set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  setSearchOpen: (isOpen: boolean) =>
    set({ isSearchOpen: isOpen }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setSidebarCollapsed: (isCollapsed: boolean) =>
    set({ isSidebarCollapsed: isCollapsed }),

  openModal: (modal: ModalType, data?: Record<string, unknown>) =>
    set({ activeModal: modal, modalData: data || null }),

  closeModal: () =>
    set({ activeModal: null, modalData: null }),

  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove toast after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}));
