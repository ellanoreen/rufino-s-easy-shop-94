import { Product, Order } from '@/types';

export const products: Product[] = [
  {
    id: '1', name: 'Meridian Sofa', description: 'A luxurious mid-century modern sofa with premium velvet upholstery and solid walnut legs. Perfect for contemporary living rooms.', price: 24999, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', category: 'Living Room', stock: 8, featured: true,
    sizes: ['2-Seater', '3-Seater', 'L-Shape'],
    colors: ['Gray', 'Navy Blue', 'Forest Green'],
  },
  {
    id: '2', name: 'Walnut Dining Table', description: 'Handcrafted solid walnut dining table seating 6-8 guests. Elegant grain patterns make each piece unique.', price: 18999, image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600', category: 'Dining', stock: 5, featured: true,
    sizes: ['4-Seater', '6-Seater', '8-Seater'],
    colors: ['Natural Walnut', 'Dark Walnut', 'Honey Oak'],
  },
  {
    id: '3', name: 'Cloud Bed Frame', description: 'Upholstered platform bed frame with a floating silhouette and cushioned headboard. Available in queen and king.', price: 15999, image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600', category: 'Bedroom', stock: 12,
    sizes: ['Single', 'Queen', 'King'],
    colors: ['Cream', 'Light Gray', 'Charcoal'],
  },
  {
    id: '4', name: 'Eames Office Chair', description: 'Ergonomic office chair inspired by mid-century design. Full-grain leather with adjustable height and tilt.', price: 12499, image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600', category: 'Office', stock: 15, featured: true,
    sizes: ['Standard', 'Tall'],
    colors: ['Black', 'Brown', 'White'],
  },
  {
    id: '5', name: 'Rattan Lounge Chair', description: 'Natural rattan lounge chair perfect for patios and sunrooms. Handwoven with weather-resistant finish.', price: 8999, image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600', category: 'Outdoor', stock: 7,
    sizes: ['Standard'],
    colors: ['Natural', 'White Wash', 'Black'],
  },
  {
    id: '6', name: 'Marble Coffee Table', description: 'Italian Carrara marble top with brushed brass base. A statement piece for any living space.', price: 13499, image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600', category: 'Living Room', stock: 4, featured: true,
    sizes: ['Small (80cm)', 'Large (120cm)'],
    colors: ['White Marble', 'Black Marble'],
  },
  {
    id: '7', name: 'Teak Bookshelf', description: 'Solid teak wood bookshelf with adjustable shelves. Scandinavian-inspired minimalist design.', price: 9999, image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600', category: 'Living Room', stock: 10,
    sizes: ['3-Tier', '5-Tier'],
    colors: ['Natural Teak', 'Walnut', 'White'],
  },
  {
    id: '8', name: 'Velvet Dining Chair Set', description: 'Set of 4 velvet upholstered dining chairs with gold-tone legs. Comfortable and elegant.', price: 11999, image: 'https://images.unsplash.com/photo-1551298370-9d3d53740c72?w=600', category: 'Dining', stock: 6,
    sizes: ['Set of 2', 'Set of 4', 'Set of 6'],
    colors: ['Emerald', 'Blush Pink', 'Navy'],
  },
  {
    id: '9', name: 'Standing Desk', description: 'Electric height-adjustable standing desk with bamboo top. Programmable presets and cable management.', price: 14999, image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600', category: 'Office', stock: 9,
    sizes: ['120cm', '140cm', '160cm'],
    colors: ['Bamboo Natural', 'White', 'Black'],
  },
  {
    id: '10', name: 'Nightstand Pair', description: 'Set of 2 bedside nightstands in warm oak finish. Two drawers with soft-close mechanism.', price: 5999, image: 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600', category: 'Bedroom', stock: 14,
    sizes: ['Standard'],
    colors: ['Oak', 'Walnut', 'White'],
  },
  {
    id: '11', name: 'Outdoor Dining Set', description: 'Weather-resistant aluminum dining set for 6. Includes table and chairs with cushions.', price: 22999, image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600', category: 'Outdoor', stock: 3,
    sizes: ['4-Seater', '6-Seater'],
    colors: ['Gray', 'White', 'Anthracite'],
  },
  {
    id: '12', name: 'Linen Accent Chair', description: 'French linen accent chair with solid oak frame. Timeless silhouette for reading nooks.', price: 7499, image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600', category: 'Living Room', stock: 11,
    sizes: ['Standard'],
    colors: ['Oatmeal', 'Sage', 'Dusty Rose'],
  },
];

export const sampleOrders: Order[] = [
  {
    id: 'ORD-001', items: [{ product: products[0], quantity: 1, selectedSize: '3-Seater', selectedColor: 'Gray' }, { product: products[5], quantity: 1, selectedSize: 'Large (120cm)', selectedColor: 'White Marble' }], total: 38498, status: 'Completed', customerName: 'Maria Santos', address: '123 Rizal Ave, Manila', contact: '09171234567', paymentMethod: 'GCash', date: '2026-02-01', expectedDeliveryDate: '2026-02-15',
  },
  {
    id: 'ORD-002', items: [{ product: products[3], quantity: 2, selectedSize: 'Standard', selectedColor: 'Black' }], total: 24998, status: 'Shipped', customerName: 'Juan Dela Cruz', address: '456 EDSA, Quezon City', contact: '09181234567', paymentMethod: 'Cash on Delivery', date: '2026-02-05', expectedDeliveryDate: '2026-02-19',
  },
  {
    id: 'ORD-003', items: [{ product: products[1], quantity: 1, selectedSize: '6-Seater', selectedColor: 'Natural Walnut' }, { product: products[7], quantity: 1, selectedSize: 'Set of 4', selectedColor: 'Emerald' }], total: 30998, status: 'Pending', customerName: 'Ana Reyes', address: '789 Ayala Blvd, Makati', contact: '09191234567', paymentMethod: 'Bank Transfer', date: '2026-02-09', expectedDeliveryDate: '2026-02-23',
  },
  {
    id: 'ORD-004', items: [{ product: products[4], quantity: 1, selectedSize: 'Standard', selectedColor: 'Natural' }], total: 8999, status: 'Cancelled', customerName: 'Pedro Garcia', address: '321 Bonifacio St, Taguig', contact: '09201234567', paymentMethod: 'GCash', date: '2026-02-10', expectedDeliveryDate: '2026-02-24',
  },
];
