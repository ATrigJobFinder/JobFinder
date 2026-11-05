# Version 27: one header, a developer circle, and a map with a list of jobs

## One bar across the top
- **Choose your AI** is gone from the menu and from the Home pitch. The AI bubble in the header still opens it (`#connect` is still a page).
- **Home** is gone from the menu: the **Job Finder logo** is the way home (an employer's logo goes to Hiring).
- **Undo / Redo buttons** are gone (Ctrl+Z and Ctrl+Y still work on the resume, profile, cover letter, templates and LinkedIn pages).
- **The two bars are one** from 900px up: the thin bar under the menu is hidden (`30-v27.css`) and its AI bubble, Contact or help, Profile and account buttons sit at the right of the menu bar (`placeBar` in 18 moves them; on a phone they go back in the thin bar next to the menu button).
- **AI bubble** reads `AI: Chrome` (no ", on this device").

## Developer options
- A small circle under the header, top right (`#devDot`, `18c-developer.js`), only shown after **Ctrl+D** (Ctrl+Shift+D works too; Ctrl+D is taken over on this page while it is open). Pressing the circle opens a small pop-up with the Job seeker / Employer switch and the **Developer** (view as a new visitor) button. While you are seeing the site as a visitor the circle is filled in.

## Home globe and map
- **Your location zooms right in.** "Use my location", "Jobs near me" and the first visit for someone who already allowed location all go straight down to the map, centred on you (zoom 15, with a blue dot for where you are), instead of only turning the globe. If the map can't open, it comes back up with a message as before.
- **The map is laid out like a property search** (`26-globe.css` + `30-v27.css`): on the left the search boxes (Job or industry, Location, Jobs near me, moved up from the globe screen) and **Jobs near you**, on the right the map. On a phone the map is above and the list below.
  - The list shows the jobs **in the map view**, nearest the middle first, and follows the map as you drag or zoom. Zoomed in tighter, fewer are listed ("3 example jobs in this map area of 36 nearby"). With none in view it says so and has **Back to the middle**.
  - Each card has the pay, the title, the employer and where, the kind of job and a short line. Pointing at a card lights its pin and shows its summary; pointing at a pin lights its card; pressing a card moves the map to it.
  - Pins are small pills with the pay on them ($105k, $31/hr).
  - Changing the search or picking another place while the map is open moves the map there (no need to go back to the globe).
- **Example jobs for the map** (`globeLocalJobs` in 36k): about 36 made-up jobs within a few kilometres of the spot, the same ones every time for the same place and search, matching what is in Job or industry. Only within 1.5 km of the Melbourne CBD (with nothing typed in Job or industry) the 16 hand-placed CBD jobs are used. None are at real addresses.
- **In the globe view the card no longer says "Near you"** once it knows where you are (it shows the place name).

## Not done, or only checked with a stand-in
- The real Google map could not be tried here (the key only works on your own site), so the map and list were checked against a stand-in for Google Maps in headless Chrome.
- "Have the Job or industry": that line of the request was cut off, so nothing was done for it.
- The picture of realestate.com.au's layout did not come through with the request, so the layout follows its usual structure: search bar and list on the left, map on the right, list follows the map.

## Location precision
- The place the browser gives is now rounded to about 1 km (two decimals; it was 10 km) so the map lands on your suburb instead of a few kilometres away. It is still the browser's coarse position (`enableHighAccuracy: false`), and nothing is sent or stored by Job Finder (Google Maps does load the map tiles for the area you are looking at).
