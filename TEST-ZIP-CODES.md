# Test ZIP Codes for Service Categories

## Major US Cities - Best for Testing

### West Coast

**Los Angeles, CA**
- `90210` - Beverly Hills (upscale area, good for premium services)
- `90028` - Hollywood (tourist area, lots of businesses)
- `90024` - Westwood/UCLA (college area, good mix)
- `90036` - Mid-Wilshire (dense business area)
- `90046` - West Hollywood (lots of services)

**San Francisco, CA**
- `94102` - Downtown SF (business district)
- `94110` - Mission District (diverse area)
- `94117` - Castro District (urban area)
- `94109` - Russian Hill (upscale area)

**San Diego, CA**
- `92101` - Downtown San Diego
- `92109` - Pacific Beach (beach area)
- `92111` - Clairemont (residential/commercial mix)

**Seattle, WA**
- `98101` - Downtown Seattle
- `98109` - South Lake Union (tech area)
- `98115` - University District

**Portland, OR**
- `97201` - Downtown Portland
- `97209` - Pearl District (upscale)
- `97214` - Buckman (residential/commercial)

---

### East Coast

**New York, NY**
- `10001` - Midtown Manhattan (lots of businesses)
- `10013` - SoHo (upscale shopping/services)
- `10011` - Chelsea (urban area)
- `10024` - Upper West Side (residential/commercial)
- `10003` - East Village (diverse area)

**Boston, MA**
- `02108` - Downtown Boston
- `02115` - Fenway/Kenmore (college area)
- `02116` - Back Bay (upscale)

**Philadelphia, PA**
- `19102` - Center City
- `19103` - Rittenhouse Square (upscale)
- `19147` - South Philadelphia

**Washington, DC**
- `20001` - Downtown DC
- `20009` - Dupont Circle (urban area)
- `20036` - Foggy Bottom (business district)

**Miami, FL**
- `33139` - South Beach (tourist area)
- `33131` - Downtown Miami
- `33134` - Coconut Grove (upscale)

**Atlanta, GA**
- `30309` - Midtown Atlanta
- `30307` - Virginia-Highland (residential/commercial)
- `30313` - Downtown Atlanta

---

### Midwest

**Chicago, IL**
- `60601` - The Loop (downtown)
- `60614` - Lincoln Park (residential/commercial)
- `60657` - Lakeview (urban area)
- `60611` - Gold Coast (upscale)

**Detroit, MI**
- `48201` - Downtown Detroit
- `48226` - Financial District

**Minneapolis, MN**
- `55401` - Downtown Minneapolis
- `55403` - Uptown (urban area)

**Denver, CO**
- `80202` - Downtown Denver
- `80206` - Capitol Hill (residential/commercial)
- `80211` - Highlands (residential/commercial)

**Dallas, TX**
- `75201` - Downtown Dallas
- `75204` - Oak Lawn (residential/commercial)
- `75205` - Highland Park (upscale)

**Houston, TX**
- `77002` - Downtown Houston
- `77019` - River Oaks (upscale)
- `77006` - Montrose (diverse area)

---

### South

**Nashville, TN**
- `37203` - Downtown Nashville
- `37212` - Music Row (entertainment area)

**Austin, TX**
- `78701` - Downtown Austin
- `78704` - South Austin (residential/commercial)
- `78705` - University of Texas area

**New Orleans, LA**
- `70112` - French Quarter (tourist area)
- `70130` - Central Business District

**Charlotte, NC**
- `28202` - Uptown Charlotte
- `28203` - Dilworth (residential/commercial)

---

## Recommended ZIP Codes for Specific Tests

### Car Washes (Need high car density)
- `90210` - Beverly Hills, CA (luxury cars)
- `10001` - New York, NY (high density)
- `60601` - Chicago, IL (downtown)
- `75201` - Dallas, TX (car culture)
- `33139` - Miami Beach, FL (tourist area)

### Rental Cars (Airports & tourist areas)
- `90028` - Hollywood, CA (tourist area)
- `33139` - Miami Beach, FL (tourist area)
- `10001` - New York, NY (business travelers)
- `94102` - San Francisco, CA (tourist area)
- `70112` - New Orleans, LA (French Quarter)

### Storage Units (Urban areas)
- `10001` - New York, NY (high demand)
- `90024` - Westwood, CA (college area)
- `60601` - Chicago, IL (downtown)
- `78701` - Austin, TX (growing city)
- `30309` - Atlanta, GA (urban area)

### Meal Kits (Urban/suburban mix)
- `10001` - New York, NY (high demand)
- `90024` - Westwood, CA (college area)
- `60614` - Chicago, IL (residential)
- `78704` - Austin, TX (residential)
- `94110` - San Francisco, CA (diverse area)

### Car Insurance (All areas)
- `90210` - Beverly Hills, CA (high-value cars)
- `10001` - New York, NY (high density)
- `60601` - Chicago, IL (urban)
- `75201` - Dallas, TX (car culture)
- `33139` - Miami Beach, FL (high rates)

### Renters Insurance (Urban areas)
- `10001` - New York, NY (high rental market)
- `90024` - Westwood, CA (college area)
- `60614` - Chicago, IL (residential)
- `78704` - Austin, TX (growing rental market)
- `94110` - San Francisco, CA (high rental market)

### Apartments (Urban areas)
- `10001` - New York, NY (high demand)
- `90024` - Westwood, CA (college area)
- `60614` - Chicago, IL (residential)
- `78704` - Austin, TX (growing city)
- `94110` - San Francisco, CA (high demand)

### Moving Companies (All areas)
- `10001` - New York, NY (high demand)
- `90024` - Westwood, CA (college area)
- `60601` - Chicago, IL (urban)
- `78701` - Austin, TX (growing city)
- `30309` - Atlanta, GA (growing city)

### Food Delivery (Urban areas)
- `10001` - New York, NY (high demand)
- `90028` - Hollywood, CA (tourist area)
- `60614` - Chicago, IL (residential)
- `78704` - Austin, TX (foodie city)
- `94110` - San Francisco, CA (diverse cuisine)

---

## Quick Test Commands

### Car Washes
```bash
curl "http://localhost:3000/services/car-washes?zipCode=90210&washType=basic"
curl "http://localhost:3000/services/car-washes?zipCode=10001&washType=premium"
curl "http://localhost:3000/services/car-washes?zipCode=60601&washType=deluxe"
```

### Rental Cars
```bash
curl "http://localhost:3000/services/rental-cars?location=90210"
curl "http://localhost:3000/services/rental-cars?location=New%20York&pickupDate=2026-03-15&returnDate=2026-03-20"
curl "http://localhost:3000/services/rental-cars?location=Miami%20Beach"
```

### Storage Units
```bash
curl "http://localhost:3000/services/storage?zipCode=10001&size=medium"
curl "http://localhost:3000/services/storage?zipCode=90024&size=large"
curl "http://localhost:3000/services/storage?zipCode=60601&size=small"
```

### Meal Kits
```bash
curl "http://localhost:3000/services/meal-kits?zipCode=10001"
curl "http://localhost:3000/services/meal-kits?zipCode=90024"
curl "http://localhost:3000/services/meal-kits?zipCode=78704"
```

### Car Insurance
```bash
curl "http://localhost:3000/services/car-insurance?zipCode=90210&vehicleYear=2020&vehicleMake=Toyota&vehicleModel=RAV4"
curl "http://localhost:3000/services/car-insurance?zipCode=10001&vehicleYear=2019&vehicleMake=Honda&vehicleModel=Civic"
curl "http://localhost:3000/services/car-insurance?zipCode=60601"
```

### Renters Insurance
```bash
curl "http://localhost:3000/services/renters-insurance?zipCode=10001"
curl "http://localhost:3000/services/renters-insurance?zipCode=90024"
curl "http://localhost:3000/services/renters-insurance?zipCode=94110"
```

### Apartments
```bash
curl "http://localhost:3000/services/apartments?zipCode=10001&serviceType=1br"
curl "http://localhost:3000/services/apartments?zipCode=90024&serviceType=studio"
curl "http://localhost:3000/services/apartments?zipCode=78704&serviceType=2br"
```

### Moving Companies
```bash
curl "http://localhost:3000/services/moving?zipCode=10001&moveType=local"
curl "http://localhost:3000/services/moving?zipCode=90024&moveType=long-distance"
curl "http://localhost:3000/services/moving?zipCode=60601"
```

### Food Delivery
```bash
curl "http://localhost:3000/services/food-delivery?zipCode=10001&cuisine=italian"
curl "http://localhost:3000/services/food-delivery?zipCode=90028&cuisine=chinese"
curl "http://localhost:3000/services/food-delivery?zipCode=78704&cuisine=mexican"
```

---

## Top 10 ZIP Codes for General Testing

1. **`90210`** - Beverly Hills, CA (upscale, lots of services)
2. **`10001`** - New York, NY (high density, everything available)
3. **`60601`** - Chicago, IL (downtown, good mix)
4. **`90028`** - Hollywood, CA (tourist area, lots of businesses)
5. **`33139`** - Miami Beach, FL (tourist area, high demand)
6. **`75201`** - Dallas, TX (car culture, growing city)
7. **`78704`** - Austin, TX (growing city, foodie area)
8. **`94110`** - San Francisco, CA (diverse, high demand)
9. **`30309`** - Atlanta, GA (growing city, good mix)
10. **`60614`** - Chicago, IL (residential/commercial mix)

---

## Notes

- **Urban ZIP codes** (like 10001, 60601) will have more results
- **Tourist areas** (like 90210, 33139) are great for rental cars and hotels
- **College areas** (like 90024, 78704) are good for apartments and meal kits
- **Upscale areas** (like 90210, 10013) may have higher prices
- **All ZIP codes** should work for insurance and moving companies
