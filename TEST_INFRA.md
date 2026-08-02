# E2E Test Infra: UI Component Copier Extension

## Test Philosophy
- Opaque-box, requirement-driven end-to-end test suite.
- Methodology: 4-Tier Test Framework (Category-Partition, Boundary Value Analysis, Pairwise Combinatorial, Real-World Application Workloads).
- Test Runner: Native Node.js test runner (`node --test tests/*.test.js`).

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|----------------------|:------:|:------:|:------:|:------:|
| 1 | HTML+CSS Clean Extraction | R1 | 5 | 5 | ✓ | ✓ |
| 2 | Tailwind CSS Export | R1 | 5 | 5 | ✓ | ✓ |
| 3 | Vue SFC Export | R1 | 5 | 5 | ✓ | ✓ |
| 4 | React JSX Export | R1 | 5 | 5 | ✓ | ✓ |
| 5 | CSS Custom Property Resolution (var(--...)) | R1 | 5 | 5 | ✓ | ✓ |
| 6 | SVG Background Data-URLs & Assets | R1 | 5 | 5 | ✓ | ✓ |
| 7 | CSS Gradient Clips | R1 | 5 | 5 | ✓ | ✓ |
| 8 | Flex & Grid Layouts | R1 | 5 | 5 | ✓ | ✓ |
| 9 | Responsive @media Rules | R1 | 5 | 5 | ✓ | ✓ |
| 10 | @font-face Font Rules | R1 | 5 | 5 | ✓ | ✓ |
| 11 | Pseudo-States (:hover, :focus, ::before, ::after) | R1 | 5 | 5 | ✓ | ✓ |
| 12 | @keyframes Animations | R1 | 5 | 5 | ✓ | ✓ |
| 13 | Rigid Pixel Dimension Removal | R1 | 5 | 5 | ✓ | ✓ |
| 14 | Light-Checkerboard Iframe (#ffffff / 16px #f0f0f0) | R2 | 5 | 5 | ✓ | ✓ |
| 15 | Dynamic Iframe Auto-Scaling & Boundaries | R2 | 5 | 5 | ✓ | ✓ |
| 16 | Breadcrumb Paths & Tag Badges | R2 | 5 | 5 | ✓ | ✓ |
| 17 | Dimension Badges (W × H px) | R2 | 5 | 5 | ✓ | ✓ |
| 18 | Quick-Copy Format Buttons | R2 | 5 | 5 | ✓ | ✓ |
| 19 | Live Hover & Selection Outlines (1.5px dashed #6366F1) | R2 | 5 | 5 | ✓ | ✓ |
| 20 | Zero Class Leakage (Internal class stripping) | R2 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Runner**: Native `node --test` via `npm test`
- **Helpers**: `tests/helpers/test_utils.js` (DOM mocking & extractor helper wrappers)
- **Suite Files**:
  - `tests/tier1_features.test.js` (100 Tier 1 tests)
  - `tests/tier2_boundaries.test.js` (100 Tier 2 tests)
  - `tests/tier3_combinations.test.js` (10 Pairwise Interaction test suites)
  - `tests/tier4_scenarios.test.js` (6 Real-World Application Scenarios)
  - `tests/extractor.test.js` (Core extractor unit tests)
  - `tests/background.test.js` (Extension background service worker tests)

## Coverage Thresholds
- Tier 1: ≥5 test cases per feature (20 features × 5 = 100 tests)
- Tier 2: ≥5 boundary/corner cases per feature (20 features × 5 = 100 tests)
- Tier 3: Pairwise interaction coverage across major feature combinations (10 suites)
- Tier 4: Real-world application scenarios (6 full end-to-end workloads)
- **Total E2E Test Suite**: 216+ automated test cases
