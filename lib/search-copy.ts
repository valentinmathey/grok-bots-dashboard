export function resultCountLabel(count: number, q: string): string {
  const noun = count === 1 ? "resultado" : "resultados";
  return q ? `${count} ${noun} para “${q}”` : `${count} ${noun}`;
}

export function emptyResultLabel(q: string): string {
  return q ? `No encontramos nada para “${q}”` : "No encontramos nada con ese filtro";
}
