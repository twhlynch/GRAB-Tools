(() => {
	if (location.hostname === 'grabvr.quest') {
		const params = new URLSearchParams(window.location.search);
		const id = params.get('level');
		if (id) {
			let newUrl = 'https://grabvr.tools/download?level=' + id;
			window.location.href = newUrl;
		}
	} else if (location.hostname === 'grabvr.tools') {
		window.toast('Use in the level viewer (grabvr.quest)');
	}
})();
