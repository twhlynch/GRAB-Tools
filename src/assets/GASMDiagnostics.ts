import { compile_gasm, CompilerError } from '@/assets/AssemblyConversion';
import { RangeSetBuilder } from '@codemirror/state';
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from '@codemirror/view';

class ErrorWidget extends WidgetType {
	private message = '';

	constructor(message: string) {
		super();
		this.message = message;
	}

	toDOM() {
		const span = document.createElement('span');
		span.textContent = '   ■  ' + this.message;
		span.style.color = '#D8647E';
		span.style.fontSize = '0.9em';
		span.style.fontWeight = '700';
		span.style.pointerEvents = 'none';
		return span;
	}
}

export const gasmDiagnostics = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = this.buildDecorations(view);
		}

		update(update: ViewUpdate) {
			if (update.docChanged) {
				this.decorations = this.buildDecorations(update.view);
			}
		}

		buildDecorations(view: EditorView): DecorationSet {
			const builder = new RangeSetBuilder<Decoration>();
			const doc = view.state.doc.toString();

			try {
				compile_gasm(doc);
			} catch (e: unknown) {
				if (e instanceof Error) {
					const err = e as CompilerError;

					const lineNumber = err.line ?? 1;
					const message = err.message;

					const line = view.state.doc.line(lineNumber);

					builder.add(
						line.to,
						line.to,
						Decoration.widget({
							widget: new ErrorWidget(message),
							side: 1,
						}),
					);
				}
			}

			return builder.finish();
		}
	},
	{
		decorations: (v) => v.decorations,
	},
);
