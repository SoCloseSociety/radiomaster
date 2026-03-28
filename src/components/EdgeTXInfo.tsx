"use client";

import { EdgeTXRadioConfig } from "@/types/devices";

interface EdgeTXInfoProps {
  config: EdgeTXRadioConfig;
  mountPoint: string;
}

export default function EdgeTXInfo({ config, mountPoint }: EdgeTXInfoProps) {
  return (
    <div className="device-card rounded-xl bg-surface p-5 border-radio/30">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🎮</span>
        <div>
          <h3 className="font-bold text-foreground text-lg">
            EdgeTX — {config.radioName}
          </h3>
          <p className="text-xs text-foreground/40">
            Firmware: {config.firmwareVersion} — SD: {mountPoint}
          </p>
        </div>
      </div>

      {config.models.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground/60 mb-2">
            Modèles ({config.models.length})
          </h4>
          <div className="space-y-1">
            {config.models.map((model) => (
              <div
                key={`${model.filename}-${model.name}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-background text-sm"
              >
                <span className="text-foreground">{model.name}</span>
                <div className="flex items-center gap-3 text-xs text-foreground/40">
                  <span>{model.protocol}</span>
                  <span>{model.moduleBay}</span>
                  <span>{model.channels}ch</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {config.elrsConfig && (
        <div>
          <h4 className="text-sm font-medium text-foreground/60 mb-2">ELRS</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="px-3 py-2 rounded-lg bg-background">
              <span className="text-foreground/30">Binding Phrase</span>
              <p className="font-mono text-accent">
                {config.elrsConfig.bindingPhrase || "Non configuré"}
              </p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-background">
              <span className="text-foreground/30">Rate</span>
              <p>{config.elrsConfig.rate} Hz</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-background">
              <span className="text-foreground/30">Puissance</span>
              <p>{config.elrsConfig.power} mW</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-background">
              <span className="text-foreground/30">Switch Mode</span>
              <p>{config.elrsConfig.switchMode}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
