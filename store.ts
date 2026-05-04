import { create } from 'zustand';
import * as THREE from 'three';

interface AppState {
  scrollProgress: number;
  mousePos: THREE.Vector2;
  route: string;
  setScrollProgress: (p: number) => void;
  setMousePos: (m: THREE.Vector2) => void;
  setRoute: (r: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  scrollProgress: 0,
  mousePos: new THREE.Vector2(0, 0),
  route: window.location.hash || '#/',
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setMousePos: (mousePos) => set({ mousePos }),
  setRoute: (route) => set({ route }),
}));
