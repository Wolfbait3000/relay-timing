# AGENTS.md

Notes for AI agents working on this project. Read this before editing.

## What this is

A single-page race timer for small family races. The whole app is `index.html` (HTML, CSS, and vanilla JavaScript in one file). There is no build step, no package manager, no framework, and no server. Keep it that way unless the user asks otherwise.

## Flow the user expects

1. **Setup view** (`#setupView`): name the event, register racers (name + unique bib), then "Continue to race".
2. **Race view** (`#raceView`): one overall "Start race" button starts the clock. Each racer has a "Finish" button that records their elapsed time. Finished racers appear in **Results**, sorted by time with places 1, 2, 3...; unfinished racers appear under **Still on course**.
3. Racers can be undone (returns them to the course) before or after the race. Editing racers is only allowed before the race starts.

## Code layout inside `index.html`

- `<style>`: CSS variables in `:root` (`--go`, `--stop`, `--accent`, medal colors). Mobile breakpoint at 600px.
- `<body>`: two sections, `#setupView` and `#raceView`, toggled with the `hidden` class.
- `<script>` (wrapped in an IIFE, `'use strict'`):
  - `state` is the single source of truth: `{ name, racers: [{id, name, bib}], view, startedAt, stoppedAt, finishes: {racerId: elapsedMs} }`.
  - `save()` / `load()` persist `state` to `localStorage` under the key `family-race-timer-v1`. Changing the shape of `state` means changing or migrating that key; bump the version suffix if the change would break old saved data.
  - `elapsed()` is `Date.now() - state.startedAt`. The clock ticks every 100 ms from `setInterval(updateClock, 100)`, so a reload resumes correctly.
  - `standings()` returns finished racers sorted by time. Places are the index + 1 (ties are not specially handled).
  - `fmt(ms)` formats as `m:ss.t`, or `h:mm:ss.t` past an hour.
  - `renderSetup()`, `renderRace()`, and `showView()` rebuild the DOM from `state`. Event handling uses delegation on the lists via `data-remove`, `data-finish`, and `data-undo` attributes.
  - User text is inserted into HTML through `esc()`. Keep doing that for every value that comes from user input.

## Rules when editing

- Keep it a single, dependency-free HTML file that opens by double-click (`file://`). Do not add `fetch`, module imports, or CDN links that would break offline use.
- Keep the code style: plain `var`/function style, `$()` helper for `getElementById`, short comments only where they help.
- Keep the big-button, low-typing design: this is used on a phone or laptop by family members, sometimes outdoors.
- Do not change the Finish behavior to re-time a racer who already has a time. Use Undo first. This prevents accidental double-taps from overwriting times.
- The bib uniqueness check is case-insensitive and trims whitespace. Keep it.
- Do not reintroduce a dependency on a server or account.

## Testing

No automated test suite exists. To verify a change:

1. Open `index.html` in a browser (or the task browser with `agent-browser open <path>`).
2. Add 3+ racers including a duplicate bib (should be rejected).
3. Start the race, Finish racers in a different order than registered, and confirm the Results order and places.
4. Undo one result and re-finish it.
5. Reload the page mid-race and confirm the clock and results are kept.
6. Download the CSV and check the Place / Bib / Name / Time columns and DNF rows.
7. Check the browser console for errors.

## Known limits (by design, for now)

- Data lives only in the browser's `localStorage` on that device. There is no sync between phones and laptops.
- No pause/resume, no lap times, no automatic bib/photo timing, no multi-heat support.
- Times are recorded when Finish is pressed, so there is human reaction delay. This is accepted for family races.

## Change log

- v1: Initial version. Event setup, bib registration, overall start clock, per-racer Finish with Undo, sorted places, CSV export, saved in the browser.
- v1.2: Added a Stop race button. It is a faint underlined link while racers are still out, and a big red button once everyone has finished. Stopping always asks for confirmation. Unfinished racers are marked DNF (shown under "Did not finish"), and the clock freezes via `state.stoppedAt`. Finish buttons lock after stopping. Reset and New event clear `stoppedAt`.
- v1.1: Fixed "Add racer" doing nothing when the browser blocks `localStorage`. `save()` now catches the error, the list re-renders before saving, and a warning line (`#storageNote`) appears. Always render from `state` first, then save.
