/** Client-side usage accounting only, not a trusted billing or quota boundary. */
export async function generateThenCharge<T>(
  generate: () => Promise<T>,
  canAfford: () => boolean,
  charge: () => Promise<boolean>,
): Promise<T> {
  if (!canAfford()) throw new Error('Insufficient AI credits.');
  const result = await generate();
  if (!await charge()) throw new Error('The result could not be saved because the available AI credits changed.');
  return result;
}
