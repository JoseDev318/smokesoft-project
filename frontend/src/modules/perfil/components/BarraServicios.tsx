import { SERVICIOS } from "@/shared/constants/navegacion";

/**
 * Barra de servicios de confianza. Es la única parte de perfil.html que sí
 * tenía CSS en el guía (estilosServicios.css), así que se conserva tal cual:
 * fondo negro, borde inferior cian de 3px y medallones circulares cian.
 */
export function BarraServicios() {
  return (
    <div className="barra-servicios">
      {SERVICIOS.map((servicio) => (
        <div key={servicio.titulo} className="mx-5 my-2.5 flex max-w-[250px] items-center">
          <div
            className="mr-2.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-acento text-[1.2rem] font-bold text-sobre-acento"
            aria-hidden="true"
          >
            {servicio.icono}
          </div>
          <div className="text-left">
            <h4 className="text-[0.95rem] text-acento">{servicio.titulo}</h4>
            <p className="text-[0.8rem] text-texto-secundario">{servicio.detalle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
