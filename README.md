# Relay Timing

A simple race timer for small family races, hosted on Netlify. Timekeepers time the race and publish the results. Everyone else can look up results with a timekeeper ID.

## For timekeepers

1. Go to the home page and choose **Timekeeper**.
2. Create an account with a timekeeper ID (more than 4 characters, such as `thundr$truck`) and a password (at least 6 characters). Next time, log in with the same details.
3. Choose **New race**, name it, add the racers with their bib numbers, and press **Continue to race**. Press **Start race** to start the clock.
   - Under **Race details**, enter the race length and pick miles or kilometers.
   - Tick **Show pace** to add a pace column to the results. Pick the pace unit: minutes per mile, minutes per km, miles per hour, or km per hour.
4. Press **Finish** next to each racer as they cross the line. Results sort into places automatically.
5. When everyone is done, press **Stop race**. Anyone still out is marked Did Not Finish.
6. Press **Publish to home page** so viewers can see the results.

From **Your races** on the home page you can open a race, edit it (names, bibs, times), or delete it.

Share the race's link with anyone who needs to follow it live. Viewers can see the live results on that link, but only the published results appear on the home page. Anyone who opens the link on a device logged in as the timekeeper gets the timer instead.

## For viewers

1. Go to the home page and choose **Viewer**.
2. Type the timekeeper's ID and press **Show races**.
3. You'll see that timekeeper's published races with places, times, and anyone who did not finish.

## Good to know

- Only one device should run a live race as the timekeeper at a time. If two devices are timing the same race, their changes can overwrite each other.
- Passwords can't be reset by email. Keep your password somewhere safe.
- Times are recorded when you press Finish, so press it as soon as each person crosses the line.

## Files

- `index.html`: home page (timekeeper login, your races, viewer lookup).
- `timer.html`: the race timer.
- `edit.html`: the race editor.
- `netlify/functions/`: server code for accounts, races, and results.
- `netlify/lib/`: shared sign-in helpers.
- `AGENTS.md`: notes for AI coding agents that edit this project.
