import * as A from "astronomy-engine";
import { deg, norm360 } from "../math";
import type { PlanetId } from "../types";
import type { EphemerisProvider } from "./provider";

const BODY: Record<PlanetId, A.Body> = {
  sun: A.Body.Sun,
  moon: A.Body.Moon,
  mercury: A.Body.Mercury,
  venus: A.Body.Venus,
  mars: A.Body.Mars,
  jupiter: A.Body.Jupiter,
  saturn: A.Body.Saturn,
  uranus: A.Body.Uranus,
  neptune: A.Body.Neptune,
  pluto: A.Body.Pluto,
};

export const astronomyEngineProvider: EphemerisProvider = {
  apparentLongitude(body, date) {
    const t = A.MakeTime(date);
    // Vetor geocêntrico (com tempo de luz e aberração) no equador J2000...
    const eqj = A.GeoVector(BODY[body], t, true);
    // ...girado para a eclíptica VERDADEIRA da data (precessão + nutação).
    const ect = A.RotateVector(A.Rotation_EQJ_ECT(t), eqj);
    return norm360(deg(Math.atan2(ect.y, ect.x)));
  },
  greenwichApparentSiderealTime(date) {
    return A.SiderealTime(date);
  },
  trueObliquity(date) {
    return A.e_tilt(A.MakeTime(date)).tobl;
  },
  centuriesTT(date) {
    return A.MakeTime(date).tt / 36525;
  },
  nutationInLongitude(date) {
    return A.e_tilt(A.MakeTime(date)).dpsi / 3600;
  },
};
