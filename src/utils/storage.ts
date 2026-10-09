import { BulkBottle, CylinderProfile, ExpenditureRecord, RefillTransaction, StationSettings } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'gastrack_transactions_v5',
  BULK_BOTTLES: 'gastrack_bulk_bottles_v5',
  CYLINDERS: 'gastrack_cylinders_v5',
  EXPENDITURES: 'gastrack_expenditures_v5',
  SETTINGS: 'gastrack_settings_v5',
};

export const DEFAULT_SETTINGS: StationSettings = {
  stationName: 'LPG Refill Station',
  stationTagline: '',
  stationAddress: '',
  stationPhone: '',
  currencySymbol: '₦',
  currentGasPricePerKg: 1600, // standard current rate
  wholesaleCostPerKg: 1250,
  bulkStorageCapacityKg: 5000,
  bulkStockRemainingKg: 5000,
  lowStockAlertKg: 600,
  autoDeductStockOnSale: true,
  receiptFooterMessage: '',
  operatorName: 'Operator',
  quickKgPresets: [3, 5, 6, 10, 12.5],
  quickNairaPresets: [1000, 2000, 3000, 5000, 7000],
};

// Clean starting state: Single fresh 55kg bulk supply bottle with NO mock transactions or expenses
export const INITIAL_BULK_BOTTLES: BulkBottle[] = [
  {
    id: 'BOTTLE-001',
    name: 'A white one',
    totalCapacityKg: 55.0,
    remainingKg: 55.0, // starts full at 55.00 kg
    tareWeightKg: 42.0,
    status: 'active',
    startedAt: new Date().toISOString(),
    totalDispensedKg: 0.0,
    totalRevenueGenerated: 0,
    costPrice: 0,
    notes: 'Active 55kg bulk supply bottle',
  },
];

const INITIAL_CYLINDERS: CylinderProfile[] = [];
const INITIAL_TRANSACTIONS: RefillTransaction[] = [];
const INITIAL_EXPENDITURES: ExpenditureRecord[] = [];

export const loadStoredData = () => {
  try {
    const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const transactions: RefillTransaction[] = rawTx ? JSON.parse(rawTx) : INITIAL_TRANSACTIONS;

    const rawBottles = localStorage.getItem(STORAGE_KEYS.BULK_BOTTLES);
    const bulkBottles: BulkBottle[] = rawBottles ? JSON.parse(rawBottles) : INITIAL_BULK_BOTTLES;

    const rawCylinders = localStorage.getItem(STORAGE_KEYS.CYLINDERS);
    const cylinders: CylinderProfile[] = rawCylinders ? JSON.parse(rawCylinders) : INITIAL_CYLINDERS;

    const rawExp = localStorage.getItem(STORAGE_KEYS.EXPENDITURES);
    const expenditures: ExpenditureRecord[] = rawExp ? JSON.parse(rawExp) : INITIAL_EXPENDITURES;

    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    let settings: StationSettings = rawSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) } : DEFAULT_SETTINGS;
    // Strictly clear any mock street, town, or address details
    settings.stationAddress = '';
    settings.stationTagline = '';
    settings.receiptFooterMessage = '';

    return { transactions, bulkBottles, cylinders, expenditures, settings };
  } catch (err) {
    console.error('Error loading stored gas station data:', err);
    return {
      transactions: INITIAL_TRANSACTIONS,
      bulkBottles: INITIAL_BULK_BOTTLES,
      cylinders: INITIAL_CYLINDERS,
      expenditures: INITIAL_EXPENDITURES,
      settings: DEFAULT_SETTINGS,
    };
  }
};

export const saveTransactions = (transactions: RefillTransaction[]) => {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
};

export const saveBulkBottles = (bottles: BulkBottle[]) => {
  localStorage.setItem(STORAGE_KEYS.BULK_BOTTLES, JSON.stringify(bottles));
};

export const saveCylinders = (cylinders: CylinderProfile[]) => {
  localStorage.setItem(STORAGE_KEYS.CYLINDERS, JSON.stringify(cylinders));
};

export const saveExpenditures = (expenditures: ExpenditureRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.EXPENDITURES, JSON.stringify(expenditures));
};

export const saveSettings = (settings: StationSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const resetAllDataToDefaults = () => {
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.BULK_BOTTLES);
  localStorage.removeItem(STORAGE_KEYS.CYLINDERS);
  localStorage.removeItem(STORAGE_KEYS.EXPENDITURES);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  return {
    transactions: INITIAL_TRANSACTIONS,
    bulkBottles: INITIAL_BULK_BOTTLES,
    cylinders: INITIAL_CYLINDERS,
    expenditures: INITIAL_EXPENDITURES,
    settings: DEFAULT_SETTINGS,
  };
};
