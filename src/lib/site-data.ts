import car1 from "@/assets/car-1.jpg";
import car2 from "@/assets/car-2.jpg";
import car3 from "@/assets/car-3.jpg";
import car4 from "@/assets/car-4.jpg";
import car5 from "@/assets/car-5.jpg";
import car6 from "@/assets/car-6.jpg";

export const WHATSAPP_URL = "https://wa.me/5542999784395";
export const PHONE_DISPLAY = "(42) 99978-4395";
export const PHONE_TEL = "+5542999784395";
export const INSTAGRAM_URL = "https://www.instagram.com/excelencia.multimarcas/";
export const INSTAGRAM_HANDLE = "@excelencia.multimarcas";
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=100063737730879";
export const ADDRESS_LINE_1 = "R. Pres. João Café Filho, 200";
export const ADDRESS_LINE_2 = "São Basílio Magno, União da Vitória / PR";
export const ADDRESS_CEP = "84600-658";
export const ADDRESS_FULL = "R. Pres. João Café Filho, 200 - São Basílio Magno, União da Vitória - PR, 84600-658";
export const MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS_FULL)}&output=embed`;

export const vehicles = [
  { id: 1, image: car1, brand: "Toyota", model: "Corolla Cross XRE", year: 2023, km: "18.400", price: "R$ 149.900" },
  { id: 2, image: car2, brand: "Honda", model: "Civic Touring", year: 2022, km: "32.100", price: "R$ 139.900" },
  { id: 3, image: car3, brand: "Toyota", model: "Yaris Sedan XLS", year: 2023, km: "24.900", price: "R$ 98.500" },
  { id: 4, image: car4, brand: "Chevrolet", model: "Tracker Premier", year: 2023, km: "21.800", price: "R$ 132.900" },
  { id: 5, image: car5, brand: "Hyundai", model: "Creta Ultimate", year: 2024, km: "9.700", price: "R$ 154.900" },
  { id: 6, image: car6, brand: "BMW", model: "320i M Sport", year: 2022, km: "38.200", price: "R$ 219.900" },
] as const;

export const testimonials = [
  {
    name: "willian oliveira",
    role: "3 avaliações | 10 meses atrás",
    text: "Já comprei mais de 4 carros, sempre muito bem atendido!!! tanto na venda quanto no pós vendas! Super indico!!!",
    rating: 5,
  },
  {
    name: "jair wisniewski",
    role: "1 avaliação | 10 meses atrás",
    text: "Ótimo atendimento! Minha melhor escolha já sei aonde trocar de novo meu carro!",
    rating: 5,
  },
  {
    name: "james horacio de lima",
    role: "5 avaliações | 4 anos atrás",
    text: "Fui muito bem atendido. FECHEI 2 NEGOCIOS COM ELES",
    rating: 5,
  },
  {
    name: "Maristela Santos",
    role: "8 avaliações | 4 anos atrás",
    text: "Ótima excelente atendimento",
    rating: 5,
  },
  {
    name: "André Grenat",
    role: "Local Guide | 134 avaliações | 4 anos atrás",
    text: "Pessoal de primeira...",
    rating: 5,
  },
];
