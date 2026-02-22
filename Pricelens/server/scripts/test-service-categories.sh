#!/usr/bin/env bash
# Test service category endpoints to see if Serper/real API returns data (not mock).
# Run with: ./scripts/test-service-categories.sh [BASE_URL]
# Example: ./scripts/test-service-categories.sh http://localhost:3000
# Before running: ensure server is up. For REAL data set USE_MOCK_SERVICE_DATA=false and SERPER_API_KEY in .env.

BASE_URL="${1:-http://localhost:3000}"
CURL_TIMEOUT="${CURL_TIMEOUT:-45}"
ZIP="90210"
LOCATION="Los Angeles"

echo "=============================================="
echo "Testing service categories at: $BASE_URL"
echo "=============================================="
echo ""

test_one() {
  local name="$1"
  local url="$2"
  printf "%-22s " "$name"
  resp=$(curl -s -w "\n%{http_code}" --max-time "$CURL_TIMEOUT" "$url") || { echo "FAIL (curl error/timeout)"; return 1; }
  code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')
  if [ "$code" != "200" ]; then
    echo "FAIL HTTP $code"
    return 1
  fi
  # Count array elements (rough: count of "rank": or "hotel": or "company": etc.)
  count=$(echo "$body" | grep -o '"rank":\s*[0-9]*' | wc -l | tr -d ' ')
  [ -z "$count" ] && count=0
  # Show first recognizable name (grep first "hotel": or "company": or "name": etc.)
  first=$(echo "$body" | grep -oE '"(hotel|company|shop|station|gym|facility|name|businessName|title)":\s*"[^"]{1,50}' | head -1 | sed 's/.*":\s*"//;s/".*//;s/\\//g' | head -c 45)
  [ -z "$first" ] && first="(see response)"
  echo "OK  results≈$count  first: $first"
}

test_one "Rental Cars"        "$BASE_URL/services/rental-cars?location=LAX"
test_one "Hotels"             "$BASE_URL/services/hotels?location=$LOCATION"
test_one "Gas Stations"       "$BASE_URL/services/gas-stations?zipCode=$ZIP"
test_one "Gyms"               "$BASE_URL/services/gyms?zipCode=$ZIP"
test_one "Oil Changes"        "$BASE_URL/services/oil-changes?zipCode=$ZIP"
test_one "Tires"              "$BASE_URL/services/tires?year=2020&make=Toyota&model=RAV4&zipCode=$ZIP"
test_one "Car Washes"         "$BASE_URL/services/car-washes?zipCode=$ZIP"
test_one "Storage"            "$BASE_URL/services/storage?zipCode=$ZIP"
test_one "Spa (providers)"    "$BASE_URL/services/providers?category=spa&serviceType=swedish60&zipCode=$ZIP"
test_one "Haircuts"           "$BASE_URL/services/providers?category=haircuts&serviceType=mens&zipCode=$ZIP"
test_one "Airfare"            "$BASE_URL/services/airfare?origin=JFK&destination=LAX"
test_one "Meal Kits"          "$BASE_URL/services/meal-kits?zipCode=$ZIP"
test_one "Renters Insurance" "$BASE_URL/services/renters-insurance?zipCode=$ZIP"
test_one "Car Insurance"      "$BASE_URL/services/car-insurance?zipCode=$ZIP"
test_one "Apartments"         "$BASE_URL/services/apartments?zipCode=$ZIP"
test_one "Moving"             "$BASE_URL/services/moving?zipCode=$ZIP"
test_one "Food Delivery"      "$BASE_URL/services/food-delivery?zipCode=$ZIP"

echo ""
echo "Done. OK + results>0 = endpoint returned data."
echo "For REAL Serper data: in server .env set USE_MOCK_SERVICE_DATA=false and SERPER_API_KEY, then restart server."
