import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { HELP_REGISTRY, buildFallbackHelp, type HelpContent } from '@/lib/help-registry';
import { ALL_MENU_ITEMS } from '@/lib/menu-config';

interface HelpContextType {
  /** Resolve conteúdo por id (URL canônica). Nunca lança; usa fallback do menu. */
  getHelp: (id: string) => HelpContent | undefined;
  /** Resolve conteúdo a partir de um pathname, tolerando rotas filhas (/x/y/123). */
  getHelpForPath: (pathname: string) => HelpContent | undefined;
  activeHelp: HelpContent | null;
  openHelp: (id: string) => void;
  openHelpForPath: (pathname: string) => void;
  closeHelp: () => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [activeHelp, setActiveHelp] = useState<HelpContent | null>(null);

  const getHelp = useCallback((id: string): HelpContent | undefined => {
    const direct = HELP_REGISTRY[id];
    if (direct) return direct;
    // Fallback: item de menu existe, mas ainda não tem entrada dedicada no registry.
    const menuItem = ALL_MENU_ITEMS.find((i) => i.helpId === id || i.url === id);
    if (menuItem) return buildFallbackHelp(id, menuItem.title, menuItem.description);
    return undefined;
  }, []);

  const getHelpForPath = useCallback(
    (pathname: string): HelpContent | undefined => {
      if (!pathname) return undefined;
      const exact = getHelp(pathname);
      if (exact) return exact;
      // Rota filha: escolhe o item de menu de maior prefixo compatível.
      const match = ALL_MENU_ITEMS
        .filter((i) => i.url !== '/' && pathname.startsWith(i.url + '/'))
        .sort((a, b) => b.url.length - a.url.length)[0];
      return match ? getHelp(match.helpId ?? match.url) : undefined;
    },
    [getHelp],
  );

  const openHelp = useCallback(
    (id: string) => {
      const help = getHelp(id);
      if (help) setActiveHelp(help);
    },
    [getHelp],
  );

  const openHelpForPath = useCallback(
    (pathname: string) => {
      const help = getHelpForPath(pathname);
      if (help) setActiveHelp(help);
    },
    [getHelpForPath],
  );

  const closeHelp = useCallback(() => setActiveHelp(null), []);

  const value = useMemo(
    () => ({ getHelp, getHelpForPath, activeHelp, openHelp, openHelpForPath, closeHelp }),
    [getHelp, getHelpForPath, activeHelp, openHelp, openHelpForPath, closeHelp],
  );

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
}
