# Employer research

The Company guides page lists every employer in `src/scripts/04l-company-directory.js` (plus the 135 full guides in 04b to 04k). Each link there was found by searching for the employer's careers page and keeping only a page on the employer's own website.

- `careers-links-found.txt`: what's been checked so far, one per line: `name or guide key | careers page | graduate page`.
- `employers-to-check.txt`: employers still to look up, one per line: `industry | size | states | name | ASX code`. Size is g (global), l (large), m (medium) or s (small).

To add one by hand, find its careers page on its own website (not a job board, Prosple, GradConnection, SEEK, LinkedIn or Indeed), then add a line to `COMPANY_DIRECTORY` in 04l:

```js
{ n: "Bunnings", i: "retail", s: "large", st: "National", u: "https://www.bunnings.com.au/careers", a: "WES" }
```

`i` must be a key of `GUIDE_INDUSTRIES` (04b, plus the extra ones at the top of 04l). Leave out `g` and `a` when there's no graduate page or ASX code.
