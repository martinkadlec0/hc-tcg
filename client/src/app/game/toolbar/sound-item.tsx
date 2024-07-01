import {useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {setSetting} from 'logic/local-settings/local-settings-actions'
import {getSettings} from 'logic/local-settings/local-settings-selectors'
import {SpeakerIcon} from 'components/svgs'
import css from './toolbar.module.scss'

function SoundItem() {
	const dispatch = useDispatch()
	const settings = useSelector(getSettings)
	const [originalSoundVolume] = useState<string>(settings.soundVolume)
	const [originalMusicVolume] = useState<string>(settings.musicVolume)
	const [originalVoiceVolume] = useState<string>(settings.voiceVolume)

	const handleSoundChange = () => {
		// if volume is on, turn it off.
		// if originalVolume is 0, turn it to 100.
		// if volume is off, turn it back to originalVolume.
		const newSoundVolume =
			settings.soundVolume !== '0' ? '0' : originalSoundVolume === '0' ? '100' : originalSoundVolume
		const newMusicVolume =
			settings.musicVolume !== '0' ? '0' : originalMusicVolume === '0' ? '100' : originalMusicVolume
		const newVoiceVolume =
			settings.voiceVolume !== '0' ? '0' : originalVoiceVolume === '0' ? '100' : originalVoiceVolume

		dispatch(setSetting('soundVolume', newSoundVolume))
		dispatch(setSetting('musicVolume', newMusicVolume))
		dispatch(setSetting('voiceVolume', newVoiceVolume))
	}

	return (
		<button className={css.item} title="Toggle Sounds" onClick={handleSoundChange}>
			<SpeakerIcon level={settings.soundVolume} />
		</button>
	)
}

export default SoundItem
