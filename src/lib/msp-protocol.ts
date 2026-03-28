/**
 * MSP (MultiWii Serial Protocol) v2 implementation for Betaflight communication.
 * Used to read flight controller configuration when a drone is plugged via USB.
 */

// MSP command codes
export const MSP = {
  // Identity
  API_VERSION: 1,
  FC_VARIANT: 2,
  FC_VERSION: 3,
  BOARD_INFO: 4,
  BUILD_INFO: 5,

  // Config
  FEATURE_CONFIG: 36,
  CF_SERIAL_CONFIG: 54,
  MODE_RANGES: 34,
  PID: 112,
  RC_TUNING: 111,
  MOTOR_CONFIG: 131,
  NAME: 10,

  // Status
  STATUS: 101,
  STATUS_EX: 150,
  BOXNAMES: 116,

  // ELRS
  ELRS_INFO: 0x2000,

  // RX
  RX_CONFIG: 44,
  RX_MAP: 64,

  // VTX
  VTX_CONFIG: 88,
} as const;

export interface MSPMessage {
  command: number;
  data: Buffer;
}

/**
 * Encode an MSP v2 request frame.
 * Frame format: $X< [flag:1] [cmd:2 LE] [size:2 LE] [data:N] [crc8:1]
 */
export function encodeMSPv2(command: number, payload: Buffer = Buffer.alloc(0)): Buffer {
  const frame = Buffer.alloc(9 + payload.length);
  let offset = 0;

  // Header
  frame.writeUInt8(0x24, offset++); // $
  frame.writeUInt8(0x58, offset++); // X
  frame.writeUInt8(0x3c, offset++); // < (request)

  // Flag
  frame.writeUInt8(0, offset++);

  // Command (16-bit LE)
  frame.writeUInt16LE(command, offset);
  offset += 2;

  // Payload size (16-bit LE)
  frame.writeUInt16LE(payload.length, offset);
  offset += 2;

  // Payload
  if (payload.length > 0) {
    payload.copy(frame, offset);
    offset += payload.length;
  }

  // CRC8 DVB-S2 over flag + cmd + size + payload
  const crcData = frame.slice(3, offset);
  frame.writeUInt8(crc8DvbS2(crcData), offset);

  return frame;
}

/**
 * Decode MSP v2 response. Returns null if frame is incomplete or invalid.
 */
export function decodeMSPv2(buffer: Buffer): MSPMessage | null {
  if (buffer.length < 9) return null;

  // Find frame start
  const startIdx = buffer.indexOf(Buffer.from([0x24, 0x58]));
  if (startIdx === -1) return null;

  const buf = buffer.slice(startIdx);
  if (buf.length < 9) return null;

  const direction = buf.readUInt8(2);
  if (direction !== 0x3e) return null; // > (response)

  const command = buf.readUInt16LE(4);
  const payloadSize = buf.readUInt16LE(6);

  if (buf.length < 9 + payloadSize) return null;

  const data = buf.slice(8, 8 + payloadSize);

  // Verify CRC
  const crcData = buf.slice(3, 8 + payloadSize);
  const expectedCrc = buf.readUInt8(8 + payloadSize);
  const actualCrc = crc8DvbS2(crcData);

  if (expectedCrc !== actualCrc) return null;

  return { command, data };
}

function crc8DvbS2(data: Buffer): number {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 0x80) {
        crc = ((crc << 1) ^ 0xd5) & 0xff;
      } else {
        crc = (crc << 1) & 0xff;
      }
    }
  }
  return crc;
}

/**
 * Parse Betaflight board info from MSP_BOARD_INFO response
 */
export function parseBoardInfo(data: Buffer): { boardId: string; hardwareRevision: number } {
  if (data.length < 4) return { boardId: "????", hardwareRevision: 0 };
  const boardId = data.slice(0, 4).toString("ascii");
  const hardwareRevision = data.length >= 6 ? data.readUInt16LE(4) : 0;
  return { boardId, hardwareRevision };
}

/**
 * Parse firmware version from MSP_FC_VERSION response
 */
export function parseFCVersion(data: Buffer): string {
  if (data.length < 3) return "unknown";
  return `${data.readUInt8(0)}.${data.readUInt8(1)}.${data.readUInt8(2)}`;
}

/**
 * Parse craft name from MSP_NAME response
 */
export function parseCraftName(data: Buffer): string {
  return data.toString("ascii").replace(/\0/g, "").trim();
}

/**
 * Parse PID values from MSP_PID response
 */
export function parsePIDs(data: Buffer): { roll: number[]; pitch: number[]; yaw: number[] } {
  if (data.length < 9) return { roll: [0, 0, 0], pitch: [0, 0, 0], yaw: [0, 0, 0] };
  return {
    roll: [data.readUInt8(0), data.readUInt8(1), data.readUInt8(2)],
    pitch: [data.readUInt8(3), data.readUInt8(4), data.readUInt8(5)],
    yaw: [data.readUInt8(6), data.readUInt8(7), data.readUInt8(8)],
  };
}

/**
 * Parse RC tuning (rates) from MSP_RC_TUNING response
 */
export function parseRCTuning(data: Buffer): {
  rcRate: number[];
  superRate: number[];
  rcExpo: number[];
} {
  if (data.length < 8) {
    return { rcRate: [1.0, 1.0], rcExpo: [0.0, 0.0], superRate: [0.7, 0.7] };
  }
  return {
    rcRate: [data.readUInt8(0) / 100, data.readUInt8(5) / 100],
    rcExpo: [data.readUInt8(1) / 100, data.readUInt8(6) / 100],
    superRate: [data.readUInt8(4) / 100, data.readUInt8(7) / 100],
  };
}

/**
 * Parse RX config from MSP_RX_CONFIG response
 */
export function parseRXConfig(data: Buffer): { serialProvider: number; channelCount: number } {
  if (data.length < 1) return { serialProvider: 0, channelCount: 16 };
  return {
    serialProvider: data.readUInt8(0),
    channelCount: data.length > 8 ? data.readUInt8(8) : 16,
  };
}

// Serial RX provider names
export const SERIAL_RX_PROVIDERS: Record<number, string> = {
  0: "None",
  1: "SPEKTRUM1024",
  2: "SPEKTRUM2048",
  3: "SBUS",
  4: "SUMD",
  5: "SUMH",
  6: "XBUS_MODE_B",
  7: "XBUS_MODE_B_RJ01",
  8: "IBUS",
  9: "JETIEXBUS",
  10: "CRSF",
  11: "SRXL",
  12: "TARGET_CUSTOM",
  13: "FPORT",
  14: "SRXL2",
  15: "GHST",
};
