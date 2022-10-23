import {
    PerspectiveCamera,
    Scene,
    Fog,
    AmbientLight,
    WebGLRenderer,
    DirectionalLight,
    PMREMGenerator,
    sRGBEncoding,
    Box3,
    Vector3,
} from 'three';
import { WEBGL } from 'https://threejsfundamentals.org/threejs/resources/threejs/r125/examples/jsm/WebGL.js';
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r125/examples/jsm/loaders/GLTFLoader.js';
import { TrackballControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r125/examples/jsm/controls/TrackballControls.js';

/**
 * The <button> element that lets us submit an API request to get the glTF.
 */
const activateBtn = document.getElementById('activateBtn');

/**
 * Initialize the THREE elements needed for rendering the GLTF data.
 * 
 * @returns {object} An object containing the `loadGltf` function.
 */
const initThreeJsElements = function() {
    const camera = new PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1e6);
    camera.position.set(3, 3, 3);
        
    const scene = new Scene();
    scene.fog = new Fog(0xffffff, 0.1, 1e6);
    
    scene.add(new AmbientLight(0x777777));
    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0.5, 0, 0.866);
    camera.add(directionalLight);
    
    const $viewport = document.getElementById('gltf-viewport');

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setClearColor(scene.fog.color, 1);
    renderer.shadowMap.enabled = true;
    
    scene.add(camera);
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = sRGBEncoding;
    renderer.setPixelRatio(window.devicePixelRatio);
    const pmremGenerator = new PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    const controls = new TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;

    $viewport.appendChild(renderer.domElement);
    
    /**
     * This is how much we scale the height of the scene by to make it fit the window.
     */
    const heightScale = 0.4;
    
    /**
     * Handles resizing the window.
     */
    const handleResize = () => {
        const width = window.innerWidth * heightScale,
            height = (window.innerHeight - activateBtn.offsetHeight) * 1.25 * heightScale;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        console.log("renderer dims: " + renderer.domElement.height, renderer.domElement.width);
        render(renderer, scene, camera);
        controls.handleResize();
    };

    window.addEventListener('resize', handleResize, false);
    
    /**
     * Apply an operation to all mesh children of the given element.
     * 
     * @param {object} object The parent node whose children will be operated upon.
     * @param {Function<object,void>} callback The function to operate on the nodes.
     */
    const traverseMaterials = (object, callback) => {
        object.traverse((node) => {
            if (!node.isMesh) return;
            const materials = Array.isArray(node.material) ? node.material : [ node.material ];
            materials.forEach(callback);
        });
    };
    
    /**
     * Sets the contents of the scene to the given GLTF data.
     * 
     * @param {object} gltfScene The GLTF data to render.
     */
    const setGltfContents = (gltfScene) => {
        if (gltfScene) {
            // Remove existing GLTF scene from the scene
            const existingGltfScene = scene.getObjectByName('gltf_scene')
            if (existingGltfScene) scene.remove(existingGltfScene);
            
            const box = new Box3().setFromObject(gltfScene);
            const size = box.getSize(new Vector3()).length();
            const center = box.getCenter(new Vector3());
            
            controls.reset();
            
            gltfScene.position.x += (gltfScene.position.x - center.x);
            gltfScene.position.y += (gltfScene.position.y - center.y);
            gltfScene.position.z += (gltfScene.position.z - center.z);
            
            controls.maxDistance = size * 10;
            camera.near = size / 100;
            camera.far = size * 100;
            camera.updateProjectionMatrix();
            /** [Challenge 2]: Fixing the Camera Position
             * 
             * Our viewer is almost complete! We've retrieved our glTF,
             * and this function contains most of the code you need to
             * build a standalone 3D model viewer using Three.js. 
             * 
             * BUT, the camera's position could be improved.
             * 
             * Your task: let's get that camera positioned so that it looks 
             * directly at the center of the whatever glTF model we've retrieved
             * from the API.
             * 
             * a) To start, set the camera position to copy the coordinates in the
             *    "center" variable above.
             * b) Next, use the size our our "box" variable to set the position
             *    of the camera along the X, Y, and Z axes.
             * c) Finally, explicitly tell the camera to face the center, using the
             *    lookAt() function!
             */
            /** your code goes here */
            
            gltfScene.name = 'gltf_scene';
            scene.add(gltfScene);
            
            controls.update();
            
            // Update textures
            traverseMaterials(gltfScene, (material) => {
                if (material.map) material.map.encoding = sRGBEncoding;
                if (material.emissiveMap) material.emissiveMap.encoding = sRGBEncoding;
                if (material.map || material.emissiveMap) material.needsUpdate = true;
            });
            
            // For some reason, without calling `handleResize` pan & rotate don't work...
            controls.handleResize();
        }
    };
    
    /**
     * Animate the scene.
     */
    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        render(renderer, scene, camera);
    };
    
    /**
     * Render the scene.
     */
    const render = () => {
        renderer.render(scene, camera);
    };

    const gltfLoader = new GLTFLoader();
    
    // Without calling `handleResize`, the background is black initially.
    // (Changes to white when something is rendered.)
    handleResize();

    return {
        /**
         * Parse and load the given GLTF data, and trigger rendering.
         * 
         * @param {object} gltfData The GLTF data to be rendered.
         */
        loadGltf: (gltfData) => {
            console.log(gltfData);
            // (4) read in the glTF data from the API
            gltfLoader.load(gltfData,
                (gltf) => { // onLoad function
                    document.body.style.cursor = 'default';
                    const gltfScene = gltf.scene || gltf.scenes[0];
                    // (5) ensure the user can manipulate the model
                    setGltfContents(gltfScene);
                    // begin render loop!
                    animate();
                },
                () => {},  // onProgress function (just an empty placeholder for now)
                (err) => { // onError function
                    displayError(`Error loading GLTF: ${err}`);
                });
        }
    };
};

/**
 * Execute a polling action until a particular outcome is achieved.
 * 
 * @param {number} intervalInSeconds The number of seconds between each poll request.
 * @param {Function<void,Promise>} promiseProducer The function which when called will perform the HTTP request and return a Promise.
 * @param {Function<Response,boolean>} stopCondFunc The function to be called on the result of `promiseProducer`; return true to stop polling.
 * @param {Function<string,void>} then The function to be called with the response body of the last polling request.
 */
const poll = (intervalInSeconds, promiseProducer, stopCondFunc, then) => {
    /**
     * Call `promiseProducer`, check if we should stop polling, and either call `then` with
     * the result, or call `setTimeout` to execute again in `intervalInSeconds` seconds.
     */
    const pollAndCheck = async () => {
        const res = await promiseProducer();
        if (stopCondFunc(res)) {
            const body = await res.text();
            then(body);
        } else {
            setTimeout(pollAndCheck, intervalInSeconds * 1000);
        }
    }
    // Start polling...
    pollAndCheck();
};

/**
 * Display an error message to the user.
 * 
 * @param {string} msg The error message to be displayed.
 */

const displayError = (msg) => {
    console.log('Error:', msg);
    const $viewport = document.getElementById('gltf-viewport');
    const $msgElem = document.createElement('p');
    $msgElem.style.color = 'red';
    $msgElem.style.font = 'italic';
    $msgElem.innerText = msg;
    $viewport.insertBefore($msgElem, $viewport.firstChild);
}

// (1) verifies the client for compatibility 
if (!WEBGL.isWebGLAvailable()) {
    console.error('WebGL is not supported in this browser');
    document.getElementById('gltf-viewport').appendChild(WEBGL.getWebGLErrorMessage());
}

// (2) init Three.js scene
const { loadGltf } = initThreeJsElements();

// (3) setup for loading glTF based on user selection
activateBtn.addEventListener('click', async (evt) => {
    // retrieve form values + access the glTF
    try {
        document.body.style.cursor = 'progress';        
        // displays the glTF
        const glTFPath = "YOUR GLTF (.glb/.gltf) FILE PATH GOES HERE!";
        loadGltf(glTFPath);
    } catch (err) {
        displayError(`Error in displaying glTF: ${err}`);
    }
});
