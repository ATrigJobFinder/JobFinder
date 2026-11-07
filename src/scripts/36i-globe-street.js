/* ===================== Home globe: down to a clean Google map with example jobs ===================== */
// The globe (36f) plunges through the clouds, then this shows Google's own map underneath: plain roads, no landmarks or shop names,
// suburb names and main roads always, and side street names once you are zoomed in close. The Melbourne CBD example jobs (36j) sit on it as pins. Pointing at a pin previews it; a tap keeps the summary up until the pointer is 30px away, and a double tap saves the job.
// It uses the official Maps JavaScript API, so it needs GOOGLE_MAPS_KEY (07a) and only works on a site that can reach Google (not inside Claude's preview).
// Street View and the satellite view are left off on purpose. Returns { prepare, show, hide, setJobs, route, ... } for 36f to drive; nothing here touches the globe itself.
function globeStreet(el) {
  let gmap = null, loading = null, bad = false, labelled = false, pinLayer = null, meMark = null, allJobs = [], home = null;
  const NEAR_PX = 30;           // a pinned summary stays up until the pointer is this far from both the pin and the summary
  const NAMES_FROM = 17;       // side street names appear from this zoom (16 is about the whole CBD on one screen)
  const api = {
    live: false,               // the map is on screen
    onBad: null,               // called if Google turns the key down after the map has opened
    onView: null,              // called when the map stops moving (the list of jobs follows what is in view)
    onPick: null,              // called with the job a pin was pressed for (one tap)
    onSave: null,              // called with the job a pin was double tapped for
    isSaved: () => false,      // asked whether a job is already saved, to mark its pin
    get bad() { return bad; }
  };
  // Google calls this by name when the key is wrong, restricted to another site, or the API isn't switched on
  window.gm_authFailure = () => { bad = true; if (api.onBad) api.onBad(); };

  function load() {
    if (loading) return loading;
    return (loading = new Promise((res, rej) => {
      if (window.google && google.maps && google.maps.importLibrary) return res();
      window.__jfMapsReady = res;
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&v=weekly&loading=async&language=en-AU&region=AU&callback=__jfMapsReady`;
      s.async = true;
      s.onerror = () => { loading = null; rej(new Error("blocked")); };
      document.head.appendChild(s);
    }));
  }

  // A plain road map: no shop, landmark or transit names. Suburb names and the names of main roads always show; side streets get names once zoomed in close.
  const mapStyle = sideNames => [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { featureType: "road.local", elementType: "labels", stylers: [{ visibility: sideNames ? "on" : "off" }] }
  ];
  const restyle = () => {
    const want = gmap.getZoom() >= NAMES_FROM;
    if (want !== labelled) { labelled = want; gmap.setOptions({ styles: mapStyle(want) }); }   // only reloads the tiles when the zoom crosses the line
  };

  // One pin per example job, drawn in Google's overlay layer so they move with the map. Pointing at or focusing a pin previews the summary.
  // One tap pins the summary open (until the pointer is NEAR_PX away from it) and picks the job; a second tap soon after saves it.
  function makePins() {
    const dist = (x, y, r) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
    class Pins extends google.maps.OverlayView {
      constructor() {
        super(); this.jobs = []; this.items = []; this.open1 = null; this.armed = false; this.lastTap = { j: null, t: 0 };
        this.move = e => {   // pinned summary: close it once the pointer has gone NEAR_PX from both the pin and the summary
          if (!this.open1 || (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen")) return;
          const it = this.open1, tip = it.b.querySelector(".gl-pin-tip");
          const d = Math.min(dist(e.clientX, e.clientY, it.b.getBoundingClientRect()), tip ? dist(e.clientX, e.clientY, tip.getBoundingClientRect()) : 1e9);
          if (d <= NEAR_PX) this.armed = true; else if (this.armed) this.closeAll();
        };
      }
      setJobs(list) { this.jobs = list; this.open1 = null; if (this.box) { this.fill(); this.draw(); } }
      onAdd() {
        this.box = document.createElement("div");
        this.box.className = "gl-pins";
        this.fill();
        this.getPanes().overlayMouseTarget.appendChild(this.box);
        document.addEventListener("pointermove", this.move);
      }
      place(b) {   // keep the summary on the map: below the pin near the top edge, and nudged in near the sides
        const m = el.getBoundingClientRect(), r = b.getBoundingClientRect();
        b.classList.toggle("below", r.top - m.top < 230);
        b.classList.toggle("near-l", r.left - m.left < 140);
        b.classList.toggle("near-r", m.right - r.right < 140);
      }
      fill() {
        this.box.textContent = "";
        this.items = this.jobs.map(j => {
          const b = document.createElement("button"), tip = document.createElement("span"), lab = document.createElement("span");
          const icon = globeOrgIcon(j.org);
          b.type = "button"; b.className = "gl-pin" + (j.keen ? " keen" : "") + (api.isSaved(j) ? " saved" : ""); b.style.setProperty("--pin-c", icon.colour);
          b.setAttribute("aria-label", `${j.title}, ${j.org}, ${j.at}. Example job, ${j.kind}${j.pay ? ", " + j.pay : ""}${j.keen ? ". Keen for applicants" : ""}. ${j.about} Press to open it, press twice to save it for later.`);
          lab.className = "gl-pin-l"; lab.setAttribute("aria-hidden", "true"); lab.textContent = icon.text; b.appendChild(lab);
          tip.className = "gl-pin-tip"; tip.setAttribute("aria-hidden", "true");
          const add = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; n.textContent = text; tip.appendChild(n); };
          add("b", "", j.title); add("span", "", `${j.org} · ${j.at}`); add("em", "", ["Example job", j.kind, j.pay].filter(Boolean).join(" · ")); if (j.keen) add("strong", "gl-keen-tip", "Keen for applicants"); add("p", "", j.about);
          b.appendChild(tip);
          b.addEventListener("pointerenter", () => this.place(b)); b.addEventListener("focus", () => this.place(b));
          // one tap opens the job (and keeps its summary up); a second tap on the same pin within the double-tap time saves it
          b.addEventListener("click", () => {
            const now = performance.now(), twice = this.lastTap.j === j && now - this.lastTap.t < 450;
            this.lastTap = twice ? { j: null, t: 0 } : { j, t: now };
            if (twice) { if (api.onSave) api.onSave(j); return; }
            this.pin(j, true); if (api.onPick) api.onPick(j);
          });
          // the map must not zoom or pan from a tap or double tap on a pin
          try { google.maps.OverlayView.preventMapHitsFrom(b); } catch { /* older API */ }
          this.box.appendChild(b);
          return { b, j };
        });
        this.open1 = null;
      }
      draw() {
        const proj = this.getProjection(); if (!proj) return;
        for (const { b, j } of this.items) { const p = proj.fromLatLngToDivPixel(new google.maps.LatLng(j.lat, j.lng)); b.style.left = p.x + "px"; b.style.top = p.y + "px"; }
      }
      onRemove() { document.removeEventListener("pointermove", this.move); if (this.box) this.box.remove(); }
      closeAll() { if (this.items) this.items.forEach(i => i.b.classList.remove("on")); this.open1 = null; this.armed = false; }
      hot(job) { if (this.items) this.items.forEach(i => i.b.classList.toggle("hot", !!job && i.j === job)); }
      // keep this job's summary up (the pointer is on the pin when it was tapped, so it counts as near already)
      pin(job, near) {
        if (!this.items) return;
        for (const i of this.items) {
          const on = i.j === job; i.b.classList.toggle("on", on);
          if (on) { this.place(i.b); this.open1 = i; this.armed = !!near; }
        }
      }
      refreshSaved() { if (this.items) this.items.forEach(i => i.b.classList.toggle("saved", !!api.isSaved(i.j))); }
    }
    return new Pins();
  }

  // Loads Google Maps and puts the plain map under the globe. Near Melbourne it opens on the CBD, where the example jobs are.
  // `jobs`: example jobs to pin when it isn't Melbourne (the ones around the city that was clicked)
  // opts.cbd: centre on the Melbourne CBD (where the example jobs are on real corners); opts.zoom: how close to open
  api.prepare = async (spot, jobs, opts = {}) => {
    await load();
    if (bad) throw new Error("key");
    const { Map } = await google.maps.importLibrary("maps");
    const centre = opts.cbd ? { lat: GLOBE_CBD.lat, lng: GLOBE_CBD.lng } : { lat: spot.lat, lng: spot.lng }, zoom = opts.zoom || GLOBE_CBD.zoom, list = jobs || [];
    home = { centre, zoom, cbd: !!opts.cbd }; allJobs = list;
    if (!gmap) {
      labelled = zoom >= NAMES_FROM;
      gmap = new Map(el, { center: centre, zoom, minZoom: 12, mapTypeId: "roadmap", styles: mapStyle(labelled), tilt: 0, gestureHandling: "greedy", disableDefaultUI: true, zoomControl: true, keyboardShortcuts: true, clickableIcons: false });
      gmap.addListener("zoom_changed", restyle);
      gmap.addListener("click", () => { if (pinLayer) pinLayer.closeAll(); });
      gmap.addListener("idle", () => { if (api.live && api.onView) api.onView(); });
      pinLayer = makePins(); pinLayer.setJobs(list); pinLayer.setMap(gmap);
    } else { gmap.setCenter(centre); gmap.setZoom(zoom); restyle(); pinLayer.setJobs(list); }
    return { spot };
  };
  // the jobs in view right now (nearest the middle first), and all of them
  api.jobs = () => allJobs;
  api.inView = () => {
    if (!gmap) return [];
    const b = gmap.getBounds(), c = gmap.getCenter();
    if (!b || !c) return allJobs.slice();
    const sw = b.getSouthWest(), ne = b.getNorthEast(), w = sw.lng(), e = ne.lng();
    const inside = allJobs.filter(j => j.lat >= sw.lat() && j.lat <= ne.lat() && (w <= e ? j.lng >= w && j.lng <= e : j.lng >= w || j.lng <= e));
    return inside.sort((a, z) => globeKm(c.lat(), c.lng(), a.lat, a.lng) - globeKm(c.lat(), c.lng(), z.lat, z.lng));
  };
  api.hot = job => { if (pinLayer) pinLayer.hot(job); };
  api.refreshSaved = () => { if (pinLayer) pinLayer.refreshSaved(); };
  api.focus = job => { if (!gmap || !job) return; gmap.panTo({ lat: job.lat, lng: job.lng }); if (gmap.getZoom() < 15) gmap.setZoom(15); if (pinLayer) pinLayer.pin(job, false); };
  api.recentre = () => { if (gmap && home) { gmap.panTo(home.centre); gmap.setZoom(home.zoom); } };
  // the map's box changed size (the list opened beside it): tell Google, and keep the middle where it was
  api.resize = () => { if (!gmap) return; const c = gmap.getCenter(); google.maps.event.trigger(gmap, "resize"); if (c) gmap.setCenter(c); };
  // where you are: a blue dot (null removes it)
  api.setMe = pos => {
    if (!gmap) return;
    if (!pos) { if (meMark) { meMark.setMap(null); meMark = null; } return; }
    const at = { lat: pos.lat, lng: pos.lng };
    if (meMark) { meMark.setPosition(at); meMark.setMap(gmap); return; }
    meMark = new google.maps.Marker({ position: at, map: gmap, title: "You are here", zIndex: 1, clickable: false, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#2563EB", fillOpacity: 1, strokeColor: "#FFFFFF", strokeWeight: 3 } });
  };
  api.show = () => { api.live = true; };
  api.hide = () => { api.live = false; api.clearRoute(); if (pinLayer) { pinLayer.closeAll(); pinLayer.hot(null); } };
  // swap in a fresh set of jobs without moving the map
  api.setJobs = list => { allJobs = list || []; if (pinLayer) pinLayer.setJobs(allJobs); };
  // the middle of what is on screen
  api.centre = () => { const c = gmap && gmap.getCenter(); return c ? { lat: c.lat(), lng: c.lng() } : null; };

  // How to get to a job: Google's directions drawn on the map, plus the steps as plain text. mode: TRANSIT, DRIVING, WALKING or BICYCLING.
  // Rejects (with a message) if directions aren't switched on for the key or there is no route.
  let dirs = null;
  const plain = html => new DOMParser().parseFromString(String(html || ""), "text/html").body.textContent.replace(/\s+/g, " ").trim();
  api.clearRoute = () => { if (dirs) dirs.setMap(null); };
  api.route = async (job, from, mode) => {
    if (!gmap) throw new Error("map");
    const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");
    const req = { origin: { lat: from.lat, lng: from.lng }, destination: { lat: job.lat, lng: job.lng }, travelMode: google.maps.TravelMode[mode] };
    if (mode === "TRANSIT") req.transitOptions = { departureTime: new Date() };
    let res;
    try { res = await new DirectionsService().route(req); }
    catch (e) { throw new Error(e && /ZERO_RESULTS|NOT_FOUND/.test(String(e.code || e.message)) ? "none" : "denied"); }
    if (!dirs) dirs = new DirectionsRenderer({ suppressInfoWindows: true, polylineOptions: { strokeColor: "#2440B8", strokeWeight: 5, strokeOpacity: 0.9 } });
    dirs.setMap(gmap); dirs.setDirections(res);
    const leg = res.routes[0].legs[0];
    return {
      duration: leg.duration ? leg.duration.text : "", distance: leg.distance ? leg.distance.text : "",
      leave: leg.departure_time ? leg.departure_time.text : "", arrive: leg.arrival_time ? leg.arrival_time.text : "",
      steps: leg.steps.map(s => {
        const t = s.transit;
        return { text: t ? `${t.line.vehicle && t.line.vehicle.name ? t.line.vehicle.name : "Public transport"} ${t.line.short_name || t.line.name || ""} from ${t.departure_stop.name} to ${t.arrival_stop.name}${t.num_stops ? ` (${t.num_stops} stop${t.num_stops === 1 ? "" : "s"})` : ""}` : plain(s.instructions), time: s.duration ? s.duration.text : "", transit: !!t };
      })
    };
  };
  return api;
}
