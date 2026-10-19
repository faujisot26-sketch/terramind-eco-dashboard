# TerraMind Eco Dashboard

A calm, local-first dashboard for logging household waste and electricity, following practical eco missions, and understanding how everyday choices add up.

## Run it

```bash
npm install
npm run dev
```

The public demo is published with GitHub Pages at <https://faujisot26-sketch.github.io/terramind-eco-dashboard/>. Pushes to `main` rebuild and publish it automatically.

Create an optimized static build with `npm run build`; serve the `dist/` folder from any HTTPS static host. After the first visit, the installed PWA shell can open offline. Your logs are saved in this browser on this device; they do not sync between devices.

## Features

- Waste and appliance-energy logs with edit/delete flows, summaries, charts and CSV export.
- Missions, action timeline, analytics, community feed and local settings.
- Sample household data to make the first demo useful. Clear it or replace it with your own entries from Settings.
- Installable PWA shell and offline access to the app after the first visit.
- Optional Gemini-powered coaching and audits. Without a key, the logging, analytics and local data tools still work.

## Privacy and estimates

Core records stay in the browser's local storage. If you add a Gemini API key and use AI features, the relevant prompt and household summary are sent directly from your browser to Google Gemini. The key is stored in this browser only. Do not enter information you do not want to share with that service.

Carbon figures are estimates based on the factors shown in the app's methodology view; real-world impact varies by location, material and household. Community posts, member counts and pledges are sample interface data. Pledges are simulated and do not move money; the included community feed is not connected to a real neighborhood network.

## Built with

React, TypeScript, Vite, Tailwind CSS, and Lucide icons.
