# **app-gltf-viewer**
The GLTF Viewer is a sample application allowing for visualizing GLTF data translated from an Onshape model. It is a Node.JS application that runs as a tab inside an Onshape document. Onshape passes the document context to the viewer, which is used to help generate the GLTF visualization.

## Process (Customer-Perspective) To Use This App

1. Create the API keys in Onshape's Dev Portal
2. Create the necessary workflows in Flow, using your API keys (templates TBD)
3. Edit the Config Vars with the Webhooks to Flow
4. Deploy the App (itself, no Redis needed)
5. Create the App Ext + Store Entry
6. Subscribe to the App Ext. + Grant Permission

**Goal**: is to slim this process down to just step 6 (will need to add OAuth to Onshape Flow Connector) 

## References
* [Onshape Developer Portal](https://dev-portal.onshape.com)
    * [Help / Documentation](https://dev-portal.onshape.com/help)
* [Heroku](https://heroku.com)
    * [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
* [GLTF information](https://www.khronos.org/gltf/) from Khronos Group
* [three.js](https://threejs.org/) library to render GLTF
                     
