# Component Factorization & Modularization Plan

This document outlines the systematic refactoring of monolithic UI components in Chatze into modular, maintainable, single-responsibility subcomponents **without breaking or altering any existing functionality or missing any lines of code**.

---

## 🎯 Target Monoliths Overview

| File | Current Lines | Target Structure | Status |
| :--- | :--- | :--- | :--- |
| **`src/components/CustomerInquiryPage.tsx`** | ~1,385 lines | `src/components/letterbox/` (Types, Audio, Header, Form, Pending, LiveChat) | 🟡 **Step 1 (In Progress)** |
| **`src/components/ProfileSettingsModal.tsx`** | ~1,111 lines | `src/components/profile/` (AccountTab, PrivacyTab, HubTab, EdgeTab, FaqEditor) | ⚪ Step 2 (Queued) |
| **`src/components/MessagingApp.tsx`** | ~2,353 lines | `src/components/messaging/` (Sidebar, ChatFeed, MessageInput, MediaViewer, etc.) | ⚪ Step 3 (Queued) |

---

## 📋 Step 1: `CustomerInquiryPage.tsx` (1,385 lines ➔ Modular Letterbox)

### Modular Breakdown (`src/components/letterbox/`):

1. **`types.ts`**:
   - `ShopProfile`, `CustomerInquiryPageProps`, `ChatMessage`, `InquiryCategory`
   - `INQUIRY_CATEGORIES`, `QUICK_PROMPTS`
2. **`audio.ts`**:
   - `playGentleChime()`: Web Audio API gentle synthesizer for incoming merchant replies.
3. **`LetterboxHeader.tsx`**:
   - Store identity badge (`displayName`, `@handle`, Hub Verified pill).
   - Audio chime mute/unmute toggle.
   - Share link copy button.
   - Owner login / launch app quick buttons.
4. **`LetterboxCompositionForm.tsx`**:
   - Shop storefront banner (location, hours, delivery info, bio, catalog tags).
   - Inquiring identity card (Google email, sovereign node badge).
   - Category selection grid (Price & Stock, Delivery, Wholesale, General).
   - Zero-invocation FAQ chips & instant answer deflection card.
   - 500-char note composition textarea with live counter.
   - Contact phone/WhatsApp input.
   - Submit action button ("Drop Note into Sovereign Letterbox").
5. **`LetterboxPendingCard.tsx`**:
   - Visual pending indicator with pulsing status badge.
   - Inquiry note card preview.
   - Live SSE connection status indicator ("Direct Edge SSE Active").
   - "Check for Merchant Reply / Open Chat" sync button.
6. **`LetterboxLiveChat.tsx`**:
   - Collapsible inquiry note summary bar.
   - Real-time conversation message feed with optimistic delivery states.
   - Image bubble rendering with full-resolution lightbox trigger.
   - Quick prompt action chips.
   - Chat input bar with WebP image attachment & send button.
7. **`CustomerInquiryPage.tsx`** (Orchestrator):
   - Holds core state, URL query params resolution, and SSE stream lifecycle.
   - Composes the subcomponents cleanly.

---

## 📋 Step 2: `ProfileSettingsModal.tsx` (1,111 lines ➔ Modular Settings)

### Modular Breakdown (`src/components/profile/`):
- `types.ts`: Profile interfaces and categories.
- `ProfileHeader.tsx`: Modal header with tabs navigation.
- `AccountSettingsTab.tsx`: Profile identity, business details, FAQ bot upload & editor.
- `PrivacySettingsTab.tsx`: Anti-spam mode, friend PIN management.
- `HubSettingsTab.tsx`: Chatze Hub listing, registration & sync status.
- `EdgeStorageTab.tsx`: Real-time D1 shards health, multi-database status.

---

## 📋 Step 3: `MessagingApp.tsx` (2,353 lines ➔ Modular Inbox)

### Modular Breakdown (`src/components/messaging/`):
- `types.ts`: Conversation, Contact, Message, and Draft types.
- `ConversationList.tsx`: Infinite windowed active, unread, and resolved queues.
- `ChatHeader.tsx`: Peer identity, verified build badge, connection health.
- `ChatStreamView.tsx`: Chronological message bubbles, read receipts, and media attachments.
- `ChatComposer.tsx`: Canned quick replies, WebP compressor, and 1-Hit D1 batch flusher.
- `ConnectionModal.tsx`: Dual-sided P2P cryptographic handshake modals.

---

## ✅ Quality Criteria
- Zero runtime regression or visual alteration.
- Strict TypeScript compile without any errors (`tsc --noEmit`).
- Fast Vite production bundle build (`npm run build`).
