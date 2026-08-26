export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  category: string;
  stock: number;
  featured?: boolean;
  sizes: string[];
  colors: string[];
  installationFee?: number;
  date?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  rating?: number;
  feedback?: string;
  customerName: string;
  address: string;
  contact: string;
  paymentMethod: string;
  installationSelected?: boolean;
  installationFee?: number;
  date: string;
  expectedDeliveryDate: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export type Category = 'All' | 'Living Room' | 'Bedroom' | 'Dining' | 'Office' | 'Outdoor';
