import React, { createContext, useContext, useState, ReactNode } from 'react';
import { HELP_REGISTRY, HelpContent } from '@/lib/help-registry';

interface HelpContextType {
  getHelp: (id: string) => HelpContent | undefined;
  activeHelp: HelpContent | null;
  openHelp: (id: string) => void;
  closeHelp: () => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [activeHelp, setActiveHelp] = useState<HelpContent | null>(null);

  const getHelp = (id: string) => HELP_REGISTRY[id];
  
  const openHelp = (id: string) => {
    const help = getHelp(id);
    if (help) setActiveHelp(help);
  };

  const closeHelp = () => setActiveHelp(null);

  return (
    <HelpContext.Provider value={{ getHelp, activeHelp, openHelp, closeHelp }}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
}
