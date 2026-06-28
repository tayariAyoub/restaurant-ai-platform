import type { ReactNode } from "react";

import { generateThemeCss, type ThemeConfig } from "@/lib/engine/ThemeMapper";

type ThemeProviderProps = {
  theme: ThemeConfig;
  children: ReactNode;
  scopeSelector?: string;
};

export function ThemeProvider({ theme, children, scopeSelector }: ThemeProviderProps) {
  return (
    <>
      <style data-restaurantai-theme>{generateThemeCss(theme, scopeSelector)}</style>
      {children}
    </>
  );
}

export default ThemeProvider;
