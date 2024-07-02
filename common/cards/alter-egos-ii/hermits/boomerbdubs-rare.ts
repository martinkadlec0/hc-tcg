import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {getActiveRow} from '../../../utils/board'
import {flipCoin} from '../../../utils/coinFlips'
import Card, {Hermit, hermit} from '../../base/card'

class BoomerBdubsRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'boomerbdubs_rare',
		numericId: 228,
		name: 'Boomer Bdubs',
		shortName: 'Boomer B.',
		expansion: 'alter_egos_ii',
		background: 'alter_egos',
		palette: 'alter_egos',
		rarity: 'rare',
		tokens: 1,
		type: 'redstone',
		health: 290,
		primary: {
			name: 'Boom',
			cost: ['any'],
			damage: 30,
			power: null,
		},
		secondary: {
			name: 'Watch This',
			cost: ['redstone', 'redstone'],
			damage: 80,
			power:
				'Flip a coin as many times as you want.\nDo an additional 20hp damage for every heads, but if tails is flipped, this attack deals 0hp total damage.',
		},
	}

	public override onAttach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player} = pos
		const instanceKey = this.getInstanceKey(instance)

		player.hooks.getAttackRequests.add(instance, (activeInstance, hermitAttackType) => {
			// Make sure we are attacking
			if (activeInstance !== instance) return

			// Only secondary attack
			if (hermitAttackType !== 'secondary') return

			const activeHermit = getActiveRow(player)?.hermitCard

			if (!activeHermit) return

			game.addModalRequest({
				playerId: player.id,
				data: {
					modalId: 'selectCards',
					payload: {
						modalName: 'Boomer BDubs: Coin Flip',
						modalDescription: 'Do you want to flip a coin for your attack?',
						cards: [],
						selectionSize: 0,
						primaryButton: {
							text: 'Yes',
							variant: 'default',
						},
						secondaryButton: {
							text: 'No',
							variant: 'default',
						},
					},
				},
				onResult(modalResult) {
					if (!modalResult) return 'SUCCESS'
					if (!modalResult.result) return 'SUCCESS'

					const flip = flipCoin(player, activeHermit)[0]

					if (flip === 'tails') {
						player.custom[instanceKey] = 0
						return 'SUCCESS'
					}

					if (!player.custom[instanceKey]) {
						player.custom[instanceKey] = 0
					}

					player.custom[instanceKey] += 20

					player.hooks.getAttackRequests.call(activeInstance, hermitAttackType)

					// This is sketchy AF but fortune needs to be removed after the first coin flip
					// to prevent infinite flips from being easy.
					const fortuneInstances = player.playerDeck.filter((card) => card.props.id === 'fortune')
					fortuneInstances.forEach((card) => player.hooks.onCoinFlip.remove(card.instance))

					return 'SUCCESS'
				},
				onTimeout() {},
			})
		})

		player.hooks.beforeAttack.add(instance, (attack) => {
			if (attack.id !== instanceKey || attack.type !== 'secondary') return
			if (player.custom[instanceKey] === 0) {
				attack.multiplyDamage(this.props.id, 0).lockDamage(this.props.id)
				return
			}
			if (!player.custom[instanceKey]) return

			attack.addDamage(this.props.id, player.custom[instanceKey])
		})

		player.hooks.onTurnEnd.add(instance, () => {
			delete player.custom[instanceKey]
		})
	}

	public override onDetach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player} = pos
		const instanceKey = this.getInstanceKey(instance)
		delete player.custom[instanceKey]

		player.hooks.getAttackRequests.remove(instance)
		player.hooks.beforeAttack.remove(instance)
		player.hooks.onTurnEnd.remove(instance)
	}
}

export default BoomerBdubsRareHermitCard
