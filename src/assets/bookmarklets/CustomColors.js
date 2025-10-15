(() => {
	let popupContainer = document.createElement('div');
	popupContainer.style.position = 'fixed';
	popupContainer.style.borderRadius = '10px';
	popupContainer.style.top = '50%';
	popupContainer.style.left = '50%';
	popupContainer.style.transform = 'translate(-50%, -50%)';
	popupContainer.style.padding = '20px';
	popupContainer.style.background = '#c3d7e6';
	popupContainer.style.border = 'solid 2px #4683ce70';
	popupContainer.style.zIndex = '9999';
	let colorPicker = document.createElement('input');
	colorPicker.type = 'color';
	colorPicker.value = '#010101';
	colorPicker.style.marginBottom = '10px';
	colorPicker.style.background = '#c3d7e6';
	colorPicker.style.border = 'solid 2px #4683ce70';
	colorPicker.style.borderRadius = '10px';
	let colorPicker2 = document.createElement('input');
	colorPicker2.type = 'color';
	colorPicker2.value = '#010101';
	colorPicker2.style.marginBottom = '10px';
	colorPicker2.style.background = '#c3d7e6';
	colorPicker2.style.border = 'solid 2px #4683ce70';
	colorPicker2.style.borderRadius = '10px';
	colorPicker2.style.float = 'right';
	let sendButton = document.createElement('button');
	sendButton.textContent = 'Send RGB Values';
	sendButton.style.padding = '8px 16px';
	sendButton.style.borderRadius = '10px';
	sendButton.style.cursor = 'pointer';
	sendButton.style.background = '#5f8cc235';
	sendButton.style.border = 'solid 2px #4683ce70';
	popupContainer.appendChild(colorPicker);
	popupContainer.appendChild(colorPicker2);
	popupContainer.appendChild(document.createElement('br'));
	popupContainer.appendChild(sendButton);
	sendButton.addEventListener('click', function () {
		let color = colorPicker.value;
		let color2 = colorPicker2.value;
		let red = parseInt(color.substring(1, 3), 16) / 255;
		let green = parseInt(color.substring(3, 5), 16) / 255;
		let blue = parseInt(color.substring(5, 7), 16) / 255;
		let red2 = parseInt(color2.substring(1, 3), 16) / 255;
		let green2 = parseInt(color2.substring(3, 5), 16) / 255;
		let blue2 = parseInt(color2.substring(5, 7), 16) / 255;
		if (red < 0.021) {
			red = 0.021;
		}
		if (green < 0.021) {
			green = 0.021;
		}
		if (blue < 0.021) {
			blue = 0.021;
		}
		if (red2 < 0.021) {
			red2 = 0.021;
		}
		if (green2 < 0.021) {
			green2 = 0.021;
		}
		if (blue2 < 0.021) {
			blue2 = 0.021;
		}
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
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
			},
		)
			.then(function (response) {
				return response;
			})
			.then(function (data) {
				console.log(data);
				if (data.status == 401) {
					alert('log in again');
				}
			})
			.catch(function (error) {
				console.error('Error:', error);
			});
	});
	document.body.appendChild(popupContainer);
})();
