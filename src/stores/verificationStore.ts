import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VerifiedNumber, UnlistedPhone } from '@/types';

interface VerificationState {
  verifiedNumbers: VerifiedNumber[];
  unlistedNumbers: UnlistedPhone[];
  setVerifiedNumbers: (numbers: VerifiedNumber[]) => void;
  setUnlistedNumbers: (numbers: UnlistedPhone[]) => void;
  updateVerifiedNumber: (index: number, updates: Partial<VerifiedNumber>) => void;
  updateUnlistedNumber: (index: number, updates: Partial<UnlistedPhone>) => void;
  addUnlistedNumber: () => void;
  removeUnlistedNumber: (index: number) => void;
  clearAll: () => void;
}

// 创建基于token的store工厂函数
export const createVerificationStore = (token: string) => {
  return create<VerificationState>()(
    persist(
      (set) => ({
        verifiedNumbers: [],
        unlistedNumbers: [],

        setVerifiedNumbers: (numbers) =>
          set({ verifiedNumbers: numbers }),

        setUnlistedNumbers: (numbers) =>
          set({ unlistedNumbers: numbers }),

        updateVerifiedNumber: (index, updates) =>
          set((state) => ({
            verifiedNumbers: state.verifiedNumbers.map((item, i) =>
              i === index ? { ...item, ...updates } : item
            ),
          })),

        updateUnlistedNumber: (index, updates) =>
          set((state) => ({
            unlistedNumbers: state.unlistedNumbers.map((item, i) =>
              i === index ? { ...item, ...updates } : item
            ),
          })),

        addUnlistedNumber: () =>
          set((state) => ({
            unlistedNumbers: [
              ...state.unlistedNumbers,
              {
                phoneNumber: '',
                purpose: '',
                userComment: '',
              },
            ],
          })),

        removeUnlistedNumber: (index) =>
          set((state) => ({
            unlistedNumbers: state.unlistedNumbers.filter((_, i) => i !== index),
          })),

        clearAll: () =>
          set({
            verifiedNumbers: [],
            unlistedNumbers: [],
          }),
      }),
      {
        name: `verification-${token}`,
        storage: {
          getItem: (name) => {
            const value = sessionStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: (name, value) => {
            sessionStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            sessionStorage.removeItem(name);
          },
        },
      }
    )
  );
}; 