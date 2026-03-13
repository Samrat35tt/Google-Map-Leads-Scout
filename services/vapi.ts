
// Service deprecated. Voice features removed.
export const makeOutboundCall = async (): Promise<any> => {
  throw new Error("Voice calls are disabled in this version.");
};
