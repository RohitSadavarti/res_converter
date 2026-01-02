import { type Student } from "@shared/schema";

export interface IStorage {
  // We can add methods to store conversion history in memory if needed
  // For now, it's mostly a pass-through as logic is client-side
  healthCheck(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  async healthCheck(): Promise<boolean> {
    return true;
  }
}

export const storage = new MemStorage();
