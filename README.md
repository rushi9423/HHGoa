# HH Goa 2026 — PFP Frame Generator & Builder ID Card Generator

A production-ready, mobile-first web app for Hacker House Goa 2026. It features a dual-purpose generator that creates both PFP Frames (1:1 square) and Builder ID Cards (portrait posters) with instantly downloadable PNGs and a seamless "Share to X" flow.

## 🌟 Features

*   **Two Generators in One:** Switch instantly between the **PFP Frame Generator** (square format for profile pictures) and the **Builder ID Card Generator** (full vertical poster for event identity).
*   **4 Distinct Frame Styles:**
    *   🌴 **Goa Palms** (Classic Paradise)
    *   ⚡ **Cyber Goa** (Neon Cyan)
    *   🌅 **Arambol** (Golden Sunset)
    *   🏛️ **Old Goa** (Portuguese Heritage)
*   **Smart Upload & Auto-Crop:** Supports JPG, PNG, WEBP, and HEIC (with automatic conversion). Auto-fits photos to the frame with touch-friendly pinch-to-zoom and drag repositioning.
*   **Auto-Generated Identity:** Deterministically generates a unique Builder Class (e.g., "NOTORIOUS"), Builder Title (e.g., "Chaos-Driven Security Wizard"), and Builder ID based on the user's name and role.
*   **Instant Export & Share:** Client-side HTML5 Canvas rendering for zero-latency preview and 1-click high-res PNG download. Includes native mobile sharing and fallback Twitter intent sharing.
*   **No Login Required:** Frictionless flow from start to finish.

## 🛠️ Tech Stack

*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS + custom CSS brand variables
*   **Rendering Engine:** Client-side HTML5 Canvas API
*   **Fonts:** Self-hosted Google Fonts (Anton, Space Mono, Noto Sans Devanagari)
*   **Utilities:** `heic2any` (HEIC image fallback), `qrcode` (QR generation)

## 🚀 Getting Started

First, install the dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎨 Design System

The app strictly follows the HH Goa 2026 brand language, using exact color hexes (Deep Forest Green `#0d3b2e`, Accent Yellow `#f5d020`, Hot Pink `#ec1e6b`) and specific motifs like palm corners, wavy lines, and the "2:47 PM STUDIO" credit.
