import { Root } from '@/common/levelNodes';
import { LevelLoader } from '@/editor/LevelLoader';
import { Reactive } from 'vue';

type Severity = 'message' | 'info' | 'warn' | 'warning' | 'err' | 'error';

declare global {
	interface Window {
		dataLayer?: IArguments[];
		_root?: Root;
		_levelLoader?: LevelLoader;
		toast: (
			message: string | Error,
			severity?: Severity,
			persistent?: boolean,
		) => void | {
			remove: () => void;
			message: Reactive<{
				value: string;
				error: Error | null;
				id: number;
				severity: Severity;
			}>;
		};
		panic: (error: Error) => void;
	}

	interface MediaStreamTrackProcessor {
		readable: ReadableStream<VideoFrame>;
	}

	var MediaStreamTrackProcessor: {
		new (init: { track: MediaStreamTrack }): MediaStreamTrackProcessor;
		readonly prototype: MediaStreamTrackProcessor;
	};

	interface HTMLVideoElement {
		captureStream: () => MediaStream;
	}
}
