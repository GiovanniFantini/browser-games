// The floodplain, forest edge and founding square share one coordinate system in every era.
export const valley = { fields: -185, village: 175, woods: 585, river: 770, width: 390 } as const;

// Camera stops for the traces along the route from fields to river.
export const heritageCamera = {
  spring: 0, seedStore: 0, hearth: 1 / 3, wheel: 1 / 3, council: 1 / 3,
  romanRoad: 0.5, revolution: 1 / 3, worldWars: 2 / 3,
  commonBridge: 1, mutualHall: 0.5, fair: 1, nightSchool: 0.5,
} as const;

export function focusFor(
  camera: number,
  terrain: typeof valley,
) {
  const { fields, village, woods, river } = terrain;
  const stops = [0, 1 / 3, 0.5, 2 / 3, 1];
  const targets = [fields, village, (fields + river) / 2, woods, river];
  const index = Math.max(
    1,
    stops.findIndex((stop) => camera <= stop),
  );
  const weight =
    (camera - stops[index - 1]!) / (stops[index]! - stops[index - 1]!);
  return targets[index - 1]! + (targets[index]! - targets[index - 1]!) * weight;
}

export const heritagePosition = {
  hearth:[valley.village-63,27], wheel:[valley.village-133,20], romanRoad:[valley.village+90,24],
  commonBridge:[valley.river-62,12], revolution:[valley.village+49,12], worldWars:[valley.woods-42,15],
  mutualHall:[valley.village+205,10], fair:[valley.river-110,7], nightSchool:[valley.village+263,11],
  spring:[valley.fields+62,18], seedStore:[valley.fields-58,10], council:[valley.village,21],
} as const;
