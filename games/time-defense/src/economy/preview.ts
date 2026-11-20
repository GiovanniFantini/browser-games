import { baseTowers, families, familyArt, fieldMaps } from "../field/catalog";
import type { Family, FieldMap } from "../field/catalog";
import { AttemptEconomy, towerDefinition, towerDefinitions } from "./model";
import type { BuiltTower, EconomyResult, TransactionQuote } from "./model";
import { createEconomyDialog } from "./dialog";
import { describeTower as stats } from "./description";
import { routeCoverage } from "../field/coverage";
import { fieldLegend } from "../field/legend";

let attemptSerial = 0;
export interface FieldTower {
  readonly uid: string;
  readonly slot: string;
  readonly family: Family;
  readonly node: string;
}
export function createEconomyPreview(
  container: HTMLElement,
  changed: () => void,
  announce: (text: string) => void,
  fallbackFocus: () => void,
  hooks: {
    onDialog?: () => void;
    onReset?: () => void;
    context?: () => "mission" | "lab";
    onTransaction?: (result: EconomyResult) => void;
    onSelect?: () => void;
  } = {},
) {
  container.innerHTML = `<h2 class="economy-heading">Preparazione in prova</h2><p id="economy-balance"></p><p id="economy-refund" class="field-hint"></p>
    <div class="economy-toolbar"><button id="economy-choose" type="button" aria-expanded="true">Difese e piazzole</button><button id="economy-compare" type="button" hidden>Confronta</button></div>
    <div id="economy-picker" class="economy-picker"><div id="economy-families" class="field-families" role="group" aria-label="Famiglia da costruire"></div><h3>Piazzole</h3><div id="economy-slots" class="field-slots" role="group" aria-label="Piazzole di costruzione"></div></div>
    <h2 id="economy-title" tabindex="-1">Scegli una difesa e una piazzola</h2><div id="economy-actions" class="economy-actions" role="group" aria-label="Azioni della difesa"></div>
    <div id="economy-inspection" class="economy-inspection" tabindex="0" aria-label="Statistiche e riavvio, area scorrevole"><p id="economy-runtime-state" class="field-hint" hidden></p><label id="economy-route-control" class="economy-route-control" hidden>Ispeziona percorso<select id="economy-route" aria-label="Itinerario da esaminare, non cambia il percorso delle creature"></select></label><p id="economy-coverage" class="field-hint" hidden></p><div id="economy-detail" class="economy-detail"></div><div id="economy-locked-actions" class="economy-locked-actions" role="group" aria-label="Miglioramenti bloccati"></div><button id="economy-reset" type="button">Ricomincia preparazione</button></div><p id="economy-action-hint" class="field-hint" hidden>Scorri per dettagli e Ricomincia.</p>`;
  const get = <T extends HTMLElement>(selector: string): T => {
    const result = container.querySelector<T>(selector);
    if (!result) throw new Error("Missing economy control");
    return result;
  };
  const balance = get<HTMLElement>("#economy-balance"),
    refund = get<HTMLElement>("#economy-refund"),
    picker = get<HTMLElement>("#economy-picker"),
    familyList = get<HTMLElement>("#economy-families"),
    slotList = get<HTMLElement>("#economy-slots"),
    heading = get<HTMLElement>("#economy-title"),
    detail = get<HTMLElement>("#economy-detail"),
    actions = get<HTMLElement>("#economy-actions"),
    choose = get<HTMLButtonElement>("#economy-choose"),
    compare = get<HTMLButtonElement>("#economy-compare");
  const dialog = createEconomyDialog(() => hooks.onDialog?.());
  let map: FieldMap | null = null,
    model: AttemptEconomy | null = null,
    enabled = false,
    pickerOpen = true,
    hasWaves = false,
    selectedSlot: string | null = null,
    selectedFamily: Family | null = null;
  let routeFilter: string | null = null;
  const routeSelect = get<HTMLSelectElement>("#economy-route");
  const visible = (element: HTMLElement): boolean =>
    element.isConnected && element.getClientRects().length > 0;
  function focusDetails(): void {
    if (visible(heading)) heading.focus();
    else fallbackFocus();
  }
  const children = (tower: BuiltTower) =>
    towerDefinitions.filter((node) => node.parent === tower.node);
  const unlockHint = (id: string): string => {
    const first = fieldMaps.findIndex((level) =>
        level.firstEntryTowers.includes(id),
      ),
      previous = fieldMaps[first - 1];
    return previous
      ? "Completa: " + previous.name + "."
      : "Non disponibile nell’arsenale di questa preparazione.";
  };
  function paragraph(text: string): void {
    const p = document.createElement("p");
    p.textContent = text;
    detail.append(p);
  }
  function coverageText(range: number): string {
    const slot = map?.slots.find((slot) => slot.id === selectedSlot);
    if (!slot || !map) return "";
    return (
      map.routes
        .filter((route) => !routeFilter || route.id === routeFilter)
        .map((route) => {
          const length = routeCoverage(route.points, slot, range).length;
          return (
            route.name.split(":")[0] +
            ": " +
            (length > 0.01
              ? (length < 1 ? "<1" : Math.round(length)) +
                " unità entro gittata"
              : "Nessuna copertura")
          );
        })
        .join(". ") + ". La gittata non garantisce danni."
    );
  }
  function transact(result: EconomyResult): void {
    hooks.onTransaction?.(result);
    announce(
      result.message + " Scintille disponibili: " + result.balance + ".",
    );
    update();
    changed();
    focusDetails();
  }
  function action(
    id: string,
    label: string,
    callback: () => void,
    reason = "",
    locked = false,
  ): void {
    const card = document.createElement("div");
    card.className = "economy-action-card";
    const button = document.createElement("button");
    button.type = "button";
    button.id = id;
    button.textContent = label;
    button.disabled = !enabled;
    if (reason) {
      button.setAttribute("aria-disabled", "true");
      button.title = reason;
      button.setAttribute("aria-label", label + ". " + reason);
    }
    button.addEventListener("click", (event) => {
      if (enabled && event.detail <= 1 && !dialog.isOpen()) callback();
    });
    card.append(button);
    if (locked && reason) {
      const p = document.createElement("p");
      p.className = "field-hint economy-action-reason";
      p.textContent = reason;
      card.append(p);
    }
    (locked ? get<HTMLElement>("#economy-locked-actions") : actions).append(
      card,
    );
    actions.dataset.count = String(actions.children.length);
  }
  function quoteDialog(quote: TransactionQuote): void {
    if (!model) return;
    const ledger = model,
      current = towerDefinition(quote.sourceNode);
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement.id
        : "";
    const target = quote.target ? towerDefinition(quote.target) : null;
    const siblings = target
      ? towerDefinitions
          .filter(
            (node) => node.parent === target.parent && node.id !== target.id,
          )
          .map((node) => node.name)
      : [];
    const opened = dialog.open({
      title:
        quote.action === "sell"
          ? "Vendere questa difesa?"
          : "Scegliere " + target!.name + "?",
      paragraphs:
        quote.action === "sell"
          ? [
              current.family +
                " · " +
                current.name +
                ", piazzola " +
                quote.slot +
                ". Investite " +
                quote.sourcePaid +
                " Scintille.",
              "Rimborso " +
                quote.refundPercent +
                "%: " +
                quote.amount +
                " Scintille. Saldo dopo la vendita: " +
                (ledger.balance + quote.amount) +
                ".",
              "La piazzola verrà liberata. Per costruire di nuovo servirà un nuovo acquisto.",
            ]
          : [
              "Costo aggiuntivo " +
                quote.amount +
                " Scintille. Investimento totale " +
                (quote.sourcePaid + quote.amount) +
                ". Saldo dopo la scelta: " +
                (ledger.balance - quote.amount) +
                ".",
              "Scelta esclusiva: questa difesa non potrà passare a " +
                siblings.join(", ") +
                " senza essere venduta e ricostruita.",
              stats(target!),
              "Profilo attuale: " + stats(current),
            ],
      confirmText:
        quote.action === "sell"
          ? "Vendi · +" + quote.amount
          : "Scegli " + target!.name + " · " + quote.amount,
      onConfirm: () => transact(ledger.confirm(quote)),
      onCancel: () => {
        ledger.cancel(quote);
        announce("Operazione annullata. Nessuna Scintilla spesa.");
      },
      restoreFocus: () => {
        const trigger = opener
          ? container.querySelector<HTMLElement>("#" + CSS.escape(opener))
          : null;
        if (trigger && visible(trigger) && ledger.byUid(quote.uid))
          trigger.focus();
        else focusDetails();
      },
    });
    if (!opened) ledger.cancel(quote);
  }
  function update(): void {
    if (!model || !map) return;
    get<HTMLElement>("#economy-runtime-state").hidden = true;
    balance.textContent = "Scintille: " + model.balance;
    refund.textContent =
      "Rimborso " +
      model.refundPercent +
      "%. " +
      (!model.firstWaveStarted
        ? "Dal primo avvio: 70%."
        : "Anche in pausa e negli intervalli.");
    choose.disabled = !enabled;
    choose.setAttribute("aria-expanded", String(pickerOpen));
    picker.hidden = !pickerOpen;
    for (const button of familyList.querySelectorAll<HTMLButtonElement>(
      "button",
    )) {
      button.disabled = !enabled;
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.family === selectedFamily),
      );
      const available = model.unlocked(button.dataset.family + "-base");
      button.setAttribute("aria-disabled", String(!available));
      const definition = baseTowers[button.dataset.family as Family];
      button.setAttribute(
        "aria-label",
        definition.family +
          ". " +
          (available
            ? "Costo " + definition.cost + " Scintille."
            : unlockHint(definition.id)),
      );
      const label = button.querySelector<HTMLElement>(".family-range");
      if (label)
        label.textContent = available
          ? baseTowers[button.dataset.family as Family].cost + " Scintille"
          : "Bloccata";
    }
    for (const button of slotList.querySelectorAll<HTMLButtonElement>(
      "button",
    )) {
      const tower = model.at(button.dataset.slot!);
      button.disabled = !enabled;
      button.textContent = button.dataset.slot! + (tower ? " ●" : "");
      button.classList.toggle("economy-occupied", Boolean(tower));
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.slot === selectedSlot),
      );
      button.setAttribute(
        "aria-label",
        "Piazzola " +
          button.dataset.slot +
          (tower
            ? ", occupata da " +
              towerDefinition(tower.node).family +
              " " +
              towerDefinition(tower.node).name
            : ", libera"),
      );
    }
    detail.replaceChildren();
    actions.replaceChildren();
    get<HTMLElement>("#economy-locked-actions").replaceChildren();
    const tower = selectedSlot ? model.at(selectedSlot) : null;
    heading.hidden = pickerOpen;
    detail.hidden = pickerOpen;
    actions.hidden = pickerOpen;
    const inspection = get<HTMLElement>("#economy-inspection");
    inspection.classList.toggle("picker-open", pickerOpen);
    inspection.tabIndex = pickerOpen ? -1 : 0;
    if (pickerOpen) inspection.removeAttribute("aria-label");
    else
      inspection.setAttribute(
        "aria-label",
        "Statistiche e riavvio, area scorrevole",
      );
    get<HTMLElement>("#economy-locked-actions").hidden = pickerOpen;
    compare.hidden =
      pickerOpen || (!tower && !(selectedSlot && selectedFamily));
    compare.disabled = !enabled;
    const range = tower
      ? towerDefinition(tower.node).range
      : selectedFamily
        ? baseTowers[selectedFamily].range
        : null;
    get<HTMLElement>("#economy-route-control").hidden =
      pickerOpen || !map || map.routes.length < 2 || range === null;
    routeSelect.disabled = !enabled;
    const coverage = get<HTMLElement>("#economy-coverage");
    coverage.hidden = pickerOpen || map.routes.length < 2 || range === null;
    coverage.textContent =
      range === null
        ? ""
        : "Legenda: Dettagli in basso. " + coverageText(range);
    if (tower)
      refund.textContent =
        "Vendendo: +" +
        model.refund(tower) +
        " Scintille (" +
        model.refundPercent +
        "%).";
    if (tower) {
      const node = towerDefinition(tower.node);
      heading.textContent =
        node.family + " · " + node.name + " · " + tower.slot;
      paragraph(stats(node));
      paragraph(
        "Investite " +
          tower.paid +
          " Scintille. Vendita: " +
          model.refund(tower) +
          " (" +
          model.refundPercent +
          "%).",
      );
      const next = children(tower);
      if (!next.length)
        paragraph(
          "Profilo finale. Per cambiare ramo serve vendere e ricostruire.",
        );
      for (const target of next) {
        const offer = model.upgradeOffer(tower.uid, target.id, tower.node);
        const reason = !model.unlocked(target.id)
          ? unlockHint(target.id)
          : offer.message;
        paragraph(
          target.name +
            ": costo " +
            target.cost +
            " Scintille, totale " +
            (tower.paid + target.cost) +
            ". " +
            target.note +
            ". " +
            (!offer.allowed ? reason : "Saldo dopo: " + offer.after + "."),
        );
        action(
          "economy-upgrade-" + target.id,
          target.name + " · Costo " + target.cost,
          () => {
            if (!model) return;
            if (!node.parent) transact(model.upgradeCommon(tower.uid, node.id));
            else {
              const quote = model.prepareBranch(tower.uid, target.id);
              if ("ok" in quote) transact(quote);
              else quoteDialog(quote);
            }
          },
          offer.allowed ? "" : reason,
          !model.unlocked(target.id),
        );
      }
      action("economy-sell", "Vendi · +" + model.refund(tower), () => {
        if (!model) return;
        const quote = model.prepareSell(tower.uid);
        if ("ok" in quote) transact(quote);
        else quoteDialog(quote);
      });
    } else if (selectedSlot && selectedFamily) {
      const base = baseTowers[selectedFamily],
        offer = model.buildOffer(selectedFamily, selectedSlot);
      heading.textContent = base.family + " · Piazzola " + selectedSlot;
      paragraph(stats(base));
      paragraph(
        "Costo " +
          offer.cost +
          " Scintille. " +
          (offer.allowed
            ? "Saldo dopo la costruzione: " + offer.after + "."
            : offer.message),
      );
      action(
        "economy-build",
        "Costruisci · " + offer.cost,
        () => {
          if (model && selectedSlot && selectedFamily)
            transact(model.build(selectedFamily, selectedSlot));
        },
        offer.allowed ? "" : offer.message,
      );
      action("economy-cancel", "Annulla", () => clearSelection());
    } else {
      heading.textContent = selectedSlot
        ? "Piazzola " + selectedSlot + " libera"
        : "Scegli una difesa e una piazzola";
      paragraph(
        "Scegli una famiglia, poi una piazzola libera. Soltanto Costruisci spende Scintille. " +
          (hasWaves
            ? "Le difese attaccano automaticamente quando ci sono creature in gittata."
            : "Le ondate non sono ancora disponibili."),
      );
      paragraph(
        hooks.context?.() === "mission"
          ? "Difese attualmente sbloccate. Ogni nuovo tentativo riparte con " +
              map.budget +
              " Scintille e " +
              map.stability +
              " Stabilità."
          : "Arsenale della prima visita. Cambiare ambientazione ripristina la preparazione, dopo conferma.",
      );
    }
    get<HTMLButtonElement>("#economy-reset").disabled = !enabled;
    updateScrollHint();
  }
  function updateScrollHint(): void {
    const reading = get<HTMLElement>("#economy-inspection"),
      hint = get<HTMLElement>("#economy-action-hint");
    hint.hidden =
      pickerOpen ||
      reading.scrollHeight <= reading.clientHeight + 1 ||
      reading.scrollTop + reading.clientHeight >= reading.scrollHeight - 1;
  }
  const reading = get<HTMLElement>("#economy-inspection");
  reading.addEventListener("scroll", updateScrollHint);
  new ResizeObserver(updateScrollHint).observe(reading);
  function clearSelection(): void {
    selectedSlot = null;
    selectedFamily = null;
    pickerOpen = true;
    update();
    changed();
    announce("Selezione annullata. Nessuna spesa.");
    choose.focus();
  }
  function selectSlot(id: string): void {
    if (!enabled || !map?.slots.some((slot) => slot.id === id)) return;
    hooks.onSelect?.();
    selectedSlot = id;
    pickerOpen = false;
    get<HTMLElement>("#economy-inspection").scrollTop = 0;
    update();
    changed();
    focusDetails();
    announce("Piazzola " + id + " selezionata. Nessuna spesa.");
  }
  for (const family of families) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.family = family;
    const image = document.createElement("img");
    image.src = familyArt[family];
    image.alt = "";
    image.width = image.height = 32;
    const label = document.createElement("span");
    label.textContent = baseTowers[family].family;
    const cost = document.createElement("span");
    cost.className = "family-range";
    label.append(cost);
    button.append(image, label);
    button.addEventListener("click", () => {
      if (!enabled || !model) return;
      if (!model.unlocked(family + "-base")) {
        announce(unlockHint(family + "-base"));
        return;
      }
      hooks.onSelect?.();
      selectedFamily = family;
      update();
      changed();
      announce(
        baseTowers[family].family +
          " selezionata. Scegli una piazzola, senza spesa.",
      );
    });
    familyList.append(button);
  }
  choose.addEventListener("click", () => {
    if (!enabled) return;
    pickerOpen = !pickerOpen;
    update();
    if (pickerOpen)
      familyList
        .querySelector<HTMLButtonElement>(
          selectedFamily ? '[data-family="' + selectedFamily + '"]' : "button",
        )
        ?.focus();
  });
  compare.addEventListener("click", () => {
    const tower = selectedSlot ? model?.at(selectedSlot) : null;
    if (!enabled || !model) return;
    if (!tower) {
      if (!selectedFamily || !selectedSlot) return;
      const base = baseTowers[selectedFamily];
      dialog.open({
        title: "Prima di costruire: " + base.family,
        paragraphs: [
          stats(base),
          "Costo " +
            base.cost +
            " Scintille. " +
            (selectedFamily === "nido"
              ? "Ruolo: incursioni fisiche con bersaglio fissato; ampio raggio di acquisizione."
              : "Confronta il raggio prima di spendere."),
          ...(map && map.routes.length > 1
            ? [coverageText(base.range), ...fieldLegend(map)]
            : []),
        ],
        restoreFocus: () => {
          if (visible(compare)) compare.focus();
          else fallbackFocus();
        },
      });
      return;
    }
    const current = towerDefinition(tower.node),
      paragraphs = [
        stats(current),
        "Investimento attuale: " + tower.paid + " Scintille.",
      ];
    if (map && map.routes.length > 1)
      paragraphs.push(coverageText(current.range), ...fieldLegend(map));
    for (const target of children(tower)) {
      const offer = model.upgradeOffer(tower.uid, target.id, tower.node);
      paragraphs.push(
        stats(target) +
          " Costo aggiuntivo " +
          target.cost +
          ", totale " +
          (tower.paid + target.cost) +
          ". " +
          (model.unlocked(target.id) ? offer.message : unlockHint(target.id)),
      );
    }
    dialog.open({
      title: "Confronta miglioramenti",
      paragraphs,
      restoreFocus: () => {
        if (visible(compare)) compare.focus();
        else fallbackFocus();
      },
    });
  });
  routeSelect.addEventListener("change", () => {
    if (!enabled) return;
    routeFilter = routeSelect.value || null;
    update();
    changed();
  });
  function requestLeave(onConfirm: () => void, restoreFocus: () => void): void {
    if (
      !model ||
      (!model.towers.length &&
        model.balance === model.initial &&
        !model.firstWaveStarted)
    ) {
      onConfirm();
      return;
    }
    dialog.open({
      title: hasWaves
        ? "Lasciare questo tentativo?"
        : "Lasciare questa preparazione?",
      paragraphs: [
        "Le difese attuali verranno rimosse. Scintille, stabilità e piazzole ripartiranno da capo. Non si avvia alcuna ondata.",
      ],
      confirmText: "Lascia preparazione",
      onConfirm,
      restoreFocus,
      onCancel: () => announce("Preparazione conservata. Nessuna spesa."),
    });
  }
  function startMap(next: FieldMap, ledger?: AttemptEconomy): void {
    hasWaves = Boolean(ledger);
    container.querySelector("h2")!.textContent = hasWaves
      ? "Difese della prova"
      : "Preparazione in prova";
    get<HTMLButtonElement>("#economy-reset").textContent = hasWaves
      ? "Ricomincia tentativo"
      : "Ricomincia preparazione";
    map = next;
    model =
      ledger ??
      new AttemptEconomy(
        "preparation:" + ++attemptSerial,
        map.budget,
        map.slots.map((slot) => slot.id),
        map.firstEntryTowers,
      );
    selectedSlot = null;
    selectedFamily = null;
    pickerOpen = true;
    slotList.replaceChildren();
    routeFilter = null;
    routeSelect.replaceChildren();
    for (const [value, label] of [
      ["", "Tutti i percorsi"],
      ...map.routes.map((route) => [route.id, route.name]),
    ]) {
      const option = document.createElement("option");
      option.value = value!;
      option.textContent = label!;
      routeSelect.append(option);
    }
    for (const slot of map.slots) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.slot = slot.id;
      button.textContent = slot.id;
      button.addEventListener("click", () => selectSlot(slot.id));
      slotList.append(button);
    }
    update();
    changed();
  }
  get<HTMLButtonElement>("#economy-reset").addEventListener(
    "click",
    (event) => {
      if (!enabled || event.detail > 1 || !map) return;
      const current = map;
      requestLeave(
        () => {
          if (hooks.onReset) hooks.onReset();
          else startMap(current);
          announce(
            "Preparazione ricominciata. Scintille: " + current.budget + ".",
          );
        },
        () => {
          const reset = get<HTMLButtonElement>("#economy-reset");
          if (visible(reset)) reset.focus();
          else fallbackFocus();
        },
      );
    },
  );
  return {
    setMap: startMap,
    refresh(): void {
      const id =
        document.activeElement instanceof HTMLElement &&
        container.contains(document.activeElement)
          ? document.activeElement.id
          : "";
      update();
      if (id)
        container
          .querySelector<HTMLElement>("#" + CSS.escape(id))
          ?.focus({ preventScroll: true });
    },
    selectedTower(): BuiltTower | null {
      return selectedSlot ? (model?.at(selectedSlot) ?? null) : null;
    },
    setRuntimeText(text: string): void {
      const field = get<HTMLElement>("#economy-runtime-state");
      field.hidden = !text || pickerOpen;
      if (field.textContent !== text) field.textContent = text;
    },
    setEnabled(value: boolean): void {
      if (enabled === value) return;
      enabled = value;
      update();
    },
    selectSlot,
    clearSelection,
    isDialogOpen: dialog.isOpen,
    requestLeave,
    selection(): {
      slot: string | null;
      family: Family | null;
      range: number | null;
      route: string | null;
    } {
      const tower = selectedSlot ? model?.at(selectedSlot) : null;
      return {
        slot: selectedSlot,
        family: tower ? (tower.node.split("-")[0] as Family) : selectedFamily,
        route: routeFilter,
        range: tower
          ? towerDefinition(tower.node).range
          : selectedFamily
            ? baseTowers[selectedFamily].range
            : null,
      };
    },
    towers(): readonly FieldTower[] {
      return (
        model?.towers.map((tower) => ({
          uid: tower.uid,
          slot: tower.slot,
          node: tower.node,
          family: tower.node.split("-")[0] as Family,
        })) ?? []
      );
    },
  };
}
