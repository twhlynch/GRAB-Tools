(() => {
	let newStyles = document.createElement('style');
	newStyles.innerHTML = `
.gtl-btn {
    cursor: pointer;
    background-color: #5f8cc235;
    border: solid 2px #4683ce70;
    text-decoration: none;
    color: #5b5f64;
    font-size: 12px;
    font-weight: 600;
    padding: 6px;
    border-radius: 0.375rem;
    margin: 3px 3px;
    width: fit-content;
}
.gtl-buttons {
    display: flex;
    flex-direction: row;
}
.gtl-stats-container {
    padding-bottom: 15px;
    padding-top: 15px;
    width: 100%;
    height: auto;
    margin-bottom: 10px;
    border-radius: 10px;
    background-color: #fff;
    padding-left: 10px;
    padding-right: 10px;
}
.gtl-popup-container {
    position: absolute;
    border-radius: 10px;
    top: 20px;
    left: 20px;
    padding: 10px;
    background: #c3d7e6;
    border: solid 2px #4683ce70;
    z-index: 9999;
}
.gtl-color-picker {
    margin-bottom: 10px;
    background-color: #5f8cc235;
    border: solid 2px #4683ce70;
    border-radius: 0.375rem;
}
.gtl-bg {
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: -2;

    background-image: linear-gradient(#5f8bc2, #cfe0ea, #5f8bc2);
    background-size: cover;
    background-repeat: no-repeat;
    background-attachment: fixed;
}

/* overrides */
.download-button {
    display: block !important;
}
#level-browser {
    background: none !important;
}
`;
	document.head.appendChild(newStyles);

	const version = '1.6';
	const domain = window.location.hostname;
	const path = window.location.pathname;
	const query = window.location.search;
	let layout = false;
	console.log(`Domain: ${domain}\nPath: ${path}\nQuery: ${query}`);

	if (domain === 'grabvr.tools') {
		grabToolsScript();
	} else if (domain === 'grabvr.quest') {
		grabVRScript();
	}

	function checkForUpdates() {
		fetch(
			'https://raw.githubusercontent.com/twhlynch/grab-tools-extension/refs/heads/main/chrome-extension/manifest.json',
		)
			.then((response) => response.json())
			.then((data) => {
				if (
					data.version !== /*chrome.runtime.getManifest().*/ version
				) {
					window.toast('Extension update available');
				}
			});
	}

	function grabToolsScript() {
		if (path === '' || path === '/') {
			checkForUpdates();
		}
	}

	function grabVRScript() {
		if (path === '/levels' || path === '/levels/') {
			const observer = new MutationObserver(handleMutations);
			observer.observe(document.body, { childList: true, subtree: true });
			createColorPicker();

			const customBackground = document.createElement('div');
			customBackground.classList.add('gtl-bg');
			document.body.appendChild(customBackground);

			const layoutButton = document.createElement('button');
			layoutButton.classList.add('gtl-btn');
			layoutButton.textContent = 'Compact Layout';
			layoutButton.style.position = 'absolute';
			layoutButton.style.top = '120px';
			layoutButton.style.left = '20px';
			layoutButton.style.zIndex = '200';
			layoutButton.style.backgroundColor = '#c3d7e6';

			layoutButton.addEventListener('click', () => {
				layout = true;
				document.getElementById('app').style.maxWidth = '100%';
				let levelGrids =
					document.getElementsByClassName('grid-container');
				levelGrids[0].style.gridTemplateColumns =
					'repeat(auto-fill, minmax(150px, 1fr))';
				let levelCards = document.getElementsByClassName('level-card');
				for (let i = 0; i < levelCards.length; i++) {
					levelCards[i].style.padding = '3% 3% 30px';
					levelCards[i].style.lineHeight = '20px';
					levelCards[i].style.left = '3%';

					let children = levelCards[i].childNodes;
					for (let j = 0; j < children.length; j++) {
						let child = children[j];
						if (
							child.nodeType !== Node.COMMENT_NODE &&
							((child.classList &&
								!child.classList.contains('thumbnail') &&
								!child.classList.contains('play-button') &&
								!child.classList.contains('title')) ||
								!child.classList)
						) {
							console.log(child);
							child.style.display = 'none';
						}
						if (
							child.classList &&
							child.classList.contains('play-button')
						) {
							//
						} else if (
							child.classList &&
							child.classList.contains('title')
						) {
							child.style.fontSize = '12px';
						}
					}
				}
			});

			document.body.appendChild(layoutButton);

			if (query.includes('user_id=') || query.includes('tab_my_levels')) {
				let userId;
				if (query.includes('tab_my_levels')) {
					userId = JSON.parse(localStorage.user).user.info.user_id;
				} else {
					userId = query.split('user_id=')[1];
				}

				fetch(
					`https://api.slin.dev/grab/v1/list?max_format_version=100&user_id=${userId}`,
				)
					.then((response) => {
						return response.json();
					})
					.then((data) => {
						let total_plays = 0;
						let total_okplays = 0;
						let total_maps = 0;
						let total_ok = 0;
						let average_likes = 0;
						let likes_count = 0;
						let average_difficulty = 0;
						let difficulty_count = 0;
						let average_time = 0;
						let time_count = 0;
						let total_complexity = 0;

						data.forEach((item) => {
							total_maps += 1;
							item?.statistics?.total_played
								? (total_plays +=
										item?.statistics?.total_played)
								: null;
							item?.tags?.includes('ok')
								? (total_okplays +=
										item?.statistics?.total_played)
								: null;
							item?.tags?.includes('ok') ? (total_ok += 1) : null;
							item?.statistics?.liked
								? (average_likes += item?.statistics?.liked)
								: null;
							item?.statistics?.liked ? (likes_count += 1) : null;
							item?.statistics?.difficulty
								? (average_difficulty +=
										item?.statistics?.difficulty)
								: null;
							item?.statistics?.difficulty
								? (difficulty_count += 1)
								: null;
							item?.statistics?.time
								? (average_time += item?.statistics?.time)
								: null;
							item?.statistics?.time ? (time_count += 1) : null;
							item?.complexity
								? (total_complexity += item?.complexity)
								: null;
						});

						const playResults = document.createElement('div');
						playResults.classList.add('gtl-stats');
						playResults.textContent = `Plays: ${total_plays}`;

						const okPlayResults = document.createElement('div');
						okPlayResults.classList.add('gtl-stats');
						okPlayResults.textContent = `Verified plays: ${total_okplays}`;

						const mapResults = document.createElement('div');
						mapResults.classList.add('gtl-stats');
						mapResults.textContent = `Maps: ${total_maps}`;

						const okResults = document.createElement('div');
						okResults.classList.add('gtl-stats');
						okResults.textContent = `Verified maps: ${total_ok}`;

						const likesResults = document.createElement('div');
						likesResults.classList.add('gtl-stats');
						likesResults.textContent = `Avg likes: ${Math.round(
							(average_likes * 100) / likes_count,
						)}%`;

						const difficultyResults = document.createElement('div');
						difficultyResults.classList.add('gtl-stats');
						difficultyResults.textContent = `Avg difficulty: ${Math.round(
							100 - (average_difficulty * 100) / difficulty_count,
						)}%`;

						const timeResults = document.createElement('div');
						timeResults.classList.add('gtl-stats');
						timeResults.textContent = `Avg time: ${Math.round(
							Math.round(average_time / time_count),
						)}s`;

						const complexityResults = document.createElement('div');
						complexityResults.classList.add('gtl-stats');
						complexityResults.textContent = `Complexity: ${total_complexity}`;

						const stats = document.createElement('div');
						stats.classList.add('gtl-stats-container');
						stats.appendChild(playResults);
						stats.appendChild(okPlayResults);
						stats.appendChild(mapResults);
						stats.appendChild(okResults);
						stats.appendChild(likesResults);
						stats.appendChild(difficultyResults);
						stats.appendChild(timeResults);
						stats.appendChild(complexityResults);

						const title = document.getElementsByClassName(
							'user-tab-title-container',
						)[0];
						title.parentNode.insertBefore(stats, title.nextSibling);
					});
			}
		} else if (path === '/levels/viewer' || path === '/levels/viewer/') {
			const levelId = query
				.split('?level=')[1]
				.replace('&verify_queue', '');

			const editButton = document.createElement('a');
			editButton.classList.add('gtl-btn');
			editButton.setAttribute('target', '_blank');
			editButton.setAttribute(
				'href',
				`https://grabvr.tools/editor?level=${levelId}`,
			);
			editButton.textContent = 'Edit JSON';

			const downloadButton = document.createElement('a');
			downloadButton.classList.add('gtl-btn');
			downloadButton.setAttribute('target', '_blank');
			downloadButton.setAttribute(
				'href',
				`https://grabvr.tools/download?level=${levelId}`,
			);
			downloadButton.textContent = 'Download';

			const buttons = document.createElement('div');
			buttons.classList.add('gtl-buttons');

			[downloadButton, editButton].forEach((btn) => {
				btn.style.color = 'rgb(42 63 89)';
				btn.style.width = 'fit-content';
			});

			buttons.appendChild(editButton);
			buttons.appendChild(downloadButton);

			document.getElementById('info').prepend(buttons);
			document.getElementById('download-button').style.display = 'block';
		}
	}

	function addButtonsToCard(element) {
		const card = element.childNodes[0];

		if (!layout) {
			const playButton = card.childNodes[card.childNodes.length - 2];
			const levelUrl = playButton.getAttribute('href');
			const levelId = levelUrl
				.split('?level=')[1]
				.replace('&verify_queue', '');
			const detailsUrl = `https://api.slin.dev/grab/v1/details/${levelId
				.split(':')
				.join('/')}`;

			const editButton = document.createElement('a');
			editButton.classList.add('gtl-btn');
			editButton.setAttribute('target', '_blank');
			editButton.setAttribute(
				'href',
				`https://grabvr.tools/editor?level=${levelId}`,
			);
			editButton.textContent = 'Edit JSON';

			const downloadButton = document.createElement('a');
			downloadButton.classList.add('gtl-btn');
			downloadButton.setAttribute('target', '_blank');
			downloadButton.setAttribute(
				'href',
				`https://grabvr.tools/download?level=${levelId}`,
			);
			downloadButton.textContent = 'Download';

			card.appendChild(editButton);
			card.appendChild(downloadButton);
		} else {
			let levelGrids = document.getElementsByClassName('grid-container');
			levelGrids[0].style.gridTemplateColumns =
				'repeat(auto-fill, minmax(150px, 1fr))';
			card.style.padding = '3% 3% 30px';
			card.style.lineHeight = '20px';
			card.style.left = '3%';

			let children = card.childNodes;
			for (let j = 0; j < children.length; j++) {
				let child = children[j];
				if (
					child.nodeType !== Node.COMMENT_NODE &&
					((child.classList &&
						!child.classList.contains('thumbnail') &&
						!child.classList.contains('play-button') &&
						!child.classList.contains('title')) ||
						!child.classList)
				) {
					console.log(child);
					child.style.display = 'none';
				}
				if (
					child.classList &&
					child.classList.contains('play-button')
				) {
					//
				} else if (
					child.classList &&
					child.classList.contains('title')
				) {
					child.style.fontSize = '12px';
				}
			}
		}
	}

	function handleMutations(mutations) {
		mutations.forEach(function (mutation) {
			if (mutation.type === 'childList') {
				mutation.addedNodes.forEach(function (node) {
					if (
						node.classList &&
						node.classList.contains('grid-item')
					) {
						addButtonsToCard(node);
					}
				});
			}
		});
	}

	function createColorPicker() {
		var popupContainer = document.createElement('div');
		popupContainer.className = 'gtl-popup-container';

		var colorPicker = document.createElement('input');
		colorPicker.type = 'color';
		colorPicker.className = 'gtl-color-picker';

		var colorPicker2 = document.createElement('input');
		colorPicker2.type = 'color';
		colorPicker2.className = 'gtl-color-picker';
		colorPicker2.style.float = 'right';

		[colorPicker, colorPicker2].forEach((picker) => {
			picker.value = '#010101';
			picker.addEventListener('change', () => {
				if (
					parseInt(picker.value.substring(1, 3), 16) < 6 &&
					parseInt(picker.value.substring(3, 5), 16) < 6 &&
					parseInt(picker.value.substring(5, 7), 16) < 6
				) {
					picker.value = '#010101';
				}
			});
		});

		var sendButton = document.createElement('button');
		sendButton.textContent = 'Send RGB Values';
		sendButton.className = 'gtl-btn';

		popupContainer.appendChild(colorPicker);
		popupContainer.appendChild(colorPicker2);
		popupContainer.appendChild(document.createElement('br'));
		popupContainer.appendChild(sendButton);

		sendButton.addEventListener('click', function () {
			var color = colorPicker.value;
			var color2 = colorPicker2.value;
			var red = parseInt(color.substring(1, 3), 16) / 255;
			var green = parseInt(color.substring(3, 5), 16) / 255;
			var blue = parseInt(color.substring(5, 7), 16) / 255;

			var red2 = parseInt(color2.substring(1, 3), 16) / 255;
			var green2 = parseInt(color2.substring(3, 5), 16) / 255;
			var blue2 = parseInt(color2.substring(5, 7), 16) / 255;

			const requestBody = JSON.parse(localStorage.user).user.info
				.active_customizations;
			requestBody.player_color_primary.color = [red, green, blue];
			requestBody.player_color_secondary.color = [red2, green2, blue2];
			fetch(
				`https://api.slin.dev/grab/v1/set_active_customizations?access_token=${
					JSON.parse(localStorage.user).user.access_token
				}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				},
			)
				.then(function (response) {
					return response;
				})
				.then(function (data) {
					console.log(data);
					alert('Success!');
				})
				.catch(function (error) {
					console.error('Error:', error);
				});
		});

		document.body.appendChild(popupContainer);
	}
})();
