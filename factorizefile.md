# Component Factorization & Modularization Plan

This document outlines the systematic refactoring of monolithic UI components in Chatze into modular, maintainable, single-responsibility subcomponents **without breaking or altering any existing functionality or missing any lines of code**.

---

## 🎯 Target Monoliths Overview

| File | Current Lines | Target Structure | Status |
| :--- | :--- | :--- | :--- |
| **`src/components/CustomerInquiryPage.tsx`** | ~1,385 lines | `src/components/letterbox/` (Types, Audio, Header, Form, Pending, LiveChat) | 🟢 **Step 1 (Completed)** |
| **`src/components/ProfileSettingsModal.tsx`** | ~1,111 lines | `src/components/profile/` (AccountTab, PrivacyTab, HubTab, EdgeTab, Header) | 🟢 **Step 2 (Completed)** |
| **`src/components/MessagingApp.tsx`** | ~2,354 lines | `src/components/messaging/` (Sidebar, ChatStream, Composer, 5 Modals, MediaUtils) | 🟢 **Step 3 (Completed)** |

---

## 📋 Step 1: `CustomerInquiryPage.tsx` (1,385 lines ➔ Modular Letterbox) — ✅ COMPLETED
- Reduced `CustomerInquiryPage.tsx` to clean orchestrator.
- Modularized into `src/components/letterbox/` (`types.ts`, `audio.ts`, `LetterboxHeader.tsx`, `LetterboxCompositionForm.tsx`, `LetterboxPendingCard.tsx`, `LetterboxLiveChat.tsx`).

---

## 📋 Step 2: `ProfileSettingsModal.tsx` (1,111 lines ➔ Modular Settings) — ✅ COMPLETED
- Reduced root `ProfileSettingsModal.tsx` from 1,111 lines to 296 lines orchestrator.
- Modularized into `src/components/profile/` (`types.ts`, `ProfileHeader.tsx`, `AccountSettingsTab.tsx`, `PrivacySettingsTab.tsx`, `HubSettingsTab.tsx`, `EdgeStorageTab.tsx`, `index.ts`).

---

## 📋 Step 3: `MessagingApp.tsx` (2,354 lines ➔ Modular Messaging Suite) — ✅ COMPLETED
- Reduced root `MessagingApp.tsx` from 2,354 lines to 597 lines orchestrator.
- Modularized into `src/components/messaging/`:
  - `types.ts`: `Conversation`, `ChatMessage`, `Friendship`, `ParsedMessage`, `InboxFilter`, `UNIVERSAL_QUICK_REPLIES`.
  - `mediaUtils.ts`: `getOptimizedImageUrl` (wsrv.nl proxy), `parseMessageContent`, `compressImageToWebP`.
  - `SidebarHeader.tsx`: Profile identity avatar, quick actions (Identity, QR, Hub, Settings, Logout), business letterbox share card, search bar, and filter tabs.
  - `IncomingRequestsBanner.tsx`: P2P federation incoming requests banner with Accept, Decline, and Block actions.
  - `InquiriesFeed.tsx`: Customer Letterbox & Merchant Letterbox inquiry cards, direct call button, dismiss/block actions, active customer chats, and empty state.
  - `ConversationList.tsx`: Infinite windowed active, pending, unread, and friend chats with badges and empty state.
  - `ChatHeader.tsx`: Peer identity, status pills (Letterbox/Pending/Friend), PWA/Notification buttons, and live SSE indicator.
  - `ChatStreamView.tsx`: Peer handshake pending screen, speech bubbles (text & WebP photos with wsrv.nl proxy and lightbox trigger), timestamp, delivery check ticks, and scroll-to-bottom button.
  - `ChatComposer.tsx`: Canned quick reply chips and message input bar with photo attachment.
  - `modals/ConnectContactModal.tsx`: Federation connect contact request modal with business privacy explanation.
  - `modals/IdentityAddressModal.tsx`: User handle and instance domain address copy modal.
  - `modals/PaymentQrModal.tsx`: Fonepay & eSewa QR payment modal.
  - `modals/ImageSendModal.tsx`: WebP image preview, compression stats, caption input, and upload modal.
  - `modals/ImageLightboxModal.tsx`: Full-resolution image lightbox viewer with WebP download.
  - `index.ts`: Clean barrel exports.

---

## ✅ Quality Criteria Met
- Zero runtime regressions or missing features.
- Strict TypeScript compile without any errors.
- Fast Vite production bundle build (`npm run build`).
