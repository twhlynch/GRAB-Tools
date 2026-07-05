(() => {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	const error = window.toast ?? confirm;

	if (location.hostname !== 'grabvr.quest') {
		return error('Use in the level viewer (grabvr.quest)');
	}

	const params = new URLSearchParams(window.location.search);
	const level = params.get('level');
	if (!level) return error('Not a level url');

	window.location.href = `https://grabvr.tools/download?level=${level}`;
})();
