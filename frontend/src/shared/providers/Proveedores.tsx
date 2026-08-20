"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ErrorApi } from "@/shared/api/errores";
import { ProveedorSesion } from "@/modules/auth/context/ProveedorSesion";
import { ProveedorCarrito } from "@/modules/carrito/context/ProveedorCarrito";
import { ProveedorAvisos } from "./ProveedorAvisos";

function crearQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        /**
         * No reintentar los errores que YA respondió el servidor.
         *
         * Importa especialmente con este backend: sin capa de validación, un
         * campo faltante sale como 500. Reintentarlo solo duplica el error de
         * Postgres y confunde el diagnóstico. Los fallos de red sí se
         * reintentan una vez.
         */
        retry: (intentos, error) => intentos < 1 && !(error instanceof ErrorApi),
      },
      mutations: {
        retry: false, // nunca reintentar una escritura: podría duplicarla
      },
    },
  });
}

export function Proveedores({ children }: { children: React.ReactNode }) {
  // useState y no una constante de módulo: así cada pestaña/renderizado tiene su
  // propio cliente y la caché de un usuario no se filtra a otro.
  const [queryClient] = useState(crearQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ProveedorAvisos>
        <ProveedorSesion>
          <ProveedorCarrito>{children}</ProveedorCarrito>
        </ProveedorSesion>
      </ProveedorAvisos>
    </QueryClientProvider>
  );
}
