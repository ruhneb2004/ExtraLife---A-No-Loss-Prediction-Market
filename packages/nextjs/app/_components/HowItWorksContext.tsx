"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface HowItWorksContextType {
  showModal: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const HowItWorksContext = createContext<HowItWorksContextType | undefined>(undefined);

export const HowItWorksProvider = ({ children }: { children: ReactNode }) => {
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <HowItWorksContext.Provider value={{ showModal, openModal, closeModal }}>
      {children}
    </HowItWorksContext.Provider>
  );
};

export const useHowItWorks = () => {
  const context = useContext(HowItWorksContext);
  if (!context) {
    throw new Error("useHowItWorks must be used within HowItWorksProvider");
  }
  return context;
};
