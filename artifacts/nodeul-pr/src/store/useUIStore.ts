import { create } from 'zustand';

type UIStore = {
  npcMessage: string | null;
  showNPC: boolean;
  setNPCMessage: (message: string | null) => void;
  toggleNPC: () => void;
  isCRTEnabled: boolean;
  toggleCRT: () => void;
};

export const useUIStore = create<UIStore>((set) => ({
  npcMessage: "안녕하세요! 홍보 신청을 도와드릴게요!",
  showNPC: true,
  setNPCMessage: (message) => set({ npcMessage: message }),
  toggleNPC: () => set((state) => ({ showNPC: !state.showNPC })),
  isCRTEnabled: true,
  toggleCRT: () => set((state) => ({ isCRTEnabled: !state.isCRTEnabled })),
}));