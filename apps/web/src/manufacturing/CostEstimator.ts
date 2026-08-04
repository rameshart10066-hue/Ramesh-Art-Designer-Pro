/**
 * Cost Estimator
 *
 * Full production cost calculation with editable formulas.
 * Covers material, machine time, electricity, labor, glue, packing, transport, profit.
 */

export interface CostFormulas {
  materialCostPerSqMm: number;
  machineRatePerHour: number;
  electricityRatePerHour: number;
  laborRatePerHour: number;
  glueCostPerMl: number;
  packingCostPerM3: number;
  transportCostPerKm: number;
  transportDistance: number;
  profitMargin: number;   // 0-1
  taxRate: number;        // 0-1
}

export const DEFAULT_FORMULAS: CostFormulas = {
  materialCostPerSqMm: 0.00045,
  machineRatePerHour: 500,
  electricityRatePerHour: 50,
  laborRatePerHour: 300,
  glueCostPerMl: 0.5,
  packingCostPerM3: 200,
  transportCostPerKm: 15,
  transportDistance: 20,
  profitMargin: 0.2,
  taxRate: 0.18,
};

export interface CostBreakdown {
  materialCost: number;
  machineCost: number;
  electricityCost: number;
  laborCost: number;
  glueCost: number;
  packingCost: number;
  transportCost: number;
  subtotal: number;
  profitAmount: number;
  taxAmount: number;
  total: number;
  formatted: Record<string, string>;
}

export function calculateCost(
  totalArea: number,
  totalCutLength: number,
  glueMl: number,
  machineTimeMinutes: number,
  formulas: CostFormulas = DEFAULT_FORMULAS,
): CostBreakdown {
  const materialCost = Math.round(totalArea * formulas.materialCostPerSqMm);
  const machineTimeHours = machineTimeMinutes / 60;
  const machineCost = Math.round(machineTimeHours * formulas.machineRatePerHour);
  const electricityCost = Math.round(machineTimeHours * formulas.electricityRatePerHour);
  const laborCost = Math.round(machineTimeHours * formulas.laborRatePerHour);
  const glueCost = Math.round(glueMl * formulas.glueCostPerMl);
  const packingCost = Math.round((totalArea / 1_000_000) * formulas.packingCostPerM3);
  const transportCost = Math.round(formulas.transportDistance * formulas.transportCostPerKm);
  const subtotal = materialCost + machineCost + electricityCost + laborCost + glueCost + packingCost + transportCost;
  const profitAmount = Math.round(subtotal * formulas.profitMargin);
  const taxAmount = Math.round((subtotal + profitAmount) * formulas.taxRate);
  const total = subtotal + profitAmount + taxAmount;

  return {
    materialCost,
    machineCost,
    electricityCost,
    laborCost,
    glueCost,
    packingCost,
    transportCost,
    subtotal,
    profitAmount,
    taxAmount,
    total,
    formatted: {
      materialCost: `₹${materialCost.toLocaleString("en-IN")}`,
      machineCost: `₹${machineCost.toLocaleString("en-IN")}`,
      electricityCost: `₹${electricityCost.toLocaleString("en-IN")}`,
      laborCost: `₹${laborCost.toLocaleString("en-IN")}`,
      glueCost: `₹${glueCost.toLocaleString("en-IN")}`,
      packingCost: `₹${packingCost.toLocaleString("en-IN")}`,
      transportCost: `₹${transportCost.toLocaleString("en-IN")}`,
      subtotal: `₹${subtotal.toLocaleString("en-IN")}`,
      profitAmount: `₹${profitAmount.toLocaleString("en-IN")}`,
      taxAmount: `₹${taxAmount.toLocaleString("en-IN")}`,
      total: `₹${total.toLocaleString("en-IN")}`,
    },
  };
}
