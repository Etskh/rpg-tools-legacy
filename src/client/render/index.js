import {
    WebGLRenderer,
    Color,
    PerspectiveCamera,
    Scene,
    FogExp2,
    Raycaster,
    Vector2,
    Vector3,
    AmbientLight,
    DirectionalLight,
    //
    TorusBufferGeometry,
    MeshBasicMaterial,
    Mesh,
    PlaneGeometry,
    DoubleSide,
    // 
    Clock,
    //
    PointsMaterial,
} from 'three';


const textureLoader = new THREE.TextureLoader();


export function createBillboard({
    url,
}) {
	const sprite = textureLoader.load(url);
    const material = new PointsMaterial({
        size: 35,
        sizeAttenuation: false,
        map: sprite,
        alphaTest: 0.5,
        transparent: true,
    });

    // return {
	// 	mesh,
    //     move: ({x, y}) => {

    //     }
    // };
}