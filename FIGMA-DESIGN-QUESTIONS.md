# Questions to Ask Your AI (Figma Design Builder)

## 🎯 Purpose
This document contains specific questions to ask your AI that built the Figma design. These questions will help you understand how each service category should be implemented in your PriceLens app.

---

## 📋 **Questions to Ask About Each Service Category**

### **Pattern B Categories (Location-based Services with Tables)**

Ask your AI these questions for each category:

#### **1. Hotels**
```
For the "Hotels" category in the Figma design:

⚠️ IMPORTANT: Current implementation uses CARD-BASED layout, but codebase expects TABLE format (Pattern B).
Please clarify which layout your Figma design shows.

CURRENT IMPLEMENTATION (Card-Based):
- Input Fields: Destination, Check-in Date, Check-out Date, Number of Guests
- Results: Cards showing booking sites, prices, hotel info
- NO ZIP code field currently

QUESTIONS FOR YOUR AI:

1. What layout does the Figma design show?
   - [ ] Table format (rows and columns) - Pattern B
   - [ ] Card format (booking site cards) - Pattern C or custom
   - [ ] Mixed format (table with expandable cards)

2. What input fields are shown in the search form?
   - ZIP code? (Currently NOT included - should it be?)
   - Destination/Location? (Currently: "City or Hotel Name")
   - Check-in Date? (Currently: date picker)
   - Check-out Date? (Currently: date picker)
   - Number of Guests? (Currently: number input)

3. If TABLE format (Pattern B), what columns are shown?
   - Rank, Hotel Name, Address, Price/Night, Rating, Distance?
   - Or different columns?

4. If CARD format, what information is displayed per card?
   - Booking site logo and name?
   - Price per night and total price?
   - "Best Price" badge?
   - "Book Now" and "Save" buttons?
   - Hotel image, name, location, star rating?

5. How is the search form laid out?
   - 2x2 grid? Single column? Other layout?
   - Are dates in a date picker or text input?
   - Is location a text input, dropdown, or autocomplete?

6. What's the exact placeholder text for each field?
   - Destination: "City or Hotel Name" (current) or different?
   - Other fields?

7. Should ZIP code be added as a search field?
   - If yes, where in the form? What placeholder text?
```

#### **2. Airfare**
```
For the "Airfare" category in the Figma design:

1. What input fields are required?
   - Origin airport/city? Destination? Departure date? Return date? Number of passengers? Class (economy/business)?

2. What columns are in the results table?
   - Rank, Airline, Price, Departure Time, Arrival Time, Duration, Stops?

3. How are flight times displayed?
   - Format: "8:00 AM - 11:30 AM" or separate columns?

4. What additional information is shown?
   - Layover time? Aircraft type? Baggage allowance?
```

#### **3. Oil Changes**
```
For the "Oil Changes" category in the Figma design:

1. What input fields are shown?
   - ZIP code? Vehicle type (sedan/SUV/truck)? Oil type (conventional/synthetic)?

2. What columns are in the results table?
   - Rank, Shop Name, Address, Price, Distance, Rating?

3. Is there a vehicle selector?
   - Dropdown for make/model/year? Or just vehicle type?

4. What price information is shown?
   - Base price? Price with oil type? Installation included?
```

#### **4. Car Washes**
```
For the "Car Washes" category in the Figma design:

1. What input fields are required?
   - ZIP code? Service type (basic/premium/deluxe)? Vehicle size?

2. What columns are in the results table?
   - Rank, Location Name, Address, Price, Distance, Service Types?

3. How are service packages displayed?
   - Separate rows for each package? Or one row with multiple prices?

4. What additional info is shown?
   - Hours? Self-service vs full-service? Rating?
```

#### **5. Gas Stations**
```
For the "Gas Stations" category in the Figma design:

1. What input fields are shown?
   - ZIP code? Fuel type (regular/premium/diesel)? Payment method?

2. What columns are in the results table?
   - Rank, Station Name, Address, Price/Gallon, Distance, Rating?

3. How are prices displayed?
   - Per gallon? Per liter? Different prices for different fuel types?

4. What additional information?
   - Hours? Amenities (car wash, convenience store)? Payment methods?
```

#### **6. Car Insurance**
```
For the "Car Insurance" category in the Figma design:

1. What input fields are required?
   - ZIP code? Vehicle year/make/model? Coverage type? Driver age? Driving history?

2. What columns are in the results table?
   - Rank, Insurance Company, Price/Month, Coverage Details, Deductible?

3. How is coverage information displayed?
   - Full coverage? Liability only? Coverage amounts?

4. What additional details?
   - Discounts available? Claims process? Customer service rating?
```

#### **7. Renters Insurance**
```
For the "Renters Insurance" category in the Figma design:

1. What input fields are shown?
   - ZIP code? Apartment size (studio/1BR/2BR)? Coverage amount? Personal property value?

2. What columns are in the results table?
   - Rank, Insurance Company, Price/Month, Coverage Amount, Deductible?

3. What coverage details are displayed?
   - Personal property coverage? Liability coverage? Additional living expenses?

4. Any special features?
   - Bundling discounts? Claims process? Customer ratings?
```

#### **8. Apartments**
```
For the "Apartments" category in the Figma design:

1. What input fields are required?
   - ZIP code? Apartment size (studio/1BR/2BR/3BR)? Price range? Amenities?

2. What columns are in the results table?
   - Rank, Apartment Name, Address, Price/Month, Size, Distance, Rating?

3. What information is displayed?
   - Square footage? Bedrooms/bathrooms? Amenities? Pet-friendly? Parking?

4. How are listings displayed?
   - Table format? Cards? Images included?
```

#### **9. Storage Units**
```
For the "Storage Units" category in the Figma design:

1. What input fields are shown?
   - ZIP code? Unit size (small/medium/large)? Storage type (climate-controlled)?

2. What columns are in the results table?
   - Rank, Facility Name, Address, Price/Month, Unit Size, Distance?

3. What size options are available?
   - 5x5, 10x10, 10x20? Or small/medium/large?

4. Additional information?
   - Security features? Access hours? Climate control? Insurance?
```

#### **10. Mattresses**
```
For the "Mattresses" category in the Figma design:

1. What input fields are required?
   - ZIP code? Mattress size (twin/full/queen/king)? Mattress type (memory foam/spring)?

2. What columns are in the results table?
   - Rank, Store Name, Address, Price, Size, Distance, Rating?

3. How are different sizes handled?
   - Separate rows? Or one row with size selector?

4. What product details?
   - Brand? Type? Firmness? Warranty?
```

---

### **Pattern C Categories (Service Listings with Business Cards)**

#### **11. Services (General)**
```
For the "Services" category in the Figma design:

1. What service types are shown?
   - Cleaning? Plumbing? Electrical? HVAC? Other?

2. How is the service type selector designed?
   - Big buttons? Dropdown? Icons with labels?

3. What information is shown for each business?
   - Name, address, phone, website, hours, rating, price range, distance?

4. How are results displayed?
   - Cards? List? Grid? With images?
```

#### **12. Food Delivery**
```
For the "Food Delivery" category in the Figma design:

1. What service types are available?
   - Restaurant delivery? Grocery delivery? Alcohol delivery?

2. What input fields?
   - ZIP code? Delivery type? Cuisine preference?

3. What information per business?
   - Restaurant name, cuisine type, delivery fee, minimum order, delivery time, rating?

4. How are delivery options shown?
   - Delivery fee? Estimated time? Minimum order amount?
```

#### **13. Massage Parlors**
```
For the "Massage" category in the Figma design:

1. What service types are shown?
   - Swedish massage? Deep tissue? Hot stone? Sports massage?

2. What input fields?
   - ZIP code? Service type? Duration (30min/60min/90min)?

3. What information per business?
   - Business name, address, phone, website, hours, rating, price range, distance?

4. How are prices displayed?
   - Per service? Per duration? Price range?
```

#### **14. Nail Salons**
```
For the "Nail Salons" category in the Figma design:

1. What service types are available?
   - Manicure? Pedicure? Manicure + Pedicure? Nail art?

2. What input fields?
   - ZIP code? Service type? Additional services?

3. What information per salon?
   - Salon name, address, phone, website, hours, rating, price, distance?

4. How are service packages shown?
   - Individual services? Package deals?
```

#### **15. Gym Memberships**
```
For the "Gyms" category in the Figma design:

1. What membership types are shown?
   - Basic? Premium? Family? Student?

2. What input fields?
   - ZIP code? Membership type? Features needed (pool/parking/classes)?

3. What information per gym?
   - Gym name, address, phone, website, hours, rating, price/month, distance, amenities?

4. How are prices displayed?
   - Monthly? Annual? Initiation fee? Additional fees?
```

#### **16. Moving Companies**
```
For the "Moving" category in the Figma design:

1. What service types are available?
   - Local move? Long distance? Packing service? Storage?

2. What input fields?
   - ZIP code? Move type? Distance? Number of rooms? Date?

3. What information per company?
   - Company name, address, phone, website, rating, price estimate, distance, services?

4. How are prices displayed?
   - Flat rate? Per hour? Per mile? Estimate range?
```

#### **17. Spa Services**
```
For the "Spa" category in the Figma design:

1. What service types are shown?
   - Facial? Massage? Body treatment? Full spa day?

2. What input fields?
   - ZIP code? Service type? Duration?

3. What information per spa?
   - Spa name, address, phone, website, hours, rating, price range, distance, amenities?

4. How are packages displayed?
   - Individual services? Package deals? Day packages?
```

---

## 🎨 **General Design Questions**

Also ask your AI these general questions:

```
1. What is the exact color scheme for each category?
   - Primary color? Secondary color? Gradient colors?

2. What icons are used for each category?
   - Icon name? Icon style? Icon color?

3. What is the exact layout structure?
   - Hero section? Search form? Results section? Order of elements?

4. What typography is used?
   - Font sizes? Font weights? Text colors?

5. What spacing/padding is used?
   - Card padding? Section margins? Input field spacing?

6. What are the exact placeholder texts?
   - For each input field, what's the exact placeholder text shown?

7. What are the button styles?
   - Button text? Button colors? Button size? Gradient?

8. What error states are shown?
   - Empty state? No results? Loading state?

9. What are the table column widths?
   - Percentage widths? Fixed widths? Responsive?

10. What are the exact field labels?
    - Required fields marked with *? Optional fields labeled?
```

---

## 📝 **Template for Asking Questions**

Use this template when talking to your AI:

```
"I need to implement the [CATEGORY NAME] category in my PriceLens app. 
Based on the Figma design you created, please provide:

1. The exact input fields shown (labels, placeholders, required/optional)
2. The exact table columns (if Pattern B) or card layout (if Pattern C)
3. The exact information displayed for each result
4. The exact color scheme and styling
5. Any special features or interactions
6. The exact text for all labels, buttons, and messages

Please be specific about:
- Field names and placeholders
- Column headers
- Data format (dates, prices, distances)
- Button text and actions
- Error messages
- Empty states
```

---

## ✅ **After Getting Answers**

Once you have the answers, you can:
1. Update the search fields in `[slug].tsx`
2. Update the table columns in `PatternBLayout.tsx` or create custom layouts
3. Update the category configuration in `categories.ts`
4. Implement the backend API endpoints
5. Style components to match the Figma design exactly

---

## 🔄 **Next Steps**

1. Ask your AI these questions for each category
2. Document the answers
3. Implement each category one by one
4. Test each implementation
5. Refine based on user feedback
