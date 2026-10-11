import { describe, expect, it } from "vitest";
import {
  eventPriceChip,
  hasEventFacts,
  parseEventFacts,
  stripEventFactLines,
} from "@/lib/event-facts";

const body = `Fecha y hora: Lunes 12/10/2026, 11:00 a 20:00 (ART)
Lugar: Espacio Arizu, Belgrano 1335, Godoy Cruz
Precio: Gratis (piden llevar un alimento no perecedero)
Inscripción: https://lu.ma/ldtb8901
Por qué te sirve: El evento tech más grande de Cuyo.`;

describe("event facts", () => {
  it("saca lugar, precio Gratis y no usa el párrafo corrido", () => {
    const facts = parseEventFacts(body);
    expect(facts.place).toMatch(/Espacio Arizu/i);
    expect(facts.price).toBe("Gratis");
    expect(hasEventFacts(facts)).toBe(true);
    expect(stripEventFactLines(body)).toMatch(/Por qué te sirve/);
    expect(stripEventFactLines(body)).not.toMatch(/^Lugar:/m);
  });

  it("prioriza details estructurados y normaliza precio", () => {
    expect(eventPriceChip("Free entry")).toBe("Gratis");
    const facts = parseEventFacts("sin labels", {
      location: "Mendoza",
      price_text: "entrada $0",
      modality: "Presencial",
    });
    expect(facts).toEqual({
      place: "Mendoza",
      price: "Gratis",
      modality: "Presencial",
    });
  });
});
