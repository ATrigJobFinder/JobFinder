# Version 28: map polish

- **Pins show the company icon, not the pay** (`globeOrgIcon` in 36k, `makePins` in 36i): the employer's initials on a colour that is the same every time for that employer. The pay is still on the list cards, the hover summary and the screen-reader label. There are no real logos for made-up employers, so initials stand in for one.
- **Sidebar scrolling** (`hotItem` / `listToTop` in 36f): waits 200 ms (`SCROLL_WAIT`) after a pin is pointed at before the list scrolls, and scrolls so the job sits at the **top** of the list, just under the search boxes (it used to scroll the minimum distance, `block: "nearest"`).
- **Job or industry placeholder** cycles every 2.6 s through "No experience", "Retail", "Hospo", "Barista", "Warehouse", "Nurse", "Trades", "Software", "Teacher" (starting and returning to the original help text). It rests while the box has text or focus. "Hospo" is understood as Hospitality (`globeWhat`).
- **Ask AI bubble** moves left of Google's zoom buttons while the map is open on a wide screen (`body.gl-map-open`, set by `mapFlag` in 36f; rule in `31-v28.css`).
- **Keen for applicants**: jobs with `keen: true` (5 of the CBD examples; every 7th generated one) get a gold "Keen for applicants" bubble on the list card and the hover summary, and a golden outline and glow on the map pin. Meant to show where an employer has paid to advertise.
- **Zooming out to the globe**: the map can now zoom out to level 11 (was 12), and the "back to the globe" check (level 13 or further out, `BACK_AT` in 36i) also runs when the map settles (`idle`), not only on `zoom_changed`.

## Not done
- "Get rid of this:" had nothing after it (the picture or text did not come through), so nothing was removed.
- The real Google map can't be run here (the key only works on your own site), so the zoom-out fix is untested against Google itself.

# Version 28, part 2

## Home card (`.gl-where`)
- **The card no longer makes the page longer.** On a wide screen the Home hero is exactly one screen tall (`31-v28.css`); the card shrinks to fit, and once it is open the big heading steps down to a smaller one and the line under it goes. On a short screen the "closest hub" and "also close by" lines go too (and, under 690px tall, the heading), so the **Find jobs near here** button always fits. Narrow screens still stack as before.
- **The example jobs scroll by on their own** (12 of them, `.gl-jobs-win`), and stop while the pointer or keyboard focus is on them. With "reduce motion" on they don't move and can be scrolled by hand.
- **Map view** button is gone from the card (a dot on the globe, or Jobs near me, still opens the map). The "examples, not live listings" footnote in the card is gone too (the card already says "example jobs"); it is still under the list in map mode.
- **Get job ready** is gone from the Home form.

## Search boxes
- **Job or industry placeholder** now fades out and in (3.2 s between prompts, 0.4 s fade) and the long "A job title, or an industry like..." hint is gone; it starts on "No experience".
- **Location dropdown** works with the arrow keys, Enter (picks the highlighted place) and Escape, like Job or industry.
- **Use my location with location turned off** no longer moves the page: the message line under Location keeps its room (one line wide, two on a phone), and focusing the Location box no longer scrolls.

## Map list
- The **pay is now under the job title** on each card (title first, in the heading font; pay in the accent colour).

## Header
- **Application tracker** moved into the **Find work** menu (after Company guides).
- The **Job Finder logo** takes you back to the globe: from the map it flies back up; from another page it opens Home on the globe (`globeToGlobe` in 36f, called from 18).

## Checked
Opened the built page in headless Chrome at 1440x900, 1366x650, 1280x720 and 390x800: opening a card leaves the page height unchanged on wide screens, the arrow keys and Enter pick a place, hovering pauses the jobs, and the location-denied message doesn't move anything. The map itself (and so the logo leaving it) can't run here, because the Google key only works on your own site: that part was read through, not run.

# Version 28, part 3

- **The map is only opened on purpose.** A place typed in Location (with Jobs near me or Enter), picking from the Location list, "Use my location", "Show me jobs with no experience needed" and the automatic location on a return visit all just turn the globe to that place and open the card (`arrive` in 36f no longer calls `dive`). The map opens from a dot on the globe or by zooming right in. With the map already open they still move the map to the new place.
- **"Waiting for your browser to ask you…"** only appears if the browser hasn't answered within half a second and location isn't already allowed (checked with the Permissions API). If location is already allowed, nothing is shown.
- **Map labels:** suburb names and main-road names now always show; side-street names come in from zoom 17 (`mapStyle` in 36i). Shop, landmark and transit names, and road icons, stay off.
- **Zooming out never leaves the map.** The automatic return to the globe is gone (this replaces the "zoom out to the globe" change from part 1; the minimum zoom is back to 12). The ways back are the **Back to the globe** button and the Job Finder logo.
- Fixed a slip from part 2: pressing Enter on a Location suggestion kept the postcode in the box's name for some places (a lost backslash in a pattern).
