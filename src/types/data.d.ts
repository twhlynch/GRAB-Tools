export {};

declare global {
	export type LevelDetails = {
		identifier: string;
		iteration: number;
		data_key: string;
		complexity: number;
		title?: string;
		description?: string;
		creators?: Array<string>;
		tags?: Array<string | 'ok'>;
		verification_time?: number;
		curated_listings?: string[];
	};

	export type UserInfo = {
		user_id: string;
		user_name?: string;
		is_admin: boolean;
		is_supermoderator: boolean;
		is_moderator: boolean;
		is_verifier: boolean;
		is_creator: boolean;
	};
}
