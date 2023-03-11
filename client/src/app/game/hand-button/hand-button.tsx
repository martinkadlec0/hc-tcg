import classNames from 'classnames'
import {useEffect, useState} from 'react'
import css from './hand-button.module.css'

interface IHandButtonProps {
	isHandShown: boolean,
	updateHandVisibility: (arg: boolean) => void
}
	  
const HandButton: React.FC<IHandButtonProps> = ({isHandShown, updateHandVisibility}) => {

	const [isHandVisible, setHandVisibility] = useState<boolean>(true)

	const handleHandVisibility = () => {
		updateHandVisibility(!isHandVisible)
	}

	useEffect(() => {
		setHandVisibility(isHandShown)  
	}, [isHandShown])

	return (
		<button onClick={handleHandVisibility}>
			{isHandVisible
					? 'Hide hand'
					: 'Show hand'
			}
		</button>
	)
}

export default HandButton
