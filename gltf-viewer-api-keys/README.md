# Onshape Experiments - API Keys Example

![Truck image](./public/static/seb-creativo-3jG-UM8IZ40-unsplash.jpg)

This GLTF "Truck Viewer" is a sample application allowing for visualizing GLTF data translated from an Onshape model. It is a standalone Node.JS application. Onshape passes the glTF to the viewer, which is used to help generate a Three.js visualization.

This project was inspired by an earlier [repo](https://github.com/onshape-public/app-gltf-viewer) by the incredibly talented, incorrigibly curious folks behind the public Onshape GitHub account. 

You can build your own version of this app by following the companion blog post [here](https://zain-raza.medium.com/how-to-build-your-own-3d-cad-model-viewer-for-the-web-b1fe65369b35?source=friends_link&sk=325f62b123edf619db63e83b0a5efdc3) on Medium.

## Installation
This section outlines how to deploy and configure the application on Heroku. If you are using another service, some of these steps will not apply to you, and the equivalent steps for the other service should be taken instead.

**These instructions assume that `git` and `npm` are installed.**

1. Make a bare clone of the repository: `git clone --bare https://github.com/UPstartDeveloper/OnshapeExperiments.git`. 
1. Push to a new mirror repository: `cd OnshapeExperiments.git && git push --mirror https://github.com/<youruser>/my-OnshapeExperiments.git`.
1. Clean up the temporary repository: `cd .. && rm -rf OnshapeExperiments.git`.
1. Clone your newly mirrored repository: `git clone https://github.com/<youruser>/my-OnshapeExperiments.git`.
1. Go to the [Onshape Developer Portal](https://dev-portal.onshape.com/signin), and log in with the same credentials as the account that has the Onshape model you wish to visualize. Go to the "API keys" tab, and create a pair of new API keys to use. And save them somewhere safe, like in a `.env` file!
1. Configure all the necessary environment variables in the `.env` file:
```Shell
ONSHAPE_API_ACCESSKEY=...  
ONSHAPE_API_SECRETKEY=...
PORT=3000  # or could be 5000, 8000, 8080, etc.
API_URL=https://cad.onshape.com/api  # may also need to specify the version you want, e.g. by placing "/v4" at the end of this URL 
SESSION_SECRET=... # some long, hard to guess string you create with no spaces
WEBHOOK_CALLBACK_ROOT_URL=...  # same as host name
```

## Usage
You can start the server by installing the dependencies (one time) and then running the `www` script (each time):

```bash
# in the root directory
$ npm install
$ bin/www
```

If you think there is an issue loading or rendering your model, you can open the JavaScript console of your browser to check for any errors.

Once the model is rendered, the following controls are available to you:
Control | How to Use
------- | ----------
Zoom | Mouse wheel
Rotate | Left-click and move mouse
Pan | Right-click and move mouse

## References
* Original [glTF viewer sample app](https://github.com/onshape-public/app-gltf-viewer) by Onshape's GitHub organization
* [Onshape Developer Portal](https://dev-portal.onshape.com)
    * [Help / Documentation](https://dev-portal.onshape.com/help)
* [Heroku](https://heroku.com)
    * [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
* [GLTF information](https://www.khronos.org/gltf/) from Khronos Group
* [three.js](https://threejs.org/) library to render GLTF
                     
