export type RetryOptions = {
	max?: number;
	baseMs?: number;
	shouldRetry?: (err: unknown) => boolean;
};

export async function withRetry<T>(
	fn: () => Promise<T>,
	opts: RetryOptions = {},
): Promise<T> {
	const max = opts.max ?? 3;
	const baseMs = opts.baseMs ?? 250;
	const shouldRetry = opts.shouldRetry ?? defaultShouldRetry;
	let attempt = 0;
	while (true) {
		try {
			return await fn();
		} catch (err) {
			attempt++;
			if (attempt >= max || !shouldRetry(err)) throw err;
			const delay = baseMs * 2 ** (attempt - 1);
			await new Promise((r) => setTimeout(r, delay));
		}
	}
}

function defaultShouldRetry(err: unknown): boolean {
	if (!err || typeof err !== "object") return false;
	const code = (err as { code?: number | string }).code;
	if (typeof code === "number") {
		if (code >= 500) return true;
		if (code === 429 || code === 408) return true;
		return false;
	}
	if (typeof code === "string") {
		return ["ETIMEDOUT", "ECONNRESET", "ENOTFOUND", "EAI_AGAIN"].includes(code);
	}
	return false;
}
