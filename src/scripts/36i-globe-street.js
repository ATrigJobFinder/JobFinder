/* ===================== Home globe: down to a clean Google map with example jobs ===================== */
// The globe (36f) plunges through the clouds, then this shows Google's own map underneath: plain roads, no landmarks or shop names,
// suburb names and main roads always, and side street names once you are zoomed in close. The Melbourne CBD example jobs (36j) sit on it as pins with a hover summary.
// It uses the official Maps JavaScript API, so it needs GOOGLE_MAPS_KEY (07a) and only works on a site that can reach Google (not inside Claude's preview).
// Street View and the satellite view are left off on purpose. Returns { prepare, show, hide, toCbd, ... } for 36f to drive; nothing here touches the globe itself.
function globeStreet(el) {
  let gmap = null, loading = null, bad = false, labelled = false, pinLayer = null, meMark = null, allJobs = [], home = null;
  const NAMES_FROM = 17;       // side street names appear from this zoom (16 is about the whole CBD on one screen)
  const api = {
    live: false,               // the map is on screen
    onBad: null,               // called if Google turns the key down after the map has opened
    onView: null,              // called when the map stops moving (the list of jobs follows what is in view)
    onHot: null,               // called with the job a pin is pointed at (or null)
    onPick: null,              // called with the job a pin was pressed for
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

  // One pin per example job, drawn in Google's overlay layer so they move with the map. Hovering or focusing a pin shows the summary.
  function makePins() {
    class Pins extends google.maps.OverlayView {
      constructor() { super(); this.jobs = []; this.items = []; }
      setJobs(list) { this.jobs = list; if (this.box) { this.fill(); this.draw(); } }
      onAdd() {
        this.box = document.createElement("div");
        this.box.className = "gl-pins";
        this.fill();
        this.getPanes().overlayMouseTarget.appendChild(this.box);
      }
      fill() {
        this.box.textContent = "";
        this.items = this.jobs.map(j => {
          const b = document.createElement("button"), tip = document.createElement("span"), lab = document.createElement("span");
          const icon = globeOrgIcon(j.org);
          b.type = "button"; b.className = "gl-pin" + (j.keen ? " keen" : ""); b.style.setProperty("--pin-c", icon.colour);
          b.setAttribute("aria-label", `${j.title}, ${j.org}, ${j.at}. Example job, ${j.kind}${j.pay ? ", " + j.pay : ""}${j.keen ? ". Keen for applicants" : ""}. ${j.about}`);
          lab.className = "gl-pin-l"; lab.setAttribute("aria-hidden", "true"); lab.textContent = icon.text; b.appendChild(lab);
          tip.className = "gl-pin-tip"; tip.setAttribute("aria-hidden", "true");
          const add = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; n.textContent = text; tip.appendChild(n); };
          add("b", "", j.title); add("span", "", `${j.org} · ${j.at}`); add("em", "", ["Example job", j.kind, j.pay].filter(Boolean).join(" · ")); if (j.keen) add("strong", "gl-keen-tip", "Keen for applicants"); add("p", "", j.about);
          b.appendChild(tip);
          const flip = () => {   // keep the summary on the map: below the pin near the top edge, and nudged in near the sides
            const m = el.getBoundingClientRect(), r = b.getBoundingClientRect();
            b.classList.toggle("below", r.top - m.top < 190);
            b.classList.toggle("near-l", r.left - m.left < 140);
            b.classList.toggle("near-r", m.right - r.right < 140);
          };
          b.addEventListener("pointerenter", () => { flip(); if (api.onHot) api.onHot(j); }); b.addEventListener("focus", () => { flip(); if (api.onHot) api.onHot(j); });
          b.addEventListener("pointerleave", () => { if (api.onHot) api.onHot(null); }); b.addEventListener("blur", () => { if (api.onHot) api.onHot(null); });
          b.addEventListener("click", () => { const was = b.classList.contains("on"); this.items.forEach(i => i.b.classList.remove("on")); if (!was) { flip(); b.classList.add("on"); if (api.onPick) api.onPick(j); } });   // a tap, on a touch screen
          this.box.appendChild(b);
          return { b, j };
        });
      }
      draw() {
        const proj = this.getProjection(); if (!proj) return;
        for (const { b, j } of this.items) { const p = proj.fromLatLngToDivPixel(new google.maps.LatLng(j.lat, j.lng)); b.style.left = p.x + "px"; b.style.top = p.y + "px"; }
      }
      onRemove() { if (this.box) this.box.remove(); }
      closeAll() { if (this.items) this.items.forEach(i => i.b.classList.remove("on")); }
      hot(job) { if (this.items) this.items.forEach(i => i.b.classList.toggle("hot", !!job && i.j === job)); }
      open(job) { if (this.items) this.items.forEach(i => { const on = i.j === job; i.b.classList.toggle("on", on); if (on) { const m = el.getBoundingClientRect(), r = i.b.getBoundingClientRect(); i.b.classList.toggle("below", r.top - m.top < 190); i.b.classList.toggle("near-l", r.left - m.left < 140); i.b.classList.toggle("near-r", m.right - r.right < 140); } }); }
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
  api.focus = job => { if (!gmap || !job) return; gmap.panTo({ lat: job.lat, lng: job.lng }); if (gmap.getZoom() < 15) gmap.setZoom(15); if (pinLayer) pinLayer.open(job); };
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
  api.hide = () => { api.live = false; if (pinLayer) { pinLayer.closeAll(); pinLayer.hot(null); } };
  // back to the CBD and its example jobs, from anywhere on the map
  api.toCbd = () => { if (!gmap) return; gmap.panTo({ lat: GLOBE_CBD.lat, lng: GLOBE_CBD.lng }); gmap.setZoom(GLOBE_CBD.zoom); };
  return api;
}
