# Codex Rules – Frontend Project

## Stack
- React + Vite
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui (Radix)
- Sonner for toasts

## Mandatory Rules (DO NOT VIOLATE)

### Refs & Types
- useRef(null) MUST be typed as RefObject<T | null>
- Props receiving refs MUST accept null
- Never type RefObject<T> when null is possible

### Performance
- Avoid inline callbacks in large lists
- Use React.memo only when props are stable
- Use useCallback for handlers passed to memoized children
- Use useMemo only for derived arrays or expensive computations

### Upload / Attachments
- Support: input, drag-and-drop, clipboard paste
- Block duplicates (name + size + lastModified)
- Revoke Object URLs on:
  - file removal
  - clear all
  - unmount (cleanup)
- Previews may be string | null

### SSR Safety
- Always guard window/document/localStorage
- matchMedia must handle old/new listeners

### UX / Accessibility
- Icon buttons MUST have aria-label
- window.open MUST use noopener,noreferrer
- Empty states should use role="status" and aria-live="polite"

### Code Style
- Prefer small pure helpers
- Avoid duplicated JSX blocks
- Add inline comments explaining non-obvious decisions
- Code must be API-ready (normalize data in hooks, not components)
