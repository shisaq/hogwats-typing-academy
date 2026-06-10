import React from 'react';

interface VirtualKeyboardProps {
  activeKey: string;
}

const keys = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ activeKey }) => {
  return (
    <div className="magic-keyboard flex flex-col items-center gap-2 mt-8 select-none">
      {keys.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2">
          {row.map((keyChar) => {
            const isActive = activeKey.toLowerCase() === keyChar;
            return (
              <div
                key={keyChar}
                className={`magic-key w-10 h-10 md:w-14 md:h-14 ${isActive ? 'active' : ''}`}
              >
                {keyChar}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex gap-2 mt-2">
         <div className={`magic-key space-bar w-64 h-12 ${activeKey === ' ' ? 'active' : ''}`}>
           SPACE
         </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;