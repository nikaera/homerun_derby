import React, { useState, useCallback, useEffect } from 'react';

import * as BABYLON from 'babylonjs';
import BabylonScene, { SceneEventArgs } from './SceneComponent';

import cannon from 'cannon';
import Button from '@material-ui/core/Button';

import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

interface PlayingFunction {
    (isHomerun: Boolean): Boolean;
}

interface StartFunction {
    (): void;
}

interface BabylonParams {
    scene: BABYLON.Scene | null
}


const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        textAlign: 'center'
    }
}));

const Game = React.memo<{
    playingCallback: PlayingFunction
    startCallback: StartFunction
}>(({
    playingCallback,
    startCallback
}) => {
    const [isStarted, setIsStarted] = useState(false);
    const [sceneSize, setSceneSize] = useState(0);
    const [params, setParams] = useState<BabylonParams>({
        scene: null
    })
    const classes = useStyles();

    const updateSceneSize = useCallback(() => {
        setSceneSize(window.innerWidth / 2)
    }, [])

    useEffect(() => {
        updateSceneSize()
    })

    function addBatControl(bat: BABYLON.TransformNode, scene: BABYLON.Scene) {
        let isKeyDown = false;
        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case " ":
                            if (isKeyDown) return;
                            isKeyDown = true;

                            setTimeout(() => {
                                spinAnimation(bat, new BABYLON.Vector3(0, 2, -1.2), 10, 40);
                            }, 0);
                            break;
                    }
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    switch (kbInfo.event.key) {
                        case " ":
                            setTimeout(() => {
                                spinAnimation(bat, new BABYLON.Vector3(0, -3, -1.4), 10, 60);
                            }, 0);

                            setTimeout(() => {
                                spinAnimation(bat, new BABYLON.Vector3(0, 0, 0), 20, 30);
                            }, 300);

                            isKeyDown = false;
                            break;
                    }
                    break;
            }
        });
    }

    function spinAnimation(
        mesh: BABYLON.TransformNode,
        targetRot: BABYLON.Vector3,
        millisec: BABYLON.int,
        speed: BABYLON.int
    ) {
        var ease = new BABYLON.CubicEase();
        ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        BABYLON.Animation.CreateAndStartAnimation('at4', mesh, 'rotation', speed, millisec, mesh.rotation, targetRot, 0, ease);
    }

    function createBat(scene: BABYLON.Scene) {
        const batTop = BABYLON.MeshBuilder.CreateCylinder('BatTop', {
            diameterTop: 0.6, diameter: 0.5, tessellation: 8
        }, scene);
        batTop.physicsImpostor = new BABYLON.PhysicsImpostor(
            batTop,
            BABYLON.PhysicsImpostor.CylinderImpostor,
            { mass: 0, restitution: 0.9, margin: 1 },
            scene);
        batTop.position = new BABYLON.Vector3(0, 1.5, 0);
        const batTopMaterial = new BABYLON.StandardMaterial('BatTop', scene);
        batTopMaterial.diffuseColor = BABYLON.Color3.FromHexString("#F7B573");
        batTop.material = batTopMaterial;

        const batBottom = BABYLON.MeshBuilder.CreateCylinder('BatBottom', {
            diameter: 0.5, diameterBottom: 0.4, height: 1, tessellation: 8
        }, scene);
        batBottom.position = new BABYLON.Vector3(0, 0, 0);
        const batBottomMaterial = new BABYLON.StandardMaterial('BatBottom', scene);
        batBottomMaterial.diffuseColor = BABYLON.Color3.FromHexString("#000000");
        batBottom.material = batBottomMaterial;

        const bat = new BABYLON.TransformNode("Bat");
        batTop.parent = bat;
        batBottom.parent = bat;

        return bat;
    }

    function pitching(scene: BABYLON.Scene,
        bat: BABYLON.TransformNode,
        playingCallback: PlayingFunction) {
        const ball = BABYLON.MeshBuilder.CreateSphere("Ball", { segments: 4, diameter: 1 }, scene);
        const ballMaterial = new BABYLON.StandardMaterial('Ball', scene);
        ballMaterial.diffuseColor = BABYLON.Color3.FromHexString("#FFFEFA");
        ball.material = ballMaterial;

        ball.position = new BABYLON.Vector3(0, 5, 100);
        setTimeout(() => {
            const batTop = bat.getChildMeshes()[0]
            ball.physicsImpostor = new BABYLON.PhysicsImpostor(ball, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0.4, restitution: 0.1 }, scene);
            if (ball.physicsImpostor) {
                if (ball.physicsImpostor && batTop.physicsImpostor) {
                    batTop.physicsImpostor.registerOnPhysicsCollide(ball.physicsImpostor, function (main, collided) {
                        if (ball.physicsImpostor) {
                            ball.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 40, 100), ball.getAbsolutePosition());
                            const sound = new BABYLON.Sound("Hit", "/sounds/hit.mp3", scene, () => {
                                sound.play();
                            });
                        }
                    });
                }
                if (ball.physicsImpostor)
                    ball.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 7.5, -10), ball.getAbsolutePosition());
            }

            setTimeout(() => {
                let isFinished: Boolean = false;
                if (ball.position.y > 0 && ball.position.z > 200) {
                    isFinished = playingCallback(true);
                    const sound = new BABYLON.Sound("Hit", "/sounds/homerun.mp3", scene, () => {
                        sound.play();
                    });
                } else {
                    isFinished = playingCallback(false);
                    const sound = new BABYLON.Sound("Hit", "/sounds/catch.mp3", scene, () => {
                        sound.play();
                    });
                }

                ball.physicsImpostor?.dispose()
                ball.dispose();
                if (!isFinished)
                    pitching(scene, bat, playingCallback);
            }, 5 * 1000);
        }, 2 * 1000);
    }

    function onSceneMount(e: SceneEventArgs) {
        const { scene, engine } = e;

        scene.createDefaultEnvironment({
            skyboxColor: BABYLON.Color3.FromHexString("#3399ff"),
            skyboxSize: 1000,
        });
        const physicsPlugin = new BABYLON.CannonJSPlugin(true, 10, cannon);
        scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), physicsPlugin);

        const camera = new BABYLON.FreeCamera('Camera', new BABYLON.Vector3(0, 2, 0), scene);
        const cameraFovRadian = 90 * (Math.PI / 180);
        camera.fov = cameraFovRadian;

        BABYLON.Effect.ShadersStore["customFragmentShader"] = `
        #ifdef GL_ES
            precision highp float;
        #endif
    
        // Samplers
        varying vec2 vUV;
        uniform sampler2D textureSampler;
    
        // Parameters
        uniform vec2 screenSize;
    
        void main(void) 
        {
            vec2 texelSize = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            vec4 baseColor = texture2D(textureSampler, vUV);
    
            gl_FragColor = baseColor;
        }
        `;

        const postProcess = new BABYLON.PostProcess("My custom post process", "custom", ["screenSize"], null, 0.25, camera);
        postProcess.onApply = function (effect) {
            effect.setFloat2("screenSize", postProcess.width, postProcess.height);
        };

        const ground = BABYLON.MeshBuilder.CreateGround("Ground", { height: 40, width: 40, subdivisions: 4 }, scene);
        ground.rotate(BABYLON.Axis.Y, Math.PI / 4, BABYLON.Space.WORLD);

        const groundMaterial = new BABYLON.StandardMaterial('Ground', scene);
        groundMaterial.diffuseColor = BABYLON.Color3.FromHexString("#426828");
        ground.material = groundMaterial;
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(
            ground,
            BABYLON.PhysicsImpostor.BoxImpostor,
            {
                mass: 0,
                restitution: 2.0,
                friction: 0.07,
            },
            scene);

        const light = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 2.0;

        const bat = createBat(scene);
        bat.position = new BABYLON.Vector3(-1, 1, 3);

        addBatControl(bat, scene);

        engine.runRenderLoop(() => {
            if (scene) {
                scene.render();
            }
        });
    }

    function startGame() {
        const scene = params.scene
        if (scene) {
            const bat = scene.getTransformNodeByName("Bat")
            if (bat) {
                startCallback()
                pitching(scene, bat, playingCallback)
                setIsStarted(isStarted => true)
                scene.getEngine().getRenderingCanvas()?.focus()
            }
        }
    }

    function createGameScene(e: SceneEventArgs) {
        setParams({ scene: e.scene })
        onSceneMount(e)
    }

    function retry() {
        window.location.reload();
    }

    return (
        <div className={classes.root}>
            <BabylonScene width={sceneSize} height={sceneSize}
                onSceneMount={createGameScene}>
            </BabylonScene>
            <Grid container spacing={8}>
                <Grid item xs>
                    <Button variant="outlined" color="primary" onClick={startGame} disabled={isStarted}>
                        ゲームスタート！
                    </Button>
                </Grid>
                <Grid item xs>
                    <Button variant="outlined" color="secondary" onClick={retry} disabled={!isStarted}>
                        もう一度遊ぶ
                    </Button>
                </Grid>
            </Grid>
        </div>
    );
})

export default Game;