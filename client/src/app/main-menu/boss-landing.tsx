import css from './main-menu.module.scss'
import {useDispatch} from 'react-redux'
import MenuLayout from 'components/menu-layout'
import Button from 'components/button'
import {createBossGame} from 'logic/matchmaking/matchmaking-actions'
import CardList from 'components/card-list'
import {getCardExpansion} from 'common/utils/cards'
import {EXPANSIONS} from 'common/config'

type Props = {
	setMenuSection: (section: string) => void
}
function BossLanding({setMenuSection}: Props) {
	const dispatch = useDispatch()

	const handleCreateBossGame = () => {
		setMenuSection('mainmenu')
		dispatch(createBossGame())
	}

	const nonFunctionalCards = [
		'knockback',
		'lead',
		'looting',
		'spyglass',
		'bow',
		'splash_potion_of_poison',
		'lava_bucket',

		'egg',
		'potion_of_slowness',
		'target_block',

		'dropper',
		'glowstone',
		'berry_bush',
	]
		.filter((cardId) => !EXPANSIONS.disabled.includes(getCardExpansion(cardId)))
		.map((cardId) => {
			return {cardId, cardInstance: cardId}
		})

	return (
		<MenuLayout
			back={() => setMenuSection('mainmenu')}
			title="Challenge Evil X"
			returnText="Main Menu"
			className={css.bossLanding}
		>
			<CardList cards={[{cardId: 'evilxisuma_boss', cardInstance: 'preview'}]} />
			<div className={css.bossRules}>
				<p>
					That's right, the Hermitcraft TCG has its first boss fight! This is no challenge deck,
					Evil X cares not for the cards. He brings his own moves, and they are vicious! If you
					think you can defeat him, you'll need to bring your best game. Be sure to check your audio
					settings to hear the voice commands during the battle.
				</p>
				<h1>Rules</h1>
				<p>You will always go first but can only have three rows to play on.</p>
				<p>
					EX has only one row to play on and has no item slots to attach to his boss card. However,
					his card has 300hp, comes back again at full health when knocked out, and will perform
					harder attacks with every life lost.
				</p>
				<p>
					For the purposes of <u>Renbob</u> and <u>Anvil</u>, EX is always directly opposite your
					active Hermit.
				</p>
				<p>EX is immune to and cannot be inflicted with Fire, Poison, and Slowness.</p>
				<p>The following cards don't work in this battle:</p>
				<div>
					<CardList cards={nonFunctionalCards} wrap={true} />
				</div>
				<h1>EX's Moves & Special</h1>
				<p>Evil X can attack for 50, 70 or 90 damage.</p>
				<p>
					After losing a life, EX can also either heal for 150hp, set your active Hermit on fire, or
					double the damage of his main attack.
				</p>
				<p>
					On his last life, EX can deal 20 damage to all AFK Hermits, discard your active Hermit's
					attached effect card, or force you to discard an item card from your active Hermit.
					Discarded effect cards act as if <u>Curse of Vanishing</u> was used and do not trigger
					from his attack.
				</p>
				<p>
					If a special move disables EX's attack, this only prevents attack damage, being set on
					fire and damage against AFK Hermits.
				</p>
				<p>
					At the end of EX's ninth turn, even if he cannot attack, he will perform one of two
					special moves:
				</p>
				<ol>
					<li>Discard your whole hand and draw one new card.</li>
					<li>Remove all attached item and effect cards from your active Hermit.</li>
				</ol>
			</div>
			<Button variant="stone" onClick={handleCreateBossGame}>
				Begin Boss Game
			</Button>
		</MenuLayout>
	)
}

export default BossLanding
