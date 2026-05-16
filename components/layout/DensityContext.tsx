"use client";

import { createContext, useContext } from "react";

export type Density = "dense" | "comfortable";

const DensityContext = createContext<Density>("dense");

export const DensityProvider = DensityContext.Provider;

export function useDensity(): Density {
  return useContext(DensityContext);
}

export function rowHeight(density: Density): number {
  return density === "comfortable" ? 44 : 36;
}
