import {delay} from 'typed-redux-saga'
import {AttackActionData, PlayCardActionData} from 'common/types/action-data'
import {GameModel} from 'common/models/game-model'
import {AttackAction, PlayerState} from 'common/types/game-state'
import {broadcast} from '../../utils/comm'
import {VirtualAI, VirtualAIReturn} from './virtual-action'
import {BOSS_ATTACK} from '../../../../common/cards/boss/hermits/evilxisuma_boss'

class ExBossAI implements VirtualAI {
	get id(): string {
		return 'evilxisuma_boss'
	}

	private fireDropper() {
		return Math.floor(Math.random() * 9)
	}

	getBossAttack(player: PlayerState) {
		const lives = player.lives

		const attackIndexes: {
			damage: number
			secondary?: number
			tertiary?: number
		} = {damage: this.fireDropper()}

		if (lives === 3) {
			attackIndexes.damage = [0, 0, 1, 1, 1, 2, 2, 2, 2][attackIndexes.damage]
		} else {
			let secondary = this.fireDropper()
			if (lives === 2) {
				attackIndexes.damage = [0, 0, 0, 1, 1, 1, 2, 2, 2][attackIndexes.damage]
				attackIndexes.secondary = [0, 0, 0, 1, 1, 1, 2, 2, 2][secondary]
			} else {
				attackIndexes.damage = [0, 0, 0, 0, 1, 1, 1, 2, 2][attackIndexes.damage]
				attackIndexes.secondary = [0, 0, 0, 0, 1, 1, 1, 2, 2][secondary]
				attackIndexes.tertiary = [0, 0, 0, 0, 1, 1, 1, 2, 2][this.fireDropper()]
			}
		}

		const attackDef: BOSS_ATTACK = [(['50DMG', '70DMG', '90DMG'] as const)[attackIndexes.damage]]
		if (attackIndexes.secondary !== undefined) {
			attackDef[1] = (['HEAL150', 'ABLAZE', 'DOUBLE'] as const)[attackIndexes.secondary]
			if (attackIndexes.tertiary !== undefined)
				attackDef[2] = (['EFFECTCARD', 'AFK20', 'ITEMCARD'] as const)[attackIndexes.tertiary]
		}

		return attackDef
	}

	*getTurnAction(game: GameModel): Generator<any, VirtualAIReturn> {
		if (game.state.modalRequests.length)
			if (game.state.modalRequests[0].data.payload.modalName.startsWith('Lantern'))
				// Handles when challenger plays "Lantern"
				return {
					type: 'MODAL_REQUEST',
					playerId: game.opponentPlayerId,
					payload: {result: true, cards: null},
				}

		const {currentPlayer, currentPlayerId} = game

		if (game.state.turn.turnNumber === 2) {
			const bossCard = currentPlayer.hand.find((card) => card.cardId === 'evilxisuma_boss')
			if (bossCard) {
				const playHermitCard: PlayCardActionData & {playerId: string} = {
					type: 'PLAY_HERMIT_CARD',
					payload: {
						pickInfo: {
							playerId: currentPlayerId,
							rowIndex: 0,
							card: bossCard,
							slot: {type: 'hermit', index: 0},
						},
						card: bossCard,
					},
					playerId: currentPlayerId,
				}
				return playHermitCard
			}
		}

		const attackType = game.state.turn.availableActions.find(
			(action): action is AttackAction =>
				action === 'PRIMARY_ATTACK' || action === 'SECONDARY_ATTACK'
		)
		if (attackType) {
			const attackAction: AttackActionData & {playerId: string} = {
				type: attackType,
				payload: {
					playerId: currentPlayerId,
				},
				playerId: currentPlayerId,
			}

			const bossAttack = this.getBossAttack(currentPlayer)
			currentPlayer.custom['BOSS_ATTACK'] = bossAttack
			broadcast(game.getPlayers(), '@sound/VOICE_ANNOUNCE', {lines: bossAttack})
			yield* delay(bossAttack.length * 3000)
			// Waits after announcing attack to perform the action
			return attackAction
		}

		if (!game.state.turn.availableActions.includes('END_TURN'))
			throw new Error('EX does not know what to do in this state, please report')

		const nineEffect = game.state.statusEffects.find(
			(statusEffect) => statusEffect.statusEffectId === 'exboss-nine'
		)
		if (nineEffect && nineEffect.duration === 9) {
			currentPlayer.hooks.onTurnEnd.callSome(
				[[]],
				(ignoreInstance) => ignoreInstance !== nineEffect.statusEffectInstance
			)
			yield* delay(10600)
		}

		return {type: 'END_TURN', playerId: game.currentPlayerId}
	}
}

export default ExBossAI
