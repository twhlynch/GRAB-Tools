import { compile_gasm } from '@/assets/AssemblyConversion';
import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, ViewPlugin, WidgetType } from '@codemirror/view';

class ErrorWidget extends WidgetType {
	constructor(message) {
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
		constructor(view) {
			this.decorations = this.buildDecorations(view);
		}

		update(update) {
			if (update.docChanged) {
				this.decorations = this.buildDecorations(update.view);
			}
		}

		buildDecorations(view) {
			const builder = new RangeSetBuilder();
			const doc = view.state.doc.toString();

			try {
				compile_gasm(doc);
			} catch (e) {
				const lineNumber = e.line ?? 1;
				const message = e.message;

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

			return builder.finish();
		}
	},
	{
		decorations: (v) => v.decorations,
	},
);
