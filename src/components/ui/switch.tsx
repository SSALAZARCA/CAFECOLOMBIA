import React from 'react';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onCheckedChange,
  disabled = false,
  className = '',
  id
}) => {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  const baseClasses = 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2';
  const enabledClasses = checked 
    ? 'bg-amber-600' 
    : 'bg-gray-200';
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  const cursorClasses = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

  const thumbClasses = `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
    checked ? 'translate-x-6' : 'translate-x-1'
  }`;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      id={id}
      className={`${baseClasses} ${enabledClasses} ${disabled ? disabledClasses : ''} ${cursorClasses} ${className}`}
    >
      <span className={thumbClasses} />
    </button>
  );
};