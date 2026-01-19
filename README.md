# Modulr - Personal Finance Manager

A modern, mobile-first PWA for managing personal finances. Built with React, TypeScript, and Supabase.

## Features

- **Transaction Management**: Track income and expenses with categories
- **Dashboard**: View balance, recent transactions, and financial summaries
- **Period Views**: Filter by month, year, or category
- **Import/Export**: Backup and restore your data as JSON
- **Dark Mode**: System-aware theme with manual toggle
- **PWA Ready**: Install on mobile devices for offline access
- **Cloud Sync**: Optional Supabase backend for cross-device sync

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Modulr

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
3. Enable email authentication in Supabase Auth settings

## Configuration

### API Mode

Edit `src/core/config/api.config.ts` to toggle between Supabase and localStorage:

```typescript
export const API_CONFIG = {
  USE_SUPABASE: true,  // Set to false for local-only mode
};
```

### Locale & Currency

Edit `src/core/config/locale.config.ts` to change currency and locale:

```typescript
export const LOCALE_CONFIG = {
  locale: 'fr-FR',
  currency: 'CAD',
};
```

## Project Structure

```
src/
├── core/                 # Shared core functionality
│   ├── components/       # Reusable UI components
│   ├── config/          # App configuration
│   ├── context/         # React contexts (Auth, Theme)
│   └── lib/             # Utility functions
├── modules/             # Feature modules
│   └── finance/         # Finance module
│       ├── components/  # Finance-specific components
│       ├── pages/       # Finance pages
│       ├── services/    # Data services
│       └── types/       # TypeScript types
└── App.tsx              # Main app component
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
