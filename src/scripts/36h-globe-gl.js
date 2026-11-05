/* ===================== Home globe: the realistic Earth (WebGL) ===================== */
// One full-screen shader draws everything behind the pins: stars, the glow around the planet, NASA's picture of the Earth
// (36g) with the sea recoloured, sunlight, a sun glint on the water, drifting clouds with shadows, and the blue haze at the edge.
// Returns { ok: false } when the browser has no WebGL 2 (or loses it), and the page falls back to the dotted globe in 36f.
const GLOBE_VERT = `#version 300 es
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
const GLOBE_FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;      // canvas size in pixels
uniform vec2 uC;        // centre of the planet in pixels, from the top left
uniform float uR;       // radius of the planet in pixels
uniform vec4 uRot;      // cos and sin of the longitude, then of the latitude, at the centre of the view
uniform float uTime;    // seconds
uniform float uCloud;   // how much cloud to show (fades as you zoom in, so the map stays clear)
uniform float uTexW;    // width of the picture in pixels
uniform float uHasTex;  // 0 until the picture has loaded
uniform float uDpr;
uniform float uBreak;   // 0 normally; 0 to 1 while flying down through the clouds to street level
uniform sampler2D uTex;
out vec4 outColor;
const float PI = 3.14159265;

float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm4(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.02 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
float fbm5(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.02 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
vec3 rotY(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }

// the page's projection, undone: a point on the visible face, seen from above, back to a direction in the world
vec3 toWorld(vec3 v) {
  float cl = uRot.x, sl = uRot.y, cp = uRot.z, sp = uRot.w;
  float Y = v.y * cp + v.z * sp, z1 = -v.y * sp + v.z * cp;
  return vec3(v.x * cl + z1 * sl, Y, -v.x * sl + z1 * cl);
}
// cloud cover from 0 to 1 at a direction on the world sphere
float clouds(vec3 w) {
  vec3 p = rotY(w, uTime * 0.003) * 2.6;
  vec3 q = vec3(fbm4(p + 3.1), fbm4(p + 7.7), fbm4(p + 11.3));
  float f = fbm5(p * 1.6 + 1.4 * q);
  float lat = asin(clamp(w.y, -1.0, 1.0));
  return smoothstep(0.50, 0.74, f + 0.07 * cos(lat * 4.0));
}
vec3 stars(vec2 frag) {
  float cell = 3.0 * uDpr;
  vec2 g = floor(frag / cell), f = fract(frag / cell);
  float s = h21(g);
  if (s < 0.968) return vec3(0.0);
  float b = (s - 0.968) / 0.032;
  vec2 o = vec2(h21(g + 3.7), h21(g + 9.1)) * 0.6 + 0.2;
  float d = length(f - o) * cell / uDpr;
  float a = smoothstep(0.45 + 0.7 * b, 0.0, d) * (0.18 + 0.82 * b * b);
  return mix(vec3(0.72, 0.84, 1.0), vec3(1.0, 0.90, 0.76), h21(g + 5.3)) * a;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = (frag - uC) / uR;
  float rr = length(p);
  vec3 L = normalize(vec3(-0.55, 0.38, 0.74));   // the sun: up and to the left, towards you

  // space, and the glow around the planet
  vec3 col = vec3(0.004, 0.007, 0.016) + stars(frag);
  float d = rr - 1.0;
  if (d > 0.0) {
    float lit = 0.35 + 0.65 * smoothstep(-0.6, 0.8, dot(normalize(vec2(p.x, -p.y) + 1e-5), L.xy));
    col += vec3(0.25, 0.52, 1.0) * (exp(-d * 22.0) * 0.55 + exp(-d * 5.0) * 0.10) * lit;
  }

  float inside = 1.0 - smoothstep(1.0 - 1.5 / uR, 1.0 + 0.5 / uR, rr);
  if (inside > 0.0) {
    float z = sqrt(max(0.0, 1.0 - rr * rr));
    vec3 n = normalize(vec3(p.x, -p.y, z + 1e-4));
    vec3 w = toWorld(n);
    vec2 uv = vec2(atan(w.x, w.z) / (2.0 * PI) + 0.5, 0.5 - asin(clamp(w.y, -1.0, 1.0)) / PI);

    vec3 c = vec3(0.12, 0.34, 0.66);
    if (uHasTex > 0.5) {
      float texels = uTexW / (2.0 * PI) / (uR * max(z, 0.08));     // picture pixels under one screen pixel
      c = textureLod(uTex, uv, max(0.0, log2(max(1.0, texels)))).rgb;
      float mag = max(0.0, -log2(texels));
      c *= 1.0 + (vnoise(w * 900.0) + 0.5 * vnoise(w * 1800.0) - 0.75) * 0.10 * smoothstep(0.4, 2.5, mag);   // a little grain when zoomed far past the picture
    }
    // sea: lighter and greener over the shallows, deep blue far out. Land: a touch brighter.
    float water = smoothstep(0.03, 0.12, c.b - max(c.r, c.g * 0.9));
    float depth = smoothstep(0.08, 0.62, c.b);
    vec3 sea = mix(vec3(0.06, 0.20, 0.48), vec3(0.26, 0.60, 0.84), pow(depth, 0.8));
    c = mix(pow(c, vec3(0.80)) * 1.12, sea, water);

    float ndl = dot(n, L);
    float shade = 0.20 + 0.85 * smoothstep(-0.45, 0.70, ndl);
    vec3 ground = c * shade;
    float glint = water * pow(max(reflect(-L, n).z, 0.0), 48.0) * 0.55;

    float cover = 0.0, shadow = 0.0;
    if (uCloud > 0.01) {
      cover = clouds(w) * uCloud;
      vec3 Lw = toWorld(L);
      shadow = clouds(normalize(w + (Lw - w * dot(Lw, w)) * 0.018)) * uCloud;
    }
    if (uBreak > 0.0) {   // a wall of cloud builds up and fills the screen
      cover = max(cover, smoothstep(0.1, 0.9, uBreak * 1.5 - 0.35 + (fbm4(w * 30.0 + vec3(0.0, 0.0, uTime * 0.2)) - 0.5) * 0.9));
    }
    ground *= 1.0 - 0.38 * shadow * (1.0 - cover);
    ground += vec3(1.0, 0.96, 0.86) * glint * (1.0 - cover);
    vec3 cloudCol = vec3(0.96, 0.97, 1.0) * (0.14 + 0.92 * shade);
    vec3 sphere = mix(ground, cloudCol, cover * 0.93);
    sphere = mix(sphere, vec3(0.94, 0.96, 1.0), smoothstep(0.75, 1.0, uBreak));

    float rim = pow(1.0 - z, 2.6);
    sphere += vec3(0.30, 0.56, 1.0) * rim * (0.22 + 0.85 * smoothstep(-0.5, 0.8, ndl)) * 0.9;
    col = mix(col, sphere, inside);
  }
  col += (h21(frag) - 0.5) / 255.0;   // keeps the dark glow from banding
  outColor = vec4(col, 1.0);
}`;

function globeGL(cv) {
  const off = { ok: false };
  let gl = null;
  try { gl = cv.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" }); } catch { /* no WebGL */ }
  if (!gl) return off;
  const make = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  try {
    gl.attachShader(prog, make(gl.VERTEX_SHADER, GLOBE_VERT)); gl.attachShader(prog, make(gl.FRAGMENT_SHADER, GLOBE_FRAG)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn("Globe shader:", e.message); return off; }
  gl.useProgram(prog);
  const U = {}; for (const n of ["uRes", "uC", "uR", "uRot", "uTime", "uCloud", "uTexW", "uHasTex", "uDpr", "uBreak", "uTex"]) U[n] = gl.getUniformLocation(prog, n);
  const tex = gl.createTexture();
  let texW = 1, loaded = false, onLoad = null;
  const api = { ok: true, set onLoad(f) { onLoad = f; } };

  // the picture of the Earth: shrunk first if this graphics card can't hold 4096 pixels across
  const img = new Image();
  img.onload = () => {
    let src = img;
    const max = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (img.width > max) { const c = document.createElement("canvas"); c.width = max; c.height = max / 2; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); src = c; }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const an = gl.getExtension("EXT_texture_filter_anisotropic");
    if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    texW = src.width; loaded = true;
    if (onLoad) onLoad();
  };
  img.src = GLOBE_TEXTURE;

  cv.addEventListener("webglcontextlost", e => { e.preventDefault(); api.ok = false; });

  // o: { W, H (page pixels), cx, cy, R (page pixels), lat, lng (degrees), t (ms), z (zoom), brk (0 to 1, the dive through the clouds) }
  api.draw = o => {
    // very large screens draw fewer pixels than the screen has: the clouds are costly, and the sea is soft anyway
    const k = Math.max(0.6, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2.4e6 / (o.W * o.H))));
    const w = Math.round(o.W * k), h = Math.round(o.H * k);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h);
    const lat = o.lat * GLOBE_D, lng = o.lng * GLOBE_D;
    gl.uniform2f(U.uRes, w, h); gl.uniform2f(U.uC, o.cx * k, o.cy * k); gl.uniform1f(U.uR, o.R * k);
    gl.uniform4f(U.uRot, Math.cos(lng), Math.sin(lng), Math.cos(lat), Math.sin(lat));
    gl.uniform1f(U.uTime, o.t / 1000); gl.uniform1f(U.uCloud, o.z <= 2.2 ? 1 : o.z >= 4.5 ? 0.3 : 1 - 0.7 * (o.z - 2.2) / 2.3);
    gl.uniform1f(U.uTexW, texW); gl.uniform1f(U.uHasTex, loaded ? 1 : 0); gl.uniform1f(U.uDpr, k); gl.uniform1f(U.uBreak, o.brk || 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.uTex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  return api;
}
