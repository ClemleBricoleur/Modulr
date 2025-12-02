# Modulr - Deployment Guide

## Quick Start (Development)

```bash
# Start dev server (accessible from your phone on same network)
npm run dev

# Your phone can access: http://YOUR_PC_IP:5173
# Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
```

## Option 1: PWA Install (Recommended - No Build Needed)

### Step 1: Access from Phone
1. Find your PC's local IP address:
   - Windows: Open CMD and type `ipconfig`
   - Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. On your phone's browser (Chrome recommended):
   - Navigate to `http://YOUR_PC_IP:5173`
   - Example: `http://192.168.1.100:5173`

### Step 2: Install to Home Screen
**Android (Chrome):**
1. Tap the 3-dot menu (⋮)
2. Tap "Add to Home screen"
3. Tap "Add"

**iPhone (Safari):**
1. Tap the Share button
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add"

The app will now appear on your home screen like a native app!

---

## Option 2: Build & Deploy (For Sharing)

### Step 1: Build Production Version
```bash
npm run build
```

This creates a `dist/` folder with your optimized app.

### Step 2: Deploy to Free Hosting

**Vercel (Easiest):**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts, get a URL like: https://modulr-xxx.vercel.app
```

**Netlify:**
1. Go to https://netlify.com
2. Drag & drop your `dist/` folder
3. Get your URL

**GitHub Pages:**
```bash
# Add to vite.config.ts: base: '/modulr/'
npm run build
# Push dist/ to gh-pages branch
```

### Step 3: Install PWA from Deployed URL
Once deployed, anyone can:
1. Visit your URL on their phone
2. Install to home screen (same as Option 1)

---

## Option 3: Generate APK (Advanced)

### Using PWABuilder (Recommended)
1. Deploy your app (Option 2)
2. Go to https://pwabuilder.com
3. Enter your deployed URL
4. Click "Build My PWA"
5. Select "Android"
6. Download the APK (~2-5MB)
7. Send APK to phone and install

### Using Bubblewrap (Manual)
```bash
# Install
npm install -g @anthropic/bubblewrap-cli

# Initialize (requires your deployed URL)
bubblewrap init --manifest https://your-app.vercel.app/manifest.webmanifest

# Build APK
bubblewrap build

# Output: app-release-signed.apk
```

---

## Network Requirements

For Option 1 (local dev):
- Phone and PC must be on the same WiFi network
- Windows Firewall may need to allow Node.js

For Options 2 & 3:
- Just need internet connection

---

## Troubleshooting

### "Site can't be reached" on phone
1. Check PC and phone are on same network
2. Try disabling Windows Firewall temporarily
3. Make sure `npm run dev` shows "Network: http://..." URL

### PWA not installing
1. Use HTTPS (required for PWA on deployed sites)
2. Clear browser cache
3. Try Chrome (best PWA support)

### APK won't install
1. Enable "Install from unknown sources" in Android settings
2. Make sure APK is for correct architecture (arm64)

---

## Project Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build locally
```

