'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check for saved theme preference first
    const savedTheme = localStorage.getItem('theme') as Theme;
    console.log('Saved theme from localStorage:', savedTheme);
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      console.log('Using saved theme:', savedTheme);
      setTheme(savedTheme);
    } else {
      // If no saved preference, check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('System prefers dark:', systemPrefersDark);
      setTheme(systemPrefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    console.log('Applying theme to DOM:', theme);
    // Update document class and save to localStorage
    const root = document.documentElement;
    console.log('Before theme change - root classes:', root.className);
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    console.log('After theme change - root classes:', root.className);
    localStorage.setItem('theme', theme);
    console.log('Theme applied, localStorage updated');
    
    // Force a repaint to ensure styles are applied
    root.style.display = 'none';
    root.offsetHeight; // Trigger reflow
    root.style.display = '';
  }, [theme, mounted]);

  const toggleTheme = () => {
    console.log('Toggle theme clicked, current theme:', theme);
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      console.log('Switching to theme:', newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context;
} 