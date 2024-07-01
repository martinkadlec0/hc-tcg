import React, {useState} from 'react'
import css from './main-menu.module.scss'
import {useSelector, useDispatch} from 'react-redux'
import Slider from 'components/slider'
import {setSetting} from 'logic/local-settings/local-settings-actions'
import {controlVoiceTest} from 'logic/sound/sound-actions'
import {getSettings} from 'logic/local-settings/local-settings-selectors'
import {getStats} from 'logic/fbdb/fbdb-selectors'
import MenuLayout from 'components/menu-layout'
import Button from 'components/button'
import UpdatesModal from 'components/updates'

type Props = {
	setMenuSection: (section: string) => void
}
function Settings({setMenuSection}: Props) {
	const dispatch = useDispatch()
	const stats = useSelector(getStats)
	const settings = useSelector(getSettings)
	const totalGames = Object.values(stats).reduce((a, b) => a + b, 0)

	const handleSoundChange = (ev: React.SyntheticEvent<HTMLInputElement>) => {
		dispatch(setSetting('soundVolume', ev.currentTarget.value))
	}
	const handleMusicChange = (ev: React.SyntheticEvent<HTMLInputElement>) => {
		dispatch(setSetting('musicVolume', ev.currentTarget.value))
	}
	const handleVoiceChange = (ev: React.SyntheticEvent<HTMLInputElement>) => {
		dispatch(setSetting('voiceVolume', ev.currentTarget.value))
		dispatch(controlVoiceTest('PLAY'))
	}
	const changeMenuSection = (section: string) => {
		dispatch(controlVoiceTest('STOP'))
		setMenuSection(section)
	}

	const handlePanoramaToggle = () => {
		dispatch(setSetting('panoramaEnabled', !settings.panoramaEnabled))
	}
	const getBoolDescriptor = (value?: boolean) => {
		return value ? 'Enabled' : 'Disabled'
	}
	const getPercDescriptor = (value?: string) => {
		if (value !== '0') return `${value}%`
		return 'Disabled'
	}
	const handleGameSettings = () => changeMenuSection('game-settings')
	const handleDataSettings = () => changeMenuSection('data-settings')

	const handleCredits = () => changeMenuSection('credits')

	const [updatesOpen, setUpdatesOpen] = useState<boolean>(false)
	const handleUpdates = () => {
		setUpdatesOpen(true)
	}

	return (
		<>
			{updatesOpen ? (
				<UpdatesModal updatesOpen={updatesOpen} setUpdatesOpen={setUpdatesOpen} />
			) : (
				<></>
			)}
			<MenuLayout
				back={() => changeMenuSection('mainmenu')}
				title="More"
				returnText="Main Menu"
				className={css.settingsMenu}
			>
				<div className={css.settings}>
					<Slider value={settings.musicVolume} onInput={handleMusicChange}>
						Music: {getPercDescriptor(settings.musicVolume)}
					</Slider>
					<Slider value={settings.soundVolume} onInput={handleSoundChange}>
						Sounds: {getPercDescriptor(settings.soundVolume)}
					</Slider>
					<Slider value={settings.voiceVolume} onInput={handleVoiceChange}>
						Voice: {getPercDescriptor(settings.voiceVolume)}
					</Slider>
					<Button variant="stone" onClick={handlePanoramaToggle}>
						Panorama: {getBoolDescriptor(settings.panoramaEnabled)}
					</Button>
					<Button variant="stone" onClick={handleGameSettings}>
						Game Settings
					</Button>
					<Button variant="stone" onClick={handleDataSettings}>
						Data Management
					</Button>
					<Button variant="stone" onClick={handleCredits}>
						Credits
					</Button>
					<Button variant="stone" onClick={handleUpdates}>
						Updates
					</Button>
				</div>

				<h2>Statistics</h2>
				<div className={css.settings}>
					<div className={css.stats}>
						<div className={css.stat}>
							<span>Games Played</span>
							<span>{totalGames}</span>
						</div>
						<div className={css.stat}>
							<span>Wins</span>
							<span>{stats.w}</span>
						</div>
						<div className={css.stat}>
							<span>Losses</span>
							<span>{stats.l}</span>
						</div>
						<div className={css.stat}>
							<span>Ties</span>
							<span>{stats.t}</span>
						</div>
						<div className={css.stat}>
							<span>Forfeit Wins</span>
							<span>{stats.fw}</span>
						</div>
						<div className={css.stat}>
							<span>Forfeit Losses</span>
							<span>{stats.fl}</span>
						</div>
					</div>
				</div>
			</MenuLayout>
		</>
	)
}

export default Settings
