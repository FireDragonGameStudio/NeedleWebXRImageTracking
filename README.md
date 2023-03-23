# WebXR Image Tracking and AR Indoor Navigation with Needle Tools

This is just a quick test of how to integrate WebXR Image Tracking into the Needle Engine (https://github.com/needle-tools/needle-engine-support). A working prototype can be found here - https://needle-webxr-imagetracking.glitch.me/ Make sure to have a hiro (https://github.com/AR-js-org/AR.js/blob/master/data/images/HIRO.jpg) and earth (https://github.com/stemkoski/AR-Examples/blob/master/images/earth.jpg) marker available to test the tracking.

The sample is based on the WebXR Image Tracking draft, with a few adjustments (https://github.com/immersive-web/marker-tracking/blob/main/explainer.md). The WebXR component of Needle Tools was altered as well, to activate the experimental requirement for image-tracking.

Pls note that this is just a POC. I won't provide actual support for this, apart from my personal development interests. For any questions about Needle Engine reach out to https://needle.tools/ and join their Discord. The community is lively and really helpful! Great team there :)

There are 2 scenes in this project, Minimal for multimarker tracking und IndoorNavigation for a small idea, of how indoor navigation with multiple markers can work. for reference check out the follwing videos, where the same indoor navigation was implemented with three.js and WebXR only:

* https://www.youtube.com/watch?v=Ww349vBXf-4 
*https://www.youtube.com/watch?v=riiJdNq2LWI

!!! Attention: This POC only works on Android Chrome with experimental flag for WebXR enabled. !!!