import type { FieldMap } from "./catalog";
/** Text companion for the same IDs and range overlays rendered on the field. */
export function fieldLegend(map:FieldMap):readonly string[]{
  const text=["Legenda del campo. "+map.routeLegend],markers=map.landmarks??[];
  const split=markers.find(marker=>marker.id==="X"),merge=markers.find(marker=>marker.id==="Y");
  if(split&&merge)text.push(split.id+" è il bivio; "+merge.id+" è il ricongiungimento dei due itinerari.");
  if(merge&&!split)text.push(merge.id+" è il ricongiungimento dei due fronti prima del portale.");
  if(map.entries.length>1)text.push(map.entries.map(entry=>entry.id).join(" e ")+" sono ingressi. Le lettere singole indicano piazzole: I è una piazzola, distinta da I1 e I2.");
  const water=markers.filter(marker=>marker.id.startsWith("≈"));
  if(map.waterSegment&&water.length===2)text.push(water[0]!.id+" indica l’inizio del tratto immerso; "+water[1]!.id+" la fine. Questi confini non modificano velocità, danni o stati. Il solo ≈ accanto al Guado segnala che la creatura è ora immersa.");
  if(map.routes.length>1)text.push("Il tratto più spesso con le tacche mostra la parte del percorso entro la gittata della piazzola selezionata. È una copertura geometrica, non una garanzia di colpi o danni. Ispezionare un itinerario non cambia quello assegnato alle creature.");
  text.push("Torri semitrasparenti: lasciano vedere una creatura coperta. L’anello resta visibile; attacchi e stati non cambiano.");
  return text;
}
