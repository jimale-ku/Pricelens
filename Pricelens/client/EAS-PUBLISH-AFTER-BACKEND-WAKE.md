# Publish EAS update after waking Render backend

When the backend on Render was sleeping (free tier) and you've woken it by opening the backend URL in Chrome (e.g. `https://your-app.onrender.com/stores` or `/categories`), run this so the client's app works again quickly.

## Steps

1. **Backend is already woken**  
   You opened the Render URL in Chrome so the long response loaded. Backend is now awake.

2. **From your laptop, in terminal:**
   ```bash
   cd /Users/g/Documents/priceLens_mac/Pricelens/client
   eas update --branch main --message "Refresh after backend wake"
   ```
   (If `eas` isn't found, run `npm install -g eas-cli` once, then run `eas update` again.)  
   If you use a different branch for your builds, replace `main` with that branch name (e.g. `preview`).

3. **Tell your client**  
   Use the **same EAS link** as before. No new link, no new invitation.  
   When they open the app (or pull to refresh if the app supports it), they'll get the latest update and the backend will respond fast while it's awake.

## Notes

- You do **not** need to send a new invitation.
- You do **not** need to send a new EAS link (same link is fine).
