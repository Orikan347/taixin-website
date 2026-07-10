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

  async function start(profile) {
    return getEngine().start(profile);
  }

  async function transition(state, message) {
    return getEngine().transition(state, message);
  }

  return { start, transition };
});
