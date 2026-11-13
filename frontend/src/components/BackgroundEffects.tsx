import React from 'react';

export const BackgroundEffects: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Clean, subtle ambient soft gradients for a premium white canvas */}
      <div className="absolute -top-32 -left-32 w-96 sm:w-[500px] h-96 sm:h-[500px] rounded-full bg-gradient-to-br from-red-50/20 via-yellow-50/15 to-transparent blur-3xl opacity-60" />
      <div className="absolute top-1/3 -right-32 w-96 sm:w-[550px] h-96 sm:h-[550px] rounded-full bg-gradient-to-bl from-blue-50/25 via-emerald-50/15 to-transparent blur-3xl opacity-50" />
      <div className="absolute -bottom-32 left-1/4 w-80 sm:w-[450px] h-80 sm:h-[450px] rounded-full bg-gradient-to-t from-slate-50/50 to-transparent blur-3xl opacity-40" />
    </div>
  );
};
