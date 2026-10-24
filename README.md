# Family Race Timer

A simple, offline timing page for small family races. It is one file, `index.html`, with no install, no server, and no internet connection needed.

## How to use it

1. Double-click `index.html` to open it in Chrome, Safari, Edge, or Firefox.
2. **Name the event** at the top of the first screen.
3. **Register racers**: type each racer's name and bib number, then press Add racer (or Enter). Bib numbers must be unique. Use Remove to take someone off the list.
4. Press **Continue to race**.
5. Press **Start race** to start the overall clock.
6. As each racer crosses the line, press their **Finish** button. Their time is locked in and they move up into **Results**, sorted into places (1st, 2nd, 3rd...).
7. Made a mistake? Press **Undo** next to a result to put that racer back on course, then press Finish again.
8. When you are done, press **Download results (CSV)** to save the places and times as a spreadsheet file.

## Buttons

| Button | What it does |
| --- | --- |
| Continue to race | Moves from registration to the race screen |
| Start race | Starts the overall clock (only once per race) |
| Finish | Records that racer's time from the start |
| Undo | Removes a finish time so the racer can be re-timed |
| Edit racers | Goes back to registration (only before the race starts) |
| Download results (CSV) | Saves Place, Bib, Name, Time; anyone who has not finished is listed as DNF |
| Reset race times | Stops the clock and clears all finish times, keeping the racers |
| New event | Erases everything and starts over |

## Good to know

- **Everything is saved in the browser automatically.** If you refresh or close the tab, the event, racers, and clock keep going. Use the same browser on the same computer to pick up where you left off.
- Times are shown as minutes:seconds.tenths, such as `0:12.4` or `1:03.8`, and as hours past an hour.
- Places are decided by finish time, fastest first.
- Clearing browser data or using a private window will lose the saved race, so download the CSV at the end.
- Times are recorded when you press Finish, so press it right away as each person crosses.

## Files

- `index.html`: the whole app (layout, styling, and logic).
- `README.md`: this guide for people.
- `AGENTS.md`: notes for AI coding agents that edit this project.
