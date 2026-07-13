# B2B Sage 50 Ordering Portal - Frontend

Next.js 15 TypeScript storefront and admin control panel designed for Orbit Food Limited, enabling shop owner registrations, security settings, catalog shopping, and automated order placements.

## Tech Stack
*   **Framework**: Next.js (App Router, Turbopack)
*   **Styling**: TailwindCSS
*   **Icons**: Lucide React
*   **State Management**: Zustand
*   **HTTP Client**: Axios

## Setup Instructions

### 1. Install Dependencies
Run npm install in the frontend root directory:
```bash
npm install
```

### 2. Environment Settings
Create a `.env.local` file in the frontend root to override any local dev parameters (if needed):
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```
Note: Make sure `frontend/src/lib/api.ts` maps requests correctly to this URL.

### 3. Launch Development Server
Start the Next.js development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 4. Build for Production
Create an optimized production bundle:
```bash
npm run build
```
You can preview the compiled build using:
```bash
npm run start
```
