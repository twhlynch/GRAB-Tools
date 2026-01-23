// urls
export const DOMAIN = `grabvr.tools`;

export const PAGE_URL = `https://${DOMAIN}/`;
export const SERVER_URL = `https://api.${DOMAIN}/`;
// export const WIKI_URL = `https://wiki.${DOMAIN}/`;
export const WIKI_URL = `https://grabvr.miraheze.org/`;
export const DISCORD_URL = `https://discord.${DOMAIN}/`;
export const STATS_URL = `https://grab-tools.live/stats_data/`;
export const PYTHON_SERVER_URL = `https://dotindex.pythonanywhere.com`;

// grab urls
const GRAB_DOMAIN = `slin.dev`;

export const GRAB_SERVER_URL = `https://api.${GRAB_DOMAIN}/grab/v1/`;
export const GRAB_DATA_URL = `https://grab-data.${GRAB_DOMAIN}/`;
export const GRAB_IMAGES_URL = `https://grab-images.${GRAB_DOMAIN}/`;

export const GRAB_PAGE_URL = `https://grabvr.quest/`;
export const GRAB_LEVELS_URL = `${GRAB_PAGE_URL}levels/`;
export const GRAB_VIEWER_URL = `${GRAB_LEVELS_URL}viewer?level=`;
export const GRAB_USER_URL = `${GRAB_LEVELS_URL}?tab=tab_other_user&user_id=`;

// other
export const REPO_URL = `https://github.com/twhlynch/GRAB-Tools`;
export const SUPPORT_EMAIL = `support@${DOMAIN}`;

export const GOOGLE_TAG_ID = `G-BDS57RBQ3Q`;

export const FORMAT_VERSION = 18;

import pkg from '../package.json';
export const VERSION = pkg.version;
