# AGENTS.md

Notes for AI agents working on this project. Read this before editing.

## What this is

A family race timer hosted on Netlify. It has three pages and a small set of Netlify Functions:

- `index.html`: the home page. Two buttons: **Timekeeper** (log in or create an account, then manage your own races) and **Viewer** (type a timekeeper ID to see that timekeeper's published races).
- `timer.html`: the timer for a race. Runs the overall clock, Finish buttons, Stop race, Publish to home page. Viewers open the same page through a share link and see a read-only live view.
- `edit.html`: lets a logged-in timekeeper edit a race they own (name, racers, bibs, finish times).

There is no build step. Pages are plain HTML, CSS, and vanilla JavaScript. Server code lives in `netlify/functions/` and `netlify/lib/`. Storage is Netlify Blobs.

## Netlify Functions and storage

- `netlify/lib/auth.mjs`: shared helpers. Password hashing (PBKDF2 via `node:crypto`), session tokens, `userFromRequest(req)` (reads `Authorization: Bearer <token>`), and `sameOwner()` (case-insensitive).
- `netlify/functions/account.mjs`: `GET` returns the signed-in username. `POST` with `action` = `signup`, `login`, or `logout`. Usernames: 5 to 30 characters, letters, numbers, and `_ $ . ! @ # -`. Passwords: at least 6 characters.
- `netlify/functions/race.mjs`: store `races`. `GET ?id=` returns `{ state, owner }` for anyone with the link. Logged-in actions: `POST {action:"create", state}`, `PUT {id, state}` (owner only; also refreshes an existing published copy when the race is stopped), `POST {action:"publish", id}` (owner only, race must be stopped), `POST {action:"delete", id}` (owner only; removes the race and its published copy).
- `netlify/functions/results.mjs`: store `published`. `GET ?timekeeper=ID` returns that timekeeper's published races only.
- `netlify/functions/mine.mjs`: `GET` with a token returns the logged-in timekeeper's races, with a `published` flag.
- Race record: `races[id] = { owner, state, updatedAt }`. Published record: `published[id] = { id, owner, name, startedAt, publishedAt, finished, dnf }`.
- Records without an `owner` (races made before v1.5) are ignored everywhere.
- The timekeeper's login token lives in `localStorage` under `family-race-session` as `{ username, token }`.
- Keep `package.json` (dependency `@netlify/blobs`) and `netlify.toml` in the repo. Netlify uses them to install and deploy the functions.
- Functions cannot run locally without `netlify dev`. Test with stubbed `fetch` in the browser, plus a stand-in for the Blobs store in Node.

## Timer page (`timer.html`)

- `state` is the single source of truth: `{ name, racers: [{id, name, bib}], view, startedAt, stoppedAt, finishes: {racerId: elapsedMs}, raceId, publishedAt, distance, distUnit ('mi' or 'km'), showPace, paceUnit ('min/mi', 'min/km', 'mph', 'km/h') }`.
- `save()` persists `state` to `localStorage` under `family-race-timer-v1`, then calls `pushShared()`, which sends the race to the server (PUT, debounced 500 ms). `stateForShare()` decides what is sent. Never send the session token inside the race data.
- Opening `timer.html?race=ID`: `startWithLink()` asks the server for the owner. If the logged-in username matches, the page becomes the timekeeper's timer. Otherwise `openViewer()` adds `body.viewer`, hides timekeeper-only controls, and polls the server every 3 seconds without saving locally.
- Viewer-only elements use class `viewer-only` (shown only in viewer mode). Timekeeper-only elements use class `timekeeper-only` (hidden in viewer mode). Finish and Undo buttons are hidden in viewer mode by `[data-finish]` and `[data-undo]`.
- Publish: the button (shown only when stopped and the device is the timekeeper) sends PUT, then `POST {action:"publish"}`.

## Home page (`index.html`)

- Sections: `startPanel`, `viewerPanel`, `loginPanel`, `homePanel`. `show(panel)` switches between them.
- The home list calls `mine.mjs`. A 401 clears the session and returns to the login form.
- The viewer lookup calls `results.mjs?timekeeper=ID`. It does not list every timekeeper.

## Editor (`edit.html`)

- Requires a session. The server checks ownership on save (PUT). The page also checks the owner before showing the form.
- Times accept `m:ss.t`, `h:mm:ss.t`, or seconds such as `62.4`. A blank time means did not finish.

## Rules when editing

- Keep each page self-contained: no build step, no frameworks, no CDN links that break offline use.
- Keep the code style: plain `var`/function style, `$()` helper for `getElementById`, short comments only where they help.
- Keep the big-button, low-typing design. Family members use phones and laptops, sometimes outdoors.
- Do not change Finish to re-time a racer who already has a time. Use Undo first.
- Escape any user text inserted into HTML with `esc()`.
- Do not put passwords, tokens, or PINs into URLs or logs.
- Editing a race in `edit.html` while it is live can be overwritten by the timer page (last write wins). Tell the timekeeper to edit after the race is stopped.

## Testing

No automated test suite exists. To verify a change:

1. Test the server rules with a stand-in Blobs store: wrong passwords, other timekeepers' races, publishing before stopping, republishing after edits, delete.
2. In the browser, use test copies with a stubbed `fetch`:
   - Home: Viewer ID lookup; Timekeeper log in; the race list.
   - Timer: owner gets the timer; a signed-out visitor gets the viewer.
   - Editor: save sends the new name in a PUT.
3. Check the browser console for errors.

## Known limits (by design, for now)

- No email or password reset. A forgotten password has to be reset by hand in storage.
- Two devices logged in as timekeeper for the same live race can overwrite each other (last write wins). Use one timekeeper device at a time.
- No pause/resume, no lap times, no multi-heat support.
- Times are recorded when Finish is pressed, so there is human reaction delay.

## Change log

- v1: Initial version. Event setup, bib registration, overall start clock, per-racer Finish with Undo, sorted places, CSV export, saved in the browser.
- v1.1: Fixed "Add racer" doing nothing when the browser blocks `localStorage`. `save()` catches the error, the list re-renders before saving, and a warning line (`#storageNote`) appears. Always render from `state` first, then save.
- v1.2: Stop race button. Faint link while racers are still out, big red button once everyone has finished. Unfinished racers are marked DNF, and the clock freezes via `state.stoppedAt`.
- v1.3: Shared live results on Netlify with a timekeeper PIN, a share link, and a live read-only viewer.
- v1.4: Home page lists published races. Timer moved to `timer.html`. Publish to home page.
- v1.5: Timekeeper accounts (ID and password) replace the PIN. Home page has Timekeeper and Viewer buttons. Timekeepers manage their own races (open, edit, delete). Viewers see only one timekeeper's published races by ID. Old races without an owner are no longer shown.
- v1.6: Renamed to Relay Timing with a stopwatch logo (`logo.svg`, also the browser icon). Race details: race length with a miles or km unit, and an optional pace column (minutes per mile or km, mph, or km/h). Details are stored in the race state and copied into published results. Pace is calculated by `pace.js` (`RelayPace`), shared by every page.
- v1.7: Race length is a dropdown with Marathon, Half marathon, 5K, 10K, and Other (Other shows a number field). The pace checkbox always shows, and the pace unit only appears when it is ticked. Race lists show the length in brackets, for example "Park Relay (26.2 mi)". Presets live in `RelayPace.PRESETS` in `pace.js`.
