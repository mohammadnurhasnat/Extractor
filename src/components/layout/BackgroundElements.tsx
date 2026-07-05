import React from 'react';
import { BackgroundGradientAnimation } from '../ui/background-gradient-animation';

export function BackgroundElements() {
  return (
    <>
      {/* Ambient soft background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 print:hidden">
        <div className="absolute top-[5%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-400/8 dark:bg-blue-600/5 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] rounded-full bg-indigo-400/8 dark:bg-indigo-600/5 blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute top-[30%] right-[10%] w-[25rem] h-[25rem] rounded-full bg-sky-300/5 dark:bg-sky-500/3 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      {/* Interactive Background Gradient Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 print:hidden opacity-30 dark:opacity-20">
        <BackgroundGradientAnimation 
          containerClassName="w-full h-full"
          gradientBackgroundStart="transparent"
          gradientBackgroundEnd="transparent"
          firstColor="59, 130, 246"
          secondColor="99, 102, 241"
          thirdColor="147, 51, 234"
          size="60%"
        />
      </div>
    </>
  );
}
