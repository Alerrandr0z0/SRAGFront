import type React from 'react';
import type { ReactNode } from 'react';

const AuthLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-2 px-4 py-6 dark:bg-boxdark-2 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">{children}</div>
    </div>
  );
};

export default AuthLayout;
