export function calculateTotalValue(
    portfolio: { updateAmount: string; updatePrice?: string }[]
  ): number {
    return portfolio.reduce((total, item) => {
      const amt = parseFloat(item.updateAmount);
      const prc = parseFloat(item.updatePrice ?? "0");
      return total + (isNaN(amt) || isNaN(prc) ? 0 : amt * prc);
    }, 0);
  }