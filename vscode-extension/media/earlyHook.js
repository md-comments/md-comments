(function () {
  const wrap = function (obj, name) {
    if (!obj) return;
    if (typeof obj.setPoster === 'function') {
      const orig = obj.setPoster.bind(obj);
      obj.setPoster = function (p) {
        window.__mdCommentsCapturedPoster = p;
        window.__mdCommentsCapturedPosterSource = name;
        return orig(p);
      };
    }
    try {
      const proto = Object.getPrototypeOf(obj);
      if (proto && typeof proto.setPoster === 'function') {
        const origProto = proto.setPoster;
        proto.setPoster = function (p) {
          window.__mdCommentsCapturedPoster = p;
          window.__mdCommentsCapturedPosterSource = name + '_proto';
          return origProto.call(this, p);
        };
      }
    } catch (e) {
      void e;
    }
  };

  wrap(window.cspAlerter, 'cspAlerter');
  wrap(window.styleLoadingMonitor, 'styleLoadingMonitor');

  if (typeof acquireVsCodeApi === 'function') {
    const origAcquire = acquireVsCodeApi;
    const wrappedAcquire = function () {
      if (window.__mdCommentsVsCodeApi) {
        return window.__mdCommentsVsCodeApi;
      }
      try {
        const api = origAcquire();
        window.__mdCommentsVsCodeApi = api;
        return api;
      } catch (e) {
        void e;
        return window.__mdCommentsVsCodeApi;
      }
    };
    try {
      globalThis.acquireVsCodeApi = wrappedAcquire;
      window.acquireVsCodeApi = wrappedAcquire;
      wrappedAcquire();
    } catch (e) {
      void e;
    }
  }
})();
