import * as THREE from 'three'
import {OrbitControls} from '@react-three/drei'
import {Canvas, useThree} from '@react-three/fiber'

// extend({OrbitControls})

const SkyBox = () => {
	const {scene} = useThree()
	const loader = new THREE.CubeTextureLoader()
	const texture = loader.load([
		'/images/panorama/pan_fr.png',
		'/images/panorama/pan_bk.png',
		'/images/panorama/pan_tp.png',
		'/images/panorama/pan_bt.png',
		'/images/panorama/pan_lf.png',
		'/images/panorama/pan_rt.png',
	])

	scene.background = texture
	scene.backgroundIntensity = 0.9
	return null
}

const Panorama = () => {
	return (
		<Canvas linear flat>
			<OrbitControls autoRotate autoRotateSpeed={-0.05} />
			<SkyBox />
		</Canvas>
	)
}

export default Panorama
