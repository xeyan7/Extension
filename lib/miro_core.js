window.MiroCore = (function () {
  var qt = Object.create,
    et = Object.defineProperty,
    Ht = Object.getOwnPropertyDescriptor,
    Vt = Object.getOwnPropertyNames,
    Gt = Object.getPrototypeOf,
    Jt = Object.prototype.hasOwnProperty,
    j = (t, e) => () => (
      e || (t((e = { exports: {} }).exports, e), (t = null)),
      e.exports
    ),
    Yt = (t, e, r, n) => {
      if ((e && typeof e == "object") || typeof e == "function")
        for (var l = Vt(e), c = 0, u = l.length, m; c < u; c++)
          ((m = l[c]),
            !Jt.call(t, m) &&
              m !== r &&
              et(t, m, {
                get: ((s) => e[s]).bind(null, m),
                enumerable: !(n = Ht(e, m)) || n.enumerable,
              }));
      return t;
    },
    tt = (t, e, r) => (
      (r = t != null ? qt(Gt(t)) : {}),
      Yt(
        e || !t || !t.__esModule
          ? et(r, "default", { value: t, enumerable: !0 })
          : r,
        t,
      )
    );
  function Nn(t) {
    return t;
  }
  var Xt = j((t, e) => {
      (function (r, n) {
        if (typeof define == "function" && define.amd)
          define("webextension-polyfill", ["module"], n);
        else if (typeof t < "u") n(e);
        else {
          var l = { exports: {} };
          (n(l), (r.browser = l.exports));
        }
      })(
        typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : t,
        function (r) {
          "use strict";
          if (!(
            globalThis.chrome &&
            globalThis.chrome.runtime &&
            globalThis.chrome.runtime.id
          ))
            throw new Error(
              "This script should only be loaded in a browser extension.",
            );
          if (
            globalThis.browser &&
            globalThis.browser.runtime &&
            globalThis.browser.runtime.id
          )
            r.exports = globalThis.browser;
          else {
            const n = "The message port closed before a response was received.",
              l = (c) => {
                const u = {
                  alarms: {
                    clear: { minArgs: 0, maxArgs: 1 },
                    clearAll: { minArgs: 0, maxArgs: 0 },
                    get: { minArgs: 0, maxArgs: 1 },
                    getAll: { minArgs: 0, maxArgs: 0 },
                  },
                  bookmarks: {
                    create: { minArgs: 1, maxArgs: 1 },
                    get: { minArgs: 1, maxArgs: 1 },
                    getChildren: { minArgs: 1, maxArgs: 1 },
                    getRecent: { minArgs: 1, maxArgs: 1 },
                    getSubTree: { minArgs: 1, maxArgs: 1 },
                    getTree: { minArgs: 0, maxArgs: 0 },
                    move: { minArgs: 2, maxArgs: 2 },
                    remove: { minArgs: 1, maxArgs: 1 },
                    removeTree: { minArgs: 1, maxArgs: 1 },
                    search: { minArgs: 1, maxArgs: 1 },
                    update: { minArgs: 2, maxArgs: 2 },
                  },
                  browserAction: {
                    disable: {
                      minArgs: 0,
                      maxArgs: 1,
                      fallbackToNoCallback: !0,
                    },
                    enable: {
                      minArgs: 0,
                      maxArgs: 1,
                      fallbackToNoCallback: !0,
                    },
                    getBadgeBackgroundColor: { minArgs: 1, maxArgs: 1 },
                    getBadgeText: { minArgs: 1, maxArgs: 1 },
                    getPopup: { minArgs: 1, maxArgs: 1 },
                    getTitle: { minArgs: 1, maxArgs: 1 },
                    openPopup: { minArgs: 0, maxArgs: 0 },
                    setBadgeBackgroundColor: {
                      minArgs: 1,
                      maxArgs: 1,
                      fallbackToNoCallback: !0,
                    },
                    setBadgeText: {
                      minArgs: 1,
                      maxArgs: 1,
                      fallbackToNoCallback: !0,
                    },
                    setIcon: { minArgs: 1, maxArgs: 1 },
                    setPopup: {
                      minArgs: 1,
                      maxArgs: 1,
                      fallbackToNoCallback: !0,
                    },
                    setTitle: {
                      minArgs: 1,
                      maxArgs: 1,
                      fallbackToNoCallback: !0,
                    },
                  },
                  browsingData: {
                    remove: { minArgs: 2, maxArgs: 2 },
                    removeCache: { minArgs: 1, maxArgs: 1 },
                    removeCookies: { minArgs: 1, maxArgs: 1 },
                    removeDownloads: { minArgs: 1, maxArgs: 1 },
                    removeFormData: { minArgs: 1, maxArgs: 1 },
                    removeHistory: { minArgs: 1, maxArgs: 1 },
                    removeLocalStorage: { minArgs: 1, maxArgs: 1 },
                    removePasswords: { minArgs: 1, maxArgs: 1 },
                    removePluginData: { minArgs: 1, maxArgs: 1 },
                    settings: { minArgs: 0, maxArgs: 0 },
                  },
                  commands: { getAll: { minArgs: 0, maxArgs: 0 } },
                  contextMenus: {
                    remove: { minArgs: 1, maxArgs: 1 },
                    removeAll: { minArgs: 0, maxArgs: 0 },
                    update: { minArgs: 2, maxArgs: 2 },
                  },
                  cookies: {
                    get: { minArgs: 1, maxArgs: 1 },
                    getAll: { minArgs: 1, maxArgs: 1 },
                    getAllCookieStores: { minArgs: 0, maxArgs: 0 },
                    remove: { minArgs: 1, maxArgs: 1 },
                    set: { minArgs: 1, maxArgs: 1 },
                  },
                  devtools: {
                    inspectedWindow: {
                      eval: { minArgs: 1, maxArgs: 2, singleCallbackArg: !1 },
                    },
                    panels: {
                      create: { minArgs: 3, maxArgs: 3, singleCallbackArg: !0 },
                      elements: {
                        createSidebarPane: { minArgs: 1, maxArgs: 1 },
                      },
                    },
                  },
                  downloads: {
                    cancel: { minArgs: 1, maxArgs: 1 },
                    download: { minArgs: 1, maxArgs: 1 },
                    erase: { minArgs: 1, maxArgs: 1 },
                    getFileIcon: { minArgs: 1, maxArgs: 2 },
                    open: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: !0 },
                    pause: { minArgs: 1, maxArgs: 1 },
                    removeFile: { minArgs: 1, maxArgs: 1 },
                    resume: { minArgs: 1, maxArgs: 1 },
                    search: { minArgs: 1, maxArgs: 1 },
                    show: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: !0 },
                  },
                  extension: {
                    isAllowedFileSchemeAccess: { minArgs: 0, maxArgs: 0 },
                    isAllowedIncognitoAccess: { minArgs: 0, maxArgs: 0 },
                  },
                  history: {
                    addUrl: { minArgs: 1, maxArgs: 1 },
                    deleteAll: { minArgs: 0, maxArgs: 0 },
                    deleteRange: { minArgs: 1, maxArgs: 1 },
                    deleteUrl: { minArgs: 1, maxArgs: 1 },
                    getVisits: { minArgs: 1, maxArgs: 1 },
                    search: { minArgs: 1, maxArgs: 1 },
                  },
                  i18n: {
                    detectLanguage: { minArgs: 1, maxArgs: 1 },
                    getAcceptLanguages: { minArgs: 0, maxArgs: 0 },
                  },
                  identity: { launchWebAuthFlow: { minArgs: 1, maxArgs: 1 } },
                  idle: { queryState: { minArgs: 1, maxArgs: 1 } },
                  management: {
                    get: { minArgs: 1, maxArgs: 1 },
                    getAll: { minArgs: 0, maxArgs: 0 },
                    getSelf: { minArgs: 0, maxArgs: 0 },
                    setEnabled: { minArgs: 2, maxArgs: 2 },
                    uninstallSelf: { minArgs: 0, maxArgs: 1 },
                  },
                  notifications: {
                    clear: { minArgs: 1, maxArgs: 1 },
                    create: { minArgs: 1, maxArgs: 2 },
                    getAll: { minArgs: 0, maxArgs: 0 },
                    getPermissionLevel: { minArgs: 0, maxArgs: 0 },
                    update: { minArgs: 2, maxArgs: 2 },
                  },
                  pageAction: {
                    getPopup: { minArgs: 1, maxArgs: 1 },
                    getTitle: { minArgs: 1, maxArgs: 1 },
                    hide: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: !0 },
                    setIcon: { minArgs: 1, maxArgs: 1 },
                    setPopup: {
                      minArgs: 1,
                      maxArgs: 1,
                      fallbackToNoCallback: !0,
                    },
                    setTitle: {
                      minArgs: 1,
                      maxArgs: 1,
                      fallbackToNoCallback: !0,
                    },
                    show: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: !0 },
                  },
                  permissions: {
                    contains: { minArgs: 1, maxArgs: 1 },
                    getAll: { minArgs: 0, maxArgs: 0 },
                    remove: { minArgs: 1, maxArgs: 1 },
                    request: { minArgs: 1, maxArgs: 1 },
                  },
                  runtime: {
                    getBackgroundPage: { minArgs: 0, maxArgs: 0 },
                    getPlatformInfo: { minArgs: 0, maxArgs: 0 },
                    openOptionsPage: { minArgs: 0, maxArgs: 0 },
                    requestUpdateCheck: { minArgs: 0, maxArgs: 0 },
                    sendMessage: { minArgs: 1, maxArgs: 3 },
                    sendNativeMessage: { minArgs: 2, maxArgs: 2 },
                    setUninstallURL: { minArgs: 1, maxArgs: 1 },
                  },
                  sessions: {
                    getDevices: { minArgs: 0, maxArgs: 1 },
                    getRecentlyClosed: { minArgs: 0, maxArgs: 1 },
                    restore: { minArgs: 0, maxArgs: 1 },
                  },
                  storage: {
                    local: {
                      clear: { minArgs: 0, maxArgs: 0 },
                      get: { minArgs: 0, maxArgs: 1 },
                      getBytesInUse: { minArgs: 0, maxArgs: 1 },
                      remove: { minArgs: 1, maxArgs: 1 },
                      set: { minArgs: 1, maxArgs: 1 },
                    },
                    managed: {
                      get: { minArgs: 0, maxArgs: 1 },
                      getBytesInUse: { minArgs: 0, maxArgs: 1 },
                    },
                    sync: {
                      clear: { minArgs: 0, maxArgs: 0 },
                      get: { minArgs: 0, maxArgs: 1 },
                      getBytesInUse: { minArgs: 0, maxArgs: 1 },
                      remove: { minArgs: 1, maxArgs: 1 },
                      set: { minArgs: 1, maxArgs: 1 },
                    },
                  },
                  tabs: {
                    captureVisibleTab: { minArgs: 0, maxArgs: 2 },
                    create: { minArgs: 1, maxArgs: 1 },
                    detectLanguage: { minArgs: 0, maxArgs: 1 },
                    discard: { minArgs: 0, maxArgs: 1 },
                    duplicate: { minArgs: 1, maxArgs: 1 },
                    executeScript: { minArgs: 1, maxArgs: 2 },
                    get: { minArgs: 1, maxArgs: 1 },
                    getCurrent: { minArgs: 0, maxArgs: 0 },
                    getZoom: { minArgs: 0, maxArgs: 1 },
                    getZoomSettings: { minArgs: 0, maxArgs: 1 },
                    goBack: { minArgs: 0, maxArgs: 1 },
                    goForward: { minArgs: 0, maxArgs: 1 },
                    highlight: { minArgs: 1, maxArgs: 1 },
                    insertCSS: { minArgs: 1, maxArgs: 2 },
                    move: { minArgs: 2, maxArgs: 2 },
                    query: { minArgs: 1, maxArgs: 1 },
                    reload: { minArgs: 0, maxArgs: 2 },
                    remove: { minArgs: 1, maxArgs: 1 },
                    removeCSS: { minArgs: 1, maxArgs: 2 },
                    sendMessage: { minArgs: 2, maxArgs: 3 },
                    setZoom: { minArgs: 1, maxArgs: 2 },
                    setZoomSettings: { minArgs: 1, maxArgs: 2 },
                    update: { minArgs: 1, maxArgs: 2 },
                  },
                  topSites: { get: { minArgs: 0, maxArgs: 0 } },
                  webNavigation: {
                    getAllFrames: { minArgs: 1, maxArgs: 1 },
                    getFrame: { minArgs: 1, maxArgs: 1 },
                  },
                  webRequest: {
                    handlerBehaviorChanged: { minArgs: 0, maxArgs: 0 },
                  },
                  windows: {
                    create: { minArgs: 0, maxArgs: 1 },
                    get: { minArgs: 1, maxArgs: 2 },
                    getAll: { minArgs: 0, maxArgs: 1 },
                    getCurrent: { minArgs: 0, maxArgs: 1 },
                    getLastFocused: { minArgs: 0, maxArgs: 1 },
                    remove: { minArgs: 1, maxArgs: 1 },
                    update: { minArgs: 2, maxArgs: 2 },
                  },
                };
                if (Object.keys(u).length === 0)
                  throw new Error(
                    "api-metadata.json has not been included in browser-polyfill",
                  );
                class m extends WeakMap {
                  constructor(y, x = void 0) {
                    (super(x), (this.createItem = y));
                  }
                  get(y) {
                    return (
                      this.has(y) || this.set(y, this.createItem(y)),
                      super.get(y)
                    );
                  }
                }
                const s = (d) =>
                    d && typeof d == "object" && typeof d.then == "function",
                  o =
                    (d, y) =>
                    (...x) => {
                      c.runtime.lastError
                        ? d.reject(new Error(c.runtime.lastError.message))
                        : y.singleCallbackArg ||
                            (x.length <= 1 && y.singleCallbackArg !== !1)
                          ? d.resolve(x[0])
                          : d.resolve(x);
                    },
                  a = (d) => (d == 1 ? "argument" : "arguments"),
                  i = (d, y) =>
                    function (F, ...T) {
                      if (T.length < y.minArgs)
                        throw new Error(
                          `Expected at least ${y.minArgs} ${a(y.minArgs)} for ${d}(), got ${T.length}`,
                        );
                      if (T.length > y.maxArgs)
                        throw new Error(
                          `Expected at most ${y.maxArgs} ${a(y.maxArgs)} for ${d}(), got ${T.length}`,
                        );
                      return new Promise((M, E) => {
                        if (y.fallbackToNoCallback)
                          try {
                            F[d](...T, o({ resolve: M, reject: E }, y));
                          } catch (k) {
                            (console.warn(
                              `${d} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `,
                              k,
                            ),
                              F[d](...T),
                              (y.fallbackToNoCallback = !1),
                              (y.noCallback = !0),
                              M());
                          }
                        else
                          y.noCallback
                            ? (F[d](...T), M())
                            : F[d](...T, o({ resolve: M, reject: E }, y));
                      });
                    },
                  p = (d, y, x) =>
                    new Proxy(y, {
                      apply(F, T, M) {
                        return x.call(T, d, ...M);
                      },
                    });
                let f = Function.call.bind(Object.prototype.hasOwnProperty);
                const g = (d, y = {}, x = {}) => {
                    let F = Object.create(null);
                    return new Proxy(Object.create(d), {
                      has(T, M) {
                        return M in d || M in F;
                      },
                      get(T, M, E) {
                        if (M in F) return F[M];
                        if (!(M in d)) return;
                        let k = d[M];
                        if (typeof k == "function")
                          if (typeof y[M] == "function") k = p(d, d[M], y[M]);
                          else if (f(x, M)) {
                            let L = i(M, x[M]);
                            k = p(d, d[M], L);
                          } else k = k.bind(d);
                        else if (
                          typeof k == "object" &&
                          k !== null &&
                          (f(y, M) || f(x, M))
                        )
                          k = g(k, y[M], x[M]);
                        else if (f(x, "*")) k = g(k, y[M], x["*"]);
                        else
                          return (
                            Object.defineProperty(F, M, {
                              configurable: !0,
                              enumerable: !0,
                              get() {
                                return d[M];
                              },
                              set(L) {
                                d[M] = L;
                              },
                            }),
                            k
                          );
                        return ((F[M] = k), k);
                      },
                      set(T, M, E, k) {
                        return (M in F ? (F[M] = E) : (d[M] = E), !0);
                      },
                      defineProperty(T, M, E) {
                        return Reflect.defineProperty(F, M, E);
                      },
                      deleteProperty(T, M) {
                        return Reflect.deleteProperty(F, M);
                      },
                    });
                  },
                  b = (d) => ({
                    addListener(y, x, ...F) {
                      y.addListener(d.get(x), ...F);
                    },
                    hasListener(y, x) {
                      return y.hasListener(d.get(x));
                    },
                    removeListener(y, x) {
                      y.removeListener(d.get(x));
                    },
                  }),
                  A = new m((d) =>
                    typeof d != "function"
                      ? d
                      : function (x) {
                          d(
                            g(
                              x,
                              {},
                              { getContent: { minArgs: 0, maxArgs: 0 } },
                            ),
                          );
                        },
                  ),
                  v = new m((d) =>
                    typeof d != "function"
                      ? d
                      : function (x, F, T) {
                          let M = !1,
                            E,
                            k = new Promise((P) => {
                              E = function (z) {
                                ((M = !0), P(z));
                              };
                            }),
                            L;
                          try {
                            L = d(x, F, E);
                          } catch (P) {
                            L = Promise.reject(P);
                          }
                          const D = L !== !0 && s(L);
                          if (L !== !0 && !D && !M) return !1;
                          const I = (P) => {
                            P.then(
                              (z) => {
                                T(z);
                              },
                              (z) => {
                                let W;
                                (z &&
                                (z instanceof Error ||
                                  typeof z.message == "string")
                                  ? (W = z.message)
                                  : (W = "An unexpected error occurred"),
                                  T({
                                    __mozWebExtensionPolyfillReject__: !0,
                                    message: W,
                                  }));
                              },
                            ).catch((z) => {
                              console.error(
                                "Failed to send onMessage rejected reply",
                                z,
                              );
                            });
                          };
                          return (I(D ? L : k), !0);
                        },
                  ),
                  S = ({ reject: d, resolve: y }, x) => {
                    c.runtime.lastError
                      ? c.runtime.lastError.message === n
                        ? y()
                        : d(new Error(c.runtime.lastError.message))
                      : x && x.__mozWebExtensionPolyfillReject__
                        ? d(new Error(x.message))
                        : y(x);
                  },
                  h = (d, y, x, ...F) => {
                    if (F.length < y.minArgs)
                      throw new Error(
                        `Expected at least ${y.minArgs} ${a(y.minArgs)} for ${d}(), got ${F.length}`,
                      );
                    if (F.length > y.maxArgs)
                      throw new Error(
                        `Expected at most ${y.maxArgs} ${a(y.maxArgs)} for ${d}(), got ${F.length}`,
                      );
                    return new Promise((T, M) => {
                      const E = S.bind(null, { resolve: T, reject: M });
                      (F.push(E), x.sendMessage(...F));
                    });
                  },
                  w = {
                    devtools: { network: { onRequestFinished: b(A) } },
                    runtime: {
                      onMessage: b(v),
                      onMessageExternal: b(v),
                      sendMessage: h.bind(null, "sendMessage", {
                        minArgs: 1,
                        maxArgs: 3,
                      }),
                    },
                    tabs: {
                      sendMessage: h.bind(null, "sendMessage", {
                        minArgs: 2,
                        maxArgs: 3,
                      }),
                    },
                  },
                  C = {
                    clear: { minArgs: 1, maxArgs: 1 },
                    get: { minArgs: 1, maxArgs: 1 },
                    set: { minArgs: 1, maxArgs: 1 },
                  };
                return (
                  (u.privacy = {
                    network: { "*": C },
                    services: { "*": C },
                    websites: { "*": C },
                  }),
                  g(c, w, u)
                );
              };
            r.exports = l(chrome);
          }
        },
      );
    }),
    Kt = j((t, e) => {
      var r = String,
        n = function () {
          return {
            isColorSupported: !1,
            reset: r,
            bold: r,
            dim: r,
            italic: r,
            underline: r,
            inverse: r,
            hidden: r,
            strikethrough: r,
            black: r,
            red: r,
            green: r,
            yellow: r,
            blue: r,
            magenta: r,
            cyan: r,
            white: r,
            gray: r,
            bgBlack: r,
            bgRed: r,
            bgGreen: r,
            bgYellow: r,
            bgBlue: r,
            bgMagenta: r,
            bgCyan: r,
            bgWhite: r,
            blackBright: r,
            redBright: r,
            greenBright: r,
            yellowBright: r,
            blueBright: r,
            magentaBright: r,
            cyanBright: r,
            whiteBright: r,
            bgBlackBright: r,
            bgRedBright: r,
            bgGreenBright: r,
            bgYellowBright: r,
            bgBlueBright: r,
            bgMagentaBright: r,
            bgCyanBright: r,
            bgWhiteBright: r,
          };
        };
      ((e.exports = n()), (e.exports.createColors = n));
    }),
    ee = j((t, e) => {
      e.exports = {};
    }),
    ze = j((t, e) => {
      var r = Kt(),
        n = ee(),
        l = class zt extends Error {
          constructor(u, m, s, o, a, i) {
            (super(u),
              (this.name = "CssSyntaxError"),
              (this.reason = u),
              a && (this.file = a),
              o && (this.source = o),
              i && (this.plugin = i),
              typeof m < "u" &&
                typeof s < "u" &&
                (typeof m == "number"
                  ? ((this.line = m), (this.column = s))
                  : ((this.line = m.line),
                    (this.column = m.column),
                    (this.endLine = s.line),
                    (this.endColumn = s.column))),
              this.setMessage(),
              Error.captureStackTrace && Error.captureStackTrace(this, zt));
          }
          setMessage() {
            ((this.message = this.plugin ? this.plugin + ": " : ""),
              (this.message += this.file ? this.file : "<css input>"),
              typeof this.line < "u" &&
                (this.message += ":" + this.line + ":" + this.column),
              (this.message += ": " + this.reason));
          }
          showSourceCode(u) {
            if (!this.source) return "";
            let m = this.source;
            u == null && (u = r.isColorSupported);
            let s = (b) => b,
              o = (b) => b,
              a = (b) => b;
            if (u) {
              let { bold: b, gray: A, red: v } = r.createColors(!0);
              ((o = (S) => b(v(S))), (s = (S) => A(S)), n && (a = (S) => n(S)));
            }
            let i = m.split(/\r?\n/),
              p = Math.max(this.line - 3, 0),
              f = Math.min(this.line + 2, i.length),
              g = String(f).length;
            return i.slice(p, f).map((b, A) => {
              let v = p + 1 + A,
                S = " " + (" " + v).slice(-g) + " | ";
              if (v === this.line) {
                if (b.length > 160) {
                  let w = 20,
                    C = Math.max(0, this.column - w),
                    d = Math.max(this.column + w, this.endColumn + w),
                    y = b.slice(C, d),
                    x =
                      s(S.replace(/\d/g, " ")) +
                      b
                        .slice(0, Math.min(this.column - 1, w - 1))
                        .replace(/[^\t]/g, " ");
                  return (
                    o(">") +
                    s(S) +
                    a(y) +
                    `
 ` +
                    x +
                    o("^")
                  );
                }
                let h =
                  s(S.replace(/\d/g, " ")) +
                  b.slice(0, this.column - 1).replace(/[^\t]/g, " ");
                return (
                  o(">") +
                  s(S) +
                  a(b) +
                  `
 ` +
                  h +
                  o("^")
                );
              }
              return " " + s(S) + a(b);
            }).join(`
`);
          }
          toString() {
            let u = this.showSourceCode();
            return (
              u &&
                (u =
                  `

` +
                  u +
                  `
`),
              this.name + ": " + this.message + u
            );
          }
        };
      ((e.exports = l), (l.default = l));
    }),
    rt = j((t, e) => {
      var r = /(<)(\/?style\b)/gi,
        n = /(<)(!--)/g;
      function l(s) {
        return typeof s != "string" || !s.includes("<")
          ? s
          : s.replace(r, "\\3c $2").replace(n, "\\3c $2");
      }
      var c = {
        after: `
`,
        beforeClose: `
`,
        beforeComment: `
`,
        beforeDecl: `
`,
        beforeOpen: " ",
        beforeRule: `
`,
        colon: ": ",
        commentLeft: " ",
        commentRight: " ",
        emptyBody: "",
        indent: "    ",
        semicolon: !1,
      };
      function u(s) {
        return s[0].toUpperCase() + s.slice(1);
      }
      var m = class {
        constructor(s) {
          this.builder = s;
        }
        atrule(s, o) {
          let a = "@" + s.name,
            i = s.params ? this.rawValue(s, "params") : "";
          if (
            (typeof s.raws.afterName < "u"
              ? (a += s.raws.afterName)
              : i && (a += " "),
            s.nodes)
          )
            this.block(s, a + i);
          else {
            let p = (s.raws.between || "") + (o ? ";" : "");
            this.builder(l(a + i + p), s);
          }
        }
        beforeAfter(s, o) {
          let a;
          s.type === "decl"
            ? (a = this.raw(s, null, "beforeDecl"))
            : s.type === "comment"
              ? (a = this.raw(s, null, "beforeComment"))
              : o === "before"
                ? (a = this.raw(s, null, "beforeRule"))
                : (a = this.raw(s, null, "beforeClose"));
          let i = s.parent,
            p = 0;
          for (; i && i.type !== "root";) ((p += 1), (i = i.parent));
          if (
            a.includes(`
`)
          ) {
            let f = this.raw(s, null, "indent");
            if (f.length) for (let g = 0; g < p; g++) a += f;
          }
          return a;
        }
        block(s, o) {
          let a = this.raw(s, "between", "beforeOpen");
          this.builder(l(o + a) + "{", s, "start");
          let i;
          (s.nodes && s.nodes.length
            ? (this.body(s), (i = this.raw(s, "after")))
            : (i = this.raw(s, "after", "emptyBody")),
            i && this.builder(l(i)),
            this.builder("}", s, "end"));
        }
        body(s) {
          let o = s.nodes.length - 1;
          for (; o > 0 && s.nodes[o].type === "comment";) o -= 1;
          let a = this.raw(s, "semicolon"),
            i = s.type === "document";
          for (let p = 0; p < s.nodes.length; p++) {
            let f = s.nodes[p],
              g = this.raw(f, "before");
            (g && this.builder(i ? g : l(g)), this.stringify(f, o !== p || a));
          }
        }
        comment(s) {
          let o = this.raw(s, "left", "commentLeft"),
            a = this.raw(s, "right", "commentRight");
          this.builder(l("/*" + o + s.text + a + "*/"), s);
        }
        decl(s, o) {
          let a = this.raw(s, "between", "colon"),
            i = s.prop + a + this.rawValue(s, "value");
          (s.important && (i += s.raws.important || " !important"),
            o && (i += ";"),
            this.builder(l(i), s));
        }
        document(s) {
          this.body(s);
        }
        raw(s, o, a) {
          let i;
          if ((a || (a = o), o && ((i = s.raws[o]), typeof i < "u"))) return i;
          let p = s.parent;
          if (
            a === "before" &&
            (!p ||
              (p.type === "root" && p.first === s) ||
              (p && p.type === "document"))
          )
            return "";
          if (!p) return c[a];
          let f = s.root();
          if ((f.rawCache || (f.rawCache = {}), typeof f.rawCache[a] < "u"))
            return f.rawCache[a];
          if (a === "before" || a === "after") return this.beforeAfter(s, a);
          {
            let g = "raw" + u(a);
            this[g]
              ? (i = this[g](f, s))
              : f.walk((b) => {
                  if (((i = b.raws[o]), typeof i < "u")) return !1;
                });
          }
          return (typeof i > "u" && (i = c[a]), (f.rawCache[a] = i), i);
        }
        rawBeforeClose(s) {
          let o;
          return (
            s.walk((a) => {
              if (a.nodes && a.nodes.length > 0 && typeof a.raws.after < "u")
                return (
                  (o = a.raws.after),
                  o.includes(`
`) && (o = o.replace(/[^\n]+$/, "")),
                  !1
                );
            }),
            o && (o = o.replace(/\S/g, "")),
            o
          );
        }
        rawBeforeComment(s, o) {
          let a;
          return (
            s.walkComments((i) => {
              if (typeof i.raws.before < "u")
                return (
                  (a = i.raws.before),
                  a.includes(`
`) && (a = a.replace(/[^\n]+$/, "")),
                  !1
                );
            }),
            typeof a > "u"
              ? (a = this.raw(o, null, "beforeDecl"))
              : a && (a = a.replace(/\S/g, "")),
            a
          );
        }
        rawBeforeDecl(s, o) {
          let a;
          return (
            s.walkDecls((i) => {
              if (typeof i.raws.before < "u")
                return (
                  (a = i.raws.before),
                  a.includes(`
`) && (a = a.replace(/[^\n]+$/, "")),
                  !1
                );
            }),
            typeof a > "u"
              ? (a = this.raw(o, null, "beforeRule"))
              : a && (a = a.replace(/\S/g, "")),
            a
          );
        }
        rawBeforeOpen(s) {
          let o;
          return (
            s.walk((a) => {
              if (a.type !== "decl" && ((o = a.raws.between), typeof o < "u"))
                return !1;
            }),
            o
          );
        }
        rawBeforeRule(s) {
          let o;
          return (
            s.walk((a) => {
              if (
                a.nodes &&
                (a.parent !== s || s.first !== a) &&
                typeof a.raws.before < "u"
              )
                return (
                  (o = a.raws.before),
                  o.includes(`
`) && (o = o.replace(/[^\n]+$/, "")),
                  !1
                );
            }),
            o && (o = o.replace(/\S/g, "")),
            o
          );
        }
        rawColon(s) {
          let o;
          return (
            s.walkDecls((a) => {
              if (typeof a.raws.between < "u")
                return ((o = a.raws.between.replace(/[^\s:]/g, "")), !1);
            }),
            o
          );
        }
        rawEmptyBody(s) {
          let o;
          return (
            s.walk((a) => {
              if (
                a.nodes &&
                a.nodes.length === 0 &&
                ((o = a.raws.after), typeof o < "u")
              )
                return !1;
            }),
            o
          );
        }
        rawIndent(s) {
          if (s.raws.indent) return s.raws.indent;
          let o;
          return (
            s.walk((a) => {
              let i = a.parent;
              if (
                i &&
                i !== s &&
                i.parent &&
                i.parent === s &&
                typeof a.raws.before < "u"
              ) {
                let p = a.raws.before.split(`
`);
                return ((o = p[p.length - 1]), (o = o.replace(/\S/g, "")), !1);
              }
            }),
            o
          );
        }
        rawSemicolon(s) {
          let o;
          return (
            s.walk((a) => {
              if (
                a.nodes &&
                a.nodes.length &&
                a.last.type === "decl" &&
                ((o = a.raws.semicolon), typeof o < "u")
              )
                return !1;
            }),
            o
          );
        }
        rawValue(s, o) {
          let a = s[o],
            i = s.raws[o];
          return i && i.value === a ? i.raw : a;
        }
        root(s) {
          if ((this.body(s), s.raws.after)) {
            let o = s.raws.after,
              a = s.parent && s.parent.type === "document";
            this.builder(a ? o : l(o));
          }
        }
        rule(s) {
          (this.block(s, this.rawValue(s, "selector")),
            s.raws.ownSemicolon &&
              this.builder(l(s.raws.ownSemicolon), s, "end"));
        }
        stringify(s, o) {
          if (!this[s.type])
            throw new Error(
              "Unknown AST node type " +
                s.type +
                ". Maybe you need to change PostCSS stringifier.",
            );
          this[s.type](s, o);
        }
      };
      ((e.exports = m), (m.default = m));
    }),
    we = j((t, e) => {
      var r = rt();
      function n(l, c) {
        new r(c).stringify(l);
      }
      ((e.exports = n), (n.default = n));
    }),
    je = j((t, e) => {
      ((e.exports.isClean = Symbol("isClean")), (e.exports.my = Symbol("my")));
    }),
    xe = j((t, e) => {
      var r = ze(),
        n = rt(),
        l = we(),
        { isClean: c, my: u } = je();
      function m(a, i) {
        let p = new a.constructor();
        for (let f in a) {
          if (!Object.prototype.hasOwnProperty.call(a, f) || f === "proxyCache")
            continue;
          let g = a[f],
            b = typeof g;
          f === "parent" && b === "object"
            ? i && (p[f] = i)
            : f === "source"
              ? (p[f] = g)
              : Array.isArray(g)
                ? (p[f] = g.map((A) => m(A, p)))
                : (b === "object" && g !== null && (g = m(g)), (p[f] = g));
        }
        return p;
      }
      function s(a, i) {
        if (i && typeof i.offset < "u") return i.offset;
        let p = 1,
          f = 1,
          g = 0;
        for (let b = 0; b < a.length; b++) {
          if (f === i.line && p === i.column) {
            g = b;
            break;
          }
          a[b] ===
          `
`
            ? ((p = 1), (f += 1))
            : (p += 1);
        }
        return g;
      }
      var o = class {
        get proxyOf() {
          return this;
        }
        constructor(a = {}) {
          ((this.raws = {}), (this[c] = !1), (this[u] = !0));
          for (let i in a)
            if (i === "nodes") {
              this.nodes = [];
              for (let p of a[i])
                typeof p.clone == "function"
                  ? this.append(p.clone())
                  : this.append(p);
            } else this[i] = a[i];
        }
        addToError(a) {
          if (
            ((a.postcssNode = this),
            a.stack && this.source && /\n\s{4}at /.test(a.stack))
          ) {
            let i = this.source;
            a.stack = a.stack.replace(
              /\n\s{4}at /,
              `$&${i.input.from}:${i.start.line}:${i.start.column}$&`,
            );
          }
          return a;
        }
        after(a) {
          return (this.parent.insertAfter(this, a), this);
        }
        assign(a = {}) {
          for (let i in a) this[i] = a[i];
          return this;
        }
        before(a) {
          return (this.parent.insertBefore(this, a), this);
        }
        cleanRaws(a) {
          (delete this.raws.before,
            delete this.raws.after,
            a || delete this.raws.between);
        }
        clone(a = {}) {
          let i = m(this);
          for (let p in a) i[p] = a[p];
          return i;
        }
        cloneAfter(a = {}) {
          let i = this.clone(a);
          return (this.parent.insertAfter(this, i), i);
        }
        cloneBefore(a = {}) {
          let i = this.clone(a);
          return (this.parent.insertBefore(this, i), i);
        }
        error(a, i = {}) {
          if (this.source) {
            let { end: p, start: f } = this.rangeBy(i);
            return this.source.input.error(
              a,
              { column: f.column, line: f.line },
              { column: p.column, line: p.line },
              i,
            );
          }
          return new r(a);
        }
        getProxyProcessor() {
          return {
            get(a, i) {
              return i === "proxyOf"
                ? a
                : i === "root"
                  ? () => a.root().toProxy()
                  : a[i];
            },
            set(a, i, p) {
              return (
                a[i] === p ||
                  ((a[i] = p),
                  (i === "prop" ||
                    i === "value" ||
                    i === "name" ||
                    i === "params" ||
                    i === "important" ||
                    i === "text") &&
                    a.markDirty()),
                !0
              );
            },
          };
        }
        markClean() {
          this[c] = !0;
        }
        markDirty() {
          if (this[c]) {
            this[c] = !1;
            let a = this;
            for (; (a = a.parent);) a[c] = !1;
          }
        }
        next() {
          if (!this.parent) return;
          let a = this.parent.index(this);
          return this.parent.nodes[a + 1];
        }
        positionBy(a = {}) {
          let i = this.source.start;
          if (a.index) i = this.positionInside(a.index);
          else if (a.word) {
            let p =
                "document" in this.source.input
                  ? this.source.input.document
                  : this.source.input.css,
              f = p
                .slice(s(p, this.source.start), s(p, this.source.end))
                .indexOf(a.word);
            f !== -1 && (i = this.positionInside(f));
          }
          return i;
        }
        positionInside(a) {
          let i = this.source.start.column,
            p = this.source.start.line,
            f =
              "document" in this.source.input
                ? this.source.input.document
                : this.source.input.css,
            g = s(f, this.source.start),
            b = g + a;
          for (let A = g; A < b; A++)
            f[A] ===
            `
`
              ? ((i = 1), (p += 1))
              : (i += 1);
          return { column: i, line: p, offset: b };
        }
        prev() {
          if (!this.parent) return;
          let a = this.parent.index(this);
          return this.parent.nodes[a - 1];
        }
        rangeBy(a = {}) {
          let i =
              "document" in this.source.input
                ? this.source.input.document
                : this.source.input.css,
            p = {
              column: this.source.start.column,
              line: this.source.start.line,
              offset: s(i, this.source.start),
            },
            f = this.source.end
              ? {
                  column: this.source.end.column + 1,
                  line: this.source.end.line,
                  offset:
                    typeof this.source.end.offset == "number"
                      ? this.source.end.offset
                      : s(i, this.source.end) + 1,
                }
              : { column: p.column + 1, line: p.line, offset: p.offset + 1 };
          if (a.word) {
            let g = i
              .slice(s(i, this.source.start), s(i, this.source.end))
              .indexOf(a.word);
            g !== -1 &&
              ((p = this.positionInside(g)),
              (f = this.positionInside(g + a.word.length)));
          } else
            (a.start
              ? (p = {
                  column: a.start.column,
                  line: a.start.line,
                  offset: s(i, a.start),
                })
              : a.index && (p = this.positionInside(a.index)),
              a.end
                ? (f = {
                    column: a.end.column,
                    line: a.end.line,
                    offset: s(i, a.end),
                  })
                : typeof a.endIndex == "number"
                  ? (f = this.positionInside(a.endIndex))
                  : a.index && (f = this.positionInside(a.index + 1)));
          return (
            (f.line < p.line || (f.line === p.line && f.column <= p.column)) &&
              (f = {
                column: p.column + 1,
                line: p.line,
                offset: p.offset + 1,
              }),
            { end: f, start: p }
          );
        }
        raw(a, i) {
          return new n().raw(this, a, i);
        }
        remove() {
          return (
            this.parent && this.parent.removeChild(this),
            (this.parent = void 0),
            this
          );
        }
        replaceWith(...a) {
          if (this.parent) {
            let i = this,
              p = !1;
            for (let f of a)
              f === this
                ? (p = !0)
                : p
                  ? (this.parent.insertAfter(i, f), (i = f))
                  : this.parent.insertBefore(i, f);
            p || this.remove();
          }
          return this;
        }
        root() {
          let a = this;
          for (; a.parent && a.parent.type !== "document";) a = a.parent;
          return a;
        }
        toJSON(a, i) {
          let p = {},
            f = i == null;
          i = i || new Map();
          let g = 0;
          for (let b in this) {
            if (
              !Object.prototype.hasOwnProperty.call(this, b) ||
              b === "parent" ||
              b === "proxyCache"
            )
              continue;
            let A = this[b];
            if (Array.isArray(A))
              p[b] = A.map((v) =>
                typeof v == "object" && v.toJSON ? v.toJSON(null, i) : v,
              );
            else if (typeof A == "object" && A.toJSON) p[b] = A.toJSON(null, i);
            else if (b === "source") {
              if (A == null) continue;
              let v = i.get(A.input);
              (v == null && ((v = g), i.set(A.input, g), g++),
                (p[b] = { end: A.end, inputId: v, start: A.start }));
            } else p[b] = A;
          }
          return (f && (p.inputs = [...i.keys()].map((b) => b.toJSON())), p);
        }
        toProxy() {
          return (
            this.proxyCache ||
              (this.proxyCache = new Proxy(this, this.getProxyProcessor())),
            this.proxyCache
          );
        }
        toString(a = l) {
          a.stringify && (a = a.stringify);
          let i = "";
          return (
            a(this, (p) => {
              i += p;
            }),
            i
          );
        }
        warn(a, i, p = {}) {
          let f = { node: this };
          for (let g in p) f[g] = p[g];
          return a.warn(i, f);
        }
      };
      ((e.exports = o), (o.default = o));
    }),
    Ae = j((t, e) => {
      var r = xe(),
        n = class extends r {
          constructor(l) {
            (super(l), (this.type = "comment"));
          }
        };
      ((e.exports = n), (n.default = n));
    }),
    Ce = j((t, e) => {
      var r = xe(),
        n = class extends r {
          get variable() {
            return this.prop.startsWith("--") || this.prop[0] === "$";
          }
          constructor(l) {
            (l &&
              typeof l.value < "u" &&
              typeof l.value != "string" &&
              (l = { ...l, value: String(l.value) }),
              super(l),
              (this.type = "decl"));
          }
        };
      ((e.exports = n), (n.default = n));
    }),
    ce = j((t, e) => {
      var r = Ae(),
        n = Ce(),
        l = xe(),
        { isClean: c, my: u } = je(),
        m,
        s,
        o,
        a;
      function i(g) {
        return g.map(
          (b) => (b.nodes && (b.nodes = i(b.nodes)), delete b.source, b),
        );
      }
      function p(g) {
        if (((g[c] = !1), g.proxyOf.nodes)) for (let b of g.proxyOf.nodes) p(b);
      }
      var f = class jt extends l {
        get first() {
          if (this.proxyOf.nodes) return this.proxyOf.nodes[0];
        }
        get last() {
          if (this.proxyOf.nodes)
            return this.proxyOf.nodes[this.proxyOf.nodes.length - 1];
        }
        append(...b) {
          for (let A of b) {
            let v = this.normalize(A, this.last);
            for (let S of v) this.proxyOf.nodes.push(S);
          }
          return (this.markDirty(), this);
        }
        cleanRaws(b) {
          if ((super.cleanRaws(b), this.nodes))
            for (let A of this.nodes) A.cleanRaws(b);
        }
        each(b) {
          if (!this.proxyOf.nodes) return;
          let A = this.getIterator(),
            v,
            S;
          for (
            ;
            this.indexes[A] < this.proxyOf.nodes.length &&
            ((v = this.indexes[A]),
            (S = b(this.proxyOf.nodes[v], v)),
            S !== !1);
          )
            this.indexes[A] += 1;
          return (delete this.indexes[A], S);
        }
        every(b) {
          return this.nodes.every(b);
        }
        getIterator() {
          (this.lastEach || (this.lastEach = 0),
            this.indexes || (this.indexes = {}),
            (this.lastEach += 1));
          let b = this.lastEach;
          return ((this.indexes[b] = 0), b);
        }
        getProxyProcessor() {
          return {
            get(b, A) {
              return A === "proxyOf"
                ? b
                : b[A]
                  ? A === "each" ||
                    (typeof A == "string" && A.startsWith("walk"))
                    ? (...v) =>
                        b[A](
                          ...v.map((S) =>
                            typeof S == "function"
                              ? (h, w) => S(h.toProxy(), w)
                              : S,
                          ),
                        )
                    : A === "every" || A === "some"
                      ? (v) => b[A]((S, ...h) => v(S.toProxy(), ...h))
                      : A === "root"
                        ? () => b.root().toProxy()
                        : A === "nodes"
                          ? b.nodes.map((v) => v.toProxy())
                          : A === "first" || A === "last"
                            ? b[A].toProxy()
                            : b[A]
                  : b[A];
            },
            set(b, A, v) {
              return (
                b[A] === v ||
                  ((b[A] = v),
                  (A === "name" || A === "params" || A === "selector") &&
                    b.markDirty()),
                !0
              );
            },
          };
        }
        index(b) {
          return typeof b == "number"
            ? b
            : (b.proxyOf && (b = b.proxyOf), this.proxyOf.nodes.indexOf(b));
        }
        insertAfter(b, A) {
          let v = this.index(b),
            S = this.normalize(A, this.proxyOf.nodes[v]).reverse();
          v = this.index(b);
          for (let w of S) this.proxyOf.nodes.splice(v + 1, 0, w);
          let h;
          for (let w in this.indexes)
            ((h = this.indexes[w]), v < h && (this.indexes[w] = h + S.length));
          return (this.markDirty(), this);
        }
        insertBefore(b, A) {
          let v = this.index(b),
            S = v === 0 ? "prepend" : !1,
            h = this.normalize(A, this.proxyOf.nodes[v], S).reverse();
          v = this.index(b);
          for (let C of h) this.proxyOf.nodes.splice(v, 0, C);
          let w;
          for (let C in this.indexes)
            ((w = this.indexes[C]), v <= w && (this.indexes[C] = w + h.length));
          return (this.markDirty(), this);
        }
        normalize(b, A) {
          if (typeof b == "string") b = i(s(b).nodes);
          else if (typeof b > "u") b = [];
          else if (Array.isArray(b)) {
            b = b.slice(0);
            for (let v of b) v.parent && v.parent.removeChild(v, "ignore");
          } else if (b.type === "root" && this.type !== "document") {
            b = b.nodes.slice(0);
            for (let v of b) v.parent && v.parent.removeChild(v, "ignore");
          } else if (b.type) b = [b];
          else if (b.prop) {
            if (typeof b.value > "u")
              throw new Error("Value field is missed in node creation");
            (typeof b.value != "string" && (b.value = String(b.value)),
              (b = [new n(b)]));
          } else if (b.selector || b.selectors) b = [new a(b)];
          else if (b.name) b = [new m(b)];
          else if (b.text) b = [new r(b)];
          else throw new Error("Unknown node type in node creation");
          return b.map(
            (v) => (
              v[u] || jt.rebuild(v),
              (v = v.proxyOf),
              v.parent && v.parent.removeChild(v),
              v[c] && p(v),
              v.raws || (v.raws = {}),
              typeof v.raws.before > "u" &&
                A &&
                typeof A.raws.before < "u" &&
                (v.raws.before = A.raws.before.replace(/\S/g, "")),
              (v.parent = this.proxyOf),
              v
            ),
          );
        }
        prepend(...b) {
          b = b.reverse();
          for (let A of b) {
            let v = this.normalize(A, this.first, "prepend").reverse();
            for (let S of v) this.proxyOf.nodes.unshift(S);
            for (let S in this.indexes)
              this.indexes[S] = this.indexes[S] + v.length;
          }
          return (this.markDirty(), this);
        }
        push(b) {
          return ((b.parent = this), this.proxyOf.nodes.push(b), this);
        }
        removeAll() {
          for (let b of this.proxyOf.nodes) b.parent = void 0;
          return ((this.proxyOf.nodes = []), this.markDirty(), this);
        }
        removeChild(b) {
          ((b = this.index(b)),
            (this.proxyOf.nodes[b].parent = void 0),
            this.proxyOf.nodes.splice(b, 1));
          let A;
          for (let v in this.indexes)
            ((A = this.indexes[v]), A >= b && (this.indexes[v] = A - 1));
          return (this.markDirty(), this);
        }
        replaceValues(b, A, v) {
          return (
            v || ((v = A), (A = {})),
            this.walkDecls((S) => {
              (A.props && !A.props.includes(S.prop)) ||
                (A.fast && !S.value.includes(A.fast)) ||
                (S.value = S.value.replace(b, v));
            }),
            this.markDirty(),
            this
          );
        }
        some(b) {
          return this.nodes.some(b);
        }
        walk(b) {
          return this.each((A, v) => {
            let S;
            try {
              S = b(A, v);
            } catch (h) {
              throw A.addToError(h);
            }
            return (S !== !1 && A.walk && (S = A.walk(b)), S);
          });
        }
        walkAtRules(b, A) {
          return A
            ? b instanceof RegExp
              ? this.walk((v, S) => {
                  if (v.type === "atrule" && b.test(v.name)) return A(v, S);
                })
              : this.walk((v, S) => {
                  if (v.type === "atrule" && v.name === b) return A(v, S);
                })
            : ((A = b),
              this.walk((v, S) => {
                if (v.type === "atrule") return A(v, S);
              }));
        }
        walkComments(b) {
          return this.walk((A, v) => {
            if (A.type === "comment") return b(A, v);
          });
        }
        walkDecls(b, A) {
          return A
            ? b instanceof RegExp
              ? this.walk((v, S) => {
                  if (v.type === "decl" && b.test(v.prop)) return A(v, S);
                })
              : this.walk((v, S) => {
                  if (v.type === "decl" && v.prop === b) return A(v, S);
                })
            : ((A = b),
              this.walk((v, S) => {
                if (v.type === "decl") return A(v, S);
              }));
        }
        walkRules(b, A) {
          return A
            ? b instanceof RegExp
              ? this.walk((v, S) => {
                  if (v.type === "rule" && b.test(v.selector)) return A(v, S);
                })
              : this.walk((v, S) => {
                  if (v.type === "rule" && v.selector === b) return A(v, S);
                })
            : ((A = b),
              this.walk((v, S) => {
                if (v.type === "rule") return A(v, S);
              }));
        }
      };
      ((f.registerParse = (g) => {
        s = g;
      }),
        (f.registerRule = (g) => {
          a = g;
        }),
        (f.registerAtRule = (g) => {
          m = g;
        }),
        (f.registerRoot = (g) => {
          o = g;
        }),
        (e.exports = f),
        (f.default = f),
        (f.rebuild = (g) => {
          (g.type === "atrule"
            ? Object.setPrototypeOf(g, m.prototype)
            : g.type === "rule"
              ? Object.setPrototypeOf(g, a.prototype)
              : g.type === "decl"
                ? Object.setPrototypeOf(g, n.prototype)
                : g.type === "comment"
                  ? Object.setPrototypeOf(g, r.prototype)
                  : g.type === "root" && Object.setPrototypeOf(g, o.prototype),
            (g[u] = !0),
            g.nodes &&
              g.nodes.forEach((b) => {
                f.rebuild(b);
              }));
        }));
    }),
    We = j((t, e) => {
      var r = ce(),
        n = class extends r {
          constructor(l) {
            (super(l), (this.type = "atrule"));
          }
          append(...l) {
            return (
              this.proxyOf.nodes || (this.nodes = []),
              super.append(...l)
            );
          }
          prepend(...l) {
            return (
              this.proxyOf.nodes || (this.nodes = []),
              super.prepend(...l)
            );
          }
        };
      ((e.exports = n), (n.default = n), r.registerAtRule(n));
    }),
    Ue = j((t, e) => {
      var r = ce(),
        n,
        l,
        c = class extends r {
          constructor(u) {
            (super({ type: "document", ...u }),
              this.nodes || (this.nodes = []));
          }
          toResult(u = {}) {
            return new n(new l(), this, u).stringify();
          }
        };
      ((c.registerLazyResult = (u) => {
        n = u;
      }),
        (c.registerProcessor = (u) => {
          l = u;
        }),
        (e.exports = c),
        (c.default = c));
    }),
    Zt = j((t, e) => {
      var r =
          "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict",
        n =
          (c, u = 21) =>
          (m = u) => {
            let s = "",
              o = m | 0;
            for (; o--;) s += c[(Math.random() * c.length) | 0];
            return s;
          },
        l = (c = 21) => {
          let u = "",
            m = c | 0;
          for (; m--;) u += r[(Math.random() * 64) | 0];
          return u;
        };
      e.exports = { nanoid: l, customAlphabet: n };
    }),
    nt = j((t, e) => {
      var { existsSync: r, readFileSync: n } = ee(),
        { dirname: l, join: c } = ee(),
        { SourceMapConsumer: u, SourceMapGenerator: m } = ee();
      function s(a) {
        return Buffer ? Buffer.from(a, "base64").toString() : window.atob(a);
      }
      var o = class {
        constructor(a, i) {
          if (i.map === !1) return;
          (this.loadAnnotation(a),
            (this.inline = this.startWith(this.annotation, "data:")));
          let p = i.map ? i.map.prev : void 0,
            f = this.loadMap(i.from, p);
          (!this.mapFile && i.from && (this.mapFile = i.from),
            this.mapFile && (this.root = l(this.mapFile)),
            f && (this.text = f));
        }
        consumer() {
          return (
            this.consumerCache || (this.consumerCache = new u(this.text)),
            this.consumerCache
          );
        }
        decodeInline(a) {
          let i = /^data:application\/json;charset=utf-?8;base64,/,
            p = /^data:application\/json;base64,/,
            f =
              a.match(/^data:application\/json;charset=utf-?8,/) ||
              a.match(/^data:application\/json,/);
          if (f) return decodeURIComponent(a.substr(f[0].length));
          let g = a.match(i) || a.match(p);
          if (g) return s(a.substr(g[0].length));
          let b = a.slice(22);
          throw (
            (b = b.slice(0, b.indexOf(","))),
            new Error("Unsupported source map encoding " + b)
          );
        }
        getAnnotationURL(a) {
          return a.replace(/^\/\*\s*# sourceMappingURL=/, "").trim();
        }
        isMap(a) {
          return typeof a != "object"
            ? !1
            : typeof a.mappings == "string" ||
                typeof a._mappings == "string" ||
                Array.isArray(a.sections);
        }
        loadAnnotation(a) {
          let i = a.match(/\/\*\s*# sourceMappingURL=/g);
          if (!i) return;
          let p = a.lastIndexOf(i.pop()),
            f = a.indexOf("*/", p);
          p > -1 &&
            f > -1 &&
            (this.annotation = this.getAnnotationURL(a.substring(p, f)));
        }
        loadFile(a) {
          if (((this.root = l(a)), r(a)))
            return ((this.mapFile = a), n(a, "utf-8").toString().trim());
        }
        loadMap(a, i) {
          if (i === !1) return !1;
          if (i) {
            if (typeof i == "string") return i;
            if (typeof i == "function") {
              let p = i(a);
              if (p) {
                let f = this.loadFile(p);
                if (!f)
                  throw new Error(
                    "Unable to load previous source map: " + p.toString(),
                  );
                return f;
              }
            } else {
              if (i instanceof u) return m.fromSourceMap(i).toString();
              if (i instanceof m) return i.toString();
              if (this.isMap(i)) return JSON.stringify(i);
              throw new Error(
                "Unsupported previous source map format: " + i.toString(),
              );
            }
          } else {
            if (this.inline) return this.decodeInline(this.annotation);
            if (this.annotation) {
              let p = this.annotation;
              return (a && (p = c(l(a), p)), this.loadFile(p));
            }
          }
        }
        startWith(a, i) {
          return a ? a.substr(0, i.length) === i : !1;
        }
        withContent() {
          return !!(
            this.consumer().sourcesContent &&
            this.consumer().sourcesContent.length > 0
          );
        }
      };
      ((e.exports = o), (o.default = o));
    }),
    ve = j((t, e) => {
      var { nanoid: r } = Zt(),
        { isAbsolute: n, resolve: l } = ee(),
        { SourceMapConsumer: c, SourceMapGenerator: u } = ee(),
        { fileURLToPath: m, pathToFileURL: s } = ee(),
        o = ze(),
        a = nt(),
        i = ee(),
        p = Symbol("lineToIndexCache"),
        f = !!(c && u),
        g = !!(l && n);
      function b(v) {
        if (v[p]) return v[p];
        let S = v.css.split(`
`),
          h = new Array(S.length),
          w = 0;
        for (let C = 0, d = S.length; C < d; C++)
          ((h[C] = w), (w += S[C].length + 1));
        return ((v[p] = h), h);
      }
      var A = class {
        get from() {
          return this.file || this.id;
        }
        constructor(v, S = {}) {
          if (
            v === null ||
            typeof v > "u" ||
            (typeof v == "object" && !v.toString)
          )
            throw new Error(`PostCSS received ${v} instead of CSS string`);
          if (
            ((this.css = v.toString()),
            this.css[0] === "\uFEFF" || this.css[0] === "\uFFFE"
              ? ((this.hasBOM = !0), (this.css = this.css.slice(1)))
              : (this.hasBOM = !1),
            (this.document = this.css),
            S.document && (this.document = S.document.toString()),
            S.from &&
              (!g || /^\w+:\/\//.test(S.from) || n(S.from)
                ? (this.file = S.from)
                : (this.file = l(S.from))),
            g && f)
          ) {
            let h = new a(this.css, S);
            if (h.text) {
              this.map = h;
              let w = h.consumer().file;
              !this.file && w && (this.file = this.mapResolve(w));
            }
          }
          (this.file || (this.id = "<input css " + r(6) + ">"),
            this.map && (this.map.file = this.from));
        }
        error(v, S, h, w = {}) {
          let C, d, y, x, F;
          if (S && typeof S == "object") {
            let M = S,
              E = h;
            if (typeof M.offset == "number") {
              x = M.offset;
              let k = this.fromOffset(x);
              ((S = k.line), (h = k.col));
            } else
              ((S = M.line),
                (h = M.column),
                (x = this.fromLineAndColumn(S, h)));
            if (typeof E.offset == "number") {
              y = E.offset;
              let k = this.fromOffset(y);
              ((d = k.line), (C = k.col));
            } else
              ((d = E.line),
                (C = E.column),
                (y = this.fromLineAndColumn(E.line, E.column)));
          } else if (h) x = this.fromLineAndColumn(S, h);
          else {
            x = S;
            let M = this.fromOffset(x);
            ((S = M.line), (h = M.col));
          }
          let T = this.origin(S, h, d, C);
          return (
            T
              ? (F = new o(
                  v,
                  T.endLine === void 0
                    ? T.line
                    : { column: T.column, line: T.line },
                  T.endLine === void 0
                    ? T.column
                    : { column: T.endColumn, line: T.endLine },
                  T.source,
                  T.file,
                  w.plugin,
                ))
              : (F = new o(
                  v,
                  d === void 0 ? S : { column: h, line: S },
                  d === void 0 ? h : { column: C, line: d },
                  this.css,
                  this.file,
                  w.plugin,
                )),
            (F.input = {
              column: h,
              endColumn: C,
              endLine: d,
              endOffset: y,
              line: S,
              offset: x,
              source: this.css,
            }),
            this.file &&
              (s && (F.input.url = s(this.file).toString()),
              (F.input.file = this.file)),
            F
          );
        }
        fromLineAndColumn(v, S) {
          return b(this)[v - 1] + S - 1;
        }
        fromOffset(v) {
          let S = b(this),
            h = S[S.length - 1],
            w = 0;
          if (v >= h) w = S.length - 1;
          else {
            let C = S.length - 2,
              d;
            for (; w < C;)
              if (((d = w + ((C - w) >> 1)), v < S[d])) C = d - 1;
              else if (v >= S[d + 1]) w = d + 1;
              else {
                w = d;
                break;
              }
          }
          return { col: v - S[w] + 1, line: w + 1 };
        }
        mapResolve(v) {
          return /^\w+:\/\//.test(v)
            ? v
            : l(this.map.consumer().sourceRoot || this.map.root || ".", v);
        }
        origin(v, S, h, w) {
          if (!this.map) return !1;
          let C = this.map.consumer(),
            d = C.originalPositionFor({ column: S, line: v });
          if (!d.source) return !1;
          let y;
          typeof h == "number" &&
            (y = C.originalPositionFor({ column: w, line: h }));
          let x;
          n(d.source)
            ? (x = s(d.source))
            : (x = new URL(
                d.source,
                this.map.consumer().sourceRoot || s(this.map.mapFile),
              ));
          let F = {
            column: d.column,
            endColumn: y && y.column,
            endLine: y && y.line,
            line: d.line,
            url: x.toString(),
          };
          if (x.protocol === "file:")
            if (m) F.file = m(x);
            else
              throw new Error(
                "file: protocol is not available in this PostCSS build",
              );
          let T = C.sourceContentFor(d.source);
          return (T && (F.source = T), F);
        }
        toJSON() {
          let v = {};
          for (let S of ["hasBOM", "css", "file", "id"])
            this[S] != null && (v[S] = this[S]);
          return (
            this.map &&
              ((v.map = { ...this.map }),
              v.map.consumerCache && (v.map.consumerCache = void 0)),
            v
          );
        }
      };
      ((e.exports = A),
        (A.default = A),
        i && i.registerInput && i.registerInput(A));
    }),
    be = j((t, e) => {
      var r = ce(),
        n,
        l,
        c = class extends r {
          constructor(u) {
            (super(u), (this.type = "root"), this.nodes || (this.nodes = []));
          }
          normalize(u, m, s) {
            let o = super.normalize(u);
            if (m) {
              if (s === "prepend")
                this.nodes.length > 1
                  ? (m.raws.before = this.nodes[1].raws.before)
                  : delete m.raws.before;
              else if (this.first !== m)
                for (let a of o) a.raws.before = m.raws.before;
            }
            return o;
          }
          removeChild(u, m) {
            let s = this.index(u);
            return (
              !m &&
                s === 0 &&
                this.nodes.length > 1 &&
                (this.nodes[1].raws.before = this.nodes[s].raws.before),
              super.removeChild(u)
            );
          }
          toResult(u = {}) {
            return new n(new l(), this, u).stringify();
          }
        };
      ((c.registerLazyResult = (u) => {
        n = u;
      }),
        (c.registerProcessor = (u) => {
          l = u;
        }),
        (e.exports = c),
        (c.default = c),
        r.registerRoot(c));
    }),
    ot = j((t, e) => {
      var r = {
        comma(n) {
          return r.split(n, [","], !0);
        },
        space(n) {
          return r.split(n, [
            " ",
            `
`,
            "	",
          ]);
        },
        split(n, l, c) {
          let u = [],
            m = "",
            s = !1,
            o = 0,
            a = !1,
            i = "",
            p = !1;
          for (let f of n)
            (p
              ? (p = !1)
              : f === "\\"
                ? (p = !0)
                : a
                  ? f === i && (a = !1)
                  : f === '"' || f === "'"
                    ? ((a = !0), (i = f))
                    : f === "("
                      ? (o += 1)
                      : f === ")"
                        ? o > 0 && (o -= 1)
                        : o === 0 && l.includes(f) && (s = !0),
              s
                ? (m !== "" && u.push(m.trim()), (m = ""), (s = !1))
                : (m += f));
          return ((c || m !== "") && u.push(m.trim()), u);
        },
      };
      ((e.exports = r), (r.default = r));
    }),
    qe = j((t, e) => {
      var r = ce(),
        n = ot(),
        l = class extends r {
          get selectors() {
            return n.comma(this.selector);
          }
          set selectors(c) {
            let u = this.selector ? this.selector.match(/,\s*/) : null,
              m = u ? u[0] : "," + this.raw("between", "beforeOpen");
            this.selector = c.join(m);
          }
          constructor(c) {
            (super(c), (this.type = "rule"), this.nodes || (this.nodes = []));
          }
        };
      ((e.exports = l), (l.default = l), r.registerRule(l));
    }),
    Qt = j((t, e) => {
      var r = We(),
        n = Ae(),
        l = Ce(),
        c = ve(),
        u = nt(),
        m = be(),
        s = qe();
      function o(a, i) {
        if (Array.isArray(a)) return a.map((g) => o(g));
        let { inputs: p, ...f } = a;
        if (p) {
          i = [];
          for (let g of p) {
            let b = { ...g, __proto__: c.prototype };
            (b.map && (b.map = { ...b.map, __proto__: u.prototype }),
              i.push(b));
          }
        }
        if ((f.nodes && (f.nodes = a.nodes.map((g) => o(g, i))), f.source)) {
          let { inputId: g, ...b } = f.source;
          ((f.source = b), g != null && (f.source.input = i[g]));
        }
        if (f.type === "root") return new m(f);
        if (f.type === "decl") return new l(f);
        if (f.type === "rule") return new s(f);
        if (f.type === "comment") return new n(f);
        if (f.type === "atrule") return new r(f);
        throw new Error("Unknown node type: " + a.type);
      }
      ((e.exports = o), (o.default = o));
    }),
    st = j((t, e) => {
      var { dirname: r, relative: n, resolve: l, sep: c } = ee(),
        { SourceMapConsumer: u, SourceMapGenerator: m } = ee(),
        { pathToFileURL: s } = ee(),
        o = ve(),
        a = !!(u && m),
        i = !!(r && l && n && c),
        p = class {
          constructor(f, g, b, A) {
            ((this.stringify = f),
              (this.mapOpts = b.map || {}),
              (this.root = g),
              (this.opts = b),
              (this.css = A),
              (this.originalCSS = A),
              (this.usesFileUrls = !this.mapOpts.from && this.mapOpts.absolute),
              (this.memoizedFileURLs = new Map()),
              (this.memoizedPaths = new Map()),
              (this.memoizedURLs = new Map()));
          }
          addAnnotation() {
            let f;
            this.isInline()
              ? (f =
                  "data:application/json;base64," +
                  this.toBase64(this.map.toString()))
              : typeof this.mapOpts.annotation == "string"
                ? (f = this.mapOpts.annotation)
                : typeof this.mapOpts.annotation == "function"
                  ? (f = this.mapOpts.annotation(this.opts.to, this.root))
                  : (f = this.outputFile() + ".map");
            let g = `
`;
            (this.css.includes(`\r
`) &&
              (g = `\r
`),
              (this.css += g + "/*# sourceMappingURL=" + f + " */"));
          }
          applyPrevMaps() {
            for (let f of this.previous()) {
              let g = this.toUrl(this.path(f.file)),
                b = f.root || r(f.file),
                A;
              (this.mapOpts.sourcesContent === !1
                ? ((A = new u(f.text)),
                  A.sourcesContent && (A.sourcesContent = null))
                : (A = f.consumer()),
                this.map.applySourceMap(A, g, this.toUrl(this.path(b))));
            }
          }
          clearAnnotation() {
            if (this.mapOpts.annotation !== !1) {
              if (this.root) {
                let f;
                for (let g = this.root.nodes.length - 1; g >= 0; g--)
                  ((f = this.root.nodes[g]),
                    f.type === "comment" &&
                      f.text.startsWith("# sourceMappingURL=") &&
                      this.root.removeChild(g));
              } else if (this.css) {
                let f;
                for (; (f = this.css.lastIndexOf("/*#")) !== -1;) {
                  let g = this.css.indexOf("*/", f + 3);
                  if (g === -1) break;
                  for (
                    ;
                    f > 0 &&
                    this.css[f - 1] ===
                      `
`;
                  )
                    f--;
                  this.css = this.css.slice(0, f) + this.css.slice(g + 2);
                }
              }
            }
          }
          generate() {
            if ((this.clearAnnotation(), i && a && this.isMap()))
              return this.generateMap();
            {
              let f = "";
              return (
                this.stringify(this.root, (g) => {
                  f += g;
                }),
                [f]
              );
            }
          }
          generateMap() {
            if (this.root) this.generateString();
            else if (this.previous().length === 1) {
              let f = this.previous()[0].consumer();
              ((f.file = this.outputFile()),
                (this.map = m.fromSourceMap(f, { ignoreInvalidMapping: !0 })));
            } else
              ((this.map = new m({
                file: this.outputFile(),
                ignoreInvalidMapping: !0,
              })),
                this.map.addMapping({
                  generated: { column: 0, line: 1 },
                  original: { column: 0, line: 1 },
                  source: this.opts.from
                    ? this.toUrl(this.path(this.opts.from))
                    : "<no source>",
                }));
            return (
              this.isSourcesContent() && this.setSourcesContent(),
              this.root && this.previous().length > 0 && this.applyPrevMaps(),
              this.isAnnotation() && this.addAnnotation(),
              this.isInline() ? [this.css] : [this.css, this.map]
            );
          }
          generateString() {
            ((this.css = ""),
              (this.map = new m({
                file: this.outputFile(),
                ignoreInvalidMapping: !0,
              })));
            let f = 1,
              g = 1,
              b = "<no source>",
              A = {
                generated: { column: 0, line: 0 },
                original: { column: 0, line: 0 },
                source: "",
              },
              v,
              S;
            this.stringify(this.root, (h, w, C) => {
              if (
                ((this.css += h),
                w &&
                  C !== "end" &&
                  ((A.generated.line = f),
                  (A.generated.column = g - 1),
                  w.source && w.source.start
                    ? ((A.source = this.sourcePath(w)),
                      (A.original.line = w.source.start.line),
                      (A.original.column = w.source.start.column - 1),
                      this.map.addMapping(A))
                    : ((A.source = b),
                      (A.original.line = 1),
                      (A.original.column = 0),
                      this.map.addMapping(A))),
                (S = h.match(/\n/g)),
                S
                  ? ((f += S.length),
                    (v = h.lastIndexOf(`
`)),
                    (g = h.length - v))
                  : (g += h.length),
                w && C !== "start")
              ) {
                let d = w.parent || { raws: {} };
                (!(w.type === "decl" || (w.type === "atrule" && !w.nodes)) ||
                  w !== d.last ||
                  d.raws.semicolon) &&
                  (w.source && w.source.end
                    ? ((A.source = this.sourcePath(w)),
                      (A.original.line = w.source.end.line),
                      (A.original.column = w.source.end.column - 1),
                      (A.generated.line = f),
                      (A.generated.column = g - 2),
                      this.map.addMapping(A))
                    : ((A.source = b),
                      (A.original.line = 1),
                      (A.original.column = 0),
                      (A.generated.line = f),
                      (A.generated.column = g - 1),
                      this.map.addMapping(A)));
              }
            });
          }
          isAnnotation() {
            return this.isInline()
              ? !0
              : typeof this.mapOpts.annotation < "u"
                ? this.mapOpts.annotation
                : this.previous().length
                  ? this.previous().some((f) => f.annotation)
                  : !0;
          }
          isInline() {
            if (typeof this.mapOpts.inline < "u") return this.mapOpts.inline;
            let f = this.mapOpts.annotation;
            return typeof f < "u" && f !== !0
              ? !1
              : this.previous().length
                ? this.previous().some((g) => g.inline)
                : !0;
          }
          isMap() {
            return typeof this.opts.map < "u"
              ? !!this.opts.map
              : this.previous().length > 0;
          }
          isSourcesContent() {
            return typeof this.mapOpts.sourcesContent < "u"
              ? this.mapOpts.sourcesContent
              : this.previous().length
                ? this.previous().some((f) => f.withContent())
                : !0;
          }
          outputFile() {
            return this.opts.to
              ? this.path(this.opts.to)
              : this.opts.from
                ? this.path(this.opts.from)
                : "to.css";
          }
          path(f) {
            if (
              this.mapOpts.absolute ||
              f.charCodeAt(0) === 60 ||
              /^\w+:\/\//.test(f)
            )
              return f;
            let g = this.memoizedPaths.get(f);
            if (g) return g;
            let b = this.opts.to ? r(this.opts.to) : ".";
            typeof this.mapOpts.annotation == "string" &&
              (b = r(l(b, this.mapOpts.annotation)));
            let A = n(b, f);
            return (this.memoizedPaths.set(f, A), A);
          }
          previous() {
            if (!this.previousMaps)
              if (((this.previousMaps = []), this.root))
                this.root.walk((f) => {
                  if (f.source && f.source.input.map) {
                    let g = f.source.input.map;
                    this.previousMaps.includes(g) || this.previousMaps.push(g);
                  }
                });
              else {
                let f = new o(this.originalCSS, this.opts);
                f.map && this.previousMaps.push(f.map);
              }
            return this.previousMaps;
          }
          setSourcesContent() {
            let f = {};
            if (this.root)
              this.root.walk((g) => {
                if (g.source) {
                  let b = g.source.input.from;
                  if (b && !f[b]) {
                    f[b] = !0;
                    let A = this.usesFileUrls
                      ? this.toFileUrl(b)
                      : this.toUrl(this.path(b));
                    this.map.setSourceContent(A, g.source.input.css);
                  }
                }
              });
            else if (this.css) {
              let g = this.opts.from
                ? this.toUrl(this.path(this.opts.from))
                : "<no source>";
              this.map.setSourceContent(g, this.css);
            }
          }
          sourcePath(f) {
            return this.mapOpts.from
              ? this.toUrl(this.mapOpts.from)
              : this.usesFileUrls
                ? this.toFileUrl(f.source.input.from)
                : this.toUrl(this.path(f.source.input.from));
          }
          toBase64(f) {
            return Buffer
              ? Buffer.from(f).toString("base64")
              : window.btoa(unescape(encodeURIComponent(f)));
          }
          toFileUrl(f) {
            let g = this.memoizedFileURLs.get(f);
            if (g) return g;
            if (s) {
              let b = s(f).toString();
              return (this.memoizedFileURLs.set(f, b), b);
            } else
              throw new Error(
                "`map.absolute` option is not available in this PostCSS build",
              );
          }
          toUrl(f) {
            let g = this.memoizedURLs.get(f);
            if (g) return g;
            c === "\\" && (f = f.replace(/\\/g, "/"));
            let b = encodeURI(f).replace(/[#?]/g, encodeURIComponent);
            return (this.memoizedURLs.set(f, b), b);
          }
        };
      e.exports = p;
    }),
    er = j((t, e) => {
      var r = 39,
        n = 34,
        l = 92,
        c = 47,
        u = 10,
        m = 32,
        s = 12,
        o = 9,
        a = 13,
        i = 91,
        p = 93,
        f = 40,
        g = 41,
        b = 123,
        A = 125,
        v = 59,
        S = 42,
        h = 58,
        w = 64,
        C = /[\t\n\f\r "#'()/;[\\\]{}]/g,
        d = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g,
        y = /.[\r\n"'(/\\]/,
        x = /[\da-f]/i;
      e.exports = function (T, M = {}) {
        let E = T.css.valueOf(),
          k = M.ignoreErrors,
          L,
          D,
          I,
          P,
          z,
          W,
          X,
          Y,
          R,
          _,
          $ = E.length,
          B = 0,
          re = [],
          V = [];
        function ne() {
          return B;
        }
        function oe(ge) {
          throw T.error("Unclosed " + ge, B);
        }
        function te() {
          return V.length === 0 && B >= $;
        }
        function H(ge) {
          if (V.length) return V.pop();
          if (B >= $) return;
          let Qe = ge ? ge.ignoreUnclosed : !1;
          switch (((L = E.charCodeAt(B)), L)) {
            case u:
            case m:
            case o:
            case a:
            case s:
              P = B;
              do ((P += 1), (L = E.charCodeAt(P)));
              while (L === m || L === u || L === o || L === a || L === s);
              ((W = ["space", E.slice(B, P)]), (B = P - 1));
              break;
            case i:
            case p:
            case b:
            case A:
            case h:
            case v:
            case g: {
              let It = String.fromCharCode(L);
              W = [It, It, B];
              break;
            }
            case f:
              if (
                ((_ = re.length ? re.pop()[1] : ""),
                (R = E.charCodeAt(B + 1)),
                _ === "url" &&
                  R !== r &&
                  R !== n &&
                  R !== m &&
                  R !== u &&
                  R !== o &&
                  R !== s &&
                  R !== a)
              ) {
                P = B;
                do {
                  if (((X = !1), (P = E.indexOf(")", P + 1)), P === -1))
                    if (k || Qe) {
                      P = B;
                      break;
                    } else oe("bracket");
                  for (Y = P; E.charCodeAt(Y - 1) === l;) ((Y -= 1), (X = !X));
                } while (X);
                ((W = ["brackets", E.slice(B, P + 1), B, P]), (B = P));
              } else
                ((P = E.indexOf(")", B + 1)),
                  (D = E.slice(B, P + 1)),
                  P === -1 || y.test(D)
                    ? (W = ["(", "(", B])
                    : ((W = ["brackets", D, B, P]), (B = P)));
              break;
            case r:
            case n:
              ((z = L === r ? "'" : '"'), (P = B));
              do {
                if (((X = !1), (P = E.indexOf(z, P + 1)), P === -1))
                  if (k || Qe) {
                    P = B + 1;
                    break;
                  } else oe("string");
                for (Y = P; E.charCodeAt(Y - 1) === l;) ((Y -= 1), (X = !X));
              } while (X);
              ((W = ["string", E.slice(B, P + 1), B, P]), (B = P));
              break;
            case w:
              ((C.lastIndex = B + 1),
                C.test(E),
                C.lastIndex === 0 ? (P = E.length - 1) : (P = C.lastIndex - 2),
                (W = ["at-word", E.slice(B, P + 1), B, P]),
                (B = P));
              break;
            case l:
              for (P = B, I = !0; E.charCodeAt(P + 1) === l;)
                ((P += 1), (I = !I));
              if (
                ((L = E.charCodeAt(P + 1)),
                I &&
                  L !== c &&
                  L !== m &&
                  L !== u &&
                  L !== o &&
                  L !== a &&
                  L !== s &&
                  ((P += 1), x.test(E.charAt(P))))
              ) {
                for (; x.test(E.charAt(P + 1));) P += 1;
                E.charCodeAt(P + 1) === m && (P += 1);
              }
              ((W = ["word", E.slice(B, P + 1), B, P]), (B = P));
              break;
            default:
              L === c && E.charCodeAt(B + 1) === S
                ? ((P = E.indexOf("*/", B + 2) + 1),
                  P === 0 && (k || Qe ? (P = E.length) : oe("comment")),
                  (W = ["comment", E.slice(B, P + 1), B, P]),
                  (B = P))
                : ((d.lastIndex = B + 1),
                  d.test(E),
                  d.lastIndex === 0
                    ? (P = E.length - 1)
                    : (P = d.lastIndex - 2),
                  (W = ["word", E.slice(B, P + 1), B, P]),
                  re.push(W),
                  (B = P));
              break;
          }
          return (B++, W);
        }
        function de(ge) {
          V.push(ge);
        }
        return { back: de, endOfFile: te, nextToken: H, position: ne };
      };
    }),
    tr = j((t, e) => {
      var r = We(),
        n = Ae(),
        l = Ce(),
        c = be(),
        u = qe(),
        m = er(),
        s = { empty: !0, space: !0 };
      function o(i) {
        for (let p = i.length - 1; p >= 0; p--) {
          let f = i[p],
            g = f[3] || f[2];
          if (g) return g;
        }
      }
      var a = class {
        constructor(i) {
          ((this.input = i),
            (this.root = new c()),
            (this.current = this.root),
            (this.spaces = ""),
            (this.semicolon = !1),
            this.createTokenizer(),
            (this.root.source = {
              input: i,
              start: { column: 1, line: 1, offset: 0 },
            }));
        }
        atrule(i) {
          let p = new r();
          ((p.name = i[1].slice(1)),
            p.name === "" && this.unnamedAtrule(p, i),
            this.init(p, i[2]));
          let f,
            g,
            b,
            A = !1,
            v = !1,
            S = [],
            h = [];
          for (; !this.tokenizer.endOfFile();) {
            if (
              ((i = this.tokenizer.nextToken()),
              (f = i[0]),
              f === "(" || f === "["
                ? h.push(f === "(" ? ")" : "]")
                : f === "{" && h.length > 0
                  ? h.push("}")
                  : f === h[h.length - 1] && h.pop(),
              h.length === 0)
            )
              if (f === ";") {
                ((p.source.end = this.getPosition(i[2])),
                  p.source.end.offset++,
                  (this.semicolon = !0));
                break;
              } else if (f === "{") {
                v = !0;
                break;
              } else if (f === "}") {
                if (S.length > 0) {
                  for (b = S.length - 1, g = S[b]; g && g[0] === "space";)
                    g = S[--b];
                  g &&
                    ((p.source.end = this.getPosition(g[3] || g[2])),
                    p.source.end.offset++);
                }
                this.end(i);
                break;
              } else S.push(i);
            else S.push(i);
            if (this.tokenizer.endOfFile()) {
              A = !0;
              break;
            }
          }
          ((p.raws.between = this.spacesAndCommentsFromEnd(S)),
            S.length
              ? ((p.raws.afterName = this.spacesAndCommentsFromStart(S)),
                this.raw(p, "params", S),
                A &&
                  ((i = S[S.length - 1]),
                  (p.source.end = this.getPosition(i[3] || i[2])),
                  p.source.end.offset++,
                  (this.spaces = p.raws.between),
                  (p.raws.between = "")))
              : ((p.raws.afterName = ""), (p.params = "")),
            v && ((p.nodes = []), (this.current = p)));
        }
        checkMissedSemicolon(i) {
          let p = this.colon(i);
          if (p === !1) return;
          let f = 0,
            g;
          for (
            let b = p - 1;
            b >= 0 && ((g = i[b]), !(g[0] !== "space" && ((f += 1), f === 2)));
            b--
          );
          throw this.input.error(
            "Missed semicolon",
            g[0] === "word" ? g[3] + 1 : g[2],
          );
        }
        colon(i) {
          let p = 0,
            f,
            g,
            b;
          for (let [A, v] of i.entries()) {
            if (
              ((g = v),
              (b = g[0]),
              b === "(" && (p += 1),
              b === ")" && (p -= 1),
              p === 0 && b === ":")
            )
              if (!f) this.doubleColon(g);
              else {
                if (f[0] === "word" && f[1] === "progid") continue;
                return A;
              }
            f = g;
          }
          return !1;
        }
        comment(i) {
          let p = new n();
          (this.init(p, i[2]),
            (p.source.end = this.getPosition(i[3] || i[2])),
            p.source.end.offset++);
          let f = i[1].slice(2, -2);
          if (!f.trim())
            ((p.text = ""), (p.raws.left = f), (p.raws.right = ""));
          else {
            let g = f.match(/^(\s*)([^]*\S)(\s*)$/);
            ((p.text = g[2]), (p.raws.left = g[1]), (p.raws.right = g[3]));
          }
        }
        createTokenizer() {
          this.tokenizer = m(this.input);
        }
        decl(i, p) {
          let f = new l();
          this.init(f, i[0][2]);
          let g = i[i.length - 1];
          for (
            g[0] === ";" && ((this.semicolon = !0), i.pop()),
              f.source.end = this.getPosition(g[3] || g[2] || o(i)),
              f.source.end.offset++;
            i[0][0] !== "word";
          )
            (i.length === 1 && this.unknownWord(i),
              (f.raws.before += i.shift()[1]));
          for (
            f.source.start = this.getPosition(i[0][2]), f.prop = "";
            i.length;
          ) {
            let S = i[0][0];
            if (S === ":" || S === "space" || S === "comment") break;
            f.prop += i.shift()[1];
          }
          f.raws.between = "";
          let b;
          for (; i.length;)
            if (((b = i.shift()), b[0] === ":")) {
              f.raws.between += b[1];
              break;
            } else
              (b[0] === "word" && /\w/.test(b[1]) && this.unknownWord([b]),
                (f.raws.between += b[1]));
          (f.prop[0] === "_" || f.prop[0] === "*") &&
            ((f.raws.before += f.prop[0]), (f.prop = f.prop.slice(1)));
          let A = [],
            v;
          for (
            ;
            i.length && ((v = i[0][0]), !(v !== "space" && v !== "comment"));
          )
            A.push(i.shift());
          this.precheckMissedSemicolon(i);
          for (let S = i.length - 1; S >= 0; S--) {
            if (((b = i[S]), b[1].toLowerCase() === "!important")) {
              f.important = !0;
              let h = this.stringFrom(i, S);
              ((h = this.spacesFromEnd(i) + h),
                h !== " !important" && (f.raws.important = h));
              break;
            } else if (b[1].toLowerCase() === "important") {
              let h = i.slice(0),
                w = "";
              for (let C = S; C > 0; C--) {
                let d = h[C][0];
                if (w.trim().startsWith("!") && d !== "space") break;
                w = h.pop()[1] + w;
              }
              w.trim().startsWith("!") &&
                ((f.important = !0), (f.raws.important = w), (i = h));
            }
            if (b[0] !== "space" && b[0] !== "comment") break;
          }
          (i.some((S) => S[0] !== "space" && S[0] !== "comment") &&
            ((f.raws.between += A.map((S) => S[1]).join("")), (A = [])),
            this.raw(f, "value", A.concat(i), p),
            f.value.includes(":") && !p && this.checkMissedSemicolon(i));
        }
        doubleColon(i) {
          throw this.input.error(
            "Double colon",
            { offset: i[2] },
            { offset: i[2] + i[1].length },
          );
        }
        emptyRule(i) {
          let p = new u();
          (this.init(p, i[2]),
            (p.selector = ""),
            (p.raws.between = ""),
            (this.current = p));
        }
        end(i) {
          (this.current.nodes &&
            this.current.nodes.length &&
            (this.current.raws.semicolon = this.semicolon),
            (this.semicolon = !1),
            (this.current.raws.after =
              (this.current.raws.after || "") + this.spaces),
            (this.spaces = ""),
            this.current.parent
              ? ((this.current.source.end = this.getPosition(i[2])),
                this.current.source.end.offset++,
                (this.current = this.current.parent))
              : this.unexpectedClose(i));
        }
        endFile() {
          (this.current.parent && this.unclosedBlock(),
            this.current.nodes &&
              this.current.nodes.length &&
              (this.current.raws.semicolon = this.semicolon),
            (this.current.raws.after =
              (this.current.raws.after || "") + this.spaces),
            (this.root.source.end = this.getPosition(
              this.tokenizer.position(),
            )));
        }
        freeSemicolon(i) {
          if (((this.spaces += i[1]), this.current.nodes)) {
            let p = this.current.nodes[this.current.nodes.length - 1];
            p &&
              p.type === "rule" &&
              !p.raws.ownSemicolon &&
              ((p.raws.ownSemicolon = this.spaces),
              (this.spaces = ""),
              (p.source.end = this.getPosition(i[2])),
              (p.source.end.offset += p.raws.ownSemicolon.length));
          }
        }
        getPosition(i) {
          let p = this.input.fromOffset(i);
          return { column: p.col, line: p.line, offset: i };
        }
        init(i, p) {
          (this.current.push(i),
            (i.source = { input: this.input, start: this.getPosition(p) }),
            (i.raws.before = this.spaces),
            (this.spaces = ""),
            i.type !== "comment" && (this.semicolon = !1));
        }
        other(i) {
          let p = !1,
            f = null,
            g = !1,
            b = null,
            A = [],
            v = i[1].startsWith("--"),
            S = [],
            h = i;
          for (; h;) {
            if (((f = h[0]), S.push(h), f === "(" || f === "["))
              (b || (b = h), A.push(f === "(" ? ")" : "]"));
            else if (v && g && f === "{") (b || (b = h), A.push("}"));
            else if (A.length === 0)
              if (f === ";")
                if (g) {
                  this.decl(S, v);
                  return;
                } else break;
              else if (f === "{") {
                this.rule(S);
                return;
              } else if (f === "}") {
                (this.tokenizer.back(S.pop()), (p = !0));
                break;
              } else f === ":" && (g = !0);
            else
              f === A[A.length - 1] && (A.pop(), A.length === 0 && (b = null));
            h = this.tokenizer.nextToken();
          }
          if (
            (this.tokenizer.endOfFile() && (p = !0),
            A.length > 0 && this.unclosedBracket(b),
            p && g)
          ) {
            if (!v)
              for (
                ;
                S.length &&
                ((h = S[S.length - 1][0]), !(h !== "space" && h !== "comment"));
              )
                this.tokenizer.back(S.pop());
            this.decl(S, v);
          } else this.unknownWord(S);
        }
        parse() {
          let i;
          for (; !this.tokenizer.endOfFile();)
            switch (((i = this.tokenizer.nextToken()), i[0])) {
              case "space":
                this.spaces += i[1];
                break;
              case ";":
                this.freeSemicolon(i);
                break;
              case "}":
                this.end(i);
                break;
              case "comment":
                this.comment(i);
                break;
              case "at-word":
                this.atrule(i);
                break;
              case "{":
                this.emptyRule(i);
                break;
              default:
                this.other(i);
                break;
            }
          this.endFile();
        }
        precheckMissedSemicolon() {}
        raw(i, p, f, g) {
          let b,
            A,
            v = f.length,
            S = "",
            h = !0,
            w,
            C;
          for (let d = 0; d < v; d += 1)
            ((b = f[d]),
              (A = b[0]),
              A === "space" && d === v - 1 && !g
                ? (h = !1)
                : A === "comment"
                  ? ((C = f[d - 1] ? f[d - 1][0] : "empty"),
                    (w = f[d + 1] ? f[d + 1][0] : "empty"),
                    !s[C] && !s[w]
                      ? S.slice(-1) === ","
                        ? (h = !1)
                        : (S += b[1])
                      : (h = !1))
                  : (S += b[1]));
          if (!h) {
            let d = f.reduce((y, x) => y + x[1], "");
            i.raws[p] = { raw: d, value: S };
          }
          i[p] = S;
        }
        rule(i) {
          i.pop();
          let p = new u();
          (this.init(p, i[0][2]),
            (p.raws.between = this.spacesAndCommentsFromEnd(i)),
            this.raw(p, "selector", i),
            (this.current = p));
        }
        spacesAndCommentsFromEnd(i) {
          let p,
            f = "";
          for (
            ;
            i.length &&
            ((p = i[i.length - 1][0]), !(p !== "space" && p !== "comment"));
          )
            f = i.pop()[1] + f;
          return f;
        }
        spacesAndCommentsFromStart(i) {
          let p,
            f = "";
          for (
            ;
            i.length && ((p = i[0][0]), !(p !== "space" && p !== "comment"));
          )
            f += i.shift()[1];
          return f;
        }
        spacesFromEnd(i) {
          let p,
            f = "";
          for (; i.length && ((p = i[i.length - 1][0]), p === "space");)
            f = i.pop()[1] + f;
          return f;
        }
        stringFrom(i, p) {
          let f = "";
          for (let g = p; g < i.length; g++) f += i[g][1];
          return (i.splice(p, i.length - p), f);
        }
        unclosedBlock() {
          let i = this.current.source.start;
          throw this.input.error("Unclosed block", i.line, i.column);
        }
        unclosedBracket(i) {
          throw this.input.error(
            "Unclosed bracket",
            { offset: i[2] },
            { offset: i[2] + 1 },
          );
        }
        unexpectedClose(i) {
          throw this.input.error(
            "Unexpected }",
            { offset: i[2] },
            { offset: i[2] + 1 },
          );
        }
        unknownWord(i) {
          throw this.input.error(
            "Unknown word " + i[0][1],
            { offset: i[0][2] },
            { offset: i[0][2] + i[0][1].length },
          );
        }
        unnamedAtrule(i, p) {
          throw this.input.error(
            "At-rule without name",
            { offset: p[2] },
            { offset: p[2] + p[1].length },
          );
        }
      };
      e.exports = a;
    }),
    He = j((t, e) => {
      var r = ce(),
        n = ve(),
        l = tr();
      function c(u, m) {
        let s = new l(new n(u, m));
        try {
          s.parse();
        } catch (o) {
          throw o;
        }
        return s.root;
      }
      ((e.exports = c), (c.default = c), r.registerParse(c));
    }),
    it = j((t, e) => {
      var r = class {
        constructor(n, l = {}) {
          if (
            ((this.type = "warning"), (this.text = n), l.node && l.node.source)
          ) {
            let c = l.node.rangeBy(l);
            ((this.line = c.start.line),
              (this.column = c.start.column),
              (this.endLine = c.end.line),
              (this.endColumn = c.end.column));
          }
          for (let c in l) this[c] = l[c];
        }
        toString() {
          return this.node
            ? this.node.error(this.text, {
                index: this.index,
                plugin: this.plugin,
                word: this.word,
              }).message
            : this.plugin
              ? this.plugin + ": " + this.text
              : this.text;
        }
      };
      ((e.exports = r), (r.default = r));
    }),
    Ve = j((t, e) => {
      var r = it(),
        n = class {
          get content() {
            return this.css;
          }
          constructor(l, c, u) {
            ((this.processor = l),
              (this.messages = []),
              (this.root = c),
              (this.opts = u),
              (this.css = ""),
              (this.map = void 0));
          }
          toString() {
            return this.css;
          }
          warn(l, c = {}) {
            c.plugin ||
              (this.lastPlugin &&
                this.lastPlugin.postcssPlugin &&
                (c.plugin = this.lastPlugin.postcssPlugin));
            let u = new r(l, c);
            return (this.messages.push(u), u);
          }
          warnings() {
            return this.messages.filter((l) => l.type === "warning");
          }
        };
      ((e.exports = n), (n.default = n));
    }),
    at = j((t, e) => {
      var r = {};
      e.exports = function (l) {
        r[l] ||
          ((r[l] = !0),
          typeof console < "u" && console.warn && console.warn(l));
      };
    }),
    lt = j((t, e) => {
      var r = ce(),
        n = Ue(),
        l = st(),
        c = He(),
        u = Ve(),
        m = be(),
        s = we(),
        { isClean: o, my: a } = je();
      at();
      var i = {
          atrule: "AtRule",
          comment: "Comment",
          decl: "Declaration",
          document: "Document",
          root: "Root",
          rule: "Rule",
        },
        p = {
          AtRule: !0,
          AtRuleExit: !0,
          Comment: !0,
          CommentExit: !0,
          Declaration: !0,
          DeclarationExit: !0,
          Document: !0,
          DocumentExit: !0,
          Once: !0,
          OnceExit: !0,
          postcssPlugin: !0,
          prepare: !0,
          Root: !0,
          RootExit: !0,
          Rule: !0,
          RuleExit: !0,
        },
        f = { Once: !0, postcssPlugin: !0, prepare: !0 },
        g = 0;
      function b(C) {
        return typeof C == "object" && typeof C.then == "function";
      }
      function A(C) {
        let d = !1,
          y = i[C.type];
        return (
          C.type === "decl"
            ? (d = C.prop.toLowerCase())
            : C.type === "atrule" && (d = C.name.toLowerCase()),
          d && C.append
            ? [y, y + "-" + d, g, y + "Exit", y + "Exit-" + d]
            : d
              ? [y, y + "-" + d, y + "Exit", y + "Exit-" + d]
              : C.append
                ? [y, g, y + "Exit"]
                : [y, y + "Exit"]
        );
      }
      function v(C) {
        let d;
        return (
          C.type === "document"
            ? (d = ["Document", g, "DocumentExit"])
            : C.type === "root"
              ? (d = ["Root", g, "RootExit"])
              : (d = A(C)),
          {
            eventIndex: 0,
            events: d,
            iterator: 0,
            node: C,
            visitorIndex: 0,
            visitors: [],
          }
        );
      }
      function S(C) {
        return ((C[o] = !1), C.nodes && C.nodes.forEach((d) => S(d)), C);
      }
      var h = {},
        w = class Wt {
          get content() {
            return this.stringify().content;
          }
          get css() {
            return this.stringify().css;
          }
          get map() {
            return this.stringify().map;
          }
          get messages() {
            return this.sync().messages;
          }
          get opts() {
            return this.result.opts;
          }
          get processor() {
            return this.result.processor;
          }
          get root() {
            return this.sync().root;
          }
          get [Symbol.toStringTag]() {
            return "LazyResult";
          }
          constructor(d, y, x) {
            ((this.stringified = !1), (this.processed = !1));
            let F;
            if (
              typeof y == "object" &&
              y !== null &&
              (y.type === "root" || y.type === "document")
            )
              F = S(y);
            else if (y instanceof Wt || y instanceof u)
              ((F = S(y.root)),
                y.map &&
                  (typeof x.map > "u" && (x.map = {}),
                  x.map.inline || (x.map.inline = !1),
                  (x.map.prev = y.map)));
            else {
              let T = c;
              (x.syntax && (T = x.syntax.parse),
                x.parser && (T = x.parser),
                T.parse && (T = T.parse));
              try {
                F = T(y, x);
              } catch (M) {
                ((this.processed = !0), (this.error = M));
              }
              F && !F[a] && r.rebuild(F);
            }
            ((this.result = new u(d, F, x)),
              (this.helpers = { ...h, postcss: h, result: this.result }),
              (this.plugins = this.processor.plugins.map((T) =>
                typeof T == "object" && T.prepare
                  ? { ...T, ...T.prepare(this.result) }
                  : T,
              )));
          }
          async() {
            return this.error
              ? Promise.reject(this.error)
              : this.processed
                ? Promise.resolve(this.result)
                : (this.processing || (this.processing = this.runAsync()),
                  this.processing);
          }
          catch(d) {
            return this.async().catch(d);
          }
          finally(d) {
            return this.async().then(d, d);
          }
          getAsyncError() {
            throw new Error(
              "Use process(css).then(cb) to work with async plugins",
            );
          }
          handleError(d, y) {
            let x = this.result.lastPlugin;
            try {
              (y && y.addToError(d),
                (this.error = d),
                d.name === "CssSyntaxError" && !d.plugin
                  ? ((d.plugin = x.postcssPlugin), d.setMessage())
                  : x.postcssVersion);
            } catch (F) {
              console && console.error && console.error(F);
            }
            return d;
          }
          prepareVisitors() {
            this.listeners = {};
            let d = (y, x, F) => {
              (this.listeners[x] || (this.listeners[x] = []),
                this.listeners[x].push([y, F]));
            };
            for (let y of this.plugins)
              if (typeof y == "object")
                for (let x in y) {
                  if (!p[x] && /^[A-Z]/.test(x))
                    throw new Error(
                      `Unknown event ${x} in ${y.postcssPlugin}. Try to update PostCSS (${this.processor.version} now).`,
                    );
                  if (!f[x])
                    if (typeof y[x] == "object")
                      for (let F in y[x])
                        F === "*"
                          ? d(y, x, y[x][F])
                          : d(y, x + "-" + F.toLowerCase(), y[x][F]);
                    else typeof y[x] == "function" && d(y, x, y[x]);
                }
            this.hasListener = Object.keys(this.listeners).length > 0;
          }
          async runAsync() {
            this.plugin = 0;
            for (let d = 0; d < this.plugins.length; d++) {
              let y = this.plugins[d],
                x = this.runOnRoot(y);
              if (b(x))
                try {
                  await x;
                } catch (F) {
                  throw this.handleError(F);
                }
            }
            if ((this.prepareVisitors(), this.hasListener)) {
              let d = this.result.root;
              for (; !d[o];) {
                d[o] = !0;
                let y = [v(d)];
                for (; y.length > 0;) {
                  let x = this.visitTick(y);
                  if (b(x))
                    try {
                      await x;
                    } catch (F) {
                      let T = y[y.length - 1].node;
                      throw this.handleError(F, T);
                    }
                }
              }
              if (this.listeners.OnceExit)
                for (let [y, x] of this.listeners.OnceExit) {
                  this.result.lastPlugin = y;
                  try {
                    if (d.type === "document") {
                      let F = d.nodes.map((T) => x(T, this.helpers));
                      await Promise.all(F);
                    } else await x(d, this.helpers);
                  } catch (F) {
                    throw this.handleError(F);
                  }
                }
            }
            return ((this.processed = !0), this.stringify());
          }
          runOnRoot(d) {
            this.result.lastPlugin = d;
            try {
              if (typeof d == "object" && d.Once) {
                if (this.result.root.type === "document") {
                  let y = this.result.root.nodes.map((x) =>
                    d.Once(x, this.helpers),
                  );
                  return b(y[0]) ? Promise.all(y) : y;
                }
                return d.Once(this.result.root, this.helpers);
              } else if (typeof d == "function")
                return d(this.result.root, this.result);
            } catch (y) {
              throw this.handleError(y);
            }
          }
          stringify() {
            if (this.error) throw this.error;
            if (this.stringified) return this.result;
            ((this.stringified = !0), this.sync());
            let d = this.result.opts,
              y = s;
            (d.syntax && (y = d.syntax.stringify),
              d.stringifier && (y = d.stringifier),
              y.stringify && (y = y.stringify));
            let x = new l(y, this.result.root, this.result.opts).generate();
            return (
              (this.result.css = x[0]),
              (this.result.map = x[1]),
              this.result
            );
          }
          sync() {
            if (this.error) throw this.error;
            if (this.processed) return this.result;
            if (((this.processed = !0), this.processing))
              throw this.getAsyncError();
            for (let d of this.plugins)
              if (b(this.runOnRoot(d))) throw this.getAsyncError();
            if ((this.prepareVisitors(), this.hasListener)) {
              let d = this.result.root;
              for (; !d[o];) ((d[o] = !0), this.walkSync(d));
              if (this.listeners.OnceExit)
                if (d.type === "document")
                  for (let y of d.nodes)
                    this.visitSync(this.listeners.OnceExit, y);
                else this.visitSync(this.listeners.OnceExit, d);
            }
            return this.result;
          }
          then(d, y) {
            return this.async().then(d, y);
          }
          toString() {
            return this.css;
          }
          visitSync(d, y) {
            for (let [x, F] of d) {
              this.result.lastPlugin = x;
              let T;
              try {
                T = F(y, this.helpers);
              } catch (M) {
                throw this.handleError(M, y.proxyOf);
              }
              if (y.type !== "root" && y.type !== "document" && !y.parent)
                return !0;
              if (b(T)) throw this.getAsyncError();
            }
          }
          visitTick(d) {
            let y = d[d.length - 1],
              { node: x, visitors: F } = y;
            if (x.type !== "root" && x.type !== "document" && !x.parent) {
              d.pop();
              return;
            }
            if (F.length > 0 && y.visitorIndex < F.length) {
              let [M, E] = F[y.visitorIndex];
              ((y.visitorIndex += 1),
                y.visitorIndex === F.length &&
                  ((y.visitors = []), (y.visitorIndex = 0)),
                (this.result.lastPlugin = M));
              try {
                return E(x.toProxy(), this.helpers);
              } catch (k) {
                throw this.handleError(k, x);
              }
            }
            if (y.iterator !== 0) {
              let M = y.iterator,
                E;
              for (; (E = x.nodes[x.indexes[M]]);)
                if (((x.indexes[M] += 1), !E[o])) {
                  ((E[o] = !0), d.push(v(E)));
                  return;
                }
              ((y.iterator = 0), delete x.indexes[M]);
            }
            let T = y.events;
            for (; y.eventIndex < T.length;) {
              let M = T[y.eventIndex];
              if (((y.eventIndex += 1), M === g)) {
                x.nodes &&
                  x.nodes.length &&
                  ((x[o] = !0), (y.iterator = x.getIterator()));
                return;
              } else if (this.listeners[M]) {
                y.visitors = this.listeners[M];
                return;
              }
            }
            d.pop();
          }
          walkSync(d) {
            d[o] = !0;
            let y = A(d);
            for (let x of y)
              if (x === g)
                d.nodes &&
                  d.each((F) => {
                    F[o] || this.walkSync(F);
                  });
              else {
                let F = this.listeners[x];
                if (F && this.visitSync(F, d.toProxy())) return;
              }
          }
          warnings() {
            return this.sync().warnings();
          }
        };
      ((w.registerPostcss = (C) => {
        h = C;
      }),
        (e.exports = w),
        (w.default = w),
        m.registerLazyResult(w),
        n.registerLazyResult(w));
    }),
    rr = j((t, e) => {
      var r = st(),
        n = He(),
        l = Ve(),
        c = we();
      at();
      var u = class {
        get content() {
          return this.result.css;
        }
        get css() {
          return this.result.css;
        }
        get map() {
          return this.result.map;
        }
        get messages() {
          return [];
        }
        get opts() {
          return this.result.opts;
        }
        get processor() {
          return this.result.processor;
        }
        get root() {
          if (this._root) return this._root;
          let m,
            s = n;
          try {
            m = s(this._css, this._opts);
          } catch (o) {
            this.error = o;
          }
          if (this.error) throw this.error;
          return ((this._root = m), m);
        }
        get [Symbol.toStringTag]() {
          return "NoWorkResult";
        }
        constructor(m, s, o) {
          ((s = s.toString()),
            (this.stringified = !1),
            (this._processor = m),
            (this._css = s),
            (this._opts = o),
            (this._map = void 0));
          let a = c;
          ((this.result = new l(this._processor, void 0, this._opts)),
            (this.result.css = s));
          let i = this;
          Object.defineProperty(this.result, "root", {
            get() {
              return i.root;
            },
          });
          let p = new r(a, void 0, this._opts, s);
          if (p.isMap()) {
            let [f, g] = p.generate();
            (f && (this.result.css = f), g && (this.result.map = g));
          } else (p.clearAnnotation(), (this.result.css = p.css));
        }
        async() {
          return this.error
            ? Promise.reject(this.error)
            : Promise.resolve(this.result);
        }
        catch(m) {
          return this.async().catch(m);
        }
        finally(m) {
          return this.async().then(m, m);
        }
        sync() {
          if (this.error) throw this.error;
          return this.result;
        }
        then(m, s) {
          return this.async().then(m, s);
        }
        toString() {
          return this._css;
        }
        warnings() {
          return [];
        }
      };
      ((e.exports = u), (u.default = u));
    }),
    nr = j((t, e) => {
      var r = Ue(),
        n = lt(),
        l = rr(),
        c = be(),
        u = class {
          constructor(m = []) {
            ((this.version = "8.5.10"), (this.plugins = this.normalize(m)));
          }
          normalize(m) {
            let s = [];
            for (let o of m)
              if (
                (o.postcss === !0 ? (o = o()) : o.postcss && (o = o.postcss),
                typeof o == "object" && Array.isArray(o.plugins))
              )
                s = s.concat(o.plugins);
              else if (typeof o == "object" && o.postcssPlugin) s.push(o);
              else if (typeof o == "function") s.push(o);
              else if (!(typeof o == "object" && (o.parse || o.stringify)))
                throw new Error(o + " is not a PostCSS plugin");
            return s;
          }
          process(m, s = {}) {
            return !this.plugins.length &&
              !s.parser &&
              !s.stringifier &&
              !s.syntax
              ? new l(this, m, s)
              : new n(this, m, s);
          }
          use(m) {
            return (
              (this.plugins = this.plugins.concat(this.normalize([m]))),
              this
            );
          }
        };
      ((e.exports = u),
        (u.default = u),
        c.registerProcessor(u),
        r.registerProcessor(u));
    }),
    or = j((t, e) => {
      var r = We(),
        n = Ae(),
        l = ce(),
        c = ze(),
        u = Ce(),
        m = Ue(),
        s = Qt(),
        o = ve(),
        a = lt(),
        i = ot(),
        p = xe(),
        f = He(),
        g = nr(),
        b = Ve(),
        A = be(),
        v = qe(),
        S = we(),
        h = it();
      function w(...C) {
        return (C.length === 1 && Array.isArray(C[0]) && (C = C[0]), new g(C));
      }
      ((w.plugin = function (d, y) {
        let x = !1;
        function F(...M) {
          console &&
            console.warn &&
            !x &&
            ((x = !0),
            console.warn(
              d +
                `: postcss.plugin was deprecated. Migration guide:
https://evilmartians.com/chronicles/postcss-8-plugin-migration`,
            ),
            process.env.LANG &&
              process.env.LANG.startsWith("cn") &&
              console.warn(
                d +
                  `: \u91CC\u9762 postcss.plugin \u88AB\u5F03\u7528. \u8FC1\u79FB\u6307\u5357:
https://www.w3ctech.com/topic/2226`,
              ));
          let E = y(...M);
          return (
            (E.postcssPlugin = d),
            (E.postcssVersion = new g().version),
            E
          );
        }
        let T;
        return (
          Object.defineProperty(F, "postcss", {
            get() {
              return (T || (T = F()), T);
            },
          }),
          (F.process = function (M, E, k) {
            return w([F(k)]).process(M, E);
          }),
          F
        );
      }),
        (w.stringify = S),
        (w.parse = f),
        (w.fromJSON = s),
        (w.list = i),
        (w.comment = (C) => new n(C)),
        (w.atRule = (C) => new r(C)),
        (w.decl = (C) => new u(C)),
        (w.rule = (C) => new v(C)),
        (w.root = (C) => new A(C)),
        (w.document = (C) => new m(C)),
        (w.CssSyntaxError = c),
        (w.Declaration = u),
        (w.Container = l),
        (w.Processor = g),
        (w.Document = m),
        (w.Comment = n),
        (w.Warning = h),
        (w.AtRule = r),
        (w.Result = b),
        (w.Input = o),
        (w.Rule = v),
        (w.Root = A),
        (w.Node = p),
        a.registerPostcss(w),
        (e.exports = w),
        (w.default = w));
    }),
    sr = tt(Xt(), 1),
    U = tt(or(), 1),
    ir = U.default,
    In = U.default.stringify,
    zn = U.default.fromJSON,
    jn = U.default.plugin,
    Wn = U.default.parse,
    Un = U.default.list,
    qn = U.default.document,
    Hn = U.default.comment,
    Vn = U.default.atRule,
    Gn = U.default.rule,
    Jn = U.default.decl,
    Yn = U.default.root,
    Xn = U.default.CssSyntaxError,
    Kn = U.default.Declaration,
    Zn = U.default.Container,
    Qn = U.default.Processor,
    eo = U.default.Document,
    to = U.default.Comment,
    ro = U.default.Warning,
    no = U.default.AtRule,
    oo = U.default.Result,
    so = U.default.Input,
    io = U.default.Rule,
    ao = U.default.Root,
    lo = U.default.Node;
  function ct(t) {
    const e = t.cloneNode(!0),
      r = e.querySelectorAll("use");
    return (
      r.length === 0 ||
        r.forEach((n) => {
          try {
            const l =
              n.getAttribute("href") ||
              n.getAttributeNS("http://www.w3.org/1999/xlink", "href");
            if (!l || !l.startsWith("#")) return;
            const c = l.substring(1);
            let u = document.getElementById(c);
            if ((u || (u = t.querySelector(`#${c}`)), !u)) {
              const s = document.querySelectorAll("svg");
              for (const o of s) if (((u = o.querySelector(`#${c}`)), u)) break;
            }
            if (!u) {
              console.warn(`Referenced element #${c} not found`);
              return;
            }
            const m = u.cloneNode(!0);
            if (m.tagName.toLowerCase() === "symbol") {
              const s = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g",
              );
              for (; m.firstChild;) s.appendChild(m.firstChild);
              Array.from(m.attributes).forEach((a) => {
                a.name !== "id" && s.setAttribute(a.name, a.value);
              });
              const o = m.getAttribute("viewBox");
              (o && s.setAttribute("data-original-viewbox", o),
                m.replaceWith(s),
                m.remove(),
                ut(n, s),
                n.parentNode.replaceChild(s, n));
            } else (ut(n, m), n.parentNode.replaceChild(m, n));
          } catch (l) {
            console.error("Error resolving <use> reference:", l);
          }
        }),
      e
    );
  }
  function ut(t, e) {
    const r = [
        "x",
        "y",
        "width",
        "height",
        "transform",
        "fill",
        "stroke",
        "stroke-width",
        "opacity",
        "class",
        "style",
      ],
      n = [],
      l = t.getAttribute("x"),
      c = t.getAttribute("y");
    (l || c) && n.push(`translate(${l || 0}, ${c || 0})`);
    const u = t.getAttribute("transform");
    if ((u && n.push(u), n.length > 0)) {
      const m = e.getAttribute("transform"),
        s = n.join(" ") + (m ? " " + m : "");
      e.setAttribute("transform", s);
    }
    r.forEach((m) => {
      if (m === "x" || m === "y" || m === "transform") return;
      const s = t.getAttribute(m);
      s && !e.getAttribute(m) && e.setAttribute(m, s);
    });
  }
  function ft(t, e) {
    const r = [
        "fill",
        "stroke",
        "stroke-width",
        "stroke-linecap",
        "stroke-linejoin",
        "stroke-dasharray",
        "stroke-dashoffset",
        "opacity",
        "fill-opacity",
        "stroke-opacity",
        "font-family",
        "font-size",
        "font-weight",
        "font-style",
        "text-anchor",
        "dominant-baseline",
        "stop-color",
        "stop-opacity",
      ],
      n = [t, ...t.querySelectorAll("*")],
      l = [e, ...e.querySelectorAll("*")];
    return (
      n.forEach((c, u) => {
        try {
          const m = l[u];
          if (!m) return;
          const s = window.getComputedStyle(c);
          (r.forEach((o) => {
            const a = s.getPropertyValue(o);
            if (!(!a || a === "inherit"))
              if (o === "fill" || o === "stroke" || o === "stop-color") {
                const i = m.getAttribute(o);
                if (i && i.startsWith("url(")) return;
                const p = G(a);
                m.setAttribute(o, p);
              } else {
                if (a === "none" || a === "normal") return;
                m.setAttribute(o, a);
              }
          }),
            m.removeAttribute("class"));
        } catch (m) {
          console.error("Error inlining styles for element:", m);
        }
      }),
      e
    );
  }
  function dt(t, e, r) {
    const n = t + 0.3963377774 * e + 0.2158037573 * r,
      l = t - 0.1055613458 * e - 0.0638541728 * r,
      c = t - 0.0894841775 * e - 1.291485548 * r,
      u = n * n * n,
      m = l * l * l,
      s = c * c * c,
      o = 4.0767416621 * u - 3.3077115913 * m + 0.2309699292 * s,
      a = -1.2684380046 * u + 2.6097574011 * m - 0.3413193965 * s,
      i = -0.0041960863 * u - 0.7034186147 * m + 1.707614701 * s,
      p = (f) =>
        f <= 0
          ? 0
          : f >= 1
            ? 1
            : f <= 0.0031308
              ? 12.92 * f
              : 1.055 * Math.pow(f, 1 / 2.4) - 0.055;
    return {
      r: Math.max(0, Math.min(255, Math.round(p(o) * 255))),
      g: Math.max(0, Math.min(255, Math.round(p(a) * 255))),
      b: Math.max(0, Math.min(255, Math.round(p(i) * 255))),
    };
  }
  function ar(t, e, r) {
    const n = (r * Math.PI) / 180;
    return { l: t, a: e * Math.cos(n), b: e * Math.sin(n) };
  }
  function lr(t, e, r) {
    const n = ar(t, e, r);
    return dt(n.l, n.a, n.b);
  }
  function G(t) {
    if (!t || t === "none" || t === "transparent" || t === "rgba(0, 0, 0, 0)")
      return null;
    const e = (u) => {
        const m = Math.max(0, Math.min(255, Math.round(u))).toString(16);
        return m.length === 1 ? "0" + m : m;
      },
      r = t;
    if (((t = t.trim()), t.startsWith("#"))) {
      const u = t.toUpperCase();
      return u.length === 4 ? "#" + u[1] + u[1] + u[2] + u[2] + u[3] + u[3] : u;
    }
    const n = t.match(
      /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
    );
    if (n) {
      const u = parseInt(n[1]),
        m = parseInt(n[2]),
        s = parseInt(n[3]),
        o = n[4] ? parseFloat(n[4]) : 1;
      let a = "#" + e(u) + e(m) + e(s);
      if (o < 1) {
        const i = Math.round(o * 255);
        a += e(i);
      }
      return a.toUpperCase();
    }
    const l = t.match(
      /oklch\s*\(\s*([0-9.]+)(%?)\s+([0-9.]+)\s+([0-9.]+)(?:deg)?(?:\s*\/\s*([0-9.]+%?))?\s*\)/i,
    );
    if (l) {
      let u = parseFloat(l[1]);
      (l[2] === "%" || u > 1) && (u = u / 100);
      const m = parseFloat(l[3]),
        s = parseFloat(l[4]);
      let o = 1;
      l[5] &&
        (o = l[5].endsWith("%") ? parseFloat(l[5]) / 100 : parseFloat(l[5]));
      const a = lr(u, m, s);
      let i = "#" + e(a.r) + e(a.g) + e(a.b);
      return (o < 1 && (i += e(Math.round(o * 255))), i.toUpperCase());
    }
    const c = t.match(
      /oklab\s*\(\s*([0-9.]+)(%?)\s+([-0-9.]+)\s+([-0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)/i,
    );
    if (c) {
      let u = parseFloat(c[1]);
      c[2] === "%" && (u = u / 100);
      const m = parseFloat(c[3]),
        s = parseFloat(c[4]);
      let o = 1;
      c[5] &&
        (o = c[5].endsWith("%") ? parseFloat(c[5]) / 100 : parseFloat(c[5]));
      const a = dt(u, m, s);
      let i = "#" + e(a.r) + e(a.g) + e(a.b);
      return (o < 1 && (i += e(Math.round(o * 255))), i.toUpperCase());
    }
    try {
      const u = document.createElement("div");
      ((u.style.display = "none"),
        (u.style.color = t),
        document.body.appendChild(u));
      const m = window.getComputedStyle(u).color;
      if (
        (document.body.removeChild(u),
        m &&
          m !== t &&
          (m.startsWith("rgb") ||
            m.startsWith("oklch") ||
            m.startsWith("oklab")))
      )
        return G(m);
    } catch (u) {
      console.warn("Could not convert color to hex using fallback:", t, u);
    }
    return r;
  }
  function ue(t) {
    if (!t || t === "transparent" || t === "rgba(0, 0, 0, 0)") return !0;
    const e = t.match(/^oklch\([^)]+\/\s*([\d.]+)\s*\)$/i);
    if (e && parseFloat(e[1]) === 0) return !0;
    const r = t.match(/^oklab\([^)]+\/\s*([\d.]+)\s*\)$/i);
    return !!(r && parseFloat(r[1]) === 0);
  }
  function ht(t) {
    if (!t) return 0;
    const e = t.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (e) return e[4] ? parseFloat(e[4]) : 1;
    const r = t.match(/^oklch\([^/]+(?:\/\s*([\d.]+%?))?\s*\)$/i);
    if (r)
      return r[1]
        ? r[1].endsWith("%")
          ? parseFloat(r[1]) / 100
          : parseFloat(r[1])
        : 1;
    const n = t.match(/^oklab\([^/]+(?:\/\s*([\d.]+%?))?\s*\)$/i);
    return n
      ? n[1]
        ? n[1].endsWith("%")
          ? parseFloat(n[1]) / 100
          : parseFloat(n[1])
        : 1
      : t.startsWith("#") && t.length === 9
        ? parseInt(t.substr(7, 2), 16) / 255
        : 1;
  }
  var cr = {
    "#F8FAFC": "slate-50",
    "#F1F5F9": "slate-100",
    "#E2E8F0": "slate-200",
    "#CBD5E1": "slate-300",
    "#94A3B8": "slate-400",
    "#64748B": "slate-500",
    "#475569": "slate-600",
    "#334155": "slate-700",
    "#1E293B": "slate-800",
    "#0F172A": "slate-900",
    "#020617": "slate-950",
    "#F9FAFB": "gray-50",
    "#F3F4F6": "gray-100",
    "#E5E7EB": "gray-200",
    "#D1D5DB": "gray-300",
    "#9CA3AF": "gray-400",
    "#6B7280": "gray-500",
    "#4B5563": "gray-600",
    "#374151": "gray-700",
    "#1F2937": "gray-800",
    "#111827": "gray-900",
    "#030712": "gray-950",
    "#FAFAFA": "zinc-50",
    "#F4F4F5": "zinc-100",
    "#E4E4E7": "zinc-200",
    "#D4D4D8": "zinc-300",
    "#A1A1AA": "zinc-400",
    "#71717A": "zinc-500",
    "#52525B": "zinc-600",
    "#3F3F46": "zinc-700",
    "#27272A": "zinc-800",
    "#18181B": "zinc-900",
    "#09090B": "zinc-950",
    "#F5F5F5": "neutral-100",
    "#E5E5E5": "neutral-200",
    "#D4D4D4": "neutral-300",
    "#A3A3A3": "neutral-400",
    "#737373": "neutral-500",
    "#525252": "neutral-600",
    "#404040": "neutral-700",
    "#262626": "neutral-800",
    "#171717": "neutral-900",
    "#0A0A0A": "neutral-950",
    "#FAFAF9": "stone-50",
    "#F5F5F4": "stone-100",
    "#E7E5E4": "stone-200",
    "#D6D3D1": "stone-300",
    "#A8A29E": "stone-400",
    "#78716C": "stone-500",
    "#57534E": "stone-600",
    "#44403C": "stone-700",
    "#292524": "stone-800",
    "#1C1917": "stone-900",
    "#0C0A09": "stone-950",
    "#FEF2F2": "red-50",
    "#FEE2E2": "red-100",
    "#FECACA": "red-200",
    "#FCA5A5": "red-300",
    "#F87171": "red-400",
    "#EF4444": "red-500",
    "#DC2626": "red-600",
    "#B91C1C": "red-700",
    "#991B1B": "red-800",
    "#7F1D1D": "red-900",
    "#450A0A": "red-950",
    "#FFF7ED": "orange-50",
    "#FFEDD5": "orange-100",
    "#FED7AA": "orange-200",
    "#FDBA74": "orange-300",
    "#FB923C": "orange-400",
    "#F97316": "orange-500",
    "#EA580C": "orange-600",
    "#C2410C": "orange-700",
    "#9A3412": "orange-800",
    "#7C2D12": "orange-900",
    "#431407": "orange-950",
    "#FFFBEB": "amber-50",
    "#FEF3C7": "amber-100",
    "#FDE68A": "amber-200",
    "#FCD34D": "amber-300",
    "#FBBF24": "amber-400",
    "#F59E0B": "amber-500",
    "#D97706": "amber-600",
    "#B45309": "amber-700",
    "#92400E": "amber-800",
    "#78350F": "amber-900",
    "#451A03": "amber-950",
    "#FEFCE8": "yellow-50",
    "#FEF9C3": "yellow-100",
    "#FEF08A": "yellow-200",
    "#FDE047": "yellow-300",
    "#FACC15": "yellow-400",
    "#EAB308": "yellow-500",
    "#CA8A04": "yellow-600",
    "#A16207": "yellow-700",
    "#854D0E": "yellow-800",
    "#713F12": "yellow-900",
    "#422006": "yellow-950",
    "#F7FEE7": "lime-50",
    "#ECFCCB": "lime-100",
    "#D9F99D": "lime-200",
    "#BEF264": "lime-300",
    "#A3E635": "lime-400",
    "#84CC16": "lime-500",
    "#65A30D": "lime-600",
    "#4D7C0F": "lime-700",
    "#3F6212": "lime-800",
    "#365314": "lime-900",
    "#1A2E05": "lime-950",
    "#F0FDF4": "green-50",
    "#DCFCE7": "green-100",
    "#BBF7D0": "green-200",
    "#86EFAC": "green-300",
    "#4ADE80": "green-400",
    "#22C55E": "green-500",
    "#16A34A": "green-600",
    "#15803D": "green-700",
    "#166534": "green-800",
    "#14532D": "green-900",
    "#052E16": "green-950",
    "#ECFDF5": "emerald-50",
    "#D1FAE5": "emerald-100",
    "#A7F3D0": "emerald-200",
    "#6EE7B7": "emerald-300",
    "#34D399": "emerald-400",
    "#10B981": "emerald-500",
    "#059669": "emerald-600",
    "#047857": "emerald-700",
    "#065F46": "emerald-800",
    "#064E3B": "emerald-900",
    "#022C22": "emerald-950",
    "#F0FDFA": "teal-50",
    "#CCFBF1": "teal-100",
    "#99F6E4": "teal-200",
    "#5EEAD4": "teal-300",
    "#2DD4BF": "teal-400",
    "#14B8A6": "teal-500",
    "#0D9488": "teal-600",
    "#0F766E": "teal-700",
    "#115E59": "teal-800",
    "#134E4A": "teal-900",
    "#042F2E": "teal-950",
    "#ECFEFF": "cyan-50",
    "#CFFAFE": "cyan-100",
    "#A5F3FC": "cyan-200",
    "#67E8F9": "cyan-300",
    "#22D3EE": "cyan-400",
    "#06B6D4": "cyan-500",
    "#0891B2": "cyan-600",
    "#0E7490": "cyan-700",
    "#155E75": "cyan-800",
    "#164E63": "cyan-900",
    "#083344": "cyan-950",
    "#F0F9FF": "sky-50",
    "#E0F2FE": "sky-100",
    "#BAE6FD": "sky-200",
    "#7DD3FC": "sky-300",
    "#38BDF8": "sky-400",
    "#0EA5E9": "sky-500",
    "#0284C7": "sky-600",
    "#0369A1": "sky-700",
    "#075985": "sky-800",
    "#0C4A6E": "sky-900",
    "#082F49": "sky-950",
    "#EFF6FF": "blue-50",
    "#DBEAFE": "blue-100",
    "#BFDBFE": "blue-200",
    "#93C5FD": "blue-300",
    "#60A5FA": "blue-400",
    "#3B82F6": "blue-500",
    "#2563EB": "blue-600",
    "#1D4ED8": "blue-700",
    "#1E40AF": "blue-800",
    "#1E3A8A": "blue-900",
    "#172554": "blue-950",
    "#EEF2FF": "indigo-50",
    "#E0E7FF": "indigo-100",
    "#C7D2FE": "indigo-200",
    "#A5B4FC": "indigo-300",
    "#818CF8": "indigo-400",
    "#6366F1": "indigo-500",
    "#4F46E5": "indigo-600",
    "#4338CA": "indigo-700",
    "#3730A3": "indigo-800",
    "#312E81": "indigo-900",
    "#1E1B4B": "indigo-950",
    "#F5F3FF": "violet-50",
    "#EDE9FE": "violet-100",
    "#DDD6FE": "violet-200",
    "#C4B5FD": "violet-300",
    "#A78BFA": "violet-400",
    "#8B5CF6": "violet-500",
    "#7C3AED": "violet-600",
    "#6D28D9": "violet-700",
    "#5B21B6": "violet-800",
    "#4C1D95": "violet-900",
    "#2E1065": "violet-950",
    "#FAF5FF": "purple-50",
    "#F3E8FF": "purple-100",
    "#E9D5FF": "purple-200",
    "#D8B4FE": "purple-300",
    "#C084FC": "purple-400",
    "#A855F7": "purple-500",
    "#9333EA": "purple-600",
    "#7E22CE": "purple-700",
    "#6B21A8": "purple-800",
    "#581C87": "purple-900",
    "#3B0764": "purple-950",
    "#FDF4FF": "fuchsia-50",
    "#FAE8FF": "fuchsia-100",
    "#F5D0FE": "fuchsia-200",
    "#F0ABFC": "fuchsia-300",
    "#E879F9": "fuchsia-400",
    "#D946EF": "fuchsia-500",
    "#C026D3": "fuchsia-600",
    "#A21CAF": "fuchsia-700",
    "#86198F": "fuchsia-800",
    "#701A75": "fuchsia-900",
    "#4A044E": "fuchsia-950",
    "#FDF2F8": "pink-50",
    "#FCE7F3": "pink-100",
    "#FBCFE8": "pink-200",
    "#F9A8D4": "pink-300",
    "#F472B6": "pink-400",
    "#EC4899": "pink-500",
    "#DB2777": "pink-600",
    "#BE185D": "pink-700",
    "#9D174D": "pink-800",
    "#831843": "pink-900",
    "#500724": "pink-950",
    "#FFF1F2": "rose-50",
    "#FFE4E6": "rose-100",
    "#FECDD3": "rose-200",
    "#FDA4AF": "rose-300",
    "#FB7185": "rose-400",
    "#F43F5E": "rose-500",
    "#E11D48": "rose-600",
    "#BE123C": "rose-700",
    "#9F1239": "rose-800",
    "#881337": "rose-900",
    "#4C0519": "rose-950",
    "#FFFFFF": "white",
    "#000000": "black",
  };
  function ur(t) {
    if (!t || typeof t != "string") return null;
    let e = t.toUpperCase();
    return (
      e.length === 4 && (e = "#" + e[1] + e[1] + e[2] + e[2] + e[3] + e[3]),
      e.length === 9 && (e = e.substring(0, 7)),
      cr[e] || null
    );
  }
  function fr(t) {
    if (!t || t.length !== 9) return null;
    const e = t.substring(7, 9),
      r = Math.round((parseInt(e, 16) / 255) * 100);
    return r >= 100 ? null : r;
  }
  function K(t, e) {
    if (
      !t ||
      t === "transparent" ||
      t === "none" ||
      t === "currentColor" ||
      t === "inherit"
    )
      return t === "transparent"
        ? e + "-transparent"
        : t === "currentColor"
          ? e + "-current"
          : t === "inherit"
            ? e + "-inherit"
            : null;
    const r = typeof G == "function" ? G(t) : null;
    if (!r || !r.startsWith("#")) return null;
    const n = fr(r),
      l = r.substring(0, 7).toUpperCase(),
      c = ur(l);
    if (c) {
      const s = e + "-" + c;
      return n != null ? s + "/" + n : s;
    }
    const u = l.toLowerCase(),
      m = e + "-[" + u + "]";
    return n != null ? m + "/" + n : m;
  }
  var dr = {
      0: "0",
      1: "px",
      2: "0.5",
      4: "1",
      5: "1.5",
      6: "1.5",
      8: "2",
      10: "2.5",
      12: "3",
      14: "3.5",
      16: "4",
      20: "5",
      24: "6",
      28: "7",
      32: "8",
      36: "9",
      40: "10",
      44: "11",
      48: "12",
      56: "14",
      64: "16",
      72: "18",
      80: "20",
      96: "24",
      112: "28",
      128: "32",
      144: "36",
      160: "40",
      176: "44",
      192: "48",
      208: "52",
      224: "56",
      240: "60",
      256: "64",
      288: "72",
      320: "80",
      384: "96",
    },
    hr = {
      12: "xs",
      14: "sm",
      16: "base",
      18: "lg",
      20: "xl",
      24: "2xl",
      30: "3xl",
      36: "4xl",
      48: "5xl",
      60: "6xl",
      72: "7xl",
      96: "8xl",
      128: "9xl",
    },
    pt = {
      1: "none",
      1.25: "tight",
      1.375: "snug",
      1.5: "normal",
      1.625: "relaxed",
      2: "loose",
      12: "3",
      16: "4",
      20: "5",
      24: "6",
      28: "7",
      32: "8",
      36: "9",
      40: "10",
    },
    pr = {
      0: "none",
      2: "sm",
      4: "DEFAULT",
      6: "md",
      8: "lg",
      12: "xl",
      16: "2xl",
      24: "3xl",
      9999: "full",
    },
    mr = {
      0: "0",
      0.05: "5",
      0.1: "10",
      0.15: "15",
      0.2: "20",
      0.25: "25",
      0.3: "30",
      0.35: "35",
      0.4: "40",
      0.45: "45",
      0.5: "50",
      0.55: "55",
      0.6: "60",
      0.65: "65",
      0.7: "70",
      0.75: "75",
      0.8: "80",
      0.85: "85",
      0.9: "90",
      0.95: "95",
      1: "100",
    };
  function Se(t) {
    return !t ||
      t === "auto" ||
      t === "none" ||
      t === "inherit" ||
      t === "initial"
      ? null
      : ((t = t.trim()),
        t === "0" || t === "0px" || t === "0rem" || t === "0em"
          ? 0
          : t.endsWith("px")
            ? parseFloat(t)
            : t.endsWith("rem") || t.endsWith("em")
              ? parseFloat(t) * 16
              : null);
  }
  function gr(t) {
    return t == null ? null : dr[String(Math.round(t))] || null;
  }
  function N(t, e) {
    if (!t) return null;
    if (((t = t.trim()), t === "0" || t === "0px")) return e + "-0";
    if (t === "auto") return e + "-auto";
    if (t.endsWith("%")) {
      const c = parseFloat(t);
      for (const [u, m] of Object.entries({
        100: "full",
        50: "1/2",
        33.333: "1/3",
        33.3333: "1/3",
        66.666: "2/3",
        66.6667: "2/3",
        25: "1/4",
        75: "3/4",
        20: "1/5",
        40: "2/5",
        60: "3/5",
        80: "4/5",
        16.666: "1/6",
        16.6667: "1/6",
        83.333: "5/6",
        83.3333: "5/6",
      }))
        if (Math.abs(c - parseFloat(u)) < 0.1) return e + "-" + m;
      return e + "-[" + t + "]";
    }
    if (t === "fit-content") return e + "-fit";
    if (t === "max-content") return e + "-max";
    if (t === "min-content") return e + "-min";
    if (t === "100vw" || t === "100vh") return e + "-screen";
    if (t === "100dvh") return e + "-dvh";
    if (t === "100svh") return e + "-svh";
    if (t === "100lvh") return e + "-lvh";
    const r = Se(t);
    if (r === null) return e + "-[" + t + "]";
    if (r === 0) return e + "-0";
    const n = gr(Math.abs(r)),
      l = r < 0 ? "-" : "";
    return n ? l + e + "-" + n : l + e + "-[" + Math.abs(Math.round(r)) + "px]";
  }
  function se(t, e) {
    if (!t) return null;
    if (((t = t.trim()), t === "0" || t === "0px")) return e + "-none";
    if (t === "9999px" || t === "50%" || t === "100%") return e + "-full";
    const r = Se(t);
    if (r === null) return e + "-[" + t + "]";
    const n = pr[String(Math.round(r))];
    return n === "DEFAULT"
      ? e
      : n
        ? e + "-" + n
        : e + "-[" + Math.round(r) + "px]";
  }
  function mt(t, e) {
    if (!t || !e) return null;
    if (
      ((t = t.trim().toLowerCase()), (e = e.trim()), e.endsWith("!important"))
    ) {
      e = e.replace(/\s*!important\s*$/, "").trim();
      const r = mt(t, e);
      return r ? "!" + r : null;
    }
    switch (t) {
      case "display":
        return (
          {
            block: "block",
            "inline-block": "inline-block",
            inline: "inline",
            flex: "flex",
            "inline-flex": "inline-flex",
            grid: "grid",
            "inline-grid": "inline-grid",
            none: "hidden",
            contents: "contents",
            table: "table",
            "table-row": "table-row",
            "table-cell": "table-cell",
            "table-caption": "table-caption",
            "table-column": "table-column",
            "table-column-group": "table-column-group",
            "table-footer-group": "table-footer-group",
            "table-header-group": "table-header-group",
            "table-row-group": "table-row-group",
            "list-item": "list-item",
            "flow-root": "flow-root",
          }[e] || null
        );
      case "position":
        return (
          {
            static: "static",
            relative: "relative",
            absolute: "absolute",
            fixed: "fixed",
            sticky: "sticky",
          }[e] || null
        );
      case "top":
        return N(e, "top");
      case "right":
        return N(e, "right");
      case "bottom":
        return N(e, "bottom");
      case "left":
        return N(e, "left");
      case "inset":
        return e === "0" || e === "0px" ? "inset-0" : N(e, "inset");
      case "overflow":
        return (
          {
            hidden: "overflow-hidden",
            auto: "overflow-auto",
            scroll: "overflow-scroll",
            visible: "overflow-visible",
            clip: "overflow-clip",
          }[e] || null
        );
      case "overflow-x":
        return (
          {
            hidden: "overflow-x-hidden",
            auto: "overflow-x-auto",
            scroll: "overflow-x-scroll",
            visible: "overflow-x-visible",
            clip: "overflow-x-clip",
          }[e] || null
        );
      case "overflow-y":
        return (
          {
            hidden: "overflow-y-hidden",
            auto: "overflow-y-auto",
            scroll: "overflow-y-scroll",
            visible: "overflow-y-visible",
            clip: "overflow-y-clip",
          }[e] || null
        );
      case "visibility":
        return (
          { visible: "visible", hidden: "invisible", collapse: "collapse" }[
            e
          ] || null
        );
      case "z-index": {
        if (e === "auto") return "z-auto";
        const r = {
          0: "z-0",
          10: "z-10",
          20: "z-20",
          30: "z-30",
          40: "z-40",
          50: "z-50",
        };
        return r[e] ? r[e] : (parseInt(e, 10) < 0 ? "-" : "") + "z-[" + e + "]";
      }
      case "flex-direction":
        return (
          {
            row: "flex-row",
            column: "flex-col",
            "row-reverse": "flex-row-reverse",
            "column-reverse": "flex-col-reverse",
          }[e] || null
        );
      case "flex-wrap":
        return (
          {
            wrap: "flex-wrap",
            nowrap: "flex-nowrap",
            "wrap-reverse": "flex-wrap-reverse",
          }[e] || null
        );
      case "flex-grow":
        return e === "0" ? "grow-0" : e === "1" ? "grow" : "grow-[" + e + "]";
      case "flex-shrink":
        return e === "0"
          ? "shrink-0"
          : e === "1"
            ? "shrink"
            : "shrink-[" + e + "]";
      case "flex-basis":
        return N(e, "basis");
      case "flex":
        return e === "1 1 0%" || e === "1"
          ? "flex-1"
          : e === "1 1 auto"
            ? "flex-auto"
            : e === "0 1 auto" || e === "initial"
              ? "flex-initial"
              : e === "none" || e === "0 0 auto"
                ? "flex-none"
                : null;
      case "order":
        return (
          {
            1: "order-1",
            2: "order-2",
            3: "order-3",
            4: "order-4",
            5: "order-5",
            6: "order-6",
            7: "order-7",
            8: "order-8",
            9: "order-9",
            10: "order-10",
            11: "order-11",
            12: "order-12",
            "-9999": "order-first",
            9999: "order-last",
            0: "order-none",
          }[e] || "order-[" + e + "]"
        );
      case "grid-template-columns": {
        const r = e.match(/^repeat\((\d+),\s*minmax\(0,\s*1fr\)\)$/);
        if (r) return "grid-cols-" + r[1];
        const n = e.match(/^repeat\((\d+),\s*1fr\)$/);
        return n
          ? "grid-cols-" + n[1]
          : e === "none"
            ? "grid-cols-none"
            : e === "subgrid"
              ? "grid-cols-subgrid"
              : null;
      }
      case "grid-template-rows": {
        const r = e.match(/^repeat\((\d+),\s*minmax\(0,\s*1fr\)\)$/);
        if (r) return "grid-rows-" + r[1];
        const n = e.match(/^repeat\((\d+),\s*1fr\)$/);
        return n
          ? "grid-rows-" + n[1]
          : e === "none"
            ? "grid-rows-none"
            : e === "subgrid"
              ? "grid-rows-subgrid"
              : null;
      }
      case "grid-column": {
        if (e === "auto") return "col-auto";
        const r = e.match(/^span\s+(\d+)\s*\/\s*span\s+\d+$/);
        if (r) return "col-span-" + r[1];
        const n = e.match(/^span\s+(\d+)$/);
        return n ? "col-span-" + n[1] : e === "1 / -1" ? "col-span-full" : null;
      }
      case "grid-column-start":
        return e === "auto" ? "col-start-auto" : "col-start-" + e;
      case "grid-column-end":
        return e === "auto" ? "col-end-auto" : "col-end-" + e;
      case "grid-row": {
        if (e === "auto") return "row-auto";
        const r = e.match(/^span\s+(\d+)\s*\/\s*span\s+\d+$/);
        if (r) return "row-span-" + r[1];
        const n = e.match(/^span\s+(\d+)$/);
        return n ? "row-span-" + n[1] : e === "1 / -1" ? "row-span-full" : null;
      }
      case "grid-row-start":
        return e === "auto" ? "row-start-auto" : "row-start-" + e;
      case "grid-row-end":
        return e === "auto" ? "row-end-auto" : "row-end-" + e;
      case "grid-auto-flow":
        return (
          {
            row: "grid-flow-row",
            column: "grid-flow-col",
            "row dense": "grid-flow-row-dense",
            "column dense": "grid-flow-col-dense",
            dense: "grid-flow-dense",
          }[e] || null
        );
      case "grid-auto-columns":
        return (
          {
            auto: "auto-cols-auto",
            "min-content": "auto-cols-min",
            "max-content": "auto-cols-max",
            "minmax(0, 1fr)": "auto-cols-fr",
          }[e] || null
        );
      case "grid-auto-rows":
        return (
          {
            auto: "auto-rows-auto",
            "min-content": "auto-rows-min",
            "max-content": "auto-rows-max",
            "minmax(0, 1fr)": "auto-rows-fr",
          }[e] || null
        );
      case "justify-content":
        return (
          {
            center: "justify-center",
            "flex-start": "justify-start",
            start: "justify-start",
            "flex-end": "justify-end",
            end: "justify-end",
            "space-between": "justify-between",
            "space-around": "justify-around",
            "space-evenly": "justify-evenly",
            stretch: "justify-stretch",
            normal: "justify-normal",
          }[e] || null
        );
      case "justify-items":
        return (
          {
            start: "justify-items-start",
            end: "justify-items-end",
            center: "justify-items-center",
            stretch: "justify-items-stretch",
          }[e] || null
        );
      case "justify-self":
        return (
          {
            auto: "justify-self-auto",
            start: "justify-self-start",
            end: "justify-self-end",
            center: "justify-self-center",
            stretch: "justify-self-stretch",
          }[e] || null
        );
      case "align-content":
        return (
          {
            center: "content-center",
            "flex-start": "content-start",
            start: "content-start",
            "flex-end": "content-end",
            end: "content-end",
            "space-between": "content-between",
            "space-around": "content-around",
            "space-evenly": "content-evenly",
            stretch: "content-stretch",
            baseline: "content-baseline",
            normal: "content-normal",
          }[e] || null
        );
      case "align-items":
        return (
          {
            center: "items-center",
            "flex-start": "items-start",
            start: "items-start",
            "flex-end": "items-end",
            end: "items-end",
            stretch: "items-stretch",
            baseline: "items-baseline",
          }[e] || null
        );
      case "align-self":
        return (
          {
            auto: "self-auto",
            "flex-start": "self-start",
            start: "self-start",
            "flex-end": "self-end",
            end: "self-end",
            center: "self-center",
            stretch: "self-stretch",
            baseline: "self-baseline",
          }[e] || null
        );
      case "place-content":
        return (
          {
            center: "place-content-center",
            start: "place-content-start",
            end: "place-content-end",
            "space-between": "place-content-between",
            "space-around": "place-content-around",
            "space-evenly": "place-content-evenly",
            stretch: "place-content-stretch",
            baseline: "place-content-baseline",
          }[e] || null
        );
      case "place-items":
        return (
          {
            center: "place-items-center",
            start: "place-items-start",
            end: "place-items-end",
            stretch: "place-items-stretch",
            baseline: "place-items-baseline",
          }[e] || null
        );
      case "place-self":
        return (
          {
            auto: "place-self-auto",
            center: "place-self-center",
            start: "place-self-start",
            end: "place-self-end",
            stretch: "place-self-stretch",
          }[e] || null
        );
      case "gap":
        return N(e, "gap");
      case "row-gap":
        return N(e, "gap-y");
      case "column-gap":
        return N(e, "gap-x");
      case "padding":
        return N(e, "p");
      case "padding-top":
        return N(e, "pt");
      case "padding-right":
        return N(e, "pr");
      case "padding-bottom":
        return N(e, "pb");
      case "padding-left":
        return N(e, "pl");
      case "padding-inline":
        return N(e, "px");
      case "padding-block":
        return N(e, "py");
      case "padding-inline-start":
        return N(e, "ps");
      case "padding-inline-end":
        return N(e, "pe");
      case "margin":
        return N(e, "m");
      case "margin-top":
        return N(e, "mt");
      case "margin-right":
        return N(e, "mr");
      case "margin-bottom":
        return N(e, "mb");
      case "margin-left":
        return N(e, "ml");
      case "margin-inline":
        return N(e, "mx");
      case "margin-block":
        return N(e, "my");
      case "margin-inline-start":
        return N(e, "ms");
      case "margin-inline-end":
        return N(e, "me");
      case "width":
        return N(e, "w");
      case "min-width":
        return N(e, "min-w");
      case "max-width":
        return (
          {
            none: "max-w-none",
            0: "max-w-0",
            "320px": "max-w-xs",
            "20rem": "max-w-xs",
            "384px": "max-w-sm",
            "24rem": "max-w-sm",
            "448px": "max-w-md",
            "28rem": "max-w-md",
            "512px": "max-w-lg",
            "32rem": "max-w-lg",
            "576px": "max-w-xl",
            "36rem": "max-w-xl",
            "672px": "max-w-2xl",
            "42rem": "max-w-2xl",
            "768px": "max-w-3xl",
            "48rem": "max-w-3xl",
            "896px": "max-w-4xl",
            "56rem": "max-w-4xl",
            "1024px": "max-w-5xl",
            "64rem": "max-w-5xl",
            "1152px": "max-w-6xl",
            "72rem": "max-w-6xl",
            "1280px": "max-w-7xl",
            "80rem": "max-w-7xl",
            "100%": "max-w-full",
            "fit-content": "max-w-fit",
            "max-content": "max-w-max",
            "min-content": "max-w-min",
            "65ch": "max-w-prose",
          }[e] || N(e, "max-w")
        );
      case "height":
        return N(e, "h");
      case "min-height":
        return N(e, "min-h");
      case "max-height":
        return N(e, "max-h");
      case "font-family":
        return null;
      case "font-size": {
        const r = Se(e);
        if (r !== null) {
          const n = hr[String(Math.round(r))];
          return n ? "text-" + n : "text-[" + Math.round(r) + "px]";
        }
        return "text-[" + e + "]";
      }
      case "font-weight":
        return (
          {
            100: "font-thin",
            200: "font-extralight",
            300: "font-light",
            400: "font-normal",
            500: "font-medium",
            600: "font-semibold",
            700: "font-bold",
            800: "font-extrabold",
            900: "font-black",
            normal: "font-normal",
            bold: "font-bold",
          }[e] || null
        );
      case "font-style":
        return e === "italic" ? "italic" : e === "normal" ? "not-italic" : null;
      case "text-align":
        return (
          {
            left: "text-left",
            center: "text-center",
            right: "text-right",
            justify: "text-justify",
            start: "text-start",
            end: "text-end",
          }[e] || null
        );
      case "text-transform":
        return (
          {
            uppercase: "uppercase",
            lowercase: "lowercase",
            capitalize: "capitalize",
            none: "normal-case",
          }[e] || null
        );
      case "text-decoration-line":
      case "text-decoration":
        return e === "underline" || e.startsWith("underline")
          ? "underline"
          : e === "line-through" || e.startsWith("line-through")
            ? "line-through"
            : e === "overline" || e.startsWith("overline")
              ? "overline"
              : e === "none"
                ? "no-underline"
                : null;
      case "text-decoration-color":
        return K(e, "decoration");
      case "text-decoration-style":
        return (
          {
            solid: "decoration-solid",
            double: "decoration-double",
            dotted: "decoration-dotted",
            dashed: "decoration-dashed",
            wavy: "decoration-wavy",
          }[e] || null
        );
      case "text-decoration-thickness":
        return (
          {
            auto: "decoration-auto",
            "from-font": "decoration-from-font",
            0: "decoration-0",
            "0px": "decoration-0",
            "1px": "decoration-1",
            "2px": "decoration-2",
            "4px": "decoration-4",
            "8px": "decoration-8",
          }[e] || null
        );
      case "text-underline-offset":
        return (
          {
            auto: "underline-offset-auto",
            "1px": "underline-offset-1",
            "2px": "underline-offset-2",
            "4px": "underline-offset-4",
            "8px": "underline-offset-8",
          }[e] || "underline-offset-[" + e + "]"
        );
      case "text-indent":
        return N(e, "indent");
      case "vertical-align":
        return (
          {
            baseline: "align-baseline",
            top: "align-top",
            middle: "align-middle",
            bottom: "align-bottom",
            "text-top": "align-text-top",
            "text-bottom": "align-text-bottom",
            sub: "align-sub",
            super: "align-super",
          }[e] || null
        );
      case "line-height": {
        const r = pt[e];
        if (r) return "leading-" + r;
        const n = Se(e);
        if (n !== null) {
          const l = pt[String(Math.round(n))];
          return l ? "leading-" + l : "leading-[" + Math.round(n) + "px]";
        }
        return "leading-[" + e + "]";
      }
      case "letter-spacing":
        return (
          {
            "-0.05em": "tracking-tighter",
            "-0.025em": "tracking-tight",
            0: "tracking-normal",
            "0em": "tracking-normal",
            "0.025em": "tracking-wide",
            "0.05em": "tracking-wider",
            "0.1em": "tracking-widest",
          }[e] || "tracking-[" + e + "]"
        );
      case "white-space":
        return (
          {
            normal: "whitespace-normal",
            nowrap: "whitespace-nowrap",
            pre: "whitespace-pre",
            "pre-line": "whitespace-pre-line",
            "pre-wrap": "whitespace-pre-wrap",
            "break-spaces": "whitespace-break-spaces",
          }[e] || null
        );
      case "word-break":
        return e === "break-all"
          ? "break-all"
          : e === "keep-all"
            ? "break-keep"
            : e === "normal"
              ? "break-normal"
              : null;
      case "overflow-wrap":
      case "word-wrap":
        return e === "break-word"
          ? "break-words"
          : e === "normal"
            ? "break-normal"
            : null;
      case "text-overflow":
        return e === "ellipsis"
          ? "text-ellipsis"
          : e === "clip"
            ? "text-clip"
            : null;
      case "hyphens":
        return (
          {
            none: "hyphens-none",
            manual: "hyphens-manual",
            auto: "hyphens-auto",
          }[e] || null
        );
      case "color":
        return K(e, "text");
      case "background-color":
        return K(e, "bg");
      case "border-color":
        return K(e, "border");
      case "border-top-color":
        return K(e, "border-t");
      case "border-right-color":
        return K(e, "border-r");
      case "border-bottom-color":
        return K(e, "border-b");
      case "border-left-color":
        return K(e, "border-l");
      case "outline-color":
        return K(e, "outline");
      case "text-decoration-color":
        return K(e, "decoration");
      case "accent-color":
        return K(e, "accent");
      case "caret-color":
        return K(e, "caret");
      case "fill":
        return K(e, "fill");
      case "stroke":
        return K(e, "stroke");
      case "background-image":
        return e === "none"
          ? "bg-none"
          : (e.startsWith("linear-gradient") &&
              (e.includes("to right") || e.includes("to bottom")),
            null);
      case "background-size":
        return (
          { cover: "bg-cover", contain: "bg-contain", auto: "bg-auto" }[e] ||
          null
        );
      case "background-position":
        return (
          {
            center: "bg-center",
            top: "bg-top",
            bottom: "bg-bottom",
            left: "bg-left",
            right: "bg-right",
            "left top": "bg-left-top",
            "left bottom": "bg-left-bottom",
            "right top": "bg-right-top",
            "right bottom": "bg-right-bottom",
          }[e] || null
        );
      case "background-repeat":
        return (
          {
            repeat: "bg-repeat",
            "no-repeat": "bg-no-repeat",
            "repeat-x": "bg-repeat-x",
            "repeat-y": "bg-repeat-y",
            round: "bg-repeat-round",
            space: "bg-repeat-space",
          }[e] || null
        );
      case "background-attachment":
        return (
          { fixed: "bg-fixed", local: "bg-local", scroll: "bg-scroll" }[e] ||
          null
        );
      case "background-clip":
        return (
          {
            "border-box": "bg-clip-border",
            "padding-box": "bg-clip-padding",
            "content-box": "bg-clip-content",
            text: "bg-clip-text",
          }[e] || null
        );
      case "background-origin":
        return (
          {
            "border-box": "bg-origin-border",
            "padding-box": "bg-origin-padding",
            "content-box": "bg-origin-content",
          }[e] || null
        );
      case "border-width":
        return (
          {
            0: "border-0",
            "0px": "border-0",
            "1px": "border",
            "2px": "border-2",
            "4px": "border-4",
            "8px": "border-8",
          }[e] || "border-[" + e + "]"
        );
      case "border-top-width":
        return (
          {
            0: "border-t-0",
            "0px": "border-t-0",
            "1px": "border-t",
            "2px": "border-t-2",
            "4px": "border-t-4",
            "8px": "border-t-8",
          }[e] || "border-t-[" + e + "]"
        );
      case "border-right-width":
        return (
          {
            0: "border-r-0",
            "0px": "border-r-0",
            "1px": "border-r",
            "2px": "border-r-2",
            "4px": "border-r-4",
            "8px": "border-r-8",
          }[e] || "border-r-[" + e + "]"
        );
      case "border-bottom-width":
        return (
          {
            0: "border-b-0",
            "0px": "border-b-0",
            "1px": "border-b",
            "2px": "border-b-2",
            "4px": "border-b-4",
            "8px": "border-b-8",
          }[e] || "border-b-[" + e + "]"
        );
      case "border-left-width":
        return (
          {
            0: "border-l-0",
            "0px": "border-l-0",
            "1px": "border-l",
            "2px": "border-l-2",
            "4px": "border-l-4",
            "8px": "border-l-8",
          }[e] || "border-l-[" + e + "]"
        );
      case "border-style":
        return (
          {
            solid: "border-solid",
            dashed: "border-dashed",
            dotted: "border-dotted",
            double: "border-double",
            hidden: "border-hidden",
            none: "border-none",
          }[e] || null
        );
      case "border-radius":
        return se(e, "rounded");
      case "border-top-left-radius":
        return se(e, "rounded-tl");
      case "border-top-right-radius":
        return se(e, "rounded-tr");
      case "border-bottom-right-radius":
        return se(e, "rounded-br");
      case "border-bottom-left-radius":
        return se(e, "rounded-bl");
      case "border-start-start-radius":
        return se(e, "rounded-ss");
      case "border-start-end-radius":
        return se(e, "rounded-se");
      case "border-end-start-radius":
        return se(e, "rounded-es");
      case "border-end-end-radius":
        return se(e, "rounded-ee");
      case "outline-style":
        return (
          {
            none: "outline-none",
            solid: "outline",
            dashed: "outline-dashed",
            dotted: "outline-dotted",
            double: "outline-double",
          }[e] || null
        );
      case "outline-width":
        return (
          {
            0: "outline-0",
            "0px": "outline-0",
            "1px": "outline-1",
            "2px": "outline-2",
            "4px": "outline-4",
            "8px": "outline-8",
          }[e] || "outline-[" + e + "]"
        );
      case "outline-offset":
        return (
          {
            0: "outline-offset-0",
            "0px": "outline-offset-0",
            "1px": "outline-offset-1",
            "2px": "outline-offset-2",
            "4px": "outline-offset-4",
            "8px": "outline-offset-8",
          }[e] || "outline-offset-[" + e + "]"
        );
      case "box-shadow":
        return e === "none"
          ? "shadow-none"
          : /^0\s+1px\s+2px\s+0\s+rgba?\(0,?\s*0,?\s*0,?\s*0\.05\)$/.test(e)
            ? "shadow-sm"
            : /^0\s+1px\s+3px\s+0\s+rgba?\(0,?\s*0,?\s*0,?\s*0\.1\),?\s*0\s+1px\s+2px\s+/.test(
                  e,
                )
              ? "shadow"
              : /^0\s+4px\s+6px\s+-1px\s+rgba?\(0,?\s*0,?\s*0,?\s*0\.1\),?\s*0\s+2px\s+4px\s+/.test(
                    e,
                  )
                ? "shadow-md"
                : /^0\s+10px\s+15px\s+-3px\s+/.test(e)
                  ? "shadow-lg"
                  : /^0\s+20px\s+25px\s+-5px\s+/.test(e)
                    ? "shadow-xl"
                    : /^0\s+25px\s+50px\s+-12px\s+/.test(e)
                      ? "shadow-2xl"
                      : "shadow-[" + e.replace(/\s+/g, "_") + "]";
      case "opacity": {
        const r = mr[e];
        return r
          ? "opacity-" + r
          : (Math.round(parseFloat(e) * 100), "opacity-[" + e + "]");
      }
      case "transform": {
        if (e === "none") return null;
        const r = [],
          n = e.match(/translateX\(([^)]+)\)/),
          l = e.match(/translateY\(([^)]+)\)/),
          c = e.match(/rotate\(([^)]+)\)/),
          u = e.match(/scale\(([^)]+)\)/),
          m = e.match(/scaleX\(([^)]+)\)/),
          s = e.match(/scaleY\(([^)]+)\)/),
          o = e.match(/skewX\(([^)]+)\)/),
          a = e.match(/skewY\(([^)]+)\)/);
        if (
          (n && r.push(N(n[1], "translate-x")),
          l && r.push(N(l[1], "translate-y")),
          c)
        ) {
          const i = c[1].replace("deg", "");
          r.push(
            {
              0: "rotate-0",
              1: "rotate-1",
              2: "rotate-2",
              3: "rotate-3",
              6: "rotate-6",
              12: "rotate-12",
              45: "rotate-45",
              90: "rotate-90",
              180: "rotate-180",
            }[i] || "rotate-[" + c[1] + "]",
          );
        }
        if (u) {
          const i = u[1];
          r.push(
            {
              0: "scale-0",
              0.5: "scale-50",
              ".5": "scale-50",
              0.75: "scale-75",
              ".75": "scale-75",
              0.9: "scale-90",
              ".9": "scale-90",
              0.95: "scale-95",
              ".95": "scale-95",
              1: "scale-100",
              1.05: "scale-105",
              1.1: "scale-110",
              1.25: "scale-125",
              1.5: "scale-150",
            }[i] || "scale-[" + i + "]",
          );
        }
        return (
          m && r.push("scale-x-[" + m[1] + "]"),
          s && r.push("scale-y-[" + s[1] + "]"),
          o && r.push("skew-x-[" + o[1] + "]"),
          a && r.push("skew-y-[" + a[1] + "]"),
          r.length === 0 ? null : r.filter(Boolean).join(" ")
        );
      }
      case "transform-origin":
        return (
          {
            center: "origin-center",
            top: "origin-top",
            "top right": "origin-top-right",
            right: "origin-right",
            "bottom right": "origin-bottom-right",
            bottom: "origin-bottom",
            "bottom left": "origin-bottom-left",
            left: "origin-left",
            "top left": "origin-top-left",
          }[e] || null
        );
      case "transition-property":
        return (
          {
            all: "transition-all",
            none: "transition-none",
            "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter":
              "transition",
            "color, background-color, border-color, text-decoration-color, fill, stroke":
              "transition-colors",
            opacity: "transition-opacity",
            "box-shadow": "transition-shadow",
            transform: "transition-transform",
          }[e] || null
        );
      case "transition-duration":
        return (
          {
            0: "duration-0",
            75: "duration-75",
            100: "duration-100",
            150: "duration-150",
            200: "duration-200",
            300: "duration-300",
            500: "duration-500",
            700: "duration-700",
            1e3: "duration-1000",
          }[e.replace("ms", "").replace("s", "000")] || "duration-[" + e + "]"
        );
      case "transition-timing-function":
        return (
          {
            linear: "ease-linear",
            ease: "ease-out",
            "ease-in": "ease-in",
            "ease-out": "ease-out",
            "ease-in-out": "ease-in-out",
            "cubic-bezier(0, 0, 0.2, 1)": "ease-out",
            "cubic-bezier(0.4, 0, 1, 1)": "ease-in",
            "cubic-bezier(0.4, 0, 0.2, 1)": "ease-in-out",
          }[e] || null
        );
      case "transition-delay":
        return (
          {
            0: "delay-0",
            75: "delay-75",
            100: "delay-100",
            150: "delay-150",
            200: "delay-200",
            300: "delay-300",
            500: "delay-500",
            700: "delay-700",
            1e3: "delay-1000",
          }[e.replace("ms", "").replace("s", "000")] || "delay-[" + e + "]"
        );
      case "cursor":
        return (
          {
            auto: "cursor-auto",
            default: "cursor-default",
            pointer: "cursor-pointer",
            wait: "cursor-wait",
            text: "cursor-text",
            move: "cursor-move",
            help: "cursor-help",
            "not-allowed": "cursor-not-allowed",
            none: "cursor-none",
            "context-menu": "cursor-context-menu",
            progress: "cursor-progress",
            cell: "cursor-cell",
            crosshair: "cursor-crosshair",
            "vertical-text": "cursor-vertical-text",
            alias: "cursor-alias",
            copy: "cursor-copy",
            "no-drop": "cursor-no-drop",
            grab: "cursor-grab",
            grabbing: "cursor-grabbing",
            "all-scroll": "cursor-all-scroll",
            "col-resize": "cursor-col-resize",
            "row-resize": "cursor-row-resize",
            "n-resize": "cursor-n-resize",
            "e-resize": "cursor-e-resize",
            "s-resize": "cursor-s-resize",
            "w-resize": "cursor-w-resize",
            "ne-resize": "cursor-ne-resize",
            "nw-resize": "cursor-nw-resize",
            "se-resize": "cursor-se-resize",
            "sw-resize": "cursor-sw-resize",
            "ew-resize": "cursor-ew-resize",
            "ns-resize": "cursor-ns-resize",
            "nesw-resize": "cursor-nesw-resize",
            "nwse-resize": "cursor-nwse-resize",
            "zoom-in": "cursor-zoom-in",
            "zoom-out": "cursor-zoom-out",
          }[e] || null
        );
      case "pointer-events":
        return (
          { none: "pointer-events-none", auto: "pointer-events-auto" }[e] ||
          null
        );
      case "user-select":
        return (
          {
            none: "select-none",
            text: "select-text",
            all: "select-all",
            auto: "select-auto",
          }[e] || null
        );
      case "list-style-type":
        return (
          { none: "list-none", disc: "list-disc", decimal: "list-decimal" }[
            e
          ] || "list-[" + e + "]"
        );
      case "list-style-position":
        return { inside: "list-inside", outside: "list-outside" }[e] || null;
      case "object-fit":
        return (
          {
            contain: "object-contain",
            cover: "object-cover",
            fill: "object-fill",
            none: "object-none",
            "scale-down": "object-scale-down",
          }[e] || null
        );
      case "object-position":
        return (
          {
            center: "object-center",
            top: "object-top",
            bottom: "object-bottom",
            left: "object-left",
            right: "object-right",
            "left top": "object-left-top",
            "left bottom": "object-left-bottom",
            "right top": "object-right-top",
            "right bottom": "object-right-bottom",
          }[e] || null
        );
      case "aspect-ratio":
        return (
          {
            auto: "aspect-auto",
            "1 / 1": "aspect-square",
            "1/1": "aspect-square",
            "16 / 9": "aspect-video",
            "16/9": "aspect-video",
          }[e] || "aspect-[" + e.replace(/\s*\/\s*/, "/") + "]"
        );
      case "appearance":
        return e === "none"
          ? "appearance-none"
          : e === "auto"
            ? "appearance-auto"
            : null;
      case "resize":
        return (
          {
            none: "resize-none",
            both: "resize",
            vertical: "resize-y",
            horizontal: "resize-x",
          }[e] || null
        );
      case "scroll-behavior":
        return { auto: "scroll-auto", smooth: "scroll-smooth" }[e] || null;
      case "touch-action":
        return (
          {
            auto: "touch-auto",
            none: "touch-none",
            manipulation: "touch-manipulation",
            "pan-x": "touch-pan-x",
            "pan-y": "touch-pan-y",
            "pan-left": "touch-pan-left",
            "pan-right": "touch-pan-right",
            "pan-up": "touch-pan-up",
            "pan-down": "touch-pan-down",
            "pinch-zoom": "touch-pinch-zoom",
          }[e] || null
        );
      case "will-change":
        return (
          {
            auto: "will-change-auto",
            "scroll-position": "will-change-scroll",
            contents: "will-change-contents",
            transform: "will-change-transform",
          }[e] || null
        );
      case "columns":
        return (
          {
            1: "columns-1",
            2: "columns-2",
            3: "columns-3",
            4: "columns-4",
            5: "columns-5",
            6: "columns-6",
            7: "columns-7",
            8: "columns-8",
            9: "columns-9",
            10: "columns-10",
            11: "columns-11",
            12: "columns-12",
            auto: "columns-auto",
          }[e] || null
        );
      case "break-inside":
        return (
          {
            auto: "break-inside-auto",
            avoid: "break-inside-avoid",
            "avoid-page": "break-inside-avoid-page",
            "avoid-column": "break-inside-avoid-column",
          }[e] || null
        );
      case "break-before":
        return (
          {
            auto: "break-before-auto",
            avoid: "break-before-avoid",
            all: "break-before-all",
            "avoid-page": "break-before-avoid-page",
            page: "break-before-page",
            left: "break-before-left",
            right: "break-before-right",
            column: "break-before-column",
          }[e] || null
        );
      case "break-after":
        return (
          {
            auto: "break-after-auto",
            avoid: "break-after-avoid",
            all: "break-after-all",
            "avoid-page": "break-after-avoid-page",
            page: "break-after-page",
            left: "break-after-left",
            right: "break-after-right",
            column: "break-after-column",
          }[e] || null
        );
      case "filter": {
        if (e === "none") return null;
        const r = [],
          n = e.match(/blur\((\d+)px\)/);
        n &&
          r.push(
            {
              0: "blur-none",
              4: "blur-sm",
              8: "blur",
              12: "blur-md",
              16: "blur-lg",
              24: "blur-xl",
              40: "blur-2xl",
              64: "blur-3xl",
            }[n[1]] || "blur-[" + n[1] + "px]",
          );
        const l = e.match(/brightness\(([\d.]+)\)/);
        if (l) {
          const o = Math.round(parseFloat(l[1]) * 100);
          r.push(
            {
              0: "brightness-0",
              50: "brightness-50",
              75: "brightness-75",
              90: "brightness-90",
              95: "brightness-95",
              100: "brightness-100",
              105: "brightness-105",
              110: "brightness-110",
              125: "brightness-125",
              150: "brightness-150",
              200: "brightness-200",
            }[String(o)] || "brightness-[" + l[1] + "]",
          );
        }
        const c = e.match(/grayscale\(([\d.]+%?)\)/);
        c &&
          (c[1] === "1" || c[1] === "100%"
            ? r.push("grayscale")
            : (c[1] === "0" || c[1] === "0%") && r.push("grayscale-0"));
        const u = e.match(/invert\(([\d.]+%?)\)/);
        u &&
          (u[1] === "1" || u[1] === "100%"
            ? r.push("invert")
            : (u[1] === "0" || u[1] === "0%") && r.push("invert-0"));
        const m = e.match(/saturate\(([\d.]+)\)/);
        if (m) {
          const o = Math.round(parseFloat(m[1]) * 100);
          r.push(
            {
              0: "saturate-0",
              50: "saturate-50",
              100: "saturate-100",
              150: "saturate-150",
              200: "saturate-200",
            }[String(o)] || "saturate-[" + m[1] + "]",
          );
        }
        const s = e.match(/sepia\(([\d.]+%?)\)/);
        return (
          s &&
            (s[1] === "1" || s[1] === "100%"
              ? r.push("sepia")
              : (s[1] === "0" || s[1] === "0%") && r.push("sepia-0")),
          r.length === 0 ? null : r.join(" ")
        );
      }
      case "backdrop-filter": {
        if (e === "none") return null;
        const r = [],
          n = e.match(/blur\((\d+)px\)/);
        n &&
          r.push(
            {
              0: "backdrop-blur-none",
              4: "backdrop-blur-sm",
              8: "backdrop-blur",
              12: "backdrop-blur-md",
              16: "backdrop-blur-lg",
              24: "backdrop-blur-xl",
              40: "backdrop-blur-2xl",
              64: "backdrop-blur-3xl",
            }[n[1]] || "backdrop-blur-[" + n[1] + "px]",
          );
        const l = e.match(/brightness\(([\d.]+)\)/);
        if (l) {
          const u = Math.round(parseFloat(l[1]) * 100);
          r.push("backdrop-brightness-[" + u + "]");
        }
        const c = e.match(/saturate\(([\d.]+)\)/);
        if (c) {
          const u = Math.round(parseFloat(c[1]) * 100);
          r.push("backdrop-saturate-[" + u + "]");
        }
        return r.length === 0 ? null : r.join(" ");
      }
      case "mix-blend-mode":
        return (
          {
            normal: "mix-blend-normal",
            multiply: "mix-blend-multiply",
            screen: "mix-blend-screen",
            overlay: "mix-blend-overlay",
            darken: "mix-blend-darken",
            lighten: "mix-blend-lighten",
            "color-dodge": "mix-blend-color-dodge",
            "color-burn": "mix-blend-color-burn",
            "hard-light": "mix-blend-hard-light",
            "soft-light": "mix-blend-soft-light",
            difference: "mix-blend-difference",
            exclusion: "mix-blend-exclusion",
            hue: "mix-blend-hue",
            saturation: "mix-blend-saturation",
            color: "mix-blend-color",
            luminosity: "mix-blend-luminosity",
            "plus-lighter": "mix-blend-plus-lighter",
          }[e] || null
        );
      case "isolation":
        return e === "isolate"
          ? "isolate"
          : e === "auto"
            ? "isolation-auto"
            : null;
      case "border-collapse":
        return (
          { collapse: "border-collapse", separate: "border-separate" }[e] ||
          null
        );
      case "border-spacing":
        return N(e, "border-spacing");
      case "table-layout":
        return { auto: "table-auto", fixed: "table-fixed" }[e] || null;
      case "caption-side":
        return { top: "caption-top", bottom: "caption-bottom" }[e] || null;
      case "content":
        return e === "none" || e === '""' || e === "''" ? "content-none" : null;
      case "box-sizing":
        return null;
      case "stroke-width":
        return (
          { 0: "stroke-0", 1: "stroke-1", 2: "stroke-2" }[e] ||
          "stroke-[" + e + "]"
        );
      case "float":
        return (
          {
            right: "float-right",
            left: "float-left",
            none: "float-none",
            "inline-start": "float-start",
            "inline-end": "float-end",
          }[e] || null
        );
      case "clear":
        return (
          {
            left: "clear-left",
            right: "clear-right",
            both: "clear-both",
            none: "clear-none",
            "inline-start": "clear-start",
            "inline-end": "clear-end",
          }[e] || null
        );
      case "container-type":
        return (
          {
            normal: "container-normal",
            size: "container-size",
            "inline-size": "container-inline-size",
          }[e] || null
        );
      case "box-decoration-break":
      case "-webkit-font-smoothing":
      case "-moz-osx-font-smoothing":
      case "-webkit-tap-highlight-color":
      case "-webkit-text-size-adjust":
        return null;
      default:
        return null;
    }
  }
  function br(t) {
    const e = [],
      r = [];
    for (const { prop: n, value: l } of t) {
      const c = mt(n, l);
      c
        ? e.push(...c.split(" ").filter(Boolean))
        : c === null && n && l && r.push({ prop: n, value: l });
    }
    return { classes: [...new Set(e)], unmapped: r };
  }
  function yr(t) {
    if (!t || typeof postcss > "u") return [];
    let e;
    try {
      e = postcss.parse(t, { from: void 0 });
    } catch (n) {
      return (
        console.warn(
          "[Web Inspector] parseScopedCss: PostCSS parse failed:",
          n.message,
        ),
        []
      );
    }
    const r = {};
    return (
      e.walkRules((n) => {
        for (const l of n.selectors) {
          const c = l.match(
            /^\.(c-\d+)(:(hover|focus|focus-visible|focus-within|active|disabled|visited|first-child|last-child|odd|even|placeholder))?$/,
          );
          if (!c) continue;
          const u = c[1],
            m = c[3] || "base";
          r[u] ||
            (r[u] = {
              className: u,
              base: [],
              hover: [],
              focus: [],
              "focus-visible": [],
              "focus-within": [],
              active: [],
              disabled: [],
              visited: [],
              "first-child": [],
              "last-child": [],
              odd: [],
              even: [],
              placeholder: [],
            });
          const s = r[u][m] || r[u].base;
          n.walkDecls((o) => {
            s.push({ prop: o.prop, value: o.value });
          });
        }
      }),
      Object.values(r)
    );
  }
  var wr = {
    base: "",
    hover: "hover:",
    focus: "focus:",
    "focus-visible": "focus-visible:",
    "focus-within": "focus-within:",
    active: "active:",
    disabled: "disabled:",
    visited: "visited:",
    "first-child": "first:",
    "last-child": "last:",
    odd: "odd:",
    even: "even:",
    placeholder: "placeholder:",
  };
  function xr(t) {
    const e = [],
      r = [];
    for (const [l, c] of Object.entries(t)) {
      if (l === "className" || !Array.isArray(c) || c.length === 0) continue;
      const u = wr[l] || "",
        { classes: m, unmapped: s } = br(c);
      for (const o of m) e.push(u ? u + o : o);
      if (s.length > 0) {
        const o = l === "base" ? "" : ":" + l;
        for (const { prop: a, value: i } of s)
          r.push({ selector: "." + t.className + o, prop: a, value: i });
      }
    }
    let n = "";
    if (r.length > 0) {
      const l = {};
      for (const { selector: c, prop: u, value: m } of r)
        (l[c] || (l[c] = []), l[c].push(`  ${u}: ${m};`));
      for (const [c, u] of Object.entries(l))
        n += `${c} {
${u.join(`
`)}
}
`;
    }
    return { className: t.className, tailwindClasses: e, unmappedCSS: n };
  }
  function Ar(t, e) {
    if (!t || !e) return { tailwindHtml: t || "", fallbackCSS: "" };
    const r = yr(e);
    if (r.length === 0) return { tailwindHtml: t, fallbackCSS: "" };
    const n = {};
    let l = "";
    for (const u of r) {
      const m = xr(u);
      ((n[u.className] = m.tailwindClasses),
        m.unmappedCSS && (l += m.unmappedCSS));
    }
    let c = t;
    return (
      (c = c.replace(/\bclass="([^"]*)"/g, (u, m) => {
        const s = m.split(/\s+/).filter(Boolean),
          o = [];
        for (const i of s)
          n[i] ? o.push(...n[i]) : /^c-\d+$/.test(i) || o.push(i);
        const a = [...new Set(o)];
        return a.length > 0 ? `class="${a.join(" ")}"` : "";
      })),
      { tailwindHtml: c, fallbackCSS: l }
    );
  }
  function Cr(t, e) {
    let r = t;
    return (
      e &&
        e.trim() &&
        (r +=
          `

<style>
` +
          e.trim() +
          `
</style>`),
      r
    );
  }
  function gt(t, e) {
    let r = `<template>
`;
    return (
      (r +=
        "  " +
        t.split(`
`).join(`
  `)),
      (r += `
</template>`),
      e &&
        e.trim() &&
        (r +=
          `

<style scoped>
` +
          e.trim() +
          `
</style>`),
      r
    );
  }
  function vr(t) {
    let e = t;
    return (
      (e = e.replace(/\bclass="/g, 'className="')),
      (e = e.replace(/\bfor="/g, 'htmlFor="')),
      (e = e.replace(/\btabindex="/g, 'tabIndex="')),
      (e = e.replace(/\bcolspan="/g, 'colSpan="')),
      (e = e.replace(/\browspan="/g, 'rowSpan="')),
      (e = e.replace(/\bmaxlength="/g, 'maxLength="')),
      (e = e.replace(/\bminlength="/g, 'minLength="')),
      (e = e.replace(/\breadonly\b/g, "readOnly")),
      (e = e.replace(/\bautocomplete="/g, 'autoComplete="')),
      (e = e.replace(
        /<(img|input|br|hr|area|base|col|embed|link|meta|param|source|track|wbr)([^>]*?)(?<!\/)>/g,
        "<$1$2 />",
      )),
      (e = e.replace(
        /\bstyle="([^"]*)"/g,
        (r, n) =>
          `style={{ ${n
            .split(";")
            .filter((l) => l.trim())
            .map((l) => {
              const [c, ...u] = l.split(":");
              if (!c || u.length === 0) return null;
              const m = c.trim(),
                s = u.join(":").trim();
              return `${m.replace(/-([a-z])/g, (o, a) => a.toUpperCase())}: "${s}"`;
            })
            .filter(Boolean)
            .join(", ")} }}`,
      )),
      e
    );
  }
  function bt(t, e) {
    const r = vr(t),
      n = "    ";
    let l = `export default function ExtractedComponent() {
`;
    return (
      (l += `  return (
`),
      (l +=
        n +
        r
          .split(
            `
`,
          )
          .join(
            `
` + n,
          )),
      (l += `
  );
`),
      (l += "}"),
      e &&
        e.trim() &&
        (l +=
          `

/* Fallback CSS \u2014 add to your stylesheet */
/*
` +
          e.trim() +
          `
*/`),
      l
    );
  }
  function Sr(t) {
    t.startsWith("#") && (t = t.slice(1));
    const e = parseInt(t.substring(0, 2), 16) / 255,
      r = parseInt(t.substring(2, 4), 16) / 255,
      n = parseInt(t.substring(4, 6), 16) / 255,
      l = Math.max(e, r, n),
      c = Math.min(e, r, n);
    let u,
      m,
      s = (l + c) / 2;
    if (l === c) u = m = 0;
    else {
      const o = l - c;
      switch (((m = s > 0.5 ? o / (2 - l - c) : o / (l + c)), l)) {
        case e:
          u = (r - n) / o + (r < n ? 6 : 0);
          break;
        case r:
          u = (n - e) / o + 2;
          break;
        case n:
          u = (e - r) / o + 4;
          break;
      }
      u /= 6;
    }
    return [Math.round(u * 360), Math.round(m * 100), Math.round(s * 100)];
  }
  function kr(t) {
    const [e, r, n] = Sr(t);
    return r < 10
      ? n < 10
        ? "black"
        : n > 90
          ? "white"
          : "neutral"
      : e >= 100 && e <= 140
        ? "success"
        : e >= 340 || e <= 20
          ? "error"
          : e >= 40 && e <= 60
            ? "warning"
            : e >= 200 && e <= 260
              ? "info"
              : "generic";
  }
  function Er() {
    const t = {
      background: new Map(),
      text: new Map(),
      border: new Map(),
      all: new Map(),
    };
    try {
      Array.from(document.styleSheets).forEach((e) => {
        try {
          Array.from(e.cssRules || []).forEach((r) => {
            r.selectorText &&
              r.style &&
              r.selectorText
                .split(",")
                .map((n) => n.trim())
                .forEach((n) => {
                  const l = n.match(/\.([a-zA-Z][\w-]*)/g);
                  l &&
                    l.forEach((c) => {
                      const u = c.substring(1),
                        m = r.style.backgroundColor || r.style.background;
                      if (m && !m.includes("gradient") && !m.includes("url")) {
                        const a = G(m);
                        a &&
                          (t.background.set(u, a),
                          t.all.set(u, {
                            property: "background",
                            hex: a,
                            selector: n,
                          }));
                      }
                      const s = r.style.color;
                      if (s) {
                        const a = G(s);
                        a &&
                          (t.text.set(u, a),
                          t.all.has(u) ||
                            t.all.set(u, {
                              property: "color",
                              hex: a,
                              selector: n,
                            }));
                      }
                      const o = r.style.borderColor || r.style.border;
                      if (o && !o.includes("none")) {
                        const a = G(o);
                        a &&
                          (t.border.set(u, a),
                          t.all.has(u) ||
                            t.all.set(u, {
                              property: "border",
                              hex: a,
                              selector: n,
                            }));
                      }
                    });
                });
          });
        } catch (r) {
          console.warn("Could not access stylesheet:", r);
        }
      });
    } catch (e) {
      console.error("Error extracting CSS class colors:", e);
    }
    return t;
  }
  function Fr(t) {
    const e = {
        primary: [],
        secondary: [],
        success: [],
        error: [],
        warning: [],
        info: [],
        neutral: [],
        named: [],
      },
      r = {
        greens: /apple|kale|cucumber|avocado|lime|mint|sage|basil|pistachio/i,
        blues: /blueberry|cornflower|ocean|sky|navy|azure|cobalt/i,
        reds: /plum|strawberry|cherry|rose|radish|raspberry|cranberry|dragonfruit/i,
        yellows:
          /cavendish|banana|lemon|butterscotch|apricot|pumpkin|yam|squash/i,
        neutrals:
          /black|white|gray|grey|charcoal|coal|slate|stone|peppercorn|oyster|tuna|basmati|parsnip|jasmine|coconut|portobello/i,
        dark: /dark|charred|deep/i,
        light: /light|pale|soft/i,
        accessible: /accessible/i,
      };
    return (
      t.all.forEach((n, l) => {
        const c = l.toLowerCase(),
          u = n.hex;
        let m = !1;
        (c.includes("primary") || c.includes("brand")
          ? (e.primary.push({ className: l, hex: u, ...n }), (m = !0))
          : c.includes("secondary") || c.includes("accent")
            ? (e.secondary.push({ className: l, hex: u, ...n }), (m = !0))
            : c.includes("success")
              ? (e.success.push({ className: l, hex: u, ...n }), (m = !0))
              : c.includes("error") || c.includes("danger")
                ? (e.error.push({ className: l, hex: u, ...n }), (m = !0))
                : c.includes("warning")
                  ? (e.warning.push({ className: l, hex: u, ...n }), (m = !0))
                  : c.includes("info") &&
                    (e.info.push({ className: l, hex: u, ...n }), (m = !0)),
          m ||
            (r.neutrals.test(c)
              ? e.neutral.push({ className: l, hex: u, ...n })
              : r.greens.test(c)
                ? e.success.push({ className: l, hex: u, ...n, inferred: !0 })
                : r.blues.test(c)
                  ? e.info.push({ className: l, hex: u, ...n, inferred: !0 })
                  : r.reds.test(c)
                    ? e.error.push({ className: l, hex: u, ...n, inferred: !0 })
                    : r.yellows.test(c)
                      ? e.warning.push({
                          className: l,
                          hex: u,
                          ...n,
                          inferred: !0,
                        })
                      : e.named.push({ className: l, hex: u, ...n })));
      }),
      e
    );
  }
  function yt() {
    const t = { semantic: {}, obfuscated: {}, all: {} };
    try {
      Array.from(document.styleSheets).forEach((e) => {
        try {
          Array.from(e.cssRules || []).forEach((r) => {
            if (r.selectorText === ":root" || r.style) {
              const n = r.style;
              for (let l = 0; l < n.length; l++) {
                const c = n[l];
                if (c.startsWith("--")) {
                  const u = n.getPropertyValue(c).trim();
                  ((t.all[c] = u),
                    Mr(c) ? (t.semantic[c] = u) : (t.obfuscated[c] = u));
                }
              }
            }
          });
        } catch (r) {
          console.warn("Could not access stylesheet:", r);
        }
      });
    } catch (e) {
      console.error("Error extracting CSS variables:", e);
    }
    return t;
  }
  function Mr(t) {
    const e = t.substring(2),
      r = [
        "color-",
        "text-",
        "bg-",
        "background-",
        "border-",
        "font-",
        "size-",
        "space-",
        "spacing-",
        "radius-",
        "shadow-",
        "width-",
        "height-",
        "opacity-",
        "z-",
        "transition-",
        "duration-",
        "primary-",
        "secondary-",
        "accent-",
        "neutral-",
        "success-",
        "error-",
        "warning-",
        "info-",
        "surface-",
        "container-",
        "muted-",
        "inverse-",
        "voyager-",
        "data-viz-",
      ].some((l) => e.startsWith(l)),
      n =
        /^_[0-9a-f]{6,}$/i.test(e) ||
        /^[0-9a-f]{6,}$/i.test(e) ||
        /^_[\w]{8,}$/i.test(e);
    return r && !n;
  }
  function Tr() {
    const t = [],
      e = document.documentElement.outerHTML,
      r = Array.from(document.querySelectorAll("script[src]")).map((o) =>
        o.src.toLowerCase(),
      ),
      n = Array.from(document.querySelectorAll("script:not([src])"))
        .map((o) => o.textContent || "")
        .join(" "),
      l = Array.from(document.querySelectorAll("link")),
      c = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(
        (o) => (o.href || "").toLowerCase(),
      ),
      u = document.querySelector('meta[name="generator"]')?.content || "",
      m = (() => {
        if (!document.querySelector("*")) return !1;
        const o = document.querySelectorAll("body *");
        for (let a = 0; a < Math.min(o.length, 50); a++) {
          const i = o[a].attributes;
          for (let p = 0; p < i.length; p++)
            if (/^data-v-[a-f0-9]+$/.test(i[p].name)) return !0;
        }
        return !1;
      })(),
      s = (o, a) => {
        t.find((i) => i.name === o) || t.push({ name: o, category: a });
      };
    return (
      (window.__NEXT_DATA__ || document.getElementById("__next")) &&
        s("Next.js", "framework"),
      (window.__NUXT__ ||
        window.__nuxt__ ||
        document.getElementById("__nuxt") ||
        e.includes("__NUXT_DATA__") ||
        r.some((o) => /\/_nuxt\//.test(o))) &&
        s("Nuxt.js", "framework"),
      (document.querySelector("[data-reactroot]") ||
        document.querySelector("[data-reactid]") ||
        e.includes("_reactRootContainer") ||
        r.some((o) => /react(?:\.|-dom)/i.test(o))) &&
        s("React", "framework"),
      (document.querySelector("[ng-version]") ||
        document.querySelector("[ng-app]") ||
        document.querySelector("app-root")) &&
        s("Angular", "framework"),
      (window.__VUE__ ||
        m ||
        document.querySelector("#app[data-server-rendered]") ||
        r.some((o) => /vue(?:\.min)?\.(?:global\.)?js/i.test(o))) &&
        s("Vue.js", "framework"),
      (document.querySelector("[data-svelte-h]") || e.includes("__svelte")) &&
        s("Svelte", "framework"),
      (window.Ember ||
        document.querySelector(".ember-view") ||
        document.querySelector('[id^="ember"]')) &&
        s("Ember.js", "framework"),
      (r.some((o) => /alpine/i.test(o)) ||
        document.querySelector("[x-data]")) &&
        s("Alpine.js", "framework"),
      (r.some((o) => /jquery/i.test(o)) ||
        window.jQuery ||
        window.$?.fn?.jquery) &&
        s("jQuery", "library"),
      (r.some((o) => /gsap/i.test(o)) || window.gsap || window.TweenMax) &&
        s("GSAP", "library"),
      (r.some((o) => /three(?:\.min)?\.js/i.test(o)) || window.THREE) &&
        s("Three.js", "library"),
      (r.some((o) => /htmx/i.test(o)) ||
        document.querySelector("[hx-get],[hx-post]")) &&
        s("htmx", "library"),
      (window.Astro ||
        document.querySelector("[data-astro-cid]") ||
        e.includes("astro-island")) &&
        s("Astro", "framework"),
      (document.querySelector('meta[name="generator"][content*="Gatsby"]') ||
        window.___gatsby) &&
        s("Gatsby", "framework"),
      document.querySelector('meta[name="generator"][content*="Hugo"]') &&
        s("Hugo", "framework"),
      document.querySelector('meta[name="generator"][content*="Jekyll"]') &&
        s("Jekyll", "framework"),
      (document.querySelector('meta[name="generator"][content*="Eleventy"]') ||
        document.querySelector('meta[name="generator"][content*="11ty"]')) &&
        s("Eleventy", "framework"),
      (r.some((o) => /remix/i.test(o)) || window.__remixContext) &&
        s("Remix", "framework"),
      (r.some((o) => /solid/i.test(o)) || window._$HY) &&
        s("SolidJS", "framework"),
      (window.Ext || r.some((o) => /ext-all|extjs|sencha/i.test(o))) &&
        s("ExtJS", "framework"),
      (l.some((o) => /bootstrap/i.test(o.href || "")) ||
        r.some((o) => /bootstrap/i.test(o)) ||
        document.querySelector(
          ".container-fluid,.row .col-md-6,.btn.btn-primary",
        )) &&
        s("Bootstrap", "css"),
      (c.some((o) => /tailwind/i.test(o)) ||
        (() => {
          const o = Array.from(document.styleSheets);
          for (const f of o)
            try {
              if (
                f.cssRules?.[0]?.cssText?.includes("tailwindcss") ||
                f.cssRules?.[0]?.cssText?.includes("--tw-")
              )
                return !0;
            } catch {}
          const a = document.querySelectorAll("body [class]");
          let i = 0;
          const p =
            /\b(flex|grid|items-center|justify-between|gap-\d|px-\d|py-\d|text-sm|text-lg|rounded-lg|bg-white|bg-gray|font-bold|font-medium|space-[xy]-\d|w-full|h-full|max-w-|min-h-)\b/;
          for (let f = 0; f < Math.min(a.length, 30); f++)
            if ((p.test(a[f].className) && i++, i >= 3)) return !0;
          return !1;
        })()) &&
        s("Tailwind CSS", "css"),
      document.querySelector('[class*="chakra-"]') && s("Chakra UI", "css"),
      document.querySelector(
        '[class*="MuiBox"],[class*="MuiButton"],[class*="css-"][class*="Mui"]',
      ) && s("Material UI", "css"),
      document.querySelector('[class*="ant-btn"],[class*="ant-layout"]') &&
        s("Ant Design", "css"),
      (l.some((o) => /bulma/i.test(o.href || "")) ||
        document.querySelector(".hero.is-primary,.box .content")) &&
        s("Bulma", "css"),
      l.some((o) => /foundation/i.test(o.href || "")) && s("Foundation", "css"),
      (document.querySelector('[class*="radix-"]') ||
        r.some((o) => /radix/i.test(o))) &&
        s("Radix UI", "css"),
      (document.querySelector('[class*="shadcn"],[data-slot]') ||
        e.includes("shadcn")) &&
        s("shadcn/ui", "css"),
      (u.includes("WordPress") ||
        document.querySelector('link[href*="wp-content"]') ||
        r.some((o) => o.includes("wp-includes") || o.includes("wp-content"))) &&
        s("WordPress", "cms"),
      (window.Shopify ||
        document.querySelector('meta[name="shopify-digital-wallet"]') ||
        r.some((o) => /shopify|cdn\.shopify/i.test(o))) &&
        s("Shopify", "cms"),
      (document.querySelector('meta[name="generator"][content*="Drupal"]') ||
        window.Drupal) &&
        s("Drupal", "cms"),
      document.querySelector('meta[name="generator"][content*="Joomla"]') &&
        s("Joomla", "cms"),
      (window.Webflow ||
        document.querySelector("html.w-mod-js") ||
        document.querySelector("[data-wf-site]")) &&
        s("Webflow", "cms"),
      (document.querySelector('meta[name="generator"][content*="Wix"]') ||
        r.some((o) => /wix/i.test(o)) ||
        document.querySelector('[id*="wix"]')) &&
        s("Wix", "cms"),
      (r.some((o) => /squarespace/i.test(o)) ||
        document.querySelector(".sqs-block")) &&
        s("Squarespace", "cms"),
      document.querySelector('meta[name="generator"][content*="Ghost"]') &&
        s("Ghost", "cms"),
      (window.__framer_importFromPackage ||
        document.querySelector("[data-framer-name]")) &&
        s("Framer", "cms"),
      (e.includes("medium.com") ||
        document.querySelector(
          'meta[property="al:android:package"][content="com.medium.reader"]',
        ) ||
        document.querySelector('link[href*="medium.com"]')) &&
        s("Medium", "cms"),
      (document.querySelector(
        'meta[name="generator"][content*="Contentful"]',
      ) ||
        r.some((o) => /contentful/i.test(o))) &&
        s("Contentful", "cms"),
      (r.some((o) => /prismic/i.test(o)) ||
        document.querySelector('meta[name="generator"][content*="Prismic"]')) &&
        s("Prismic", "cms"),
      (r.some((o) => /sanity/i.test(o)) || window.sanity) && s("Sanity", "cms"),
      r.some((o) => /storyblok/i.test(o)) && s("Storyblok", "cms"),
      r.some((o) => /strapi/i.test(o)) && s("Strapi", "cms"),
      (r.some((o) => /google.*analytics|gtag/i.test(o)) ||
        window.gtag ||
        window.ga) &&
        s("Google Analytics", "analytics"),
      (r.some((o) => /googletagmanager/i.test(o)) ||
        window.google_tag_manager) &&
        s("Google Tag Manager", "analytics"),
      (r.some((o) =>
        /va\.vercel-scripts|vercel.*analytics|vitals\.vercel-insights/i.test(o),
      ) ||
        (n.includes("vercel") && n.includes("analytics"))) &&
        s("Vercel Analytics", "analytics"),
      (r.some((o) => /hotjar/i.test(o)) || window.hj) &&
        s("Hotjar", "analytics"),
      (r.some((o) => /segment/i.test(o)) || window.analytics?.identify) &&
        s("Segment", "analytics"),
      (r.some((o) => /hubspot/i.test(o)) || window._hsq) &&
        s("HubSpot", "analytics"),
      (r.some((o) => /clarity\.ms/i.test(o)) || window.clarity) &&
        s("Microsoft Clarity", "analytics"),
      (r.some((o) => /mixpanel/i.test(o)) || window.mixpanel) &&
        s("Mixpanel", "analytics"),
      r.some((o) => /plausible/i.test(o)) && s("Plausible", "analytics"),
      (r.some((o) => /amplitude/i.test(o)) || window.amplitude) &&
        s("Amplitude", "analytics"),
      (r.some((o) => /heap.*analytics/i.test(o)) || window.heap) &&
        s("Heap", "analytics"),
      (r.some((o) => /posthog/i.test(o)) || window.posthog) &&
        s("PostHog", "analytics"),
      (r.some((o) => /facebook.*pixel|fbevents|connect\.facebook/i.test(o)) ||
        window.fbq) &&
        s("Meta Pixel", "analytics"),
      (r.some((o) => /sentry/i.test(o)) || window.__SENTRY__) &&
        s("Sentry", "tools"),
      (r.some((o) => /intercom/i.test(o)) || window.Intercom) &&
        s("Intercom", "tools"),
      (r.some((o) => /crisp/i.test(o)) || window.$crisp) && s("Crisp", "tools"),
      (r.some((o) => /stripe/i.test(o)) || window.Stripe) &&
        s("Stripe", "tools"),
      (r.some((o) => /algolia|algoliasearch/i.test(o)) ||
        window.algoliasearch) &&
        s("Algolia", "tools"),
      r.some((o) => /auth0/i.test(o)) && s("Auth0", "tools"),
      (r.some((o) => /supabase/i.test(o)) || window.supabase) &&
        s("Supabase", "tools"),
      (r.some((o) => /firebase/i.test(o)) || window.firebase) &&
        s("Firebase", "tools"),
      (r.some((o) => /recaptcha/i.test(o)) ||
        document.querySelector(".g-recaptcha")) &&
        s("reCAPTCHA", "tools"),
      (r.some((o) => /hcaptcha/i.test(o)) ||
        document.querySelector(".h-captcha")) &&
        s("hCaptcha", "tools"),
      r.some((o) => /cookiebot|usercentrics|onetrust|cookieconsent/i.test(o)) &&
        s("Cookie Consent", "tools"),
      (r.some((o) => /lazysizes|lozad/i.test(o)) ||
        document.querySelector('img[loading="lazy"],.lazyload')) &&
        s("Lazy Loading", "tools"),
      (r.some((o) => /datadog/i.test(o)) || window.DD_RUM) &&
        s("Datadog", "tools"),
      (r.some((o) => /logrocket/i.test(o)) || window.LogRocket) &&
        s("LogRocket", "tools"),
      (l.some((o) => /fonts\.googleapis\.com/i.test(o.href || "")) ||
        l.some((o) => /fonts\.gstatic\.com/i.test(o.href || ""))) &&
        s("Google Fonts", "fonts"),
      (l.some((o) => /use\.typekit\.net|p\.typekit\.net/i.test(o.href || "")) ||
        r.some((o) => /typekit/i.test(o))) &&
        s("Adobe Fonts", "fonts"),
      l.some((o) => /fonts\.bunny\.net/i.test(o.href || "")) &&
        s("Bunny Fonts", "fonts"),
      (r.some((o) => /vercel/i.test(o)) ||
        document.querySelector('link[href*="vercel"]') ||
        document.cookie.includes("__vercel")) &&
        s("Vercel", "hosting"),
      (r.some((o) => /netlify/i.test(o)) ||
        document.querySelector('meta[name="generator"][content*="Netlify"]')) &&
        s("Netlify", "hosting"),
      (r.some((o) => /cloudflare/i.test(o)) ||
        document.querySelector('link[href*="cdnjs.cloudflare"]')) &&
        s("Cloudflare", "hosting"),
      (r.some((o) => /amazonaws\.com|aws/i.test(o)) ||
        document.querySelector('link[href*="amazonaws.com"]')) &&
        s("AWS", "hosting"),
      (r.some((o) => /akamai/i.test(o)) ||
        document.querySelector('link[href*="akamai"]')) &&
        s("Akamai", "hosting"),
      (r.some((o) => /fastly/i.test(o)) ||
        document.querySelector('link[href*="fastly"]')) &&
        s("Fastly", "hosting"),
      document.querySelector('meta[http-equiv="Content-Security-Policy"]') &&
        s("CSP", "security"),
      document.querySelector(
        'link[type="application/rss+xml"],link[type="application/atom+xml"]',
      ) && s("RSS Feed", "misc"),
      t
    );
  }
  function Rr() {
    const t = {
      images: [],
      videos: [],
      audio: [],
      animations: [],
      stylesheets: [],
      scripts: [],
      fonts: [],
      svgs: [],
      other: [],
      typography: {},
      colors: [],
    };
    function e(h) {
      if (h.currentSrc && !h.currentSrc.startsWith("data:image/svg+xml"))
        return h.currentSrc;
      const w = h.getAttribute("srcset") || h.getAttribute("data-srcset");
      if (w) {
        const C = w
          .split(",")
          .map((d) => {
            const y = d.trim().split(/\s+/),
              x = y[0],
              F = y[1] || "1x",
              T = parseFloat(F);
            return { url: x, weight: isNaN(T) ? 1 : T };
          })
          .filter((d) => d.url);
        if (C.length) return (C.sort((d, y) => y.weight - d.weight), C[0].url);
      }
      for (const C of [
        "data-src",
        "data-original",
        "data-lazy-src",
        "data-lazy",
        "data-image",
        "data-url",
      ]) {
        const d = h.getAttribute(C);
        if (d && !d.startsWith("data:image/svg+xml")) return d;
      }
      return h.src || null;
    }
    (document.querySelectorAll("img").forEach((h) => {
      const w = e(h);
      if (
        !w ||
        w.startsWith("data:image/svg+xml") ||
        (/^data:image\/(gif|png);base64,/i.test(w) && w.length < 200)
      )
        return;
      const C = h.naturalWidth,
        d = h.naturalHeight;
      if (
        (C > 0 && d > 0 && C <= 5 && d <= 5) ||
        (h.complete && C === 0 && d === 0 && w === h.src)
      )
        return;
      let y;
      try {
        y = new URL(w, window.location.href).href;
      } catch {
        return;
      }
      t.images.find((x) => x.url === y) ||
        t.images.push({
          url: y,
          alt: h.alt || "No description",
          size: C > 0 && d > 0 ? `${C}x${d}` : "Unknown",
        });
    }),
      document.querySelectorAll("*").forEach((h) => {
        const w = window.getComputedStyle(h).backgroundImage;
        if (w && w !== "none") {
          const C = w.match(/url\(['"]?(.*?)['"]?\)/);
          if (C && C[1]) {
            if (C[1].startsWith("data:image/svg+xml")) return;
            let d;
            try {
              d = new URL(C[1], window.location.href).href;
            } catch {
              return;
            }
            t.images.find((y) => y.url === d) ||
              t.images.push({
                url: d,
                alt: "Background image",
                size: "Unknown",
              });
          }
        }
      }),
      document.querySelectorAll("video").forEach((h) => {
        (h.src && t.videos.push({ url: h.src, name: h.title || "Video" }),
          h.querySelectorAll("source").forEach((w) => {
            w.src && t.videos.push({ url: w.src, name: w.type || "Video" });
          }));
      }),
      document.querySelectorAll("audio").forEach((h) => {
        (h.src && t.audio.push({ url: h.src, name: "Audio file" }),
          h.querySelectorAll("source").forEach((w) => {
            w.src && t.audio.push({ url: w.src, name: w.type || "Audio" });
          }));
      }));
    try {
      let h = function (d) {
          try {
            return new URL(d, window.location.href).href;
          } catch {
            return d;
          }
        },
        w = function (d) {
          if (d.id) return `#${d.id}`;
          if (d.className && typeof d.className == "string") {
            const x = d.className
              .trim()
              .split(/\s+/)
              .filter((F) => F)
              .join(".");
            if (x) {
              const F = `${d.tagName.toLowerCase()}.${x}`;
              if (document.querySelectorAll(F).length === 1) return F;
            }
          }
          const y = d.parentElement;
          if (y) {
            const x = Array.from(y.children).indexOf(d) + 1;
            return `${w(y)} > ${d.tagName.toLowerCase()}:nth-child(${x})`;
          }
          return d.tagName.toLowerCase();
        };
      var s = h,
        o = w;
      (document.querySelectorAll("dotlottie-player").forEach((d, y) => {
        const x = d.getAttribute("src");
        if (x) {
          const F = d.getAttribute("loop") !== null,
            T = d.getAttribute("autoplay") !== null,
            M = d.getAttribute("speed") || "1",
            E = d.getAttribute("direction") || "1",
            k = d.getAttribute("hover") === "true",
            L = d.getAttribute("mode") || "normal",
            D = window.getComputedStyle(d),
            I = d.getAttribute("width") || D.width,
            P = d.getAttribute("height") || D.height;
          t.animations.push({
            url: h(x),
            name: x.split("/").pop().replace(".json", ""),
            type: "dotlottie",
            selector: `dotlottie-player:nth-of-type(${y + 1})`,
            loop: F,
            autoplay: T,
            speed: M,
            direction: E,
            hover: k,
            mode: L,
            width: I,
            height: P,
            index: y,
          });
        }
      }),
        document.querySelectorAll("lottie-player").forEach((d, y) => {
          const x = d.getAttribute("src");
          if (x) {
            const F = d.getAttribute("loop") !== null,
              T = d.getAttribute("autoplay") !== null,
              M = d.getAttribute("speed") || "1",
              E = d.getAttribute("direction") || "1",
              k = d.getAttribute("hover") === "true",
              L = d.getAttribute("mode") || "normal",
              D = window.getComputedStyle(d),
              I = d.getAttribute("width") || D.width,
              P = d.getAttribute("height") || D.height;
            t.animations.push({
              url: h(x),
              name: x.split("/").pop().replace(".json", ""),
              type: "lottie",
              selector: `lottie-player:nth-of-type(${y + 1})`,
              loop: F,
              autoplay: T,
              speed: M,
              direction: E,
              hover: k,
              mode: L,
              width: I,
              height: P,
              index: y,
            });
          }
        }));
      const C = (d, y) => {
        try {
          if (d.wrappedJSObject && d.wrappedJSObject[y] != null)
            return d.wrappedJSObject[y];
        } catch {}
        return d[y];
      };
      (document.querySelectorAll("*").forEach((d, y) => {
        const x = C(d, "__lottie") || C(d, "lottie") || C(d, "_lottie");
        if (x)
          try {
            let F = null,
              T = null;
            try {
              x.path && (F = h(x.path));
            } catch {}
            try {
              !F && x.animationData
                ? (T = x.animationData)
                : !F &&
                  x.renderer &&
                  x.renderer.animationData &&
                  (T = x.renderer.animationData);
            } catch {}
            if (F || T) {
              const M = window.getComputedStyle(d);
              let E = null;
              if (T)
                try {
                  E = JSON.stringify(T);
                } catch {
                  try {
                    E = JSON.stringify(JSON.parse(JSON.stringify(T)));
                  } catch {
                    E = null;
                  }
                }
              t.animations.push({
                url: F || "inline",
                name: F
                  ? F.split("/").pop().replace(".json", "")
                  : `inline-animation-${y}`,
                type: "lottie-web",
                selector: w(d),
                data: E,
                loop: (() => {
                  try {
                    return x.loop !== !1;
                  } catch {
                    return !0;
                  }
                })(),
                autoplay: (() => {
                  try {
                    return x.autoplay !== !1;
                  } catch {
                    return !0;
                  }
                })(),
                speed: (() => {
                  try {
                    return x.playSpeed || 1;
                  } catch {
                    return 1;
                  }
                })(),
                width: M.width,
                height: M.height,
                index: y,
              });
            }
          } catch (F) {
            console.error("Error capturing lottie instance:", F);
          }
      }),
        document
          .querySelectorAll(
            '[data-animation-path], [data-lottie-path], [data-src*=".json"]',
          )
          .forEach((d, y) => {
            const x =
              d.getAttribute("data-animation-path") ||
              d.getAttribute("data-lottie-path") ||
              d.getAttribute("data-src");
            if (x && x.endsWith(".json")) {
              const F = window.getComputedStyle(d);
              t.animations.push({
                url: h(x),
                name: x.split("/").pop().replace(".json", ""),
                type: "data-attribute",
                selector: w(d),
                width: F.width,
                height: F.height,
                index: y,
              });
            }
          }));
    } catch (h) {
      console.error("Error capturing animations:", h);
    }
    (document.querySelectorAll('link[rel="stylesheet"]').forEach((h) => {
      h.href &&
        t.stylesheets.push({ url: h.href, name: h.href.split("/").pop() });
    }),
      document.querySelectorAll("script[src]").forEach((h) => {
        h.src && t.scripts.push({ url: h.src, name: h.src.split("/").pop() });
      }),
      Array.from(document.styleSheets).forEach((h) => {
        try {
          Array.from(h.cssRules || []).forEach((w) => {
            if (w instanceof CSSFontFaceRule) {
              const C = w.style.getPropertyValue("src");
              if (C) {
                const d = C.match(/url\(['"]?(.*?)['"]?\)/);
                if (d && d[1]) {
                  const y = new URL(d[1], window.location.href).href;
                  t.fonts.push({
                    url: y,
                    name: w.style.getPropertyValue("font-family") || "Font",
                  });
                }
              }
            }
          });
        } catch {}
      }),
      (t.cssVariables = yt()),
      document.querySelectorAll("svg").forEach((h, w) => {
        try {
          let C = ct(h);
          C = ft(h, C);
          let d = C.getAttribute("width") || h.getAttribute("width"),
            y = C.getAttribute("height") || h.getAttribute("height");
          if (!d || !y) {
            const k = h.viewBox?.baseVal;
            k && ((d = d || k.width), (y = y || k.height));
          }
          if (!d || !y) {
            const k = h.getAttribute("viewBox");
            if (k) {
              const L = k.split(/\s+/);
              L.length === 4 &&
                (d || (d = parseFloat(L[2])), y || (y = parseFloat(L[3])));
            }
          }
          if (!d || !y) {
            const k = h.getBoundingClientRect();
            ((d = d || Math.round(k.width)), (y = y || Math.round(k.height)));
          }
          (d || (d = 24),
            y || (y = 24),
            C.setAttribute("width", d),
            C.setAttribute("height", y));
          const x = C.outerHTML,
            F = h.getAttribute("viewBox") || "none",
            T = x.replace(/\n/g, " ").replace(/\s+/g, " ").trim(),
            M = `data:image/svg+xml,${encodeURIComponent(T).replace(/'/g, "%27").replace(/"/g, "%22")}`,
            E =
              h.getAttribute("id") ||
              h.getAttribute("aria-label") ||
              h.getAttribute("class")?.split(" ")[0] ||
              `svg-${w + 1}`;
          t.svgs.push({
            code: x,
            dataUrl: M,
            size: `${d || "auto"}x${y || "auto"}`,
            viewBox: F,
            index: w,
            name: E,
          });
        } catch (C) {
          (console.error(`Error capturing SVG #${w}:`, C),
            console.error("SVG element:", h));
        }
      }),
      document
        .querySelectorAll('[class*="iconify"], [class*="i-"]')
        .forEach((h, w) => {
          try {
            const C = Array.from(h.classList);
            let d = null,
              y = null,
              x = null;
            const F = C.find((L) => L.match(/^i-[\w-]+:[\w-]+$/));
            if (F) {
              const L = F.match(/^i-([\w-]+):([\w-]+)$/);
              L && ((y = L[1]), (x = L[2]), (d = `${y}:${x}`));
            }
            if (!d && h.hasAttribute("data-icon")) {
              d = h.getAttribute("data-icon");
              const L = d.split(":");
              L.length === 2 && ((y = L[0]), (x = L[1]));
            }
            if (!d) {
              const L = C.find((D) => D.match(/^iconify--[\w-]+--[\w-]+$/));
              if (L) {
                const D = L.match(/^iconify--([\w-]+)--([\w-]+)$/);
                D && ((y = D[1]), (x = D[2]), (d = `${y}:${x}`));
              }
            }
            if (!d) return;
            const T = window.getComputedStyle(h),
              M = T.backgroundImage;
            let E = null,
              k = null;
            if (M && M.includes("data:image/svg+xml")) {
              const L = M.match(
                /url\(["']?(data:image\/svg\+xml[^"')]+)["']?\)/,
              );
              if (L) {
                k = L[1];
                try {
                  if (k.includes("base64,")) {
                    const I = k.split("base64,")[1];
                    E = atob(I);
                  } else {
                    const I = k.split("data:image/svg+xml,")[1];
                    E = decodeURIComponent(I);
                  }
                  const D = new DOMParser()
                    .parseFromString(E, "image/svg+xml")
                    .querySelector("svg");
                  if (D) {
                    const I = h.getBoundingClientRect();
                    let P =
                        D.getAttribute("width") || Math.round(I.width) || 24,
                      z =
                        D.getAttribute("height") || Math.round(I.height) || 24;
                    (D.getAttribute("width") || D.setAttribute("width", P),
                      D.getAttribute("height") || D.setAttribute("height", z));
                    const W = T.color;
                    if (W && !D.getAttribute("fill")) {
                      let Y = W;
                      ((W.startsWith("rgb") || W.includes("oklab")) &&
                        (Y = G(W) || W),
                        D.setAttribute("fill", Y));
                    }
                    E = D.outerHTML;
                    const X = E.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
                    ((k = `data:image/svg+xml,${encodeURIComponent(X).replace(/'/g, "%27").replace(/"/g, "%22")}`),
                      t.svgs.push({
                        code: E,
                        dataUrl: k,
                        size: `${P}x${z}`,
                        viewBox: D.getAttribute("viewBox") || "none",
                        index: t.svgs.length,
                        name: `${y}-${x}`,
                        isIconify: !0,
                        iconIdentifier: d,
                        collection: y,
                      }));
                  }
                } catch (D) {
                  console.error("Error parsing iconify SVG:", D);
                }
              }
            } else if (h.tagName.toLowerCase() === "svg") {
              const L = h.cloneNode(!0),
                D = h.getBoundingClientRect();
              let I = L.getAttribute("width") || Math.round(D.width) || 24,
                P = L.getAttribute("height") || Math.round(D.height) || 24;
              (L.setAttribute("width", I),
                L.setAttribute("height", P),
                (E = L.outerHTML));
              const z = E.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
              ((k = `data:image/svg+xml,${encodeURIComponent(z).replace(/'/g, "%27").replace(/"/g, "%22")}`),
                t.svgs.push({
                  code: E,
                  dataUrl: k,
                  size: `${I}x${P}`,
                  viewBox: L.getAttribute("viewBox") || "none",
                  index: t.svgs.length,
                  name: `${y}-${x}`,
                  isIconify: !0,
                  iconIdentifier: d,
                  collection: y,
                }));
            }
          } catch (C) {
            console.error(`Error capturing Iconify icon #${w}:`, C);
          }
        }));
    try {
      let x = function (E) {
          if (!E) return null;
          let k = E.split(",")[0].replace(/['"]/g, "").trim();
          if (
            (k.match(/^__([\w]+)_([0-9a-f]+)$/i),
            k.match(/^__([A-Za-z_]+)\d{5,}_/),
            k.startsWith("__"))
          ) {
            const L = k.match(/^__([\w]+)_([0-9a-f]+)/i);
            if (L && L[1]) {
              let D = L[1];
              return ((D = D.replace(/_/g, " ")), D.trim());
            }
          }
          return k;
        },
        F = function (E, k) {
          if (!E) return null;
          if (E.endsWith("px")) return parseFloat(E);
          if (E.endsWith("rem")) {
            const L = parseFloat(
              window.getComputedStyle(document.documentElement).fontSize,
            );
            return parseFloat(E) * L;
          } else if (E.endsWith("em")) {
            const L = parseFloat(
              window.getComputedStyle(k.parentElement || k).fontSize,
            );
            return parseFloat(E) * L;
          }
          return parseFloat(E);
        },
        T = function (E) {
          const k = E.tagName.toLowerCase();
          return ["h1", "h2", "h3", "h4", "h5", "h6"].includes(k)
            ? { type: "heading", level: k }
            : k === "p"
              ? { type: "body", level: "paragraph" }
              : k === "a"
                ? { type: "link", level: "inline" }
                : k === "button" || E.matches('[role="button"]')
                  ? { type: "button", level: "interactive" }
                  : k === "code" || k === "pre" || E.matches('[class*="code"]')
                    ? { type: "code", level: "monospace" }
                    : k === "label" || E.matches('[class*="label"]')
                      ? { type: "label", level: "small" }
                      : E.matches('[class*="caption"], [class*="small"]')
                        ? { type: "caption", level: "small" }
                        : { type: "other", level: "unknown" };
        };
      var a = x,
        i = F,
        p = T;
      const h = [],
        w = new Map(),
        C = new Map(),
        d = new Map(),
        y = new Map();
      document.querySelectorAll("*");
      const M = [];
      ([
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "span",
        "div",
        "a",
        "button",
        "label",
        "input",
        "textarea",
        "code",
        "pre",
        "li",
      ].forEach((E) => {
        document.querySelectorAll(E).forEach((k, L) => {
          if (L < 10) {
            const D = k.textContent?.trim();
            D && D.length > 0 && M.push(k);
          }
        });
      }),
        M.forEach((E) => {
          try {
            const k = window.getComputedStyle(E),
              L = T(E),
              D = x(k.fontFamily),
              I = F(k.fontSize, E),
              P = k.fontWeight,
              z = k.lineHeight,
              W = k.letterSpacing;
            D &&
              (w.set(D, (w.get(D) || 0) + 1),
              C.set(I, (C.get(I) || 0) + 1),
              d.set(P, (d.get(P) || 0) + 1),
              y.set(z, (y.get(z) || 0) + 1),
              h.push({
                fontFamily: D,
                fontSize: I,
                fontWeight: P,
                lineHeight: z,
                letterSpacing: W,
                context: L.type,
                level: L.level,
                selector: E.tagName.toLowerCase(),
                textContent: E.textContent?.trim().substring(0, 50),
              }));
          } catch {}
        }),
        (t.typography = {
          contexts: h,
          families: Array.from(w.entries())
            .map(([E, k]) => ({ family: E, count: k }))
            .sort((E, k) => k.count - E.count),
          sizes: Array.from(C.entries())
            .map(([E, k]) => ({ size: E, count: k }))
            .sort((E, k) => k.count - E.count),
          weights: Array.from(d.entries())
            .map(([E, k]) => ({ weight: E, count: k }))
            .sort((E, k) => k.count - E.count),
          lineHeights: Array.from(y.entries())
            .map(([E, k]) => ({ lineHeight: E, count: k }))
            .sort((E, k) => k.count - E.count),
        }));
    } catch (h) {
      (console.error("Error capturing typography:", h),
        (t.typography = {
          contexts: [],
          families: [],
          sizes: [],
          weights: [],
          lineHeights: [],
        }));
    }
    try {
      let F = function (R) {
          const _ = parseInt(R.substr(1, 2), 16),
            $ = parseInt(R.substr(3, 2), 16),
            B = parseInt(R.substr(5, 2), 16);
          return (0.299 * _ + 0.587 * $ + 0.114 * B) / 255;
        },
        T = function (R) {
          const _ = parseInt(R.substr(1, 2), 16),
            $ = parseInt(R.substr(3, 2), 16),
            B = parseInt(R.substr(5, 2), 16);
          return (
            Math.max(Math.abs(_ - $), Math.abs(_ - B), Math.abs($ - B)) < 10
          );
        },
        M = function (R) {
          const _ = R.length > 7 ? R.substr(0, 7) : R,
            $ = parseInt(_.substr(1, 2), 16) / 255,
            B = parseInt(_.substr(3, 2), 16) / 255,
            re = parseInt(_.substr(5, 2), 16) / 255,
            V = Math.max($, B, re),
            ne = V - Math.min($, B, re);
          return V === 0 ? 0 : (ne / V) * 100;
        },
        E = function (R) {
          let _ = R,
            $ = 0;
          for (; _ && $ < 5;) {
            const V = _.tagName?.toLowerCase() || "",
              ne = _.className || "",
              oe = _.id || "",
              te = _.getAttribute?.("role") || "",
              H = String(ne).toLowerCase(),
              de = String(oe).toLowerCase();
            if (
              V === "header" ||
              te === "banner" ||
              H.match(/header|navbar|nav-bar|site-header|top-bar/i) ||
              de.match(/header|navbar|nav-bar/i)
            )
              return "header";
            if (
              V === "nav" ||
              te === "navigation" ||
              H.match(/\bnav\b|navigation|menu|menubar/i) ||
              de.match(/\bnav\b|navigation|menu/i)
            )
              return "navigation";
            if (
              H.match(/hero|banner|jumbotron|masthead|featured|spotlight/i) ||
              de.match(/hero|banner|jumbotron/i)
            )
              return "hero";
            if (H.match(/logo|brand|site-title/i) || de.match(/logo|brand/i))
              return "logo";
            if (
              V === "footer" ||
              te === "contentinfo" ||
              H.match(/footer|site-footer/i) ||
              de.match(/footer/i)
            )
              return "footer";
            if (
              te === "complementary" ||
              H.match(/sidebar|aside/i) ||
              V === "aside"
            )
              return "sidebar";
            ((_ = _.parentElement), $++);
          }
          const B = R.getBoundingClientRect(),
            re = window.innerHeight;
          return B.top >= 0 && B.top < re * 0.3 ? "top-section" : "content";
        },
        k = function (R) {
          const _ = R.tagName.toLowerCase();
          return _ === "button" ||
            R.matches('[role="button"]') ||
            R.matches('[type="button"]')
            ? "button"
            : _ === "a"
              ? "link"
              : ["h1", "h2", "h3", "h4", "h5", "h6"].includes(_)
                ? "heading"
                : _ === "p" ||
                    R.matches(
                      '[class*="body"], [class*="text"], [class*="paragraph"]',
                    )
                  ? "text"
                  : _ === "input" || _ === "textarea" || _ === "select"
                    ? "input"
                    : "other";
        },
        L = function (R) {
          if (R.id) return `#${R.id}`;
          if (R.className && typeof R.className == "string") {
            const _ = R.className.trim().split(/\s+/).slice(0, 2);
            if (_.length > 0 && _[0])
              return `${R.tagName.toLowerCase()}.${_.join(".")}`;
          }
          return R.tagName.toLowerCase();
        };
      var f = F,
        g = T,
        b = M,
        A = E,
        v = k,
        S = L;
      const h = new Map(),
        w = new Map(),
        C = new Map(),
        d = new Map(),
        y = new Map(),
        x = [],
        D = document.querySelectorAll("*"),
        I = [],
        P = [];
      D.forEach((R) => {
        const _ = R.getBoundingClientRect(),
          $ = window.getComputedStyle(R);
        _.width > 0 &&
        _.height > 0 &&
        $.display !== "none" &&
        $.visibility !== "hidden"
          ? I.push(R)
          : P.push(R);
      });
      const z = [...I];
      if (P.length > 200) {
        const R = Math.floor(P.length / 200);
        for (let _ = 0; _ < P.length; _ += R) z.push(P[_]);
      } else z.push(...P);
      (z.forEach((R) => {
        const _ = window.getComputedStyle(R),
          $ = k(R),
          B = E(R),
          re = L(R);
        Object.entries({
          color: "text",
          backgroundColor: "background",
          borderColor: "border",
          borderTopColor: "border",
          borderRightColor: "border",
          borderBottomColor: "border",
          borderLeftColor: "border",
        }).forEach(([ne, oe]) => {
          const te = _[ne];
          if (te && te !== "rgba(0, 0, 0, 0)" && te !== "transparent") {
            const H = G(te);
            H &&
              (h.set(H, (h.get(H) || 0) + 1),
              oe === "background" && w.set(H, (w.get(H) || 0) + 1),
              oe === "text" && C.set(H, (C.get(H) || 0) + 1),
              oe === "border" && d.set(H, (d.get(H) || 0) + 1),
              x.push({
                hex: H,
                context: oe,
                elementType: $,
                pageRegion: B,
                selector: re,
                count: 1,
              }));
          }
        });
        const V = _.backgroundImage;
        if (V && V !== "none" && V.includes("gradient")) {
          const ne = V.trim();
          y.set(ne, (y.get(ne) || 0) + 1);
        }
      }),
        [document.documentElement, document.body].forEach((R) => {
          if (R)
            try {
              const _ = window.getComputedStyle(R).backgroundColor;
              if (_ && _ !== "rgba(0, 0, 0, 0)" && _ !== "transparent") {
                const $ = G(_);
                if ($) {
                  const B = w.get($) || 0;
                  (w.set($, B + 100),
                    h.set($, (h.get($) || 0) + 100),
                    x.push({
                      hex: $,
                      context: "background",
                      elementType: "base",
                      pageRegion: "page-root",
                      selector: R.tagName.toLowerCase(),
                      count: 100,
                    }));
                }
              }
            } catch (_) {
              console.warn(
                `Could not extract background color from ${R.tagName}:`,
                _,
              );
            }
        }));
      const W = Array.from(h.entries())
        .map(([R, _]) => ({ hex: R, instances: _ }))
        .sort((R, _) => _.instances - R.instances)
        .slice(0, 50);
      t.colors = W;
      const X = Array.from(w.entries())
          .map(([R, _]) => ({ hex: R, instances: _ }))
          .sort((R, _) => _.instances - R.instances),
        Y = { light: [], dark: [], colored: [], neutral: [] };
      (X.forEach(({ hex: R, instances: _ }) => {
        const $ = F(R);
        T(R)
          ? $ > 0.9
            ? Y.light.push({ hex: R, instances: _ })
            : $ < 0.3
              ? Y.dark.push({ hex: R, instances: _ })
              : Y.neutral.push({ hex: R, instances: _ })
          : Y.colored.push({ hex: R, instances: _ });
      }),
        (t.backgroundColors = { all: X.slice(0, 30), categorized: Y }),
        (t.textColors = Array.from(C.entries())
          .map(([R, _]) => ({ hex: R, instances: _ }))
          .sort((R, _) => _.instances - R.instances)
          .slice(0, 30)),
        (t.borderColors = Array.from(d.entries())
          .map(([R, _]) => ({ hex: R, instances: _ }))
          .sort((R, _) => _.instances - R.instances)
          .slice(0, 20)),
        (t.gradients = Array.from(y.entries())
          .map(([R, _]) => ({ value: R, instances: _ }))
          .sort((R, _) => _.instances - R.instances)
          .slice(0, 20)),
        (t.brandColors = W.filter(({ hex: R, instances: _ }) => {
          const $ = M(R),
            B = F(R);
          return $ > 35 && B > 0.2 && B < 0.8 && _ >= 3;
        })
          .sort((R, _) => {
            const $ = M(R.hex),
              B = M(_.hex);
            return Math.abs($ - B) > 5 ? B - $ : _.instances - R.instances;
          })
          .slice(0, 10)),
        (t.colorContexts = x));
      try {
        const R = Er();
        ((t.cssClassColors = {
          background: Array.from(R.background.entries()).map(([_, $]) => ({
            className: _,
            hex: $,
          })),
          text: Array.from(R.text.entries()).map(([_, $]) => ({
            className: _,
            hex: $,
          })),
          border: Array.from(R.border.entries()).map(([_, $]) => ({
            className: _,
            hex: $,
          })),
          all: Array.from(R.all.entries()).map(([_, $]) => ({
            className: _,
            ...$,
          })),
        }),
          (t.semanticColorMapping = Fr(R)));
      } catch (R) {
        (console.error("Error extracting CSS class colors:", R),
          (t.cssClassColors = {
            background: [],
            text: [],
            border: [],
            all: [],
          }),
          (t.semanticColorMapping = {
            primary: [],
            secondary: [],
            success: [],
            error: [],
            warning: [],
            info: [],
            neutral: [],
            named: [],
          }));
      }
      try {
        t.cssVariables = yt();
      } catch (R) {
        (console.error("Error extracting CSS variables:", R),
          (t.cssVariables = { semantic: {}, obfuscated: {}, all: {} }));
      }
    } catch (h) {
      (console.error("Error capturing colors:", h),
        (t.colors = []),
        (t.backgroundColors = {
          all: [],
          categorized: { light: [], dark: [], colored: [], neutral: [] },
        }),
        (t.textColors = []),
        (t.borderColors = []),
        (t.gradients = []),
        (t.brandColors = []),
        (t.colorContexts = []),
        (t.cssClassColors = { background: [], text: [], border: [], all: [] }),
        (t.semanticColorMapping = {
          primary: [],
          secondary: [],
          success: [],
          error: [],
          warning: [],
          info: [],
          neutral: [],
          named: [],
        }));
    }
    const r = new Map();
    [...t.backgroundColors.all, ...t.textColors].forEach((h) => {
      const w = r.get(h.hex);
      r.set(h.hex, (w || 0) + h.instances);
    });
    const n = Array.from(r.entries())
        .map(([h, w]) => ({ hex: h, instances: w }))
        .sort((h, w) => w.instances - h.instances)
        .slice(0, 15),
      l = {
        primary: null,
        secondary: null,
        neutral: [],
        success: [],
        error: [],
        warning: [],
        info: [],
      };
    let c = !1,
      u = !1;
    n.forEach((h) => {
      const w = h.hex === "#FFFFFF" || h.hex === "#000000",
        C = kr(h.hex);
      C === "neutral"
        ? l.neutral.push({
            name: `neutral-${l.neutral.length + 1}`,
            hex: h.hex,
          })
        : C === "success"
          ? l.success.push({ name: "success", hex: h.hex })
          : C === "error"
            ? l.error.push({ name: "error", hex: h.hex })
            : C === "warning"
              ? l.warning.push({ name: "warning", hex: h.hex })
              : C === "info"
                ? l.info.push({ name: "info", hex: h.hex })
                : C === "generic" &&
                  !w &&
                  (c
                    ? u ||
                      ((l.secondary = { name: "secondary", hex: h.hex }),
                      (u = !0))
                    : ((l.primary = { name: "primary", hex: h.hex }),
                      (c = !0)));
    });
    const m = Object.values(t.semanticColorMapping || {}).flat().length;
    if (!t.semanticColorMapping || m < 2) {
      const h = {};
      for (const [w, C] of Object.entries(l))
        w === "primary" || w === "secondary"
          ? C && (h[w] = [C])
          : (h[w] = C.filter(
              (d) => d.hex !== l.primary?.hex && d.hex !== l.secondary?.hex,
            ));
      t.semanticColorMapping = h;
    }
    return (
      (t.pageInfo = {
        title: document.title || "",
        url: window.location.href,
        hostname: window.location.hostname,
        ogImage:
          document.querySelector('meta[property="og:image"]')?.content ||
          document.querySelector('meta[name="og:image"]')?.content ||
          document.querySelector('meta[property="twitter:image"]')?.content ||
          null,
        ogTitle:
          document.querySelector('meta[property="og:title"]')?.content ||
          document.querySelector('meta[name="og:title"]')?.content ||
          null,
        ogDescription:
          document.querySelector('meta[property="og:description"]')?.content ||
          document.querySelector('meta[name="description"]')?.content ||
          null,
        favicon:
          document.querySelector('link[rel="icon"]')?.href ||
          document.querySelector('link[rel="shortcut icon"]')?.href ||
          `${window.location.origin}/favicon.ico`,
      }),
      (t.techStack = Tr()),
      (t.fingerprint = Lr()),
      t
    );
  }
  function Lr() {
    const t = new Map(),
      e = new Map(),
      r = new Map(),
      n = (o) => {
        if (!o) return;
        const a = parseFloat(o);
        if (!Number.isFinite(a) || a <= 0 || a > 200) return;
        const i = Math.round(a);
        i !== 0 && t.set(i, (t.get(i) || 0) + 1);
      },
      l = (o) => {
        if (!o) return;
        const a = o.trim();
        if (a === "0px" || a === "0") return;
        const i = parseFloat(a);
        if (!Number.isFinite(i) || i <= 0) return;
        const p = i >= 100 ? "pill" : `${Math.round(i)}px`;
        e.set(p, (e.get(p) || 0) + 1);
      },
      c = (o) => {
        if (!o || o === "none") return;
        const a = o.trim().replace(/\s+/g, " ");
        r.set(a, (r.get(a) || 0) + 1);
      },
      u = document.querySelectorAll("body *"),
      m = 4e3,
      s = u.length > m ? Math.ceil(u.length / m) : 1;
    for (let o = 0; o < u.length; o += s) {
      const a = u[o];
      if (!a || a.nodeType !== 1) continue;
      const i = window.getComputedStyle(a);
      (n(i.paddingTop),
        n(i.paddingRight),
        n(i.paddingBottom),
        n(i.paddingLeft),
        n(i.gap));
      const p = i.borderTopLeftRadius;
      (p &&
      p === i.borderTopRightRadius &&
      p === i.borderBottomLeftRadius &&
      p === i.borderBottomRightRadius
        ? l(p)
        : (l(i.borderTopLeftRadius),
          l(i.borderTopRightRadius),
          l(i.borderBottomLeftRadius),
          l(i.borderBottomRightRadius)),
        c(i.boxShadow));
    }
    return {
      spacing: [...t.entries()]
        .filter(([, o]) => o >= 3)
        .sort((o, a) => a[1] - o[1])
        .slice(0, 8)
        .map(([o]) => o)
        .sort((o, a) => o - a)
        .map((o) => `${o}px`),
      radius: [...e.entries()]
        .filter(([, o]) => o >= 2)
        .sort((o, a) => a[1] - o[1])
        .slice(0, 5)
        .map(([o]) => o)
        .sort((o, a) =>
          o === "pill" ? 1 : a === "pill" ? -1 : parseFloat(o) - parseFloat(a),
        ),
      shadows: [...r.entries()]
        .filter(([, o]) => o >= 2)
        .sort((o, a) => a[1] - o[1])
        .slice(0, 3)
        .map(([o]) => o),
    };
  }
  var ie = !1,
    J = null,
    Q = null,
    O = null,
    q = null,
    ae = null,
    Z = null,
    ke = 0,
    Ee = 0,
    Fe = "asset-inspector-outline";
  function he(t) {
    if (!t || t === document.documentElement) return !1;
    const e = t.getBoundingClientRect();
    if (e.width === 0 || e.height === 0) return !1;
    const r = window.getComputedStyle(t);
    return !(r.display === "none" || r.visibility === "hidden");
  }
  function pe(t) {
    return t
      ? !!(
          (t.id && t.id.startsWith("asset-inspector-")) ||
          (q && q.contains(t)) ||
          (J && J.contains(t)) ||
          (Z && Z.contains(t))
        )
      : !1;
  }
  function Pr() {
    J ||
      ((J = document.createElement("div")),
      (J.id = "asset-inspector-overlay"),
      (J.style.cssText = `
    position: fixed;
    background: rgba(255, 255, 255, 0.92);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    backdrop-filter: saturate(180%) blur(20px);
    color: #1D1D1F;
    padding: 13px 14px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    z-index: 2147483647;
    pointer-events: none;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.04);
    max-width: 300px;
    max-height: 80vh;
    overflow-y: auto;
    line-height: 1.5;
    letter-spacing: -0.01em;
    display: none;
  `),
      document.body.appendChild(J));
  }
  function _r() {
    ae ||
      ((ae = document.createElement("style")),
      (ae.id = "asset-inspector-highlight-style"),
      (ae.textContent = `
    .${Fe} {
      outline: 2px solid #6366F1 !important;
      outline-offset: 2px !important;
    }
  `),
      document.head.appendChild(ae));
  }
  function Br() {
    ae && (ae.remove(), (ae = null));
  }
  function Dr() {
    Z ||
      ((Z = document.createElement("div")),
      (Z.id = "asset-inspector-coord-label"),
      (Z.style.cssText = `
    position: fixed;
    background: rgba(255, 255, 255, 0.9);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    color: rgba(29, 29, 31, 0.85);
    font-size: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-variant-numeric: tabular-nums;
    padding: 3px 7px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    pointer-events: none;
    z-index: 2147483647;
    white-space: nowrap;
    transition: left 0.05s linear, top 0.05s linear;
  `),
      document.body.appendChild(Z));
  }
  function $r(t, e) {
    Z &&
      ((Z.style.left = t + 14 + "px"),
      (Z.style.top = e + 14 + "px"),
      (Z.textContent = `${Math.round(t + window.scrollX)}, ${Math.round(e + window.scrollY)}`));
  }
  function Or() {
    q ||
      ((q = document.createElement("div")),
      (q.id = "asset-inspector-guidelines"),
      (q.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    pointer-events: none;
    z-index: 999995;
    overflow: visible;
  `),
      document.body.appendChild(q));
  }
  function Me(t) {
    if (!q) return;
    const e = t.getBoundingClientRect(),
      r = window.scrollX || document.documentElement.scrollLeft,
      n = window.scrollY || document.documentElement.scrollTop,
      l = document.scrollingElement.scrollWidth,
      c = document.scrollingElement.scrollHeight,
      u = document.documentElement.clientWidth,
      m = e.top + n,
      s = e.right + r,
      o = e.bottom + n,
      a = e.left + r;
    q.style.height = c + "px";
    const i = "http://www.w3.org/2000/svg";
    let p = q.querySelector("svg");
    (p ||
      ((p = document.createElementNS(i, "svg")),
      (p.style.cssText =
        "position:absolute;top:0;left:0;pointer-events:none;overflow:visible;"),
      q.insertBefore(p, q.firstChild)),
      p.setAttribute("width", "100%"),
      p.setAttribute("viewBox", `0 0 ${u} ${c}`),
      p.setAttribute("preserveAspectRatio", "none"),
      (p.innerHTML = `
    <line x1="${a}" y1="0" x2="${a}" y2="${c}"
      stroke="rgba(135,112,163,0.4)" stroke-width="1" stroke-dasharray="4 4" />
    <line x1="${s}" y1="0" x2="${s}" y2="${c}"
      stroke="rgba(135,112,163,0.4)" stroke-width="1" stroke-dasharray="4 4" />
    <line x1="0" y1="${m}" x2="${l}" y2="${m}"
      stroke="rgba(135,112,163,0.4)" stroke-width="1" stroke-dasharray="4 4" />
    <line x1="0" y1="${o}" x2="${l}" y2="${o}"
      stroke="rgba(135,112,163,0.4)" stroke-width="1" stroke-dasharray="4 4" />
  `));
  }
  function Nr() {
    q && (q.innerHTML = "");
  }
  function Te(t) {
    if (!q) return;
    q.querySelectorAll(".asset-inspector-boxmodel").forEach((D) => D.remove());
    const e = t.getBoundingClientRect(),
      r = window.getComputedStyle(t),
      n = window.scrollX || document.documentElement.scrollLeft,
      l = window.scrollY || document.documentElement.scrollTop,
      c = e.top + l,
      u = e.left + n,
      m = e.width,
      s = e.height,
      o = Math.max(0, parseFloat(r.marginTop) || 0),
      a = Math.max(0, parseFloat(r.marginRight) || 0),
      i = Math.max(0, parseFloat(r.marginBottom) || 0),
      p = Math.max(0, parseFloat(r.marginLeft) || 0),
      f = parseFloat(r.paddingTop) || 0,
      g = parseFloat(r.paddingRight) || 0,
      b = parseFloat(r.paddingBottom) || 0,
      A = parseFloat(r.paddingLeft) || 0,
      v = parseFloat(r.borderTopWidth) || 0,
      S = parseFloat(r.borderRightWidth) || 0,
      h = parseFloat(r.borderBottomWidth) || 0,
      w = parseFloat(r.borderLeftWidth) || 0,
      C = o > 0 || a > 0 || i > 0 || p > 0,
      d = f > 0 || g > 0 || b > 0 || A > 0;
    if (!C && !d) return;
    const y = document.createElement("div");
    ((y.className = "asset-inspector-boxmodel"),
      (y.style.cssText =
        "position:absolute;top:0;left:0;pointer-events:none;"));
    const x = "rgba(135, 112, 163, 0.2)",
      F = "rgba(135, 112, 163, 0.85)",
      T = "rgba(76, 175, 80, 0.2)",
      M = "rgba(76, 175, 80, 0.85)",
      E = `
    position:absolute;
    color:#fff;
    font-size:10px;
    font-weight:600;
    font-family:monospace;
    padding:1px 5px;
    border-radius:3px;
    white-space:nowrap;
    pointer-events:none;
  `;
    function k(D, I, P, z, W, X, Y, R) {
      if (X <= 0 || P <= 0 || z <= 0) return "";
      const _ = Math.round(X * 10) / 10;
      let $ = "";
      return (
        ($ = "left:50%;top:50%;transform:translate(-50%,-50%);"),
        `<div style="position:absolute;top:${D}px;left:${I}px;width:${P}px;height:${z}px;background:${W};pointer-events:none;">
      <div style="${E}background:${Y};${$}">${_}</div>
    </div>`
      );
    }
    let L = "";
    if (
      (C &&
        (o > 0 && (L += k(c - o, u, m, o, x, o, F, "top")),
        i > 0 && (L += k(c + s, u, m, i, x, i, F, "bottom")),
        p > 0 && (L += k(c, u - p, p, s, x, p, F, "left")),
        a > 0 && (L += k(c, u + m, a, s, x, a, F, "right"))),
      d)
    ) {
      const D = c + v,
        I = u + w,
        P = m - w - S,
        z = s - v - h;
      (f > 0 && (L += k(D, I, P, f, T, f, M, "top")),
        b > 0 && (L += k(D + z - b, I, P, b, T, b, M, "bottom")),
        A > 0 && (L += k(D + f, I, A, z - f - b, T, A, M, "left")),
        g > 0 && (L += k(D + f, I + P - g, g, z - f - b, T, g, M, "right")));
    }
    ((y.innerHTML = L), q.appendChild(y));
  }
  function Ir(t) {
    const e = Array.from(document.querySelectorAll("body, body *")),
      r = e.indexOf(t);
    if (r === -1) return e.find(he) || null;
    for (let n = r + 1; n < e.length; n++)
      if (!pe(e[n]) && he(e[n])) return e[n];
    return null;
  }
  function zr(t) {
    const e = Array.from(document.querySelectorAll("body, body *")),
      r = e.indexOf(t);
    if (r === -1) return e.find(he) || null;
    for (let n = r - 1; n >= 0; n--) if (!pe(e[n]) && he(e[n])) return e[n];
    return null;
  }
  function wt(t) {
    if (ie)
      if (t.key === "ArrowDown") {
        if ((t.preventDefault(), t.stopImmediatePropagation(), !Q)) return;
        const e = Ir(Q);
        e &&
          ((Q = e),
          (O = e),
          Le(e),
          Me(e),
          Te(e),
          Re(e),
          e.scrollIntoView({ behavior: "smooth", block: "nearest" }),
          chrome.runtime.sendMessage({
            action: "elementClicked",
            elementDetails: Be(e),
          }));
      } else if (t.key === "ArrowUp") {
        if ((t.preventDefault(), t.stopImmediatePropagation(), !Q)) return;
        const e = zr(Q);
        e &&
          ((Q = e),
          (O = e),
          Le(e),
          Me(e),
          Te(e),
          Re(e),
          e.scrollIntoView({ behavior: "smooth", block: "nearest" }),
          chrome.runtime.sendMessage({
            action: "elementClicked",
            elementDetails: Be(e),
          }));
      } else
        t.key === "Escape" &&
          (t.preventDefault(),
          t.stopImmediatePropagation(),
          Et(),
          chrome.runtime.sendMessage({ action: "inspectorDisabledByEscape" }));
  }
  function jr(t) {
    if (!t || t === "none") return null;
    for (const e of [
      /(?:oklab|oklch)\([^)]+\)/gi,
      /rgba?\([^)]+\)/gi,
      /hsla?\([^)]+\)/gi,
      /#[a-fA-F0-9]{3,8}\b/gi,
    ]) {
      const r = t.match(e);
      if (r && r.length > 0) return r[0];
    }
    return null;
  }
  function Wr(t) {
    let e = t,
      r = null;
    for (; e;) {
      const n = window.getComputedStyle(e),
        l = n.backgroundColor,
        c = n.backgroundImage;
      if (c && c !== "none" && c.includes("gradient")) {
        const u = jr(c);
        if (u) return { value: u, isGradient: !0, gradientValue: c };
      }
      if (l && !ue(l)) {
        const u = ht(l);
        if (u > 0.8) return { value: l, isGradient: !1 };
        u > 0.3 && !r && (r = { value: l, isGradient: !1 });
      }
      if (e === document.documentElement) break;
      e = e.parentElement;
    }
    return r || { value: "rgb(255, 255, 255)", isGradient: !1 };
  }
  function Ur(t) {
    const e = window.getComputedStyle(t),
      r = Wr(t);
    return {
      fontFamily: e.fontFamily,
      fontSize: e.fontSize,
      fontWeight: e.fontWeight,
      fontStyle: e.fontStyle,
      lineHeight: e.lineHeight,
      letterSpacing: e.letterSpacing,
      color: e.color,
      backgroundColor: r.value,
      backgroundIsGradient: r.isGradient,
      backgroundGradientValue: r.gradientValue,
      textAlign: e.textAlign,
      textDecoration: e.textDecoration,
      textTransform: e.textTransform,
      border: e.border,
      borderWidth: e.borderWidth,
      borderStyle: e.borderStyle,
      borderColor: e.borderColor,
      borderRadius: e.borderRadius,
      display: e.display,
      padding: e.padding,
      margin: e.margin,
      width: e.width,
      height: e.height,
      boxSizing: e.boxSizing,
      flexDirection: e.flexDirection,
      flexWrap: e.flexWrap,
      alignItems: e.alignItems,
      justifyContent: e.justifyContent,
      alignContent: e.alignContent,
      gap: e.gap,
      gridTemplateColumns: e.gridTemplateColumns,
      gridTemplateRows: e.gridTemplateRows,
      rowGap: e.rowGap,
      columnGap: e.columnGap,
      position: e.position,
      top: e.top,
      right: e.right,
      bottom: e.bottom,
      left: e.left,
      zIndex: e.zIndex,
      overflow: e.overflow,
      visibility: e.visibility,
      boxShadow: e.boxShadow,
      opacity: e.opacity,
      tagName: t.tagName.toLowerCase(),
      className: t.className,
      textContent: t.textContent?.substring(0, 50) || "",
    };
  }
  function Re(t) {
    if (!J) return;
    const e = Ur(t),
      r = t.textContent && t.textContent.trim().length > 0,
      n = (i) =>
        `<span style="font-size:9px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:rgba(60,60,67,0.5);">${i}</span>`,
      l = (i, p) =>
        !p || p === "none" || p === "transparent" || p === "rgba(0, 0, 0, 0)"
          ? `<div style="display:flex;align-items:center;gap:8px;">${n(i)}
        <span style="font-size:11px;color:rgba(60,60,67,0.5);">${p || "none"}</span></div>`
          : `<div style="display:flex;align-items:center;gap:8px;">${n(i)}
      <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(118,118,128,0.08);border:1px solid rgba(0,0,0,0.06);border-radius:6px;padding:2px 7px;">
        <span style="width:11px;height:11px;border-radius:3px;background:${p};box-shadow:inset 0 0 0 1px rgba(0,0,0,0.12);flex-shrink:0;"></span>
        <span style="font-size:11px;font-weight:500;color:#1D1D1F;font-variant-numeric:tabular-nums;">${p}</span>
      </span></div>`;
    let c = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <span style="font-weight:600;color:#4F46E5;font-size:12px;background:rgba(99,102,241,0.10);border:1px solid rgba(99,102,241,0.20);border-radius:6px;padding:2px 8px;">&lt;${e.tagName}&gt;</span>
      <span style="font-size:11px;color:rgba(60,60,67,0.5);font-variant-numeric:tabular-nums;">${Math.round(t.offsetWidth)} \xD7 ${Math.round(t.offsetHeight)}</span>
    </div>
  `;
    if (
      ((c += '<div style="display:grid;gap:7px;">'),
      r && (c += l("Text", e.color)),
      e.backgroundIsGradient
        ? (c += `<div style="display:flex;flex-direction:column;gap:5px;">${n("Gradient")}
      <div style="background:${e.backgroundGradientValue};border-radius:6px;height:22px;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.10);"></div>
      <span style="font-size:10px;color:rgba(60,60,67,0.55);word-break:break-all;line-height:1.4;">${e.backgroundGradientValue}</span></div>`)
        : (c += l("Background", e.backgroundColor)),
      (c += "</div>"),
      r)
    ) {
      const i = e.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
      c += `
      <div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.06);">
        ${n("Font")}
        <span style="font-size:11px;color:#1D1D1F;"><strong style="font-weight:600;">${i}</strong>
          <span style="color:rgba(60,60,67,0.5);">${e.fontSize} \xB7 ${e.fontWeight}</span></span>
      </div>
    `;
    }
    ((c += `
    <div style="display:flex;align-items:center;gap:5px;margin-top:10px;padding-top:9px;border-top:1px solid rgba(0,0,0,0.05);font-size:10px;color:rgba(60,60,67,0.45);">
      <span style="background:rgba(118,118,128,0.10);border:1px solid rgba(0,0,0,0.08);border-radius:4px;padding:1px 5px;font-size:9px;font-weight:600;color:rgba(60,60,67,0.6);">&#9650;&#9660;</span> navigate
    </div>
  `),
      (J.innerHTML = c),
      (J.style.display = "block"));
    const u = t.getBoundingClientRect(),
      m = J.getBoundingClientRect(),
      s = 12;
    let o = u.left,
      a = u.bottom + s;
    (a + m.height > window.innerHeight && (a = u.top - m.height - s),
      o + m.width > window.innerWidth && (o = window.innerWidth - m.width - s),
      o < s && (o = s),
      (J.style.left = o + "px"),
      (J.style.top = a + "px"));
  }
  function Le(t) {
    (Ge(), t.classList.add(Fe));
  }
  function Ge() {
    const t = document.querySelector("." + Fe);
    t && t.classList.remove(Fe);
  }
  function qr(t) {
    ((Q = t), Le(t), Me(t), Te(t), Re(t));
  }
  function Hr() {
    (Ge(), Nr(), J && (J.style.display = "none"));
  }
  function xt(t) {
    if (!ie) return;
    const e = t.target;
    if (pe(e) || !he(e)) return;
    let r = e;
    const n = e.querySelectorAll("img, video, audio, canvas");
    if (n.length > 0) {
      let l = null,
        c = 1 / 0;
      (n.forEach((u) => {
        const m = u.getBoundingClientRect(),
          s = m.left + m.width / 2,
          o = m.top + m.height / 2,
          a = Math.sqrt(Math.pow(s - ke, 2) + Math.pow(o - Ee, 2));
        ke >= m.left &&
          ke <= m.right &&
          Ee >= m.top &&
          Ee <= m.bottom &&
          a < c &&
          ((c = a), (l = u));
      }),
        l && (r = l));
    }
    r !== Q && qr(r);
  }
  function At(t) {
    if (!ie) return;
    const e = t.target;
    if (pe(e)) return;
    const r = t.relatedTarget;
    (r && Q && Q.contains(r)) || Hr();
  }
  function Ct(t) {
    ie && ((ke = t.clientX), (Ee = t.clientY), $r(t.clientX, t.clientY));
  }
  function vt(t) {
    if (!ie) return;
    (t.preventDefault(), t.stopPropagation());
    let e = Q || document.elementFromPoint(t.clientX, t.clientY);
    if (!e || pe(e)) return;
    O = e;
    const r = Be(e);
    (chrome.runtime.sendMessage({
      action: "elementClicked",
      elementDetails: r,
    }),
      St(e));
  }
  function Vr(t) {
    for (const e of t.childNodes)
      if (
        e.nodeType === Node.TEXT_NODE &&
        e.textContent &&
        e.textContent.trim()
      )
        return !0;
    return !1;
  }
  function Gr() {
    const t = O;
    if (!t) return { ok: !1, reason: "no-selection" };
    const e = t.querySelectorAll("*");
    let r = null;
    for (const l of e)
      if (!pe(l) && he(l) && Vr(l)) {
        r = l;
        break;
      }
    if (!r) return { ok: !1, reason: "no-text-child" };
    ((O = r), (Q = r));
    const n = Be(r);
    return (
      chrome.runtime.sendMessage({
        action: "elementClicked",
        elementDetails: n,
      }),
      Le(r),
      Me(r),
      Te(r),
      Re(r),
      St(r),
      r.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      { ok: !0 }
    );
  }
  var le = null;
  function St(t) {
    t &&
      (le ||
        ((le = document.createElement("style")),
        (le.id = "asset-inspector-editing-outline-style"),
        (le.textContent = `
      .asset-inspector-editing {
        outline: 1.5px dashed #6366F1 !important;
        outline-offset: 2px !important;
      }
    `),
        document.head.appendChild(le)),
      document
        .querySelectorAll(".asset-inspector-editing")
        .forEach((e) => e.classList.remove("asset-inspector-editing")),
      t.classList.add("asset-inspector-editing"));
  }
  function kt() {
    (document
      .querySelectorAll(".asset-inspector-editing")
      .forEach((t) => t.classList.remove("asset-inspector-editing")),
      le && (le.remove(), (le = null)));
  }
  function Jr() {
    ((ie = !0),
      _r(),
      Pr(),
      Or(),
      Dr(),
      document.addEventListener("mouseover", xt, !0),
      document.addEventListener("mouseout", At, !0),
      document.addEventListener("mousemove", Ct, !0),
      document.addEventListener("click", vt, !0),
      document.addEventListener("keydown", wt, !0),
      (document.body.style.cursor = "crosshair"),
      typeof Tt == "function" && Tt());
  }
  function Et(t = {}) {
    const e = t.keepSelection === !0;
    ((ie = !1),
      document.removeEventListener("mouseover", xt, !0),
      document.removeEventListener("mouseout", At, !0),
      document.removeEventListener("mousemove", Ct, !0),
      document.removeEventListener("click", vt, !0),
      document.removeEventListener("keydown", wt, !0),
      (document.body.style.cursor = ""),
      typeof Rt == "function" && Rt(),
      J && (J.style.display = "none"),
      Ge(),
      Br(),
      q && (q.remove(), (q = null)),
      Z && (Z.remove(), (Z = null)),
      (Q = null),
      e || ((O = null), typeof kt == "function" && kt()));
  }
  function Yr() {
    return ie;
  }
  var me = new WeakMap();
  function Xr() {
    if (!O) return null;
    let t = me.get(O);
    return (t || ((t = {}), me.set(O, t)), t);
  }
  function Kr(t) {
    return t.replace(/[A-Z]/g, (e) => "-" + e.toLowerCase());
  }
  function Zr(t, e) {
    const r = Xr();
    if (!r) return { ok: !1, reason: "no-selection" };
    const n = Kr(t);
    if (n in r) r[n].current = e;
    else {
      const l = O.style.getPropertyValue(n),
        c = window.getComputedStyle(O).getPropertyValue(n);
      r[n] = { original: l || c || "", hadInline: !!l, current: e };
    }
    return (
      e === "" || e == null
        ? O.style.removeProperty(n)
        : O.style.setProperty(n, e, "important"),
      { ok: !0, count: Object.keys(r).length }
    );
  }
  function Qr() {
    if (!O) return { ok: !0, count: 0 };
    const t = me.get(O);
    return t
      ? (Object.keys(t).forEach((e) => {
          const r = t[e];
          r.hadInline && r.original
            ? O.style.setProperty(e, r.original)
            : O.style.removeProperty(e);
        }),
        me.delete(O),
        { ok: !0, count: 0 })
      : { ok: !0, count: 0 };
  }
  function en() {
    if (!O) return "";
    const t = me.get(O);
    if (!t) return "";
    const e = Object.keys(t).map((r) => `  ${r}: ${t[r].current};`);
    return e.length
      ? `{
${e.join(`
`)}
}`
      : "";
  }
  function tn() {
    if (!O) return 0;
    const t = me.get(O);
    return t ? Object.keys(t).length : 0;
  }
  function rn(t) {
    const e = [t, ...t.querySelectorAll("*")];
    let r = 0,
      n = 0;
    const l = [
      /^(flex|grid|block|inline|hidden)$/,
      /^(w|h|p|m|px|py|mx|my|pt|pb|pl|pr|mt|mb|ml|mr)-/,
      /^(text|bg|border|rounded|shadow|font|leading|tracking)-/,
      /^(items|justify|gap|space|overflow)-/,
      /^(absolute|relative|fixed|sticky)$/,
      /^(top|right|bottom|left|inset|z)-/,
      /^(hover|focus|active|dark|sm|md|lg|xl|2xl):/,
      /^(min|max)-(w|h)-/,
      /^(opacity|scale|rotate|translate)-/,
      /^(cursor|select|transition|duration|ease)-/,
    ];
    for (const c of e) {
      if (!c.className || typeof c.className != "string") continue;
      const u = c.className.split(/\s+/).filter((m) => m);
      n += u.length;
      for (const m of u)
        for (const s of l)
          if (s.test(m)) {
            r++;
            break;
          }
    }
    return r >= 3 && n > 0 && r / n >= 0.3;
  }
  function Pe(t) {
    if (!t || t === "none") return t;
    let e = t;
    return (
      (e = e.replace(/\bnull\b/g, "transparent")),
      (e = e.replace(
        /oklab\(([\d.]+)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.]+))?\)/g,
        (r) => G(r) || r,
      )),
      (e = e.replace(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g,
        (r) => G(r) || r,
      )),
      e
    );
  }
  function nn(t) {
    if (!t) return null;
    let e = t.split(",")[0].replace(/['"]/g, "").trim();
    if (e.startsWith("__")) {
      const r = e.match(/^__([\w]+)_([0-9a-f]+)/i);
      if (r && r[1]) return r[1].replace(/_/g, " ").trim();
    }
    return e.replace(/_/g, " ").trim();
  }
  function Je(t) {
    return t === "rgb(0, 0, 0)" || t === "rgba(0, 0, 0, 1)" || t === "#000000";
  }
  function Ye(t) {
    return (
      t === "rgb(255, 255, 255)" ||
      t === "rgba(255, 255, 255, 1)" ||
      t === "#ffffff" ||
      t === "#FFFFFF"
    );
  }
  function _e(t) {
    if (!t || t === "none") return null;
    const e = t.match(
      /linear-gradient\([^,]+,\s*((?:rgba?\([^)]+\)|#[a-fA-F0-9]{3,8}))(?:\s+[\d.]+%?)?\s*,\s*((?:rgba?\([^)]+\)|#[a-fA-F0-9]{3,8}))(?:\s+[\d.]+%?)?\s*\)/,
    );
    if (e) {
      const r = G(e[1]),
        n = G(e[2]);
      if (r && n && r.toLowerCase() === n.toLowerCase()) return r;
    }
    return null;
  }
  function Ft(t) {
    if (!t || t === "none") return null;
    for (const e of [
      /(?:oklab|oklch)\([^)]+\)/gi,
      /rgba?\([^)]+\)/gi,
      /hsla?\([^)]+\)/gi,
      /#[a-fA-F0-9]{3,8}\b/gi,
    ]) {
      const r = t.match(e);
      if (r && r.length > 0) {
        const n = G(r[0]);
        if (n) return n;
      }
    }
    return null;
  }
  function on(t) {
    const e = t.getBoundingClientRect();
    if (e.width === 0 || e.height === 0) return null;
    const r = t.querySelectorAll("*");
    if (r.length === 0) {
      const n = t.parentElement;
      if (n) {
        const l = Array.from(n.children).filter((c) => c !== t);
        for (const c of l) {
          const u = c.getBoundingClientRect();
          if (u.width === 0 || u.height === 0) continue;
          const m = window.getComputedStyle(c),
            s = m.backgroundColor,
            o = m.backgroundImage;
          if ((u.width * u.height) / (e.width * e.height) >= 0.7) {
            if (o && o !== "none" && o.includes("gradient")) {
              const a = _e(o);
              if (a)
                return {
                  value: a,
                  detail: `sibling <${c.tagName.toLowerCase()}> gradient`,
                };
            }
            if (!ue(s) && !Je(s) && !Ye(s))
              return {
                value: s,
                detail: `sibling <${c.tagName.toLowerCase()}>`,
              };
          }
        }
      }
    }
    for (const n of r) {
      const l = n.getBoundingClientRect();
      if (l.width === 0 || l.height === 0) continue;
      const c = window.getComputedStyle(n),
        u = c.backgroundColor,
        m = c.backgroundImage;
      if ((l.width * l.height) / (e.width * e.height) >= 0.7) {
        if (m && m !== "none" && m.includes("gradient")) {
          const s = _e(m);
          if (s)
            return {
              value: s,
              detail: `<${n.tagName.toLowerCase()}> gradient`,
            };
        }
        if (!ue(u) && !Je(u) && !Ye(u))
          return { value: u, detail: `<${n.tagName.toLowerCase()}>` };
      }
    }
    return null;
  }
  function sn(t) {
    let e = t.parentElement,
      r = null;
    for (; e;) {
      const n = window.getComputedStyle(e),
        l = n.backgroundColor,
        c = n.backgroundImage;
      if (c && c !== "none" && c.includes("gradient")) {
        const u = _e(c);
        if (u)
          return { value: u, detail: `<${e.tagName.toLowerCase()}> gradient` };
        const m = Ft(c);
        if (m)
          return {
            value: m,
            detail: `<${e.tagName.toLowerCase()}> gradient`,
            isGradient: !0,
            gradientValue: c,
          };
      }
      if (!ue(l)) {
        const u = ht(l);
        if (u > 0.8)
          return { value: l, detail: `<${e.tagName.toLowerCase()}>` };
        u > 0.3 &&
          !r &&
          (r = {
            value: l,
            detail: `<${e.tagName.toLowerCase()}> (semi-transparent)`,
          });
      }
      if (e === document.documentElement) break;
      e = e.parentElement;
    }
    return (
      r || {
        value: "rgb(255, 255, 255)",
        source: "default",
        detail: "page background",
      }
    );
  }
  function Mt(t) {
    const e = window.getComputedStyle(t),
      r = e.backgroundColor,
      n = e.backgroundImage;
    if (n && n !== "none" && n.includes("gradient")) {
      const l = _e(n);
      if (l) return { value: l, detail: "gradient" };
      const c = Ft(n);
      if (c)
        return {
          value: c,
          detail: "gradient",
          isGradient: !0,
          gradientValue: n,
        };
      if (!ue(r)) return { value: r, detail: "has gradient overlay" };
    }
    if (ue(r)) return sn(t);
    if (Je(r) || Ye(r)) {
      const l = on(t);
      if (l) return l;
    }
    return { value: r, detail: null };
  }
  function Be(t) {
    const e = window.getComputedStyle(t),
      r = t.className
        ? typeof t.className == "string"
          ? t.className
          : t.className.baseVal || ""
        : "",
      n = r ? r.split(" ").filter((h) => h.trim() !== "") : [],
      l =
        n.find(
          (h) =>
            !h.match(/^ember\d+$/) &&
            !h.match(/^[A-Z][a-zA-Z]{20,}$/) &&
            !h.match(/^[a-f0-9]{8,}$/) &&
            !h.match(/^framer-[a-z0-9]{6,}$/i),
        ) ||
        n[0] ||
        "",
      c = t.getAttribute("data-framer-name"),
      u = c || l,
      m = Mt(t),
      s = e.backgroundImage;
    let o = !1,
      a = null;
    s && s !== "none" && s.includes("gradient")
      ? ((o = !0), (a = s))
      : m.isGradient && m.gradientValue && ((o = !0), (a = m.gradientValue));
    const i =
        c &&
        (c.toLowerCase().includes("overlay") ||
          c.toLowerCase().includes("hover")),
      p = e.color;
    let f = null;
    if (i && t.parentElement) {
      const h = t.parentElement,
        w = window.getComputedStyle(h),
        C = Mt(h);
      let d = w.color;
      const y = h.querySelectorAll(
        'p, span, h1, h2, h3, h4, h5, h6, div[class*="text"], div[data-framer-component-type="RichTextContainer"]',
      );
      if (y.length > 0)
        for (const k of y) {
          const L = window.getComputedStyle(k).color;
          if (L && L !== "rgb(0, 0, 238)" && L !== "rgba(0, 0, 238, 1)") {
            d = L;
            break;
          }
        }
      let x = null;
      const F =
          w.borderTopWidth &&
          w.borderTopWidth !== "0px" &&
          w.borderTopStyle &&
          w.borderTopStyle !== "none",
        T =
          w.borderRightWidth &&
          w.borderRightWidth !== "0px" &&
          w.borderRightStyle &&
          w.borderRightStyle !== "none",
        M =
          w.borderBottomWidth &&
          w.borderBottomWidth !== "0px" &&
          w.borderBottomStyle &&
          w.borderBottomStyle !== "none",
        E =
          w.borderLeftWidth &&
          w.borderLeftWidth !== "0px" &&
          w.borderLeftStyle &&
          w.borderLeftStyle !== "none";
      if (F) {
        const k = w.borderTopColor;
        k && k !== "rgb(0, 0, 238)" && k !== "rgba(0, 0, 238, 1)" && (x = k);
      } else if (T) {
        const k = w.borderRightColor;
        k && k !== "rgb(0, 0, 238)" && k !== "rgba(0, 0, 238, 1)" && (x = k);
      } else if (M) {
        const k = w.borderBottomColor;
        k && k !== "rgb(0, 0, 238)" && k !== "rgba(0, 0, 238, 1)" && (x = k);
      } else if (E) {
        const k = w.borderLeftColor;
        k && k !== "rgb(0, 0, 238)" && k !== "rgba(0, 0, 238, 1)" && (x = k);
      }
      f = {
        tagName: h.tagName.toLowerCase(),
        framerName: h.getAttribute("data-framer-name"),
        backgroundColor: C.value,
        color: d,
        borderColor: x || null,
      };
    }
    const g = {
      tagName: t.tagName.toLowerCase(),
      className: r,
      id: t.id || "",
      selector: `${t.tagName.toLowerCase()}${t.id ? "#" + t.id : ""}${r ? "." + r.split(" ").join(".") : ""}`,
      simplifiedSelector: u
        ? c
          ? `${t.tagName.toLowerCase()}[${c}]`
          : `${t.tagName.toLowerCase()}.${u}`
        : t.tagName.toLowerCase(),
      textContent: (t.innerText || t.textContent || "").trim() || null,
      hasDirectText: (() => {
        for (const h of t.childNodes)
          if (
            h.nodeType === Node.TEXT_NODE &&
            h.textContent &&
            h.textContent.trim()
          )
            return !0;
        return !1;
      })(),
      color: p && !ue(p) ? p : null,
      backgroundColor: m.value,
      backgroundSource: m.source,
      backgroundSourceDetail: m.detail,
      borderColor: (() => {
        const h =
            e.borderTopWidth &&
            e.borderTopWidth !== "0px" &&
            e.borderTopStyle &&
            e.borderTopStyle !== "none",
          w =
            e.borderRightWidth &&
            e.borderRightWidth !== "0px" &&
            e.borderRightStyle &&
            e.borderRightStyle !== "none",
          C =
            e.borderBottomWidth &&
            e.borderBottomWidth !== "0px" &&
            e.borderBottomStyle &&
            e.borderBottomStyle !== "none",
          d =
            e.borderLeftWidth &&
            e.borderLeftWidth !== "0px" &&
            e.borderLeftStyle &&
            e.borderLeftStyle !== "none";
        return h
          ? e.borderTopColor
          : w
            ? e.borderRightColor
            : C
              ? e.borderBottomColor
              : d
                ? e.borderLeftColor
                : null;
      })(),
      hasGradient: o,
      gradient: a,
      fontFamily:
        nn(e.fontFamily) ||
        (e.fontFamily
          ? e.fontFamily.split(",")[0].replace(/['"]/g, "").trim()
          : ""),
      fontSize: e.fontSize,
      fontWeight: e.fontWeight,
      lineHeight: e.lineHeight,
      letterSpacing: e.letterSpacing,
      textAlign: e.textAlign,
      width: e.width,
      height: e.height,
      padding: e.padding,
      margin: e.margin,
      border: Pe(e.border),
      borderRadius: e.borderRadius,
      borderWidth: e.borderWidth,
      borderStyle: e.borderStyle,
      display: e.display,
      boxSizing: e.boxSizing,
      overflow: e.overflow,
      flexDirection: e.flexDirection,
      flexWrap: e.flexWrap,
      alignItems: e.alignItems,
      justifyContent: e.justifyContent,
      alignContent: e.alignContent,
      gap: e.gap,
      gridTemplateColumns: e.gridTemplateColumns,
      gridTemplateRows: e.gridTemplateRows,
      rowGap: e.rowGap,
      columnGap: e.columnGap,
      position: e.position,
      top: e.top,
      right: e.right,
      bottom: e.bottom,
      left: e.left,
      zIndex: e.zIndex,
      boxShadow: Pe(e.boxShadow),
      opacity: e.opacity,
      animation: e.animation,
      animationName: e.animationName,
      animationDuration: e.animationDuration,
      animationTimingFunction: e.animationTimingFunction,
      animationDelay: e.animationDelay,
      animationIterationCount: e.animationIterationCount,
      animationDirection: e.animationDirection,
      animationFillMode: e.animationFillMode,
      transition: e.transition,
      transitionProperty: e.transitionProperty,
      transitionDuration: e.transitionDuration,
      transitionTimingFunction: e.transitionTimingFunction,
      transitionDelay: e.transitionDelay,
      transform: e.transform,
      isOverlay: i,
      parentElement: f,
    };
    try {
      const h = {
        selector: g.selector,
        tagName: g.tagName,
        color: g.color,
        backgroundColor: g.backgroundColor,
        className: g.className,
      };
      typeof chrome < "u" &&
        chrome.runtime &&
        chrome.runtime.sendMessage &&
        chrome.runtime.sendMessage(
          {
            action: "logFromContent",
            message: "captureElementDetails",
            details: h,
          },
          () => {},
        );
    } catch {}
    const b = e.animationName && e.animationName !== "none",
      A = e.transition && e.transition !== "all 0s ease 0s";
    if (
      ((b || A) &&
        ((g.hasAnimations = !0),
        b && (g.animationKeyframes = an(e.animationName)),
        (g.hoverStyles = ln(t))),
      (g.hasTailwind = rn(t)),
      t.tagName.toLowerCase() === "img" &&
        t.src &&
        ((g.isImage = !0),
        (g.imageSrc = t.src),
        (g.imageAlt = t.alt || "No alt text"),
        (g.imageSize = `${t.naturalWidth}x${t.naturalHeight}`)),
      t.tagName.toLowerCase() === "video")
    ) {
      if (((g.isVideo = !0), t.src)) g.videoSrc = t.src;
      else {
        const h = t.querySelectorAll("source");
        h.length > 0 &&
          ((g.videoSrc = h[0].src), (g.videoType = h[0].type || "video/mp4"));
      }
      ((g.videoWidth =
        t.videoWidth || t.width || Math.round(t.getBoundingClientRect().width)),
        (g.videoHeight =
          t.videoHeight ||
          t.height ||
          Math.round(t.getBoundingClientRect().height)),
        (g.videoSize = `${g.videoWidth}x${g.videoHeight}`),
        (g.videoDuration = t.duration
          ? `${Math.round(t.duration)}s`
          : "Unknown"),
        (g.videoControls = t.controls),
        (g.videoAutoplay = t.autoplay),
        (g.videoLoop = t.loop),
        (g.videoMuted = t.muted));
    }
    if (t.ownerSVGElement || t.tagName.toLowerCase() === "svg") {
      const h =
        t.tagName.toLowerCase() === "svg"
          ? t
          : t.ownerSVGElement || t.closest("svg");
      if (!h) console.warn("Could not find parent SVG element");
      else {
        g.isSVG = !0;
        let w = ct(h);
        w = ft(h, w);
        const C = h.getAttribute("viewBox"),
          d = h.getBoundingClientRect();
        let y = w.getAttribute("width") || h.getAttribute("width"),
          x = w.getAttribute("height") || h.getAttribute("height");
        const F = typeof y == "string" && y.includes("%"),
          T = typeof x == "string" && x.includes("%");
        if (
          ((!y || F) && d.width > 0 && (y = Math.round(d.width)),
          (!x || T) && d.height > 0 && (x = Math.round(d.height)),
          (!y || !x) && C)
        ) {
          const k = C.split(/\s+/);
          k.length === 4 &&
            (y || (y = parseFloat(k[2])), x || (x = parseFloat(k[3])));
        }
        (y || (y = 24), x || (x = 24));
        const M = 400;
        if (y > M || x > M) {
          const k = Math.min(M / y, M / x);
          ((y = Math.round(y * k)), (x = Math.round(x * k)));
        }
        (w.setAttribute("width", y),
          w.setAttribute("height", x),
          w.querySelectorAll('[width="100%"]').forEach((k) => {
            k.setAttribute("width", y);
          }),
          w.querySelectorAll('[height="100%"]').forEach((k) => {
            k.setAttribute("height", x);
          }),
          (g.svgCode = w.outerHTML));
        const E = w.outerHTML.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        ((g.svgDataUrl = `data:image/svg+xml,${encodeURIComponent(E).replace(/'/g, "%27").replace(/"/g, "%22")}`),
          (g.svgSize = `${Math.round(y)}x${Math.round(x)}`),
          (g.svgViewBox = C || "none"));
      }
    }
    const v = Array.from(t.classList);
    if (
      v.some((h) => h.includes("iconify") || h.match(/^i-[\w-]+:[\w-]+$/)) &&
      !g.isSVG
    ) {
      let h = null,
        w = null,
        C = null;
      const d = v.find((y) => y.match(/^i-[\w-]+:[\w-]+$/));
      if (d) {
        const y = d.match(/^i-([\w-]+):([\w-]+)$/);
        y && ((w = y[1]), (C = y[2]), (h = `${w}:${C}`));
      }
      if (!h && t.hasAttribute("data-icon")) {
        h = t.getAttribute("data-icon");
        const y = h.split(":");
        y.length === 2 && ((w = y[0]), (C = y[1]));
      }
      if (h) {
        ((g.isIconify = !0),
          (g.iconIdentifier = h),
          (g.iconCollection = w),
          (g.iconName = C));
        const y = e.backgroundImage;
        if (y && y.includes("data:image/svg+xml")) {
          const x = y.match(/url\(["']?(data:image\/svg\+xml[^"')]+)["']?\)/);
          if (x) {
            const F = x[1];
            try {
              let T = null;
              if (F.includes("base64,")) {
                const M = F.split("base64,")[1];
                T = atob(M);
              } else {
                const M = F.split("data:image/svg+xml,")[1];
                T = decodeURIComponent(M);
              }
              if (T) {
                const M = new DOMParser()
                  .parseFromString(T, "image/svg+xml")
                  .querySelector("svg");
                if (M) {
                  const E = t.getBoundingClientRect();
                  let k = M.getAttribute("width") || Math.round(E.width) || 24,
                    L = M.getAttribute("height") || Math.round(E.height) || 24;
                  (M.setAttribute("width", k), M.setAttribute("height", L));
                  const D = e.color;
                  if (D) {
                    const P = G(D);
                    !M.getAttribute("fill") &&
                      !M.getAttribute("currentColor") &&
                      M.setAttribute("fill", P);
                  }
                  ((g.svgCode = M.outerHTML), (g.isSVG = !0));
                  const I = M.outerHTML
                    .replace(/\n/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
                  ((g.svgDataUrl = `data:image/svg+xml,${encodeURIComponent(I).replace(/'/g, "%27").replace(/"/g, "%22")}`),
                    (g.svgSize = `${k}x${L}`),
                    (g.svgViewBox = M.getAttribute("viewBox") || "none"));
                }
              }
            } catch (T) {
              console.error("Error extracting Iconify SVG:", T);
            }
          }
        }
      }
    }
    const S = t.tagName.toLowerCase();
    if (S === "lottie-player" || S === "dotlottie-player") {
      ((g.isLottieAnimation = !0),
        (g.lottieType = S === "dotlottie-player" ? "DotLottie" : "Lottie"));
      const h = t.getAttribute("src");
      if (h) {
        try {
          g.lottieUrl = new URL(h, window.location.href).href;
        } catch {
          g.lottieUrl = h;
        }
        g.lottieName = h.split("/").pop().replace(".json", "");
      }
      ((g.lottieLoop = t.getAttribute("loop") !== null),
        (g.lottieAutoplay = t.getAttribute("autoplay") !== null),
        (g.lottieSpeed = t.getAttribute("speed") || "1"),
        (g.lottieDirection = t.getAttribute("direction") || "1"),
        (g.lottieHover = t.getAttribute("hover") === "true"),
        (g.lottieMode = t.getAttribute("mode") || "normal"),
        (g.lottieBackground = Pe(
          t.getAttribute("background") || "transparent",
        )));
      const w = t.getBoundingClientRect();
      if (
        ((g.lottieWidth =
          t.getAttribute("width") || `${Math.round(w.width)}px`),
        (g.lottieHeight =
          t.getAttribute("height") || `${Math.round(w.height)}px`),
        t.__lottie || t.lottie || t._lottie)
      ) {
        const C = t.__lottie || t.lottie || t._lottie;
        C.animationData
          ? (g.lottieData = JSON.stringify(C.animationData))
          : C.renderer &&
            C.renderer.animationData &&
            (g.lottieData = JSON.stringify(C.renderer.animationData));
      }
    }
    if (t.tagName.toLowerCase() === "canvas") {
      ((g.isCanvas = !0),
        (g.canvasWidth =
          t.width || Math.round(t.getBoundingClientRect().width)),
        (g.canvasHeight =
          t.height || Math.round(t.getBoundingClientRect().height)),
        (g.canvasSize = `${g.canvasWidth}x${g.canvasHeight}`),
        (g.canvasContext = "unknown"));
      try {
        t.getContext("webgl2")
          ? (g.canvasContext = "WebGL 2")
          : t.getContext("webgl") || t.getContext("experimental-webgl")
            ? (g.canvasContext = "WebGL")
            : t.getContext("2d") && (g.canvasContext = "2D");
      } catch {
        t.__gl || t._gl
          ? (g.canvasContext = "WebGL")
          : (g.canvasContext = "2D");
      }
      g.canvasLibrary = null;
      try {
        typeof window.THREE < "u"
          ? (g.canvasLibrary = "Three.js")
          : typeof window.p5 < "u"
            ? (g.canvasLibrary = "p5.js")
            : typeof window.PIXI < "u"
              ? (g.canvasLibrary = "PixiJS")
              : typeof window.fabric < "u"
                ? (g.canvasLibrary = "Fabric.js")
                : typeof window.Konva < "u"
                  ? (g.canvasLibrary = "Konva")
                  : typeof window.createjs < "u"
                    ? (g.canvasLibrary = "CreateJS")
                    : typeof window.Phaser < "u" &&
                      (g.canvasLibrary = "Phaser");
      } catch {}
      ((g.canvasTainted = !1), (g.canvasSnapshot = null));
      try {
        g.canvasSnapshot = t.toDataURL("image/png");
      } catch {
        g.canvasTainted = !0;
      }
    }
    return g;
  }
  function an(t) {
    try {
      const e = Array.from(document.styleSheets);
      for (const r of e)
        try {
          const n = Array.from(r.cssRules || r.rules || []);
          for (const l of n)
            if (l instanceof CSSKeyframesRule && l.name === t) {
              let c = `@keyframes ${l.name} {
`;
              const u = Array.from(l.cssRules);
              for (const m of u)
                ((c += `  ${m.keyText} {
`),
                  (c += `    ${m.style.cssText}
`),
                  (c += `  }
`));
              return ((c += "}"), c);
            }
        } catch {
          continue;
        }
    } catch (e) {
      console.error("Error extracting keyframes:", e);
    }
    return null;
  }
  function ln(t) {
    try {
      cn(t);
      const e = Array.from(document.styleSheets),
        r = {};
      for (const n of e)
        try {
          const l = Array.from(n.cssRules || n.rules || []);
          for (const c of l)
            if (
              c instanceof CSSStyleRule &&
              c.selectorText &&
              c.selectorText.includes(":hover") &&
              un(t, c.selectorText)
            )
              for (let u = 0; u < c.style.length; u++) {
                const m = c.style[u];
                r[m] = Pe(c.style.getPropertyValue(m));
              }
        } catch {
          continue;
        }
      return Object.keys(r).length > 0 ? r : null;
    } catch (e) {
      return (console.error("Error extracting hover styles:", e), null);
    }
  }
  function cn(t) {
    if (t.id) return `#${t.id}`;
    const e = t.className
      ? typeof t.className == "string"
        ? t.className
        : t.className.baseVal || ""
      : "";
    if (e) {
      const r = e.split(" ").filter((n) => n.trim() !== "");
      if (r.length > 0) return `.${r.join(".")}`;
    }
    return t.tagName.toLowerCase();
  }
  function un(t, e) {
    const r = e.replace(/:hover/g, "");
    try {
      return t.matches(r);
    } catch {
      return !1;
    }
  }
  var fe = null,
    De = !1;
  async function Tt() {
    if (!(fe || De)) {
      De = !0;
      try {
        const t = {
            allCSS: "",
            externalCSS: {},
            externalUrls: [],
            fontUrls: [],
            timestamp: Date.now(),
          },
          e = [],
          r = [];
        for (const n of document.styleSheets)
          if (
            !(n.href && n.href.startsWith("chrome-extension://")) &&
            !n.ownerNode?.id?.startsWith("asset-inspector-")
          )
            try {
              if (n.href) (r.push(n.href), t.externalUrls.push(n.href));
              else {
                const l = n.cssRules || n.rules;
                l &&
                  e.push(
                    [...l].map((c) => c.cssText).join(`
`),
                  );
              }
            } catch {
              n.href && (r.push(n.href), t.externalUrls.push(n.href));
            }
        if (r.length > 0)
          try {
            const n = await new Promise((l) => {
              chrome.runtime.sendMessage(
                { action: "fetchExternalStylesheets", urls: r },
                l,
              );
            });
            if (n && n.success)
              for (const l of r)
                n.results[l]?.success && (t.externalCSS[l] = n.results[l].css);
          } catch (n) {
            console.warn(
              "[Web Inspector] CSS preload: failed to fetch external stylesheets:",
              n,
            );
          }
        ((t.allCSS = [...e, ...Object.values(t.externalCSS)].filter(Boolean)
          .join(`
`)),
          (fe = t));
      } catch (t) {
        console.warn("[Web Inspector] CSS preload failed:", t);
      } finally {
        De = !1;
      }
    }
  }
  function Rt() {
    ((fe = null), (De = !1));
  }
  async function Xe(t, e = {}) {
    if (!t) return { error: "No element provided" };
    try {
      const r = dn(),
        n = await hn(t),
        l = await xn(t, e, n),
        c = Fn(n, l.cssText, l.externalUrls, r),
        u = await Bt(l.cssText, "css"),
        m = {
          elementCount: Pt(t),
          cssRuleCount: l.ruleCount,
          hasAnimations: l.hasAnimations,
          hasSvgs: t.querySelector("svg") !== null,
          hasImages: t.querySelector("img") !== null,
          hasExternalFonts: l.fontUrls.length > 0,
          externalStylesheets: l.externalUrls.length,
          hasPseudoElements: l.hasPseudoElements || !1,
          truncated: !1,
        };
      let s = null,
        o = "",
        a = null,
        i = null;
      if (r)
        try {
          ((s = n), (a = gt(n, "")), (i = bt(n, "")));
        } catch (p) {
          console.warn("[Web Inspector] Tailwind format generation failed:", p);
        }
      else
        try {
          const p = fn(n, l.cssText);
          if (p) {
            const f = Ar(p.scopedHtml, p.scopedCSS);
            ((s = Cr(f.tailwindHtml, f.fallbackCSS)),
              (o = f.fallbackCSS),
              (a = gt(f.tailwindHtml, f.fallbackCSS)),
              (i = bt(f.tailwindHtml, f.fallbackCSS)));
          }
        } catch (p) {
          console.warn(
            "[Web Inspector] Tailwind conversion failed (non-fatal):",
            p,
          );
        }
      return {
        html: n,
        css: u,
        preview: c,
        stats: m,
        hasTailwind: r,
        tailwindHtml: s,
        tailwindFallbackCSS: o,
        vueSfc: a,
        reactJsx: i,
      };
    } catch (r) {
      return (
        console.error("Component extraction failed:", r),
        { error: r.message || "Extraction failed" }
      );
    }
  }
  function fn(t, e) {
    if (!t || !e || typeof postcss > "u") return null;
    let r;
    try {
      r = new DOMParser().parseFromString(t, "text/html");
    } catch {
      return null;
    }
    const n = r.body.firstElementChild || r.body,
      l = [n, ...n.querySelectorAll("*")];
    let c;
    try {
      c = postcss.parse(e, { from: void 0 });
    } catch {
      return null;
    }
    const u = [],
      m = [];
    c.walkRules((a) => {
      let i = a.parent;
      for (; i;) {
        if (
          (i.type === "atrule" &&
            (i.name === "keyframes" || i.name === "-webkit-keyframes")) ||
          (i.type === "atrule" && i.name === "font-face")
        )
          return;
        i = i.parent;
      }
      const p = [];
      if (
        (a.walkDecls((f) => {
          p.push({ prop: f.prop, value: f.value });
        }),
        p.length > 0)
      )
        for (const f of a.selectors)
          if (/::/.test(f)) {
            const g = p.map((b) => `  ${b.prop}: ${b.value};`).join(`
`);
            m.push(`${f} {
${g}
}`);
          } else u.push({ selector: f, declarations: p });
    });
    const s = [];
    let o = 0;
    for (const a of l) {
      const i = [],
        p = {};
      for (const { selector: b, declarations: A } of u) {
        const v = b.match(
            /(:(hover|focus|focus-visible|focus-within|active|disabled|visited|first-child|last-child|odd|even|placeholder))$/,
          ),
          S = v ? b.replace(v[0], "") : b,
          h = v ? v[2] : null;
        let w = !1;
        try {
          w = a.matches(S);
        } catch {
          try {
            w = n.querySelector(S) === a;
          } catch {}
        }
        w && (h ? (p[h] || (p[h] = []), p[h].push(...A)) : i.push(...A));
      }
      if (i.length === 0 && Object.keys(p).length === 0) continue;
      const f = "c-" + o++,
        g = a.getAttribute("class");
      if ((a.setAttribute("class", g ? g + " " + f : f), i.length > 0)) {
        const b = Lt(i).map((A) => `  ${A.prop}: ${A.value};`).join(`
`);
        s.push(`.${f} {
${b}
}`);
      }
      for (const [b, A] of Object.entries(p))
        if (A.length > 0) {
          const v = Lt(A).map((S) => `  ${S.prop}: ${S.value};`).join(`
`);
          s.push(`.${f}:${b} {
${v}
}`);
        }
    }
    return s.length === 0 && m.length === 0
      ? null
      : (m.length > 0 && s.push(...m),
        {
          scopedHtml: n.outerHTML,
          scopedCSS: s.join(`

`),
        });
  }
  function Lt(t) {
    const e = new Map();
    for (const r of t) e.set(r.prop, r.value);
    return [...e.entries()].map(([r, n]) => ({ prop: r, value: n }));
  }
  function dn() {
    if (
      document.querySelectorAll(
        'script[src*="tailwindcss"], script[src*="cdn.tailwindcss"]',
      ).length > 0
    )
      return !0;
    for (const t of document.styleSheets) {
      if (t.href && /tailwind/i.test(t.href)) return !0;
      try {
        const e = t.cssRules || t.rules;
        if (!e) continue;
        for (const r of e)
          if (
            r.type === CSSRule.SUPPORTS_RULE ||
            r.cssText?.includes?.("@layer utilities") ||
            (r.selectorText &&
              /^\.(flex|grid|hidden|block|inline-flex|relative|absolute|sticky)\s*$/.test(
                r.selectorText,
              ))
          )
            return !0;
      } catch {}
    }
    return !1;
  }
  function Pt(t) {
    let e = 1;
    for (const r of t.children) e += Pt(r);
    return e;
  }
  async function hn(t) {
    const e = [t, ...t.querySelectorAll("*")],
      r = t.cloneNode(!0);
    r.classList.add("exported-root");
    const n = [r, ...r.querySelectorAll("*")],
      l = window.location.origin,
      c = [];
    for (let m = 0; m < n.length; m++) {
      const s = n[m];
      if (s.tagName === "IMG") {
        const a = e[m]?.currentSrc,
          i = s.getAttribute("src");
        if (a && a.startsWith("blob:"))
          c.push({ element: s, attr: "src", url: a });
        else if (a && a.startsWith("http")) s.setAttribute("src", a);
        else if (i && i.startsWith("blob:"))
          c.push({ element: s, attr: "src", url: i });
        else if (i && !i.startsWith("http") && !i.startsWith("data:") && i)
          try {
            s.setAttribute("src", new URL(i, window.location.href).href);
          } catch {}
      }
      if (s.tagName === "VIDEO" || s.tagName === "AUDIO") {
        const a = s.getAttribute("src");
        if (a && a.startsWith("blob:"))
          c.push({ element: s, attr: "src", url: a });
        else if (a && !a.startsWith("http") && !a.startsWith("data:"))
          try {
            s.setAttribute("src", new URL(a, window.location.href).href);
          } catch {}
        if (s.hasAttribute("poster")) {
          const i = s.getAttribute("poster");
          if (
            i &&
            !i.startsWith("http") &&
            !i.startsWith("data:") &&
            !i.startsWith("blob:")
          )
            try {
              s.setAttribute("poster", new URL(i, window.location.href).href);
            } catch {}
        }
      }
      if (s.tagName === "SOURCE" && s.hasAttribute("src")) {
        const a = s.getAttribute("src");
        if (a && a.startsWith("blob:"))
          c.push({ element: s, attr: "src", url: a });
        else if (a && !a.startsWith("http") && !a.startsWith("data:"))
          try {
            s.setAttribute("src", new URL(a, window.location.href).href);
          } catch {}
      }
      if (s.hasAttribute("srcset")) {
        const a = s
          .getAttribute("srcset")
          .split(",")
          .map((i) => {
            const p = i.trim().split(/\s+/);
            return (
              p[0] &&
                !p[0].startsWith("http") &&
                !p[0].startsWith("data:") &&
                !p[0].startsWith("blob:") &&
                (p[0] = new URL(p[0], l).href),
              p.join(" ")
            );
          })
          .join(", ");
        s.setAttribute("srcset", a);
      }
      if (s.hasAttribute("style")) {
        let a = s.getAttribute("style");
        ((a = En(a, l)), s.setAttribute("style", a));
      }
      (s.hasAttribute("class") &&
        s.getAttribute("class").trim() === "" &&
        s.removeAttribute("class"),
        s.hasAttribute("style") &&
          s.getAttribute("style").trim() === "" &&
          s.removeAttribute("style"),
        (s.ownerSVGElement || s.tagName === "svg") && Sn(s));
      const o = Array.from(s.attributes);
      for (const a of o)
        (a.name.startsWith("on") && s.removeAttribute(a.name),
          [
            "href",
            "src",
            "action",
            "formaction",
            "data",
            "xlink:href",
          ].includes(a.name) &&
            a.value.trim().toLowerCase().startsWith("javascript:") &&
            s.removeAttribute(a.name));
    }
    (c.length > 0 &&
      (await Promise.all(
        c.map(async ({ element: m, attr: s, url: o }) => {
          try {
            const a = await _t(o);
            a && m.setAttribute(s, a);
          } catch (a) {
            console.warn("Failed to convert blob URL:", o, a);
          }
        }),
      )),
      r.querySelectorAll("script, noscript").forEach((m) => m.remove()));
    let u = r.outerHTML;
    return (
      (u = u.replace(/<!--[\s\S]*?-->/g, "")),
      (u = u.replace(/\s*export-element-highlight/g, "")),
      (u = u.replace(/\s*asset-inspector-outline/g, "")),
      (u = u.replace(/\s*asset-inspector-highlight/g, "")),
      (u = await Bt(u, "html")),
      u
    );
  }
  async function _t(t) {
    try {
      const e = await (await fetch(t)).blob();
      return new Promise((r, n) => {
        const l = new FileReader();
        ((l.onloadend = () => r(l.result)),
          (l.onerror = n),
          l.readAsDataURL(e));
      });
    } catch (e) {
      return (console.warn("Failed to convert blob URL:", e), null);
    }
  }
  async function Bt(t, e) {
    try {
      const r = await new Promise((n) => {
        chrome.runtime.sendMessage(
          { action: "formatCode", code: t, parser: e },
          n,
        );
      });
      return r && r.success && r.formatted ? r.formatted.trim() : t;
    } catch {
      return t;
    }
  }
  function pn(t, e) {
    return new Promise((r) => {
      chrome.runtime.sendMessage({ action: t, ...e }, (n) => {
        chrome.runtime.lastError
          ? (console.warn(
              "[Web Inspector] Background message failed:",
              chrome.runtime.lastError.message,
            ),
            r({ success: !1, error: chrome.runtime.lastError.message }))
          : r(n || { success: !1, error: "No response" });
      });
    });
  }
  async function mn() {
    if (fe && fe.allCSS) return fe.allCSS;
    const t = [],
      e = [];
    for (const n of document.styleSheets)
      if (
        !(n.href && n.href.startsWith("chrome-extension://")) &&
        !n.ownerNode?.id?.startsWith("asset-inspector-")
      )
        try {
          if (n.href) e.push(n.href);
          else {
            const l = n.cssRules || n.rules;
            l &&
              t.push(
                [...l].map((c) => c.cssText).join(`
`),
              );
          }
        } catch {
          n.href && e.push(n.href);
        }
    let r = "";
    if (e.length > 0) {
      const n = await pn("fetchExternalStylesheets", { urls: e });
      if (n && n.success)
        for (const l of e)
          n.results[l]?.success &&
            (r +=
              n.results[l].css +
              `
`);
    }
    return [...t, r].filter(Boolean).join(`
`);
  }
  function gn(t) {
    const e = [];
    let r = "",
      n = 0;
    for (let l = 0; l < t.length; l++) {
      const c = t[l];
      if (c === "[" || c === "(") {
        (n++, (r += c));
        continue;
      }
      if (c === "]" || c === ")") {
        (n--, (r += c));
        continue;
      }
      if (n > 0) {
        r += c;
        continue;
      }
      if (c === ">" || c === "~" || c === "+") {
        (r.trim() && e.push(r.trim()), (r = ""));
        continue;
      }
      if (
        c === " " ||
        c === "	" ||
        c ===
          `
`
      ) {
        r.trim() && (e.push(r.trim()), (r = ""));
        continue;
      }
      r += c;
    }
    return (r.trim() && e.push(r.trim()), e);
  }
  function Ke(t) {
    if (!t) return "";
    try {
      return t
        .replace(/::[\w-]+(\([^)]*\))?/g, "")
        .replace(/:[\w-]+(\([^)]*\))?/g, "")
        .trim();
    } catch {
      return t;
    }
  }
  function $e(t, e) {
    if (!e || !e.trim()) return !1;
    try {
      return t.matches(e);
    } catch {
      return !1;
    }
  }
  function Dt(t, e) {
    if (!e || !e.trim()) return !1;
    try {
      return t.querySelector(e) !== null;
    } catch {
      return !1;
    }
  }
  function bn(t, e) {
    const r = Ke(e);
    if ($e(t, e) || $e(t, r)) return t;
    try {
      const n = t.querySelectorAll(r || e);
      if (n.length > 0) return n[n.length - 1];
    } catch {}
    return null;
  }
  function Oe(t) {
    let e = t.parent;
    for (; e;) {
      if (
        e.type === "atrule" &&
        (e.name === "keyframes" || e.name === "-webkit-keyframes")
      )
        return !0;
      e = e.parent;
    }
    return !1;
  }
  function yn(t, e, r) {
    if (!e || !e.includes("var(") || !r) return e;
    let n = e.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (l, c, u) => {
      const m = r.getPropertyValue(c).trim();
      return m || (u ? u.trim() : l);
    });
    if (n.includes("var(")) {
      const l = r.getPropertyValue(t).trim();
      if (l) return l;
    }
    return n;
  }
  async function wn(t, e, r) {
    const n = [
        "color",
        "font-family",
        "font-size",
        "font-weight",
        "font-style",
        "line-height",
        "letter-spacing",
        "word-spacing",
        "text-align",
        "text-indent",
        "text-transform",
        "white-space",
        "direction",
        "visibility",
        "cursor",
        "list-style-type",
        "list-style-position",
        "quotes",
        "orphans",
        "widows",
        "tab-size",
        "hyphens",
        "overflow-wrap",
        "word-break",
        "-webkit-text-size-adjust",
      ],
      l = {},
      c = getComputedStyle(t);
    for (const m of n) l[m] = c.getPropertyValue(m);
    const u = document.createElement("iframe");
    ((u.style.cssText =
      "position:fixed;left:-9999px;top:-9999px;width:1024px;height:768px;opacity:0;pointer-events:none;"),
      (u.sandbox = "allow-same-origin"),
      document.body.appendChild(u));
    try {
      const m = u.contentDocument || u.contentWindow.document;
      (m.open(),
        m.write(
          `<!DOCTYPE html><html><head><style>${r}</style></head><body>${e}</body></html>`,
        ),
        m.close(),
        await new Promise((g) => setTimeout(g, 150)));
      const s = m.body.firstElementChild,
        o = {};
      if (s) {
        const g = u.contentWindow.getComputedStyle(s);
        for (const b of n) o[b] = g.getPropertyValue(b);
      }
      const a = m.createElement("div");
      m.body.appendChild(a);
      const i = {},
        p = u.contentWindow.getComputedStyle(a);
      for (const g of n) i[g] = p.getPropertyValue(g);
      const f = {};
      for (const g of n) l[g] !== o[g] && l[g] !== i[g] && (f[g] = l[g]);
      return Object.keys(f).length === 0
        ? ""
        : `.exported-root {
${Object.entries(f).map(([g, b]) => `  ${g}: ${b};`).join(`
`)}
}`;
    } catch (m) {
      return (
        console.warn("[Web Inspector] 3-iframe inherited detection failed:", m),
        $t(t)
      );
    } finally {
      document.body.removeChild(u);
    }
  }
  function $t(t) {
    const e = [
        "color",
        "font-family",
        "font-size",
        "font-weight",
        "font-style",
        "line-height",
        "letter-spacing",
        "text-align",
        "text-transform",
      ],
      r = [];
    try {
      const n = getComputedStyle(t);
      for (const l of e) {
        const c = n.getPropertyValue(l);
        c && r.push(`  ${l}: ${c};`);
      }
    } catch {}
    return r.length === 0
      ? ""
      : `.exported-root {
${r.join(`
`)}
}`;
  }
  async function xn(t, e = {}, r = "") {
    const n = fe?.externalUrls || [],
      l = [];
    let c = 0,
      u = !1,
      m = !1;
    try {
      const s = await mn();
      if (!s || s.trim().length === 0)
        return {
          cssText: "",
          ruleCount: 0,
          hasAnimations: !1,
          hasPseudoElements: !1,
          externalUrls: n,
          fontUrls: l,
        };
      let o;
      try {
        o = postcss.parse(s, { from: void 0 });
      } catch (h) {
        console.warn(
          "[Web Inspector] PostCSS parse failed, attempting cleanup:",
          h.message,
        );
        const w = s
          .replace(/@nest\b[^{]*\{[^}]*\}/g, "")
          .replace(/@apply\b[^;]*;/g, "");
        try {
          o = postcss.parse(w, { from: void 0 });
        } catch (C) {
          return (
            console.error(
              "[Web Inspector] PostCSS parse failed even after cleanup:",
              C.message,
            ),
            {
              cssText: "",
              ruleCount: 0,
              hasAnimations: !1,
              hasPseudoElements: !1,
              externalUrls: n,
              fontUrls: l,
            }
          );
        }
      }
      const a = new Set();
      let i = 0;
      if (
        (o.walkRules((h) => {
          if (
            !Oe(h) &&
            !(h.parent?.type === "atrule" && h.parent.name === "font-face")
          )
            for (const w of h.selectors) {
              i++;
              const C = Ke(w);
              ($e(t, w) || $e(t, C) || Dt(t, w) || Dt(t, C)) && a.add(w);
            }
        }),
        o.walkRules((h) => {
          if (
            Oe(h) ||
            (h.parent?.type === "atrule" && h.parent.name === "font-face")
          )
            return;
          const w = h.selectors.filter((C) => a.has(C));
          w.length === 0 ? h.remove() : (h.selectors = w);
        }),
        r)
      )
        try {
          const h = new DOMParser().parseFromString(r, "text/html"),
            w = h.body.firstElementChild || h.body;
          o.walkRules((C) => {
            Oe(C) ||
              (C.parent?.type === "atrule" && C.parent.name === "font-face") ||
              (C.selectors = C.selectors.map((d) => {
                const y = Ke(d);
                try {
                  if (w.matches(y) || w.querySelector(y)) return d;
                } catch {}
                const x = gn(y);
                for (let F = 1; F < x.length; F++) {
                  const T = x.slice(F).join(" ");
                  try {
                    if (w.matches(T) || w.querySelector(T)) {
                      const M = d.match(/(::?[\w-]+(\([^)]*\))?)$/);
                      return T + (M ? M[0] : "");
                    }
                  } catch {}
                }
                return d;
              }));
          });
        } catch (h) {
          console.warn("[Web Inspector] Selector rewriting failed:", h);
        }
      const p = new Set();
      (o.walkDecls((h) => {
        h.prop === "animation-name" || h.prop === "-webkit-animation-name"
          ? h.value.split(",").forEach((w) => {
              const C = w.trim();
              C && C !== "none" && p.add(C);
            })
          : (h.prop === "animation" || h.prop === "-webkit-animation") &&
            h.value.split(",").forEach((w) => {
              w.trim()
                .split(/\s+/)
                .forEach((C) => {
                  C && C !== "none" && p.add(C);
                });
            });
      }),
        p.size > 0 && (u = !0),
        o.walkAtRules((h) => {
          (h.name === "keyframes" || h.name === "-webkit-keyframes") &&
            (p.has(h.params) || h.remove());
        }),
        o.walkRules((h) => {
          Oe(h) ||
            h.walkDecls((w) => {
              if (w.value && w.value.includes("var(")) {
                const C = bn(t, h.selector);
                if (C)
                  try {
                    const d = window.getComputedStyle(C);
                    w.value = yn(w.prop, w.value, d);
                  } catch {}
              }
            });
        }),
        o.walkDecls((h) => {
          h.prop.startsWith("--") && h.remove();
        }),
        o.walkComments((h) => h.remove()),
        o.walkAtRules((h) => {
          h.name === "media" &&
            h.params &&
            h.params.includes("print") &&
            h.remove();
        }));
      let f = !0;
      for (; f;)
        ((f = !1),
          o.walkAtRules((h) => {
            if (h.name === "layer") {
              if (h.nodes && h.nodes.length > 0)
                for (const w of [...h.nodes]) h.parent.insertBefore(h, w);
              (h.remove(), (f = !0));
            }
          }));
      for (f = !0; f;)
        ((f = !1),
          o.walkAtRules((h) => {
            h.nodes && h.nodes.length === 0 && (h.remove(), (f = !0));
          }));
      const g = new Set();
      (o.walkDecls((h) => {
        (h.prop === "font-family" || h.prop === "font") &&
          h.value
            .replace(/!important/g, "")
            .split(",")
            .map((w) =>
              w
                .trim()
                .replace(/^["']|["']$/g, "")
                .toLowerCase(),
            )
            .forEach((w) => {
              w && g.add(w);
            });
      }),
        o.walkAtRules("font-face", (h) => {
          let w = "";
          (h.walkDecls("font-family", (C) => {
            w = C.value
              .trim()
              .replace(/^["']|["']$/g, "")
              .toLowerCase();
          }),
            w && !g.has(w) && h.remove());
        }),
        o.walkAtRules("font-feature-values", (h) => h.remove()));
      let b = o.toString();
      ((b = kn(b)),
        (m = /::(?:before|after)/.test(b)),
        (c = (b.match(/\{/g) || []).length));
      const A = Cn(t);
      let v = "";
      try {
        v = await wn(t, r, b);
      } catch {
        v = $t(t);
      }
      let S = "";
      if (/\d+(\.\d+)?rem/.test(b)) {
        const h = window.getComputedStyle(document.documentElement).fontSize;
        h &&
          h !== "16px" &&
          (S = `html { font-size: ${h}; }

`);
      }
      return (
        (b = await An(b)),
        {
          cssText: [S, v, A, b].filter(Boolean).join(`

`),
          ruleCount: c,
          hasAnimations: u,
          hasPseudoElements: m,
          externalUrls: n,
          fontUrls: l,
        }
      );
    } catch (s) {
      return (
        console.error("[Web Inspector] collectAllCSS failed:", s),
        {
          cssText: "",
          ruleCount: 0,
          hasAnimations: !1,
          hasPseudoElements: !1,
          externalUrls: n,
          fontUrls: l,
        }
      );
    }
  }
  async function An(t) {
    const e = /url\(["']?(blob:[^"')]+)["']?\)/g,
      r = [...t.matchAll(e)];
    if (r.length === 0) return t;
    const n = [...new Set(r.map((c) => c[1]))],
      l = {};
    return (
      await Promise.all(
        n.map(async (c) => {
          try {
            const u = await _t(c);
            u && (l[c] = u);
          } catch (u) {
            console.warn("Failed to convert blob URL in CSS:", c, u);
          }
        }),
      ),
      t.replace(e, (c, u) => (l[u] ? `url("${l[u]}")` : c))
    );
  }
  function Cn(t) {
    const e = [],
      r = window.getComputedStyle(document.body),
      n = r.getPropertyValue("color");
    n && e.push(`	color: ${n};`);
    const l = r.getPropertyValue("font-family");
    if ((l && e.push(`	font-family: ${l};`), t)) {
      const c = vn(t);
      c && e.push(`	background-color: ${c};`);
    }
    return e.length > 0
      ? `body {
${e.join(`
`)}
}`
      : null;
  }
  function vn(t) {
    let e = t;
    for (; e && e !== document.documentElement;) {
      try {
        const r = window
          .getComputedStyle(e)
          .getPropertyValue("background-color");
        if (r && r !== "transparent" && r !== "rgba(0, 0, 0, 0)") {
          if (r === "rgb(255, 255, 255)" || r === "rgba(255, 255, 255, 1)") {
            e = e.parentElement;
            continue;
          }
          return r;
        }
      } catch {}
      e = e.parentElement;
    }
    try {
      for (const r of [document.body, document.documentElement]) {
        const n = window
          .getComputedStyle(r)
          .getPropertyValue("background-color");
        if (
          n &&
          n !== "transparent" &&
          n !== "rgba(0, 0, 0, 0)" &&
          n !== "rgb(255, 255, 255)" &&
          n !== "rgba(255, 255, 255, 1)"
        )
          return n;
      }
    } catch {}
    return null;
  }
  function Sn(t) {
    const e = t.tagName === "svg" || t.tagName === "SVG",
      r = {
        "fill-opacity": "1",
        "stroke-opacity": "1",
        opacity: "1",
        "stroke-width": "1px",
        "stroke-linecap": "butt",
        "stroke-linejoin": "miter",
        "stroke-dashoffset": "0px",
        "stroke-dasharray": "none",
        "text-anchor": "start",
        "dominant-baseline": "auto",
        "stop-color": "#000000",
        "stop-opacity": "1",
        "font-weight": "400",
        "font-size": "16px",
      },
      n = [
        "font-family",
        "font-size",
        "font-weight",
        "font-style",
        "text-anchor",
        "dominant-baseline",
        "stop-color",
        "stop-opacity",
      ];
    if (!e) {
      for (const [l, c] of Object.entries(r))
        t.getAttribute(l) === c && t.removeAttribute(l);
      for (const l of n) {
        const c = t.parentElement?.getAttribute(l),
          u = t.getAttribute(l);
        u && c && u === c && t.removeAttribute(l);
      }
      (t.getAttribute("stroke") === "null" && t.removeAttribute("stroke"),
        t.getAttribute("fill") === "null" && t.removeAttribute("fill"));
    }
    if (e) {
      (t.getAttribute("fill") === "null" && t.removeAttribute("fill"),
        t.getAttribute("stroke") === "null" && t.removeAttribute("stroke"));
      for (const [l, c] of Object.entries(r))
        t.getAttribute(l) === c && t.removeAttribute(l);
    }
  }
  function kn(t) {
    return (
      window.location.origin,
      t.replace(/url\(["']?([^"')]+)["']?\)/g, (e, r) => {
        if (
          r.startsWith("data:") ||
          r.startsWith("blob:") ||
          r.startsWith("http://") ||
          r.startsWith("https://") ||
          r.startsWith("chrome-extension://")
        )
          return e;
        try {
          return `url("${new URL(r, window.location.href).href}")`;
        } catch {
          return e;
        }
      })
    );
  }
  function En(t, e) {
    return t.replace(/url\(["']?([^"')]+)["']?\)/g, (r, n) => {
      if (
        n.startsWith("data:") ||
        n.startsWith("blob:") ||
        n.startsWith("http://") ||
        n.startsWith("https://")
      )
        return r;
      try {
        return `url("${new URL(n, e).href}")`;
      } catch {
        return r;
      }
    });
  }
  function Fn(t, e, r = [], n = !1) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Element</title>${
    n
      ? `
  <script src="https://cdn.tailwindcss.com"><\/script>`
      : ""
  }
  <style>
/* Reset - ensures exported elements render as intended */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Remove default link underlines - exported styles will override if needed */
a {
  text-decoration: none;
  color: inherit;
}

/* SVG defaults - ensure fills/strokes are inherited unless specified */
svg {
  fill: currentColor;
}

/* Beta Banner */
.miro-hidden {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, #f59e0b, #f97316);
  color: white;
  text-align: center;
  padding: 8px 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  font-weight: 500;
  z-index: 999999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.miro-hidden a {
  color: white;
  text-decoration: underline;
  margin-left: 8px;
}
body {
  padding-top: 40px;
}

${e}
  </style>
</head>
<body>
  <div style="display:none">
    Export to Code is in Beta - some elements may not render perfectly
  </div>
  ${t}
</body>
</html>`;
  }
  async function Mn(t, e = "exported-element.html") {
    if (!t)
      return (
        console.error("No element provided for HTML export"),
        { success: !1, error: "No element selected" }
      );
    try {
      const r = await Xe(t);
      if (r.error) return { success: !1, error: r.error };
      const { preview: n, stats: l } = r,
        c = new Blob([n], { type: "text/html" }),
        u = URL.createObjectURL(c),
        m = document.createElement("a");
      return (
        (m.href = u),
        (m.download = e),
        document.body.appendChild(m),
        m.click(),
        m.remove(),
        URL.revokeObjectURL(u),
        { success: !0, stats: l }
      );
    } catch (r) {
      return (
        console.error("HTML export failed:", r),
        { success: !1, error: r.message }
      );
    }
  }
  async function Tn(t, e = "both") {
    if (!t) return { success: !1, error: "No element selected" };
    try {
      const r = await Xe(t);
      if (r.error) return { success: !1, error: r.error };
      const { html: n, css: l } = r;
      let c;
      return (
        e === "html"
          ? (c = n)
          : e === "css"
            ? (c = l)
            : (c = `<!-- HTML -->
${n}

/* CSS */
${l}`),
        await navigator.clipboard.writeText(c),
        { success: !0, html: n, css: l }
      );
    } catch (r) {
      return (
        console.error("Copy to clipboard failed:", r),
        { success: !1, error: r.message }
      );
    }
  }
  (chrome.runtime.onMessage.addListener((t, e, r) => {
    if (t.action === "ping") r({ success: !0 });
    else if (t.action === "captureAssets") r(Rr());
    else if (t.action === "toggleInspector")
      (t.enabled ? Jr() : Et(), r({ success: !0 }));
    else if (t.action === "getInspectorState") r({ active: Yr() });
    else if (t.action === "pickTextChild") r(Gr());
    else if (t.action === "applyDesignEdit") r(Zr(t.prop, t.value));
    else if (t.action === "resetDesignEdits") r(Qr());
    else if (t.action === "getDesignEditsCss") r({ css: en(), count: tn() });
    else if (t.action === "showOnboarding")
      (showOnboarding(), r({ success: !0 }));
    else if (t.action === "hideOnboarding")
      (hideOnboarding(), r({ success: !0 }));
    else if (t.action === "extractComponent")
      if (O) {
        const n = t.options || {};
        return (
          Xe(O, n)
            .then((l) => r(l))
            .catch((l) => r({ error: l.message })),
          !0
        );
      } else r({ error: "No element selected" });
    else if (t.action === "getComputedStyleSnapshot")
      if (O)
        try {
          const n = O.cloneNode(!0),
            l = [O, ...O.querySelectorAll("*")],
            c = [n, ...n.querySelectorAll("*")],
            u = [
              "display",
              "position",
              "top",
              "right",
              "bottom",
              "left",
              "z-index",
              "width",
              "height",
              "min-width",
              "min-height",
              "max-width",
              "max-height",
              "margin",
              "margin-top",
              "margin-right",
              "margin-bottom",
              "margin-left",
              "padding",
              "padding-top",
              "padding-right",
              "padding-bottom",
              "padding-left",
              "flex-direction",
              "flex-wrap",
              "flex-grow",
              "flex-shrink",
              "flex-basis",
              "align-items",
              "align-self",
              "justify-content",
              "gap",
              "row-gap",
              "column-gap",
              "grid-template-columns",
              "grid-template-rows",
              "grid-column",
              "grid-row",
              "overflow",
              "overflow-x",
              "overflow-y",
              "color",
              "background",
              "background-color",
              "background-image",
              "background-size",
              "background-position",
              "background-repeat",
              "font-family",
              "font-size",
              "font-weight",
              "font-style",
              "line-height",
              "letter-spacing",
              "text-align",
              "text-transform",
              "text-decoration",
              "white-space",
              "word-break",
              "text-overflow",
              "border",
              "border-width",
              "border-style",
              "border-color",
              "border-radius",
              "border-top-left-radius",
              "border-top-right-radius",
              "border-bottom-left-radius",
              "border-bottom-right-radius",
              "box-shadow",
              "opacity",
              "transform",
              "transition",
              "cursor",
              "pointer-events",
              "visibility",
              "object-fit",
              "object-position",
              "aspect-ratio",
              "isolation",
              "mix-blend-mode",
              "filter",
              "backdrop-filter",
              "outline",
              "outline-offset",
              "text-indent",
              "vertical-align",
              "list-style-type",
              "table-layout",
              "border-collapse",
              "border-spacing",
              "fill",
              "stroke",
              "stroke-width",
            ],
            m = {
              position: "static",
              top: "auto",
              right: "auto",
              bottom: "auto",
              left: "auto",
              "z-index": "auto",
              "min-width": "0px",
              "min-height": "0px",
              "max-width": "none",
              "max-height": "none",
              "flex-grow": "0",
              "flex-shrink": "1",
              "flex-basis": "auto",
              overflow: "visible",
              "overflow-x": "visible",
              "overflow-y": "visible",
              transform: "none",
              filter: "none",
              "backdrop-filter": "none",
              opacity: "1",
              visibility: "visible",
              cursor: "auto",
              "pointer-events": "auto",
              isolation: "auto",
              "mix-blend-mode": "normal",
              "box-shadow": "none",
              "text-transform": "none",
              "text-decoration": "none",
              "text-indent": "0px",
              outline: "",
              "outline-offset": "0px",
              "object-fit": "fill",
              "aspect-ratio": "auto",
              "white-space": "normal",
              "word-break": "normal",
              "text-overflow": "clip",
              "border-collapse": "separate",
              "table-layout": "auto",
              fill: "",
              stroke: "none",
              "stroke-width": "1",
            };
          for (let s = 0; s < l.length && s < c.length; s++) {
            const o = window.getComputedStyle(l[s]),
              a = [];
            for (const i of u) {
              const p = o.getPropertyValue(i);
              !p ||
                p === "" ||
                p === m[i] ||
                (i === "outline" && p.includes("99, 102, 241")) ||
                a.push(`${i}:${p}`);
            }
            if (a.length > 0) {
              const i = c[s].getAttribute("style") || "";
              c[s].setAttribute("style", i + (i ? ";" : "") + a.join(";"));
            }
          }
          (window.location.origin,
            c.forEach((s) => {
              if (s.tagName === "IMG" && s.getAttribute("src")) {
                const o = s.getAttribute("src");
                if (!o.startsWith("http") && !o.startsWith("data:"))
                  try {
                    s.setAttribute(
                      "src",
                      new URL(o, window.location.href).href,
                    );
                  } catch {}
              }
            }),
            r({ html: n.outerHTML, css: "" }));
        } catch (n) {
          r({ error: n.message });
        }
      else r({ error: "No element selected" });
    else if (t.action === "exportAsHtmlFile") {
      if (O)
        return (
          Mn(O, t.filename)
            .then((n) => r(n))
            .catch((n) => r({ error: n.message })),
          !0
        );
      r({ error: "No element selected" });
    } else if (t.action === "copyElementToClipboard") {
      if (O)
        return (
          Tn(O, t.format)
            .then((n) => r(n))
            .catch((n) => r({ error: n.message })),
          !0
        );
      r({ error: "No element selected" });
    } else if (t.action === "captureCanvasSnapshot")
      if (O && O.tagName.toLowerCase() === "canvas")
        try {
          r({ success: !0, dataUrl: O.toDataURL("image/png") });
        } catch {
          r({ error: "Canvas is tainted by cross-origin content" });
        }
      else r({ error: "No canvas element selected" });
    else if (t.action === "captureCanvasVideo") {
      const n = (t.duration || 4) * 1e3;
      if (O && O.tagName.toLowerCase() === "canvas") {
        try {
          const l = O.captureStream(30);
          if (!l || l.getVideoTracks().length === 0)
            return (r({ error: "Could not capture stream from canvas" }), !0);
          const c = [],
            u = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
              ? "video/webm;codecs=vp9"
              : "video/webm",
            m = new MediaRecorder(l, { mimeType: u });
          ((m.ondataavailable = (s) => {
            s.data.size > 0 && c.push(s.data);
          }),
            (m.onerror = (s) => {
              (console.error("MediaRecorder error:", s),
                r({
                  error: "Recording error: " + (s.error?.message || "unknown"),
                }));
            }),
            (m.onstop = () => {
              const s = new Blob(c, { type: u });
              if (s.size === 0) {
                r({
                  error:
                    "Recording produced empty video (WebGL may need preserveDrawingBuffer)",
                });
                return;
              }
              const o = new FileReader();
              ((o.onerror = () => {
                r({ error: "Failed to read video data" });
              }),
                (o.onloadend = () => {
                  r({
                    success: !0,
                    dataUrl: o.result,
                    mimeType: u,
                    size: s.size,
                  });
                }),
                o.readAsDataURL(s));
            }),
            m.start(100),
            setTimeout(() => {
              try {
                m.state === "recording" && m.stop();
              } catch (s) {
                r({ error: "Failed to stop recording: " + s.message });
              }
            }, n));
        } catch (l) {
          r({ error: l.message });
        }
        return !0;
      } else r({ error: "No canvas element selected" });
    } else if (t.action === "startCanvasRecording")
      if (O && O.tagName.toLowerCase() === "canvas")
        try {
          if (
            window.__miroCanvasRecorder &&
            window.__miroCanvasRecorder.state === "recording"
          )
            return (r({ error: "Recording already in progress" }), !0);
          const n = O.captureStream(30),
            l = [],
            c = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
              ? "video/webm;codecs=vp9"
              : "video/webm",
            u = new MediaRecorder(n, { mimeType: c });
          ((u.ondataavailable = (m) => {
            m.data.size > 0 && l.push(m.data);
          }),
            (window.__miroCanvasRecorder = u),
            (window.__miroCanvasRecorderChunks = l),
            u.start(100),
            r({ success: !0 }));
        } catch (n) {
          r({ error: n.message });
        }
      else r({ error: "No canvas element selected" });
    else if (t.action === "stopCanvasRecording")
      if (
        window.__miroCanvasRecorder &&
        window.__miroCanvasRecorder.state === "recording"
      ) {
        const n = window.__miroCanvasRecorder;
        return (
          (n.onstop = () => {
            const l = window.__miroCanvasRecorderChunks || [],
              c = new Blob(l, { type: n.mimeType }),
              u = new FileReader();
            ((u.onloadend = () => {
              (r({ success: !0, dataUrl: u.result, mimeType: n.mimeType }),
                (window.__miroCanvasRecorder = null),
                (window.__miroCanvasRecorderChunks = null));
            }),
              u.readAsDataURL(c));
          }),
          n.stop(),
          !0
        );
      } else r({ error: "No recording in progress" });
    else if (t.action === "scrollToAndHighlightElement") {
      const n = t.selector;
      if (n)
        try {
          const l = document.querySelector(n);
          if (l) {
            l.scrollIntoView({ behavior: "smooth", block: "center" });
            const c = document.createElement("div");
            ((c.id = "wb-element-highlight"),
              (c.style.cssText = `
            position: absolute;
            pointer-events: none;
            z-index: 2147483647;
            border: 3px solid #6366F1;
            border-radius: 8px;
            background: rgba(135, 112, 163, 0.15);
            box-shadow: 0 0 0 4px rgba(135, 112, 163, 0.3), 0 0 20px rgba(135, 112, 163, 0.4);
            transition: opacity 0.3s ease;
          `));
            const u = l.getBoundingClientRect();
            ((c.style.left = u.left + window.scrollX - 4 + "px"),
              (c.style.top = u.top + window.scrollY - 4 + "px"),
              (c.style.width = u.width + 8 + "px"),
              (c.style.height = u.height + 8 + "px"),
              document.body.appendChild(c),
              setTimeout(() => {
                ((c.style.opacity = "0"),
                  setTimeout(() => {
                    c.remove();
                  }, 300));
              }, 2500),
              r({ success: !0 }));
          } else r({ error: "Element not found" });
        } catch (l) {
          r({ error: l.message });
        }
      else r({ error: "No selector provided" });
    }
    return !0;
  }),
    (function () {
      const e = window.location.hostname;
      (e === "localhost" || e === "127.0.0.1") &&
        window.addEventListener("message", (r) => {
          if (r.source !== window) return;
          const n = r.data;
          if (!n || n.source !== "wb-site") return;
          const l = (u, m, s) => {
              window.postMessage(
                { source: "wb-extension", action: u, ok: m, error: s || null },
                window.location.origin,
              );
            },
            c = (u, m) => {
              try {
                chrome.runtime.sendMessage(u, (s) => {
                  const o = chrome.runtime.lastError;
                  l(m, !!(s && s.ok), o ? o.message : (s && s.error) || null);
                });
              } catch (s) {
                l(m, !1, String(s));
              }
            };
          n.action === "openSidePanel"
            ? c(
                { action: "openSidePanelFromSite", section: n.section },
                "openSidePanelResult",
              )
            : n.action === "adoptSession" &&
              n.accessToken &&
              n.refreshToken &&
              c(
                {
                  action: "adoptSessionFromSite",
                  accessToken: n.accessToken,
                  refreshToken: n.refreshToken,
                },
                "adoptSessionResult",
              );
        });
    })(),
    typeof navigator < "u" &&
      /Firefox/i.test(navigator.userAgent) &&
      (globalThis.chrome = sr.default),
    (globalThis.postcss = ir));
  var Rn = { matches: ["<all_urls>"], runAt: "document_idle", main() {} };
  function Ne(t, ...e) {}
  var Ln = {
      debug: (...t) => Ne(console.debug, ...t),
      log: (...t) => Ne(console.log, ...t),
      warn: (...t) => Ne(console.warn, ...t),
      error: (...t) => Ne(console.error, ...t),
    },
    Pn = globalThis.browser?.runtime?.id
      ? globalThis.browser
      : globalThis.chrome,
    Ot = Pn,
    Nt = class Ut extends Event {
      static EVENT_NAME = Ze("wxt:locationchange");
      constructor(e, r) {
        (super(Ut.EVENT_NAME, {}), (this.newUrl = e), (this.oldUrl = r));
      }
    };
  function Ze(t) {
    return `${Ot?.runtime?.id}:content:${t}`;
  }
  var _n = typeof globalThis.navigation?.addEventListener == "function";
  function Bn(t) {
    let e,
      r = !1;
    return {
      run() {
        r ||
          ((r = !0),
          (e = new URL(location.href)),
          _n
            ? globalThis.navigation.addEventListener(
                "navigate",
                (n) => {
                  const l = new URL(n.destination.url);
                  l.href !== e.href &&
                    (window.dispatchEvent(new Nt(l, e)), (e = l));
                },
                { signal: t.signal },
              )
            : t.setInterval(() => {
                const n = new URL(location.href);
                n.href !== e.href &&
                  (window.dispatchEvent(new Nt(n, e)), (e = n));
              }, 1e3));
      },
    };
  }
  var Dn = class ye {
    static SCRIPT_STARTED_MESSAGE_TYPE = Ze("wxt:content-script-started");
    id;
    abortController;
    locationWatcher = Bn(this);
    constructor(e, r) {
      ((this.contentScriptName = e),
        (this.options = r),
        (this.id = Math.random().toString(36).slice(2)),
        (this.abortController = new AbortController()),
        this.stopOldScripts(),
        this.listenForNewerScripts());
    }
    get signal() {
      return this.abortController.signal;
    }
    abort(e) {
      return this.abortController.abort(e);
    }
    get isInvalid() {
      return (
        Ot.runtime?.id == null && this.notifyInvalidated(),
        this.signal.aborted
      );
    }
    get isValid() {
      return !this.isInvalid;
    }
    onInvalidated(e) {
      return (
        this.signal.addEventListener("abort", e),
        () => this.signal.removeEventListener("abort", e)
      );
    }
    block() {
      return new Promise(() => {});
    }
    setInterval(e, r) {
      const n = setInterval(() => {
        this.isValid && e();
      }, r);
      return (this.onInvalidated(() => clearInterval(n)), n);
    }
    setTimeout(e, r) {
      const n = setTimeout(() => {
        this.isValid && e();
      }, r);
      return (this.onInvalidated(() => clearTimeout(n)), n);
    }
    requestAnimationFrame(e) {
      const r = requestAnimationFrame((...n) => {
        this.isValid && e(...n);
      });
      return (this.onInvalidated(() => cancelAnimationFrame(r)), r);
    }
    requestIdleCallback(e, r) {
      const n = requestIdleCallback((...l) => {
        this.signal.aborted || e(...l);
      }, r);
      return (this.onInvalidated(() => cancelIdleCallback(n)), n);
    }
    addEventListener(e, r, n, l) {
      (r === "wxt:locationchange" && this.isValid && this.locationWatcher.run(),
        e.addEventListener?.(r.startsWith("wxt:") ? Ze(r) : r, n, {
          ...l,
          signal: this.signal,
        }));
    }
    notifyInvalidated() {
      (this.abort("Content script context invalidated"),
        Ln.debug(
          `Content script "${this.contentScriptName}" context invalidated`,
        ));
    }
    stopOldScripts() {
      (document.dispatchEvent(
        new CustomEvent(ye.SCRIPT_STARTED_MESSAGE_TYPE, {
          detail: {
            contentScriptName: this.contentScriptName,
            messageId: this.id,
          },
        }),
      ),
        window.postMessage(
          {
            type: ye.SCRIPT_STARTED_MESSAGE_TYPE,
            contentScriptName: this.contentScriptName,
            messageId: this.id,
          },
          "*",
        ));
    }
    verifyScriptStartedEvent(e) {
      const r = e.detail?.contentScriptName === this.contentScriptName,
        n = e.detail?.messageId === this.id;
      return r && !n;
    }
    listenForNewerScripts() {
      const e = (r) => {
        !(r instanceof CustomEvent) ||
          !this.verifyScriptStartedEvent(r) ||
          this.notifyInvalidated();
      };
      (document.addEventListener(ye.SCRIPT_STARTED_MESSAGE_TYPE, e),
        this.onInvalidated(() =>
          document.removeEventListener(ye.SCRIPT_STARTED_MESSAGE_TYPE, e),
        ));
    }
  };
  function co() {}
  function Ie(t, ...e) {}
  var $n = {
      debug: (...t) => Ie(console.debug, ...t),
      log: (...t) => Ie(console.log, ...t),
      warn: (...t) => Ie(console.warn, ...t),
      error: (...t) => Ie(console.error, ...t),
    },
    dummy = null; return { extractComponent: Xe }; })();