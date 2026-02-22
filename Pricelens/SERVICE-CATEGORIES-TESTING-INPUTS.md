# Service Categories – What to Enter in the Frontend

Use this when testing **Rental Cars** and other service categories. Each category has a form; below is exactly what to fill in so the "Compare" / "Search" action can run.

---

## Rental Cars

**Path:** Open **Rental Cars** from the category pills, or go to `/category/rental-cars`.

| Field | What to enter |
|-------|----------------|
| **Pickup Location** | City or airport code, e.g. `LAX`, `Los Angeles`, `New York` |
| **Rental Dates** | Date range as text, e.g. `Dec 1–5, 2025` or `12/01/2025 - 12/05/2025` |
| **Car Type** | Choose one: Economy, Compact, SUV, Luxury |

**Example:** Pickup: `LAX`, Dates: `Dec 1–5, 2025`, Car Type: `SUV`.

---

## Other Pattern B Service Categories

### Gas Stations
- **ZIP Code:** e.g. `90210`
- **Gas Type:** Regular (87), Mid-Grade (89), Premium (91+), or Diesel

### Gym
- **ZIP Code:** e.g. `90210`
- **Membership Type:** Basic, Premium, or Family

### Oil Changes
- **ZIP Code:** e.g. `90210`
- **Vehicle Type:** Sedan, SUV, Truck, or Luxury

### Car Washes
- **ZIP Code:** e.g. `90210`
- **Service Type:** Basic Wash, Deluxe Wash, or Full Service

### Tires
- **Year:** e.g. `2020`
- **Make:** e.g. `Toyota`
- **Model:** e.g. `RAV4`
- **Tire Size (Optional):** e.g. `P225/65R17`
- **Zip Code:** e.g. `90210`

### Mattresses
- **ZIP Code:** e.g. `90210`
- **Mattress Size:** Twin, Full, Queen, or King

### Hotels
- **Location:** City or address, e.g. `Las Vegas` or `123 Main St, Miami`
- **Check-in Date:** e.g. `12/15/2025`
- **Check-out Date:** e.g. `12/18/2025`
- **Guests:** 1, 2, 3, or 4+ Guests

### Airfare
- **Origin:** Departure city or airport, e.g. `LAX` or `New York`
- **Destination:** Arrival city or airport, e.g. `MIA` or `Miami`
- **Departure Date:** e.g. `12/20/2025`
- **Return Date:** e.g. `12/27/2025` (optional)
- **Passengers:** 1, 2, 3, or 4+ Passengers

### Storage
- **ZIP Code:** e.g. `90210`
- **Unit Size:** 5x5, 5x10, 10x10, 10x20, or 10x30

### Meal Kits
- **ZIP Code:** e.g. `90210`
- **Meal Type:** Vegetarian, Meat & Fish, Vegan, or Family-Friendly

### Moving
- **Distance (miles):** e.g. `50`
- **Home Size:** Studio, 1–4 Bedroom, or Small/Medium/Large House
- **From ZIP:** e.g. `90210`
- **To ZIP:** e.g. `10001`

### Nail Salons
- **ZIP Code:** e.g. `90210`
- **Service Type:** Manicure, Pedicure, Manicure + Pedicure, Gel Manicure, or Acrylic Nails
- **Duration:** 30, 45, 60, or 90 minutes

### Car Insurance
- Vehicle: **Year** (e.g. `2020`), **Make**, **Model**, **Trim**
- Location & driver: **Zip Code**, **Age**, **Years Driving**, **Accidents/Tickets**
- Usage: **Ownership Status**, **Daily Usage**, **Annual Miles**, **Coverage Level**

### Renters Insurance
- **ZIP Code**, **Personal Property Value**, **Deductible**, **Liability Coverage**
- **Residence Type**, **Security System?**, **Fire Sprinklers?**, **Do You Have Pets?**

---

## Pattern C (e.g. Haircuts, Massage, Spa, Services)

These use **Pattern C** or custom layouts; typical inputs:

- **Haircuts / Massage / Spa / Services:** ZIP code plus service type (or description) where the form offers them.
- **Massage:** ZIP, Massage Type (e.g. Swedish, Deep Tissue), Duration (e.g. 60 min).
- **Spa:** ZIP, service description or popular service buttons.
- **Food Delivery:** Restaurant name, ZIP, and order items (name + price).
- **Apartments:** City, Lease or Buy, unit size, budget, dates, pets, features.

---

## Quick reference: category slug → URL

- Rental Cars: `/category/rental-cars`
- Gas Stations: `/category/gas-stations`
- Gym: `/category/gym`
- Oil Changes: `/category/oil-changes`
- Hotels: `/category/hotels`
- Airfare: `/category/airfare`
- Tires: `/category/tires`
- Storage: `/category/storage`
- Meal Kits: `/category/meal-kits`
- Moving: `/category/moving`
- Nail Salons: `/category/nail-salons`
- Car Insurance: `/category/car-insurance`
- Renters Insurance: `/category/renters-insurance`

Fill the fields above, then tap the main action button (e.g. **Compare Prices** or **Search**) to trigger the API and see results.
