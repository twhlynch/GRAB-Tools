(() => {
	if (location.hostname === 'grabvr.quest') {
		location.hostname = 'grabvr.tools';
	} else if (location.hostname === 'grabvr.tools') {
		window.toast('Use in the level viewer (grabvr.quest)');
	}
})();
