import React, { useState } from 'react';

export default function TotpCodeInput({ value = '', onChange, inputRef, boxStyle }) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, 5);

  return (
    <div className="relative inline-flex gap-2" style={{ position: 'relative' }}>
      {Array.from({ length: 6 }, (_, index) => {
        const digit = value[index] || '';
        const active = focused && index === activeIndex;
        return (
          <span
            key={index}
            aria-hidden="true"
            className={`totp-box ${digit ? 'filled' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: active ? '#FFC107' : undefined,
              boxShadow: active ? '0 0 16px rgba(255, 193, 7, 0.5)' : undefined,
              ...boxStyle,
            }}
          >
            {digit}
          </span>
        );
      })}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="6-cyfrowy kod Authenticatora"
        maxLength={6}
        value={value}
        onChange={event => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onClick={event => {
          const end = event.currentTarget.value.length;
          event.currentTarget.setSelectionRange(end, end);
        }}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'text',
        }}
      />
    </div>
  );
}
