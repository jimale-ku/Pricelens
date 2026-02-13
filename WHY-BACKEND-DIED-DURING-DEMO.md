# Why the Backend Didn’t Respond During Your Zoom Demo

## Most likely cause: Render free tier was sleeping

On Render’s **free** plan, your backend is put to **sleep** after about **15 minutes** with no traffic.

When the client opened the app during the meeting:

1. The app sent a request to `https://pricelens-1.onrender.com`
2. The service was **asleep**
3. The first request has to **wake** the server (cold start), which can take **30–60+ seconds**
4. The app or browser often **times out** before the server responds, so it looks like “backend not responding”

So the backend wasn’t broken; it was **asleep** and too slow to answer in time.

---

## Other possible causes

| Cause | What to check |
|-------|----------------|
| **Render sleeping** | Free tier sleeps after ~15 min idle. First request after that is slow or times out. |
| **Zoom / WiFi** | Heavy Zoom use can make the **client’s** network slow; their request might timeout. |
| **Wrong / cached URL** | Client’s app might be pointing at an old URL (e.g. ngrok). Confirm app uses `https://pricelens-1.onrender.com`. |
| **Render outage** | Check https://status.render.com and Render dashboard for incidents. |
| **Service crash** | In Render dashboard, check **Logs** for errors or restarts. |

In practice, **Render sleeping** is the most common reason for “backend not responding” during a demo.

---

## What to do before the next demo

### Option 1: Wake Render right before the meeting (free)

**5–10 minutes before the Zoom call:**

1. Open in your browser:  
   **https://pricelens-1.onrender.com/stores**
2. Wait until the page loads (might take 30–60 seconds the first time).
3. Optionally click around or refresh once or twice so the server stays warm.
4. Then start the meeting. The backend should respond quickly for the next ~15 minutes.

Do this every time you have a demo if you stay on the free plan.

---

### Option 2: Keep it awake with a simple “ping” (free)

Use a free “uptime” or “cron” service that hits your backend every 10–14 minutes so it never goes to sleep, for example:

- **UptimeRobot** (free): https://uptimerobot.com  
  - Add a monitor for: `https://pricelens-1.onrender.com/stores`  
  - Check interval: 5 minutes  
- **Cron-job.org** (free): https://cron-job.org  
  - Create a job that GETs `https://pricelens-1.onrender.com/stores` every 10 minutes  

Then Render won’t sleep during the day, and the app will work during demos.

---

### Option 3: Upgrade Render so the service doesn’t sleep (paid)

On a **paid** plan (e.g. **Starter**), the web service **does not** spin down. It stays running 24/7, so:

- No cold starts
- No “backend not responding” just because nobody used it for 15 minutes

Useful when you have regular client demos or production traffic.

---

## Quick checklist for your next demo

- [ ] **10 min before call:** Open `https://pricelens-1.onrender.com/stores` in a browser and wait for it to load (wake Render).
- [ ] **Confirm app URL:** Client’s app should use `https://pricelens-1.onrender.com` (check `client/constants/api.ts` and that the client has the latest build).
- [ ] **Optional:** Set up UptimeRobot (or similar) to ping that URL every 5–10 minutes so Render doesn’t sleep.

---

## Summary

- **What happened:** Render free tier put your backend to sleep; the first request during the Zoom demo was a cold start and likely timed out, so the app looked like the backend wasn’t responding.
- **What to do:** Wake Render (open the URL in a browser) 5–10 minutes before the next demo, or use a free ping service to keep it awake, or upgrade to a paid Render plan so it never sleeps.
