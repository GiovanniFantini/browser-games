import { useId } from "react";
import { balance } from "@content/balance";
import { sumContributions } from "@engine/systems/attributes";
import type { AttributeSnapshot } from "@worker/protocol";
import { translate, type Language } from "../../i18n";
import { attributeBand, attributeTrend, formatNumber } from "../format";
import { FloatingTooltip, useFloatingTooltip } from "./FloatingTooltip";

const min = balance.attributes.min;
const span = balance.attributes.max - min;
const position = (value: number) => ((value - min) / span) * 100 + "%";

function Sparkline({
  values,
  label,
}: {
  values: readonly number[];
  label: string;
}) {
  const window = values;
  const start = Math.min(...window);
  const range = Math.max(0.4, Math.max(...window) - start);
  const points =
    window.length > 1
      ? window
          .map((value, index) =>
            [
              (index * 52) / (window.length - 1),
              14 - ((value - start) / range) * 12,
            ].join(","),
          )
          .join(" ")
      : "0,8 52,8";
  return (
    <svg
      className="sparkline"
      viewBox="0 0 52 16"
      role="img"
      aria-label={label}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function AttributeCard({
  attribute,
  compact,
  historySampleYears,
  language,
}: {
  attribute: AttributeSnapshot;
  compact: boolean;
  historySampleYears: number;
  language: Language;
}) {
  const tooltipId = useId();
  const tooltip = useFloatingTooltip<HTMLButtonElement>();
  const {
    id,
    active,
    nameKey,
    value,
    zone,
    pressure,
    target,
    contributions,
    history,
  } = attribute;
  const name = translate(language, nameKey);
  const direction =
    value < zone.min ? "below" : value > zone.max ? "above" : "within";
  const recentHistory = history.slice(
    -(Math.floor(100 / historySampleYears) + 1),
  );
  const trend = attributeTrend(recentHistory);
  const total = sumContributions(contributions);
  const sources = contributions
    .filter((entry) => entry.source === "base" || Math.abs(entry.amount) > 1e-6)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  if (compact)
    return (
      <article className="village-signal" data-zone={direction}>
        <span className="signal-emblem" aria-hidden="true">
          {direction === "within" ? "✓" : direction === "below" ? "↘" : "↗"}
        </span>
        <div>
          <span>{name}</span>
          <small>{translate(language, "attribute." + direction)}</small>
        </div>
        <Sparkline
          values={recentHistory}
          label={translate(
            language,
            trend === "steady" ? "attribute.stable" : "attribute." + trend,
          )}
        />
      </article>
    );
  return (
    <article
      className="attribute"
      data-attribute={id}
      data-active={active}
      data-band={attributeBand(value)}
      data-zone={direction}
      data-value={value}
    >
      <div className="attribute-line">
        <span className="attribute-name">{name}</span>
        {active ? (
          <>
            <span
              className="attribute-trend"
              title={translate(
                language,
                trend === "steady" ? "attribute.stable" : "attribute." + trend,
              )}
            >
              {trend === "rising" ? "↗" : trend === "falling" ? "↘" : "·"}
            </span>
            <Sparkline
              values={recentHistory}
              label={translate(language, "attribute.history")}
            />
            <span className="attribute-value">{Math.round(value)}</span>
            <span
              className="zone-icon"
              aria-label={translate(language, "attribute." + direction)}
            >
              {direction === "below" ? "▼" : direction === "above" ? "▲" : ""}
            </span>
            <div className="explain">
              <button
                ref={tooltip.anchor}
                type="button"
                className="explain-button"
                aria-label={name + " · " + translate(language, "attribute.why")}
                aria-describedby={tooltip.open ? tooltipId : undefined}
                {...tooltip.trigger}
              >
                ?
              </button>
              {tooltip.open && (
                <FloatingTooltip
                  className="attribute-tooltip"
                  side="right"
                  anchor={tooltip.anchor}
                  id={tooltipId}
                  dismiss={tooltip.dismiss}
                  {...tooltip.content}
                >
                  <strong>{name}</strong>
                  <span>
                    {translate(language, "attribute.target", {
                      value: formatNumber(target, language, 2),
                    })}
                  </span>
                  <dl>
                    {sources.map((entry, index) => (
                      <div key={entry.source + entry.id + index}>
                        <dt>
                          {translate(
                            language,
                            entry.source === "base"
                              ? "attribute.base"
                              : entry.source === "modifier"
                                ? entry.id
                                : entry.source === "policy"
                                  ? "policy." + entry.id
                                  : entry.id === "population_pressure"
                                    ? "attribute.populationPressure"
                                    : "attribute." + entry.id,
                          )}
                        </dt>
                        <dd>
                          {formatNumber(
                            entry.amount,
                            language,
                            2,
                            entry.source !== "base",
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {Math.abs(total - target) > 1e-6 && (
                    <span>
                      {translate(language, "attribute.unclamped", {
                        value: formatNumber(total, language, 2),
                      })}
                    </span>
                  )}
                  <span>
                    {translate(language, "attribute.pressure", {
                      value: formatNumber(pressure, language, 1),
                    })}
                  </span>
                </FloatingTooltip>
              )}
            </div>
          </>
        ) : (
          <span className="dormant-state">
            {translate(language, "attribute.dormant")}
          </span>
        )}
      </div>
      {active && (
        <div
          className="attribute-scale"
          role="img"
          aria-label={translate(language, "attribute.healthyZone", zone)}
        >
          <span
            className="healthy-zone"
            style={{
              left: position(zone.min),
              width: ((zone.max - zone.min) / span) * 100 + "%",
            }}
          />
          <span className="scale-value" style={{ left: position(value) }} />
        </div>
      )}
    </article>
  );
}
