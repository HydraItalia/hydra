"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ToasterProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-center"
      richColors
      theme={theme as "light" | "dark" | "system"}
    />
  );
}
