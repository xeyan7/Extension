# PRD — UI Component Copier Browser Extension

## 1. Overview

A browser extension that allows users to visually select any UI component on a website and instantly copy it as **HTML + CSS** or **Tailwind CSS**.

The extension also extracts a website's design assets (media, colors, typography, SVGs, etc.) and provides a local saved-component library.

---
Target User
Designers, developers, and learners who want to inspect, copy, and reuse how a website looks — with zero setup friction. 

# 2. Goals

* Copy UI components from any website.
* Generate clean HTML + CSS or Tailwind code.
* Extract website design assets.
* Keep the experience fast and simple.
---

# 4. Layout

A compact floating bar appears on the right side of the screen. It expands in place to reveal tools and never opens a browser sidebar or side panel.

Contains three icons.

---

# Icon 1 — Component Selector

## Purpose

Allows users to visually select any UI component on the webpage and copy it as code.

---

## Flow

### Step 1

User clicks the Selector icon.

Selection mode becomes active.

---

### Step 2

As the user moves the mouse over the page:

* Hovered components are highlighted.
* A preview outline shows the selected area.

---

### Step 3

User clicks the desired component.

The component becomes selected.

---
NOTE - Pressing **Escape** exits selection mode and clears the current selection.

---
### Step 4

The floating bar expands in place.

---

## Expanded floating bar
Shows--

**Selected Component**

Display:
* Element type -Examples: * Hero * Navbar * Card * Button * Footer * Section * Form or SVG or any image
* Preview image

---
Below it shows 

**Copy Options**

Buttons:

* Copy Tailwind
* Copy HTML + CSS

Copy action should immediately place generated code into clipboard.

---

Below it 

**Properties**

Display:

## Element

* Element Type

---

## Typography

(Only if text exists)

* Font Family
* Font Size
* Font Weight
* Line Height
* Text Alignment
* Text Color

---

## Background

* Background Color

---

## Border

* Border Style
* Border Width
* Border Radius
* Border Color

---

## Size

* Width
* Height

---



# Icon 2 — Site Assets

Provides an overview of the website's design assets.

---

## Overview

Display:

* Website Domain
* Total Images
* Total Videos
* Total SVGs
* Total Fonts
* Total Colors
* Total Lottie Files

---

## Section 1 — Media

Display all discovered:

* Images
* Videos
* SVGs
* Lottie Files

Each asset should include:

* Preview 
* Name (
* Dimensions 
and option to copy/download

---

## Section 2 — Typography & Colors

### Typography

Display every detected font .

TELLS WHAT IS IT - eg heading 1 , link , label , DIV , list item
give preview in form of - Aa  Bb Cc Dd Ee
---
also shows number of instances of that font and also has a drop down to show more details
eg. Font Family
Helvetica Neue
Font Size
15px (0.94rem)
Font Weight
700 (Bold)
Line Height
16.5px
Letter Spacing
normal

### Colors

1.graadient shows gradients like linear-gradient(160deg, rgb(255, 255, 255) 0%, rgb(251, 251, 251) 100%) and shows number of insttances

below 

shows all colros 
and option t export as CSV file

---

# Icon 3 — Local library

Contains the private component library stored in the current browser profile.

Display:

* Saved Components
* Local storage usage
* Copy and delete actions

---

# 5. Functional Requirements

## Component Selection

* User can enable selection mode.
* Hover displays highlighted preview.
* Clicking selects the component.
* The floating bar expands only after a component is selected.
* Escape exits selection mode.

---

## Code Generation

Support:

* HTML + CSS
* Tailwind CSS

Generated code should preserve:

* Structure
* Layout
* Typography
* Colors
* Borders
* Spacing
* Images
* SVGs 

---

## Design Inspection

The extension should extract:

Typography:

* Font Family
* Font Size
* Font Weight
* Line Height
* Alignment
* Text Color

Background:

* Background Color

Borders:

* Width
* Style
* Radius
* Color

Sizing:

* Width
* Height

---

## Site Asset Extraction

Extract:

* Images
* Videos
* SVGs
* Icons
* Lottie Files
* Fonts
* Colors

---

# 6. UI States

## Default

* Floating bar collapsed.
* Three icons visible.

---

## Selection Mode

* Hover highlighting active.
* Floating bar remains collapsed.
* Selector icon remains selected.
* Clicking selects the highlighted component.

---

## Component Selected

* Floating bar expands in place.
* Shows component preview.
* Displays metadata.
* Copy actions available.

---

## Site Assets

The floating bar expands to show:

* Overview
* Media
* Typography & Colors

---

## Local library

The floating bar expands to show locally saved components and storage usage.

---

---

q
