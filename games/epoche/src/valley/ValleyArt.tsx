import type { Village, Site, Turn } from "./game";
const points: Record<Site, [number, number]> = {
  terrace: [320, 185],
  camp: [386, 506],
  boat: [1230, 260],
  bank: [745, 742],
};
export function ValleyArt({
  v,
  crews,
  hauling,
  floodTurn,
}: {
  v: Village;
  crews: [Site, Site];
  hauling: boolean;
  floodTurn: Turn | undefined;
}) {
  const timber = v.season > 0 ? v.timberSite : "bank";
  const [tx, ty] = points[timber];
  const afloat = v.season >= 1 && (v.trust === "unknown" || v.trust === "kept");
  return (
    <svg className="v-art" viewBox="0 0 1536 1024" aria-hidden="true">
      <defs>
        <image
          id="guado-props"
          width="1536"
          height="1024"
          href={import.meta.env.BASE_URL + "art/valle-guado.jpg"}
        />
        <clipPath id="guado-wood">
          <path d="M611 742L650 727L772 685L809 681L845 696L845 731L744 774L641 774Z" />
        </clipPath>
        <clipPath id="guado-canoe">
          <path d="M1241 242Q1260 225 1302 217L1366 206Q1363 241 1314 253Q1267 263 1241 250Z" />
        </clipPath>
        <clipPath id="guado-fire">
          <path d="M335 551L349 538L358 518L362 535L370 509L377 538L388 529L390 548L408 555L395 567L350 569Z" />
        </clipPath>
        <g id="guado-family">
          <ellipse cy="6" rx="10" ry="3.8" fill="#42361b" opacity=".36" />
          <path
            d="M-4 -13Q0 -17 4 -12L8 2L4 3L4 8H1L0 2L-2 8H-5L-4 1H-8Z"
            fill="currentColor"
            stroke="#493826"
            strokeWidth="1.4"
          />
          <circle
            cy="-17"
            r="4"
            fill="#b87e53"
            stroke="#483721"
            strokeWidth="1.5"
          />
        </g>
      </defs>
      {v.season < 2 && (
        <g
          className="v-current"
          fill="none"
          stroke="#e2f3dc"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path d="M767 147q37 4 73 30m23 30q21 3 42 21" />
          <path d="M910 358q63 24 91 59m-34 19q48 18 89 60" />
          <path d="M1177 602q45 26 60 61" />
        </g>
      )}
      {v.wood > 0 && (
        <g className={hauling ? "v-hauling" : undefined}>
          <g
            transform={`translate(${tx} ${ty}) scale(${0.55 + 0.14 * Math.min(4, v.wood)}) translate(-735 -738)`}
          >
            <use href="#guado-props" clipPath="url(#guado-wood)" />
          </g>
        </g>
      )}
      {floodTurn && (
        <g className="v-flood-events">
          {v.flood === "high" &&
            floodTurn.order === "shelter" &&
            Array.from({ length: 3 - v.wood }, (_, i) => (
              <g
                key={i}
                className="v-drifting-log"
                style={{ translate: i * 23 + "px " + i * 18 + "px" }}
              >
                <path
                  d="M714 745l71 -24"
                  stroke="#594025"
                  strokeWidth="13"
                  strokeLinecap="round"
                />
                <path
                  d="M714 742l68 -23"
                  stroke="#c39961"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </g>
            ))}
          {floodTurn.order === "shelter" && (
            <g
              className={
                floodTurn.job === "guard"
                  ? "v-basket from-bank"
                  : "v-basket from-terrace"
              }
            >
              <path
                d="M-18 -8Q0 -39 18 -8M-22 -9h44l-7 22h-28Z"
                stroke="#513821"
                fill="#cb9b53"
                strokeWidth="4"
              />
              <circle cy="-9" r="6" fill="#a95131" />
              <circle cx="-9" cy="-7" r="5" fill="#976932" />
              <circle cx="9" cy="-7" r="6" fill="#a95131" />
            </g>
          )}
        </g>
      )}
      {afloat && <use href="#guado-props" clipPath="url(#guado-canoe)" />}
      {(!v.ending || v.ending === "harvest") && (
        <use href="#guado-props" clipPath="url(#guado-fire)" />
      )}
      {v.ending === "harvest" && (
        <g stroke="#67502b" strokeWidth="5" fill="none">
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d={`M${195 + i * 12} ${216 + i * 1.4} q42 -8 90 -38`}
            />
          ))}
        </g>
      )}
      {v.depot !== "none" && (
        <g
          transform={
            v.depot === "common" ? "translate(443 530)" : "translate(360 198)"
          }
        >
          <path
            d="M-28 0L-29 34L8 41L35 26V-6Z"
            fill="#996c40"
            stroke="#63492e"
            strokeWidth="3"
          />
          <path
            d="M-38 3L-4 -27L37 -13L42 -4L9 13Z"
            fill="#d5bc80"
            stroke="#745937"
            strokeWidth="4"
          />
          <path d="M-1 40V19L11 15V39" fill="#483c29" />
        </g>
      )}
      {v.repaired && (
        <path
          d="M520 587l30 -44 42 28 -21 40Z"
          fill="#c8a262"
          stroke="#816b46"
          strokeWidth="4"
        />
      )}
      {(v.ending === null || v.ending === "harvest") &&
        crews.map((s, i) => {
          const [x, y] = points[s];
          return (
            <g
              key={i}
              className="v-people"
              style={{
                transform: `translate(${x + (i ? 38 : -28)}px,${y + 38}px)`,
              }}
              color={i ? "#ddd1a6" : "#a24e32"}
            >
              <g className={hauling ? "v-carrier" : undefined}>
                <use href="#guado-family" />
                <use
                  href="#guado-family"
                  transform="translate(13 5) scale(.86)"
                />
              </g>
            </g>
          );
        })}
    </svg>
  );
}
