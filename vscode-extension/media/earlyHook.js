(function () {
  console.error(
    '[md-comments:earlyHook] EXECUTION STARTED, url=',
    window.location.href,
    'acquireVsCodeApi=',
    typeof acquireVsCodeApi,
    'cspAlerter=',
    !!window.cspAlerter,
    'styleLoadingMonitor=',
    !!window.styleLoadingMonitor
  );

  function scanWindowForVsCodeApi() {
    if (
      window.Y &&
      typeof window.Y.postMessage === 'function' &&
      typeof window.Y.getState === 'function'
    ) {
      console.error('[md-comments:earlyHook] found window.Y as vsCodeApi');
      return window.Y;
    }
    try {
      for (const key of Object.getOwnPropertyNames(window)) {
        try {
          const val = window[key];
          if (
            val &&
            typeof val === 'object' &&
            typeof val.postMessage === 'function' &&
            typeof val.getState === 'function' &&
            typeof val.setState === 'function' &&
            Object.isFrozen(val)
          ) {
            console.error('[md-comments:earlyHook] found vsCodeApi under window property:', key);
            return val;
          }
        } catch (_) {
          /* ignore */
        }
      }
    } catch (_) {
      /* ignore */
    }
    return null;
  }

  function scanWindowForPoster() {
    if (window.X && typeof window.X.postMessage === 'function') {
      console.error('[md-comments:earlyHook] found window.X as poster');
      return window.X;
    }
    return null;
  }

  const foundApi = scanWindowForVsCodeApi();
  if (foundApi) {
    window.__mdCommentsVsCodeApi = foundApi;
  }
  const foundPoster = scanWindowForPoster();
  if (foundPoster) {
    window.__mdCommentsCapturedPoster = foundPoster;
  }

  function getVsCodeHostParent() {
    try {
      const getter = Object.getOwnPropertyDescriptor(Window.prototype, 'parent')?.get;
      if (getter) {
        const p = getter.call(window);
        if (p && typeof p.__vscode_post_message__ === 'function') {
          return p;
        }
      }
    } catch (e) {
      void e;
    }
    try {
      const topGetter = Object.getOwnPropertyDescriptor(Window.prototype, 'top')?.get;
      if (topGetter) {
        const t = topGetter.call(window);
        if (t && typeof t.__vscode_post_message__ === 'function') {
          return t;
        }
      }
    } catch (e) {
      void e;
    }
    try {
      if (window.parent && typeof window.parent.__vscode_post_message__ === 'function') {
        return window.parent;
      }
    } catch (e) {
      void e;
    }
    return null;
  }
  window.__mdCommentsGetHostParent = getVsCodeHostParent;

  const wrap = function (obj, name) {
    if (!obj) return;
    if (typeof obj.setPoster === 'function') {
      const orig = obj.setPoster.bind(obj);
      obj.setPoster = function (p) {
        console.error('[md-comments:earlyHook] setPoster hooked called on', name);
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
          console.error('[md-comments:earlyHook] proto setPoster called on', name);
          window.__mdCommentsCapturedPoster = p;
          window.__mdCommentsCapturedPosterSource = name + '_proto';
          return origProto.call(this, p);
        };
      }
    } catch (e) {
      void e;
    }
  };

  let _cspAlerter = window.cspAlerter;
  if (_cspAlerter) {
    wrap(_cspAlerter, 'cspAlerter');
  } else {
    try {
      Object.defineProperty(window, 'cspAlerter', {
        configurable: true,
        enumerable: true,
        get: function () {
          return _cspAlerter;
        },
        set: function (val) {
          _cspAlerter = val;
          wrap(val, 'cspAlerter');
        },
      });
    } catch (e) {
      void e;
    }
  }

  let _styleLoadingMonitor = window.styleLoadingMonitor;
  if (_styleLoadingMonitor) {
    wrap(_styleLoadingMonitor, 'styleLoadingMonitor');
  } else {
    try {
      Object.defineProperty(window, 'styleLoadingMonitor', {
        configurable: true,
        enumerable: true,
        get: function () {
          return _styleLoadingMonitor;
        },
        set: function (val) {
          _styleLoadingMonitor = val;
          wrap(val, 'styleLoadingMonitor');
        },
      });
    } catch (e) {
      void e;
    }
  }

  const hookAcquire = function (origAcquire) {
    const wrappedAcquire = function () {
      if (window.__mdCommentsVsCodeApi) {
        return window.__mdCommentsVsCodeApi;
      }
      try {
        const api = origAcquire();
        window.__mdCommentsVsCodeApi = api;
        console.error('[md-comments:earlyHook] acquireVsCodeApi SUCCEEDED');
        return api;
      } catch (e) {
        console.error('[md-comments:earlyHook] acquireVsCodeApi THREW:', String(e));
        if (!window.__mdCommentsVsCodeApi) {
          try {
            const host = getVsCodeHostParent();
            if (host && typeof host.__vscode_post_message__ === 'function') {
              window.__mdCommentsVsCodeApi = Object.freeze({
                postMessage: function (message, transfer) {
                  host.__vscode_post_message__('onmessage', { message, transfer }, transfer);
                },
                setState: function () {},
                getState: function () {
                  return {};
                },
              });
              console.error(
                '[md-comments:earlyHook] created direct vscodeApi fallback from hostParent'
              );
            }
          } catch (pe) {
            void pe;
          }
        }
        return window.__mdCommentsVsCodeApi;
      }
    };
    try {
      globalThis.acquireVsCodeApi = wrappedAcquire;
      window.acquireVsCodeApi = wrappedAcquire;
      wrappedAcquire();
    } catch (e) {
      console.error('[md-comments:earlyHook] wrappedAcquire call threw:', String(e));
      void e;
    }
  };

  let _acquire = globalThis.acquireVsCodeApi || window.acquireVsCodeApi;
  if (typeof _acquire === 'function') {
    hookAcquire(_acquire);
  } else {
    try {
      Object.defineProperty(globalThis, 'acquireVsCodeApi', {
        configurable: true,
        enumerable: true,
        get: function () {
          return _acquire;
        },
        set: function (val) {
          _acquire = val;
          hookAcquire(val);
        },
      });
    } catch (e) {
      void e;
    }
  }

  if (!window.__mdCommentsVsCodeApi) {
    try {
      const host = getVsCodeHostParent();
      if (host && typeof host.__vscode_post_message__ === 'function') {
        window.__mdCommentsVsCodeApi = Object.freeze({
          postMessage: function (message, transfer) {
            host.__vscode_post_message__('onmessage', { message, transfer }, transfer);
          },
          setState: function () {},
          getState: function () {
            return {};
          },
        });
        console.error(
          '[md-comments:earlyHook] created direct vscodeApi fallback from hostParent (outside hookAcquire)'
        );
      }
    } catch (e) {
      void e;
    }
  }
})();
