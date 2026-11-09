import { SERVER_URL } from '@/config';
import { useUserStore } from '@/stores/user';

export function revoke_access_token_request() {
	const user = useUserStore();
	const url = `${SERVER_URL}expire_access_token?access_token=${user.access_token}`;

	try {
		void fetch(url);
	} catch {
		// dont care
	}
}
