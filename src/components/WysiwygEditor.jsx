import React, { useRef, useEffect } from 'react';

const FONTS = [
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Nunito', value: 'Nunito, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
];

const SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64', '72'];

const COLORS = [
  '#FFFFFF', '#FFC107', '#FFF020', '#FF4444', '#FF8800',
  '#00C864', '#00BFFF', '#A855F7', '#EC4899', '#000000',
  '#A1A1AA', '#555555', '#1a1a2e', '#16213e', '#0f3460',
];

export default function WysiwygEditor({ value, onChange, minHeight = '120px' }) {
  const editorRef = useRef(null);
  const isUserEditing = useRef(false);
  const lastExternalValue = useRef(null);

  // Set initial content once
  useEffect(() => {
    if (editorRef.current && lastExternalValue.current === null) {
      editorRef.current.innerHTML = value || '';
      lastExternalValue.current = value || '';
    }
  }, []);

  // Sync external value changes (e.g. when DB data loads)
  // Skip if the change came from our own emit
  useEffect(() => {
    if (!editorRef.current) return;
    if (isUserEditing.current) return;
    if (value === lastExternalValue.current) return;
    if (value === undefined) return;
    editorRef.current.innerHTML = value || '';
    lastExternalValue.current = value || '';
  }, [value]);

  const emit = () => {
    isUserEditing.current = true;
    const html = editorRef.current?.innerHTML || '';
    lastExternalValue.current = html;
    onChange(html);
    // Allow external sync again after React finishes updating
    requestAnimationFrame(() => { isUserEditing.current = false; });
  };

  // Execute a formatting command WITHOUT calling focus() first.
  // e.preventDefault() on mousedown already keeps focus/selection in the editor.
  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    emit();
  };

  const applyFontSize = (size) => {
    document.execCommand('fontSize', false, '7');
    const fontEls = editorRef.current?.querySelectorAll('font[size="7"]');
    fontEls?.forEach(el => {
      el.removeAttribute('size');
      el.style.fontSize = size + 'px';
    });
    emit();
  };

  const btn = (active = false) => ({
    background: active ? 'rgba(255,193,7,0.2)' : 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,193,7,0.25)',
    color: '#FFC107',
    padding: '4px 9px',
    cursor: 'pointer',
    fontSize: '0.72rem',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    borderRadius: '2px',
    transition: 'all 0.15s ease',
    lineHeight: 1.4,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const sep = () => (
    <div style={{ width: 1, height: 22, background: 'rgba(255,193,7,0.2)', margin: '0 3px', flexShrink: 0 }} />
  );

  const tool = (cmd, label, title, extraStyle = {}) => (
    <button
      style={{ ...btn(), ...extraStyle }}
      title={title}
      onMouseDown={e => { e.preventDefault(); exec(cmd); }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ border: '1px solid rgba(255,193,7,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
      {/* TOOLBAR */}
      <div style={{
        background: '#080808',
        borderBottom: '1px solid rgba(255,193,7,0.15)',
        padding: '6px 8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'center',
      }}>
        {/* Bold / Italic / Underline / Strikethrough */}
        {tool('bold',          <strong>B</strong>, 'Pogrubienie')}
        {tool('italic',        <em>I</em>,         'Kursywa',        { fontStyle: 'italic' })}
        {tool('underline',     <u>U</u>,            'Podkreślenie',   { textDecoration: 'underline' })}
        {tool('strikeThrough', <s>S</s>,            'Przekreślenie',  { textDecoration: 'line-through' })}

        {sep()}

        {/* Alignment */}
        {tool('justifyLeft',   '⬛◻◻', 'Do lewej')}
        {tool('justifyCenter', '◻⬛◻', 'Wyśrodkuj')}
        {tool('justifyRight',  '◻◻⬛', 'Do prawej')}
        {tool('justifyFull',   '⬛⬛⬛', 'Wyjustuj')}

        {sep()}

        {/* Lists */}
        {tool('insertUnorderedList', '• —', 'Lista punktowana')}
        {tool('insertOrderedList',   '1. —', 'Lista numerowana')}

        {sep()}

        {/* Indent */}
        {tool('indent',  '→', 'Wcięcie')}
        {tool('outdent', '←', 'Cofnij wcięcie')}

        {sep()}

        {/* Font family */}
        <select
          onMouseDown={e => e.stopPropagation()}
          onChange={e => { exec('fontName', e.target.value); e.target.value = ''; }}
          style={{ ...btn(), padding: '4px 6px', background: '#0A0A0A', color: '#FFC107', fontSize: '0.7rem', maxWidth: '110px', cursor: 'pointer' }}
          defaultValue=""
        >
          <option value="" disabled>Czcionka</option>
          {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {/* Font size */}
        <select
          onMouseDown={e => e.stopPropagation()}
          onChange={e => { applyFontSize(e.target.value); e.target.value = ''; }}
          style={{ ...btn(), padding: '4px 6px', background: '#0A0A0A', color: '#FFC107', fontSize: '0.7rem', width: '70px', cursor: 'pointer' }}
          defaultValue=""
        >
          <option value="" disabled>Rozmiar</option>
          {SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
        </select>

        {sep()}

        {/* Text color picker */}
        <label style={{ ...btn(), padding: '3px 7px', position: 'relative', gap: '3px', cursor: 'pointer' }} title="Kolor tekstu">
          <strong style={{ fontSize: '0.75rem' }}>A</strong>
          <input
            type="color"
            style={{ opacity: 0, width: 0, height: 0, position: 'absolute', pointerEvents: 'none' }}
            onInput={e => exec('foreColor', e.target.value)}
          />
        </label>

        {/* Highlight color picker */}
        <label style={{ ...btn(), padding: '3px 7px', position: 'relative', gap: '3px', cursor: 'pointer' }} title="Kolor tła tekstu">
          <span style={{ background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f)', width: 12, height: 10, borderRadius: '1px', display: 'inline-block' }} />
          <input
            type="color"
            style={{ opacity: 0, width: 0, height: 0, position: 'absolute', pointerEvents: 'none' }}
            onInput={e => exec('hiliteColor', e.target.value)}
          />
        </label>

        {sep()}

        {/* Quick color palette */}
        {COLORS.map(c => (
          <button
            key={c}
            title={c}
            onMouseDown={e => { e.preventDefault(); exec('foreColor', c); }}
            style={{
              width: 16, height: 16, background: c, padding: 0, flexShrink: 0, cursor: 'pointer',
              border: c === '#FFFFFF' ? '1px solid #333' : '1px solid rgba(0,0,0,0.3)',
              borderRadius: '2px',
            }}
          />
        ))}

        {sep()}

        {/* Clear formatting */}
        <button
          style={{ ...btn(), color: '#ff6666', borderColor: 'rgba(255,100,100,0.3)' }}
          onMouseDown={e => { e.preventDefault(); exec('removeFormat'); }}
          title="Wyczyść formatowanie"
        >
          ✕ fmt
        </button>
      </div>

      {/* EDITABLE AREA */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        style={{
          minHeight,
          padding: '0.875rem 1rem',
          background: '#1a1a1a',
          color: '#FFF',
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.9rem',
          lineHeight: 1.7,
          outline: 'none',
          wordBreak: 'break-word',
        }}
      />
    </div>
  );
}
