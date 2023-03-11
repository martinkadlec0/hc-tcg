import {useState} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {CardT} from 'common/types/game-state'
import {PickProcessT, PickedCardT} from 'common/types/pick-process'
import CardList from 'components/card-list'
import Board from './board'
import css from './game.module.css'
import AttackModal from './modals/attack-modal'
import ConfirmModal from './modals/confirm-modal'
import SpyglassModal from './modals/spyglass-modal'
import ChestModal from './modals/chest-modal'
import BorrowModal from './modals/borrow-modal'
import ChangeHermitModal from './modals/change-hermit-modal'
import ForfeitModal from './modals/forfeit-modal'
import UnmetCondition from './modals/unmet-condition-modal'
import EndTurnModal from './modals/end-turn-modal'
import MouseIndicator from './mouse-indicator'
import EndGameOverlay from './end-game-overlay'
import Chat from './chat'
import {
	getGameState,
	getSelectedCard,
	getPickProcess,
	getOpenedModal,
	getPlayerState,
	getEndGameOverlay,
} from 'logic/game/game-selectors'
import {
	setOpenedModal,
	setSelectedCard,
	slotPicked,
} from 'logic/game/game-actions'
import SoundButton from './sound-button'
import HandButton from './hand-button/hand-button'
import classNames from 'classnames'

const getPickProcessMessage = (pickProcess: PickProcessT) => {
	const req = pickProcess.requirments[pickProcess.currentReq]
	const target = req.target === 'opponent' ? "opponent's" : 'your'

	let location = ''
	if (req.target === 'hand') {
		location = 'hand'
	} else if (req.active === true) {
		location = 'active hermit'
	} else if (req.active === false) {
		location = 'afk hermits'
	} else {
		location = 'side of the board'
	}

	const type = req.type === 'any' ? '' : req.type
	const empty = req.empty || false
	const name = pickProcess.name
	return `${name}: Pick ${req.amount} ${empty ? 'empty' : ''} ${type} ${
		empty ? 'slot' : 'card'
	}${req.amount > 1 ? 's' : ''} from ${target} ${location}.`
}

const MODAL_COMPONENTS: Record<string, React.FC<any>> = {
	attack: AttackModal,
	confirm: ConfirmModal,
	spyglass: SpyglassModal,
	chest: ChestModal,
	borrow: BorrowModal,
	'unmet-condition': UnmetCondition,
	'change-hermit-modal': ChangeHermitModal,
	'end-turn': EndTurnModal,
}

const renderModal = (
	openedModal: {id: string; info: any} | null,
	handleOpenModalId: (modalId: string | null) => void
) => {
	const closeModal = () => handleOpenModalId(null)
	if (!openedModal || !Object.hasOwn(MODAL_COMPONENTS, openedModal.id))
		return null

	const ModalComponent = MODAL_COMPONENTS[openedModal.id]
	return <ModalComponent closeModal={closeModal} info={openedModal.info} />
}

function Game() {
	const gameState = useSelector(getGameState)
	const selectedCard = useSelector(getSelectedCard)
	const pickedCards = useSelector(getPickProcess)?.pickedCards || []
	const openedModal = useSelector(getOpenedModal)
	const pickProcess = useSelector(getPickProcess)
	const playerState = useSelector(getPlayerState)
	const endGameOverlay = useSelector(getEndGameOverlay)
	const [showForfeit, setShowForfeit] = useState<boolean>(false)
	const [showHand, setShowHand] = useState<boolean>(true)
	const dispatch = useDispatch()

	if (!gameState || !playerState) return <main>Loading</main>

	const handleOpenModal = (id: string | null) => {
		dispatch(setOpenedModal(id))
	}

	const handleBoardClick = (pickedCard: PickedCardT) => {
		console.log('Slot selected: ', pickedCard)
		dispatch(slotPicked(pickedCard))
	}

	const selectCard = (card: CardT) => {
		console.log('Card selected: ', card.cardId)
		dispatch(setSelectedCard(card))
	}

	const handleForfeit = () => {
		setShowForfeit(true)
	}
	
	const updateHandVisibility = (showHand: boolean) => {
		setShowHand(showHand)
	}

	const pickedCardsInstances = pickedCards
		.map((pickedCard) => pickedCard.card)
		.filter(Boolean) as Array<CardT>

	return (
		<div className={css.game}>
			<Board onClick={handleBoardClick} gameState={gameState} />
			<div className={classNames(css.hand, !showHand ? css.hidden: undefined)}>
				<CardList
					wrap={false}
					size="medium"
					cards={playerState.hand}
					onClick={(card: CardT) => selectCard(card)}
					selected={selectedCard}
					picked={pickedCardsInstances}
				/>
			</div>
			<div className={css.handFooter}>
				<HandButton isHandShown={showHand} updateHandVisibility={updateHandVisibility} />
			</div>
			{renderModal(openedModal, handleOpenModal)}
			{pickProcess ? (
				<MouseIndicator message={getPickProcessMessage(pickProcess)} />
			) : null}

			<div className={css.forfeit} onClick={handleForfeit}>
				<img
					src="https://static.wikia.nocookie.net/minecraft_gamepedia/images/3/38/White_Banner_Revision_1.png"
					width="32"
					title="Forfeit"
				/>
			</div>

			<SoundButton />
			<Chat />

			{showForfeit && <ForfeitModal closeModal={() => setShowForfeit(false)} />}

			{endGameOverlay && <EndGameOverlay {...endGameOverlay} />}
		</div>
	)
}

export default Game
