import { useState, useCallback } from 'react';
import type { Pet } from '../types/pets/pet';

interface UseAIChatReturn {
  isChatOpen: boolean;
  selectedPet: Pet | undefined;
  openChat: (pet?: Pet) => void;
  closeChat: () => void;
  toggleChat: () => void;
}

/**
 * Hook for managing AI chatbot state across the application
 */
export const useAIChat = (): UseAIChatReturn => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | undefined>();

  const openChat = useCallback((pet?: Pet) => {
    setSelectedPet(pet);
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    // Don't clear selectedPet immediately to allow for smooth closing animation
    setTimeout(() => setSelectedPet(undefined), 300);
  }, []);

  const toggleChat = useCallback(() => {
    if (isChatOpen) {
      closeChat();
    } else {
      openChat();
    }
  }, [isChatOpen, closeChat, openChat]);

  return {
    isChatOpen,
    selectedPet,
    openChat,
    closeChat,
    toggleChat,
  };
};

