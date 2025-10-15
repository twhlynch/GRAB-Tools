(() => {
	let url = window.location.href;
	let idRegex = /level=([^&]+)/;
	let match = url.match(idRegex);

	if (match && match[1]) {
		let id = match[1];
		let newUrl = 'http://grab-tools.live/editor?level=' + id;
		window.location.href = newUrl;
	} else {
		alert('Could not find level ID in the URL.');
	}
})();
