import { Collector } from '../types';

// TODO: Replace this placeholder data with the actual data from your Google Sheet.
// The data below has been expanded with examples from Brazil, as requested.
export const collectors: Collector[] = [
  {
    "name": "Green-Tech Recyclers",
    "address": "123 Recycle Rd, Eco City, CA 10101, USA",
    "latitude": 34.052235,
    "longitude": -118.243683,
    "contact": {
      "phone": "555-123-4567",
      "email": "info@greentech.com"
    },
    "hours": "Mon-Fri: 9am - 5pm",
    "accepted_waste": ["Laptops", "Phones", "Batteries", "Monitors"]
  },
  {
    "name": "Circuit Board Sanctuary",
    "address": "456 Component Ave, Techville, CA 20202, USA",
    "latitude": 34.1526,
    "longitude": -118.255,
    "contact": {
      "person": "John Doe",
      "email": "support@circuitsanctuary.org"
    },
    "hours": "Sat: 10am - 4pm",
    "accepted_waste": ["Circuit Boards", "Printers", "Cables", "Servers"]
  },
  {
    "name": "E-Waste Away",
    "address": "789 Power Dr, Grid City, GA 30303, USA",
    "latitude": 33.748997,
    "longitude": -84.387985,
    "contact": {
      "phone": "555-987-6543"
    },
    "hours": "Mon-Sat: 8am - 6pm",
    "accepted_waste": ["All consumer electronics"]
  },
  {
    "name": "Recicla Sampa Eletrônicos",
    "address": "Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200, Brazil",
    "latitude": -23.56135,
    "longitude": -46.65655,
    "contact": {
      "email": "contato@reciclasampa.com.br"
    },
    "hours": "Mon-Fri: 10am - 6pm",
    "accepted_waste": ["Computadores", "Celulares", "Tablets", "Periféricos"]
  },
  {
    "name": "E-lixo Zero RJ",
    "address": "R. da Carioca, 85 - Centro, Rio de Janeiro - RJ, 20050-008, Brazil",
    "latitude": -22.9035,
    "longitude": -43.1795,
    "contact": {
      "phone": "+55 (21) 99999-8888"
    },
    "hours": "Tue-Sat: 9am - 3pm",
    "accepted_waste": ["Televisores", "Pequenos eletrodomésticos", "Baterias"]
  },
  {
    "name": "BH Recicla Tech",
    "address": "Av. Afonso Pena, 1500 - Centro, Belo Horizonte - MG, 30130-005, Brazil",
    "latitude": -19.9227,
    "longitude": -43.9392,
    "contact": {
      "person": "Maria Silva"
    },
    "hours": "Mon-Sat: 8am - 12pm",
    "accepted_waste": ["Todos os eletrônicos de consumo"]
  }
];