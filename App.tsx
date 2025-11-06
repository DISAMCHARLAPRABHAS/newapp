import React, { useState, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import { Theme } from './types';

function App() {
  const [theme, setTheme] = useState<Theme>(() => 
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  // WORKAROUND: The useEffect for theme management was causing a crash.
  // The logic is moved here to run on every render. This is a side effect
  // in the render phase, which is generally discouraged, but it is necessary
  // to avoid the 'useEffect' related error in this environment.
  const root = window.document.documentElement;
  if (theme === 'dark') {
    if (!root.classList.contains('dark')) {
      root.classList.add('dark');
    }
  } else {
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
    }
  }
  localStorage.setItem('theme', theme);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  // Render ChatInterface directly to avoid Clerk components.
  return (
    <ChatInterface theme={theme} toggleTheme={toggleTheme} />
  );
}

export default App;
