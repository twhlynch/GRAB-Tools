(() => {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	const error = window.toast ?? confirm;

	if (location.hostname !== 'grabvr.quest') {
		return error('Use in the level viewer (grabvr.quest)');
	}

	const get_user_info = (): {
		user?: {
			access_token?: string;
			info?: {
				active_customizations?: {
					player_color_primary?: {
						color?: [number, number, number];
					};
					player_color_secondary?: {
						color?: [number, number, number];
					};
				};
			};
		};
	} => {
		const user = localStorage.getItem('user');
		if (!user) return {};

		try {
			const json = JSON.parse(user);
			return json ?? {};
		} catch {
			return {};
		}
	};

	const popupContainer = document.createElement('div');
	popupContainer.style.position = 'fixed';
	popupContainer.style.borderRadius = '10px';
	popupContainer.style.top = '50%';
	popupContainer.style.left = '50%';
	popupContainer.style.transform = 'translate(-50%, -50%)';
	popupContainer.style.padding = '20px';
	popupContainer.style.background = '#c3d7e6';
	popupContainer.style.border = 'solid 2px #4683ce70';
	popupContainer.style.zIndex = '9999';
	const colorPicker = document.createElement('input');
	colorPicker.type = 'color';
	colorPicker.value = '#010101';
	colorPicker.style.marginBottom = '10px';
	colorPicker.style.background = '#c3d7e6';
	colorPicker.style.border = 'solid 2px #4683ce70';
	colorPicker.style.borderRadius = '10px';
	const colorPicker2 = document.createElement('input');
	colorPicker2.type = 'color';
	colorPicker2.value = '#010101';
	colorPicker2.style.marginBottom = '10px';
	colorPicker2.style.background = '#c3d7e6';
	colorPicker2.style.border = 'solid 2px #4683ce70';
	colorPicker2.style.borderRadius = '10px';
	colorPicker2.style.float = 'right';
	const sendButton = document.createElement('button');
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
	document.body.appendChild(popupContainer);

	sendButton.addEventListener('click', async () => {
		const min = 0.021;
		const parse_color = (color: string, pos: number) =>
			Math.max(min, parseInt(color.substring(pos, pos + 2), 16) / 255);

		const color1 = colorPicker.value;
		const color2 = colorPicker2.value;

		const red1 = parse_color(color1, 1);
		const green1 = parse_color(color1, 3);
		const blue1 = parse_color(color1, 5);
		const red2 = parse_color(color2, 1);
		const green2 = parse_color(color2, 3);
		const blue2 = parse_color(color2, 5);

		const { user } = get_user_info();
		const { info, access_token } = user ?? {};
		if (!access_token || !info) return error('Log in first');

		const customizations = info.active_customizations ?? {};
		customizations.player_color_primary ??= {};
		customizations.player_color_secondary ??= {};
		customizations.player_color_primary.color = [red1, green1, blue1];
		customizations.player_color_secondary.color = [red2, green2, blue2];

		const url = 'https://api.slin.dev/grab/v1/set_active_customizations';
		const body = JSON.stringify(customizations);

		try {
			const response = await fetch(
				`${url}?access_token=${access_token}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: body,
				},
			);
			console.log(response);

			if (!response.ok) return error('Log in again');
		} catch (e) {
			if (e instanceof Error) {
				console.error(e);
				return error(`Error. Try logging in again: ${e.message}`);
			}
		}
	});
})();
