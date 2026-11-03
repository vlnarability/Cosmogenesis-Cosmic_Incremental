// Resource Progression — ROUND D4
//
// Maps the cross-stage resource replacement chains. As the player advances,
// certain resources are superseded by more advanced ones. The old resource's
// production systems become "legacy" (convertible to the new resource via
// the upgradeReplaces mechanic). This data drives the Codex display +
// resource-transition tooltips.
//
// Per user spec: "some resources can replace other ones, i.e.
// fibre→stone→metal→alloys"

export interface ResourceProgressionLink {
  old: string;
  new: string;
  oldStage: string;
  newStage: string;
  label: string;
}

export const RESOURCE_PROGRESSION: ResourceProgressionLink[] = [
  {
    old: "wood",
    new: "production",
    oldStage: "tribal",
    newStage: "civilization",
    label: "Wood → Production",
  },
  {
    old: "stone",
    new: "materials",
    oldStage: "tribal",
    newStage: "civilization",
    label: "Stone → Materials",
  },
  {
    old: "materials",
    new: "alloys",
    oldStage: "civilization",
    newStage: "empire",
    label: "Materials → Alloys",
  },
  {
    old: "production",
    new: "alloys",
    oldStage: "empire",
    newStage: "solar",
    label: "Production → Alloys",
  },
];

/** Get the resource progression links that have fired by the given stage index. */
export function progressionReachedBy(stageIndex: number): ResourceProgressionLink[] {
  const stageIds = ["cell", "creature", "tribal", "civilization", "empire", "solar", "galactic"];
  const reached = new Set(stageIds.slice(0, stageIndex + 1));
  return RESOURCE_PROGRESSION.filter((link) => reached.has(link.newStage));
}
