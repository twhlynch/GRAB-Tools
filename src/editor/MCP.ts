import { unmodded_definition } from '@/common/root';
import { FORMAT_VERSION } from '@/config';
import { Level } from '@/generated/proto';

/// 'level' -> update the level
/// 'info'  -> return type info

let ws = null as WebSocket | null;
let port = 8765;
let update = null as null | ((data: Level) => void);

export function init(onupdate?: (data: Level) => void) {
	const params = new URLSearchParams(window.location.search);
	const port_param = params.get('mcp_port');
	if (port_param) {
		port = parseInt(port_param);
		connect();
	}

	update = onupdate ?? null;
}

export function destroy() {
	if (!ws) return;

	ws.onclose = null;
	ws.close();
}

function connect() {
	ws = new WebSocket(`ws://localhost:${port}`);
	ws.onopen = () => {
		console.log('MCP connected');
	};
	ws.onmessage = (event) => {
		try {
			const msg = JSON.parse(event.data);
			receive(msg);
		} catch {
			// dont care
		}
	};
	ws.onclose = () => {
		ws = null;
		setTimeout(() => connect(), 3000);
	};
	ws.onerror = () => ws?.close();
}

function receive(data: { type: string; data: unknown }) {
	console.log('MCP: ' + data.type);

	if (data.type === 'level') {
		update?.(data.data as Level);
	} else if (data.type === 'info') {
		send_info();
	}
}

function send_info() {
	send('info', {
		proto: unmodded_definition(),
		format_version: FORMAT_VERSION,
	});
}

export function send_level(level: Level) {
	send('level', level);
}

function send(type: string, data: unknown) {
	if (!is_open(ws)) return;

	const json = JSON.stringify({ type, data });
	ws.send(json);
}

function is_open(websocket: WebSocket | null): websocket is WebSocket {
	return websocket?.readyState === WebSocket.OPEN;
}
