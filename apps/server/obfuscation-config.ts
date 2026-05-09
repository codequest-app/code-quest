type ObfuscationLevel = 'none' | 'low' | 'medium' | 'high';

const levels: Record<ObfuscationLevel, object> = {
  none: {},
  low: {
    target: 'node',
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 0.5,
  },
  medium: {
    target: 'node',
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 0.75,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    identifierNamesGenerator: 'hexadecimal',
    selfDefending: true,
    transformObjectKeys: true,
    unicodeEscapeSequence: true,
  },
  high: {
    target: 'node',
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 0.75,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    identifierNamesGenerator: 'hexadecimal',
    selfDefending: true,
    transformObjectKeys: true,
    unicodeEscapeSequence: true,
  },
};

export function getObfuscationOptions(
  envLevel?: string,
  defaultLevel: ObfuscationLevel = 'high',
): { level: ObfuscationLevel; options: object } {
  const level = (envLevel && envLevel in levels ? envLevel : defaultLevel) as ObfuscationLevel;
  return { level, options: levels[level] };
}
