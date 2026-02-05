export function build_url(base: string, params: Record<string, string> = {}) {
	const url = new URL(base);

	Object.entries(params).forEach(([key, value]) => {
		url.searchParams.set(key, value);
	});

	return url.toString();
}

export async function safe_fetch(
	input: string | URL | Request,
	init?: RequestInit,
): Promise<string | null> {
	try {
		const res = await fetch(input, init);
		if (!res.ok) {
			const error = await res.text();
			window.toast(`Error: ${error}`, 'error');
			return null;
		}

		return await res.text();
	} catch (e) {
		if (e instanceof Error) {
			window.toast(`Error: ${e.message}`, 'error');
		}

		return null;
	}
}

export async function safe_fetch_json<T>(
	input: string | URL | Request,
	init?: RequestInit,
): Promise<T | null> {
	try {
		const res = await fetch(input, init);
		if (!res.ok) {
			const error = await res.text();
			window.toast(`Error: ${error}`, 'error');
			return null;
		}

		return (await res.json()) as T;
	} catch (e) {
		if (e instanceof Error) {
			window.toast(`Error: ${e.message}`, 'error');
		}

		return null;
	}
}

export function safe_json<T>(data: string): T | null {
	try {
		return JSON.parse(data) as T;
	} catch (e) {
		if (e instanceof Error) {
			window.toast(`Error: ${e.message}`, 'error');
		}

		return null;
	}
}

export function clean_level_id(level_id: string, ch = ':') {
	return level_id.split(/[:/]/).slice(0, 2).join(ch);
}
