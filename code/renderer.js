
const three = require("three");
let WebGLRenderer = three.WebGLRenderer;
let Scene = three.Scene;

class Renderer {
  constructor () {
    this.webgl = new WebGLRenderer();
    this.webgl.setClearColor("#eeeeff");
    this.webgl.setSize(100, 100);
    this.scene = new Scene();
    this.camera;
    
    this.aspect = 1;
    this.needsRender = false;
    this.renderLoop = false;

    this.renderCallback = ()=>{
      if (this.needsRender && this.camera) this.render();
      if (this.renderLoop) requestAnimationFrame(this.renderCallback);
    }
  }

  /**Mount the renderer to a parent html element
   * @param {HTMLElement} parent 
   */
  mount (parent) {
    parent.appendChild(this.webgl.domElement);
  }

  /**Set current rendering camera
   * @param {import("three").Camera} camera 
   */
  setCamera (camera) {
    this.camera = camera;
  }

  /**Resize the canvas
   * @param {Integer} w 
   * @param {Integer} h 
   */
  resize (w, h) {
    this.aspect = w/h;
    this.webgl.setSize(w, h);
    if (this.camera && this.camera.aspect) {
      this.camera.aspect = this.aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  render () {
    this.webgl.render(this.scene, this.camera);
    //this.needsRender = false;
  }

  start () {
    this.renderLoop = true;
    this.needsRender = true;
    requestAnimationFrame(this.renderCallback);
  }
  stop () {
    this.renderLoop = false;
    this.needsRender = false;
  }
}

export default Renderer;
