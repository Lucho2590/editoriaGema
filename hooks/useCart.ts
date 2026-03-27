import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Book, BookFormat, CartItem, getBookPrice } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (book: Book, format: BookFormat) => void;
  removeItem: (bookId: string, format: BookFormat) => void;
  updateQuantity: (bookId: string, format: BookFormat, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (book: Book, format: BookFormat) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.bookId === book.id && item.format === format
          );

          if (existingIndex >= 0) {
            // Item exists, increment quantity
            const newItems = [...state.items];
            newItems[existingIndex].quantity += 1;
            return { items: newItems };
          }

          // Add new item
          return {
            items: [
              ...state.items,
              {
                bookId: book.id,
                book,
                format,
                quantity: 1,
              },
            ],
          };
        });
      },

      removeItem: (bookId: string, format: BookFormat) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.bookId === bookId && item.format === format)
          ),
        }));
      },

      updateQuantity: (bookId: string, format: BookFormat, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) => !(item.bookId === bookId && item.format === format)
              ),
            };
          }

          return {
            items: state.items.map((item) =>
              item.bookId === bookId && item.format === format
                ? { ...item, quantity }
                : item
            ),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        const { items } = get();
        return items.reduce(
          (sum, item) => sum + getBookPrice(item.book, item.format) * item.quantity,
          0
        );
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "gema-cart",
    }
  )
);
