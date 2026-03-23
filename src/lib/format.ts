export function formatPriceUsd(amount: number, isMonthlyRent = false): string {
  const opts: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  };
  const formatted = new Intl.NumberFormat("en-US", opts).format(amount);
  return isMonthlyRent ? `${formatted}/mo` : formatted;
}

export function formatSqft(n: number): string {
  return `${n.toLocaleString("en-US")} sqft`;
}
