import { useEffect, useState } from "react";

/** Assina uma media query do CSS para o JSX poder decidir junto com o layout. */
export function useMediaQuery(consulta) {
  const [combina, setCombina] = useState(() => window.matchMedia(consulta).matches);

  useEffect(() => {
    const lista = window.matchMedia(consulta);
    const aoMudar = (evento) => setCombina(evento.matches);

    setCombina(lista.matches);
    lista.addEventListener("change", aoMudar);
    return () => lista.removeEventListener("change", aoMudar);
  }, [consulta]);

  return combina;
}
