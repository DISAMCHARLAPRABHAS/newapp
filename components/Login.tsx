import React from 'react';
import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton } from '@clerk/clerk-react';

const Login: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <SignedIn>
        {/* UserButton shows avatar and dropdown with sign out etc. */}
        <UserButton />
        <SignOutButton>
          <button
            className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </SignOutButton>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600">Sign in</button>
        </SignInButton>
      </SignedOut>
    </div>
  );
};

export default Login;
