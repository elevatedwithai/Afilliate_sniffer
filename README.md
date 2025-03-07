# PART 1
# AI-Powered Affiliate Link Finder

An automated tool that scans AI tool websites to find affiliate programs and collects relevant information about them.

## Features

- Scans 2200+ AI tool websites for affiliate programs
- Searches for affiliate links in website footers, headers, and dedicated pages
- Falls back to Google search if no links are found on the website
- Collects affiliate signup URLs, commission rates, cookie durations, and contact information
- Stores all data in Supabase with real-time updates
- Provides a dashboard to track progress and view results
- Allows exporting the final list as CSV

## Setup

### Prerequisites

- Node.js (v16+)
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Connect to Supabase using the "Connect to Supabase" button in the UI

### Database Setup

The application requires the following tables in Supabase:

1. `ai_tools` - Stores information about AI tools
2. `affiliate_programs` - Stores affiliate program information for each tool

The migration file in `supabase/migrations/create_initial_schema.sql` will create these tables for you.

### Importing Tools

Use the `src/utils/importTools.js` script to import your AI tools into the database:

```
node src/utils/importTools.js
```

You can modify this script to import your own data from a JSON file or other source.

### Running the Scraper

To start the affiliate program scraper:

```
npm run scrape
```

The scraper will:
1. Fetch pending tools from the database
2. Visit each tool's website to look for affiliate links
3. Search Google if no links are found on the website
4. Extract commission details and other information
5. Update the database with the results
6. Retry failed lookups up to 3 times

### Running the Dashboard

To start the dashboard:

```
npm run dev
```

The dashboard provides:
- Overview of scraping progress
- Detailed view of all affiliate programs found
- Filtering and search capabilities
- Export functionality

## Architecture

- **Frontend**: React with Tailwind CSS
- **Backend**: Node.js scraper with Puppeteer and Cheerio
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Query for data fetching and caching

## License

MIT

# PART 2 
# Affiliate Link Finder Scraper

## Purpose:
This scraper fetches affiliate tool data from targeted websites and stores it in Supabase for use in our SEO-powered directory.

## Data Flow:
1. Scraper runs → pulls data from each tool's website.
2. Data is inserted or updated in the `affiliate_links` table.
3. AI processes enhance the data post-scrape for SEO optimization.

## Fields:
See `lib/supabase.ts` and `scraper/index.js` for full schema.

## Developer Notes:
- Supabase URL and keys are stored in `.env`.
- Avoid duplicates by checking `website_url` and `tool_name`.
- Extend scraper modules to extract the new fields listed in this README.
- Contact Shawn for any production updates or schema changes.
