import {SagaIterator} from 'redux-saga'
import {call, takeLatest, takeEvery} from 'redux-saga/effects'
import {select} from 'typed-redux-saga'
import {trackList} from './sound-config'
import {SectionChangeT, PlaySoundT, QueueVoiceT, VoiceTestControlT} from './sound-actions'
import {getSettings} from 'logic/local-settings/local-settings-selectors'
import {ToastT} from 'common/types/app'
import {useDispatch} from 'react-redux'
import {sendMsg} from 'logic/socket/socket-saga'

const audioCtx = new AudioContext()
const bgMusic = new Audio()
const sourceNode = audioCtx.createMediaElementSource(bgMusic)
const musicGainNode = audioCtx.createGain()
const soundGainNode = audioCtx.createGain()
const voiceGainNode = audioCtx.createGain()
sourceNode.connect(musicGainNode).connect(audioCtx.destination)
soundGainNode.connect(audioCtx.destination)
voiceGainNode.connect(audioCtx.destination)

bgMusic.loop = true
musicGainNode.gain.value = 0.75

let interacted = false

// @ts-ignore
window.bgMusic = bgMusic
// @ts-ignore
window.audioCtx = audioCtx

function* backgroundMusic(action: SectionChangeT): SagaIterator {
	const section = action.payload

	if (section !== 'game') {
		bgMusic.pause()
		bgMusic.currentTime = 0
		bgMusic.src = ''
		if (interacted) {
			audioCtx.resume()
		}
		return
	}

	const musicFile = trackList.game[Math.floor(Math.random() * trackList.game.length)]

	const newPath = `/music/${musicFile.file}`
	if (newPath !== bgMusic.getAttribute('src')) {
		bgMusic.src = newPath
		if (interacted) {
			audioCtx.resume().then(() => bgMusic.play())
		}
	}
}

function* playSoundSaga(action: PlaySoundT): SagaIterator {
	try {
		if (audioCtx.state !== 'running') return
		const settings = yield* select(getSettings)
		if (settings.soundVolume === '0') return

		const sound = new Audio(action.payload)
		const sourceNode = audioCtx.createMediaElementSource(sound)
		sourceNode.connect(soundGainNode)
		sound.onended = () => sourceNode.disconnect(soundGainNode)
		sound.play()
	} catch (err) {
		console.log(err)
	}
}

const voiceAudio = new Audio()
const voiceSourceNode = audioCtx.createMediaElementSource(voiceAudio)

const voiceLineQueue: string[] = []
function* playVoiceSaga(action: QueueVoiceT) {
	try {
		if (audioCtx.state !== 'running') return
		const settings = yield* select(getSettings)
		if (settings.voiceVolume === '0') return

		voiceLineQueue.push(...action.payload.lines.map((fileName) => `/voice/${fileName}.ogg`))

		if (voiceAudio.paused) {
			voiceAudio.src = voiceLineQueue.shift() ?? ''
			voiceSourceNode.connect(voiceGainNode)
			voiceAudio.onended = () => {
				const nextAudio = voiceLineQueue.shift()
				if (nextAudio) {
					voiceAudio.pause()
					voiceAudio.src = nextAudio
					voiceAudio.currentTime = 0
					voiceAudio.play()
				} else {
					voiceSourceNode.disconnect(voiceGainNode)
				}
			}
			voiceAudio.play()
		}
	} catch (err) {
		console.log(err)
	}
}

function* playVoiceTest(action: VoiceTestControlT) {
	if (action.payload === 'PLAY') {
		if (!voiceAudio.paused) return
		voiceAudio.src = '/voice/TEST.ogg'
		voiceAudio.onended = () => voiceSourceNode.disconnect(voiceGainNode)
		voiceSourceNode.connect(voiceGainNode)
		voiceAudio.play()
	} else {
		if (voiceAudio.paused) return
		voiceAudio.pause()
		voiceAudio.currentTime = 0
		voiceSourceNode.disconnect(voiceGainNode)
	}
}

function* settingSaga(): SagaIterator {
	try {
		const settings = yield* select(getSettings)
		musicGainNode.gain.value = Number(settings.musicVolume) / 100
		soundGainNode.gain.value = Number(settings.soundVolume) / 100
		voiceGainNode.gain.value = Number(settings.voiceVolume) / 100
	} catch (err) {
		console.error(err)
	}
}

function* soundSaga(): SagaIterator {
	// @ts-ignore
	yield call(settingSaga)
	yield takeEvery('SET_SETTING', settingSaga)
	yield takeLatest('@sound/SECTION_CHANGE', backgroundMusic)
	yield takeEvery('@sound/PLAY_SOUND', playSoundSaga)
	yield takeEvery('@sound/QUEUE_VOICE', playVoiceSaga)
	yield takeLatest('VOICE_TEST', playVoiceTest)
	document.addEventListener(
		'click',
		() => {
			if (bgMusic.getAttribute('src')) {
				audioCtx.resume().then(() => bgMusic.play())
			} else {
				audioCtx.resume()
			}
			interacted = true
		},
		{once: true}
	)
}

export default soundSaga
