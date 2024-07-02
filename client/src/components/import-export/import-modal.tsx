import * as AlertDialog from '@radix-ui/react-alert-dialog'
import {useState, useRef} from 'react'
import Button from 'components/button'
import {PlayerDeckT} from 'common/types/deck'
import Dropdown from 'components/dropdown'
import ModalCSS from 'components/alert-modal/alert-modal.module.scss'
import DropdownCSS from '../../app/deck/deck.module.scss'
import css from './import-export.module.scss'
import {getDeckFromHash} from './import-export-utils'
import {CardInstance} from '../../../../common/types/game-state'
import {EnergyT} from 'common/types/cards'
import {saveDeck} from 'logic/saved-decks/saved-decks'
import {LocalCardInstance} from 'common/types/server-requests'

type Props = {
	setOpen: boolean
	onClose: (isOpen: boolean) => void
	importDeck: (deck: PlayerDeckT, noActiveChange?: boolean) => void
	handleMassImport: () => void
}

export const ImportModal = ({setOpen, onClose, importDeck, handleMassImport}: Props) => {
	const nameRef = useRef<HTMLInputElement | null>(null)
	const hashRef = useRef<HTMLInputElement | null>(null)
	const [deckIcon, setDeckIcon] = useState<PlayerDeckT['icon']>('any')

	//IMPORT DECK FUNCTION
	const importFromHash = () => {
		if (!hashRef.current) return
		let deck: Array<LocalCardInstance> = []

		try {
			deck = getDeckFromHash(hashRef.current.value)
		} catch {
			console.log('Invalid deck to import: ' + hashRef.current.value)
		}

		if (deck.length < 1) return null

		if (!deck) return null

		importDeck({
			name: nameRef?.current?.value || 'Imported Deck',
			icon: deckIcon,
			cards: deck,
		})

		onClose(true)
	}
	const selectFile = () => {
		// Select a file by clicking on file input
		document.getElementById('file-input')?.click()
	}

	const importFromFile = (file: File | undefined) => {
		if (!file) return
		const fileResult = file.text()
		if (!fileResult) return

		fileResult.then((newFileContent: string) => {
			let importedSomething = false

			newFileContent.split('\n').forEach((line: string) => {
				const lineComponents: string[] = line.split(':')
				if (lineComponents.length !== 3) return
				const deck = getDeckFromHash(lineComponents[2].replace('\r', ''))
				if (deck.length === 0) return

				const filteredName = lineComponents[0].match(`^[a-zA-Z0-9 ]*$`)?.toString()
				if (!filteredName) {
					return
				}

				importedSomething = true
				saveDeck({
					name: filteredName,
					icon: DECK_ICONS.includes(lineComponents[1]) ? (lineComponents[1] as EnergyT) : 'any',
					cards: deck,
				})
			})

			if (importedSomething) {
				console.log('Successfully imported decks from file: ' + file.name)
				handleMassImport()
			} else {
				console.log('Failed to import decks from file: ' + file.name)
			}
		})
	}

	const DECK_ICONS = [
		'any',
		'balanced',
		'builder',
		'explorer',
		'farm',
		'miner',
		'prankster',
		'pvp',
		'redstone',
		'speedrunner',
		'terraform',
	]

	const iconDropdownOptions = DECK_ICONS.map((option) => ({
		name: option,
		key: option,
		icon: `/images/types/type-${option}.png`,
	}))

	//JSX
	return (
		<AlertDialog.Root open={setOpen} onOpenChange={(e) => onClose(e)}>
			<AlertDialog.Portal container={document.getElementById('modal')}>
				<AlertDialog.Overlay className={ModalCSS.AlertDialogOverlay} />
				<AlertDialog.Content className={ModalCSS.AlertDialogContent}>
					<AlertDialog.Title className={ModalCSS.AlertDialogTitle}>
						Import Decks
						<AlertDialog.Cancel asChild>
							<button className={ModalCSS.xClose}>
								<img src="/images/CloseX.svg" alt="close" />
							</button>
						</AlertDialog.Cancel>
					</AlertDialog.Title>
					<AlertDialog.Description asChild className={ModalCSS.AlertDialogDescription}>
						<div>
							{/* IMPORT SECTION */}
							<div>
								<div className={css.importControls}>
									<p
										className={css.instructions}
									>{`To import a deck, select a deck icon, give your deck a name, enter the Deck Hash, then click Import.`}</p>
									<div className={css.name}>
										<Dropdown
											button={
												<button className={DropdownCSS.iconButton}>
													<img src={`/images/types/type-${deckIcon}.png`} />
												</button>
											}
											label="Deck Icon"
											options={iconDropdownOptions}
											action={(option: any) => setDeckIcon(option)}
										/>
										<input
											type="text"
											maxLength={32}
											placeholder="Deck Name"
											ref={nameRef}
											style={{flexGrow: 1}}
										/>
									</div>
									<input
										type="text"
										placeholder="Deck Hash..."
										ref={hashRef}
										style={{flexGrow: 1}}
									/>

									<p
										className={css.instructions}
									>{`Alternatively, choose a file to mass import decks from. Hashes must each occupy one line, with no spaces before or after the hash.`}</p>

									<p
										className={css.warning}
									>{`Note that this will overwrite any decks with the same name.`}</p>
								</div>
							</div>
						</div>
					</AlertDialog.Description>
					<div className={ModalCSS.buttonContainer}>
						<Button onClick={importFromHash}>Import</Button>
						<Button onClick={selectFile}>Import from file</Button>
						<input
							id="file-input"
							type="file"
							onChange={(e) => importFromFile(e.target.files ? e.target.files[0] : undefined)}
							style={{display: 'none'}}
						/>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	)
}
