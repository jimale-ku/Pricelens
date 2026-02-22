# "Can't reach server" – Fix frontend ↔ backend connection

Follow these steps in order.

---

## 1. Backend must be running

In a terminal (project root or `server` folder):

```bash
npm run start:dev
```

You should see something like: **Listening on 0.0.0.0:3000**. Leave this running.

---

## 2. Test from your PC (same machine as the server)

Open in a browser on your PC:

- **http://192.168.201.105:3000/stores**
- Or: **http://localhost:3000/stores**

- If you see JSON (e.g. `[{...}, {...}]`): backend is fine; the problem is the **device or network** (steps 3–4).
- If it doesn’t load: backend isn’t running or isn’t on port 3000. Fix that first.

---

## 3. Same network (phone/tablet only)

The device where the app runs must be on the **same Wi‑Fi** as the PC that runs the server.

- Phone on **mobile data** → cannot reach `192.168.x.x` → **Can't reach server**.
- Phone and PC on **same Wi‑Fi** → can reach `192.168.201.105` (if that’s your PC’s IP).

If you use a **phone**, connect it to the same Wi‑Fi as your PC, then try again.

---

## 4. Correct IP in the app

Your PC’s IP can change (e.g. new Wi‑Fi, router restart).

**Get your current IP:**

- **Windows:** open CMD and run: `ipconfig`  
  Use the **IPv4 Address** of the adapter you use for Wi‑Fi (e.g. `192.168.1.5`).
- **Mac/Linux:** `ifconfig` or `ip a`

**Set it in the app (choose one):**

**Option A – Env (recommended, no code edit)**  
In `client/.env` (create if needed):

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:3000
```

Example if your IP is `192.168.1.5`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
```

Restart Expo (`npx expo start`). Clear cache if needed: `npx expo start -c`.

**Option B – Edit code**  
In `client/constants/api.ts`, change `DEFAULT_API_BASE_URL` (or the fallback) to:

```ts
const DEFAULT_API_BASE_URL = 'http://YOUR_PC_IP:3000';
```

Replace `YOUR_PC_IP` with the IPv4 from step above (e.g. `192.168.1.5`).

---

## 5. Windows Firewall (if PC works but phone still can’t reach server)

If the browser on your **PC** can open `http://192.168.201.105:3000/stores` but the **app on your phone** still says "Can't reach server", the firewall may be blocking port 3000.

**Allow Node / port 3000:**

1. Windows Search → **Windows Defender Firewall** → **Advanced settings**.
2. **Inbound Rules** → **New Rule…**.
3. **Port** → Next → **TCP**, **Specific local ports**: `3000` → Next.
4. **Allow the connection** → Next → check **Private** (and **Domain** if you use it) → Next.
5. Name: e.g. **Node backend 3000** → Finish.

Then try the app again on the phone.

---

## 6. Test from the phone browser (same Wi‑Fi)

On your phone (same Wi‑Fi as PC), open the browser and go to:

**http://192.168.201.105:3000/stores**

(Use your real PC IP if different.)

- If you see JSON: network and firewall are OK; if the app still fails, try clearing Expo cache and reloading.
- If it doesn’t load: still a network/firewall issue (same Wi‑Fi? firewall step above? correct IP?).

---

## Quick checklist

| Check | Done |
|-------|------|
| Backend running (`npm run start:dev`) | ☐ |
| On PC: open http://192.168.201.105:3000/stores → see JSON | ☐ |
| Phone on same Wi‑Fi as PC (no mobile data) | ☐ |
| `client/constants/api.ts` or `EXPO_PUBLIC_API_URL` uses your PC’s current IP | ☐ |
| Windows Firewall allows TCP port 3000 (if using phone) | ☐ |
| Restarted Expo after changing IP (`npx expo start -c`) | ☐ |

After these, "Can't reach server" should be resolved unless something else (VPN, corporate network, etc.) is blocking access.
