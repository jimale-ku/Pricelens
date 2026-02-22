# Service Categories – Testing Guide

Use this guide to test **Rental Cars**, **Hotels**, **Spa**, and other service categories with **real Serper data** (not mock). You can test via **API** (script/curl) or **in the app** (Expo).

**Base URL:** Use your backend URL, e.g. `http://localhost:3000` or `http://YOUR_IP:3000`.

---

## Does Serper return data for service categories?

**Yes.** The backend uses **Serper Maps** (Google Maps via Serper) for all service categories when mock is off. Some also use **Serper Shopping** to enrich with prices.

| Category | Serper data source | Notes |
|----------|--------------------|--------|
| **Rental Cars** | Maps: "car rental {location}" | Places + links; price shows "Check price on site" (Maps doesn’t have rates). |
| **Hotels** | Maps + Shopping | Maps for hotels in location; Shopping to add $/night where possible. |
| **Spa, Massage, Haircuts, Nail salons** | Maps + Shopping | Maps for local businesses; Shopping for price hints. |
| **Gas stations** | Maps + fuel API | Maps for stations; gas prices from OilPriceAPI/Apify when configured. |
| **Gyms** | Maps + Shopping | Maps for gyms; Shopping for membership prices. |
| **Oil changes, Tires, Car washes** | Maps | Local shops; prices may be estimated. |
| **Storage, Meal kits, Car/Renters insurance** | Maps | Local results; prices estimated or "Get quote". |
| **Apartments, Moving, Food delivery** | Maps | Local businesses. |
| **Airfare** | Serper Search (organic) | Flight-related links; not structured flight prices. |

---

## Use real data (turn off mock)

1. **Server `.env`** (e.g. `Pricelens/server/.env`):
   - Set **`SERPER_API_KEY`** to your key (from [serper.dev](https://serper.dev)).
   - Set **`USE_MOCK_SERVICE_DATA=false`** so the server uses Serper instead of mock.
2. **Restart the server** so it picks up the new env.

If `USE_MOCK_SERVICE_DATA` is not set, the server uses **real data when** `SERPER_API_KEY` (or `SERPAPI_KEY`) is set and **mock when** in development with no key.

---

## Test from the command line (script)

From the **server** directory, run the test script (server must be running):

```bash
cd Pricelens/server
chmod +x scripts/test-service-categories.sh
./scripts/test-service-categories.sh http://localhost:3000
```

Use your machine’s IP if the server runs on another host, e.g. `./scripts/test-service-categories.sh http://192.168.1.10:3000`. Each request can take 10–40 seconds when using real Serper (e.g. Hotels does Maps + Shopping). The script uses a 45s timeout per endpoint; to increase it: `CURL_TIMEOUT=60 ./scripts/test-service-categories.sh http://localhost:3000`.

The script hits each service endpoint and prints **OK** plus approximate result count and the first result name. If you see **OK** and **results > 0**, Serper (or mock) returned data. With mock off and a valid key, the names will be real places (e.g. real hotel or rental car company names), not the fixed mock list.

---

## What to do in the app to verify they’re working

1. **Backend:** Ensure server is running with **`USE_MOCK_SERVICE_DATA=false`** and **`SERPER_API_KEY`** set, then restart.
2. **App:** Point the app at the same backend (e.g. `EXPO_PUBLIC_API_URL=http://YOUR_IP:3000`).
3. **In the app**, open each category and run a search as below. You should see **real business names and addresses** (and where supported, real-looking prices), not the same mock list every time.

| Category | In the app – what to do | What you should see (real data) |
|-----------|--------------------------|-----------------------------------|
| **Rental Cars** | Open **Rental Cars** → Pickup: `LAX` → Dates: `Dec 1-5 2025` → Car type: SUV → **Search** | List of real rental companies (e.g. Hertz, Enterprise, local brands), addresses, “Check price on site”. |
| **Hotels** | Open **Hotels** → Destination: `Los Angeles` → Check-in/out and guests → **Search** | Real hotels in that area; prices if Serper Shopping returns them. |
| **Spa** | Open **Spa Services** → ZIP: `90210` → tap **“60-min Swedish Massage”** (or any popular service) | Real spas/salons near that ZIP; price ranges if available. |
| **Gas stations** | Open **Gas Stations** → ZIP: `90210` → Gas: Regular → **Search** | Real gas stations; prices if fuel API is configured. |
| **Gyms** | Open **Gym Memberships** → ZIP: `90210` → **Search** | Real gyms; membership prices if Shopping returns them. |
| **Oil changes** | Open **Oil Changes** → ZIP: `90210` → Vehicle: Sedan → **Search** | Real oil-change shops; estimated or “Contact for pricing”. |
| **Tires** | Open **Tires** → Year/Make/Model/ZIP (e.g. 2020 Toyota RAV4, 90210) → **Search** | Real tire shops. |
| **Storage** | Open **Storage Units** → ZIP: `90210` → **Search** | Real storage facilities. |
| **Haircuts** | Open category that uses **providers** (e.g. Haircuts) → ZIP + service type → **Search** | Real salons/barbers. |
| **Airfare** | Open **Airfare** → Origin: `JFK`, Destination: `LAX` → **Search** | Flight-related links (organic search), not full price comparison. |

If you see the **same short list every time** (e.g. always “Holiday Inn Express”, “Jiffy Lube”, “Massage Envy”), you’re still on **mock**. Set `USE_MOCK_SERVICE_DATA=false`, add `SERPER_API_KEY`, restart the server, and try again.

---

## 1. Rental Cars

**API:** `GET /services/rental-cars`  
**In app:** Category **Rental Cars** (slug: `rental-cars`) → Pattern B form.

| Field            | Required | Example values                          |
|------------------|----------|------------------------------------------|
| `location`       | Yes      | `LAX`, `Miami`, `New York`, `Denver`     |
| `dates`          | No       | `Dec 1-5 2025`, `2025-03-15 to 2025-03-20` |
| `pickupDate`     | No       | `2025-03-15`                             |
| `returnDate`     | No       | `2025-03-20`                             |
| `carType`        | No       | `economy`, `compact`, `suv`, `luxury`    |

**Example API calls:**

```bash
# Minimal (location only)
curl "http://localhost:3000/services/rental-cars?location=LAX"

# With dates and car type
curl "http://localhost:3000/services/rental-cars?location=Miami&dates=Dec+1-5+2025&carType=suv"

# With pickup/return dates
curl "http://localhost:3000/services/rental-cars?location=New+York&pickupDate=2025-06-01&returnDate=2025-06-05&carType=economy"
```

**In-app test:** Open **Rental Cars** → enter **Pickup Location** (e.g. `LAX`), **Rental Dates** (e.g. `Dec 1-5 2025`), choose **Car Type** (Economy / Compact / SUV / Luxury) → Search. You should see a table of rental companies and prices.

---

## 2. Hotels

**API:** `GET /services/hotels`  
**In app:** Category **Hotels** (slug: `hotels`) → custom Hotels layout (destination, check-in, check-out, guests).

| Field      | Required | Example values                    |
|------------|----------|------------------------------------|
| `location` | Yes      | `Los Angeles`, `Miami Beach`, `New York` |
| `checkIn`  | No       | `2025-01-15`                       |
| `checkOut` | No       | `2025-01-20`                      |
| `guests`   | No       | `1`, `2`, `3`, `4`                |

**Example API calls:**

```bash
# Minimal
curl "http://localhost:3000/services/hotels?location=Los+Angeles"

# Full
curl "http://localhost:3000/services/hotels?location=Miami+Beach&checkIn=2025-02-10&checkOut=2025-02-15&guests=2"
```

**In-app test:** Open **Hotels** → **Destination** (e.g. `Los Angeles`), **Check-in** (e.g. `2025-01-15`), **Check-out** (e.g. `2025-01-20`), **Guests** (e.g. `2`) → Search. You should see hotel results (or mock list: Holiday Inn, Marriott, Hilton, etc.).

---

## 3. Spa

**API:** `GET /services/providers?category=spa&serviceType=<type>&zipCode=<zip>`  
**In app:** Category **Spa Services** (slug: `spa`) → Spa layout with popular services and ZIP.

| Field         | Required | Example values                                      |
|---------------|----------|------------------------------------------------------|
| `category`    | Yes      | `spa`                                               |
| `serviceType` | Yes      | `swedish60`, `deepTissue60`, `facial`, `hotStone`, `couples`, `aromatherapy`, `reflexology`, `prenatal`, `sports`, `thai` |
| `zipCode`     | Yes      | `90210`, `10001`, `33101`                           |

**Example API calls:**

```bash
# 60-min Swedish Massage near Beverly Hills
curl "http://localhost:3000/services/providers?category=spa&serviceType=swedish60&zipCode=90210"

# Deep tissue near NYC
curl "http://localhost:3000/services/providers?category=spa&serviceType=deepTissue60&zipCode=10001"

# Facial
curl "http://localhost:3000/services/providers?category=spa&serviceType=facial&zipCode=33101"
```

**In-app test:** Open **Spa Services** → enter **ZIP Code** (e.g. `90210`) → tap a **Popular Service** (e.g. “60-min Swedish Massage”) or use **Compare Prices**. You should see a list of spas with names and price ranges.

---

## 4. Other service categories (Pattern B – ZIP / options)

Use **ZIP code** plus any category-specific option. Replace `localhost:3000` with your server URL.

| Category          | Slug             | Required      | Optional (query param)   | Example curl |
|-------------------|------------------|---------------|--------------------------|--------------|
| **Gas stations**   | `gas-stations`   | `zipCode`     | `gasType`                | `curl "http://localhost:3000/services/gas-stations?zipCode=90210&gasType=regular"` |
| **Gyms**          | `gym`            | `zipCode`     | `membershipType`         | `curl "http://localhost:3000/services/gyms?zipCode=90210&membershipType=basic"` |
| **Oil changes**   | `oil-changes`    | `zipCode`     | `vehicleType`            | `curl "http://localhost:3000/services/oil-changes?zipCode=90210&vehicleType=sedan"` |
| **Car washes**    | `car-washes`     | `zipCode`     | `washType`               | `curl "http://localhost:3000/services/car-washes?zipCode=90210&washType=basic"` |
| **Storage**       | `storage`        | `zipCode`     | `size`                   | `curl "http://localhost:3000/services/storage?zipCode=90210&size=medium"` |
| **Meal kits**     | `meal-kits`      | `zipCode`     | —                        | `curl "http://localhost:3000/services/meal-kits?zipCode=90210"` |
| **Renters insurance** | `renters-insurance` | `zipCode`  | —                        | `curl "http://localhost:3000/services/renters-insurance?zipCode=90210"` |
| **Car insurance** | `car-insurance`  | `zipCode`     | `vehicleYear`, `vehicleMake`, `vehicleModel` | `curl "http://localhost:3000/services/car-insurance?zipCode=90210&vehicleYear=2020&vehicleMake=Toyota&vehicleModel=RAV4"` |
| **Apartments**    | `apartments`     | `zipCode`     | `serviceType` (e.g. `1br`) | `curl "http://localhost:3000/services/apartments?zipCode=90210&serviceType=1br"` |
| **Moving**        | `moving`         | `zipCode`     | `moveType`               | `curl "http://localhost:3000/services/moving?zipCode=90210&moveType=local"` |
| **Food delivery** | `food-delivery`  | `zipCode`     | `cuisine`                | `curl "http://localhost:3000/services/food-delivery?zipCode=90210&cuisine=italian"` |

**Example values to paste:**

- **ZIP:** `90210`, `10001`, `33101`, `60601`, `75201`
- **gasType:** `regular`, `midgrade`, `premium`, `diesel`
- **membershipType:** `basic`, `premium`, `family`
- **vehicleType:** `sedan`, `suv`, `truck`, `motorcycle`
- **washType:** `basic`, `premium`, `deluxe`
- **size (storage):** `small`, `medium`, `large`, `5x5`, `10x10`

---

## 5. Airfare

**API:** `GET /services/airfare`  
**In app:** Category **Airfare** → Pattern B (origin, destination, dates, passengers).

| Field         | Required | Example values        |
|---------------|----------|------------------------|
| `origin`      | Yes      | `JFK`, `LAX`, `Chicago` |
| `destination` | Yes      | `LAX`, `Miami`, `London` |
| `departDate`  | No       | `2025-03-15`          |
| `returnDate`  | No       | `2025-03-20`          |
| `passengers`  | No       | `1`, `2`, `3`         |

```bash
curl "http://localhost:3000/services/airfare?origin=JFK&destination=LAX&departDate=2025-03-15&returnDate=2025-03-20&passengers=2"
```

---

## 6. Tires

**API:** `GET /services/tires`  
**In app:** Category **Tires** → Tires layout (year, make, model, tire size, ZIP).

| Field      | Required | Example values        |
|------------|----------|------------------------|
| `year`     | Yes      | `2020`, `2022`        |
| `make`     | Yes      | `Toyota`, `Honda`, `Ford` |
| `model`    | Yes      | `RAV4`, `Civic`, `F-150` |
| `zipCode`  | Yes      | `90210`               |
| `tireSize` | No       | `P225/65R17`          |

```bash
curl "http://localhost:3000/services/tires?year=2020&make=Toyota&model=RAV4&zipCode=90210&tireSize=P225/65R17"
```

---

## 7. Haircuts, Nail salons, Massage (Pattern C – providers)

**API:** `GET /services/providers?category=<slug>&serviceType=<type>&zipCode=<zip>`

| Category     | Slug          | Example `serviceType` values                    |
|--------------|---------------|--------------------------------------------------|
| Haircuts     | `haircuts`    | `mens`, `womens`, `kids`                         |
| Nail salons  | `nail-salons` | `manicure`, `pedicure`, `both`                   |
| Massage      | `massage`     | `swedish`, `deep`, `hot` (or same as Spa IDs)   |

```bash
# Haircuts – men's
curl "http://localhost:3000/services/providers?category=haircuts&serviceType=mens&zipCode=90210"

# Nail salon – manicure
curl "http://localhost:3000/services/providers?category=nail-salons&serviceType=manicure&zipCode=90210"

# Massage – Swedish
curl "http://localhost:3000/services/providers?category=massage&serviceType=swedish&zipCode=90210"
```

---

## Quick checklist (in app)

1. **Rental Cars:** Location `LAX` → Dates `Dec 1-5 2025` → Car type **SUV** → Search.  
2. **Hotels:** Destination `Los Angeles` → Check-in `2025-01-15` → Check-out `2025-01-20` → Guests `2` → Search.  
3. **Spa:** ZIP `90210` → tap “60-min Swedish Massage” (or any popular service) → Compare Prices.  
4. **Gas stations:** ZIP `90210` → Gas type **Regular** → Search.  
5. **Oil changes:** ZIP `90210` → Vehicle type **Sedan** → Search.  
6. **Tires:** Year `2020`, Make `Toyota`, Model `RAV4`, ZIP `90210` → Search.

---

## Notes

- If the backend is configured to use **mock data** (or the external API fails), you’ll get mock results so you can still verify the UI and response shape.
- **Rental Cars** and **Hotels** in the app may use a dedicated layout (e.g. Hotels) or the generic Pattern B table; both call the same backend endpoints above.
- For **Spa**, the app sends `serviceType` as the **id** of the popular service (e.g. `swedish60`, `deepTissue60`). The backend mock supports `massage` and `spa` categories with types like `swedish`, `deep`, `hot` and `massage`; the frontend may map these.
