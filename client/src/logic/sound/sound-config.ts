type track = {
	name: string
	artist: string
	file: string
}

export const trackList: Record<string, Array<track>> = {
	game: [
		{
			name: 'Collector',
			artist: 'L1qu1fy',
			file: 'collector.ogg',
		},
		{
			name: 'Tabletop',
			artist: 'L1qu1fy',
			file: 'tabletop.ogg',
		},
		{
			name: 'Recontre',
			artist: 'Ben Haussman',
			file: 'recontre.ogg',
		},
	],
}
