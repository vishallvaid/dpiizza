# DPizza - Mobile-First Pizza Ordering System

A premium, frictionless pizza ordering web application designed for mobile-first users. No logins, no OTPs—just select, order, and eat.

## 🚀 Key Features
- **Frictionless Checkout**: Orders are placed with a single form. No account creation required.
- **Smart Profiles**: Customer details are automatically saved to browser storage and backend cache. Returning customers see their profile and can reorder with one tap.
- **Premium UI**: Modern, high-performance design with glassmorphism effects and smooth animations.
- **Admin Dashboard**: Real-time management of orders and customer CRM.
- **PWA Ready**: Mobile-centric design that feels like a native app.

## 📁 Project Structure
- `index.html`: Customer-facing mobile website.
- `admin.html`: Admin dashboard for order & customer management.
- `style.css`: Unified design system with modern CSS variables.
- `app.js`: Core logic for the customer journey (cart, profile, checkout).
- `admin.js`: Management logic for the dashboard.

## 🔧 Setup & Customization
Currently, the system uses `localStorage` to simulate a backend for immediate demonstration. For production use:

1. **Firebase Integration**:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
   - Enable Firestore Database.
   - Replace the local `localStorage` calls in `app.js` and `admin.js` with Firebase SDK calls (`addDoc`, `onSnapshot`, etc.).

2. **Payment Integration**:
   - The UI includes placeholders for COD and Online payments.
   - Integrate Razorpay or Stripe for real online transactions.

3. **Images**:
   - Currently using high-quality Unsplash placeholders. Replace with actual menu photography.

## 📱 Mobile-First Design Principles
- Large tap targets (44px+).
- Bottom-situated primary actions (Cart FAB).
- Input fields optimized for mobile keyboards.
- Zero-friction ordering flow to maximize conversion.

---
Designed by DPizza Team.
