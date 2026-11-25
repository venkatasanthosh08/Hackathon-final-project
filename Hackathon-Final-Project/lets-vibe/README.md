# Let's Vibe - Video Streaming Platform (React + Vite)

SDC Project Review-2. React + Vite frontend with Local Storage authentication.

## Tech
React 18, Vite, React Router, CSS Grid + Flexbox, Local Storage (no backend, no database).

## Modules
- **User Module:** Signup, Login, Home, Movies (search + genre filter), Watch (HTML5 video), My List, Profile, Logout
- **Admin Module:** Admin login, Dashboard statistics, Registered users, Manage content, Logout

## Admin demo login
admin@letsvibe.com / admin123

## Run locally
```
npm install
npm run dev
```

## Deploy on Vercel
```
npm install -g vercel
vercel login
vercel
```
`vercel.json` already contains the rewrite needed for React Router (page refresh on any route works).

## Local Storage keys
`users`, `loggedInUser`, `loggedInRole`, `watchlist:<email>`

Frontend academic implementation. Passwords are stored in plain text only for demonstration.

## Admin movie upload (front-end demo)

The Admin Dashboard now includes an **Upload a new OTT movie** form. Choose a browser-supported video file, add its title/genre/year/description and optionally a poster URL, preview it, then publish it. Uploaded video Blobs are stored in the browser's IndexedDB and movie metadata in Local Storage. Published uploads appear in Home and Movies and can be played from the same browser.

**Important:** this is local browser storage, not public cloud hosting. Uploaded files do not appear on other devices or for other visitors to the Vercel deployment. Public multi-user streaming requires a video hosting/storage service and a backend. Browser storage quotas vary by device and browser.
