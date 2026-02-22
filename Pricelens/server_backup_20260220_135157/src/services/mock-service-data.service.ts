/**
 * Mock Service Data Service
 * 
 * Provides sample data for service categories during development
 * to avoid API costs. Use when API keys are missing or in development mode.
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class MockServiceDataService {
  
  /**
   * Generate mock gas stations data
   */
  generateGasStations(zipCode: string, gasType: string = 'regular'): any[] {
    const stations = [
      { name: 'Shell', basePrice: 3.89 },
      { name: 'Chevron', basePrice: 3.92 },
      { name: 'Exxon', basePrice: 3.87 },
      { name: 'BP', basePrice: 3.90 },
      { name: 'Mobil', basePrice: 3.91 },
      { name: '76', basePrice: 3.88 },
      { name: 'ARCO', basePrice: 3.85 },
      { name: 'Valero', basePrice: 3.86 },
    ];

    const priceMultipliers: Record<string, number> = {
      regular: 1.0,
      midgrade: 1.15,
      premium: 1.30,
      diesel: 1.20,
    };

    return stations.map((station, index) => {
      const basePrice = station.basePrice * priceMultipliers[gasType] || station.basePrice;
      const variation = (Math.random() - 0.5) * 0.20; // ±$0.10 variation
      const price = basePrice + variation;

      return {
        rank: index + 1,
        station: station.name,
        address: `${100 + index * 50} Main St, City, State ${zipCode}`,
        price: `$${price.toFixed(2)}`,
        distance: `${(index * 0.5 + 0.3).toFixed(1)} miles`,
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        phone: `(555) ${100 + index}-${1000 + index}`,
        website: `https://${station.name.toLowerCase()}.com`,
      };
    });
  }

  /**
   * Generate mock gyms data
   */
  generateGyms(zipCode: string, membershipType?: string): any[] {
    const gyms = [
      { name: 'Planet Fitness', price: '$10/month', rating: 4.2 },
      { name: '24 Hour Fitness', price: '$30/month', rating: 4.0 },
      { name: 'Equinox', price: '$200/month', rating: 4.7 },
      { name: 'LA Fitness', price: '$35/month', rating: 4.3 },
      { name: 'Gold\'s Gym', price: '$25/month', rating: 4.1 },
      { name: 'Crunch Fitness', price: '$20/month', rating: 4.0 },
      { name: 'Anytime Fitness', price: '$40/month', rating: 4.4 },
      { name: 'YMCA', price: '$50/month', rating: 4.5 },
    ];

    return gyms
      .filter(gym => {
        if (membershipType === 'premium') {
          return parseFloat(gym.price.replace(/[^0-9.]/g, '')) >= 100;
        }
        if (membershipType === 'basic') {
          return parseFloat(gym.price.replace(/[^0-9.]/g, '')) < 50;
        }
        return true;
      })
      .map((gym, index) => ({
        rank: index + 1,
        gym: gym.name,
        address: `${200 + index * 100} Fitness Ave, City, State ${zipCode}`,
        price: gym.price,
        distance: `${(index * 0.8 + 0.5).toFixed(1)} miles`,
        rating: gym.rating,
        reviews: Math.floor(Math.random() * 500 + 50),
        phone: `(555) ${200 + index}-${2000 + index}`,
        website: `https://${gym.name.toLowerCase().replace(/\s+/g, '')}.com`,
      }));
  }

  /**
   * Generate mock hotels data
   */
  generateHotels(location: string, checkIn?: string, checkOut?: string): any[] {
    const hotels = [
      { name: 'Holiday Inn Express', price: '$89/night', rating: 4.0 },
      { name: 'Hampton Inn', price: '$95/night', rating: 4.2 },
      { name: 'Marriott', price: '$149/night', rating: 4.5 },
      { name: 'Hilton', price: '$139/night', rating: 4.4 },
      { name: 'Hyatt', price: '$159/night', rating: 4.6 },
      { name: 'Best Western', price: '$79/night', rating: 3.9 },
      { name: 'Comfort Inn', price: '$85/night', rating: 4.0 },
      { name: 'The Ritz-Carlton', price: '$299/night', rating: 4.8 },
    ];

    return hotels.map((hotel, index) => ({
      rank: index + 1,
      hotel: hotel.name,
      address: `${300 + index * 50} Hotel Blvd, ${location}`,
      price: hotel.price,
      rating: hotel.rating,
      reviews: Math.floor(Math.random() * 2000 + 200),
      phone: `(555) ${300 + index}-${3000 + index}`,
      website: `https://${hotel.name.toLowerCase().replace(/\s+/g, '')}.com`,
    }));
  }

  /**
   * Generate mock oil change shops data
   */
  generateOilChanges(zipCode: string, vehicleType: string = 'car'): any[] {
    const shops = [
      { name: 'Jiffy Lube', basePrice: 30 },
      { name: 'Valvoline Instant Oil Change', basePrice: 35 },
      { name: 'Quick Lube', basePrice: 28 },
      { name: 'Express Oil Change', basePrice: 32 },
      { name: 'Take 5 Oil Change', basePrice: 34 },
      { name: 'Walmart Auto Care', basePrice: 25 },
      { name: 'Firestone Complete Auto Care', basePrice: 40 },
      { name: 'Meineke', basePrice: 38 },
    ];

    const multipliers: Record<string, number> = {
      car: 1.0,
      suv: 1.5,
      truck: 1.8,
      motorcycle: 0.7,
    };

    return shops.map((shop, index) => {
      const price = shop.basePrice * (multipliers[vehicleType] || 1.0);
      return {
        rank: index + 1,
        shop: shop.name,
        address: `${400 + index * 75} Auto Way, City, State ${zipCode}`,
        price: `$${price.toFixed(2)}`,
        distance: `${(index * 1.2 + 0.5).toFixed(1)} miles`,
        rating: (3.8 + Math.random() * 1.0).toFixed(1),
        reviews: Math.floor(Math.random() * 300 + 30),
        phone: `(555) ${400 + index}-${4000 + index}`,
        website: `https://${shop.name.toLowerCase().replace(/\s+/g, '')}.com`,
      };
    });
  }

  /**
   * Generate mock tire shops data
   */
  generateTires(year: string, make: string, model: string, zipCode: string): any[] {
    const shops = [
      { name: 'Discount Tire', basePrice: 120 },
      { name: 'Firestone Complete Auto Care', basePrice: 135 },
      { name: 'Goodyear Auto Service', basePrice: 140 },
      { name: 'NTB Tire & Service', basePrice: 130 },
      { name: 'Tire Kingdom', basePrice: 125 },
      { name: 'Big O Tires', basePrice: 128 },
      { name: 'Les Schwab Tires', basePrice: 145 },
      { name: 'America\'s Tire', basePrice: 118 },
    ];

    return shops.map((shop, index) => {
      const variation = (Math.random() - 0.5) * 40; // ±$20 variation
      const price = shop.basePrice + variation;
      return {
        rank: index + 1,
        shop: shop.name,
        address: `${500 + index * 60} Tire St, City, State ${zipCode}`,
        price: `$${price.toFixed(2)}`,
        distance: `${(index * 1.5 + 0.8).toFixed(1)} miles`,
        rating: (4.0 + Math.random() * 0.8).toFixed(1),
        reviews: Math.floor(Math.random() * 400 + 50),
        phone: `(555) ${500 + index}-${5000 + index}`,
        website: `https://${shop.name.toLowerCase().replace(/\s+/g, '')}.com`,
      };
    });
  }

  /**
   * Generate mock service providers (Pattern C)
   */
  generateServiceProviders(
    category: string,
    serviceType: string,
    zipCode: string
  ): any[] {
    const priceMap: Record<string, Record<string, string>> = {
      haircuts: {
        mens: '$15-30',
        womens: '$30-80',
        kids: '$15-25',
      },
      massage: {
        swedish: '$60-100',
        deep: '$80-120',
        hot: '$100-150',
      },
      'nail-salons': {
        manicure: '$20-40',
        pedicure: '$30-50',
        both: '$45-80',
      },
      spa: {
        massage: '$80-150',
      },
    };

    const businessNames: Record<string, string[]> = {
      haircuts: [
        'Great Clips',
        'Supercuts',
        'Sport Clips',
        'Hair Cuttery',
        'Fantastic Sams',
        'Cost Cutters',
        'SmartStyle',
        'Regis Salon',
      ],
      massage: [
        'Massage Envy',
        'Elements Massage',
        'Hand & Stone',
        'Massage Heights',
        'MassageLuXe',
        'The Woodhouse Day Spa',
        'Massage Therapy Center',
        'Relaxation Station',
      ],
      'nail-salons': [
        'Nail Spa',
        'Luxury Nails',
        'Perfect Nails',
        'Nail Art Studio',
        'Glamour Nails',
        'Elegant Nails',
        'Nail Pro',
        'Beauty Nails',
      ],
      spa: [
        'The Spa at Four Seasons',
        'Bliss Spa',
        'Spa Solage',
        'The Ritz-Carlton Spa',
        'Spa Montage',
        'Relaxation Spa',
        'Wellness Spa',
        'Serenity Spa',
      ],
    };

    const names = businessNames[category] || ['Service Provider 1', 'Service Provider 2'];
    const priceRange = priceMap[category]?.[serviceType] || '$50-100';

    return names.map((name, index) => ({
      id: `mock-${category}-${index}`,
      name: name,
      businessName: name,
      address: `${600 + index * 80} Service Ave, City, State ${zipCode}`,
      distance: `${(index * 0.7 + 0.3).toFixed(1)} miles`,
      rating: (4.0 + Math.random() * 1.0).toFixed(1),
      reviewCount: Math.floor(Math.random() * 500 + 50),
      hours: 'Mon-Sat: 9am-7pm, Sun: 10am-6pm',
      priceRange: priceRange,
      price: priceRange,
      phone: `(555) ${600 + index}-${6000 + index}`,
      website: `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
      thumbnail: `https://via.placeholder.com/150?text=${encodeURIComponent(name)}`,
    }));
  }

  /**
   * Generate mock car washes data
   */
  generateCarWashes(zipCode: string, washType: string = 'basic'): any[] {
    const carWashes = [
      { name: 'Quick Quack Car Wash', basePrice: 10 },
      { name: 'Mister Car Wash', basePrice: 12 },
      { name: 'Zips Car Wash', basePrice: 8 },
      { name: 'Super Wash', basePrice: 15 },
      { name: 'Express Car Wash', basePrice: 11 },
      { name: 'Sparkle Car Wash', basePrice: 9 },
      { name: 'Shine Car Wash', basePrice: 13 },
      { name: 'Crystal Clean Car Wash', basePrice: 14 },
    ];

    const multipliers: Record<string, number> = {
      basic: 1.0,
      deluxe: 1.8,
      premium: 2.5,
      full: 3.5,
    };

    return carWashes.map((wash, index) => {
      const price = wash.basePrice * (multipliers[washType] || 1.0);
      return {
        rank: index + 1,
        carWash: wash.name,
        address: `${700 + index * 50} Wash St, City, State ${zipCode}`,
        price: `$${price.toFixed(2)}`,
        distance: `${(index * 0.6 + 0.4).toFixed(1)} miles`,
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        reviews: Math.floor(Math.random() * 400 + 50),
        phone: `(555) ${700 + index}-${7000 + index}`,
        website: `https://${wash.name.toLowerCase().replace(/\s+/g, '')}.com`,
      };
    });
  }

  /**
   * Curated rental car partners: real brands with book URLs for affiliate/referral.
   * Add your affiliate params to bookUrl when you have partner agreements.
   */
  private readonly RENTAL_CAR_PARTNERS = [
    { name: 'Hertz', slug: 'hertz', basePricePerDay: 52, rating: 4.2, logoUrl: 'https://logo.clearbit.com/hertz.com', bookUrl: 'https://www.hertz.com/rentacar/reservation/', sponsored: true },
    { name: 'Enterprise Rent-A-Car', slug: 'enterprise', basePricePerDay: 45, rating: 4.3, logoUrl: 'https://logo.clearbit.com/enterprise.com', bookUrl: 'https://www.enterprise.com/en/car-rental/locations.html', sponsored: false },
    { name: 'Avis', slug: 'avis', basePricePerDay: 48, rating: 4.1, logoUrl: 'https://logo.clearbit.com/avis.com', bookUrl: 'https://www.avis.com/en/home', sponsored: true },
    { name: 'Budget', slug: 'budget', basePricePerDay: 40, rating: 4.0, logoUrl: 'https://logo.clearbit.com/budget.com', bookUrl: 'https://www.budget.com/en/home', sponsored: false },
    { name: 'National Car Rental', slug: 'national', basePricePerDay: 54, rating: 4.4, logoUrl: 'https://logo.clearbit.com/nationalcar.com', bookUrl: 'https://www.nationalcar.com/en/home.html', sponsored: false },
    { name: 'Alamo', slug: 'alamo', basePricePerDay: 46, rating: 4.2, logoUrl: 'https://logo.clearbit.com/alamo.com', bookUrl: 'https://www.alamo.com/en/home.html', sponsored: false },
    { name: 'Thrifty', slug: 'thrifty', basePricePerDay: 38, rating: 3.9, logoUrl: 'https://logo.clearbit.com/thrifty.com', bookUrl: 'https://www.thrifty.com/', sponsored: false },
    { name: 'Dollar', slug: 'dollar', basePricePerDay: 35, rating: 3.8, logoUrl: 'https://logo.clearbit.com/dollar.com', bookUrl: 'https://www.dollar.com/', sponsored: false },
    { name: 'Sixt', slug: 'sixt', basePricePerDay: 55, rating: 4.3, logoUrl: 'https://logo.clearbit.com/sixt.com', bookUrl: 'https://www.sixt.com/car-rental/', sponsored: false },
    { name: 'Kayak', slug: 'kayak', basePricePerDay: 42, rating: 4.5, logoUrl: 'https://logo.clearbit.com/kayak.com', bookUrl: 'https://www.kayak.com/cars/', sponsored: true },
  ];

  /**
   * Match a place title from Serper Maps to a known partner (for logo, bookUrl, sponsored).
   * Used when enriching real Serper results so we still show logos and affiliate links.
   */
  getRentalCarPartnerByTitle(title: string): { name: string; slug: string; logoUrl: string; bookUrl: string; sponsored: boolean } | null {
    if (!title || typeof title !== 'string') return null;
    const lower = title.toLowerCase();
    for (const p of this.RENTAL_CAR_PARTNERS) {
      if (lower.includes(p.slug) || lower.includes(p.name.toLowerCase().replace(/-/g, ' '))) return p;
    }
    return null;
  }

  /**
   * Generate rental car results (used when mock data is ON or when Serper returns no results).
   * Prices vary by car type; bookUrl can include location/dates for deep linking.
   */
  generateRentalCars(location: string, pickupDate?: string, returnDate?: string, carType?: string): any[] {
    const carTypeMultipliers: Record<string, number> = {
      economy: 0.85,
      compact: 0.95,
      suv: 1.25,
      luxury: 1.65,
    };
    const mult = carType ? (carTypeMultipliers[carType] ?? 1) : 1;

    return this.RENTAL_CAR_PARTNERS.map((partner, index) => {
      const variation = (Math.random() - 0.5) * 12;
      const pricePerDay = Math.round((partner.basePricePerDay * mult + variation) * 100) / 100;
      const days = 5; // default trip length for total estimate
      const totalEstimate = Math.round(pricePerDay * days * 100) / 100;
      const encodedLocation = encodeURIComponent(location);
      const bookUrlWithParams = `${partner.bookUrl}${partner.bookUrl.includes('?') ? '&' : '?'}pickupLocation=${encodedLocation}${pickupDate ? `&pickupDate=${encodeURIComponent(pickupDate)}` : ''}${returnDate ? `&returnDate=${encodeURIComponent(returnDate)}` : ''}`;

      return {
        rank: index + 1,
        company: partner.name,
        companySlug: partner.slug,
        companyLogo: partner.logoUrl,
        pricePerDay: pricePerDay,
        pricePerDayFormatted: `$${pricePerDay.toFixed(2)}/day`,
        totalEstimate: totalEstimate,
        totalEstimateFormatted: `$${totalEstimate.toFixed(2)} total`,
        rating: partner.rating,
        reviews: Math.floor(Math.random() * 800 + 200),
        bookUrl: bookUrlWithParams,
        sponsored: partner.sponsored ?? false,
        carType: carType || 'economy',
      };
    });
  }

  /**
   * Generate mock storage units data
   */
  generateStorageUnits(zipCode: string, size: string = 'standard'): any[] {
    const facilities = [
      { name: 'Public Storage', basePrice: 120 },
      { name: 'Extra Space Storage', basePrice: 130 },
      { name: 'CubeSmart', basePrice: 115 },
      { name: 'Life Storage', basePrice: 125 },
      { name: 'StorageMart', basePrice: 110 },
      { name: 'U-Haul Storage', basePrice: 105 },
      { name: 'National Storage', basePrice: 128 },
      { name: 'Storage Plus', basePrice: 118 },
    ];

    const multipliers: Record<string, number> = {
      small: 0.7,
      medium: 1.0,
      large: 1.5,
      'extra-large': 2.0,
      standard: 1.0,
    };

    return facilities.map((facility, index) => {
      const price = facility.basePrice * (multipliers[size] || 1.0);
      return {
        rank: index + 1,
        facility: facility.name,
        address: `${900 + index * 75} Storage Blvd, City, State ${zipCode}`,
        price: `$${price.toFixed(2)}/month`,
        distance: `${(index * 1.0 + 0.5).toFixed(1)} miles`,
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        reviews: Math.floor(Math.random() * 500 + 50),
        phone: `(555) ${900 + index}-${9000 + index}`,
        website: `https://${facility.name.toLowerCase().replace(/\s+/g, '')}.com`,
      };
    });
  }

  /**
   * Generate mock meal kits data
   */
  generateMealKits(zipCode: string): any[] {
    const companies = [
      { name: 'HelloFresh', price: '$12/meal', rating: 4.5 },
      { name: 'Blue Apron', price: '$11/meal', rating: 4.3 },
      { name: 'Home Chef', price: '$13/meal', rating: 4.4 },
      { name: 'Sun Basket', price: '$14/meal', rating: 4.6 },
      { name: 'Green Chef', price: '$13/meal', rating: 4.4 },
      { name: 'EveryPlate', price: '$8/meal', rating: 4.2 },
      { name: 'Marley Spoon', price: '$12/meal', rating: 4.3 },
      { name: 'Dinnerly', price: '$7/meal', rating: 4.1 },
    ];

    return companies.map((company, index) => ({
      rank: index + 1,
      company: company.name,
      address: `Delivery available in ${zipCode}`,
      price: company.price,
      distance: 'Delivery',
      rating: company.rating,
      reviews: Math.floor(Math.random() * 2000 + 200),
      phone: `(555) ${1000 + index}-${10000 + index}`,
      website: `https://${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
    }));
  }

  /**
   * Generate mock car insurance data
   */
  generateCarInsurance(zipCode: string, vehicleYear?: string, vehicleMake?: string, vehicleModel?: string): any[] {
    const companies = [
      { name: 'State Farm', price: '$120/month', rating: 4.5 },
      { name: 'Geico', price: '$110/month', rating: 4.4 },
      { name: 'Progressive', price: '$115/month', rating: 4.3 },
      { name: 'Allstate', price: '$125/month', rating: 4.2 },
      { name: 'USAA', price: '$105/month', rating: 4.7 },
      { name: 'Farmers', price: '$130/month', rating: 4.1 },
      { name: 'Liberty Mutual', price: '$128/month', rating: 4.0 },
      { name: 'Nationwide', price: '$122/month', rating: 4.2 },
    ];

    return companies.map((company, index) => ({
      rank: index + 1,
      company: company.name,
      address: `${1100 + index * 50} Insurance Blvd, City, State ${zipCode}`,
      price: company.price,
      distance: `${(index * 0.8 + 0.5).toFixed(1)} miles`,
      rating: company.rating,
      reviews: Math.floor(Math.random() * 5000 + 500),
      phone: `(555) ${1100 + index}-${11000 + index}`,
      website: `https://${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
    }));
  }

  /**
   * Generate mock renters insurance data
   */
  generateRentersInsurance(zipCode: string): any[] {
    const companies = [
      { name: 'Lemonade', price: '$15/month', rating: 4.6 },
      { name: 'State Farm', price: '$18/month', rating: 4.5 },
      { name: 'Geico', price: '$16/month', rating: 4.4 },
      { name: 'Allstate', price: '$20/month', rating: 4.3 },
      { name: 'Progressive', price: '$17/month', rating: 4.3 },
      { name: 'USAA', price: '$14/month', rating: 4.7 },
      { name: 'Farmers', price: '$19/month', rating: 4.1 },
      { name: 'Liberty Mutual', price: '$21/month', rating: 4.0 },
    ];

    return companies.map((company, index) => ({
      rank: index + 1,
      company: company.name,
      address: `${1200 + index * 50} Insurance Ave, City, State ${zipCode}`,
      price: company.price,
      distance: `${(index * 0.7 + 0.4).toFixed(1)} miles`,
      rating: company.rating,
      reviews: Math.floor(Math.random() * 3000 + 300),
      phone: `(555) ${1200 + index}-${12000 + index}`,
      website: `https://${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
    }));
  }

  /**
   * Generate mock apartments data
   */
  generateApartments(zipCode: string, serviceType?: string): any[] {
    const apartments = [
      { name: 'Sunset Apartments', price: '$1500/month', rating: 4.2 },
      { name: 'Parkview Residences', price: '$1800/month', rating: 4.4 },
      { name: 'Garden Apartments', price: '$1400/month', rating: 4.1 },
      { name: 'Riverside Apartments', price: '$1600/month', rating: 4.3 },
      { name: 'Oakwood Apartments', price: '$1700/month', rating: 4.2 },
      { name: 'Maple Heights', price: '$1550/month', rating: 4.0 },
      { name: 'Cedar Court', price: '$1650/month', rating: 4.3 },
      { name: 'Pine Grove Apartments', price: '$1450/month', rating: 4.1 },
    ];

    const typeMultipliers: Record<string, number> = {
      studio: 0.7,
      '1br': 1.0,
      '2br': 1.3,
      '3br': 1.6,
    };

    return apartments.map((apt, index) => {
      const basePrice = parseFloat(apt.price.replace(/[^0-9.]/g, ''));
      const multiplier = typeMultipliers[serviceType || '1br'] || 1.0;
      const adjustedPrice = basePrice * multiplier;
      
      return {
        id: `apartment-${index}`,
        name: apt.name,
        businessName: apt.name,
        address: `${1300 + index * 100} Apartment Way, City, State ${zipCode}`,
        distance: `${(index * 0.5 + 0.3).toFixed(1)} miles`,
        rating: apt.rating,
        reviewCount: Math.floor(Math.random() * 200 + 20),
        hours: 'Mon-Fri: 9am-6pm',
        priceRange: `$${Math.round(adjustedPrice)}/month`,
        price: `$${Math.round(adjustedPrice)}/month`,
        phone: `(555) ${1300 + index}-${13000 + index}`,
        website: `https://${apt.name.toLowerCase().replace(/\s+/g, '')}.com`,
        thumbnail: `https://via.placeholder.com/150?text=${encodeURIComponent(apt.name)}`,
      };
    });
  }

  /**
   * Generate mock moving companies data
   */
  generateMovingCompanies(zipCode: string, moveType: string = 'local'): any[] {
    const companies = [
      { name: 'Two Men and a Truck', price: '$500', rating: 4.5 },
      { name: 'Allied Van Lines', price: '$800', rating: 4.4 },
      { name: 'North American Van Lines', price: '$750', rating: 4.3 },
      { name: 'Mayflower', price: '$700', rating: 4.2 },
      { name: 'Atlas Van Lines', price: '$720', rating: 4.3 },
      { name: 'United Van Lines', price: '$780', rating: 4.4 },
      { name: 'PODS', price: '$600', rating: 4.1 },
      { name: 'U-Haul Moving', price: '$400', rating: 4.0 },
    ];

    const multipliers: Record<string, number> = {
      local: 1.0,
      'long-distance': 3.0,
    };

    return companies.map((company, index) => {
      const basePrice = parseFloat(company.price.replace(/[^0-9.]/g, ''));
      const multiplier = multipliers[moveType] || 1.0;
      const adjustedPrice = basePrice * multiplier;
      
      return {
        id: `moving-${index}`,
        name: company.name,
        businessName: company.name,
        address: `${1400 + index * 80} Moving St, City, State ${zipCode}`,
        distance: `${(index * 0.6 + 0.4).toFixed(1)} miles`,
        rating: company.rating,
        reviewCount: Math.floor(Math.random() * 500 + 50),
        hours: 'Mon-Sat: 8am-6pm',
        priceRange: `$${Math.round(adjustedPrice)}`,
        price: `$${Math.round(adjustedPrice)}`,
        phone: `(555) ${1400 + index}-${14000 + index}`,
        website: `https://${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
        thumbnail: `https://via.placeholder.com/150?text=${encodeURIComponent(company.name)}`,
      };
    });
  }

  /**
   * Generate mock food delivery data
   */
  generateFoodDelivery(zipCode: string, cuisine?: string): any[] {
    const services = [
      { name: 'DoorDash', price: '$15-30', rating: 4.3 },
      { name: 'Uber Eats', price: '$18-35', rating: 4.2 },
      { name: 'Grubhub', price: '$16-32', rating: 4.1 },
      { name: 'Postmates', price: '$17-33', rating: 4.0 },
      { name: 'Caviar', price: '$20-40', rating: 4.4 },
      { name: 'Seamless', price: '$15-30', rating: 4.2 },
      { name: 'Instacart', price: '$12-25', rating: 4.3 },
      { name: 'Amazon Fresh', price: '$10-20', rating: 4.5 },
    ];

    return services.map((service, index) => ({
      id: `food-delivery-${index}`,
      name: service.name,
      businessName: service.name,
      address: `Delivery available in ${zipCode}`,
      distance: 'Delivery',
      rating: service.rating,
      reviewCount: Math.floor(Math.random() * 10000 + 1000),
      hours: '24/7',
      priceRange: service.price,
      price: service.price,
      phone: `(555) ${1500 + index}-${15000 + index}`,
      website: `https://${service.name.toLowerCase().replace(/\s+/g, '')}.com`,
      thumbnail: `https://via.placeholder.com/150?text=${encodeURIComponent(service.name)}`,
    }));
  }
}
