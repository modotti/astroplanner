import { UserLocation } from "./location.model";

export interface UserCapturePlan {
  id: string;          // id do plano do usuário (pode ser UUID)
  targetId: string;    // id do alvo (vem do CapturePlan)
  date: string;        // ISO date (ex: "2025-12-03")
  location: UserLocation;   

  // Campos do formulário
  notes?: string;
  exposureSeconds: number | null;
  isoGain?: number | null;
  filters?: string;
  bortle: number | null;
  lights?: number | null;
  darks?: number | null;
  flats?: number | null;
  biases?: number | null;
  darkFlats?: number | null;
}