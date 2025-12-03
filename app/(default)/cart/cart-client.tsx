// app/(default)/cart/cart-client.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Boundary } from '@/components/ui/boundary';

export default function CartClient() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <Boundary label="Shopping Cart">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Add some products to get started!</p>
          <Link
            href="/store"
            className="inline-block px-6 py-3 bg-gray-800 text-white rounded hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Continue Shopping
          </Link>
        </div>
      </Boundary>
    );
  }

  return (
    <Boundary label="Shopping Cart">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Shopping Cart</h1>

        <div className="space-y-4 mb-8">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.size && `Size: ${item.size}`} {item.color && `| Color: ${item.color}`}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  ${item.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded"
                >
                  -
                </button>
                <span className="w-8 text-center text-gray-900 dark:text-gray-100">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Total</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">${total.toFixed(2)}</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={clearCart}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Clear Cart
            </button>
            <Link
              href="/checkout"
              className="flex-1 text-center px-6 py-3 bg-gray-800 text-white rounded hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </Boundary>
  );
}