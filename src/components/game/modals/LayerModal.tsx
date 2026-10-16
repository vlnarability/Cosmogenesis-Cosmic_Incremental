"use client";

import { lazy, Suspense, type LazyExoticComponent, type ComponentType } from "react";
import { useGameStore } from "@/game/state/store";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

// ============================================================
// LayerModal — P6: Modal Consolidation.
//
// Replaces 10 separate layer modals (each with its own <Dialog>)
// with ONE shared <Dialog> that switches content based on the
// `activeLayerModal` state field.
//
// Per-layer content components are STILL lazy-loaded — only the
// active layer's chunk is fetched on open. This preserves the
// memory optimization (the OOM killer was triggered by all 17
// modals + their data files being in the initial chunk).
//
// The shared Dialog wrapper guarantees consistent styling +
// open/close behavior across all 10 layers, and lets us add a
// single Suspense fallback spinner for lazy-loaded modals.
// ============================================================

// Lazy-load each layer's CONTENT (without the Dialog wrapper).
// Each content component reads its own layer state from the store;
// the LayerModal only controls visibility via the shared Dialog.
const ChallengeContent = lazy(() =>
  import("./ChallengeModal").then((m) => ({ default: m.ChallengeContent as ComponentType }))
);
const EnlightenmentContent = lazy(() =>
  import("./EnlightenmentModal").then((m) => ({ default: m.EnlightenmentContent as ComponentType }))
);
const TranscendenceContent = lazy(() =>
  import("./TranscendenceModal").then((m) => ({ default: m.TranscendenceContent as ComponentType }))
);
const GenesisContent = lazy(() =>
  import("./GenesisModal").then((m) => ({ default: m.GenesisContent as ComponentType }))
);
const ApotheosisContent = lazy(() =>
  import("./ApotheosisModal").then((m) => ({ default: m.ApotheosisContent as ComponentType }))
);
const SingularityContent = lazy(() =>
  import("./SingularityModal").then((m) => ({ default: m.SingularityContent as ComponentType }))
);
const OmnipotenceContent = lazy(() =>
  import("./OmnipotenceModal").then((m) => ({ default: m.OmnipotenceContent as ComponentType }))
);
const DivinityLayerContent = lazy(() =>
  import("./DivinityLayerModal").then((m) => ({ default: m.DivinityLayerContent as ComponentType }))
);
const InfinityContent = lazy(() =>
  import("./InfinityModal").then((m) => ({ default: m.InfinityContent as ComponentType }))
);
const EternityContent = lazy(() =>
  import("./EternityModal").then((m) => ({ default: m.EternityContent as ComponentType }))
);

// ---- Layer config — per-layer Dialog sizing (mirrors each modal's
//      original DialogContent className so the consolidated wrapper
//      matches the per-layer layout exactly). ----
interface LayerConfig {
  /** The lazy-loaded content component for this layer. */
  Content: LazyExoticComponent<ComponentType>;
  /** DialogContent className — preserves the original per-layer sizing. */
  dialogClass: string;
}

const LAYER_CONFIG: Record<string, LayerConfig> = {
  challenges: {
    Content: ChallengeContent,
    dialogClass: "max-w-4xl max-h-[88vh] overflow-y-auto glass-strong",
  },
  enlightenment: {
    Content: EnlightenmentContent,
    dialogClass: "max-w-6xl max-h-[92vh] overflow-hidden glass-strong flex flex-col",
  },
  transcendence: {
    Content: TranscendenceContent,
    dialogClass: "max-w-4xl max-h-[88vh] overflow-y-auto glass-strong",
  },
  genesis: {
    Content: GenesisContent,
    dialogClass: "max-w-5xl max-h-[92vh] overflow-y-auto glass-strong",
  },
  apotheosis: {
    Content: ApotheosisContent,
    dialogClass: "max-w-6xl max-h-[90vh] overflow-y-auto glass-strong",
  },
  singularity: {
    Content: SingularityContent,
    dialogClass: "max-w-6xl max-h-[90vh] overflow-y-auto glass-strong",
  },
  omnipotence: {
    Content: OmnipotenceContent,
    dialogClass: "max-w-4xl max-h-[88vh] overflow-y-auto glass-strong",
  },
  divinity: {
    Content: DivinityLayerContent,
    dialogClass: "max-w-4xl max-h-[88vh] overflow-y-auto glass-strong",
  },
  infinity: {
    Content: InfinityContent,
    dialogClass: "max-w-4xl max-h-[88vh] overflow-y-auto glass-strong",
  },
  eternity: {
    Content: EternityContent,
    dialogClass: "max-w-5xl max-h-[90vh] overflow-y-auto glass-strong",
  },
};

// ---- Suspense fallback shown while a layer's content chunk loads. ----
// P7 — Loading State. Simple centered spinner with subtle "loading" text.
function LayerModalLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 min-h-[200px]">
      <div className="animate-spin text-3xl select-none" aria-hidden>
        ⏳
      </div>
      <p className="text-xs text-muted-foreground">Loading layer…</p>
    </div>
  );
}

export function LayerModal() {
  const activeLayerModal = useGameStore((s) => s.activeLayerModal);
  const closeLayerModal = useGameStore((s) => s.closeLayerModal);

  const isOpen = activeLayerModal !== null;
  const config = activeLayerModal ? LAYER_CONFIG[activeLayerModal] : null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) closeLayerModal();
      }}
    >
      <DialogContent className={config?.dialogClass ?? "max-w-2xl glass-strong"}>
        <Suspense fallback={<LayerModalLoading />}>
          {config && <config.Content />}
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
