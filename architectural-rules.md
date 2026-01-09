You are working on a React + TypeScript + Vite + Tailwind project.

Always follow these architectural rules:

GENERAL PRINCIPLES
- Prefer simplicity over abstraction.
- Do not introduce patterns unless they clearly reduce complexity.
- Avoid boilerplate, wrapper components, and files with no clear responsibility.
- Fewer files with clear purpose is better than many thin files.

PAGES
- Pages are composition layers only.
- A page may:
  - compose layouts and features
  - connect hooks
  - pass props
- A page must NOT:
  - contain business logic
  - contain device, browser, or platform detection
  - handle window, history, navigator, or DOM side-effects
- Pages should stay small (ideally under ~50 lines).

LAYOUTS
- Layouts define structure and UI composition only.
- Layouts must be stateless or receive all state via props.
- Layouts must not contain side-effects, history logic, or platform hacks.
- Layouts may render global UI elements (sidebar, header, drawers).

FEATURES
- Features represent a domain or product area.
- Inside a feature, group code by responsibility:
  - components/ → UI only
  - hooks/ → logic, effects, state, side-effects
  - data/ → mocks or static data
  - types/ → TypeScript types
  - utils/ → pure helper functions
- Do NOT create "Feature wrappers" unless needed.
- A feature does not need an index file if it exports only one thing.

HOOKS
- All complex logic must live in hooks.
- Hooks are the only place allowed to:
  - access window, document, navigator
  - manage media queries
  - handle history / back-button behavior
  - handle mobile or iOS-specific behavior
- Prefer multiple small hooks over one large hook.

INDEX FILES
- Do NOT create index.ts files unless:
  - there are multiple public exports
  - the file clearly defines a public API
- Never create index.ts just to re-export a single component.

COMPONENTS
- Components must be presentational by default.
- No side-effects inside components unless unavoidable.
- If a component grows complex, extract logic to a hook.

REFACTOR GUIDELINES
- When a file becomes large:
  - extract logic into hooks
  - keep rendering code clean
- Move logic out before creating new abstractions.
- Do not change UI behavior unless explicitly requested.

CODE STYLE
- TypeScript strict mode must be respected.
- Prefer named exports.
- Avoid unnecessary generics or advanced patterns.
- Keep code readable for mid-level developers.

DEFAULT DECISION RULE
If unsure between:
- adding a new file
- or keeping logic together

Choose the simpler option.
