export function quantize(input: number, resolution: number): number {
  return Math.floor(input / resolution) * resolution
}

export function timeToPosition(ms: number, timeRange: number, height: number): number {
  return (ms / timeRange) * height
}
