import React, { useRef, useEffect, useState } from 'react';

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
  const isInitialized = useRef(false);

  // Set initial content only once
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || '';
      isInitialized.current = true;
    }
  }, []);

  // Sync if value changes externally (e.g. on load from DB)
  useEffect(() => {
    if (editorRef.current && isInitialized.current) {
      const current = editorRef.current.innerHTML;
      if (value !== current && value !== undefined) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    emit();
  };

  const emit = () => {
    const html = editorRef.current?.innerHTML || '';
    onChange(html);
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

  return (
    <div style={{ border: '1px solid rgba(255,193,7,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
      {/* ── TOOLBAR ── */}
      <div
        style={{
          background: '#080808',
          borderBottom: '1px solid rgba(255,193,7,0.15)',
          padding: '6px 8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          alignItems: 'center',
        }}
      >
        {/* Bold / Italic / Underline / Strikethrough */}
        <button style={btn()} onMouseDown={e => { e.preventDefault(); exec('bold'); }} title="Pogrubienie"><strong>B</strong></button>
        <button style={{ ...btn(), fontStyle: 'italic' }} onMouseDown={e => { e.preventDefault(); exec('italic'); }} title="Kursywa"><em>I</em></button>
        <button style={{ ...btn(), textDecoration: 'underline' }} onMouseDown={e => { e.preventDefault(); exec('underline'); }} title="Podkreślenie"><u>U</u></button>
        <button style={{ ...btn(), textDecoration: 'line-through' }} onMouseDown={e => { e.preventDefault(); exec('strikeThrough'); }} title="Przekreślenie">S̶</button>

        {sep()}

        {/* Alignment */}
        <button style={btn()} onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }} title="Do lewej">⬛◻◻</button>
        <button style={btn()} onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }} title="Wyśrodkuj">◻⬛◻</button>
        <button style={btn()} onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }} title="Do prawej">◻◻⬛</button>
        <button style={btn()} onMouseDown={e => { e.preventDefault(); exec('justifyFull'); }} title="Wyjustuj">⬛⬛⬛</button>

        {sep()}

        {/* Lists */}
        <button style={btn()} onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }} title="Lista punktowana">• —</button>
        <button style={btn()} onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }} title="Lista numerowana">1. —</button>

        {sep()}

        {/* Indent */}
        <button style={btn()} onMouseDown={e => { e.preventDefault(); exec('indent'); }} title="Wcięcie">→</button>
        <button style={btn()} onMouseDown={e => { e.preventDefault(); exec('outdent'); }} title="Cofnij wcięcie">←</button>

        {sep()}

        {/* Font family */}
        <select
          onMouseDown={e => e.stopPropagation()}
          onChange={e => exec('fontName', e.target.value)}
          style={{
            ...btn(),
            padding: '4px 6px',
            background: '#0A0A0A',
            color: '#FFC107',
            fontSize: '0.7rem',
            maxWidth: '110px',
            cursor: 'pointer',
          }}
        >
          <option value="">Czcionka</option>
          {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {/* Font size */}
        <select
          onMouseDown={e => e.stopPropagation()}
          onChange={e => {
            // execCommand fontSize only supports 1-7, so we use a workaround with a span
            const size = e.target.value;
            editorRef.current?.focus();
            document.execCommand('fontSize', false, '7');
            const fontEls = editorRef.current?.querySelectorAll('font[size="7"]');
            fontEls?.forEach(el => {
              el.removeAttribute('size');
              el.style.fontSize = size + 'px';
            });
            emit();
          }}
          style={{
            ...btn(),
            padding: '4px 6px',
            background: '#0A0A0A',
            color: '#FFC107',
            fontSize: '0.7rem',
            width: '60px',
            cursor: 'pointer',
          }}
        >
          <option value="">Rozmiar</option>
          {SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
        </select>

        {sep()}

        {/* Text color */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
          <label style={{ ...btn(), padding: '3px 7px', position: 'relative', overflow: 'visible', gap: '3px' }} title="Kolor tekstu">
            <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>A</span>
            <input
              type="color"
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute', pointerEvents: 'none' }}
              onChange={e => exec('foreColor', e.target.value)}
            />
          </label>
        </div>

        {/* Background/highlight color */}
        <label style={{ ...btn(), padding: '3px 7px', position: 'relative', gap: '3px' }} title="Kolor tła tekstu">
          <span style={{ background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f)', width: 12, height: 10, borderRadius: '1px', display: 'inline-block' }} />
          <input
            type="color"
            style={{ opacity: 0, width: 0, height: 0, position: 'absolute', pointerEvents: 'none' }}
            onChange={e => exec('hiliteColor', e.target.value)}
          />
        </label>

        {sep()}

        {/* Quick color palette for text */}
        {COLORS.map(c => (
          <button
            key={c}
            title={c}
            onMouseDown={e => { e.preventDefault(); exec('foreColor', c); }}
            style={{
              width: 16,
              height: 16,
              background: c,
              border: c === '#FFFFFF' ? '1px solid #333' : '1px solid rgba(0,0,0,0.3)',
              cursor: 'pointer',
              borderRadius: '2px',
              flexShrink: 0,
              padding: 0,
            }}
          />
        ))}

        {sep()}

        {/* Clear formatting */}
        <button style={{ ...btn(), color: '#ff6666', borderColor: 'rgba(255,100,100,0.3)' }} onMouseDown={e => { e.preventDefault(); exec('removeFormat'); }} title="Wyczyść formatowanie">✕ fmt</button>
      </div>

      {/* ── EDITABLE AREA ── */}
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
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      />
    </div>
  );
}