(() => {
	if (location.hostname === 'grabvr.quest') {
		document.getElementById('download-button').click();
	} else if (location.hostname === 'grabvr.tools') {
		window.toast('Use in the level viewer (grabvr.quest)');
	}
})();
