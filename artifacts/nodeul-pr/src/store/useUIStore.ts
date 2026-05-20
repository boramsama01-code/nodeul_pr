import { create } from 'zustand';

type UIStore = {
  npcMessage: string;
  showNPC: boolean;
  showLandingBubble: boolean;
  npcBadgeCount: number;
  npcBadgeText: string;
  setNPCMessage: (message: string) => void;
  setShowNPC: (show: boolean) => void;
  setShowLandingBubble: (show: boolean) => void;
  setNpcBadgeCount: (count: number) => void;
  setNpcBadge: (count: number, text?: string) => void;
  isCRTEnabled: boolean;
  toggleCRT: () => void;
};

export const useUIStore = create<UIStore>((set) => ({
  npcMessage: "안녕하세요! 노들섬 홍보 통합 시스템에 오신 것을 환영합니다! 🏝️",
  showNPC: false,
  showLandingBubble: false,
  npcBadgeCount: 0,
  npcBadgeText: "",
  setNPCMessage: (message) => set({ npcMessage: message }),
  setShowNPC: (show) => set({ showNPC: show }),
  setShowLandingBubble: (show) => set({ showLandingBubble: show }),
  setNpcBadgeCount: (count) => set({ npcBadgeCount: count }),
  setNpcBadge: (count, text = "") => set({ npcBadgeCount: count, npcBadgeText: text }),
  isCRTEnabled: true,
  toggleCRT: () => set((state) => ({ isCRTEnabled: !state.isCRTEnabled })),
}));
