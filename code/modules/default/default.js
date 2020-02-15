
let fs = require("fs");
let three = require("three");
let cannon = require("cannon");

let AnimationMixer = three.AnimationMixer;
let GLTFLoader = require("../../GLTFLoader.js");

let Player = require("./player.js");
let { UILabel, UIButton } = require("../../ui.js");

/**Auxiliary register function for calling API/fetching resources/setup
 * @param {import("../../api.js")} api api object containing references to apis
 * @param {String} _modpath path to this module not including last slash
 */
function register(api, _modpath) {
  api.world.gravity.set(0, -9.82 * 2, 0);

  /**@type {import("./player.js")} */
  let localPlayer;
  let mixer;

  if (!api.headless) {
    api.renderer.webgl.setClearColor("#112233");

    api.renderer.scene.add(
      new three.DirectionalLight(0xffffff, 1)
    );
    api.renderer.scene.add(
      new three.AmbientLight(0xffffff, 1)
    );
    api.renderer.scene.add(
      new three.PointLight(0xffffff, 1, 100)
    );
    mixer;
    localPlayer = new Player(api, _modpath, "RepComm", true);
  }
  let gltfLoader = new GLTFLoader(undefined, api.headless);
  fs.readFile(_modpath + "/gfx/demo-map.glb", (ex0, data) => {
    if (ex0) {
      console.log("File System Error", ex0);
      return;
    }
    gltfLoader.parse(data.buffer, _modpath + "/gfx/demo-map.glb", (gltf) => {
      gltf.scene.traverse((child) => {
        if (child.userData.collision) {
          let collision = JSON.parse(child.userData.collision);
          let shape;
          switch (collision.shape.type) {
            case "mesh":
              if (collision.trimesh) {
                shape = new cannon.Trimesh(
                  child.geometry.attributes.position.array,
                  child.geometry.index.array
                );
              } else {
                let pos = child.geometry.attributes.position;
                let cannonPos = new Array(pos.count);
                let vi = 0;
                for (let i = 0; i < pos.array.length; i += 3) {
                  cannonPos[vi] = new cannon.Vec3(
                    pos.array[i],
                    pos.array[i + 1],
                    pos.array[i + 2]
                  );
                  vi++;
                }

                let index = child.geometry.index;
                let cannonInd = new Array();
                for (let i = 0; i < index.count; i += 3) {
                  cannonInd.push([
                    index.array[i],
                    index.array[i + 1],
                    index.array[i + 2]
                  ]);
                }

                shape = new cannon.ConvexPolyhedron(
                  cannonPos,
                  cannonInd
                );
              }
              break;
            case "sphere":
              shape = new cannon.Sphere(
                collision.shape.radius || 1
              )
              break;
            default:
              throw "Shape not supported " + child.userData.collision.type;
          }
          let body = new cannon.Body({
            mass: collision.mass || 0
          });
          body.position.copy(child.position);
          body.quaternion.copy(child.quaternion);
          body.real = child;
          body.addShape(shape);
          api.world.addBody(body);
        }
        if (child.userData.hide) {
          child.visible = false;
        }
      });
      api.renderer.scene.add(gltf.scene);

      if (!api.headless) {
        mixer = new AnimationMixer(gltf.scene);
        gltf.animations.forEach((clip) => {
          mixer.clipAction(clip).play();
        });

        localPlayer.teleport(0, 5, 0);
      }
    }, (ex1) => {
      console.log("Formatting Error", ex1);
    });
  });

  if (!api.headless) {
    let deltaDisplay = new UILabel("FPS : ");
    deltaDisplay.mount(api.renderer.hud);
    let playerPos = new UILabel("xyz : (0, 0, 0)");
    playerPos.mount(api.renderer.hud);

    let btnConnect = new UIButton("Connect").onclick(() => {
      let udp = require("dgram");
      let client = udp.createSocket("udp4");
      
      client.on("message", (data)=>{
        console.log("[Client] Got", data.toString(), data.length, "bytes");
      })
      client.on("connect", ()=>{
        console.log("[Client] Connected");
        console.log(localPlayer.entity);
        client.send(Buffer.from(localPlayer.entity.getData()));
      });
      client.on("error", (ex)=>{
        console.error("[Client]", ex);
      });
      client.on("close", ()=>{
        console.log("[Client] Closed");
      });
      client.connect(10209);
    });
    btnConnect.mount(api.renderer.hud);

    localPlayer.teleport(0, 2, 0);
    localPlayer.mount(api.renderer.scene, api.renderer);

    api.timeManager.listen(() => {
      deltaDisplay.text = "Logic FPS : " + api.timeManager.avgfps;
      playerPos.text = `Position : (${localPlayer.x.toFixed(2)}, ${localPlayer.y.toFixed(2)}, ${localPlayer.z.toFixed(2)})`;
      localPlayer.update();
      if (mixer) mixer.update(api.timeManager.delta);
    });
  }
}

module.exports = { register };
