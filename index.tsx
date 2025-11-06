import * as React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = 'pk_test_aW5ub2NlbnQtbXV0dC0xMi5jbGVyay5hY2NvdW50cy5kZXYk';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// If the key is available, render the app.
if (PUBLISHABLE_KEY) {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </React.StrictMode>
  );
} else {
  // This block is now effectively unreachable but kept as a safeguard.
  root.render(
    <React.StrictMode>
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="text-center p-8 max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Configuration Error</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Your Clerk Publishable Key is missing. This is required for authentication to work.
          </p>
          <div className="text-left bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">How to Fix:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                Go to your <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline font-medium">Clerk Dashboard</a>.
              </li>
              <li>Navigate to your project's API Keys page and copy your <strong>Publishable key</strong>.</li>
              <li>Set it as an environment variable named <code>CLERK_PUBLISHABLE_KEY</code> in this application's settings.</li>
            </ol>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-6">
            Once the key is set, please refresh this page.
          </p>
        </div>
      </div>
    </React.StrictMode>
  );
}