# Service Categories Summary

## Complete List of Service Categories

This document lists all service categories available in PriceLens, organized by pattern type.

---

## 📊 Pattern B: Location-Based Services (Direct Comparison Table)

These services show a comparison table of prices across different locations/stores.

### 1. **Gas Stations** (`gas-stations`)
- **Endpoint**: `/services/gas-stations?zipCode={zip}&gasType={type}`
- **Service Types**:
  - `regular` - Regular unleaded gasoline
  - `midgrade` - Mid-grade fuel
  - `premium` - Premium fuel
  - `diesel` - Diesel fuel
- **Required Parameters**: `zipCode` (5-digit US ZIP)
- **Optional Parameters**: `gasType` (default: regular)
- **Returns**: List of gas stations with prices, addresses, distances, ratings
- **Status**: ⚠️ Needs API key (SERPER_API_KEY or SERPAPI_KEY)

### 2. **Hotels** (`hotels`)
- **Endpoint**: `/services/hotels?location={city}&checkIn={date}&checkOut={date}&guests={num}`
- **Service Types**: Standard hotel search
- **Required Parameters**: `location` (city name or ZIP code)
- **Optional Parameters**: 
  - `checkIn` - Check-in date (YYYY-MM-DD)
  - `checkOut` - Check-out date (YYYY-MM-DD)
  - `guests` - Number of guests (default: 2)
- **Returns**: List of hotels with prices per night, ratings, amenities
- **Status**: ⚠️ Needs API key

### 3. **Gyms** (`gyms`)
- **Endpoint**: `/services/gyms?zipCode={zip}&membershipType={type}`
- **Service Types**:
  - `basic` - Basic membership
  - `premium` - Premium membership
  - `elite` - Elite membership
- **Required Parameters**: `zipCode` (5-digit US ZIP)
- **Optional Parameters**: `membershipType` (default: all types)
- **Returns**: List of gyms with membership prices, addresses, ratings
- **Status**: ⚠️ Needs API key

### 4. **Airfare** (`airfare`) ✅ **WORKING**
- **Endpoint**: `/services/airfare?origin={city}&destination={city}&departDate={date}&returnDate={date}&passengers={num}`
- **Service Types**:
  - One-way flights
  - Round trip flights
- **Required Parameters**: 
  - `origin` - Departure city or airport code (e.g., "LAX" or "Los Angeles")
  - `destination` - Arrival city or airport code (e.g., "JFK" or "New York")
- **Optional Parameters**: 
  - `departDate` - Departure date (YYYY-MM-DD)
  - `returnDate` - Return date for round trip (YYYY-MM-DD)
  - `passengers` - Number of passengers (default: 1)
- **Returns**: List of flights with prices, airlines, times, durations
- **Status**: ✅ **WORKING** - Successfully tested
- **Test Results**:
  - LAX → JFK: Found 10 results, Price range: $267 - $539 (Avg: $406)
  - Miami → Chicago: Found 10 results, Price range: $254 - $523 (Avg: $373)

### 5. **Oil Changes** (`oil-changes`)
- **Endpoint**: `/services/oil-changes?zipCode={zip}&vehicleType={type}`
- **Service Types**:
  - `car` - Standard car (default)
  - `suv` - SUV
  - `truck` - Truck
  - `motorcycle` - Motorcycle
- **Required Parameters**: `zipCode` (5-digit US ZIP)
- **Optional Parameters**: `vehicleType` (default: car)
- **Returns**: List of oil change shops with prices, addresses, ratings
- **Status**: ⚠️ Needs API key

### 6. **Tires** (`tires`)
- **Endpoint**: `/services/tires?year={year}&make={make}&model={model}&zipCode={zip}&tireSize={size}`
- **Service Types**: Based on vehicle specifications
- **Required Parameters**: 
  - `year` - Vehicle year (e.g., "2020")
  - `make` - Vehicle make (e.g., "Toyota")
  - `model` - Vehicle model (e.g., "RAV4")
  - `zipCode` - 5-digit US ZIP
- **Optional Parameters**: `tireSize` (e.g., "P225/65R17")
- **Returns**: List of tire shops with prices, addresses, ratings
- **Status**: ⚠️ Needs API key

### 7. **Car Washes** (`car-washes`)
- **Endpoint**: `/services/car-washes?zipCode={zip}&washType={type}`
- **Service Types**:
  - `basic` - Basic wash (default)
  - `deluxe` - Deluxe wash
  - `premium` - Premium wash
  - `full` - Full service wash
- **Required Parameters**: `zipCode` (5-digit US ZIP)
- **Optional Parameters**: `washType` (default: basic)
- **Returns**: List of car washes with prices, addresses, ratings
- **Status**: ✅ Implemented

### 8. **Rental Cars** (`rental-cars`)
- **Endpoint**: `/services/rental-cars?location={city}&pickupDate={date}&returnDate={date}`
- **Required Parameters**: `location` (city name or ZIP code)
- **Optional Parameters**: 
  - `pickupDate` - Pickup date (YYYY-MM-DD)
  - `returnDate` - Return date (YYYY-MM-DD)
- **Returns**: List of rental car companies with prices, addresses, ratings
- **Status**: ✅ Implemented

### 9. **Storage Units** (`storage`)
- **Endpoint**: `/services/storage?zipCode={zip}&size={size}`
- **Service Types**:
  - `small` - Small storage unit
  - `medium` - Medium storage unit (default)
  - `large` - Large storage unit
  - `extra-large` - Extra large storage unit
- **Required Parameters**: `zipCode` (5-digit US ZIP)
- **Optional Parameters**: `size` (default: medium)
- **Returns**: List of storage facilities with prices, addresses, ratings
- **Status**: ✅ Implemented

### 10. **Meal Kits** (`meal-kits`)
- **Endpoint**: `/services/meal-kits?zipCode={zip}`
- **Required Parameters**: `zipCode` (5-digit US ZIP)
- **Returns**: List of meal kit companies with prices, ratings
- **Status**: ✅ Implemented

### 11. **Car Insurance** (`car-insurance`)
- **Endpoint**: `/services/car-insurance?zipCode={zip}&vehicleYear={year}&vehicleMake={make}&vehicleModel={model}`
- **Required Parameters**: `zipCode` (5-digit US ZIP)
- **Optional Parameters**: 
  - `vehicleYear` - Vehicle year
  - `vehicleMake` - Vehicle make
  - `vehicleModel` - Vehicle model
- **Returns**: List of insurance companies with prices, addresses, ratings
- **Status**: ✅ Implemented

### 12. **Renters Insurance** (`renters-insurance`)
- **Endpoint**: `/services/renters-insurance?zipCode={zip}`
- **Required Parameters**: `zipCode` (5-digit US ZIP)
- **Returns**: List of insurance companies with prices, addresses, ratings
- **Status**: ✅ Implemented

---

## 📋 Pattern C: Service Providers (Business Listings)

These services show listings of local businesses with their service offerings.

### 1. **Haircuts & Salons** (`haircuts`)
- **Endpoint**: `/services/providers?category=haircuts&serviceType={type}&zipCode={zip}`
- **Service Types**:
  - `mens` - Men's Haircut (Estimated: $15-30)
  - `womens` - Women's Haircut (Estimated: $30-80)
  - `kids` - Kids' Haircut (Estimated: $15-25)
- **Required Parameters**: 
  - `category` = "haircuts"
  - `serviceType` - One of: mens, womens, kids
  - `zipCode` - 5-digit US ZIP
- **Returns**: List of salons/barbershops with prices, addresses, ratings, hours
- **Status**: ⚠️ Needs API key

### 2. **Massage Parlors** (`massage`)
- **Endpoint**: `/services/providers?category=massage&serviceType={type}&zipCode={zip}`
- **Service Types**:
  - `swedish` - Swedish Massage (Estimated: $60-100)
  - `deep` - Deep Tissue Massage (Estimated: $80-120)
  - `hot` - Hot Stone Massage (Estimated: $100-150)
- **Required Parameters**: 
  - `category` = "massage"
  - `serviceType` - One of: swedish, deep, hot
  - `zipCode` - 5-digit US ZIP
- **Returns**: List of massage therapists/spas with prices, addresses, ratings
- **Status**: ⚠️ Needs API key

### 3. **Nail Salons** (`nail-salons`)
- **Endpoint**: `/services/providers?category=nail-salons&serviceType={type}&zipCode={zip}`
- **Service Types**:
  - `manicure` - Manicure (Estimated: $20-40)
  - `pedicure` - Pedicure (Estimated: $30-50)
  - `both` - Manicure + Pedicure Combo (Estimated: $45-80)
- **Required Parameters**: 
  - `category` = "nail-salons"
  - `serviceType` - One of: manicure, pedicure, both
  - `zipCode` - 5-digit US ZIP
- **Returns**: List of nail salons with prices, addresses, ratings, hours
- **Status**: ⚠️ Needs API key

### 4. **Spa Services** (`spa`)
- **Endpoint**: `/services/providers?category=spa&serviceType={type}&zipCode={zip}`
- **Service Types**: Various spa treatments
- **Required Parameters**: 
  - `category` = "spa"
  - `serviceType` - Type of spa service
  - `zipCode` - 5-digit US ZIP
- **Returns**: List of spas with service prices, addresses, ratings
- **Status**: ⚠️ Needs API key

### 5. **Apartments** (`apartments`)
- **Endpoint**: `/services/apartments?zipCode={zip}&serviceType={type}` or `/services/providers?category=apartments&serviceType={type}&zipCode={zip}`
- **Service Types**:
  - `studio` - Studio apartment
  - `1br` - 1 bedroom (default)
  - `2br` - 2 bedroom
  - `3br` - 3 bedroom
- **Required Parameters**: `zipCode` (5-digit US ZIP)
- **Optional Parameters**: `serviceType` (default: 1br)
- **Returns**: List of apartments with prices, addresses, ratings
- **Status**: ✅ Implemented

### 6. **Moving Companies** (`moving`)
- **Endpoint**: `/services/moving?zipCode={zip}&moveType={type}` or `/services/providers?category=moving&serviceType={type}&zipCode={zip}`
- **Service Types**:
  - `local` - Local move (default)
  - `long-distance` - Long distance move
- **Required Parameters**: `zipCode` (5-digit US ZIP)
- **Optional Parameters**: `moveType` (default: local)
- **Returns**: List of moving companies with prices, addresses, ratings
- **Status**: ✅ Implemented

### 7. **Food Delivery** (`food-delivery`)
- **Endpoint**: `/services/food-delivery?zipCode={zip}&cuisine={cuisine}` or `/services/providers?category=food-delivery&serviceType={cuisine}&zipCode={zip}`
- **Required Parameters**: `zipCode` (5-digit US ZIP)
- **Optional Parameters**: `cuisine` (e.g., italian, chinese, mexican)
- **Returns**: List of food delivery services with prices, ratings
- **Status**: ✅ Implemented

### 8. **Services** (`services`)
- **Status**: ⚠️ Generic category, needs definition

---

## 🔑 Required Configuration

All service categories require one of these API keys in `server/.env`:

```env
# Option 1: Serper.dev (recommended)
SERPER_API_KEY=your_serper_api_key_here

# Option 2: SerpAPI (alternative)
SERPAPI_KEY=your_serpapi_key_here
```

**Note**: The system will use `SERPER_API_KEY` if available, otherwise falls back to `SERPAPI_KEY`.

---

## 📈 Test Results Summary

### ✅ Working (1 category)
- **Airfare**: Successfully returns flight prices and providers

### ⚠️ Needs API Key (11 categories)
Most categories return 500 errors when API keys are missing:
- Gas Stations
- Hotels
- Gyms
- Oil Changes
- Tires
- Haircuts
- Massage
- Nail Salons
- Spa Services
- (And others)

### ✅ Fully Implemented (All categories)
All service categories now have functional controller endpoints:
- ✅ Car Washes
- ✅ Rental Cars
- ✅ Storage Units
- ✅ Meal Kits
- ✅ Car Insurance
- ✅ Renters Insurance
- ✅ Apartments
- ✅ Moving Companies
- ✅ Food Delivery

---

## 🧪 Testing

To test service categories, use the comprehensive test script:

```bash
cd server
npx ts-node test-all-services-comprehensive.ts
```

Or test individual endpoints:

```bash
# Airfare (working)
curl "http://localhost:3000/services/airfare?origin=LAX&destination=JFK"

# Gas Stations (needs API key)
curl "http://localhost:3000/services/gas-stations?zipCode=90210&gasType=regular"

# Haircuts (needs API key)
curl "http://localhost:3000/services/providers?category=haircuts&serviceType=mens&zipCode=90210"
```

---

## 📝 Notes

1. **Price Estimates**: Some categories show estimated price ranges when exact prices aren't available from the API
2. **Location Required**: All service categories require a location (ZIP code or city)
3. **Caching**: Results are cached for 24 hours to reduce API calls
4. **Rate Limiting**: Be mindful of API rate limits when testing
