export interface MapPin {
  type: string;
  cords: {lat: number, lon: number};
  user_data: {name: string, last_name: string, phone: string};
  date: string;
  car_details: { brand: string, model: string, year: string, color: string, plates: string };
  service_details: { from: string, to: string};
}
