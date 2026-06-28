import type { ReactNode } from "react";

import { generateThemeCss, type ThemeConfig } from "@/lib/engine/ThemeMapper";

type ThemeProviderProps = {
  theme: ThemeConfig;
  children: ReactNode;
};

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  return (
    <>
      <style data-restaurantai-theme>{generateThemeCss(theme)}</style>
      {children}
    </>
  );
}

export default ThemeProvider;
