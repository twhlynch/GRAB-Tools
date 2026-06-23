export {};

declare global {
	export interface LevelDetails {
		identifier: string;
		iteration: number;
		data_key: string;
		complexity: number;
		title?: string;
		description?: string;
		creators?: string[];
		tags?: string[];
		verification_time?: number;
		curated_listings?: string[];
	}

	export interface UserInfo {
		user_id: string;
		user_name?: string;
		is_admin: boolean;
		is_supermoderator: boolean;
		is_moderator: boolean;
		is_verifier: boolean;
		is_creator: boolean;
	}
}
