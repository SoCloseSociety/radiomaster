"use client";

import { useState } from "react";
import { BeginnerTip } from "@/lib/config-templates";

interface BeginnerGuideProps {
  tips: BeginnerTip[];
}

const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
  safety: { label: "Sécurité", icon: "🛡️", color: "text-danger" },
  config: { label: "Configuration", icon: "⚙️", color: "text-accent" },
  flying: { label: "Vol", icon: "🚁", color: "text-drone" },
  gear: { label: "Matériel", icon: "🔧", color: "text-radio" },
  elrs: { label: "ELRS", icon: "📡", color: "text-receiver" },
};

const priorityBadge: Record<string, { label: string; class: string }> = {
  critical: { label: "CRITIQUE", class: "bg-danger/20 text-danger" },
  important: { label: "IMPORTANT", class: "bg-warning/20 text-warning" },
  nice: { label: "CONSEIL", class: "bg-accent/20 text-accent" },
};

export default function BeginnerGuide({ tips }: BeginnerGuideProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [readTips, setReadTips] = useState<Set<string>>(new Set());

  const categories = ["all", ...Object.keys(categoryLabels)];

  const filtered = activeCategory === "all"
    ? tips
    : tips.filter((t) => t.category === activeCategory);

  // Sort: critical first, then important, then nice
  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, important: 1, nice: 2 };
    return (order[a.priority] ?? 99) - (order[b.priority] ?? 99);
  });

  const toggleRead = (id: string) => {
    setReadTips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progress = tips.length > 0 ? Math.round((readTips.size / tips.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Guide du débutant FPV</h2>
          <span className="text-sm text-foreground/40">
            {readTips.size}/{tips.length} lu ({progress}%)
          </span>
        </div>
        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const info = categoryLabels[cat] || { label: cat, icon: "?", color: "text-foreground/50" };
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeCategory === cat
                  ? "bg-accent text-black font-medium"
                  : "bg-surface text-foreground/50 hover:text-foreground"
              }`}
            >
              {cat === "all" ? "Tout" : `${info.icon} ${info.label}`}
            </button>
          );
        })}
      </div>

      {/* Tips list */}
      <div className="space-y-3">
        {sorted.map((tip) => {
          const cat = categoryLabels[tip.category];
          const pri = priorityBadge[tip.priority];
          const isRead = readTips.has(tip.id);

          return (
            <button
              key={tip.id}
              onClick={() => toggleRead(tip.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                isRead
                  ? "border-success/20 bg-success/5 opacity-70"
                  : "border-border bg-surface hover:border-foreground/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                    isRead
                      ? "border-success bg-success text-black"
                      : "border-foreground/20"
                  }`}
                >
                  {isRead && <span className="text-xs font-bold">✓</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs ${cat.color}`}>
                      {cat.icon} {cat.label}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${pri.class}`}>
                      {pri.label}
                    </span>
                  </div>
                  <h3 className={`font-medium text-sm ${isRead ? "line-through text-foreground/40" : ""}`}>
                    {tip.title}
                  </h3>
                  <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                    {tip.content}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
