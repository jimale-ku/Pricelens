# Store logos and price comparison (USA)

## Current behavior

### Only these 21 stores are shown when you “View Price”

For **any** product (electronics, groceries, etc.), the compare view shows **only** these stores (USA-focused, with local logos):

- Amazon, Walmart, Target, Best Buy, Costco  
- eBay, Newegg, B&H Photo, Adorama, Ant Online, Woot, Back Market  
- Lenovo, Dell, HP, Micro Center, GameStop, QVC, HSN, Focus Camera, Staples  

The backend **allowlist** filters Serper/SerpAPI results to these stores only. Unknown or other retailers are not shown so the client can compare only the stores you care about.

---

## Additional US stores you can add (logos to fetch)

If you want to **expand** the compare list later, add a logo under `client/assets/attachments/` and then add the store to the allowlist and `storeAssets.ts`. Suggested **US retailers** that often appear in shopping results:

| Store | Suggested filename | Notes |
|-------|--------------------|--------|
| Apple | `apple.png` | Very common for electronics |
| Samsung | `samsung.png` | Phones, TVs, appliances |
| Home Depot | `homedepot.png` | Home improvement |
| Lowe's | `lowes.png` | Home improvement |
| Office Depot | `officedepot.png` | Office supplies |
| OfficeMax | `officemax.png` | Office supplies |
| Macy's | `macys.png` | Department store |
| Kohl's | `kohls.png` | Department store |
| Nordstrom | `nordstrom.png` | Department store |
| Wayfair | `wayfair.png` | Furniture / home |
| Overstock | `overstock.png` | General merchandise |
| Etsy | `etsy.png` | Marketplace (handmade/vintage) |
| Sam's Club | `samsclub.png` | Warehouse club |
| Kroger | `kroger.png` | Grocery |
| Safeway | `safeway.png` | Grocery |
| Whole Foods | `wholefoods.png` | Grocery |
| CVS | `cvs.png` | Pharmacy / retail |
| Walgreens | `walgreens.png` | Pharmacy / retail |
| Petco | `petco.png` | Pet supplies |
| PetSmart | `petsmart.png` | Pet supplies |
| Nike | `nike.png` | Apparel / sports |
| Dick's Sporting Goods | `dicks.png` | Sports / outdoor |
| Bed Bath & Beyond | `bedbathbeyond.png` | Home |
| Williams-Sonoma | `williams-sonoma.png` | Kitchen / home |
| Barnes & Noble | `barnesandnoble.png` | Books / retail |

After you add an image (e.g. `apple.png`), say which store it is and we can wire it into the allowlist and logo mapping.

---

## Realistic prices only

To avoid nonsense like fruit over $1000:

1. **Global cap**  
   Any single item price above **$50,000** is rejected (treated as API/parsing error).

2. **Groceries / food**  
   If the product looks like food or grocery (e.g. fruit, milk, vegetables, produce, dairy, organic produce), any price above **$200** is rejected.

3. **Existing rules**  
   Existing checks still apply (e.g. iPhone minimums, printer/minimums, etc.).

So only plausible prices are shown for the stores that have logos and are on the allowlist.
