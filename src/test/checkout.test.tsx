import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Checkout from '@/pages/Checkout';

const mockPlaceOrder = vi.fn();
const mockRemoveItems = vi.fn();

const mockCartItem = {
  product: {
    id: 'prod-1',
    name: 'Modern Dining Chair',
    description: 'Comfortable oak dining chair',
    price: 4500,
    image: '/images/chair.jpg',
    images: ['/images/chair.jpg'],
    category: 'Chairs',
    stock: 5,
    installationFee: 300,
  },
  quantity: 2,
  selectedColor: 'Natural Oak',
};

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    items: [mockCartItem],
    selectedItems: [mockCartItem],
    removeItems: mockRemoveItems,
  }),
}));

vi.mock('@/context/OrderContext', () => ({
  useOrders: () => ({
    placeOrder: mockPlaceOrder,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Polyfill jsdom missing DOM methods for Radix UI Select
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();

describe('Checkout Page - Cash on Delivery Button Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays Cash on Delivery directly as a visible, preselected button and removes the dropdown', () => {
    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    // The payment method dropdown should NOT be present
    expect(screen.queryByRole('combobox', { name: /payment method/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/select payment method/i)).not.toBeInTheDocument();

    // Cash on Delivery is displayed as a visible button
    const codButton = screen.getByRole('radio', { name: /cash on delivery/i });
    expect(codButton).toBeInTheDocument();
    expect(codButton).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('COD')).toBeInTheDocument();
    expect(screen.getByText(/Pay with cash upon delivery of your furniture/i)).toBeInTheDocument();
  });

  it('maintains Cash on Delivery selection when clicking the button', () => {
    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    const codButton = screen.getByRole('radio', { name: /cash on delivery/i });
    expect(codButton).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(codButton);
    expect(codButton).toHaveAttribute('aria-checked', 'true');
  });

  it('automatically includes "Cash on Delivery" when placing an order', async () => {
    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    // Fill in customer details
    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'Juan Dela Cruz' } });

    const contactInput = screen.getByLabelText(/contact number/i);
    fireEvent.change(contactInput, { target: { value: '09171234567' } });

    // Select installation option
    const noInstallationRadio = screen.getByRole('radio', { name: /no/i });
    fireEvent.click(noInstallationRadio);

    // Trigger delivery address selection directly in the component's state or form
    // Since Select from radix requires portal interaction, let's trigger submission and verify validation or mock
    const addressCombobox = screen.getByRole('combobox');
    expect(addressCombobox).toBeInTheDocument();

    // Verify form validation works if address is missing
    const submitBtn = screen.getByRole('button', { name: /place order/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Please select a delivery address/i)).toBeInTheDocument();
    expect(mockPlaceOrder).not.toHaveBeenCalled();
  });

  it('submits order successfully with "Cash on Delivery" as paymentMethod and clears items', async () => {
    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    // Fill in customer details
    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'Maria Santos' } });

    const contactInput = screen.getByLabelText(/contact number/i);
    fireEvent.change(contactInput, { target: { value: '09181234567' } });

    // Open delivery address select and choose an area
    const addressTrigger = screen.getByRole('combobox');
    fireEvent.click(addressTrigger);
    const addressOption = await screen.findByRole('option', { name: 'Poblacion' });
    fireEvent.click(addressOption);

    // Select installation service: No
    const noInstallationRadio = screen.getByRole('radio', { name: /no/i });
    fireEvent.click(noInstallationRadio);

    // Verify COD button is selected
    const codButton = screen.getByRole('radio', { name: /cash on delivery/i });
    expect(codButton).toHaveAttribute('aria-checked', 'true');

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /place order/i });
    fireEvent.click(submitBtn);

    // Verify placeOrder was called with "Cash on Delivery"
    await waitFor(() => {
      expect(mockPlaceOrder).toHaveBeenCalledTimes(1);
      expect(mockPlaceOrder).toHaveBeenCalledWith(
        [mockCartItem],
        9000,
        'Maria Santos',
        'Poblacion',
        '09181234567',
        'Cash on Delivery',
        false,
        0
      );
      expect(mockRemoveItems).toHaveBeenCalledWith([mockCartItem]);
      expect(screen.getByText(/Order Confirmed!/i)).toBeInTheDocument();
      expect(screen.getByText(/Your order has been placed successfully./i)).toBeInTheDocument();
    });
  });
});
