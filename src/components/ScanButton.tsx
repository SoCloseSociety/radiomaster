"use client";

interface ScanButtonProps {
  isScanning: boolean;
  onScan: () => void;
  deviceCount: number;
}

export default function ScanButton({ isScanning, onScan, deviceCount }: ScanButtonProps) {
  return (
    <button
      onClick={onScan}
      disabled={isScanning}
      className={`
        relative px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider
        transition-all duration-300
        ${
          isScanning
            ? "bg-accent/20 text-accent cursor-wait"
            : "bg-accent text-black hover:bg-accent-dim active:scale-95"
        }
      `}
    >
      {isScanning ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Scan USB en cours...
        </span>
      ) : (
        <span>
          Scanner les appareils USB
          {deviceCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-black/20 rounded-full text-xs">
              {deviceCount}
            </span>
          )}
        </span>
      )}
    </button>
  );
}
