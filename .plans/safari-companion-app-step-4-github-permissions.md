# macOS Safari Companion App Step 4: Grant GitHub Permissions Plan

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## Overview & Objectives

The **Markdown Comments Safari Web Extension** is packaged within a native macOS companion application (`Markdown Comments.app`). When users open the app from `/Applications`, an instructions card displays onboarding steps to guide them through activating the self-signed extension in Safari.

Currently, the instructions card in `safari-extension/src/App/main.swift` only defines three steps:

1. **Step 1**: Allow Unsigned Extensions
2. **Step 2**: Enable Extension
3. **Step 3**: One-Click Direct Load (Instant Alternative)

### Problem Statement

Safari WebExtensions enforce strict per-origin user consent: even after a user enables the extension in Safari Settings (or loads it temporarily), the extension's content scripts will not inject or execute on `https://github.com` until the user explicitly grants permission. In Safari, users must click the extension icon in the toolbar / address bar and choose **"Always Allow on This Website"** (or "Always Allow on Every Website").

Without a clear **Step 4** in the native companion app's instructions:

- First-time users enable the extension in Safari Settings, navigate to GitHub, and expect comments to appear immediately.
- Users miss Safari's subtle toolbar permission prompt, leading them to believe the extension failed to load.
- Inconsistency exists between the companion app UI (3 steps), the terminal build instructions (3 steps), and the written documentation in `HOW-TO-OPEN.txt` and `docs/safari-extension-guide.md` (which document the GitHub permission step).

### Objectives & Goals

1. **Add Step 4 to Native Companion App UI**: Update `safari-extension/src/App/main.swift` to include `Step 4: Grant GitHub Permissions` instructing users to visit `https://github.com`, click the Markdown Comments icon, and select "Always Allow on This Website".
2. **Harmonize Window Dimensions**: Adjust window dimensions (e.g. height from 450 to 500) to ensure the card fits comfortably without vertical crowding or clipping.
3. **Align CLI Build Output**: Update `scripts/build-safari-app.sh` terminal output to include step 4.
4. **Update Quality & Feature Specifications**: Update `quality/features/extension/FEAT-EXT-SAFARI-APPEX.md` user journey scenarios.
5. **Add Automated Verification**: Add tests in `tests/e2e/safari-extension.spec.ts` asserting that `main.swift` contains all 4 onboarding steps and that Swift compilation succeeds.
6. **Strict Zero-PAT Invariant (`INV-NO-PAT`)**: Preserve strict adherence to OAuth Device Flow without PATs.

---

## Current State vs. Proposed Architecture

### Current State

#### `safari-extension/src/App/main.swift` (Lines 111–137)

```swift
// Step 1
let step1 = createStepRow(
    number: "1",
    title: "Allow Unsigned Extensions",
    detail: "Open Safari → Settings → Developer tab (or Develop menu) and check \"Allow Unsigned Extensions\"."
)
boxStack.addArrangedSubview(step1)

// Step 2
let step2 = createStepRow(
    number: "2",
    title: "Enable Extension",
    detail: "Open Safari → Settings → Extensions and check the box next to \"Markdown Comments\"."
)
boxStack.addArrangedSubview(step2)

// Step 3
let step3 = createStepRow(
    number: "3",
    title: "One-Click Direct Load (Instant Alternative)",
    detail: "In Safari menu bar: Develop → Add Temporary Extension… then select the extension folder."
)
boxStack.addArrangedSubview(step3)
```

Window dimensions: `520 x 450`.

#### `scripts/build-safari-app.sh` (Lines 80–84)

```bash
echo "    To test in Safari:"
echo "    1. In Safari: Develop menu -> Allow Unsigned Extensions"
echo "    2. Open: open \"$APP_BUNDLE\""
echo "    3. Enable in Safari Settings -> Extensions"
```

---

### Proposed State

#### `safari-extension/src/App/main.swift`

```swift
// Step 1
let step1 = createStepRow(
    number: "1",
    title: "Allow Unsigned Extensions",
    detail: "Open Safari → Settings → Developer tab (or Develop menu) and check \"Allow Unsigned Extensions\"."
)
boxStack.addArrangedSubview(step1)
step1.widthAnchor.constraint(equalTo: boxStack.widthAnchor, constant: -32).isActive = true

// Step 2
let step2 = createStepRow(
    number: "2",
    title: "Enable Extension",
    detail: "Open Safari → Settings → Extensions and check the box next to \"Markdown Comments\"."
)
boxStack.addArrangedSubview(step2)
step2.widthAnchor.constraint(equalTo: boxStack.widthAnchor, constant: -32).isActive = true

// Step 3
let step3 = createStepRow(
    number: "3",
    title: "One-Click Direct Load (Instant Alternative)",
    detail: "In Safari menu bar: Develop → Add Temporary Extension… then select the extension folder."
)
boxStack.addArrangedSubview(step3)
step3.widthAnchor.constraint(equalTo: boxStack.widthAnchor, constant: -32).isActive = true

// Step 4
let step4 = createStepRow(
    number: "4",
    title: "Grant GitHub Permissions",
    detail: "Navigate to https://github.com, click the Markdown Comments icon in Safari's toolbar, and select \"Always Allow on This Website\"."
)
boxStack.addArrangedSubview(step4)
step4.widthAnchor.constraint(equalTo: boxStack.widthAnchor, constant: -32).isActive = true
```

Window dimensions: `windowWidth: 520`, `windowHeight: 500`.

#### `scripts/build-safari-app.sh`

```bash
echo "    To test in Safari:"
echo "    1. In Safari: Develop menu -> Allow Unsigned Extensions"
echo "    2. Open: open \"$APP_BUNDLE\""
echo "    3. Enable in Safari Settings -> Extensions"
echo "    4. On github.com, click extension icon -> Always Allow on This Website"
```

---

## Mandatory Test Enhancement & Knowledge Graph Specification

### 1. New Tests to Create

- **`tests/e2e/safari-extension.spec.ts`**:
  - Add test: `FEAT-EXT-SAFARI-APPEX: Verifies macOS companion app onboarding defines 4-step activation instructions`.
  - Assertions:
    - Verifies `safari-extension/src/App/main.swift` declares Step 1, Step 2, Step 3, and Step 4.
    - Specifically verifies Step 4 contains "Grant GitHub Permissions" and "Always Allow on This Website".
    - Verifies `scripts/build-safari-app.sh` includes the 4th step in its instructions.

### 2. Existing Tests to Update

- Ensure existing unit and E2E suites pass (`pnpm vitest run tests/browserApi.test.ts tests/safariAuth.test.ts`).

### 3. Knowledge Graph & Feature Spec Updates

- Update `quality/features/extension/FEAT-EXT-SAFARI-APPEX.md`:
  - Extend Gherkin scenario to cover:
    - Given the macOS companion app instructions
    - When the user reviews the activation guide
    - Then Step 4 explains how to grant permissions on `github.com` via Safari's toolbar.

### 4. Code Coverage Preservation

- 100% coverage invariant preserved. Swift compilation validation performed to guarantee valid syntax.

---

## Milestones & Action Items

### Milestone 1: Update Native macOS Companion App UI

- [ ] In `safari-extension/src/App/main.swift`, increase `windowHeight` to `500`.
- [ ] Add `step4` row for GitHub permissions with label "Grant GitHub Permissions" and detail directing users to `https://github.com`.
- [ ] Add width constraint for `step4` matching `step1`-`step3`.

### Milestone 2: Update Build Script, Documentation, and Feature Specs

- [ ] In `scripts/build-safari-app.sh`, append step 4 to post-build instructions.
- [ ] In `quality/features/extension/FEAT-EXT-SAFARI-APPEX.md`, update scenarios with step 4 requirements.
- [ ] In `README.md`, expand the Safari extension section with the 4-step checklist highlighting GitHub permissions.
- [ ] In `docs/safari-extension-guide.md`, harmonize Section 2 with the exact 4-step sequence from `main.swift`.
- [ ] In `website/index.html`, add a setup tip under the Safari download pane for granting permissions on `github.com`.

### Milestone 3: Test Suite Enhancement & Verification

- [ ] Update `tests/e2e/safari-extension.spec.ts` with test verifying all 4 steps in `main.swift` and `build-safari-app.sh`.
- [ ] Run automated tests (`npx playwright test tests/e2e/safari-extension.spec.ts --project=webkit` and Vitest unit tests).
- [ ] Compile `main.swift` to verify syntax and absence of compiler warnings.
