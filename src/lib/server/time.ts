export function addDays(input: Date, days: number): Date {
  const result = new Date(input);
  result.setDate(result.getDate() + days);
  return result;
}
