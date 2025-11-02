
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingChunks?: any[];
}

export interface Collector {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact: {
    person?: string;
    phone?: string;
    email?: string;
  };
  hours: string;
  accepted_waste: string[];
}
