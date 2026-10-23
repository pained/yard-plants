# Yard Plants

A small static web app for tracking the plants in our yard. It reads the
"Landscaping Map" Google Sheet (one tab per yard: number, plant name, year
planted, details) and shows:

- an overview of every plant, grouped by yard, with search and filters
- a page per plant with its details split into a list
- the numbered yard map with a clickable legend

## Editing plants

Add or change rows in the Google Sheet. The app reads it live, so changes show
up on the next page load. For live reads, the sheet must be shared as
"Anyone with the link: Viewer". If the sheet can't be reached, the app falls
back to the snapshots in `data/`.

## Settings

`config.js` holds the sheet id, the tab names, and the map image for each yard.

## Hosting

GitHub Pages: Settings > Pages > Deploy from branch > `main` / root.
No build step. To preview locally: `python3 -m http.server` and open
http://localhost:8000.
