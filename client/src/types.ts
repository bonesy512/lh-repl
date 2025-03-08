import { SavedQuery } from './utils/firebase';

export interface Address {
  city: string | null;
  state: string | null;
  streetAddress: string | null;
  zipcode: string | null;
}

export interface AcrePriceData {
  acre: number | null;
  price: number | null;
  address: string | null;
}

export interface PriceEstimate {
  url: string | null;
  price: string | null;
  website_name: string | null;
}

export interface PropertyDetailsResponse {
  // Metadata
  id: string | null;
  isSaved: boolean | null;
  
  // Parcel Data
  propertyId: string | null;
  ownerName: string | null;
  legalArea: string | null;
  legalAreaUnits: string | null;
  gisArea: number | null;
  gisAreaUnits: string | null;
  landValue: number | null;
  improvementValue: number | null;
  marketValue: number | null;
  dateAcquired: number | null;
  fipsCode: string | null;
  county: string | null;
  taxYear: number | null;
  
  // Address
  address: Address;
  zpid: number;

  latitude: number | null;
  longitude: number | null;

  // Distance to City
  timeToCity: string | null;
  distanceToCity: string | null;
  
  // Analysis and Comparisons
  priceComparisons?: PriceEstimate[];
  predicted_price?: string | null;
  confidence_score?: string | null;
  price_reasoning?: string | null;
  
  // Acre Prices
  acre_prices?: AcrePriceData[];
}

export interface PropertySearchResult {
  zpid: string;
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
  latitude: number;
  longitude: number;
}
