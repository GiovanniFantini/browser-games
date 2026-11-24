import type { CampaignView } from "@worker/campaignView";
import { translate, type Language } from "../../i18n";

const ink = ["#e9bd79", "#8db5a0", "#b79cc6", "#dd967f", "#81b9ca", "#b9b880"];
const signs = ["✦", "◆", "▲", "●", "✚", "⬟"];
const cell = 40;

// Neighbouring regions share vertices, including along irregular coastlines.
function vertex(x: number, y: number) {
  return [
    x * cell + 7 * Math.sin(3 * x + 5 * y),
    y * cell + 7 * Math.sin(7 * x - 2 * y),
  ].join(",");
}

const terrainInk = {
  plain: "M-5,2 q3,-3 6,0 m1,3 q2,-2 5,-1",
  hills: "M-13,6 l9,-14 10,14 M-7,-3 l3,1 2,-3 M2,1 l5,-8 9,13",
  woods: "M-10,3 l4,-8 4,8 z M-6,3 v3 M-2,1 l5,-11 5,11 z M3,1 v4",
  water: "M-9,0 q4,4 9,0 t9,0",
};

export function WorldAtlas({
  view,
  language,
  selected,
  select,
}: {
  view: CampaignView;
  language: Language;
  selected: string;
  select: (id: string) => void;
}) {
  const peoples = [{ id: "spirit", name: view.identity.name }, ...view.rivals];
  return (
    <figure className="atlas">
      <svg
        viewBox="-8 -8 496 296"
        role="img"
        aria-label={translate(language, "atlas.title")}
      >
        <rect x="-8" y="-8" width="496" height="296" fill="#233f48" />
        {view.regions.map(({ id, column: x, row: y, owner, terrain }) => {
          const index = peoples.findIndex((people) => people.id === owner);
          return (
            <g
              key={id}
              onClick={owner ? () => select(owner) : undefined}
              style={{ cursor: owner ? "pointer" : undefined }}
            >
              <title>
                {translate(language, "atlas." + terrain)}
                {index >= 0 && " · " + peoples[index]!.name}
              </title>
              {owner && (
                <polygon
                  points={[
                    vertex(x, y),
                    vertex(x + 1, y),
                    vertex(x + 1, y + 1),
                    vertex(x, y + 1),
                  ].join(" ")}
                  fill={ink[index % ink.length]}
                  opacity={owner === selected ? 1 : 0.78}
                  stroke={owner === view.war?.rival ? "#8e352b" : "#403c30"}
                  strokeOpacity={owner === view.war?.rival ? 1 : 0.28}
                  strokeWidth=".8"
                />
              )}
              <path
                transform={`translate(${x * cell + 20} ${y * cell + 20})`}
                d={terrainInk[terrain]}
                fill="none"
                stroke={owner ? "#393d33" : "#7ca9ae"}
                opacity=".68"
                strokeWidth="1.3"
              />
            </g>
          );
        })}
        {peoples.map((people, index) => {
          const land = view.regions.filter((tile) => tile.owner === people.id);
          if (!land.length) return null;
          const cx = land.reduce((n, t) => n + t.column, 0) / land.length;
          const cy = land.reduce((n, t) => n + t.row, 0) / land.length;
          const distance = (tile: (typeof land)[number]) =>
            (tile.column - cx) ** 2 + (tile.row - cy) ** 2;
          const anchor = land.reduce((a, b) =>
            distance(a) < distance(b) ? a : b,
          );
          return (
            <g
              key={people.id}
              transform={`translate(${anchor.column * cell + 20} ${anchor.row * cell + 20})`}
              onClick={() => select(people.id)}
              className="atlas-marker"
            >
              <circle
                r="13"
                fill="#202e2b"
                stroke={
                  people.id === selected ? "#fff3d3" : ink[index % ink.length]
                }
                strokeWidth="3"
              />
              <text y="5" textAnchor="middle" fill="#fff3d3" fontSize="16">
                {signs[index % signs.length]}
              </text>
              <text y="25" textAnchor="middle" className="atlas-name">
                {people.name}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption>{translate(language, "atlas.hint")}</figcaption>
      <div className="atlas-key">
        {peoples.map((people, index) => (
          <button
            type="button"
            key={people.id}
            aria-pressed={selected === people.id}
            onClick={() => select(people.id)}
          >
            <span aria-hidden="true" style={{ color: ink[index % ink.length] }}>
              {signs[index % signs.length]}
            </span>{" "}
            {people.name}
            {index === 0 && " · " + translate(language, "atlas.you")}
          </button>
        ))}
      </div>
    </figure>
  );
}
