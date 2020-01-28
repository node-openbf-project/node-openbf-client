
class API {
  /**
   * @param {import("cannon")} cannon physics engine reference
   * @param {import("cannon").World} world physics world reference
   * @param {import("./renderer.js").default} renderer for rendering things, obviously
   * @param {import("./time.js").default} timeManager for managing game loop/scheduling
   * @param {import("./input.js)").default} input for getting game input
   */
  constructor (cannon, world, renderer, timeManager, input) {
    this.cannon = cannon;
    this.world = world;
    this.renderer = renderer;
    this.timeManager = timeManager;
    this.input = input;
  }
}

export default API;
