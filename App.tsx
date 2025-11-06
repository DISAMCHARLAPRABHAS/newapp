import * as React from 'react';
import ChatInterface from './components/ChatInterface';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { BotIcon } from './constants';
import { Theme } from './types';

function App() {
  const [theme, setTheme] = React.useState<Theme>(() => 
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

  const toggleTheme = React.useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <>
      <SignedIn>
        <ChatInterface theme={theme} toggleTheme={toggleTheme} />
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <div className="text-center p-8 max-w-md">
                <div className="flex justify-center mb-6">
                    <BotIcon />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Synapse</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    Sign in to start your AI-powered search for tickets and products.
                </p>
                <div className="flex justify-center gap-4">
                    <SignInButton mode="modal">
                       <button className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200">
                            Sign In
                        </button>
                    </SignInButton>
                     <SignUpButton mode="modal">
                        <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-bold py-3 px-6 rounded-full transition-colors duration-200">
                            Sign Up
                        </button>
                    </SignUpButton>
                </div>
            </div>
        </div>
      </SignedOut>
    </>
  );
}

export default App;