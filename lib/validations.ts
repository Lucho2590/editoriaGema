import { z } from "zod";

export const emailSchema = z.string().email("Email inválido");

export const passwordSchema = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres");

export const bookSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  author: z.string().min(1, "El autor es requerido"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  coverImage: z.string().url("URL de imagen inválida"),
  formats: z.object({
    pdf: z.boolean(),
    epub: z.boolean(),
    print: z.boolean(),
  }),
  pricePdf: z.number().min(0),
  priceEpub: z.number().min(0),
  pricePrint: z.number().min(0),
  stockPrint: z.number().min(0),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Nombre completo requerido"),
  street: z.string().min(5, "Dirección requerida"),
  city: z.string().min(2, "Ciudad requerida"),
  state: z.string().min(2, "Provincia requerida"),
  postalCode: z.string().min(4, "Código postal requerido"),
  country: z.string().length(2, "País requerido"),
  phone: z.string().optional(),
});

export const checkoutSchema = z.object({
  email: emailSchema,
  shippingAddress: shippingAddressSchema.optional(),
  paymentProvider: z.enum(["stripe", "mercadopago"]),
});

export type BookFormData = z.infer<typeof bookSchema>;
export type ShippingAddressFormData = z.infer<typeof shippingAddressSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
