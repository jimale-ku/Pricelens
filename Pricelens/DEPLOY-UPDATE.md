# Deploy & test flow (Render + EAS)

## Backend (Render)
- **Host:** Render deploys from GitHub.
- **To apply changes:** Commit and push to the GitHub repository. Render will auto-deploy after push.
- **Env:** Ensure `PRICESAPI_KEY` (and any other keys) are set in the Render service **Environment** (not only in local `.env`).

## Frontend (EAS)
- **Host:** Expo Application Services (EAS); app is built from this repo.
- **API URL:** Production builds use `EXPO_PUBLIC_API_URL` or fallback `RENDER_API_URL` in `client/constants/api.ts` (e.g. `https://pricelens-qvvj.onrender.com`). No change needed if the app already points to your Render URL.
- **To test backend-only changes (e.g. barcode pricing):** After pushing backend to GitHub and Render finishing deploy, open the existing EAS app and test; it will hit the updated backend.
- **To ship new client code:** Run `eas update` (OTA) or `eas build` and submit a new build to stores as needed.

## Testing barcode prices
1. Push server changes to GitHub and wait for Render deploy to finish.
2. Open the EAS app (or a build that uses the Render API URL).
3. Use compare/search with a barcode (or a product that has a barcode). Prices and product title/image should come from PricesAPI when available.
