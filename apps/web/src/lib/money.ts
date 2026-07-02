const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return formatter.format(amount);
}

export function formatPercentage(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
