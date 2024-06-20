import config from './../../server-config.json'
import debugConfig from './../../debug-config.json'
import ranks from './ranks.json'
import expansions from './expansions.json'

// __APP_VERSION__ is defined in vite.config.js and esbuild.js.
declare const __APP_VERSION__: string
let appVersion
try {
	appVersion = __APP_VERSION__
} catch {
	// We are running with tsx, so __APP_VERSION__ was not set.
	appVersion = 'unknown'
}
export const VERSION = appVersion

export const CONFIG = config
export const DEBUG_CONFIG = debugConfig
export const RANKS = ranks
export const EXPANSIONS = expansions
