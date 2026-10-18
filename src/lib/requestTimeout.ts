export const withRequestTimeout = async <T>(
  request: (signal: AbortSignal) => PromiseLike<T>,
  timeoutMs = 30000
): Promise<T> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("The connection timed out. Try Sync Now again."));
    }, timeoutMs);
  });

  try {
    return await Promise.race([request(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
};
