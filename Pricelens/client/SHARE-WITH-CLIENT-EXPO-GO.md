# Share PriceLens with client (no laptop needed)

The app is set to use the **Render backend** (`EXPO_PUBLIC_API_URL` in `.env`). Once you publish to Expo, the client can open it in **Expo Go** and use the app without your laptop.

## One-time setup (do once)

1. **Install EAS CLI** (if you don’t have it):
   ```bash
   npm install -g eas-cli
   ```

2. **Log in to Expo**:
   ```bash
   cd Pricelens/client
   eas login
   ```
   Use your Expo account (or create one at [expo.dev](https://expo.dev)).

3. **Link the project** (if not already linked):
   ```bash
   eas init
   ```
   Choose “Link to existing project” or “Create new” when asked.

## Every time you want to share an update with the client

1. **From the client folder**:
   ```bash
   cd Pricelens/client
   ```

2. **Publish the current app to the “main” channel**:
   ```bash
   eas update --branch main --message "Production"
   ```
   If the update fails on "Computing project fingerprints", run: `EAS_SKIP_AUTO_FINGERPRINT=1 eas update --branch main --message "Production"`  
   Wait for it to finish (usually 1–2 minutes).

3. **Get the link**:
   - In the terminal, EAS will print a link, or
   - Go to [expo.dev](https://expo.dev) → your account → project **pricelens** → **Project overview** or **Updates**. There you’ll see a link/QR to open the app in Expo Go.

4. **Send the link to your client** (e.g. WhatsApp, email).  
   They should:
   - Install **Expo Go** from the App Store (iPhone) if they don’t have it.
   - Open the link (or scan the QR). The app will load in Expo Go and use the Render backend. Your laptop can be off.

## Notes

- **Backend**: Must be running on Render (you already have this).
- **Link**: Use the **same** Expo project link each time; new publishes just update what the client sees when they open it.
- **No laptop**: After you run `eas update`, you can close your laptop. The client uses Expo’s servers + Render.
