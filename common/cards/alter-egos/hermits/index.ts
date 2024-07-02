// common cards
import BeetlejhostCommonHermitCard from './beetlejhost-common'
import EvilJevinCommonHermitCard from './eviljevin-common'
import PoultrymanCommonHermitCard from './poultryman-common'
// rare & ultra rare cards
import LlamadadRareHermitCard from './llamadad-rare'
import PotatoBoyRareHermitCard from './potatoboy-rare'
import GoatfatherRareHermitCard from './goatfather-rare'
import HotguyRareHermitCard from './hotguy-rare'
import JinglerRareHermitCard from './jingler-rare'
import EvilXisumaRareHermitCard from './evilxisuma_rare'
import HelsknightRareHermitCard from './helsknight-rare'
import RenbobRareHermitCard from './renbob-rare'
import HumanCleoRareHermitCard from './humancleo-rare'
import Card from '../../base/card'

const hermitCardClasses: Array<Card> = [
	// AE Cards
	new BeetlejhostCommonHermitCard(),
	new EvilJevinCommonHermitCard(),
	new EvilXisumaRareHermitCard(),
	new GoatfatherRareHermitCard(),
	new HelsknightRareHermitCard(),
	new HotguyRareHermitCard(),
	new HumanCleoRareHermitCard(),
	new JinglerRareHermitCard(),
	new LlamadadRareHermitCard(),
	new PotatoBoyRareHermitCard(),
	new PoultrymanCommonHermitCard(),
	new RenbobRareHermitCard(),
]

export default hermitCardClasses
