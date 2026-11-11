declare module "tz-lookup" {
  /** Devolve o nome IANA do fuso de uma coordenada (lança erro se inválida). */
  export default function tzlookup(lat: number, lon: number): string;
}
