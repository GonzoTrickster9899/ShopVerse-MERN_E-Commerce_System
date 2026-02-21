import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'shopverse_cart';

const initialState = {
  items: [],
  coupon: null,
  shippingMethod: 'standard',
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item._id === action.payload._id &&
          JSON.stringify(item.selectedVariant) === JSON.stringify(action.payload.selectedVariant)
      );
      if (existingIndex >= 0) {
        const updated = [...state.items];
        updated[existingIndex].quantity += action.payload.quantity || 1;
        return { ...state, items: updated };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((_, i) => i !== action.payload) };
    case 'UPDATE_QUANTITY': {
      const updated = [...state.items];
      if (action.payload.quantity <= 0) {
        return { ...state, items: updated.filter((_, i) => i !== action.payload.index) };
      }
      updated[action.payload.index].quantity = action.payload.quantity;
      return { ...state, items: updated };
    }
    case 'APPLY_COUPON':
      return { ...state, coupon: action.payload };
    case 'REMOVE_COUPON':
      return { ...state, coupon: null };
    case 'SET_SHIPPING':
      return { ...state, shippingMethod: action.payload };
    case 'CLEAR_CART':
      return initialState;
    case 'LOAD_CART':
      return { ...initialState, ...action.payload };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) dispatch({ type: 'LOAD_CART', payload: JSON.parse(saved) });
    } catch {}
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = (product, quantity = 1, selectedVariant = null) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: product.images?.[0]?.url || 'https://placehold.co/100x100',
        stock: product.stock,
        quantity,
        selectedVariant,
      },
    });
  };

  const removeItem = (index) => dispatch({ type: 'REMOVE_ITEM', payload: index });
  const updateQuantity = (index, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { index, quantity } });
  const applyCoupon = (coupon) => dispatch({ type: 'APPLY_COUPON', payload: coupon });
  const removeCoupon = () => dispatch({ type: 'REMOVE_COUPON' });
  const setShipping = (method) => dispatch({ type: 'SET_SHIPPING', payload: method });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const shippingRates = { standard: 100, express: 250, overnight: 500, pickup: 0 };
  const shippingCost = shippingRates[state.shippingMethod] || 100;
  const discount = state.coupon?.discount || 0;
  const tax = Math.round((subtotal - discount) * 0.12 * 100) / 100;
  const total = Math.max(0, subtotal - discount + tax + shippingCost);

  return (
    <CartContext.Provider value={{
      items: state.items, coupon: state.coupon, shippingMethod: state.shippingMethod,
      cartCount, subtotal, shippingCost, discount, tax, total,
      addItem, removeItem, updateQuantity, applyCoupon, removeCoupon, setShipping, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
