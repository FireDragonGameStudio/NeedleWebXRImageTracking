import { Behaviour, serializable, WebXR } from "@needle-tools/engine";
import { WebXREvent } from "@needle-tools/engine/src/engine-components/WebXR";
import { BoxGeometry, DoubleSide, Euler, Group, MathUtils, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, Quaternion, SphereGeometry, TextureLoader, Vector3, WebXRManager } from "three";

export class ImageTrackingWebXR extends Behaviour {
    @serializable(WebXR)
    webXR?: WebXR;
    @serializable(Object3D)
    grid?: Object3D;

    private hiroMarkerMesh?: Mesh;
    private earthNFTMesh?: Mesh;

    private markerWorldPosition: Vector3 = new Vector3();
    private markerWorldQuaternion: Quaternion = new Quaternion();

    start() {
        WebXR.addEventListener(WebXREvent.XRStarted, this.onXRSessionStart.bind(this));
        WebXR.addEventListener(WebXREvent.XRUpdate, this.onXRSessionUpdate.bind(this));
        WebXR.addEventListener(WebXREvent.XRStopped, this.onXRSessionStop.bind(this));
    }

    private onXRSessionStart(_evt: { session: XRSession }) {
        if (!this.webXR) return;

        if (this.grid) this.grid.visible = false;

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
        this.hiroMarkerMesh.visible = false;
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
        if (evt.frame && this.hiroMarkerMesh && this.earthNFTMesh) {
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
                            this.markerWorldPosition.set(pose.transform.position.x * -1, pose.transform.position.y, pose.transform.position.z * -1);
                            this.markerWorldQuaternion.set(pose.transform.orientation.x, pose.transform.orientation.y, pose.transform.orientation.z, pose.transform.orientation.w);
                            if (imageIndex == 0) {
                                this.hiroMarkerMesh.visible = true;
                                this.hiroMarkerMesh.position.set(this.markerWorldPosition.x, this.markerWorldPosition.y, this.markerWorldPosition.z);
                                this.hiroMarkerMesh.rotation.setFromQuaternion(this.markerWorldQuaternion);
                                this.hiroMarkerMesh.updateMatrix();
                            }
                            if (imageIndex == 1) {
                                this.earthNFTMesh.visible = true;
                                this.earthNFTMesh.position.set(this.markerWorldPosition.x, this.markerWorldPosition.y, this.markerWorldPosition.z);
                                this.earthNFTMesh.rotation.setFromQuaternion(this.markerWorldQuaternion);
                                this.earthNFTMesh.updateMatrix();
                            }
                        } else if (state == "emulated") {
                            // console.log("Image target no longer seen");
                        }
                    }
                }
            }
        }
    }

    private onXRSessionStop(_evt: { session: XRSession }) {
        if (this.grid) this.grid.visible = true;
    }
}
