(() => {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	const error = window.toast ?? confirm;

	if (location.hostname !== 'grabvr.quest') {
		return error('Use in the level viewer (grabvr.quest)');
	}

	location.hostname = 'grabvr.tools';
})();
