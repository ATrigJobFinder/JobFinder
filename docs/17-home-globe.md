# Home globe

The first screen of Home is a full-width, full-height scene: a realistic Earth in space under the heading "Welcome to the new way to find jobs". The old "From blank page to job offer, free" hero sits just below it (its heading is now an h2).

## What it does
- **Look:** NASA satellite imagery with the sea recoloured to a bright blue (lighter over the shallows), sunlight from the upper left, a sun glint on the water, drifting clouds that cast shadows, a blue haze at the edge and a star field. Clouds fade as you zoom in so the map stays clear.
- **Spin it:** drag (mouse or finger) anywhere on the screen, or use the arrow keys when the globe has focus. It turns slowly by itself until someone touches it, and keeps coasting after a flick.
- **Zoom:** the + and - buttons, a pinch, or Ctrl+scroll. Plain scrolling still scrolls the page.
- **Jobs on the globe:** about 65 hubs (Australian cities and towns, then the big job cities worldwide) as orange pins, bigger for more example jobs. Hover or tap a pin for a card, click it to fly there and list example jobs. Close in, individual jobs show as small dots around each city. Pins and labels are left out where the headline, buttons or card are drawn over the planet.
- **Approximate location:** "Share my location" asks the browser for a coarse position (`enableHighAccuracy: false`), rounds it to about 10 km, names it from the suburb list (`findPlaces`/`allPlaces` in 21) or the nearest hub, and flies there. Nothing is sent or stored. If someone already allowed location on this site, it zooms in on first visit without a prompt. If the browser says no (or it's blocked, as inside Claude's preview), the card switches to "Type a place instead": any Australian suburb or postcode, or any hub city.
- **Everything is made up:** the jobs are examples generated in `36f-globe.js` (same ones every time). The card says so, and "Find jobs near here" goes to the real Find jobs tab.

## Home is only the globe (v24)
- **The whole page:** Home is the globe and nothing else. The older sections under it (the "From blank page to job offer" intro, the tool list, Bring your own AI, the step-by-step plan and the Hiring prompt) are still in `src/index.html` but hidden by one CSS rule (`#view-home > .wrap.lp` in `26-globe.css`). Delete that rule to show them again.
- **Scroll wheel zooms:** no Ctrl needed. Zoom in all the way and keep scrolling in (or press +) and it breaks through the clouds to the map.
- **Click an orange dot:** it flies there and opens the map at that spot. Dots near Melbourne open the CBD with the 16 example jobs; any other city gets its own example jobs pinned around it (placed around the city, not at real addresses). With no Maps key, a click shows the city card instead.
- **The search box:** "Job or industry" takes a job title or an industry and what it covers, like `Retail > Fashion` (suggestions come from `36k-globe-search.js`; add industries to `GLOBE_TREE` there). "Location" takes a suburb, postcode or city, and **Use my location** asks the browser. **Jobs near me** flies to the place and lists example jobs for what you typed. **Get job ready** goes to Create or edit resume.
- **Find jobs near here** carries both boxes over to the Find jobs page.

## Zooming down to the map (Google Maps)
Zooming right in (the + button, Ctrl+scroll or a pinch past the limit, or the "Map view" button on the card) breaks through the clouds: a wall of cloud builds across the globe, the globe fades out and Google's own map is underneath. It is a plain road map: no landmarks, shops, transit or suburb names, and street names only once you are zoomed in close (zoom 17 and up, set by `NAMES_FROM` in 36i). Street View and the satellite view are switched off. Near Melbourne it opens on the CBD with the example jobs; anywhere else it opens on the spot you dived into, and the "Melbourne CBD jobs" button takes you to the CBD. "Back to the globe" (or zooming the map right out) climbs back up through the clouds to the globe above that spot.

It uses the official Maps JavaScript API (`36i-globe-street.js`), so it is switched off until you give it a key:
1. In Google Cloud (console.cloud.google.com) create a project and switch on billing. Maps has a monthly free allowance, then charges per use, so set a budget alert. Check Google's current pricing.
2. Under APIs and services, enable **Maps JavaScript API**.
3. Credentials > Create credentials > API key. Under Application restrictions choose **Websites** and add your site (for example `https://yoursite.com/*`) and `http://localhost:5173/*` for `npm run dev`. Under API restrictions pick Maps JavaScript API. The key is public in the page, so these restrictions are what protect it.
4. Paste it into `GOOGLE_MAPS_KEY` in `src/scripts/07a-account-config.js`, then `npm run build`.

Notes:
- It only works on a site that can reach Google. Inside Claude's preview, outside scripts are blocked, so the dive comes back up with a message.
- If Google rejects the key (wrong site address, billing off, API not enabled) the dive comes back up with a message saying so.
- Only Google's official API is used. Don't copy Google's imagery tiles yourself: the terms don't allow it.
- The map shows 16 made-up jobs in the Melbourne CBD (`36j-globe-cbd.js`), on real street corners. Hover a pin (or tab to it, or tap it) for the title, employer, corner, type, pay range and a one line summary. The globe's own example jobs elsewhere are not shown on the map. To change the jobs, edit the list in 36j.
- With no key the feature is hidden entirely: no button, and zooming stops at the limit.
- Tested with a stand-in for Google Maps (the whole dive, reveal and return). Not yet tested against Google itself, because that needs a real key.

## How it's built
- **36i-globe-street.js** loads Google Maps on demand and opens the plain map and draws the job pins; the dive and climb animation lives in 36f (`dive` and `surface`), and the cloud wall in the shader (`uBreak` in 36h).
- **36h-globe-gl.js** is the realistic Earth: one WebGL 2 fragment shader draws the whole background (stars, glow, planet, clouds). Nothing is loaded from the internet, so it works inside Claude's preview as well as on your own site.
- **36g-globe-texture.js** is data: NASA's Blue Marble picture (public domain, NASA Earth Observatory) at 4096 x 2048, as a 580 KB JPEG inside the page. Rebuild it with `npm install --no-save sharp` then `node scripts/make-globe-texture.mjs`; lower `QUALITY` in that script to make the page smaller. If a graphics card can't hold 4096 pixels across, the picture is shrunk first.
- **36f-globe.js** is everything else: the pins and labels (drawn on a transparent 2D canvas over the shader), drag, inertia, pinch, fly-to animation, the layout of the planet in the hero, and the card beside it. It uses the same projection as the shader (see `toWorld` in 36h), so pins land on the right spots.
- **Fallback:** with no WebGL 2 (or if the graphics context is lost) the page draws the earlier dotted globe instead, using the land map in **36e-globe-data.js** (`scripts/make-globe.mjs`) and the page's own light or dark colours. The hero class `gl-real` marks which one is showing.
- **26-globe.css:** the hero is full-bleed, as tall as the screen less a strip of the next section. On a wide screen the planet sits right of centre and the words and card on the left; on a phone the words are above, the planet in the middle and the card below. In the realistic scene the hero sets its own dark colours, so the buttons, card and fields look right whatever the page's theme.
- It only draws while Home is showing and on screen, and honours reduced-motion (no spin, no pulse, no clouds drifting, jumps instead of flying). Very large screens draw fewer pixels than they have (about 2.4 million) to keep the clouds smooth.

## Limits
- The picture is one image of the whole Earth, so close in it gets soft; the deepest zoom shows about a state, not a street. For sharper close-ups, use a bigger picture (the 8k version is about 2.5 MB) or load map tiles on a hosted site.
- Hub job counts are invented. To show real counts, feed `GLOBE_HUBS[].jobs` and `globeJobs()` from the jobs database (34b).
- Clouds are generated, not live weather.
