import {PlayerModel} from '../../../common/models/player-model'
import {VirtualPlayerModel} from '../../../common/models/virtual-player-model'

export function broadcast(
	players: Array<PlayerModel | VirtualPlayerModel>,
	type: string,
	payload: any = {}
) {
	players.forEach((player) => {
		const playerSocket = player.socket
		if (playerSocket && playerSocket.connected) {
			playerSocket.emit(type, {type: type, payload})
		}
	})
}
