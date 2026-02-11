# Product categories (Pattern A – price comparison)

These categories show **6 items per page** with images. When you tap **View price**, you get **20+ USA retailer stores** for that item (price comparison).

| Slug | Name |
|------|------|
| `all-retailers` | All Retailers |
| `groceries` | Groceries |
| `electronics` | Electronics |
| `kitchen` | Kitchen & Appliances |
| `home-accessories` | Home Accessories & Decor |
| `clothing` | Clothing |
| `footwear` | Footwear |
| `books` | Books |
| `household` | Household |
| `medicine` | Medicine |
| `beauty` | Beauty |
| `video-games` | Video Games |
| `sports-equipment` | Sports Equipment |
| `office` | Office Supplies |
| `furniture` | Furniture |
| `tools` | Tools & Hardware |
| `pet-supplies` | Pet Supplies |
| `mattresses` | Mattresses |

**Pagination:** Page 1 shows 6 products. When you scroll to the 6th item, the app requests page 2 and appends the next 6. That only works if the backend returns enough products (page 1 full → `hasMore: true`). If the backend returns fewer than 6 (e.g. 2) because of filtering, you see “Only 2/6 products” and no second page.

**Other categories** (gas-stations, gym, hotels, tires, haircuts, oil-changes, etc.) use **Pattern B or C** (location/services) and do not use this product grid.
