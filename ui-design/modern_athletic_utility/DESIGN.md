---
name: Modern Athletic Utility
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3e4a3d'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6e7b6c'
  outline-variant: '#bdcaba'
  surface-tint: '#006e2d'
  primary: '#006b2c'
  on-primary: '#ffffff'
  primary-container: '#00873a'
  on-primary-container: '#f7fff2'
  inverse-primary: '#62df7d'
  secondary: '#1d4ed8'
  on-secondary: '#ffffff'
  secondary-container: '#4069f2'
  on-secondary-container: '#fffbff'
  tertiary: '#a72d51'
  on-tertiary: '#ffffff'
  tertiary-container: '#c74668'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#7ffc97'
  primary-fixed-dim: '#62df7d'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005320'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b7c4ff'
  on-secondary-fixed: '#001551'
  on-secondary-fixed-variant: '#0039b5'
  tertiary-fixed: '#ffd9de'
  tertiary-fixed-dim: '#ffb2bf'
  on-tertiary-fixed: '#3f0016'
  on-tertiary-fixed-variant: '#8a143c'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  h1:
    fontFamily: Lexend
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  h2:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Lexend
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  price-tag:
    fontFamily: Lexend
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 1rem
  section-gap: 2rem
  card-gap: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
---

## Brand & Style

The design system is built upon a **Corporate Modern** aesthetic tailored for the fast-paced nature of sports booking. It balances the high-energy "Futsal Green" with a structured, professional framework that feels reliable for UMKM (Small-to-Medium Enterprise) owners and accessible for players.

The visual language focuses on clarity and speed. It avoids unnecessary decoration, instead using generous whitespace and a "Mobile-First" hierarchy to ensure users can book a field in under three clicks. The tone is **Professional, Friendly, and Simple**, utilizing Indonesian copywriting that is direct and welcoming (e.g., "Main Yuk!" or "Booking Lapangan Jadi Mudah").

## Colors

The palette is anchored by **Futsal Green (#16a34a)**, evoking the turf and action, used primarily for main Call-to-Actions (CTA) and success states. **Blue (#1d4ed8)** serves as the secondary color, providing a professional contrast for informational elements and "Confirmed" statuses.

For typography and UI borders, this design system utilizes a high-contrast **Slate/Gray** scale to ensure readability under outdoor lighting conditions. Background surfaces use a subtle off-white (#f8fafc) to reduce glare while maintaining a clean, modern feel.

## Typography

This design system employs a dual-font strategy. **Lexend** is used for headlines and price tags to leverage its athletic, high-readability characteristics. **Inter** is used for all body copy, forms, and UI labels to provide a functional, neutral, and systematic reading experience.

Copywriting should be in **Bahasa Indonesia**, maintaining a polite yet enthusiastic tone. Key information like "Harga Sewa" and "Jadwal Tersedia" must always use high-weight Lexend to draw immediate attention.

## Layout & Spacing

The layout follows a **Fluid Grid** for mobile devices, ensuring components like field cards and booking slots expand to fit the screen. On desktop, the content is constrained to a 1280px max-width container.

A baseline 4px/8px rhythm is applied across the design system. Vertical stacking uses `stack-md` (16px) for related elements and `section-gap` (32px) to separate major content areas such as "Daftar Lapangan" and "Promo Spesial."

## Elevation & Depth

To maintain the clean, shadcn-inspired look, this design system uses **Tonal Layers** combined with **Ambient Shadows**. 

- **Level 0 (Flat):** Used for the main background.
- **Level 1 (Raised):** Cards and main navigation. Uses a subtle 1px border (#e2e8f0) and a soft, low-opacity shadow (Y: 1px, Blur: 3px, Opacity: 0.05).
- **Level 2 (Floating):** Modals and Toast notifications. Uses a more pronounced diffused shadow (Y: 10px, Blur: 15px, Opacity: 0.1) to create clear separation from the background.
- **Level 3 (Sticky):** The Navbar remains sticky at the top with a backdrop-blur (10px) and a bottom-border for a glassmorphism effect.

## Shapes

The shape language is consistently **Rounded (Level 2)**. 
- Standard UI elements (Buttons, Input Fields) use a 0.5rem (8px) radius.
- Cards and Modals use a 1rem (16px) radius for a friendlier, modern appearance.
- Badges and Tags use a fully rounded "Pill" shape to distinguish them from interactive buttons.

This approach softens the athletic intensity of the green and blue colors, making the app feel more approachable for casual players.

## Components

### Buttons & Navigation
- **Primary Button:** Solid #16a34a with white text. Rounded (0.5rem). Label: "Pesan Sekarang".
- **Navbar:** Sticky, white background with subtle blur. Contains Logo, Profile, and "Riwayat Booking".
- **Footer:** Simple gray scale. Links: "Tentang Kami", "Syarat & Ketentuan", "Bantuan".

### Cards & Data
- **Field Card:** 16:9 aspect ratio image. Title in H3, Price Tag in Lexend Bold, Badge for "Tersedia".
- **Table:** Used for Admin view (UMKM dashboard). Low-contrast outlines, clean rows, mobile-responsive cards on smaller screens.
- **Badges:** Small, pill-shaped. Status: "Menunggu" (Yellow), "Berhasil" (Green), "Dibatalkan" (Red).

### Feedback & States
- **Toast:** Bottom-right (desktop) or Top-center (mobile). Success or Error messages with icons.
- **Skeleton Loading:** Pulse animation for field images and text blocks during data fetching.
- **Empty State:** Centered illustration with clear "Cari Lapangan" CTA. Text: "Belum ada jadwal booking."

### Interaction
- **Modals:** Slide up from bottom on mobile; centered on desktop. High-contrast "X" button.
- **Input Fields:** 1px border with #16a34a focus ring. Labels in body-sm bold.