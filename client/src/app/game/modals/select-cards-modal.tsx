import {useSelector, useDispatch} from 'react-redux'
import {useState} from 'react'
import Modal from 'components/modal'
import CardList from 'components/card-list'
import {ModalData} from 'common/types/game-state'
import css from './game-modals.module.scss'
import {modalRequest} from 'logic/game/game-actions'
import Button from 'components/button'
import {getGameState} from 'logic/game/game-selectors'
import {LocalCardInstance} from 'common/types/server-requests'

type Props = {
	closeModal: () => void
}

function SelectCardsModal({closeModal}: Props) {
	const dispatch = useDispatch()

	const modalData: ModalData | null | undefined = useSelector(getGameState)?.currentModalData
	if (!modalData) return null
	const [selected, setSelected] = useState<Array<LocalCardInstance>>([])
	const cards: Array<LocalCardInstance> = modalData.payload.cards
	const selectionSize = modalData.payload.selectionSize
	const primaryButton = modalData.payload.primaryButton
	const secondaryButton = modalData.payload.secondaryButton

	const handleSelection = (newSelected: LocalCardInstance) => {
		if (selectionSize === 0) return

		setSelected((current) => {
			const newSelection = [...current]
			// Remove a card if it is clicked on when selected
			if (selected.includes(newSelected)) {
				return newSelection.filter((card) => card !== newSelected)
			}
			// If a new card is selected then remove the first one
			if (newSelection.length >= selectionSize) {
				newSelection.shift()
			}
			newSelection.push(newSelected)

			return newSelection
		})
	}

	const handlePrimary = () => {
		if (selectionSize === 0) {
			dispatch(modalRequest({modalResult: {result: true, cards: null}}))
			closeModal()
			return
		}
		if (selected.length <= selectionSize) {
			dispatch(modalRequest({modalResult: {result: true, cards: selected}}))
			closeModal()
		}
	}

	const handleClose = () => {
		dispatch(modalRequest({modalResult: {result: false, cards: null}}))
		closeModal()
	}

	return (
		<Modal title={modalData.payload.modalName} closeModal={handleClose}>
			<div className={css.description}>
				{modalData.payload.modalDescription}
				<div className={css.cards}>
					<div className={css.cardsListContainer}>
						<CardList
							onClick={handleSelection}
							cards={cards}
							selected={selected}
							wrap
							tooltipAboveModal
							enableAnimations
						/>
					</div>
				</div>
			</div>
			<div className={css.options}>
				{secondaryButton && (
					<Button variant={secondaryButton.variant} size="medium" onClick={handleClose}>
						{secondaryButton.text}
					</Button>
				)}
				{primaryButton && (
					<Button
						variant={modalData.payload.primaryButton.variant}
						size="medium"
						onClick={handlePrimary}
					>
						{modalData.payload.primaryButton.text}
					</Button>
				)}
			</div>
		</Modal>
	)
}

export default SelectCardsModal
