(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TaixinGeminiStudentQA = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function getEngine() {
    if (typeof TaixinStudentQA !== 'undefined') return TaixinStudentQA;
    if (typeof require === 'function') return require('./state-machine.js');
    throw new Error('TaixinStudentQA state machine missing');
  }

  function configure(context) {
    const engine = getEngine();
    if (engine.configure) engine.configure(context && context.closingMap);
  }

  async function start(profile, context) {
    configure(context);
    return getEngine().start(profile);
  }

  async function transition(state, message, context) {
    configure(context);
    return getEngine().transition(state, message);
  }

  return { start, transition };
});
