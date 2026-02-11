# Service Categories Test Results

## Overview

This document lists all service categories available in PriceLens and their test results.

---

## Service Categories by Name

### Pattern B: Location-Based Services

These services require location-based queries (ZIP code or city):

1. **Gas Stations** (`gas-stations`)
   - **Types Available**: Regular, Midgrade, Premium, Diesel
   - **Endpoint**: `/services/gas-stations?zipCode={zip}&gasType={type}`
   - **Status**: ⚠️ Needs testing (500 error)

2. **Hotels** (`hotels`)
   - **Types Available**: Standard hotel search with optional dates
   - **Endpoint**: `/services/hotels?location={city}&checkIn={date}&checkOut={date}&guests={num}`
   - **Status**: ⚠️ Needs testing (500 error)

3. **Gyms** (`gyms`)
   - **Types Available**: Basic, Premium, Elite memberships
   - **Endpoint**: `/services/gyms?zipCode={zip}&membershipType={type}`
   - **Status**: ⚠️ Needs testing (500 error)

4. **Airfare** (`airfare`)
   - **Types Available**: One-way, Round trip flights
   - **Endpoint**: `/services/airfare?origin={city}&destination={city}&departDate={date}&returnDate={date}&passengers={num}`
   - **Status**: ✅ **WORKING**
   - **Test Results**:
     - LAX → JFK: Found 10 results, Price range: $267 - $539 (Avg: $406)
     - Miami → Chicago: Found 10 results, Price range: $254 - $523 (Avg: $373)

5. **Oil Changes** (`oil-changes`)
   - **Types Available**: Car, SUV, Truck, Motorcycle
   - **Endpoint**: `/services/oil-changes?zipCode={zip}&vehicleType={type}`
   - **Status**: ⚠️ Needs testing (500 error)

6. **Tires** (`tires`)
   - **Types Available**: Based on vehicle (year, make, model)
   - **Endpoint**: `/services/tires?year={year}&make={make}&model={model}&zipCode={zip}`
   - **Status**: ⚠️ Needs testing (500 error)

7. **Car Washes** (`car-washes`)
   - **Status**: ⚠️ Not implemented in controller yet

8. **Rental Cars** (`rental-cars`)
   - **Status**: ⚠️ Not implemented in controller yet

9. **Storage Units** (`storage`)
   - **Status**: ⚠️ Not implemented in controller yet

10. **Meal Kits** (`meal-kits`)
    - **Status**: ⚠️ Not implemented in controller yet

11. **Car Insurance** (`car-insurance`)
    - **Status**: ⚠️ Not implemented in controller yet

12. **Renters Insurance** (`renters-insurance`)
    - **Status**: ⚠️ Not implemented in controller yet

---

### Pattern C: Service Providers

These services show listings of local businesses:

1. **Haircuts & Salons** (`haircuts`)
   - **Service Types**:
     - Men's Haircut (`mens`) - Estimated: $15-30
     - Women's Haircut (`womens`) - Estimated: $30-80
     - Kids' Haircut (`kids`) - Estimated: $15-25
   - **Endpoint**: `/services/providers?category=haircuts&serviceType={type}&zipCode={zip}`
   - **Status**: ⚠️ Needs testing (500 error)

2. **Massage Parlors** (`massage`)
   - **Service Types**:
     - Swedish Massage (`swedish`) - Estimated: $60-100
     - Deep Tissue (`deep`) - Estimated: $80-120
     - Hot Stone (`hot`) - Estimated: $100-150
   - **Endpoint**: `/services/providers?category=massage&serviceType={type}&zipCode={zip}`
   - **Status**: ⚠️ Needs testing (500 error)

3. **Nail Salons** (`nail-salons`)
   - **Service Types**:
     - Manicure (`manicure`) - Estimated: $20-40
     - Pedicure (`pedicure`) - Estimated: $30-50
     - Both (`both`) - Estimated: $45-80
   - **Endpoint**: `/services/providers?category=nail-salons&serviceType={type}&zipCode={zip}`
   - **Status**: ⚠️ Needs testing (500 error)

4. **Spa Services** (`spa`)
   - **Service Types**: Various spa treatments
   - **Endpoint**: `/services/providers?category=spa&serviceType={type}&zipCode={zip}`
   - **Status**: ⚠️ Needs testing (500 error)

5. **Apartments** (`apartments`)
   - **Service Types**: Studio, 1BR, 2BR, etc.
   - **Status**: ⚠️ Not fully implemented

6. **Moving Companies** (`moving`)
   - **Status**: ⚠️ Not fully implemented

7. **Food Delivery** (`food-delivery`)
   - **Status**: ⚠️ Not fully implemented

8. **Services** (`services`)
   - **Status**: ⚠️ Generic category, needs definition

---

## Test Summary

### ✅ Working Categories (1)
- **Airfare**: Successfully returns flight prices and providers

### ⚠️ Categories Needing Fix (20)
Most categories are returning 500 errors, likely due to:
- Missing API keys (SERPER_API_KEY or SERPAPI_KEY)
- Backend service not properly configured
- Missing environment variables

### 📋 Categories Not Implemented (8)
These categories are defined but don't have controller endpoints yet:
- Car Washes
- Rental Cars
- Storage Units
- Meal Kits
- Car Insurance
- Renters Insurance
- Apartments (partial)
- Moving Companies (partial)
- Food Delivery (partial)

---

## Next Steps

1. **Check Server Logs**: Review backend logs to see actual error messages for 500 errors
2. **Verify API Keys**: Ensure SERPER_API_KEY or SERPAPI_KEY is set in `.env`
3. **Test Individual Endpoints**: Use curl or Postman to test endpoints individually
4. **Implement Missing Categories**: Add controller endpoints for unimplemented categories

---

## Example Working Request

**Airfare Search:**
```bash
curl "http://localhost:3000/services/airfare?origin=LAX&destination=JFK"
```

**Response:** Returns 10 flight options with prices ranging from $267-$539

---

## Service Types Reference

### Haircuts
- `mens` - Men's haircut
- `womens` - Women's haircut  
- `kids` - Kids' haircut

### Massage
- `swedish` - Swedish massage
- `deep` - Deep tissue massage
- `hot` - Hot stone massage

### Nail Salons
- `manicure` - Manicure service
- `pedicure` - Pedicure service
- `both` - Manicure + Pedicure combo

### Gas Stations
- `regular` - Regular unleaded
- `midgrade` - Mid-grade fuel
- `premium` - Premium fuel
- `diesel` - Diesel fuel

### Oil Changes
- `car` - Standard car
- `suv` - SUV
- `truck` - Truck
- `motorcycle` - Motorcycle

### Gyms
- `basic` - Basic membership
- `premium` - Premium membership
- `elite` - Elite membership
