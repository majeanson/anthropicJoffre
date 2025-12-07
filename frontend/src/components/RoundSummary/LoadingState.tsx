/**
 * LoadingState Component
 *
 * Displays a loading animation while round data is being calculated.
 */

import React from 'react';

export const LoadingState: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          {/* Spinning cards animation */}
          <div className="flex gap-2 mb-4">
            <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-red-500 to-red-700 delay-0"></div>
            <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-yellow-500 to-orange-500 delay-100"></div>
            <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-green-500 to-emerald-600 delay-200"></div>
            <div className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-br from-purple-500 to-indigo-600 delay-300"></div>
          </div>
          <p className="text-center text-lg font-semibold text-skin-secondary animate-pulse">
            Calculating round results...
          </p>
        </div>
      </div>
    </div>
  );
};
