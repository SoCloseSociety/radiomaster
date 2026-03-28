export type DeviceCategory = "radio" | "drone" | "goggles" | "camera" | "receiver" | "vtx" | "unknown";
export type ConnectionStatus = "connected" | "disconnected" | "configuring" | "error";
export type Protocol = "ELRS" | "CRSF" | "DJI" | "FrSky" | "TBS" | "unknown";

export interface USBDeviceInfo {
  vendorId: string;
  productId: string;
  name: string;
  manufacturer: string;
  serialNumber?: string;
  locationId: string;
  path?: string; // serial port path
}

export interface FPVDevice {
  id: string;
  usbInfo: USBDeviceInfo;
  category: DeviceCategory;
  brand: string;
  model: string;
  protocol: Protocol;
  firmware?: string;
  firmwareVersion?: string;
  status: ConnectionStatus;
  config?: Record<string, unknown>;
  detectedAt: string;
}

export interface BetaflightConfig {
  boardName: string;
  firmwareVersion: string;
  craftName: string;
  serialRx: string;
  receiverProtocol: string;
  elrsUid?: string;
  rates: {
    rcRate: number[];
    superRate: number[];
    rcExpo: number[];
  };
  pids: {
    roll: number[];
    pitch: number[];
    yaw: number[];
  };
  modes: Array<{
    id: number;
    auxChannel: number;
    rangeStart: number;
    rangeEnd: number;
  }>;
  features: string[];
  motorProtocol: string;
  vtxSettings?: {
    band: number;
    channel: number;
    power: number;
    pitMode: boolean;
  };
}

export interface EdgeTXModel {
  name: string;
  filename: string;
  moduleBay: "internal" | "external";
  protocol: Protocol;
  bindingPhrase?: string;
  channels: number;
  trims: Record<string, number>;
  mixers: Array<{
    source: string;
    destination: string;
    weight: number;
  }>;
}

export interface EdgeTXRadioConfig {
  radioName: string;
  firmwareVersion: string;
  models: EdgeTXModel[];
  elrsConfig?: {
    bindingPhrase: string;
    rate: number;
    power: number;
    switchMode: string;
  };
}

export interface FPVProfile {
  id: string;
  name: string;
  droneId?: string;
  radioId?: string;
  cameraId?: string;
  protocol: Protocol;
  bindingPhrase?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceInventory {
  devices: FPVDevice[];
  profiles: FPVProfile[];
}
