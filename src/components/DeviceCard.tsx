"use client";

import { FPVDevice } from "@/types/devices";

const categoryColors: Record<string, string> = {
  drone: "border-drone text-drone",
  radio: "border-radio text-radio",
  goggles: "border-goggles text-goggles",
  receiver: "border-receiver text-receiver",
  vtx: "border-vtx text-vtx",
  camera: "border-goggles text-goggles",
  unknown: "border-border text-foreground/50",
};

const categoryIcons: Record<string, string> = {
  drone: "🚁",
  radio: "🎮",
  goggles: "🥽",
  receiver: "📡",
  vtx: "📺",
  camera: "📷",
  unknown: "❓",
};

const statusDot: Record<string, string> = {
  connected: "bg-success",
  disconnected: "bg-foreground/30",
  configuring: "bg-warning animate-pulse-glow",
  error: "bg-danger",
};

interface DeviceCardProps {
  device: FPVDevice;
  onSaveToInventory?: (device: FPVDevice) => void;
  onConfigure?: (device: FPVDevice) => void;
  isSaved?: boolean;
}

export default function DeviceCard({
  device,
  onSaveToInventory,
  onConfigure,
  isSaved,
}: DeviceCardProps) {
  const colorClass = categoryColors[device.category] || categoryColors.unknown;
  const icon = categoryIcons[device.category] || categoryIcons.unknown;

  return (
    <div className={`device-card rounded-xl bg-surface p-5 ${colorClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-bold text-foreground text-lg">{device.model}</h3>
            <p className="text-sm text-foreground/50">{device.brand}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusDot[device.status]}`} />
          <span className="text-xs text-foreground/40 uppercase">{device.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-foreground/60 mb-4">
        <div>
          <span className="text-foreground/30">Catégorie</span>
          <p className="capitalize">{device.category}</p>
        </div>
        <div>
          <span className="text-foreground/30">Protocole</span>
          <p>{device.protocol}</p>
        </div>
        <div>
          <span className="text-foreground/30">Firmware</span>
          <p>{device.firmware || "—"}</p>
        </div>
        <div>
          <span className="text-foreground/30">USB</span>
          <p className="font-mono">{device.usbInfo.vendorId}:{device.usbInfo.productId}</p>
        </div>
        {device.usbInfo.path && (
          <div className="col-span-2">
            <span className="text-foreground/30">Port série</span>
            <p className="font-mono">{device.usbInfo.path}</p>
          </div>
        )}
        {device.firmwareVersion && (
          <div>
            <span className="text-foreground/30">Version</span>
            <p>{device.firmwareVersion}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!isSaved && onSaveToInventory && (
          <button
            onClick={() => onSaveToInventory(device)}
            className="flex-1 px-3 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            + Ajouter à l&apos;inventaire
          </button>
        )}
        {isSaved && (
          <span className="flex-1 px-3 py-2 rounded-lg bg-success/10 text-success text-sm text-center">
            ✓ Dans l&apos;inventaire
          </span>
        )}
        {onConfigure && (
          <button
            onClick={() => onConfigure(device)}
            className="px-3 py-2 rounded-lg bg-surface-hover text-foreground/70 text-sm hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Configurer
          </button>
        )}
      </div>
    </div>
  );
}
