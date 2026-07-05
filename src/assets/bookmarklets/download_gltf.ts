(() => {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	const error = window.toast ?? confirm;

	if (location.hostname !== 'grabvr.quest') {
		return error('Use in the level viewer (grabvr.quest)');
	}

	const download_button = document.getElementById('download-button');
	if (!download_button) return error('Failed to download');

	download_button.click();
})();
