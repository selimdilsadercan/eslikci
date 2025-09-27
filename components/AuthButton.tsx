'use client';

import { useUser } from '@clerk/nextjs';
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

export default function AuthButton() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>;
  }

  if (isSignedIn) {
    return <UserButton afterSignOutUrl="/" />;
  }

  return (
    <div className="flex items-center space-x-2">
      <SignInButton mode="modal">
        <button className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Sign Up
        </button>
      </SignUpButton>
    </div>
  );
}
