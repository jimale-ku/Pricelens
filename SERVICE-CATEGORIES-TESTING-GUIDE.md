# Service Categories Testing Guide

This guide shows you how to test Pattern B service categories (location-based services) like gas stations, hotels, gyms, and airfare.

## Overview

Service categories use different endpoints than product categories:
- **Pattern A (Products)**: `/products/popular?categorySlug=groceries`
- **Pattern B (Services)**: `/services/{category}?zipCode=90210&...`

## Available Service Categories

1. **Gas Stations** - `/services/gas-stations`
2. **Hotels** - `/services/hotels`
3. **Gyms** - `/services/gyms`
4. **Airfare** - `/services/airfare`
5. **Oil Changes** - `/services/oil-changes`

---

## 1. Gas Stations

### Endpoint
```
GET /services/gas-stations?zipCode={zipCode}&gasType={type}
```

### Parameters
- `zipCode` (required): 5-digit US ZIP code
- `gasType` (optional): `regular`, `midgrade`, `premium`, or `diesel` (default: `regular`)

### Example Requests

**Basic request (regular gas):**
```bash
curl "http://localhost:3000/services/gas-stations?zipCode=90210"
```

**Premium gas:**
```bash
curl "http://localhost:3000/services/gas-stations?zipCode=90210&gasType=premium"
```

**Diesel:**
```bash
curl "http://localhost:3000/services/gas-stations?zipCode=10001&gasType=diesel"
```

### Expected Response Format
```json
[
  {
    "name": "Shell",
    "address": "123 Main St, Beverly Hills, CA 90210",
    "distance": "0.5 miles",
    "price": "~$4.25",
    "rating": 4.5,
    "reviews": 120
  }
]
```

### Test ZIP Codes
- `90210` - Beverly Hills, CA
- `10001` - New York, NY
- `33139` - Miami Beach, FL
- `60601` - Chicago, IL
- `75201` - Dallas, TX

---

## 2. Hotels

### Endpoint
```
GET /services/hotels?location={location}&checkIn={date}&checkOut={date}&guests={number}
```

### Parameters
- `location` (required): City name or ZIP code (e.g., "New York" or "10001")
- `checkIn` (optional): Check-in date in YYYY-MM-DD format
- `checkOut` (optional): Check-out date in YYYY-MM-DD format
- `guests` (optional): Number of guests (default: 2)

### Example Requests

**Basic hotel search:**
```bash
curl "http://localhost:3000/services/hotels?location=New%20York"
```

**With dates:**
```bash
curl "http://localhost:3000/services/hotels?location=Los%20Angeles&checkIn=2026-03-15&checkOut=2026-03-18&guests=2"
```

**Using ZIP code:**
```bash
curl "http://localhost:3000/services/hotels?location=90210&checkIn=2026-04-01&checkOut=2026-04-03"
```

### Expected Response Format
```json
[
  {
    "name": "The Ritz-Carlton",
    "address": "123 Central Park South, New York, NY 10019",
    "price": "$299/night",
    "rating": 4.8,
    "reviews": 2500,
    "amenities": ["WiFi", "Pool", "Gym"]
  }
]
```

### Test Locations
- `New York` or `10001`
- `Los Angeles` or `90210`
- `Miami` or `33139`
- `Chicago` or `60601`
- `Las Vegas` or `89101`

---

## 3. Gyms

### Endpoint
```
GET /services/gyms?zipCode={zipCode}&membershipType={type}
```

### Parameters
- `zipCode` (required): 5-digit US ZIP code
- `membershipType` (optional): `basic`, `premium`, `elite` (default: all types)

### Example Requests

**Basic gym search:**
```bash
curl "http://localhost:3000/services/gyms?zipCode=90210"
```

**Premium memberships only:**
```bash
curl "http://localhost:3000/services/gyms?zipCode=10001&membershipType=premium"
```

### Expected Response Format
```json
[
  {
    "name": "Equinox",
    "address": "123 Rodeo Drive, Beverly Hills, CA 90210",
    "distance": "0.3 miles",
    "price": "$200/month",
    "rating": 4.7,
    "reviews": 450
  }
]
```

---

## 4. Airfare

### Endpoint
```
GET /services/airfare?origin={origin}&destination={destination}&departDate={date}&returnDate={date}&passengers={number}
```

### Parameters
- `origin` (required): Airport code or city (e.g., "LAX" or "Los Angeles")
- `destination` (required): Airport code or city (e.g., "JFK" or "New York")
- `departDate` (optional): Departure date in YYYY-MM-DD format
- `returnDate` (optional): Return date in YYYY-MM-DD format (for round trip)
- `passengers` (optional): Number of passengers (default: 1)

### Example Requests

**One-way flight:**
```bash
curl "http://localhost:3000/services/airfare?origin=LAX&destination=JFK&departDate=2026-03-15"
```

**Round trip:**
```bash
curl "http://localhost:3000/services/airfare?origin=Los%20Angeles&destination=New%20York&departDate=2026-04-01&returnDate=2026-04-08&passengers=2"
```

**Using city names:**
```bash
curl "http://localhost:3000/services/airfare?origin=Miami&destination=Chicago&departDate=2026-05-01"
```

### Expected Response Format
```json
[
  {
    "airline": "American Airlines",
    "flightNumber": "AA123",
    "departure": "2026-03-15T08:00:00",
    "arrival": "2026-03-15T14:30:00",
    "price": "$299",
    "stops": 0,
    "duration": "6h 30m"
  }
]
```

### Test Routes
- `LAX` → `JFK` (Los Angeles to New York)
- `MIA` → `ORD` (Miami to Chicago)
- `SFO` → `LAX` (San Francisco to Los Angeles)
- `DFW` → `DEN` (Dallas to Denver)

---

## 5. Oil Changes

### Endpoint
```
GET /services/oil-changes?zipCode={zipCode}&vehicleType={type}
```

### Parameters
- `zipCode` (required): 5-digit US ZIP code
- `vehicleType` (optional): `car`, `truck`, `suv`, `motorcycle` (default: `car`)

### Example Requests

**Basic oil change:**
```bash
curl "http://localhost:3000/services/oil-changes?zipCode=90210"
```

**SUV oil change:**
```bash
curl "http://localhost:3000/services/oil-changes?zipCode=10001&vehicleType=suv"
```

### Expected Response Format
```json
[
  {
    "name": "Jiffy Lube",
    "address": "123 Main St, Beverly Hills, CA 90210",
    "distance": "0.8 miles",
    "price": "$29.99",
    "rating": 4.2,
    "reviews": 180
  }
]
```

---

## Testing in Browser

You can test these endpoints directly in your browser:

1. **Gas Stations:**
   ```
   http://localhost:3000/services/gas-stations?zipCode=90210
   ```

2. **Hotels:**
   ```
   http://localhost:3000/services/hotels?location=New%20York
   ```

3. **Gyms:**
   ```
   http://localhost:3000/services/gyms?zipCode=90210
   ```

4. **Airfare:**
   ```
   http://localhost:3000/services/airfare?origin=LAX&destination=JFK&departDate=2026-03-15
   ```

5. **Oil Changes:**
   ```
   http://localhost:3000/services/oil-changes?zipCode=90210
   ```

---

## Testing in Postman/Thunder Client

### Collection Setup

1. **Base URL:** `http://localhost:3000`

2. **Gas Stations Request:**
   - Method: `GET`
   - URL: `/services/gas-stations`
   - Query Params:
     - `zipCode`: `90210`
     - `gasType`: `regular` (optional)

3. **Hotels Request:**
   - Method: `GET`
   - URL: `/services/hotels`
   - Query Params:
     - `location`: `New York`
     - `checkIn`: `2026-03-15` (optional)
     - `checkOut`: `2026-03-18` (optional)
     - `guests`: `2` (optional)

---

## Common Issues

### 1. "Cannot connect to server"
- Ensure backend is running: `cd server && npm run start:dev`
- Check that port 3000 is not blocked by firewall

### 2. "No results found"
- Verify ZIP code is valid (5 digits)
- Check that SerpAPI key is set in `.env`
- Try a different ZIP code or location

### 3. "Invalid date format"
- Use YYYY-MM-DD format (e.g., `2026-03-15`)
- Ensure dates are in the future

---

## Notes

- All service endpoints require a valid SerpAPI key (`SERPAPI_KEY` in `.env`)
- Results are cached for 24 hours to reduce API calls
- ZIP codes must be valid US ZIP codes (5 digits)
- Dates should be in the future (past dates may return no results)
