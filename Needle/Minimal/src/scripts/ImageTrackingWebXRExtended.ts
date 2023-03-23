import { Behaviour, serializable, WebXR } from "@needle-tools/engine";
import { WebXREvent } from "@needle-tools/engine/src/engine-components/WebXR";
import { BoxGeometry, DoubleSide, Euler, Group, MathUtils, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, Quaternion, SphereGeometry, TextureLoader, Vector3, WebXRManager } from "three";

export class ImageTrackingWebXRExtended extends Behaviour {
    @serializable(WebXR)
    webXR?: WebXR;
    @serializable(Object3D)
    floorMapParent?: Object3D;
    @serializable(Object3D)
    floorMapArea?: Object3D;
    @serializable(Object3D)
    floorPlaneMesh?: Object3D;

    private hiroMarkerMesh?: Mesh;
    private earthNFTMesh?: Mesh;

    private markerWorldPosition: Vector3 = new Vector3();
    private markerWorldQuaternion: Quaternion = new Quaternion();
    private markerWorldRotation: Euler = new Euler();

    start() {
        WebXR.addEventListener(WebXREvent.XRStarted, this.onXRSessionStart.bind(this));
        WebXR.addEventListener(WebXREvent.XRUpdate, this.onXRSessionUpdate.bind(this));

        this.setupNavigationAreaGeometry();

        // make navigation geometry invisible
        if (this.floorMapParent) this.floorMapParent.visible = false;
    }

    setupNavigationAreaGeometry() {
        // create occluder material
        const occluderMaterial = new MeshStandardMaterial({ color: 0x00ff00 });
        occluderMaterial.colorWrite = false;

        // create room map
        if (this.floorMapArea) {
            this.floorMapArea.add(this.createWallElement(new Vector3(-4.85, 1, -0.74), new Vector3(0, 0, 0), new Vector3(0.0625, 3, 1.578), occluderMaterial));
            this.floorMapArea.add(this.createWallElement(new Vector3(-2.98, 1, -2.65), new Vector3(0, 0, 0), new Vector3(0.0625, 3, 3.51), occluderMaterial));
            this.floorMapArea.add(this.createWallElement(new Vector3(1, 1, -2.55), new Vector3(0, 0, 0), new Vector3(0.0625, 3, 3.467), occluderMaterial));
            this.floorMapArea.add(this.createWallElement(new Vector3(1, 1, 2.18), new Vector3(0, 0, 0), new Vector3(0.0625, 3, 4.475), occluderMaterial));
            this.floorMapArea.add(this.createWallElement(new Vector3(-0.689, 1, 0), new Vector3(0, 0, 0), new Vector3(8.518, 3, 0.06), occluderMaterial));
            this.floorMapArea.add(this.createWallElement(new Vector3(0.97, 1, -4.05), new Vector3(0, 0, 0), new Vector3(7.91, 3, 0.06), occluderMaterial));
            this.floorMapArea.add(this.createWallElement(new Vector3(-3.34, 1, -1.29), new Vector3(0, 0, 0), new Vector3(0.86, 3, 0.06), occluderMaterial));
            this.floorMapArea.add(this.createWallElement(new Vector3(4.86, 1, -0.01), new Vector3(0, 0, 0), new Vector3(0.06, 3, 9.114), occluderMaterial));
            this.floorMapArea.add(this.createWallElement(new Vector3(-1.6, 1, -0.88), new Vector3(0, 0, 0), new Vector3(2.85, 3, 0.06), occluderMaterial));
            this.floorMapArea.add(this.createWallElement(new Vector3(2.9, 1, 4.06), new Vector3(0, 0, 0), new Vector3(4, 3, 0.06), occluderMaterial));
        }

        if (this.floorPlaneMesh) {
            this.floorPlaneMesh.renderOrder = 3;
        }
    }

    createWallElement(position, _rotation, scale, occluderMaterial) {
        const occluderGeometry = new BoxGeometry(scale.x, scale.y, scale.z);
        const occluderMesh = new Mesh(occluderGeometry, occluderMaterial);
        occluderMesh.position.set(position.x, position.y, position.z);
        occluderMesh.renderOrder = 2;

        return occluderMesh;
    }

    private onXRSessionStart(_evt: { session: XRSession }) {
        if (!this.webXR) return;

        // add object for our hiro marker image
        const hiroMarkerGeometry = new BoxGeometry(0.2, 0.2, 0.2);
        hiroMarkerGeometry.translate(0, 0.1, 0);
        const hiroMarkerMaterial = new MeshNormalMaterial({
            transparent: true,
            opacity: 0.5,
            side: DoubleSide,
        });
        this.hiroMarkerMesh = new Mesh(hiroMarkerGeometry, hiroMarkerMaterial);
        this.hiroMarkerMesh.name = "HiroMarkerCube";
        this.hiroMarkerMesh.matrixAutoUpdate = false;
        // this.hiroMarkerMesh.visible = false;
        this.context.scene.add(this.hiroMarkerMesh);

        // add object for our earth marker image
        const earthNFTGeometry = new SphereGeometry(0.2);
        earthNFTGeometry.translate(0, 0.2, 0);
        const earthNFTMaterial = new MeshNormalMaterial({
            transparent: true,
            opacity: 0.5,
            side: DoubleSide,
        });
        this.earthNFTMesh = new Mesh(earthNFTGeometry, earthNFTMaterial);
        this.earthNFTMesh.name = "EarthNFTSphere";
        this.earthNFTMesh.matrixAutoUpdate = false;
        this.earthNFTMesh.visible = false;
        this.context.scene.add(this.earthNFTMesh);
    }

    private onXRSessionUpdate(evt: { rig: Group; frame: XRFrame; xr: WebXRManager; input: XRInputSource[] }) {
        if (evt.frame && this.floorMapParent && this.floorMapArea && this.hiroMarkerMesh && this.earthNFTMesh) {
            // console.log("Frame: ", evt.frame);
            //@ts-ignore
            const results = evt.frame.getImageTrackingResults(); //checking if there are any images we track

            //if we have more than one image the results are an array
            for (const result of results) {
                // The result's index is the image's position in the trackedImages array specified at session creation
                const imageIndex = result.index;

                // Get the pose of the image relative to a reference space.
                const referenceSpace = this.context.renderer.xr.getReferenceSpace();
                if (referenceSpace) {
                    const pose = evt.frame.getPose(result.imageSpace, referenceSpace);
                    if (pose) {
                        //checking the state of the tracking
                        const state = result.trackingState;
                        console.log(state);

                        if (state == "tracked") {
                            this.floorMapParent.visible = true;

                            this.markerWorldPosition.set(pose.transform.position.x * -1, pose.transform.position.y, pose.transform.position.z * -1);
                            this.markerWorldQuaternion.set(pose.transform.orientation.x, pose.transform.orientation.y, pose.transform.orientation.z, pose.transform.orientation.w);
                            this.markerWorldRotation.setFromQuaternion(this.markerWorldQuaternion);

                            if (imageIndex == 0) {
                                this.hiroMarkerMesh.position.set(this.markerWorldPosition.x, this.markerWorldPosition.y, this.markerWorldPosition.z);
                                this.hiroMarkerMesh.rotation.setFromQuaternion(this.markerWorldQuaternion);
                                this.hiroMarkerMesh.updateMatrix();

                                // offset to start in the middle of the living room
                                this.floorMapArea.position.set(-2.8, 0, 2);
                            }
                            if (imageIndex == 1) {
                                this.earthNFTMesh.position.set(this.markerWorldPosition.x, this.markerWorldPosition.y, this.markerWorldPosition.z);
                                this.earthNFTMesh.rotation.setFromQuaternion(this.markerWorldQuaternion);
                                this.earthNFTMesh.updateMatrix();

                                // setting the offset for the specific marker
                                this.floorMapArea.position.set(0.7, 0, 2.5);
                            }

                            // set starting point to start-room center
                            this.floorMapParent.position.copy(this.markerWorldPosition);
                            this.floorMapParent.rotation.copy(this.markerWorldRotation);
                            this.floorMapParent.rotation.y += MathUtils.degToRad(180);
                        }
                    }
                }
            }
        }
    }
}
