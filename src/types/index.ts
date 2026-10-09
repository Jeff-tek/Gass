export type TabType = 'fill' | 'bottles' | 'log' | 'stats' | 'expenses' | 'settings';

export type PaymentMethod = 'Cash' | 'Transfer' | 'POS';
export type PaymentStatus = 'Paid' | 'Partial' | 'Pending';

export interface BulkBottle {
  id: string;
  name: string; // e.g. "A white one", "Nipco 55kg Blue"
  totalCapacityKg: number; // default: 55.00
  remainingKg: number; // depletes with every fill from 55kg down to 0kg
  tareWeightKg?: number; // e.g. 42.00 kg
  status: 'active' | 'standby' | 'depleted';
  startedAt?: string; // ISO string
  depletedAt?: string; // ISO string
  totalDispensedKg: number;
  totalRevenueGenerated: number;
  costPrice: number; // cost to purchase the 55kg bulk gas (e.g. 68,750)
  varianceKg?: number; // capacity - totalDispensedKg (e.g. -0.5kg loss)
  notes?: string;
}

export interface RefillTransaction {
  id: string;
  receiptNumber: string;
  timestamp: string; // ISO string
  customerName: string;
  customerPhone: string;
  cylinderSizeKg: number; // customer's cylinder size e.g. 3, 5, 6, 12.5, 25
  cylinderLabel?: string;
  initialScaleReadingKg: number; // scale reading before dispensing
  refillKg: number; // gas dispensed
  targetScaleReadingKg: number; // scale reading to stop valve at
  pricePerKg: number; // e.g. 1600
  totalAmount: number; // refillKg * pricePerKg
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  bottleId?: string; // id of the bulk 55kg bottle used
  bottleName?: string; // name of the bulk bottle
  bottleRemainingAfterKg?: number; // remaining in bottle after this refill
  residualGasKg?: number;
  notes?: string;
  operatorName?: string;
}

export interface CylinderProfile {
  id: string;
  customerName: string;
  customerPhone: string;
  nominalCapacityKg: number; // 3, 5, 6, 12.5, 25, 50
  tareWeightKg: number; // stamped empty cylinder weight (e.g. 13.4 kg)
  brand: string; // e.g. "Total", "Oando", "Gasland", "Standard"
  serialNumber?: string;
  cylinderColor?: string;
  valveCondition: 'Good' | 'Fair' | 'Needs Washer Replacement' | 'Defective';
  manufactureYear?: number;
  lastRefillDate?: string;
  refillCount: number;
  notes?: string;
}

export type ExpenseCategory = 
  | 'Bulk Gas (Depot/Tanker)'
  | 'Generator Fuel & Diesel'
  | 'Power / NEPA Bill'
  | 'Staff Wages / Allowance'
  | 'Station Rent & Levies'
  | 'Maintenance & Spares'
  | 'Scale Calibration & Weights'
  | 'Transport & Logistics'
  | 'Station Consumables'
  | 'Other Expenses';

export interface ExpenditureRecord {
  id: string;
  timestamp: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'POS';
  receiptRef?: string;
  recordedBy?: string;
}

export interface StationSettings {
  stationName: string;
  stationTagline: string;
  stationAddress: string;
  stationPhone: string;
  currencySymbol: string;
  currentGasPricePerKg: number; // default: 1600
  wholesaleCostPerKg: number; // e.g. 1280 (for profit calculations)
  bulkStorageCapacityKg: number; // e.g. 5000 kg
  bulkStockRemainingKg: number; // e.g. 3650 kg
  lowStockAlertKg: number; // e.g. 600 kg
  autoDeductStockOnSale: boolean;
  receiptFooterMessage: string;
  operatorName: string;
  quickKgPresets: number[];
  quickNairaPresets: number[];
  monthlyBottleOffsets?: Record<string, number>; // e.g. { "2026-10": 3 } for manual bottle adjustments
}
