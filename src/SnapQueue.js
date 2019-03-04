export default class SnapQueue {
  constructor() {
    this.queue = {};
  }

  push(type, distance, cb, ...args) {
    if (!this.queue[type] || this.queue[type].distance > distance) {
      this.queue[type] = {
        distance,
        cb,
        args,
      };
    }
  }

  execute() {
    Object.keys(this.queue).forEach((type) => {
      const item = this.queue[type];
      console.log(type);
      item.cb(...item.args);
    });
  }
}
