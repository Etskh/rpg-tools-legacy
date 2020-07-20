import {
    AmbientLight,
    Clock,
    Color,
    DirectionalLight,
    DoubleSide,
    FogExp2,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    PlaneGeometry,
    Raycaster,
    Scene,
    TorusBufferGeometry,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three';
import {
    WEBGL,
} from './vendor/three/WebGL';
import { isDown } from './Input';
import { createElement } from './Core';




function createSelectionRing() {
    const geometry = new TorusBufferGeometry( 0.5, 0.2, 32, 32);
    const material = new MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.1,
    });
    const torus = new Mesh( geometry, material );
    torus.rotateX(Math.PI / 2);
    torus.position.copy(new Vector3(-400, -400, -400));
    torus.name = 'ui:selection-ring';
    return torus;
}

function createPartyIndicator(pos) {
    const height = 10;
    const geometry = new PlaneGeometry( 0.1, height, 0.1, height);
    const material = new MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.1,
        side: DoubleSide,
    });
    const plane = new Mesh( geometry, material );
    plane.position.x = pos[0];
    plane.position.y = height / 2;
    plane.position.z = pos[1] * 0.9;
    plane.name = 'ui:party-beacon';
    return plane;
}


export default (store, dispatch) => {
    const _scene = new Scene();
    _scene.fog = new FogExp2( 0x000000, 0.05 );
    const camera = new PerspectiveCamera(75, 1, 0.1, 1000 );
    const raycaster = new Raycaster();
    const screenSpaceMouse = new Vector2();
    const clock = new Clock();
    let _picked = [];

    // Add UI
    const selectionCircle = createSelectionRing();
    _scene.add(selectionCircle);
    const partyBeacon = createPartyIndicator([3, 4]);
    _scene.add(partyBeacon);

    const onRender = ({
        renderer,
    }) => {
        renderer.setClearColor(new Color( 0x090909));
        renderer.clear();

        const ambientLight = new AmbientLight( 0x404040 ); // soft white light
        _scene.add( ambientLight );

        const directionalLight = new DirectionalLight( 0xF0F0F0, 0.7);
        directionalLight.target.position.x = -10;
        directionalLight.target.position.y = -5;
        directionalLight.target.position.z = -8;
        _scene.add(directionalLight);
        _scene.add(directionalLight.target);
		
        const savedCameraPos = localStorage.getItem('camera');
        if(savedCameraPos) {
            camera.position.fromArray(JSON.parse(savedCameraPos));
        }
        else {
            camera.position.z = 6;
            camera.position.x = 3;
        }
        camera.rotateX(-0.9);
        camera.position.y = 4;
	
        function onFrame() {

            const cameraDelta = new Vector3();
            const cameraSpeed = 3;
            if(isDown('Left')) {
                cameraDelta.x -= cameraSpeed;
            }
            if(isDown('Right')) {
                cameraDelta.x += cameraSpeed;
            }
            if(isDown('Up')) {
                cameraDelta.z -= cameraSpeed;
            }
            if(isDown('Down')) {
                cameraDelta.z += cameraSpeed;
            }
            camera.position.addScaledVector(cameraDelta, clock.getDelta());

            requestAnimationFrame(onFrame);
            renderer.render(_scene, camera);
        }
        onFrame();
    };


    // Save the camera position in local storage every couple seconds
    setInterval(() => {
        localStorage.setItem('camera', JSON.stringify(camera.position.toArray()));
    }, 2500);
	

    if(!WEBGL.isWebGL2Available()) {
        const warning = WEBGL.getWebGLErrorMessage();
        return dispatch({
            type: 'ERROR',
            error: warning,
        });
    }

    const width = window.innerWidth;

    return createElement({
        style: {
            position: 'absolute',
            width: `${width}px`,
            height: `${width}px`,
        },
        tag: 'canvas',
        onMouseMove: (ev) => {
            screenSpaceMouse.x = (ev.clientX / width) * 2 - 1;
            screenSpaceMouse.y = (ev.clientY / width) * -2 + 1;
            raycaster.setFromCamera(screenSpaceMouse, camera );
            const intersects = raycaster.intersectObjects(_scene.children);
            _picked = intersects.filter(intersect => !intersect.object.name.startsWith('ui:'));
            // TODO: move this somehwere else
            if(_picked.length > 0) {
                ev.target.style.cursor = 'pointer';
            }
            else {
                ev.target.style.cursor = 'default';
            }

            dispatch({
                noUpdate: true,
                type: 'MOUSEHOVER_SCENE_OBJECT',
                mouseScreenSpace: [
                    screenSpaceMouse.x,
                    screenSpaceMouse.y,
                ],
                mouse: [
                    ev.x,
                    ev.y,
                ],
            });
        },
        onClick: (ev) => {
            if(_picked.length > 0) {
                const closest = _picked.reduce((closestSoFar, cur) => {
                    return cur.distance < closestSoFar ? cur : closestSoFar;
                }, _picked[0]);
                selectionCircle.position.copy(closest.object.position);
                return dispatch({
                    type: 'CLICKED_SCENE_OBJECT',
                    closestName: closest.object.name,
                    closestId: closest.object.uuid,
                    ids: _picked.map(child => child.object.uuid),
                    mouse: [
                        ev.x,
                        ev.y,
                    ],
                });
            }
            selectionCircle.position.copy(new Vector3(-400, -400, -400));
            dispatch({
                type: 'CLICKED_RENDERER',
                mouse: [
                    ev.x,
                    ev.y,
                ],
            });
        },
        onPostRender: (ev) => {
            const canvas = ev.target;
            canvas.width = width;
            canvas.height = width;
            const renderer = new WebGLRenderer({
                canvas,
                antialias: true,
            });
            onRender({
                renderer,
            });
        },
        listens: [
            'ADD_SCENE_OBJECTS',
        ],
        onUpdate: (action) => {
            if(action.type === 'ADD_SCENE_OBJECTS') {
                // action.object
                action.objects.forEach(object => _scene.add(object));
            }
            if(action.type === 'REMOVE_SCENE_OBJECTS') {
                action.objectNames.forEach(objectName => {
                    const child = _scene.children.find(c => c.name === objectName);
                    if(!child) {
                        return console.error('Cant find scene object with name: ', objectName);
                    }
                    _scene.remove(child);
                });
            }
        },
    });
};
