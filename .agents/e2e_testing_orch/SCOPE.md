# Scope: E2E Testing Track

## Mission
Design and implement a comprehensive, requirement-driven opaque-box test suite for the UI Component Copier extension based on ORIGINAL_REQUEST.md.
Follow the 4-Tier Test Methodology (Tier 1: Feature Coverage >=5/feature, Tier 2: Boundary & Corner Cases >=5/feature, Tier 3: Cross-Feature Combinations, Tier 4: Real-World Scenarios).
Publish `TEST_READY.md` at project root upon completion.

## Requirements Coverage
- R1: 1:1 Code Extraction Accuracy Engine (HTML+CSS, Tailwind, Vue SFC, React JSX, CSS variables, pseudo-states, media queries, keyframes, SVG data-URLs, rigid pixel removal)
- R2: 1:1 Miro-Level Component Preview & Overlay Experience (Checkerboard iframe `#ffffff` / 16px `#f0f0f0`, auto-scaling, breadcrumbs, tag/dimension badges, outline highlight `1.5px dashed #6366F1`, zero class leakage)

## Deliverables
- Test infrastructure & tests in `tests/`
- `TEST_INFRA.md` at project root
- `TEST_READY.md` at project root
