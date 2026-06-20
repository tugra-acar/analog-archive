# Analog Photo Archive

A personal web app to digitally store, map, and organize analog film photos.

## Features

- **Interactive Map:** See exactly where photos were taken using a Leaflet-based map.
- **Roll Management:** Group photos by their film roll. Keep track of film types (Color/B&W) and shoot dates.
- **Archive Explorer:** Browse through your entire photo history. Includes favoriting and basic filtering.
- **Local Storage:** Images are uploaded via a local Express server and metadata is saved in a simple `photos.json` file—no complex databases required.
- **Clean UI:** Built with React and animated with Framer Motion for a smooth experience.

## Tech Stack

### Frontend
- **React 19** & **Vite**
- **Vanilla CSS** for custom styling
- **Leaflet & React Leaflet** for maps
- **Framer Motion** for animations
- **Chart.js** for stats

### Backend
- **Node.js** & **Express**
- **Multer** for handling image uploads
- **JSON storage** using a local `photos.json` to keep things simple and avoid database hosting costs.

## Getting Started

To run the app locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   # This spins up both the frontend and backend at the same time
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`

## Syncing with Git

Since the database (`photos.json`) and the actual photos (`public/images/uploads`) are tracked directly in Git, make sure you follow a basic sync routine when adding new rolls to keep things in check:

1. Always pull the latest changes before starting:
   ```bash
   git pull origin main
   ```
2. After uploading new photos, commit and push your changes:
   ```bash
   git add .
   git commit -m "Added a new film roll: [Roll Name]"
   git push origin main
   ```

## Credits

- **Design:** The beautiful design and UI/UX of this project were created by [Damla Demirok](https://github.com/damladmrk).
