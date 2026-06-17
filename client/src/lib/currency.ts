import currency from 'currency.js';
import { apiRequest } from './queryClient';

const DEFAULT_CURRENCY = 'USD';

const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'AUD': 'A$', 'CAD': 'C$',
  'CHF': 'CHF', 'CNY': '¥', 'INR': '₹', 'KRW': '₩', 'SGD': 'S$', 'HKD': 'HK$',
  'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'NZD': 'NZ$', 'ZAR': 'R', 'BRL': 'R$',
  'MXN': 'MX$', 'AED': 'د.إ', 'SAR': '﷼', 'QAR': 'ر.ق', 'KWD': 'د.ك',
  'BHD': 'BD', 'OMR': 'ر.ع.', 'TRY': '₺', 'RUB': '₽', 'PLN': 'zł',
  'THB': '฿', 'MYR': 'RM', 'IDR': 'Rp', 'PHP': '₱', 'VND': '₫',
  'EGP': 'E£', 'NGN': '₦', 'KES': 'KSh', 'GHS': 'GH₵', 'PKR': '₨',
  'BDT': '৳', 'LKR': 'Rs', 'JOD': 'JD', 'IQD': 'ع.د',
};

let ratesCache: { rates: Record<string, number>; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

export function formatCurrency(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  return currency(amount, {
    symbol: getCurrencySymbol(currencyCode),
    precision: 0
  }).format();
}

function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}

async function fetchRates(): Promise<Record<string, number>> {
  if (ratesCache && Date.now() - ratesCache.fetchedAt < CACHE_TTL) {
    return ratesCache.rates;
  }

  try {
    const res = await apiRequest('GET', '/api/currency/rates');
    const data = await res.json();
    if (data.rates) {
      ratesCache = { rates: data.rates, fetchedAt: Date.now() };
      return data.rates;
    }
  } catch (err) {
    console.error('Failed to fetch exchange rates:', err);
  }

  if (ratesCache) return ratesCache.rates;
  return {};
}

export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  const rates = await fetchRates();
  const fromRate = fromCurrency === 'USD' ? 1 : rates[fromCurrency];
  const toRate = toCurrency === 'USD' ? 1 : rates[toCurrency];

  if (!fromRate || !toRate) {
    console.warn(`Exchange rate not available for ${fromCurrency} → ${toCurrency}`);
    return amount;
  }

  return (amount / fromRate) * toRate;
}
