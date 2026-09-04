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
  deleted?: boolean;
  deletedAt?: string;
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
  status: 'Pending' | 'Confirmed' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
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
  deleted?: boolean;
  deletedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  customerId: string;
  customerName: string;
  customerEmail?: string;
  orderId?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ConversationSummary {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  lastMessage: Message;
  unreadCount: number;
  orderId?: string;
}

export type Category = 'All' | 'Living Room' | 'Bedroom' | 'Dining' | 'Office' | 'Outdoor';
