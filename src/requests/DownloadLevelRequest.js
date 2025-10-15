export async function downloadLevelRequest(server, levelId) {
	const response = await fetch(
		server + 'download/' + levelId.split(':').join('/'),
	);
	if (response.status !== 200) {
		const responseBody = await response.text();
		window.toast('Error: ' + responseBody, 'error');
		return false;
	}
	return await response.arrayBuffer();
}
