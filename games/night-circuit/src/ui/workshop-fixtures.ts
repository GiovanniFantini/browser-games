export const workshopTubes = [-8, -4, -1.5, 0, 1.5, 4, 8].flatMap((z) =>
  [-6, 6].map((x) => ({ x, y: 5.55, z, width: 3.8, depth: 0.7 })),
);
export const workshopTubeRadiance = [2.2, 2.1, 1.8] as const;
