export const sectionChange = (payload: string) => ({
	type: '@sound/SECTION_CHANGE' as const,
	payload,
})
export type SectionChangeT = ReturnType<typeof sectionChange>

export const playSound = (path: string) => ({
	type: '@sound/PLAY_SOUND' as const,
	payload: path,
})
export type PlaySoundT = ReturnType<typeof playSound>

export const queueVoice = (lines: string[]) => ({
	type: '@sound/QUEUE_VOICE' as const,
	payload: {lines},
})
export type QueueVoiceT = ReturnType<typeof queueVoice>

export const controlVoiceTest = (payload: 'PLAY' | 'STOP') => ({
	type: 'VOICE_TEST' as const,
	payload,
})
export type VoiceTestControlT = ReturnType<typeof controlVoiceTest>
