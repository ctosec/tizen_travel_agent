/** City name -> IATA airport/city code mapping for Amadeus API */
const AIRPORT_CODES: Record<string, string> = {
  // Europe
  Barcelona: 'BCN',
  Madrid: 'MAD',
  Rome: 'FCO',
  Milan: 'MXP',
  Venice: 'VCE',
  Florence: 'FLR',
  Paris: 'CDG',
  London: 'LHR',
  Berlin: 'BER',
  Munich: 'MUC',
  Frankfurt: 'FRA',
  Amsterdam: 'AMS',
  Vienna: 'VIE',
  Prague: 'PRG',
  Budapest: 'BUD',
  Lisbon: 'LIS',
  Athens: 'ATH',
  Istanbul: 'IST',
  Zurich: 'ZRH',
  Dublin: 'DUB',
  Brussels: 'BRU',
  Stockholm: 'ARN',
  Copenhagen: 'CPH',
  Oslo: 'OSL',
  Helsinki: 'HEL',
  Warsaw: 'WAW',
  Bucharest: 'OTP',
  // Asia
  Tokyo: 'NRT',
  Osaka: 'KIX',
  Bangkok: 'BKK',
  Singapore: 'SIN',
  'Hong Kong': 'HKG',
  Taipei: 'TPE',
  Hanoi: 'HAN',
  'Ho Chi Minh': 'SGN',
  Manila: 'MNL',
  'Kuala Lumpur': 'KUL',
  Jakarta: 'CGK',
  Delhi: 'DEL',
  Mumbai: 'BOM',
  Beijing: 'PEK',
  Shanghai: 'PVG',
  // Americas
  'New York': 'JFK',
  'Los Angeles': 'LAX',
  'San Francisco': 'SFO',
  Chicago: 'ORD',
  Miami: 'MIA',
  Toronto: 'YYZ',
  Vancouver: 'YVR',
  'Mexico City': 'MEX',
  'Sao Paulo': 'GRU',
  'Buenos Aires': 'EZE',
  Lima: 'LIM',
  // Oceania
  Sydney: 'SYD',
  Melbourne: 'MEL',
  Auckland: 'AKL',
  // Africa / Middle East
  Dubai: 'DXB',
  Cairo: 'CAI',
  Marrakech: 'RAK',
  'Cape Town': 'CPT',
  Nairobi: 'NBO',
};

/**
 * Get IATA airport code for a city. Falls back to first 3 letters uppercased.
 */
export function getAirportCode(city: string): string {
  return AIRPORT_CODES[city] || city.slice(0, 3).toUpperCase();
}
