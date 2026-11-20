import data from "../../docs/dati-nemici.json";

const boss = data.enemies.find((enemy) => enemy.id === "custode")!;
const support = data.enemies.find((enemy) => enemy.id === "richiamo")!;
const roar = boss.roar!,
  tail = boss.tail!,
  phases = boss.phases!;
export const value = (number: number): string =>
  number.toLocaleString("it-IT", { maximumFractionDigits: 6 });
const names = (ids: readonly string[]): string =>
  ids
    .map((id) => data.enemies.find((enemy) => enemy.id === id)!.name)
    .join(", ");
export const bossThresholds = phases
  .slice(1)
  .map((phase) => value(phase.atMostCharge!))
  .join(" e ");
export const bossTailWarning = `La coda colpisce al massimo ${tail.maxTargets} torri. Gli attacchi già partiti continuano.`;
export const supportDetails = `Segnali: S = Supporto; S ! e cerchio tratteggiato = preavviso; S ))) e cerchio continuo = canto. Doppie frecce = accelerazione +${value((support.speedMultiplier! - 1) * 100)}%. Il Richiamo accelera ${names(support.affectedFamilies!)} entro ${value(support.radius!)} unità, per ${value(support.activeDuration!)} s, dopo ${value(support.windup!)} s di preavviso. Ambra immobilizza ma non silenzia.`;
export const bossDetails: readonly string[] = [
  `Custode: Carica ${value(boss.charge)}, Protezione fisica base ${value(boss.physicalProtection)}% in tutte le fasi. Sopra ${value(phases[0]!.aboveCharge)}: velocità ${value(phases[0]!.speed)}. Da ${value(phases[1]!.atMostCharge!)} a oltre ${value(phases[1]!.aboveCharge)}: ruggito, primo avviso dopo ${value(roar.firstDelay)} s dal cambio fase, preavviso ${value(roar.windup)} s, +${value((roar.speedMultiplier - 1) * 100)}% per ${value(roar.duration)} s entro ${value(roar.radius)} unità solo a ${names(roar.affectedFamilies)}. Periodo ${value(roar.period)} s fra inizi degli avvisi. Celerità non cumulabile con Richiamo.`,
  `Da ${value(phases[2]!.atMostCharge!)} a oltre zero: velocità ${value(phases[2]!.speed)}. Coda al posto del ruggito: dopo ${value(tail.firstDelay)} s individua fino a ${tail.maxTargets} torri entro ${value(tail.radius)} unità, con preavviso ${value(tail.windup)} s. Le sospende per ${value(tail.duration)} s. Periodo ${value(tail.period)} s fra inizi degli avvisi; senza torri ammesse ritenta dopo ${value(tail.emptyRetry)} s. Esclude difese già sospese. Centro e ID fissati. Vendita non sostituisce il bersaglio, potenziamento conserva la minaccia. Gli attacchi già partiti continuano. Ambra non silenzia.`,
  `Se il Custode raggiunge il portale perdi subito, anche con Stabilità positiva. Liberarlo assegna ${value(boss.reward)} Scintille; per vincere devi risolvere anche tutte le altre creature e gli ingressi previsti.`,
];
