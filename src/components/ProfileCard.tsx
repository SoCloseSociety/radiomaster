"use client";

import { useState } from "react";
import { FPVProfile, FPVDevice } from "@/types/devices";

interface ProfileCardProps {
  profile: FPVProfile;
  devices: FPVDevice[];
  onDelete?: (id: string) => void;
}

export default function ProfileCard({ profile, devices, onDelete }: ProfileCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const drone = devices.find((d) => d.id === profile.droneId);
  const radio = devices.find((d) => d.id === profile.radioId);

  return (
    <div className="device-card rounded-xl bg-surface p-5 border-accent/30">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-foreground text-lg">{profile.name}</h3>
          <p className="text-xs text-foreground/40">
            Protocole: <span className="text-accent">{profile.protocol}</span>
          </p>
        </div>
        {onDelete && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-foreground/30 hover:text-danger text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            aria-label="Supprimer le profil"
          >
            ✕
          </button>
        )}
        {onDelete && confirmDelete && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDelete(profile.id)}
              className="px-2 py-1 text-xs bg-danger/20 text-danger rounded hover:bg-danger/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            >
              Supprimer
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-xs text-foreground/40 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-foreground/60">
          <span className="text-drone">🚁</span>
          <span>{drone ? `${drone.brand} ${drone.model}` : "Aucun drone assigné"}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground/60">
          <span className="text-radio">🎮</span>
          <span>{radio ? `${radio.brand} ${radio.model}` : "Aucune radio assignée"}</span>
        </div>
        {profile.bindingPhrase && (
          <div className="flex items-center gap-2 text-foreground/60">
            <span>🔗</span>
            <span className="font-mono text-xs text-accent">{profile.bindingPhrase}</span>
          </div>
        )}
      </div>

      {profile.notes && (
        <p className="mt-3 text-xs text-foreground/30 italic">{profile.notes}</p>
      )}

      <p className="mt-2 text-[10px] text-foreground/20">
        Créé le {new Date(profile.createdAt).toLocaleDateString("fr-FR")}
      </p>
    </div>
  );
}
