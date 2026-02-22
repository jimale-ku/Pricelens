# AI Receipt Scanner – Free vs OpenAI

Your receipt scanner **works without paying anything**. You can optionally add OpenAI for better accuracy.

---

## Option 1: FREE (default – no setup)

**You don’t need to add anything.**

- The app uses **Tesseract.js** (free OCR) on the server.
- No API key, no account, no cost.
- **How to use:** Just run the server and use “Upload Receipt” on the Plus screen. It will extract line items and total from the receipt image.

**Limitations of free OCR:**

- Works best with clear, well-lit photos and simple receipts.
- Handwriting or messy receipts may not parse well.
- Format is assumed: “Item name” followed by a price (e.g. `MILK 2.99`).

---

## Option 2: OpenAI (optional – costs money)

If you want **better accuracy** (handwriting, messy receipts, different layouts), you can add OpenAI Vision. **It is not free** after any trial:

- New OpenAI accounts often get a **small free credit** (e.g. a few dollars). After that you pay per use.
- **Vision (image) requests cost money** – usually a few cents per receipt. Heavy use can add up.

### How to add OpenAI (only if you want to pay)

1. **Create an account**
   - Go to [https://platform.openai.com](https://platform.openai.com)
   - Sign up (email or Google).

2. **Add payment (required to use API)**
   - In the dashboard: **Billing** → add a payment method.
   - You can set a **monthly limit** (e.g. $5) so you don’t overspend.

3. **Create an API key**
   - In the dashboard: **API keys** → **Create new secret key**.
   - Copy the key (it starts with `sk-`). You won’t see it again.

4. **Put the key in your server**
   - In the **server** folder, open or create `.env`.
   - Add:
     ```env
     OPENAI_API_KEY=sk-your-copied-key-here
     ```
   - Restart the server.

5. **Behavior**
   - If `OPENAI_API_KEY` is set, the receipt scanner uses **OpenAI Vision** (better quality).
   - If it is **not** set, the app uses **Tesseract** (free) as above.

---

## Summary

| Option        | Cost        | Setup              | Quality        |
|---------------|------------|--------------------|----------------|
| **Tesseract** | **Free**   | None               | Good for clear receipts |
| **OpenAI**    | Paid (per use) | Add key in `.env` | Better, more flexible |

**Recommendation while building:** Use the **free** option (do nothing). Add OpenAI later only if you need better accuracy and are okay with the cost.

---

## How to test without a real receipt

1. **In the app:** Open **Plus** tab → scroll to **AI Receipt Scanner** → tap **"Try sample"**.  
   The app calls the server with a sample receipt image and shows the extracted items (or a message if nothing was read). You must be **logged in** and the **server** must be running.

2. **With your own image:** Use **"Upload Receipt"** and pick any receipt-like photo from your gallery (e.g. from [sample receipt images](https://www.google.com/search?q=sample+receipt+image) or a screenshot of a fake receipt with lines like `Milk 2.99`, `Total 5.00`).
