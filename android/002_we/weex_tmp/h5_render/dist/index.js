(this.nativeLog || function(s) {console.log(s)})('START WEEX HTML5: 0.2.22 BUILD 20160622');
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict'
	
	__webpack_require__(1)
	
	// require('./polyfill')
	__webpack_require__(5)
	__webpack_require__(10)
	
	var config = __webpack_require__(11)
	var Loader = __webpack_require__(12)
	var utils = __webpack_require__(13)
	var protocol = __webpack_require__(14)
	var ComponentManager = __webpack_require__(15)
	var Component = __webpack_require__(22)
	var Sender = __webpack_require__(26)
	var receiver = __webpack_require__(27)
	
	// Components and apis.
	var components = __webpack_require__(28)
	var api = __webpack_require__(88)
	__webpack_require__(122)
	__webpack_require__(100)
	
	var WEAPP_STYLE_ID = 'weapp-style'
	
	var DEFAULT_DESIGN_WIDTH = 750
	var DEFAULT_SCALE = window.innerWidth / DEFAULT_DESIGN_WIDTH
	var DEFAULT_ROOT_ID = 'weex'
	var DEFAULT_JSONP_CALLBACK_NAME = 'weexJsonpCallback'
	
	window.WXEnvironment = {
	  weexVersion: config.weexVersion,
	  appName: lib.env.aliapp ? lib.env.aliapp.appname : null,
	  appVersion: lib.env.aliapp ? lib.env.aliapp.version.val : null,
	  platform: 'Web',
	  osName: lib.env.browser ? lib.env.browser.name : null,
	  osVersion: lib.env.browser ? lib.env.browser.version.val : null,
	  deviceWidth: DEFAULT_DESIGN_WIDTH,
	  deviceHeight: window.innerHeight / DEFAULT_SCALE
	}
	
	var _instanceMap = {}
	var _downgrades = {}
	
	var downgradable = ['list', 'scroller']
	
	; (function initializeWithUrlParams() {
	
	  var params = lib.httpurl(location.href).params
	  for (var k in params) {
	    // Get global _downgrades from url's params.
	    var match = k.match(/downgrade_(\w+)/)
	    if (!match || !match[1]) {
	      continue
	    }
	    if (params[k] !== true && params[k] !== 'true') {
	      continue
	    }
	    var downk = match[1]
	    if (downk && (downgradable.indexOf(downk) !== -1)) {
	      _downgrades[downk] = true
	    }
	  }
	
	  // set global 'debug' config to true if there's a debug flag in current url.
	  var debug = params['debug']
	  if (debug === true || debug === 'true') {
	    config.debug = true
	  }
	
	})()
	
	__webpack_require__(30).init()
	
	function Weex(options) {
	
	  if (!(this instanceof Weex)) {
	    return new Weex(options)
	  }
	
	  // Width of the root container. Default is window.innerWidth.
	  this.width = options.width || window.innerWidth
	  this.bundleUrl = options.bundleUrl || location.href
	  this.instanceId = options.appId
	  this.rootId = options.rootId || (DEFAULT_ROOT_ID + utils.getRandom(10))
	  this.designWidth = options.designWidth || DEFAULT_DESIGN_WIDTH
	  this.jsonpCallback = options.jsonpCallback || DEFAULT_JSONP_CALLBACK_NAME
	  this.source = options.source
	  this.loader = options.loader
	  this.embed = options.embed ? true : false
	
	  this.data = options.data
	
	  this.initDowngrades(options.downgrade)
	  this.initScale()
	  this.initComponentManager()
	  this.initBridge()
	  Weex.addInstance(this)
	
	  protocol.injectWeexInstance(this)
	
	  this.loadBundle(function (err, appCode) {
	    if (!err) {
	      this.createApp(config, appCode)
	    } else {
	      console.error('load bundle err:', err)
	    }
	  }.bind(this))
	
	}
	
	Weex.init = function (options) {
	  if (utils.isArray(options)) {
	    options.forEach(function (config) {
	      new Weex(config)
	    })
	  } else if (
	      Object.prototype.toString.call(options).slice(8, -1) === 'Object'
	    ) {
	    new Weex(options)
	  }
	}
	
	Weex.addInstance = function (instance) {
	  _instanceMap[instance.instanceId] = instance
	}
	
	Weex.getInstance = function (instanceId) {
	  return _instanceMap[instanceId]
	}
	
	Weex.prototype = {
	
	  initDowngrades: function (dg) {
	    this.downgrades = utils.extend({}, _downgrades)
	    // Get downgrade component type from user's specification
	    // in weex's init options.
	    if (!utils.isArray(dg)) {
	      return
	    }
	    for (var i = 0, l = dg.length; i < l; i++) {
	      var downk = dg[i]
	      if (downgradable.indexOf(downk) !== -1) {
	        this.downgrades[downk] = true
	      }
	    }
	  },
	
	  initBridge: function () {
	    receiver.init(this)
	    this.sender = new Sender(this)
	  },
	
	  loadBundle: function (cb) {
	    Loader.load({
	      jsonpCallback: this.jsonpCallback,
	      source: this.source,
	      loader: this.loader
	    }, cb)
	  },
	
	  createApp: function (config, appCode) {
	    var root = document.querySelector('#' + this.rootId)
	    if (!root) {
	      root = document.createElement('div')
	      root.id = this.rootId
	      document.body.appendChild(root)
	    }
	
	    var promise = window.createInstance(
	      this.instanceId
	      , appCode
	      , {
	        bundleUrl: this.bundleUrl,
	        debug: config.debug
	      }
	      , this.data
	    )
	
	    if (Promise && promise instanceof Promise) {
	      promise.then(function () {
	        // Weex._instances[this.instanceId] = this.root
	      }.bind(this)).catch(function (err) {
	        if (err && config.debug) {
	          console.error(err)
	        }
	      })
	    }
	
	    // Do not destroy instance here, because in most browser
	    // press back button to back to this page will not refresh
	    // the window and the instance will not be recreated then.
	    // window.addEventListener('beforeunload', function (e) {
	    // })
	
	  },
	
	  initScale: function () {
	    this.scale = this.width / this.designWidth
	  },
	
	  initComponentManager: function () {
	    this._componentManager = new ComponentManager(this)
	  },
	
	  getComponentManager: function () {
	    return this._componentManager
	  },
	
	  getRoot: function () {
	    return document.querySelector('#' + this.rootId)
	  }
	}
	
	Weex.appendStyle = function (css) {
	  utils.appendStyle(css, WEAPP_STYLE_ID)
	},
	
	// Register a new component with the specified name.
	Weex.registerComponent = function (name, comp) {
	  ComponentManager.registerComponent(name, comp)
	},
	
	// Register a new api module.
	// If the module already exists, just add methods from the
	// new module to the old one.
	Weex.registerApiModule = function (name, module, meta) {
	  if (!protocol.apiModule[name]) {
	    protocol.apiModule[name] = module
	  } else {
	    for (var key in module) {
	      if (module.hasOwnProperty(key)) {
	        protocol.apiModule[name][key] = module[key]
	      }
	    }
	  }
	  // register API module's meta info to jsframework
	  if (meta) {
	    protocol.setApiModuleMeta(meta)
	    window.registerModules(protocol.getApiModuleMeta(name), true)
	  }
	},
	
	// Register a new api method for the specified module.
	// opts:
	//  - args: type of arguments the API method takes such
	//    as ['string', 'function']
	Weex.registerApi = function (moduleName, name, method, args) {
	  if (typeof method !== 'function') {
	    return
	  }
	  if (!protocol.apiModule[moduleName]) {
	    protocol.apiModule[moduleName] = {}
	    protocol._meta[moduleName] = []
	  }
	  protocol.apiModule[moduleName][name] = method
	  if (!args) {
	    return
	  }
	  // register API meta info to jsframework
	  protocol.setApiMeta(moduleName, {
	    name: name,
	    args: args
	  })
	  window.registerModules(protocol.getApiModuleMeta(moduleName, meta), true)
	},
	
	// Register a new weex-bundle-loader.
	Weex.registerLoader = function (name, loaderFunc) {
	  Loader.registerLoader(name, loaderFunc)
	}
	
	// To install components and plugins.
	Weex.install = function (mod) {
	  mod.init(Weex)
	}
	
	Weex.stopTheWorld = function () {
	  for (var instanceId in _instanceMap) {
	    if (_instanceMap.hasOwnProperty(instanceId)) {
	      window.destroyInstance(instanceId)
	    }
	  }
	}
	
	(function startRefreshController() {
	  if (location.search.indexOf('hot-reload_controller') === -1)  {
	    return
	  }
	  if (!window.WebSocket) {
	    console.info('auto refresh need WebSocket support')
	    return
	  }
	  var host = location.hostname
	  var port = 8082
	  var client = new WebSocket('ws://' + host + ':' + port + '/',
	    'echo-protocol'
	  )
	  client.onerror = function () {
	    console.log('refresh controller websocket connection error')
	  }
	  client.onmessage = function (e) {
	    console.log('Received: \'' + e.data + '\'')
	    if (e.data  === 'refresh') {
	      location.reload()
	    }
	  }
	}())
	
	// Weex.install(require('weex-components'))
	Weex.install(components)
	Weex.install(api)
	
	Weex.Component = Component
	Weex.ComponentManager = ComponentManager
	Weex.utils = utils
	Weex.config = config
	
	global.weex = Weex
	module.exports = Weex
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(2);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./base.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./base.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, "* {\n  margin: 0;\n  padding: 0;\n  text-size-adjust: none;\n}\n\nul, ol {\n  list-style: none;\n}\n", ""]);
	
	// exports


/***/ },
/* 3 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];
	
		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};
	
		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0,
		styleElementsInsertedAtTop = [];
	
	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}
	
		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();
	
		// By default, add <style> tags to the bottom of <head>.
		if (typeof options.insertAt === "undefined") options.insertAt = "bottom";
	
		var styles = listToStyles(list);
		addStylesToDom(styles, options);
	
		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}
	
	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}
	
	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}
	
	function insertStyleElement(options, styleElement) {
		var head = getHeadElement();
		var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
		if (options.insertAt === "top") {
			if(!lastStyleElementInsertedAtTop) {
				head.insertBefore(styleElement, head.firstChild);
			} else if(lastStyleElementInsertedAtTop.nextSibling) {
				head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
			} else {
				head.appendChild(styleElement);
			}
			styleElementsInsertedAtTop.push(styleElement);
		} else if (options.insertAt === "bottom") {
			head.appendChild(styleElement);
		} else {
			throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
		}
	}
	
	function removeStyleElement(styleElement) {
		styleElement.parentNode.removeChild(styleElement);
		var idx = styleElementsInsertedAtTop.indexOf(styleElement);
		if(idx >= 0) {
			styleElementsInsertedAtTop.splice(idx, 1);
		}
	}
	
	function createStyleElement(options) {
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		insertStyleElement(options, styleElement);
		return styleElement;
	}
	
	function createLinkElement(options) {
		var linkElement = document.createElement("link");
		linkElement.rel = "stylesheet";
		insertStyleElement(options, linkElement);
		return linkElement;
	}
	
	function addStyle(obj, options) {
		var styleElement, update, remove;
	
		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement(options));
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement(options);
			update = updateLink.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement(options);
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
			};
		}
	
		update(obj);
	
		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}
	
	var replaceText = (function () {
		var textStore = [];
	
		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();
	
	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;
	
		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}
	
	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
	
		if(media) {
			styleElement.setAttribute("media", media)
		}
	
		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}
	
	function updateLink(linkElement, obj) {
		var css = obj.css;
		var sourceMap = obj.sourceMap;
	
		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}
	
		var blob = new Blob([css], { type: "text/css" });
	
		var oldSrc = linkElement.href;
	
		linkElement.href = URL.createObjectURL(blob);
	
		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var require;var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(process, global, module) {/*!
	 * @overview es6-promise - a tiny implementation of Promises/A+.
	 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
	 * @license   Licensed under MIT license
	 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
	 * @version   3.2.1
	 */
	
	(function() {
	    "use strict";
	    function lib$es6$promise$utils$$objectOrFunction(x) {
	      return typeof x === 'function' || (typeof x === 'object' && x !== null);
	    }
	
	    function lib$es6$promise$utils$$isFunction(x) {
	      return typeof x === 'function';
	    }
	
	    function lib$es6$promise$utils$$isMaybeThenable(x) {
	      return typeof x === 'object' && x !== null;
	    }
	
	    var lib$es6$promise$utils$$_isArray;
	    if (!Array.isArray) {
	      lib$es6$promise$utils$$_isArray = function (x) {
	        return Object.prototype.toString.call(x) === '[object Array]';
	      };
	    } else {
	      lib$es6$promise$utils$$_isArray = Array.isArray;
	    }
	
	    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
	    var lib$es6$promise$asap$$len = 0;
	    var lib$es6$promise$asap$$vertxNext;
	    var lib$es6$promise$asap$$customSchedulerFn;
	
	    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
	      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
	      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
	      lib$es6$promise$asap$$len += 2;
	      if (lib$es6$promise$asap$$len === 2) {
	        // If len is 2, that means that we need to schedule an async flush.
	        // If additional callbacks are queued before the queue is flushed, they
	        // will be processed by this flush that we are scheduling.
	        if (lib$es6$promise$asap$$customSchedulerFn) {
	          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
	        } else {
	          lib$es6$promise$asap$$scheduleFlush();
	        }
	      }
	    }
	
	    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
	      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
	    }
	
	    function lib$es6$promise$asap$$setAsap(asapFn) {
	      lib$es6$promise$asap$$asap = asapFn;
	    }
	
	    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
	    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
	    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
	    var lib$es6$promise$asap$$isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';
	
	    // test for web worker but not in IE10
	    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
	      typeof importScripts !== 'undefined' &&
	      typeof MessageChannel !== 'undefined';
	
	    // node
	    function lib$es6$promise$asap$$useNextTick() {
	      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
	      // see https://github.com/cujojs/when/issues/410 for details
	      return function() {
	        process.nextTick(lib$es6$promise$asap$$flush);
	      };
	    }
	
	    // vertx
	    function lib$es6$promise$asap$$useVertxTimer() {
	      return function() {
	        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
	      };
	    }
	
	    function lib$es6$promise$asap$$useMutationObserver() {
	      var iterations = 0;
	      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
	      var node = document.createTextNode('');
	      observer.observe(node, { characterData: true });
	
	      return function() {
	        node.data = (iterations = ++iterations % 2);
	      };
	    }
	
	    // web worker
	    function lib$es6$promise$asap$$useMessageChannel() {
	      var channel = new MessageChannel();
	      channel.port1.onmessage = lib$es6$promise$asap$$flush;
	      return function () {
	        channel.port2.postMessage(0);
	      };
	    }
	
	    function lib$es6$promise$asap$$useSetTimeout() {
	      return function() {
	        setTimeout(lib$es6$promise$asap$$flush, 1);
	      };
	    }
	
	    var lib$es6$promise$asap$$queue = new Array(1000);
	    function lib$es6$promise$asap$$flush() {
	      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
	        var callback = lib$es6$promise$asap$$queue[i];
	        var arg = lib$es6$promise$asap$$queue[i+1];
	
	        callback(arg);
	
	        lib$es6$promise$asap$$queue[i] = undefined;
	        lib$es6$promise$asap$$queue[i+1] = undefined;
	      }
	
	      lib$es6$promise$asap$$len = 0;
	    }
	
	    function lib$es6$promise$asap$$attemptVertx() {
	      try {
	        var r = require;
	        var vertx = __webpack_require__(8);
	        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
	        return lib$es6$promise$asap$$useVertxTimer();
	      } catch(e) {
	        return lib$es6$promise$asap$$useSetTimeout();
	      }
	    }
	
	    var lib$es6$promise$asap$$scheduleFlush;
	    // Decide what async method to use to triggering processing of queued callbacks:
	    if (lib$es6$promise$asap$$isNode) {
	      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
	    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
	      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
	    } else if (lib$es6$promise$asap$$isWorker) {
	      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
	    } else if (lib$es6$promise$asap$$browserWindow === undefined && "function" === 'function') {
	      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
	    } else {
	      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
	    }
	    function lib$es6$promise$then$$then(onFulfillment, onRejection) {
	      var parent = this;
	
	      var child = new this.constructor(lib$es6$promise$$internal$$noop);
	
	      if (child[lib$es6$promise$$internal$$PROMISE_ID] === undefined) {
	        lib$es6$promise$$internal$$makePromise(child);
	      }
	
	      var state = parent._state;
	
	      if (state) {
	        var callback = arguments[state - 1];
	        lib$es6$promise$asap$$asap(function(){
	          lib$es6$promise$$internal$$invokeCallback(state, child, callback, parent._result);
	        });
	      } else {
	        lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
	      }
	
	      return child;
	    }
	    var lib$es6$promise$then$$default = lib$es6$promise$then$$then;
	    function lib$es6$promise$promise$resolve$$resolve(object) {
	      /*jshint validthis:true */
	      var Constructor = this;
	
	      if (object && typeof object === 'object' && object.constructor === Constructor) {
	        return object;
	      }
	
	      var promise = new Constructor(lib$es6$promise$$internal$$noop);
	      lib$es6$promise$$internal$$resolve(promise, object);
	      return promise;
	    }
	    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
	    var lib$es6$promise$$internal$$PROMISE_ID = Math.random().toString(36).substring(16);
	
	    function lib$es6$promise$$internal$$noop() {}
	
	    var lib$es6$promise$$internal$$PENDING   = void 0;
	    var lib$es6$promise$$internal$$FULFILLED = 1;
	    var lib$es6$promise$$internal$$REJECTED  = 2;
	
	    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();
	
	    function lib$es6$promise$$internal$$selfFulfillment() {
	      return new TypeError("You cannot resolve a promise with itself");
	    }
	
	    function lib$es6$promise$$internal$$cannotReturnOwn() {
	      return new TypeError('A promises callback cannot return that same promise.');
	    }
	
	    function lib$es6$promise$$internal$$getThen(promise) {
	      try {
	        return promise.then;
	      } catch(error) {
	        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
	        return lib$es6$promise$$internal$$GET_THEN_ERROR;
	      }
	    }
	
	    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
	      try {
	        then.call(value, fulfillmentHandler, rejectionHandler);
	      } catch(e) {
	        return e;
	      }
	    }
	
	    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
	       lib$es6$promise$asap$$asap(function(promise) {
	        var sealed = false;
	        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
	          if (sealed) { return; }
	          sealed = true;
	          if (thenable !== value) {
	            lib$es6$promise$$internal$$resolve(promise, value);
	          } else {
	            lib$es6$promise$$internal$$fulfill(promise, value);
	          }
	        }, function(reason) {
	          if (sealed) { return; }
	          sealed = true;
	
	          lib$es6$promise$$internal$$reject(promise, reason);
	        }, 'Settle: ' + (promise._label || ' unknown promise'));
	
	        if (!sealed && error) {
	          sealed = true;
	          lib$es6$promise$$internal$$reject(promise, error);
	        }
	      }, promise);
	    }
	
	    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
	      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
	        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
	      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
	        lib$es6$promise$$internal$$reject(promise, thenable._result);
	      } else {
	        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
	          lib$es6$promise$$internal$$resolve(promise, value);
	        }, function(reason) {
	          lib$es6$promise$$internal$$reject(promise, reason);
	        });
	      }
	    }
	
	    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable, then) {
	      if (maybeThenable.constructor === promise.constructor &&
	          then === lib$es6$promise$then$$default &&
	          constructor.resolve === lib$es6$promise$promise$resolve$$default) {
	        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
	      } else {
	        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
	          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
	        } else if (then === undefined) {
	          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
	        } else if (lib$es6$promise$utils$$isFunction(then)) {
	          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
	        } else {
	          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
	        }
	      }
	    }
	
	    function lib$es6$promise$$internal$$resolve(promise, value) {
	      if (promise === value) {
	        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
	      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
	        lib$es6$promise$$internal$$handleMaybeThenable(promise, value, lib$es6$promise$$internal$$getThen(value));
	      } else {
	        lib$es6$promise$$internal$$fulfill(promise, value);
	      }
	    }
	
	    function lib$es6$promise$$internal$$publishRejection(promise) {
	      if (promise._onerror) {
	        promise._onerror(promise._result);
	      }
	
	      lib$es6$promise$$internal$$publish(promise);
	    }
	
	    function lib$es6$promise$$internal$$fulfill(promise, value) {
	      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
	
	      promise._result = value;
	      promise._state = lib$es6$promise$$internal$$FULFILLED;
	
	      if (promise._subscribers.length !== 0) {
	        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
	      }
	    }
	
	    function lib$es6$promise$$internal$$reject(promise, reason) {
	      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
	      promise._state = lib$es6$promise$$internal$$REJECTED;
	      promise._result = reason;
	
	      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
	    }
	
	    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
	      var subscribers = parent._subscribers;
	      var length = subscribers.length;
	
	      parent._onerror = null;
	
	      subscribers[length] = child;
	      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
	      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;
	
	      if (length === 0 && parent._state) {
	        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
	      }
	    }
	
	    function lib$es6$promise$$internal$$publish(promise) {
	      var subscribers = promise._subscribers;
	      var settled = promise._state;
	
	      if (subscribers.length === 0) { return; }
	
	      var child, callback, detail = promise._result;
	
	      for (var i = 0; i < subscribers.length; i += 3) {
	        child = subscribers[i];
	        callback = subscribers[i + settled];
	
	        if (child) {
	          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
	        } else {
	          callback(detail);
	        }
	      }
	
	      promise._subscribers.length = 0;
	    }
	
	    function lib$es6$promise$$internal$$ErrorObject() {
	      this.error = null;
	    }
	
	    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();
	
	    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
	      try {
	        return callback(detail);
	      } catch(e) {
	        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
	        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
	      }
	    }
	
	    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
	      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
	          value, error, succeeded, failed;
	
	      if (hasCallback) {
	        value = lib$es6$promise$$internal$$tryCatch(callback, detail);
	
	        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
	          failed = true;
	          error = value.error;
	          value = null;
	        } else {
	          succeeded = true;
	        }
	
	        if (promise === value) {
	          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
	          return;
	        }
	
	      } else {
	        value = detail;
	        succeeded = true;
	      }
	
	      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
	        // noop
	      } else if (hasCallback && succeeded) {
	        lib$es6$promise$$internal$$resolve(promise, value);
	      } else if (failed) {
	        lib$es6$promise$$internal$$reject(promise, error);
	      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
	        lib$es6$promise$$internal$$fulfill(promise, value);
	      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
	        lib$es6$promise$$internal$$reject(promise, value);
	      }
	    }
	
	    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
	      try {
	        resolver(function resolvePromise(value){
	          lib$es6$promise$$internal$$resolve(promise, value);
	        }, function rejectPromise(reason) {
	          lib$es6$promise$$internal$$reject(promise, reason);
	        });
	      } catch(e) {
	        lib$es6$promise$$internal$$reject(promise, e);
	      }
	    }
	
	    var lib$es6$promise$$internal$$id = 0;
	    function lib$es6$promise$$internal$$nextId() {
	      return lib$es6$promise$$internal$$id++;
	    }
	
	    function lib$es6$promise$$internal$$makePromise(promise) {
	      promise[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$id++;
	      promise._state = undefined;
	      promise._result = undefined;
	      promise._subscribers = [];
	    }
	
	    function lib$es6$promise$promise$all$$all(entries) {
	      return new lib$es6$promise$enumerator$$default(this, entries).promise;
	    }
	    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
	    function lib$es6$promise$promise$race$$race(entries) {
	      /*jshint validthis:true */
	      var Constructor = this;
	
	      if (!lib$es6$promise$utils$$isArray(entries)) {
	        return new Constructor(function(resolve, reject) {
	          reject(new TypeError('You must pass an array to race.'));
	        });
	      } else {
	        return new Constructor(function(resolve, reject) {
	          var length = entries.length;
	          for (var i = 0; i < length; i++) {
	            Constructor.resolve(entries[i]).then(resolve, reject);
	          }
	        });
	      }
	    }
	    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
	    function lib$es6$promise$promise$reject$$reject(reason) {
	      /*jshint validthis:true */
	      var Constructor = this;
	      var promise = new Constructor(lib$es6$promise$$internal$$noop);
	      lib$es6$promise$$internal$$reject(promise, reason);
	      return promise;
	    }
	    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;
	
	
	    function lib$es6$promise$promise$$needsResolver() {
	      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
	    }
	
	    function lib$es6$promise$promise$$needsNew() {
	      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
	    }
	
	    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
	    /**
	      Promise objects represent the eventual result of an asynchronous operation. The
	      primary way of interacting with a promise is through its `then` method, which
	      registers callbacks to receive either a promise's eventual value or the reason
	      why the promise cannot be fulfilled.
	
	      Terminology
	      -----------
	
	      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
	      - `thenable` is an object or function that defines a `then` method.
	      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
	      - `exception` is a value that is thrown using the throw statement.
	      - `reason` is a value that indicates why a promise was rejected.
	      - `settled` the final resting state of a promise, fulfilled or rejected.
	
	      A promise can be in one of three states: pending, fulfilled, or rejected.
	
	      Promises that are fulfilled have a fulfillment value and are in the fulfilled
	      state.  Promises that are rejected have a rejection reason and are in the
	      rejected state.  A fulfillment value is never a thenable.
	
	      Promises can also be said to *resolve* a value.  If this value is also a
	      promise, then the original promise's settled state will match the value's
	      settled state.  So a promise that *resolves* a promise that rejects will
	      itself reject, and a promise that *resolves* a promise that fulfills will
	      itself fulfill.
	
	
	      Basic Usage:
	      ------------
	
	      ```js
	      var promise = new Promise(function(resolve, reject) {
	        // on success
	        resolve(value);
	
	        // on failure
	        reject(reason);
	      });
	
	      promise.then(function(value) {
	        // on fulfillment
	      }, function(reason) {
	        // on rejection
	      });
	      ```
	
	      Advanced Usage:
	      ---------------
	
	      Promises shine when abstracting away asynchronous interactions such as
	      `XMLHttpRequest`s.
	
	      ```js
	      function getJSON(url) {
	        return new Promise(function(resolve, reject){
	          var xhr = new XMLHttpRequest();
	
	          xhr.open('GET', url);
	          xhr.onreadystatechange = handler;
	          xhr.responseType = 'json';
	          xhr.setRequestHeader('Accept', 'application/json');
	          xhr.send();
	
	          function handler() {
	            if (this.readyState === this.DONE) {
	              if (this.status === 200) {
	                resolve(this.response);
	              } else {
	                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
	              }
	            }
	          };
	        });
	      }
	
	      getJSON('/posts.json').then(function(json) {
	        // on fulfillment
	      }, function(reason) {
	        // on rejection
	      });
	      ```
	
	      Unlike callbacks, promises are great composable primitives.
	
	      ```js
	      Promise.all([
	        getJSON('/posts'),
	        getJSON('/comments')
	      ]).then(function(values){
	        values[0] // => postsJSON
	        values[1] // => commentsJSON
	
	        return values;
	      });
	      ```
	
	      @class Promise
	      @param {function} resolver
	      Useful for tooling.
	      @constructor
	    */
	    function lib$es6$promise$promise$$Promise(resolver) {
	      this[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$nextId();
	      this._result = this._state = undefined;
	      this._subscribers = [];
	
	      if (lib$es6$promise$$internal$$noop !== resolver) {
	        typeof resolver !== 'function' && lib$es6$promise$promise$$needsResolver();
	        this instanceof lib$es6$promise$promise$$Promise ? lib$es6$promise$$internal$$initializePromise(this, resolver) : lib$es6$promise$promise$$needsNew();
	      }
	    }
	
	    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
	    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
	    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
	    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
	    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
	    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
	    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;
	
	    lib$es6$promise$promise$$Promise.prototype = {
	      constructor: lib$es6$promise$promise$$Promise,
	
	    /**
	      The primary way of interacting with a promise is through its `then` method,
	      which registers callbacks to receive either a promise's eventual value or the
	      reason why the promise cannot be fulfilled.
	
	      ```js
	      findUser().then(function(user){
	        // user is available
	      }, function(reason){
	        // user is unavailable, and you are given the reason why
	      });
	      ```
	
	      Chaining
	      --------
	
	      The return value of `then` is itself a promise.  This second, 'downstream'
	      promise is resolved with the return value of the first promise's fulfillment
	      or rejection handler, or rejected if the handler throws an exception.
	
	      ```js
	      findUser().then(function (user) {
	        return user.name;
	      }, function (reason) {
	        return 'default name';
	      }).then(function (userName) {
	        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
	        // will be `'default name'`
	      });
	
	      findUser().then(function (user) {
	        throw new Error('Found user, but still unhappy');
	      }, function (reason) {
	        throw new Error('`findUser` rejected and we're unhappy');
	      }).then(function (value) {
	        // never reached
	      }, function (reason) {
	        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
	        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
	      });
	      ```
	      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
	
	      ```js
	      findUser().then(function (user) {
	        throw new PedagogicalException('Upstream error');
	      }).then(function (value) {
	        // never reached
	      }).then(function (value) {
	        // never reached
	      }, function (reason) {
	        // The `PedgagocialException` is propagated all the way down to here
	      });
	      ```
	
	      Assimilation
	      ------------
	
	      Sometimes the value you want to propagate to a downstream promise can only be
	      retrieved asynchronously. This can be achieved by returning a promise in the
	      fulfillment or rejection handler. The downstream promise will then be pending
	      until the returned promise is settled. This is called *assimilation*.
	
	      ```js
	      findUser().then(function (user) {
	        return findCommentsByAuthor(user);
	      }).then(function (comments) {
	        // The user's comments are now available
	      });
	      ```
	
	      If the assimliated promise rejects, then the downstream promise will also reject.
	
	      ```js
	      findUser().then(function (user) {
	        return findCommentsByAuthor(user);
	      }).then(function (comments) {
	        // If `findCommentsByAuthor` fulfills, we'll have the value here
	      }, function (reason) {
	        // If `findCommentsByAuthor` rejects, we'll have the reason here
	      });
	      ```
	
	      Simple Example
	      --------------
	
	      Synchronous Example
	
	      ```javascript
	      var result;
	
	      try {
	        result = findResult();
	        // success
	      } catch(reason) {
	        // failure
	      }
	      ```
	
	      Errback Example
	
	      ```js
	      findResult(function(result, err){
	        if (err) {
	          // failure
	        } else {
	          // success
	        }
	      });
	      ```
	
	      Promise Example;
	
	      ```javascript
	      findResult().then(function(result){
	        // success
	      }, function(reason){
	        // failure
	      });
	      ```
	
	      Advanced Example
	      --------------
	
	      Synchronous Example
	
	      ```javascript
	      var author, books;
	
	      try {
	        author = findAuthor();
	        books  = findBooksByAuthor(author);
	        // success
	      } catch(reason) {
	        // failure
	      }
	      ```
	
	      Errback Example
	
	      ```js
	
	      function foundBooks(books) {
	
	      }
	
	      function failure(reason) {
	
	      }
	
	      findAuthor(function(author, err){
	        if (err) {
	          failure(err);
	          // failure
	        } else {
	          try {
	            findBoooksByAuthor(author, function(books, err) {
	              if (err) {
	                failure(err);
	              } else {
	                try {
	                  foundBooks(books);
	                } catch(reason) {
	                  failure(reason);
	                }
	              }
	            });
	          } catch(error) {
	            failure(err);
	          }
	          // success
	        }
	      });
	      ```
	
	      Promise Example;
	
	      ```javascript
	      findAuthor().
	        then(findBooksByAuthor).
	        then(function(books){
	          // found books
	      }).catch(function(reason){
	        // something went wrong
	      });
	      ```
	
	      @method then
	      @param {Function} onFulfilled
	      @param {Function} onRejected
	      Useful for tooling.
	      @return {Promise}
	    */
	      then: lib$es6$promise$then$$default,
	
	    /**
	      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
	      as the catch block of a try/catch statement.
	
	      ```js
	      function findAuthor(){
	        throw new Error('couldn't find that author');
	      }
	
	      // synchronous
	      try {
	        findAuthor();
	      } catch(reason) {
	        // something went wrong
	      }
	
	      // async with promises
	      findAuthor().catch(function(reason){
	        // something went wrong
	      });
	      ```
	
	      @method catch
	      @param {Function} onRejection
	      Useful for tooling.
	      @return {Promise}
	    */
	      'catch': function(onRejection) {
	        return this.then(null, onRejection);
	      }
	    };
	    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;
	    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
	      this._instanceConstructor = Constructor;
	      this.promise = new Constructor(lib$es6$promise$$internal$$noop);
	
	      if (!this.promise[lib$es6$promise$$internal$$PROMISE_ID]) {
	        lib$es6$promise$$internal$$makePromise(this.promise);
	      }
	
	      if (lib$es6$promise$utils$$isArray(input)) {
	        this._input     = input;
	        this.length     = input.length;
	        this._remaining = input.length;
	
	        this._result = new Array(this.length);
	
	        if (this.length === 0) {
	          lib$es6$promise$$internal$$fulfill(this.promise, this._result);
	        } else {
	          this.length = this.length || 0;
	          this._enumerate();
	          if (this._remaining === 0) {
	            lib$es6$promise$$internal$$fulfill(this.promise, this._result);
	          }
	        }
	      } else {
	        lib$es6$promise$$internal$$reject(this.promise, lib$es6$promise$enumerator$$validationError());
	      }
	    }
	
	    function lib$es6$promise$enumerator$$validationError() {
	      return new Error('Array Methods must be provided an Array');
	    }
	
	    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
	      var length  = this.length;
	      var input   = this._input;
	
	      for (var i = 0; this._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
	        this._eachEntry(input[i], i);
	      }
	    };
	
	    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
	      var c = this._instanceConstructor;
	      var resolve = c.resolve;
	
	      if (resolve === lib$es6$promise$promise$resolve$$default) {
	        var then = lib$es6$promise$$internal$$getThen(entry);
	
	        if (then === lib$es6$promise$then$$default &&
	            entry._state !== lib$es6$promise$$internal$$PENDING) {
	          this._settledAt(entry._state, i, entry._result);
	        } else if (typeof then !== 'function') {
	          this._remaining--;
	          this._result[i] = entry;
	        } else if (c === lib$es6$promise$promise$$default) {
	          var promise = new c(lib$es6$promise$$internal$$noop);
	          lib$es6$promise$$internal$$handleMaybeThenable(promise, entry, then);
	          this._willSettleAt(promise, i);
	        } else {
	          this._willSettleAt(new c(function(resolve) { resolve(entry); }), i);
	        }
	      } else {
	        this._willSettleAt(resolve(entry), i);
	      }
	    };
	
	    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
	      var promise = this.promise;
	
	      if (promise._state === lib$es6$promise$$internal$$PENDING) {
	        this._remaining--;
	
	        if (state === lib$es6$promise$$internal$$REJECTED) {
	          lib$es6$promise$$internal$$reject(promise, value);
	        } else {
	          this._result[i] = value;
	        }
	      }
	
	      if (this._remaining === 0) {
	        lib$es6$promise$$internal$$fulfill(promise, this._result);
	      }
	    };
	
	    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
	      var enumerator = this;
	
	      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
	        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
	      }, function(reason) {
	        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
	      });
	    };
	    function lib$es6$promise$polyfill$$polyfill() {
	      var local;
	
	      if (typeof global !== 'undefined') {
	          local = global;
	      } else if (typeof self !== 'undefined') {
	          local = self;
	      } else {
	          try {
	              local = Function('return this')();
	          } catch (e) {
	              throw new Error('polyfill failed because global object is unavailable in this environment');
	          }
	      }
	
	      var P = local.Promise;
	
	      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
	        return;
	      }
	
	      local.Promise = lib$es6$promise$promise$$default;
	    }
	    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;
	
	    var lib$es6$promise$umd$$ES6Promise = {
	      'Promise': lib$es6$promise$promise$$default,
	      'polyfill': lib$es6$promise$polyfill$$default
	    };
	
	    /* global define:true module:true window: true */
	    if ("function" === 'function' && __webpack_require__(9)['amd']) {
	      !(__WEBPACK_AMD_DEFINE_RESULT__ = function() { return lib$es6$promise$umd$$ES6Promise; }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof module !== 'undefined' && module['exports']) {
	      module['exports'] = lib$es6$promise$umd$$ES6Promise;
	    } else if (typeof this !== 'undefined') {
	      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
	    }
	
	    lib$es6$promise$polyfill$$default();
	}).call(this);
	
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), (function() { return this; }()), __webpack_require__(7)(module)))

/***/ },
/* 6 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 8 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ },
/* 10 */
/***/ function(module, exports) {

	; (function(win, lib) {
	  var doc = win.document
	  var docEl = doc.documentElement
	  var metaEl = doc.querySelector('meta[name="viewport"]')
	  var flexibleEl = doc.querySelector('meta[name="flexible"]')
	  var dpr = 0
	  var scale = 0
	  var tid
	  var flexible = lib.flexible || (lib.flexible = {})
	  
	  if (metaEl) {
	    console.warn('将根据已有的meta标签来设置缩放比例')
	    var match = metaEl.getAttribute('content')
	      .match(/initial\-scale=([\d\.]+)/)
	    if (match) {
	      scale = parseFloat(match[1])
	      dpr = parseInt(1 / scale)
	    }
	  } else if (flexibleEl) {
	    var content = flexibleEl.getAttribute('content')
	    if (content) {
	      var initialDpr = content.match(/initial\-dpr=([\d\.]+)/)
	      var maximumDpr = content.match(/maximum\-dpr=([\d\.]+)/)
	      if (initialDpr) {
	        dpr = parseFloat(initialDpr[1])
	        scale = parseFloat((1 / dpr).toFixed(2))    
	      }
	      if (maximumDpr) {
	        dpr = parseFloat(maximumDpr[1])
	        scale = parseFloat((1 / dpr).toFixed(2))    
	      }
	    }
	  }
	
	  if (!dpr && !scale) {
	    var isAndroid = win.navigator.appVersion.match(/android/gi)
	    var isIPhone = win.navigator.appVersion.match(/iphone/gi)
	    var devicePixelRatio = win.devicePixelRatio
	    if (isIPhone) {
	      // iOS下，对于2和3的屏，用2倍的方案，其余的用1倍方案
	      if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {                
	        dpr = 3
	      } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)){
	        dpr = 2
	      } else {
	        dpr = 1
	      }
	    } else {
	      // 其他设备下，仍旧使用1倍的方案
	      dpr = 1
	    }
	    scale = 1 / dpr
	  }
	
	  docEl.setAttribute('data-dpr', dpr)
	  if (!metaEl) {
	    metaEl = doc.createElement('meta')
	    metaEl.setAttribute('name', 'viewport')
	    metaEl.setAttribute(
	      'content',
	      'initial-scale='
	        + scale + ', maximum-scale='
	        + scale + ', minimum-scale='
	        + scale + ', user-scalable=no'
	      )
	    if (docEl.firstElementChild) {
	      docEl.firstElementChild.appendChild(metaEl)
	    } else {
	      var wrap = doc.createElement('div')
	      wrap.appendChild(metaEl)
	      doc.write(wrap.innerHTML)
	    }
	  }
	
	  function refreshRem(){
	    var width = docEl.getBoundingClientRect().width
	    if (width / dpr > 540) {
	      width = 540 * dpr
	    }
	    var rem = width / 10
	    docEl.style.fontSize = rem + 'px'
	    flexible.rem = win.rem = rem
	  }
	
	  win.addEventListener('resize', function() {
	    clearTimeout(tid)
	    tid = setTimeout(refreshRem, 300)
	  }, false)
	  win.addEventListener('pageshow', function(e) {
	    if (e.persisted) {
	      clearTimeout(tid)
	      tid = setTimeout(refreshRem, 300)
	    }
	  }, false)
	
	  if (doc.readyState === 'complete') {
	    doc.body.style.fontSize = 12 * dpr + 'px'
	  } else {
	    doc.addEventListener('DOMContentLoaded', function(e) {
	      doc.body.style.fontSize = 12 * dpr + 'px'
	    }, false)
	  }
	  
	  refreshRem()
	
	  flexible.dpr = win.dpr = dpr
	  flexible.refreshRem = refreshRem
	  flexible.rem2px = function(d) {
	    var val = parseFloat(d) * this.rem
	    if (typeof d === 'string' && d.match(/rem$/)) {
	      val += 'px'
	    }
	    return val
	  }
	  flexible.px2rem = function(d) {
	    var val = parseFloat(d) / this.rem
	    if (typeof d === 'string' && d.match(/px$/)) {
	      val += 'rem'
	    }
	    return val
	  }
	
	})(window, window['lib'] || (window['lib'] = {}))

/***/ },
/* 11 */
/***/ function(module, exports) {

	'use strict'
	
	var config = {
	
	  weexVersion: '0.5.0',
	
	  debug: false
	
	}
	
	module.exports = config

/***/ },
/* 12 */
/***/ function(module, exports) {

	'use strict'
	
	function loadByXHR(config, callback) {
	  if (!config.source) {
	    callback(new Error('xhr loader: missing config.source.'))
	  }
	  var xhr = new XMLHttpRequest()
	  xhr.open('GET', config.source)
	  xhr.onload = function () {
	    callback(null, this.responseText)
	  }
	  xhr.onerror = function (error) {
	    callback(error)
	  }
	  xhr.send()
	}
	
	function loadByJsonp(config, callback) {
	  if (!config.source) {
	    callback(new Error('jsonp loader: missing config.source.'))
	  }
	  var callbackName = config.jsonpCallback || 'weexJsonpCallback'
	  window[callbackName] = function (code) {
	    if (code) {
	      callback(null, code)
	    } else {
	      callback(new Error('load by jsonp error'))
	    }
	  }
	  var script = document.createElement('script')
	  script.src = decodeURIComponent(config.source)
	  script.type = 'text/javascript'
	  document.body.appendChild(script)
	}
	
	function loadBySourceCode(config, callback) {
	  // src is the jsbundle.
	  // no need to fetch from anywhere.
	  if (config.source) {
	    callback(null, config.source)
	  } else {
	    callback(new Error('source code laoder: missing config.source.'))
	  }
	}
	
	var callbackMap = {
	  xhr: loadByXHR,
	  jsonp: loadByJsonp,
	  source: loadBySourceCode
	}
	
	function load(options, callback) {
	  var loadFn = callbackMap[options.loader]
	  loadFn(options, callback)
	}
	
	function registerLoader(name, loaderFunc) {
	  if (typeof loaderFunc === 'function') {
	    callbackMap[name] = loaderFunc
	  }
	}
	
	module.exports = {
	  load: load,
	  registerLoader: registerLoader
	}


/***/ },
/* 13 */
/***/ function(module, exports) {

	'use strict'
	
	var WEAPP_STYLE_ID = 'weapp-style'
	
	var _isWebpSupported = false
	
	; (function isSupportWebp() {
	  try {
	    var webP = new Image()
	    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdA'
	              + 'SoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
	    webP.onload = function () {
	      if (webP.height === 2) {
	        _isWebpSupported = true
	      }
	    }
	  } catch (e) {
	    // do nothing.
	  }
	})()
	
	function extend(to, from) {
	  for (var key in from) {
	    to[key] = from[key]
	  }
	  return to
	}
	
	function isArray(arr) {
	  return Array.isArray
	    ? Array.isArray(arr)
	    : (Object.prototype.toString.call(arr) === '[object Array]')
	}
	
	function appendStyle(css, styleId, replace) {
	  var style = document.getElementById(styleId)
	  if (style && replace) {
	    style.parentNode.removeChild(style)
	    style = null
	  }
	  if (!style) {
	    style = document.createElement('style')
	    style.type = 'text/css'
	    styleId && (style.id = styleId)
	    document.getElementsByTagName('head')[0].appendChild(style)
	  }
	  style.appendChild(document.createTextNode(css))
	}
	
	function getUniqueFromArray(arr) {
	  if (!isArray(arr)) {
	    return []
	  }
	  var res = []
	  var unique = {}
	  var val
	  for (var i = 0, l = arr.length; i < l; i++) {
	    val = arr[i]
	    if (unique[val]) {
	      continue
	    }
	    unique[val] = true
	    res.push(val)
	  }
	  return res
	}
	
	function transitionize(element, props) {
	  var transitions = []
	  for (var key in props) {
	    transitions.push(key + ' ' + props[key])
	  }
	  element.style.transition = transitions.join(', ')
	  element.style.webkitTransition = transitions.join(', ')
	}
	
	function detectWebp() {
	  return _isWebpSupported
	}
	
	function getRandom(num) {
	  var _defaultNum = 10
	  if (typeof num !== 'number' || num <= 0) {
	    num = _defaultNum
	  }
	  var _max = Math.pow(10, num)
	  return Math.floor(Date.now() + Math.random() * _max) % _max
	}
	
	function getRgb(color) {
	  var match
	  color = color + ''
	  if (match = color.match(/#(\d{2})(\d{2})(\d{2})/)) {
	    return {
	      r: parseInt(match[1], 16),
	      g: parseInt(match[2], 16),
	      b: parseInt(match[3], 16)
	    }
	  }
	  if (match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)) {
	    return {
	      r: parseInt(match[1]),
	      g: parseInt(match[2]),
	      b: parseInt(match[3])
	    }
	  }
	}
	
	// direction: 'l' | 'r', default is 'r'
	// num: how many times to loop, should be a positive integer
	function loopArray(arr, num, direction) {
	  if (!isArray(arr)) {
	    return
	  }
	  var isLeft = (direction + '').toLowerCase() === 'l'
	  var len = arr.length
	  num = num % len
	  if (num < 0) {
	    num = -num
	    isLeft = !isLeft
	  }
	  if (num === 0) {
	    return arr
	  }
	  var res, lp, rp
	  if (isLeft) {
	    lp = arr.slice(0, num)
	    rp = arr.slice(num)
	  } else {
	    lp = arr.slice(0, len - num)
	    rp = arr.slice(len - num)
	  }
	  return rp.concat(lp)
	}
	
	// pad a integer number with zeros on the left.
	// example: fillInt(12, 3) -> '012'
	// - num: the number to pad
	// - len: the specified length
	function leftPad(num, len) {
	  if (len <= 0) {
	    return num
	  }
	  var numLen = (num + '').length
	  if (numLen >= len) {
	    return num
	  }
	  return new Array(len - numLen + 1).join('0') + num
	}
	
	// get DateStr with specified separator like '2016-06-03'
	function getDateStr(separator) {
	  var dt = new Date()
	  var y = dt.getFullYear()
	  var m = leftPad(dt.getMonth() + 1, 2)
	  var d = leftPad(dt.getDate(), 2)
	  return [y, m, d].join(separator || '')
	}
	
	module.exports = {
	  extend: extend,
	  isArray: isArray,
	  appendStyle: appendStyle,
	  getUniqueFromArray: getUniqueFromArray,
	  transitionize: transitionize,
	  detectWebp: detectWebp,
	  getRandom: getRandom,
	  getRgb: getRgb,
	  loopArray: loopArray,
	  leftPad: leftPad,
	  getDateStr: getDateStr
	}

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var extend = __webpack_require__(13).extend
	var isArray = __webpack_require__(13).isArray
	var ComponentManager = __webpack_require__(15)
	
	// for jsframework to register modules.
	var _registerModules = function (config) {
	  if (isArray(config)) {
	    for (var i = 0, l = config.length; i < l; i++) {
	      window.registerModules(config[i])
	    }
	  } else {
	    window.registerModules(config)
	  }
	}
	
	var protocol = {
	
	  // weex instances
	  _instances: {},
	
	  // api meta info
	  _meta: {},
	
	  // Weex.registerApiModule used this to register and access apiModules.
	  apiModule: {},
	
	  injectWeexInstance: function (instance) {
	    this._instances[instance.instanceId] = instance
	  },
	
	  getWeexInstance: function (instanceId) {
	    return this._instances[instanceId]
	  },
	
	  // get the api method meta info array for the module.
	  getApiModuleMeta: function (moduleName) {
	    var metaObj = {}
	    metaObj[moduleName] = this._meta[moduleName]
	    return metaObj
	  },
	
	  // Set meta info for a api module.
	  // If there is a same named api, just replace it.
	  // opts:
	  // - metaObj: meta object like
	  // {
	  //    dom: [{
	  //      name: 'addElement',
	  //      args: ['string', 'object']
	  //    }]
	  // }
	  setApiModuleMeta: function (metaObj) {
	    var moduleName
	    for (var k in metaObj) {
	      if (metaObj.hasOwnProperty(k)) {
	        moduleName = k
	      }
	    }
	    var metaArray = this._meta[moduleName]
	    if (!metaArray) {
	      this._meta[moduleName] = metaObj[moduleName]
	    } else {
	      var nameObj = {}
	      metaObj[moduleName].forEach(function (api) {
	        nameObj[api.name] = api
	      })
	      metaArray.forEach(function (api, i) {
	        if (nameObj[api.name]) {
	          metaArray[i] = nameObj[api.name]
	          delete nameObj[api.name]
	        }
	      })
	      for (var k in metaObj) {
	        if (metaObj.hasOwnProperty(k)) {
	          metaArray.push(metaObj[k])
	        }
	      }
	    }
	    this._meta[moduleName] = metaObj[moduleName]
	  },
	
	  // Set meta info for a single api.
	  // opts:
	  //  - moduleName: api module name.
	  //  - meta: a meta object like:
	  //  {
	  //    name: 'addElement',
	  //    args: ['string', 'object']
	  //  }
	  setApiMeta: function (moduleName, meta) {
	    var metaArray = this._meta[moduleName]
	    if (!metaArray) {
	      this._meta[moduleName] = [meta]
	    } else {
	      var metaIdx = -1
	      metaArray.forEach(function (api, i) {
	        if (meta.name === name) {
	          metaIdx = i
	        }
	      })
	      if (metaIdx !== -1) {
	        metaArray[metaIdx] = meta
	      } else {
	        metaArray.push(meta)
	      }
	    }
	  }
	}
	
	_registerModules([{
	  modal: [{
	    name: 'toast',
	    args: ['object', 'function']
	  }, {
	    name: 'alert',
	    args: ['object', 'function']
	  }, {
	    name: 'confirm',
	    args: ['object', 'function']
	  }, {
	    name: 'prompt',
	    args: ['object', 'function']
	  }]
	}, {
	  animation: [{
	    name: 'transition',
	    args: ['string', 'object', 'function']
	  }]
	}])
	
	module.exports = protocol


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var config = __webpack_require__(11)
	var FrameUpdater = __webpack_require__(16)
	var AppearWatcher = __webpack_require__(17)
	var utils = __webpack_require__(13)
	var LazyLoad = __webpack_require__(18)
	var animation = __webpack_require__(21)
	
	var RENDERING_INDENT = 800
	
	var _instanceMap = {}
	var typeMap = {}
	var scrollableTypes = [
	  'scroller',
	  'hscroller',
	  'vscroller',
	  'list',
	  'hlist',
	  'vlist'
	]
	
	function ComponentManager(instance) {
	  this.instanceId = instance.instanceId
	  this.weexInstance = instance
	  this.componentMap = {}
	  _instanceMap[this.instanceId] = this
	}
	
	ComponentManager.getInstance = function (instanceId) {
	  return _instanceMap[instanceId]
	}
	
	ComponentManager.getWeexInstance = function (instanceId) {
	  return _instanceMap[instanceId].weexInstance
	}
	
	ComponentManager.registerComponent = function (type, definition) {
	  typeMap[type] = definition
	}
	
	ComponentManager.getScrollableTypes = function () {
	  return scrollableTypes
	}
	
	ComponentManager.prototype = {
	
	  // Fire a event 'renderbegin'/'renderend' on body element.
	  rendering: function () {
	    function _renderingEnd() {
	      // get weex instance root
	      window.dispatchEvent(new Event('renderend'))
	      this._renderingTimer = null
	    }
	    if (this._renderingTimer) {
	      clearTimeout(this._renderingTimer)
	      this._renderingTimer = setTimeout(
	        _renderingEnd.bind(this),
	        RENDERING_INDENT
	      )
	    } else {
	      window.dispatchEvent(new Event('renderbegin'))
	      this._renderingTimer = setTimeout(
	        _renderingEnd.bind(this),
	        RENDERING_INDENT
	      )
	    }
	  },
	
	  getElementByRef: function (ref) {
	    return this.componentMap[ref]
	  },
	
	  removeElementByRef: function (ref) {
	    var cmp
	    var self = this
	    if (!ref || !(cmp = this.componentMap[ref])) {
	      return
	    }
	    // remove from this.componentMap cursively
	    (function _removeCursively(_ref) {
	      var child = self.componentMap[_ref]
	      var listeners = child._listeners
	      var children = child.data.children
	      if (children && children.length) {
	        for (var i = 0, l = children.length; i < l; i++) {
	          _removeCursively(children[i].ref)
	        }
	      }
	      // remove events from _ref component
	      if (listeners) {
	        for (var type in listeners) {
	          child.node.removeEventListener(type, listeners[type])
	        }
	      }
	      delete child._listeners
	      delete child.node._listeners
	      // remove _ref component
	      delete self.componentMap[_ref]
	    })(ref)
	
	  },
	
	  createElement: function (data, nodeType) {
	    var ComponentType = typeMap[data.type]
	    if (!ComponentType) {
	      ComponentType = typeMap['container']
	    }
	
	    var ref = data.ref
	    var component = new ComponentType(data, nodeType)
	
	    this.componentMap[ref] = component
	    component.node.setAttribute('data-ref', ref)
	
	    return component
	  },
	
	  /**
	   * createBody: generate root component
	   * @param  {object} element
	   */
	  createBody: function (element) {
	
	    // TODO: creatbody on document.body
	    // no need to create a extra div
	    var root, body, nodeType
	    if (this.componentMap['_root']) {
	      return
	    }
	
	    nodeType = element.type
	    element.type = 'root'
	    element.rootId = this.weexInstance.rootId
	    element.ref = '_root'
	
	    var root = this.createElement(element, nodeType)
	    body = document.querySelector('#' + this.weexInstance.rootId)
	          || document.body
	    body.appendChild(root.node)
	    root._appended = true
	  },
	
	  appendChild: function (parentRef, data) {
	    var parent = this.componentMap[parentRef]
	
	    if (this.componentMap[data.ref] || !parent) {
	      return
	    }
	
	    if (parentRef === '_root' && !parent) {
	      parent = this.createElement({
	        type: 'root',
	        rootId: this.weexInstance.rootId,
	        ref: '_root'
	      })
	      parent._appended = true
	    }
	
	    var child = parent.appendChild(data)
	
	    // In some parent component the implementation of method
	    // appendChild didn't return the component at all, therefor
	    // child maybe a undefined object.
	    if (child) {
	      child.parentRef = parentRef
	    }
	
	    if (child && parent._appended) {
	      this.handleAppend(child)
	    }
	  },
	
	  appendChildren: function (ref, elements) {
	    for (var i = 0; i < elements.length; i++) {
	      this.appendChild(ref, elements[i])
	    }
	  },
	
	  removeElement: function (ref) {
	    var component = this.componentMap[ref]
	
	    // fire event for rendering dom on body elment.
	    this.rendering()
	
	    if (component && component.parentRef) {
	      var parent = this.componentMap[component.parentRef]
	      component.onRemove && component.onRemove()
	      parent.removeChild(component)
	    } else {
	      console.warn('ref: ', ref)
	    }
	  },
	
	  moveElement: function (ref, parentRef, index) {
	    var component = this.componentMap[ref]
	    var newParent = this.componentMap[parentRef]
	    var oldParentRef = component.parentRef
	    var children, before, i, l
	    if (!component || !newParent) {
	      console.warn('ref: ', ref)
	      return
	    }
	
	    // fire event for rendering.
	    this.rendering()
	
	    if (index < -1) {
	      index = -1
	      console.warn('index cannot be less than -1.')
	    }
	
	    children = newParent.data.children
	    if (children
	        && children.length
	        && index !== -1
	        && index < children.length) {
	      before = this.componentMap[newParent.data.children[index].ref]
	    }
	
	    // remove from oldParent.data.children
	    if (oldParentRef && this.componentMap[oldParentRef]) {
	      children = this.componentMap[oldParentRef].data.children
	      if (children && children.length) {
	        for (i = 0, l = children.length; i < l; i++) {
	          if (children[i].ref === ref) {
	            break
	          }
	        }
	        if (l > i) {
	          children.splice(i, 1)
	        }
	      }
	    }
	
	    newParent.insertBefore(component, before)
	
	    component.onMove && component.onMove(parentRef, index)
	
	  },
	
	  insertBefore: function (ref, data) {
	    var child, before, parent
	    before = this.componentMap[ref]
	    child = this.componentMap[data.ref]
	    before && (parent = this.componentMap[before.parentRef])
	    if (child || !parent || !before) {
	      return
	    }
	
	    child = this.createElement(data)
	    if (child) {
	      child.parentRef = before.parentRef
	      parent.insertBefore(child, before)
	    } else {
	      return
	    }
	
	    if (this.componentMap[before.parentRef]._appended) {
	      this.handleAppend(child)
	    }
	  },
	
	  /**
	   * addElement
	   * If index is larget than any child's index, the
	   * element will be appended behind.
	   * @param {string} parentRef
	   * @param {obj} element (data of the component)
	   * @param {number} index
	   */
	  addElement: function (parentRef, element, index) {
	    var parent, children, before
	
	    // fire event for rendering dom on body elment.
	    this.rendering()
	
	    parent = this.componentMap[parentRef]
	    if (!parent) {
	      return
	    }
	    children = parent.data.children
	    // -1 means append as the last.
	    if (index < -1) {
	      index = -1
	      console.warn('index cannot be less than -1.')
	    }
	    if (children && children.length
	        && children.length > index
	        && index !== -1) {
	      this.insertBefore(children[index].ref, element)
	    } else {
	      this.appendChild(parentRef, element)
	    }
	  },
	
	  clearChildren: function (ref) {
	    var component = this.componentMap[ref]
	    if (component) {
	      component.node.innerHTML = ''
	      if (component.data) {
	        component.data.children = null
	      }
	    }
	  },
	
	  addEvent: function (ref, type) {
	    var component
	    if (typeof ref === 'string' || typeof ref === 'number') {
	      component = this.componentMap[ref]
	    } else if (Object.prototype.toString.call(ref).slice(8, -1) === 'Object') {
	      component = ref
	      ref = component.data.ref
	    }
	    if (component && component.node) {
	      var sender = this.weexInstance.sender
	      var listener = sender.fireEvent.bind(sender, ref, type)
	      var listeners = component._listeners
	      component.node.addEventListener(type, listener, false, false)
	      if (!listeners) {
	        listeners = component._listeners = {}
	        component.node._listeners = {}
	      }
	      listeners[type] = listener
	      component.node._listeners[type] = listener
	    }
	  },
	
	  removeEvent: function (ref, type) {
	    var component = this.componentMap[ref]
	    var listener = component._listeners[type]
	    if (component && listener) {
	      component.node.removeEventListener(type, listener)
	      component._listeners[type] = null
	      component.node._listeners[type] = null
	    }
	  },
	
	  updateAttrs: function (ref, attr) {
	    var component = this.componentMap[ref]
	    if (component) {
	      component.updateAttrs(attr)
	      if (component.data.type === 'image' && attr.src) {
	        LazyLoad.startIfNeeded(component)
	      }
	    }
	  },
	
	  updateStyle: function (ref, style) {
	    var component = this.componentMap[ref]
	    if (component) {
	      component.updateStyle(style)
	    }
	  },
	
	  updateFullAttrs: function (ref, attr) {
	    var component = this.componentMap[ref]
	    if (component) {
	      component.clearAttr()
	      component.updateAttrs(attr)
	      if (component.data.type === 'image' && attr.src) {
	        LazyLoad.startIfNeeded(component)
	      }
	    }
	  },
	
	  updateFullStyle: function (ref, style) {
	    var component = this.componentMap[ref]
	    if (component) {
	      component.clearStyle()
	      component.updateStyle(style)
	    }
	  },
	
	  handleAppend: function (component) {
	    component._appended = true
	    component.onAppend && component.onAppend()
	
	    // invoke onAppend on children recursively
	    var children = component.data.children
	    if (children) {
	      for (var i = 0; i < children.length; i++) {
	        var child = this.componentMap[children[i].ref]
	        if (child) {
	          this.handleAppend(child)
	        }
	      }
	    }
	
	    // watch appear/disappear of the component if needed
	    AppearWatcher.watchIfNeeded(component)
	
	    // do lazyload if needed
	    LazyLoad.startIfNeeded(component)
	  },
	
	  transition: function (ref, config, callback) {
	    var component = this.componentMap[ref]
	    animation.transitionOnce(component, config, callback)
	  },
	
	  renderFinish: function () {
	    FrameUpdater.pause()
	  }
	}
	
	module.exports = ComponentManager


/***/ },
/* 16 */
/***/ function(module, exports) {

	'use strict'
	
	var raf = window.requestAnimationFrame ||
	          window.webkitRequestAnimationFrame ||
	          function (calllback) {
	            setTimeout(calllback, 16)
	          }
	
	var rafId
	var observers = []
	var paused = false
	
	var FrameUpdater = {
	  start: function () {
	    if (rafId) {
	      return
	    }
	
	    rafId = raf(function runLoop() {
	      if (!paused) {
	        for (var i = 0; i < observers.length; i++) {
	          observers[i]()
	        }
	        raf(runLoop)
	      }
	    })
	  },
	
	  isActive: function () {
	    return !paused
	  },
	
	  pause: function () {
	    paused = true
	    rafId = undefined
	  },
	
	  resume: function () {
	    paused = false
	    this.start()
	  },
	
	  addUpdateObserver: function (observeMethod) {
	    observers.push(observeMethod)
	  }
	}
	
	module.exports = FrameUpdater


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var utils = __webpack_require__(13)
	
	var componentsInScroller = []
	var componentsOutOfScroller = []
	var listened = false
	var direction = 'up'
	var scrollY = 0
	
	var AppearWatcher = {
	  watchIfNeeded: function (component) {
	    if (needWatch(component)) {
	      if (component.isInScrollable()) {
	        componentsInScroller.push(component)
	      } else {
	        componentsOutOfScroller.push(component)
	      }
	      if (!listened) {
	        listened = true
	        // var handler = throttle(onScroll, 25)
	        var handler = throttle(onScroll, 100)
	        window.addEventListener('scroll', handler, false)
	      }
	    }
	  }
	}
	
	function needWatch(component) {
	  var events = component.data.event
	  if (events
	      && (events.indexOf('appear') != -1
	        || events.indexOf('disappear') != -1)) {
	    return true
	  }
	  return false
	}
	
	function onScroll(e) {
	  // If the scroll event is dispatched from a scrollable component
	  // implemented through scrollerjs, then the appear/disappear events
	  // should be treated specially by handleScrollerScroll.
	  if (e.originalType === 'scrolling') {
	    handleScrollerScroll(e)
	  } else {
	    handleWindowScroll()
	  }
	}
	
	function handleScrollerScroll(e) {
	  var cmps = componentsInScroller
	  var len = cmps.length
	  direction = e.direction
	  for (var i = 0; i < len; i++) {
	    var component = cmps[i]
	    var appear = isComponentInScrollerAppear(component)
	    if (appear && !component._appear) {
	      component._appear = true
	      fireEvent(component, 'appear')
	    } else if (!appear && component._appear) {
	      component._appear = false
	      fireEvent(component, 'disappear')
	    }
	  }
	}
	
	function handleWindowScroll() {
	  var y = window.scrollY
	  direction = y >= scrollY ? 'up' : 'down'
	  scrollY = y
	
	  var len = componentsOutOfScroller.length
	  if (len === 0) {
	    return
	  }
	  for (var i = 0; i < len; i++) {
	    var component = componentsOutOfScroller[i]
	    var appear = isComponentInWindow(component)
	    if (appear && !component._appear) {
	      component._appear = true
	      fireEvent(component, 'appear')
	    } else if (!appear && component._appear) {
	      component._appear = false
	      fireEvent(component, 'disappear')
	    }
	  }
	}
	
	function isComponentInScrollerAppear(component) {
	  var parentScroller = component._parentScroller
	  var cmpRect = component.node.getBoundingClientRect()
	  if (!isComponentInWindow(component)) {
	    return false
	  }
	  while (parentScroller) {
	    var parentRect = parentScroller.node.getBoundingClientRect()
	    if (!(cmpRect.right > parentRect.left
	        && cmpRect.left < parentRect.right
	        && cmpRect.bottom > parentRect.top
	        && cmpRect.top < parentRect.bottom)) {
	      return false
	    }
	    parentScroller = parentScroller._parentScroller
	  }
	  return true
	}
	
	function isComponentInWindow(component) {
	  var rect = component.node.getBoundingClientRect()
	  return rect.right > 0 && rect.left < window.innerWidth &&
	         rect.bottom > 0 && rect.top < window.innerHeight
	}
	
	function fireEvent(component, type) {
	  var evt = document.createEvent('HTMLEvents')
	  var data = { direction: direction }
	  evt.initEvent(type, false, false)
	  evt.data = data
	  utils.extend(evt, data)
	  component.node.dispatchEvent(evt)
	}
	
	function throttle(func, wait) {
	  var context, args, result
	  var timeout = null
	  var previous = 0
	  var later = function () {
	    previous = Date.now()
	    timeout = null
	    result = func.apply(context, args)
	  }
	  return function () {
	    var now = Date.now()
	    var remaining = wait - (now - previous)
	    context = this
	    args = arguments
	    if (remaining <= 0) {
	      clearTimeout(timeout)
	      timeout = null
	      previous = now
	      result = func.apply(context, args)
	    } else if (!timeout) {
	      timeout = setTimeout(later, remaining)
	    }
	    return result
	  }
	}
	
	module.exports = AppearWatcher

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	__webpack_require__(19)
	
	var lazyloadTimer
	
	var LazyLoad = {
	  makeImageLazy: function (image, src) {
	    image.removeAttribute('img-src')
	    image.removeAttribute('i-lazy-src')
	    image.removeAttribute('src')
	    image.setAttribute('img-src', src)
	    // should replace 'src' with 'img-src'. but for now lib.img.fire is
	    // not working for the situation that the appear event has been
	    // already triggered.
	    // image.setAttribute('src', src)
	    // image.setAttribute('img-src', src)
	    this.fire()
	  },
	
	  // we don't know when all image are appended
	  // just use setTimeout to do delay lazyload
	  //
	  // -- actually everytime we add a element or update styles,
	  // the component manager will call startIfNeed to fire
	  // lazyload once again in the handleAppend function. so there
	  // is no way that any image element can miss it. See source
	  // code in componentMangager.js.
	  startIfNeeded: function (component) {
	    var that = this
	    if (component.data.type === 'image') {
	      if (!lazyloadTimer) {
	        lazyloadTimer = setTimeout(function () {
	          that.fire()
	          clearTimeout(lazyloadTimer)
	          lazyloadTimer = null
	        }, 16)
	      }
	    }
	  },
	
	  loadIfNeeded: function (elementScope) {
	    var notPreProcessed = elementScope.querySelectorAll('[img-src]')
	    var that = this
	    // image elements which have attribute 'i-lazy-src' were elements
	    // that had been preprocessed by lib-img-core, but not loaded yet, and
	    // must be loaded when 'appear' events were fired. It turns out the
	    // 'appear' event was not fired correctly in the css-translate-transition
	    // situation, so 'i-lazy-src' must be checked and lazyload must be
	    // fired manually.
	    var preProcessed = elementScope.querySelectorAll('[i-lazy-src]')
	    if (notPreProcessed.length > 0 || preProcessed.length > 0) {
	      that.fire()
	    }
	  },
	
	  // fire lazyload.
	  fire: function () {
	    lib.img.fire()
	  }
	
	}
	
	module.exports = LazyLoad


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	"undefined"==typeof window&&(window={ctrl:{},lib:{}}),!window.ctrl&&(window.ctrl={}),!window.lib&&(window.lib={}),function(t,i){function e(t,i){i&&("IMG"==t.nodeName.toUpperCase()?t.setAttribute("src",i):t.style.backgroundImage='url("'+i+'")')}function a(){r=i.appear.init({cls:"imgtmp",once:!0,x:o.lazyWidth,y:o.lazyHeight,onAppear:function(t){var i=this;e(i,i.getAttribute("i-lazy-src")),i.removeAttribute("i-lazy-src")}})}__webpack_require__(20);var r,A={},o={dataSrc:"img-src",lazyHeight:0,lazyWidth:0};A.logConfig=function(){console.log("lib-img Config\n",o)},A.fire=function(){r||a();var t="i_"+Date.now()%1e5,i=document.querySelectorAll("["+o.dataSrc+"]");[].forEach.call(i,function(i){"false"==i.dataset.lazy&&"true"!=i.dataset.lazy?e(i,processSrc(i,i.getAttribute(o.dataSrc))):(i.classList.add(t),i.setAttribute("i-lazy-src",i.getAttribute(o.dataSrc))),i.removeAttribute(o.dataSrc)}),r.bind("."+t),r.fire()},A.defaultSrc="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==",i.img=A,module.exports=A}(window,window.lib||(window.lib={}));

/***/ },
/* 20 */
/***/ function(module, exports) {

	"undefined"==typeof window&&(window={ctrl:{},lib:{}}),!window.ctrl&&(window.ctrl={}),!window.lib&&(window.lib={}),function(n,e){function i(){d=w.createEvent("HTMLEvents"),v=w.createEvent("HTMLEvents"),d.initEvent("_appear",!1,!0),v.initEvent("_disappear",!1,!0)}function a(t,n){var e,i,a,s=(Date.now(),0),o=null,r=function(){s=Date.now(),o=null,t.apply(e,i)};return function(){var l=Date.now();e=this,i=arguments;var c=n-(l-s);return 0>=c||c>=n?(clearTimeout(o),o=null,a=t.apply(e,i)):null==o&&(o=setTimeout(r,c)),a}}function s(n,e){var n,i,a,s;if(n)return e||(e={x:0,y:0}),n!=window?(n=n.getBoundingClientRect(),i=n.left,t=n.top,a=n.right,s=n.bottom):(i=0,t=0,a=i+n.innerWidth,s=t+n.innerHeight),{left:i,top:t,right:a+e.x,bottom:s+e.y}}function o(t,n){var e=n.right>t.left&&n.left<t.right,i=n.bottom>t.top&&n.top<t.bottom;return e&&i}function r(t,n){var e="none",i=t.left-n.left,a=t.top-n.top;return 0==a&&(e=0!=i?i>0?"left":"right":"none"),0==i&&(e=0!=a?a>0?"up":"down":"none"),e}function l(t,n){for(var e in n)n.hasOwnProperty(e)&&(t[e]=n[e]);return t}function c(){var t=this,n=a(function(){f.apply(t,arguments)},this.options.wait);this.__handle&&(this.container.removeEventListener("scroll",this.__handle),this.__handle=null),this.__handle=n,this.container.addEventListener("scroll",n,!1),this.container.addEventListener("resize",function(n){f.apply(t,arguments)},!1),this.container.addEventListener("animationEnd",function(){f.apply(t,arguments)},!1),this.container.addEventListener("webkitAnimationEnd",function(){f.apply(t,arguments)},!1),this.container.addEventListener("transitionend",function(){f.apply(t,arguments)},!1)}function p(t){var n=this,e=this.options.container;if("string"==typeof e?this.container=w.querySelector(e):this.container=e,this.container==window)var i=w.querySelectorAll(t);else var i=this.container.querySelectorAll(t);var i=[].slice.call(i,null);return i=i.filter(function(t){return"1"==t.dataset.bind?(delete t._hasAppear,delete t._hasDisAppear,delete t._appear,t.classList.remove(n.options.cls),!1):!0})}function h(t){var n=this;t&&t.length>0&&[].forEach.call(t,function(t){t._eleOffset=s(t),t.classList.remove(n.options.cls),t.dataset.bind=1})}function f(){var t=this.container,n=this.appearWatchElements,e=this.options.onAppear,i=this.options.onDisappear,a=s(t,{x:this.options.x,y:this.options.y}),l=this.options.once,c=arguments[0]||{};n&&n.length>0&&[].forEach.call(n,function(t,n){var p=s(t),h=r(t._eleOffset,p);t._eleOffset=p;var f=o(a,p),u=t._appear,w=t._hasAppear,E=t._hasDisAppear;d.data={direction:h},v.data={direction:h},f&&!u?(l&&!w||!l)&&(e&&e.call(t,c),t.dispatchEvent(d),t._hasAppear=!0,t._appear=!0):!f&&u&&(l&&!E||!l)&&(i&&i.call(t,c),t.dispatchEvent(v),t._hasDisAppear=!0,t._appear=!1)})}function u(t){l(this.options,t||(t={})),this.appearWatchElements=this.appearWatchElements||p.call(this,"."+this.options.cls),h.call(this,this.appearWatchElements),c.call(this)}var d,v,w=document,E=function(){u.apply(this,arguments)},_={instances:[],init:function(t){var n={options:{container:window,wait:100,x:0,y:0,cls:"lib-appear",once:!1,onReset:function(){},onAppear:function(){},onDisappear:function(){}},container:null,appearWatchElements:null,bind:function(t){var n=this.options.cls;if("string"==typeof t){var e=p.call(this,t);[].forEach.call(e,function(t,e){t.classList.contains(n)||t.classList.add(n)})}else{if(1!=t.nodeType||!this.container.contains(t))return this;t.classList.contains(n)||t.classList.add(n)}var i=p.call(this,"."+this.options.cls);return this.appearWatchElements=this.appearWatchElements.concat(i),h.call(this,i),this},reset:function(t){return u.call(this,t),this.appearWatchElements.forEach(function(t){delete t._hasAppear,delete t._hasDisAppear,delete t._appear}),this},fire:function(){this.appearWatchElements||(this.appearWatchElements=[]);var t=p.call(this,"."+this.options.cls);return this.appearWatchElements=this.appearWatchElements.concat(t),h.call(this,t),f.call(this),this}};E.prototype=n;var e=new E(t);return this.instances.push(e),e},fireAll:function(){var t=this.instances;t.forEach(function(t){t.fire()})}};i(),e.appear=_}(window,window.lib||(window.lib={}));

/***/ },
/* 21 */
/***/ function(module, exports) {

	'use strict'
	
	module.exports = {
	
	  /**
	   * config:
	   *   - styles
	   *   - duration [Number] milliseconds(ms)
	   *   - timingFunction [string]
	   *   - dealy [Number] milliseconds(ms)
	   */
	  transitionOnce: function (comp, config, callback) {
	    var styles = config.styles || {}
	    var duration = config.duration || 1000 // ms
	    var timingFunction = config.timingFunction || 'ease'
	    var delay = config.delay || 0  // ms
	    var transitionValue = 'all ' + duration + 'ms '
	        + timingFunction + ' ' + delay + 'ms'
	    var dom = comp.node
	    var transitionEndHandler = function (e) {
	      e.stopPropagation()
	      dom.removeEventListener('webkitTransitionEnd', transitionEndHandler)
	      dom.removeEventListener('transitionend', transitionEndHandler)
	      dom.style.transition = ''
	      dom.style.webkitTransition = ''
	      callback()
	    }
	    dom.style.transition = transitionValue
	    dom.style.webkitTransition = transitionValue
	    dom.addEventListener('webkitTransitionEnd', transitionEndHandler)
	    dom.addEventListener('transitionend', transitionEndHandler)
	    comp.updateStyle(styles)
	  }
	
	}

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var config = __webpack_require__(11)
	var utils = __webpack_require__(13)
	var ComponentManager = __webpack_require__(15)
	var flexbox = __webpack_require__(23)
	var valueFilter = __webpack_require__(24)
	__webpack_require__(25)
	
	function Component(data, nodeType) {
	  this.data = data
	  this.node = this.create(nodeType)
	
	  this.createChildren()
	  this.updateAttrs(this.data.attr)
	  // issue: when add element to a list in lifetime hook 'ready', the
	  // styles is set to the classStyle, not style. This is a issue
	  // that jsframework should do something about.
	  var classStyle = this.data.classStyle
	  classStyle && this.updateStyle(this.data.classStyle)
	  this.updateStyle(this.data.style)
	  this.bindEvents(this.data.event)
	}
	
	Component.prototype = {
	
	  create: function (nodeType) {
	    var node = document.createElement(nodeType || 'div')
	    return node
	  },
	
	  getComponentManager: function () {
	    return ComponentManager.getInstance(this.data.instanceId)
	  },
	
	  getParent: function () {
	    return this.getComponentManager().componentMap[this.parentRef]
	  },
	
	  getParentScroller: function () {
	    if (this.isInScrollable()) {
	      return this._parentScroller
	    }
	    return null
	  },
	
	  getRootScroller: function () {
	    if (this.isInScrollable()) {
	      var scroller = this._parentScroller
	      var parent = scroller._parentScroller
	      while (parent) {
	        scroller = parent
	        parent = scroller._parentScroller
	      }
	      return scroller
	    }
	    return null
	  },
	
	  getRootContainer: function () {
	    var root = this.getComponentManager().weexInstance.getRoot()
	      || document.body
	    return root
	  },
	
	  isScrollable: function () {
	    var t = this.data.type
	    return ComponentManager.getScrollableTypes().indexOf(t) !== -1
	  },
	
	  isInScrollable: function () {
	    if (typeof this._isInScrollable === 'boolean') {
	      return this._isInScrollable
	    }
	    var parent = this.getParent()
	    if (parent
	        && (typeof parent._isInScrollable !== 'boolean')
	        && !parent.isScrollable()) {
	      if (parent.data.ref === '_root') {
	        this._isInScrollable = false
	        return false
	      }
	      this._isInScrollable = parent.isInScrollable()
	      this._parentScroller = parent._parentScroller
	      return this._isInScrollable
	    }
	    if (parent && typeof parent._isInScrollable === 'boolean') {
	      this._isInScrollable = parent._isInScrollable
	      this._parentScroller = parent._parentScroller
	      return this._isInScrollable
	    }
	    if (parent && parent.isScrollable()) {
	      this._isInScrollable = true
	      this._parentScroller = parent
	      return true
	    }
	    if (!parent) {
	      console && console.error('isInScrollable - parent not exist.')
	      return
	    }
	  },
	
	  createChildren: function () {
	    var children = this.data.children
	    var parentRef = this.data.ref
	    var componentManager = this.getComponentManager()
	    if (children && children.length) {
	      var fragment = document.createDocumentFragment()
	      var isFlex = false
	      for (var i = 0; i < children.length; i++) {
	        children[i].instanceId = this.data.instanceId
	        children[i].scale = this.data.scale
	        var child = componentManager.createElement(children[i])
	        fragment.appendChild(child.node)
	        child.parentRef = parentRef
	        if (!isFlex
	            && child.data.style
	            && child.data.style.hasOwnProperty('flex')
	          ) {
	          isFlex = true
	        }
	      }
	      this.node.appendChild(fragment)
	    }
	  },
	
	  // @todo: changed param data to child
	  appendChild: function (data) {
	    var children = this.data.children
	    var componentManager = this.getComponentManager()
	    var child = componentManager.createElement(data)
	    this.node.appendChild(child.node)
	    // update this.data.children
	    if (!children || !children.length) {
	      this.data.children = [data]
	    } else {
	      children.push(data)
	    }
	
	    return child
	  },
	
	  insertBefore: function (child, before) {
	    var children = this.data.children
	    var i = 0
	    var l
	    var isAppend = false
	
	    // update this.data.children
	    if (!children || !children.length || !before) {
	      isAppend = true
	    } else {
	      for (l = children.length; i < l; i++) {
	        if (children[i].ref === before.data.ref) {
	          break
	        }
	      }
	      if (i === l) {
	        isAppend = true
	      }
	    }
	
	    if (isAppend) {
	      this.node.appendChild(child.node)
	      children.push(child.data)
	    } else {
	      if (before.fixedPlaceholder) {
	        this.node.insertBefore(child.node, before.fixedPlaceholder)
	      } else {
	        this.node.insertBefore(child.node, before.node)
	      }
	      children.splice(i, 0, child.data)
	    }
	
	  },
	
	  removeChild: function (child) {
	    var children = this.data.children
	    // remove from this.data.children
	    var i = 0
	    var componentManager = this.getComponentManager()
	    if (children && children.length) {
	      for (var l = children.length; i < l; i++) {
	        if (children[i].ref === child.data.ref) {
	          break
	        }
	      }
	      if (i < l) {
	        children.splice(i, 1)
	      }
	    }
	    // remove from componentMap recursively
	    componentManager.removeElementByRef(child.data.ref)
	    if (child.fixedPlaceholder) {
	      this.node.removeChild(child.fixedPlaceholder)
	    }
	    child.node.parentNode.removeChild(child.node)
	  },
	
	  updateAttrs: function (attrs) {
	    // Note：attr must be injected into the dom element because
	    // it will be accessed from the outside developer by event.target.attr.
	    if (!this.node.attr) {
	      this.node.attr = {}
	    }
	    for (var key in attrs) {
	      var value = attrs[key]
	      var attrSetter = this.attr[key]
	      if (typeof attrSetter === 'function') {
	        attrSetter.call(this, value)
	      } else {
	        if (typeof value === 'boolean') {
	          this.node[key] = value
	        } else {
	          this.node.setAttribute(key, value)
	        }
	        this.node.attr[key] = value
	      }
	    }
	  },
	
	  updateStyle: function (style) {
	
	    for (var key in style) {
	      var value = style[key]
	      var styleSetter = this.style[key]
	      if (typeof styleSetter === 'function') {
	        styleSetter.call(this, value)
	        continue
	      }
	      var parser = valueFilter.getFilters(key,
	          { scale: this.data.scale })[typeof value]
	      if (typeof parser === 'function') {
	        value = parser(value)
	      }
	      this.node.style[key] = value
	    }
	  },
	
	  bindEvents: function (evts) {
	    var componentManager = this.getComponentManager()
	    if (evts
	        && Object.prototype.toString.call(evts).slice(8, -1) === 'Array'
	      ) {
	      for (var i = 0, l = evts.length; i < l; i++) {
	        componentManager.addEvent(this, evts[i])
	      }
	    }
	  },
	
	  // dispatch a specified event on this.node
	  //  - type: event type
	  //  - data: event data
	  //  - config: event config object
	  //     - bubbles
	  //     - cancelable
	  dispatchEvent: function (type, data, config) {
	    var event = document.createEvent('HTMLEvents')
	    config = config || {}
	    event.initEvent(type, config.bubbles || false, config.cancelable || false)
	    !data && (data = {})
	    event.data = utils.extend({}, data)
	    utils.extend(event, data)
	    this.node.dispatchEvent(event)
	  },
	
	  updateRecursiveAttr: function (data) {
	    this.updateAttrs(data.attr)
	    var componentManager = this.getComponentManager()
	    var children = this.data.children
	    if (children) {
	      for (var i = 0; i < children.length; i++) {
	        var child = componentManager.getElementByRef(children[i].ref)
	        if (child) {
	          child.updateRecursiveAttr(data.children[i])
	        }
	      }
	    }
	  },
	
	  updateRecursiveStyle: function (data) {
	    this.updateStyle(data.style)
	    var componentManager = this.getComponentManager()
	    var children = this.data.children
	    if (children) {
	      for (var i = 0; i < children.length; i++) {
	        var child = componentManager.getElementByRef(children[i].ref)
	        if (child) {
	          child.updateRecursiveStyle(data.children[i])
	        }
	      }
	    }
	  },
	
	  updateRecursiveAll: function (data) {
	    this.updateAttrs(data.attr)
	    this.updateStyle(data.style)
	    var componentManager = this.getComponentManager()
	
	    // var oldRef = this.data.ref
	    // if (componentMap[oldRef]) {
	    //   delete componentMap[oldRef]
	    // }
	    // this.data.ref = data.ref
	    // componentMap[data.ref] = this
	
	    var children = this.data.children
	    if (children) {
	      for (var i = 0; i < children.length; i++) {
	        var child = componentManager.getElementByRef(children[i].ref)
	        if (child) {
	          child.updateRecursiveAll(data.children[i])
	        }
	      }
	    }
	  },
	
	  attr: {}, // attr setters
	
	  style: Object.create(flexbox), // style setters
	
	  clearAttr: function () {
	  },
	
	  clearStyle: function () {
	    this.node.cssText = ''
	  }
	}
	
	Component.prototype.style.position = function (value) {
	
	  // For the elements who are fixed elements before, now
	  // are not fixed: the fixedPlaceholder has to be replaced
	  // by this element.
	  // This is a peace of hacking to fix the problem about
	  // mixing fixed and transform. See 'http://stackoverflo
	  // w.com/questions/15194313/webkit-css-transform3d-posi
	  // tion-fixed-issue' for more info.
	  if (value !== 'fixed') {
	    if (this.fixedPlaceholder) {
	      var parent = this.fixedPlaceholder.parentNode
	      parent.insertBefore(this.node, this.fixedPlaceholder)
	      parent.removeChild(this.fixedPlaceholder)
	      this.fixedPlaceholder = null
	    }
	  } else { // value === 'fixed'
	    // For the elements who are fixed: this fixedPlaceholder
	    // shoud be inserted, and the fixed element itself should
	    // be placed out in root container.
	    this.node.style.position = 'fixed'
	    var parent = this.node.parentNode
	    var replaceWithFixedPlaceholder = function () {
	      this.fixedPlaceholder = document.createElement('div')
	      this.fixedPlaceholder.classList.add('weex-fixed-placeholder')
	      this.fixedPlaceholder.style.display = 'none'
	      this.fixedPlaceholder.style.width = '0px'
	      this.fixedPlaceholder.style.height = '0px'
	      parent.insertBefore(this.fixedPlaceholder, this.node)
	      this.getRootContainer().appendChild(this.node)
	    }.bind(this)
	    if (!parent) {
	      if (this.onAppend) {
	        var pre = this.onAppend.bind(this)
	      }
	      this.onAppend = function () {
	        parent = this.node.parentNode
	        replaceWithFixedPlaceholder()
	        pre && pre()
	      }.bind(this)
	    } else {
	      replaceWithFixedPlaceholder()
	    }
	    return
	  }
	
	  if (value === 'sticky') {
	    this.node.style.zIndex = 100
	    setTimeout(function () {
	      this.sticky = new lib.sticky(this.node, {
	        top: 0
	      })
	    }.bind(this), 0)
	  } else {
	    this.node.style.position = value
	  }
	}
	
	module.exports = Component
	
	
	


/***/ },
/* 23 */
/***/ function(module, exports) {

	'use strict'
	
	// Flexbox polyfill
	var flexboxSetters = (function () {
	  var BOX_ALIGN = {
	    stretch: 'stretch',
	    'flex-start': 'start',
	    'flex-end': 'end',
	    center: 'center'
	  }
	  var BOX_ORIENT = {
	    row: 'horizontal',
	    column: 'vertical'
	  }
	  var BOX_PACK = {
	    'flex-start': 'start',
	    'flex-end': 'end',
	    center: 'center',
	    'space-between': 'justify',
	    'space-around': 'justify' // Just same as `space-between`
	  }
	  return {
	    flex: function (value) {
	      this.node.style.webkitBoxFlex = value
	      this.node.style.webkitFlex = value
	      this.node.style.flex = value
	    },
	    alignItems: function (value) {
	      this.node.style.webkitBoxAlign = BOX_ALIGN[value]
	      this.node.style.webkitAlignItems = value
	      this.node.style.alignItems = value
	    },
	    alignSelf: function (value) {
	      this.node.style.webkitAlignSelf = value
	      this.node.style.alignSelf = value
	    },
	    flexDirection: function (value) {
	      this.node.style.webkitBoxOrient = BOX_ORIENT[value]
	      this.node.style.webkitFlexDirection = value
	      this.node.style.flexDirection = value
	    },
	    justifyContent: function (value) {
	      this.node.style.webkitBoxPack = BOX_PACK[value]
	      this.node.style.webkitJustifyContent = value
	      this.node.style.justifyContent = value
	    }
	  }
	})()
	
	module.exports = flexboxSetters


/***/ },
/* 24 */
/***/ function(module, exports) {

	'use strict'
	
	var NOT_PX_NUMBER_PROPERTIES = ['flex', 'opacity', 'zIndex', 'fontWeight']
	
	var valueFilter = {
	
	  filterStyles: function (styles, config) {
	    for (var key in styles) {
	      var value = styles[key]
	      var parser = this.getFilters(key, config)[typeof value]
	      if (typeof parser === 'function') {
	        styles[key] = parser(value)
	      }
	    }
	  },
	
	  getFilters: function (key, config) {
	
	    if (NOT_PX_NUMBER_PROPERTIES.indexOf(key) !== -1) {
	      return {}
	    }
	    return {
	      number: function (val) {
	        return val * config.scale + 'px'
	      },
	      string: function (val) {
	        // string of a pure number or a number suffixed with a 'px' unit
	        if (val.match(/^\-?\d*\.?\d+(?:px)?$/)) {
	          return parseFloat(val) * config.scale + 'px'
	        }
	        if (key.match(/transform/) && val.match(/translate/)) {
	          return val.replace(/\d*\.?\d+px/g, function (match) {
	            return parseInt(parseFloat(match) * config.scale) + 'px'
	          })
	        }
	        return val
	      }
	    }
	  }
	}
	
	module.exports = valueFilter


/***/ },
/* 25 */
/***/ function(module, exports) {

	(typeof window === 'undefined') && (window = {ctrl: {}, lib: {}});!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});!function(a,b,c){function d(a){return null!=a&&"object"==typeof a&&Object.getPrototypeOf(a)==Object.prototype}function e(a,b){var c,d,e,f=null,g=0,h=function(){g=Date.now(),f=null,e=a.apply(c,d)};return function(){var i=Date.now(),j=b-(i-g);return c=this,d=arguments,0>=j?(clearTimeout(f),f=null,g=i,e=a.apply(c,d)):f||(f=setTimeout(h,j)),e}}function f(a){var b="";return Object.keys(a).forEach(function(c){b+=c+":"+a[c]+";"}),b}function g(a,c){!c&&d(a)&&(c=a,a=c.element),c=c||{},a.nodeType!=b.ELEMENT_NODE&&"string"==typeof a&&(a=b.querySelector(a));var e=this;e.element=a,e.top=c.top||0,e.withinParent=void 0==c.withinParent?!1:c.withinParent,e.init()}var h=a.parseInt,i=navigator.userAgent,j=!!i.match(/Firefox/i),k=!!i.match(/IEMobile/i),l=j?"-moz-":k?"-ms-":"-webkit-",m=j?"Moz":k?"ms":"webkit",n=function(){var a=b.createElement("div"),c=a.style;return c.cssText="position:"+l+"sticky;position:sticky;",-1!=c.position.indexOf("sticky")}();g.prototype={constructor:g,init:function(){var a=this,b=a.element,c=b.style;c[m+"Transform"]="translateZ(0)",c.transform="translateZ(0)",a._originCssText=c.cssText,n?(c.position=l+"sticky",c.position="sticky",c.top=a.top+"px"):(a._simulateSticky(),a._bindResize())},_bindResize:function(){var b=this,c=/android/gi.test(navigator.appVersion),d=b._resizeEvent="onorientationchange"in a?"orientationchange":"resize",e=b._resizeHandler=function(){setTimeout(function(){b.refresh()},c?200:0)};a.addEventListener(d,e,!1)},refresh:function(){var a=this;n||(a._detach(),a._simulateSticky())},_addPlaceholder:function(a){var c,d=this,e=d.element,g=a.position;if(-1!=["static","relative"].indexOf(g)){c=d._placeholderElement=b.createElement("div");var i=h(a.width)+h(a.marginLeft)+h(a.marginRight),j=h(a.height);"border-box"!=a.boxSizing&&(i+=h(a.borderLeftWidth)+h(a.borderRightWidth)+h(a.paddingLeft)+h(a.paddingRight),j+=h(a.borderTopWidth)+h(a.borderBottomWidth)+h(a.paddingTop)+h(a.paddingBottom)),c.style.cssText=f({display:"none",visibility:"hidden",width:i+"px",height:j+"px",margin:0,"margin-top":a.marginTop,"margin-bottom":a.marginBottom,border:0,padding:0,"float":a["float"]||a.cssFloat}),e.parentNode.insertBefore(c,e)}return c},_simulateSticky:function(){var c=this,d=c.element,g=c.top,i=d.style,j=d.getBoundingClientRect(),k=getComputedStyle(d,""),l=d.parentNode,m=getComputedStyle(l,""),n=c._addPlaceholder(k),o=c.withinParent,p=c._originCssText,q=j.top-g+a.pageYOffset,r=l.getBoundingClientRect().bottom-h(m.paddingBottom)-h(m.borderBottomWidth)-h(k.marginBottom)-j.height-g+a.pageYOffset,s=p+f({position:"fixed",top:g+"px",width:k.width,"margin-top":0}),t=p+f({position:"absolute",top:r+"px",width:k.width}),u=1,v=c._scrollHandler=e(function(){var b=a.pageYOffset;q>b?1!=u&&(i.cssText=p,n&&(n.style.display="none"),u=1):!o&&b>=q||o&&b>=q&&r>b?2!=u&&(i.cssText=s,n&&3!=u&&(n.style.display="block"),u=2):o&&3!=u&&(i.cssText=t,n&&2!=u&&(n.style.display="block"),u=3)},100);if(a.addEventListener("scroll",v,!1),a.pageYOffset>=q){var w=b.createEvent("HTMLEvents");w.initEvent("scroll",!0,!0),a.dispatchEvent(w)}},_detach:function(){var b=this,c=b.element;if(c.style.cssText=b._originCssText,!n){var d=b._placeholderElement;d&&c.parentNode.removeChild(d),a.removeEventListener("scroll",b._scrollHandler,!1)}},destroy:function(){var b=this;b._detach();var c=b.element.style;c.removeProperty(l+"transform"),c.removeProperty("transform"),n||a.removeEventListener(b._resizeEvent,b._resizeHandler,!1)}},c.sticky=g}(window,document,window.lib||(window.lib={}));;module.exports = window.lib['sticky'];

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var utils = __webpack_require__(13)
	
	var _senderMap = {}
	
	function Sender(instance) {
	  if (!(this instanceof Sender)) {
	    return new Sender(instance)
	  }
	  this.instanceId = instance.instanceId
	  this.weexInstance = instance
	  _senderMap[this.instanceId] = this
	}
	
	function _send(instanceId, msg) {
	  callJS(instanceId, [msg])
	}
	
	Sender.getSender = function (instanceId) {
	  return _senderMap[instanceId]
	}
	
	Sender.prototype = {
	
	  // perform a callback to jsframework.
	  performCallback: function (callbackId, data, keepAlive) {
	    var args = [callbackId]
	    data && args.push(data)
	    keepAlive && args.push(keepAlive)
	    _send(this.instanceId, {
	      method: 'callback',
	      args: args
	    })
	  },
	
	  fireEvent: function (ref, type, event) {
	    if (event._alreadyFired) {
	      // stop bubbling up in virtual dom tree.
	      return
	    }
	    // do not prevent default, otherwise the touchstart
	    // event will no longer trigger a click event
	    event._alreadyFired = true
	    var evt = utils.extend({}, event)
	    // The event.target must be the standard event's currentTarget.
	    evt.target = evt.currentTarget
	    evt.value = event.target.value
	    evt.timestamp = Date.now()
	    _send(this.instanceId, {
	      method: 'fireEvent',
	      args: [ref, type, evt]
	    })
	  }
	
	}
	
	module.exports = Sender

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict'
	
	var config = __webpack_require__(11)
	var protocol = __webpack_require__(14)
	var utils = __webpack_require__(13)
	var FrameUpdater = __webpack_require__(16)
	var Sender = __webpack_require__(26)
	
	var callQueue = []
	// Need a task counter?
	// When FrameUpdater is not activated, tasks will not be push
	// into callQueue and there will be no trace for situation of
	// execution of tasks.
	
	// give 10ms for call handling, and rest 6ms for others
	var MAX_TIME_FOR_EACH_FRAME = 10
	
	// callNative: jsFramework will call this method to talk to
	// this renderer.
	// params:
	//  - instanceId: string.
	//  - tasks: array of object.
	//  - callbackId: number.
	function callNative(instanceId, tasks, callbackId) {
	  var calls = []
	  if (typeof tasks === 'string') {
	    try {
	      calls = JSON.parse(tasks)
	    } catch (e) {
	      console.error('invalid tasks:', tasks)
	    }
	  } else if (Object.prototype.toString.call(tasks).slice(8, -1) === 'Array') {
	    calls = tasks
	  }
	  var len = calls.length
	  calls[len - 1].callbackId = (!callbackId && callbackId !== 0)
	                              ? -1
	                              : callbackId
	  // To solve the problem of callapp, the two-way time loop rule must
	  // be replaced by calling directly except the situation of page loading.
	  // 2015-11-03
	  for (var i = 0; i < len; i++) {
	    if (FrameUpdater.isActive()) {
	      callQueue.push({
	        instanceId: instanceId,
	        call: calls[i]
	      })
	    }
	    else {
	      processCall(instanceId, calls[i])
	    }
	  }
	
	}
	
	function processCallQueue() {
	  var len = callQueue.length
	  if (len === 0) {
	    return
	  }
	  var start = Date.now()
	  var elapsed = 0
	
	  while (--len >= 0 && elapsed < MAX_TIME_FOR_EACH_FRAME) {
	    var callObj = callQueue.shift()
	    processCall(callObj.instanceId, callObj.call)
	    elapsed = Date.now() - start
	  }
	}
	
	function processCall(instanceId, call) {
	  var moduleName = call.module
	  var methodName = call.method
	  var module, method
	  var args = call.args || call.arguments || []
	
	  if (!(module = protocol.apiModule[moduleName])) {
	    return
	  }
	  if (!(method = module[methodName])) {
	    return
	  }
	
	  method.apply(protocol.getWeexInstance(instanceId), args)
	
	  var callbackId = call.callbackId
	  if ((callbackId
	    || callbackId === 0
	    || callbackId === '0')
	    && callbackId !== '-1'
	    && callbackId !== -1) {
	    performNextTick(instanceId, callbackId)
	  }
	}
	
	function performNextTick(instanceId, callbackId) {
	  Sender.getSender(instanceId).performCallback(callbackId)
	}
	
	function nativeLog() {
	  if (config.debug) {
	    if (arguments[0].match(/^perf/)) {
	      console.info.apply(console, arguments)
	      return
	    }
	    console.debug.apply(console, arguments)
	  }
	}
	
	function exportsBridgeMethodsToGlobal() {
	  global.callNative = callNative
	  global.nativeLog = nativeLog
	}
	
	module.exports = {
	
	  init: function () {
	
	    // process callQueue every 16 milliseconds.
	    FrameUpdater.addUpdateObserver(processCallQueue)
	    FrameUpdater.start()
	
	    // exports methods to global(window).
	    exportsBridgeMethodsToGlobal()
	  }
	
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var RootComponent = __webpack_require__(29)
	var Container = __webpack_require__(31)
	var Image = __webpack_require__(34)
	var Text = __webpack_require__(38)
	var Vlist = __webpack_require__(39)
	var Hlist = __webpack_require__(45)
	var Countdown = __webpack_require__(46)
	var Marquee = __webpack_require__(48)
	var Slider = __webpack_require__(49)
	var Indicator = __webpack_require__(56)
	var Tabheader = __webpack_require__(59)
	var Scroller = __webpack_require__(63)
	var Input = __webpack_require__(66)
	var Select = __webpack_require__(67)
	var Datepicker = __webpack_require__(68)
	var Timepicker = __webpack_require__(69)
	var Video = __webpack_require__(70)
	var Switch = __webpack_require__(73)
	var A = __webpack_require__(76)
	var Embed = __webpack_require__(77)
	var Refresh = __webpack_require__(78)
	var Loading = __webpack_require__(81)
	var Spinner = __webpack_require__(84)
	var Web = __webpack_require__(87)
	
	var components = {
	  init: function (Weex) {
	    Weex.registerComponent('root', RootComponent)
	    Weex.registerComponent('container', Container)
	    Weex.registerComponent('div', Container)
	    Weex.registerComponent('image', Image)
	    Weex.registerComponent('text', Text)
	    Weex.registerComponent('list', Vlist)
	    Weex.registerComponent('vlist', Vlist)
	    Weex.registerComponent('hlist', Hlist)
	    Weex.registerComponent('countdown', Countdown)
	    Weex.registerComponent('marquee', Marquee)
	    Weex.registerComponent('slider', Slider)
	    Weex.registerComponent('indicator', Indicator)
	    Weex.registerComponent('tabheader', Tabheader)
	    Weex.registerComponent('scroller', Scroller)
	    Weex.registerComponent('input', Input)
	    Weex.registerComponent('select', Select)
	    Weex.registerComponent('datepicker', Datepicker)
	    Weex.registerComponent('timepicker', Timepicker)
	    Weex.registerComponent('video', Video)
	    Weex.registerComponent('switch', Switch)
	    Weex.registerComponent('a', A)
	    Weex.registerComponent('embed', Embed)
	    Weex.registerComponent('refresh', Refresh)
	    Weex.registerComponent('loading', Loading)
	    Weex.registerComponent('spinner', Spinner)
	    Weex.registerComponent('loading-indicator', Spinner)
	    Weex.registerComponent('web', Web)
	  }
	}
	
	module.exports = components


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var ComponentManager = __webpack_require__(15)
	var Component = __webpack_require__(22)
	var utils = __webpack_require__(13)
	var logger = __webpack_require__(30)
	
	var rootCandidates = ['div', 'list', 'vlist', 'scroller']
	
	function RootComponent(data, nodeType) {
	  var id = data.rootId + '-root'
	  var componentManager = ComponentManager.getInstance(data.instanceId)
	
	  // If nodeType is in the downgrades map, just ignore it and
	  // replace it with a div component.
	  var downgrades = componentManager.weexInstance.downgrades
	  this.data = data
	
	  // In some situation the root component should be implemented as
	  // its own type, otherwise it has to be a div component as a root.
	  if (!nodeType) {
	    nodeType = 'div'
	  } else if (rootCandidates.indexOf(nodeType) === -1) {
	    logger.warn('the root component type \'' + nodeType + '\' is not one of '
	      + 'the types in [' + rootCandidates + '] list. It is auto downgraded '
	      + 'to \'div\'.')
	    nodeType = 'div'
	  } else if (downgrades[nodeType]) {
	    logger.warn('Thanks to the downgrade flags for ['
	      + Object.keys(downgrades)
	      + '], the root component type \'' + nodeType
	      + '\' is auto downgraded to \'div\'.')
	    nodeType = 'div'
	  } else {
	    // If the root component is not a embed element in a webpage, then
	    // the html and body height should be fixed to the max height
	    // of viewport.
	    if (!componentManager.weexInstance.embed) {
	      window.addEventListener('renderend', function () {
	        this.detectRootHeight()
	      }.bind(this))
	    }
	    if (nodeType !== 'div') {
	      logger.warn('the root component type \'' + nodeType + '\' may have '
	        + 'some performance issue on some of the android devices when there '
	        + 'is a huge amount of dom elements. Try to add downgrade '
	        + 'flags by adding param \'downgrade_' + nodeType + '=true\' in the '
	        + 'url or setting downgrade config to a array contains \'' + nodeType
	        + '\' in the \'weex.init\' function. This will downgrade the root \''
	        + nodeType + '\' to a \'div\', and may elevate the level of '
	        + 'performance, although it has some other issues.')
	    }
	    !this.data.style.height && (this.data.style.height = '100%')
	  }
	
	  data.type = nodeType
	  var cmp = componentManager.createElement(data)
	  cmp.node.id = id
	  return cmp
	}
	
	RootComponent.prototype = Object.create(Component.prototype)
	
	RootComponent.prototype.detectRootHeight = function () {
	  var rootQuery = '#' + this.getComponentManager().weexInstance.rootId
	  var rootContainer = document.querySelector(rootQuery) || document.body
	  var height = rootContainer.getBoundingClientRect().height
	  if (height > window.innerHeight) {
	    logger.warn([
	      'for scrollable root like \'list\' and \'scroller\', the height of ',
	      'the root container must be a user-specified value. Otherwise ',
	      'the scrollable element may not be able to work correctly. ',
	      'Current height of the root element \'' + rootQuery + '\' is ',
	      height + 'px, and mostly its height should be less than the ',
	      'viewport\'s height ' + window.innerHeight + 'px. Please ',
	      'make sure the height is correct.'
	      ].join(''))
	  }
	}
	
	module.exports = RootComponent


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var config = __webpack_require__(11)
	var utils = __webpack_require__(13)
	
	var _initialized = false
	
	var logger = {
	  log: function () {},
	  warn: function () {},
	  error: function () {}
	}
	
	function hijack(k) {
	  if (utils.isArray(k)) {
	    k.forEach(function (key) {
	      hijack(key)
	    })
	  } else {
	    if (console[k]) {
	      logger[k] = function () {
	        console[k].apply(
	          console,
	          ['[h5-render]'].concat(Array.prototype.slice.call(arguments, 0))
	        )
	      }
	    }
	  }
	}
	
	logger.init = function () {
	  if (_initialized) {
	    return
	  }
	  _initialized = true
	  if (config.debug && console) {
	    hijack(['log', 'warn', 'error'])
	  }
	}
	
	module.exports = logger

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	__webpack_require__(32)
	
	var Component = __webpack_require__(22)
	
	function Container (data, nodeType) {
	  Component.call(this, data, nodeType)
	  this.node.classList.add('weex-container')
	}
	
	Container.prototype = Object.create(Component.prototype)
	
	module.exports = Container


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(33);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./container.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./container.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-container {\n  box-sizing: border-box;\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-flex-direction: column;\n  flex-direction: column;\n  position: relative;\n  border: 0 solid black;\n  margin: 0;\n  padding: 0;\n}\n\n.weex-element {\n  box-sizing: border-box;\n  position: relative;\n}\n", ""]);
	
	// exports


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(35)
	var LazyLoad = __webpack_require__(18)
	var config = __webpack_require__(11)
	var utils = __webpack_require__(13)
	
	__webpack_require__(36)
	
	var DEFAULT_SIZE = 200
	var RESIZE_MODES = ['stretch', 'cover', 'contain']
	var DEFAULT_RESIZE_MODE = 'stretch'
	
	/**
	 * resize: 'cover' | 'contain' | 'stretch', default is 'stretch'
	 * src: url
	 */
	
	function Image (data) {
	  this.resize = DEFAULT_RESIZE_MODE
	  Atomic.call(this, data)
	}
	
	Image.prototype = Object.create(Atomic.prototype)
	
	Image.prototype.create = function () {
	  var node = document.createElement('div')
	  node.classList.add('weex-img')
	  return node
	}
	
	Image.prototype.attr = {
	  src: function (val) {
	    if (!this.src) {
	      this.src = lib.img.defaultSrc
	      this.node.style.backgroundImage = 'url(' + this.src + ')'
	    }
	    LazyLoad.makeImageLazy(this.node, val)
	  },
	
	  resize: function (val) {
	    if (RESIZE_MODES.indexOf(val) === -1) {
	      val = 'stretch'
	    }
	    this.node.style.backgroundSize = val === 'stretch'
	                                    ? '100% 100%'
	                                    : val
	  }
	}
	
	Image.prototype.style = utils.extend(Object.create(Atomic.prototype.style), {
	  width: function (val) {
	    val = parseFloat(val) * this.data.scale
	    if (val < 0 || val !== val) {
	      val = DEFAULT_SIZE
	    }
	    this.node.style.width = val + 'px'
	  },
	
	  height: function (val) {
	    val = parseFloat(val) * this.data.scale
	    if (val < 0 || val !== val) {
	      val = DEFAULT_SIZE
	    }
	    this.node.style.height = val + 'px'
	  }
	})
	
	Image.prototype.clearAttr = function () {
	  this.src = ''
	  this.node.style.backgroundImage = ''
	}
	
	module.exports = Image


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Component = __webpack_require__(22)
	
	// Component which can have no subcomponents.
	// This component should not be instantiated directly, since
	// it is designed to be used as a base class to extend from.
	function Atomic (data) {
	  Component.call(this, data)
	}
	
	Atomic.prototype = Object.create(Component.prototype)
	
	Atomic.prototype.appendChild = function (data) {
	  // do nothing
	  return
	}
	
	Atomic.prototype.insertBefore = function (child, before) {
	  // do nothing
	  return
	}
	
	Atomic.prototype.removeChild = function (child) {
	  // do nothing
	  return
	}
	
	module.exports = Atomic


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(37);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./image.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./image.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-img {\n\tbox-sizing: border-box;\n  position: relative;\n  background-repeat: no-repeat;\n  background-size: 100% 100%;\n  background-position: 50%;\n  border: 0 solid black;\n}", ""]);
	
	// exports


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(22)
	var utils = __webpack_require__(13)
	
	var DEFAULT_FONT_SIZE = 32
	var DEFAULT_TEXT_OVERFLOW = 'ellipsis'
	
	// attr
	//  - value: text content.
	//  - lines: maximum lines of the text.
	function Text (data) {
	  Atomic.call(this, data)
	}
	
	Text.prototype = Object.create(Atomic.prototype)
	
	Text.prototype.create = function () {
	  var node = document.createElement('div')
	  node.classList.add('weex-container')
	  node.style.fontSize = DEFAULT_FONT_SIZE * this.data.scale + 'px'
	  this.textNode = document.createElement('span')
	  // Give the developers the ability to control space
	  // and line-breakers.
	  this.textNode.style.whiteSpace = 'pre-wrap'
	  this.textNode.style.wordWrap = 'break-word'
	  this.textNode.style.display = '-webkit-box'
	  this.textNode.style.webkitBoxOrient = 'vertical'
	  this.style.lines.call(this, this.data.style.lines)
	  node.appendChild(this.textNode)
	  return node
	}
	
	Text.prototype.attr = {
	  value: function (value) {
	    var span = this.node.firstChild
	    span.innerHTML = ''
	    if (value == null || value === '') {
	      return
	    }
	    span.textContent = value
	    /**
	     * Developers are supposed to have the ability to break text
	     * lines manually. Using ``&nbsp;`` to replace text space is
	     * not compatible with the ``-webkit-line-clamp``. Therefor
	     * we use ``white-space: no-wrap`` instead (instead of the
	     * code bellow).
	
	      var frag = document.createDocumentFragment()
	        text.split(' ').forEach(function(str) {
	          var textNode = document.createTextNode(str)
	          var space = document.createElement('i')
	          space.innerHTML = '&nbsp;'
	          frag.appendChild(space)
	          frag.appendChild(textNode)
	        })
	        frag.removeChild(frag.firstChild)
	        span.appendChild(document.createElement('br'))
	        span.appendChild(frag)
	      })
	      span.removeChild(span.firstChild)
	     */
	  }
	}
	
	Text.prototype.clearAttr = function () {
	  this.node.firstChild.textContent = ''
	}
	
	Text.prototype.style = utils.extend(Object.create(Atomic.prototype.style), {
	
	  lines: function (val) {
	    val = parseInt(val)
	    if (val !== val) { // NaN
	      return
	    }
	    if (val <= 0) {
	      this.textNode.style.textOverflow = ''
	      this.textNode.style.overflow = 'visible'
	      this.textNode.style.webkitLineClamp = ''
	    } else {
	      var style = this.data ? this.data.style : null
	      this.textNode.style.overflow = 'hidden'
	      this.textNode.style.textOverflow = style
	        ? style.textOverflow
	        : DEFAULT_TEXT_OVERFLOW
	      this.textNode.style.webkitLineClamp = val
	    }
	  },
	
	  textOverflow: function (val) {
	    this.textNode.style.textOverflow = val
	  }
	
	})
	
	module.exports = Text


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	var List = __webpack_require__(40)
	
	function Vlist(data, nodeType) {
	  data.attr.direction = 'v'
	  List.call(this, data, nodeType)
	}
	
	Vlist.prototype = Object.create(List.prototype)
	
	module.exports = Vlist

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	__webpack_require__(41)
	__webpack_require__(43)
	
	var Component = __webpack_require__(22)
	var LazyLoad = __webpack_require__(18)
	
	var DEFAULT_LOAD_MORE_OFFSET = 500
	
	var directionMap = {
	  h: ['row', 'horizontal', 'h', 'x'],
	  v: ['column', 'vertical', 'v', 'y']
	}
	
	// direction: 'v' or 'h', default is 'v'
	function List(data, nodeType) {
	  // this.loadmoreOffset = Number(data.attr.loadmoreoffset)
	  // this.isAvailableToFireloadmore = true
	  this.direction = directionMap.h.indexOf(data.attr.direction) === -1
	    ? 'v'
	    : 'h'
	  Component.call(this, data, nodeType)
	}
	
	List.prototype = Object.create(Component.prototype)
	
	List.prototype.create = function (nodeType) {
	  var Scroll = lib.scroll
	  var node = Component.prototype.create.call(this, nodeType)
	  node.classList.add('weex-container', 'list-wrap')
	  this.listElement = document.createElement('div')
	  this.listElement.classList.add(
	    'weex-container'
	    , 'list-element'
	    , this.direction + '-list'
	  )
	
	  // Flex will cause a bug to rescale children's size if their total
	  // size exceed the limit of their parent. So to use box instead.
	  this.listElement.style.display = '-webkit-box'
	  this.listElement.style.display = 'box'
	  this.listElement.style.webkitBoxOrient = this.direction === 'h'
	    ? 'horizontal'
	    : 'vertical'
	  this.listElement.style.boxOrient = this.listElement.style.webkitBoxOrient
	
	  node.appendChild(this.listElement)
	  this.scroller = new Scroll({
	    scrollElement: this.listElement
	    , direction: this.direction === 'h' ? 'x' : 'y'
	  })
	  this.scroller.init()
	  this.offset = 0
	  return node
	}
	
	List.prototype.bindEvents = function (evts) {
	  Component.prototype.bindEvents.call(this, evts)
	  // to enable lazyload for Images.
	  this.scroller.addEventListener('scrolling', function (e) {
	    var so = e.scrollObj
	    var scrollTop = so.getScrollTop()
	    var scrollLeft = so.getScrollLeft()
	    var offset = this.direction === 'v' ? scrollTop : scrollLeft
	    var diff = offset - this.offset
	    var dir
	    if (diff >= 0) {
	      dir = this.direction === 'v' ? 'up' : 'left'
	    } else {
	      dir = this.direction === 'v' ? 'down' : 'right'
	    }
	    this.dispatchEvent('scroll', {
	      originalType: 'scrolling',
	      scrollTop: so.getScrollTop(),
	      scrollLeft: so.getScrollLeft(),
	      offset: offset,
	      direction: dir
	    }, {
	      bubbles: true
	    })
	    this.offset = offset
	  }.bind(this))
	
	  var pullendEvent = 'pull' + ({ v: 'up', h: 'left' })[this.direction] + 'end'
	  this.scroller.addEventListener(pullendEvent, function (e) {
	    this.dispatchEvent('loadmore')
	  }.bind(this))
	}
	
	List.prototype.createChildren = function () {
	  var children = this.data.children
	  var parentRef = this.data.ref
	  var componentManager = this.getComponentManager()
	  if (children && children.length) {
	    var fragment = document.createDocumentFragment()
	    var isFlex = false
	    for (var i = 0; i < children.length; i++) {
	      children[i].instanceId = this.data.instanceId
	      children[i].scale = this.data.scale
	      var child = componentManager.createElement(children[i])
	      fragment.appendChild(child.node)
	      child.parentRef = parentRef
	      if (!isFlex
	          && child.data.style
	          && child.data.style.hasOwnProperty('flex')
	        ) {
	        isFlex = true
	      }
	    }
	    this.listElement.appendChild(fragment)
	  }
	  // wait for fragment to appended on listElement on UI thread.
	  setTimeout(function () {
	    this.scroller.refresh()
	  }.bind(this), 0)
	}
	
	List.prototype.appendChild = function (data) {
	  var children = this.data.children
	  var componentManager = this.getComponentManager()
	  var child = componentManager.createElement(data)
	  this.listElement.appendChild(child.node)
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh()
	  }.bind(this), 0)
	
	  // update this.data.children
	  if (!children || !children.length) {
	    this.data.children = [data]
	  } else {
	    children.push(data)
	  }
	
	  return child
	}
	
	List.prototype.insertBefore = function (child, before) {
	  var children = this.data.children
	  var i = 0
	  var isAppend = false
	
	  // update this.data.children
	  if (!children || !children.length || !before) {
	    isAppend = true
	  } else {
	    for (var l = children.length; i < l; i++) {
	      if (children[i].ref === before.data.ref) {
	        break
	      }
	    }
	    if (i === l) {
	      isAppend = true
	    }
	  }
	
	  if (isAppend) {
	    this.listElement.appendChild(child.node)
	    children.push(child.data)
	  } else {
	    if (before.fixedPlaceholder) {
	      this.listElement.insertBefore(child.node, before.fixedPlaceholder)
	    } else {
	      this.listElement.insertBefore(child.node, before.node)
	    }
	    children.splice(i, 0, child.data)
	  }
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh()
	  }.bind(this), 0)
	}
	
	List.prototype.removeChild = function (child) {
	  var children = this.data.children
	  // remove from this.data.children
	  var i = 0
	  var componentManager = this.getComponentManager()
	  if (children && children.length) {
	    for (var l = children.length; i < l; i++) {
	      if (children[i].ref === child.data.ref) {
	        break
	      }
	    }
	    if (i < l) {
	      children.splice(i, 1)
	    }
	  }
	  // remove from componentMap recursively
	  componentManager.removeElementByRef(child.data.ref)
	  if (child.fixedPlaceholder) {
	    this.listElement.removeChild(child.fixedPlaceholder)
	  }
	  child.node.parentNode.removeChild(child.node)
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh()
	  }.bind(this), 0)
	}
	
	module.exports = List


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(42);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./list.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./list.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".list-wrap {\n  display: block;\n  overflow: hidden;\n}\n\n.list-element {\n  -webkit-box-orient: vertical;\n  -webkit-flex-direction: column;\n  flex-direction: column;\n}\n", ""]);
	
	// exports


/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(44)
	
	var logger = __webpack_require__(30)
	
	var doc = window.document
	var ua = window.navigator.userAgent
	var scrollObjs = {}
	var plugins = {}
	var dpr = window.dpr
	  || (!!window.navigator.userAgent.match(/iPhone|iPad|iPod/)
	    ? document.documentElement.clientWidth / window.screen.availWidth
	    : 1)
	var inertiaCoefficient = {
	  normal: [2 * dpr, 0.0015 * dpr],
	  slow: [1.5 * dpr, 0.003 * dpr],
	  veryslow: [1.5 * dpr, 0.005 * dpr]
	}
	var timeFunction = {
	  ease: [.25,.1,.25,1],
	  liner: [0,0,1,1],
	  'ease-in': [.42,0,1,1],
	  'ease-out': [0,0,.58,1],
	  'ease-in-out': [.42,0,.58,1]
	}
	var Firefox = !!ua.match(/Firefox/i)
	var IEMobile = !!ua.match(/IEMobile/i)
	var cssPrefix = Firefox ? '-moz-' : IEMobile ? '-ms-' : '-webkit-'
	var stylePrefix = Firefox ? 'Moz' : IEMobile ? 'ms' : 'webkit'
	
	function debugLog() {
	  if (lib.scroll.outputDebugLog) {
	    logger.log.apply(logger, arguments)
	  }
	}
	
	function getBoundingClientRect(el) {
	  var rect = el.getBoundingClientRect()
	  if (!rect) {
	    rect = {}
	    rect.width = el.offsetWidth
	    rect.height = el.offsetHeight
	
	    rect.left = el.offsetLeft
	    rect.top = el.offsetTop
	    var parent = el.offsetParent
	    while (parent) {
	      rect.left += parent.offsetLeft
	      rect.top += parent.offsetTop
	      parent = parent.offsetParent
	    }
	
	    rect.right = rect.left + rect.width
	    rect.bottom = rect.top + rect.height
	  }
	  return rect
	}
	
	function getMinScrollOffset(scrollObj) {
	  return 0 - scrollObj.options[scrollObj.axis + 'PaddingTop']
	}
	
	function getMaxScrollOffset(scrollObj) {
	  var rect = getBoundingClientRect(scrollObj.element)
	  var pRect = getBoundingClientRect(scrollObj.viewport)
	  var min = getMinScrollOffset(scrollObj)
	  if (scrollObj.axis === 'y') {
	    var max = 0 - rect.height + pRect.height
	  } else {
	    var max = 0 - rect.width + pRect.width
	  }
	  return Math.min(
	    max + scrollObj.options[scrollObj.axis + 'PaddingBottom'],
	    min
	  )
	}
	
	function getBoundaryOffset(scrollObj, offset) {
	  if (offset > scrollObj.minScrollOffset) {
	    return offset - scrollObj.minScrollOffset
	  }
	  if (offset < scrollObj.maxScrollOffset) {
	    return offset - scrollObj.maxScrollOffset
	  }
	}
	
	function touchBoundary(scrollObj, offset) {
	  if (offset > scrollObj.minScrollOffset) {
	    offset = scrollObj.minScrollOffset
	  } else if (offset < scrollObj.maxScrollOffset) {
	    offset = scrollObj.maxScrollOffset
	  }
	  return offset
	}
	
	function fireEvent(scrollObj, eventName, extra) {
	  debugLog(scrollObj.element.scrollId, eventName, extra)
	  var event = doc.createEvent('HTMLEvents')
	  event.initEvent(eventName, false, true)
	  event.scrollObj = scrollObj
	  if (extra) {
	    for (var key in extra) {
	      event[key] = extra[key]
	    }
	  }
	  scrollObj.element.dispatchEvent(event)
	  scrollObj.viewport.dispatchEvent(event)
	}
	
	function getTransformOffset(scrollObj) {
	  var offset = {x: 0, y: 0}
	  var transform = getComputedStyle(scrollObj.element)
	    [stylePrefix + 'Transform']
	  var matched
	  var reg1 = new RegExp('^matrix3d'
	    + '\\((?:[-\\d.]+,\\s*){12}([-\\d.]+),'
	    + '\\s*([-\\d.]+)(?:,\\s*[-\\d.]+){2}\\)')
	  var reg2 = new RegExp('^matrix'
	    + '\\((?:[-\\d.]+,\\s*){4}([-\\d.]+),\\s*([-\\d.]+)\\)$')
	  if (transform !== 'none') {
	    if ((matched = transform.match(reg1) ||
	        transform.match(reg2))) {
	      offset.x = parseFloat(matched[1]) || 0
	      offset.y = parseFloat(matched[2]) || 0
	    }
	  }
	
	  return offset
	}
	
	var CSSMatrix = IEMobile ? 'MSCSSMatrix' : 'WebKitCSSMatrix'
	var has3d = !!Firefox
	  || CSSMatrix in window
	  && 'm11' in new window[CSSMatrix]()
	function getTranslate(x, y) {
	  x = parseFloat(x)
	  y = parseFloat(y)
	
	  if (x != 0) {
	    x += 'px'
	  }
	
	  if (y != 0) {
	    y += 'px'
	  }
	
	  if (has3d) {
	    return 'translate3d(' + x + ', ' + y + ', 0)'
	  }
	  return 'translate(' + x + ', ' + y + ')'
	}
	
	function setTransitionStyle(scrollObj, duration, timingFunction) {
	  if (duration === '' && timingFunction === '') {
	    scrollObj.element.style[stylePrefix + 'Transition'] = ''
	  } else {
	    scrollObj.element.style[stylePrefix + 'Transition']
	      = cssPrefix + 'transform ' + duration + ' ' + timingFunction + ' 0s'
	  }
	}
	
	function setTransformStyle(scrollObj, offset) {
	  var x = 0
	  var y = 0
	  if (typeof offset === 'object') {
	    x = offset.x
	    y = offset.y
	  } else {
	    if (scrollObj.axis === 'y') {
	      y = offset
	    } else {
	      x = offset
	    }
	  }
	  scrollObj.element.style[stylePrefix + 'Transform'] = getTranslate(x, y)
	}
	
	var panning = false
	doc.addEventListener('touchmove', function (e) {
	  if (panning) {
	    e.preventDefault()
	    return false
	  }
	  return true
	}, false)
	
	function Scroll(element, options) {
	  var that = this
	
	  options = options || {}
	  options.noBounce = !!options.noBounce
	  options.padding = options.padding || {}
	
	  if (options.isPrevent == null) {
	    options.isPrevent = true
	  } else {
	    options.isPrevent = !!options.isPrevent
	  }
	
	  if (options.isFixScrollendClick == null) {
	    options.isFixScrollendClick = true
	  } else {
	    options.isFixScrollendClick = !!options.isFixScrollendClick
	  }
	
	  if (options.padding) {
	    options.yPaddingTop = -options.padding.top || 0
	    options.yPaddingBottom = -options.padding.bottom || 0
	    options.xPaddingTop = -options.padding.left || 0
	    options.xPaddingBottom = -options.padding.right || 0
	  } else {
	    options.yPaddingTop = 0
	    options.yPaddingBottom = 0
	    options.xPaddingTop = 0
	    options.xPaddingBottom = 0
	  }
	
	  options.direction = options.direction || 'y'
	  options.inertia = options.inertia || 'normal'
	
	  this.options = options
	  that.axis = options.direction
	  this.element = element
	  this.viewport = element.parentNode
	  this.plugins = {}
	
	  this.element.scrollId = setTimeout(function () {
	    scrollObjs[that.element.scrollId + ''] = that
	  }, 1)
	
	  this.viewport.addEventListener('touchstart', touchstartHandler, false)
	  this.viewport.addEventListener('touchend', touchendHandler, false)
	  this.viewport.addEventListener('touchcancel', touchendHandler, false)
	  this.viewport.addEventListener('panstart', panstartHandler, false)
	  this.viewport.addEventListener('panmove', panHandler, false)
	  this.viewport.addEventListener('panend', panendHandler, false)
	
	  if (options.isPrevent) {
	    this.viewport.addEventListener('touchstart', function (e) {
	      panning = true
	    }, false)
	    that.viewport.addEventListener('touchend', function (e) {
	      panning = false
	    }, false)
	  }
	
	  // if (options.isPrevent) {
	  //   var d = this.axis === 'y'?'vertical':'horizontal'
	  //   this.viewport.addEventListener(d + 'panstart', function (e) {
	  //     panning = true
	  //   }, false)
	  //   that.viewport.addEventListener('panend', function (e) {
	  //     panning = false
	  //   }, false)
	  // }
	
	  if (options.isFixScrollendClick) {
	    var preventScrollendClick
	    var fixScrollendClickTimeoutId
	
	    this.viewport.addEventListener('scrolling', function () {
	      preventScrollendClick = true
	      fixScrollendClickTimeoutId && clearTimeout(fixScrollendClickTimeoutId)
	      fixScrollendClickTimeoutId = setTimeout(function (e) {
	        preventScrollendClick = false
	      }, 400)
	    }, false)
	
	    function preventScrollendClickHandler(e) {
	      if (preventScrollendClick || isScrolling) {
	        e.preventDefault()
	        e.stopPropagation()
	        return false
	      }
	      return true
	    }
	
	    function fireNiceTapEventHandler(e) {
	      if (!preventScrollendClick && !isScrolling) {
	        setTimeout(function () {
	          var niceTapEvent = document.createEvent('HTMLEvents')
	          niceTapEvent.initEvent('niceclick', true, true)
	          e.target.dispatchEvent(niceTapEvent)
	        }, 300)
	      }
	    }
	
	    this.viewport.addEventListener('click', preventScrollendClickHandler)
	    this.viewport.addEventListener('tap', fireNiceTapEventHandler)
	  }
	
	  if (options.useFrameAnimation) {
	    var scrollAnimation
	
	    Object.defineProperty(this, 'animation', {
	      get: function () {
	        return scrollAnimation
	      }
	    })
	  } else {
	    var transitionEndHandler
	    var transitionEndTimeoutId = 0
	
	    function setTransitionEndHandler(h, t) {
	      transitionEndHandler = null
	      clearTimeout(transitionEndTimeoutId)
	
	      transitionEndTimeoutId = setTimeout(function () {
	        if (transitionEndHandler) {
	          transitionEndHandler = null
	          lib.animation.requestFrame(h)
	        }
	      }, (t || 400))
	
	      transitionEndHandler = h
	    }
	
	    element.addEventListener(
	        Firefox
	          ? 'transitionend'
	          : (stylePrefix + 'TransitionEnd'), function (e) {
	      if (transitionEndHandler) {
	        var handler = transitionEndHandler
	
	        transitionEndHandler = null
	        clearTimeout(transitionEndTimeoutId)
	
	        lib.animation.requestFrame(function () {
	          handler(e)
	        })
	      }
	    }, false)
	  }
	
	  var panFixRatio
	  var isScrolling
	  var isFlickScrolling
	  var cancelScrollEnd
	
	  Object.defineProperty(this, 'isScrolling', {
	    get: function () {
	      return !!isScrolling
	    }
	  })
	
	  function isEnabled(e) {
	    if (!that.enabled) {
	      return false
	    }
	
	    if (typeof e.isVertical != 'undefined') {
	      if (that.axis === 'y' && e.isVertical
	          || that.axis === 'x' && !e.isVertical) {
	        // gesture in same direction, stop bubbling up
	        e.stopPropagation()
	      } else {
	        // gesture in different direction, bubbling up
	        // to the top, without any other process
	        return false
	      }
	    }
	
	    return true
	  }
	
	  function touchstartHandler(e) {
	    if (!isEnabled(e)) {
	      return
	    }
	
	    if (isScrolling) {
	      scrollEnd()
	    }
	
	    if (options.useFrameAnimation) {
	      scrollAnimation && scrollAnimation.stop()
	      scrollAnimation = null
	    } else {
	      var transform = getTransformOffset(that)
	      setTransformStyle(that, transform)
	      setTransitionStyle(that, '', '')
	      transitionEndHandler = null
	      clearTimeout(transitionEndTimeoutId)
	    }
	  }
	
	  function touchendHandler(e) {
	    if (!isEnabled(e)) {
	      return
	    }
	
	    var s0 = getTransformOffset(that)[that.axis]
	    var boundaryOffset = getBoundaryOffset(that, s0)
	
	    if (boundaryOffset) {
	      // dragging out of boundray, bounce is needed
	      var s1 = touchBoundary(that, s0)
	
	      if (options.useFrameAnimation) {
	        // frame
	        var _s = s1 - s0
	        scrollAnimation = new lib.animation(
	            400,
	            lib.cubicbezier.ease,
	            0,
	            function (i1, i2) {
	          var offset = (s0 + _s * i2).toFixed(2)
	          setTransformStyle(that, offset)
	          fireEvent(that, 'scrolling')
	        })
	        scrollAnimation.onend(scrollEnd)
	        scrollAnimation.play()
	      } else {
	        // css
	        var offset =  s1.toFixed(0)
	        setTransitionStyle(that, '0.4s', 'ease')
	        setTransformStyle(that, offset)
	        setTransitionEndHandler(scrollEnd, 400)
	
	        lib.animation.requestFrame(function () {
	          if (isScrolling && that.enabled) {
	            fireEvent(that, 'scrolling')
	            lib.animation.requestFrame(arguments.callee)
	          }
	        })
	      }
	
	      if (boundaryOffset > 0) {
	        fireEvent(that, that.axis === 'y' ? 'pulldownend' : 'pullrightend')
	      } else if (boundaryOffset < 0) {
	        fireEvent(that, that.axis === 'y' ? 'pullupend' : 'pullleftend')
	      }
	    } else if (isScrolling) {
	      // without exceeding the boundary, just end it
	      scrollEnd()
	    }
	  }
	
	  var lastDisplacement
	  function panstartHandler(e) {
	    if (!isEnabled(e)) {
	      return
	    }
	
	    that.transformOffset = getTransformOffset(that)
	    that.minScrollOffset = getMinScrollOffset(that)
	    that.maxScrollOffset = getMaxScrollOffset(that)
	    panFixRatio = 2.5
	    cancelScrollEnd = true
	    isScrolling = true
	    isFlickScrolling = false
	    fireEvent(that, 'scrollstart')
	
	    lastDisplacement = e['displacement' + that.axis.toUpperCase()]
	  }
	
	
	  function panHandler(e) {
	    if (!isEnabled(e)) {
	      return
	    }
	
	    // finger move less than 5 px. just ignore that.
	    var displacement = e['displacement' + that.axis.toUpperCase()]
	    if (Math.abs(displacement - lastDisplacement) < 5) {
	      e.stopPropagation()
	      return
	    }
	    lastDisplacement = displacement
	
	    var offset = that.transformOffset[that.axis] + displacement
	    if (offset > that.minScrollOffset) {
	      offset = that.minScrollOffset
	        + (offset - that.minScrollOffset) / panFixRatio
	      panFixRatio *= 1.003
	    } else if (offset < that.maxScrollOffset) {
	      offset = that.maxScrollOffset
	        - (that.maxScrollOffset - offset) / panFixRatio
	      panFixRatio *= 1.003
	    }
	    if (panFixRatio > 4) {
	      panFixRatio = 4
	    }
	
	    // tell whether or not reach the fringe
	    var boundaryOffset = getBoundaryOffset(that, offset)
	    if (boundaryOffset) {
	      fireEvent(
	          that,
	          boundaryOffset > 0
	          ? (that.axis === 'y' ? 'pulldown' : 'pullright')
	          : (that.axis === 'y' ? 'pullup' : 'pullleft'), {
	        boundaryOffset: Math.abs(boundaryOffset)
	      })
	      if (that.options.noBounce) {
	        offset = touchBoundary(that, offset)
	      }
	    }
	
	    setTransformStyle(that, offset.toFixed(2))
	    fireEvent(that, 'scrolling')
	  }
	
	  function panendHandler(e) {
	    if (!isEnabled(e)) {
	      return
	    }
	
	    if (e.isflick) {
	      flickHandler(e)
	    }
	  }
	
	  function flickHandler(e) {
	    cancelScrollEnd = true
	
	    var v0, a0, t0, s0, s, motion0
	    var v1, a1, t1, s1, motion1,sign
	    var v2, a2, t2, s2, motion2, ft
	
	    s0 = getTransformOffset(that)[that.axis]
	    var boundaryOffset0 = getBoundaryOffset(that, s0)
	    if (!boundaryOffset0) {
	      // when fingers left the range of screen, let touch end handler
	      // to deal with it.
	      // when fingers left the screen, but still in the range of
	      // screen, calculate the intertia.
	      v0 = e['velocity' + that.axis.toUpperCase()]
	
	      var maxV = 2
	      var friction = 0.0015
	      if (options.inertia && inertiaCoefficient[options.inertia]) {
	        maxV = inertiaCoefficient[options.inertia][0]
	        friction = inertiaCoefficient[options.inertia][1]
	      }
	
	      if (v0 > maxV) {
	        v0 = maxV
	      }
	      if (v0 < -maxV) {
	        v0 = -maxV
	      }
	      a0 = friction * (v0 / Math.abs(v0))
	      motion0 = new lib.motion({
	        v: v0,
	        a: -a0
	      })
	      t0 = motion0.t
	      s = s0 + motion0.s
	
	      var boundaryOffset1 = getBoundaryOffset(that, s)
	      if (boundaryOffset1) {
	        debugLog('inertial calculation has exceeded the boundary',
	          boundaryOffset1)
	
	        v1 = v0
	        a1 = a0
	        if (boundaryOffset1 > 0) {
	          s1 = that.minScrollOffset
	          sign = 1
	        } else {
	          s1 = that.maxScrollOffset
	          sign = -1
	        }
	        motion1 = new lib.motion({
	          v: sign * v1,
	          a: -sign * a1,
	          s: Math.abs(s1 - s0)
	        })
	        t1 = motion1.t
	        var timeFunction1 = motion1.generateCubicBezier()
	
	        v2 = v1 - a1 * t1
	        a2 = 0.03 * (v2 / Math.abs(v2))
	        motion2 = new lib.motion({
	          v: v2,
	          a: -a2
	        })
	        t2 = motion2.t
	        s2 = s1 + motion2.s
	        var timeFunction2 = motion2.generateCubicBezier()
	
	        if (options.noBounce) {
	          debugLog('no bounce effect')
	
	          if (s0 !== s1) {
	            if (options.useFrameAnimation) {
	              // frame
	              var _s = s1 - s0
	              var bezier = lib.cubicbezier(
	                timeFunction1[0][0],
	                timeFunction1[0][1],
	                timeFunction1[1][0],
	                timeFunction1[1][1]
	              )
	              scrollAnimation = new lib.animation(
	                  t1.toFixed(0),
	                  bezier,
	                  0,
	                  function (i1, i2) {
	                var offset = (s0 + _s * i2)
	                getTransformOffset(that, offset.toFixed(2))
	                fireEvent(that, 'scrolling', {
	                  afterFlick: true
	                })
	              })
	
	              scrollAnimation.onend(scrollEnd)
	
	              scrollAnimation.play()
	            } else {
	              // css
	              var offset = s1.toFixed(0)
	              setTransitionStyle(
	                that,
	                (t1 / 1000).toFixed(2) + 's',
	                'cubic-bezier(' + timeFunction1 + ')'
	              )
	              setTransformStyle(that, offset)
	              setTransitionEndHandler(
	                scrollEnd,
	                (t1 / 1000).toFixed(2) * 1000
	              )
	            }
	          } else {
	            scrollEnd()
	          }
	        } else if (s0 !== s2) {
	          debugLog(
	            'scroll for inertia',
	            's=' + s2.toFixed(0),
	            't=' + ((t1 + t2) / 1000).toFixed(2)
	          )
	
	          if (options.useFrameAnimation) {
	            var _s = s2 - s0
	            var bezier = lib.cubicbezier.easeOut
	            scrollAnimation = new lib.animation(
	                (t1 + t2).toFixed(0),
	                bezier,
	                0,
	                function (i1, i2) {
	              var offset = s0 + _s * i2
	              setTransformStyle(that, offset.toFixed(2))
	              fireEvent(that, 'scrolling',{
	                afterFlick: true
	              })
	            })
	
	            scrollAnimation.onend(function () {
	              if (!that.enabled) {
	                return
	              }
	
	              var _s = s1 - s2
	              var bezier = lib.cubicbezier.ease
	              scrollAnimation = new lib.animation(
	                  400,
	                  bezier,
	                  0,
	                  function (i1, i2) {
	                var offset = s2 + _s * i2
	                setTransformStyle(that, offset.toFixed(2))
	                fireEvent(that, 'scrolling',{
	                  afterFlick: true
	                })
	              })
	
	              scrollAnimation.onend(scrollEnd)
	
	              scrollAnimation.play()
	            })
	
	            scrollAnimation.play()
	          } else {
	            var offset = s2.toFixed(0)
	            setTransitionStyle(
	              that,
	              ((t1 + t2) / 1000).toFixed(2) + 's',
	              'ease-out'
	            )
	            setTransformStyle(that, offset)
	
	            setTransitionEndHandler(function (e) {
	              if (!that.enabled) {
	                return
	              }
	
	              debugLog('inertial bounce',
	                's=' + s1.toFixed(0),
	                't=400'
	              )
	
	              if (s2 !== s1) {
	                var offset = s1.toFixed(0)
	                setTransitionStyle(that, '0.4s', 'ease')
	                setTransformStyle(that, offset)
	                setTransitionEndHandler(scrollEnd, 400)
	              } else {
	                scrollEnd()
	              }
	            }, ((t1 + t2) / 1000).toFixed(2) * 1000)
	          }
	        } else {
	          scrollEnd()
	        }
	      } else {
	        debugLog('inertial calculation hasn\'t exceeded the boundary')
	        var timeFunction = motion0.generateCubicBezier()
	
	        if (options.useFrameAnimation) {
	          // frame
	          var _s = s - s0
	          var bezier = lib.cubicbezier(
	            timeFunction[0][0],
	            timeFunction[0][1],
	            timeFunction[1][0],
	            timeFunction[1][1]
	          )
	          scrollAnimation = new lib.animation(
	              t0.toFixed(0),
	              bezier,
	              0,
	              function (i1, i2) {
	            var offset = (s0 + _s * i2).toFixed(2)
	            setTransformStyle(that, offset)
	            fireEvent(that, 'scrolling',{
	              afterFlick: true
	            })
	          })
	
	          scrollAnimation.onend(scrollEnd)
	
	          scrollAnimation.play()
	        } else {
	          // css
	          var offset = s.toFixed(0)
	          setTransitionStyle(
	            that,
	            (t0 / 1000).toFixed(2) + 's',
	            'cubic-bezier(' + timeFunction + ')'
	          )
	          setTransformStyle(that, offset)
	          setTransitionEndHandler(scrollEnd, (t0 / 1000).toFixed(2) * 1000)
	        }
	      }
	
	
	      isFlickScrolling = true
	      if (!options.useFrameAnimation) {
	        lib.animation.requestFrame(function () {
	          if (isScrolling && isFlickScrolling && that.enabled) {
	            fireEvent(that, 'scrolling', {
	              afterFlick: true
	            })
	            lib.animation.requestFrame(arguments.callee)
	          }
	        })
	      }
	    }
	  }
	
	  function scrollEnd() {
	    if (!that.enabled) {
	      return
	    }
	
	    cancelScrollEnd = false
	
	    setTimeout(function () {
	      if (!cancelScrollEnd && isScrolling) {
	        isScrolling = false
	        isFlickScrolling = false
	
	        if (options.useFrameAnimation) {
	          scrollAnimation && scrollAnimation.stop()
	          scrollAnimation = null
	        } else {
	          setTransitionStyle(that, '', '')
	        }
	        fireEvent(that, 'scrollend')
	      }
	    }, 50)
	  }
	
	  var proto = {
	    init: function () {
	      this.enable()
	      this.refresh()
	      this.scrollTo(0)
	      return this
	    },
	
	    enable: function () {
	      this.enabled = true
	      return this
	    },
	
	    disable: function () {
	      var el = this.element
	      this.enabled = false
	
	      if (this.options.useFrameAnimation) {
	        scrollAnimation && scrollAnimation.stop()
	      } else {
	        lib.animation.requestFrame(function () {
	          el.style[stylePrefix + 'Transform']
	            = getComputedStyle(el)[stylePrefix + 'Transform']
	        })
	      }
	
	      return this
	    },
	
	    getScrollWidth: function () {
	      return getBoundingClientRect(this.element).width
	    },
	
	    getScrollHeight: function () {
	      return getBoundingClientRect(this.element).height
	    },
	
	    getScrollLeft: function () {
	      return -getTransformOffset(this).x - this.options.xPaddingTop
	    },
	
	    getScrollTop: function () {
	      return -getTransformOffset(this).y - this.options.yPaddingTop
	    },
	
	    getMaxScrollLeft: function () {
	      return -that.maxScrollOffset - this.options.xPaddingTop
	    },
	
	    getMaxScrollTop: function () {
	      return -that.maxScrollOffset - this.options.yPaddingTop
	    },
	
	    getBoundaryOffset: function () {
	      return Math.abs(
	        getBoundaryOffset(this, getTransformOffset(this)[this.axis]) || 0
	      )
	    },
	
	    refresh: function () {
	      var el = this.element
	      var isVertical = (this.axis === 'y')
	      var type = isVertical?'height':'width'
	
	      if (this.options[type] != null) {
	        // use options
	        el.style[type] = this.options[type] + 'px'
	      } else if (!!this.options.useElementRect) {
	        el.style[type] = 'auto'
	        el.style[type] = getBoundingClientRect(el)[type] + 'px'
	      } else if (el.childElementCount > 0) {
	        var range
	        var rect
	        var firstEl = el.firstElementChild
	        var lastEl = el.lastElementChild
	
	        if (document.createRange && !this.options.ignoreOverflow) {
	          // use range
	          range = document.createRange()
	          range.selectNodeContents(el)
	          rect = getBoundingClientRect(range)
	        }
	
	        if (rect) {
	          el.style[type] = rect[type] + 'px'
	        } else {
	          // use child offsets
	          while (firstEl) {
	            if (getBoundingClientRect(firstEl)[type] === 0
	                && firstEl.nextElementSibling) {
	              firstEl = firstEl.nextElementSibling
	            } else {
	              break
	            }
	          }
	
	          while (lastEl && lastEl !== firstEl) {
	            if (getBoundingClientRect(lastEl)[type] === 0
	                && lastEl.previousElementSibling) {
	              lastEl = lastEl.previousElementSibling
	            } else {
	              break
	            }
	          }
	
	          el.style[type] = (getBoundingClientRect(lastEl)[
	              isVertical ? 'bottom' : 'right']
	            - getBoundingClientRect(firstEl)[
	              isVertical ? 'top' : 'left'])
	            + 'px'
	        }
	      }
	
	      this.transformOffset = getTransformOffset(this)
	      this.minScrollOffset = getMinScrollOffset(this)
	      this.maxScrollOffset = getMaxScrollOffset(this)
	      this.scrollTo(
	        -this.transformOffset[this.axis]
	        - this.options[this.axis + 'PaddingTop']
	      )
	      fireEvent(this, 'contentrefresh')
	
	      return this
	    },
	
	    offset: function (childEl) {
	      var elRect = getBoundingClientRect(this.element)
	      var childRect = getBoundingClientRect(childEl)
	      if (this.axis === 'y') {
	        var offsetRect = {
	          top: childRect.top - elRect.top - this.options.yPaddingTop,
	          left: childRect.left - elRect.left,
	          right: elRect.right - childRect.right,
	          width: childRect.width,
	          height: childRect.height
	        }
	
	        offsetRect.bottom = offsetRect.top + offsetRect.height
	      } else {
	        var offsetRect = {
	          top: childRect.top - elRect.top,
	          bottom: elRect.bottom - childRect.bottom,
	          left: childRect.left - elRect.left - this.options.xPaddingTop,
	          width: childRect.width,
	          height: childRect.height
	        }
	
	        offsetRect.right = offsetRect.left + offsetRect.width
	      }
	      return offsetRect
	    },
	
	    getRect: function (childEl) {
	      var viewRect = getBoundingClientRect(this.viewport)
	      var childRect = getBoundingClientRect(childEl)
	      if (this.axis === 'y') {
	        var offsetRect = {
	          top: childRect.top - viewRect.top,
	          left: childRect.left - viewRect.left,
	          right: viewRect.right - childRect.right,
	          width: childRect.width,
	          height: childRect.height
	        }
	
	        offsetRect.bottom = offsetRect.top + offsetRect.height
	      } else {
	        var offsetRect = {
	          top: childRect.top - viewRect.top,
	          bottom: viewRect.bottom - childRect.bottom,
	          left: childRect.left - viewRect.left,
	          width: childRect.width,
	          height: childRect.height
	        }
	
	        offsetRect.right = offsetRect.left + offsetRect.width
	      }
	      return offsetRect
	    },
	
	    isInView: function (childEl) {
	      var viewRect = this.getRect(this.viewport)
	      var childRect = this.getRect(childEl)
	      if (this.axis === 'y') {
	        return viewRect.top < childRect.bottom
	          && viewRect.bottom > childRect.top
	      }
	      return viewRect.left < childRect.right
	        && viewRect.right > childRect.left
	    },
	
	    scrollTo: function (offset, isSmooth) {
	      var that = this
	      var element = this.element
	
	      offset = -offset - this.options[this.axis + 'PaddingTop']
	      offset = touchBoundary(this, offset)
	
	      isScrolling = true
	      if (isSmooth === true) {
	        if (this.options.useFrameAnimation) {
	          var s0 = getTransformOffset(that)[this.axis]
	          var _s = offset - s0
	          scrollAnimation = new lib.animation(
	              400,
	              lib.cubicbezier.easeInOut,
	              0,
	              function (i1, i2) {
	            var offset = (s0 + _s * i2).toFixed(2)
	            setTransformStyle(that, offset)
	            fireEvent(that, 'scrolling')
	          })
	
	          scrollAnimation.onend(scrollEnd)
	
	          scrollAnimation.play()
	        } else {
	          setTransitionStyle(that, '0.4s', 'ease-in-out')
	          setTransformStyle(that, offset)
	          setTransitionEndHandler(scrollEnd, 400)
	
	          lib.animation.requestFrame(function () {
	            if (isScrolling && that.enabled) {
	              fireEvent(that, 'scrolling')
	              lib.animation.requestFrame(arguments.callee)
	            }
	          })
	        }
	      } else {
	        if (!this.options.useFrameAnimation) {
	          setTransitionStyle(that, '', '')
	        }
	        setTransformStyle(that, offset)
	        scrollEnd()
	      }
	
	      return this
	    },
	
	    scrollToElement: function (childEl, isSmooth) {
	      var offset = this.offset(childEl)
	      offset = offset[this.axis === 'y'?'top':'left']
	      return this.scrollTo(offset, isSmooth)
	    },
	
	    getViewWidth: function () {
	      return getBoundingClientRect(this.viewport).width
	    },
	
	    getViewHeight: function () {
	      return getBoundingClientRect(this.viewport).height
	    },
	
	    addPulldownHandler: function (handler) {
	      var that = this
	      this.element.addEventListener('pulldownend', function (e) {
	        that.disable()
	        handler.call(that, e, function () {
	          that.scrollTo(0, true)
	          that.refresh()
	          that.enable()
	        })
	      }, false)
	
	      return this
	    },
	
	    addPullupHandler: function (handler) {
	      var that = this
	
	      this.element.addEventListener('pullupend', function (e) {
	        that.disable()
	        handler.call(that, e, function () {
	          that.scrollTo(that.getScrollHeight(), true)
	          that.refresh()
	          that.enable()
	        })
	      }, false)
	
	      return this
	    },
	
	    addScrollstartHandler: function (handler) {
	      var that = this
	      this.element.addEventListener('scrollstart', function (e) {
	        handler.call(that, e)
	      }, false)
	
	      return this
	    },
	
	    addScrollingHandler: function (handler) {
	      var that = this
	      this.element.addEventListener('scrolling', function (e) {
	        handler.call(that, e)
	      }, false)
	
	      return this
	    },
	
	    addScrollendHandler: function (handler) {
	      var that = this
	      this.element.addEventListener('scrollend', function (e) {
	        handler.call(that, e)
	      }, false)
	
	      return this
	    },
	
	    addContentrenfreshHandler: function (handler) {
	      var that = this
	      this.element.addEventListener('contentrefresh', function (e) {
	        handler.call(that, e)
	      }, false)
	    },
	
	    addEventListener: function (name, handler, useCapture) {
	      var that = this
	      this.element.addEventListener(name, function (e) {
	        handler.call(that, e)
	      }, !!useCapture)
	    },
	
	    removeEventListener: function (name, handler) {
	      var that = this
	      this.element.removeEventListener(name, function (e) {
	        handler.call(that, e)
	      })
	    },
	
	    enablePlugin: function (name, options) {
	      var plugin = plugins[name]
	      if (plugin && !this.plugins[name]) {
	        this.plugins[name] = true
	        options = options || {}
	        plugin.call(this, name, options)
	      }
	      return this
	    }
	  }
	
	  for (var k in proto) {
	    this[k] = proto[k]
	  }
	  delete proto
	}
	
	lib.scroll = function (el, options) {
	  if (arguments.length === 1 && !(arguments[0] instanceof HTMLElement)) {
	    options = arguments[0]
	    if (options.scrollElement) {
	      el = options.scrollElement
	    } else if (options.scrollWrap) {
	      el = options.scrollWrap.firstElementChild
	    } else {
	      throw new Error('no scroll element')
	    }
	  }
	
	  if (!el.parentNode) {
	    throw new Error('wrong dom tree')
	  }
	  if (options
	      && options.direction
	      && ['x', 'y'].indexOf(options.direction) < 0) {
	    throw new Error('wrong direction')
	  }
	
	  var scroll
	  if (options.downgrade === true
	      && lib.scroll.downgrade) {
	    scroll = lib.scroll.downgrade(el, options)
	  } else {
	    if (el.scrollId) {
	      scroll = scrollObjs[el.scrollId]
	    } else {
	      scroll = new Scroll(el, options)
	    }
	  }
	  return scroll
	}
	
	lib.scroll.plugin = function (name, constructor) {
	  if (constructor) {
	    name = name.split(',')
	    name.forEach(function (n) {
	      plugins[n] = constructor
	    })
	  } else {
	    return plugins[name]
	  }
	}
	


/***/ },
/* 44 */
/***/ function(module, exports) {

	'use strict'
	
	/**
	 * transfer Quadratic Bezier Curve to Cubic Bezier Curve
	 *
	 * @param  {number} a abscissa of p1
	 * @param  {number} b ordinate of p1
	 * @return {Array} parameter matrix for cubic bezier curve
	 *   like [[p1x, p1y], [p2x, p2y]]
	 */
	function quadratic2cubicBezier(a, b) {
	  return [
	    [
	      (a / 3 + (a + b) / 3 - a) / (b - a),
	      (a * a / 3 + a * b * 2 / 3 - a * a) / (b * b - a * a)
	    ], [
	      (b / 3 + (a + b) / 3 - a) / (b - a),
	      (b * b / 3 + a * b * 2 / 3 - a * a) / (b * b - a * a)
	    ]
	  ]
	}
	
	/**
	 * derive position data from knowing motion parameters
	 * base on Newton's second law: s = vt + at^2/2
	 *
	 * @param {object} config object of { v, a, s, t }
	 *   - v: initial velocity
	 *   - a: accelerate speed
	 *   - t: time
	 *   - s: shifting
	 */
	function Motion(config) {
	
	  this.v = config.v || 0
	  this.a = config.a || 0
	
	  if (typeof config.t !== 'undefined') {
	    this.t = config.t
	  }
	
	  if (typeof config.s !== 'undefined') {
	    this.s = config.s
	  }
	
	  // derive time from shifting
	  if (typeof this.t === 'undefined') {
	    if (typeof this.s === 'undefined') {
	      this.t = -this.v / this.a
	    } else {
	      var t1 = (Math.sqrt(this.v * this.v + 2 * this.a * this.s) - this.v)
	        / this.a
	      var t2 = (-Math.sqrt(this.v * this.v + 2 * this.a * this.s) - this.v)
	        / this.a
	      this.t = Math.min(t1, t2)
	    }
	  }
	
	  // derive shifting from time
	  if (typeof this.s === 'undefined') {
	    this.s = this.a * this.t * this.t / 2 + this.v * this.t
	  }
	}
	
	/**
	 * derive cubic bezier parameters from motion parameters
	 * @return {Array} parameter matrix for cubic bezier curve
	 *   like [[p1x, p1y], [p2x, p2y]]
	 */
	Motion.prototype.generateCubicBezier = function () {
	  return quadratic2cubicBezier(
	    this.v / this.a, this.t + this.v / this.a
	  )
	}
	
	!lib && (lib = {})
	lib.motion = Motion
	
	module.exports = Motion

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var List = __webpack_require__(40)
	
	function Hlist(data, nodeType) {
	  data.attr.direction = 'h'
	  List.call(this, data, nodeType)
	}
	
	Hlist.prototype = Object.create(List.prototype)
	
	module.exports = Hlist

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(35)
	__webpack_require__(47)
	
	var FORMATTER_REGEXP = /(\\)?(dd*|hh?|mm?|ss?)/gi
	
	function formatDateTime(data, formatter, timeColor) {
	  return formatter.replace(FORMATTER_REGEXP, function (m) {
	    var len = m.length
	    var firstChar = m.charAt(0)
	    // escape character
	    if (firstChar === '\\') {
	      return m.replace('\\', '')
	    }
	    var value = (firstChar === 'd' ? data.days :
	                firstChar === 'h' ? data.hours :
	                firstChar === 'm' ? data.minutes :
	                firstChar === 's' ? data.seconds : 0) + ''
	
	    // 5 zero should be enough
	    return '<span style="margin:4px;color:'
	      + timeColor + '" >'
	      + ('00000' + value).substr(-Math.max(value.length, len))
	      + '</span>'
	  })
	}
	
	function Countdown (data) {
	  Atomic.call(this, data)
	}
	
	Countdown.prototype = Object.create(Atomic.prototype)
	
	Countdown.prototype.create = function () {
	  var node = document.createElement('div')
	  node.classList.add('weex-element')
	  var data = this.data
	  var time = Number(data.attr.countdownTime) || 0
	  var endTime = Date.now() / 1000 + time
	  var cd = lib.countdown({
	    endDate: endTime,
	    onUpdate: function (time) {
	      var timeColor = data.style.timeColor || '#000'
	      var result = formatDateTime(time, data.attr.formatterValue, timeColor)
	      node.innerHTML = result
	    },
	    onEnd: function () {
	    }
	  }).start()
	
	  return node
	}
	
	Countdown.prototype.style = {
	  textColor: function (value) {
	    this.node.style.color = value
	  }
	}
	
	module.exports = Countdown


/***/ },
/* 47 */
/***/ function(module, exports) {

	var DAY_SECONDS = 86400,
	    HOUR_SECONDS = 3600,
	    MINUTE_SECONDS = 60,
	    FORMATTER_DEFAULT = 'd天hh时mm分ss秒',
	    FORMATTER_REGEXP = /(\\)?(dd*|hh?|mm?|ss?)/gi;
	
	/**
	 * 倒计时。此类无法直接实例化，请使用 lib.countdown(options) 进行实例化。
	 * @class CountDown
	 * @param {Object} options 倒计时参数。
	 * @param {CountDown~DateSource} options.endDate 倒计时的结束时间点。倒计时必需有此属性，否则会抛错。
	 * @param {CountDown~StringFormatter} options.stringFormatter 倒计时数据的字符串格式。
	 * @param {Int} options.interval 倒计时更新的间隔频率。单位为毫秒。 默认值为：1000，即1秒。
	 * @param {Int} options.correctDateOffset 修正倒计时的时间偏差值。单位为秒。此属性可用来修正服务端与客户端的时间差。
	 * @param {CountDown~onUpdate} options.onUpdate 倒计时每次更新的回调函数。
	 * @param {HTMLElement} options.updateElement 倒计时的更新元素。可快捷的把倒计时结果通过innerHTML更新到此元素中。
	 * @param {Function} options.onEnd 倒计时结束时的回调函数。
	 */
	var CountDown = function(options){
	    options = options || {};
	
	    //parse end date
	    var me = this, endDate = parseDate(options.endDate);
	    if(!endDate || !endDate.getTime()){
	        throw new Error('Invalid endDate');
	    }else{
	        me.endDate = endDate;
	    }
	
	    me.onUpdate = options.onUpdate;
	    me.onEnd = options.onEnd;
	    me.interval = options.interval || 1000;
	    me.stringFormatter = options.stringFormatter || FORMATTER_DEFAULT;
	    me.correctDateOffset = options.correctDateOffset || 0;
	    me.updateElement = options.updateElement;
	
	    //internal use
	    me._data = {days:0, hours:0, minutes:0, seconds:0};
	};
	
	CountDown.prototype = {
	    /**
	     * 启动倒计时。
	     * @memberOf CountDown.prototype
	     */
	    start: function(){
	        var me = this;
	        me.stop();
	
	        if(me._update()){
	            me._intervalId = setInterval(function(){
	                me._update();
	            }, me.interval);
	        }
	        
	        return me;
	    },
	
	    /**
	     * @private
	     */
	    _update: function(){
	        var me = this, data = me._data,
	            elem = me.updateElement, callback,
	            now = +new Date() + me.correctDateOffset * 1000, 
	            diff = Math.max(0, Math.round((me.endDate.getTime() - now) / 1000)),
	            ended = diff <= 0;
	
	        //calc diff segment
	        data.totalSeconds = diff;
	        diff -= (data.days = Math.floor(diff / DAY_SECONDS)) * DAY_SECONDS;
	        diff -= (data.hours = Math.floor(diff / HOUR_SECONDS)) * HOUR_SECONDS;
	        diff -= (data.minutes = Math.floor(diff / MINUTE_SECONDS)) * MINUTE_SECONDS;
	        data.seconds = diff;
	
	        //format string value
	        data.stringValue = formatDateTime(data, me.stringFormatter);
	
	        //simple way to update element's content
	        if(elem) elem.innerHTML = data.stringValue;
	
	        //callback
	        (callback = me.onUpdate) && callback.call(me, data);
	        if(ended){
	            me.stop();
	            (callback = me.onEnd) && callback.call(me);
	            return false;
	        }
	
	        return true;
	    },
	
	    /**
	     * 停止计时器。
	     * @memberOf CountDown.prototype
	     */
	    stop: function(){
	        var me = this;
	        if(me._intervalId){
	            clearInterval(me._intervalId);
	            me._intervalId = null;
	        }
	        return me;
	    },
	
	    /**
	     * 设置结束时间。
	     * @memberOf CountDown.prototype
	     * @param {CountDown~DateSource} date 要设置的结束时间。 
	     */
	    setEndDate: function(date){
	        var me = this;
	        me.endDate = parseDate(date);
	        return me;
	    }
	};
	
	function parseDate(source){
	    var date;
	
	    if(typeof source === 'number'){
	        date = new Date(source * 1000);
	    }else if(typeof source === 'string'){
	        var firstChar = source.charAt(0),
	            plus = firstChar === '+',
	            minus = firstChar === '-';
	
	        if(plus || minus){ //offset date formate
	            var value = source.substr(1), offsetValue,
	            arr = value.split(':'),
	            time = [0, 0, 0, 0], index = 4;
	
	            while(arr.length && --index >= 0){
	                time[index] = parseInt(arr.pop()) || 0;
	            }
	            offsetValue = DAY_SECONDS * time[0] + HOUR_SECONDS * time[1] + MINUTE_SECONDS * time[2] + time[3];
	
	            date = new Date();
	            date.setSeconds(date.getSeconds() + offsetValue * (minus ? -1 : 1));
	            date.setMilliseconds(0);
	        }
	    }
	
	    if(!date) date = new Date(source);
	
	    return date;
	}
	
	function formatDateTime(data, formatter){
	    return formatter.replace(FORMATTER_REGEXP, function(m){
	        var len = m.length, firstChar = m.charAt(0);
	        //escape character
	        if(firstChar === '\\') return m.replace('\\', '');
	        var value = (firstChar === 'd' ? data.days :
	                    firstChar === 'h' ? data.hours :
	                    firstChar === 'm' ? data.minutes :
	                    firstChar === 's' ? data.seconds : 0) + '';
	
	        //5 zero should be enough
	        return ('00000' + value).substr(-Math.max(value.length, len));
	    });
	}
	
	/**
	 * 倒计时的日期源数据。
	 * @typedef {(Date|String|Number)} CountDown~DateSource
	 * @desc 当日期源数据类型为：
	 * <ul>
	 * <li>Date - 标准值。</li>
	 * <li>Number - 表示结束时间点相对于January 1, 1970, 00:00:00 UTC的绝对值，单位是秒。比如：new Date('2014-12-30 23:00:00').getTime() / 1000。</li>
	 * <li>String - 当为字符串时，则：
	 * <ul>
	 * <li>若以+或-开始，则结束时间点以当前时间即new Date()为相对时间点，再加上或减去字符串后半部分所表示的时长。后半部分，若是一个数值则为秒数，或为字符串，则会按照日:小时:分钟:秒的格式进行解析。</li>
	 * <li>其他，则尝试直接通过new Date(endDate)转换为Date。</li>
	 * </ul></li>
	 * <li>其他情况，则尝试直接通过new Date(endDate)转换为Date。</li>
	 * </ul>
	 */
	
	/**
	 * 倒计时数据的字符串格式。
	 * @typedef {String} CountDown~StringFormatter
	 * @desc 跟大多数语言的日期格式化类似，比如：dd:hh:mm:ss。 此字串中的特殊字符有：
	 * <ul>
	 * <li>d - 天数。</li>
	 * <li>h - 小时。</li>
	 * <li>m - 分钟。</li>
	 * <li>s - 秒。</li>
	 * </ul>
	 * 其中，多个相同的字符表示数值的位数，若最高位不够，则用0补齐。注意：若要格式字串里加入特殊字符，需要用\\进行转义。比如：d\\day\\s, hh\\hour\\s, mm\\minute\\s, ss\\secon\\d\\s。 默认值为：d天hh时mm分ss秒。
	 */
	
	/**
	 * 倒计时每次更新的回调函数。
	 * @callback CountDown~onUpdate
	 * @param {Object} data 更新回调的参数。
	 * @param {String} data.stringValue 通过stringFormatter格式化后的倒计时字符串值。
	 * @param {Int} data.totalSeconds 倒计时的总秒数。
	 * @param {Int} data.days 倒计时的天数部分。
	 * @param {Int} data.hours 倒计时的小时部分。
	 * @param {Int} data.minutes 倒计时的分钟部分。
	 * @param {Int} data.seconds 倒计时的秒数部分。
	 */
	
	/**
	 * 返回一个倒计时 {@link CountDown} 对象。
	 * @memberOf lib
	 * @function
	 * @param {Object} options 倒计时参数，与 {@link CountDown} 构造函数参数一致。
	 * @example
	 * var cd = lib.countdown({
	 *   endDate: '2014-12-30 23:00:00',
	 *   stringFormatter: 'd天 hh小时mm分ss秒',
	 *   onUpdate: function(data){
	 *     elem.innerHTML = data.stringValue;
	 *   },
	 *   onEnd: function(){
	 *       console.log('countdown ended');
	 *   }
	 * }).start();
	 */
	if (typeof window.lib === 'undefined') {
	    lib = {}
	}
	lib.countdown = function(options){
	    return new CountDown(options);
	}
	
	module.exports = lib.countdown

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var config = __webpack_require__(11)
	var Component = __webpack_require__(22)
	var ComponentManager = __webpack_require__(15)
	var LazyLoad = __webpack_require__(18)
	
	function Marquee (data) {
	  this.interval = Number(data.attr.interval) || 5 * 1000
	  this.transitionDuration = Number(data.attr.transitionDuration) || 500
	  this.delay = Number(data.attr.delay) || 0
	  Component.call(this, data)
	}
	
	Marquee.prototype = Object.create(Component.prototype)
	
	Marquee.prototype.create = function () {
	  var node = document.createElement('div')
	  node.classList.add('weex-container')
	  node.style.overflow = 'hidden'
	  // fix page shaking during slider's playing
	  node.style.webkitTransform = 'translate3D(0,0,0)'
	  node.addEventListener('webkitTransitionEnd', this.end.bind(this), false)
	  return node
	}
	
	Marquee.prototype.createChildren = function () {
	  // first run:
	  // - create each child
	  // - append to parentNode
	  // - find current and next
	  // - set current and next shown and others hidden
	  var children = this.data.children
	  var parentRef = this.data.ref
	  var instanceId = this.data.instanceId
	  var items = []
	  var componentManager = this.getComponentManager()
	
	  var fragment, isFlex, child, node, i
	
	  if (children && children.length) {
	    fragment = document.createDocumentFragment()
	    isFlex = false
	    for (i = 0; i < children.length; i++) {
	      children[i].scale = this.data.scale
	      children[i].instanceId = instanceId
	      child = componentManager.createElement(children[i])
	      child.parentRef = parentRef
	      this.initChild(child)
	      // append and push
	      items.push(child)
	      fragment.appendChild(child.node)
	      if (!isFlex && child.data.style.hasOwnProperty('flex')) {
	        isFlex = true
	      }
	    }
	    this.node.appendChild(fragment)
	  }
	
	  // set items
	  this.items = items
	
	  // reset the clock for first transition
	  this.reset()
	}
	
	Marquee.prototype.initChild = function (child) {
	  var node = child.node
	  node.style.position = 'absolute'
	  node.style.top = '0'
	  node.style.left = '0'
	}
	
	Marquee.prototype.appendChild = function (data) {
	  // dom + items
	  var componentManager = ComponentManager.getInstance(this.data.instanceId)
	  var child = componentManager.createElement(data)
	  this.initChild(child)
	  this.node.appendChild(child.node)
	  this.items.push(child)
	  this.reset()
	  return child // @todo redesign Component#appendChild(component)
	}
	
	Marquee.prototype.insertBefore = function (child, before) {
	  // dom + items
	  var index = this.items.indexOf(before)
	  this.items.splice(index, 0, child)
	  this.initChild(child)
	  this.node.insertBefore(child.node, before.node)
	  this.reset()
	}
	
	Marquee.prototype.removeChild = function (child) {
	  // dom + items
	  var index = this.items.indexOf(child)
	  this.items.splice(index, 1)
	  this.node.removeChild(child.node)
	  this.reset()
	}
	
	/**
	 * status: {
	 *   current: {translateY: 0, shown: true},
	 *   next: {translateY: height, shown: true},
	 *   others[]: {shown: false}
	 *   index: index
	 * }
	 */
	Marquee.prototype.reset = function () {
	  var interval = this.interval - 0
	  var delay = this.delay - 0
	  var items = this.items
	  var self = this
	
	  var loop = function () {
	    self.next()
	    self.timerId = setTimeout(loop, self.interval)
	  }
	
	  // reset display and transform
	  items.forEach(function (item, index) {
	    var node = item.node
	    // set non-current(0)|next(1) item hidden
	    node.style.display = index > 1 ? 'none' : ''
	    // set next(1) item translateY
	    // TODO: it supposed to use item.data.style
	    // but somehow the style object is empty.
	    // This problem relies on jsframework's bugfix.
	
	    // node.style.transform = index === 1
	    //     ? 'translate3D(0,' + config.scale * item.data.style.height + 'px,0)'
	    //     : ''
	    // node.style.webkitTransform = index === 1
	    //     ? 'translate3D(0,' + config.scale * item.data.style.height + 'px,0)'
	    //     : ''
	    node.style.transform = index === 1
	        ? 'translate3D(0,' + self.data.scale * self.data.style.height + 'px,0)'
	        : ''
	    node.style.webkitTransform = index === 1
	        ? 'translate3D(0,' + self.data.scale * self.data.style.height + 'px,0)'
	        : ''
	  })
	
	  setTimeout(function () {
	    // reset current, next, index
	    self.currentItem = items[0]
	    self.nextItem = items[1]
	    self.currentIndex = 0
	
	    items.forEach(function (item, index) {
	      var node = item.node
	      // set transition
	      node.style.transition = 'transform '
	          + self.transitionDuration
	          + 'ms ease'
	      node.style.webkitTransition = '-webkit-transform '
	          + self.transitionDuration
	          + 'ms ease'
	    })
	
	    clearTimeout(self.timerId)
	
	    if (items.length > 1) {
	      self.timerId = setTimeout(loop, delay + interval)
	    }
	  }, 13)
	
	}
	
	/**
	 * next:
	 * - current: {translateY: -height}
	 * - next: {translateY: 0}
	 */
	Marquee.prototype.next = function () {
	  // - update state
	  //   - set current and next transition
	  //   - hide current when transition end
	  //   - set next to current
	  //   - find new next
	  var next = this.nextItem.node
	  var current = this.currentItem.node
	  this.transitionIndex = this.currentIndex
	
	  // Use setTimeout to fix the problem that when the
	  // page recover from backstage, the slider will
	  // not work any longer.
	  setTimeout(function () {
	    next.style.transform = 'translate3D(0,0,0)'
	    next.style.webkitTransform = 'translate3D(0,0,0)'
	    current.style.transform = 'translate3D(0,-'
	        + this.data.scale * this.data.style.height
	        + 'px,0)'
	    current.style.webkitTransform = 'translate3D(0,-'
	        + this.data.scale * this.data.style.height
	        + 'px,0)'
	    this.fireEvent('change')
	  }.bind(this), 300)
	}
	
	Marquee.prototype.fireEvent = function (type) {
	  var length = this.items.length
	  var nextIndex = (this.currentIndex + 1) % length
	  var evt = document.createEvent('HTMLEvents')
	  evt.initEvent(type, false, false)
	  evt.data = {
	    prevIndex: this.currentIndex,
	    index: nextIndex
	  }
	  this.node.dispatchEvent(evt)
	}
	
	/**
	 * end:
	 * - old current: {shown: false}
	 * - old current: {translateY: 0}
	 * - index++ % length
	 * - new current = old next
	 * - new next = items[index+1 % length]
	 * - new next: {translateY: height}
	 * - new next: {shown: true}
	 */
	Marquee.prototype.end = function (e) {
	  var target = e.target
	  var items = this.items
	  var length = items.length
	  var current, next
	  var currentIndex, nextIndex
	
	  currentIndex = this.transitionIndex
	
	  if (isNaN(currentIndex)) {
	    return
	  }
	  delete this.transitionIndex
	
	  current = this.currentItem.node
	  current.style.display = 'none'
	  current.style.webkitTransform = ''
	
	  currentIndex = (currentIndex + 1) % length
	  nextIndex = (currentIndex + 1) % length
	
	  this.currentIndex = currentIndex
	  this.currentItem = this.nextItem
	  this.nextItem = items[nextIndex]
	
	  setTimeout(function () {
	    next = this.nextItem.node
	    // TODO: it supposed to use this.nextItem.data.style
	    // but somehow the style object is empty.
	    // This problem relies on jsframework's bugfix.
	
	    next.style.webkitTransform = 'translate3D(0,'
	        + this.data.scale * this.data.style.height
	        + 'px,0)'
	    next.style.display = ''
	    LazyLoad.loadIfNeeded(next)
	  }.bind(this))
	}
	
	Marquee.prototype.attr = {
	  interval: function (value) {
	    this.interval = value
	  },
	  transitionDuration: function (value) {
	    this.transitionDuration = value
	  },
	  delay: function (value) {
	    this.delay = value
	  }
	}
	
	Marquee.prototype.clearAttr = function () {
	  this.interval = 5 * 1000
	  this.transitionDuration = 500
	  this.delay = 0
	}
	
	module.exports = Marquee


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var extend = __webpack_require__(13).extend
	var config = __webpack_require__(11)
	var Component = __webpack_require__(22)
	var ComponentManager = __webpack_require__(15)
	var LazyLoad = __webpack_require__(18)
	__webpack_require__(50)
	__webpack_require__(54)
	
	var DEFAULT_INTERVAL = 3000
	
	function Slider (data) {
	  this.autoPlay = false  // default value is false.
	  this.interval = DEFAULT_INTERVAL
	  this.direction = 'row' // 'column' is not temporarily supported.
	  this.children = []
	  this.isPageShow = true
	  this.isDomRendering = true
	
	  // bind event 'pageshow' and 'pagehide' on window.
	  this._idleWhenPageDisappear()
	  // bind event 'renderBegin' and 'renderEnd' on window.
	  this._idleWhenDomRendering()
	
	  Component.call(this, data)
	}
	
	Slider.prototype = Object.create(Component.prototype)
	
	Slider.prototype._idleWhenPageDisappear = function () {
	  var _this = this
	  window.addEventListener('pageshow', function () {
	    _this.isPageShow = true
	    _this.autoPlay && !_this.isDomRendering && _this.play()
	  })
	  window.addEventListener('pagehide', function () {
	    _this.isPageShow = false
	    _this.stop()
	  })
	}
	
	Slider.prototype._idleWhenDomRendering = function () {
	  var _this = this
	  window.addEventListener('renderend', function () {
	    _this.isDomRendering = false
	    _this.autoPlay && _this.isPageShow && _this.play()
	  })
	  window.addEventListener('renderbegin', function () {
	    _this.isDomRendering = true
	    _this.stop()
	  })
	}
	
	Slider.prototype.attr = {
	  interval: function (val) {
	    this.interval = parseInt(val) || DEFAULT_INTERVAL
	    if (this.carrousel) {
	      this.carrousel.playInterval = this.interval
	    }
	  },
	
	  playstatus: function (val) {
	    this.playstatus = val && val !== 'false' ? true : false
	    this.autoPlay = this.playstatus
	    if (this.carrousel) {
	      if (this.playstatus) {
	        this.play()
	      } else {
	        this.stop()
	      }
	    }
	  },
	
	  // support playstatus' alias auto-play for compatibility
	  autoPlay: function (val) {
	    this.attr.playstatus.call(this, val)
	  }
	}
	
	Slider.prototype.create = function () {
	  var node = document.createElement('div')
	  node.classList.add('slider')
	  node.style.position = 'relative'
	  node.style.overflow = 'hidden'
	  return node
	}
	
	Slider.prototype._doRender = function () {
	  var _this = this
	  _this.createChildren()
	  _this.onAppend()
	}
	
	Slider.prototype.removeChild = function (child) {
	  var children = this.data.children
	  if (children) {
	    for (var i = 0; i < children.length; i++) {
	      if (child.data.ref === children[i].ref) {
	        children.splice(i, 1)
	        break
	      }
	    }
	  }
	
	  this._doRender()
	}
	
	Slider.prototype.insertBefore = function (child, before) {
	  var children = this.data.children
	  // var childIndex = this.children.indexOf(before.data)
	  var childIndex = -1
	  for (var i = 0, l = children.length; i < l; i++) {
	    if (children[i].ref === before.data.ref) {
	      childIndex = i
	      break
	    }
	  }
	  children.splice(childIndex, 0, child.data)
	
	  this._doRender()
	  if (this.children.length > 0) {
	    return this.children[this.children.length - 1]
	  }
	}
	
	Slider.prototype.appendChild = function (data) {
	  var children = this.data.children || (this.data.children = [])
	  children.push(data)
	  this._doRender()
	  if (this.children.length > 0) {
	    return this.children[this.children.length - 1]
	  }
	}
	
	Slider.prototype.createChildren = function () {
	
	  var componentManager = this.getComponentManager()
	
	  // recreate slider container.
	  if (this.sliderContainer) {
	    this.node.removeChild(this.sliderContainer)
	  }
	  if (this.indicator) {
	    this.indicator.node.parentNode.removeChild(this.indicator.node)
	  }
	  this.children = []
	
	  var sliderContainer = document.createElement('ul')
	  sliderContainer.style.listStyle = 'none'
	  this.node.appendChild(sliderContainer)
	  this.sliderContainer = sliderContainer
	
	  var children = this.data.children
	  var scale = this.data.scale
	  var fragment = document.createDocumentFragment()
	  var indicatorData, width, height
	  var childWidth = 0
	  var childHeight = 0
	
	  if (children && children.length) {
	    for (var i = 0; i < children.length; i++) {
	      var child
	      children[i].scale = this.data.scale
	      children[i].instanceId = this.data.instanceId
	      if (children[i].type === 'indicator') {
	        indicatorData = extend(children[i], {
	          extra: {
	            amount: children.length - 1,
	            index: 0
	          }
	        })
	      } else {
	        child = componentManager.createElement(children[i], 'li')
	        this.children.push(child)
	        fragment.appendChild(child.node)
	        width = child.data.style.width || 0
	        height = child.data.style.height || 0
	        width > childWidth && (childWidth = width)
	        height > childHeight && (childHeight = height)
	        child.parentRef = this.data.ref
	      }
	    }
	    // append indicator
	    if (indicatorData) {
	      indicatorData.extra.width = this.data.style.width || childWidth
	      indicatorData.extra.height = this.data.style.height || childHeight
	      this.indicator = componentManager.createElement(indicatorData)
	      this.indicator.parentRef = this.data.ref
	      this.indicator.slider = this
	      this.node.appendChild(this.indicator.node)
	    }
	
	    sliderContainer.style.height = scale * this.data.style.height + 'px'
	    sliderContainer.appendChild(fragment)
	  }
	}
	
	Slider.prototype.onAppend = function () {
	  if (this.carrousel) {
	    this.carrousel.removeEventListener('change', this._getSliderChangeHandler())
	    this.carrousel.stop()
	    this.carrousel = null
	  }
	  this.carrousel = new lib.carrousel(this.sliderContainer, {
	    autoplay: this.autoPlay,
	    useGesture: true
	  })
	
	  this.carrousel.playInterval = this.interval
	  this.carrousel.addEventListener('change', this._getSliderChangeHandler())
	  this.currentIndex = 0
	
	  // preload all images for slider
	  // because:
	  // 1. lib-img doesn't listen to event transitionend
	  // 2. even if we fire lazy load in slider's change event handler,
	  //    the next image still won't be preloaded utill the moment it
	  //    slides into the view, which is too late.
	  if (this.preloadImgsTimer) {
	    clearTimeout(this.preloadImgsTimer)
	  }
	  // The time just before the second slide appear and enough
	  // for all child elements to append is ok.
	  var preloadTime = 0.8
	  this.preloadImgsTimer = setTimeout(function () {
	    var imgs = this.carrousel.element.querySelectorAll('.weex-img')
	    for (var i = 0, l = imgs.length; i < l; i++) {
	      var img = imgs[i]
	      var iLazySrc = img.getAttribute('i-lazy-src')
	      var imgSrc = img.getAttribute('img-src')
	      if (iLazySrc) {
	        img.style.backgroundImage = 'url(' + iLazySrc + ')'
	      } else if (imgSrc) {
	        img.style.backgroundImage = 'url(' + imgSrc + ')'
	      }
	      img.removeAttribute('i-lazy-src')
	      img.removeAttribute('img-src')
	    }
	  }.bind(this), preloadTime * 1000)
	
	  // avoid page scroll when panning
	  var panning = false
	  this.carrousel.element.addEventListener('panstart', function (e) {
	    if (!e.isVertical) {
	      panning = true
	    }
	  })
	  this.carrousel.element.addEventListener('panend', function (e) {
	    if (!e.isVertical) {
	      panning = false
	    }
	  })
	
	  document.addEventListener('touchmove', function (e) {
	    if (panning) {
	      e.preventDefault()
	      return false
	    }
	    return true
	  }.bind(this))
	
	}
	
	Slider.prototype._updateIndicators = function () {
	  this.indicator && this.indicator.setIndex(this.currentIndex)
	}
	
	Slider.prototype._getSliderChangeHandler = function (e) {
	  if (!this.sliderChangeHandler) {
	    this.sliderChangeHandler = (function (e) {
	      var index = this.carrousel.items.index
	      this.currentIndex = index
	
	      // updateIndicators
	      this._updateIndicators()
	
	      this.dispatchEvent('change', { index: index })
	    }).bind(this)
	  }
	  return this.sliderChangeHandler
	}
	
	Slider.prototype.play = function () {
	  this.carrousel.play()
	}
	
	Slider.prototype.stop = function () {
	  this.carrousel.stop()
	}
	
	Slider.prototype.slideTo = function (index) {
	  var offset = index - this.currentIndex
	  this.carrousel.items.slide(offset)
	}
	
	module.exports = Slider


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	(typeof window === 'undefined') && (window = {ctrl: {}, lib: {}});!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});__webpack_require__(51);__webpack_require__(52);__webpack_require__(53);!function(){var a="[data-ctrl-name=carrousel]{position:relative;-webkit-transform:translateZ(1px);-ms-transform:translateZ(1px);transform:translateZ(1px)}",b=document.createElement("style");if(document.getElementsByTagName("head")[0].appendChild(b),b.styleSheet)b.styleSheet.disabled||(b.styleSheet.cssText=a);else try{b.innerHTML=a}catch(c){b.innerText=a}}();!function(a,b,c){function d(a){var b,c={x:0,y:0},d=getComputedStyle(a)[l+"Transform"];return"none"!==d&&(b=d.match(/^matrix3d\((?:[-\d.]+,\s*){12}([-\d.]+),\s*([-\d.]+)(?:,\s*[-\d.]+){2}\)/)||d.match(/^matrix\((?:[-\d.]+,\s*){4}([-\d.]+),\s*([-\d.]+)\)$/))&&(c.x=parseFloat(b[1])||0,c.y=parseFloat(b[2])||0),c}function e(a,b){return a=parseFloat(a),b=parseFloat(b),0!=a&&(a+="px"),0!=b&&(b+="px"),n?"translate3d("+a+", "+b+", 0)":"translate("+a+", "+b+")"}function f(a){return o.call(a)}function g(a,c){function g(a,b){var c=h.createEvent("HTMLEvents");if(c.initEvent(a,!1,!1),b)for(var d in b)c[d]=b[d];n.dispatchEvent(c)}function i(a){for(;0>a;)a+=r;for(;a>=r;)a-=r;return a}function j(a){if(0!==r){var b,c,d=q.get(a);r>1&&(b=q.get(a-1),c=2===r?q.getCloned(a+1):q.get(a+1),d.style.left=-o+"px",b.style.left=-o-s+"px",c.style.left=-o+s+"px"),t=d.index,g("change",{prevItem:b,curItem:d,nextItem:c})}}var k=this,m=Date.now()+"-"+ ++p,n=document.createDocumentFragment();1!==arguments.length||arguments[0]instanceof HTMLElement||(c=arguments[0],a=null),a||(a=document.createElement("ul"),n.appendChild(a)),c=c||{},a.setAttribute("data-ctrl-name","carrousel"),a.setAttribute("data-ctrl-id",m),a.style.position="relative",a.style[l+"Transform"]=e(0,0);var o=0,q={},r=0,s=c.step||a.getBoundingClientRect().width,t=0;q.add=function(b){var c=document.createElement("li");return c.style.display="none",c.style["float"]="left",c.index=r,"string"==typeof b?c.innerHTML=b:b instanceof HTMLElement&&c.appendChild(b),a.appendChild(c),Object.defineProperty(q,r+"",{get:function(){return c}}),r++,c},q.get=function(a){return q[i(a)]},q.getCloned=function(b){function c(a,b,d){var e=a._listeners;if(e){b._listeners=e;for(var f in e)b.addEventListener(f,e[f])}if(d&&a.children&&a.children.length)for(var g=0,h=a.children.length;h>g;g++)c(a.children[g],b.children[g],d)}var b=i(b),d=a.querySelector('[cloned="cloned-'+b+'"]'),e=q[b];return d||(d=e.cloneNode(!0),c(e,d,!0),a.appendChild(d),d.setAttribute("cloned","cloned-"+b),d.index=b),d},q.slide=function(c){if(0!==r){1===r&&(c=0);var f=d(a).x,g=o+s*-c,h=g-f;if(0!==h){new b.animation(400,b.cubicbezier.ease,function(b,c){a.style[l+"Transform"]=e(f+h*c,0)}).play().then(function(){o=g,a.style[l+"Transform"]=e(g,0),c&&j(t+c)})}}},q.next=function(){q.slide(1)},q.prev=function(){q.slide(-1)},f(a.querySelectorAll("li")).forEach(function(a){a.style.position="absolute",a.style.top="0",a.style.left=r*s+"px",a.style["float"]="left",a.index=r,Object.defineProperty(q,r+"",{get:function(){return a}}),r++}),Object.defineProperty(this,"items",{get:function(){return q}}),Object.defineProperty(q,"length",{get:function(){return r}}),Object.defineProperty(q,"index",{get:function(){return t}}),Object.defineProperty(q,"step",{get:function(){return s},set:function(a){s=a}});var u=!1,v=!1,w=!1;this.play=function(){return u?void(v||(v=setTimeout(function(){w=!0,q.next(),setTimeout(function(){w=!1},500),v=setTimeout(arguments.callee,400+z)},400+z))):(u=!0,j(0))},this.stop=function(){v&&(clearTimeout(v),setTimeout(function(){v=!1},500))};var x=!1,y=!1;Object.defineProperty(this,"autoplay",{get:function(){return x},set:function(a){x=!!a,y&&(clearTimeout(y),y=!1),x?y=setTimeout(function(){k.play()},2e3):k.stop()}}),this.autoplay=!!c.autoplay;var z=1500;if(Object.defineProperty(this,"playInterval",{get:function(){return z},set:function(a){z=a}}),this.playInterval=!!c.playInterval||1500,c.useGesture){var A,B=!1;a.addEventListener("panstart",function(a){a.isVertical||B&&w||(a.preventDefault(),a.stopPropagation(),x&&k.stop(),A=0,B=!0)}),a.addEventListener("panmove",function(b){!b.isVertical&&B&&(b.preventDefault(),b.stopPropagation(),A=b.displacementX,a.style[l+"Transform"]=e(o+A,0))}),a.addEventListener("panend",function(a){!a.isVertical&&B&&(a.preventDefault(),a.stopPropagation(),B=!1,a.isflick?0>A?q.next():q.prev():Math.abs(A)<s/2?q.slide(0):q.slide(0>A?1:-1),x&&setTimeout(function(){k.play()},2e3))},!1),a.addEventListener("swipe",function(a){a.isVertical||(a.preventDefault(),a.stopPropagation())})}this.addEventListener=function(a,b){this.root.addEventListener(a,b,!1)},this.removeEventListener=function(a,b){this.root.removeEventListener(a,b,!1)},this.root=n,this.element=a}var h=a.document,i=a.navigator.userAgent,j=!!i.match(/Firefox/i),k=!!i.match(/IEMobile/i),l=j?"Moz":k?"ms":"webkit",m=k?"MSCSSMatrix":"WebKitCSSMatrix",n=!!j||m in a&&"m11"in new a[m],o=Array.prototype.slice,p=0;b.carrousel=g}(window,window.lib,window.ctrl||(window.ctrl={}));;module.exports = window.lib['carrousel'];

/***/ },
/* 51 */
/***/ function(module, exports) {

	(typeof window === 'undefined') && (window = {ctrl: {}, lib: {}});!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});!function(a,b){function c(a){return setTimeout(a,l)}function d(a){clearTimeout(a)}function e(){var a={},b=new m(function(b,c){a.resolve=b,a.reject=c});return a.promise=b,a}function f(a,b){return["then","catch"].forEach(function(c){b[c]=function(){return a[c].apply(a,arguments)}}),b}function g(b){var c,d,h=!1;this.request=function(){h=!1;var g=arguments;return c=e(),f(c.promise,this),d=n(function(){h||c&&c.resolve(b.apply(a,g))}),this},this.cancel=function(){return d&&(h=!0,o(d),c&&c.reject("CANCEL")),this},this.clone=function(){return new g(b)}}function h(a,b){"function"==typeof b&&(b={0:b});for(var c=a/l,d=1/c,e=[],f=Object.keys(b).map(function(a){return parseInt(a)}),h=0;c>h;h++){var i=f[0],j=d*h;if(null!=i&&100*j>=i){var k=b[""+i];k instanceof g||(k=new g(k)),e.push(k),f.shift()}else e.length&&e.push(e[e.length-1].clone())}return e}function i(a){var c;return"string"==typeof a||a instanceof Array?b.cubicbezier?"string"==typeof a?b.cubicbezier[a]&&(c=b.cubicbezier[a]):a instanceof Array&&4===a.length&&(c=b.cubicbezier.apply(b.cubicbezier,a)):console.error("require lib.cubicbezier"):"function"==typeof a&&(c=a),c}function j(a,b,c){var d,g=h(a,c),j=1/(a/l),k=0,m=i(b);if(!m)throw new Error("unexcept timing function");var n=!1;this.play=function(){function a(){var c=j*(k+1).toFixed(10),e=g[k];e.request(c.toFixed(10),b(c).toFixed(10)).then(function(){n&&(k===g.length-1?(n=!1,d&&d.resolve("FINISH"),d=null):(k++,a()))},function(){})}if(!n)return n=!0,d||(d=e(),f(d.promise,this)),a(),this},this.stop=function(){return n?(n=!1,g[k]&&g[k].cancel(),this):void 0}}var k=60,l=1e3/k,m=a.Promise||b.promise&&b.promise.ES6Promise,n=window.requestAnimationFrame||window.msRequestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||c,o=window.cancelAnimationFrame||window.msCancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame||d;(n===c||o===d)&&(n=c,o=d),b.animation=function(a,b,c){return new j(a,b,c)},b.animation.frame=function(a){return new g(a)},b.animation.requestFrame=function(a){var b=new g(a);return b.request()}}(window,window.lib||(window.lib={}));;module.exports = window.lib['animation'];

/***/ },
/* 52 */
/***/ function(module, exports) {

	(typeof window === 'undefined') && (window = {ctrl: {}, lib: {}});!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});!function(a,b){function c(a,b,c,d){function e(a){return(3*k*a+2*l)*a+m}function f(a){return((k*a+l)*a+m)*a}function g(a){return((n*a+o)*a+p)*a}function h(a){for(var b,c,d=a,g=0;8>g;g++){if(c=f(d)-a,Math.abs(c)<j)return d;if(b=e(d),Math.abs(b)<j)break;d-=c/b}var h=1,i=0;for(d=a;h>i;){if(c=f(d)-a,Math.abs(c)<j)return d;c>0?h=d:i=d,d=(h+i)/2}return d}function i(a){return g(h(a))}var j=1e-6,k=3*a-3*c+1,l=3*c-6*a,m=3*a,n=3*b-3*d+1,o=3*d-6*b,p=3*b;return i}b.cubicbezier=c,b.cubicbezier.linear=c(0,0,1,1),b.cubicbezier.ease=c(.25,.1,.25,1),b.cubicbezier.easeIn=c(.42,0,1,1),b.cubicbezier.easeOut=c(0,0,.58,1),b.cubicbezier.easeInOut=c(.42,0,.58,1)}(window,window.lib||(window.lib={}));;module.exports = window.lib['cubicbezier'];

/***/ },
/* 53 */
/***/ function(module, exports) {

	(typeof window === 'undefined') && (window = {ctrl: {}, lib: {}});!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});!function(a){"use strict";function b(a,b){for(var c=a;c;){if(c.contains(b)||c==b)return c;c=c.parentNode}return null}function c(a,b,c){var d=i.createEvent("HTMLEvents");if(d.initEvent(b,!0,!0),"object"==typeof c)for(var e in c)d[e]=c[e];a.dispatchEvent(d)}function d(a,b,c,d,e,f,g,h){var i=Math.atan2(h-f,g-e)-Math.atan2(d-b,c-a),j=Math.sqrt((Math.pow(h-f,2)+Math.pow(g-e,2))/(Math.pow(d-b,2)+Math.pow(c-a,2))),k=[e-j*a*Math.cos(i)+j*b*Math.sin(i),f-j*b*Math.cos(i)-j*a*Math.sin(i)];return{rotate:i,scale:j,translate:k,matrix:[[j*Math.cos(i),-j*Math.sin(i),k[0]],[j*Math.sin(i),j*Math.cos(i),k[1]],[0,0,1]]}}function e(a){0===Object.keys(l).length&&(j.addEventListener("touchmove",f,!1),j.addEventListener("touchend",g,!1),j.addEventListener("touchcancel",h,!1));for(var d=0;d<a.changedTouches.length;d++){var e=a.changedTouches[d],i={};for(var m in e)i[m]=e[m];var n={startTouch:i,startTime:Date.now(),status:"tapping",element:a.srcElement||a.target,pressingHandler:setTimeout(function(b,d){return function(){"tapping"===n.status&&(n.status="pressing",c(b,"longpress",{touch:d,touches:a.touches,changedTouches:a.changedTouches,touchEvent:a})),clearTimeout(n.pressingHandler),n.pressingHandler=null}}(a.srcElement||a.target,a.changedTouches[d]),500)};l[e.identifier]=n}if(2==Object.keys(l).length){var o=[];for(var m in l)o.push(l[m].element);c(b(o[0],o[1]),"dualtouchstart",{touches:k.call(a.touches),touchEvent:a})}}function f(a){for(var e=0;e<a.changedTouches.length;e++){var f=a.changedTouches[e],g=l[f.identifier];if(!g)return;g.lastTouch||(g.lastTouch=g.startTouch),g.lastTime||(g.lastTime=g.startTime),g.velocityX||(g.velocityX=0),g.velocityY||(g.velocityY=0),g.duration||(g.duration=0);var h=Date.now()-g.lastTime,i=(f.clientX-g.lastTouch.clientX)/h,j=(f.clientY-g.lastTouch.clientY)/h,k=70;h>k&&(h=k),g.duration+h>k&&(g.duration=k-h),g.velocityX=(g.velocityX*g.duration+i*h)/(g.duration+h),g.velocityY=(g.velocityY*g.duration+j*h)/(g.duration+h),g.duration+=h,g.lastTouch={};for(var m in f)g.lastTouch[m]=f[m];g.lastTime=Date.now();var n=f.clientX-g.startTouch.clientX,o=f.clientY-g.startTouch.clientY,p=Math.sqrt(Math.pow(n,2)+Math.pow(o,2));("tapping"===g.status||"pressing"===g.status)&&p>10&&(g.status="panning",g.isVertical=!(Math.abs(n)>Math.abs(o)),c(g.element,"panstart",{touch:f,touches:a.touches,changedTouches:a.changedTouches,touchEvent:a,isVertical:g.isVertical}),c(g.element,(g.isVertical?"vertical":"horizontal")+"panstart",{touch:f,touchEvent:a})),"panning"===g.status&&(g.panTime=Date.now(),c(g.element,"panmove",{displacementX:n,displacementY:o,touch:f,touches:a.touches,changedTouches:a.changedTouches,touchEvent:a,isVertical:g.isVertical}),g.isVertical?c(g.element,"verticalpanmove",{displacementY:o,touch:f,touchEvent:a}):c(g.element,"horizontalpanmove",{displacementX:n,touch:f,touchEvent:a}))}if(2==Object.keys(l).length){for(var q,r=[],s=[],t=[],e=0;e<a.touches.length;e++){var f=a.touches[e],g=l[f.identifier];r.push([g.startTouch.clientX,g.startTouch.clientY]),s.push([f.clientX,f.clientY])}for(var m in l)t.push(l[m].element);q=d(r[0][0],r[0][1],r[1][0],r[1][1],s[0][0],s[0][1],s[1][0],s[1][1]),c(b(t[0],t[1]),"dualtouch",{transform:q,touches:a.touches,touchEvent:a})}}function g(a){if(2==Object.keys(l).length){var d=[];for(var e in l)d.push(l[e].element);c(b(d[0],d[1]),"dualtouchend",{touches:k.call(a.touches),touchEvent:a})}for(var i=0;i<a.changedTouches.length;i++){var n=a.changedTouches[i],o=n.identifier,p=l[o];if(p){if(p.pressingHandler&&(clearTimeout(p.pressingHandler),p.pressingHandler=null),"tapping"===p.status&&(p.timestamp=Date.now(),c(p.element,"tap",{touch:n,touchEvent:a}),m&&p.timestamp-m.timestamp<300&&c(p.element,"doubletap",{touch:n,touchEvent:a}),m=p),"panning"===p.status){var q=Date.now(),r=q-p.startTime,s=((n.clientX-p.startTouch.clientX)/r,(n.clientY-p.startTouch.clientY)/r,n.clientX-p.startTouch.clientX),t=n.clientY-p.startTouch.clientY,u=Math.sqrt(p.velocityY*p.velocityY+p.velocityX*p.velocityX),v=u>.5&&q-p.lastTime<100,w={duration:r,isflick:v,velocityX:p.velocityX,velocityY:p.velocityY,displacementX:s,displacementY:t,touch:n,touches:a.touches,changedTouches:a.changedTouches,touchEvent:a,isVertical:p.isVertical};c(p.element,"panend",w),v&&(c(p.element,"swipe",w),p.isVertical?c(p.element,"verticalswipe",w):c(p.element,"horizontalswipe",w))}"pressing"===p.status&&c(p.element,"pressend",{touch:n,touchEvent:a}),delete l[o]}}0===Object.keys(l).length&&(j.removeEventListener("touchmove",f,!1),j.removeEventListener("touchend",g,!1),j.removeEventListener("touchcancel",h,!1))}function h(a){if(2==Object.keys(l).length){var d=[];for(var e in l)d.push(l[e].element);c(b(d[0],d[1]),"dualtouchend",{touches:k.call(a.touches),touchEvent:a})}for(var i=0;i<a.changedTouches.length;i++){var m=a.changedTouches[i],n=m.identifier,o=l[n];o&&(o.pressingHandler&&(clearTimeout(o.pressingHandler),o.pressingHandler=null),"panning"===o.status&&c(o.element,"panend",{touch:m,touches:a.touches,changedTouches:a.changedTouches,touchEvent:a}),"pressing"===o.status&&c(o.element,"pressend",{touch:m,touchEvent:a}),delete l[n])}0===Object.keys(l).length&&(j.removeEventListener("touchmove",f,!1),j.removeEventListener("touchend",g,!1),j.removeEventListener("touchcancel",h,!1))}var i=a.document,j=i.documentElement,k=Array.prototype.slice,l={},m=null;j.addEventListener("touchstart",e,!1)}(window);;module.exports = window.lib['gesturejs'];

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(55);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./slider.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./slider.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".slider {\n  position: relative;\n}\n\n.slider .indicator-container {\n  position: absolute;\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: flex;\n  -webkit-box-align: center;\n  box-align: center;\n  -webkit-align-items: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  box-pack: center;\n  -webkit-justify-content: center;\n  justify-content: center;\n  font-size: 0;\n}\n.slider .indicator-container .indicator {\n  border-radius: 50%;\n}\n.slider .indicator-container.row {\n  -webkit-box-orient: horizontal;\n  box-orient: horizontal;\n  -webkit-flex-direction: row;\n  flex-direction: row;\n}\n.slider .indicator-container.column {\n  -webkit-box-orient: vertical;\n  box-orient: vertical;\n  -webkit-flex-direction: column;\n  flex-direction: column;\n}\n", ""]);
	
	// exports


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var extend = __webpack_require__(13).extend
	var config = __webpack_require__(11)
	var Atomic = __webpack_require__(35)
	var Component = __webpack_require__(22)
	
	__webpack_require__(57)
	
	var DEFAULT_ITEM_COLOR = '#999'
	var DEFAULT_ITEM_SELECTED_COLOR = '#0000ff'
	var DEFAULT_ITEM_SIZE = 20
	var DEFAULT_MARGIN_SIZE = 10
	
	// Style supported:
	//   position: (default - absolute)
	//   itemColor: color of indicator dots
	//   itemSelectedColor: color of the selected indicator dot
	//   itemSize: size of indicators
	//   other layout styles
	function Indicator (data) {
	  this.direction = 'row' // 'column' is not temporarily supported.
	  this.amount = data.extra.amount
	  this.index = data.extra.index
	  this.sliderWidth = data.extra.width
	  this.sliderHeight = data.extra.height
	  var styles = data.style || {}
	  this.data = data
	  this.style.width.call(this, styles.width)
	  this.style.height.call(this, styles.height)
	  this.items = []
	  Atomic.call(this, data)
	}
	
	Indicator.prototype = Object.create(Atomic.prototype)
	
	Indicator.prototype.create = function () {
	  var node = document.createElement('div')
	  node.classList.add('weex-indicators')
	  node.classList.add('weex-element')
	  node.style.position = 'absolute'
	  this.node = node
	  this.style.itemSize.call(this, 0)
	  this.itemColor = DEFAULT_ITEM_COLOR
	  this.itemSelectedColor = DEFAULT_ITEM_SELECTED_COLOR
	  this.updateStyle({
	    left: 0,
	    top: 0,
	    itemSize: 0
	  })
	  return node
	}
	
	Indicator.prototype.createChildren = function () {
	  var root = document.createDocumentFragment()
	  for (var i = 0; i < this.amount; i++) {
	    var indicator = document.createElement('div')
	    indicator.classList.add('weex-indicator')
	    indicator.style.boxSizing = 'border-box'
	    indicator.style.margin = '0 '
	                            + (DEFAULT_MARGIN_SIZE * this.data.scale)
	                            + 'px'
	    indicator.style.width = this.itemSize + 'px'
	    indicator.style.height = this.itemSize + 'px'
	    indicator.setAttribute('index', i)
	    if (this.index === i) {
	      indicator.style.backgroundColor = this.itemSelectedColor
	    } else {
	      indicator.style.backgroundColor = this.itemColor
	    }
	    indicator.addEventListener('click', this._clickHandler.bind(this, i))
	    this.items[i] = indicator
	    root.appendChild(indicator)
	  }
	  this.node.appendChild(root)
	}
	
	Indicator.prototype.style
	    = extend(Object.create(Atomic.prototype.style), {
	  itemColor: function (val) {
	    this.itemColor = val || DEFAULT_ITEM_COLOR
	    for (var i = 0, l = this.items.length; i < l; i++) {
	      this.items[i].style.backgroundColor = this.itemColor
	    }
	  },
	
	  itemSelectedColor: function (val) {
	    this.itemSelectedColor = val || DEFAULT_ITEM_SELECTED_COLOR
	    if (typeof this.index !== 'undefined'
	        && this.items.length > this.index) {
	      this.items[this.index].style.backgroundColor
	          = this.itemSelectedColor
	    }
	  },
	
	  itemSize: function (val) {
	    val = parseInt(val) * this.data.scale
	          || DEFAULT_ITEM_SIZE * this.data.scale
	    this.itemSize = val
	    this.node.style.height = val + 'px'
	    for (var i = 0, l = this.items.length; i < l; i++) {
	      this.items[i].style.width = val + 'px'
	      this.items[i].style.height = val + 'px'
	    }
	  },
	
	  width: function (val) {
	    val = parseInt(val) * this.data.scale || parseInt(this.sliderWidth)
	    this.virtualWrapperWidth = val
	  },
	
	  height: function (val) {
	    val = parseInt(val) * this.data.scale || parseInt(this.sliderHeight)
	    this.virtualWrapperHeight = val
	  },
	
	  top: function (val) {
	    val = this.virtualWrapperHeight / 2 - this.itemSize / 2
	        + val * this.data.scale
	    this.node.style.bottom = ''
	    this.node.style.top = val + 'px'
	  },
	
	  bottom: function (val) {
	    val = this.virtualWrapperHeight / 2 - this.itemSize / 2
	        + val * this.data.scale
	    this.node.style.top = ''
	    this.node.style.bottom = val + 'px'
	  },
	
	  left: function (val) {
	    val = this.virtualWrapperWidth / 2
	          - (this.itemSize + 2 * DEFAULT_MARGIN_SIZE * this.data.scale)
	              * this.amount / 2
	          + val * this.data.scale
	    this.node.style.right = ''
	    this.node.style.left = val + 'px'
	  },
	
	  right: function (val) {
	    val = this.virtualWrapperWidth / 2
	          - (this.itemSize + 2 * DEFAULT_MARGIN_SIZE * this.data.scale)
	              * this.amount / 2
	          + val * this.data.scale
	    this.node.style.left = ''
	    this.node.style.right = val + 'px'
	  }
	})
	
	Indicator.prototype.setIndex = function (idx) {
	  if (idx >= this.amount) {
	    return
	  }
	  var prev = this.items[this.index]
	  var cur = this.items[idx]
	  prev.classList.remove('active')
	  prev.style.backgroundColor = this.itemColor
	  cur.classList.add('active')
	  cur.style.backgroundColor = this.itemSelectedColor
	  this.index = idx
	}
	
	Indicator.prototype._clickHandler = function (idx) {
	  this.slider.slideTo(idx)
	}
	
	module.exports = Indicator


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(58);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./indicator.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./indicator.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-indicators {\n  position: absolute;\n  white-space: nowrap;\n}\n.weex-indicators .weex-indicator {\n  float: left;\n  border-radius: 50%;\n}\n", ""]);
	
	// exports


/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(35)
	var msgQueue = __webpack_require__(60)
	var config = __webpack_require__(11)
	var utils = __webpack_require__(13)
	
	// TODO: refactor this scss code since this is strongly
	// dependent on lib.flexible other than the value of
	// scale.
	__webpack_require__(61)
	
	function TabHeader(data) {
	  Atomic.call(this, data)
	}
	
	var proto = TabHeader.prototype = Object.create(Atomic.prototype)
	
	proto.create = function () {
	  // outside container.
	  var node = document.createElement('div')
	  node.className = 'tab-header'
	  // tip on the top.
	  var bar = document.createElement('div')
	  bar.className = 'header-bar'
	  bar.textContent = 'CHANGE FLOOR'
	  // middle layer.
	  var body = document.createElement('div')
	  body.className = 'header-body'
	  var box = document.createElement('ul')
	  box.className = 'tabheader'
	
	  body.appendChild(box)
	  node.appendChild(bar)
	  node.appendChild(body)
	  this._bar = bar
	  this._body = body
	  this.box = box
	  this.node = node
	  // init events.
	  this._initFoldBtn()
	  this._initEvent()
	  return node
	}
	
	proto._initFoldBtn = function () {
	  var _this = this
	  var node = this.node
	  var btn = document.createElement('span')
	  btn.className = 'fold-toggle iconfont'
	  btn.innerHTML = '&#xe661;'
	  node.appendChild(btn)
	
	  btn.addEventListener('click', function () {
	    if (_this.unfolding) {
	      _this._folding()
	    } else {
	      _this._unfolding()
	    }
	  })
	}
	
	proto._initMask = function () {
	  var mask = document.createElement('div')
	  mask.className = 'tabheader-mask'
	  this.mask = mask
	  // stop default behavior: page moving.
	  mask.addEventListener('touchmove', function (evt) {
	    evt.preventDefault()
	  })
	  // click to unfold.
	  var _this = this
	  mask.addEventListener('click', function () {
	    _this._folding()
	  })
	
	  document.body.appendChild(mask)
	}
	
	proto._unfolding = function () {
	  // mark the initial posiiton of tabheader
	  if (!this.flag) {
	    var flag = document.createComment('tabheader')
	    this.flag = flag
	    this.node.parentNode.insertBefore(flag, this.node)
	  }
	  if (!this.mask) {
	    this._initMask()
	  }
	
	  // record the scroll position.
	  this._scrollVal = this._body.scrollLeft
	  // record the position in document.
	  this._topVal = this.node.getBoundingClientRect().top
	  this._styleTop = this.node.style.top
	
	  document.body.appendChild(this.node)
	  this.node.classList.add('unfold-header')
	  this.node.style.height = 'auto'
	  // recalc the position when it is unfolded.
	  var thHeight = this.node.getBoundingClientRect().height
	  if (thHeight + this._topVal > window.innerHeight) {
	    this._topVal = this._topVal
	        + (window.innerHeight - thHeight - this._topVal)
	  }
	
	  this.node.style.top = this._topVal + 'px'
	  // process mask style
	  this.mask.classList.add('unfold-header')
	  this.mask.style.height = window.innerHeight + 'px'
	  this.unfolding = true
	}
	
	proto._folding = function () {
	  if (this.unfolding !== true) {
	    return
	  }
	
	  this.mask.classList.remove('unfold-header')
	  this.node.classList.remove('unfold-header')
	
	  this.node.style.height = ''
	  this.node.style.top = this._styleTop
	
	  // recover the position of tabheader.
	  this.flag.parentNode.insertBefore(this.node, this.flag)
	  // recover the position of scoller.
	  this._body.scrollLeft = this._scrollVal
	
	  this._scrollToView()
	  this.unfolding = false
	}
	
	proto._initEvent = function () {
	  this._initClickEvent()
	  this._initSelectEvent()
	}
	
	// init events.
	proto._initClickEvent = function () {
	  var box = this.box
	  var _this = this
	
	  box.addEventListener('click', function (evt) {
	    var target = evt.target
	    if (target.nodeName === 'UL') {
	      return
	    }
	
	    if (target.parentNode.nodeName === 'LI') {
	      target = target.parentNode
	    }
	
	    var floor = target.getAttribute('data-floor')
	
	    if (_this.data.attr.selectedIndex == floor) {
	      // Duplicated clicking, not to trigger select event.
	      return
	    }
	
	    fireEvent(target, 'select', {index:  floor})
	  })
	}
	
	proto._initSelectEvent = function () {
	  var node = this.node
	  var _this = this
	  node.addEventListener('select', function (evt) {
	    var index
	    if (evt.index !== undefined) {
	      index = evt.index
	    } else if (evt.data && evt.data.index !== undefined) {
	      index = evt.data.index
	    }
	
	    if (index === undefined) {
	      return
	    }
	
	    _this.attr.selectedIndex.call(_this, index)
	  })
	}
	
	proto.attr = {
	  highlightIcon: function () {
	    return createHighlightIcon()
	  },
	  data: function () {
	    var attr = this.data.attr
	    // Ensure there is a default selected value.
	    if (attr.selectedIndex === undefined) {
	      attr.selectedIndex = 0
	    }
	
	    var list = attr.data || []
	    var curItem = attr.selectedIndex
	
	    var ret = []
	    var itemTmpl = '<li class="th-item" data-floor="{{floor}}">'
	        + '{{hlIcon}}{{floorName}}</li>'
	
	    list.forEach(function (item, idx) {
	      var html = itemTmpl.replace('{{floor}}', idx)
	      if (curItem == idx) {
	        html = html.replace('{{hlIcon}}', createHighlightIcon())
	      } else {
	        html = html.replace('{{hlIcon}}', '')
	      }
	
	      html = html.replace('{{floorName}}', item)
	
	      ret.push(html)
	    }, this)
	
	    this.box.innerHTML = ret.join('')
	  },
	  selectedIndex: function (val) {
	    var attr = this.data.attr
	
	    if (val === undefined) {
	      val = 0
	    }
	
	    // if (val == attr.selectedIndex) {
	    //   return
	    // }
	
	    attr.selectedIndex = val
	
	    this.attr.data.call(this)
	
	    this._folding()
	    this.style.textHighlightColor.call(this, this.textHighlightColor)
	  }
	}
	
	proto.style = Object.create(Atomic.prototype.style)
	
	proto.style.opacity = function (val) {
	  if (val === undefined || val < 0 || val > 1) {
	    val = 1
	  }
	
	  this.node.style.opacity = val
	}
	
	proto.style.textColor = function (val) {
	  if (!isValidColor(val)) {
	    return
	  }
	
	  this.node.style.color = val
	}
	
	proto.style.textHighlightColor = function (val) {
	  if (!isValidColor(val)) {
	    return
	  }
	  this.textHighlightColor = val
	  var attr = this.data.attr
	
	  var node = this.node.querySelector('[data-floor="'
	      + attr.selectedIndex + '"]')
	  if (node) {
	    node.style.color = val
	    this._scrollToView(node)
	  }
	}
	
	proto._scrollToView = function (node) {
	  if (!node) {
	    var attr = this.data.attr
	    node = this.node.querySelector('[data-floor="' + attr.selectedIndex + '"]')
	  }
	  if (!node) {
	    return
	  }
	
	  var defaultVal = this._body.scrollLeft
	  var leftVal = defaultVal  - node.offsetLeft + 300
	
	  var scrollVal = getScrollVal(this._body.getBoundingClientRect(), node)
	  doScroll(this._body, scrollVal)
	}
	
	// scroll the tabheader.
	// positive val means to scroll right.
	// negative val means to scroll left.
	function doScroll(node, val, finish) {
	  if (!val) {
	    return
	  }
	  if (finish === undefined) {
	    finish = Math.abs(val)
	  }
	
	  if (finish <= 0) {
	    return
	  }
	
	  setTimeout(function () {
	    if (val > 0) {
	      node.scrollLeft += 2
	    } else {
	      node.scrollLeft -= 2
	    }
	    finish -= 2
	
	    doScroll(node, val, finish)
	  })
	}
	
	// get scroll distance.
	function getScrollVal(rect, node) {
	  var left = node.previousSibling
	  var right = node.nextSibling
	  var scrollVal
	
	  // process left-side element first.
	  if (left) {
	    var leftRect = left.getBoundingClientRect()
	    // only need to compare the value of left.
	    if (leftRect.left < rect.left) {
	      scrollVal = leftRect.left
	      return scrollVal
	    }
	  }
	
	  if (right) {
	    var rightRect = right.getBoundingClientRect()
	    // compare the value of right.
	    if (rightRect.right > rect.right) {
	      scrollVal = rightRect.right - rect.right
	      return scrollVal
	    }
	  }
	
	  // process current node, from left to right.
	  var nodeRect = node.getBoundingClientRect()
	  if (nodeRect.left < rect.left) {
	    scrollVal = nodeRect.left
	  } else if (nodeRect.right > rect.right) {
	    scrollVal = nodeRect.right - rect.right
	  }
	
	  return scrollVal
	}
	
	// trigger and broadcast events.
	function fireEvent(element, type, data) {
	  var evt = document.createEvent('Event')
	  evt.data = data
	  utils.extend(evt, data)
	  // need bubble.
	  evt.initEvent(type, true, true)
	
	  element.dispatchEvent(evt)
	}
	
	function createHighlightIcon(code) {
	  var html = '<i class="hl-icon iconfont">' + '&#xe650' + '</i>'
	  return html
	}
	
	function isValidColor(color) {
	  if (!color) {
	    return false
	  }
	
	  if (color.charAt(0) !== '#') {
	    return false
	  }
	
	  if (color.length !== 7) {
	    return false
	  }
	
	  return true
	}
	
	module.exports = TabHeader


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var config = __webpack_require__(11)
	var messageQueue = []
	
	function flushMessage() {
	  if (typeof callJS === 'function' && messageQueue.length > 0) {
	    callJS(config.instanceId, JSON.stringify(messageQueue))
	    messageQueue.length = 0
	  }
	}
	
	function push(msg) {
	  messageQueue.push(msg)
	}
	
	/**
	 * To fix the problem of callapp, the two-way time loop mechanism must
	 * be replaced by directly procedure call except the situation of
	 * page loading.
	 * 2015-11-03
	 */
	function pushDirectly(msg) {
	  callJS(config.instanceId, [msg])
	}
	
	module.exports = {
	  push: pushDirectly
	}


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(62);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./tabheader.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./tabheader.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".tab-header {\n  position: relative;\n  width: 10rem;\n  font-size: 14px;\n  color: #333;\n}\n.tab-header .header-bar {\n  height: 1.17rem;\n  line-height: 1.17rem;\n  display: none;\n  color: #999;\n  padding-left: 0.4rem;\n}\n.tab-header .header-body {\n  margin-right: 1.07rem;\n  overflow-x: auto;\n  overflow-y: hidden;\n}\n.tab-header .header-body::-webkit-scrollbar {\n  width: 0;\n  height: 0;\n  overflow: hidden;\n}\n.tab-header .fold-toggle {\n  position: absolute;\n  top: 0.59rem;\n  -webkit-transform: translateY(-50%);\n  right: 0.29rem;\n  width: 0.48rem;\n  height: 0.48rem;\n  line-height: 0.48rem;\n  text-align: center;\n  z-index: 99;\n  font-size: 14px;\n}\n.tab-header.unfold-header {\n  position: fixed !important;\n  top: 0;\n  left: 0;\n  overflow: hidden;\n}\n\n.tabheader {\n  list-style: none;\n  white-space: nowrap;\n  height: 1.17rem;\n  line-height: 1.17rem;\n}\n.tabheader .th-item {\n  padding-left: 0.72rem;\n  position: relative;\n  display: inline-block;\n}\n.tabheader .hl-icon {\n  width: 0.4rem;\n  height: 0.4rem;\n  line-height: 0.4rem;\n  text-align: center;\n  position: absolute;\n  top: 50%;\n  -webkit-transform: translateY(-50%);\n  left: 0.24rem;\n  font-size: 14px;\n}\n\n.unfold-header .header-bar {\n  display: block;\n}\n.unfold-header .fold-toggle {\n  -webkit-transform: translateY(-50%) rotate(180deg);\n}\n.unfold-header .header-body {\n  margin-right: 0;\n  padding: 0.24rem;\n}\n.unfold-header .tabheader {\n  display: block;\n  height: auto;\n}\n.unfold-header .th-item {\n  box-sizing: border-box;\n  float: left;\n  width: 33.3333%;\n  height: 1.01rem;\n  line-height: 1.01rem;\n}\n.unfold-header .hl-icon {\n  margin-right: 0;\n  position: absolute;\n}\n.unfold-header.tabheader-mask {\n  display: block;\n  width: 100%;\n  height: 100%;\n  background-color: rgba(0, 0, 0, 0.6);\n}\n\n.tabheader-mask {\n  display: none;\n  position: fixed;\n  left: 0;\n  top: 0;\n}\n\n@font-face {\n  font-family: \"iconfont\";\n  src: url(\"data:application/x-font-ttf;charset=utf-8;base64,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R7AEQ7CAYmAgsAArIIqKYSCwAkNgZCOwA0NhZFBYsAJDYRuwA0NgWbADJbCAYmGwAiVGYTgjIDwjOBshICBGI0ewACsjYTghWbEkARQrLbA7LLAuKy6xJAEUKy2wPCywLyshIyAgPLAEI0IjOLEkARQrsARDLrAkKy2wPSywABUgR7AAI0KyAAEBFRQTLrAqKi2wPiywABUgR7AAI0KyAAEBFRQTLrAqKi2wPyyxAAEUE7ArKi2wQCywLSotsEEssAAWRSMgLiBGiiNhOLEkARQrLbBCLLAJI0KwQSstsEMssgAAOistsEQssgABOistsEUssgEAOistsEYssgEBOistsEcssgAAOystsEgssgABOystsEkssgEAOystsEossgEBOystsEsssgAANystsEwssgABNystsE0ssgEANystsE4ssgEBNystsE8ssgAAOSstsFAssgABOSstsFEssgEAOSstsFIssgEBOSstsFMssgAAPCstsFQssgABPCstsFUssgEAPCstsFYssgEBPCstsFcssgAAOCstsFgssgABOCstsFkssgEAOCstsFossgEBOCstsFsssDArLrEkARQrLbBcLLAwK7A0Ky2wXSywMCuwNSstsF4ssAAWsDArsDYrLbBfLLAxKy6xJAEUKy2wYCywMSuwNCstsGEssDErsDUrLbBiLLAxK7A2Ky2wYyywMisusSQBFCstsGQssDIrsDQrLbBlLLAyK7A1Ky2wZiywMiuwNistsGcssDMrLrEkARQrLbBoLLAzK7A0Ky2waSywMyuwNSstsGossDMrsDYrLbBrLCuwCGWwAyRQeLABFTAtAABLuADIUlixAQGOWbkIAAgAYyCwASNEILADI3CwDkUgIEu4AA5RS7AGU1pYsDQbsChZYGYgilVYsAIlYbABRWMjYrACI0SzCgkFBCuzCgsFBCuzDg8FBCtZsgQoCUVSRLMKDQYEK7EGAUSxJAGIUViwQIhYsQYDRLEmAYhRWLgEAIhYsQYBRFlZWVm4Af+FsASNsQUARAAAAA==\") format(\"truetype\");\n}\n.iconfont {\n  font-family: iconfont !important;\n  font-size: 16px;\n  font-style: normal;\n  -webkit-font-smoothing: antialiased;\n  -webkit-text-stroke-width: 0.2px;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n[data-dpr=\"2\"] .tab-header {\n  font-size: 28px;\n}\n\n[data-dpr=\"3\"] .tab-header {\n  font-size: 42px;\n}\n\n[data-dpr=\"2\"] .tabheader .hl-icon {\n  font-size: 28px;\n}\n\n[data-dpr=\"3\"] .tabheader .hl-icon {\n  font-size: 42px;\n}\n\n[data-dpr=\"2\"] .tab-header .fold-toggle {\n  font-size: 28px;\n}\n\n[data-dpr=\"3\"] .tab-header .fold-toggle {\n  font-size: 42px;\n}\n", ""]);
	
	// exports


/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	__webpack_require__(64)
	__webpack_require__(43)
	
	// lib.scroll events:
	//  - scrollstart
	//  - scrolling
	//  - pulldownend
	//  - pullupend
	//  - pullleftend
	//  - pullrightend
	//  - pulldown
	//  - pullup
	//  - pullleft
	//  - pullright
	//  - contentrefresh
	
	var Component = __webpack_require__(22)
	var utils = __webpack_require__(13)
	
	var directionMap = {
	  h: ['row', 'horizontal', 'h', 'x'],
	  v: ['column', 'vertical', 'v', 'y']
	}
	
	var DEFAULT_DIRECTION = 'column'
	
	// attrs:
	//  - scroll-direciton: none|vertical|horizontal (default is vertical)
	//  - show-scrollbar: true|false (default is true)
	function Scroller (data, nodeType) {
	  var attrs = data.attr || {}
	  var direction = attrs.scrollDirection
	    || attrs.direction
	    || DEFAULT_DIRECTION
	  this.direction = directionMap.h.indexOf(direction) === -1
	    ? 'v'
	    : 'h'
	  this.showScrollbar = attrs.showScrollbar || true
	  Component.call(this, data, nodeType)
	}
	
	Scroller.prototype = Object.create(Component.prototype)
	
	Scroller.prototype.create = function (nodeType) {
	  var Scroll = lib.scroll
	  var node = Component.prototype.create.call(this, nodeType)
	  node.classList.add('weex-container', 'scroll-wrap')
	  this.scrollElement = document.createElement('div')
	  this.scrollElement.classList.add(
	    'weex-container',
	    'scroll-element',
	    this.direction + '-scroller'
	  )
	
	  // Flex will cause a bug to rescale children's size if their total
	  // size exceed the limit of their parent. So to use box instead.
	  this.scrollElement.style.display = '-webkit-box'
	  this.scrollElement.style.display = 'box'
	  this.scrollElement.style.webkitBoxOrient = this.direction === 'h'
	    ? 'horizontal'
	    : 'vertical'
	  this.scrollElement.style.boxOrient = this.scrollElement.style.webkitBoxOrient
	
	  node.appendChild(this.scrollElement)
	  this.scroller = new Scroll({
	    // if the direction is x, then the bounding rect of the scroll element
	    // should be got by the 'Range' API other than the 'getBoundingClientRect'
	    // API, because the width outside the viewport won't be count in by
	    // 'getBoundingClientRect'.
	    // Otherwise should use the element rect in case there is a child scroller
	    // or list in this scroller. If using 'Range', the whole scroll element
	    // including the hiding part will be count in the rect.
	    useElementRect: this.direction === 'v',
	    scrollElement: this.scrollElement,
	    direction: this.direction === 'h' ? 'x' : 'y'
	  })
	  this.scroller.init()
	  this.offset = 0
	  return node
	}
	
	Scroller.prototype.bindEvents = function (evts) {
	  Component.prototype.bindEvents.call(this, evts)
	  // to enable lazyload for Images
	  this.scroller.addEventListener('scrolling', function (e) {
	    var so = e.scrollObj
	    var scrollTop = so.getScrollTop()
	    var scrollLeft = so.getScrollLeft()
	    var offset = this.direction === 'v' ? scrollTop : scrollLeft
	    var diff = offset - this.offset
	    var dir
	    if (diff >= 0) {
	      dir = this.direction === 'v' ? 'up' : 'left'
	    } else {
	      dir = this.direction === 'v' ? 'down' : 'right'
	    }
	    this.dispatchEvent('scroll', {
	      originalType: 'scrolling',
	      scrollTop: so.getScrollTop(),
	      scrollLeft: so.getScrollLeft(),
	      offset: offset,
	      direction: dir
	    }, {
	      bubbles: true
	    })
	    this.offset = offset
	  }.bind(this))
	
	  var pullendEvent = 'pull'
	    + ({ v: 'up', h: 'left' })[this.direction]
	    + 'end'
	  this.scroller.addEventListener(pullendEvent, function (e) {
	    this.dispatchEvent('loadmore')
	  }.bind(this))
	}
	
	Scroller.prototype.createChildren = function () {
	  var children = this.data.children
	  var parentRef = this.data.ref
	  var componentManager = this.getComponentManager()
	  if (children && children.length) {
	    var fragment = document.createDocumentFragment()
	    var isFlex = false
	    for (var i = 0; i < children.length; i++) {
	      children[i].instanceId = this.data.instanceId
	      children[i].scale = this.data.scale
	      var child = componentManager.createElement(children[i])
	      fragment.appendChild(child.node)
	      child.parentRef = parentRef
	      if (!isFlex
	          && child.data.style
	          && child.data.style.hasOwnProperty('flex')
	        ) {
	        isFlex = true
	      }
	    }
	    this.scrollElement.appendChild(fragment)
	  }
	  // wait for fragment to appended on scrollElement on UI thread.
	  setTimeout(function () {
	    this.scroller.refresh()
	  }.bind(this), 0)
	}
	
	Scroller.prototype.appendChild = function (data) {
	  var children = this.data.children
	  var componentManager = this.getComponentManager()
	  var child = componentManager.createElement(data)
	  this.scrollElement.appendChild(child.node)
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh()
	  }.bind(this), 0)
	
	  // update this.data.children
	  if (!children || !children.length) {
	    this.data.children = [data]
	  } else {
	    children.push(data)
	  }
	
	  return child
	}
	
	Scroller.prototype.insertBefore = function (child, before) {
	  var children = this.data.children
	  var i = 0
	  var isAppend = false
	
	  // update this.data.children
	  if (!children || !children.length || !before) {
	    isAppend = true
	  } else {
	    for (var l = children.length; i < l; i++) {
	      if (children[i].ref === before.data.ref) {
	        break
	      }
	    }
	    if (i === l) {
	      isAppend = true
	    }
	  }
	
	  if (isAppend) {
	    this.scrollElement.appendChild(child.node)
	    children.push(child.data)
	  } else {
	    if (before.fixedPlaceholder) {
	      this.scrollElement.insertBefore(child.node, before.fixedPlaceholder)
	    } else {
	      this.scrollElement.insertBefore(child.node, before.node)
	    }
	    children.splice(i, 0, child.data)
	  }
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh()
	  }.bind(this), 0)
	}
	
	Scroller.prototype.removeChild = function (child) {
	  var children = this.data.children
	  // remove from this.data.children
	  var i = 0
	  var componentManager = this.getComponentManager()
	  if (children && children.length) {
	    for (var l = children.length; i < l; i++) {
	      if (children[i].ref === child.data.ref) {
	        break
	      }
	    }
	    if (i < l) {
	      children.splice(i, 1)
	    }
	  }
	  // remove from componentMap recursively
	  componentManager.removeElementByRef(child.data.ref)
	  if (child.fixedPlaceholder) {
	    this.scrollElement.removeChild(child.fixedPlaceholder)
	  }
	  child.node.parentNode.removeChild(child.node)
	
	  // wait for UI thread to update.
	  setTimeout(function () {
	    this.scroller.refresh()
	  }.bind(this), 0)
	}
	
	module.exports = Scroller


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(65);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./scroller.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./scroller.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".scroll-wrap {\n  display: block;\n  overflow: hidden;\n}\n\n.scroll-element.horizontal {\n  -webkit-box-orient: horizontal;\n  -webkit-flex-direction: row;\n  flex-direction: row;\n}\n.scroll-element.vertical {\n  -webkit-box-orient: vertical;\n  -webkit-flex-direction: column;\n  flex-direction: column;\n}\n", ""]);
	
	// exports


/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(35)
	var utils = __webpack_require__(13)
	
	// attrs:
	//   - type: text|password|tel|email|url
	//   - value
	//   - placeholder
	//   - disabled
	//   - autofocus
	function Input (data) {
	  var attrs = data.attr || {}
	  this.type = attrs.type || 'text'
	  this.value = attrs.value
	  this.placeholder = attrs.placeholder
	  this.autofocus = attrs.autofocus && (attrs.autofocus !== 'false')
	                    ? true
	                    : false
	  Atomic.call(this, data)
	}
	
	Input.prototype = Object.create(Atomic.prototype)
	
	Input.prototype.create = function () {
	  var node = document.createElement('input')
	  var uuid = Math.floor(10000000000000 * Math.random()) + Date.now()
	  this.className = 'weex-ipt-' + uuid
	  this.styleId = 'weex-style-' + uuid
	  node.classList.add(this.className)
	  node.setAttribute('type', this.type)
	  node.type = this.type
	  // For the consistency of input component's width.
	  // The date and time type of input will have a bigger width
	  // when the 'box-sizing' is not set to 'border-box'
	  node.classList.add('weex-element')
	  this.value && (node.value = this.value)
	  this.placeholder && (node.placeholder = this.placeholder)
	  return node
	}
	
	Input.prototype.updateStyle = function (style) {
	  Atomic.prototype.updateStyle.call(this, style)
	  if (style && style.placeholderColor) {
	    this.placeholderColor = style.placeholderColor
	    this.setPlaceholderColor()
	  }
	}
	
	Input.prototype.attr = {
	  disabled: function (val) {
	    this.node.disabled = val && val !== 'false'
	                    ? true
	                    : false
	  }
	}
	
	Input.prototype.setPlaceholderColor = function () {
	  if (!this.placeholderColor) {
	    return
	  }
	  var vendors = [
	    '::-webkit-input-placeholder',
	    ':-moz-placeholder',
	    '::-moz-placeholder',
	    ':-ms-input-placeholder',
	    ':placeholder-shown'
	  ]
	  var css = ''
	  var cssRule = 'color: ' + this.placeholderColor + ';'
	  for (var i = 0, l = vendors.length; i < l; i++) {
	    css += '.' + this.className + vendors[i] + '{'
	           + cssRule + '}'
	  }
	  utils.appendStyle(css, this.styleId, true)
	}
	
	module.exports = Input


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(22)
	var sender = __webpack_require__(26)
	
	// attrs:
	//   - options: the options to be listed, as a array of strings.
	//   - selectedIndex: the selected options' index number.
	//   - disabled
	function Select (data) {
	  var attrs = data.attr || {}
	  this.options = []
	  this.selectedIndex = 0
	  Atomic.call(this, data)
	}
	
	Select.prototype = Object.create(Atomic.prototype)
	
	Select.prototype.create = function () {
	  var node = document.createElement('select')
	  var uuid = Math.floor(10000000000000 * Math.random()) + Date.now()
	  this.className = 'weex-slct-' + uuid
	  this.styleId = 'weex-style-' + uuid
	  node.classList.add(this.className)
	  // For the consistency of input component's width.
	  // The date and time type of input will have a bigger width
	  // when the 'box-sizing' is not set to 'border-box'
	  node.style['box-sizing'] = 'border-box'
	  return node
	}
	
	Select.prototype.attr = {
	  disabled: function (val) {
	    this.node.disabled = val && val !== 'false'
	                    ? true
	                    : false
	  },
	  options: function (val) {
	    if (Object.prototype.toString.call(val) !== '[object Array]') {
	      return
	    }
	    this.options = val
	    this.node.innerHTML = ''
	    this.createOptions(val)
	  },
	  selectedIndex: function (val) {
	    val = parseInt(val)
	    if (typeof val !== 'number' || val !== val || val >= this.options.length) {
	      return
	    }
	    this.node.value = this.options[val]
	  }
	}
	
	Select.prototype.bindEvents = function (evts) {
	  var isListenToChange = false
	  Atomic.prototype.bindEvents.call(
	      this,
	      evts.filter(function (val) {
	        var pass = val !== 'change'
	        !pass && (isListenToChange = true)
	        return pass
	      }))
	  if (isListenToChange) {
	    this.node.addEventListener('change', function (e) {
	      e.index = this.options.indexOf(this.node.value)
	      sender.fireEvent(this.data.ref, 'change', e)
	    }.bind(this))
	  }
	}
	
	Select.prototype.createOptions = function (opts) {
	  var optDoc = document.createDocumentFragment()
	  var opt
	  for (var i = 0, l = opts.length; i < l; i++) {
	    opt = document.createElement('option')
	    opt.appendChild(document.createTextNode(opts[i]))
	    optDoc.appendChild(opt)
	  }
	  this.node.appendChild(optDoc)
	}
	
	module.exports = Select


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(35)
	
	// attrs:
	//   - value
	//   - disabled
	function Datepicker (data) {
	  Atomic.call(this, data)
	}
	
	Datepicker.prototype = Object.create(Atomic.prototype)
	
	Datepicker.prototype.create = function () {
	  var node = document.createElement('input')
	  var uuid = Math.floor(10000000000000 * Math.random()) + Date.now()
	  this.className = 'weex-ipt-' + uuid
	  this.styleId = 'weex-style-' + uuid
	  node.classList.add(this.className)
	  node.setAttribute('type', 'date')
	  node.type = 'date'
	  // For the consistency of input component's width.
	  // The date and time type of input will have a bigger width
	  // when the 'box-sizing' is not set to 'border-box'
	  node.classList.add('weex-element')
	  return node
	}
	
	Datepicker.prototype.attr = {
	  disabled: function (val) {
	    this.node.disabled = val && val !== 'false'
	                    ? true
	                    : false
	  }
	}
	
	module.exports = Datepicker


/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(35)
	
	// attrs:
	//   - value
	//   - disabled
	function Timepicker (data) {
	  Atomic.call(this, data)
	}
	
	Timepicker.prototype = Object.create(Atomic.prototype)
	
	Timepicker.prototype.create = function () {
	  var node = document.createElement('input')
	  var uuid = Math.floor(10000000000000 * Math.random()) + Date.now()
	  this.className = 'weex-ipt-' + uuid
	  this.styleId = 'weex-style-' + uuid
	  node.classList.add(this.className)
	  node.setAttribute('type', 'time')
	  node.type = 'time'
	  // For the consistency of input component's width.
	  // The date and time type of input will have a bigger width
	  // when the 'box-sizing' is not set to 'border-box'
	  node.classList.add('weex-element')
	  return node
	}
	
	Timepicker.prototype.attr = {
	  disabled: function (val) {
	    this.node.disabled = val && val !== 'false'
	                    ? true
	                    : false
	  }
	}
	
	module.exports = Timepicker


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(35)
	var utils = __webpack_require__(13)
	__webpack_require__(71)
	
	// attrs:
	//   - autoPlay: true | false (default: false)
	//   - playStatus: play | pause | stop
	//   - src: {string}
	//   - poster: {string}
	//   - loop: true | false (default: false)
	//   - muted: true | false (default: false)
	// events:
	//   - start
	//   - pause
	//   - finish
	//   - fail
	function Video (data) {
	  var autoPlay = data.attr.autoPlay
	  var playStatus = data.attr.playStatus
	  this.autoPlay = autoPlay === true || autoPlay === 'true'
	  if (playStatus !== 'play'
	      && playStatus !== 'stop'
	      && playStatus !== 'pause') {
	    this.playStatus = 'pause'
	  } else {
	    this.playStatus = playStatus
	  }
	  Atomic.call(this, data)
	}
	
	Video.prototype = Object.create(Atomic.prototype)
	
	Video.prototype.attr = {
	  playStatus: function (val) {
	    if (val !== 'play' && val !== 'stop' && val !== 'pause') {
	      val = 'pause'
	    }
	    if (this.playStatus === val) {
	      return
	    }
	    this.playStatus = val
	    this.node.setAttribute('play-status', val)
	    this[this.playStatus]()
	  },
	  autoPlay: function (val) {
	    // DO NOTHING
	  }
	}
	
	Video.prototype.create = function () {
	  var node = document.createElement('video')
	  node.classList.add('weex-video', 'weex-element')
	  node.controls = true
	  node.autoplay = this.autoPlay
	  node.setAttribute('play-status', this.playStatus)
	  this.node = node
	  if (this.autoPlay && this.playStatus === 'play') {
	    this.play()
	  }
	  return node
	}
	
	Video.prototype.bindEvents = function (evts) {
	  Atomic.prototype.bindEvents.call(this, evts)
	
	  // convert w3c-video events to weex-video events.
	  var evtsMap = {
	    start: 'play',
	    finish: 'ended',
	    fail: 'error'
	  }
	  for (var evtName in evtsMap) {
	    this.node.addEventListener(evtsMap[evtName], function (type, e) {
	      this.dispatchEvent(type, e.data)
	    }.bind(this, evtName))
	  }
	}
	
	Video.prototype.play = function () {
	  var src = this.node.getAttribute('src')
	  if (!src) {
	    src = this.node.getAttribute('data-src')
	    src && this.node.setAttribute('src', src)
	  }
	  this.node.play()
	}
	
	Video.prototype.pause = function () {
	  this.node.pause()
	}
	
	Video.prototype.stop = function () {
	  this.node.pause()
	  this.node.autoplay = false
	  this.node.setAttribute('data-src', this.node.src)
	  this.node.src = ''
	}
	
	module.exports = Video


/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(72);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./video.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./video.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-video {\n\tbackground-color: #000;\n}", ""]);
	
	// exports


/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(35)
	var utils = __webpack_require__(13)
	__webpack_require__(74)
	
	var defaults = {
	  color: '#64bd63'
	  , secondaryColor: '#dfdfdf'
	  , jackColor: '#fff'
	  , jackSecondaryColor: null
	  , className: 'weex-switch'
	  , disabledOpacity: 0.5
	  , speed: '0.4s'
	  , width: 100
	  , height: 60
	  // is width and height scalable ?
	  , scalable: false
	}
	
	// attrs:
	//   - checked: if is checked.
	//   - disabled: if true, this component is not available for interaction.
	function Switch (data) {
	  this.options = utils.extend({}, defaults)
	  this.checked = data.attr.checked
	      && data.attr.checked !== 'false' ? true : false
	  this.data = data
	  this.width = this.options.width * data.scale
	  this.height = this.options.height * data.scale
	  Atomic.call(this, data)
	}
	
	Switch.prototype = Object.create(Atomic.prototype)
	
	Switch.prototype.create = function () {
	  var node = document.createElement('span')
	  this.jack = document.createElement('small')
	  node.appendChild(this.jack)
	  node.className = this.options.className
	  this.node = node
	  this.attr.disabled.call(this, this.data.attr.disabled)
	  return node
	}
	
	Switch.prototype.onAppend = function () {
	  this.setSize()
	  this.setPosition()
	}
	
	Switch.prototype.attr = {
	  disabled: function (val) {
	    this.disabled = val && val !== 'false'
	                    ? true
	                    : false
	    this.disabled ? this.disable() : this.enable()
	  }
	}
	
	Switch.prototype.setSize = function () {
	  var min = Math.min(this.width, this.height)
	  var max = Math.max(this.width, this.height)
	  this.node.style.width = max + 'px'
	  this.node.style.height = min + 'px'
	  this.node.style.borderRadius = min / 2 + 'px'
	  this.jack.style.width
	      = this.jack.style.height
	      = min + 'px'
	}
	
	Switch.prototype.setPosition = function (clicked) {
	  var checked = this.checked
	  var node = this.node
	  var jack = this.jack
	
	  if (clicked && checked) {
	    checked = false
	  } else if (clicked && !checked) {
	    checked = true
	  }
	
	  if (checked === true) {
	    this.checked = true
	
	    if (window.getComputedStyle) {
	      jack.style.left = parseInt(window.getComputedStyle(node).width)
	                        - parseInt(window.getComputedStyle(jack).width) + 'px'
	    } else {
	      jack.style.left = parseInt(node.currentStyle['width'])
	                        - parseInt(jack.currentStyle['width']) + 'px'
	    }
	
	    this.options.color && this.colorize()
	    this.setSpeed()
	  } else {
	    this.checked = false
	    jack.style.left = 0
	    node.style.boxShadow = 'inset 0 0 0 0 ' + this.options.secondaryColor
	    node.style.borderColor = this.options.secondaryColor
	    node.style.backgroundColor
	        = (this.options.secondaryColor !== defaults.secondaryColor)
	          ? this.options.secondaryColor
	          : '#fff'
	    jack.style.backgroundColor
	        = (this.options.jackSecondaryColor !== this.options.jackColor)
	          ? this.options.jackSecondaryColor
	          : this.options.jackColor
	    this.setSpeed()
	  }
	}
	
	Switch.prototype.colorize = function () {
	  var nodeHeight = this.node.offsetHeight / 2
	
	  this.node.style.backgroundColor = this.options.color
	  this.node.style.borderColor = this.options.color
	  this.node.style.boxShadow = 'inset 0 0 0 '
	                              + nodeHeight
	                              + 'px '
	                              + this.options.color
	  this.jack.style.backgroundColor = this.options.jackColor
	}
	
	Switch.prototype.setSpeed = function () {
	  var switcherProp = {}
	  var jackProp = {
	      'background-color': this.options.speed
	      , left: this.options.speed.replace(/[a-z]/, '') / 2 + 's'
	    }
	
	  if (this.checked) {
	    switcherProp = {
	      border: this.options.speed
	      , 'box-shadow': this.options.speed
	      , 'background-color': this.options.speed.replace(/[a-z]/, '') * 3 + 's'
	    }
	  } else {
	    switcherProp = {
	      border: this.options.speed
	      , 'box-shadow': this.options.speed
	    }
	  }
	
	  utils.transitionize(this.node, switcherProp)
	  utils.transitionize(this.jack, jackProp)
	}
	
	Switch.prototype.disable = function () {
	  !this.disabled && (this.disabled = true)
	  this.node.style.opacity = defaults.disabledOpacity
	  this.node.removeEventListener('click', this.getClickHandler())
	}
	
	Switch.prototype.enable = function () {
	  this.disabled && (this.disabled = false)
	  this.node.style.opacity = 1
	  this.node.addEventListener('click', this.getClickHandler())
	}
	
	Switch.prototype.getClickHandler = function () {
	  if (!this._clickHandler) {
	    this._clickHandler = function () {
	      // var parent = this.node.parentNode.tagName.toLowerCase()
	      // var labelParent = (parent === 'label') ? false : true
	      this.setPosition(true)
	      this.dispatchEvent('change', {
	        checked: this.checked
	      })
	    }.bind(this)
	  }
	  return this._clickHandler
	}
	
	Switch.prototype.style
	    = utils.extend(Object.create(Atomic.prototype.style), {
	
	      width: function (val) {
	        if (!this.options.scalable) {
	          return
	        }
	        val = parseFloat(val)
	        if (val !== val || val < 0) { // NaN
	          val = this.options.width
	        }
	        this.width = val * this.data.scale
	        this.setSize()
	      },
	
	      height: function (val) {
	        if (!this.options.scalable) {
	          return
	        }
	        val = parseFloat(val)
	        if (val !== val || val < 0) { // NaN
	          val = this.options.height
	        }
	        this.height = val * this.data.scale
	        this.setSize()
	      }
	
	    })
	
	module.exports = Switch


/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(75);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./switch.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./switch.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, "/* switch defaults. */\n.weex-switch {\n  background-color: #fff;\n  border: 1px solid #dfdfdf;\n  cursor: pointer;\n  display: inline-block;\n  position: relative;\n  vertical-align: middle;\n  -moz-user-select: none;\n  -khtml-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  box-sizing: content-box;\n  background-clip: content-box;\n}\n\n.weex-switch > small {\n  background: #fff;\n  border-radius: 100%;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);\n  position: absolute;\n  top: 0;\n}\n", ""]);
	
	// exports


/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var logger = __webpack_require__(30)
	var Component = __webpack_require__(22)
	
	// attrs:
	//   - href
	function A (data) {
	  Component.call(this, data)
	}
	
	A.prototype = Object.create(Component.prototype)
	
	A.prototype.create = function () {
	  var node = document.createElement('a')
	  node.classList.add('weex-container')
	  node.style.textDecoration = 'none'
	  return node
	}
	
	A.prototype.attr = {
	  href: function (val) {
	    if (!val) {
	      return logger.warn('href of <a> should not be a null value.')
	    }
	    this.href = val
	    this.node.setAttribute('data-href', val)
	  }
	}
	
	A.prototype.bindEvents = function (evts) {
	  // event handler for click event will be processed
	  // before the url redirection.
	  Component.prototype.bindEvents.call(this, evts)
	  this.node.addEventListener('click', function (evt) {
	    if (evt._alreadyFired && evt.target !== this.node) {
	      // if the event target is this.node, then this is
	      // just another click event handler for the same
	      // target, not a handler for a bubbling up event,
	      // otherwise it is a bubbling up event, and it
	      // should be disregarded.
	      return
	    }
	    evt._alreadyFired = true
	    location.href = this.href
	  }.bind(this))
	}
	
	module.exports = A


/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Component = __webpack_require__(22)
	var utils = __webpack_require__(13)
	
	var ID_PREFIX = 'weex_embed_'
	
	function _generateId() {
	  return ID_PREFIX + utils.getRandom(10)
	}
	
	function Embed (data, nodeType) {
	  var attr = data.attr
	  if (attr) {
	    this.source = attr.src
	    this.loader = attr.loader || 'xhr'
	    this.jsonpCallback = attr.jsonpCallback
	  }
	  Component.call(this, data, nodeType)
	}
	
	Embed.prototype = Object.create(Component.prototype)
	
	Embed.prototype.create = function () {
	  var node = document.createElement('div')
	  node.id = this.id
	  node.style.overflow = 'scroll'
	  return node
	}
	
	Embed.prototype.initWeex = function () {
	  this.id = _generateId()
	  this.node.id = this.id
	  var config = {
	    appId: this.id,
	    source: this.source,
	    bundleUrl: this.source,
	    loader: this.loader,
	    jsonpCallback: this.jsonpCallback,
	    width: this.node.getBoundingClientRect().width,
	    rootId: this.id,
	    embed: true
	  }
	  window.weex.init(config)
	}
	
	Embed.prototype.destroyWeex = function () {
	  this.id && window.destroyInstance(this.id)
	  // TODO: unbind events and clear doms.
	  this.node.innerHTML = ''
	}
	
	Embed.prototype.reloadWeex = function () {
	  if (this.id) {
	    this.destroyWeex()
	    this.id = null
	    this.node.id = null
	    this.node.innerHTML = ''
	  }
	  this.initWeex()
	}
	
	// not recommended, because of the leak of memory.
	Embed.prototype.attr = {
	  src: function (value) {
	    this.source = value
	    this.reloadWeex()
	  }
	}
	
	module.exports = Embed


/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Component = __webpack_require__(22)
	
	__webpack_require__(79)
	
	var parents = ['scroller', 'list']
	
	// Only if pulldown offset is larger than this value can this
	// component trigger the 'refresh' event, otherwise just recover
	// to the start point.
	var CLAMP = 130
	
	var ua = window.navigator.userAgent
	var Firefox = !!ua.match(/Firefox/i)
	var IEMobile = !!ua.match(/IEMobile/i)
	var cssPrefix = Firefox ? '-moz-' : IEMobile ? '-ms-' : '-webkit-'
	
	function Refresh (data) {
	  Component.call(this, data)
	}
	
	Refresh.prototype = Object.create(Component.prototype)
	
	Refresh.prototype.create = function () {
	  var node = document.createElement('div')
	  node.classList.add('weex-container', 'weex-refresh')
	  return node
	}
	
	Refresh.prototype.onAppend = function () {
	  var parent = this.getParent()
	  var self = this
	  if (parents.indexOf(parent.data.type) === -1) {
	    return
	  }
	  parent.scroller.addEventListener('pulldown', function (e) {
	    self.adjustHeight(Math.abs(e.scrollObj.getScrollTop()))
	    if (!this.display) {
	      self.show()
	    }
	  })
	  parent.scroller.addEventListener('pulldownend', function (e) {
	    var top = Math.abs(e.scrollObj.getScrollTop())
	    if (top > CLAMP) {
	      self.handleRefresh(e)
	    }
	  })
	}
	
	Refresh.prototype.adjustHeight = function (val) {
	  this.node.style.height = val + 'px'
	  this.node.style.top = -val + 'px'
	}
	
	Refresh.prototype.handleRefresh = function (e) {
	  var scrollObj = e.scrollObj
	  var parent = this.getParent()
	  var scrollElement = parent.scrollElement || parent.listElement
	  this.node.style.height = CLAMP + 'px'
	  this.node.style.top = -CLAMP + 'px'
	  var translateStr = 'translate3d(0px,' + CLAMP + 'px,0px)'
	  scrollElement.style[cssPrefix + 'transform']
	    = cssPrefix + translateStr
	  scrollElement.style.transform = translateStr
	  this.dispatchEvent('refresh')
	}
	
	Refresh.prototype.show = function () {
	  this.display = true
	  this.node.style.display = '-webkit-box'
	  this.node.style.display = '-webkit-flex'
	  this.node.style.display = 'flex'
	}
	
	Refresh.prototype.hide = function () {
	  this.display = false
	  var parent = this.getParent()
	  if (parent) {
	    var scrollElement = parent.scrollElement || parent.listElement
	    var translateStr = 'translate3d(0px,0px,0px)'
	    scrollElement.style[cssPrefix + 'transform']
	      = cssPrefix + translateStr
	    scrollElement.style.transform = translateStr
	  }
	  this.node.style.display = 'none'
	}
	
	Refresh.prototype.attr = {
	  display: function (val) {
	    if (val === 'show') {
	      setTimeout(function () {
	        this.show()
	      }.bind(this), 0)
	    } else if (val === 'hide') {
	      setTimeout(function () {
	        this.hide()
	      }.bind(this), 0)
	    } else {
	      // TODO
	      console.error('h5render:attribute value of refresh \'display\' '
	          + val
	          + ' is invalid. Should be \'show\' or \'hide\'')
	    }
	  }
	}
	
	module.exports = Refresh


/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(80);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./refresh.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./refresh.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-refresh {\n  // -webkit-box-align: center;\n  // -webkit-align-items: center;\n  // align-items: center;\n  // -webkit-box-pack: center;\n  // -webkit-justify-content: center;\n  // justify-content: center;\n  overflow: hidden;\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 0;\n}", ""]);
	
	// exports


/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Component = __webpack_require__(22)
	
	__webpack_require__(82)
	
	var parents = ['scroller', 'list']
	
	var DEFAULT_HEIGHT = 130
	
	var ua = window.navigator.userAgent
	var Firefox = !!ua.match(/Firefox/i)
	var IEMobile = !!ua.match(/IEMobile/i)
	var cssPrefix = Firefox ? '-moz-' : IEMobile ? '-ms-' : '-webkit-'
	
	function Loading (data) {
	  Component.call(this, data)
	}
	
	Loading.prototype = Object.create(Component.prototype)
	
	Loading.prototype.create = function () {
	  var node = document.createElement('div')
	  node.classList.add('weex-container', 'weex-loading')
	  return node
	}
	
	Loading.prototype.onAppend = function () {
	  var parent = this.getParent()
	  var self = this
	  var scrollWrapHeight = parent.node.getBoundingClientRect().height
	  if (parents.indexOf(parent.data.type) === -1) {
	    return
	  }
	  parent.scroller.addEventListener('pullup', function (e) {
	    var obj = e.scrollObj
	    self.adjustHeight(Math.abs(
	      obj.getScrollHeight() - obj.getScrollTop() - scrollWrapHeight))
	    if (!self.display) {
	      self.show()
	    }
	  })
	  parent.scroller.addEventListener('pullupend', function (e) {
	    self.handleLoading(e)
	  })
	}
	
	Loading.prototype.adjustHeight = function (val) {
	  this.node.style.height = val + 'px'
	  this.node.style.bottom = -val + 'px'
	}
	
	Loading.prototype.handleLoading = function (e) {
	  var parent = this.getParent()
	  var scrollElement = parent.scrollElement || parent.listElement
	  var offset = scrollElement.getBoundingClientRect().height
	            - parent.node.getBoundingClientRect().height
	            + DEFAULT_HEIGHT
	  this.node.style.height = DEFAULT_HEIGHT + 'px'
	  this.node.style.bottom = -DEFAULT_HEIGHT + 'px'
	  var translateStr = 'translate3d(0px,-' + offset + 'px,0px)'
	  scrollElement.style[cssPrefix + 'transform']
	    = cssPrefix + translateStr
	  scrollElement.style.transform = translateStr
	  this.dispatchEvent('loading')
	}
	
	Loading.prototype.show = function () {
	  this.display = true
	  this.node.style.display = '-webkit-box'
	  this.node.style.display = '-webkit-flex'
	  this.node.style.display = 'flex'
	}
	
	Loading.prototype.hide = function () {
	  this.display = false
	  var parent = this.getParent()
	  if (parent) {
	    var scrollElement = parent.scrollElement || parent.listElement
	    var scrollElementHeight = scrollElement.getBoundingClientRect().height
	    var scrollWrapHeight = parent.node.getBoundingClientRect().height
	    var left = scrollElementHeight
	      - parent.scroller.getScrollTop()
	      - scrollWrapHeight
	    if (left < 0) {
	      var offset = scrollElementHeight
	              - parent.node.getBoundingClientRect().height
	      var translateStr = 'translate3d(0px,-' + offset + 'px,0px)'
	      scrollElement.style[cssPrefix + 'transform']
	        = cssPrefix + translateStr
	      scrollElement.style.transform = translateStr
	    }
	  }
	  this.node.style.display = 'none'
	}
	
	Loading.prototype.attr = {
	  display: function (val) {
	    if (val === 'show') {
	      setTimeout(function () {
	        this.show()
	      }.bind(this), 0)
	    } else if (val === 'hide') {
	      setTimeout(function () {
	        this.hide()
	      }.bind(this), 0)
	    } else {
	      // TODO
	      console.error('h5render:attribute value of refresh \'display\' '
	          + val
	          + ' is invalid. Should be \'show\' or \'hide\'')
	    }
	  }
	}
	
	module.exports = Loading


/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(83);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./loading.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./loading.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-loading {\n  // -webkit-box-align: center;\n  // -webkit-align-items: center;\n  // align-items: center;\n  // -webkit-box-pack: center;\n  // -webkit-justify-content: center;\n  // justify-content: center;\n  overflow: hidden;\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  width: 100%;\n  height: 0;\n}", ""]);
	
	// exports


/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(35)
	var utils = __webpack_require__(13)
	
	__webpack_require__(85)
	
	function Spinner (data) {
	  Atomic.call(this, data)
	}
	
	Spinner.prototype = Object.create(Atomic.prototype)
	
	Spinner.prototype.create = function () {
	  var node = document.createElement('div')
	  node.classList.add('weex-container', 'weex-spinner-wrap')
	  this.spinner = document.createElement('div')
	  this.spinner.classList.add('weex-element', 'weex-spinner')
	  node.appendChild(this.spinner)
	  return node
	}
	
	Spinner.prototype.updateStyle = function (style) {
	  Atomic.prototype.updateStyle.call(this, style)
	  if (style && style.color) {
	    this.setKeyframeColor(utils.getRgb(this.node.style.color))
	  }
	}
	
	Spinner.prototype.getStyleSheet = function () {
	  if (this.styleSheet) {
	    return
	  }
	  var styles = document.styleSheets
	  outer: for (var i = 0, l = styles.length; i < l; i++) {
	    var rules = styles[i].rules
	    for (var j = 0, m = rules.length; j < m; j++) {
	      var item = rules.item(j)
	      if (
	        (item.type === CSSRule.KEYFRAMES_RULE
	          || item.type === CSSRule.WEBKIT_KEYFRAMES_RULE)
	        && item.name === 'spinner') {
	        break outer
	      }
	    }
	  }
	  this.styleSheet = styles[i]
	}
	
	Spinner.prototype.setKeyframeColor = function (val) {
	  this.getStyleSheet()
	  var keyframeRules = this.computeKeyFrameRules(val)
	  var rules, item, cssRules, keyframe
	  rules = this.styleSheet.rules
	  for (var i = 0, l = rules.length; i < l; i++) {
	    item = rules.item(i)
	    if ((item.type === CSSRule.KEYFRAMES_RULE
	          || item.type === CSSRule.WEBKIT_KEYFRAMES_RULE)
	        && item.name === 'spinner') {
	      cssRules = item.cssRules
	      for (var j = 0, m = cssRules.length; j < m; j++) {
	        keyframe = cssRules[j]
	        if (keyframe.type === CSSRule.KEYFRAME_RULE
	          || keyframe.type === CSSRule.WEBKIT_KEYFRAME_RULE) {
	          keyframe.style.boxShadow = keyframeRules[j]
	        }
	      }
	    }
	  }
	}
	
	Spinner.prototype.computeKeyFrameRules = function (rgb) {
	  if (!rgb) {
	    return
	  }
	  var scaleArr = [
	    '0em -2.6em 0em 0em',
	    '1.8em -1.8em 0 0em',
	    '2.5em 0em 0 0em',
	    '1.75em 1.75em 0 0em',
	    '0em 2.5em 0 0em',
	    '-1.8em 1.8em 0 0em',
	    '-2.6em 0em 0 0em',
	    '-1.8em -1.8em 0 0em']
	  var colorArr = [
	    '1',
	    '0.2',
	    '0.2',
	    '0.2',
	    '0.2',
	    '0.2',
	    '0.5',
	    '0.7'].map(function (e) {
	      return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + e + ')'
	    })
	  var rules = []
	  for (var i = 0; i < scaleArr.length; i++) {
	    var tmpColorArr = utils.loopArray(colorArr, i, 'r')
	    rules.push(scaleArr.map(function (scaleStr, i) {
	      return scaleStr + ' ' + tmpColorArr[i]
	    }).join(', '))
	  }
	  return rules
	}
	
	module.exports = Spinner


/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(86);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./spinner.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./spinner.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".weex-spinner-wrap {\n  width: 1.013333rem; /* 76px */\n  height: 1.013333rem;\n  -webkit-box-align: center;\n  -webkit-align-items: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  -webkit-justify-content: center;\n  justify-content: center;\n  overflow: visible;\n}\n\n.weex-spinner {\n  font-size: 0.16rem; /* 12px */\n  width: 1em;\n  height: 1em;\n  border-radius: 50%;\n  position: relative;\n  text-indent: -9999em;\n  -webkit-animation: spinner 1.1s infinite ease;\n  animation: spinner 1.1s infinite ease;\n  -webkit-transform: translateZ(0);\n  -ms-transform: translateZ(0);\n  transform: translateZ(0);\n}\n@-webkit-keyframes spinner {\n  0%,\n  100% {\n    box-shadow: 0em -2.6em 0em 0em #ffffff, 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.5), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7);\n  }\n  12.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.7), 1.8em -1.8em 0 0em #ffffff, 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.5);\n  }\n  25% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.5), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7), 2.5em 0em 0 0em #ffffff, 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  37.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.5), 2.5em 0em 0 0em rgba(255, 255, 255, 0.7), 1.75em 1.75em 0 0em #ffffff, 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  50% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.5), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.7), 0em 2.5em 0 0em #ffffff, -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  62.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.5), 0em 2.5em 0 0em rgba(255, 255, 255, 0.7), -1.8em 1.8em 0 0em #ffffff, -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  75% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.5), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.7), -2.6em 0em 0 0em #ffffff, -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  87.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.5), -2.6em 0em 0 0em rgba(255, 255, 255, 0.7), -1.8em -1.8em 0 0em #ffffff;\n  }\n}\n@keyframes spinner {\n  0%,\n  100% {\n    box-shadow: 0em -2.6em 0em 0em #ffffff, 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.5), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7);\n  }\n  12.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.7), 1.8em -1.8em 0 0em #ffffff, 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.5);\n  }\n  25% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.5), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.7), 2.5em 0em 0 0em #ffffff, 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  37.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.5), 2.5em 0em 0 0em rgba(255, 255, 255, 0.7), 1.75em 1.75em 0 0em #ffffff, 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  50% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.5), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.7), 0em 2.5em 0 0em #ffffff, -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.2), -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  62.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.5), 0em 2.5em 0 0em rgba(255, 255, 255, 0.7), -1.8em 1.8em 0 0em #ffffff, -2.6em 0em 0 0em rgba(255, 255, 255, 0.2), -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  75% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.5), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.7), -2.6em 0em 0 0em #ffffff, -1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2);\n  }\n  87.5% {\n    box-shadow: 0em -2.6em 0em 0em rgba(255, 255, 255, 0.2), 1.8em -1.8em 0 0em rgba(255, 255, 255, 0.2), 2.5em 0em 0 0em rgba(255, 255, 255, 0.2), 1.75em 1.75em 0 0em rgba(255, 255, 255, 0.2), 0em 2.5em 0 0em rgba(255, 255, 255, 0.2), -1.8em 1.8em 0 0em rgba(255, 255, 255, 0.5), -2.6em 0em 0 0em rgba(255, 255, 255, 0.7), -1.8em -1.8em 0 0em #ffffff;\n  }\n}\n", ""]);
	
	// exports


/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Atomic = __webpack_require__(35)
	var utils = __webpack_require__(13)
	var logger = __webpack_require__(30)
	
	// A component to import web pages, which works like
	// a iframe element or a webview.
	// attrs:
	//   - src
	// events:
	//   - pagestart
	//   - pagefinish
	//   - error
	function Web (data) {
	  Atomic.call(this, data)
	}
	
	Web.prototype = Object.create(Atomic.prototype)
	
	Web.prototype.create = function () {
	  // Iframe's defect: can't use position:absolute and top, left, right,
	  // bottom all setting to zero and use margin to leave specified
	  // height for a blank area, and have to use 100% to fill the parent
	  // container, otherwise it will use a unwanted default size instead.
	  // Therefore a div as a iframe wrapper is needed here.
	  var node = document.createElement('div')
	  node.classList.add('weex-container')
	  this.web = document.createElement('iframe')
	  node.appendChild(this.web)
	  this.web.classList.add('weex-element')
	  this.web.style.width = '100%'
	  this.web.style.height = '100%'
	  this.web.style.border = 'none'
	  return node
	}
	
	Web.prototype.bindEvents = function (evts) {
	  Atomic.prototype.bindEvents.call(this, evts)
	  var that = this
	  this.web.addEventListener('load', function (e) {
	    that.dispatchEvent('pagefinish', utils.extend({
	      url: that.web.src
	    }))
	  })
	  window.addEventListener('message', this.msgHandler.bind(this))
	}
	
	Web.prototype.msgHandler = function (evt) {
	  var msg = evt.data
	  if (typeof msg === 'string') {
	    try {
	      msg = JSON.parse(msg)
	    } catch (e) {}
	  }
	  if (!msg) {
	    return
	  }
	  if (msg.type === 'weex') {
	    if (!utils.isArray(msg.content)) {
	      return logger.error('weex msg received by web component. msg.content'
	        + ' should be a array:', msg.content)
	    }
	    callNative(this.getComponentManager().instanceId, msg.content)
	  }
	}
	
	Web.prototype.attr = {
	  src: function (val) {
	    this.web.src = val
	    setTimeout(function () {
	      this.dispatchEvent('pagestart', { url: val })
	    }.bind(this), 0)
	  }
	}
	
	Web.prototype.goBack = function () {
	  this.web.contentWindow.history.back()
	}
	
	Web.prototype.goForward = function () {
	  this.web.contentWindow.history.forward()
	}
	
	Web.prototype.reload = function () {
	  this.web.contentWindow.location.reload()
	}
	
	module.exports = Web


/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	var dom = __webpack_require__(89)
	var event = __webpack_require__(97)
	var pageInfo = __webpack_require__(98)
	var stream = __webpack_require__(99)
	var modal = __webpack_require__(101)
	var animation = __webpack_require__(118)
	var webview = __webpack_require__(119)
	var timer = __webpack_require__(120)
	var navigator = __webpack_require__(121)
	
	var api = {
	  init: function (Weex) {
	    Weex.registerApiModule('dom', dom, dom._meta)
	    Weex.registerApiModule('event', event, event._meta)
	    Weex.registerApiModule('pageInfo', pageInfo, pageInfo._meta)
	    Weex.registerApiModule('stream', stream, stream._meta)
	    Weex.registerApiModule('modal', modal, modal._meta)
	    Weex.registerApiModule('animation', animation, animation._meta)
	    Weex.registerApiModule('webview', webview, webview._meta)
	    Weex.registerApiModule('timer', timer, timer._meta)
	    Weex.registerApiModule('navigator', navigator, navigator._meta)
	  }
	}
	
	module.exports = api

/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var messageQueue = __webpack_require__(60)
	var FrameUpdater = __webpack_require__(16)
	var Component = __webpack_require__(22)
	var scroll = __webpack_require__(90)
	var config = __webpack_require__(11)
	var logger = __webpack_require__(30)
	
	var dom = {
	
	  /**
	   * createBody: create root component
	   * @param  {object} element
	   *    container|listview|scrollview
	   * @return {[type]}      [description]
	   */
	  createBody: function (element) {
	    var componentManager = this.getComponentManager()
	    element.scale = this.scale
	    element.instanceId = componentManager.instanceId
	    return componentManager.createBody(element)
	  },
	
	  addElement: function (parentRef, element, index) {
	    var componentManager = this.getComponentManager()
	    element.scale = this.scale
	    element.instanceId = componentManager.instanceId
	    return componentManager.addElement(parentRef, element, index)
	  },
	
	  removeElement: function (ref) {
	    var componentManager = this.getComponentManager()
	    return componentManager.removeElement(ref)
	  },
	
	  moveElement: function (ref, parentRef, index) {
	    var componentManager = this.getComponentManager()
	    return componentManager.moveElement(ref, parentRef, index)
	  },
	
	  addEvent: function (ref, type) {
	    var componentManager = this.getComponentManager()
	    return componentManager.addEvent(ref, type)
	  },
	
	  removeEvent: function (ref, type) {
	    var componentManager = this.getComponentManager()
	    return componentManager.removeEvent(ref, type)
	  },
	
	  /**
	   * updateAttrs: update attributes of component
	   * @param  {string} ref
	   * @param  {obj} attr
	   */
	  updateAttrs: function (ref, attr) {
	    var componentManager = this.getComponentManager()
	    return componentManager.updateAttrs(ref, attr)
	  },
	
	  /**
	   * updateStyle: udpate style of component
	   * @param {string} ref
	   * @param {obj} style
	   */
	  updateStyle: function (ref, style) {
	    var componentManager = this.getComponentManager()
	    return componentManager.updateStyle(ref, style)
	  },
	
	  createFinish: function () {
	    // TODO
	    // FrameUpdater.pause()
	  },
	
	  refreshFinish: function () {
	    // TODO
	  },
	
	  /**
	   * scrollToElement
	   * @param  {string} ref
	   * @param  {obj} options {offset:Number}
	   *   ps: scroll-to has 'ease' and 'duration'(ms) as options.
	   */
	  scrollToElement: function (ref, options) {
	    !options && (options = {})
	    var componentManager = this.getComponentManager()
	    var elem = componentManager.getElementByRef(ref)
	    if (!elem) {
	      return logger.error('component of ref ' + ref + ' doesn\'t exist.')
	    }
	    var parentScroller = elem.getParentScroller()
	    if (parentScroller) {
	      parentScroller.scroller.scrollToElement(elem.node, true)
	    } else {
	      var offsetTop = elem.node.getBoundingClientRect().top
	          + document.body.scrollTop
	      var offset = (Number(options.offset) || 0) * this.scale
	      var tween = scroll(0, offsetTop + offset, options)
	      tween.on('end', function () {
	        logger.log('scroll end.')
	      })
	    }
	  }
	
	}
	
	dom._meta = {
	  dom: [{
	    name: 'createBody',
	    args: ['object']
	  }, {
	    name: 'addElement',
	    args: ['string', 'object', 'number']
	  }, {
	    name: 'removeElement',
	    args: ['string']
	  }, {
	    name: 'moveElement',
	    args: ['string', 'string', 'number']
	  }, {
	    name: 'addEvent',
	    args: ['string', 'string']
	  }, {
	    name: 'removeEvent',
	    args: ['string', 'string']
	  }, {
	    name: 'updateAttrs',
	    args: ['string', 'object']
	  }, {
	    name: 'updateStyle',
	    args: ['string', 'object']
	  }, {
	    name: 'createFinish',
	    args: []
	  }, {
	    name: 'refreshFinish',
	    args: []
	  }, {
	    name: 'scrollToElement',
	    args: ['string', 'object']
	  }]
	}
	
	module.exports = dom


/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */
	
	var Tween = __webpack_require__(91);
	var raf = __webpack_require__(96);
	
	/**
	 * Expose `scrollTo`.
	 */
	
	module.exports = scrollTo;
	
	/**
	 * Scroll to `(x, y)`.
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @api public
	 */
	
	function scrollTo(x, y, options) {
	  options = options || {};
	
	  // start position
	  var start = scroll();
	
	  // setup tween
	  var tween = Tween(start)
	    .ease(options.ease || 'out-circ')
	    .to({ top: y, left: x })
	    .duration(options.duration || 1000);
	
	  // scroll
	  tween.update(function(o){
	    window.scrollTo(o.left | 0, o.top | 0);
	  });
	
	  // handle end
	  tween.on('end', function(){
	    animate = function(){};
	  });
	
	  // animate
	  function animate() {
	    raf(animate);
	    tween.update();
	  }
	
	  animate();
	  
	  return tween;
	}
	
	/**
	 * Return scroll position.
	 *
	 * @return {Object}
	 * @api private
	 */
	
	function scroll() {
	  var y = window.pageYOffset || document.documentElement.scrollTop;
	  var x = window.pageXOffset || document.documentElement.scrollLeft;
	  return { top: y, left: x };
	}


/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */
	
	var Emitter = __webpack_require__(92);
	var clone = __webpack_require__(93);
	var type = __webpack_require__(94);
	var ease = __webpack_require__(95);
	
	/**
	 * Expose `Tween`.
	 */
	
	module.exports = Tween;
	
	/**
	 * Initialize a new `Tween` with `obj`.
	 *
	 * @param {Object|Array} obj
	 * @api public
	 */
	
	function Tween(obj) {
	  if (!(this instanceof Tween)) return new Tween(obj);
	  this._from = obj;
	  this.ease('linear');
	  this.duration(500);
	}
	
	/**
	 * Mixin emitter.
	 */
	
	Emitter(Tween.prototype);
	
	/**
	 * Reset the tween.
	 *
	 * @api public
	 */
	
	Tween.prototype.reset = function(){
	  this.isArray = 'array' === type(this._from);
	  this._curr = clone(this._from);
	  this._done = false;
	  this._start = Date.now();
	  return this;
	};
	
	/**
	 * Tween to `obj` and reset internal state.
	 *
	 *    tween.to({ x: 50, y: 100 })
	 *
	 * @param {Object|Array} obj
	 * @return {Tween} self
	 * @api public
	 */
	
	Tween.prototype.to = function(obj){
	  this.reset();
	  this._to = obj;
	  return this;
	};
	
	/**
	 * Set duration to `ms` [500].
	 *
	 * @param {Number} ms
	 * @return {Tween} self
	 * @api public
	 */
	
	Tween.prototype.duration = function(ms){
	  this._duration = ms;
	  return this;
	};
	
	/**
	 * Set easing function to `fn`.
	 *
	 *    tween.ease('in-out-sine')
	 *
	 * @param {String|Function} fn
	 * @return {Tween}
	 * @api public
	 */
	
	Tween.prototype.ease = function(fn){
	  fn = 'function' == typeof fn ? fn : ease[fn];
	  if (!fn) throw new TypeError('invalid easing function');
	  this._ease = fn;
	  return this;
	};
	
	/**
	 * Stop the tween and immediately emit "stop" and "end".
	 *
	 * @return {Tween}
	 * @api public
	 */
	
	Tween.prototype.stop = function(){
	  this.stopped = true;
	  this._done = true;
	  this.emit('stop');
	  this.emit('end');
	  return this;
	};
	
	/**
	 * Perform a step.
	 *
	 * @return {Tween} self
	 * @api private
	 */
	
	Tween.prototype.step = function(){
	  if (this._done) return;
	
	  // duration
	  var duration = this._duration;
	  var now = Date.now();
	  var delta = now - this._start;
	  var done = delta >= duration;
	
	  // complete
	  if (done) {
	    this._from = this._to;
	    this._update(this._to);
	    this._done = true;
	    this.emit('end');
	    return this;
	  }
	
	  // tween
	  var from = this._from;
	  var to = this._to;
	  var curr = this._curr;
	  var fn = this._ease;
	  var p = (now - this._start) / duration;
	  var n = fn(p);
	
	  // array
	  if (this.isArray) {
	    for (var i = 0; i < from.length; ++i) {
	      curr[i] = from[i] + (to[i] - from[i]) * n;
	    }
	
	    this._update(curr);
	    return this;
	  }
	
	  // objech
	  for (var k in from) {
	    curr[k] = from[k] + (to[k] - from[k]) * n;
	  }
	
	  this._update(curr);
	  return this;
	};
	
	/**
	 * Set update function to `fn` or
	 * when no argument is given this performs
	 * a "step".
	 *
	 * @param {Function} fn
	 * @return {Tween} self
	 * @api public
	 */
	
	Tween.prototype.update = function(fn){
	  if (0 == arguments.length) return this.step();
	  this._update = fn;
	  return this;
	};

/***/ },
/* 92 */
/***/ function(module, exports) {

	
	/**
	 * Expose `Emitter`.
	 */
	
	module.exports = Emitter;
	
	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */
	
	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};
	
	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
	    .push(fn);
	  return this;
	};
	
	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.once = function(event, fn){
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }
	
	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};
	
	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	
	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }
	
	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;
	
	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }
	
	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};
	
	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */
	
	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks['$' + event];
	
	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }
	
	  return this;
	};
	
	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */
	
	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};
	
	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */
	
	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */
	
	var type;
	try {
	  type = __webpack_require__(94);
	} catch (_) {
	  type = __webpack_require__(94);
	}
	
	/**
	 * Module exports.
	 */
	
	module.exports = clone;
	
	/**
	 * Clones objects.
	 *
	 * @param {Mixed} any object
	 * @api public
	 */
	
	function clone(obj){
	  switch (type(obj)) {
	    case 'object':
	      var copy = {};
	      for (var key in obj) {
	        if (obj.hasOwnProperty(key)) {
	          copy[key] = clone(obj[key]);
	        }
	      }
	      return copy;
	
	    case 'array':
	      var copy = new Array(obj.length);
	      for (var i = 0, l = obj.length; i < l; i++) {
	        copy[i] = clone(obj[i]);
	      }
	      return copy;
	
	    case 'regexp':
	      // from millermedeiros/amd-utils - MIT
	      var flags = '';
	      flags += obj.multiline ? 'm' : '';
	      flags += obj.global ? 'g' : '';
	      flags += obj.ignoreCase ? 'i' : '';
	      return new RegExp(obj.source, flags);
	
	    case 'date':
	      return new Date(obj.getTime());
	
	    default: // string, number, boolean, …
	      return obj;
	  }
	}


/***/ },
/* 94 */
/***/ function(module, exports) {

	/**
	 * toString ref.
	 */
	
	var toString = Object.prototype.toString;
	
	/**
	 * Return the type of `val`.
	 *
	 * @param {Mixed} val
	 * @return {String}
	 * @api public
	 */
	
	module.exports = function(val){
	  switch (toString.call(val)) {
	    case '[object Date]': return 'date';
	    case '[object RegExp]': return 'regexp';
	    case '[object Arguments]': return 'arguments';
	    case '[object Array]': return 'array';
	    case '[object Error]': return 'error';
	  }
	
	  if (val === null) return 'null';
	  if (val === undefined) return 'undefined';
	  if (val !== val) return 'nan';
	  if (val && val.nodeType === 1) return 'element';
	
	  val = val.valueOf
	    ? val.valueOf()
	    : Object.prototype.valueOf.apply(val)
	
	  return typeof val;
	};


/***/ },
/* 95 */
/***/ function(module, exports) {

	
	// easing functions from "Tween.js"
	
	exports.linear = function(n){
	  return n;
	};
	
	exports.inQuad = function(n){
	  return n * n;
	};
	
	exports.outQuad = function(n){
	  return n * (2 - n);
	};
	
	exports.inOutQuad = function(n){
	  n *= 2;
	  if (n < 1) return 0.5 * n * n;
	  return - 0.5 * (--n * (n - 2) - 1);
	};
	
	exports.inCube = function(n){
	  return n * n * n;
	};
	
	exports.outCube = function(n){
	  return --n * n * n + 1;
	};
	
	exports.inOutCube = function(n){
	  n *= 2;
	  if (n < 1) return 0.5 * n * n * n;
	  return 0.5 * ((n -= 2 ) * n * n + 2);
	};
	
	exports.inQuart = function(n){
	  return n * n * n * n;
	};
	
	exports.outQuart = function(n){
	  return 1 - (--n * n * n * n);
	};
	
	exports.inOutQuart = function(n){
	  n *= 2;
	  if (n < 1) return 0.5 * n * n * n * n;
	  return -0.5 * ((n -= 2) * n * n * n - 2);
	};
	
	exports.inQuint = function(n){
	  return n * n * n * n * n;
	}
	
	exports.outQuint = function(n){
	  return --n * n * n * n * n + 1;
	}
	
	exports.inOutQuint = function(n){
	  n *= 2;
	  if (n < 1) return 0.5 * n * n * n * n * n;
	  return 0.5 * ((n -= 2) * n * n * n * n + 2);
	};
	
	exports.inSine = function(n){
	  return 1 - Math.cos(n * Math.PI / 2 );
	};
	
	exports.outSine = function(n){
	  return Math.sin(n * Math.PI / 2);
	};
	
	exports.inOutSine = function(n){
	  return .5 * (1 - Math.cos(Math.PI * n));
	};
	
	exports.inExpo = function(n){
	  return 0 == n ? 0 : Math.pow(1024, n - 1);
	};
	
	exports.outExpo = function(n){
	  return 1 == n ? n : 1 - Math.pow(2, -10 * n);
	};
	
	exports.inOutExpo = function(n){
	  if (0 == n) return 0;
	  if (1 == n) return 1;
	  if ((n *= 2) < 1) return .5 * Math.pow(1024, n - 1);
	  return .5 * (-Math.pow(2, -10 * (n - 1)) + 2);
	};
	
	exports.inCirc = function(n){
	  return 1 - Math.sqrt(1 - n * n);
	};
	
	exports.outCirc = function(n){
	  return Math.sqrt(1 - (--n * n));
	};
	
	exports.inOutCirc = function(n){
	  n *= 2
	  if (n < 1) return -0.5 * (Math.sqrt(1 - n * n) - 1);
	  return 0.5 * (Math.sqrt(1 - (n -= 2) * n) + 1);
	};
	
	exports.inBack = function(n){
	  var s = 1.70158;
	  return n * n * (( s + 1 ) * n - s);
	};
	
	exports.outBack = function(n){
	  var s = 1.70158;
	  return --n * n * ((s + 1) * n + s) + 1;
	};
	
	exports.inOutBack = function(n){
	  var s = 1.70158 * 1.525;
	  if ( ( n *= 2 ) < 1 ) return 0.5 * ( n * n * ( ( s + 1 ) * n - s ) );
	  return 0.5 * ( ( n -= 2 ) * n * ( ( s + 1 ) * n + s ) + 2 );
	};
	
	exports.inBounce = function(n){
	  return 1 - exports.outBounce(1 - n);
	};
	
	exports.outBounce = function(n){
	  if ( n < ( 1 / 2.75 ) ) {
	    return 7.5625 * n * n;
	  } else if ( n < ( 2 / 2.75 ) ) {
	    return 7.5625 * ( n -= ( 1.5 / 2.75 ) ) * n + 0.75;
	  } else if ( n < ( 2.5 / 2.75 ) ) {
	    return 7.5625 * ( n -= ( 2.25 / 2.75 ) ) * n + 0.9375;
	  } else {
	    return 7.5625 * ( n -= ( 2.625 / 2.75 ) ) * n + 0.984375;
	  }
	};
	
	exports.inOutBounce = function(n){
	  if (n < .5) return exports.inBounce(n * 2) * .5;
	  return exports.outBounce(n * 2 - 1) * .5 + .5;
	};
	
	// aliases
	
	exports['in-quad'] = exports.inQuad;
	exports['out-quad'] = exports.outQuad;
	exports['in-out-quad'] = exports.inOutQuad;
	exports['in-cube'] = exports.inCube;
	exports['out-cube'] = exports.outCube;
	exports['in-out-cube'] = exports.inOutCube;
	exports['in-quart'] = exports.inQuart;
	exports['out-quart'] = exports.outQuart;
	exports['in-out-quart'] = exports.inOutQuart;
	exports['in-quint'] = exports.inQuint;
	exports['out-quint'] = exports.outQuint;
	exports['in-out-quint'] = exports.inOutQuint;
	exports['in-sine'] = exports.inSine;
	exports['out-sine'] = exports.outSine;
	exports['in-out-sine'] = exports.inOutSine;
	exports['in-expo'] = exports.inExpo;
	exports['out-expo'] = exports.outExpo;
	exports['in-out-expo'] = exports.inOutExpo;
	exports['in-circ'] = exports.inCirc;
	exports['out-circ'] = exports.outCirc;
	exports['in-out-circ'] = exports.inOutCirc;
	exports['in-back'] = exports.inBack;
	exports['out-back'] = exports.outBack;
	exports['in-out-back'] = exports.inOutBack;
	exports['in-bounce'] = exports.inBounce;
	exports['out-bounce'] = exports.outBounce;
	exports['in-out-bounce'] = exports.inOutBounce;


/***/ },
/* 96 */
/***/ function(module, exports) {

	/**
	 * Expose `requestAnimationFrame()`.
	 */
	
	exports = module.exports = window.requestAnimationFrame
	  || window.webkitRequestAnimationFrame
	  || window.mozRequestAnimationFrame
	  || fallback;
	
	/**
	 * Fallback implementation.
	 */
	
	var prev = new Date().getTime();
	function fallback(fn) {
	  var curr = new Date().getTime();
	  var ms = Math.max(0, 16 - (curr - prev));
	  var req = setTimeout(fn, ms);
	  prev = curr;
	  return req;
	}
	
	/**
	 * Cancel.
	 */
	
	var cancel = window.cancelAnimationFrame
	  || window.webkitCancelAnimationFrame
	  || window.mozCancelAnimationFrame
	  || window.clearTimeout;
	
	exports.cancel = function(id){
	  cancel.call(window, id);
	};


/***/ },
/* 97 */
/***/ function(module, exports) {

	'use strict'
	
	var event = {
	  /**
	   * openUrl
	   * @param  {string} url
	   */
	  openURL: function (url) {
	    location.href = url
	  }
	
	}
	
	event._meta = {
	  event: [{
	    name: 'openURL',
	    args: ['string']
	  }]
	}
	
	module.exports = event

/***/ },
/* 98 */
/***/ function(module, exports) {

	'use strict'
	
	var pageInfo = {
	
	  setTitle: function (title) {
	    title = title || 'Weex HTML5'
	    try {
	      title = decodeURIComponent(title)
	    } catch (e) {}
	    document.title = title
	  }
	}
	
	pageInfo._meta = {
	  pageInfo: [{
	    name: 'setTitle',
	    args: ['string']
	  }]
	}
	
	module.exports = pageInfo

/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict'
	
	var utils = __webpack_require__(13)
	var logger = __webpack_require__(30)
	
	__webpack_require__(100)
	
	var jsonpCnt = 0
	var ERROR_STATE = -1
	
	function _jsonp(config, callback, progressCallback) {
	  var cbName = 'jsonp_' + (++jsonpCnt)
	  var script, url, head
	
	  if (!config.url) {
	    logger.error('config.url should be set in _jsonp for \'fetch\' API.')
	  }
	
	  global[cbName] = (function (cb) {
	    return function (response) {
	      callback(response)
	      delete global[cb]
	    }
	  })(cbName)
	
	  script = document.createElement('script')
	  try {
	    url = lib.httpurl(config.url)
	  } catch (err) {
	    logger.error('invalid config.url in _jsonp for \'fetch\' API: '
	      + config.url)
	  }
	  url.params.callback = cbName
	  script.type = 'text/javascript'
	  script.src = url.toString()
	  // script.onerror is not working on IE or safari.
	  // but they are not considered here.
	  script.onerror = (function (cb) {
	    return function (err) {
	      logger.error('unexpected error in _jsonp for \'fetch\' API', err)
	      callback(err)
	      delete global[cb]
	    }
	  })(cbName)
	  head = document.getElementsByTagName('head')[0]
	  head.insertBefore(script, null)
	}
	
	function _xhr(config, callback, progressCallback) {
	  var xhr = new XMLHttpRequest()
	  xhr.responseType = config.type
	  xhr.open(config.method, config.url, true)
	
	  xhr.onload = function (res) {
	    callback({
	      status: xhr.status,
	      ok: xhr.status >= 200 && xhr.status < 300,
	      statusText: xhr.statusText,
	      data: xhr.response,
	      headers: xhr.getAllResponseHeaders().split('\n')
	        .reduce(function (obj, headerStr) {
	          var headerArr = headerStr.match(/(.+): (.+)/)
	          if (headerArr) {
	            obj[headerArr[1]] = headerArr[2]
	          }
	          return obj
	        }, {})
	    })
	  }
	
	  if (progressCallback) {
	    xhr.onprogress = function (e) {
	      progressCallback({
	        readyState: xhr.readyState,
	        status: xhr.status,
	        length: e.loaded,
	        total: e.total,
	        statusText: xhr.statusText,
	        headers: xhr.getAllResponseHeaders().split('\n')
	          .reduce(function (obj, headerStr) {
	            var headerArr = headerStr.match(/(.+): (.+)/)
	            if (headerArr) {
	              obj[headerArr[1]] = headerArr[2]
	            }
	            return obj
	          }, {})
	      })
	    }
	  }
	
	  xhr.onerror = function (err) {
	    logger.error('unexpected error in _xhr for \'fetch\' API', err)
	    callback({
	      status: ERROR_STATE,
	      ok: false,
	      statusText: '',
	      data: '',
	      headers: {}
	    })
	  }
	
	  xhr.send(config.body)
	}
	
	var stream = {
	
	  /**
	   * sendHttp
	   * Note: This API is deprecated. Please use stream.fetch instead.
	   * send a http request through XHR.
	   * @deprecated
	   * @param  {obj} params
	   *  - method: 'GET' | 'POST',
	   *  - url: url requested
	   * @param  {string} callbackId
	   */
	  sendHttp: function (param, callbackId) {
	    if (typeof param === 'string') {
	      try {
	        param = JSON.parse(param)
	      } catch (e) {
	        return
	      }
	    }
	    if (typeof param !== 'object' || !param.url) {
	      return logger.error(
	        'invalid config or invalid config.url for sendHttp API')
	    }
	
	    var sender = this.sender
	    var method = param.method || 'GET'
	    var xhr = new XMLHttpRequest()
	    xhr.open(method, param.url, true)
	    xhr.onload = function () {
	      sender.performCallback(callbackId, this.responseText)
	    }
	    xhr.onerror = function (error) {
	      return logger.error('unexpected error in sendHttp API', error)
	      sender.performCallback(
	        callbackId,
	        new Error('unexpected error in sendHttp API')
	      )
	    }
	    xhr.send()
	  },
	
	  /**
	   * fetch
	   * use stream.fetch to request for a json file, a plain text file or
	   * a arraybuffer for a file stream. (You can use Blob and FileReader
	   * API implemented by most modern browsers to read a arraybuffer.)
	   * @param  {object} options config options
	   *   - method {string} 'GET' | 'POST'
	   *   - headers {obj}
	   *   - url {string}
	   *   - mode {string} 'cors' | 'no-cors' | 'same-origin' | 'navigate'
	   *   - body
	   *   - type {string} 'json' | 'jsonp' | 'text'
	   * @param  {string} callbackId
	   * @param  {string} progressCallbackId
	   */
	  fetch: function (options, callbackId, progressCallbackId) {
	
	    var DEFAULT_METHOD = 'GET'
	    var DEFAULT_MODE = 'cors'
	    var DEFAULT_TYPE = 'text'
	
	    var methodOptions = ['GET', 'POST']
	    var modeOptions = ['cors', 'no-cors', 'same-origin', 'navigate']
	    var typeOptions = ['text', 'json', 'jsonp', 'arraybuffer']
	
	    var fallback = false  // fallback from 'fetch' API to XHR.
	    var sender = this.sender
	
	    var config = utils.extend({}, options)
	
	    // validate options.method
	    if (typeof config.method === 'undefined') {
	      config.method = DEFAULT_METHOD
	      logger.warn('options.method for \'fetch\' API has been set to '
	        + 'default value \'' + config.method + '\'')
	    } else if (methodOptions.indexOf((config.method + '')
	        .toUpperCase()) === -1) {
	      return logger.error('options.method \''
	        + config.method
	        + '\' for \'fetch\' API should be one of '
	        + methodOptions + '.')
	    }
	
	    // validate options.url
	    if (!config.url) {
	      return logger.error('options.url should be set for \'fetch\' API.')
	    }
	
	    // validate options.mode
	    if (typeof config.mode === 'undefined') {
	      config.mode = DEFAULT_MODE
	    } else if (modeOptions.indexOf((config.mode + '').toLowerCase()) === -1) {
	      return logger.error('options.mode \''
	        + config.mode
	        + '\' for \'fetch\' API should be one of '
	        + modeOptions + '.')
	    }
	
	    // validate options.type
	    if (typeof config.type === 'undefined') {
	      config.type = DEFAULT_TYPE
	      logger.warn('options.type for \'fetch\' API has been set to '
	        + 'default value \'' + config.type + '\'.')
	    } else if (typeOptions.indexOf((config.type + '').toLowerCase()) === -1) {
	      return logger.error('options.type \''
	          + config.type
	          + '\' for \'fetch\' API should be one of '
	          + typeOptions + '.')
	    }
	
	    var _callArgs = [config, function (res) {
	      sender.performCallback(callbackId, res)
	    }]
	    if (progressCallbackId) {
	      _callArgs.push(function (res) {
	        // Set 'keepAlive' to true for sending continuous callbacks
	        sender.performCallback(progressCallbackId, res, true)
	      })
	    }
	
	    if (config.type === 'jsonp') {
	      _jsonp.apply(this, _callArgs)
	    } else {
	      _xhr.apply(this, _callArgs)
	    }
	  }
	
	}
	
	stream._meta = {
	  stream: [{
	    name: 'sendHttp',
	    args: ['object', 'function']
	  }, {
	    name: 'fetch',
	    args: ['object', 'function', 'function']
	  }]
	}
	
	module.exports = stream
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 100 */
/***/ function(module, exports) {

	(typeof window === 'undefined') && (window = {ctrl: {}, lib: {}});!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});!function(a,b){function c(a){var b={};Object.defineProperty(this,"params",{set:function(a){if("object"==typeof a){for(var c in b)delete b[c];for(var c in a)b[c]=a[c]}},get:function(){return b},enumerable:!0}),Object.defineProperty(this,"search",{set:function(a){if("string"==typeof a){0===a.indexOf("?")&&(a=a.substr(1));var c=a.split("&");for(var d in b)delete b[d];for(var e=0;e<c.length;e++){var f=c[e].split("=");if(void 0!==f[1]&&(f[1]=f[1].toString()),f[0])try{b[decodeURIComponent(f[0])]=decodeURIComponent(f[1])}catch(g){b[f[0]]=f[1]}}}},get:function(){var a=[];for(var c in b)if(void 0!==b[c])if(""!==b[c])try{a.push(encodeURIComponent(c)+"="+encodeURIComponent(b[c]))}catch(d){a.push(c+"="+b[c])}else try{a.push(encodeURIComponent(c))}catch(d){a.push(c)}return a.length?"?"+a.join("&"):""},enumerable:!0});var c;Object.defineProperty(this,"hash",{set:function(a){"string"==typeof a&&(a&&a.indexOf("#")<0&&(a="#"+a),c=a||"")},get:function(){return c},enumerable:!0}),this.set=function(a){a=a||"";var b;if(!(b=a.match(new RegExp("^([a-z0-9-]+:)?[/]{2}(?:([^@/:?]+)(?::([^@/:]+))?@)?([^:/?#]+)(?:[:]([0-9]+))?([/][^?#;]*)?(?:[?]([^#]*))?([#][^?]*)?$","i"))))throw new Error("Wrong uri scheme.");this.protocol=b[1]||("object"==typeof location?location.protocol:""),this.username=b[2]||"",this.password=b[3]||"",this.hostname=this.host=b[4],this.port=b[5]||"",this.pathname=b[6]||"/",this.search=b[7]||"",this.hash=b[8]||"",this.origin=this.protocol+"//"+this.hostname},this.toString=function(){var a=this.protocol+"//";return this.username&&(a+=this.username,this.password&&(a+=":"+this.password),a+="@"),a+=this.host,this.port&&"80"!==this.port&&(a+=":"+this.port),this.pathname&&(a+=this.pathname),this.search&&(a+=this.search),this.hash&&(a+=this.hash),a},a&&this.set(a.toString())}b.httpurl=function(a){return new c(a)}}(window,window.lib||(window.lib={}));;module.exports = window.lib['httpurl'];

/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var modal = __webpack_require__(102)
	
	var msg = {
	
	  // duration: default is 0.8 seconds.
	  toast: function (config) {
	    modal.toast(config.message, config.duration)
	  },
	
	  // config:
	  //  - message: string
	  //  - okTitle: title of ok button
	  //  - callback
	  alert: function (config, callbackId) {
	    var sender =  this.sender
	    config.callback = function () {
	      sender.performCallback(callbackId)
	    }
	    modal.alert(config)
	  },
	
	  // config:
	  //  - message: string
	  //  - okTitle: title of ok button
	  //  - cancelTitle: title of cancel button
	  //  - callback
	  confirm: function (config, callbackId) {
	    var sender =  this.sender
	    config.callback = function (val) {
	      sender.performCallback(callbackId, val)
	    }
	    modal.confirm(config)
	  },
	
	  // config:
	  //  - message: string
	  //  - okTitle: title of ok button
	  //  - cancelTitle: title of cancel button
	  //  - callback
	  prompt: function (config, callbackId) {
	    var sender =  this.sender
	    config.callback = function (val) {
	      sender.performCallback(callbackId, val)
	    }
	    modal.prompt(config)
	  }
	
	}
	
	msg._meta = {
	  modal: [{
	    name: 'toast',
	    args: ['object']
	  }, {
	    name: 'alert',
	    args: ['object', 'string']
	  }, {
	    name: 'confirm',
	    args: ['object', 'string']
	  }, {
	    name: 'prompt',
	    args: ['object', 'string']
	  }]
	}
	
	module.exports = msg


/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Alert = __webpack_require__(103)
	var Confirm = __webpack_require__(109)
	var Prompt = __webpack_require__(112)
	var toast = __webpack_require__(115)
	
	var modal = {
	
	  toast: function (msg, duration) {
	    toast.push(msg, duration)
	  },
	
	  alert: function (config) {
	    new Alert(config).show()
	  },
	
	  prompt: function (config) {
	    new Prompt(config).show()
	  },
	
	  confirm: function (config) {
	    new Confirm(config).show()
	  }
	
	}
	
	!window.lib && (window.lib = {})
	window.lib.modal = modal
	
	module.exports = modal

/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Modal = __webpack_require__(104)
	__webpack_require__(107)
	
	var CONTENT_CLASS = 'content'
	var MSG_CLASS = 'content-msg'
	var BUTTON_GROUP_CLASS = 'btn-group'
	var BUTTON_CLASS = 'btn'
	
	function Alert(config) {
	  this.msg = config.message || ''
	  this.callback = config.callback
	  this.okTitle = config.okTitle || 'OK'
	  Modal.call(this)
	  this.node.classList.add('amfe-alert')
	}
	
	Alert.prototype = Object.create(Modal.prototype)
	
	Alert.prototype.createNodeContent = function () {
	  var content = document.createElement('div')
	  content.classList.add(CONTENT_CLASS)
	  this.node.appendChild(content)
	
	  var msg = document.createElement('div')
	  msg.classList.add(MSG_CLASS)
	  msg.appendChild(document.createTextNode(this.msg))
	  content.appendChild(msg)
	
	  var buttonGroup = document.createElement('div')
	  buttonGroup.classList.add(BUTTON_GROUP_CLASS)
	  this.node.appendChild(buttonGroup)
	  var button = document.createElement('div')
	  button.classList.add(BUTTON_CLASS, 'alert-ok')
	  button.appendChild(document.createTextNode(this.okTitle))
	  buttonGroup.appendChild(button)
	}
	
	Alert.prototype.bindEvents = function () {
	  Modal.prototype.bindEvents.call(this)
	  var button = this.node.querySelector('.' + BUTTON_CLASS)
	  button.addEventListener('click', function () {
	    this.destroy()
	    this.callback && this.callback()
	  }.bind(this))
	}
	
	module.exports = Alert


/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	__webpack_require__(105)
	
	// there will be only one instance of modal.
	var MODAL_WRAP_CLASS = 'amfe-modal-wrap'
	var MODAL_NODE_CLASS = 'amfe-modal-node'
	
	function Modal() {
	  this.wrap = document.querySelector(MODAL_WRAP_CLASS)
	  this.node = document.querySelector(MODAL_NODE_CLASS)
	  if (!this.wrap) {
	    this.createWrap()
	  }
	  if (!this.node) {
	    this.createNode()
	  }
	  this.clearNode()
	  this.createNodeContent()
	  this.bindEvents()
	}
	
	Modal.prototype = {
	
	  show: function () {
	    this.wrap.style.display = 'block'
	    this.node.classList.remove('hide')
	  },
	
	  destroy: function () {
	    document.body.removeChild(this.wrap)
	    document.body.removeChild(this.node)
	    this.wrap = null
	    this.node = null
	  },
	
	  createWrap: function () {
	    this.wrap = document.createElement('div')
	    this.wrap.className = MODAL_WRAP_CLASS
	    document.body.appendChild(this.wrap)
	  },
	
	  createNode: function () {
	    this.node = document.createElement('div')
	    this.node.classList.add(MODAL_NODE_CLASS, 'hide')
	    document.body.appendChild(this.node)
	  },
	
	  clearNode: function () {
	    this.node.innerHTML = ''
	  },
	
	  createNodeContent: function () {
	
	    // do nothing.
	    // child classes can override this method.
	  },
	
	  bindEvents: function () {
	    this.wrap.addEventListener('click', function (e) {
	      e.preventDefault()
	      e.stopPropagation()
	    })
	  }
	}
	
	module.exports = Modal


/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(106);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./modal.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./modal.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".amfe-modal-wrap {\n  display: none;\n  position: fixed;\n  z-index: 999999999;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background-color: #000;\n  opacity: 0.5;\n}\n\n.amfe-modal-node {\n  position: fixed;\n  z-index: 9999999999;\n  top: 50%;\n  left: 50%;\n  width: 6.666667rem;\n  min-height: 2.666667rem;\n  border-radius: 0.066667rem;\n  -webkit-transform: translate(-50%, -50%);\n  transform: translate(-50%, -50%);\n  background-color: #fff;\n}\n.amfe-modal-node.hide {\n  display: none;\n}\n.amfe-modal-node .content {\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-flex-direction: column;\n  flex-direction: column;\n  -webkit-box-align: center;\n  -webkit-align-items: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  -webkit-justify-content: center;\n  justify-content: center;\n  width: 100%;\n  min-height: 1.866667rem;\n  box-sizing: border-box;\n  font-size: 0.32rem;\n  line-height: 0.426667rem;\n  padding: 0.213333rem;\n  border-bottom: 1px solid #ddd;\n}\n.amfe-modal-node .btn-group {\n  width: 100%;\n  height: 0.8rem;\n  font-size: 0.373333rem;\n  text-align: center;\n  margin: 0;\n  padding: 0;\n  border: none;\n}\n.amfe-modal-node .btn-group .btn {\n  box-sizing: border-box;\n  height: 0.8rem;\n  line-height: 0.8rem;\n  margin: 0;\n  padding: 0;\n  border: none;\n  background: none;\n}\n", ""]);
	
	// exports


/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(108);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./alert.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./alert.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".amfe-alert .amfe-alert-ok {\n  width: 100%;\n}\n", ""]);
	
	// exports


/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Modal = __webpack_require__(104)
	__webpack_require__(110)
	
	var CONTENT_CLASS = 'content'
	var MSG_CLASS = 'content-msg'
	var BUTTON_GROUP_CLASS = 'btn-group'
	var BUTTON_CLASS = 'btn'
	
	function Confirm(config) {
	  this.msg = config.message || ''
	  this.callback = config.callback
	  this.okTitle = config.okTitle || 'OK'
	  this.cancelTitle = config.cancelTitle || 'Cancel'
	  Modal.call(this)
	  this.node.classList.add('amfe-confirm')
	}
	
	Confirm.prototype = Object.create(Modal.prototype)
	
	Confirm.prototype.createNodeContent = function () {
	  var content = document.createElement('div')
	  content.classList.add(CONTENT_CLASS)
	  this.node.appendChild(content)
	
	  var msg = document.createElement('div')
	  msg.classList.add(MSG_CLASS)
	  msg.appendChild(document.createTextNode(this.msg))
	  content.appendChild(msg)
	
	  var buttonGroup = document.createElement('div')
	  buttonGroup.classList.add(BUTTON_GROUP_CLASS)
	  this.node.appendChild(buttonGroup)
	  var btnOk = document.createElement('div')
	  btnOk.appendChild(document.createTextNode(this.okTitle))
	  btnOk.classList.add('btn-ok', BUTTON_CLASS)
	  var btnCancel = document.createElement('div')
	  btnCancel.appendChild(document.createTextNode(this.cancelTitle))
	  btnCancel.classList.add('btn-cancel', BUTTON_CLASS)
	  buttonGroup.appendChild(btnOk)
	  buttonGroup.appendChild(btnCancel)
	  this.node.appendChild(buttonGroup)
	}
	
	Confirm.prototype.bindEvents = function () {
	  Modal.prototype.bindEvents.call(this)
	  var btnOk = this.node.querySelector('.' + BUTTON_CLASS + '.btn-ok')
	  var btnCancel = this.node.querySelector('.' + BUTTON_CLASS + '.btn-cancel')
	  btnOk.addEventListener('click', function () {
	    this.destroy()
	    this.callback && this.callback(this.okTitle)
	  }.bind(this))
	  btnCancel.addEventListener('click', function () {
	    this.destroy()
	    this.callback && this.callback(this.cancelTitle)
	  }.bind(this))
	}
	
	module.exports = Confirm


/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(111);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./confirm.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./confirm.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 111 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".amfe-confirm .btn-group .btn {\n  float: left;\n  width: 50%;\n}\n.amfe-confirm .btn-group .btn.btn-ok {\n  border-right: 1px solid #ddd;\n}\n", ""]);
	
	// exports


/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Modal = __webpack_require__(104)
	__webpack_require__(113)
	
	var CONTENT_CLASS = 'content'
	var MSG_CLASS = 'content-msg'
	var BUTTON_GROUP_CLASS = 'btn-group'
	var BUTTON_CLASS = 'btn'
	var INPUT_WRAP_CLASS = 'input-wrap'
	var INPUT_CLASS = 'input'
	
	function Prompt(config) {
	  this.msg = config.message || ''
	  this.defaultMsg = config.default || ''
	  this.callback = config.callback
	  this.okTitle = config.okTitle || 'OK'
	  this.cancelTitle = config.cancelTitle || 'Cancel'
	  Modal.call(this)
	  this.node.classList.add('amfe-prompt')
	}
	
	Prompt.prototype = Object.create(Modal.prototype)
	
	Prompt.prototype.createNodeContent = function () {
	
	  var content = document.createElement('div')
	  content.classList.add(CONTENT_CLASS)
	  this.node.appendChild(content)
	
	  var msg = document.createElement('div')
	  msg.classList.add(MSG_CLASS)
	  msg.appendChild(document.createTextNode(this.msg))
	  content.appendChild(msg)
	
	  var inputWrap = document.createElement('div')
	  inputWrap.classList.add(INPUT_WRAP_CLASS)
	  content.appendChild(inputWrap)
	  var input = document.createElement('input')
	  input.classList.add(INPUT_CLASS)
	  input.type = 'text'
	  input.autofocus = true
	  input.placeholder = this.defaultMsg
	  inputWrap.appendChild(input)
	
	  var buttonGroup = document.createElement('div')
	  buttonGroup.classList.add(BUTTON_GROUP_CLASS)
	  var btnOk = document.createElement('div')
	  btnOk.appendChild(document.createTextNode(this.okTitle))
	  btnOk.classList.add('btn-ok', BUTTON_CLASS)
	  var btnCancel = document.createElement('div')
	  btnCancel.appendChild(document.createTextNode(this.cancelTitle))
	  btnCancel.classList.add('btn-cancel', BUTTON_CLASS)
	  buttonGroup.appendChild(btnOk)
	  buttonGroup.appendChild(btnCancel)
	  this.node.appendChild(buttonGroup)
	}
	
	Prompt.prototype.bindEvents = function () {
	  Modal.prototype.bindEvents.call(this)
	  var btnOk = this.node.querySelector('.' + BUTTON_CLASS + '.btn-ok')
	  var btnCancel = this.node.querySelector('.' + BUTTON_CLASS + '.btn-cancel')
	  var that = this
	  btnOk.addEventListener('click', function () {
	    var val = document.querySelector('input').value
	    this.destroy()
	    this.callback && this.callback({
	      result: that.okTitle,
	      data: val
	    })
	  }.bind(this))
	  btnCancel.addEventListener('click', function () {
	    var val = document.querySelector('input').value
	    this.destroy()
	    this.callback && this.callback({
	      result: that.cancelTitle,
	      data: val
	    })
	  }.bind(this))
	}
	
	module.exports = Prompt


/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(114);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./prompt.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./prompt.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 114 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".amfe-prompt .input-wrap {\n  box-sizing: border-box;\n  width: 100%;\n  margin-top: 0.133333rem;\n  // padding: 0.24rem 0.213333rem 0.213333rem;\n  height: 0.96rem;\n}\n.amfe-prompt .input-wrap .input {\n  box-sizing: border-box;\n  width: 100%;\n  height: 0.56rem;\n  line-height: 0.56rem;\n  font-size: 0.32rem;\n  border: 1px solid #999;\n}\n.amfe-prompt .btn-group .btn {\n  float: left;\n  width: 50%;\n}\n.amfe-prompt .btn-group .btn.btn-ok {\n  border-right: 1px solid #ddd;\n}\n", ""]);
	
	// exports


/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	__webpack_require__(116)
	
	var queue = []
	var timer
	var isProcessing = false
	var toastWin
	var TOAST_WIN_CLASS_NAME = 'amfe-toast'
	
	var DEFAULT_DURATION = 0.8
	
	function showToastWindow(msg, callback) {
	  var handleTransitionEnd = function () {
	    toastWin.removeEventListener('transitionend', handleTransitionEnd)
	    callback && callback()
	  }
	  if (!toastWin) {
	    toastWin = document.createElement('div')
	    toastWin.classList.add(TOAST_WIN_CLASS_NAME, 'hide')
	    document.body.appendChild(toastWin)
	  }
	  toastWin.innerHTML = msg
	  toastWin.addEventListener('transitionend', handleTransitionEnd)
	  setTimeout(function () {
	    toastWin.classList.remove('hide')
	  }, 0)
	}
	
	function hideToastWindow(callback) {
	  var handleTransitionEnd = function () {
	    toastWin.removeEventListener('transitionend', handleTransitionEnd)
	    callback && callback()
	  }
	  if (!toastWin) {
	    return
	  }
	  toastWin.addEventListener('transitionend', handleTransitionEnd)
	  toastWin.classList.add('hide')
	}
	
	var toast = {
	
	  push: function (msg, duration) {
	    queue.push({
	      msg: msg,
	      duration: duration || DEFAULT_DURATION
	    })
	    this.show()
	  },
	
	  show: function () {
	    var that = this
	
	    // All messages had been toasted already, so remove the toast window,
	    if (!queue.length) {
	      toastWin && toastWin.parentNode.removeChild(toastWin)
	      toastWin = null
	      return
	    }
	
	    // the previous toast is not ended yet.
	    if (isProcessing) {
	      return
	    }
	    isProcessing = true
	
	    var toastInfo = queue.shift()
	    showToastWindow(toastInfo.msg, function () {
	      timer = setTimeout(function () {
	        timer = null
	        hideToastWindow(function () {
	          isProcessing = false
	          that.show()
	        })
	      }, toastInfo.duration * 1000)
	    })
	  }
	
	}
	
	module.exports = {
	  push: toast.push.bind(toast)
	}


/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(117);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../css-loader/index.js!./toast.css", function() {
				var newContent = require("!!./../../css-loader/index.js!./toast.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 117 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	
	
	// module
	exports.push([module.id, ".amfe-toast {\n  font-size: 0.32rem;\n  line-height: 0.426667rem;\n  position: fixed;\n  box-sizing: border-box;\n  max-width: 80%;\n  bottom: 2.666667rem;\n  left: 50%;\n  padding: 0.213333rem;\n  background-color: #000;\n  color: #fff;\n  text-align: center;\n  opacity: 0.6;\n  transition: all 0.4s ease-in-out;\n  border-radius: 0.066667rem;\n  -webkit-transform: translateX(-50%);\n  transform: translateX(-50%);\n}\n\n.amfe-toast.hide {\n  opacity: 0;\n}\n", ""]);
	
	// exports


/***/ },
/* 118 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var Sender = __webpack_require__(26)
	
	var _data = {}
	
	var animation = {
	
	  /**
	   * transition
	   * @param  {string} ref        [description]
	   * @param  {obj} config     [description]
	   * @param  {string} callbackId [description]
	   */
	  transition: function (ref, config, callbackId) {
	    var refData = _data[ref]
	    var stylesKey = JSON.stringify(config.styles)
	    var weexInstance = this
	    // If the same component perform a animation with exactly the same
	    // styles in a sequence with so short interval that the prev animation
	    // is still in playing, then the next animation should be ignored.
	    if (refData && refData[stylesKey]) {
	      return
	    }
	    if (!refData) {
	      refData = _data[ref] = {}
	    }
	    refData[stylesKey] = true
	    return this.getComponentManager().transition(ref, config, function () {
	      // Remove the stylesKey in refData so that the same animation
	      // can be played again after current animation is already finished.
	      delete refData[stylesKey]
	      weexInstance.sender.performCallback(callbackId)
	    })
	  }
	
	}
	
	animation._meta = {
	  animation: [{
	    name: 'transition',
	    args: ['string', 'object', 'string']
	  }]
	}
	
	module.exports = animation


/***/ },
/* 119 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'
	
	var sender = __webpack_require__(26)
	
	var webview = {
	
	  // ref: ref of the web component.
	  goBack: function (ref) {
	    var webComp = this.getComponentManager().getElementByRef(ref)
	    if (!webComp.goBack) {
	      console.error('error: the specified component has no method of'
	          + ' goBack. Please make sure it is a webview component.')
	      return
	    }
	    webComp.goBack()
	  },
	
	  // ref: ref of the web component.
	  goForward: function (ref) {
	    var webComp = this.getComponentManager().getElementByRef(ref)
	    if (!webComp.goForward) {
	      console.error('error: the specified component has no method of'
	          + ' goForward. Please make sure it is a webview component.')
	      return
	    }
	    webComp.goForward()
	  },
	
	  // ref: ref of the web component.
	  reload: function (ref) {
	    var webComp = this.getComponentManager().getElementByRef(ref)
	    if (!webComp.reload) {
	      console.error('error: the specified component has no method of'
	          + ' reload. Please make sure it is a webview component.')
	      return
	    }
	    webComp.reload()
	  }
	
	}
	
	webview._meta = {
	  webview: [{
	    name: 'goBack',
	    args: ['string']
	  }, {
	    name: 'goForward',
	    args: ['string']
	  }, {
	    name: 'reload',
	    args: ['string']
	  }]
	}
	
	module.exports = webview


/***/ },
/* 120 */
/***/ function(module, exports) {

	'use strict'
	
	var timer = {
	
	  setTimeout: function (timeoutCallbackId, delay) {
	    var sender = this.sender
	    var timerId = setTimeout(function () {
	      sender.performCallback(timeoutCallbackId)
	    }, delay)
	  },
	
	  clearTimeout: function (timerId) {
	    clearTimeout(timerId)
	  }
	
	}
	
	timer._meta = {
	  timer: [{
	    name: 'setTimeout',
	    args: ['function', 'number']
	  }, {
	    name: 'clearTimeout',
	    args: ['number']
	  }]
	}
	
	module.exports = timer


/***/ },
/* 121 */
/***/ function(module, exports) {

	'use strict'
	
	var navigator = {
	
	  // config
	  //  - url: the url to push
	  //  - animated: this configuration item is native only
	  //  callback is not currently supported
	  push: function (config, callbackId) {
	    window.location.href = config.url
	    this.sender.performCallback(callbackId)
	  },
	
	  // config
	  //  - animated: this configuration item is native only
	  //  callback is note currently supported
	  pop: function (config, callbackId) {
	    window.history.back()
	    this.sender.performCallback(callbackId)
	  }
	
	}
	
	navigator._meta = {
	  navigator: [{
	    name: 'push',
	    args: ['object', 'function']
	  }, {
	    name: 'pop',
	    args: ['object', 'function']
	  }]
	}
	
	module.exports = navigator


/***/ },
/* 122 */
/***/ function(module, exports) {

	(typeof window === 'undefined') && (window = {ctrl: {}, lib: {}});!window.ctrl && (window.ctrl = {});!window.lib && (window.lib = {});!function(a,b){function c(a){Object.defineProperty(this,"val",{value:a.toString(),enumerable:!0}),this.gt=function(a){return c.compare(this,a)>0},this.gte=function(a){return c.compare(this,a)>=0},this.lt=function(a){return c.compare(this,a)<0},this.lte=function(a){return c.compare(this,a)<=0},this.eq=function(a){return 0===c.compare(this,a)}}b.env=b.env||{},c.prototype.toString=function(){return this.val},c.prototype.valueOf=function(){for(var a=this.val.split("."),b=[],c=0;c<a.length;c++){var d=parseInt(a[c],10);isNaN(d)&&(d=0);var e=d.toString();e.length<5&&(e=Array(6-e.length).join("0")+e),b.push(e),1===b.length&&b.push(".")}return parseFloat(b.join(""))},c.compare=function(a,b){a=a.toString().split("."),b=b.toString().split(".");for(var c=0;c<a.length||c<b.length;c++){var d=parseInt(a[c],10),e=parseInt(b[c],10);if(window.isNaN(d)&&(d=0),window.isNaN(e)&&(e=0),e>d)return-1;if(d>e)return 1}return 0},b.version=function(a){return new c(a)}}(window,window.lib||(window.lib={})),function(a,b){b.env=b.env||{};var c=a.location.search.replace(/^\?/,"");if(b.env.params={},c)for(var d=c.split("&"),e=0;e<d.length;e++){d[e]=d[e].split("=");try{b.env.params[d[e][0]]=decodeURIComponent(d[e][1])}catch(f){b.env.params[d[e][0]]=d[e][1]}}}(window,window.lib||(window.lib={})),function(a,b){b.env=b.env||{};var c,d=a.navigator.userAgent;if(c=d.match(/Windows\sPhone\s(?:OS\s)?([\d\.]+)/))b.env.os={name:"Windows Phone",isWindowsPhone:!0,version:c[1]};else if(d.match(/Safari/)&&(c=d.match(/Android[\s\/]([\d\.]+)/)))b.env.os={version:c[1]},d.match(/Mobile\s+Safari/)?(b.env.os.name="Android",b.env.os.isAndroid=!0):(b.env.os.name="AndroidPad",b.env.os.isAndroidPad=!0);else if(c=d.match(/(iPhone|iPad|iPod)/)){var e=c[1];c=d.match(/OS ([\d_\.]+) like Mac OS X/),b.env.os={name:e,isIPhone:"iPhone"===e||"iPod"===e,isIPad:"iPad"===e,isIOS:!0,version:c[1].split("_").join(".")}}else b.env.os={name:"unknown",version:"0.0.0"};b.version&&(b.env.os.version=b.version(b.env.os.version))}(window,window.lib||(window.lib={})),function(a,b){b.env=b.env||{};var c,d=a.navigator.userAgent;(c=d.match(/(?:UCWEB|UCBrowser\/)([\d\.]+)/))?b.env.browser={name:"UC",isUC:!0,version:c[1]}:(c=d.match(/MQQBrowser\/([\d\.]+)/))?b.env.browser={name:"QQ",isQQ:!0,version:c[1]}:(c=d.match(/Firefox\/([\d\.]+)/))?b.env.browser={name:"Firefox",isFirefox:!0,version:c[1]}:(c=d.match(/MSIE\s([\d\.]+)/))||(c=d.match(/IEMobile\/([\d\.]+)/))?(b.env.browser={version:c[1]},d.match(/IEMobile/)?(b.env.browser.name="IEMobile",b.env.browser.isIEMobile=!0):(b.env.browser.name="IE",b.env.browser.isIE=!0),d.match(/Android|iPhone/)&&(b.env.browser.isIELikeWebkit=!0)):(c=d.match(/(?:Chrome|CriOS)\/([\d\.]+)/))?(b.env.browser={name:"Chrome",isChrome:!0,version:c[1]},d.match(/Version\/[\d+\.]+\s*Chrome/)&&(b.env.browser.name="Chrome Webview",b.env.browser.isWebview=!0)):d.match(/Safari/)&&(c=d.match(/Android[\s\/]([\d\.]+)/))?b.env.browser={name:"Android",isAndroid:!0,version:c[1]}:d.match(/iPhone|iPad|iPod/)?d.match(/Safari/)?(c=d.match(/Version\/([\d\.]+)/),b.env.browser={name:"Safari",isSafari:!0,version:c[1]}):(c=d.match(/OS ([\d_\.]+) like Mac OS X/),b.env.browser={name:"iOS Webview",isWebview:!0,version:c[1].replace(/\_/g,".")}):b.env.browser={name:"unknown",version:"0.0.0"},b.version&&(b.env.browser.version=b.version(b.env.browser.version))}(window,window.lib||(window.lib={})),function(a,b){b.env=b.env||{};var c=a.navigator.userAgent;c.match(/Weibo/i)?b.env.thirdapp={appname:"Weibo",isWeibo:!0}:c.match(/MicroMessenger/i)?b.env.thirdapp={appname:"Weixin",isWeixin:!0}:b.env.thirdapp=!1}(window,window.lib||(window.lib={})),function(a,b){b.env=b.env||{};var c,d,e=a.navigator.userAgent;(d=e.match(/WindVane[\/\s]([\d\.\_]+)/))&&(c=d[1]);var f=!1,g="",h="",i="";(d=e.match(/AliApp\(([A-Z\-]+)\/([\d\.]+)\)/i))&&(f=!0,g=d[1],i=d[2],h=g.indexOf("-PD")>0?b.env.os.isIOS?"iPad":b.env.os.isAndroid?"AndroidPad":b.env.os.name:b.env.os.name),!g&&e.indexOf("TBIOS")>0&&(g="TB"),f?b.env.aliapp={windvane:b.version(c||"0.0.0"),appname:g||"unkown",version:b.version(i||"0.0.0"),platform:h||b.env.os.name}:b.env.aliapp=!1,b.env.taobaoApp=b.env.aliapp}(window,window.lib||(window.lib={}));;module.exports = window.lib['env'];

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNWY4NTIwNzkwZDc3MWFhNjg0OTUiLCJ3ZWJwYWNrOi8vLy4vc3JjL3dlZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0eWxlcy9iYXNlLmNzcz82YTZiIiwid2VicGFjazovLy8uL3NyYy9zdHlsZXMvYmFzZS5jc3MiLCJ3ZWJwYWNrOi8vLy4vfi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qcyIsIndlYnBhY2s6Ly8vLi9+L3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9lczYtcHJvbWlzZS9kaXN0L2VzNi1wcm9taXNlLmpzIiwid2VicGFjazovLy8od2VicGFjaykvfi9ub2RlLWxpYnMtYnJvd3Nlci9+L3Byb2Nlc3MvYnJvd3Nlci5qcyIsIndlYnBhY2s6Ly8vKHdlYnBhY2spL2J1aWxkaW4vbW9kdWxlLmpzIiwid2VicGFjazovLy92ZXJ0eCAoaWdub3JlZCkiLCJ3ZWJwYWNrOi8vLyh3ZWJwYWNrKS9idWlsZGluL2FtZC1kZWZpbmUuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2ZsZXhpYmxlLmpzIiwid2VicGFjazovLy8uL3NyYy9jb25maWcuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xvYWRlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3Byb3RvY29sLmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRNYW5hZ2VyLmpzIiwid2VicGFjazovLy8uL3NyYy9mcmFtZVVwZGF0ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwcGVhcldhdGNoZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xhenlMb2FkLmpzIiwid2VicGFjazovLy8uL34vbGF6eWltZy9idWlsZC9pbWcuY29tbW9uLmpzIiwid2VicGFjazovLy8uL34vbGF6eWltZy9+L2FwcGVhcmpzL2J1aWxkL2FwcGVhci5jb21tb24uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FuaW1hdGlvbi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9jb21wb25lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2ZsZXhib3guanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3ZhbHVlRmlsdGVyLmpzIiwid2VicGFjazovLy8uL34vZml4ZWRzdGlja3kvYnVpbGQvc3RpY2t5LmNvbW1vbi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYnJpZGdlL3NlbmRlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYnJpZGdlL3JlY2VpdmVyLmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL3Jvb3QuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xvZ2dlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9jb250YWluZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0eWxlcy9jb250YWluZXIuY3NzPzUyNTkiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0eWxlcy9jb250YWluZXIuY3NzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL2ltYWdlLmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL2F0b21pYy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3R5bGVzL2ltYWdlLmNzcz82ODUxIiwid2VicGFjazovLy8uL3NyYy9zdHlsZXMvaW1hZ2UuY3NzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL3RleHQuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvdmxpc3QuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvbGlzdC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3R5bGVzL2xpc3QuY3NzPzA1ZDQiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0eWxlcy9saXN0LmNzcyIsIndlYnBhY2s6Ly8vLi9zcmMvc2Nyb2xsLmpzIiwid2VicGFjazovLy8uL3NyYy9tb3Rpb24uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvaGxpc3QuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvY291bnRkb3duLmpzIiwid2VicGFjazovLy8uL34va291bnRkb3duL3NyYy9jb3VudGRvd24uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvbWFycXVlZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9zbGlkZXIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9jYXJyb3VzZWwvYnVpbGQvY2Fycm91c2VsLmNvbW1vbi5qcyIsIndlYnBhY2s6Ly8vLi9+L2FuaW1hdGlvbmpzL2J1aWxkL2FuaW1hdGlvbi5jb21tb24uanMiLCJ3ZWJwYWNrOi8vLy4vfi9jdWJpY2Jlemllci9idWlsZC9jdWJpY2Jlemllci5jb21tb24uanMiLCJ3ZWJwYWNrOi8vLy4vfi9jYXJyb3VzZWwvfi9nZXN0dXJlanMvYnVpbGQvZ2VzdHVyZWpzLmNvbW1vbi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3R5bGVzL3NsaWRlci5jc3M/MzM1YyIsIndlYnBhY2s6Ly8vLi9zcmMvc3R5bGVzL3NsaWRlci5jc3MiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvaW5kaWNhdG9yLmpzIiwid2VicGFjazovLy8uL3NyYy9zdHlsZXMvaW5kaWNhdG9yLmNzcz8wODM3Iiwid2VicGFjazovLy8uL3NyYy9zdHlsZXMvaW5kaWNhdG9yLmNzcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy90YWJoZWFkZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL21lc3NhZ2VRdWV1ZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3R5bGVzL3RhYmhlYWRlci5jc3M/YTVhMSIsIndlYnBhY2s6Ly8vLi9zcmMvc3R5bGVzL3RhYmhlYWRlci5jc3MiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvc2Nyb2xsZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0eWxlcy9zY3JvbGxlci5jc3M/M2IzYyIsIndlYnBhY2s6Ly8vLi9zcmMvc3R5bGVzL3Njcm9sbGVyLmNzcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9pbnB1dC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9zZWxlY3QuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvZGF0ZXBpY2tlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy90aW1lcGlja2VyLmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL3ZpZGVvLmpzIiwid2VicGFjazovLy8uL3NyYy9zdHlsZXMvdmlkZW8uY3NzPzNiOGIiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0eWxlcy92aWRlby5jc3MiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvc3dpdGNoLmpzIiwid2VicGFjazovLy8uL3NyYy9zdHlsZXMvc3dpdGNoLmNzcz83ZjlhIiwid2VicGFjazovLy8uL3NyYy9zdHlsZXMvc3dpdGNoLmNzcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9hLmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL2VtYmVkLmpzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL3JlZnJlc2guanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0eWxlcy9yZWZyZXNoLmNzcz8xOTAwIiwid2VicGFjazovLy8uL3NyYy9zdHlsZXMvcmVmcmVzaC5jc3MiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvbG9hZGluZy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3R5bGVzL2xvYWRpbmcuY3NzP2M4MmMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0eWxlcy9sb2FkaW5nLmNzcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9zcGlubmVyLmpzIiwid2VicGFjazovLy8uL3NyYy9zdHlsZXMvc3Bpbm5lci5jc3M/NGE5NyIsIndlYnBhY2s6Ly8vLi9zcmMvc3R5bGVzL3NwaW5uZXIuY3NzIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL3dlYi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXBpL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9hcGkvZG9tLmpzIiwid2VicGFjazovLy8uL34vc2Nyb2xsLXRvL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vc2Nyb2xsLXRvL34vY29tcG9uZW50LXR3ZWVuL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vc2Nyb2xsLXRvL34vY29tcG9uZW50LXR3ZWVuL34vY29tcG9uZW50LWVtaXR0ZXIvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9zY3JvbGwtdG8vfi9jb21wb25lbnQtdHdlZW4vfi9jb21wb25lbnQtY2xvbmUvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9zY3JvbGwtdG8vfi9jb21wb25lbnQtdHdlZW4vfi9jb21wb25lbnQtdHlwZS9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L3Njcm9sbC10by9+L2NvbXBvbmVudC10d2Vlbi9+L2Vhc2UtY29tcG9uZW50L2luZGV4LmpzIiwid2VicGFjazovLy8uL34vc2Nyb2xsLXRvL34vY29tcG9uZW50LXJhZi9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXBpL2V2ZW50LmpzIiwid2VicGFjazovLy8uL3NyYy9hcGkvcGFnZUluZm8uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwaS9zdHJlYW0uanMiLCJ3ZWJwYWNrOi8vLy4vfi9odHRwdXJsL2J1aWxkL2h0dHB1cmwuY29tbW9uLmpzIiwid2VicGFjazovLy8uL3NyYy9hcGkvbW9kYWwuanMiLCJ3ZWJwYWNrOi8vLy4vfi9tb2RhbHMvc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vbW9kYWxzL3NyYy9hbGVydC5qcyIsIndlYnBhY2s6Ly8vLi9+L21vZGFscy9zcmMvbW9kYWwuanMiLCJ3ZWJwYWNrOi8vLy4vfi9tb2RhbHMvc3R5bGVzL21vZGFsLmNzcz82YzZkIiwid2VicGFjazovLy8uL34vbW9kYWxzL3N0eWxlcy9tb2RhbC5jc3MiLCJ3ZWJwYWNrOi8vLy4vfi9tb2RhbHMvc3R5bGVzL2FsZXJ0LmNzcz9iZWFmIiwid2VicGFjazovLy8uL34vbW9kYWxzL3N0eWxlcy9hbGVydC5jc3MiLCJ3ZWJwYWNrOi8vLy4vfi9tb2RhbHMvc3JjL2NvbmZpcm0uanMiLCJ3ZWJwYWNrOi8vLy4vfi9tb2RhbHMvc3R5bGVzL2NvbmZpcm0uY3NzPzBjOTIiLCJ3ZWJwYWNrOi8vLy4vfi9tb2RhbHMvc3R5bGVzL2NvbmZpcm0uY3NzIiwid2VicGFjazovLy8uL34vbW9kYWxzL3NyYy9wcm9tcHQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9tb2RhbHMvc3R5bGVzL3Byb21wdC5jc3M/ZDE1YyIsIndlYnBhY2s6Ly8vLi9+L21vZGFscy9zdHlsZXMvcHJvbXB0LmNzcyIsIndlYnBhY2s6Ly8vLi9+L21vZGFscy9zcmMvdG9hc3QuanMiLCJ3ZWJwYWNrOi8vLy4vfi9tb2RhbHMvc3R5bGVzL3RvYXN0LmNzcz9lMTJmIiwid2VicGFjazovLy8uL34vbW9kYWxzL3N0eWxlcy90b2FzdC5jc3MiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwaS9hbmltYXRpb24uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwaS93ZWJ2aWV3LmpzIiwid2VicGFjazovLy8uL3NyYy9hcGkvdGltZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwaS9uYXZpZ2F0b3IuanMiLCJ3ZWJwYWNrOi8vLy4vfi9lbnZkL2J1aWxkL2VudmQuY29tbW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7OztBQ3RDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUEsRUFBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxFQUFDOztBQUVEOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0EsSUFBRzs7QUFFSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTCxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0Esc0NBQXFDO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBa0MsT0FBTztBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0wsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVE7O0FBRVIsSUFBRzs7QUFFSDtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FB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Q1Q7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSwyR0FBMEc7O0FBRTFHO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQThCLHNCQUFzQjs7QUFFcEQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxzQkFBcUIsK0JBQStCO0FBQ3BEO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBLE1BQUs7QUFDTDtBQUNBLE1BQUs7QUFDTDtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsUUFBTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBdUIsUUFBUTtBQUMvQjtBQUNBO0FBQ0E7QUFDQSxZQUFXO0FBQ1g7QUFDQTtBQUNBLFVBQVM7QUFDVCx3QkFBdUIsUUFBUTtBQUMvQjs7QUFFQTtBQUNBLFVBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQSxVQUFTO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQSxVQUFTO0FBQ1Q7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsbUVBQWtFLFFBQVE7O0FBRTFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxtRUFBa0UsUUFBUTtBQUMxRTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsc0NBQXFDLFFBQVE7O0FBRTdDOztBQUVBLHNCQUFxQix3QkFBd0I7QUFDN0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxRQUFPO0FBQ1A7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQSxRQUFPO0FBQ1A7QUFDQSxRQUFPO0FBQ1A7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0EsVUFBUztBQUNULFFBQU87QUFDUDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVCxRQUFPO0FBQ1A7QUFDQTtBQUNBLDBCQUF5QixZQUFZO0FBQ3JDO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFFBQU87O0FBRVA7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBLFFBQU87QUFDUDs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFlO0FBQ2Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7O0FBRUE7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBLFFBQU87QUFDUDs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFFBQU87QUFDUDs7QUFFQTtBQUNBLGVBQWMsU0FBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0EsUUFBTztBQUNQOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0EsUUFBTzs7QUFFUDtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0EsUUFBTztBQUNQO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQSxRQUFPO0FBQ1A7QUFDQSxRQUFPO0FBQ1A7QUFDQSxRQUFPO0FBQ1A7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQSxRQUFPO0FBQ1A7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0EsUUFBTztBQUNQO0FBQ0EsUUFBTztBQUNQOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0EsUUFBTztBQUNQOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZTtBQUNmO0FBQ0E7QUFDQSxrQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiLFlBQVc7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O0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlEO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsRUFBQyw4Q0FBOEMsRTs7Ozs7O0FDMUgvQzs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQSx3Qjs7Ozs7O0FDVkE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDakVBOztBQUVBOztBQUVBOztBQUVBLEVBQUM7QUFDRDtBQUNBO0FBQ0EsaUNBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0NBQWlDLE9BQU87QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsaUNBQWdDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRTs7Ozs7O0FDM0tBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBc0MsT0FBTztBQUM3QztBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLGlCQUFnQjs7QUFFaEI7QUFDQSxZQUFXOztBQUVYO0FBQ0EsZ0JBQWU7O0FBRWY7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxJQUFHO0FBQ0gsRUFBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSCxFQUFDOztBQUVEOzs7Ozs7O0FDcElBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTRDLE9BQU87QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLOztBQUVMLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQSxlQUFjLE9BQU87QUFDckI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0Esb0JBQW1CLHFCQUFxQjtBQUN4QztBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5Q0FBd0MsT0FBTztBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUEsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWEsT0FBTztBQUNwQixjQUFhLElBQUk7QUFDakIsY0FBYSxPQUFPO0FBQ3BCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHNCQUFxQixxQkFBcUI7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7OztBQ3RaQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx3QkFBdUIsc0JBQXNCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMLElBQUc7O0FBRUg7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7Ozs7O0FDL0NBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWlCLFNBQVM7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWlCLFNBQVM7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxlQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFxQixxQkFBcUI7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMLGdDQUErQixPQUFPO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQ0FBbUMsT0FBTztBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7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Q0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOzs7Ozs7OztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7QUN6REE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7QUNoRkE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLHNCQUFxQjtBQUNyQix1QkFBc0I7QUFDdEI7QUFD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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBLE1BQUs7QUFDTDtBQUNBLElBQUc7O0FBRUgsaUNBQWdDLHFCQUFxQjtBQUNyRDtBQUNBO0FBQ0EsSUFBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW1CLHFCQUFxQjtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSCxrQ0FBaUMsT0FBTztBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBaUMsT0FBTztBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDs7QUFFQTs7Ozs7OztBQzVNQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFtRjtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLGlDQUFnQyxVQUFVLEVBQUU7QUFDNUMsRTs7Ozs7O0FDcEJBO0FBQ0E7OztBQUdBO0FBQ0EsdUNBQXNDLG1CQUFtQixxQkFBcUIsR0FBRyxtQkFBbUIsaUNBQWlDLG1DQUFtQywyQkFBMkIsR0FBRzs7QUFFdE07Ozs7Ozs7QUNQQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxpQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNEIsR0FBRztBQUMvQix3Q0FBdUMsRUFBRTtBQUN6QztBQUNBLDZCQUE0QixFQUFFO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBQzs7QUFFRDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0EsTUFBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUTtBQUNSO0FBQ0E7QUFDQSxTQUFRO0FBQ1I7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1AsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMLElBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTzs7QUFFUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQSxNQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWlCO0FBQ2pCLGdCQUFlOztBQUVmOztBQUVBO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVztBQUNYO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZTtBQUNmLGNBQWE7O0FBRWI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFpQjtBQUNqQixnQkFBZTs7QUFFZjs7QUFFQTtBQUNBLGNBQWE7O0FBRWI7QUFDQSxZQUFXO0FBQ1g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFlO0FBQ2Y7QUFDQTtBQUNBLGNBQWE7QUFDYjtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiLFlBQVc7O0FBRVg7O0FBRUE7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBLE1BQUs7O0FBRUw7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUOztBQUVBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWE7QUFDYjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFhO0FBQ2I7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxNQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVc7O0FBRVg7O0FBRUE7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXO0FBQ1g7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7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RztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG9CQUFtQixxQkFBcUI7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBc0MsT0FBTztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0Esb0JBQW1CLHFCQUFxQjtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBb0MsT0FBTztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLHFDQUFvQyxlQUFlO0FBQ25ELE1BQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7OztBQ3hTQSwrQ0FBOEMsUUFBUSxVQUFVLEVBQUUsaUNBQWlDLEVBQUUsK0JBQStCLEVBQUUsd0JBQXVCLHdCQUF1Qix3QkFBcUIsWUFBWSxrQ0FBa0Msa0JBQWtCLGtDQUFrQyw4QkFBOEIsMEJBQTBCLG9DQUFvQyx3SEFBd0gsU0FBUyxjQUFjLFNBQVMsZUFBZSxHQUFHLGlCQUFpQixjQUFjLFNBQVMsUUFBUSxzQ0FBc0MseURBQXlELEdBQUcsc0NBQXNDLEVBQUUsd0NBQXdDLEVBQUUsa0ZBQWtGLGdCQUFnQixrSUFBa0ksY0FBYyxpQkFBaUIsZ0JBQWdCLGdCQUFnQixrQ0FBa0MsbURBQW1ELG1CQUFtQixjQUFjLEtBQUssSUFBSSxNQUFNLEtBQUssS0FBSyxNQUFNLFNBQVMsY0FBYyxVQUFVLG1CQUFtQixpSkFBaUosZ0NBQWdDLEdBQUcscUVBQXFFLDhJQUE4SSx5SUFBeUksWUFBWSxtREFBbUQsa0JBQWtCLG1DQUFtQywyTEFBMkwsZUFBZSxVQUFVLFFBQVEsbUJBQW1CLGVBQWUseUJBQXlCLGtCQUFrQixtQkFBbUIsTUFBTSxlQUFlLDBDQUEwQyxvRUFBb0UsSUFBSSxxQ0FBcUMsK0RBQStELDBHQUEwRyxxQkFBcUIsVUFBVSxhQUFhLDRCQUE0QixVQUFVLHFEQUFxRCxrQ0FBa0MseUJBQXlCLDRDQUE0QyxJQUFJLG1CQUFtQixXQUFXLG1CQUFtQixZQUFZLGlEQUFpRCxrSUFBa0ksZUFBZSxVQUFVLE1BQU0sc0NBQXNDLGVBQWUsVUFBVSxvQ0FBb0MsZUFBZSxVQUFVLG1DQUFtQyxlQUFlLFVBQVUsa0NBQWtDLGVBQWUsU0FBUyxpQkFBaUIsS0FBSyxFQUFFLG1CQUFtQixxQkFBcUIsMENBQTBDLG9DQUFvQyxLQUFLLDJDQUEyQyxzQkFBc0Isc0JBQXNCLDBDQUEwQyxLQUFLLFFBQVEsY0FBYyx1Q0FBdUMsZUFBZSxTQUFTLGlCQUFpQiwwREFBMEQsU0FBUyxnQkFBZ0IsNkJBQTZCLFdBQVcsOENBQThDLGVBQWUsU0FBUyxpQkFBaUIsS0FBSyx5REFBeUQsV0FBVywwQ0FBMEMsa0ZBQWtGLDJDQUEyQyw2R0FBNkcsMENBQTBDLHFLQUFxSyxTQUFTLE9BQU8sNENBQTRDLHVEQUF1RCxFQUFFLG9DQUFvQyxtQ0FBbUMsd0NBQXdDLHNDQUFzQyw0QkFBNEIsb05BQW9OLGNBQWMsK0NBQStDLElBQUkseUM7Ozs7OztBQ0FqOEosK0NBQThDLFFBQVEsVUFBVSxFQUFFLGlDQUFpQyxFQUFFLCtCQUErQixFQUFFLGVBQWUsY0FBYyx1QkFBdUIsY0FBYyxnQkFBZ0IsYUFBYSxRQUFRLHVCQUF1Qix1QkFBdUIsRUFBRSxxQkFBcUIsZ0JBQWdCLDJDQUEyQyxnQkFBZ0IsZ0NBQWdDLElBQUksY0FBYyxhQUFhLHdCQUF3QixLQUFLLGdCQUFnQiw4Q0FBOEMsOEJBQThCLE9BQU8sd0JBQXdCLGlEQUFpRCx1QkFBdUIsaUJBQWlCLGdCQUFnQiwwQkFBMEIsSUFBSSxFQUFFLDBEQUEwRCxtQkFBbUIsTUFBTSxJQUFJLEtBQUssaUJBQWlCLHNCQUFzQixjQUFjLGlEQUFpRCw2Q0FBNkMsU0FBUyxjQUFjLE1BQU0sdVFBQXVRLGtCQUFrQixvQ0FBb0Msa0RBQWtELFNBQVMscUJBQXFCLGFBQWEsaUNBQWlDLDBEQUEwRCxtRUFBbUUsYUFBYSxFQUFFLHdEQUF3RCxzQkFBc0IsaURBQWlELHdVQUF3VSxzREFBc0Qsb0JBQW9CLCtCQUErQixnQkFBZ0Isc0NBQXNDLGVBQWUsb0JBQW9CLGtDQUFrQyxJQUFJLHlDOzs7Ozs7QUNBL3RFLCtDQUE4QyxRQUFRLFVBQVUsRUFBRSxpQ0FBaUMsRUFBRSwrQkFBK0IsRUFBRSxlQUFlLG9CQUFvQixjQUFjLHNCQUFzQixjQUFjLHNCQUFzQixjQUFjLHNCQUFzQixjQUFjLG9CQUFvQixJQUFJLEtBQUssbUNBQW1DLDhCQUE4QixPQUFPLFlBQVksUUFBUSxJQUFJLEVBQUUsbUNBQW1DLHNCQUFzQixTQUFTLGNBQWMsZUFBZSxtRUFBbUUsU0FBUywrTEFBK0wsa0NBQWtDLElBQUksMkM7Ozs7OztBQ0FsekIsK0NBQThDLFFBQVEsVUFBVSxFQUFFLGlDQUFpQyxFQUFFLCtCQUErQixFQUFFLGFBQWEsYUFBYSxnQkFBZ0IsWUFBWSxFQUFFLEVBQUUsZ0NBQWdDLGVBQWUsWUFBWSxrQkFBa0Isa0NBQWtDLG9FQUFvRSxtQkFBbUIsNEJBQTRCLHVNQUF1TSxPQUFPLHNIQUFzSCxjQUFjLDZJQUE2SSxZQUFZLDBCQUEwQixLQUFLLCtCQUErQix5QkFBeUIsT0FBTywySEFBMkgsa0JBQWtCLDREQUE0RCx1RUFBdUUsMkRBQTJELG1EQUFtRCxrQkFBa0IsNkJBQTZCLFNBQVMsb0NBQW9DLGlDQUFpQyx1Q0FBdUMsR0FBRyxjQUFjLFlBQVksMEJBQTBCLEtBQUssNENBQTRDLGFBQWEsa0tBQWtLLHlHQUF5Ryx5TEFBeUwsbUNBQW1DLHNCQUFzQiwrR0FBK0cseUlBQXlJLCtGQUErRixpRUFBaUUscUJBQXFCLHNFQUFzRSwrSEFBK0gsOENBQThDLHFDQUFxQyxtQ0FBbUMscUNBQXFDLEdBQUcsNkJBQTZCLDZCQUE2QixtQkFBbUIsS0FBSyxxQ0FBcUMsa0ZBQWtGLG9DQUFvQyxpR0FBaUcsMkNBQTJDLEdBQUcsY0FBYyw2QkFBNkIsU0FBUyxvQ0FBb0MsK0JBQStCLHVDQUF1QyxFQUFFLFlBQVksMEJBQTBCLEtBQUssZ0RBQWdELE1BQU0sZ0pBQWdKLHFCQUFxQiwyREFBMkQscUJBQXFCLDZCQUE2QixvUUFBb1EsaU1BQWlNLGlJQUFpSSwrQ0FBK0MscUJBQXFCLGVBQWUsc0pBQXNKLGNBQWMsNkJBQTZCLFNBQVMsb0NBQW9DLCtCQUErQix1Q0FBdUMsRUFBRSxZQUFZLDBCQUEwQixLQUFLLGdEQUFnRCw0SEFBNEgsdUVBQXVFLGlEQUFpRCxxQkFBcUIsZUFBZSxzSkFBc0osaUVBQWlFLFFBQVEsc0NBQXNDLFVBQVUseUM7Ozs7OztBQ0EvMks7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBbUY7QUFDbkY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxpQ0FBZ0MsVUFBVSxFQUFFO0FBQzVDLEU7Ozs7OztBQ3BCQTtBQUNBOzs7QUFHQTtBQUNBLG9DQUFtQyx1QkFBdUIsR0FBRyxrQ0FBa0MsdUJBQXVCLHlCQUF5QiwwQkFBMEIsa0JBQWtCLDhCQUE4QixzQkFBc0IsZ0NBQWdDLHdCQUF3Qiw2QkFBNkIscUJBQXFCLG9DQUFvQyw0QkFBNEIsaUJBQWlCLEdBQUcsMkNBQTJDLHVCQUF1QixHQUFHLG9DQUFvQyxtQ0FBbUMsMkJBQTJCLGdDQUFnQyx3QkFBd0IsR0FBRyx1Q0FBdUMsaUNBQWlDLHlCQUF5QixtQ0FBbUMsMkJBQTJCLEdBQUc7O0FBRWp6Qjs7Ozs7OztBQ1BBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGtCQUFpQixpQkFBaUI7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkNBQTBDLE9BQU87QUFDakQ7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMEMsT0FBTztBQUNqRDtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7OztBQ3RLQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFtRjtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLGlDQUFnQyxVQUFVLEVBQUU7QUFDNUMsRTs7Ozs7O0FDcEJBO0FBQ0E7OztBQUdBO0FBQ0EsNkNBQTRDLHVCQUF1Qix3QkFBd0IsR0FBRyxvQ0FBb0MsZ0JBQWdCLHVCQUF1QixHQUFHOztBQUU1Szs7Ozs7OztBQ1BBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUEyQjtBQUMzQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBLElBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxrQ0FBaUMsY0FBYztBQUMvQyxJQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxJQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsdURBQXNELE9BQU87QUFDN0QsY0FBYSxVQUFV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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1AsTUFBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQ0FBcUM7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQ0FBcUM7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7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O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0EsSUFBRztBQUNIO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUN6S0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7Ozs7Ozs7QUNqQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZUFBYyxPQUFPO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIOztBQUVBLHVCOzs7Ozs7QUNwQkE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIOztBQUVBLDBCOzs7Ozs7QUNwQkE7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0EsSUFBRztBQUNIOztBQUVBOzs7Ozs7O0FDbkVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSxnQ0FBK0I7QUFDL0I7O0FBRUEsdUI7Ozs7OztBQzlCQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIOztBQUVBOzs7Ozs7O0FDaERBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBLElBQUc7O0FBRUg7O0FBRUE7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTs7QUFFQTs7Ozs7OztBQ2xFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFzRTtBQUN0RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLGlDQUFnQyxVQUFVLEVBQUU7QUFDNUMsRTs7Ozs7O0FDcEJBO0FBQ0E7OztBQUdBO0FBQ0EsNkNBQTRDLGtCQUFrQixvQkFBb0IsdUJBQXVCLFdBQVcsWUFBWSxnQkFBZ0IsaUJBQWlCLDJCQUEyQixpQkFBaUIsR0FBRyxzQkFBc0Isb0JBQW9CLHdCQUF3QixhQUFhLGNBQWMsdUJBQXVCLDRCQUE0QiwrQkFBK0IsNkNBQTZDLHFDQUFxQywyQkFBMkIsR0FBRyx5QkFBeUIsa0JBQWtCLEdBQUcsNkJBQTZCLHlCQUF5QiwwQkFBMEIsa0JBQWtCLGlDQUFpQyxtQ0FBbUMsMkJBQTJCLDhCQUE4QixnQ0FBZ0Msd0JBQXdCLDZCQUE2QixvQ0FBb0MsNEJBQTRCLGdCQUFnQiw0QkFBNEIsMkJBQTJCLHVCQUF1Qiw2QkFBNkIseUJBQXlCLGtDQUFrQyxHQUFHLCtCQUErQixnQkFBZ0IsbUJBQW1CLDJCQUEyQix1QkFBdUIsY0FBYyxlQUFlLGlCQUFpQixHQUFHLG9DQUFvQywyQkFBMkIsbUJBQW1CLHdCQUF3QixjQUFjLGVBQWUsaUJBQWlCLHFCQUFxQixHQUFHOztBQUUvNUM7Ozs7Ozs7QUNQQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFzRTtBQUN0RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBLGlDQUFnQyxVQUFVLEVBQUU7QUFDNUMsRTs7Ozs7O0FDcEJBO0FBQ0E7OztBQUdBO0FBQ0EsdURBQXNELGdCQUFnQixHQUFHOztBQUV6RTs7Ozs7OztBQ1BBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7O0FBRUE7Ozs7Ozs7QUMzREE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBc0U7QUFDdEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7QUFDQSxpQ0FBZ0MsVUFBVSxFQUFFO0FBQzVDLEU7Ozs7OztBQ3BCQTtBQUNBOzs7QUFHQTtBQUNBLDBEQUF5RCxnQkFBZ0IsZUFBZSxHQUFHLHdDQUF3QyxpQ0FBaUMsR0FBRzs7QUFFdks7Ozs7Ozs7QUNQQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTCxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMLElBQUc7QUFDSDs7QUFFQTs7Ozs7OztBQ2pGQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFzRTtBQUN0RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QThDLFFBQVEsVUFBVSxFQUFFLGlDQUFpQyxFQUFFLCtCQUErQixFQUFFLGVBQWUsY0FBYyxrQ0FBa0MsaUNBQWlDLHNCQUFzQiwyQkFBMkIsc0JBQXNCLDRCQUE0QixxQkFBcUIsMkJBQTJCLHNCQUFzQiw0QkFBNEIscUJBQXFCLDhCQUE4QixlQUFlLGlDQUFpQyxnQkFBZ0IsZ0NBQWdDLHVDQUF1QyxXQUFXLEtBQUssd0JBQXdCLGdCQUFnQixtQkFBbUIsa0ZBQWtGLDhCQUE4Qix5QkFBeUIsb0RBQW9ELFlBQVksdUJBQXVCLEtBQUssNENBQTRDLDhEQUE4RCxnQkFBZ0IsU0FBUyx1QkFBdUIsaUJBQWlCLGtDQUFrQyxpQkFBaUIsZ0JBQWdCLDBDQUEwQyxrQkFBa0IsOEJBQThCLFdBQVcsS0FBSyxxQkFBcUIsSUFBSSxrREFBa0QsU0FBUyxnQ0FBZ0Msa0NBQWtDLGlCQUFpQixnQkFBZ0IsOEJBQThCLDZEQUE2RCxxREFBcUQsMkVBQTJFLGFBQWEsa0lBQWtJLHlDQUF5QyxXQUFXLG1EQUFtRCx1R0FBdUcsZUFBZSxnQ0FBZ0MsMERBQTBELGtDQUFrQyxpQkFBaUIsZ0JBQWdCLDhCQUE4Qiw2REFBNkQsK0JBQStCLHFEQUFxRCwrQkFBK0Isa0RBQWtELHlDQUF5QyxvRkFBb0YsYUFBYSwwUEFBMFAsdUNBQXVDLGtMQUFrTCx5Q0FBeUMsK0ZBQStGLHVDQUF1QywyREFBMkQsZ0VBQWdFLGlCQUFpQiwrQkFBK0IscUVBQXFFLGtDQUFrQyxpQkFBaUIsZ0JBQWdCLDRCQUE0QixrQ0FBa0MsMkJBQTJCLDRDQUE0Qyw2QkFBNkIsbUJBQW1CLGtDQUFrQyxpQkFBaUIsZ0JBQWdCLGdDQUFnQyxtREFBbUQsd0JBQXdCLGdPQUFnTywyR0FBMkcsOENBQThDLGtDQUFrQyxJQUFJLG1DIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCA1Zjg1MjA3OTBkNzcxYWE2ODQ5NVxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG5yZXF1aXJlKCcuL3N0eWxlcy9iYXNlLmNzcycpXG5cbi8vIHJlcXVpcmUoJy4vcG9seWZpbGwnKVxucmVxdWlyZSgnZXM2LXByb21pc2UnKVxucmVxdWlyZSgnLi9mbGV4aWJsZScpXG5cbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpXG52YXIgTG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKVxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpXG52YXIgcHJvdG9jb2wgPSByZXF1aXJlKCcuL3Byb3RvY29sJylcbnZhciBDb21wb25lbnRNYW5hZ2VyID0gcmVxdWlyZSgnLi9jb21wb25lbnRNYW5hZ2VyJylcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvY29tcG9uZW50JylcbnZhciBTZW5kZXIgPSByZXF1aXJlKCcuL2JyaWRnZS9zZW5kZXInKVxudmFyIHJlY2VpdmVyID0gcmVxdWlyZSgnLi9icmlkZ2UvcmVjZWl2ZXInKVxuXG4vLyBDb21wb25lbnRzIGFuZCBhcGlzLlxudmFyIGNvbXBvbmVudHMgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMnKVxudmFyIGFwaSA9IHJlcXVpcmUoJy4vYXBpJylcbnJlcXVpcmUoJ2VudmQnKVxucmVxdWlyZSgnaHR0cHVybCcpXG5cbnZhciBXRUFQUF9TVFlMRV9JRCA9ICd3ZWFwcC1zdHlsZSdcblxudmFyIERFRkFVTFRfREVTSUdOX1dJRFRIID0gNzUwXG52YXIgREVGQVVMVF9TQ0FMRSA9IHdpbmRvdy5pbm5lcldpZHRoIC8gREVGQVVMVF9ERVNJR05fV0lEVEhcbnZhciBERUZBVUxUX1JPT1RfSUQgPSAnd2VleCdcbnZhciBERUZBVUxUX0pTT05QX0NBTExCQUNLX05BTUUgPSAnd2VleEpzb25wQ2FsbGJhY2snXG5cbndpbmRvdy5XWEVudmlyb25tZW50ID0ge1xuICB3ZWV4VmVyc2lvbjogY29uZmlnLndlZXhWZXJzaW9uLFxuICBhcHBOYW1lOiBsaWIuZW52LmFsaWFwcCA/IGxpYi5lbnYuYWxpYXBwLmFwcG5hbWUgOiBudWxsLFxuICBhcHBWZXJzaW9uOiBsaWIuZW52LmFsaWFwcCA/IGxpYi5lbnYuYWxpYXBwLnZlcnNpb24udmFsIDogbnVsbCxcbiAgcGxhdGZvcm06ICdXZWInLFxuICBvc05hbWU6IGxpYi5lbnYuYnJvd3NlciA/IGxpYi5lbnYuYnJvd3Nlci5uYW1lIDogbnVsbCxcbiAgb3NWZXJzaW9uOiBsaWIuZW52LmJyb3dzZXIgPyBsaWIuZW52LmJyb3dzZXIudmVyc2lvbi52YWwgOiBudWxsLFxuICBkZXZpY2VXaWR0aDogREVGQVVMVF9ERVNJR05fV0lEVEgsXG4gIGRldmljZUhlaWdodDogd2luZG93LmlubmVySGVpZ2h0IC8gREVGQVVMVF9TQ0FMRVxufVxuXG52YXIgX2luc3RhbmNlTWFwID0ge31cbnZhciBfZG93bmdyYWRlcyA9IHt9XG5cbnZhciBkb3duZ3JhZGFibGUgPSBbJ2xpc3QnLCAnc2Nyb2xsZXInXVxuXG47IChmdW5jdGlvbiBpbml0aWFsaXplV2l0aFVybFBhcmFtcygpIHtcblxuICB2YXIgcGFyYW1zID0gbGliLmh0dHB1cmwobG9jYXRpb24uaHJlZikucGFyYW1zXG4gIGZvciAodmFyIGsgaW4gcGFyYW1zKSB7XG4gICAgLy8gR2V0IGdsb2JhbCBfZG93bmdyYWRlcyBmcm9tIHVybCdzIHBhcmFtcy5cbiAgICB2YXIgbWF0Y2ggPSBrLm1hdGNoKC9kb3duZ3JhZGVfKFxcdyspLylcbiAgICBpZiAoIW1hdGNoIHx8ICFtYXRjaFsxXSkge1xuICAgICAgY29udGludWVcbiAgICB9XG4gICAgaWYgKHBhcmFtc1trXSAhPT0gdHJ1ZSAmJiBwYXJhbXNba10gIT09ICd0cnVlJykge1xuICAgICAgY29udGludWVcbiAgICB9XG4gICAgdmFyIGRvd25rID0gbWF0Y2hbMV1cbiAgICBpZiAoZG93bmsgJiYgKGRvd25ncmFkYWJsZS5pbmRleE9mKGRvd25rKSAhPT0gLTEpKSB7XG4gICAgICBfZG93bmdyYWRlc1tkb3dua10gPSB0cnVlXG4gICAgfVxuICB9XG5cbiAgLy8gc2V0IGdsb2JhbCAnZGVidWcnIGNvbmZpZyB0byB0cnVlIGlmIHRoZXJlJ3MgYSBkZWJ1ZyBmbGFnIGluIGN1cnJlbnQgdXJsLlxuICB2YXIgZGVidWcgPSBwYXJhbXNbJ2RlYnVnJ11cbiAgaWYgKGRlYnVnID09PSB0cnVlIHx8IGRlYnVnID09PSAndHJ1ZScpIHtcbiAgICBjb25maWcuZGVidWcgPSB0cnVlXG4gIH1cblxufSkoKVxuXG5yZXF1aXJlKCcuL2xvZ2dlcicpLmluaXQoKVxuXG5mdW5jdGlvbiBXZWV4KG9wdGlvbnMpIHtcblxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2VleCkpIHtcbiAgICByZXR1cm4gbmV3IFdlZXgob3B0aW9ucylcbiAgfVxuXG4gIC8vIFdpZHRoIG9mIHRoZSByb290IGNvbnRhaW5lci4gRGVmYXVsdCBpcyB3aW5kb3cuaW5uZXJXaWR0aC5cbiAgdGhpcy53aWR0aCA9IG9wdGlvbnMud2lkdGggfHwgd2luZG93LmlubmVyV2lkdGhcbiAgdGhpcy5idW5kbGVVcmwgPSBvcHRpb25zLmJ1bmRsZVVybCB8fCBsb2NhdGlvbi5ocmVmXG4gIHRoaXMuaW5zdGFuY2VJZCA9IG9wdGlvbnMuYXBwSWRcbiAgdGhpcy5yb290SWQgPSBvcHRpb25zLnJvb3RJZCB8fCAoREVGQVVMVF9ST09UX0lEICsgdXRpbHMuZ2V0UmFuZG9tKDEwKSlcbiAgdGhpcy5kZXNpZ25XaWR0aCA9IG9wdGlvbnMuZGVzaWduV2lkdGggfHwgREVGQVVMVF9ERVNJR05fV0lEVEhcbiAgdGhpcy5qc29ucENhbGxiYWNrID0gb3B0aW9ucy5qc29ucENhbGxiYWNrIHx8IERFRkFVTFRfSlNPTlBfQ0FMTEJBQ0tfTkFNRVxuICB0aGlzLnNvdXJjZSA9IG9wdGlvbnMuc291cmNlXG4gIHRoaXMubG9hZGVyID0gb3B0aW9ucy5sb2FkZXJcbiAgdGhpcy5lbWJlZCA9IG9wdGlvbnMuZW1iZWQgPyB0cnVlIDogZmFsc2VcblxuICB0aGlzLmRhdGEgPSBvcHRpb25zLmRhdGFcblxuICB0aGlzLmluaXREb3duZ3JhZGVzKG9wdGlvbnMuZG93bmdyYWRlKVxuICB0aGlzLmluaXRTY2FsZSgpXG4gIHRoaXMuaW5pdENvbXBvbmVudE1hbmFnZXIoKVxuICB0aGlzLmluaXRCcmlkZ2UoKVxuICBXZWV4LmFkZEluc3RhbmNlKHRoaXMpXG5cbiAgcHJvdG9jb2wuaW5qZWN0V2VleEluc3RhbmNlKHRoaXMpXG5cbiAgdGhpcy5sb2FkQnVuZGxlKGZ1bmN0aW9uIChlcnIsIGFwcENvZGUpIHtcbiAgICBpZiAoIWVycikge1xuICAgICAgdGhpcy5jcmVhdGVBcHAoY29uZmlnLCBhcHBDb2RlKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdsb2FkIGJ1bmRsZSBlcnI6JywgZXJyKVxuICAgIH1cbiAgfS5iaW5kKHRoaXMpKVxuXG59XG5cbldlZXguaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIGlmICh1dGlscy5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgb3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgIG5ldyBXZWV4KGNvbmZpZylcbiAgICB9KVxuICB9IGVsc2UgaWYgKFxuICAgICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9wdGlvbnMpLnNsaWNlKDgsIC0xKSA9PT0gJ09iamVjdCdcbiAgICApIHtcbiAgICBuZXcgV2VleChvcHRpb25zKVxuICB9XG59XG5cbldlZXguYWRkSW5zdGFuY2UgPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgX2luc3RhbmNlTWFwW2luc3RhbmNlLmluc3RhbmNlSWRdID0gaW5zdGFuY2Vcbn1cblxuV2VleC5nZXRJbnN0YW5jZSA9IGZ1bmN0aW9uIChpbnN0YW5jZUlkKSB7XG4gIHJldHVybiBfaW5zdGFuY2VNYXBbaW5zdGFuY2VJZF1cbn1cblxuV2VleC5wcm90b3R5cGUgPSB7XG5cbiAgaW5pdERvd25ncmFkZXM6IGZ1bmN0aW9uIChkZykge1xuICAgIHRoaXMuZG93bmdyYWRlcyA9IHV0aWxzLmV4dGVuZCh7fSwgX2Rvd25ncmFkZXMpXG4gICAgLy8gR2V0IGRvd25ncmFkZSBjb21wb25lbnQgdHlwZSBmcm9tIHVzZXIncyBzcGVjaWZpY2F0aW9uXG4gICAgLy8gaW4gd2VleCdzIGluaXQgb3B0aW9ucy5cbiAgICBpZiAoIXV0aWxzLmlzQXJyYXkoZGcpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBkZy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBkb3duayA9IGRnW2ldXG4gICAgICBpZiAoZG93bmdyYWRhYmxlLmluZGV4T2YoZG93bmspICE9PSAtMSkge1xuICAgICAgICB0aGlzLmRvd25ncmFkZXNbZG93bmtdID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBpbml0QnJpZGdlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmVjZWl2ZXIuaW5pdCh0aGlzKVxuICAgIHRoaXMuc2VuZGVyID0gbmV3IFNlbmRlcih0aGlzKVxuICB9LFxuXG4gIGxvYWRCdW5kbGU6IGZ1bmN0aW9uIChjYikge1xuICAgIExvYWRlci5sb2FkKHtcbiAgICAgIGpzb25wQ2FsbGJhY2s6IHRoaXMuanNvbnBDYWxsYmFjayxcbiAgICAgIHNvdXJjZTogdGhpcy5zb3VyY2UsXG4gICAgICBsb2FkZXI6IHRoaXMubG9hZGVyXG4gICAgfSwgY2IpXG4gIH0sXG5cbiAgY3JlYXRlQXBwOiBmdW5jdGlvbiAoY29uZmlnLCBhcHBDb2RlKSB7XG4gICAgdmFyIHJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIHRoaXMucm9vdElkKVxuICAgIGlmICghcm9vdCkge1xuICAgICAgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICByb290LmlkID0gdGhpcy5yb290SWRcbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocm9vdClcbiAgICB9XG5cbiAgICB2YXIgcHJvbWlzZSA9IHdpbmRvdy5jcmVhdGVJbnN0YW5jZShcbiAgICAgIHRoaXMuaW5zdGFuY2VJZFxuICAgICAgLCBhcHBDb2RlXG4gICAgICAsIHtcbiAgICAgICAgYnVuZGxlVXJsOiB0aGlzLmJ1bmRsZVVybCxcbiAgICAgICAgZGVidWc6IGNvbmZpZy5kZWJ1Z1xuICAgICAgfVxuICAgICAgLCB0aGlzLmRhdGFcbiAgICApXG5cbiAgICBpZiAoUHJvbWlzZSAmJiBwcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gV2VleC5faW5zdGFuY2VzW3RoaXMuaW5zdGFuY2VJZF0gPSB0aGlzLnJvb3RcbiAgICAgIH0uYmluZCh0aGlzKSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyICYmIGNvbmZpZy5kZWJ1Zykge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIERvIG5vdCBkZXN0cm95IGluc3RhbmNlIGhlcmUsIGJlY2F1c2UgaW4gbW9zdCBicm93c2VyXG4gICAgLy8gcHJlc3MgYmFjayBidXR0b24gdG8gYmFjayB0byB0aGlzIHBhZ2Ugd2lsbCBub3QgcmVmcmVzaFxuICAgIC8vIHRoZSB3aW5kb3cgYW5kIHRoZSBpbnN0YW5jZSB3aWxsIG5vdCBiZSByZWNyZWF0ZWQgdGhlbi5cbiAgICAvLyB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gKGUpIHtcbiAgICAvLyB9KVxuXG4gIH0sXG5cbiAgaW5pdFNjYWxlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zY2FsZSA9IHRoaXMud2lkdGggLyB0aGlzLmRlc2lnbldpZHRoXG4gIH0sXG5cbiAgaW5pdENvbXBvbmVudE1hbmFnZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jb21wb25lbnRNYW5hZ2VyID0gbmV3IENvbXBvbmVudE1hbmFnZXIodGhpcylcbiAgfSxcblxuICBnZXRDb21wb25lbnRNYW5hZ2VyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBvbmVudE1hbmFnZXJcbiAgfSxcblxuICBnZXRSb290OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgdGhpcy5yb290SWQpXG4gIH1cbn1cblxuV2VleC5hcHBlbmRTdHlsZSA9IGZ1bmN0aW9uIChjc3MpIHtcbiAgdXRpbHMuYXBwZW5kU3R5bGUoY3NzLCBXRUFQUF9TVFlMRV9JRClcbn0sXG5cbi8vIFJlZ2lzdGVyIGEgbmV3IGNvbXBvbmVudCB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZS5cbldlZXgucmVnaXN0ZXJDb21wb25lbnQgPSBmdW5jdGlvbiAobmFtZSwgY29tcCkge1xuICBDb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyQ29tcG9uZW50KG5hbWUsIGNvbXApXG59LFxuXG4vLyBSZWdpc3RlciBhIG5ldyBhcGkgbW9kdWxlLlxuLy8gSWYgdGhlIG1vZHVsZSBhbHJlYWR5IGV4aXN0cywganVzdCBhZGQgbWV0aG9kcyBmcm9tIHRoZVxuLy8gbmV3IG1vZHVsZSB0byB0aGUgb2xkIG9uZS5cbldlZXgucmVnaXN0ZXJBcGlNb2R1bGUgPSBmdW5jdGlvbiAobmFtZSwgbW9kdWxlLCBtZXRhKSB7XG4gIGlmICghcHJvdG9jb2wuYXBpTW9kdWxlW25hbWVdKSB7XG4gICAgcHJvdG9jb2wuYXBpTW9kdWxlW25hbWVdID0gbW9kdWxlXG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIga2V5IGluIG1vZHVsZSkge1xuICAgICAgaWYgKG1vZHVsZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHByb3RvY29sLmFwaU1vZHVsZVtuYW1lXVtrZXldID0gbW9kdWxlW2tleV1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy8gcmVnaXN0ZXIgQVBJIG1vZHVsZSdzIG1ldGEgaW5mbyB0byBqc2ZyYW1ld29ya1xuICBpZiAobWV0YSkge1xuICAgIHByb3RvY29sLnNldEFwaU1vZHVsZU1ldGEobWV0YSlcbiAgICB3aW5kb3cucmVnaXN0ZXJNb2R1bGVzKHByb3RvY29sLmdldEFwaU1vZHVsZU1ldGEobmFtZSksIHRydWUpXG4gIH1cbn0sXG5cbi8vIFJlZ2lzdGVyIGEgbmV3IGFwaSBtZXRob2QgZm9yIHRoZSBzcGVjaWZpZWQgbW9kdWxlLlxuLy8gb3B0czpcbi8vICAtIGFyZ3M6IHR5cGUgb2YgYXJndW1lbnRzIHRoZSBBUEkgbWV0aG9kIHRha2VzIHN1Y2hcbi8vICAgIGFzIFsnc3RyaW5nJywgJ2Z1bmN0aW9uJ11cbldlZXgucmVnaXN0ZXJBcGkgPSBmdW5jdGlvbiAobW9kdWxlTmFtZSwgbmFtZSwgbWV0aG9kLCBhcmdzKSB7XG4gIGlmICh0eXBlb2YgbWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKCFwcm90b2NvbC5hcGlNb2R1bGVbbW9kdWxlTmFtZV0pIHtcbiAgICBwcm90b2NvbC5hcGlNb2R1bGVbbW9kdWxlTmFtZV0gPSB7fVxuICAgIHByb3RvY29sLl9tZXRhW21vZHVsZU5hbWVdID0gW11cbiAgfVxuICBwcm90b2NvbC5hcGlNb2R1bGVbbW9kdWxlTmFtZV1bbmFtZV0gPSBtZXRob2RcbiAgaWYgKCFhcmdzKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgLy8gcmVnaXN0ZXIgQVBJIG1ldGEgaW5mbyB0byBqc2ZyYW1ld29ya1xuICBwcm90b2NvbC5zZXRBcGlNZXRhKG1vZHVsZU5hbWUsIHtcbiAgICBuYW1lOiBuYW1lLFxuICAgIGFyZ3M6IGFyZ3NcbiAgfSlcbiAgd2luZG93LnJlZ2lzdGVyTW9kdWxlcyhwcm90b2NvbC5nZXRBcGlNb2R1bGVNZXRhKG1vZHVsZU5hbWUsIG1ldGEpLCB0cnVlKVxufSxcblxuLy8gUmVnaXN0ZXIgYSBuZXcgd2VleC1idW5kbGUtbG9hZGVyLlxuV2VleC5yZWdpc3RlckxvYWRlciA9IGZ1bmN0aW9uIChuYW1lLCBsb2FkZXJGdW5jKSB7XG4gIExvYWRlci5yZWdpc3RlckxvYWRlcihuYW1lLCBsb2FkZXJGdW5jKVxufVxuXG4vLyBUbyBpbnN0YWxsIGNvbXBvbmVudHMgYW5kIHBsdWdpbnMuXG5XZWV4Lmluc3RhbGwgPSBmdW5jdGlvbiAobW9kKSB7XG4gIG1vZC5pbml0KFdlZXgpXG59XG5cbldlZXguc3RvcFRoZVdvcmxkID0gZnVuY3Rpb24gKCkge1xuICBmb3IgKHZhciBpbnN0YW5jZUlkIGluIF9pbnN0YW5jZU1hcCkge1xuICAgIGlmIChfaW5zdGFuY2VNYXAuaGFzT3duUHJvcGVydHkoaW5zdGFuY2VJZCkpIHtcbiAgICAgIHdpbmRvdy5kZXN0cm95SW5zdGFuY2UoaW5zdGFuY2VJZClcbiAgICB9XG4gIH1cbn1cblxuKGZ1bmN0aW9uIHN0YXJ0UmVmcmVzaENvbnRyb2xsZXIoKSB7XG4gIGlmIChsb2NhdGlvbi5zZWFyY2guaW5kZXhPZignaG90LXJlbG9hZF9jb250cm9sbGVyJykgPT09IC0xKSAge1xuICAgIHJldHVyblxuICB9XG4gIGlmICghd2luZG93LldlYlNvY2tldCkge1xuICAgIGNvbnNvbGUuaW5mbygnYXV0byByZWZyZXNoIG5lZWQgV2ViU29ja2V0IHN1cHBvcnQnKVxuICAgIHJldHVyblxuICB9XG4gIHZhciBob3N0ID0gbG9jYXRpb24uaG9zdG5hbWVcbiAgdmFyIHBvcnQgPSA4MDgyXG4gIHZhciBjbGllbnQgPSBuZXcgV2ViU29ja2V0KCd3czovLycgKyBob3N0ICsgJzonICsgcG9ydCArICcvJyxcbiAgICAnZWNoby1wcm90b2NvbCdcbiAgKVxuICBjbGllbnQub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZygncmVmcmVzaCBjb250cm9sbGVyIHdlYnNvY2tldCBjb25uZWN0aW9uIGVycm9yJylcbiAgfVxuICBjbGllbnQub25tZXNzYWdlID0gZnVuY3Rpb24gKGUpIHtcbiAgICBjb25zb2xlLmxvZygnUmVjZWl2ZWQ6IFxcJycgKyBlLmRhdGEgKyAnXFwnJylcbiAgICBpZiAoZS5kYXRhICA9PT0gJ3JlZnJlc2gnKSB7XG4gICAgICBsb2NhdGlvbi5yZWxvYWQoKVxuICAgIH1cbiAgfVxufSgpKVxuXG4vLyBXZWV4Lmluc3RhbGwocmVxdWlyZSgnd2VleC1jb21wb25lbnRzJykpXG5XZWV4Lmluc3RhbGwoY29tcG9uZW50cylcbldlZXguaW5zdGFsbChhcGkpXG5cbldlZXguQ29tcG9uZW50ID0gQ29tcG9uZW50XG5XZWV4LkNvbXBvbmVudE1hbmFnZXIgPSBDb21wb25lbnRNYW5hZ2VyXG5XZWV4LnV0aWxzID0gdXRpbHNcbldlZXguY29uZmlnID0gY29uZmlnXG5cbmdsb2JhbC53ZWV4ID0gV2VleFxubW9kdWxlLmV4cG9ydHMgPSBXZWV4XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3dlZXguanNcbiAqKiBtb2R1bGUgaWQgPSAwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL2Jhc2UuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL2Jhc2UuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vYmFzZS5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvc3R5bGVzL2Jhc2UuY3NzXG4gKiogbW9kdWxlIGlkID0gMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIqIHtcXG4gIG1hcmdpbjogMDtcXG4gIHBhZGRpbmc6IDA7XFxuICB0ZXh0LXNpemUtYWRqdXN0OiBub25lO1xcbn1cXG5cXG51bCwgb2wge1xcbiAgbGlzdC1zdHlsZTogbm9uZTtcXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL3NyYy9zdHlsZXMvYmFzZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSAyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKlxyXG5cdE1JVCBMaWNlbnNlIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXHJcblx0QXV0aG9yIFRvYmlhcyBLb3BwZXJzIEBzb2tyYVxyXG4qL1xyXG4vLyBjc3MgYmFzZSBjb2RlLCBpbmplY3RlZCBieSB0aGUgY3NzLWxvYWRlclxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBsaXN0ID0gW107XHJcblxyXG5cdC8vIHJldHVybiB0aGUgbGlzdCBvZiBtb2R1bGVzIGFzIGNzcyBzdHJpbmdcclxuXHRsaXN0LnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XHJcblx0XHR2YXIgcmVzdWx0ID0gW107XHJcblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHR2YXIgaXRlbSA9IHRoaXNbaV07XHJcblx0XHRcdGlmKGl0ZW1bMl0pIHtcclxuXHRcdFx0XHRyZXN1bHQucHVzaChcIkBtZWRpYSBcIiArIGl0ZW1bMl0gKyBcIntcIiArIGl0ZW1bMV0gKyBcIn1cIik7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmVzdWx0LnB1c2goaXRlbVsxXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiByZXN1bHQuam9pbihcIlwiKTtcclxuXHR9O1xyXG5cclxuXHQvLyBpbXBvcnQgYSBsaXN0IG9mIG1vZHVsZXMgaW50byB0aGUgbGlzdFxyXG5cdGxpc3QuaSA9IGZ1bmN0aW9uKG1vZHVsZXMsIG1lZGlhUXVlcnkpIHtcclxuXHRcdGlmKHR5cGVvZiBtb2R1bGVzID09PSBcInN0cmluZ1wiKVxyXG5cdFx0XHRtb2R1bGVzID0gW1tudWxsLCBtb2R1bGVzLCBcIlwiXV07XHJcblx0XHR2YXIgYWxyZWFkeUltcG9ydGVkTW9kdWxlcyA9IHt9O1xyXG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0dmFyIGlkID0gdGhpc1tpXVswXTtcclxuXHRcdFx0aWYodHlwZW9mIGlkID09PSBcIm51bWJlclwiKVxyXG5cdFx0XHRcdGFscmVhZHlJbXBvcnRlZE1vZHVsZXNbaWRdID0gdHJ1ZTtcclxuXHRcdH1cclxuXHRcdGZvcihpID0gMDsgaSA8IG1vZHVsZXMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0dmFyIGl0ZW0gPSBtb2R1bGVzW2ldO1xyXG5cdFx0XHQvLyBza2lwIGFscmVhZHkgaW1wb3J0ZWQgbW9kdWxlXHJcblx0XHRcdC8vIHRoaXMgaW1wbGVtZW50YXRpb24gaXMgbm90IDEwMCUgcGVyZmVjdCBmb3Igd2VpcmQgbWVkaWEgcXVlcnkgY29tYmluYXRpb25zXHJcblx0XHRcdC8vICB3aGVuIGEgbW9kdWxlIGlzIGltcG9ydGVkIG11bHRpcGxlIHRpbWVzIHdpdGggZGlmZmVyZW50IG1lZGlhIHF1ZXJpZXMuXHJcblx0XHRcdC8vICBJIGhvcGUgdGhpcyB3aWxsIG5ldmVyIG9jY3VyIChIZXkgdGhpcyB3YXkgd2UgaGF2ZSBzbWFsbGVyIGJ1bmRsZXMpXHJcblx0XHRcdGlmKHR5cGVvZiBpdGVtWzBdICE9PSBcIm51bWJlclwiIHx8ICFhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzW2l0ZW1bMF1dKSB7XHJcblx0XHRcdFx0aWYobWVkaWFRdWVyeSAmJiAhaXRlbVsyXSkge1xyXG5cdFx0XHRcdFx0aXRlbVsyXSA9IG1lZGlhUXVlcnk7XHJcblx0XHRcdFx0fSBlbHNlIGlmKG1lZGlhUXVlcnkpIHtcclxuXHRcdFx0XHRcdGl0ZW1bMl0gPSBcIihcIiArIGl0ZW1bMl0gKyBcIikgYW5kIChcIiArIG1lZGlhUXVlcnkgKyBcIilcIjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bGlzdC5wdXNoKGl0ZW0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxuXHRyZXR1cm4gbGlzdDtcclxufTtcclxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcbiAqKiBtb2R1bGUgaWQgPSAzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKlxyXG5cdE1JVCBMaWNlbnNlIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXHJcblx0QXV0aG9yIFRvYmlhcyBLb3BwZXJzIEBzb2tyYVxyXG4qL1xyXG52YXIgc3R5bGVzSW5Eb20gPSB7fSxcclxuXHRtZW1vaXplID0gZnVuY3Rpb24oZm4pIHtcclxuXHRcdHZhciBtZW1vO1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBtZW1vID09PSBcInVuZGVmaW5lZFwiKSBtZW1vID0gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHRcdFx0cmV0dXJuIG1lbW87XHJcblx0XHR9O1xyXG5cdH0sXHJcblx0aXNPbGRJRSA9IG1lbW9pemUoZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gL21zaWUgWzYtOV1cXGIvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKSk7XHJcblx0fSksXHJcblx0Z2V0SGVhZEVsZW1lbnQgPSBtZW1vaXplKGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXTtcclxuXHR9KSxcclxuXHRzaW5nbGV0b25FbGVtZW50ID0gbnVsbCxcclxuXHRzaW5nbGV0b25Db3VudGVyID0gMCxcclxuXHRzdHlsZUVsZW1lbnRzSW5zZXJ0ZWRBdFRvcCA9IFtdO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihsaXN0LCBvcHRpb25zKSB7XHJcblx0aWYodHlwZW9mIERFQlVHICE9PSBcInVuZGVmaW5lZFwiICYmIERFQlVHKSB7XHJcblx0XHRpZih0eXBlb2YgZG9jdW1lbnQgIT09IFwib2JqZWN0XCIpIHRocm93IG5ldyBFcnJvcihcIlRoZSBzdHlsZS1sb2FkZXIgY2Fubm90IGJlIHVzZWQgaW4gYSBub24tYnJvd3NlciBlbnZpcm9ubWVudFwiKTtcclxuXHR9XHJcblxyXG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cdC8vIEZvcmNlIHNpbmdsZS10YWcgc29sdXRpb24gb24gSUU2LTksIHdoaWNoIGhhcyBhIGhhcmQgbGltaXQgb24gdGhlICMgb2YgPHN0eWxlPlxyXG5cdC8vIHRhZ3MgaXQgd2lsbCBhbGxvdyBvbiBhIHBhZ2VcclxuXHRpZiAodHlwZW9mIG9wdGlvbnMuc2luZ2xldG9uID09PSBcInVuZGVmaW5lZFwiKSBvcHRpb25zLnNpbmdsZXRvbiA9IGlzT2xkSUUoKTtcclxuXHJcblx0Ly8gQnkgZGVmYXVsdCwgYWRkIDxzdHlsZT4gdGFncyB0byB0aGUgYm90dG9tIG9mIDxoZWFkPi5cclxuXHRpZiAodHlwZW9mIG9wdGlvbnMuaW5zZXJ0QXQgPT09IFwidW5kZWZpbmVkXCIpIG9wdGlvbnMuaW5zZXJ0QXQgPSBcImJvdHRvbVwiO1xyXG5cclxuXHR2YXIgc3R5bGVzID0gbGlzdFRvU3R5bGVzKGxpc3QpO1xyXG5cdGFkZFN0eWxlc1RvRG9tKHN0eWxlcywgb3B0aW9ucyk7XHJcblxyXG5cdHJldHVybiBmdW5jdGlvbiB1cGRhdGUobmV3TGlzdCkge1xyXG5cdFx0dmFyIG1heVJlbW92ZSA9IFtdO1xyXG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IHN0eWxlcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHR2YXIgaXRlbSA9IHN0eWxlc1tpXTtcclxuXHRcdFx0dmFyIGRvbVN0eWxlID0gc3R5bGVzSW5Eb21baXRlbS5pZF07XHJcblx0XHRcdGRvbVN0eWxlLnJlZnMtLTtcclxuXHRcdFx0bWF5UmVtb3ZlLnB1c2goZG9tU3R5bGUpO1xyXG5cdFx0fVxyXG5cdFx0aWYobmV3TGlzdCkge1xyXG5cdFx0XHR2YXIgbmV3U3R5bGVzID0gbGlzdFRvU3R5bGVzKG5ld0xpc3QpO1xyXG5cdFx0XHRhZGRTdHlsZXNUb0RvbShuZXdTdHlsZXMsIG9wdGlvbnMpO1xyXG5cdFx0fVxyXG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IG1heVJlbW92ZS5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHR2YXIgZG9tU3R5bGUgPSBtYXlSZW1vdmVbaV07XHJcblx0XHRcdGlmKGRvbVN0eWxlLnJlZnMgPT09IDApIHtcclxuXHRcdFx0XHRmb3IodmFyIGogPSAwOyBqIDwgZG9tU3R5bGUucGFydHMubGVuZ3RoOyBqKyspXHJcblx0XHRcdFx0XHRkb21TdHlsZS5wYXJ0c1tqXSgpO1xyXG5cdFx0XHRcdGRlbGV0ZSBzdHlsZXNJbkRvbVtkb21TdHlsZS5pZF07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRTdHlsZXNUb0RvbShzdHlsZXMsIG9wdGlvbnMpIHtcclxuXHRmb3IodmFyIGkgPSAwOyBpIDwgc3R5bGVzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR2YXIgaXRlbSA9IHN0eWxlc1tpXTtcclxuXHRcdHZhciBkb21TdHlsZSA9IHN0eWxlc0luRG9tW2l0ZW0uaWRdO1xyXG5cdFx0aWYoZG9tU3R5bGUpIHtcclxuXHRcdFx0ZG9tU3R5bGUucmVmcysrO1xyXG5cdFx0XHRmb3IodmFyIGogPSAwOyBqIDwgZG9tU3R5bGUucGFydHMubGVuZ3RoOyBqKyspIHtcclxuXHRcdFx0XHRkb21TdHlsZS5wYXJ0c1tqXShpdGVtLnBhcnRzW2pdKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IoOyBqIDwgaXRlbS5wYXJ0cy5sZW5ndGg7IGorKykge1xyXG5cdFx0XHRcdGRvbVN0eWxlLnBhcnRzLnB1c2goYWRkU3R5bGUoaXRlbS5wYXJ0c1tqXSwgb3B0aW9ucykpO1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR2YXIgcGFydHMgPSBbXTtcclxuXHRcdFx0Zm9yKHZhciBqID0gMDsgaiA8IGl0ZW0ucGFydHMubGVuZ3RoOyBqKyspIHtcclxuXHRcdFx0XHRwYXJ0cy5wdXNoKGFkZFN0eWxlKGl0ZW0ucGFydHNbal0sIG9wdGlvbnMpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRzdHlsZXNJbkRvbVtpdGVtLmlkXSA9IHtpZDogaXRlbS5pZCwgcmVmczogMSwgcGFydHM6IHBhcnRzfTtcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxpc3RUb1N0eWxlcyhsaXN0KSB7XHJcblx0dmFyIHN0eWxlcyA9IFtdO1xyXG5cdHZhciBuZXdTdHlsZXMgPSB7fTtcclxuXHRmb3IodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIGl0ZW0gPSBsaXN0W2ldO1xyXG5cdFx0dmFyIGlkID0gaXRlbVswXTtcclxuXHRcdHZhciBjc3MgPSBpdGVtWzFdO1xyXG5cdFx0dmFyIG1lZGlhID0gaXRlbVsyXTtcclxuXHRcdHZhciBzb3VyY2VNYXAgPSBpdGVtWzNdO1xyXG5cdFx0dmFyIHBhcnQgPSB7Y3NzOiBjc3MsIG1lZGlhOiBtZWRpYSwgc291cmNlTWFwOiBzb3VyY2VNYXB9O1xyXG5cdFx0aWYoIW5ld1N0eWxlc1tpZF0pXHJcblx0XHRcdHN0eWxlcy5wdXNoKG5ld1N0eWxlc1tpZF0gPSB7aWQ6IGlkLCBwYXJ0czogW3BhcnRdfSk7XHJcblx0XHRlbHNlXHJcblx0XHRcdG5ld1N0eWxlc1tpZF0ucGFydHMucHVzaChwYXJ0KTtcclxuXHR9XHJcblx0cmV0dXJuIHN0eWxlcztcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMsIHN0eWxlRWxlbWVudCkge1xyXG5cdHZhciBoZWFkID0gZ2V0SGVhZEVsZW1lbnQoKTtcclxuXHR2YXIgbGFzdFN0eWxlRWxlbWVudEluc2VydGVkQXRUb3AgPSBzdHlsZUVsZW1lbnRzSW5zZXJ0ZWRBdFRvcFtzdHlsZUVsZW1lbnRzSW5zZXJ0ZWRBdFRvcC5sZW5ndGggLSAxXTtcclxuXHRpZiAob3B0aW9ucy5pbnNlcnRBdCA9PT0gXCJ0b3BcIikge1xyXG5cdFx0aWYoIWxhc3RTdHlsZUVsZW1lbnRJbnNlcnRlZEF0VG9wKSB7XHJcblx0XHRcdGhlYWQuaW5zZXJ0QmVmb3JlKHN0eWxlRWxlbWVudCwgaGVhZC5maXJzdENoaWxkKTtcclxuXHRcdH0gZWxzZSBpZihsYXN0U3R5bGVFbGVtZW50SW5zZXJ0ZWRBdFRvcC5uZXh0U2libGluZykge1xyXG5cdFx0XHRoZWFkLmluc2VydEJlZm9yZShzdHlsZUVsZW1lbnQsIGxhc3RTdHlsZUVsZW1lbnRJbnNlcnRlZEF0VG9wLm5leHRTaWJsaW5nKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVFbGVtZW50KTtcclxuXHRcdH1cclxuXHRcdHN0eWxlRWxlbWVudHNJbnNlcnRlZEF0VG9wLnB1c2goc3R5bGVFbGVtZW50KTtcclxuXHR9IGVsc2UgaWYgKG9wdGlvbnMuaW5zZXJ0QXQgPT09IFwiYm90dG9tXCIpIHtcclxuXHRcdGhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVFbGVtZW50KTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB2YWx1ZSBmb3IgcGFyYW1ldGVyICdpbnNlcnRBdCcuIE11c3QgYmUgJ3RvcCcgb3IgJ2JvdHRvbScuXCIpO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVtb3ZlU3R5bGVFbGVtZW50KHN0eWxlRWxlbWVudCkge1xyXG5cdHN0eWxlRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHN0eWxlRWxlbWVudCk7XHJcblx0dmFyIGlkeCA9IHN0eWxlRWxlbWVudHNJbnNlcnRlZEF0VG9wLmluZGV4T2Yoc3R5bGVFbGVtZW50KTtcclxuXHRpZihpZHggPj0gMCkge1xyXG5cdFx0c3R5bGVFbGVtZW50c0luc2VydGVkQXRUb3Auc3BsaWNlKGlkeCwgMSk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVTdHlsZUVsZW1lbnQob3B0aW9ucykge1xyXG5cdHZhciBzdHlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XHJcblx0c3R5bGVFbGVtZW50LnR5cGUgPSBcInRleHQvY3NzXCI7XHJcblx0aW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMsIHN0eWxlRWxlbWVudCk7XHJcblx0cmV0dXJuIHN0eWxlRWxlbWVudDtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlTGlua0VsZW1lbnQob3B0aW9ucykge1xyXG5cdHZhciBsaW5rRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaW5rXCIpO1xyXG5cdGxpbmtFbGVtZW50LnJlbCA9IFwic3R5bGVzaGVldFwiO1xyXG5cdGluc2VydFN0eWxlRWxlbWVudChvcHRpb25zLCBsaW5rRWxlbWVudCk7XHJcblx0cmV0dXJuIGxpbmtFbGVtZW50O1xyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRTdHlsZShvYmosIG9wdGlvbnMpIHtcclxuXHR2YXIgc3R5bGVFbGVtZW50LCB1cGRhdGUsIHJlbW92ZTtcclxuXHJcblx0aWYgKG9wdGlvbnMuc2luZ2xldG9uKSB7XHJcblx0XHR2YXIgc3R5bGVJbmRleCA9IHNpbmdsZXRvbkNvdW50ZXIrKztcclxuXHRcdHN0eWxlRWxlbWVudCA9IHNpbmdsZXRvbkVsZW1lbnQgfHwgKHNpbmdsZXRvbkVsZW1lbnQgPSBjcmVhdGVTdHlsZUVsZW1lbnQob3B0aW9ucykpO1xyXG5cdFx0dXBkYXRlID0gYXBwbHlUb1NpbmdsZXRvblRhZy5iaW5kKG51bGwsIHN0eWxlRWxlbWVudCwgc3R5bGVJbmRleCwgZmFsc2UpO1xyXG5cdFx0cmVtb3ZlID0gYXBwbHlUb1NpbmdsZXRvblRhZy5iaW5kKG51bGwsIHN0eWxlRWxlbWVudCwgc3R5bGVJbmRleCwgdHJ1ZSk7XHJcblx0fSBlbHNlIGlmKG9iai5zb3VyY2VNYXAgJiZcclxuXHRcdHR5cGVvZiBVUkwgPT09IFwiZnVuY3Rpb25cIiAmJlxyXG5cdFx0dHlwZW9mIFVSTC5jcmVhdGVPYmplY3RVUkwgPT09IFwiZnVuY3Rpb25cIiAmJlxyXG5cdFx0dHlwZW9mIFVSTC5yZXZva2VPYmplY3RVUkwgPT09IFwiZnVuY3Rpb25cIiAmJlxyXG5cdFx0dHlwZW9mIEJsb2IgPT09IFwiZnVuY3Rpb25cIiAmJlxyXG5cdFx0dHlwZW9mIGJ0b2EgPT09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0c3R5bGVFbGVtZW50ID0gY3JlYXRlTGlua0VsZW1lbnQob3B0aW9ucyk7XHJcblx0XHR1cGRhdGUgPSB1cGRhdGVMaW5rLmJpbmQobnVsbCwgc3R5bGVFbGVtZW50KTtcclxuXHRcdHJlbW92ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZW1vdmVTdHlsZUVsZW1lbnQoc3R5bGVFbGVtZW50KTtcclxuXHRcdFx0aWYoc3R5bGVFbGVtZW50LmhyZWYpXHJcblx0XHRcdFx0VVJMLnJldm9rZU9iamVjdFVSTChzdHlsZUVsZW1lbnQuaHJlZik7XHJcblx0XHR9O1xyXG5cdH0gZWxzZSB7XHJcblx0XHRzdHlsZUVsZW1lbnQgPSBjcmVhdGVTdHlsZUVsZW1lbnQob3B0aW9ucyk7XHJcblx0XHR1cGRhdGUgPSBhcHBseVRvVGFnLmJpbmQobnVsbCwgc3R5bGVFbGVtZW50KTtcclxuXHRcdHJlbW92ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZW1vdmVTdHlsZUVsZW1lbnQoc3R5bGVFbGVtZW50KTtcclxuXHRcdH07XHJcblx0fVxyXG5cclxuXHR1cGRhdGUob2JqKTtcclxuXHJcblx0cmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZVN0eWxlKG5ld09iaikge1xyXG5cdFx0aWYobmV3T2JqKSB7XHJcblx0XHRcdGlmKG5ld09iai5jc3MgPT09IG9iai5jc3MgJiYgbmV3T2JqLm1lZGlhID09PSBvYmoubWVkaWEgJiYgbmV3T2JqLnNvdXJjZU1hcCA9PT0gb2JqLnNvdXJjZU1hcClcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdHVwZGF0ZShvYmogPSBuZXdPYmopO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmVtb3ZlKCk7XHJcblx0XHR9XHJcblx0fTtcclxufVxyXG5cclxudmFyIHJlcGxhY2VUZXh0ID0gKGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgdGV4dFN0b3JlID0gW107XHJcblxyXG5cdHJldHVybiBmdW5jdGlvbiAoaW5kZXgsIHJlcGxhY2VtZW50KSB7XHJcblx0XHR0ZXh0U3RvcmVbaW5kZXhdID0gcmVwbGFjZW1lbnQ7XHJcblx0XHRyZXR1cm4gdGV4dFN0b3JlLmZpbHRlcihCb29sZWFuKS5qb2luKCdcXG4nKTtcclxuXHR9O1xyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gYXBwbHlUb1NpbmdsZXRvblRhZyhzdHlsZUVsZW1lbnQsIGluZGV4LCByZW1vdmUsIG9iaikge1xyXG5cdHZhciBjc3MgPSByZW1vdmUgPyBcIlwiIDogb2JqLmNzcztcclxuXHJcblx0aWYgKHN0eWxlRWxlbWVudC5zdHlsZVNoZWV0KSB7XHJcblx0XHRzdHlsZUVsZW1lbnQuc3R5bGVTaGVldC5jc3NUZXh0ID0gcmVwbGFjZVRleHQoaW5kZXgsIGNzcyk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHZhciBjc3NOb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKTtcclxuXHRcdHZhciBjaGlsZE5vZGVzID0gc3R5bGVFbGVtZW50LmNoaWxkTm9kZXM7XHJcblx0XHRpZiAoY2hpbGROb2Rlc1tpbmRleF0pIHN0eWxlRWxlbWVudC5yZW1vdmVDaGlsZChjaGlsZE5vZGVzW2luZGV4XSk7XHJcblx0XHRpZiAoY2hpbGROb2Rlcy5sZW5ndGgpIHtcclxuXHRcdFx0c3R5bGVFbGVtZW50Lmluc2VydEJlZm9yZShjc3NOb2RlLCBjaGlsZE5vZGVzW2luZGV4XSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRzdHlsZUVsZW1lbnQuYXBwZW5kQ2hpbGQoY3NzTm9kZSk7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBhcHBseVRvVGFnKHN0eWxlRWxlbWVudCwgb2JqKSB7XHJcblx0dmFyIGNzcyA9IG9iai5jc3M7XHJcblx0dmFyIG1lZGlhID0gb2JqLm1lZGlhO1xyXG5cclxuXHRpZihtZWRpYSkge1xyXG5cdFx0c3R5bGVFbGVtZW50LnNldEF0dHJpYnV0ZShcIm1lZGlhXCIsIG1lZGlhKVxyXG5cdH1cclxuXHJcblx0aWYoc3R5bGVFbGVtZW50LnN0eWxlU2hlZXQpIHtcclxuXHRcdHN0eWxlRWxlbWVudC5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3M7XHJcblx0fSBlbHNlIHtcclxuXHRcdHdoaWxlKHN0eWxlRWxlbWVudC5maXJzdENoaWxkKSB7XHJcblx0XHRcdHN0eWxlRWxlbWVudC5yZW1vdmVDaGlsZChzdHlsZUVsZW1lbnQuZmlyc3RDaGlsZCk7XHJcblx0XHR9XHJcblx0XHRzdHlsZUVsZW1lbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKSk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVMaW5rKGxpbmtFbGVtZW50LCBvYmopIHtcclxuXHR2YXIgY3NzID0gb2JqLmNzcztcclxuXHR2YXIgc291cmNlTWFwID0gb2JqLnNvdXJjZU1hcDtcclxuXHJcblx0aWYoc291cmNlTWFwKSB7XHJcblx0XHQvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yNjYwMzg3NVxyXG5cdFx0Y3NzICs9IFwiXFxuLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxcIiArIGJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHNvdXJjZU1hcCkpKSkgKyBcIiAqL1wiO1xyXG5cdH1cclxuXHJcblx0dmFyIGJsb2IgPSBuZXcgQmxvYihbY3NzXSwgeyB0eXBlOiBcInRleHQvY3NzXCIgfSk7XHJcblxyXG5cdHZhciBvbGRTcmMgPSBsaW5rRWxlbWVudC5ocmVmO1xyXG5cclxuXHRsaW5rRWxlbWVudC5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuXHJcblx0aWYob2xkU3JjKVxyXG5cdFx0VVJMLnJldm9rZU9iamVjdFVSTChvbGRTcmMpO1xyXG59XHJcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcbiAqKiBtb2R1bGUgaWQgPSA0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiFcbiAqIEBvdmVydmlldyBlczYtcHJvbWlzZSAtIGEgdGlueSBpbXBsZW1lbnRhdGlvbiBvZiBQcm9taXNlcy9BKy5cbiAqIEBjb3B5cmlnaHQgQ29weXJpZ2h0IChjKSAyMDE0IFllaHVkYSBLYXR6LCBUb20gRGFsZSwgU3RlZmFuIFBlbm5lciBhbmQgY29udHJpYnV0b3JzIChDb252ZXJzaW9uIHRvIEVTNiBBUEkgYnkgSmFrZSBBcmNoaWJhbGQpXG4gKiBAbGljZW5zZSAgIExpY2Vuc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vamFrZWFyY2hpYmFsZC9lczYtcHJvbWlzZS9tYXN0ZXIvTElDRU5TRVxuICogQHZlcnNpb24gICAzLjIuMVxuICovXG5cbihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nIHx8ICh0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzTWF5YmVUaGVuYWJsZSh4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXk7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkgPSBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID0gMDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGN1c3RvbVNjaGVkdWxlckZuO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwID0gZnVuY3Rpb24gYXNhcChjYWxsYmFjaywgYXJnKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbl0gPSBjYWxsYmFjaztcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICsgMV0gPSBhcmc7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICs9IDI7XG4gICAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiA9PT0gMikge1xuICAgICAgICAvLyBJZiBsZW4gaXMgMiwgdGhhdCBtZWFucyB0aGF0IHdlIG5lZWQgdG8gc2NoZWR1bGUgYW4gYXN5bmMgZmx1c2guXG4gICAgICAgIC8vIElmIGFkZGl0aW9uYWwgY2FsbGJhY2tzIGFyZSBxdWV1ZWQgYmVmb3JlIHRoZSBxdWV1ZSBpcyBmbHVzaGVkLCB0aGV5XG4gICAgICAgIC8vIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5IHRoaXMgZmx1c2ggdGhhdCB3ZSBhcmUgc2NoZWR1bGluZy5cbiAgICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbihsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0U2NoZWR1bGVyKHNjaGVkdWxlRm4pIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbiA9IHNjaGVkdWxlRm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldEFzYXAoYXNhcEZuKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcCA9IGFzYXBGbjtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogdW5kZWZpbmVkO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyV2luZG93IHx8IHt9O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc05vZGUgPSB0eXBlb2Ygc2VsZiA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJztcblxuICAgIC8vIHRlc3QgZm9yIHdlYiB3b3JrZXIgYnV0IG5vdCBpbiBJRTEwXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc1dvcmtlciA9IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHR5cGVvZiBpbXBvcnRTY3JpcHRzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcblxuICAgIC8vIG5vZGVcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKSB7XG4gICAgICAvLyBub2RlIHZlcnNpb24gMC4xMC54IGRpc3BsYXlzIGEgZGVwcmVjYXRpb24gd2FybmluZyB3aGVuIG5leHRUaWNrIGlzIHVzZWQgcmVjdXJzaXZlbHlcbiAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vY3Vqb2pzL3doZW4vaXNzdWVzLzQxMCBmb3IgZGV0YWlsc1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHZlcnR4XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgbGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIG5vZGUuZGF0YSA9IChpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMik7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHdlYiB3b3JrZXJcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2g7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gsIDEpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbjsgaSs9Mikge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaV07XG4gICAgICAgIHZhciBhcmcgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaSsxXTtcblxuICAgICAgICBjYWxsYmFjayhhcmcpO1xuXG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2krMV0gPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhdHRlbXB0VmVydHgoKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgciA9IHJlcXVpcmU7XG4gICAgICAgIHZhciB2ZXJ0eCA9IHIoJ3ZlcnR4Jyk7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2g7XG4gICAgLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbiAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzTm9kZSkge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKTtcbiAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTXV0YXRpb25PYnNlcnZlcigpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzV29ya2VyKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNZXNzYWdlQ2hhbm5lbCgpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXR0ZW1wdFZlcnR4KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHRoZW4kJHRoZW4ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgIHZhciBwYXJlbnQgPSB0aGlzO1xuXG4gICAgICB2YXIgY2hpbGQgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKGNoaWxkW2xpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBST01JU0VfSURdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbWFrZVByb21pc2UoY2hpbGQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgc3RhdGUgPSBwYXJlbnQuX3N0YXRlO1xuXG4gICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJndW1lbnRzW3N0YXRlIC0gMV07XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW52b2tlQ2FsbGJhY2soc3RhdGUsIGNoaWxkLCBjYWxsYmFjaywgcGFyZW50Ll9yZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjaGlsZDtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR0aGVuJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHRoZW4kJHRoZW47XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkcmVzb2x2ZShvYmplY3QpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmIG9iamVjdC5jb25zdHJ1Y3RvciA9PT0gQ29uc3RydWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgIH1cblxuICAgICAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIG9iamVjdCk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRyZXNvbHZlO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQUk9NSVNFX0lEID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDE2KTtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3AoKSB7fVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgICA9IHZvaWQgMDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEID0gMTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQgID0gMjtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUiA9IG5ldyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRFcnJvck9iamVjdCgpO1xuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc2VsZkZ1bGZpbGxtZW50KCkge1xuICAgICAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoXCJZb3UgY2Fubm90IHJlc29sdmUgYSBwcm9taXNlIHdpdGggaXRzZWxmXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGNhbm5vdFJldHVybk93bigpIHtcbiAgICAgIHJldHVybiBuZXcgVHlwZUVycm9yKCdBIHByb21pc2VzIGNhbGxiYWNrIGNhbm5vdCByZXR1cm4gdGhhdCBzYW1lIHByb21pc2UuJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZ2V0VGhlbihwcm9taXNlKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuO1xuICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUi5lcnJvciA9IGVycm9yO1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1I7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5VGhlbih0aGVuLCB2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGVuLmNhbGwodmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcik7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlLCB0aGVuKSB7XG4gICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAoZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgICAgICB2YXIgc2VhbGVkID0gZmFsc2U7XG4gICAgICAgIHZhciBlcnJvciA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeVRoZW4odGhlbiwgdGhlbmFibGUsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHNlYWxlZCkgeyByZXR1cm47IH1cbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgICAgIGlmICh0aGVuYWJsZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAgIGlmIChzZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcblxuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9LCAnU2V0dGxlOiAnICsgKHByb21pc2UuX2xhYmVsIHx8ICcgdW5rbm93biBwcm9taXNlJykpO1xuXG4gICAgICAgIGlmICghc2VhbGVkICYmIGVycm9yKSB7XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9LCBwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSkge1xuICAgICAgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdGhlbmFibGUuX3Jlc3VsdCk7XG4gICAgICB9IGVsc2UgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHRoZW5hYmxlLCB1bmRlZmluZWQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4pIHtcbiAgICAgIGlmIChtYXliZVRoZW5hYmxlLmNvbnN0cnVjdG9yID09PSBwcm9taXNlLmNvbnN0cnVjdG9yICYmXG4gICAgICAgICAgdGhlbiA9PT0gbGliJGVzNiRwcm9taXNlJHRoZW4kJGRlZmF1bHQgJiZcbiAgICAgICAgICBjb25zdHJ1Y3Rvci5yZXNvbHZlID09PSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRkZWZhdWx0KSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoZW4gPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SLmVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbih0aGVuKSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzZWxmRnVsZmlsbG1lbnQoKSk7XG4gICAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkb2JqZWN0T3JGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZ2V0VGhlbih2YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaFJlamVjdGlvbihwcm9taXNlKSB7XG4gICAgICBpZiAocHJvbWlzZS5fb25lcnJvcikge1xuICAgICAgICBwcm9taXNlLl9vbmVycm9yKHByb21pc2UuX3Jlc3VsdCk7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gocHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7IHJldHVybjsgfVxuXG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSB2YWx1ZTtcbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEO1xuXG4gICAgICBpZiAocHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gsIHByb21pc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pIHtcbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykgeyByZXR1cm47IH1cbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQ7XG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSByZWFzb247XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2hSZWplY3Rpb24sIHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICAgICAgdmFyIHN1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgICAgIHZhciBsZW5ndGggPSBzdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgICAgIHBhcmVudC5fb25lcnJvciA9IG51bGw7XG5cbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aF0gPSBjaGlsZDtcbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aCArIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRF0gPSBvbkZ1bGZpbGxtZW50O1xuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURURdICA9IG9uUmVqZWN0aW9uO1xuXG4gICAgICBpZiAobGVuZ3RoID09PSAwICYmIHBhcmVudC5fc3RhdGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaCwgcGFyZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoKHByb21pc2UpIHtcbiAgICAgIHZhciBzdWJzY3JpYmVycyA9IHByb21pc2UuX3N1YnNjcmliZXJzO1xuICAgICAgdmFyIHNldHRsZWQgPSBwcm9taXNlLl9zdGF0ZTtcblxuICAgICAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm47IH1cblxuICAgICAgdmFyIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsID0gcHJvbWlzZS5fcmVzdWx0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIGNoaWxkID0gc3Vic2NyaWJlcnNbaV07XG4gICAgICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWxsYmFjayhkZXRhaWwpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKSB7XG4gICAgICB0aGlzLmVycm9yID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SID0gbmV3IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCk7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IuZXJyb3IgPSBlO1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgICAgIHZhciBoYXNDYWxsYmFjayA9IGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICAgICAgdmFsdWUsIGVycm9yLCBzdWNjZWVkZWQsIGZhaWxlZDtcblxuICAgICAgaWYgKGhhc0NhbGxiYWNrKSB7XG4gICAgICAgIHZhbHVlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCk7XG5cbiAgICAgICAgaWYgKHZhbHVlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IpIHtcbiAgICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICAgIGVycm9yID0gdmFsdWUuZXJyb3I7XG4gICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkY2Fubm90UmV0dXJuT3duKCkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgIC8vIG5vb3BcbiAgICAgIH0gZWxzZSBpZiAoaGFzQ2FsbGJhY2sgJiYgc3VjY2VlZGVkKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChmYWlsZWQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGluaXRpYWxpemVQcm9taXNlKHByb21pc2UsIHJlc29sdmVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSl7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIHJlamVjdFByb21pc2UocmVhc29uKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaWQgPSAwO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5leHRJZCgpIHtcbiAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpZCsrO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG1ha2VQcm9taXNlKHByb21pc2UpIHtcbiAgICAgIHByb21pc2VbbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUFJPTUlTRV9JRF0gPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpZCsrO1xuICAgICAgcHJvbWlzZS5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICBwcm9taXNlLl9zdWJzY3JpYmVycyA9IFtdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsKGVudHJpZXMpIHtcbiAgICAgIHJldHVybiBuZXcgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQodGhpcywgZW50cmllcykucHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJHJhY2UoZW50cmllcykge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAgIGlmICghbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0FycmF5KGVudHJpZXMpKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29uc3RydWN0b3IoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gcmFjZS4nKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICB2YXIgbGVuZ3RoID0gZW50cmllcy5sZW5ndGg7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgQ29uc3RydWN0b3IucmVzb2x2ZShlbnRyaWVzW2ldKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRyYWNlO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkcmVqZWN0KHJlYXNvbikge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJHJlamVjdDtcblxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzUmVzb2x2ZXIoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgcmVzb2x2ZXIgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzTmV3KCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZTtcbiAgICAvKipcbiAgICAgIFByb21pc2Ugb2JqZWN0cyByZXByZXNlbnQgdGhlIGV2ZW50dWFsIHJlc3VsdCBvZiBhbiBhc3luY2hyb25vdXMgb3BlcmF0aW9uLiBUaGVcbiAgICAgIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsIHdoaWNoXG4gICAgICByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZSByZWFzb25cbiAgICAgIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBUZXJtaW5vbG9neVxuICAgICAgLS0tLS0tLS0tLS1cblxuICAgICAgLSBgcHJvbWlzZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHdpdGggYSBgdGhlbmAgbWV0aG9kIHdob3NlIGJlaGF2aW9yIGNvbmZvcm1zIHRvIHRoaXMgc3BlY2lmaWNhdGlvbi5cbiAgICAgIC0gYHRoZW5hYmxlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gdGhhdCBkZWZpbmVzIGEgYHRoZW5gIG1ldGhvZC5cbiAgICAgIC0gYHZhbHVlYCBpcyBhbnkgbGVnYWwgSmF2YVNjcmlwdCB2YWx1ZSAoaW5jbHVkaW5nIHVuZGVmaW5lZCwgYSB0aGVuYWJsZSwgb3IgYSBwcm9taXNlKS5cbiAgICAgIC0gYGV4Y2VwdGlvbmAgaXMgYSB2YWx1ZSB0aGF0IGlzIHRocm93biB1c2luZyB0aGUgdGhyb3cgc3RhdGVtZW50LlxuICAgICAgLSBgcmVhc29uYCBpcyBhIHZhbHVlIHRoYXQgaW5kaWNhdGVzIHdoeSBhIHByb21pc2Ugd2FzIHJlamVjdGVkLlxuICAgICAgLSBgc2V0dGxlZGAgdGhlIGZpbmFsIHJlc3Rpbmcgc3RhdGUgb2YgYSBwcm9taXNlLCBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG5cbiAgICAgIEEgcHJvbWlzZSBjYW4gYmUgaW4gb25lIG9mIHRocmVlIHN0YXRlczogcGVuZGluZywgZnVsZmlsbGVkLCBvciByZWplY3RlZC5cblxuICAgICAgUHJvbWlzZXMgdGhhdCBhcmUgZnVsZmlsbGVkIGhhdmUgYSBmdWxmaWxsbWVudCB2YWx1ZSBhbmQgYXJlIGluIHRoZSBmdWxmaWxsZWRcbiAgICAgIHN0YXRlLiAgUHJvbWlzZXMgdGhhdCBhcmUgcmVqZWN0ZWQgaGF2ZSBhIHJlamVjdGlvbiByZWFzb24gYW5kIGFyZSBpbiB0aGVcbiAgICAgIHJlamVjdGVkIHN0YXRlLiAgQSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZXZlciBhIHRoZW5hYmxlLlxuXG4gICAgICBQcm9taXNlcyBjYW4gYWxzbyBiZSBzYWlkIHRvICpyZXNvbHZlKiBhIHZhbHVlLiAgSWYgdGhpcyB2YWx1ZSBpcyBhbHNvIGFcbiAgICAgIHByb21pc2UsIHRoZW4gdGhlIG9yaWdpbmFsIHByb21pc2UncyBzZXR0bGVkIHN0YXRlIHdpbGwgbWF0Y2ggdGhlIHZhbHVlJ3NcbiAgICAgIHNldHRsZWQgc3RhdGUuICBTbyBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgd2lsbFxuICAgICAgaXRzZWxmIHJlamVjdCwgYW5kIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgZnVsZmlsbHMgd2lsbFxuICAgICAgaXRzZWxmIGZ1bGZpbGwuXG5cblxuICAgICAgQmFzaWMgVXNhZ2U6XG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgYGBganNcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIG9uIHN1Y2Nlc3NcbiAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG5cbiAgICAgICAgLy8gb24gZmFpbHVyZVxuICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgIH0pO1xuXG4gICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAvLyBvbiByZWplY3Rpb25cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIFVzYWdlOlxuICAgICAgLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFByb21pc2VzIHNoaW5lIHdoZW4gYWJzdHJhY3RpbmcgYXdheSBhc3luY2hyb25vdXMgaW50ZXJhY3Rpb25zIHN1Y2ggYXNcbiAgICAgIGBYTUxIdHRwUmVxdWVzdGBzLlxuXG4gICAgICBgYGBqc1xuICAgICAgZnVuY3Rpb24gZ2V0SlNPTih1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZXI7XG4gICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdqc29uJztcbiAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICB4aHIuc2VuZCgpO1xuXG4gICAgICAgICAgZnVuY3Rpb24gaGFuZGxlcigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IHRoaXMuRE9ORSkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignZ2V0SlNPTjogYCcgKyB1cmwgKyAnYCBmYWlsZWQgd2l0aCBzdGF0dXM6IFsnICsgdGhpcy5zdGF0dXMgKyAnXScpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBnZXRKU09OKCcvcG9zdHMuanNvbicpLnRoZW4oZnVuY3Rpb24oanNvbikge1xuICAgICAgICAvLyBvbiBmdWxmaWxsbWVudFxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIC8vIG9uIHJlamVjdGlvblxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgVW5saWtlIGNhbGxiYWNrcywgcHJvbWlzZXMgYXJlIGdyZWF0IGNvbXBvc2FibGUgcHJpbWl0aXZlcy5cblxuICAgICAgYGBganNcbiAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgZ2V0SlNPTignL3Bvc3RzJyksXG4gICAgICAgIGdldEpTT04oJy9jb21tZW50cycpXG4gICAgICBdKS50aGVuKGZ1bmN0aW9uKHZhbHVlcyl7XG4gICAgICAgIHZhbHVlc1swXSAvLyA9PiBwb3N0c0pTT05cbiAgICAgICAgdmFsdWVzWzFdIC8vID0+IGNvbW1lbnRzSlNPTlxuXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAY2xhc3MgUHJvbWlzZVxuICAgICAgQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZXJcbiAgICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICAgIEBjb25zdHJ1Y3RvclxuICAgICovXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UocmVzb2x2ZXIpIHtcbiAgICAgIHRoaXNbbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUFJPTUlTRV9JRF0gPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRuZXh0SWQoKTtcbiAgICAgIHRoaXMuX3Jlc3VsdCA9IHRoaXMuX3N0YXRlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3AgIT09IHJlc29sdmVyKSB7XG4gICAgICAgIHR5cGVvZiByZXNvbHZlciAhPT0gJ2Z1bmN0aW9uJyAmJiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNSZXNvbHZlcigpO1xuICAgICAgICB0aGlzIGluc3RhbmNlb2YgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UgPyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbml0aWFsaXplUHJvbWlzZSh0aGlzLCByZXNvbHZlcikgOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNOZXcoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5hbGwgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmFjZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVzb2x2ZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVqZWN0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRTY2hlZHVsZXIgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0U2NoZWR1bGVyO1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRBc2FwID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldEFzYXA7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuX2FzYXAgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcDtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgICAgIGNvbnN0cnVjdG9yOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSxcblxuICAgIC8qKlxuICAgICAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gICAgICB3aGljaCByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZVxuICAgICAgcmVhc29uIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAvLyB1c2VyIGlzIGF2YWlsYWJsZVxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gdXNlciBpcyB1bmF2YWlsYWJsZSwgYW5kIHlvdSBhcmUgZ2l2ZW4gdGhlIHJlYXNvbiB3aHlcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIENoYWluaW5nXG4gICAgICAtLS0tLS0tLVxuXG4gICAgICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICAgICAgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZpcnN0IHByb21pc2UncyBmdWxmaWxsbWVudFxuICAgICAgb3IgcmVqZWN0aW9uIGhhbmRsZXIsIG9yIHJlamVjdGVkIGlmIHRoZSBoYW5kbGVyIHRocm93cyBhbiBleGNlcHRpb24uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIHVzZXIubmFtZTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgcmV0dXJuICdkZWZhdWx0IG5hbWUnO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodXNlck5hbWUpIHtcbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGB1c2VyTmFtZWAgd2lsbCBiZSB0aGUgdXNlcidzIG5hbWUsIG90aGVyd2lzZSBpdFxuICAgICAgICAvLyB3aWxsIGJlIGAnZGVmYXVsdCBuYW1lJ2BcbiAgICAgIH0pO1xuXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScpO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gaWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGByZWFzb25gIHdpbGwgYmUgJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jy5cbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCByZWplY3RlZCwgYHJlYXNvbmAgd2lsbCBiZSAnYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScuXG4gICAgICB9KTtcbiAgICAgIGBgYFxuICAgICAgSWYgdGhlIGRvd25zdHJlYW0gcHJvbWlzZSBkb2VzIG5vdCBzcGVjaWZ5IGEgcmVqZWN0aW9uIGhhbmRsZXIsIHJlamVjdGlvbiByZWFzb25zIHdpbGwgYmUgcHJvcGFnYXRlZCBmdXJ0aGVyIGRvd25zdHJlYW0uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFBlZGFnb2dpY2FsRXhjZXB0aW9uKCdVcHN0cmVhbSBlcnJvcicpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUaGUgYFBlZGdhZ29jaWFsRXhjZXB0aW9uYCBpcyBwcm9wYWdhdGVkIGFsbCB0aGUgd2F5IGRvd24gdG8gaGVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQXNzaW1pbGF0aW9uXG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgU29tZXRpbWVzIHRoZSB2YWx1ZSB5b3Ugd2FudCB0byBwcm9wYWdhdGUgdG8gYSBkb3duc3RyZWFtIHByb21pc2UgY2FuIG9ubHkgYmVcbiAgICAgIHJldHJpZXZlZCBhc3luY2hyb25vdXNseS4gVGhpcyBjYW4gYmUgYWNoaWV2ZWQgYnkgcmV0dXJuaW5nIGEgcHJvbWlzZSBpbiB0aGVcbiAgICAgIGZ1bGZpbGxtZW50IG9yIHJlamVjdGlvbiBoYW5kbGVyLiBUaGUgZG93bnN0cmVhbSBwcm9taXNlIHdpbGwgdGhlbiBiZSBwZW5kaW5nXG4gICAgICB1bnRpbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBzZXR0bGVkLiBUaGlzIGlzIGNhbGxlZCAqYXNzaW1pbGF0aW9uKi5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBJZiB0aGUgYXNzaW1saWF0ZWQgcHJvbWlzZSByZWplY3RzLCB0aGVuIHRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCBhbHNvIHJlamVjdC5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIGZ1bGZpbGxzLCB3ZSdsbCBoYXZlIHRoZSB2YWx1ZSBoZXJlXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgcmVqZWN0cywgd2UnbGwgaGF2ZSB0aGUgcmVhc29uIGhlcmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFNpbXBsZSBFeGFtcGxlXG4gICAgICAtLS0tLS0tLS0tLS0tLVxuXG4gICAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IGZpbmRSZXN1bHQoKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFJlc3VsdChmdW5jdGlvbihyZXN1bHQsIGVycil7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRSZXN1bHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIEV4YW1wbGVcbiAgICAgIC0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIGF1dGhvciwgYm9va3M7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF1dGhvciA9IGZpbmRBdXRob3IoKTtcbiAgICAgICAgYm9va3MgID0gZmluZEJvb2tzQnlBdXRob3IoYXV0aG9yKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuXG4gICAgICBmdW5jdGlvbiBmb3VuZEJvb2tzKGJvb2tzKSB7XG5cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZmFpbHVyZShyZWFzb24pIHtcblxuICAgICAgfVxuXG4gICAgICBmaW5kQXV0aG9yKGZ1bmN0aW9uKGF1dGhvciwgZXJyKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZpbmRCb29va3NCeUF1dGhvcihhdXRob3IsIGZ1bmN0aW9uKGJvb2tzLCBlcnIpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgZm91bmRCb29rcyhib29rcyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRBdXRob3IoKS5cbiAgICAgICAgdGhlbihmaW5kQm9va3NCeUF1dGhvcikuXG4gICAgICAgIHRoZW4oZnVuY3Rpb24oYm9va3Mpe1xuICAgICAgICAgIC8vIGZvdW5kIGJvb2tzXG4gICAgICB9KS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCB0aGVuXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvbkZ1bGZpbGxlZFxuICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3RlZFxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgdGhlbjogbGliJGVzNiRwcm9taXNlJHRoZW4kJGRlZmF1bHQsXG5cbiAgICAvKipcbiAgICAgIGBjYXRjaGAgaXMgc2ltcGx5IHN1Z2FyIGZvciBgdGhlbih1bmRlZmluZWQsIG9uUmVqZWN0aW9uKWAgd2hpY2ggbWFrZXMgaXQgdGhlIHNhbWVcbiAgICAgIGFzIHRoZSBjYXRjaCBibG9jayBvZiBhIHRyeS9jYXRjaCBzdGF0ZW1lbnQuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmdW5jdGlvbiBmaW5kQXV0aG9yKCl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGRuJ3QgZmluZCB0aGF0IGF1dGhvcicpO1xuICAgICAgfVxuXG4gICAgICAvLyBzeW5jaHJvbm91c1xuICAgICAgdHJ5IHtcbiAgICAgICAgZmluZEF1dGhvcigpO1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgIH1cblxuICAgICAgLy8gYXN5bmMgd2l0aCBwcm9taXNlc1xuICAgICAgZmluZEF1dGhvcigpLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAbWV0aG9kIGNhdGNoXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGlvblxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgJ2NhdGNoJzogZnVuY3Rpb24ob25SZWplY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcihDb25zdHJ1Y3RvciwgaW5wdXQpIHtcbiAgICAgIHRoaXMuX2luc3RhbmNlQ29uc3RydWN0b3IgPSBDb25zdHJ1Y3RvcjtcbiAgICAgIHRoaXMucHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKCF0aGlzLnByb21pc2VbbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUFJPTUlTRV9JRF0pIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbWFrZVByb21pc2UodGhpcy5wcm9taXNlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgdGhpcy5faW5wdXQgICAgID0gaW5wdXQ7XG4gICAgICAgIHRoaXMubGVuZ3RoICAgICA9IGlucHV0Lmxlbmd0aDtcbiAgICAgICAgdGhpcy5fcmVtYWluaW5nID0gaW5wdXQubGVuZ3RoO1xuXG4gICAgICAgIHRoaXMuX3Jlc3VsdCA9IG5ldyBBcnJheSh0aGlzLmxlbmd0aCk7XG5cbiAgICAgICAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbCh0aGlzLnByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5sZW5ndGggPSB0aGlzLmxlbmd0aCB8fCAwO1xuICAgICAgICAgIHRoaXMuX2VudW1lcmF0ZSgpO1xuICAgICAgICAgIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwodGhpcy5wcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHRoaXMucHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJHZhbGlkYXRpb25FcnJvcigpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkdmFsaWRhdGlvbkVycm9yKCkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignQXJyYXkgTWV0aG9kcyBtdXN0IGJlIHByb3ZpZGVkIGFuIEFycmF5Jyk7XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9lbnVtZXJhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsZW5ndGggID0gdGhpcy5sZW5ndGg7XG4gICAgICB2YXIgaW5wdXQgICA9IHRoaXMuX2lucHV0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgdGhpcy5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuX2VhY2hFbnRyeShpbnB1dFtpXSwgaSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fZWFjaEVudHJ5ID0gZnVuY3Rpb24oZW50cnksIGkpIHtcbiAgICAgIHZhciBjID0gdGhpcy5faW5zdGFuY2VDb25zdHJ1Y3RvcjtcbiAgICAgIHZhciByZXNvbHZlID0gYy5yZXNvbHZlO1xuXG4gICAgICBpZiAocmVzb2x2ZSA9PT0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdCkge1xuICAgICAgICB2YXIgdGhlbiA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4oZW50cnkpO1xuXG4gICAgICAgIGlmICh0aGVuID09PSBsaWIkZXM2JHByb21pc2UkdGhlbiQkZGVmYXVsdCAmJlxuICAgICAgICAgICAgZW50cnkuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgICAgdGhpcy5fc2V0dGxlZEF0KGVudHJ5Ll9zdGF0ZSwgaSwgZW50cnkuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoZW4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLl9yZW1haW5pbmctLTtcbiAgICAgICAgICB0aGlzLl9yZXN1bHRbaV0gPSBlbnRyeTtcbiAgICAgICAgfSBlbHNlIGlmIChjID09PSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCkge1xuICAgICAgICAgIHZhciBwcm9taXNlID0gbmV3IGMobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBlbnRyeSwgdGhlbik7XG4gICAgICAgICAgdGhpcy5fd2lsbFNldHRsZUF0KHByb21pc2UsIGkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChuZXcgYyhmdW5jdGlvbihyZXNvbHZlKSB7IHJlc29sdmUoZW50cnkpOyB9KSwgaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChyZXNvbHZlKGVudHJ5KSwgaSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fc2V0dGxlZEF0ID0gZnVuY3Rpb24oc3RhdGUsIGksIHZhbHVlKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IHRoaXMucHJvbWlzZTtcblxuICAgICAgaWYgKHByb21pc2UuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgIHRoaXMuX3JlbWFpbmluZy0tO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3Jlc3VsdFtpXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3dpbGxTZXR0bGVBdCA9IGZ1bmN0aW9uKHByb21pc2UsIGkpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHByb21pc2UsIHVuZGVmaW5lZCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgZW51bWVyYXRvci5fc2V0dGxlZEF0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCwgaSwgdmFsdWUpO1xuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCwgaSwgcmVhc29uKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRwb2x5ZmlsbCgpIHtcbiAgICAgIHZhciBsb2NhbDtcblxuICAgICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbG9jYWwgPSBnbG9iYWw7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGxvY2FsID0gc2VsZjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgbG9jYWwgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb2x5ZmlsbCBmYWlsZWQgYmVjYXVzZSBnbG9iYWwgb2JqZWN0IGlzIHVuYXZhaWxhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQnKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBQID0gbG9jYWwuUHJvbWlzZTtcblxuICAgICAgaWYgKFAgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFAucmVzb2x2ZSgpKSA9PT0gJ1tvYmplY3QgUHJvbWlzZV0nICYmICFQLmNhc3QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsb2NhbC5Qcm9taXNlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQ7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJHBvbHlmaWxsO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2UgPSB7XG4gICAgICAnUHJvbWlzZSc6IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0LFxuICAgICAgJ3BvbHlmaWxsJzogbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0XG4gICAgfTtcblxuICAgIC8qIGdsb2JhbCBkZWZpbmU6dHJ1ZSBtb2R1bGU6dHJ1ZSB3aW5kb3c6IHRydWUgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmVbJ2FtZCddKSB7XG4gICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlOyB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZVsnZXhwb3J0cyddKSB7XG4gICAgICBtb2R1bGVbJ2V4cG9ydHMnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXNbJ0VTNlByb21pc2UnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0KCk7XG59KS5jYWxsKHRoaXMpO1xuXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9lczYtcHJvbWlzZS9kaXN0L2VzNi1wcm9taXNlLmpzXG4gKiogbW9kdWxlIGlkID0gNVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqICh3ZWJwYWNrKS9+L25vZGUtbGlicy1icm93c2VyL34vcHJvY2Vzcy9icm93c2VyLmpzXG4gKiogbW9kdWxlIGlkID0gNlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtb2R1bGUpIHtcclxuXHRpZighbW9kdWxlLndlYnBhY2tQb2x5ZmlsbCkge1xyXG5cdFx0bW9kdWxlLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKCkge307XHJcblx0XHRtb2R1bGUucGF0aHMgPSBbXTtcclxuXHRcdC8vIG1vZHVsZS5wYXJlbnQgPSB1bmRlZmluZWQgYnkgZGVmYXVsdFxyXG5cdFx0bW9kdWxlLmNoaWxkcmVuID0gW107XHJcblx0XHRtb2R1bGUud2VicGFja1BvbHlmaWxsID0gMTtcclxuXHR9XHJcblx0cmV0dXJuIG1vZHVsZTtcclxufVxyXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqICh3ZWJwYWNrKS9idWlsZGluL21vZHVsZS5qc1xuICoqIG1vZHVsZSBpZCA9IDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qIChpZ25vcmVkKSAqL1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogdmVydHggKGlnbm9yZWQpXG4gKiogbW9kdWxlIGlkID0gOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHsgdGhyb3cgbmV3IEVycm9yKFwiZGVmaW5lIGNhbm5vdCBiZSB1c2VkIGluZGlyZWN0XCIpOyB9O1xyXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqICh3ZWJwYWNrKS9idWlsZGluL2FtZC1kZWZpbmUuanNcbiAqKiBtb2R1bGUgaWQgPSA5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCI7IChmdW5jdGlvbih3aW4sIGxpYikge1xuICB2YXIgZG9jID0gd2luLmRvY3VtZW50XG4gIHZhciBkb2NFbCA9IGRvYy5kb2N1bWVudEVsZW1lbnRcbiAgdmFyIG1ldGFFbCA9IGRvYy5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9XCJ2aWV3cG9ydFwiXScpXG4gIHZhciBmbGV4aWJsZUVsID0gZG9jLnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT1cImZsZXhpYmxlXCJdJylcbiAgdmFyIGRwciA9IDBcbiAgdmFyIHNjYWxlID0gMFxuICB2YXIgdGlkXG4gIHZhciBmbGV4aWJsZSA9IGxpYi5mbGV4aWJsZSB8fCAobGliLmZsZXhpYmxlID0ge30pXG4gIFxuICBpZiAobWV0YUVsKSB7XG4gICAgY29uc29sZS53YXJuKCflsIbmoLnmja7lt7LmnInnmoRtZXRh5qCH562+5p2l6K6+572u57yp5pS+5q+U5L6LJylcbiAgICB2YXIgbWF0Y2ggPSBtZXRhRWwuZ2V0QXR0cmlidXRlKCdjb250ZW50JylcbiAgICAgIC5tYXRjaCgvaW5pdGlhbFxcLXNjYWxlPShbXFxkXFwuXSspLylcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIHNjYWxlID0gcGFyc2VGbG9hdChtYXRjaFsxXSlcbiAgICAgIGRwciA9IHBhcnNlSW50KDEgLyBzY2FsZSlcbiAgICB9XG4gIH0gZWxzZSBpZiAoZmxleGlibGVFbCkge1xuICAgIHZhciBjb250ZW50ID0gZmxleGlibGVFbC5nZXRBdHRyaWJ1dGUoJ2NvbnRlbnQnKVxuICAgIGlmIChjb250ZW50KSB7XG4gICAgICB2YXIgaW5pdGlhbERwciA9IGNvbnRlbnQubWF0Y2goL2luaXRpYWxcXC1kcHI9KFtcXGRcXC5dKykvKVxuICAgICAgdmFyIG1heGltdW1EcHIgPSBjb250ZW50Lm1hdGNoKC9tYXhpbXVtXFwtZHByPShbXFxkXFwuXSspLylcbiAgICAgIGlmIChpbml0aWFsRHByKSB7XG4gICAgICAgIGRwciA9IHBhcnNlRmxvYXQoaW5pdGlhbERwclsxXSlcbiAgICAgICAgc2NhbGUgPSBwYXJzZUZsb2F0KCgxIC8gZHByKS50b0ZpeGVkKDIpKSAgICBcbiAgICAgIH1cbiAgICAgIGlmIChtYXhpbXVtRHByKSB7XG4gICAgICAgIGRwciA9IHBhcnNlRmxvYXQobWF4aW11bURwclsxXSlcbiAgICAgICAgc2NhbGUgPSBwYXJzZUZsb2F0KCgxIC8gZHByKS50b0ZpeGVkKDIpKSAgICBcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoIWRwciAmJiAhc2NhbGUpIHtcbiAgICB2YXIgaXNBbmRyb2lkID0gd2luLm5hdmlnYXRvci5hcHBWZXJzaW9uLm1hdGNoKC9hbmRyb2lkL2dpKVxuICAgIHZhciBpc0lQaG9uZSA9IHdpbi5uYXZpZ2F0b3IuYXBwVmVyc2lvbi5tYXRjaCgvaXBob25lL2dpKVxuICAgIHZhciBkZXZpY2VQaXhlbFJhdGlvID0gd2luLmRldmljZVBpeGVsUmF0aW9cbiAgICBpZiAoaXNJUGhvbmUpIHtcbiAgICAgIC8vIGlPU+S4i++8jOWvueS6jjLlkowz55qE5bGP77yM55SoMuWAjeeahOaWueahiO+8jOWFtuS9meeahOeUqDHlgI3mlrnmoYhcbiAgICAgIGlmIChkZXZpY2VQaXhlbFJhdGlvID49IDMgJiYgKCFkcHIgfHwgZHByID49IDMpKSB7ICAgICAgICAgICAgICAgIFxuICAgICAgICBkcHIgPSAzXG4gICAgICB9IGVsc2UgaWYgKGRldmljZVBpeGVsUmF0aW8gPj0gMiAmJiAoIWRwciB8fCBkcHIgPj0gMikpe1xuICAgICAgICBkcHIgPSAyXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkcHIgPSAxXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIOWFtuS7luiuvuWkh+S4i++8jOS7jeaXp+S9v+eUqDHlgI3nmoTmlrnmoYhcbiAgICAgIGRwciA9IDFcbiAgICB9XG4gICAgc2NhbGUgPSAxIC8gZHByXG4gIH1cblxuICBkb2NFbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHByJywgZHByKVxuICBpZiAoIW1ldGFFbCkge1xuICAgIG1ldGFFbCA9IGRvYy5jcmVhdGVFbGVtZW50KCdtZXRhJylcbiAgICBtZXRhRWwuc2V0QXR0cmlidXRlKCduYW1lJywgJ3ZpZXdwb3J0JylcbiAgICBtZXRhRWwuc2V0QXR0cmlidXRlKFxuICAgICAgJ2NvbnRlbnQnLFxuICAgICAgJ2luaXRpYWwtc2NhbGU9J1xuICAgICAgICArIHNjYWxlICsgJywgbWF4aW11bS1zY2FsZT0nXG4gICAgICAgICsgc2NhbGUgKyAnLCBtaW5pbXVtLXNjYWxlPSdcbiAgICAgICAgKyBzY2FsZSArICcsIHVzZXItc2NhbGFibGU9bm8nXG4gICAgICApXG4gICAgaWYgKGRvY0VsLmZpcnN0RWxlbWVudENoaWxkKSB7XG4gICAgICBkb2NFbC5maXJzdEVsZW1lbnRDaGlsZC5hcHBlbmRDaGlsZChtZXRhRWwpXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB3cmFwID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICB3cmFwLmFwcGVuZENoaWxkKG1ldGFFbClcbiAgICAgIGRvYy53cml0ZSh3cmFwLmlubmVySFRNTClcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWZyZXNoUmVtKCl7XG4gICAgdmFyIHdpZHRoID0gZG9jRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGhcbiAgICBpZiAod2lkdGggLyBkcHIgPiA1NDApIHtcbiAgICAgIHdpZHRoID0gNTQwICogZHByXG4gICAgfVxuICAgIHZhciByZW0gPSB3aWR0aCAvIDEwXG4gICAgZG9jRWwuc3R5bGUuZm9udFNpemUgPSByZW0gKyAncHgnXG4gICAgZmxleGlibGUucmVtID0gd2luLnJlbSA9IHJlbVxuICB9XG5cbiAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuICAgIGNsZWFyVGltZW91dCh0aWQpXG4gICAgdGlkID0gc2V0VGltZW91dChyZWZyZXNoUmVtLCAzMDApXG4gIH0sIGZhbHNlKVxuICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncGFnZXNob3cnLCBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUucGVyc2lzdGVkKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGlkKVxuICAgICAgdGlkID0gc2V0VGltZW91dChyZWZyZXNoUmVtLCAzMDApXG4gICAgfVxuICB9LCBmYWxzZSlcblxuICBpZiAoZG9jLnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICBkb2MuYm9keS5zdHlsZS5mb250U2l6ZSA9IDEyICogZHByICsgJ3B4J1xuICB9IGVsc2Uge1xuICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24oZSkge1xuICAgICAgZG9jLmJvZHkuc3R5bGUuZm9udFNpemUgPSAxMiAqIGRwciArICdweCdcbiAgICB9LCBmYWxzZSlcbiAgfVxuICBcbiAgcmVmcmVzaFJlbSgpXG5cbiAgZmxleGlibGUuZHByID0gd2luLmRwciA9IGRwclxuICBmbGV4aWJsZS5yZWZyZXNoUmVtID0gcmVmcmVzaFJlbVxuICBmbGV4aWJsZS5yZW0ycHggPSBmdW5jdGlvbihkKSB7XG4gICAgdmFyIHZhbCA9IHBhcnNlRmxvYXQoZCkgKiB0aGlzLnJlbVxuICAgIGlmICh0eXBlb2YgZCA9PT0gJ3N0cmluZycgJiYgZC5tYXRjaCgvcmVtJC8pKSB7XG4gICAgICB2YWwgKz0gJ3B4J1xuICAgIH1cbiAgICByZXR1cm4gdmFsXG4gIH1cbiAgZmxleGlibGUucHgycmVtID0gZnVuY3Rpb24oZCkge1xuICAgIHZhciB2YWwgPSBwYXJzZUZsb2F0KGQpIC8gdGhpcy5yZW1cbiAgICBpZiAodHlwZW9mIGQgPT09ICdzdHJpbmcnICYmIGQubWF0Y2goL3B4JC8pKSB7XG4gICAgICB2YWwgKz0gJ3JlbSdcbiAgICB9XG4gICAgcmV0dXJuIHZhbFxuICB9XG5cbn0pKHdpbmRvdywgd2luZG93WydsaWInXSB8fCAod2luZG93WydsaWInXSA9IHt9KSlcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2ZsZXhpYmxlLmpzXG4gKiogbW9kdWxlIGlkID0gMTBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgY29uZmlnID0ge1xuXG4gIHdlZXhWZXJzaW9uOiAnMC41LjAnLFxuXG4gIGRlYnVnOiBmYWxzZVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29uZmlnXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9jb25maWcuanNcbiAqKiBtb2R1bGUgaWQgPSAxMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbmZ1bmN0aW9uIGxvYWRCeVhIUihjb25maWcsIGNhbGxiYWNrKSB7XG4gIGlmICghY29uZmlnLnNvdXJjZSkge1xuICAgIGNhbGxiYWNrKG5ldyBFcnJvcigneGhyIGxvYWRlcjogbWlzc2luZyBjb25maWcuc291cmNlLicpKVxuICB9XG4gIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuICB4aHIub3BlbignR0VUJywgY29uZmlnLnNvdXJjZSlcbiAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjYWxsYmFjayhudWxsLCB0aGlzLnJlc3BvbnNlVGV4dClcbiAgfVxuICB4aHIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgIGNhbGxiYWNrKGVycm9yKVxuICB9XG4gIHhoci5zZW5kKClcbn1cblxuZnVuY3Rpb24gbG9hZEJ5SnNvbnAoY29uZmlnLCBjYWxsYmFjaykge1xuICBpZiAoIWNvbmZpZy5zb3VyY2UpIHtcbiAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ2pzb25wIGxvYWRlcjogbWlzc2luZyBjb25maWcuc291cmNlLicpKVxuICB9XG4gIHZhciBjYWxsYmFja05hbWUgPSBjb25maWcuanNvbnBDYWxsYmFjayB8fCAnd2VleEpzb25wQ2FsbGJhY2snXG4gIHdpbmRvd1tjYWxsYmFja05hbWVdID0gZnVuY3Rpb24gKGNvZGUpIHtcbiAgICBpZiAoY29kZSkge1xuICAgICAgY2FsbGJhY2sobnVsbCwgY29kZSlcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdsb2FkIGJ5IGpzb25wIGVycm9yJykpXG4gICAgfVxuICB9XG4gIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICBzY3JpcHQuc3JjID0gZGVjb2RlVVJJQ29tcG9uZW50KGNvbmZpZy5zb3VyY2UpXG4gIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCdcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpXG59XG5cbmZ1bmN0aW9uIGxvYWRCeVNvdXJjZUNvZGUoY29uZmlnLCBjYWxsYmFjaykge1xuICAvLyBzcmMgaXMgdGhlIGpzYnVuZGxlLlxuICAvLyBubyBuZWVkIHRvIGZldGNoIGZyb20gYW55d2hlcmUuXG4gIGlmIChjb25maWcuc291cmNlKSB7XG4gICAgY2FsbGJhY2sobnVsbCwgY29uZmlnLnNvdXJjZSlcbiAgfSBlbHNlIHtcbiAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ3NvdXJjZSBjb2RlIGxhb2RlcjogbWlzc2luZyBjb25maWcuc291cmNlLicpKVxuICB9XG59XG5cbnZhciBjYWxsYmFja01hcCA9IHtcbiAgeGhyOiBsb2FkQnlYSFIsXG4gIGpzb25wOiBsb2FkQnlKc29ucCxcbiAgc291cmNlOiBsb2FkQnlTb3VyY2VDb2RlXG59XG5cbmZ1bmN0aW9uIGxvYWQob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgdmFyIGxvYWRGbiA9IGNhbGxiYWNrTWFwW29wdGlvbnMubG9hZGVyXVxuICBsb2FkRm4ob3B0aW9ucywgY2FsbGJhY2spXG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyTG9hZGVyKG5hbWUsIGxvYWRlckZ1bmMpIHtcbiAgaWYgKHR5cGVvZiBsb2FkZXJGdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2tNYXBbbmFtZV0gPSBsb2FkZXJGdW5jXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGxvYWQ6IGxvYWQsXG4gIHJlZ2lzdGVyTG9hZGVyOiByZWdpc3RlckxvYWRlclxufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9sb2FkZXIuanNcbiAqKiBtb2R1bGUgaWQgPSAxMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBXRUFQUF9TVFlMRV9JRCA9ICd3ZWFwcC1zdHlsZSdcblxudmFyIF9pc1dlYnBTdXBwb3J0ZWQgPSBmYWxzZVxuXG47IChmdW5jdGlvbiBpc1N1cHBvcnRXZWJwKCkge1xuICB0cnkge1xuICAgIHZhciB3ZWJQID0gbmV3IEltYWdlKClcbiAgICB3ZWJQLnNyYyA9ICdkYXRhOmltYWdlL3dlYnA7YmFzZTY0LFVrbEdSam9BQUFCWFJVSlFWbEE0SUM0QUFBQ3lBZ0NkQSdcbiAgICAgICAgICAgICAgKyAnU29DQUFJQUxtazBtazBpSWlJaUlnQm9TeWdBQmM2V1dnQUEvdmVmZi8wUFA4YkEvL0x3WUFBQSdcbiAgICB3ZWJQLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh3ZWJQLmhlaWdodCA9PT0gMikge1xuICAgICAgICBfaXNXZWJwU3VwcG9ydGVkID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIGRvIG5vdGhpbmcuXG4gIH1cbn0pKClcblxuZnVuY3Rpb24gZXh0ZW5kKHRvLCBmcm9tKSB7XG4gIGZvciAodmFyIGtleSBpbiBmcm9tKSB7XG4gICAgdG9ba2V5XSA9IGZyb21ba2V5XVxuICB9XG4gIHJldHVybiB0b1xufVxuXG5mdW5jdGlvbiBpc0FycmF5KGFycikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheVxuICAgID8gQXJyYXkuaXNBcnJheShhcnIpXG4gICAgOiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFycikgPT09ICdbb2JqZWN0IEFycmF5XScpXG59XG5cbmZ1bmN0aW9uIGFwcGVuZFN0eWxlKGNzcywgc3R5bGVJZCwgcmVwbGFjZSkge1xuICB2YXIgc3R5bGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdHlsZUlkKVxuICBpZiAoc3R5bGUgJiYgcmVwbGFjZSkge1xuICAgIHN0eWxlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc3R5bGUpXG4gICAgc3R5bGUgPSBudWxsXG4gIH1cbiAgaWYgKCFzdHlsZSkge1xuICAgIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgIHN0eWxlLnR5cGUgPSAndGV4dC9jc3MnXG4gICAgc3R5bGVJZCAmJiAoc3R5bGUuaWQgPSBzdHlsZUlkKVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc3R5bGUpXG4gIH1cbiAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKSlcbn1cblxuZnVuY3Rpb24gZ2V0VW5pcXVlRnJvbUFycmF5KGFycikge1xuICBpZiAoIWlzQXJyYXkoYXJyKSkge1xuICAgIHJldHVybiBbXVxuICB9XG4gIHZhciByZXMgPSBbXVxuICB2YXIgdW5pcXVlID0ge31cbiAgdmFyIHZhbFxuICBmb3IgKHZhciBpID0gMCwgbCA9IGFyci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YWwgPSBhcnJbaV1cbiAgICBpZiAodW5pcXVlW3ZhbF0pIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIHVuaXF1ZVt2YWxdID0gdHJ1ZVxuICAgIHJlcy5wdXNoKHZhbClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIHRyYW5zaXRpb25pemUoZWxlbWVudCwgcHJvcHMpIHtcbiAgdmFyIHRyYW5zaXRpb25zID0gW11cbiAgZm9yICh2YXIga2V5IGluIHByb3BzKSB7XG4gICAgdHJhbnNpdGlvbnMucHVzaChrZXkgKyAnICcgKyBwcm9wc1trZXldKVxuICB9XG4gIGVsZW1lbnQuc3R5bGUudHJhbnNpdGlvbiA9IHRyYW5zaXRpb25zLmpvaW4oJywgJylcbiAgZWxlbWVudC5zdHlsZS53ZWJraXRUcmFuc2l0aW9uID0gdHJhbnNpdGlvbnMuam9pbignLCAnKVxufVxuXG5mdW5jdGlvbiBkZXRlY3RXZWJwKCkge1xuICByZXR1cm4gX2lzV2VicFN1cHBvcnRlZFxufVxuXG5mdW5jdGlvbiBnZXRSYW5kb20obnVtKSB7XG4gIHZhciBfZGVmYXVsdE51bSA9IDEwXG4gIGlmICh0eXBlb2YgbnVtICE9PSAnbnVtYmVyJyB8fCBudW0gPD0gMCkge1xuICAgIG51bSA9IF9kZWZhdWx0TnVtXG4gIH1cbiAgdmFyIF9tYXggPSBNYXRoLnBvdygxMCwgbnVtKVxuICByZXR1cm4gTWF0aC5mbG9vcihEYXRlLm5vdygpICsgTWF0aC5yYW5kb20oKSAqIF9tYXgpICUgX21heFxufVxuXG5mdW5jdGlvbiBnZXRSZ2IoY29sb3IpIHtcbiAgdmFyIG1hdGNoXG4gIGNvbG9yID0gY29sb3IgKyAnJ1xuICBpZiAobWF0Y2ggPSBjb2xvci5tYXRjaCgvIyhcXGR7Mn0pKFxcZHsyfSkoXFxkezJ9KS8pKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHI6IHBhcnNlSW50KG1hdGNoWzFdLCAxNiksXG4gICAgICBnOiBwYXJzZUludChtYXRjaFsyXSwgMTYpLFxuICAgICAgYjogcGFyc2VJbnQobWF0Y2hbM10sIDE2KVxuICAgIH1cbiAgfVxuICBpZiAobWF0Y2ggPSBjb2xvci5tYXRjaCgvcmdiXFwoKFxcZCspLFxccyooXFxkKyksXFxzKihcXGQrKVxcKS8pKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHI6IHBhcnNlSW50KG1hdGNoWzFdKSxcbiAgICAgIGc6IHBhcnNlSW50KG1hdGNoWzJdKSxcbiAgICAgIGI6IHBhcnNlSW50KG1hdGNoWzNdKVxuICAgIH1cbiAgfVxufVxuXG4vLyBkaXJlY3Rpb246ICdsJyB8ICdyJywgZGVmYXVsdCBpcyAncidcbi8vIG51bTogaG93IG1hbnkgdGltZXMgdG8gbG9vcCwgc2hvdWxkIGJlIGEgcG9zaXRpdmUgaW50ZWdlclxuZnVuY3Rpb24gbG9vcEFycmF5KGFyciwgbnVtLCBkaXJlY3Rpb24pIHtcbiAgaWYgKCFpc0FycmF5KGFycikpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgaXNMZWZ0ID0gKGRpcmVjdGlvbiArICcnKS50b0xvd2VyQ2FzZSgpID09PSAnbCdcbiAgdmFyIGxlbiA9IGFyci5sZW5ndGhcbiAgbnVtID0gbnVtICUgbGVuXG4gIGlmIChudW0gPCAwKSB7XG4gICAgbnVtID0gLW51bVxuICAgIGlzTGVmdCA9ICFpc0xlZnRcbiAgfVxuICBpZiAobnVtID09PSAwKSB7XG4gICAgcmV0dXJuIGFyclxuICB9XG4gIHZhciByZXMsIGxwLCBycFxuICBpZiAoaXNMZWZ0KSB7XG4gICAgbHAgPSBhcnIuc2xpY2UoMCwgbnVtKVxuICAgIHJwID0gYXJyLnNsaWNlKG51bSlcbiAgfSBlbHNlIHtcbiAgICBscCA9IGFyci5zbGljZSgwLCBsZW4gLSBudW0pXG4gICAgcnAgPSBhcnIuc2xpY2UobGVuIC0gbnVtKVxuICB9XG4gIHJldHVybiBycC5jb25jYXQobHApXG59XG5cbi8vIHBhZCBhIGludGVnZXIgbnVtYmVyIHdpdGggemVyb3Mgb24gdGhlIGxlZnQuXG4vLyBleGFtcGxlOiBmaWxsSW50KDEyLCAzKSAtPiAnMDEyJ1xuLy8gLSBudW06IHRoZSBudW1iZXIgdG8gcGFkXG4vLyAtIGxlbjogdGhlIHNwZWNpZmllZCBsZW5ndGhcbmZ1bmN0aW9uIGxlZnRQYWQobnVtLCBsZW4pIHtcbiAgaWYgKGxlbiA8PSAwKSB7XG4gICAgcmV0dXJuIG51bVxuICB9XG4gIHZhciBudW1MZW4gPSAobnVtICsgJycpLmxlbmd0aFxuICBpZiAobnVtTGVuID49IGxlbikge1xuICAgIHJldHVybiBudW1cbiAgfVxuICByZXR1cm4gbmV3IEFycmF5KGxlbiAtIG51bUxlbiArIDEpLmpvaW4oJzAnKSArIG51bVxufVxuXG4vLyBnZXQgRGF0ZVN0ciB3aXRoIHNwZWNpZmllZCBzZXBhcmF0b3IgbGlrZSAnMjAxNi0wNi0wMydcbmZ1bmN0aW9uIGdldERhdGVTdHIoc2VwYXJhdG9yKSB7XG4gIHZhciBkdCA9IG5ldyBEYXRlKClcbiAgdmFyIHkgPSBkdC5nZXRGdWxsWWVhcigpXG4gIHZhciBtID0gbGVmdFBhZChkdC5nZXRNb250aCgpICsgMSwgMilcbiAgdmFyIGQgPSBsZWZ0UGFkKGR0LmdldERhdGUoKSwgMilcbiAgcmV0dXJuIFt5LCBtLCBkXS5qb2luKHNlcGFyYXRvciB8fCAnJylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGV4dGVuZDogZXh0ZW5kLFxuICBpc0FycmF5OiBpc0FycmF5LFxuICBhcHBlbmRTdHlsZTogYXBwZW5kU3R5bGUsXG4gIGdldFVuaXF1ZUZyb21BcnJheTogZ2V0VW5pcXVlRnJvbUFycmF5LFxuICB0cmFuc2l0aW9uaXplOiB0cmFuc2l0aW9uaXplLFxuICBkZXRlY3RXZWJwOiBkZXRlY3RXZWJwLFxuICBnZXRSYW5kb206IGdldFJhbmRvbSxcbiAgZ2V0UmdiOiBnZXRSZ2IsXG4gIGxvb3BBcnJheTogbG9vcEFycmF5LFxuICBsZWZ0UGFkOiBsZWZ0UGFkLFxuICBnZXREYXRlU3RyOiBnZXREYXRlU3RyXG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy91dGlscy5qc1xuICoqIG1vZHVsZSBpZCA9IDEzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4vdXRpbHMnKS5leHRlbmRcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnLi91dGlscycpLmlzQXJyYXlcbnZhciBDb21wb25lbnRNYW5hZ2VyID0gcmVxdWlyZSgnLi9jb21wb25lbnRNYW5hZ2VyJylcblxuLy8gZm9yIGpzZnJhbWV3b3JrIHRvIHJlZ2lzdGVyIG1vZHVsZXMuXG52YXIgX3JlZ2lzdGVyTW9kdWxlcyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgaWYgKGlzQXJyYXkoY29uZmlnKSkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY29uZmlnLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgd2luZG93LnJlZ2lzdGVyTW9kdWxlcyhjb25maWdbaV0pXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHdpbmRvdy5yZWdpc3Rlck1vZHVsZXMoY29uZmlnKVxuICB9XG59XG5cbnZhciBwcm90b2NvbCA9IHtcblxuICAvLyB3ZWV4IGluc3RhbmNlc1xuICBfaW5zdGFuY2VzOiB7fSxcblxuICAvLyBhcGkgbWV0YSBpbmZvXG4gIF9tZXRhOiB7fSxcblxuICAvLyBXZWV4LnJlZ2lzdGVyQXBpTW9kdWxlIHVzZWQgdGhpcyB0byByZWdpc3RlciBhbmQgYWNjZXNzIGFwaU1vZHVsZXMuXG4gIGFwaU1vZHVsZToge30sXG5cbiAgaW5qZWN0V2VleEluc3RhbmNlOiBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICB0aGlzLl9pbnN0YW5jZXNbaW5zdGFuY2UuaW5zdGFuY2VJZF0gPSBpbnN0YW5jZVxuICB9LFxuXG4gIGdldFdlZXhJbnN0YW5jZTogZnVuY3Rpb24gKGluc3RhbmNlSWQpIHtcbiAgICByZXR1cm4gdGhpcy5faW5zdGFuY2VzW2luc3RhbmNlSWRdXG4gIH0sXG5cbiAgLy8gZ2V0IHRoZSBhcGkgbWV0aG9kIG1ldGEgaW5mbyBhcnJheSBmb3IgdGhlIG1vZHVsZS5cbiAgZ2V0QXBpTW9kdWxlTWV0YTogZnVuY3Rpb24gKG1vZHVsZU5hbWUpIHtcbiAgICB2YXIgbWV0YU9iaiA9IHt9XG4gICAgbWV0YU9ialttb2R1bGVOYW1lXSA9IHRoaXMuX21ldGFbbW9kdWxlTmFtZV1cbiAgICByZXR1cm4gbWV0YU9ialxuICB9LFxuXG4gIC8vIFNldCBtZXRhIGluZm8gZm9yIGEgYXBpIG1vZHVsZS5cbiAgLy8gSWYgdGhlcmUgaXMgYSBzYW1lIG5hbWVkIGFwaSwganVzdCByZXBsYWNlIGl0LlxuICAvLyBvcHRzOlxuICAvLyAtIG1ldGFPYmo6IG1ldGEgb2JqZWN0IGxpa2VcbiAgLy8ge1xuICAvLyAgICBkb206IFt7XG4gIC8vICAgICAgbmFtZTogJ2FkZEVsZW1lbnQnLFxuICAvLyAgICAgIGFyZ3M6IFsnc3RyaW5nJywgJ29iamVjdCddXG4gIC8vICAgIH1dXG4gIC8vIH1cbiAgc2V0QXBpTW9kdWxlTWV0YTogZnVuY3Rpb24gKG1ldGFPYmopIHtcbiAgICB2YXIgbW9kdWxlTmFtZVxuICAgIGZvciAodmFyIGsgaW4gbWV0YU9iaikge1xuICAgICAgaWYgKG1ldGFPYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgbW9kdWxlTmFtZSA9IGtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIG1ldGFBcnJheSA9IHRoaXMuX21ldGFbbW9kdWxlTmFtZV1cbiAgICBpZiAoIW1ldGFBcnJheSkge1xuICAgICAgdGhpcy5fbWV0YVttb2R1bGVOYW1lXSA9IG1ldGFPYmpbbW9kdWxlTmFtZV1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG5hbWVPYmogPSB7fVxuICAgICAgbWV0YU9ialttb2R1bGVOYW1lXS5mb3JFYWNoKGZ1bmN0aW9uIChhcGkpIHtcbiAgICAgICAgbmFtZU9ialthcGkubmFtZV0gPSBhcGlcbiAgICAgIH0pXG4gICAgICBtZXRhQXJyYXkuZm9yRWFjaChmdW5jdGlvbiAoYXBpLCBpKSB7XG4gICAgICAgIGlmIChuYW1lT2JqW2FwaS5uYW1lXSkge1xuICAgICAgICAgIG1ldGFBcnJheVtpXSA9IG5hbWVPYmpbYXBpLm5hbWVdXG4gICAgICAgICAgZGVsZXRlIG5hbWVPYmpbYXBpLm5hbWVdXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICBmb3IgKHZhciBrIGluIG1ldGFPYmopIHtcbiAgICAgICAgaWYgKG1ldGFPYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICBtZXRhQXJyYXkucHVzaChtZXRhT2JqW2tdKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX21ldGFbbW9kdWxlTmFtZV0gPSBtZXRhT2JqW21vZHVsZU5hbWVdXG4gIH0sXG5cbiAgLy8gU2V0IG1ldGEgaW5mbyBmb3IgYSBzaW5nbGUgYXBpLlxuICAvLyBvcHRzOlxuICAvLyAgLSBtb2R1bGVOYW1lOiBhcGkgbW9kdWxlIG5hbWUuXG4gIC8vICAtIG1ldGE6IGEgbWV0YSBvYmplY3QgbGlrZTpcbiAgLy8gIHtcbiAgLy8gICAgbmFtZTogJ2FkZEVsZW1lbnQnLFxuICAvLyAgICBhcmdzOiBbJ3N0cmluZycsICdvYmplY3QnXVxuICAvLyAgfVxuICBzZXRBcGlNZXRhOiBmdW5jdGlvbiAobW9kdWxlTmFtZSwgbWV0YSkge1xuICAgIHZhciBtZXRhQXJyYXkgPSB0aGlzLl9tZXRhW21vZHVsZU5hbWVdXG4gICAgaWYgKCFtZXRhQXJyYXkpIHtcbiAgICAgIHRoaXMuX21ldGFbbW9kdWxlTmFtZV0gPSBbbWV0YV1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG1ldGFJZHggPSAtMVxuICAgICAgbWV0YUFycmF5LmZvckVhY2goZnVuY3Rpb24gKGFwaSwgaSkge1xuICAgICAgICBpZiAobWV0YS5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgbWV0YUlkeCA9IGlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIGlmIChtZXRhSWR4ICE9PSAtMSkge1xuICAgICAgICBtZXRhQXJyYXlbbWV0YUlkeF0gPSBtZXRhXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXRhQXJyYXkucHVzaChtZXRhKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5fcmVnaXN0ZXJNb2R1bGVzKFt7XG4gIG1vZGFsOiBbe1xuICAgIG5hbWU6ICd0b2FzdCcsXG4gICAgYXJnczogWydvYmplY3QnLCAnZnVuY3Rpb24nXVxuICB9LCB7XG4gICAgbmFtZTogJ2FsZXJ0JyxcbiAgICBhcmdzOiBbJ29iamVjdCcsICdmdW5jdGlvbiddXG4gIH0sIHtcbiAgICBuYW1lOiAnY29uZmlybScsXG4gICAgYXJnczogWydvYmplY3QnLCAnZnVuY3Rpb24nXVxuICB9LCB7XG4gICAgbmFtZTogJ3Byb21wdCcsXG4gICAgYXJnczogWydvYmplY3QnLCAnZnVuY3Rpb24nXVxuICB9XVxufSwge1xuICBhbmltYXRpb246IFt7XG4gICAgbmFtZTogJ3RyYW5zaXRpb24nLFxuICAgIGFyZ3M6IFsnc3RyaW5nJywgJ29iamVjdCcsICdmdW5jdGlvbiddXG4gIH1dXG59XSlcblxubW9kdWxlLmV4cG9ydHMgPSBwcm90b2NvbFxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9wcm90b2NvbC5qc1xuICoqIG1vZHVsZSBpZCA9IDE0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJylcbnZhciBGcmFtZVVwZGF0ZXIgPSByZXF1aXJlKCcuL2ZyYW1lVXBkYXRlcicpXG52YXIgQXBwZWFyV2F0Y2hlciA9IHJlcXVpcmUoJy4vYXBwZWFyV2F0Y2hlcicpXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJylcbnZhciBMYXp5TG9hZCA9IHJlcXVpcmUoJy4vbGF6eUxvYWQnKVxudmFyIGFuaW1hdGlvbiA9IHJlcXVpcmUoJy4vYW5pbWF0aW9uJylcblxudmFyIFJFTkRFUklOR19JTkRFTlQgPSA4MDBcblxudmFyIF9pbnN0YW5jZU1hcCA9IHt9XG52YXIgdHlwZU1hcCA9IHt9XG52YXIgc2Nyb2xsYWJsZVR5cGVzID0gW1xuICAnc2Nyb2xsZXInLFxuICAnaHNjcm9sbGVyJyxcbiAgJ3ZzY3JvbGxlcicsXG4gICdsaXN0JyxcbiAgJ2hsaXN0JyxcbiAgJ3ZsaXN0J1xuXVxuXG5mdW5jdGlvbiBDb21wb25lbnRNYW5hZ2VyKGluc3RhbmNlKSB7XG4gIHRoaXMuaW5zdGFuY2VJZCA9IGluc3RhbmNlLmluc3RhbmNlSWRcbiAgdGhpcy53ZWV4SW5zdGFuY2UgPSBpbnN0YW5jZVxuICB0aGlzLmNvbXBvbmVudE1hcCA9IHt9XG4gIF9pbnN0YW5jZU1hcFt0aGlzLmluc3RhbmNlSWRdID0gdGhpc1xufVxuXG5Db21wb25lbnRNYW5hZ2VyLmdldEluc3RhbmNlID0gZnVuY3Rpb24gKGluc3RhbmNlSWQpIHtcbiAgcmV0dXJuIF9pbnN0YW5jZU1hcFtpbnN0YW5jZUlkXVxufVxuXG5Db21wb25lbnRNYW5hZ2VyLmdldFdlZXhJbnN0YW5jZSA9IGZ1bmN0aW9uIChpbnN0YW5jZUlkKSB7XG4gIHJldHVybiBfaW5zdGFuY2VNYXBbaW5zdGFuY2VJZF0ud2VleEluc3RhbmNlXG59XG5cbkNvbXBvbmVudE1hbmFnZXIucmVnaXN0ZXJDb21wb25lbnQgPSBmdW5jdGlvbiAodHlwZSwgZGVmaW5pdGlvbikge1xuICB0eXBlTWFwW3R5cGVdID0gZGVmaW5pdGlvblxufVxuXG5Db21wb25lbnRNYW5hZ2VyLmdldFNjcm9sbGFibGVUeXBlcyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHNjcm9sbGFibGVUeXBlc1xufVxuXG5Db21wb25lbnRNYW5hZ2VyLnByb3RvdHlwZSA9IHtcblxuICAvLyBGaXJlIGEgZXZlbnQgJ3JlbmRlcmJlZ2luJy8ncmVuZGVyZW5kJyBvbiBib2R5IGVsZW1lbnQuXG4gIHJlbmRlcmluZzogZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIF9yZW5kZXJpbmdFbmQoKSB7XG4gICAgICAvLyBnZXQgd2VleCBpbnN0YW5jZSByb290XG4gICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ3JlbmRlcmVuZCcpKVxuICAgICAgdGhpcy5fcmVuZGVyaW5nVGltZXIgPSBudWxsXG4gICAgfVxuICAgIGlmICh0aGlzLl9yZW5kZXJpbmdUaW1lcikge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3JlbmRlcmluZ1RpbWVyKVxuICAgICAgdGhpcy5fcmVuZGVyaW5nVGltZXIgPSBzZXRUaW1lb3V0KFxuICAgICAgICBfcmVuZGVyaW5nRW5kLmJpbmQodGhpcyksXG4gICAgICAgIFJFTkRFUklOR19JTkRFTlRcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdyZW5kZXJiZWdpbicpKVxuICAgICAgdGhpcy5fcmVuZGVyaW5nVGltZXIgPSBzZXRUaW1lb3V0KFxuICAgICAgICBfcmVuZGVyaW5nRW5kLmJpbmQodGhpcyksXG4gICAgICAgIFJFTkRFUklOR19JTkRFTlRcbiAgICAgIClcbiAgICB9XG4gIH0sXG5cbiAgZ2V0RWxlbWVudEJ5UmVmOiBmdW5jdGlvbiAocmVmKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcG9uZW50TWFwW3JlZl1cbiAgfSxcblxuICByZW1vdmVFbGVtZW50QnlSZWY6IGZ1bmN0aW9uIChyZWYpIHtcbiAgICB2YXIgY21wXG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgaWYgKCFyZWYgfHwgIShjbXAgPSB0aGlzLmNvbXBvbmVudE1hcFtyZWZdKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIC8vIHJlbW92ZSBmcm9tIHRoaXMuY29tcG9uZW50TWFwIGN1cnNpdmVseVxuICAgIChmdW5jdGlvbiBfcmVtb3ZlQ3Vyc2l2ZWx5KF9yZWYpIHtcbiAgICAgIHZhciBjaGlsZCA9IHNlbGYuY29tcG9uZW50TWFwW19yZWZdXG4gICAgICB2YXIgbGlzdGVuZXJzID0gY2hpbGQuX2xpc3RlbmVyc1xuICAgICAgdmFyIGNoaWxkcmVuID0gY2hpbGQuZGF0YS5jaGlsZHJlblxuICAgICAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIF9yZW1vdmVDdXJzaXZlbHkoY2hpbGRyZW5baV0ucmVmKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyByZW1vdmUgZXZlbnRzIGZyb20gX3JlZiBjb21wb25lbnRcbiAgICAgIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgICAgZm9yICh2YXIgdHlwZSBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICBjaGlsZC5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW3R5cGVdKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBkZWxldGUgY2hpbGQuX2xpc3RlbmVyc1xuICAgICAgZGVsZXRlIGNoaWxkLm5vZGUuX2xpc3RlbmVyc1xuICAgICAgLy8gcmVtb3ZlIF9yZWYgY29tcG9uZW50XG4gICAgICBkZWxldGUgc2VsZi5jb21wb25lbnRNYXBbX3JlZl1cbiAgICB9KShyZWYpXG5cbiAgfSxcblxuICBjcmVhdGVFbGVtZW50OiBmdW5jdGlvbiAoZGF0YSwgbm9kZVR5cGUpIHtcbiAgICB2YXIgQ29tcG9uZW50VHlwZSA9IHR5cGVNYXBbZGF0YS50eXBlXVxuICAgIGlmICghQ29tcG9uZW50VHlwZSkge1xuICAgICAgQ29tcG9uZW50VHlwZSA9IHR5cGVNYXBbJ2NvbnRhaW5lciddXG4gICAgfVxuXG4gICAgdmFyIHJlZiA9IGRhdGEucmVmXG4gICAgdmFyIGNvbXBvbmVudCA9IG5ldyBDb21wb25lbnRUeXBlKGRhdGEsIG5vZGVUeXBlKVxuXG4gICAgdGhpcy5jb21wb25lbnRNYXBbcmVmXSA9IGNvbXBvbmVudFxuICAgIGNvbXBvbmVudC5ub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1yZWYnLCByZWYpXG5cbiAgICByZXR1cm4gY29tcG9uZW50XG4gIH0sXG5cbiAgLyoqXG4gICAqIGNyZWF0ZUJvZHk6IGdlbmVyYXRlIHJvb3QgY29tcG9uZW50XG4gICAqIEBwYXJhbSAge29iamVjdH0gZWxlbWVudFxuICAgKi9cbiAgY3JlYXRlQm9keTogZnVuY3Rpb24gKGVsZW1lbnQpIHtcblxuICAgIC8vIFRPRE86IGNyZWF0Ym9keSBvbiBkb2N1bWVudC5ib2R5XG4gICAgLy8gbm8gbmVlZCB0byBjcmVhdGUgYSBleHRyYSBkaXZcbiAgICB2YXIgcm9vdCwgYm9keSwgbm9kZVR5cGVcbiAgICBpZiAodGhpcy5jb21wb25lbnRNYXBbJ19yb290J10pIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIG5vZGVUeXBlID0gZWxlbWVudC50eXBlXG4gICAgZWxlbWVudC50eXBlID0gJ3Jvb3QnXG4gICAgZWxlbWVudC5yb290SWQgPSB0aGlzLndlZXhJbnN0YW5jZS5yb290SWRcbiAgICBlbGVtZW50LnJlZiA9ICdfcm9vdCdcblxuICAgIHZhciByb290ID0gdGhpcy5jcmVhdGVFbGVtZW50KGVsZW1lbnQsIG5vZGVUeXBlKVxuICAgIGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIHRoaXMud2VleEluc3RhbmNlLnJvb3RJZClcbiAgICAgICAgICB8fCBkb2N1bWVudC5ib2R5XG4gICAgYm9keS5hcHBlbmRDaGlsZChyb290Lm5vZGUpXG4gICAgcm9vdC5fYXBwZW5kZWQgPSB0cnVlXG4gIH0sXG5cbiAgYXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uIChwYXJlbnRSZWYsIGRhdGEpIHtcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5jb21wb25lbnRNYXBbcGFyZW50UmVmXVxuXG4gICAgaWYgKHRoaXMuY29tcG9uZW50TWFwW2RhdGEucmVmXSB8fCAhcGFyZW50KSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAocGFyZW50UmVmID09PSAnX3Jvb3QnICYmICFwYXJlbnQpIHtcbiAgICAgIHBhcmVudCA9IHRoaXMuY3JlYXRlRWxlbWVudCh7XG4gICAgICAgIHR5cGU6ICdyb290JyxcbiAgICAgICAgcm9vdElkOiB0aGlzLndlZXhJbnN0YW5jZS5yb290SWQsXG4gICAgICAgIHJlZjogJ19yb290J1xuICAgICAgfSlcbiAgICAgIHBhcmVudC5fYXBwZW5kZWQgPSB0cnVlXG4gICAgfVxuXG4gICAgdmFyIGNoaWxkID0gcGFyZW50LmFwcGVuZENoaWxkKGRhdGEpXG5cbiAgICAvLyBJbiBzb21lIHBhcmVudCBjb21wb25lbnQgdGhlIGltcGxlbWVudGF0aW9uIG9mIG1ldGhvZFxuICAgIC8vIGFwcGVuZENoaWxkIGRpZG4ndCByZXR1cm4gdGhlIGNvbXBvbmVudCBhdCBhbGwsIHRoZXJlZm9yXG4gICAgLy8gY2hpbGQgbWF5YmUgYSB1bmRlZmluZWQgb2JqZWN0LlxuICAgIGlmIChjaGlsZCkge1xuICAgICAgY2hpbGQucGFyZW50UmVmID0gcGFyZW50UmVmXG4gICAgfVxuXG4gICAgaWYgKGNoaWxkICYmIHBhcmVudC5fYXBwZW5kZWQpIHtcbiAgICAgIHRoaXMuaGFuZGxlQXBwZW5kKGNoaWxkKVxuICAgIH1cbiAgfSxcblxuICBhcHBlbmRDaGlsZHJlbjogZnVuY3Rpb24gKHJlZiwgZWxlbWVudHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmFwcGVuZENoaWxkKHJlZiwgZWxlbWVudHNbaV0pXG4gICAgfVxuICB9LFxuXG4gIHJlbW92ZUVsZW1lbnQ6IGZ1bmN0aW9uIChyZWYpIHtcbiAgICB2YXIgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRNYXBbcmVmXVxuXG4gICAgLy8gZmlyZSBldmVudCBmb3IgcmVuZGVyaW5nIGRvbSBvbiBib2R5IGVsbWVudC5cbiAgICB0aGlzLnJlbmRlcmluZygpXG5cbiAgICBpZiAoY29tcG9uZW50ICYmIGNvbXBvbmVudC5wYXJlbnRSZWYpIHtcbiAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmNvbXBvbmVudE1hcFtjb21wb25lbnQucGFyZW50UmVmXVxuICAgICAgY29tcG9uZW50Lm9uUmVtb3ZlICYmIGNvbXBvbmVudC5vblJlbW92ZSgpXG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoY29tcG9uZW50KVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oJ3JlZjogJywgcmVmKVxuICAgIH1cbiAgfSxcblxuICBtb3ZlRWxlbWVudDogZnVuY3Rpb24gKHJlZiwgcGFyZW50UmVmLCBpbmRleCkge1xuICAgIHZhciBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudE1hcFtyZWZdXG4gICAgdmFyIG5ld1BhcmVudCA9IHRoaXMuY29tcG9uZW50TWFwW3BhcmVudFJlZl1cbiAgICB2YXIgb2xkUGFyZW50UmVmID0gY29tcG9uZW50LnBhcmVudFJlZlxuICAgIHZhciBjaGlsZHJlbiwgYmVmb3JlLCBpLCBsXG4gICAgaWYgKCFjb21wb25lbnQgfHwgIW5ld1BhcmVudCkge1xuICAgICAgY29uc29sZS53YXJuKCdyZWY6ICcsIHJlZilcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIGZpcmUgZXZlbnQgZm9yIHJlbmRlcmluZy5cbiAgICB0aGlzLnJlbmRlcmluZygpXG5cbiAgICBpZiAoaW5kZXggPCAtMSkge1xuICAgICAgaW5kZXggPSAtMVxuICAgICAgY29uc29sZS53YXJuKCdpbmRleCBjYW5ub3QgYmUgbGVzcyB0aGFuIC0xLicpXG4gICAgfVxuXG4gICAgY2hpbGRyZW4gPSBuZXdQYXJlbnQuZGF0YS5jaGlsZHJlblxuICAgIGlmIChjaGlsZHJlblxuICAgICAgICAmJiBjaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgJiYgaW5kZXggIT09IC0xXG4gICAgICAgICYmIGluZGV4IDwgY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICBiZWZvcmUgPSB0aGlzLmNvbXBvbmVudE1hcFtuZXdQYXJlbnQuZGF0YS5jaGlsZHJlbltpbmRleF0ucmVmXVxuICAgIH1cblxuICAgIC8vIHJlbW92ZSBmcm9tIG9sZFBhcmVudC5kYXRhLmNoaWxkcmVuXG4gICAgaWYgKG9sZFBhcmVudFJlZiAmJiB0aGlzLmNvbXBvbmVudE1hcFtvbGRQYXJlbnRSZWZdKSB7XG4gICAgICBjaGlsZHJlbiA9IHRoaXMuY29tcG9uZW50TWFwW29sZFBhcmVudFJlZl0uZGF0YS5jaGlsZHJlblxuICAgICAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICBmb3IgKGkgPSAwLCBsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgaWYgKGNoaWxkcmVuW2ldLnJlZiA9PT0gcmVmKSB7XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobCA+IGkpIHtcbiAgICAgICAgICBjaGlsZHJlbi5zcGxpY2UoaSwgMSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIG5ld1BhcmVudC5pbnNlcnRCZWZvcmUoY29tcG9uZW50LCBiZWZvcmUpXG5cbiAgICBjb21wb25lbnQub25Nb3ZlICYmIGNvbXBvbmVudC5vbk1vdmUocGFyZW50UmVmLCBpbmRleClcblxuICB9LFxuXG4gIGluc2VydEJlZm9yZTogZnVuY3Rpb24gKHJlZiwgZGF0YSkge1xuICAgIHZhciBjaGlsZCwgYmVmb3JlLCBwYXJlbnRcbiAgICBiZWZvcmUgPSB0aGlzLmNvbXBvbmVudE1hcFtyZWZdXG4gICAgY2hpbGQgPSB0aGlzLmNvbXBvbmVudE1hcFtkYXRhLnJlZl1cbiAgICBiZWZvcmUgJiYgKHBhcmVudCA9IHRoaXMuY29tcG9uZW50TWFwW2JlZm9yZS5wYXJlbnRSZWZdKVxuICAgIGlmIChjaGlsZCB8fCAhcGFyZW50IHx8ICFiZWZvcmUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNoaWxkID0gdGhpcy5jcmVhdGVFbGVtZW50KGRhdGEpXG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICBjaGlsZC5wYXJlbnRSZWYgPSBiZWZvcmUucGFyZW50UmVmXG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBiZWZvcmUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmICh0aGlzLmNvbXBvbmVudE1hcFtiZWZvcmUucGFyZW50UmVmXS5fYXBwZW5kZWQpIHtcbiAgICAgIHRoaXMuaGFuZGxlQXBwZW5kKGNoaWxkKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogYWRkRWxlbWVudFxuICAgKiBJZiBpbmRleCBpcyBsYXJnZXQgdGhhbiBhbnkgY2hpbGQncyBpbmRleCwgdGhlXG4gICAqIGVsZW1lbnQgd2lsbCBiZSBhcHBlbmRlZCBiZWhpbmQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJlbnRSZWZcbiAgICogQHBhcmFtIHtvYmp9IGVsZW1lbnQgKGRhdGEgb2YgdGhlIGNvbXBvbmVudClcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gICAqL1xuICBhZGRFbGVtZW50OiBmdW5jdGlvbiAocGFyZW50UmVmLCBlbGVtZW50LCBpbmRleCkge1xuICAgIHZhciBwYXJlbnQsIGNoaWxkcmVuLCBiZWZvcmVcblxuICAgIC8vIGZpcmUgZXZlbnQgZm9yIHJlbmRlcmluZyBkb20gb24gYm9keSBlbG1lbnQuXG4gICAgdGhpcy5yZW5kZXJpbmcoKVxuXG4gICAgcGFyZW50ID0gdGhpcy5jb21wb25lbnRNYXBbcGFyZW50UmVmXVxuICAgIGlmICghcGFyZW50KSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY2hpbGRyZW4gPSBwYXJlbnQuZGF0YS5jaGlsZHJlblxuICAgIC8vIC0xIG1lYW5zIGFwcGVuZCBhcyB0aGUgbGFzdC5cbiAgICBpZiAoaW5kZXggPCAtMSkge1xuICAgICAgaW5kZXggPSAtMVxuICAgICAgY29uc29sZS53YXJuKCdpbmRleCBjYW5ub3QgYmUgbGVzcyB0aGFuIC0xLicpXG4gICAgfVxuICAgIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgJiYgY2hpbGRyZW4ubGVuZ3RoID4gaW5kZXhcbiAgICAgICAgJiYgaW5kZXggIT09IC0xKSB7XG4gICAgICB0aGlzLmluc2VydEJlZm9yZShjaGlsZHJlbltpbmRleF0ucmVmLCBlbGVtZW50KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFwcGVuZENoaWxkKHBhcmVudFJlZiwgZWxlbWVudClcbiAgICB9XG4gIH0sXG5cbiAgY2xlYXJDaGlsZHJlbjogZnVuY3Rpb24gKHJlZikge1xuICAgIHZhciBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudE1hcFtyZWZdXG4gICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgY29tcG9uZW50Lm5vZGUuaW5uZXJIVE1MID0gJydcbiAgICAgIGlmIChjb21wb25lbnQuZGF0YSkge1xuICAgICAgICBjb21wb25lbnQuZGF0YS5jaGlsZHJlbiA9IG51bGxcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgYWRkRXZlbnQ6IGZ1bmN0aW9uIChyZWYsIHR5cGUpIHtcbiAgICB2YXIgY29tcG9uZW50XG4gICAgaWYgKHR5cGVvZiByZWYgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiByZWYgPT09ICdudW1iZXInKSB7XG4gICAgICBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudE1hcFtyZWZdXG4gICAgfSBlbHNlIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocmVmKS5zbGljZSg4LCAtMSkgPT09ICdPYmplY3QnKSB7XG4gICAgICBjb21wb25lbnQgPSByZWZcbiAgICAgIHJlZiA9IGNvbXBvbmVudC5kYXRhLnJlZlxuICAgIH1cbiAgICBpZiAoY29tcG9uZW50ICYmIGNvbXBvbmVudC5ub2RlKSB7XG4gICAgICB2YXIgc2VuZGVyID0gdGhpcy53ZWV4SW5zdGFuY2Uuc2VuZGVyXG4gICAgICB2YXIgbGlzdGVuZXIgPSBzZW5kZXIuZmlyZUV2ZW50LmJpbmQoc2VuZGVyLCByZWYsIHR5cGUpXG4gICAgICB2YXIgbGlzdGVuZXJzID0gY29tcG9uZW50Ll9saXN0ZW5lcnNcbiAgICAgIGNvbXBvbmVudC5ub2RlLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIGZhbHNlLCBmYWxzZSlcbiAgICAgIGlmICghbGlzdGVuZXJzKSB7XG4gICAgICAgIGxpc3RlbmVycyA9IGNvbXBvbmVudC5fbGlzdGVuZXJzID0ge31cbiAgICAgICAgY29tcG9uZW50Lm5vZGUuX2xpc3RlbmVycyA9IHt9XG4gICAgICB9XG4gICAgICBsaXN0ZW5lcnNbdHlwZV0gPSBsaXN0ZW5lclxuICAgICAgY29tcG9uZW50Lm5vZGUuX2xpc3RlbmVyc1t0eXBlXSA9IGxpc3RlbmVyXG4gICAgfVxuICB9LFxuXG4gIHJlbW92ZUV2ZW50OiBmdW5jdGlvbiAocmVmLCB0eXBlKSB7XG4gICAgdmFyIGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50TWFwW3JlZl1cbiAgICB2YXIgbGlzdGVuZXIgPSBjb21wb25lbnQuX2xpc3RlbmVyc1t0eXBlXVxuICAgIGlmIChjb21wb25lbnQgJiYgbGlzdGVuZXIpIHtcbiAgICAgIGNvbXBvbmVudC5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpXG4gICAgICBjb21wb25lbnQuX2xpc3RlbmVyc1t0eXBlXSA9IG51bGxcbiAgICAgIGNvbXBvbmVudC5ub2RlLl9saXN0ZW5lcnNbdHlwZV0gPSBudWxsXG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZUF0dHJzOiBmdW5jdGlvbiAocmVmLCBhdHRyKSB7XG4gICAgdmFyIGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50TWFwW3JlZl1cbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICBjb21wb25lbnQudXBkYXRlQXR0cnMoYXR0cilcbiAgICAgIGlmIChjb21wb25lbnQuZGF0YS50eXBlID09PSAnaW1hZ2UnICYmIGF0dHIuc3JjKSB7XG4gICAgICAgIExhenlMb2FkLnN0YXJ0SWZOZWVkZWQoY29tcG9uZW50KVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICB1cGRhdGVTdHlsZTogZnVuY3Rpb24gKHJlZiwgc3R5bGUpIHtcbiAgICB2YXIgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRNYXBbcmVmXVxuICAgIGlmIChjb21wb25lbnQpIHtcbiAgICAgIGNvbXBvbmVudC51cGRhdGVTdHlsZShzdHlsZSlcbiAgICB9XG4gIH0sXG5cbiAgdXBkYXRlRnVsbEF0dHJzOiBmdW5jdGlvbiAocmVmLCBhdHRyKSB7XG4gICAgdmFyIGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50TWFwW3JlZl1cbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICBjb21wb25lbnQuY2xlYXJBdHRyKClcbiAgICAgIGNvbXBvbmVudC51cGRhdGVBdHRycyhhdHRyKVxuICAgICAgaWYgKGNvbXBvbmVudC5kYXRhLnR5cGUgPT09ICdpbWFnZScgJiYgYXR0ci5zcmMpIHtcbiAgICAgICAgTGF6eUxvYWQuc3RhcnRJZk5lZWRlZChjb21wb25lbnQpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZUZ1bGxTdHlsZTogZnVuY3Rpb24gKHJlZiwgc3R5bGUpIHtcbiAgICB2YXIgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRNYXBbcmVmXVxuICAgIGlmIChjb21wb25lbnQpIHtcbiAgICAgIGNvbXBvbmVudC5jbGVhclN0eWxlKClcbiAgICAgIGNvbXBvbmVudC51cGRhdGVTdHlsZShzdHlsZSlcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlQXBwZW5kOiBmdW5jdGlvbiAoY29tcG9uZW50KSB7XG4gICAgY29tcG9uZW50Ll9hcHBlbmRlZCA9IHRydWVcbiAgICBjb21wb25lbnQub25BcHBlbmQgJiYgY29tcG9uZW50Lm9uQXBwZW5kKClcblxuICAgIC8vIGludm9rZSBvbkFwcGVuZCBvbiBjaGlsZHJlbiByZWN1cnNpdmVseVxuICAgIHZhciBjaGlsZHJlbiA9IGNvbXBvbmVudC5kYXRhLmNoaWxkcmVuXG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IHRoaXMuY29tcG9uZW50TWFwW2NoaWxkcmVuW2ldLnJlZl1cbiAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgdGhpcy5oYW5kbGVBcHBlbmQoY2hpbGQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB3YXRjaCBhcHBlYXIvZGlzYXBwZWFyIG9mIHRoZSBjb21wb25lbnQgaWYgbmVlZGVkXG4gICAgQXBwZWFyV2F0Y2hlci53YXRjaElmTmVlZGVkKGNvbXBvbmVudClcblxuICAgIC8vIGRvIGxhenlsb2FkIGlmIG5lZWRlZFxuICAgIExhenlMb2FkLnN0YXJ0SWZOZWVkZWQoY29tcG9uZW50KVxuICB9LFxuXG4gIHRyYW5zaXRpb246IGZ1bmN0aW9uIChyZWYsIGNvbmZpZywgY2FsbGJhY2spIHtcbiAgICB2YXIgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRNYXBbcmVmXVxuICAgIGFuaW1hdGlvbi50cmFuc2l0aW9uT25jZShjb21wb25lbnQsIGNvbmZpZywgY2FsbGJhY2spXG4gIH0sXG5cbiAgcmVuZGVyRmluaXNoOiBmdW5jdGlvbiAoKSB7XG4gICAgRnJhbWVVcGRhdGVyLnBhdXNlKClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudE1hbmFnZXJcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvY29tcG9uZW50TWFuYWdlci5qc1xuICoqIG1vZHVsZSBpZCA9IDE1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIHJhZiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgZnVuY3Rpb24gKGNhbGxsYmFjaykge1xuICAgICAgICAgICAgc2V0VGltZW91dChjYWxsbGJhY2ssIDE2KVxuICAgICAgICAgIH1cblxudmFyIHJhZklkXG52YXIgb2JzZXJ2ZXJzID0gW11cbnZhciBwYXVzZWQgPSBmYWxzZVxuXG52YXIgRnJhbWVVcGRhdGVyID0ge1xuICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgIGlmIChyYWZJZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgcmFmSWQgPSByYWYoZnVuY3Rpb24gcnVuTG9vcCgpIHtcbiAgICAgIGlmICghcGF1c2VkKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JzZXJ2ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgb2JzZXJ2ZXJzW2ldKClcbiAgICAgICAgfVxuICAgICAgICByYWYocnVuTG9vcClcbiAgICAgIH1cbiAgICB9KVxuICB9LFxuXG4gIGlzQWN0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICFwYXVzZWRcbiAgfSxcblxuICBwYXVzZTogZnVuY3Rpb24gKCkge1xuICAgIHBhdXNlZCA9IHRydWVcbiAgICByYWZJZCA9IHVuZGVmaW5lZFxuICB9LFxuXG4gIHJlc3VtZTogZnVuY3Rpb24gKCkge1xuICAgIHBhdXNlZCA9IGZhbHNlXG4gICAgdGhpcy5zdGFydCgpXG4gIH0sXG5cbiAgYWRkVXBkYXRlT2JzZXJ2ZXI6IGZ1bmN0aW9uIChvYnNlcnZlTWV0aG9kKSB7XG4gICAgb2JzZXJ2ZXJzLnB1c2gob2JzZXJ2ZU1ldGhvZClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lVXBkYXRlclxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9mcmFtZVVwZGF0ZXIuanNcbiAqKiBtb2R1bGUgaWQgPSAxNlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKVxuXG52YXIgY29tcG9uZW50c0luU2Nyb2xsZXIgPSBbXVxudmFyIGNvbXBvbmVudHNPdXRPZlNjcm9sbGVyID0gW11cbnZhciBsaXN0ZW5lZCA9IGZhbHNlXG52YXIgZGlyZWN0aW9uID0gJ3VwJ1xudmFyIHNjcm9sbFkgPSAwXG5cbnZhciBBcHBlYXJXYXRjaGVyID0ge1xuICB3YXRjaElmTmVlZGVkOiBmdW5jdGlvbiAoY29tcG9uZW50KSB7XG4gICAgaWYgKG5lZWRXYXRjaChjb21wb25lbnQpKSB7XG4gICAgICBpZiAoY29tcG9uZW50LmlzSW5TY3JvbGxhYmxlKCkpIHtcbiAgICAgICAgY29tcG9uZW50c0luU2Nyb2xsZXIucHVzaChjb21wb25lbnQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wb25lbnRzT3V0T2ZTY3JvbGxlci5wdXNoKGNvbXBvbmVudClcbiAgICAgIH1cbiAgICAgIGlmICghbGlzdGVuZWQpIHtcbiAgICAgICAgbGlzdGVuZWQgPSB0cnVlXG4gICAgICAgIC8vIHZhciBoYW5kbGVyID0gdGhyb3R0bGUob25TY3JvbGwsIDI1KVxuICAgICAgICB2YXIgaGFuZGxlciA9IHRocm90dGxlKG9uU2Nyb2xsLCAxMDApXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBoYW5kbGVyLCBmYWxzZSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gbmVlZFdhdGNoKGNvbXBvbmVudCkge1xuICB2YXIgZXZlbnRzID0gY29tcG9uZW50LmRhdGEuZXZlbnRcbiAgaWYgKGV2ZW50c1xuICAgICAgJiYgKGV2ZW50cy5pbmRleE9mKCdhcHBlYXInKSAhPSAtMVxuICAgICAgICB8fCBldmVudHMuaW5kZXhPZignZGlzYXBwZWFyJykgIT0gLTEpKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gb25TY3JvbGwoZSkge1xuICAvLyBJZiB0aGUgc2Nyb2xsIGV2ZW50IGlzIGRpc3BhdGNoZWQgZnJvbSBhIHNjcm9sbGFibGUgY29tcG9uZW50XG4gIC8vIGltcGxlbWVudGVkIHRocm91Z2ggc2Nyb2xsZXJqcywgdGhlbiB0aGUgYXBwZWFyL2Rpc2FwcGVhciBldmVudHNcbiAgLy8gc2hvdWxkIGJlIHRyZWF0ZWQgc3BlY2lhbGx5IGJ5IGhhbmRsZVNjcm9sbGVyU2Nyb2xsLlxuICBpZiAoZS5vcmlnaW5hbFR5cGUgPT09ICdzY3JvbGxpbmcnKSB7XG4gICAgaGFuZGxlU2Nyb2xsZXJTY3JvbGwoZSlcbiAgfSBlbHNlIHtcbiAgICBoYW5kbGVXaW5kb3dTY3JvbGwoKVxuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVNjcm9sbGVyU2Nyb2xsKGUpIHtcbiAgdmFyIGNtcHMgPSBjb21wb25lbnRzSW5TY3JvbGxlclxuICB2YXIgbGVuID0gY21wcy5sZW5ndGhcbiAgZGlyZWN0aW9uID0gZS5kaXJlY3Rpb25cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIHZhciBjb21wb25lbnQgPSBjbXBzW2ldXG4gICAgdmFyIGFwcGVhciA9IGlzQ29tcG9uZW50SW5TY3JvbGxlckFwcGVhcihjb21wb25lbnQpXG4gICAgaWYgKGFwcGVhciAmJiAhY29tcG9uZW50Ll9hcHBlYXIpIHtcbiAgICAgIGNvbXBvbmVudC5fYXBwZWFyID0gdHJ1ZVxuICAgICAgZmlyZUV2ZW50KGNvbXBvbmVudCwgJ2FwcGVhcicpXG4gICAgfSBlbHNlIGlmICghYXBwZWFyICYmIGNvbXBvbmVudC5fYXBwZWFyKSB7XG4gICAgICBjb21wb25lbnQuX2FwcGVhciA9IGZhbHNlXG4gICAgICBmaXJlRXZlbnQoY29tcG9uZW50LCAnZGlzYXBwZWFyJylcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlV2luZG93U2Nyb2xsKCkge1xuICB2YXIgeSA9IHdpbmRvdy5zY3JvbGxZXG4gIGRpcmVjdGlvbiA9IHkgPj0gc2Nyb2xsWSA/ICd1cCcgOiAnZG93bidcbiAgc2Nyb2xsWSA9IHlcblxuICB2YXIgbGVuID0gY29tcG9uZW50c091dE9mU2Nyb2xsZXIubGVuZ3RoXG4gIGlmIChsZW4gPT09IDApIHtcbiAgICByZXR1cm5cbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgdmFyIGNvbXBvbmVudCA9IGNvbXBvbmVudHNPdXRPZlNjcm9sbGVyW2ldXG4gICAgdmFyIGFwcGVhciA9IGlzQ29tcG9uZW50SW5XaW5kb3coY29tcG9uZW50KVxuICAgIGlmIChhcHBlYXIgJiYgIWNvbXBvbmVudC5fYXBwZWFyKSB7XG4gICAgICBjb21wb25lbnQuX2FwcGVhciA9IHRydWVcbiAgICAgIGZpcmVFdmVudChjb21wb25lbnQsICdhcHBlYXInKVxuICAgIH0gZWxzZSBpZiAoIWFwcGVhciAmJiBjb21wb25lbnQuX2FwcGVhcikge1xuICAgICAgY29tcG9uZW50Ll9hcHBlYXIgPSBmYWxzZVxuICAgICAgZmlyZUV2ZW50KGNvbXBvbmVudCwgJ2Rpc2FwcGVhcicpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzQ29tcG9uZW50SW5TY3JvbGxlckFwcGVhcihjb21wb25lbnQpIHtcbiAgdmFyIHBhcmVudFNjcm9sbGVyID0gY29tcG9uZW50Ll9wYXJlbnRTY3JvbGxlclxuICB2YXIgY21wUmVjdCA9IGNvbXBvbmVudC5ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gIGlmICghaXNDb21wb25lbnRJbldpbmRvdyhjb21wb25lbnQpKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgd2hpbGUgKHBhcmVudFNjcm9sbGVyKSB7XG4gICAgdmFyIHBhcmVudFJlY3QgPSBwYXJlbnRTY3JvbGxlci5ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgaWYgKCEoY21wUmVjdC5yaWdodCA+IHBhcmVudFJlY3QubGVmdFxuICAgICAgICAmJiBjbXBSZWN0LmxlZnQgPCBwYXJlbnRSZWN0LnJpZ2h0XG4gICAgICAgICYmIGNtcFJlY3QuYm90dG9tID4gcGFyZW50UmVjdC50b3BcbiAgICAgICAgJiYgY21wUmVjdC50b3AgPCBwYXJlbnRSZWN0LmJvdHRvbSkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBwYXJlbnRTY3JvbGxlciA9IHBhcmVudFNjcm9sbGVyLl9wYXJlbnRTY3JvbGxlclxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIGlzQ29tcG9uZW50SW5XaW5kb3coY29tcG9uZW50KSB7XG4gIHZhciByZWN0ID0gY29tcG9uZW50Lm5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgcmV0dXJuIHJlY3QucmlnaHQgPiAwICYmIHJlY3QubGVmdCA8IHdpbmRvdy5pbm5lcldpZHRoICYmXG4gICAgICAgICByZWN0LmJvdHRvbSA+IDAgJiYgcmVjdC50b3AgPCB3aW5kb3cuaW5uZXJIZWlnaHRcbn1cblxuZnVuY3Rpb24gZmlyZUV2ZW50KGNvbXBvbmVudCwgdHlwZSkge1xuICB2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKVxuICB2YXIgZGF0YSA9IHsgZGlyZWN0aW9uOiBkaXJlY3Rpb24gfVxuICBldnQuaW5pdEV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSlcbiAgZXZ0LmRhdGEgPSBkYXRhXG4gIHV0aWxzLmV4dGVuZChldnQsIGRhdGEpXG4gIGNvbXBvbmVudC5ub2RlLmRpc3BhdGNoRXZlbnQoZXZ0KVxufVxuXG5mdW5jdGlvbiB0aHJvdHRsZShmdW5jLCB3YWl0KSB7XG4gIHZhciBjb250ZXh0LCBhcmdzLCByZXN1bHRcbiAgdmFyIHRpbWVvdXQgPSBudWxsXG4gIHZhciBwcmV2aW91cyA9IDBcbiAgdmFyIGxhdGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHByZXZpb3VzID0gRGF0ZS5ub3coKVxuICAgIHRpbWVvdXQgPSBudWxsXG4gICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKVxuICB9XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5vdyA9IERhdGUubm93KClcbiAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cylcbiAgICBjb250ZXh0ID0gdGhpc1xuICAgIGFyZ3MgPSBhcmd1bWVudHNcbiAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KVxuICAgICAgdGltZW91dCA9IG51bGxcbiAgICAgIHByZXZpb3VzID0gbm93XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpXG4gICAgfSBlbHNlIGlmICghdGltZW91dCkge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZylcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwZWFyV2F0Y2hlclxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvYXBwZWFyV2F0Y2hlci5qc1xuICoqIG1vZHVsZSBpZCA9IDE3XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxucmVxdWlyZSgnbGF6eWltZycpXG5cbnZhciBsYXp5bG9hZFRpbWVyXG5cbnZhciBMYXp5TG9hZCA9IHtcbiAgbWFrZUltYWdlTGF6eTogZnVuY3Rpb24gKGltYWdlLCBzcmMpIHtcbiAgICBpbWFnZS5yZW1vdmVBdHRyaWJ1dGUoJ2ltZy1zcmMnKVxuICAgIGltYWdlLnJlbW92ZUF0dHJpYnV0ZSgnaS1sYXp5LXNyYycpXG4gICAgaW1hZ2UucmVtb3ZlQXR0cmlidXRlKCdzcmMnKVxuICAgIGltYWdlLnNldEF0dHJpYnV0ZSgnaW1nLXNyYycsIHNyYylcbiAgICAvLyBzaG91bGQgcmVwbGFjZSAnc3JjJyB3aXRoICdpbWctc3JjJy4gYnV0IGZvciBub3cgbGliLmltZy5maXJlIGlzXG4gICAgLy8gbm90IHdvcmtpbmcgZm9yIHRoZSBzaXR1YXRpb24gdGhhdCB0aGUgYXBwZWFyIGV2ZW50IGhhcyBiZWVuXG4gICAgLy8gYWxyZWFkeSB0cmlnZ2VyZWQuXG4gICAgLy8gaW1hZ2Uuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpXG4gICAgLy8gaW1hZ2Uuc2V0QXR0cmlidXRlKCdpbWctc3JjJywgc3JjKVxuICAgIHRoaXMuZmlyZSgpXG4gIH0sXG5cbiAgLy8gd2UgZG9uJ3Qga25vdyB3aGVuIGFsbCBpbWFnZSBhcmUgYXBwZW5kZWRcbiAgLy8ganVzdCB1c2Ugc2V0VGltZW91dCB0byBkbyBkZWxheSBsYXp5bG9hZFxuICAvL1xuICAvLyAtLSBhY3R1YWxseSBldmVyeXRpbWUgd2UgYWRkIGEgZWxlbWVudCBvciB1cGRhdGUgc3R5bGVzLFxuICAvLyB0aGUgY29tcG9uZW50IG1hbmFnZXIgd2lsbCBjYWxsIHN0YXJ0SWZOZWVkIHRvIGZpcmVcbiAgLy8gbGF6eWxvYWQgb25jZSBhZ2FpbiBpbiB0aGUgaGFuZGxlQXBwZW5kIGZ1bmN0aW9uLiBzbyB0aGVyZVxuICAvLyBpcyBubyB3YXkgdGhhdCBhbnkgaW1hZ2UgZWxlbWVudCBjYW4gbWlzcyBpdC4gU2VlIHNvdXJjZVxuICAvLyBjb2RlIGluIGNvbXBvbmVudE1hbmdhZ2VyLmpzLlxuICBzdGFydElmTmVlZGVkOiBmdW5jdGlvbiAoY29tcG9uZW50KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgaWYgKGNvbXBvbmVudC5kYXRhLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgIGlmICghbGF6eWxvYWRUaW1lcikge1xuICAgICAgICBsYXp5bG9hZFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdGhhdC5maXJlKClcbiAgICAgICAgICBjbGVhclRpbWVvdXQobGF6eWxvYWRUaW1lcilcbiAgICAgICAgICBsYXp5bG9hZFRpbWVyID0gbnVsbFxuICAgICAgICB9LCAxNilcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgbG9hZElmTmVlZGVkOiBmdW5jdGlvbiAoZWxlbWVudFNjb3BlKSB7XG4gICAgdmFyIG5vdFByZVByb2Nlc3NlZCA9IGVsZW1lbnRTY29wZS5xdWVyeVNlbGVjdG9yQWxsKCdbaW1nLXNyY10nKVxuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIC8vIGltYWdlIGVsZW1lbnRzIHdoaWNoIGhhdmUgYXR0cmlidXRlICdpLWxhenktc3JjJyB3ZXJlIGVsZW1lbnRzXG4gICAgLy8gdGhhdCBoYWQgYmVlbiBwcmVwcm9jZXNzZWQgYnkgbGliLWltZy1jb3JlLCBidXQgbm90IGxvYWRlZCB5ZXQsIGFuZFxuICAgIC8vIG11c3QgYmUgbG9hZGVkIHdoZW4gJ2FwcGVhcicgZXZlbnRzIHdlcmUgZmlyZWQuIEl0IHR1cm5zIG91dCB0aGVcbiAgICAvLyAnYXBwZWFyJyBldmVudCB3YXMgbm90IGZpcmVkIGNvcnJlY3RseSBpbiB0aGUgY3NzLXRyYW5zbGF0ZS10cmFuc2l0aW9uXG4gICAgLy8gc2l0dWF0aW9uLCBzbyAnaS1sYXp5LXNyYycgbXVzdCBiZSBjaGVja2VkIGFuZCBsYXp5bG9hZCBtdXN0IGJlXG4gICAgLy8gZmlyZWQgbWFudWFsbHkuXG4gICAgdmFyIHByZVByb2Nlc3NlZCA9IGVsZW1lbnRTY29wZS5xdWVyeVNlbGVjdG9yQWxsKCdbaS1sYXp5LXNyY10nKVxuICAgIGlmIChub3RQcmVQcm9jZXNzZWQubGVuZ3RoID4gMCB8fCBwcmVQcm9jZXNzZWQubGVuZ3RoID4gMCkge1xuICAgICAgdGhhdC5maXJlKClcbiAgICB9XG4gIH0sXG5cbiAgLy8gZmlyZSBsYXp5bG9hZC5cbiAgZmlyZTogZnVuY3Rpb24gKCkge1xuICAgIGxpYi5pbWcuZmlyZSgpXG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExhenlMb2FkXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2xhenlMb2FkLmpzXG4gKiogbW9kdWxlIGlkID0gMThcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIlwidW5kZWZpbmVkXCI9PXR5cGVvZiB3aW5kb3cmJih3aW5kb3c9e2N0cmw6e30sbGliOnt9fSksIXdpbmRvdy5jdHJsJiYod2luZG93LmN0cmw9e30pLCF3aW5kb3cubGliJiYod2luZG93LmxpYj17fSksZnVuY3Rpb24odCxpKXtmdW5jdGlvbiBlKHQsaSl7aSYmKFwiSU1HXCI9PXQubm9kZU5hbWUudG9VcHBlckNhc2UoKT90LnNldEF0dHJpYnV0ZShcInNyY1wiLGkpOnQuc3R5bGUuYmFja2dyb3VuZEltYWdlPSd1cmwoXCInK2krJ1wiKScpfWZ1bmN0aW9uIGEoKXtyPWkuYXBwZWFyLmluaXQoe2NsczpcImltZ3RtcFwiLG9uY2U6ITAseDpvLmxhenlXaWR0aCx5Om8ubGF6eUhlaWdodCxvbkFwcGVhcjpmdW5jdGlvbih0KXt2YXIgaT10aGlzO2UoaSxpLmdldEF0dHJpYnV0ZShcImktbGF6eS1zcmNcIikpLGkucmVtb3ZlQXR0cmlidXRlKFwiaS1sYXp5LXNyY1wiKX19KX1yZXF1aXJlKFwiYXBwZWFyanNcIik7dmFyIHIsQT17fSxvPXtkYXRhU3JjOlwiaW1nLXNyY1wiLGxhenlIZWlnaHQ6MCxsYXp5V2lkdGg6MH07QS5sb2dDb25maWc9ZnVuY3Rpb24oKXtjb25zb2xlLmxvZyhcImxpYi1pbWcgQ29uZmlnXFxuXCIsbyl9LEEuZmlyZT1mdW5jdGlvbigpe3J8fGEoKTt2YXIgdD1cImlfXCIrRGF0ZS5ub3coKSUxZTUsaT1kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiW1wiK28uZGF0YVNyYytcIl1cIik7W10uZm9yRWFjaC5jYWxsKGksZnVuY3Rpb24oaSl7XCJmYWxzZVwiPT1pLmRhdGFzZXQubGF6eSYmXCJ0cnVlXCIhPWkuZGF0YXNldC5sYXp5P2UoaSxwcm9jZXNzU3JjKGksaS5nZXRBdHRyaWJ1dGUoby5kYXRhU3JjKSkpOihpLmNsYXNzTGlzdC5hZGQodCksaS5zZXRBdHRyaWJ1dGUoXCJpLWxhenktc3JjXCIsaS5nZXRBdHRyaWJ1dGUoby5kYXRhU3JjKSkpLGkucmVtb3ZlQXR0cmlidXRlKG8uZGF0YVNyYyl9KSxyLmJpbmQoXCIuXCIrdCksci5maXJlKCl9LEEuZGVmYXVsdFNyYz1cImRhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFEVWxFUVZRSW1XTmdZR0JnQUFBQUJRQUJoNkZPMUFBQUFBQkpSVTVFcmtKZ2dnPT1cIixpLmltZz1BLG1vZHVsZS5leHBvcnRzPUF9KHdpbmRvdyx3aW5kb3cubGlifHwod2luZG93LmxpYj17fSkpO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2xhenlpbWcvYnVpbGQvaW1nLmNvbW1vbi5qc1xuICoqIG1vZHVsZSBpZCA9IDE5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcInVuZGVmaW5lZFwiPT10eXBlb2Ygd2luZG93JiYod2luZG93PXtjdHJsOnt9LGxpYjp7fX0pLCF3aW5kb3cuY3RybCYmKHdpbmRvdy5jdHJsPXt9KSwhd2luZG93LmxpYiYmKHdpbmRvdy5saWI9e30pLGZ1bmN0aW9uKG4sZSl7ZnVuY3Rpb24gaSgpe2Q9dy5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIiksdj13LmNyZWF0ZUV2ZW50KFwiSFRNTEV2ZW50c1wiKSxkLmluaXRFdmVudChcIl9hcHBlYXJcIiwhMSwhMCksdi5pbml0RXZlbnQoXCJfZGlzYXBwZWFyXCIsITEsITApfWZ1bmN0aW9uIGEodCxuKXt2YXIgZSxpLGEscz0oRGF0ZS5ub3coKSwwKSxvPW51bGwscj1mdW5jdGlvbigpe3M9RGF0ZS5ub3coKSxvPW51bGwsdC5hcHBseShlLGkpfTtyZXR1cm4gZnVuY3Rpb24oKXt2YXIgbD1EYXRlLm5vdygpO2U9dGhpcyxpPWFyZ3VtZW50czt2YXIgYz1uLShsLXMpO3JldHVybiAwPj1jfHxjPj1uPyhjbGVhclRpbWVvdXQobyksbz1udWxsLGE9dC5hcHBseShlLGkpKTpudWxsPT1vJiYobz1zZXRUaW1lb3V0KHIsYykpLGF9fWZ1bmN0aW9uIHMobixlKXt2YXIgbixpLGEscztpZihuKXJldHVybiBlfHwoZT17eDowLHk6MH0pLG4hPXdpbmRvdz8obj1uLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLGk9bi5sZWZ0LHQ9bi50b3AsYT1uLnJpZ2h0LHM9bi5ib3R0b20pOihpPTAsdD0wLGE9aStuLmlubmVyV2lkdGgscz10K24uaW5uZXJIZWlnaHQpLHtsZWZ0OmksdG9wOnQscmlnaHQ6YStlLngsYm90dG9tOnMrZS55fX1mdW5jdGlvbiBvKHQsbil7dmFyIGU9bi5yaWdodD50LmxlZnQmJm4ubGVmdDx0LnJpZ2h0LGk9bi5ib3R0b20+dC50b3AmJm4udG9wPHQuYm90dG9tO3JldHVybiBlJiZpfWZ1bmN0aW9uIHIodCxuKXt2YXIgZT1cIm5vbmVcIixpPXQubGVmdC1uLmxlZnQsYT10LnRvcC1uLnRvcDtyZXR1cm4gMD09YSYmKGU9MCE9aT9pPjA/XCJsZWZ0XCI6XCJyaWdodFwiOlwibm9uZVwiKSwwPT1pJiYoZT0wIT1hP2E+MD9cInVwXCI6XCJkb3duXCI6XCJub25lXCIpLGV9ZnVuY3Rpb24gbCh0LG4pe2Zvcih2YXIgZSBpbiBuKW4uaGFzT3duUHJvcGVydHkoZSkmJih0W2VdPW5bZV0pO3JldHVybiB0fWZ1bmN0aW9uIGMoKXt2YXIgdD10aGlzLG49YShmdW5jdGlvbigpe2YuYXBwbHkodCxhcmd1bWVudHMpfSx0aGlzLm9wdGlvbnMud2FpdCk7dGhpcy5fX2hhbmRsZSYmKHRoaXMuY29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIix0aGlzLl9faGFuZGxlKSx0aGlzLl9faGFuZGxlPW51bGwpLHRoaXMuX19oYW5kbGU9bix0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsbiwhMSksdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLGZ1bmN0aW9uKG4pe2YuYXBwbHkodCxhcmd1bWVudHMpfSwhMSksdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcImFuaW1hdGlvbkVuZFwiLGZ1bmN0aW9uKCl7Zi5hcHBseSh0LGFyZ3VtZW50cyl9LCExKSx0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwid2Via2l0QW5pbWF0aW9uRW5kXCIsZnVuY3Rpb24oKXtmLmFwcGx5KHQsYXJndW1lbnRzKX0sITEpLHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsZnVuY3Rpb24oKXtmLmFwcGx5KHQsYXJndW1lbnRzKX0sITEpfWZ1bmN0aW9uIHAodCl7dmFyIG49dGhpcyxlPXRoaXMub3B0aW9ucy5jb250YWluZXI7aWYoXCJzdHJpbmdcIj09dHlwZW9mIGU/dGhpcy5jb250YWluZXI9dy5xdWVyeVNlbGVjdG9yKGUpOnRoaXMuY29udGFpbmVyPWUsdGhpcy5jb250YWluZXI9PXdpbmRvdyl2YXIgaT13LnF1ZXJ5U2VsZWN0b3JBbGwodCk7ZWxzZSB2YXIgaT10aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKHQpO3ZhciBpPVtdLnNsaWNlLmNhbGwoaSxudWxsKTtyZXR1cm4gaT1pLmZpbHRlcihmdW5jdGlvbih0KXtyZXR1cm5cIjFcIj09dC5kYXRhc2V0LmJpbmQ/KGRlbGV0ZSB0Ll9oYXNBcHBlYXIsZGVsZXRlIHQuX2hhc0Rpc0FwcGVhcixkZWxldGUgdC5fYXBwZWFyLHQuY2xhc3NMaXN0LnJlbW92ZShuLm9wdGlvbnMuY2xzKSwhMSk6ITB9KX1mdW5jdGlvbiBoKHQpe3ZhciBuPXRoaXM7dCYmdC5sZW5ndGg+MCYmW10uZm9yRWFjaC5jYWxsKHQsZnVuY3Rpb24odCl7dC5fZWxlT2Zmc2V0PXModCksdC5jbGFzc0xpc3QucmVtb3ZlKG4ub3B0aW9ucy5jbHMpLHQuZGF0YXNldC5iaW5kPTF9KX1mdW5jdGlvbiBmKCl7dmFyIHQ9dGhpcy5jb250YWluZXIsbj10aGlzLmFwcGVhcldhdGNoRWxlbWVudHMsZT10aGlzLm9wdGlvbnMub25BcHBlYXIsaT10aGlzLm9wdGlvbnMub25EaXNhcHBlYXIsYT1zKHQse3g6dGhpcy5vcHRpb25zLngseTp0aGlzLm9wdGlvbnMueX0pLGw9dGhpcy5vcHRpb25zLm9uY2UsYz1hcmd1bWVudHNbMF18fHt9O24mJm4ubGVuZ3RoPjAmJltdLmZvckVhY2guY2FsbChuLGZ1bmN0aW9uKHQsbil7dmFyIHA9cyh0KSxoPXIodC5fZWxlT2Zmc2V0LHApO3QuX2VsZU9mZnNldD1wO3ZhciBmPW8oYSxwKSx1PXQuX2FwcGVhcix3PXQuX2hhc0FwcGVhcixFPXQuX2hhc0Rpc0FwcGVhcjtkLmRhdGE9e2RpcmVjdGlvbjpofSx2LmRhdGE9e2RpcmVjdGlvbjpofSxmJiYhdT8obCYmIXd8fCFsKSYmKGUmJmUuY2FsbCh0LGMpLHQuZGlzcGF0Y2hFdmVudChkKSx0Ll9oYXNBcHBlYXI9ITAsdC5fYXBwZWFyPSEwKTohZiYmdSYmKGwmJiFFfHwhbCkmJihpJiZpLmNhbGwodCxjKSx0LmRpc3BhdGNoRXZlbnQodiksdC5faGFzRGlzQXBwZWFyPSEwLHQuX2FwcGVhcj0hMSl9KX1mdW5jdGlvbiB1KHQpe2wodGhpcy5vcHRpb25zLHR8fCh0PXt9KSksdGhpcy5hcHBlYXJXYXRjaEVsZW1lbnRzPXRoaXMuYXBwZWFyV2F0Y2hFbGVtZW50c3x8cC5jYWxsKHRoaXMsXCIuXCIrdGhpcy5vcHRpb25zLmNscyksaC5jYWxsKHRoaXMsdGhpcy5hcHBlYXJXYXRjaEVsZW1lbnRzKSxjLmNhbGwodGhpcyl9dmFyIGQsdix3PWRvY3VtZW50LEU9ZnVuY3Rpb24oKXt1LmFwcGx5KHRoaXMsYXJndW1lbnRzKX0sXz17aW5zdGFuY2VzOltdLGluaXQ6ZnVuY3Rpb24odCl7dmFyIG49e29wdGlvbnM6e2NvbnRhaW5lcjp3aW5kb3csd2FpdDoxMDAseDowLHk6MCxjbHM6XCJsaWItYXBwZWFyXCIsb25jZTohMSxvblJlc2V0OmZ1bmN0aW9uKCl7fSxvbkFwcGVhcjpmdW5jdGlvbigpe30sb25EaXNhcHBlYXI6ZnVuY3Rpb24oKXt9fSxjb250YWluZXI6bnVsbCxhcHBlYXJXYXRjaEVsZW1lbnRzOm51bGwsYmluZDpmdW5jdGlvbih0KXt2YXIgbj10aGlzLm9wdGlvbnMuY2xzO2lmKFwic3RyaW5nXCI9PXR5cGVvZiB0KXt2YXIgZT1wLmNhbGwodGhpcyx0KTtbXS5mb3JFYWNoLmNhbGwoZSxmdW5jdGlvbih0LGUpe3QuY2xhc3NMaXN0LmNvbnRhaW5zKG4pfHx0LmNsYXNzTGlzdC5hZGQobil9KX1lbHNle2lmKDEhPXQubm9kZVR5cGV8fCF0aGlzLmNvbnRhaW5lci5jb250YWlucyh0KSlyZXR1cm4gdGhpczt0LmNsYXNzTGlzdC5jb250YWlucyhuKXx8dC5jbGFzc0xpc3QuYWRkKG4pfXZhciBpPXAuY2FsbCh0aGlzLFwiLlwiK3RoaXMub3B0aW9ucy5jbHMpO3JldHVybiB0aGlzLmFwcGVhcldhdGNoRWxlbWVudHM9dGhpcy5hcHBlYXJXYXRjaEVsZW1lbnRzLmNvbmNhdChpKSxoLmNhbGwodGhpcyxpKSx0aGlzfSxyZXNldDpmdW5jdGlvbih0KXtyZXR1cm4gdS5jYWxsKHRoaXMsdCksdGhpcy5hcHBlYXJXYXRjaEVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24odCl7ZGVsZXRlIHQuX2hhc0FwcGVhcixkZWxldGUgdC5faGFzRGlzQXBwZWFyLGRlbGV0ZSB0Ll9hcHBlYXJ9KSx0aGlzfSxmaXJlOmZ1bmN0aW9uKCl7dGhpcy5hcHBlYXJXYXRjaEVsZW1lbnRzfHwodGhpcy5hcHBlYXJXYXRjaEVsZW1lbnRzPVtdKTt2YXIgdD1wLmNhbGwodGhpcyxcIi5cIit0aGlzLm9wdGlvbnMuY2xzKTtyZXR1cm4gdGhpcy5hcHBlYXJXYXRjaEVsZW1lbnRzPXRoaXMuYXBwZWFyV2F0Y2hFbGVtZW50cy5jb25jYXQodCksaC5jYWxsKHRoaXMsdCksZi5jYWxsKHRoaXMpLHRoaXN9fTtFLnByb3RvdHlwZT1uO3ZhciBlPW5ldyBFKHQpO3JldHVybiB0aGlzLmluc3RhbmNlcy5wdXNoKGUpLGV9LGZpcmVBbGw6ZnVuY3Rpb24oKXt2YXIgdD10aGlzLmluc3RhbmNlczt0LmZvckVhY2goZnVuY3Rpb24odCl7dC5maXJlKCl9KX19O2koKSxlLmFwcGVhcj1ffSh3aW5kb3csd2luZG93LmxpYnx8KHdpbmRvdy5saWI9e30pKTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9sYXp5aW1nL34vYXBwZWFyanMvYnVpbGQvYXBwZWFyLmNvbW1vbi5qc1xuICoqIG1vZHVsZSBpZCA9IDIwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgLyoqXG4gICAqIGNvbmZpZzpcbiAgICogICAtIHN0eWxlc1xuICAgKiAgIC0gZHVyYXRpb24gW051bWJlcl0gbWlsbGlzZWNvbmRzKG1zKVxuICAgKiAgIC0gdGltaW5nRnVuY3Rpb24gW3N0cmluZ11cbiAgICogICAtIGRlYWx5IFtOdW1iZXJdIG1pbGxpc2Vjb25kcyhtcylcbiAgICovXG4gIHRyYW5zaXRpb25PbmNlOiBmdW5jdGlvbiAoY29tcCwgY29uZmlnLCBjYWxsYmFjaykge1xuICAgIHZhciBzdHlsZXMgPSBjb25maWcuc3R5bGVzIHx8IHt9XG4gICAgdmFyIGR1cmF0aW9uID0gY29uZmlnLmR1cmF0aW9uIHx8IDEwMDAgLy8gbXNcbiAgICB2YXIgdGltaW5nRnVuY3Rpb24gPSBjb25maWcudGltaW5nRnVuY3Rpb24gfHwgJ2Vhc2UnXG4gICAgdmFyIGRlbGF5ID0gY29uZmlnLmRlbGF5IHx8IDAgIC8vIG1zXG4gICAgdmFyIHRyYW5zaXRpb25WYWx1ZSA9ICdhbGwgJyArIGR1cmF0aW9uICsgJ21zICdcbiAgICAgICAgKyB0aW1pbmdGdW5jdGlvbiArICcgJyArIGRlbGF5ICsgJ21zJ1xuICAgIHZhciBkb20gPSBjb21wLm5vZGVcbiAgICB2YXIgdHJhbnNpdGlvbkVuZEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3dlYmtpdFRyYW5zaXRpb25FbmQnLCB0cmFuc2l0aW9uRW5kSGFuZGxlcilcbiAgICAgIGRvbS5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgdHJhbnNpdGlvbkVuZEhhbmRsZXIpXG4gICAgICBkb20uc3R5bGUudHJhbnNpdGlvbiA9ICcnXG4gICAgICBkb20uc3R5bGUud2Via2l0VHJhbnNpdGlvbiA9ICcnXG4gICAgICBjYWxsYmFjaygpXG4gICAgfVxuICAgIGRvbS5zdHlsZS50cmFuc2l0aW9uID0gdHJhbnNpdGlvblZhbHVlXG4gICAgZG9tLnN0eWxlLndlYmtpdFRyYW5zaXRpb24gPSB0cmFuc2l0aW9uVmFsdWVcbiAgICBkb20uYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0VHJhbnNpdGlvbkVuZCcsIHRyYW5zaXRpb25FbmRIYW5kbGVyKVxuICAgIGRvbS5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgdHJhbnNpdGlvbkVuZEhhbmRsZXIpXG4gICAgY29tcC51cGRhdGVTdHlsZShzdHlsZXMpXG4gIH1cblxufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvYW5pbWF0aW9uLmpzXG4gKiogbW9kdWxlIGlkID0gMjFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJylcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJylcbnZhciBDb21wb25lbnRNYW5hZ2VyID0gcmVxdWlyZSgnLi4vY29tcG9uZW50TWFuYWdlcicpXG52YXIgZmxleGJveCA9IHJlcXVpcmUoJy4uL2ZsZXhib3gnKVxudmFyIHZhbHVlRmlsdGVyID0gcmVxdWlyZSgnLi4vdmFsdWVGaWx0ZXInKVxucmVxdWlyZSgnZml4ZWRzdGlja3knKVxuXG5mdW5jdGlvbiBDb21wb25lbnQoZGF0YSwgbm9kZVR5cGUpIHtcbiAgdGhpcy5kYXRhID0gZGF0YVxuICB0aGlzLm5vZGUgPSB0aGlzLmNyZWF0ZShub2RlVHlwZSlcblxuICB0aGlzLmNyZWF0ZUNoaWxkcmVuKClcbiAgdGhpcy51cGRhdGVBdHRycyh0aGlzLmRhdGEuYXR0cilcbiAgLy8gaXNzdWU6IHdoZW4gYWRkIGVsZW1lbnQgdG8gYSBsaXN0IGluIGxpZmV0aW1lIGhvb2sgJ3JlYWR5JywgdGhlXG4gIC8vIHN0eWxlcyBpcyBzZXQgdG8gdGhlIGNsYXNzU3R5bGUsIG5vdCBzdHlsZS4gVGhpcyBpcyBhIGlzc3VlXG4gIC8vIHRoYXQganNmcmFtZXdvcmsgc2hvdWxkIGRvIHNvbWV0aGluZyBhYm91dC5cbiAgdmFyIGNsYXNzU3R5bGUgPSB0aGlzLmRhdGEuY2xhc3NTdHlsZVxuICBjbGFzc1N0eWxlICYmIHRoaXMudXBkYXRlU3R5bGUodGhpcy5kYXRhLmNsYXNzU3R5bGUpXG4gIHRoaXMudXBkYXRlU3R5bGUodGhpcy5kYXRhLnN0eWxlKVxuICB0aGlzLmJpbmRFdmVudHModGhpcy5kYXRhLmV2ZW50KVxufVxuXG5Db21wb25lbnQucHJvdG90eXBlID0ge1xuXG4gIGNyZWF0ZTogZnVuY3Rpb24gKG5vZGVUeXBlKSB7XG4gICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5vZGVUeXBlIHx8ICdkaXYnKVxuICAgIHJldHVybiBub2RlXG4gIH0sXG5cbiAgZ2V0Q29tcG9uZW50TWFuYWdlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBDb21wb25lbnRNYW5hZ2VyLmdldEluc3RhbmNlKHRoaXMuZGF0YS5pbnN0YW5jZUlkKVxuICB9LFxuXG4gIGdldFBhcmVudDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmdldENvbXBvbmVudE1hbmFnZXIoKS5jb21wb25lbnRNYXBbdGhpcy5wYXJlbnRSZWZdXG4gIH0sXG5cbiAgZ2V0UGFyZW50U2Nyb2xsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc0luU2Nyb2xsYWJsZSgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcGFyZW50U2Nyb2xsZXJcbiAgICB9XG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICBnZXRSb290U2Nyb2xsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc0luU2Nyb2xsYWJsZSgpKSB7XG4gICAgICB2YXIgc2Nyb2xsZXIgPSB0aGlzLl9wYXJlbnRTY3JvbGxlclxuICAgICAgdmFyIHBhcmVudCA9IHNjcm9sbGVyLl9wYXJlbnRTY3JvbGxlclxuICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICBzY3JvbGxlciA9IHBhcmVudFxuICAgICAgICBwYXJlbnQgPSBzY3JvbGxlci5fcGFyZW50U2Nyb2xsZXJcbiAgICAgIH1cbiAgICAgIHJldHVybiBzY3JvbGxlclxuICAgIH1cbiAgICByZXR1cm4gbnVsbFxuICB9LFxuXG4gIGdldFJvb3RDb250YWluZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcm9vdCA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpLndlZXhJbnN0YW5jZS5nZXRSb290KClcbiAgICAgIHx8IGRvY3VtZW50LmJvZHlcbiAgICByZXR1cm4gcm9vdFxuICB9LFxuXG4gIGlzU2Nyb2xsYWJsZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciB0ID0gdGhpcy5kYXRhLnR5cGVcbiAgICByZXR1cm4gQ29tcG9uZW50TWFuYWdlci5nZXRTY3JvbGxhYmxlVHlwZXMoKS5pbmRleE9mKHQpICE9PSAtMVxuICB9LFxuXG4gIGlzSW5TY3JvbGxhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLl9pc0luU2Nyb2xsYWJsZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXNJblNjcm9sbGFibGVcbiAgICB9XG4gICAgdmFyIHBhcmVudCA9IHRoaXMuZ2V0UGFyZW50KClcbiAgICBpZiAocGFyZW50XG4gICAgICAgICYmICh0eXBlb2YgcGFyZW50Ll9pc0luU2Nyb2xsYWJsZSAhPT0gJ2Jvb2xlYW4nKVxuICAgICAgICAmJiAhcGFyZW50LmlzU2Nyb2xsYWJsZSgpKSB7XG4gICAgICBpZiAocGFyZW50LmRhdGEucmVmID09PSAnX3Jvb3QnKSB7XG4gICAgICAgIHRoaXMuX2lzSW5TY3JvbGxhYmxlID0gZmFsc2VcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICB0aGlzLl9pc0luU2Nyb2xsYWJsZSA9IHBhcmVudC5pc0luU2Nyb2xsYWJsZSgpXG4gICAgICB0aGlzLl9wYXJlbnRTY3JvbGxlciA9IHBhcmVudC5fcGFyZW50U2Nyb2xsZXJcbiAgICAgIHJldHVybiB0aGlzLl9pc0luU2Nyb2xsYWJsZVxuICAgIH1cbiAgICBpZiAocGFyZW50ICYmIHR5cGVvZiBwYXJlbnQuX2lzSW5TY3JvbGxhYmxlID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHRoaXMuX2lzSW5TY3JvbGxhYmxlID0gcGFyZW50Ll9pc0luU2Nyb2xsYWJsZVxuICAgICAgdGhpcy5fcGFyZW50U2Nyb2xsZXIgPSBwYXJlbnQuX3BhcmVudFNjcm9sbGVyXG4gICAgICByZXR1cm4gdGhpcy5faXNJblNjcm9sbGFibGVcbiAgICB9XG4gICAgaWYgKHBhcmVudCAmJiBwYXJlbnQuaXNTY3JvbGxhYmxlKCkpIHtcbiAgICAgIHRoaXMuX2lzSW5TY3JvbGxhYmxlID0gdHJ1ZVxuICAgICAgdGhpcy5fcGFyZW50U2Nyb2xsZXIgPSBwYXJlbnRcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIGlmICghcGFyZW50KSB7XG4gICAgICBjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IoJ2lzSW5TY3JvbGxhYmxlIC0gcGFyZW50IG5vdCBleGlzdC4nKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICB9LFxuXG4gIGNyZWF0ZUNoaWxkcmVuOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5kYXRhLmNoaWxkcmVuXG4gICAgdmFyIHBhcmVudFJlZiA9IHRoaXMuZGF0YS5yZWZcbiAgICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gICAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgdmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gICAgICB2YXIgaXNGbGV4ID0gZmFsc2VcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2hpbGRyZW5baV0uaW5zdGFuY2VJZCA9IHRoaXMuZGF0YS5pbnN0YW5jZUlkXG4gICAgICAgIGNoaWxkcmVuW2ldLnNjYWxlID0gdGhpcy5kYXRhLnNjYWxlXG4gICAgICAgIHZhciBjaGlsZCA9IGNvbXBvbmVudE1hbmFnZXIuY3JlYXRlRWxlbWVudChjaGlsZHJlbltpXSlcbiAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoY2hpbGQubm9kZSlcbiAgICAgICAgY2hpbGQucGFyZW50UmVmID0gcGFyZW50UmVmXG4gICAgICAgIGlmICghaXNGbGV4XG4gICAgICAgICAgICAmJiBjaGlsZC5kYXRhLnN0eWxlXG4gICAgICAgICAgICAmJiBjaGlsZC5kYXRhLnN0eWxlLmhhc093blByb3BlcnR5KCdmbGV4JylcbiAgICAgICAgICApIHtcbiAgICAgICAgICBpc0ZsZXggPSB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZChmcmFnbWVudClcbiAgICB9XG4gIH0sXG5cbiAgLy8gQHRvZG86IGNoYW5nZWQgcGFyYW0gZGF0YSB0byBjaGlsZFxuICBhcHBlbmRDaGlsZDogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmRhdGEuY2hpbGRyZW5cbiAgICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gICAgdmFyIGNoaWxkID0gY29tcG9uZW50TWFuYWdlci5jcmVhdGVFbGVtZW50KGRhdGEpXG4gICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKGNoaWxkLm5vZGUpXG4gICAgLy8gdXBkYXRlIHRoaXMuZGF0YS5jaGlsZHJlblxuICAgIGlmICghY2hpbGRyZW4gfHwgIWNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgdGhpcy5kYXRhLmNoaWxkcmVuID0gW2RhdGFdXG4gICAgfSBlbHNlIHtcbiAgICAgIGNoaWxkcmVuLnB1c2goZGF0YSlcbiAgICB9XG5cbiAgICByZXR1cm4gY2hpbGRcbiAgfSxcblxuICBpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uIChjaGlsZCwgYmVmb3JlKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5kYXRhLmNoaWxkcmVuXG4gICAgdmFyIGkgPSAwXG4gICAgdmFyIGxcbiAgICB2YXIgaXNBcHBlbmQgPSBmYWxzZVxuXG4gICAgLy8gdXBkYXRlIHRoaXMuZGF0YS5jaGlsZHJlblxuICAgIGlmICghY2hpbGRyZW4gfHwgIWNoaWxkcmVuLmxlbmd0aCB8fCAhYmVmb3JlKSB7XG4gICAgICBpc0FwcGVuZCA9IHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChjaGlsZHJlbltpXS5yZWYgPT09IGJlZm9yZS5kYXRhLnJlZikge1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpID09PSBsKSB7XG4gICAgICAgIGlzQXBwZW5kID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpc0FwcGVuZCkge1xuICAgICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKGNoaWxkLm5vZGUpXG4gICAgICBjaGlsZHJlbi5wdXNoKGNoaWxkLmRhdGEpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChiZWZvcmUuZml4ZWRQbGFjZWhvbGRlcikge1xuICAgICAgICB0aGlzLm5vZGUuaW5zZXJ0QmVmb3JlKGNoaWxkLm5vZGUsIGJlZm9yZS5maXhlZFBsYWNlaG9sZGVyKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5ub2RlLmluc2VydEJlZm9yZShjaGlsZC5ub2RlLCBiZWZvcmUubm9kZSlcbiAgICAgIH1cbiAgICAgIGNoaWxkcmVuLnNwbGljZShpLCAwLCBjaGlsZC5kYXRhKVxuICAgIH1cblxuICB9LFxuXG4gIHJlbW92ZUNoaWxkOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmRhdGEuY2hpbGRyZW5cbiAgICAvLyByZW1vdmUgZnJvbSB0aGlzLmRhdGEuY2hpbGRyZW5cbiAgICB2YXIgaSA9IDBcbiAgICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gICAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpZiAoY2hpbGRyZW5baV0ucmVmID09PSBjaGlsZC5kYXRhLnJlZikge1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpIDwgbCkge1xuICAgICAgICBjaGlsZHJlbi5zcGxpY2UoaSwgMSlcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gcmVtb3ZlIGZyb20gY29tcG9uZW50TWFwIHJlY3Vyc2l2ZWx5XG4gICAgY29tcG9uZW50TWFuYWdlci5yZW1vdmVFbGVtZW50QnlSZWYoY2hpbGQuZGF0YS5yZWYpXG4gICAgaWYgKGNoaWxkLmZpeGVkUGxhY2Vob2xkZXIpIHtcbiAgICAgIHRoaXMubm9kZS5yZW1vdmVDaGlsZChjaGlsZC5maXhlZFBsYWNlaG9sZGVyKVxuICAgIH1cbiAgICBjaGlsZC5ub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQubm9kZSlcbiAgfSxcblxuICB1cGRhdGVBdHRyczogZnVuY3Rpb24gKGF0dHJzKSB7XG4gICAgLy8gTm90Ze+8mmF0dHIgbXVzdCBiZSBpbmplY3RlZCBpbnRvIHRoZSBkb20gZWxlbWVudCBiZWNhdXNlXG4gICAgLy8gaXQgd2lsbCBiZSBhY2Nlc3NlZCBmcm9tIHRoZSBvdXRzaWRlIGRldmVsb3BlciBieSBldmVudC50YXJnZXQuYXR0ci5cbiAgICBpZiAoIXRoaXMubm9kZS5hdHRyKSB7XG4gICAgICB0aGlzLm5vZGUuYXR0ciA9IHt9XG4gICAgfVxuICAgIGZvciAodmFyIGtleSBpbiBhdHRycykge1xuICAgICAgdmFyIHZhbHVlID0gYXR0cnNba2V5XVxuICAgICAgdmFyIGF0dHJTZXR0ZXIgPSB0aGlzLmF0dHJba2V5XVxuICAgICAgaWYgKHR5cGVvZiBhdHRyU2V0dGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGF0dHJTZXR0ZXIuY2FsbCh0aGlzLCB2YWx1ZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgICAgIHRoaXMubm9kZVtrZXldID0gdmFsdWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm5vZGUuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ub2RlLmF0dHJba2V5XSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZVN0eWxlOiBmdW5jdGlvbiAoc3R5bGUpIHtcblxuICAgIGZvciAodmFyIGtleSBpbiBzdHlsZSkge1xuICAgICAgdmFyIHZhbHVlID0gc3R5bGVba2V5XVxuICAgICAgdmFyIHN0eWxlU2V0dGVyID0gdGhpcy5zdHlsZVtrZXldXG4gICAgICBpZiAodHlwZW9mIHN0eWxlU2V0dGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHN0eWxlU2V0dGVyLmNhbGwodGhpcywgdmFsdWUpXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICB2YXIgcGFyc2VyID0gdmFsdWVGaWx0ZXIuZ2V0RmlsdGVycyhrZXksXG4gICAgICAgICAgeyBzY2FsZTogdGhpcy5kYXRhLnNjYWxlIH0pW3R5cGVvZiB2YWx1ZV1cbiAgICAgIGlmICh0eXBlb2YgcGFyc2VyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbHVlID0gcGFyc2VyKHZhbHVlKVxuICAgICAgfVxuICAgICAgdGhpcy5ub2RlLnN0eWxlW2tleV0gPSB2YWx1ZVxuICAgIH1cbiAgfSxcblxuICBiaW5kRXZlbnRzOiBmdW5jdGlvbiAoZXZ0cykge1xuICAgIHZhciBjb21wb25lbnRNYW5hZ2VyID0gdGhpcy5nZXRDb21wb25lbnRNYW5hZ2VyKClcbiAgICBpZiAoZXZ0c1xuICAgICAgICAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXZ0cykuc2xpY2UoOCwgLTEpID09PSAnQXJyYXknXG4gICAgICApIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gZXZ0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgY29tcG9uZW50TWFuYWdlci5hZGRFdmVudCh0aGlzLCBldnRzW2ldKVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyBkaXNwYXRjaCBhIHNwZWNpZmllZCBldmVudCBvbiB0aGlzLm5vZGVcbiAgLy8gIC0gdHlwZTogZXZlbnQgdHlwZVxuICAvLyAgLSBkYXRhOiBldmVudCBkYXRhXG4gIC8vICAtIGNvbmZpZzogZXZlbnQgY29uZmlnIG9iamVjdFxuICAvLyAgICAgLSBidWJibGVzXG4gIC8vICAgICAtIGNhbmNlbGFibGVcbiAgZGlzcGF0Y2hFdmVudDogZnVuY3Rpb24gKHR5cGUsIGRhdGEsIGNvbmZpZykge1xuICAgIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdIVE1MRXZlbnRzJylcbiAgICBjb25maWcgPSBjb25maWcgfHwge31cbiAgICBldmVudC5pbml0RXZlbnQodHlwZSwgY29uZmlnLmJ1YmJsZXMgfHwgZmFsc2UsIGNvbmZpZy5jYW5jZWxhYmxlIHx8IGZhbHNlKVxuICAgICFkYXRhICYmIChkYXRhID0ge30pXG4gICAgZXZlbnQuZGF0YSA9IHV0aWxzLmV4dGVuZCh7fSwgZGF0YSlcbiAgICB1dGlscy5leHRlbmQoZXZlbnQsIGRhdGEpXG4gICAgdGhpcy5ub2RlLmRpc3BhdGNoRXZlbnQoZXZlbnQpXG4gIH0sXG5cbiAgdXBkYXRlUmVjdXJzaXZlQXR0cjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB0aGlzLnVwZGF0ZUF0dHJzKGRhdGEuYXR0cilcbiAgICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5kYXRhLmNoaWxkcmVuXG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGNvbXBvbmVudE1hbmFnZXIuZ2V0RWxlbWVudEJ5UmVmKGNoaWxkcmVuW2ldLnJlZilcbiAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgY2hpbGQudXBkYXRlUmVjdXJzaXZlQXR0cihkYXRhLmNoaWxkcmVuW2ldKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZVJlY3Vyc2l2ZVN0eWxlOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHRoaXMudXBkYXRlU3R5bGUoZGF0YS5zdHlsZSlcbiAgICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5kYXRhLmNoaWxkcmVuXG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGNvbXBvbmVudE1hbmFnZXIuZ2V0RWxlbWVudEJ5UmVmKGNoaWxkcmVuW2ldLnJlZilcbiAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgY2hpbGQudXBkYXRlUmVjdXJzaXZlU3R5bGUoZGF0YS5jaGlsZHJlbltpXSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICB1cGRhdGVSZWN1cnNpdmVBbGw6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdGhpcy51cGRhdGVBdHRycyhkYXRhLmF0dHIpXG4gICAgdGhpcy51cGRhdGVTdHlsZShkYXRhLnN0eWxlKVxuICAgIHZhciBjb21wb25lbnRNYW5hZ2VyID0gdGhpcy5nZXRDb21wb25lbnRNYW5hZ2VyKClcblxuICAgIC8vIHZhciBvbGRSZWYgPSB0aGlzLmRhdGEucmVmXG4gICAgLy8gaWYgKGNvbXBvbmVudE1hcFtvbGRSZWZdKSB7XG4gICAgLy8gICBkZWxldGUgY29tcG9uZW50TWFwW29sZFJlZl1cbiAgICAvLyB9XG4gICAgLy8gdGhpcy5kYXRhLnJlZiA9IGRhdGEucmVmXG4gICAgLy8gY29tcG9uZW50TWFwW2RhdGEucmVmXSA9IHRoaXNcblxuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuZGF0YS5jaGlsZHJlblxuICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBjb21wb25lbnRNYW5hZ2VyLmdldEVsZW1lbnRCeVJlZihjaGlsZHJlbltpXS5yZWYpXG4gICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgIGNoaWxkLnVwZGF0ZVJlY3Vyc2l2ZUFsbChkYXRhLmNoaWxkcmVuW2ldKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGF0dHI6IHt9LCAvLyBhdHRyIHNldHRlcnNcblxuICBzdHlsZTogT2JqZWN0LmNyZWF0ZShmbGV4Ym94KSwgLy8gc3R5bGUgc2V0dGVyc1xuXG4gIGNsZWFyQXR0cjogZnVuY3Rpb24gKCkge1xuICB9LFxuXG4gIGNsZWFyU3R5bGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm5vZGUuY3NzVGV4dCA9ICcnXG4gIH1cbn1cblxuQ29tcG9uZW50LnByb3RvdHlwZS5zdHlsZS5wb3NpdGlvbiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXG4gIC8vIEZvciB0aGUgZWxlbWVudHMgd2hvIGFyZSBmaXhlZCBlbGVtZW50cyBiZWZvcmUsIG5vd1xuICAvLyBhcmUgbm90IGZpeGVkOiB0aGUgZml4ZWRQbGFjZWhvbGRlciBoYXMgdG8gYmUgcmVwbGFjZWRcbiAgLy8gYnkgdGhpcyBlbGVtZW50LlxuICAvLyBUaGlzIGlzIGEgcGVhY2Ugb2YgaGFja2luZyB0byBmaXggdGhlIHByb2JsZW0gYWJvdXRcbiAgLy8gbWl4aW5nIGZpeGVkIGFuZCB0cmFuc2Zvcm0uIFNlZSAnaHR0cDovL3N0YWNrb3ZlcmZsb1xuICAvLyB3LmNvbS9xdWVzdGlvbnMvMTUxOTQzMTMvd2Via2l0LWNzcy10cmFuc2Zvcm0zZC1wb3NpXG4gIC8vIHRpb24tZml4ZWQtaXNzdWUnIGZvciBtb3JlIGluZm8uXG4gIGlmICh2YWx1ZSAhPT0gJ2ZpeGVkJykge1xuICAgIGlmICh0aGlzLmZpeGVkUGxhY2Vob2xkZXIpIHtcbiAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmZpeGVkUGxhY2Vob2xkZXIucGFyZW50Tm9kZVxuICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLm5vZGUsIHRoaXMuZml4ZWRQbGFjZWhvbGRlcilcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLmZpeGVkUGxhY2Vob2xkZXIpXG4gICAgICB0aGlzLmZpeGVkUGxhY2Vob2xkZXIgPSBudWxsXG4gICAgfVxuICB9IGVsc2UgeyAvLyB2YWx1ZSA9PT0gJ2ZpeGVkJ1xuICAgIC8vIEZvciB0aGUgZWxlbWVudHMgd2hvIGFyZSBmaXhlZDogdGhpcyBmaXhlZFBsYWNlaG9sZGVyXG4gICAgLy8gc2hvdWQgYmUgaW5zZXJ0ZWQsIGFuZCB0aGUgZml4ZWQgZWxlbWVudCBpdHNlbGYgc2hvdWxkXG4gICAgLy8gYmUgcGxhY2VkIG91dCBpbiByb290IGNvbnRhaW5lci5cbiAgICB0aGlzLm5vZGUuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnXG4gICAgdmFyIHBhcmVudCA9IHRoaXMubm9kZS5wYXJlbnROb2RlXG4gICAgdmFyIHJlcGxhY2VXaXRoRml4ZWRQbGFjZWhvbGRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuZml4ZWRQbGFjZWhvbGRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICB0aGlzLmZpeGVkUGxhY2Vob2xkZXIuY2xhc3NMaXN0LmFkZCgnd2VleC1maXhlZC1wbGFjZWhvbGRlcicpXG4gICAgICB0aGlzLmZpeGVkUGxhY2Vob2xkZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgdGhpcy5maXhlZFBsYWNlaG9sZGVyLnN0eWxlLndpZHRoID0gJzBweCdcbiAgICAgIHRoaXMuZml4ZWRQbGFjZWhvbGRlci5zdHlsZS5oZWlnaHQgPSAnMHB4J1xuICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLmZpeGVkUGxhY2Vob2xkZXIsIHRoaXMubm9kZSlcbiAgICAgIHRoaXMuZ2V0Um9vdENvbnRhaW5lcigpLmFwcGVuZENoaWxkKHRoaXMubm9kZSlcbiAgICB9LmJpbmQodGhpcylcbiAgICBpZiAoIXBhcmVudCkge1xuICAgICAgaWYgKHRoaXMub25BcHBlbmQpIHtcbiAgICAgICAgdmFyIHByZSA9IHRoaXMub25BcHBlbmQuYmluZCh0aGlzKVxuICAgICAgfVxuICAgICAgdGhpcy5vbkFwcGVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcGFyZW50ID0gdGhpcy5ub2RlLnBhcmVudE5vZGVcbiAgICAgICAgcmVwbGFjZVdpdGhGaXhlZFBsYWNlaG9sZGVyKClcbiAgICAgICAgcHJlICYmIHByZSgpXG4gICAgICB9LmJpbmQodGhpcylcbiAgICB9IGVsc2Uge1xuICAgICAgcmVwbGFjZVdpdGhGaXhlZFBsYWNlaG9sZGVyKClcbiAgICB9XG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAodmFsdWUgPT09ICdzdGlja3knKSB7XG4gICAgdGhpcy5ub2RlLnN0eWxlLnpJbmRleCA9IDEwMFxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdGlja3kgPSBuZXcgbGliLnN0aWNreSh0aGlzLm5vZGUsIHtcbiAgICAgICAgdG9wOiAwXG4gICAgICB9KVxuICAgIH0uYmluZCh0aGlzKSwgMClcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm5vZGUuc3R5bGUucG9zaXRpb24gPSB2YWx1ZVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50XG5cblxuXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvY29tcG9uZW50LmpzXG4gKiogbW9kdWxlIGlkID0gMjJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG4vLyBGbGV4Ym94IHBvbHlmaWxsXG52YXIgZmxleGJveFNldHRlcnMgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgQk9YX0FMSUdOID0ge1xuICAgIHN0cmV0Y2g6ICdzdHJldGNoJyxcbiAgICAnZmxleC1zdGFydCc6ICdzdGFydCcsXG4gICAgJ2ZsZXgtZW5kJzogJ2VuZCcsXG4gICAgY2VudGVyOiAnY2VudGVyJ1xuICB9XG4gIHZhciBCT1hfT1JJRU5UID0ge1xuICAgIHJvdzogJ2hvcml6b250YWwnLFxuICAgIGNvbHVtbjogJ3ZlcnRpY2FsJ1xuICB9XG4gIHZhciBCT1hfUEFDSyA9IHtcbiAgICAnZmxleC1zdGFydCc6ICdzdGFydCcsXG4gICAgJ2ZsZXgtZW5kJzogJ2VuZCcsXG4gICAgY2VudGVyOiAnY2VudGVyJyxcbiAgICAnc3BhY2UtYmV0d2Vlbic6ICdqdXN0aWZ5JyxcbiAgICAnc3BhY2UtYXJvdW5kJzogJ2p1c3RpZnknIC8vIEp1c3Qgc2FtZSBhcyBgc3BhY2UtYmV0d2VlbmBcbiAgfVxuICByZXR1cm4ge1xuICAgIGZsZXg6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgdGhpcy5ub2RlLnN0eWxlLndlYmtpdEJveEZsZXggPSB2YWx1ZVxuICAgICAgdGhpcy5ub2RlLnN0eWxlLndlYmtpdEZsZXggPSB2YWx1ZVxuICAgICAgdGhpcy5ub2RlLnN0eWxlLmZsZXggPSB2YWx1ZVxuICAgIH0sXG4gICAgYWxpZ25JdGVtczogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICB0aGlzLm5vZGUuc3R5bGUud2Via2l0Qm94QWxpZ24gPSBCT1hfQUxJR05bdmFsdWVdXG4gICAgICB0aGlzLm5vZGUuc3R5bGUud2Via2l0QWxpZ25JdGVtcyA9IHZhbHVlXG4gICAgICB0aGlzLm5vZGUuc3R5bGUuYWxpZ25JdGVtcyA9IHZhbHVlXG4gICAgfSxcbiAgICBhbGlnblNlbGY6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgdGhpcy5ub2RlLnN0eWxlLndlYmtpdEFsaWduU2VsZiA9IHZhbHVlXG4gICAgICB0aGlzLm5vZGUuc3R5bGUuYWxpZ25TZWxmID0gdmFsdWVcbiAgICB9LFxuICAgIGZsZXhEaXJlY3Rpb246IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgdGhpcy5ub2RlLnN0eWxlLndlYmtpdEJveE9yaWVudCA9IEJPWF9PUklFTlRbdmFsdWVdXG4gICAgICB0aGlzLm5vZGUuc3R5bGUud2Via2l0RmxleERpcmVjdGlvbiA9IHZhbHVlXG4gICAgICB0aGlzLm5vZGUuc3R5bGUuZmxleERpcmVjdGlvbiA9IHZhbHVlXG4gICAgfSxcbiAgICBqdXN0aWZ5Q29udGVudDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICB0aGlzLm5vZGUuc3R5bGUud2Via2l0Qm94UGFjayA9IEJPWF9QQUNLW3ZhbHVlXVxuICAgICAgdGhpcy5ub2RlLnN0eWxlLndlYmtpdEp1c3RpZnlDb250ZW50ID0gdmFsdWVcbiAgICAgIHRoaXMubm9kZS5zdHlsZS5qdXN0aWZ5Q29udGVudCA9IHZhbHVlXG4gICAgfVxuICB9XG59KSgpXG5cbm1vZHVsZS5leHBvcnRzID0gZmxleGJveFNldHRlcnNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvZmxleGJveC5qc1xuICoqIG1vZHVsZSBpZCA9IDIzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIE5PVF9QWF9OVU1CRVJfUFJPUEVSVElFUyA9IFsnZmxleCcsICdvcGFjaXR5JywgJ3pJbmRleCcsICdmb250V2VpZ2h0J11cblxudmFyIHZhbHVlRmlsdGVyID0ge1xuXG4gIGZpbHRlclN0eWxlczogZnVuY3Rpb24gKHN0eWxlcywgY29uZmlnKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHN0eWxlcykge1xuICAgICAgdmFyIHZhbHVlID0gc3R5bGVzW2tleV1cbiAgICAgIHZhciBwYXJzZXIgPSB0aGlzLmdldEZpbHRlcnMoa2V5LCBjb25maWcpW3R5cGVvZiB2YWx1ZV1cbiAgICAgIGlmICh0eXBlb2YgcGFyc2VyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHN0eWxlc1trZXldID0gcGFyc2VyKHZhbHVlKVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBnZXRGaWx0ZXJzOiBmdW5jdGlvbiAoa2V5LCBjb25maWcpIHtcblxuICAgIGlmIChOT1RfUFhfTlVNQkVSX1BST1BFUlRJRVMuaW5kZXhPZihrZXkpICE9PSAtMSkge1xuICAgICAgcmV0dXJuIHt9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBudW1iZXI6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgcmV0dXJuIHZhbCAqIGNvbmZpZy5zY2FsZSArICdweCdcbiAgICAgIH0sXG4gICAgICBzdHJpbmc6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgLy8gc3RyaW5nIG9mIGEgcHVyZSBudW1iZXIgb3IgYSBudW1iZXIgc3VmZml4ZWQgd2l0aCBhICdweCcgdW5pdFxuICAgICAgICBpZiAodmFsLm1hdGNoKC9eXFwtP1xcZCpcXC4/XFxkKyg/OnB4KT8kLykpIHtcbiAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWwpICogY29uZmlnLnNjYWxlICsgJ3B4J1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkubWF0Y2goL3RyYW5zZm9ybS8pICYmIHZhbC5tYXRjaCgvdHJhbnNsYXRlLykpIHtcbiAgICAgICAgICByZXR1cm4gdmFsLnJlcGxhY2UoL1xcZCpcXC4/XFxkK3B4L2csIGZ1bmN0aW9uIChtYXRjaCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KHBhcnNlRmxvYXQobWF0Y2gpICogY29uZmlnLnNjYWxlKSArICdweCdcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWxcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB2YWx1ZUZpbHRlclxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy92YWx1ZUZpbHRlci5qc1xuICoqIG1vZHVsZSBpZCA9IDI0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpICYmICh3aW5kb3cgPSB7Y3RybDoge30sIGxpYjoge319KTshd2luZG93LmN0cmwgJiYgKHdpbmRvdy5jdHJsID0ge30pOyF3aW5kb3cubGliICYmICh3aW5kb3cubGliID0ge30pOyFmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhKXtyZXR1cm4gbnVsbCE9YSYmXCJvYmplY3RcIj09dHlwZW9mIGEmJk9iamVjdC5nZXRQcm90b3R5cGVPZihhKT09T2JqZWN0LnByb3RvdHlwZX1mdW5jdGlvbiBlKGEsYil7dmFyIGMsZCxlLGY9bnVsbCxnPTAsaD1mdW5jdGlvbigpe2c9RGF0ZS5ub3coKSxmPW51bGwsZT1hLmFwcGx5KGMsZCl9O3JldHVybiBmdW5jdGlvbigpe3ZhciBpPURhdGUubm93KCksaj1iLShpLWcpO3JldHVybiBjPXRoaXMsZD1hcmd1bWVudHMsMD49aj8oY2xlYXJUaW1lb3V0KGYpLGY9bnVsbCxnPWksZT1hLmFwcGx5KGMsZCkpOmZ8fChmPXNldFRpbWVvdXQoaCxqKSksZX19ZnVuY3Rpb24gZihhKXt2YXIgYj1cIlwiO3JldHVybiBPYmplY3Qua2V5cyhhKS5mb3JFYWNoKGZ1bmN0aW9uKGMpe2IrPWMrXCI6XCIrYVtjXStcIjtcIn0pLGJ9ZnVuY3Rpb24gZyhhLGMpeyFjJiZkKGEpJiYoYz1hLGE9Yy5lbGVtZW50KSxjPWN8fHt9LGEubm9kZVR5cGUhPWIuRUxFTUVOVF9OT0RFJiZcInN0cmluZ1wiPT10eXBlb2YgYSYmKGE9Yi5xdWVyeVNlbGVjdG9yKGEpKTt2YXIgZT10aGlzO2UuZWxlbWVudD1hLGUudG9wPWMudG9wfHwwLGUud2l0aGluUGFyZW50PXZvaWQgMD09Yy53aXRoaW5QYXJlbnQ/ITE6Yy53aXRoaW5QYXJlbnQsZS5pbml0KCl9dmFyIGg9YS5wYXJzZUludCxpPW5hdmlnYXRvci51c2VyQWdlbnQsaj0hIWkubWF0Y2goL0ZpcmVmb3gvaSksaz0hIWkubWF0Y2goL0lFTW9iaWxlL2kpLGw9aj9cIi1tb3otXCI6az9cIi1tcy1cIjpcIi13ZWJraXQtXCIsbT1qP1wiTW96XCI6az9cIm1zXCI6XCJ3ZWJraXRcIixuPWZ1bmN0aW9uKCl7dmFyIGE9Yi5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLGM9YS5zdHlsZTtyZXR1cm4gYy5jc3NUZXh0PVwicG9zaXRpb246XCIrbCtcInN0aWNreTtwb3NpdGlvbjpzdGlja3k7XCIsLTEhPWMucG9zaXRpb24uaW5kZXhPZihcInN0aWNreVwiKX0oKTtnLnByb3RvdHlwZT17Y29uc3RydWN0b3I6Zyxpbml0OmZ1bmN0aW9uKCl7dmFyIGE9dGhpcyxiPWEuZWxlbWVudCxjPWIuc3R5bGU7Y1ttK1wiVHJhbnNmb3JtXCJdPVwidHJhbnNsYXRlWigwKVwiLGMudHJhbnNmb3JtPVwidHJhbnNsYXRlWigwKVwiLGEuX29yaWdpbkNzc1RleHQ9Yy5jc3NUZXh0LG4/KGMucG9zaXRpb249bCtcInN0aWNreVwiLGMucG9zaXRpb249XCJzdGlja3lcIixjLnRvcD1hLnRvcCtcInB4XCIpOihhLl9zaW11bGF0ZVN0aWNreSgpLGEuX2JpbmRSZXNpemUoKSl9LF9iaW5kUmVzaXplOmZ1bmN0aW9uKCl7dmFyIGI9dGhpcyxjPS9hbmRyb2lkL2dpLnRlc3QobmF2aWdhdG9yLmFwcFZlcnNpb24pLGQ9Yi5fcmVzaXplRXZlbnQ9XCJvbm9yaWVudGF0aW9uY2hhbmdlXCJpbiBhP1wib3JpZW50YXRpb25jaGFuZ2VcIjpcInJlc2l6ZVwiLGU9Yi5fcmVzaXplSGFuZGxlcj1mdW5jdGlvbigpe3NldFRpbWVvdXQoZnVuY3Rpb24oKXtiLnJlZnJlc2goKX0sYz8yMDA6MCl9O2EuYWRkRXZlbnRMaXN0ZW5lcihkLGUsITEpfSxyZWZyZXNoOmZ1bmN0aW9uKCl7dmFyIGE9dGhpcztufHwoYS5fZGV0YWNoKCksYS5fc2ltdWxhdGVTdGlja3koKSl9LF9hZGRQbGFjZWhvbGRlcjpmdW5jdGlvbihhKXt2YXIgYyxkPXRoaXMsZT1kLmVsZW1lbnQsZz1hLnBvc2l0aW9uO2lmKC0xIT1bXCJzdGF0aWNcIixcInJlbGF0aXZlXCJdLmluZGV4T2YoZykpe2M9ZC5fcGxhY2Vob2xkZXJFbGVtZW50PWIuY3JlYXRlRWxlbWVudChcImRpdlwiKTt2YXIgaT1oKGEud2lkdGgpK2goYS5tYXJnaW5MZWZ0KStoKGEubWFyZ2luUmlnaHQpLGo9aChhLmhlaWdodCk7XCJib3JkZXItYm94XCIhPWEuYm94U2l6aW5nJiYoaSs9aChhLmJvcmRlckxlZnRXaWR0aCkraChhLmJvcmRlclJpZ2h0V2lkdGgpK2goYS5wYWRkaW5nTGVmdCkraChhLnBhZGRpbmdSaWdodCksais9aChhLmJvcmRlclRvcFdpZHRoKStoKGEuYm9yZGVyQm90dG9tV2lkdGgpK2goYS5wYWRkaW5nVG9wKStoKGEucGFkZGluZ0JvdHRvbSkpLGMuc3R5bGUuY3NzVGV4dD1mKHtkaXNwbGF5Olwibm9uZVwiLHZpc2liaWxpdHk6XCJoaWRkZW5cIix3aWR0aDppK1wicHhcIixoZWlnaHQ6aitcInB4XCIsbWFyZ2luOjAsXCJtYXJnaW4tdG9wXCI6YS5tYXJnaW5Ub3AsXCJtYXJnaW4tYm90dG9tXCI6YS5tYXJnaW5Cb3R0b20sYm9yZGVyOjAscGFkZGluZzowLFwiZmxvYXRcIjphW1wiZmxvYXRcIl18fGEuY3NzRmxvYXR9KSxlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGMsZSl9cmV0dXJuIGN9LF9zaW11bGF0ZVN0aWNreTpmdW5jdGlvbigpe3ZhciBjPXRoaXMsZD1jLmVsZW1lbnQsZz1jLnRvcCxpPWQuc3R5bGUsaj1kLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLGs9Z2V0Q29tcHV0ZWRTdHlsZShkLFwiXCIpLGw9ZC5wYXJlbnROb2RlLG09Z2V0Q29tcHV0ZWRTdHlsZShsLFwiXCIpLG49Yy5fYWRkUGxhY2Vob2xkZXIoayksbz1jLndpdGhpblBhcmVudCxwPWMuX29yaWdpbkNzc1RleHQscT1qLnRvcC1nK2EucGFnZVlPZmZzZXQscj1sLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbS1oKG0ucGFkZGluZ0JvdHRvbSktaChtLmJvcmRlckJvdHRvbVdpZHRoKS1oKGsubWFyZ2luQm90dG9tKS1qLmhlaWdodC1nK2EucGFnZVlPZmZzZXQscz1wK2Yoe3Bvc2l0aW9uOlwiZml4ZWRcIix0b3A6ZytcInB4XCIsd2lkdGg6ay53aWR0aCxcIm1hcmdpbi10b3BcIjowfSksdD1wK2Yoe3Bvc2l0aW9uOlwiYWJzb2x1dGVcIix0b3A6citcInB4XCIsd2lkdGg6ay53aWR0aH0pLHU9MSx2PWMuX3Njcm9sbEhhbmRsZXI9ZShmdW5jdGlvbigpe3ZhciBiPWEucGFnZVlPZmZzZXQ7cT5iPzEhPXUmJihpLmNzc1RleHQ9cCxuJiYobi5zdHlsZS5kaXNwbGF5PVwibm9uZVwiKSx1PTEpOiFvJiZiPj1xfHxvJiZiPj1xJiZyPmI/MiE9dSYmKGkuY3NzVGV4dD1zLG4mJjMhPXUmJihuLnN0eWxlLmRpc3BsYXk9XCJibG9ja1wiKSx1PTIpOm8mJjMhPXUmJihpLmNzc1RleHQ9dCxuJiYyIT11JiYobi5zdHlsZS5kaXNwbGF5PVwiYmxvY2tcIiksdT0zKX0sMTAwKTtpZihhLmFkZEV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIix2LCExKSxhLnBhZ2VZT2Zmc2V0Pj1xKXt2YXIgdz1iLmNyZWF0ZUV2ZW50KFwiSFRNTEV2ZW50c1wiKTt3LmluaXRFdmVudChcInNjcm9sbFwiLCEwLCEwKSxhLmRpc3BhdGNoRXZlbnQodyl9fSxfZGV0YWNoOmZ1bmN0aW9uKCl7dmFyIGI9dGhpcyxjPWIuZWxlbWVudDtpZihjLnN0eWxlLmNzc1RleHQ9Yi5fb3JpZ2luQ3NzVGV4dCwhbil7dmFyIGQ9Yi5fcGxhY2Vob2xkZXJFbGVtZW50O2QmJmMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChkKSxhLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIixiLl9zY3JvbGxIYW5kbGVyLCExKX19LGRlc3Ryb3k6ZnVuY3Rpb24oKXt2YXIgYj10aGlzO2IuX2RldGFjaCgpO3ZhciBjPWIuZWxlbWVudC5zdHlsZTtjLnJlbW92ZVByb3BlcnR5KGwrXCJ0cmFuc2Zvcm1cIiksYy5yZW1vdmVQcm9wZXJ0eShcInRyYW5zZm9ybVwiKSxufHxhLnJlbW92ZUV2ZW50TGlzdGVuZXIoYi5fcmVzaXplRXZlbnQsYi5fcmVzaXplSGFuZGxlciwhMSl9fSxjLnN0aWNreT1nfSh3aW5kb3csZG9jdW1lbnQsd2luZG93LmxpYnx8KHdpbmRvdy5saWI9e30pKTs7bW9kdWxlLmV4cG9ydHMgPSB3aW5kb3cubGliWydzdGlja3knXTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9maXhlZHN0aWNreS9idWlsZC9zdGlja3kuY29tbW9uLmpzXG4gKiogbW9kdWxlIGlkID0gMjVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpXG5cbnZhciBfc2VuZGVyTWFwID0ge31cblxuZnVuY3Rpb24gU2VuZGVyKGluc3RhbmNlKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTZW5kZXIpKSB7XG4gICAgcmV0dXJuIG5ldyBTZW5kZXIoaW5zdGFuY2UpXG4gIH1cbiAgdGhpcy5pbnN0YW5jZUlkID0gaW5zdGFuY2UuaW5zdGFuY2VJZFxuICB0aGlzLndlZXhJbnN0YW5jZSA9IGluc3RhbmNlXG4gIF9zZW5kZXJNYXBbdGhpcy5pbnN0YW5jZUlkXSA9IHRoaXNcbn1cblxuZnVuY3Rpb24gX3NlbmQoaW5zdGFuY2VJZCwgbXNnKSB7XG4gIGNhbGxKUyhpbnN0YW5jZUlkLCBbbXNnXSlcbn1cblxuU2VuZGVyLmdldFNlbmRlciA9IGZ1bmN0aW9uIChpbnN0YW5jZUlkKSB7XG4gIHJldHVybiBfc2VuZGVyTWFwW2luc3RhbmNlSWRdXG59XG5cblNlbmRlci5wcm90b3R5cGUgPSB7XG5cbiAgLy8gcGVyZm9ybSBhIGNhbGxiYWNrIHRvIGpzZnJhbWV3b3JrLlxuICBwZXJmb3JtQ2FsbGJhY2s6IGZ1bmN0aW9uIChjYWxsYmFja0lkLCBkYXRhLCBrZWVwQWxpdmUpIHtcbiAgICB2YXIgYXJncyA9IFtjYWxsYmFja0lkXVxuICAgIGRhdGEgJiYgYXJncy5wdXNoKGRhdGEpXG4gICAga2VlcEFsaXZlICYmIGFyZ3MucHVzaChrZWVwQWxpdmUpXG4gICAgX3NlbmQodGhpcy5pbnN0YW5jZUlkLCB7XG4gICAgICBtZXRob2Q6ICdjYWxsYmFjaycsXG4gICAgICBhcmdzOiBhcmdzXG4gICAgfSlcbiAgfSxcblxuICBmaXJlRXZlbnQ6IGZ1bmN0aW9uIChyZWYsIHR5cGUsIGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50Ll9hbHJlYWR5RmlyZWQpIHtcbiAgICAgIC8vIHN0b3AgYnViYmxpbmcgdXAgaW4gdmlydHVhbCBkb20gdHJlZS5cbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvLyBkbyBub3QgcHJldmVudCBkZWZhdWx0LCBvdGhlcndpc2UgdGhlIHRvdWNoc3RhcnRcbiAgICAvLyBldmVudCB3aWxsIG5vIGxvbmdlciB0cmlnZ2VyIGEgY2xpY2sgZXZlbnRcbiAgICBldmVudC5fYWxyZWFkeUZpcmVkID0gdHJ1ZVxuICAgIHZhciBldnQgPSB1dGlscy5leHRlbmQoe30sIGV2ZW50KVxuICAgIC8vIFRoZSBldmVudC50YXJnZXQgbXVzdCBiZSB0aGUgc3RhbmRhcmQgZXZlbnQncyBjdXJyZW50VGFyZ2V0LlxuICAgIGV2dC50YXJnZXQgPSBldnQuY3VycmVudFRhcmdldFxuICAgIGV2dC52YWx1ZSA9IGV2ZW50LnRhcmdldC52YWx1ZVxuICAgIGV2dC50aW1lc3RhbXAgPSBEYXRlLm5vdygpXG4gICAgX3NlbmQodGhpcy5pbnN0YW5jZUlkLCB7XG4gICAgICBtZXRob2Q6ICdmaXJlRXZlbnQnLFxuICAgICAgYXJnczogW3JlZiwgdHlwZSwgZXZ0XVxuICAgIH0pXG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbmRlclxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvYnJpZGdlL3NlbmRlci5qc1xuICoqIG1vZHVsZSBpZCA9IDI2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpXG52YXIgcHJvdG9jb2wgPSByZXF1aXJlKCcuLi9wcm90b2NvbCcpXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpXG52YXIgRnJhbWVVcGRhdGVyID0gcmVxdWlyZSgnLi4vZnJhbWVVcGRhdGVyJylcbnZhciBTZW5kZXIgPSByZXF1aXJlKCcuL3NlbmRlcicpXG5cbnZhciBjYWxsUXVldWUgPSBbXVxuLy8gTmVlZCBhIHRhc2sgY291bnRlcj9cbi8vIFdoZW4gRnJhbWVVcGRhdGVyIGlzIG5vdCBhY3RpdmF0ZWQsIHRhc2tzIHdpbGwgbm90IGJlIHB1c2hcbi8vIGludG8gY2FsbFF1ZXVlIGFuZCB0aGVyZSB3aWxsIGJlIG5vIHRyYWNlIGZvciBzaXR1YXRpb24gb2Zcbi8vIGV4ZWN1dGlvbiBvZiB0YXNrcy5cblxuLy8gZ2l2ZSAxMG1zIGZvciBjYWxsIGhhbmRsaW5nLCBhbmQgcmVzdCA2bXMgZm9yIG90aGVyc1xudmFyIE1BWF9USU1FX0ZPUl9FQUNIX0ZSQU1FID0gMTBcblxuLy8gY2FsbE5hdGl2ZToganNGcmFtZXdvcmsgd2lsbCBjYWxsIHRoaXMgbWV0aG9kIHRvIHRhbGsgdG9cbi8vIHRoaXMgcmVuZGVyZXIuXG4vLyBwYXJhbXM6XG4vLyAgLSBpbnN0YW5jZUlkOiBzdHJpbmcuXG4vLyAgLSB0YXNrczogYXJyYXkgb2Ygb2JqZWN0LlxuLy8gIC0gY2FsbGJhY2tJZDogbnVtYmVyLlxuZnVuY3Rpb24gY2FsbE5hdGl2ZShpbnN0YW5jZUlkLCB0YXNrcywgY2FsbGJhY2tJZCkge1xuICB2YXIgY2FsbHMgPSBbXVxuICBpZiAodHlwZW9mIHRhc2tzID09PSAnc3RyaW5nJykge1xuICAgIHRyeSB7XG4gICAgICBjYWxscyA9IEpTT04ucGFyc2UodGFza3MpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignaW52YWxpZCB0YXNrczonLCB0YXNrcylcbiAgICB9XG4gIH0gZWxzZSBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRhc2tzKS5zbGljZSg4LCAtMSkgPT09ICdBcnJheScpIHtcbiAgICBjYWxscyA9IHRhc2tzXG4gIH1cbiAgdmFyIGxlbiA9IGNhbGxzLmxlbmd0aFxuICBjYWxsc1tsZW4gLSAxXS5jYWxsYmFja0lkID0gKCFjYWxsYmFja0lkICYmIGNhbGxiYWNrSWQgIT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IC0xXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGNhbGxiYWNrSWRcbiAgLy8gVG8gc29sdmUgdGhlIHByb2JsZW0gb2YgY2FsbGFwcCwgdGhlIHR3by13YXkgdGltZSBsb29wIHJ1bGUgbXVzdFxuICAvLyBiZSByZXBsYWNlZCBieSBjYWxsaW5nIGRpcmVjdGx5IGV4Y2VwdCB0aGUgc2l0dWF0aW9uIG9mIHBhZ2UgbG9hZGluZy5cbiAgLy8gMjAxNS0xMS0wM1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKEZyYW1lVXBkYXRlci5pc0FjdGl2ZSgpKSB7XG4gICAgICBjYWxsUXVldWUucHVzaCh7XG4gICAgICAgIGluc3RhbmNlSWQ6IGluc3RhbmNlSWQsXG4gICAgICAgIGNhbGw6IGNhbGxzW2ldXG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHByb2Nlc3NDYWxsKGluc3RhbmNlSWQsIGNhbGxzW2ldKVxuICAgIH1cbiAgfVxuXG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NDYWxsUXVldWUoKSB7XG4gIHZhciBsZW4gPSBjYWxsUXVldWUubGVuZ3RoXG4gIGlmIChsZW4gPT09IDApIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgc3RhcnQgPSBEYXRlLm5vdygpXG4gIHZhciBlbGFwc2VkID0gMFxuXG4gIHdoaWxlICgtLWxlbiA+PSAwICYmIGVsYXBzZWQgPCBNQVhfVElNRV9GT1JfRUFDSF9GUkFNRSkge1xuICAgIHZhciBjYWxsT2JqID0gY2FsbFF1ZXVlLnNoaWZ0KClcbiAgICBwcm9jZXNzQ2FsbChjYWxsT2JqLmluc3RhbmNlSWQsIGNhbGxPYmouY2FsbClcbiAgICBlbGFwc2VkID0gRGF0ZS5ub3coKSAtIHN0YXJ0XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0NhbGwoaW5zdGFuY2VJZCwgY2FsbCkge1xuICB2YXIgbW9kdWxlTmFtZSA9IGNhbGwubW9kdWxlXG4gIHZhciBtZXRob2ROYW1lID0gY2FsbC5tZXRob2RcbiAgdmFyIG1vZHVsZSwgbWV0aG9kXG4gIHZhciBhcmdzID0gY2FsbC5hcmdzIHx8IGNhbGwuYXJndW1lbnRzIHx8IFtdXG5cbiAgaWYgKCEobW9kdWxlID0gcHJvdG9jb2wuYXBpTW9kdWxlW21vZHVsZU5hbWVdKSkge1xuICAgIHJldHVyblxuICB9XG4gIGlmICghKG1ldGhvZCA9IG1vZHVsZVttZXRob2ROYW1lXSkpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIG1ldGhvZC5hcHBseShwcm90b2NvbC5nZXRXZWV4SW5zdGFuY2UoaW5zdGFuY2VJZCksIGFyZ3MpXG5cbiAgdmFyIGNhbGxiYWNrSWQgPSBjYWxsLmNhbGxiYWNrSWRcbiAgaWYgKChjYWxsYmFja0lkXG4gICAgfHwgY2FsbGJhY2tJZCA9PT0gMFxuICAgIHx8IGNhbGxiYWNrSWQgPT09ICcwJylcbiAgICAmJiBjYWxsYmFja0lkICE9PSAnLTEnXG4gICAgJiYgY2FsbGJhY2tJZCAhPT0gLTEpIHtcbiAgICBwZXJmb3JtTmV4dFRpY2soaW5zdGFuY2VJZCwgY2FsbGJhY2tJZClcbiAgfVxufVxuXG5mdW5jdGlvbiBwZXJmb3JtTmV4dFRpY2soaW5zdGFuY2VJZCwgY2FsbGJhY2tJZCkge1xuICBTZW5kZXIuZ2V0U2VuZGVyKGluc3RhbmNlSWQpLnBlcmZvcm1DYWxsYmFjayhjYWxsYmFja0lkKVxufVxuXG5mdW5jdGlvbiBuYXRpdmVMb2coKSB7XG4gIGlmIChjb25maWcuZGVidWcpIHtcbiAgICBpZiAoYXJndW1lbnRzWzBdLm1hdGNoKC9ecGVyZi8pKSB7XG4gICAgICBjb25zb2xlLmluZm8uYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnNvbGUuZGVidWcuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxuICB9XG59XG5cbmZ1bmN0aW9uIGV4cG9ydHNCcmlkZ2VNZXRob2RzVG9HbG9iYWwoKSB7XG4gIGdsb2JhbC5jYWxsTmF0aXZlID0gY2FsbE5hdGl2ZVxuICBnbG9iYWwubmF0aXZlTG9nID0gbmF0aXZlTG9nXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGluaXQ6IGZ1bmN0aW9uICgpIHtcblxuICAgIC8vIHByb2Nlc3MgY2FsbFF1ZXVlIGV2ZXJ5IDE2IG1pbGxpc2Vjb25kcy5cbiAgICBGcmFtZVVwZGF0ZXIuYWRkVXBkYXRlT2JzZXJ2ZXIocHJvY2Vzc0NhbGxRdWV1ZSlcbiAgICBGcmFtZVVwZGF0ZXIuc3RhcnQoKVxuXG4gICAgLy8gZXhwb3J0cyBtZXRob2RzIHRvIGdsb2JhbCh3aW5kb3cpLlxuICAgIGV4cG9ydHNCcmlkZ2VNZXRob2RzVG9HbG9iYWwoKVxuICB9XG5cbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvYnJpZGdlL3JlY2VpdmVyLmpzXG4gKiogbW9kdWxlIGlkID0gMjdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBSb290Q29tcG9uZW50ID0gcmVxdWlyZSgnLi9yb290JylcbnZhciBDb250YWluZXIgPSByZXF1aXJlKCcuL2NvbnRhaW5lcicpXG52YXIgSW1hZ2UgPSByZXF1aXJlKCcuL2ltYWdlJylcbnZhciBUZXh0ID0gcmVxdWlyZSgnLi90ZXh0JylcbnZhciBWbGlzdCA9IHJlcXVpcmUoJy4vdmxpc3QnKVxudmFyIEhsaXN0ID0gcmVxdWlyZSgnLi9obGlzdCcpXG52YXIgQ291bnRkb3duID0gcmVxdWlyZSgnLi9jb3VudGRvd24nKVxudmFyIE1hcnF1ZWUgPSByZXF1aXJlKCcuL21hcnF1ZWUnKVxudmFyIFNsaWRlciA9IHJlcXVpcmUoJy4vc2xpZGVyJylcbnZhciBJbmRpY2F0b3IgPSByZXF1aXJlKCcuL2luZGljYXRvcicpXG52YXIgVGFiaGVhZGVyID0gcmVxdWlyZSgnLi90YWJoZWFkZXInKVxudmFyIFNjcm9sbGVyID0gcmVxdWlyZSgnLi9zY3JvbGxlcicpXG52YXIgSW5wdXQgPSByZXF1aXJlKCcuL2lucHV0JylcbnZhciBTZWxlY3QgPSByZXF1aXJlKCcuL3NlbGVjdCcpXG52YXIgRGF0ZXBpY2tlciA9IHJlcXVpcmUoJy4vZGF0ZXBpY2tlcicpXG52YXIgVGltZXBpY2tlciA9IHJlcXVpcmUoJy4vdGltZXBpY2tlcicpXG52YXIgVmlkZW8gPSByZXF1aXJlKCcuL3ZpZGVvJylcbnZhciBTd2l0Y2ggPSByZXF1aXJlKCcuL3N3aXRjaCcpXG52YXIgQSA9IHJlcXVpcmUoJy4vYScpXG52YXIgRW1iZWQgPSByZXF1aXJlKCcuL2VtYmVkJylcbnZhciBSZWZyZXNoID0gcmVxdWlyZSgnLi9yZWZyZXNoJylcbnZhciBMb2FkaW5nID0gcmVxdWlyZSgnLi9sb2FkaW5nJylcbnZhciBTcGlubmVyID0gcmVxdWlyZSgnLi9zcGlubmVyJylcbnZhciBXZWIgPSByZXF1aXJlKCcuL3dlYicpXG5cbnZhciBjb21wb25lbnRzID0ge1xuICBpbml0OiBmdW5jdGlvbiAoV2VleCkge1xuICAgIFdlZXgucmVnaXN0ZXJDb21wb25lbnQoJ3Jvb3QnLCBSb290Q29tcG9uZW50KVxuICAgIFdlZXgucmVnaXN0ZXJDb21wb25lbnQoJ2NvbnRhaW5lcicsIENvbnRhaW5lcilcbiAgICBXZWV4LnJlZ2lzdGVyQ29tcG9uZW50KCdkaXYnLCBDb250YWluZXIpXG4gICAgV2VleC5yZWdpc3RlckNvbXBvbmVudCgnaW1hZ2UnLCBJbWFnZSlcbiAgICBXZWV4LnJlZ2lzdGVyQ29tcG9uZW50KCd0ZXh0JywgVGV4dClcbiAgICBXZWV4LnJlZ2lzdGVyQ29tcG9uZW50KCdsaXN0JywgVmxpc3QpXG4gICAgV2VleC5yZWdpc3RlckNvbXBvbmVudCgndmxpc3QnLCBWbGlzdClcbiAgICBXZWV4LnJlZ2lzdGVyQ29tcG9uZW50KCdobGlzdCcsIEhsaXN0KVxuICAgIFdlZXgucmVnaXN0ZXJDb21wb25lbnQoJ2NvdW50ZG93bicsIENvdW50ZG93bilcbiAgICBXZWV4LnJlZ2lzdGVyQ29tcG9uZW50KCdtYXJxdWVlJywgTWFycXVlZSlcbiAgICBXZWV4LnJlZ2lzdGVyQ29tcG9uZW50KCdzbGlkZXInLCBTbGlkZXIpXG4gICAgV2VleC5yZWdpc3RlckNvbXBvbmVudCgnaW5kaWNhdG9yJywgSW5kaWNhdG9yKVxuICAgIFdlZXgucmVnaXN0ZXJDb21wb25lbnQoJ3RhYmhlYWRlcicsIFRhYmhlYWRlcilcbiAgICBXZWV4LnJlZ2lzdGVyQ29tcG9uZW50KCdzY3JvbGxlcicsIFNjcm9sbGVyKVxuICAgIFdlZXgucmVnaXN0ZXJDb21wb25lbnQoJ2lucHV0JywgSW5wdXQpXG4gICAgV2VleC5yZWdpc3RlckNvbXBvbmVudCgnc2VsZWN0JywgU2VsZWN0KVxuICAgIFdlZXgucmVnaXN0ZXJDb21wb25lbnQoJ2RhdGVwaWNrZXInLCBEYXRlcGlja2VyKVxuICAgIFdlZXgucmVnaXN0ZXJDb21wb25lbnQoJ3RpbWVwaWNrZXInLCBUaW1lcGlja2VyKVxuICAgIFdlZXgucmVnaXN0ZXJDb21wb25lbnQoJ3ZpZGVvJywgVmlkZW8pXG4gICAgV2VleC5yZWdpc3RlckNvbXBvbmVudCgnc3dpdGNoJywgU3dpdGNoKVxuICAgIFdlZXgucmVnaXN0ZXJDb21wb25lbnQoJ2EnLCBBKVxuICAgIFdlZXgucmVnaXN0ZXJDb21wb25lbnQoJ2VtYmVkJywgRW1iZWQpXG4gICAgV2VleC5yZWdpc3RlckNvbXBvbmVudCgncmVmcmVzaCcsIFJlZnJlc2gpXG4gICAgV2VleC5yZWdpc3RlckNvbXBvbmVudCgnbG9hZGluZycsIExvYWRpbmcpXG4gICAgV2VleC5yZWdpc3RlckNvbXBvbmVudCgnc3Bpbm5lcicsIFNwaW5uZXIpXG4gICAgV2VleC5yZWdpc3RlckNvbXBvbmVudCgnbG9hZGluZy1pbmRpY2F0b3InLCBTcGlubmVyKVxuICAgIFdlZXgucmVnaXN0ZXJDb21wb25lbnQoJ3dlYicsIFdlYilcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbXBvbmVudHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvY29tcG9uZW50cy9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDI4XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIENvbXBvbmVudE1hbmFnZXIgPSByZXF1aXJlKCcuLi9jb21wb25lbnRNYW5hZ2VyJylcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKCcuL2NvbXBvbmVudCcpXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpXG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi4vbG9nZ2VyJylcblxudmFyIHJvb3RDYW5kaWRhdGVzID0gWydkaXYnLCAnbGlzdCcsICd2bGlzdCcsICdzY3JvbGxlciddXG5cbmZ1bmN0aW9uIFJvb3RDb21wb25lbnQoZGF0YSwgbm9kZVR5cGUpIHtcbiAgdmFyIGlkID0gZGF0YS5yb290SWQgKyAnLXJvb3QnXG4gIHZhciBjb21wb25lbnRNYW5hZ2VyID0gQ29tcG9uZW50TWFuYWdlci5nZXRJbnN0YW5jZShkYXRhLmluc3RhbmNlSWQpXG5cbiAgLy8gSWYgbm9kZVR5cGUgaXMgaW4gdGhlIGRvd25ncmFkZXMgbWFwLCBqdXN0IGlnbm9yZSBpdCBhbmRcbiAgLy8gcmVwbGFjZSBpdCB3aXRoIGEgZGl2IGNvbXBvbmVudC5cbiAgdmFyIGRvd25ncmFkZXMgPSBjb21wb25lbnRNYW5hZ2VyLndlZXhJbnN0YW5jZS5kb3duZ3JhZGVzXG4gIHRoaXMuZGF0YSA9IGRhdGFcblxuICAvLyBJbiBzb21lIHNpdHVhdGlvbiB0aGUgcm9vdCBjb21wb25lbnQgc2hvdWxkIGJlIGltcGxlbWVudGVkIGFzXG4gIC8vIGl0cyBvd24gdHlwZSwgb3RoZXJ3aXNlIGl0IGhhcyB0byBiZSBhIGRpdiBjb21wb25lbnQgYXMgYSByb290LlxuICBpZiAoIW5vZGVUeXBlKSB7XG4gICAgbm9kZVR5cGUgPSAnZGl2J1xuICB9IGVsc2UgaWYgKHJvb3RDYW5kaWRhdGVzLmluZGV4T2Yobm9kZVR5cGUpID09PSAtMSkge1xuICAgIGxvZ2dlci53YXJuKCd0aGUgcm9vdCBjb21wb25lbnQgdHlwZSBcXCcnICsgbm9kZVR5cGUgKyAnXFwnIGlzIG5vdCBvbmUgb2YgJ1xuICAgICAgKyAndGhlIHR5cGVzIGluIFsnICsgcm9vdENhbmRpZGF0ZXMgKyAnXSBsaXN0LiBJdCBpcyBhdXRvIGRvd25ncmFkZWQgJ1xuICAgICAgKyAndG8gXFwnZGl2XFwnLicpXG4gICAgbm9kZVR5cGUgPSAnZGl2J1xuICB9IGVsc2UgaWYgKGRvd25ncmFkZXNbbm9kZVR5cGVdKSB7XG4gICAgbG9nZ2VyLndhcm4oJ1RoYW5rcyB0byB0aGUgZG93bmdyYWRlIGZsYWdzIGZvciBbJ1xuICAgICAgKyBPYmplY3Qua2V5cyhkb3duZ3JhZGVzKVxuICAgICAgKyAnXSwgdGhlIHJvb3QgY29tcG9uZW50IHR5cGUgXFwnJyArIG5vZGVUeXBlXG4gICAgICArICdcXCcgaXMgYXV0byBkb3duZ3JhZGVkIHRvIFxcJ2RpdlxcJy4nKVxuICAgIG5vZGVUeXBlID0gJ2RpdidcbiAgfSBlbHNlIHtcbiAgICAvLyBJZiB0aGUgcm9vdCBjb21wb25lbnQgaXMgbm90IGEgZW1iZWQgZWxlbWVudCBpbiBhIHdlYnBhZ2UsIHRoZW5cbiAgICAvLyB0aGUgaHRtbCBhbmQgYm9keSBoZWlnaHQgc2hvdWxkIGJlIGZpeGVkIHRvIHRoZSBtYXggaGVpZ2h0XG4gICAgLy8gb2Ygdmlld3BvcnQuXG4gICAgaWYgKCFjb21wb25lbnRNYW5hZ2VyLndlZXhJbnN0YW5jZS5lbWJlZCkge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3JlbmRlcmVuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5kZXRlY3RSb290SGVpZ2h0KClcbiAgICAgIH0uYmluZCh0aGlzKSlcbiAgICB9XG4gICAgaWYgKG5vZGVUeXBlICE9PSAnZGl2Jykge1xuICAgICAgbG9nZ2VyLndhcm4oJ3RoZSByb290IGNvbXBvbmVudCB0eXBlIFxcJycgKyBub2RlVHlwZSArICdcXCcgbWF5IGhhdmUgJ1xuICAgICAgICArICdzb21lIHBlcmZvcm1hbmNlIGlzc3VlIG9uIHNvbWUgb2YgdGhlIGFuZHJvaWQgZGV2aWNlcyB3aGVuIHRoZXJlICdcbiAgICAgICAgKyAnaXMgYSBodWdlIGFtb3VudCBvZiBkb20gZWxlbWVudHMuIFRyeSB0byBhZGQgZG93bmdyYWRlICdcbiAgICAgICAgKyAnZmxhZ3MgYnkgYWRkaW5nIHBhcmFtIFxcJ2Rvd25ncmFkZV8nICsgbm9kZVR5cGUgKyAnPXRydWVcXCcgaW4gdGhlICdcbiAgICAgICAgKyAndXJsIG9yIHNldHRpbmcgZG93bmdyYWRlIGNvbmZpZyB0byBhIGFycmF5IGNvbnRhaW5zIFxcJycgKyBub2RlVHlwZVxuICAgICAgICArICdcXCcgaW4gdGhlIFxcJ3dlZXguaW5pdFxcJyBmdW5jdGlvbi4gVGhpcyB3aWxsIGRvd25ncmFkZSB0aGUgcm9vdCBcXCcnXG4gICAgICAgICsgbm9kZVR5cGUgKyAnXFwnIHRvIGEgXFwnZGl2XFwnLCBhbmQgbWF5IGVsZXZhdGUgdGhlIGxldmVsIG9mICdcbiAgICAgICAgKyAncGVyZm9ybWFuY2UsIGFsdGhvdWdoIGl0IGhhcyBzb21lIG90aGVyIGlzc3Vlcy4nKVxuICAgIH1cbiAgICAhdGhpcy5kYXRhLnN0eWxlLmhlaWdodCAmJiAodGhpcy5kYXRhLnN0eWxlLmhlaWdodCA9ICcxMDAlJylcbiAgfVxuXG4gIGRhdGEudHlwZSA9IG5vZGVUeXBlXG4gIHZhciBjbXAgPSBjb21wb25lbnRNYW5hZ2VyLmNyZWF0ZUVsZW1lbnQoZGF0YSlcbiAgY21wLm5vZGUuaWQgPSBpZFxuICByZXR1cm4gY21wXG59XG5cblJvb3RDb21wb25lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDb21wb25lbnQucHJvdG90eXBlKVxuXG5Sb290Q29tcG9uZW50LnByb3RvdHlwZS5kZXRlY3RSb290SGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcm9vdFF1ZXJ5ID0gJyMnICsgdGhpcy5nZXRDb21wb25lbnRNYW5hZ2VyKCkud2VleEluc3RhbmNlLnJvb3RJZFxuICB2YXIgcm9vdENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdFF1ZXJ5KSB8fCBkb2N1bWVudC5ib2R5XG4gIHZhciBoZWlnaHQgPSByb290Q29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodFxuICBpZiAoaGVpZ2h0ID4gd2luZG93LmlubmVySGVpZ2h0KSB7XG4gICAgbG9nZ2VyLndhcm4oW1xuICAgICAgJ2ZvciBzY3JvbGxhYmxlIHJvb3QgbGlrZSBcXCdsaXN0XFwnIGFuZCBcXCdzY3JvbGxlclxcJywgdGhlIGhlaWdodCBvZiAnLFxuICAgICAgJ3RoZSByb290IGNvbnRhaW5lciBtdXN0IGJlIGEgdXNlci1zcGVjaWZpZWQgdmFsdWUuIE90aGVyd2lzZSAnLFxuICAgICAgJ3RoZSBzY3JvbGxhYmxlIGVsZW1lbnQgbWF5IG5vdCBiZSBhYmxlIHRvIHdvcmsgY29ycmVjdGx5LiAnLFxuICAgICAgJ0N1cnJlbnQgaGVpZ2h0IG9mIHRoZSByb290IGVsZW1lbnQgXFwnJyArIHJvb3RRdWVyeSArICdcXCcgaXMgJyxcbiAgICAgIGhlaWdodCArICdweCwgYW5kIG1vc3RseSBpdHMgaGVpZ2h0IHNob3VsZCBiZSBsZXNzIHRoYW4gdGhlICcsXG4gICAgICAndmlld3BvcnRcXCdzIGhlaWdodCAnICsgd2luZG93LmlubmVySGVpZ2h0ICsgJ3B4LiBQbGVhc2UgJyxcbiAgICAgICdtYWtlIHN1cmUgdGhlIGhlaWdodCBpcyBjb3JyZWN0LidcbiAgICAgIF0uam9pbignJykpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSb290Q29tcG9uZW50XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvcm9vdC5qc1xuICoqIG1vZHVsZSBpZCA9IDI5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKVxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpXG5cbnZhciBfaW5pdGlhbGl6ZWQgPSBmYWxzZVxuXG52YXIgbG9nZ2VyID0ge1xuICBsb2c6IGZ1bmN0aW9uICgpIHt9LFxuICB3YXJuOiBmdW5jdGlvbiAoKSB7fSxcbiAgZXJyb3I6IGZ1bmN0aW9uICgpIHt9XG59XG5cbmZ1bmN0aW9uIGhpamFjayhrKSB7XG4gIGlmICh1dGlscy5pc0FycmF5KGspKSB7XG4gICAgay5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGhpamFjayhrZXkpXG4gICAgfSlcbiAgfSBlbHNlIHtcbiAgICBpZiAoY29uc29sZVtrXSkge1xuICAgICAgbG9nZ2VyW2tdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlW2tdLmFwcGx5KFxuICAgICAgICAgIGNvbnNvbGUsXG4gICAgICAgICAgWydbaDUtcmVuZGVyXSddLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKVxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmxvZ2dlci5pbml0ID0gZnVuY3Rpb24gKCkge1xuICBpZiAoX2luaXRpYWxpemVkKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgX2luaXRpYWxpemVkID0gdHJ1ZVxuICBpZiAoY29uZmlnLmRlYnVnICYmIGNvbnNvbGUpIHtcbiAgICBoaWphY2soWydsb2cnLCAnd2FybicsICdlcnJvciddKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbG9nZ2VyXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9sb2dnZXIuanNcbiAqKiBtb2R1bGUgaWQgPSAzMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnJlcXVpcmUoJy4uL3N0eWxlcy9jb250YWluZXIuY3NzJylcblxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoJy4vY29tcG9uZW50JylcblxuZnVuY3Rpb24gQ29udGFpbmVyIChkYXRhLCBub2RlVHlwZSkge1xuICBDb21wb25lbnQuY2FsbCh0aGlzLCBkYXRhLCBub2RlVHlwZSlcbiAgdGhpcy5ub2RlLmNsYXNzTGlzdC5hZGQoJ3dlZXgtY29udGFpbmVyJylcbn1cblxuQ29udGFpbmVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ29tcG9uZW50LnByb3RvdHlwZSlcblxubW9kdWxlLmV4cG9ydHMgPSBDb250YWluZXJcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvY29tcG9uZW50cy9jb250YWluZXIuanNcbiAqKiBtb2R1bGUgaWQgPSAzMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jb250YWluZXIuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL2NvbnRhaW5lci5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jb250YWluZXIuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3N0eWxlcy9jb250YWluZXIuY3NzXG4gKiogbW9kdWxlIGlkID0gMzJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLndlZXgtY29udGFpbmVyIHtcXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICBkaXNwbGF5OiAtd2Via2l0LWJveDtcXG4gIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcXG4gIGRpc3BsYXk6IGZsZXg7XFxuICAtd2Via2l0LWJveC1vcmllbnQ6IHZlcnRpY2FsO1xcbiAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG4gIGJvcmRlcjogMCBzb2xpZCBibGFjaztcXG4gIG1hcmdpbjogMDtcXG4gIHBhZGRpbmc6IDA7XFxufVxcblxcbi53ZWV4LWVsZW1lbnQge1xcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL3NyYy9zdHlsZXMvY29udGFpbmVyLmNzc1xuICoqIG1vZHVsZSBpZCA9IDMzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIEF0b21pYyA9IHJlcXVpcmUoJy4vYXRvbWljJylcbnZhciBMYXp5TG9hZCA9IHJlcXVpcmUoJy4uL2xhenlMb2FkJylcbnZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcnKVxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKVxuXG5yZXF1aXJlKCcuLi9zdHlsZXMvaW1hZ2UuY3NzJylcblxudmFyIERFRkFVTFRfU0laRSA9IDIwMFxudmFyIFJFU0laRV9NT0RFUyA9IFsnc3RyZXRjaCcsICdjb3ZlcicsICdjb250YWluJ11cbnZhciBERUZBVUxUX1JFU0laRV9NT0RFID0gJ3N0cmV0Y2gnXG5cbi8qKlxuICogcmVzaXplOiAnY292ZXInIHwgJ2NvbnRhaW4nIHwgJ3N0cmV0Y2gnLCBkZWZhdWx0IGlzICdzdHJldGNoJ1xuICogc3JjOiB1cmxcbiAqL1xuXG5mdW5jdGlvbiBJbWFnZSAoZGF0YSkge1xuICB0aGlzLnJlc2l6ZSA9IERFRkFVTFRfUkVTSVpFX01PREVcbiAgQXRvbWljLmNhbGwodGhpcywgZGF0YSlcbn1cblxuSW1hZ2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBdG9taWMucHJvdG90eXBlKVxuXG5JbWFnZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIG5vZGUuY2xhc3NMaXN0LmFkZCgnd2VleC1pbWcnKVxuICByZXR1cm4gbm9kZVxufVxuXG5JbWFnZS5wcm90b3R5cGUuYXR0ciA9IHtcbiAgc3JjOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgaWYgKCF0aGlzLnNyYykge1xuICAgICAgdGhpcy5zcmMgPSBsaWIuaW1nLmRlZmF1bHRTcmNcbiAgICAgIHRoaXMubm9kZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAndXJsKCcgKyB0aGlzLnNyYyArICcpJ1xuICAgIH1cbiAgICBMYXp5TG9hZC5tYWtlSW1hZ2VMYXp5KHRoaXMubm9kZSwgdmFsKVxuICB9LFxuXG4gIHJlc2l6ZTogZnVuY3Rpb24gKHZhbCkge1xuICAgIGlmIChSRVNJWkVfTU9ERVMuaW5kZXhPZih2YWwpID09PSAtMSkge1xuICAgICAgdmFsID0gJ3N0cmV0Y2gnXG4gICAgfVxuICAgIHRoaXMubm9kZS5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9IHZhbCA9PT0gJ3N0cmV0Y2gnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICcxMDAlIDEwMCUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHZhbFxuICB9XG59XG5cbkltYWdlLnByb3RvdHlwZS5zdHlsZSA9IHV0aWxzLmV4dGVuZChPYmplY3QuY3JlYXRlKEF0b21pYy5wcm90b3R5cGUuc3R5bGUpLCB7XG4gIHdpZHRoOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgdmFsID0gcGFyc2VGbG9hdCh2YWwpICogdGhpcy5kYXRhLnNjYWxlXG4gICAgaWYgKHZhbCA8IDAgfHwgdmFsICE9PSB2YWwpIHtcbiAgICAgIHZhbCA9IERFRkFVTFRfU0laRVxuICAgIH1cbiAgICB0aGlzLm5vZGUuc3R5bGUud2lkdGggPSB2YWwgKyAncHgnXG4gIH0sXG5cbiAgaGVpZ2h0OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgdmFsID0gcGFyc2VGbG9hdCh2YWwpICogdGhpcy5kYXRhLnNjYWxlXG4gICAgaWYgKHZhbCA8IDAgfHwgdmFsICE9PSB2YWwpIHtcbiAgICAgIHZhbCA9IERFRkFVTFRfU0laRVxuICAgIH1cbiAgICB0aGlzLm5vZGUuc3R5bGUuaGVpZ2h0ID0gdmFsICsgJ3B4J1xuICB9XG59KVxuXG5JbWFnZS5wcm90b3R5cGUuY2xlYXJBdHRyID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLnNyYyA9ICcnXG4gIHRoaXMubm9kZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAnJ1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvaW1hZ2UuanNcbiAqKiBtb2R1bGUgaWQgPSAzNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKCcuL2NvbXBvbmVudCcpXG5cbi8vIENvbXBvbmVudCB3aGljaCBjYW4gaGF2ZSBubyBzdWJjb21wb25lbnRzLlxuLy8gVGhpcyBjb21wb25lbnQgc2hvdWxkIG5vdCBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHksIHNpbmNlXG4vLyBpdCBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIGFzIGEgYmFzZSBjbGFzcyB0byBleHRlbmQgZnJvbS5cbmZ1bmN0aW9uIEF0b21pYyAoZGF0YSkge1xuICBDb21wb25lbnQuY2FsbCh0aGlzLCBkYXRhKVxufVxuXG5BdG9taWMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDb21wb25lbnQucHJvdG90eXBlKVxuXG5BdG9taWMucHJvdG90eXBlLmFwcGVuZENoaWxkID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgLy8gZG8gbm90aGluZ1xuICByZXR1cm5cbn1cblxuQXRvbWljLnByb3RvdHlwZS5pbnNlcnRCZWZvcmUgPSBmdW5jdGlvbiAoY2hpbGQsIGJlZm9yZSkge1xuICAvLyBkbyBub3RoaW5nXG4gIHJldHVyblxufVxuXG5BdG9taWMucHJvdG90eXBlLnJlbW92ZUNoaWxkID0gZnVuY3Rpb24gKGNoaWxkKSB7XG4gIC8vIGRvIG5vdGhpbmdcbiAgcmV0dXJuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXRvbWljXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvYXRvbWljLmpzXG4gKiogbW9kdWxlIGlkID0gMzVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vaW1hZ2UuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL2ltYWdlLmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL2ltYWdlLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9zdHlsZXMvaW1hZ2UuY3NzXG4gKiogbW9kdWxlIGlkID0gMzZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLndlZXgtaW1nIHtcXG5cXHRib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbiAgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDtcXG4gIGJhY2tncm91bmQtc2l6ZTogMTAwJSAxMDAlO1xcbiAgYmFja2dyb3VuZC1wb3NpdGlvbjogNTAlO1xcbiAgYm9yZGVyOiAwIHNvbGlkIGJsYWNrO1xcbn1cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vc3JjL3N0eWxlcy9pbWFnZS5jc3NcbiAqKiBtb2R1bGUgaWQgPSAzN1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBBdG9taWMgPSByZXF1aXJlKCcuL2NvbXBvbmVudCcpXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpXG5cbnZhciBERUZBVUxUX0ZPTlRfU0laRSA9IDMyXG52YXIgREVGQVVMVF9URVhUX09WRVJGTE9XID0gJ2VsbGlwc2lzJ1xuXG4vLyBhdHRyXG4vLyAgLSB2YWx1ZTogdGV4dCBjb250ZW50LlxuLy8gIC0gbGluZXM6IG1heGltdW0gbGluZXMgb2YgdGhlIHRleHQuXG5mdW5jdGlvbiBUZXh0IChkYXRhKSB7XG4gIEF0b21pYy5jYWxsKHRoaXMsIGRhdGEpXG59XG5cblRleHQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBdG9taWMucHJvdG90eXBlKVxuXG5UZXh0LnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgbm9kZS5jbGFzc0xpc3QuYWRkKCd3ZWV4LWNvbnRhaW5lcicpXG4gIG5vZGUuc3R5bGUuZm9udFNpemUgPSBERUZBVUxUX0ZPTlRfU0laRSAqIHRoaXMuZGF0YS5zY2FsZSArICdweCdcbiAgdGhpcy50ZXh0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxuICAvLyBHaXZlIHRoZSBkZXZlbG9wZXJzIHRoZSBhYmlsaXR5IHRvIGNvbnRyb2wgc3BhY2VcbiAgLy8gYW5kIGxpbmUtYnJlYWtlcnMuXG4gIHRoaXMudGV4dE5vZGUuc3R5bGUud2hpdGVTcGFjZSA9ICdwcmUtd3JhcCdcbiAgdGhpcy50ZXh0Tm9kZS5zdHlsZS53b3JkV3JhcCA9ICdicmVhay13b3JkJ1xuICB0aGlzLnRleHROb2RlLnN0eWxlLmRpc3BsYXkgPSAnLXdlYmtpdC1ib3gnXG4gIHRoaXMudGV4dE5vZGUuc3R5bGUud2Via2l0Qm94T3JpZW50ID0gJ3ZlcnRpY2FsJ1xuICB0aGlzLnN0eWxlLmxpbmVzLmNhbGwodGhpcywgdGhpcy5kYXRhLnN0eWxlLmxpbmVzKVxuICBub2RlLmFwcGVuZENoaWxkKHRoaXMudGV4dE5vZGUpXG4gIHJldHVybiBub2RlXG59XG5cblRleHQucHJvdG90eXBlLmF0dHIgPSB7XG4gIHZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB2YXIgc3BhbiA9IHRoaXMubm9kZS5maXJzdENoaWxkXG4gICAgc3Bhbi5pbm5lckhUTUwgPSAnJ1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IHZhbHVlID09PSAnJykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHNwYW4udGV4dENvbnRlbnQgPSB2YWx1ZVxuICAgIC8qKlxuICAgICAqIERldmVsb3BlcnMgYXJlIHN1cHBvc2VkIHRvIGhhdmUgdGhlIGFiaWxpdHkgdG8gYnJlYWsgdGV4dFxuICAgICAqIGxpbmVzIG1hbnVhbGx5LiBVc2luZyBgYCZuYnNwO2BgIHRvIHJlcGxhY2UgdGV4dCBzcGFjZSBpc1xuICAgICAqIG5vdCBjb21wYXRpYmxlIHdpdGggdGhlIGBgLXdlYmtpdC1saW5lLWNsYW1wYGAuIFRoZXJlZm9yXG4gICAgICogd2UgdXNlIGBgd2hpdGUtc3BhY2U6IG5vLXdyYXBgYCBpbnN0ZWFkIChpbnN0ZWFkIG9mIHRoZVxuICAgICAqIGNvZGUgYmVsbG93KS5cblxuICAgICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcbiAgICAgICAgdGV4dC5zcGxpdCgnICcpLmZvckVhY2goZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgICAgdmFyIHRleHROb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc3RyKVxuICAgICAgICAgIHZhciBzcGFjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKVxuICAgICAgICAgIHNwYWNlLmlubmVySFRNTCA9ICcmbmJzcDsnXG4gICAgICAgICAgZnJhZy5hcHBlbmRDaGlsZChzcGFjZSlcbiAgICAgICAgICBmcmFnLmFwcGVuZENoaWxkKHRleHROb2RlKVxuICAgICAgICB9KVxuICAgICAgICBmcmFnLnJlbW92ZUNoaWxkKGZyYWcuZmlyc3RDaGlsZClcbiAgICAgICAgc3Bhbi5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdicicpKVxuICAgICAgICBzcGFuLmFwcGVuZENoaWxkKGZyYWcpXG4gICAgICB9KVxuICAgICAgc3Bhbi5yZW1vdmVDaGlsZChzcGFuLmZpcnN0Q2hpbGQpXG4gICAgICovXG4gIH1cbn1cblxuVGV4dC5wcm90b3R5cGUuY2xlYXJBdHRyID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLm5vZGUuZmlyc3RDaGlsZC50ZXh0Q29udGVudCA9ICcnXG59XG5cblRleHQucHJvdG90eXBlLnN0eWxlID0gdXRpbHMuZXh0ZW5kKE9iamVjdC5jcmVhdGUoQXRvbWljLnByb3RvdHlwZS5zdHlsZSksIHtcblxuICBsaW5lczogZnVuY3Rpb24gKHZhbCkge1xuICAgIHZhbCA9IHBhcnNlSW50KHZhbClcbiAgICBpZiAodmFsICE9PSB2YWwpIHsgLy8gTmFOXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKHZhbCA8PSAwKSB7XG4gICAgICB0aGlzLnRleHROb2RlLnN0eWxlLnRleHRPdmVyZmxvdyA9ICcnXG4gICAgICB0aGlzLnRleHROb2RlLnN0eWxlLm92ZXJmbG93ID0gJ3Zpc2libGUnXG4gICAgICB0aGlzLnRleHROb2RlLnN0eWxlLndlYmtpdExpbmVDbGFtcCA9ICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBzdHlsZSA9IHRoaXMuZGF0YSA/IHRoaXMuZGF0YS5zdHlsZSA6IG51bGxcbiAgICAgIHRoaXMudGV4dE5vZGUuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJ1xuICAgICAgdGhpcy50ZXh0Tm9kZS5zdHlsZS50ZXh0T3ZlcmZsb3cgPSBzdHlsZVxuICAgICAgICA/IHN0eWxlLnRleHRPdmVyZmxvd1xuICAgICAgICA6IERFRkFVTFRfVEVYVF9PVkVSRkxPV1xuICAgICAgdGhpcy50ZXh0Tm9kZS5zdHlsZS53ZWJraXRMaW5lQ2xhbXAgPSB2YWxcbiAgICB9XG4gIH0sXG5cbiAgdGV4dE92ZXJmbG93OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgdGhpcy50ZXh0Tm9kZS5zdHlsZS50ZXh0T3ZlcmZsb3cgPSB2YWxcbiAgfVxuXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHRcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvY29tcG9uZW50cy90ZXh0LmpzXG4gKiogbW9kdWxlIGlkID0gMzhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBMaXN0ID0gcmVxdWlyZSgnLi9saXN0JylcblxuZnVuY3Rpb24gVmxpc3QoZGF0YSwgbm9kZVR5cGUpIHtcbiAgZGF0YS5hdHRyLmRpcmVjdGlvbiA9ICd2J1xuICBMaXN0LmNhbGwodGhpcywgZGF0YSwgbm9kZVR5cGUpXG59XG5cblZsaXN0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTGlzdC5wcm90b3R5cGUpXG5cbm1vZHVsZS5leHBvcnRzID0gVmxpc3RcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvdmxpc3QuanNcbiAqKiBtb2R1bGUgaWQgPSAzOVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnJlcXVpcmUoJy4uL3N0eWxlcy9saXN0LmNzcycpXG5yZXF1aXJlKCcuLi9zY3JvbGwnKVxuXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9jb21wb25lbnQnKVxudmFyIExhenlMb2FkID0gcmVxdWlyZSgnLi4vbGF6eUxvYWQnKVxuXG52YXIgREVGQVVMVF9MT0FEX01PUkVfT0ZGU0VUID0gNTAwXG5cbnZhciBkaXJlY3Rpb25NYXAgPSB7XG4gIGg6IFsncm93JywgJ2hvcml6b250YWwnLCAnaCcsICd4J10sXG4gIHY6IFsnY29sdW1uJywgJ3ZlcnRpY2FsJywgJ3YnLCAneSddXG59XG5cbi8vIGRpcmVjdGlvbjogJ3YnIG9yICdoJywgZGVmYXVsdCBpcyAndidcbmZ1bmN0aW9uIExpc3QoZGF0YSwgbm9kZVR5cGUpIHtcbiAgLy8gdGhpcy5sb2FkbW9yZU9mZnNldCA9IE51bWJlcihkYXRhLmF0dHIubG9hZG1vcmVvZmZzZXQpXG4gIC8vIHRoaXMuaXNBdmFpbGFibGVUb0ZpcmVsb2FkbW9yZSA9IHRydWVcbiAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb25NYXAuaC5pbmRleE9mKGRhdGEuYXR0ci5kaXJlY3Rpb24pID09PSAtMVxuICAgID8gJ3YnXG4gICAgOiAnaCdcbiAgQ29tcG9uZW50LmNhbGwodGhpcywgZGF0YSwgbm9kZVR5cGUpXG59XG5cbkxpc3QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDb21wb25lbnQucHJvdG90eXBlKVxuXG5MaXN0LnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAobm9kZVR5cGUpIHtcbiAgdmFyIFNjcm9sbCA9IGxpYi5zY3JvbGxcbiAgdmFyIG5vZGUgPSBDb21wb25lbnQucHJvdG90eXBlLmNyZWF0ZS5jYWxsKHRoaXMsIG5vZGVUeXBlKVxuICBub2RlLmNsYXNzTGlzdC5hZGQoJ3dlZXgtY29udGFpbmVyJywgJ2xpc3Qtd3JhcCcpXG4gIHRoaXMubGlzdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICB0aGlzLmxpc3RFbGVtZW50LmNsYXNzTGlzdC5hZGQoXG4gICAgJ3dlZXgtY29udGFpbmVyJ1xuICAgICwgJ2xpc3QtZWxlbWVudCdcbiAgICAsIHRoaXMuZGlyZWN0aW9uICsgJy1saXN0J1xuICApXG5cbiAgLy8gRmxleCB3aWxsIGNhdXNlIGEgYnVnIHRvIHJlc2NhbGUgY2hpbGRyZW4ncyBzaXplIGlmIHRoZWlyIHRvdGFsXG4gIC8vIHNpemUgZXhjZWVkIHRoZSBsaW1pdCBvZiB0aGVpciBwYXJlbnQuIFNvIHRvIHVzZSBib3ggaW5zdGVhZC5cbiAgdGhpcy5saXN0RWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJy13ZWJraXQtYm94J1xuICB0aGlzLmxpc3RFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnYm94J1xuICB0aGlzLmxpc3RFbGVtZW50LnN0eWxlLndlYmtpdEJveE9yaWVudCA9IHRoaXMuZGlyZWN0aW9uID09PSAnaCdcbiAgICA/ICdob3Jpem9udGFsJ1xuICAgIDogJ3ZlcnRpY2FsJ1xuICB0aGlzLmxpc3RFbGVtZW50LnN0eWxlLmJveE9yaWVudCA9IHRoaXMubGlzdEVsZW1lbnQuc3R5bGUud2Via2l0Qm94T3JpZW50XG5cbiAgbm9kZS5hcHBlbmRDaGlsZCh0aGlzLmxpc3RFbGVtZW50KVxuICB0aGlzLnNjcm9sbGVyID0gbmV3IFNjcm9sbCh7XG4gICAgc2Nyb2xsRWxlbWVudDogdGhpcy5saXN0RWxlbWVudFxuICAgICwgZGlyZWN0aW9uOiB0aGlzLmRpcmVjdGlvbiA9PT0gJ2gnID8gJ3gnIDogJ3knXG4gIH0pXG4gIHRoaXMuc2Nyb2xsZXIuaW5pdCgpXG4gIHRoaXMub2Zmc2V0ID0gMFxuICByZXR1cm4gbm9kZVxufVxuXG5MaXN0LnByb3RvdHlwZS5iaW5kRXZlbnRzID0gZnVuY3Rpb24gKGV2dHMpIHtcbiAgQ29tcG9uZW50LnByb3RvdHlwZS5iaW5kRXZlbnRzLmNhbGwodGhpcywgZXZ0cylcbiAgLy8gdG8gZW5hYmxlIGxhenlsb2FkIGZvciBJbWFnZXMuXG4gIHRoaXMuc2Nyb2xsZXIuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsaW5nJywgZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgc28gPSBlLnNjcm9sbE9ialxuICAgIHZhciBzY3JvbGxUb3AgPSBzby5nZXRTY3JvbGxUb3AoKVxuICAgIHZhciBzY3JvbGxMZWZ0ID0gc28uZ2V0U2Nyb2xsTGVmdCgpXG4gICAgdmFyIG9mZnNldCA9IHRoaXMuZGlyZWN0aW9uID09PSAndicgPyBzY3JvbGxUb3AgOiBzY3JvbGxMZWZ0XG4gICAgdmFyIGRpZmYgPSBvZmZzZXQgLSB0aGlzLm9mZnNldFxuICAgIHZhciBkaXJcbiAgICBpZiAoZGlmZiA+PSAwKSB7XG4gICAgICBkaXIgPSB0aGlzLmRpcmVjdGlvbiA9PT0gJ3YnID8gJ3VwJyA6ICdsZWZ0J1xuICAgIH0gZWxzZSB7XG4gICAgICBkaXIgPSB0aGlzLmRpcmVjdGlvbiA9PT0gJ3YnID8gJ2Rvd24nIDogJ3JpZ2h0J1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3Njcm9sbCcsIHtcbiAgICAgIG9yaWdpbmFsVHlwZTogJ3Njcm9sbGluZycsXG4gICAgICBzY3JvbGxUb3A6IHNvLmdldFNjcm9sbFRvcCgpLFxuICAgICAgc2Nyb2xsTGVmdDogc28uZ2V0U2Nyb2xsTGVmdCgpLFxuICAgICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgICBkaXJlY3Rpb246IGRpclxuICAgIH0sIHtcbiAgICAgIGJ1YmJsZXM6IHRydWVcbiAgICB9KVxuICAgIHRoaXMub2Zmc2V0ID0gb2Zmc2V0XG4gIH0uYmluZCh0aGlzKSlcblxuICB2YXIgcHVsbGVuZEV2ZW50ID0gJ3B1bGwnICsgKHsgdjogJ3VwJywgaDogJ2xlZnQnIH0pW3RoaXMuZGlyZWN0aW9uXSArICdlbmQnXG4gIHRoaXMuc2Nyb2xsZXIuYWRkRXZlbnRMaXN0ZW5lcihwdWxsZW5kRXZlbnQsIGZ1bmN0aW9uIChlKSB7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdsb2FkbW9yZScpXG4gIH0uYmluZCh0aGlzKSlcbn1cblxuTGlzdC5wcm90b3R5cGUuY3JlYXRlQ2hpbGRyZW4gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBjaGlsZHJlbiA9IHRoaXMuZGF0YS5jaGlsZHJlblxuICB2YXIgcGFyZW50UmVmID0gdGhpcy5kYXRhLnJlZlxuICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcbiAgICB2YXIgaXNGbGV4ID0gZmFsc2VcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjaGlsZHJlbltpXS5pbnN0YW5jZUlkID0gdGhpcy5kYXRhLmluc3RhbmNlSWRcbiAgICAgIGNoaWxkcmVuW2ldLnNjYWxlID0gdGhpcy5kYXRhLnNjYWxlXG4gICAgICB2YXIgY2hpbGQgPSBjb21wb25lbnRNYW5hZ2VyLmNyZWF0ZUVsZW1lbnQoY2hpbGRyZW5baV0pXG4gICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChjaGlsZC5ub2RlKVxuICAgICAgY2hpbGQucGFyZW50UmVmID0gcGFyZW50UmVmXG4gICAgICBpZiAoIWlzRmxleFxuICAgICAgICAgICYmIGNoaWxkLmRhdGEuc3R5bGVcbiAgICAgICAgICAmJiBjaGlsZC5kYXRhLnN0eWxlLmhhc093blByb3BlcnR5KCdmbGV4JylcbiAgICAgICAgKSB7XG4gICAgICAgIGlzRmxleCA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5saXN0RWxlbWVudC5hcHBlbmRDaGlsZChmcmFnbWVudClcbiAgfVxuICAvLyB3YWl0IGZvciBmcmFnbWVudCB0byBhcHBlbmRlZCBvbiBsaXN0RWxlbWVudCBvbiBVSSB0aHJlYWQuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2Nyb2xsZXIucmVmcmVzaCgpXG4gIH0uYmluZCh0aGlzKSwgMClcbn1cblxuTGlzdC5wcm90b3R5cGUuYXBwZW5kQ2hpbGQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICB2YXIgY2hpbGRyZW4gPSB0aGlzLmRhdGEuY2hpbGRyZW5cbiAgdmFyIGNvbXBvbmVudE1hbmFnZXIgPSB0aGlzLmdldENvbXBvbmVudE1hbmFnZXIoKVxuICB2YXIgY2hpbGQgPSBjb21wb25lbnRNYW5hZ2VyLmNyZWF0ZUVsZW1lbnQoZGF0YSlcbiAgdGhpcy5saXN0RWxlbWVudC5hcHBlbmRDaGlsZChjaGlsZC5ub2RlKVxuXG4gIC8vIHdhaXQgZm9yIFVJIHRocmVhZCB0byB1cGRhdGUuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2Nyb2xsZXIucmVmcmVzaCgpXG4gIH0uYmluZCh0aGlzKSwgMClcblxuICAvLyB1cGRhdGUgdGhpcy5kYXRhLmNoaWxkcmVuXG4gIGlmICghY2hpbGRyZW4gfHwgIWNoaWxkcmVuLmxlbmd0aCkge1xuICAgIHRoaXMuZGF0YS5jaGlsZHJlbiA9IFtkYXRhXVxuICB9IGVsc2Uge1xuICAgIGNoaWxkcmVuLnB1c2goZGF0YSlcbiAgfVxuXG4gIHJldHVybiBjaGlsZFxufVxuXG5MaXN0LnByb3RvdHlwZS5pbnNlcnRCZWZvcmUgPSBmdW5jdGlvbiAoY2hpbGQsIGJlZm9yZSkge1xuICB2YXIgY2hpbGRyZW4gPSB0aGlzLmRhdGEuY2hpbGRyZW5cbiAgdmFyIGkgPSAwXG4gIHZhciBpc0FwcGVuZCA9IGZhbHNlXG5cbiAgLy8gdXBkYXRlIHRoaXMuZGF0YS5jaGlsZHJlblxuICBpZiAoIWNoaWxkcmVuIHx8ICFjaGlsZHJlbi5sZW5ndGggfHwgIWJlZm9yZSkge1xuICAgIGlzQXBwZW5kID0gdHJ1ZVxuICB9IGVsc2Uge1xuICAgIGZvciAodmFyIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChjaGlsZHJlbltpXS5yZWYgPT09IGJlZm9yZS5kYXRhLnJlZikge1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaSA9PT0gbCkge1xuICAgICAgaXNBcHBlbmQgPSB0cnVlXG4gICAgfVxuICB9XG5cbiAgaWYgKGlzQXBwZW5kKSB7XG4gICAgdGhpcy5saXN0RWxlbWVudC5hcHBlbmRDaGlsZChjaGlsZC5ub2RlKVxuICAgIGNoaWxkcmVuLnB1c2goY2hpbGQuZGF0YSlcbiAgfSBlbHNlIHtcbiAgICBpZiAoYmVmb3JlLmZpeGVkUGxhY2Vob2xkZXIpIHtcbiAgICAgIHRoaXMubGlzdEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLm5vZGUsIGJlZm9yZS5maXhlZFBsYWNlaG9sZGVyKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxpc3RFbGVtZW50Lmluc2VydEJlZm9yZShjaGlsZC5ub2RlLCBiZWZvcmUubm9kZSlcbiAgICB9XG4gICAgY2hpbGRyZW4uc3BsaWNlKGksIDAsIGNoaWxkLmRhdGEpXG4gIH1cblxuICAvLyB3YWl0IGZvciBVSSB0aHJlYWQgdG8gdXBkYXRlLlxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNjcm9sbGVyLnJlZnJlc2goKVxuICB9LmJpbmQodGhpcyksIDApXG59XG5cbkxpc3QucHJvdG90eXBlLnJlbW92ZUNoaWxkID0gZnVuY3Rpb24gKGNoaWxkKSB7XG4gIHZhciBjaGlsZHJlbiA9IHRoaXMuZGF0YS5jaGlsZHJlblxuICAvLyByZW1vdmUgZnJvbSB0aGlzLmRhdGEuY2hpbGRyZW5cbiAgdmFyIGkgPSAwXG4gIHZhciBjb21wb25lbnRNYW5hZ2VyID0gdGhpcy5nZXRDb21wb25lbnRNYW5hZ2VyKClcbiAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgIGZvciAodmFyIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChjaGlsZHJlbltpXS5yZWYgPT09IGNoaWxkLmRhdGEucmVmKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpIDwgbCkge1xuICAgICAgY2hpbGRyZW4uc3BsaWNlKGksIDEpXG4gICAgfVxuICB9XG4gIC8vIHJlbW92ZSBmcm9tIGNvbXBvbmVudE1hcCByZWN1cnNpdmVseVxuICBjb21wb25lbnRNYW5hZ2VyLnJlbW92ZUVsZW1lbnRCeVJlZihjaGlsZC5kYXRhLnJlZilcbiAgaWYgKGNoaWxkLmZpeGVkUGxhY2Vob2xkZXIpIHtcbiAgICB0aGlzLmxpc3RFbGVtZW50LnJlbW92ZUNoaWxkKGNoaWxkLmZpeGVkUGxhY2Vob2xkZXIpXG4gIH1cbiAgY2hpbGQubm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNoaWxkLm5vZGUpXG5cbiAgLy8gd2FpdCBmb3IgVUkgdGhyZWFkIHRvIHVwZGF0ZS5cbiAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zY3JvbGxlci5yZWZyZXNoKClcbiAgfS5iaW5kKHRoaXMpLCAwKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpc3RcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvY29tcG9uZW50cy9saXN0LmpzXG4gKiogbW9kdWxlIGlkID0gNDBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vbGlzdC5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vbGlzdC5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9saXN0LmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9zdHlsZXMvbGlzdC5jc3NcbiAqKiBtb2R1bGUgaWQgPSA0MVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIubGlzdC13cmFwIHtcXG4gIGRpc3BsYXk6IGJsb2NrO1xcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcXG59XFxuXFxuLmxpc3QtZWxlbWVudCB7XFxuICAtd2Via2l0LWJveC1vcmllbnQ6IHZlcnRpY2FsO1xcbiAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL3NyYy9zdHlsZXMvbGlzdC5jc3NcbiAqKiBtb2R1bGUgaWQgPSA0MlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwicmVxdWlyZSgnLi9tb3Rpb24nKVxuXG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi9sb2dnZXInKVxuXG52YXIgZG9jID0gd2luZG93LmRvY3VtZW50XG52YXIgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudFxudmFyIHNjcm9sbE9ianMgPSB7fVxudmFyIHBsdWdpbnMgPSB7fVxudmFyIGRwciA9IHdpbmRvdy5kcHJcbiAgfHwgKCEhd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQaG9uZXxpUGFkfGlQb2QvKVxuICAgID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIC8gd2luZG93LnNjcmVlbi5hdmFpbFdpZHRoXG4gICAgOiAxKVxudmFyIGluZXJ0aWFDb2VmZmljaWVudCA9IHtcbiAgbm9ybWFsOiBbMiAqIGRwciwgMC4wMDE1ICogZHByXSxcbiAgc2xvdzogWzEuNSAqIGRwciwgMC4wMDMgKiBkcHJdLFxuICB2ZXJ5c2xvdzogWzEuNSAqIGRwciwgMC4wMDUgKiBkcHJdXG59XG52YXIgdGltZUZ1bmN0aW9uID0ge1xuICBlYXNlOiBbLjI1LC4xLC4yNSwxXSxcbiAgbGluZXI6IFswLDAsMSwxXSxcbiAgJ2Vhc2UtaW4nOiBbLjQyLDAsMSwxXSxcbiAgJ2Vhc2Utb3V0JzogWzAsMCwuNTgsMV0sXG4gICdlYXNlLWluLW91dCc6IFsuNDIsMCwuNTgsMV1cbn1cbnZhciBGaXJlZm94ID0gISF1YS5tYXRjaCgvRmlyZWZveC9pKVxudmFyIElFTW9iaWxlID0gISF1YS5tYXRjaCgvSUVNb2JpbGUvaSlcbnZhciBjc3NQcmVmaXggPSBGaXJlZm94ID8gJy1tb3otJyA6IElFTW9iaWxlID8gJy1tcy0nIDogJy13ZWJraXQtJ1xudmFyIHN0eWxlUHJlZml4ID0gRmlyZWZveCA/ICdNb3onIDogSUVNb2JpbGUgPyAnbXMnIDogJ3dlYmtpdCdcblxuZnVuY3Rpb24gZGVidWdMb2coKSB7XG4gIGlmIChsaWIuc2Nyb2xsLm91dHB1dERlYnVnTG9nKSB7XG4gICAgbG9nZ2VyLmxvZy5hcHBseShsb2dnZXIsIGFyZ3VtZW50cylcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRCb3VuZGluZ0NsaWVudFJlY3QoZWwpIHtcbiAgdmFyIHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICBpZiAoIXJlY3QpIHtcbiAgICByZWN0ID0ge31cbiAgICByZWN0LndpZHRoID0gZWwub2Zmc2V0V2lkdGhcbiAgICByZWN0LmhlaWdodCA9IGVsLm9mZnNldEhlaWdodFxuXG4gICAgcmVjdC5sZWZ0ID0gZWwub2Zmc2V0TGVmdFxuICAgIHJlY3QudG9wID0gZWwub2Zmc2V0VG9wXG4gICAgdmFyIHBhcmVudCA9IGVsLm9mZnNldFBhcmVudFxuICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgIHJlY3QubGVmdCArPSBwYXJlbnQub2Zmc2V0TGVmdFxuICAgICAgcmVjdC50b3AgKz0gcGFyZW50Lm9mZnNldFRvcFxuICAgICAgcGFyZW50ID0gcGFyZW50Lm9mZnNldFBhcmVudFxuICAgIH1cblxuICAgIHJlY3QucmlnaHQgPSByZWN0LmxlZnQgKyByZWN0LndpZHRoXG4gICAgcmVjdC5ib3R0b20gPSByZWN0LnRvcCArIHJlY3QuaGVpZ2h0XG4gIH1cbiAgcmV0dXJuIHJlY3Rcbn1cblxuZnVuY3Rpb24gZ2V0TWluU2Nyb2xsT2Zmc2V0KHNjcm9sbE9iaikge1xuICByZXR1cm4gMCAtIHNjcm9sbE9iai5vcHRpb25zW3Njcm9sbE9iai5heGlzICsgJ1BhZGRpbmdUb3AnXVxufVxuXG5mdW5jdGlvbiBnZXRNYXhTY3JvbGxPZmZzZXQoc2Nyb2xsT2JqKSB7XG4gIHZhciByZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHNjcm9sbE9iai5lbGVtZW50KVxuICB2YXIgcFJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3Qoc2Nyb2xsT2JqLnZpZXdwb3J0KVxuICB2YXIgbWluID0gZ2V0TWluU2Nyb2xsT2Zmc2V0KHNjcm9sbE9iailcbiAgaWYgKHNjcm9sbE9iai5heGlzID09PSAneScpIHtcbiAgICB2YXIgbWF4ID0gMCAtIHJlY3QuaGVpZ2h0ICsgcFJlY3QuaGVpZ2h0XG4gIH0gZWxzZSB7XG4gICAgdmFyIG1heCA9IDAgLSByZWN0LndpZHRoICsgcFJlY3Qud2lkdGhcbiAgfVxuICByZXR1cm4gTWF0aC5taW4oXG4gICAgbWF4ICsgc2Nyb2xsT2JqLm9wdGlvbnNbc2Nyb2xsT2JqLmF4aXMgKyAnUGFkZGluZ0JvdHRvbSddLFxuICAgIG1pblxuICApXG59XG5cbmZ1bmN0aW9uIGdldEJvdW5kYXJ5T2Zmc2V0KHNjcm9sbE9iaiwgb2Zmc2V0KSB7XG4gIGlmIChvZmZzZXQgPiBzY3JvbGxPYmoubWluU2Nyb2xsT2Zmc2V0KSB7XG4gICAgcmV0dXJuIG9mZnNldCAtIHNjcm9sbE9iai5taW5TY3JvbGxPZmZzZXRcbiAgfVxuICBpZiAob2Zmc2V0IDwgc2Nyb2xsT2JqLm1heFNjcm9sbE9mZnNldCkge1xuICAgIHJldHVybiBvZmZzZXQgLSBzY3JvbGxPYmoubWF4U2Nyb2xsT2Zmc2V0XG4gIH1cbn1cblxuZnVuY3Rpb24gdG91Y2hCb3VuZGFyeShzY3JvbGxPYmosIG9mZnNldCkge1xuICBpZiAob2Zmc2V0ID4gc2Nyb2xsT2JqLm1pblNjcm9sbE9mZnNldCkge1xuICAgIG9mZnNldCA9IHNjcm9sbE9iai5taW5TY3JvbGxPZmZzZXRcbiAgfSBlbHNlIGlmIChvZmZzZXQgPCBzY3JvbGxPYmoubWF4U2Nyb2xsT2Zmc2V0KSB7XG4gICAgb2Zmc2V0ID0gc2Nyb2xsT2JqLm1heFNjcm9sbE9mZnNldFxuICB9XG4gIHJldHVybiBvZmZzZXRcbn1cblxuZnVuY3Rpb24gZmlyZUV2ZW50KHNjcm9sbE9iaiwgZXZlbnROYW1lLCBleHRyYSkge1xuICBkZWJ1Z0xvZyhzY3JvbGxPYmouZWxlbWVudC5zY3JvbGxJZCwgZXZlbnROYW1lLCBleHRyYSlcbiAgdmFyIGV2ZW50ID0gZG9jLmNyZWF0ZUV2ZW50KCdIVE1MRXZlbnRzJylcbiAgZXZlbnQuaW5pdEV2ZW50KGV2ZW50TmFtZSwgZmFsc2UsIHRydWUpXG4gIGV2ZW50LnNjcm9sbE9iaiA9IHNjcm9sbE9ialxuICBpZiAoZXh0cmEpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gZXh0cmEpIHtcbiAgICAgIGV2ZW50W2tleV0gPSBleHRyYVtrZXldXG4gICAgfVxuICB9XG4gIHNjcm9sbE9iai5lbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpXG4gIHNjcm9sbE9iai52aWV3cG9ydC5kaXNwYXRjaEV2ZW50KGV2ZW50KVxufVxuXG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm1PZmZzZXQoc2Nyb2xsT2JqKSB7XG4gIHZhciBvZmZzZXQgPSB7eDogMCwgeTogMH1cbiAgdmFyIHRyYW5zZm9ybSA9IGdldENvbXB1dGVkU3R5bGUoc2Nyb2xsT2JqLmVsZW1lbnQpXG4gICAgW3N0eWxlUHJlZml4ICsgJ1RyYW5zZm9ybSddXG4gIHZhciBtYXRjaGVkXG4gIHZhciByZWcxID0gbmV3IFJlZ0V4cCgnXm1hdHJpeDNkJ1xuICAgICsgJ1xcXFwoKD86Wy1cXFxcZC5dKyxcXFxccyopezEyfShbLVxcXFxkLl0rKSwnXG4gICAgKyAnXFxcXHMqKFstXFxcXGQuXSspKD86LFxcXFxzKlstXFxcXGQuXSspezJ9XFxcXCknKVxuICB2YXIgcmVnMiA9IG5ldyBSZWdFeHAoJ15tYXRyaXgnXG4gICAgKyAnXFxcXCgoPzpbLVxcXFxkLl0rLFxcXFxzKil7NH0oWy1cXFxcZC5dKyksXFxcXHMqKFstXFxcXGQuXSspXFxcXCkkJylcbiAgaWYgKHRyYW5zZm9ybSAhPT0gJ25vbmUnKSB7XG4gICAgaWYgKChtYXRjaGVkID0gdHJhbnNmb3JtLm1hdGNoKHJlZzEpIHx8XG4gICAgICAgIHRyYW5zZm9ybS5tYXRjaChyZWcyKSkpIHtcbiAgICAgIG9mZnNldC54ID0gcGFyc2VGbG9hdChtYXRjaGVkWzFdKSB8fCAwXG4gICAgICBvZmZzZXQueSA9IHBhcnNlRmxvYXQobWF0Y2hlZFsyXSkgfHwgMFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvZmZzZXRcbn1cblxudmFyIENTU01hdHJpeCA9IElFTW9iaWxlID8gJ01TQ1NTTWF0cml4JyA6ICdXZWJLaXRDU1NNYXRyaXgnXG52YXIgaGFzM2QgPSAhIUZpcmVmb3hcbiAgfHwgQ1NTTWF0cml4IGluIHdpbmRvd1xuICAmJiAnbTExJyBpbiBuZXcgd2luZG93W0NTU01hdHJpeF0oKVxuZnVuY3Rpb24gZ2V0VHJhbnNsYXRlKHgsIHkpIHtcbiAgeCA9IHBhcnNlRmxvYXQoeClcbiAgeSA9IHBhcnNlRmxvYXQoeSlcblxuICBpZiAoeCAhPSAwKSB7XG4gICAgeCArPSAncHgnXG4gIH1cblxuICBpZiAoeSAhPSAwKSB7XG4gICAgeSArPSAncHgnXG4gIH1cblxuICBpZiAoaGFzM2QpIHtcbiAgICByZXR1cm4gJ3RyYW5zbGF0ZTNkKCcgKyB4ICsgJywgJyArIHkgKyAnLCAwKSdcbiAgfVxuICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsICcgKyB5ICsgJyknXG59XG5cbmZ1bmN0aW9uIHNldFRyYW5zaXRpb25TdHlsZShzY3JvbGxPYmosIGR1cmF0aW9uLCB0aW1pbmdGdW5jdGlvbikge1xuICBpZiAoZHVyYXRpb24gPT09ICcnICYmIHRpbWluZ0Z1bmN0aW9uID09PSAnJykge1xuICAgIHNjcm9sbE9iai5lbGVtZW50LnN0eWxlW3N0eWxlUHJlZml4ICsgJ1RyYW5zaXRpb24nXSA9ICcnXG4gIH0gZWxzZSB7XG4gICAgc2Nyb2xsT2JqLmVsZW1lbnQuc3R5bGVbc3R5bGVQcmVmaXggKyAnVHJhbnNpdGlvbiddXG4gICAgICA9IGNzc1ByZWZpeCArICd0cmFuc2Zvcm0gJyArIGR1cmF0aW9uICsgJyAnICsgdGltaW5nRnVuY3Rpb24gKyAnIDBzJ1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldFRyYW5zZm9ybVN0eWxlKHNjcm9sbE9iaiwgb2Zmc2V0KSB7XG4gIHZhciB4ID0gMFxuICB2YXIgeSA9IDBcbiAgaWYgKHR5cGVvZiBvZmZzZXQgPT09ICdvYmplY3QnKSB7XG4gICAgeCA9IG9mZnNldC54XG4gICAgeSA9IG9mZnNldC55XG4gIH0gZWxzZSB7XG4gICAgaWYgKHNjcm9sbE9iai5heGlzID09PSAneScpIHtcbiAgICAgIHkgPSBvZmZzZXRcbiAgICB9IGVsc2Uge1xuICAgICAgeCA9IG9mZnNldFxuICAgIH1cbiAgfVxuICBzY3JvbGxPYmouZWxlbWVudC5zdHlsZVtzdHlsZVByZWZpeCArICdUcmFuc2Zvcm0nXSA9IGdldFRyYW5zbGF0ZSh4LCB5KVxufVxuXG52YXIgcGFubmluZyA9IGZhbHNlXG5kb2MuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgZnVuY3Rpb24gKGUpIHtcbiAgaWYgKHBhbm5pbmcpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gdHJ1ZVxufSwgZmFsc2UpXG5cbmZ1bmN0aW9uIFNjcm9sbChlbGVtZW50LCBvcHRpb25zKSB7XG4gIHZhciB0aGF0ID0gdGhpc1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIG9wdGlvbnMubm9Cb3VuY2UgPSAhIW9wdGlvbnMubm9Cb3VuY2VcbiAgb3B0aW9ucy5wYWRkaW5nID0gb3B0aW9ucy5wYWRkaW5nIHx8IHt9XG5cbiAgaWYgKG9wdGlvbnMuaXNQcmV2ZW50ID09IG51bGwpIHtcbiAgICBvcHRpb25zLmlzUHJldmVudCA9IHRydWVcbiAgfSBlbHNlIHtcbiAgICBvcHRpb25zLmlzUHJldmVudCA9ICEhb3B0aW9ucy5pc1ByZXZlbnRcbiAgfVxuXG4gIGlmIChvcHRpb25zLmlzRml4U2Nyb2xsZW5kQ2xpY2sgPT0gbnVsbCkge1xuICAgIG9wdGlvbnMuaXNGaXhTY3JvbGxlbmRDbGljayA9IHRydWVcbiAgfSBlbHNlIHtcbiAgICBvcHRpb25zLmlzRml4U2Nyb2xsZW5kQ2xpY2sgPSAhIW9wdGlvbnMuaXNGaXhTY3JvbGxlbmRDbGlja1xuICB9XG5cbiAgaWYgKG9wdGlvbnMucGFkZGluZykge1xuICAgIG9wdGlvbnMueVBhZGRpbmdUb3AgPSAtb3B0aW9ucy5wYWRkaW5nLnRvcCB8fCAwXG4gICAgb3B0aW9ucy55UGFkZGluZ0JvdHRvbSA9IC1vcHRpb25zLnBhZGRpbmcuYm90dG9tIHx8IDBcbiAgICBvcHRpb25zLnhQYWRkaW5nVG9wID0gLW9wdGlvbnMucGFkZGluZy5sZWZ0IHx8IDBcbiAgICBvcHRpb25zLnhQYWRkaW5nQm90dG9tID0gLW9wdGlvbnMucGFkZGluZy5yaWdodCB8fCAwXG4gIH0gZWxzZSB7XG4gICAgb3B0aW9ucy55UGFkZGluZ1RvcCA9IDBcbiAgICBvcHRpb25zLnlQYWRkaW5nQm90dG9tID0gMFxuICAgIG9wdGlvbnMueFBhZGRpbmdUb3AgPSAwXG4gICAgb3B0aW9ucy54UGFkZGluZ0JvdHRvbSA9IDBcbiAgfVxuXG4gIG9wdGlvbnMuZGlyZWN0aW9uID0gb3B0aW9ucy5kaXJlY3Rpb24gfHwgJ3knXG4gIG9wdGlvbnMuaW5lcnRpYSA9IG9wdGlvbnMuaW5lcnRpYSB8fCAnbm9ybWFsJ1xuXG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcbiAgdGhhdC5heGlzID0gb3B0aW9ucy5kaXJlY3Rpb25cbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudFxuICB0aGlzLnZpZXdwb3J0ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gIHRoaXMucGx1Z2lucyA9IHt9XG5cbiAgdGhpcy5lbGVtZW50LnNjcm9sbElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgc2Nyb2xsT2Jqc1t0aGF0LmVsZW1lbnQuc2Nyb2xsSWQgKyAnJ10gPSB0aGF0XG4gIH0sIDEpXG5cbiAgdGhpcy52aWV3cG9ydC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdG91Y2hzdGFydEhhbmRsZXIsIGZhbHNlKVxuICB0aGlzLnZpZXdwb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdG91Y2hlbmRIYW5kbGVyLCBmYWxzZSlcbiAgdGhpcy52aWV3cG9ydC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoZW5kSGFuZGxlciwgZmFsc2UpXG4gIHRoaXMudmlld3BvcnQuYWRkRXZlbnRMaXN0ZW5lcigncGFuc3RhcnQnLCBwYW5zdGFydEhhbmRsZXIsIGZhbHNlKVxuICB0aGlzLnZpZXdwb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ3Bhbm1vdmUnLCBwYW5IYW5kbGVyLCBmYWxzZSlcbiAgdGhpcy52aWV3cG9ydC5hZGRFdmVudExpc3RlbmVyKCdwYW5lbmQnLCBwYW5lbmRIYW5kbGVyLCBmYWxzZSlcblxuICBpZiAob3B0aW9ucy5pc1ByZXZlbnQpIHtcbiAgICB0aGlzLnZpZXdwb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgcGFubmluZyA9IHRydWVcbiAgICB9LCBmYWxzZSlcbiAgICB0aGF0LnZpZXdwb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHBhbm5pbmcgPSBmYWxzZVxuICAgIH0sIGZhbHNlKVxuICB9XG5cbiAgLy8gaWYgKG9wdGlvbnMuaXNQcmV2ZW50KSB7XG4gIC8vICAgdmFyIGQgPSB0aGlzLmF4aXMgPT09ICd5Jz8ndmVydGljYWwnOidob3Jpem9udGFsJ1xuICAvLyAgIHRoaXMudmlld3BvcnQuYWRkRXZlbnRMaXN0ZW5lcihkICsgJ3BhbnN0YXJ0JywgZnVuY3Rpb24gKGUpIHtcbiAgLy8gICAgIHBhbm5pbmcgPSB0cnVlXG4gIC8vICAgfSwgZmFsc2UpXG4gIC8vICAgdGhhdC52aWV3cG9ydC5hZGRFdmVudExpc3RlbmVyKCdwYW5lbmQnLCBmdW5jdGlvbiAoZSkge1xuICAvLyAgICAgcGFubmluZyA9IGZhbHNlXG4gIC8vICAgfSwgZmFsc2UpXG4gIC8vIH1cblxuICBpZiAob3B0aW9ucy5pc0ZpeFNjcm9sbGVuZENsaWNrKSB7XG4gICAgdmFyIHByZXZlbnRTY3JvbGxlbmRDbGlja1xuICAgIHZhciBmaXhTY3JvbGxlbmRDbGlja1RpbWVvdXRJZFxuXG4gICAgdGhpcy52aWV3cG9ydC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGxpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBwcmV2ZW50U2Nyb2xsZW5kQ2xpY2sgPSB0cnVlXG4gICAgICBmaXhTY3JvbGxlbmRDbGlja1RpbWVvdXRJZCAmJiBjbGVhclRpbWVvdXQoZml4U2Nyb2xsZW5kQ2xpY2tUaW1lb3V0SWQpXG4gICAgICBmaXhTY3JvbGxlbmRDbGlja1RpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcHJldmVudFNjcm9sbGVuZENsaWNrID0gZmFsc2VcbiAgICAgIH0sIDQwMClcbiAgICB9LCBmYWxzZSlcblxuICAgIGZ1bmN0aW9uIHByZXZlbnRTY3JvbGxlbmRDbGlja0hhbmRsZXIoZSkge1xuICAgICAgaWYgKHByZXZlbnRTY3JvbGxlbmRDbGljayB8fCBpc1Njcm9sbGluZykge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlyZU5pY2VUYXBFdmVudEhhbmRsZXIoZSkge1xuICAgICAgaWYgKCFwcmV2ZW50U2Nyb2xsZW5kQ2xpY2sgJiYgIWlzU2Nyb2xsaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBuaWNlVGFwRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnSFRNTEV2ZW50cycpXG4gICAgICAgICAgbmljZVRhcEV2ZW50LmluaXRFdmVudCgnbmljZWNsaWNrJywgdHJ1ZSwgdHJ1ZSlcbiAgICAgICAgICBlLnRhcmdldC5kaXNwYXRjaEV2ZW50KG5pY2VUYXBFdmVudClcbiAgICAgICAgfSwgMzAwKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudmlld3BvcnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBwcmV2ZW50U2Nyb2xsZW5kQ2xpY2tIYW5kbGVyKVxuICAgIHRoaXMudmlld3BvcnQuYWRkRXZlbnRMaXN0ZW5lcigndGFwJywgZmlyZU5pY2VUYXBFdmVudEhhbmRsZXIpXG4gIH1cblxuICBpZiAob3B0aW9ucy51c2VGcmFtZUFuaW1hdGlvbikge1xuICAgIHZhciBzY3JvbGxBbmltYXRpb25cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnYW5pbWF0aW9uJywge1xuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzY3JvbGxBbmltYXRpb25cbiAgICAgIH1cbiAgICB9KVxuICB9IGVsc2Uge1xuICAgIHZhciB0cmFuc2l0aW9uRW5kSGFuZGxlclxuICAgIHZhciB0cmFuc2l0aW9uRW5kVGltZW91dElkID0gMFxuXG4gICAgZnVuY3Rpb24gc2V0VHJhbnNpdGlvbkVuZEhhbmRsZXIoaCwgdCkge1xuICAgICAgdHJhbnNpdGlvbkVuZEhhbmRsZXIgPSBudWxsXG4gICAgICBjbGVhclRpbWVvdXQodHJhbnNpdGlvbkVuZFRpbWVvdXRJZClcblxuICAgICAgdHJhbnNpdGlvbkVuZFRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodHJhbnNpdGlvbkVuZEhhbmRsZXIpIHtcbiAgICAgICAgICB0cmFuc2l0aW9uRW5kSGFuZGxlciA9IG51bGxcbiAgICAgICAgICBsaWIuYW5pbWF0aW9uLnJlcXVlc3RGcmFtZShoKVxuICAgICAgICB9XG4gICAgICB9LCAodCB8fCA0MDApKVxuXG4gICAgICB0cmFuc2l0aW9uRW5kSGFuZGxlciA9IGhcbiAgICB9XG5cbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIEZpcmVmb3hcbiAgICAgICAgICA/ICd0cmFuc2l0aW9uZW5kJ1xuICAgICAgICAgIDogKHN0eWxlUHJlZml4ICsgJ1RyYW5zaXRpb25FbmQnKSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmICh0cmFuc2l0aW9uRW5kSGFuZGxlcikge1xuICAgICAgICB2YXIgaGFuZGxlciA9IHRyYW5zaXRpb25FbmRIYW5kbGVyXG5cbiAgICAgICAgdHJhbnNpdGlvbkVuZEhhbmRsZXIgPSBudWxsXG4gICAgICAgIGNsZWFyVGltZW91dCh0cmFuc2l0aW9uRW5kVGltZW91dElkKVxuXG4gICAgICAgIGxpYi5hbmltYXRpb24ucmVxdWVzdEZyYW1lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBoYW5kbGVyKGUpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSwgZmFsc2UpXG4gIH1cblxuICB2YXIgcGFuRml4UmF0aW9cbiAgdmFyIGlzU2Nyb2xsaW5nXG4gIHZhciBpc0ZsaWNrU2Nyb2xsaW5nXG4gIHZhciBjYW5jZWxTY3JvbGxFbmRcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2lzU2Nyb2xsaW5nJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICEhaXNTY3JvbGxpbmdcbiAgICB9XG4gIH0pXG5cbiAgZnVuY3Rpb24gaXNFbmFibGVkKGUpIHtcbiAgICBpZiAoIXRoYXQuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBlLmlzVmVydGljYWwgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGlmICh0aGF0LmF4aXMgPT09ICd5JyAmJiBlLmlzVmVydGljYWxcbiAgICAgICAgICB8fCB0aGF0LmF4aXMgPT09ICd4JyAmJiAhZS5pc1ZlcnRpY2FsKSB7XG4gICAgICAgIC8vIGdlc3R1cmUgaW4gc2FtZSBkaXJlY3Rpb24sIHN0b3AgYnViYmxpbmcgdXBcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZ2VzdHVyZSBpbiBkaWZmZXJlbnQgZGlyZWN0aW9uLCBidWJibGluZyB1cFxuICAgICAgICAvLyB0byB0aGUgdG9wLCB3aXRob3V0IGFueSBvdGhlciBwcm9jZXNzXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBmdW5jdGlvbiB0b3VjaHN0YXJ0SGFuZGxlcihlKSB7XG4gICAgaWYgKCFpc0VuYWJsZWQoZSkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChpc1Njcm9sbGluZykge1xuICAgICAgc2Nyb2xsRW5kKClcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy51c2VGcmFtZUFuaW1hdGlvbikge1xuICAgICAgc2Nyb2xsQW5pbWF0aW9uICYmIHNjcm9sbEFuaW1hdGlvbi5zdG9wKClcbiAgICAgIHNjcm9sbEFuaW1hdGlvbiA9IG51bGxcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHRyYW5zZm9ybSA9IGdldFRyYW5zZm9ybU9mZnNldCh0aGF0KVxuICAgICAgc2V0VHJhbnNmb3JtU3R5bGUodGhhdCwgdHJhbnNmb3JtKVxuICAgICAgc2V0VHJhbnNpdGlvblN0eWxlKHRoYXQsICcnLCAnJylcbiAgICAgIHRyYW5zaXRpb25FbmRIYW5kbGVyID0gbnVsbFxuICAgICAgY2xlYXJUaW1lb3V0KHRyYW5zaXRpb25FbmRUaW1lb3V0SWQpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdG91Y2hlbmRIYW5kbGVyKGUpIHtcbiAgICBpZiAoIWlzRW5hYmxlZChlKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdmFyIHMwID0gZ2V0VHJhbnNmb3JtT2Zmc2V0KHRoYXQpW3RoYXQuYXhpc11cbiAgICB2YXIgYm91bmRhcnlPZmZzZXQgPSBnZXRCb3VuZGFyeU9mZnNldCh0aGF0LCBzMClcblxuICAgIGlmIChib3VuZGFyeU9mZnNldCkge1xuICAgICAgLy8gZHJhZ2dpbmcgb3V0IG9mIGJvdW5kcmF5LCBib3VuY2UgaXMgbmVlZGVkXG4gICAgICB2YXIgczEgPSB0b3VjaEJvdW5kYXJ5KHRoYXQsIHMwKVxuXG4gICAgICBpZiAob3B0aW9ucy51c2VGcmFtZUFuaW1hdGlvbikge1xuICAgICAgICAvLyBmcmFtZVxuICAgICAgICB2YXIgX3MgPSBzMSAtIHMwXG4gICAgICAgIHNjcm9sbEFuaW1hdGlvbiA9IG5ldyBsaWIuYW5pbWF0aW9uKFxuICAgICAgICAgICAgNDAwLFxuICAgICAgICAgICAgbGliLmN1YmljYmV6aWVyLmVhc2UsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgZnVuY3Rpb24gKGkxLCBpMikge1xuICAgICAgICAgIHZhciBvZmZzZXQgPSAoczAgKyBfcyAqIGkyKS50b0ZpeGVkKDIpXG4gICAgICAgICAgc2V0VHJhbnNmb3JtU3R5bGUodGhhdCwgb2Zmc2V0KVxuICAgICAgICAgIGZpcmVFdmVudCh0aGF0LCAnc2Nyb2xsaW5nJylcbiAgICAgICAgfSlcbiAgICAgICAgc2Nyb2xsQW5pbWF0aW9uLm9uZW5kKHNjcm9sbEVuZClcbiAgICAgICAgc2Nyb2xsQW5pbWF0aW9uLnBsYXkoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gY3NzXG4gICAgICAgIHZhciBvZmZzZXQgPSAgczEudG9GaXhlZCgwKVxuICAgICAgICBzZXRUcmFuc2l0aW9uU3R5bGUodGhhdCwgJzAuNHMnLCAnZWFzZScpXG4gICAgICAgIHNldFRyYW5zZm9ybVN0eWxlKHRoYXQsIG9mZnNldClcbiAgICAgICAgc2V0VHJhbnNpdGlvbkVuZEhhbmRsZXIoc2Nyb2xsRW5kLCA0MDApXG5cbiAgICAgICAgbGliLmFuaW1hdGlvbi5yZXF1ZXN0RnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmIChpc1Njcm9sbGluZyAmJiB0aGF0LmVuYWJsZWQpIHtcbiAgICAgICAgICAgIGZpcmVFdmVudCh0aGF0LCAnc2Nyb2xsaW5nJylcbiAgICAgICAgICAgIGxpYi5hbmltYXRpb24ucmVxdWVzdEZyYW1lKGFyZ3VtZW50cy5jYWxsZWUpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBpZiAoYm91bmRhcnlPZmZzZXQgPiAwKSB7XG4gICAgICAgIGZpcmVFdmVudCh0aGF0LCB0aGF0LmF4aXMgPT09ICd5JyA/ICdwdWxsZG93bmVuZCcgOiAncHVsbHJpZ2h0ZW5kJylcbiAgICAgIH0gZWxzZSBpZiAoYm91bmRhcnlPZmZzZXQgPCAwKSB7XG4gICAgICAgIGZpcmVFdmVudCh0aGF0LCB0aGF0LmF4aXMgPT09ICd5JyA/ICdwdWxsdXBlbmQnIDogJ3B1bGxsZWZ0ZW5kJylcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzU2Nyb2xsaW5nKSB7XG4gICAgICAvLyB3aXRob3V0IGV4Y2VlZGluZyB0aGUgYm91bmRhcnksIGp1c3QgZW5kIGl0XG4gICAgICBzY3JvbGxFbmQoKVxuICAgIH1cbiAgfVxuXG4gIHZhciBsYXN0RGlzcGxhY2VtZW50XG4gIGZ1bmN0aW9uIHBhbnN0YXJ0SGFuZGxlcihlKSB7XG4gICAgaWYgKCFpc0VuYWJsZWQoZSkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoYXQudHJhbnNmb3JtT2Zmc2V0ID0gZ2V0VHJhbnNmb3JtT2Zmc2V0KHRoYXQpXG4gICAgdGhhdC5taW5TY3JvbGxPZmZzZXQgPSBnZXRNaW5TY3JvbGxPZmZzZXQodGhhdClcbiAgICB0aGF0Lm1heFNjcm9sbE9mZnNldCA9IGdldE1heFNjcm9sbE9mZnNldCh0aGF0KVxuICAgIHBhbkZpeFJhdGlvID0gMi41XG4gICAgY2FuY2VsU2Nyb2xsRW5kID0gdHJ1ZVxuICAgIGlzU2Nyb2xsaW5nID0gdHJ1ZVxuICAgIGlzRmxpY2tTY3JvbGxpbmcgPSBmYWxzZVxuICAgIGZpcmVFdmVudCh0aGF0LCAnc2Nyb2xsc3RhcnQnKVxuXG4gICAgbGFzdERpc3BsYWNlbWVudCA9IGVbJ2Rpc3BsYWNlbWVudCcgKyB0aGF0LmF4aXMudG9VcHBlckNhc2UoKV1cbiAgfVxuXG5cbiAgZnVuY3Rpb24gcGFuSGFuZGxlcihlKSB7XG4gICAgaWYgKCFpc0VuYWJsZWQoZSkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIGZpbmdlciBtb3ZlIGxlc3MgdGhhbiA1IHB4LiBqdXN0IGlnbm9yZSB0aGF0LlxuICAgIHZhciBkaXNwbGFjZW1lbnQgPSBlWydkaXNwbGFjZW1lbnQnICsgdGhhdC5heGlzLnRvVXBwZXJDYXNlKCldXG4gICAgaWYgKE1hdGguYWJzKGRpc3BsYWNlbWVudCAtIGxhc3REaXNwbGFjZW1lbnQpIDwgNSkge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGxhc3REaXNwbGFjZW1lbnQgPSBkaXNwbGFjZW1lbnRcblxuICAgIHZhciBvZmZzZXQgPSB0aGF0LnRyYW5zZm9ybU9mZnNldFt0aGF0LmF4aXNdICsgZGlzcGxhY2VtZW50XG4gICAgaWYgKG9mZnNldCA+IHRoYXQubWluU2Nyb2xsT2Zmc2V0KSB7XG4gICAgICBvZmZzZXQgPSB0aGF0Lm1pblNjcm9sbE9mZnNldFxuICAgICAgICArIChvZmZzZXQgLSB0aGF0Lm1pblNjcm9sbE9mZnNldCkgLyBwYW5GaXhSYXRpb1xuICAgICAgcGFuRml4UmF0aW8gKj0gMS4wMDNcbiAgICB9IGVsc2UgaWYgKG9mZnNldCA8IHRoYXQubWF4U2Nyb2xsT2Zmc2V0KSB7XG4gICAgICBvZmZzZXQgPSB0aGF0Lm1heFNjcm9sbE9mZnNldFxuICAgICAgICAtICh0aGF0Lm1heFNjcm9sbE9mZnNldCAtIG9mZnNldCkgLyBwYW5GaXhSYXRpb1xuICAgICAgcGFuRml4UmF0aW8gKj0gMS4wMDNcbiAgICB9XG4gICAgaWYgKHBhbkZpeFJhdGlvID4gNCkge1xuICAgICAgcGFuRml4UmF0aW8gPSA0XG4gICAgfVxuXG4gICAgLy8gdGVsbCB3aGV0aGVyIG9yIG5vdCByZWFjaCB0aGUgZnJpbmdlXG4gICAgdmFyIGJvdW5kYXJ5T2Zmc2V0ID0gZ2V0Qm91bmRhcnlPZmZzZXQodGhhdCwgb2Zmc2V0KVxuICAgIGlmIChib3VuZGFyeU9mZnNldCkge1xuICAgICAgZmlyZUV2ZW50KFxuICAgICAgICAgIHRoYXQsXG4gICAgICAgICAgYm91bmRhcnlPZmZzZXQgPiAwXG4gICAgICAgICAgPyAodGhhdC5heGlzID09PSAneScgPyAncHVsbGRvd24nIDogJ3B1bGxyaWdodCcpXG4gICAgICAgICAgOiAodGhhdC5heGlzID09PSAneScgPyAncHVsbHVwJyA6ICdwdWxsbGVmdCcpLCB7XG4gICAgICAgIGJvdW5kYXJ5T2Zmc2V0OiBNYXRoLmFicyhib3VuZGFyeU9mZnNldClcbiAgICAgIH0pXG4gICAgICBpZiAodGhhdC5vcHRpb25zLm5vQm91bmNlKSB7XG4gICAgICAgIG9mZnNldCA9IHRvdWNoQm91bmRhcnkodGhhdCwgb2Zmc2V0KVxuICAgICAgfVxuICAgIH1cblxuICAgIHNldFRyYW5zZm9ybVN0eWxlKHRoYXQsIG9mZnNldC50b0ZpeGVkKDIpKVxuICAgIGZpcmVFdmVudCh0aGF0LCAnc2Nyb2xsaW5nJylcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhbmVuZEhhbmRsZXIoZSkge1xuICAgIGlmICghaXNFbmFibGVkKGUpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoZS5pc2ZsaWNrKSB7XG4gICAgICBmbGlja0hhbmRsZXIoZSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBmbGlja0hhbmRsZXIoZSkge1xuICAgIGNhbmNlbFNjcm9sbEVuZCA9IHRydWVcblxuICAgIHZhciB2MCwgYTAsIHQwLCBzMCwgcywgbW90aW9uMFxuICAgIHZhciB2MSwgYTEsIHQxLCBzMSwgbW90aW9uMSxzaWduXG4gICAgdmFyIHYyLCBhMiwgdDIsIHMyLCBtb3Rpb24yLCBmdFxuXG4gICAgczAgPSBnZXRUcmFuc2Zvcm1PZmZzZXQodGhhdClbdGhhdC5heGlzXVxuICAgIHZhciBib3VuZGFyeU9mZnNldDAgPSBnZXRCb3VuZGFyeU9mZnNldCh0aGF0LCBzMClcbiAgICBpZiAoIWJvdW5kYXJ5T2Zmc2V0MCkge1xuICAgICAgLy8gd2hlbiBmaW5nZXJzIGxlZnQgdGhlIHJhbmdlIG9mIHNjcmVlbiwgbGV0IHRvdWNoIGVuZCBoYW5kbGVyXG4gICAgICAvLyB0byBkZWFsIHdpdGggaXQuXG4gICAgICAvLyB3aGVuIGZpbmdlcnMgbGVmdCB0aGUgc2NyZWVuLCBidXQgc3RpbGwgaW4gdGhlIHJhbmdlIG9mXG4gICAgICAvLyBzY3JlZW4sIGNhbGN1bGF0ZSB0aGUgaW50ZXJ0aWEuXG4gICAgICB2MCA9IGVbJ3ZlbG9jaXR5JyArIHRoYXQuYXhpcy50b1VwcGVyQ2FzZSgpXVxuXG4gICAgICB2YXIgbWF4ViA9IDJcbiAgICAgIHZhciBmcmljdGlvbiA9IDAuMDAxNVxuICAgICAgaWYgKG9wdGlvbnMuaW5lcnRpYSAmJiBpbmVydGlhQ29lZmZpY2llbnRbb3B0aW9ucy5pbmVydGlhXSkge1xuICAgICAgICBtYXhWID0gaW5lcnRpYUNvZWZmaWNpZW50W29wdGlvbnMuaW5lcnRpYV1bMF1cbiAgICAgICAgZnJpY3Rpb24gPSBpbmVydGlhQ29lZmZpY2llbnRbb3B0aW9ucy5pbmVydGlhXVsxXVxuICAgICAgfVxuXG4gICAgICBpZiAodjAgPiBtYXhWKSB7XG4gICAgICAgIHYwID0gbWF4VlxuICAgICAgfVxuICAgICAgaWYgKHYwIDwgLW1heFYpIHtcbiAgICAgICAgdjAgPSAtbWF4VlxuICAgICAgfVxuICAgICAgYTAgPSBmcmljdGlvbiAqICh2MCAvIE1hdGguYWJzKHYwKSlcbiAgICAgIG1vdGlvbjAgPSBuZXcgbGliLm1vdGlvbih7XG4gICAgICAgIHY6IHYwLFxuICAgICAgICBhOiAtYTBcbiAgICAgIH0pXG4gICAgICB0MCA9IG1vdGlvbjAudFxuICAgICAgcyA9IHMwICsgbW90aW9uMC5zXG5cbiAgICAgIHZhciBib3VuZGFyeU9mZnNldDEgPSBnZXRCb3VuZGFyeU9mZnNldCh0aGF0LCBzKVxuICAgICAgaWYgKGJvdW5kYXJ5T2Zmc2V0MSkge1xuICAgICAgICBkZWJ1Z0xvZygnaW5lcnRpYWwgY2FsY3VsYXRpb24gaGFzIGV4Y2VlZGVkIHRoZSBib3VuZGFyeScsXG4gICAgICAgICAgYm91bmRhcnlPZmZzZXQxKVxuXG4gICAgICAgIHYxID0gdjBcbiAgICAgICAgYTEgPSBhMFxuICAgICAgICBpZiAoYm91bmRhcnlPZmZzZXQxID4gMCkge1xuICAgICAgICAgIHMxID0gdGhhdC5taW5TY3JvbGxPZmZzZXRcbiAgICAgICAgICBzaWduID0gMVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMxID0gdGhhdC5tYXhTY3JvbGxPZmZzZXRcbiAgICAgICAgICBzaWduID0gLTFcbiAgICAgICAgfVxuICAgICAgICBtb3Rpb24xID0gbmV3IGxpYi5tb3Rpb24oe1xuICAgICAgICAgIHY6IHNpZ24gKiB2MSxcbiAgICAgICAgICBhOiAtc2lnbiAqIGExLFxuICAgICAgICAgIHM6IE1hdGguYWJzKHMxIC0gczApXG4gICAgICAgIH0pXG4gICAgICAgIHQxID0gbW90aW9uMS50XG4gICAgICAgIHZhciB0aW1lRnVuY3Rpb24xID0gbW90aW9uMS5nZW5lcmF0ZUN1YmljQmV6aWVyKClcblxuICAgICAgICB2MiA9IHYxIC0gYTEgKiB0MVxuICAgICAgICBhMiA9IDAuMDMgKiAodjIgLyBNYXRoLmFicyh2MikpXG4gICAgICAgIG1vdGlvbjIgPSBuZXcgbGliLm1vdGlvbih7XG4gICAgICAgICAgdjogdjIsXG4gICAgICAgICAgYTogLWEyXG4gICAgICAgIH0pXG4gICAgICAgIHQyID0gbW90aW9uMi50XG4gICAgICAgIHMyID0gczEgKyBtb3Rpb24yLnNcbiAgICAgICAgdmFyIHRpbWVGdW5jdGlvbjIgPSBtb3Rpb24yLmdlbmVyYXRlQ3ViaWNCZXppZXIoKVxuXG4gICAgICAgIGlmIChvcHRpb25zLm5vQm91bmNlKSB7XG4gICAgICAgICAgZGVidWdMb2coJ25vIGJvdW5jZSBlZmZlY3QnKVxuXG4gICAgICAgICAgaWYgKHMwICE9PSBzMSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMudXNlRnJhbWVBbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgLy8gZnJhbWVcbiAgICAgICAgICAgICAgdmFyIF9zID0gczEgLSBzMFxuICAgICAgICAgICAgICB2YXIgYmV6aWVyID0gbGliLmN1YmljYmV6aWVyKFxuICAgICAgICAgICAgICAgIHRpbWVGdW5jdGlvbjFbMF1bMF0sXG4gICAgICAgICAgICAgICAgdGltZUZ1bmN0aW9uMVswXVsxXSxcbiAgICAgICAgICAgICAgICB0aW1lRnVuY3Rpb24xWzFdWzBdLFxuICAgICAgICAgICAgICAgIHRpbWVGdW5jdGlvbjFbMV1bMV1cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICBzY3JvbGxBbmltYXRpb24gPSBuZXcgbGliLmFuaW1hdGlvbihcbiAgICAgICAgICAgICAgICAgIHQxLnRvRml4ZWQoMCksXG4gICAgICAgICAgICAgICAgICBiZXppZXIsXG4gICAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGkxLCBpMikge1xuICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSAoczAgKyBfcyAqIGkyKVxuICAgICAgICAgICAgICAgIGdldFRyYW5zZm9ybU9mZnNldCh0aGF0LCBvZmZzZXQudG9GaXhlZCgyKSlcbiAgICAgICAgICAgICAgICBmaXJlRXZlbnQodGhhdCwgJ3Njcm9sbGluZycsIHtcbiAgICAgICAgICAgICAgICAgIGFmdGVyRmxpY2s6IHRydWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgIHNjcm9sbEFuaW1hdGlvbi5vbmVuZChzY3JvbGxFbmQpXG5cbiAgICAgICAgICAgICAgc2Nyb2xsQW5pbWF0aW9uLnBsYXkoKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gY3NzXG4gICAgICAgICAgICAgIHZhciBvZmZzZXQgPSBzMS50b0ZpeGVkKDApXG4gICAgICAgICAgICAgIHNldFRyYW5zaXRpb25TdHlsZShcbiAgICAgICAgICAgICAgICB0aGF0LFxuICAgICAgICAgICAgICAgICh0MSAvIDEwMDApLnRvRml4ZWQoMikgKyAncycsXG4gICAgICAgICAgICAgICAgJ2N1YmljLWJlemllcignICsgdGltZUZ1bmN0aW9uMSArICcpJ1xuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIHNldFRyYW5zZm9ybVN0eWxlKHRoYXQsIG9mZnNldClcbiAgICAgICAgICAgICAgc2V0VHJhbnNpdGlvbkVuZEhhbmRsZXIoXG4gICAgICAgICAgICAgICAgc2Nyb2xsRW5kLFxuICAgICAgICAgICAgICAgICh0MSAvIDEwMDApLnRvRml4ZWQoMikgKiAxMDAwXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Nyb2xsRW5kKClcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoczAgIT09IHMyKSB7XG4gICAgICAgICAgZGVidWdMb2coXG4gICAgICAgICAgICAnc2Nyb2xsIGZvciBpbmVydGlhJyxcbiAgICAgICAgICAgICdzPScgKyBzMi50b0ZpeGVkKDApLFxuICAgICAgICAgICAgJ3Q9JyArICgodDEgKyB0MikgLyAxMDAwKS50b0ZpeGVkKDIpXG4gICAgICAgICAgKVxuXG4gICAgICAgICAgaWYgKG9wdGlvbnMudXNlRnJhbWVBbmltYXRpb24pIHtcbiAgICAgICAgICAgIHZhciBfcyA9IHMyIC0gczBcbiAgICAgICAgICAgIHZhciBiZXppZXIgPSBsaWIuY3ViaWNiZXppZXIuZWFzZU91dFxuICAgICAgICAgICAgc2Nyb2xsQW5pbWF0aW9uID0gbmV3IGxpYi5hbmltYXRpb24oXG4gICAgICAgICAgICAgICAgKHQxICsgdDIpLnRvRml4ZWQoMCksXG4gICAgICAgICAgICAgICAgYmV6aWVyLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGkxLCBpMikge1xuICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gczAgKyBfcyAqIGkyXG4gICAgICAgICAgICAgIHNldFRyYW5zZm9ybVN0eWxlKHRoYXQsIG9mZnNldC50b0ZpeGVkKDIpKVxuICAgICAgICAgICAgICBmaXJlRXZlbnQodGhhdCwgJ3Njcm9sbGluZycse1xuICAgICAgICAgICAgICAgIGFmdGVyRmxpY2s6IHRydWVcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHNjcm9sbEFuaW1hdGlvbi5vbmVuZChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmICghdGhhdC5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB2YXIgX3MgPSBzMSAtIHMyXG4gICAgICAgICAgICAgIHZhciBiZXppZXIgPSBsaWIuY3ViaWNiZXppZXIuZWFzZVxuICAgICAgICAgICAgICBzY3JvbGxBbmltYXRpb24gPSBuZXcgbGliLmFuaW1hdGlvbihcbiAgICAgICAgICAgICAgICAgIDQwMCxcbiAgICAgICAgICAgICAgICAgIGJlemllcixcbiAgICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoaTEsIGkyKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IHMyICsgX3MgKiBpMlxuICAgICAgICAgICAgICAgIHNldFRyYW5zZm9ybVN0eWxlKHRoYXQsIG9mZnNldC50b0ZpeGVkKDIpKVxuICAgICAgICAgICAgICAgIGZpcmVFdmVudCh0aGF0LCAnc2Nyb2xsaW5nJyx7XG4gICAgICAgICAgICAgICAgICBhZnRlckZsaWNrOiB0cnVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICBzY3JvbGxBbmltYXRpb24ub25lbmQoc2Nyb2xsRW5kKVxuXG4gICAgICAgICAgICAgIHNjcm9sbEFuaW1hdGlvbi5wbGF5KClcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHNjcm9sbEFuaW1hdGlvbi5wbGF5KClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHMyLnRvRml4ZWQoMClcbiAgICAgICAgICAgIHNldFRyYW5zaXRpb25TdHlsZShcbiAgICAgICAgICAgICAgdGhhdCxcbiAgICAgICAgICAgICAgKCh0MSArIHQyKSAvIDEwMDApLnRvRml4ZWQoMikgKyAncycsXG4gICAgICAgICAgICAgICdlYXNlLW91dCdcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIHNldFRyYW5zZm9ybVN0eWxlKHRoYXQsIG9mZnNldClcblxuICAgICAgICAgICAgc2V0VHJhbnNpdGlvbkVuZEhhbmRsZXIoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgaWYgKCF0aGF0LmVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGRlYnVnTG9nKCdpbmVydGlhbCBib3VuY2UnLFxuICAgICAgICAgICAgICAgICdzPScgKyBzMS50b0ZpeGVkKDApLFxuICAgICAgICAgICAgICAgICd0PTQwMCdcbiAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgIGlmIChzMiAhPT0gczEpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gczEudG9GaXhlZCgwKVxuICAgICAgICAgICAgICAgIHNldFRyYW5zaXRpb25TdHlsZSh0aGF0LCAnMC40cycsICdlYXNlJylcbiAgICAgICAgICAgICAgICBzZXRUcmFuc2Zvcm1TdHlsZSh0aGF0LCBvZmZzZXQpXG4gICAgICAgICAgICAgICAgc2V0VHJhbnNpdGlvbkVuZEhhbmRsZXIoc2Nyb2xsRW5kLCA0MDApXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsRW5kKClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgKCh0MSArIHQyKSAvIDEwMDApLnRvRml4ZWQoMikgKiAxMDAwKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzY3JvbGxFbmQoKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWJ1Z0xvZygnaW5lcnRpYWwgY2FsY3VsYXRpb24gaGFzblxcJ3QgZXhjZWVkZWQgdGhlIGJvdW5kYXJ5JylcbiAgICAgICAgdmFyIHRpbWVGdW5jdGlvbiA9IG1vdGlvbjAuZ2VuZXJhdGVDdWJpY0JlemllcigpXG5cbiAgICAgICAgaWYgKG9wdGlvbnMudXNlRnJhbWVBbmltYXRpb24pIHtcbiAgICAgICAgICAvLyBmcmFtZVxuICAgICAgICAgIHZhciBfcyA9IHMgLSBzMFxuICAgICAgICAgIHZhciBiZXppZXIgPSBsaWIuY3ViaWNiZXppZXIoXG4gICAgICAgICAgICB0aW1lRnVuY3Rpb25bMF1bMF0sXG4gICAgICAgICAgICB0aW1lRnVuY3Rpb25bMF1bMV0sXG4gICAgICAgICAgICB0aW1lRnVuY3Rpb25bMV1bMF0sXG4gICAgICAgICAgICB0aW1lRnVuY3Rpb25bMV1bMV1cbiAgICAgICAgICApXG4gICAgICAgICAgc2Nyb2xsQW5pbWF0aW9uID0gbmV3IGxpYi5hbmltYXRpb24oXG4gICAgICAgICAgICAgIHQwLnRvRml4ZWQoMCksXG4gICAgICAgICAgICAgIGJlemllcixcbiAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgZnVuY3Rpb24gKGkxLCBpMikge1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9IChzMCArIF9zICogaTIpLnRvRml4ZWQoMilcbiAgICAgICAgICAgIHNldFRyYW5zZm9ybVN0eWxlKHRoYXQsIG9mZnNldClcbiAgICAgICAgICAgIGZpcmVFdmVudCh0aGF0LCAnc2Nyb2xsaW5nJyx7XG4gICAgICAgICAgICAgIGFmdGVyRmxpY2s6IHRydWVcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHNjcm9sbEFuaW1hdGlvbi5vbmVuZChzY3JvbGxFbmQpXG5cbiAgICAgICAgICBzY3JvbGxBbmltYXRpb24ucGxheSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gY3NzXG4gICAgICAgICAgdmFyIG9mZnNldCA9IHMudG9GaXhlZCgwKVxuICAgICAgICAgIHNldFRyYW5zaXRpb25TdHlsZShcbiAgICAgICAgICAgIHRoYXQsXG4gICAgICAgICAgICAodDAgLyAxMDAwKS50b0ZpeGVkKDIpICsgJ3MnLFxuICAgICAgICAgICAgJ2N1YmljLWJlemllcignICsgdGltZUZ1bmN0aW9uICsgJyknXG4gICAgICAgICAgKVxuICAgICAgICAgIHNldFRyYW5zZm9ybVN0eWxlKHRoYXQsIG9mZnNldClcbiAgICAgICAgICBzZXRUcmFuc2l0aW9uRW5kSGFuZGxlcihzY3JvbGxFbmQsICh0MCAvIDEwMDApLnRvRml4ZWQoMikgKiAxMDAwKVxuICAgICAgICB9XG4gICAgICB9XG5cblxuICAgICAgaXNGbGlja1Njcm9sbGluZyA9IHRydWVcbiAgICAgIGlmICghb3B0aW9ucy51c2VGcmFtZUFuaW1hdGlvbikge1xuICAgICAgICBsaWIuYW5pbWF0aW9uLnJlcXVlc3RGcmFtZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKGlzU2Nyb2xsaW5nICYmIGlzRmxpY2tTY3JvbGxpbmcgJiYgdGhhdC5lbmFibGVkKSB7XG4gICAgICAgICAgICBmaXJlRXZlbnQodGhhdCwgJ3Njcm9sbGluZycsIHtcbiAgICAgICAgICAgICAgYWZ0ZXJGbGljazogdHJ1ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGxpYi5hbmltYXRpb24ucmVxdWVzdEZyYW1lKGFyZ3VtZW50cy5jYWxsZWUpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNjcm9sbEVuZCgpIHtcbiAgICBpZiAoIXRoYXQuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY2FuY2VsU2Nyb2xsRW5kID0gZmFsc2VcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCFjYW5jZWxTY3JvbGxFbmQgJiYgaXNTY3JvbGxpbmcpIHtcbiAgICAgICAgaXNTY3JvbGxpbmcgPSBmYWxzZVxuICAgICAgICBpc0ZsaWNrU2Nyb2xsaW5nID0gZmFsc2VcblxuICAgICAgICBpZiAob3B0aW9ucy51c2VGcmFtZUFuaW1hdGlvbikge1xuICAgICAgICAgIHNjcm9sbEFuaW1hdGlvbiAmJiBzY3JvbGxBbmltYXRpb24uc3RvcCgpXG4gICAgICAgICAgc2Nyb2xsQW5pbWF0aW9uID0gbnVsbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFRyYW5zaXRpb25TdHlsZSh0aGF0LCAnJywgJycpXG4gICAgICAgIH1cbiAgICAgICAgZmlyZUV2ZW50KHRoYXQsICdzY3JvbGxlbmQnKVxuICAgICAgfVxuICAgIH0sIDUwKVxuICB9XG5cbiAgdmFyIHByb3RvID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuZW5hYmxlKClcbiAgICAgIHRoaXMucmVmcmVzaCgpXG4gICAgICB0aGlzLnNjcm9sbFRvKDApXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH0sXG5cbiAgICBlbmFibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuZW5hYmxlZCA9IHRydWVcbiAgICAgIHJldHVybiB0aGlzXG4gICAgfSxcblxuICAgIGRpc2FibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBlbCA9IHRoaXMuZWxlbWVudFxuICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2VcblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy51c2VGcmFtZUFuaW1hdGlvbikge1xuICAgICAgICBzY3JvbGxBbmltYXRpb24gJiYgc2Nyb2xsQW5pbWF0aW9uLnN0b3AoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliLmFuaW1hdGlvbi5yZXF1ZXN0RnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGVsLnN0eWxlW3N0eWxlUHJlZml4ICsgJ1RyYW5zZm9ybSddXG4gICAgICAgICAgICA9IGdldENvbXB1dGVkU3R5bGUoZWwpW3N0eWxlUHJlZml4ICsgJ1RyYW5zZm9ybSddXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfSxcblxuICAgIGdldFNjcm9sbFdpZHRoOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRoaXMuZWxlbWVudCkud2lkdGhcbiAgICB9LFxuXG4gICAgZ2V0U2Nyb2xsSGVpZ2h0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRoaXMuZWxlbWVudCkuaGVpZ2h0XG4gICAgfSxcblxuICAgIGdldFNjcm9sbExlZnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAtZ2V0VHJhbnNmb3JtT2Zmc2V0KHRoaXMpLnggLSB0aGlzLm9wdGlvbnMueFBhZGRpbmdUb3BcbiAgICB9LFxuXG4gICAgZ2V0U2Nyb2xsVG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gLWdldFRyYW5zZm9ybU9mZnNldCh0aGlzKS55IC0gdGhpcy5vcHRpb25zLnlQYWRkaW5nVG9wXG4gICAgfSxcblxuICAgIGdldE1heFNjcm9sbExlZnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAtdGhhdC5tYXhTY3JvbGxPZmZzZXQgLSB0aGlzLm9wdGlvbnMueFBhZGRpbmdUb3BcbiAgICB9LFxuXG4gICAgZ2V0TWF4U2Nyb2xsVG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gLXRoYXQubWF4U2Nyb2xsT2Zmc2V0IC0gdGhpcy5vcHRpb25zLnlQYWRkaW5nVG9wXG4gICAgfSxcblxuICAgIGdldEJvdW5kYXJ5T2Zmc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gTWF0aC5hYnMoXG4gICAgICAgIGdldEJvdW5kYXJ5T2Zmc2V0KHRoaXMsIGdldFRyYW5zZm9ybU9mZnNldCh0aGlzKVt0aGlzLmF4aXNdKSB8fCAwXG4gICAgICApXG4gICAgfSxcblxuICAgIHJlZnJlc2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBlbCA9IHRoaXMuZWxlbWVudFxuICAgICAgdmFyIGlzVmVydGljYWwgPSAodGhpcy5heGlzID09PSAneScpXG4gICAgICB2YXIgdHlwZSA9IGlzVmVydGljYWw/J2hlaWdodCc6J3dpZHRoJ1xuXG4gICAgICBpZiAodGhpcy5vcHRpb25zW3R5cGVdICE9IG51bGwpIHtcbiAgICAgICAgLy8gdXNlIG9wdGlvbnNcbiAgICAgICAgZWwuc3R5bGVbdHlwZV0gPSB0aGlzLm9wdGlvbnNbdHlwZV0gKyAncHgnXG4gICAgICB9IGVsc2UgaWYgKCEhdGhpcy5vcHRpb25zLnVzZUVsZW1lbnRSZWN0KSB7XG4gICAgICAgIGVsLnN0eWxlW3R5cGVdID0gJ2F1dG8nXG4gICAgICAgIGVsLnN0eWxlW3R5cGVdID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsKVt0eXBlXSArICdweCdcbiAgICAgIH0gZWxzZSBpZiAoZWwuY2hpbGRFbGVtZW50Q291bnQgPiAwKSB7XG4gICAgICAgIHZhciByYW5nZVxuICAgICAgICB2YXIgcmVjdFxuICAgICAgICB2YXIgZmlyc3RFbCA9IGVsLmZpcnN0RWxlbWVudENoaWxkXG4gICAgICAgIHZhciBsYXN0RWwgPSBlbC5sYXN0RWxlbWVudENoaWxkXG5cbiAgICAgICAgaWYgKGRvY3VtZW50LmNyZWF0ZVJhbmdlICYmICF0aGlzLm9wdGlvbnMuaWdub3JlT3ZlcmZsb3cpIHtcbiAgICAgICAgICAvLyB1c2UgcmFuZ2VcbiAgICAgICAgICByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKClcbiAgICAgICAgICByYW5nZS5zZWxlY3ROb2RlQ29udGVudHMoZWwpXG4gICAgICAgICAgcmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdChyYW5nZSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZWN0KSB7XG4gICAgICAgICAgZWwuc3R5bGVbdHlwZV0gPSByZWN0W3R5cGVdICsgJ3B4J1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHVzZSBjaGlsZCBvZmZzZXRzXG4gICAgICAgICAgd2hpbGUgKGZpcnN0RWwpIHtcbiAgICAgICAgICAgIGlmIChnZXRCb3VuZGluZ0NsaWVudFJlY3QoZmlyc3RFbClbdHlwZV0gPT09IDBcbiAgICAgICAgICAgICAgICAmJiBmaXJzdEVsLm5leHRFbGVtZW50U2libGluZykge1xuICAgICAgICAgICAgICBmaXJzdEVsID0gZmlyc3RFbC5uZXh0RWxlbWVudFNpYmxpbmdcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgd2hpbGUgKGxhc3RFbCAmJiBsYXN0RWwgIT09IGZpcnN0RWwpIHtcbiAgICAgICAgICAgIGlmIChnZXRCb3VuZGluZ0NsaWVudFJlY3QobGFzdEVsKVt0eXBlXSA9PT0gMFxuICAgICAgICAgICAgICAgICYmIGxhc3RFbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nKSB7XG4gICAgICAgICAgICAgIGxhc3RFbCA9IGxhc3RFbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsLnN0eWxlW3R5cGVdID0gKGdldEJvdW5kaW5nQ2xpZW50UmVjdChsYXN0RWwpW1xuICAgICAgICAgICAgICBpc1ZlcnRpY2FsID8gJ2JvdHRvbScgOiAncmlnaHQnXVxuICAgICAgICAgICAgLSBnZXRCb3VuZGluZ0NsaWVudFJlY3QoZmlyc3RFbClbXG4gICAgICAgICAgICAgIGlzVmVydGljYWwgPyAndG9wJyA6ICdsZWZ0J10pXG4gICAgICAgICAgICArICdweCdcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLnRyYW5zZm9ybU9mZnNldCA9IGdldFRyYW5zZm9ybU9mZnNldCh0aGlzKVxuICAgICAgdGhpcy5taW5TY3JvbGxPZmZzZXQgPSBnZXRNaW5TY3JvbGxPZmZzZXQodGhpcylcbiAgICAgIHRoaXMubWF4U2Nyb2xsT2Zmc2V0ID0gZ2V0TWF4U2Nyb2xsT2Zmc2V0KHRoaXMpXG4gICAgICB0aGlzLnNjcm9sbFRvKFxuICAgICAgICAtdGhpcy50cmFuc2Zvcm1PZmZzZXRbdGhpcy5heGlzXVxuICAgICAgICAtIHRoaXMub3B0aW9uc1t0aGlzLmF4aXMgKyAnUGFkZGluZ1RvcCddXG4gICAgICApXG4gICAgICBmaXJlRXZlbnQodGhpcywgJ2NvbnRlbnRyZWZyZXNoJylcblxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9LFxuXG4gICAgb2Zmc2V0OiBmdW5jdGlvbiAoY2hpbGRFbCkge1xuICAgICAgdmFyIGVsUmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdCh0aGlzLmVsZW1lbnQpXG4gICAgICB2YXIgY2hpbGRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGNoaWxkRWwpXG4gICAgICBpZiAodGhpcy5heGlzID09PSAneScpIHtcbiAgICAgICAgdmFyIG9mZnNldFJlY3QgPSB7XG4gICAgICAgICAgdG9wOiBjaGlsZFJlY3QudG9wIC0gZWxSZWN0LnRvcCAtIHRoaXMub3B0aW9ucy55UGFkZGluZ1RvcCxcbiAgICAgICAgICBsZWZ0OiBjaGlsZFJlY3QubGVmdCAtIGVsUmVjdC5sZWZ0LFxuICAgICAgICAgIHJpZ2h0OiBlbFJlY3QucmlnaHQgLSBjaGlsZFJlY3QucmlnaHQsXG4gICAgICAgICAgd2lkdGg6IGNoaWxkUmVjdC53aWR0aCxcbiAgICAgICAgICBoZWlnaHQ6IGNoaWxkUmVjdC5oZWlnaHRcbiAgICAgICAgfVxuXG4gICAgICAgIG9mZnNldFJlY3QuYm90dG9tID0gb2Zmc2V0UmVjdC50b3AgKyBvZmZzZXRSZWN0LmhlaWdodFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG9mZnNldFJlY3QgPSB7XG4gICAgICAgICAgdG9wOiBjaGlsZFJlY3QudG9wIC0gZWxSZWN0LnRvcCxcbiAgICAgICAgICBib3R0b206IGVsUmVjdC5ib3R0b20gLSBjaGlsZFJlY3QuYm90dG9tLFxuICAgICAgICAgIGxlZnQ6IGNoaWxkUmVjdC5sZWZ0IC0gZWxSZWN0LmxlZnQgLSB0aGlzLm9wdGlvbnMueFBhZGRpbmdUb3AsXG4gICAgICAgICAgd2lkdGg6IGNoaWxkUmVjdC53aWR0aCxcbiAgICAgICAgICBoZWlnaHQ6IGNoaWxkUmVjdC5oZWlnaHRcbiAgICAgICAgfVxuXG4gICAgICAgIG9mZnNldFJlY3QucmlnaHQgPSBvZmZzZXRSZWN0LmxlZnQgKyBvZmZzZXRSZWN0LndpZHRoXG4gICAgICB9XG4gICAgICByZXR1cm4gb2Zmc2V0UmVjdFxuICAgIH0sXG5cbiAgICBnZXRSZWN0OiBmdW5jdGlvbiAoY2hpbGRFbCkge1xuICAgICAgdmFyIHZpZXdSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRoaXMudmlld3BvcnQpXG4gICAgICB2YXIgY2hpbGRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGNoaWxkRWwpXG4gICAgICBpZiAodGhpcy5heGlzID09PSAneScpIHtcbiAgICAgICAgdmFyIG9mZnNldFJlY3QgPSB7XG4gICAgICAgICAgdG9wOiBjaGlsZFJlY3QudG9wIC0gdmlld1JlY3QudG9wLFxuICAgICAgICAgIGxlZnQ6IGNoaWxkUmVjdC5sZWZ0IC0gdmlld1JlY3QubGVmdCxcbiAgICAgICAgICByaWdodDogdmlld1JlY3QucmlnaHQgLSBjaGlsZFJlY3QucmlnaHQsXG4gICAgICAgICAgd2lkdGg6IGNoaWxkUmVjdC53aWR0aCxcbiAgICAgICAgICBoZWlnaHQ6IGNoaWxkUmVjdC5oZWlnaHRcbiAgICAgICAgfVxuXG4gICAgICAgIG9mZnNldFJlY3QuYm90dG9tID0gb2Zmc2V0UmVjdC50b3AgKyBvZmZzZXRSZWN0LmhlaWdodFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG9mZnNldFJlY3QgPSB7XG4gICAgICAgICAgdG9wOiBjaGlsZFJlY3QudG9wIC0gdmlld1JlY3QudG9wLFxuICAgICAgICAgIGJvdHRvbTogdmlld1JlY3QuYm90dG9tIC0gY2hpbGRSZWN0LmJvdHRvbSxcbiAgICAgICAgICBsZWZ0OiBjaGlsZFJlY3QubGVmdCAtIHZpZXdSZWN0LmxlZnQsXG4gICAgICAgICAgd2lkdGg6IGNoaWxkUmVjdC53aWR0aCxcbiAgICAgICAgICBoZWlnaHQ6IGNoaWxkUmVjdC5oZWlnaHRcbiAgICAgICAgfVxuXG4gICAgICAgIG9mZnNldFJlY3QucmlnaHQgPSBvZmZzZXRSZWN0LmxlZnQgKyBvZmZzZXRSZWN0LndpZHRoXG4gICAgICB9XG4gICAgICByZXR1cm4gb2Zmc2V0UmVjdFxuICAgIH0sXG5cbiAgICBpc0luVmlldzogZnVuY3Rpb24gKGNoaWxkRWwpIHtcbiAgICAgIHZhciB2aWV3UmVjdCA9IHRoaXMuZ2V0UmVjdCh0aGlzLnZpZXdwb3J0KVxuICAgICAgdmFyIGNoaWxkUmVjdCA9IHRoaXMuZ2V0UmVjdChjaGlsZEVsKVxuICAgICAgaWYgKHRoaXMuYXhpcyA9PT0gJ3knKSB7XG4gICAgICAgIHJldHVybiB2aWV3UmVjdC50b3AgPCBjaGlsZFJlY3QuYm90dG9tXG4gICAgICAgICAgJiYgdmlld1JlY3QuYm90dG9tID4gY2hpbGRSZWN0LnRvcFxuICAgICAgfVxuICAgICAgcmV0dXJuIHZpZXdSZWN0LmxlZnQgPCBjaGlsZFJlY3QucmlnaHRcbiAgICAgICAgJiYgdmlld1JlY3QucmlnaHQgPiBjaGlsZFJlY3QubGVmdFxuICAgIH0sXG5cbiAgICBzY3JvbGxUbzogZnVuY3Rpb24gKG9mZnNldCwgaXNTbW9vdGgpIHtcbiAgICAgIHZhciB0aGF0ID0gdGhpc1xuICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnRcblxuICAgICAgb2Zmc2V0ID0gLW9mZnNldCAtIHRoaXMub3B0aW9uc1t0aGlzLmF4aXMgKyAnUGFkZGluZ1RvcCddXG4gICAgICBvZmZzZXQgPSB0b3VjaEJvdW5kYXJ5KHRoaXMsIG9mZnNldClcblxuICAgICAgaXNTY3JvbGxpbmcgPSB0cnVlXG4gICAgICBpZiAoaXNTbW9vdGggPT09IHRydWUpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy51c2VGcmFtZUFuaW1hdGlvbikge1xuICAgICAgICAgIHZhciBzMCA9IGdldFRyYW5zZm9ybU9mZnNldCh0aGF0KVt0aGlzLmF4aXNdXG4gICAgICAgICAgdmFyIF9zID0gb2Zmc2V0IC0gczBcbiAgICAgICAgICBzY3JvbGxBbmltYXRpb24gPSBuZXcgbGliLmFuaW1hdGlvbihcbiAgICAgICAgICAgICAgNDAwLFxuICAgICAgICAgICAgICBsaWIuY3ViaWNiZXppZXIuZWFzZUluT3V0LFxuICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICBmdW5jdGlvbiAoaTEsIGkyKSB7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gKHMwICsgX3MgKiBpMikudG9GaXhlZCgyKVxuICAgICAgICAgICAgc2V0VHJhbnNmb3JtU3R5bGUodGhhdCwgb2Zmc2V0KVxuICAgICAgICAgICAgZmlyZUV2ZW50KHRoYXQsICdzY3JvbGxpbmcnKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBzY3JvbGxBbmltYXRpb24ub25lbmQoc2Nyb2xsRW5kKVxuXG4gICAgICAgICAgc2Nyb2xsQW5pbWF0aW9uLnBsYXkoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFRyYW5zaXRpb25TdHlsZSh0aGF0LCAnMC40cycsICdlYXNlLWluLW91dCcpXG4gICAgICAgICAgc2V0VHJhbnNmb3JtU3R5bGUodGhhdCwgb2Zmc2V0KVxuICAgICAgICAgIHNldFRyYW5zaXRpb25FbmRIYW5kbGVyKHNjcm9sbEVuZCwgNDAwKVxuXG4gICAgICAgICAgbGliLmFuaW1hdGlvbi5yZXF1ZXN0RnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGlzU2Nyb2xsaW5nICYmIHRoYXQuZW5hYmxlZCkge1xuICAgICAgICAgICAgICBmaXJlRXZlbnQodGhhdCwgJ3Njcm9sbGluZycpXG4gICAgICAgICAgICAgIGxpYi5hbmltYXRpb24ucmVxdWVzdEZyYW1lKGFyZ3VtZW50cy5jYWxsZWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMudXNlRnJhbWVBbmltYXRpb24pIHtcbiAgICAgICAgICBzZXRUcmFuc2l0aW9uU3R5bGUodGhhdCwgJycsICcnKVxuICAgICAgICB9XG4gICAgICAgIHNldFRyYW5zZm9ybVN0eWxlKHRoYXQsIG9mZnNldClcbiAgICAgICAgc2Nyb2xsRW5kKClcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9LFxuXG4gICAgc2Nyb2xsVG9FbGVtZW50OiBmdW5jdGlvbiAoY2hpbGRFbCwgaXNTbW9vdGgpIHtcbiAgICAgIHZhciBvZmZzZXQgPSB0aGlzLm9mZnNldChjaGlsZEVsKVxuICAgICAgb2Zmc2V0ID0gb2Zmc2V0W3RoaXMuYXhpcyA9PT0gJ3knPyd0b3AnOidsZWZ0J11cbiAgICAgIHJldHVybiB0aGlzLnNjcm9sbFRvKG9mZnNldCwgaXNTbW9vdGgpXG4gICAgfSxcblxuICAgIGdldFZpZXdXaWR0aDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGdldEJvdW5kaW5nQ2xpZW50UmVjdCh0aGlzLnZpZXdwb3J0KS53aWR0aFxuICAgIH0sXG5cbiAgICBnZXRWaWV3SGVpZ2h0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRoaXMudmlld3BvcnQpLmhlaWdodFxuICAgIH0sXG5cbiAgICBhZGRQdWxsZG93bkhhbmRsZXI6IGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdwdWxsZG93bmVuZCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoYXQuZGlzYWJsZSgpXG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGF0LCBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdGhhdC5zY3JvbGxUbygwLCB0cnVlKVxuICAgICAgICAgIHRoYXQucmVmcmVzaCgpXG4gICAgICAgICAgdGhhdC5lbmFibGUoKVxuICAgICAgICB9KVxuICAgICAgfSwgZmFsc2UpXG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfSxcblxuICAgIGFkZFB1bGx1cEhhbmRsZXI6IGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgICB2YXIgdGhhdCA9IHRoaXNcblxuICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3B1bGx1cGVuZCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoYXQuZGlzYWJsZSgpXG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGF0LCBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdGhhdC5zY3JvbGxUbyh0aGF0LmdldFNjcm9sbEhlaWdodCgpLCB0cnVlKVxuICAgICAgICAgIHRoYXQucmVmcmVzaCgpXG4gICAgICAgICAgdGhhdC5lbmFibGUoKVxuICAgICAgICB9KVxuICAgICAgfSwgZmFsc2UpXG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfSxcblxuICAgIGFkZFNjcm9sbHN0YXJ0SGFuZGxlcjogZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICAgIHZhciB0aGF0ID0gdGhpc1xuICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbHN0YXJ0JywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoYXQsIGUpXG4gICAgICB9LCBmYWxzZSlcblxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9LFxuXG4gICAgYWRkU2Nyb2xsaW5nSGFuZGxlcjogZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICAgIHZhciB0aGF0ID0gdGhpc1xuICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbGluZycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGF0LCBlKVxuICAgICAgfSwgZmFsc2UpXG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfSxcblxuICAgIGFkZFNjcm9sbGVuZEhhbmRsZXI6IGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGxlbmQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBoYW5kbGVyLmNhbGwodGhhdCwgZSlcbiAgICAgIH0sIGZhbHNlKVxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH0sXG5cbiAgICBhZGRDb250ZW50cmVuZnJlc2hIYW5kbGVyOiBmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY29udGVudHJlZnJlc2gnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBoYW5kbGVyLmNhbGwodGhhdCwgZSlcbiAgICAgIH0sIGZhbHNlKVxuICAgIH0sXG5cbiAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbiAobmFtZSwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICAgICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBoYW5kbGVyLmNhbGwodGhhdCwgZSlcbiAgICAgIH0sICEhdXNlQ2FwdHVyZSlcbiAgICB9LFxuXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24gKG5hbWUsIGhhbmRsZXIpIHtcbiAgICAgIHZhciB0aGF0ID0gdGhpc1xuICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoYXQsIGUpXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBlbmFibGVQbHVnaW46IGZ1bmN0aW9uIChuYW1lLCBvcHRpb25zKSB7XG4gICAgICB2YXIgcGx1Z2luID0gcGx1Z2luc1tuYW1lXVxuICAgICAgaWYgKHBsdWdpbiAmJiAhdGhpcy5wbHVnaW5zW25hbWVdKSB7XG4gICAgICAgIHRoaXMucGx1Z2luc1tuYW1lXSA9IHRydWVcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICAgICAgcGx1Z2luLmNhbGwodGhpcywgbmFtZSwgb3B0aW9ucylcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICB9XG5cbiAgZm9yICh2YXIgayBpbiBwcm90bykge1xuICAgIHRoaXNba10gPSBwcm90b1trXVxuICB9XG4gIGRlbGV0ZSBwcm90b1xufVxuXG5saWIuc2Nyb2xsID0gZnVuY3Rpb24gKGVsLCBvcHRpb25zKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmICEoYXJndW1lbnRzWzBdIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgb3B0aW9ucyA9IGFyZ3VtZW50c1swXVxuICAgIGlmIChvcHRpb25zLnNjcm9sbEVsZW1lbnQpIHtcbiAgICAgIGVsID0gb3B0aW9ucy5zY3JvbGxFbGVtZW50XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLnNjcm9sbFdyYXApIHtcbiAgICAgIGVsID0gb3B0aW9ucy5zY3JvbGxXcmFwLmZpcnN0RWxlbWVudENoaWxkXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gc2Nyb2xsIGVsZW1lbnQnKVxuICAgIH1cbiAgfVxuXG4gIGlmICghZWwucGFyZW50Tm9kZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignd3JvbmcgZG9tIHRyZWUnKVxuICB9XG4gIGlmIChvcHRpb25zXG4gICAgICAmJiBvcHRpb25zLmRpcmVjdGlvblxuICAgICAgJiYgWyd4JywgJ3knXS5pbmRleE9mKG9wdGlvbnMuZGlyZWN0aW9uKSA8IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3dyb25nIGRpcmVjdGlvbicpXG4gIH1cblxuICB2YXIgc2Nyb2xsXG4gIGlmIChvcHRpb25zLmRvd25ncmFkZSA9PT0gdHJ1ZVxuICAgICAgJiYgbGliLnNjcm9sbC5kb3duZ3JhZGUpIHtcbiAgICBzY3JvbGwgPSBsaWIuc2Nyb2xsLmRvd25ncmFkZShlbCwgb3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBpZiAoZWwuc2Nyb2xsSWQpIHtcbiAgICAgIHNjcm9sbCA9IHNjcm9sbE9ianNbZWwuc2Nyb2xsSWRdXG4gICAgfSBlbHNlIHtcbiAgICAgIHNjcm9sbCA9IG5ldyBTY3JvbGwoZWwsIG9wdGlvbnMpXG4gICAgfVxuICB9XG4gIHJldHVybiBzY3JvbGxcbn1cblxubGliLnNjcm9sbC5wbHVnaW4gPSBmdW5jdGlvbiAobmFtZSwgY29uc3RydWN0b3IpIHtcbiAgaWYgKGNvbnN0cnVjdG9yKSB7XG4gICAgbmFtZSA9IG5hbWUuc3BsaXQoJywnKVxuICAgIG5hbWUuZm9yRWFjaChmdW5jdGlvbiAobikge1xuICAgICAgcGx1Z2luc1tuXSA9IGNvbnN0cnVjdG9yXG4gICAgfSlcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcGx1Z2luc1tuYW1lXVxuICB9XG59XG5cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvc2Nyb2xsLmpzXG4gKiogbW9kdWxlIGlkID0gNDNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG4vKipcbiAqIHRyYW5zZmVyIFF1YWRyYXRpYyBCZXppZXIgQ3VydmUgdG8gQ3ViaWMgQmV6aWVyIEN1cnZlXG4gKlxuICogQHBhcmFtICB7bnVtYmVyfSBhIGFic2Npc3NhIG9mIHAxXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGIgb3JkaW5hdGUgb2YgcDFcbiAqIEByZXR1cm4ge0FycmF5fSBwYXJhbWV0ZXIgbWF0cml4IGZvciBjdWJpYyBiZXppZXIgY3VydmVcbiAqICAgbGlrZSBbW3AxeCwgcDF5XSwgW3AyeCwgcDJ5XV1cbiAqL1xuZnVuY3Rpb24gcXVhZHJhdGljMmN1YmljQmV6aWVyKGEsIGIpIHtcbiAgcmV0dXJuIFtcbiAgICBbXG4gICAgICAoYSAvIDMgKyAoYSArIGIpIC8gMyAtIGEpIC8gKGIgLSBhKSxcbiAgICAgIChhICogYSAvIDMgKyBhICogYiAqIDIgLyAzIC0gYSAqIGEpIC8gKGIgKiBiIC0gYSAqIGEpXG4gICAgXSwgW1xuICAgICAgKGIgLyAzICsgKGEgKyBiKSAvIDMgLSBhKSAvIChiIC0gYSksXG4gICAgICAoYiAqIGIgLyAzICsgYSAqIGIgKiAyIC8gMyAtIGEgKiBhKSAvIChiICogYiAtIGEgKiBhKVxuICAgIF1cbiAgXVxufVxuXG4vKipcbiAqIGRlcml2ZSBwb3NpdGlvbiBkYXRhIGZyb20ga25vd2luZyBtb3Rpb24gcGFyYW1ldGVyc1xuICogYmFzZSBvbiBOZXd0b24ncyBzZWNvbmQgbGF3OiBzID0gdnQgKyBhdF4yLzJcbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIG9iamVjdCBvZiB7IHYsIGEsIHMsIHQgfVxuICogICAtIHY6IGluaXRpYWwgdmVsb2NpdHlcbiAqICAgLSBhOiBhY2NlbGVyYXRlIHNwZWVkXG4gKiAgIC0gdDogdGltZVxuICogICAtIHM6IHNoaWZ0aW5nXG4gKi9cbmZ1bmN0aW9uIE1vdGlvbihjb25maWcpIHtcblxuICB0aGlzLnYgPSBjb25maWcudiB8fCAwXG4gIHRoaXMuYSA9IGNvbmZpZy5hIHx8IDBcblxuICBpZiAodHlwZW9mIGNvbmZpZy50ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMudCA9IGNvbmZpZy50XG4gIH1cblxuICBpZiAodHlwZW9mIGNvbmZpZy5zICE9PSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMucyA9IGNvbmZpZy5zXG4gIH1cblxuICAvLyBkZXJpdmUgdGltZSBmcm9tIHNoaWZ0aW5nXG4gIGlmICh0eXBlb2YgdGhpcy50ID09PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgdGhpcy5zID09PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy50ID0gLXRoaXMudiAvIHRoaXMuYVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdDEgPSAoTWF0aC5zcXJ0KHRoaXMudiAqIHRoaXMudiArIDIgKiB0aGlzLmEgKiB0aGlzLnMpIC0gdGhpcy52KVxuICAgICAgICAvIHRoaXMuYVxuICAgICAgdmFyIHQyID0gKC1NYXRoLnNxcnQodGhpcy52ICogdGhpcy52ICsgMiAqIHRoaXMuYSAqIHRoaXMucykgLSB0aGlzLnYpXG4gICAgICAgIC8gdGhpcy5hXG4gICAgICB0aGlzLnQgPSBNYXRoLm1pbih0MSwgdDIpXG4gICAgfVxuICB9XG5cbiAgLy8gZGVyaXZlIHNoaWZ0aW5nIGZyb20gdGltZVxuICBpZiAodHlwZW9mIHRoaXMucyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLnMgPSB0aGlzLmEgKiB0aGlzLnQgKiB0aGlzLnQgLyAyICsgdGhpcy52ICogdGhpcy50XG4gIH1cbn1cblxuLyoqXG4gKiBkZXJpdmUgY3ViaWMgYmV6aWVyIHBhcmFtZXRlcnMgZnJvbSBtb3Rpb24gcGFyYW1ldGVyc1xuICogQHJldHVybiB7QXJyYXl9IHBhcmFtZXRlciBtYXRyaXggZm9yIGN1YmljIGJlemllciBjdXJ2ZVxuICogICBsaWtlIFtbcDF4LCBwMXldLCBbcDJ4LCBwMnldXVxuICovXG5Nb3Rpb24ucHJvdG90eXBlLmdlbmVyYXRlQ3ViaWNCZXppZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBxdWFkcmF0aWMyY3ViaWNCZXppZXIoXG4gICAgdGhpcy52IC8gdGhpcy5hLCB0aGlzLnQgKyB0aGlzLnYgLyB0aGlzLmFcbiAgKVxufVxuXG4hbGliICYmIChsaWIgPSB7fSlcbmxpYi5tb3Rpb24gPSBNb3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBNb3Rpb25cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL21vdGlvbi5qc1xuICoqIG1vZHVsZSBpZCA9IDQ0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgTGlzdCA9IHJlcXVpcmUoJy4vbGlzdCcpXG5cbmZ1bmN0aW9uIEhsaXN0KGRhdGEsIG5vZGVUeXBlKSB7XG4gIGRhdGEuYXR0ci5kaXJlY3Rpb24gPSAnaCdcbiAgTGlzdC5jYWxsKHRoaXMsIGRhdGEsIG5vZGVUeXBlKVxufVxuXG5IbGlzdC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKExpc3QucHJvdG90eXBlKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhsaXN0XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9jb21wb25lbnRzL2hsaXN0LmpzXG4gKiogbW9kdWxlIGlkID0gNDVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgQXRvbWljID0gcmVxdWlyZSgnLi9hdG9taWMnKVxucmVxdWlyZSgna291bnRkb3duJylcblxudmFyIEZPUk1BVFRFUl9SRUdFWFAgPSAvKFxcXFwpPyhkZCp8aGg/fG1tP3xzcz8pL2dpXG5cbmZ1bmN0aW9uIGZvcm1hdERhdGVUaW1lKGRhdGEsIGZvcm1hdHRlciwgdGltZUNvbG9yKSB7XG4gIHJldHVybiBmb3JtYXR0ZXIucmVwbGFjZShGT1JNQVRURVJfUkVHRVhQLCBmdW5jdGlvbiAobSkge1xuICAgIHZhciBsZW4gPSBtLmxlbmd0aFxuICAgIHZhciBmaXJzdENoYXIgPSBtLmNoYXJBdCgwKVxuICAgIC8vIGVzY2FwZSBjaGFyYWN0ZXJcbiAgICBpZiAoZmlyc3RDaGFyID09PSAnXFxcXCcpIHtcbiAgICAgIHJldHVybiBtLnJlcGxhY2UoJ1xcXFwnLCAnJylcbiAgICB9XG4gICAgdmFyIHZhbHVlID0gKGZpcnN0Q2hhciA9PT0gJ2QnID8gZGF0YS5kYXlzIDpcbiAgICAgICAgICAgICAgICBmaXJzdENoYXIgPT09ICdoJyA/IGRhdGEuaG91cnMgOlxuICAgICAgICAgICAgICAgIGZpcnN0Q2hhciA9PT0gJ20nID8gZGF0YS5taW51dGVzIDpcbiAgICAgICAgICAgICAgICBmaXJzdENoYXIgPT09ICdzJyA/IGRhdGEuc2Vjb25kcyA6IDApICsgJydcblxuICAgIC8vIDUgemVybyBzaG91bGQgYmUgZW5vdWdoXG4gICAgcmV0dXJuICc8c3BhbiBzdHlsZT1cIm1hcmdpbjo0cHg7Y29sb3I6J1xuICAgICAgKyB0aW1lQ29sb3IgKyAnXCIgPidcbiAgICAgICsgKCcwMDAwMCcgKyB2YWx1ZSkuc3Vic3RyKC1NYXRoLm1heCh2YWx1ZS5sZW5ndGgsIGxlbikpXG4gICAgICArICc8L3NwYW4+J1xuICB9KVxufVxuXG5mdW5jdGlvbiBDb3VudGRvd24gKGRhdGEpIHtcbiAgQXRvbWljLmNhbGwodGhpcywgZGF0YSlcbn1cblxuQ291bnRkb3duLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQXRvbWljLnByb3RvdHlwZSlcblxuQ291bnRkb3duLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgbm9kZS5jbGFzc0xpc3QuYWRkKCd3ZWV4LWVsZW1lbnQnKVxuICB2YXIgZGF0YSA9IHRoaXMuZGF0YVxuICB2YXIgdGltZSA9IE51bWJlcihkYXRhLmF0dHIuY291bnRkb3duVGltZSkgfHwgMFxuICB2YXIgZW5kVGltZSA9IERhdGUubm93KCkgLyAxMDAwICsgdGltZVxuICB2YXIgY2QgPSBsaWIuY291bnRkb3duKHtcbiAgICBlbmREYXRlOiBlbmRUaW1lLFxuICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAodGltZSkge1xuICAgICAgdmFyIHRpbWVDb2xvciA9IGRhdGEuc3R5bGUudGltZUNvbG9yIHx8ICcjMDAwJ1xuICAgICAgdmFyIHJlc3VsdCA9IGZvcm1hdERhdGVUaW1lKHRpbWUsIGRhdGEuYXR0ci5mb3JtYXR0ZXJWYWx1ZSwgdGltZUNvbG9yKVxuICAgICAgbm9kZS5pbm5lckhUTUwgPSByZXN1bHRcbiAgICB9LFxuICAgIG9uRW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgfVxuICB9KS5zdGFydCgpXG5cbiAgcmV0dXJuIG5vZGVcbn1cblxuQ291bnRkb3duLnByb3RvdHlwZS5zdHlsZSA9IHtcbiAgdGV4dENvbG9yOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLm5vZGUuc3R5bGUuY29sb3IgPSB2YWx1ZVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ291bnRkb3duXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvY291bnRkb3duLmpzXG4gKiogbW9kdWxlIGlkID0gNDZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBEQVlfU0VDT05EUyA9IDg2NDAwLFxuICAgIEhPVVJfU0VDT05EUyA9IDM2MDAsXG4gICAgTUlOVVRFX1NFQ09ORFMgPSA2MCxcbiAgICBGT1JNQVRURVJfREVGQVVMVCA9ICdk5aSpaGjml7ZtbeWIhnNz56eSJyxcbiAgICBGT1JNQVRURVJfUkVHRVhQID0gLyhcXFxcKT8oZGQqfGhoP3xtbT98c3M/KS9naTtcblxuLyoqXG4gKiDlgJLorqHml7bjgILmraTnsbvml6Dms5Xnm7TmjqXlrp7kvovljJbvvIzor7fkvb/nlKggbGliLmNvdW50ZG93bihvcHRpb25zKSDov5vooYzlrp7kvovljJbjgIJcbiAqIEBjbGFzcyBDb3VudERvd25cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIOWAkuiuoeaXtuWPguaVsOOAglxuICogQHBhcmFtIHtDb3VudERvd25+RGF0ZVNvdXJjZX0gb3B0aW9ucy5lbmREYXRlIOWAkuiuoeaXtueahOe7k+adn+aXtumXtOeCueOAguWAkuiuoeaXtuW/hemcgOacieatpOWxnuaAp++8jOWQpuWImeS8muaKm+mUmeOAglxuICogQHBhcmFtIHtDb3VudERvd25+U3RyaW5nRm9ybWF0dGVyfSBvcHRpb25zLnN0cmluZ0Zvcm1hdHRlciDlgJLorqHml7bmlbDmja7nmoTlrZfnrKbkuLLmoLzlvI/jgIJcbiAqIEBwYXJhbSB7SW50fSBvcHRpb25zLmludGVydmFsIOWAkuiuoeaXtuabtOaWsOeahOmXtOmalOmikeeOh+OAguWNleS9jeS4uuavq+enkuOAgiDpu5jorqTlgLzkuLrvvJoxMDAw77yM5Y2zMeenkuOAglxuICogQHBhcmFtIHtJbnR9IG9wdGlvbnMuY29ycmVjdERhdGVPZmZzZXQg5L+u5q2j5YCS6K6h5pe255qE5pe26Ze05YGP5beu5YC844CC5Y2V5L2N5Li656eS44CC5q2k5bGe5oCn5Y+v55So5p2l5L+u5q2j5pyN5Yqh56uv5LiO5a6i5oi356uv55qE5pe26Ze05beu44CCXG4gKiBAcGFyYW0ge0NvdW50RG93bn5vblVwZGF0ZX0gb3B0aW9ucy5vblVwZGF0ZSDlgJLorqHml7bmr4/mrKHmm7TmlrDnmoTlm57osIPlh73mlbDjgIJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG9wdGlvbnMudXBkYXRlRWxlbWVudCDlgJLorqHml7bnmoTmm7TmlrDlhYPntKDjgILlj6/lv6vmjbfnmoTmiorlgJLorqHml7bnu5PmnpzpgJrov4dpbm5lckhUTUzmm7TmlrDliLDmraTlhYPntKDkuK3jgIJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbnMub25FbmQg5YCS6K6h5pe257uT5p2f5pe255qE5Zue6LCD5Ye95pWw44CCXG4gKi9cbnZhciBDb3VudERvd24gPSBmdW5jdGlvbihvcHRpb25zKXtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vcGFyc2UgZW5kIGRhdGVcbiAgICB2YXIgbWUgPSB0aGlzLCBlbmREYXRlID0gcGFyc2VEYXRlKG9wdGlvbnMuZW5kRGF0ZSk7XG4gICAgaWYoIWVuZERhdGUgfHwgIWVuZERhdGUuZ2V0VGltZSgpKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGVuZERhdGUnKTtcbiAgICB9ZWxzZXtcbiAgICAgICAgbWUuZW5kRGF0ZSA9IGVuZERhdGU7XG4gICAgfVxuXG4gICAgbWUub25VcGRhdGUgPSBvcHRpb25zLm9uVXBkYXRlO1xuICAgIG1lLm9uRW5kID0gb3B0aW9ucy5vbkVuZDtcbiAgICBtZS5pbnRlcnZhbCA9IG9wdGlvbnMuaW50ZXJ2YWwgfHwgMTAwMDtcbiAgICBtZS5zdHJpbmdGb3JtYXR0ZXIgPSBvcHRpb25zLnN0cmluZ0Zvcm1hdHRlciB8fCBGT1JNQVRURVJfREVGQVVMVDtcbiAgICBtZS5jb3JyZWN0RGF0ZU9mZnNldCA9IG9wdGlvbnMuY29ycmVjdERhdGVPZmZzZXQgfHwgMDtcbiAgICBtZS51cGRhdGVFbGVtZW50ID0gb3B0aW9ucy51cGRhdGVFbGVtZW50O1xuXG4gICAgLy9pbnRlcm5hbCB1c2VcbiAgICBtZS5fZGF0YSA9IHtkYXlzOjAsIGhvdXJzOjAsIG1pbnV0ZXM6MCwgc2Vjb25kczowfTtcbn07XG5cbkNvdW50RG93bi5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICog5ZCv5Yqo5YCS6K6h5pe244CCXG4gICAgICogQG1lbWJlck9mIENvdW50RG93bi5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBzdGFydDogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgbWUuc3RvcCgpO1xuXG4gICAgICAgIGlmKG1lLl91cGRhdGUoKSl7XG4gICAgICAgICAgICBtZS5faW50ZXJ2YWxJZCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgbWUuX3VwZGF0ZSgpO1xuICAgICAgICAgICAgfSwgbWUuaW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIG1lID0gdGhpcywgZGF0YSA9IG1lLl9kYXRhLFxuICAgICAgICAgICAgZWxlbSA9IG1lLnVwZGF0ZUVsZW1lbnQsIGNhbGxiYWNrLFxuICAgICAgICAgICAgbm93ID0gK25ldyBEYXRlKCkgKyBtZS5jb3JyZWN0RGF0ZU9mZnNldCAqIDEwMDAsIFxuICAgICAgICAgICAgZGlmZiA9IE1hdGgubWF4KDAsIE1hdGgucm91bmQoKG1lLmVuZERhdGUuZ2V0VGltZSgpIC0gbm93KSAvIDEwMDApKSxcbiAgICAgICAgICAgIGVuZGVkID0gZGlmZiA8PSAwO1xuXG4gICAgICAgIC8vY2FsYyBkaWZmIHNlZ21lbnRcbiAgICAgICAgZGF0YS50b3RhbFNlY29uZHMgPSBkaWZmO1xuICAgICAgICBkaWZmIC09IChkYXRhLmRheXMgPSBNYXRoLmZsb29yKGRpZmYgLyBEQVlfU0VDT05EUykpICogREFZX1NFQ09ORFM7XG4gICAgICAgIGRpZmYgLT0gKGRhdGEuaG91cnMgPSBNYXRoLmZsb29yKGRpZmYgLyBIT1VSX1NFQ09ORFMpKSAqIEhPVVJfU0VDT05EUztcbiAgICAgICAgZGlmZiAtPSAoZGF0YS5taW51dGVzID0gTWF0aC5mbG9vcihkaWZmIC8gTUlOVVRFX1NFQ09ORFMpKSAqIE1JTlVURV9TRUNPTkRTO1xuICAgICAgICBkYXRhLnNlY29uZHMgPSBkaWZmO1xuXG4gICAgICAgIC8vZm9ybWF0IHN0cmluZyB2YWx1ZVxuICAgICAgICBkYXRhLnN0cmluZ1ZhbHVlID0gZm9ybWF0RGF0ZVRpbWUoZGF0YSwgbWUuc3RyaW5nRm9ybWF0dGVyKTtcblxuICAgICAgICAvL3NpbXBsZSB3YXkgdG8gdXBkYXRlIGVsZW1lbnQncyBjb250ZW50XG4gICAgICAgIGlmKGVsZW0pIGVsZW0uaW5uZXJIVE1MID0gZGF0YS5zdHJpbmdWYWx1ZTtcblxuICAgICAgICAvL2NhbGxiYWNrXG4gICAgICAgIChjYWxsYmFjayA9IG1lLm9uVXBkYXRlKSAmJiBjYWxsYmFjay5jYWxsKG1lLCBkYXRhKTtcbiAgICAgICAgaWYoZW5kZWQpe1xuICAgICAgICAgICAgbWUuc3RvcCgpO1xuICAgICAgICAgICAgKGNhbGxiYWNrID0gbWUub25FbmQpICYmIGNhbGxiYWNrLmNhbGwobWUpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWBnOatouiuoeaXtuWZqOOAglxuICAgICAqIEBtZW1iZXJPZiBDb3VudERvd24ucHJvdG90eXBlXG4gICAgICovXG4gICAgc3RvcDogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgaWYobWUuX2ludGVydmFsSWQpe1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChtZS5faW50ZXJ2YWxJZCk7XG4gICAgICAgICAgICBtZS5faW50ZXJ2YWxJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1lO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDorr7nva7nu5PmnZ/ml7bpl7TjgIJcbiAgICAgKiBAbWVtYmVyT2YgQ291bnREb3duLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSB7Q291bnREb3dufkRhdGVTb3VyY2V9IGRhdGUg6KaB6K6+572u55qE57uT5p2f5pe26Ze044CCIFxuICAgICAqL1xuICAgIHNldEVuZERhdGU6IGZ1bmN0aW9uKGRhdGUpe1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICBtZS5lbmREYXRlID0gcGFyc2VEYXRlKGRhdGUpO1xuICAgICAgICByZXR1cm4gbWU7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gcGFyc2VEYXRlKHNvdXJjZSl7XG4gICAgdmFyIGRhdGU7XG5cbiAgICBpZih0eXBlb2Ygc291cmNlID09PSAnbnVtYmVyJyl7XG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZShzb3VyY2UgKiAxMDAwKTtcbiAgICB9ZWxzZSBpZih0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJyl7XG4gICAgICAgIHZhciBmaXJzdENoYXIgPSBzb3VyY2UuY2hhckF0KDApLFxuICAgICAgICAgICAgcGx1cyA9IGZpcnN0Q2hhciA9PT0gJysnLFxuICAgICAgICAgICAgbWludXMgPSBmaXJzdENoYXIgPT09ICctJztcblxuICAgICAgICBpZihwbHVzIHx8IG1pbnVzKXsgLy9vZmZzZXQgZGF0ZSBmb3JtYXRlXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBzb3VyY2Uuc3Vic3RyKDEpLCBvZmZzZXRWYWx1ZSxcbiAgICAgICAgICAgIGFyciA9IHZhbHVlLnNwbGl0KCc6JyksXG4gICAgICAgICAgICB0aW1lID0gWzAsIDAsIDAsIDBdLCBpbmRleCA9IDQ7XG5cbiAgICAgICAgICAgIHdoaWxlKGFyci5sZW5ndGggJiYgLS1pbmRleCA+PSAwKXtcbiAgICAgICAgICAgICAgICB0aW1lW2luZGV4XSA9IHBhcnNlSW50KGFyci5wb3AoKSkgfHwgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9mZnNldFZhbHVlID0gREFZX1NFQ09ORFMgKiB0aW1lWzBdICsgSE9VUl9TRUNPTkRTICogdGltZVsxXSArIE1JTlVURV9TRUNPTkRTICogdGltZVsyXSArIHRpbWVbM107XG5cbiAgICAgICAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgZGF0ZS5zZXRTZWNvbmRzKGRhdGUuZ2V0U2Vjb25kcygpICsgb2Zmc2V0VmFsdWUgKiAobWludXMgPyAtMSA6IDEpKTtcbiAgICAgICAgICAgIGRhdGUuc2V0TWlsbGlzZWNvbmRzKDApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYoIWRhdGUpIGRhdGUgPSBuZXcgRGF0ZShzb3VyY2UpO1xuXG4gICAgcmV0dXJuIGRhdGU7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdERhdGVUaW1lKGRhdGEsIGZvcm1hdHRlcil7XG4gICAgcmV0dXJuIGZvcm1hdHRlci5yZXBsYWNlKEZPUk1BVFRFUl9SRUdFWFAsIGZ1bmN0aW9uKG0pe1xuICAgICAgICB2YXIgbGVuID0gbS5sZW5ndGgsIGZpcnN0Q2hhciA9IG0uY2hhckF0KDApO1xuICAgICAgICAvL2VzY2FwZSBjaGFyYWN0ZXJcbiAgICAgICAgaWYoZmlyc3RDaGFyID09PSAnXFxcXCcpIHJldHVybiBtLnJlcGxhY2UoJ1xcXFwnLCAnJyk7XG4gICAgICAgIHZhciB2YWx1ZSA9IChmaXJzdENoYXIgPT09ICdkJyA/IGRhdGEuZGF5cyA6XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0Q2hhciA9PT0gJ2gnID8gZGF0YS5ob3VycyA6XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0Q2hhciA9PT0gJ20nID8gZGF0YS5taW51dGVzIDpcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RDaGFyID09PSAncycgPyBkYXRhLnNlY29uZHMgOiAwKSArICcnO1xuXG4gICAgICAgIC8vNSB6ZXJvIHNob3VsZCBiZSBlbm91Z2hcbiAgICAgICAgcmV0dXJuICgnMDAwMDAnICsgdmFsdWUpLnN1YnN0cigtTWF0aC5tYXgodmFsdWUubGVuZ3RoLCBsZW4pKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiDlgJLorqHml7bnmoTml6XmnJ/mupDmlbDmja7jgIJcbiAqIEB0eXBlZGVmIHsoRGF0ZXxTdHJpbmd8TnVtYmVyKX0gQ291bnREb3dufkRhdGVTb3VyY2VcbiAqIEBkZXNjIOW9k+aXpeacn+a6kOaVsOaNruexu+Wei+S4uu+8mlxuICogPHVsPlxuICogPGxpPkRhdGUgLSDmoIflh4blgLzjgII8L2xpPlxuICogPGxpPk51bWJlciAtIOihqOekuue7k+adn+aXtumXtOeCueebuOWvueS6jkphbnVhcnkgMSwgMTk3MCwgMDA6MDA6MDAgVVRD55qE57ud5a+55YC877yM5Y2V5L2N5piv56eS44CC5q+U5aaC77yabmV3IERhdGUoJzIwMTQtMTItMzAgMjM6MDA6MDAnKS5nZXRUaW1lKCkgLyAxMDAw44CCPC9saT5cbiAqIDxsaT5TdHJpbmcgLSDlvZPkuLrlrZfnrKbkuLLml7bvvIzliJnvvJpcbiAqIDx1bD5cbiAqIDxsaT7oi6Xku6Ur5oiWLeW8gOWni++8jOWImee7k+adn+aXtumXtOeCueS7peW9k+WJjeaXtumXtOWNs25ldyBEYXRlKCnkuLrnm7jlr7nml7bpl7TngrnvvIzlho3liqDkuIrmiJblh4/ljrvlrZfnrKbkuLLlkI7ljYrpg6jliIbmiYDooajnpLrnmoTml7bplb/jgILlkI7ljYrpg6jliIbvvIzoi6XmmK/kuIDkuKrmlbDlgLzliJnkuLrnp5LmlbDvvIzmiJbkuLrlrZfnrKbkuLLvvIzliJnkvJrmjInnhafml6U65bCP5pe2OuWIhumSnzrnp5LnmoTmoLzlvI/ov5vooYzop6PmnpDjgII8L2xpPlxuICogPGxpPuWFtuS7lu+8jOWImeWwneivleebtOaOpemAmui/h25ldyBEYXRlKGVuZERhdGUp6L2s5o2i5Li6RGF0ZeOAgjwvbGk+XG4gKiA8L3VsPjwvbGk+XG4gKiA8bGk+5YW25LuW5oOF5Ya177yM5YiZ5bCd6K+V55u05o6l6YCa6L+HbmV3IERhdGUoZW5kRGF0ZSnovazmjaLkuLpEYXRl44CCPC9saT5cbiAqIDwvdWw+XG4gKi9cblxuLyoqXG4gKiDlgJLorqHml7bmlbDmja7nmoTlrZfnrKbkuLLmoLzlvI/jgIJcbiAqIEB0eXBlZGVmIHtTdHJpbmd9IENvdW50RG93bn5TdHJpbmdGb3JtYXR0ZXJcbiAqIEBkZXNjIOi3n+Wkp+WkmuaVsOivreiogOeahOaXpeacn+agvOW8j+WMluexu+S8vO+8jOavlOWmgu+8mmRkOmhoOm1tOnNz44CCIOatpOWtl+S4suS4reeahOeJueauiuWtl+espuacie+8mlxuICogPHVsPlxuICogPGxpPmQgLSDlpKnmlbDjgII8L2xpPlxuICogPGxpPmggLSDlsI/ml7bjgII8L2xpPlxuICogPGxpPm0gLSDliIbpkp/jgII8L2xpPlxuICogPGxpPnMgLSDnp5LjgII8L2xpPlxuICogPC91bD5cbiAqIOWFtuS4re+8jOWkmuS4quebuOWQjOeahOWtl+espuihqOekuuaVsOWAvOeahOS9jeaVsO+8jOiLpeacgOmrmOS9jeS4jeWkn++8jOWImeeUqDDooaXpvZDjgILms6jmhI/vvJroi6XopoHmoLzlvI/lrZfkuLLph4zliqDlhaXnibnmrorlrZfnrKbvvIzpnIDopoHnlKhcXFxc6L+b6KGM6L2s5LmJ44CC5q+U5aaC77yaZFxcXFxkYXlcXFxccywgaGhcXFxcaG91clxcXFxzLCBtbVxcXFxtaW51dGVcXFxccywgc3NcXFxcc2Vjb25cXFxcZFxcXFxz44CCIOm7mOiupOWAvOS4uu+8mmTlpKloaOaXtm1t5YiGc3Pnp5LjgIJcbiAqL1xuXG4vKipcbiAqIOWAkuiuoeaXtuavj+asoeabtOaWsOeahOWbnuiwg+WHveaVsOOAglxuICogQGNhbGxiYWNrIENvdW50RG93bn5vblVwZGF0ZVxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEg5pu05paw5Zue6LCD55qE5Y+C5pWw44CCXG4gKiBAcGFyYW0ge1N0cmluZ30gZGF0YS5zdHJpbmdWYWx1ZSDpgJrov4dzdHJpbmdGb3JtYXR0ZXLmoLzlvI/ljJblkI7nmoTlgJLorqHml7blrZfnrKbkuLLlgLzjgIJcbiAqIEBwYXJhbSB7SW50fSBkYXRhLnRvdGFsU2Vjb25kcyDlgJLorqHml7bnmoTmgLvnp5LmlbDjgIJcbiAqIEBwYXJhbSB7SW50fSBkYXRhLmRheXMg5YCS6K6h5pe255qE5aSp5pWw6YOo5YiG44CCXG4gKiBAcGFyYW0ge0ludH0gZGF0YS5ob3VycyDlgJLorqHml7bnmoTlsI/ml7bpg6jliIbjgIJcbiAqIEBwYXJhbSB7SW50fSBkYXRhLm1pbnV0ZXMg5YCS6K6h5pe255qE5YiG6ZKf6YOo5YiG44CCXG4gKiBAcGFyYW0ge0ludH0gZGF0YS5zZWNvbmRzIOWAkuiuoeaXtueahOenkuaVsOmDqOWIhuOAglxuICovXG5cbi8qKlxuICog6L+U5Zue5LiA5Liq5YCS6K6h5pe2IHtAbGluayBDb3VudERvd259IOWvueixoeOAglxuICogQG1lbWJlck9mIGxpYlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyDlgJLorqHml7blj4LmlbDvvIzkuI4ge0BsaW5rIENvdW50RG93bn0g5p6E6YCg5Ye95pWw5Y+C5pWw5LiA6Ie044CCXG4gKiBAZXhhbXBsZVxuICogdmFyIGNkID0gbGliLmNvdW50ZG93bih7XG4gKiAgIGVuZERhdGU6ICcyMDE0LTEyLTMwIDIzOjAwOjAwJyxcbiAqICAgc3RyaW5nRm9ybWF0dGVyOiAnZOWkqSBoaOWwj+aXtm1t5YiGc3Pnp5InLFxuICogICBvblVwZGF0ZTogZnVuY3Rpb24oZGF0YSl7XG4gKiAgICAgZWxlbS5pbm5lckhUTUwgPSBkYXRhLnN0cmluZ1ZhbHVlO1xuICogICB9LFxuICogICBvbkVuZDogZnVuY3Rpb24oKXtcbiAqICAgICAgIGNvbnNvbGUubG9nKCdjb3VudGRvd24gZW5kZWQnKTtcbiAqICAgfVxuICogfSkuc3RhcnQoKTtcbiAqL1xuaWYgKHR5cGVvZiB3aW5kb3cubGliID09PSAndW5kZWZpbmVkJykge1xuICAgIGxpYiA9IHt9XG59XG5saWIuY291bnRkb3duID0gZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgcmV0dXJuIG5ldyBDb3VudERvd24ob3B0aW9ucyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbGliLmNvdW50ZG93blxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2tvdW50ZG93bi9zcmMvY291bnRkb3duLmpzXG4gKiogbW9kdWxlIGlkID0gNDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJylcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKCcuL2NvbXBvbmVudCcpXG52YXIgQ29tcG9uZW50TWFuYWdlciA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudE1hbmFnZXInKVxudmFyIExhenlMb2FkID0gcmVxdWlyZSgnLi4vbGF6eUxvYWQnKVxuXG5mdW5jdGlvbiBNYXJxdWVlIChkYXRhKSB7XG4gIHRoaXMuaW50ZXJ2YWwgPSBOdW1iZXIoZGF0YS5hdHRyLmludGVydmFsKSB8fCA1ICogMTAwMFxuICB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbiA9IE51bWJlcihkYXRhLmF0dHIudHJhbnNpdGlvbkR1cmF0aW9uKSB8fCA1MDBcbiAgdGhpcy5kZWxheSA9IE51bWJlcihkYXRhLmF0dHIuZGVsYXkpIHx8IDBcbiAgQ29tcG9uZW50LmNhbGwodGhpcywgZGF0YSlcbn1cblxuTWFycXVlZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKENvbXBvbmVudC5wcm90b3R5cGUpXG5cbk1hcnF1ZWUucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBub2RlLmNsYXNzTGlzdC5hZGQoJ3dlZXgtY29udGFpbmVyJylcbiAgbm9kZS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nXG4gIC8vIGZpeCBwYWdlIHNoYWtpbmcgZHVyaW5nIHNsaWRlcidzIHBsYXlpbmdcbiAgbm9kZS5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSAndHJhbnNsYXRlM0QoMCwwLDApJ1xuICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdFRyYW5zaXRpb25FbmQnLCB0aGlzLmVuZC5iaW5kKHRoaXMpLCBmYWxzZSlcbiAgcmV0dXJuIG5vZGVcbn1cblxuTWFycXVlZS5wcm90b3R5cGUuY3JlYXRlQ2hpbGRyZW4gPSBmdW5jdGlvbiAoKSB7XG4gIC8vIGZpcnN0IHJ1bjpcbiAgLy8gLSBjcmVhdGUgZWFjaCBjaGlsZFxuICAvLyAtIGFwcGVuZCB0byBwYXJlbnROb2RlXG4gIC8vIC0gZmluZCBjdXJyZW50IGFuZCBuZXh0XG4gIC8vIC0gc2V0IGN1cnJlbnQgYW5kIG5leHQgc2hvd24gYW5kIG90aGVycyBoaWRkZW5cbiAgdmFyIGNoaWxkcmVuID0gdGhpcy5kYXRhLmNoaWxkcmVuXG4gIHZhciBwYXJlbnRSZWYgPSB0aGlzLmRhdGEucmVmXG4gIHZhciBpbnN0YW5jZUlkID0gdGhpcy5kYXRhLmluc3RhbmNlSWRcbiAgdmFyIGl0ZW1zID0gW11cbiAgdmFyIGNvbXBvbmVudE1hbmFnZXIgPSB0aGlzLmdldENvbXBvbmVudE1hbmFnZXIoKVxuXG4gIHZhciBmcmFnbWVudCwgaXNGbGV4LCBjaGlsZCwgbm9kZSwgaVxuXG4gIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICAgIGlzRmxleCA9IGZhbHNlXG4gICAgZm9yIChpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjaGlsZHJlbltpXS5zY2FsZSA9IHRoaXMuZGF0YS5zY2FsZVxuICAgICAgY2hpbGRyZW5baV0uaW5zdGFuY2VJZCA9IGluc3RhbmNlSWRcbiAgICAgIGNoaWxkID0gY29tcG9uZW50TWFuYWdlci5jcmVhdGVFbGVtZW50KGNoaWxkcmVuW2ldKVxuICAgICAgY2hpbGQucGFyZW50UmVmID0gcGFyZW50UmVmXG4gICAgICB0aGlzLmluaXRDaGlsZChjaGlsZClcbiAgICAgIC8vIGFwcGVuZCBhbmQgcHVzaFxuICAgICAgaXRlbXMucHVzaChjaGlsZClcbiAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGNoaWxkLm5vZGUpXG4gICAgICBpZiAoIWlzRmxleCAmJiBjaGlsZC5kYXRhLnN0eWxlLmhhc093blByb3BlcnR5KCdmbGV4JykpIHtcbiAgICAgICAgaXNGbGV4ID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpXG4gIH1cblxuICAvLyBzZXQgaXRlbXNcbiAgdGhpcy5pdGVtcyA9IGl0ZW1zXG5cbiAgLy8gcmVzZXQgdGhlIGNsb2NrIGZvciBmaXJzdCB0cmFuc2l0aW9uXG4gIHRoaXMucmVzZXQoKVxufVxuXG5NYXJxdWVlLnByb3RvdHlwZS5pbml0Q2hpbGQgPSBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgdmFyIG5vZGUgPSBjaGlsZC5ub2RlXG4gIG5vZGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gIG5vZGUuc3R5bGUudG9wID0gJzAnXG4gIG5vZGUuc3R5bGUubGVmdCA9ICcwJ1xufVxuXG5NYXJxdWVlLnByb3RvdHlwZS5hcHBlbmRDaGlsZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gIC8vIGRvbSArIGl0ZW1zXG4gIHZhciBjb21wb25lbnRNYW5hZ2VyID0gQ29tcG9uZW50TWFuYWdlci5nZXRJbnN0YW5jZSh0aGlzLmRhdGEuaW5zdGFuY2VJZClcbiAgdmFyIGNoaWxkID0gY29tcG9uZW50TWFuYWdlci5jcmVhdGVFbGVtZW50KGRhdGEpXG4gIHRoaXMuaW5pdENoaWxkKGNoaWxkKVxuICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQoY2hpbGQubm9kZSlcbiAgdGhpcy5pdGVtcy5wdXNoKGNoaWxkKVxuICB0aGlzLnJlc2V0KClcbiAgcmV0dXJuIGNoaWxkIC8vIEB0b2RvIHJlZGVzaWduIENvbXBvbmVudCNhcHBlbmRDaGlsZChjb21wb25lbnQpXG59XG5cbk1hcnF1ZWUucHJvdG90eXBlLmluc2VydEJlZm9yZSA9IGZ1bmN0aW9uIChjaGlsZCwgYmVmb3JlKSB7XG4gIC8vIGRvbSArIGl0ZW1zXG4gIHZhciBpbmRleCA9IHRoaXMuaXRlbXMuaW5kZXhPZihiZWZvcmUpXG4gIHRoaXMuaXRlbXMuc3BsaWNlKGluZGV4LCAwLCBjaGlsZClcbiAgdGhpcy5pbml0Q2hpbGQoY2hpbGQpXG4gIHRoaXMubm9kZS5pbnNlcnRCZWZvcmUoY2hpbGQubm9kZSwgYmVmb3JlLm5vZGUpXG4gIHRoaXMucmVzZXQoKVxufVxuXG5NYXJxdWVlLnByb3RvdHlwZS5yZW1vdmVDaGlsZCA9IGZ1bmN0aW9uIChjaGlsZCkge1xuICAvLyBkb20gKyBpdGVtc1xuICB2YXIgaW5kZXggPSB0aGlzLml0ZW1zLmluZGV4T2YoY2hpbGQpXG4gIHRoaXMuaXRlbXMuc3BsaWNlKGluZGV4LCAxKVxuICB0aGlzLm5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQubm9kZSlcbiAgdGhpcy5yZXNldCgpXG59XG5cbi8qKlxuICogc3RhdHVzOiB7XG4gKiAgIGN1cnJlbnQ6IHt0cmFuc2xhdGVZOiAwLCBzaG93bjogdHJ1ZX0sXG4gKiAgIG5leHQ6IHt0cmFuc2xhdGVZOiBoZWlnaHQsIHNob3duOiB0cnVlfSxcbiAqICAgb3RoZXJzW106IHtzaG93bjogZmFsc2V9XG4gKiAgIGluZGV4OiBpbmRleFxuICogfVxuICovXG5NYXJxdWVlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGludGVydmFsID0gdGhpcy5pbnRlcnZhbCAtIDBcbiAgdmFyIGRlbGF5ID0gdGhpcy5kZWxheSAtIDBcbiAgdmFyIGl0ZW1zID0gdGhpcy5pdGVtc1xuICB2YXIgc2VsZiA9IHRoaXNcblxuICB2YXIgbG9vcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLm5leHQoKVxuICAgIHNlbGYudGltZXJJZCA9IHNldFRpbWVvdXQobG9vcCwgc2VsZi5pbnRlcnZhbClcbiAgfVxuXG4gIC8vIHJlc2V0IGRpc3BsYXkgYW5kIHRyYW5zZm9ybVxuICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtLCBpbmRleCkge1xuICAgIHZhciBub2RlID0gaXRlbS5ub2RlXG4gICAgLy8gc2V0IG5vbi1jdXJyZW50KDApfG5leHQoMSkgaXRlbSBoaWRkZW5cbiAgICBub2RlLnN0eWxlLmRpc3BsYXkgPSBpbmRleCA+IDEgPyAnbm9uZScgOiAnJ1xuICAgIC8vIHNldCBuZXh0KDEpIGl0ZW0gdHJhbnNsYXRlWVxuICAgIC8vIFRPRE86IGl0IHN1cHBvc2VkIHRvIHVzZSBpdGVtLmRhdGEuc3R5bGVcbiAgICAvLyBidXQgc29tZWhvdyB0aGUgc3R5bGUgb2JqZWN0IGlzIGVtcHR5LlxuICAgIC8vIFRoaXMgcHJvYmxlbSByZWxpZXMgb24ganNmcmFtZXdvcmsncyBidWdmaXguXG5cbiAgICAvLyBub2RlLnN0eWxlLnRyYW5zZm9ybSA9IGluZGV4ID09PSAxXG4gICAgLy8gICAgID8gJ3RyYW5zbGF0ZTNEKDAsJyArIGNvbmZpZy5zY2FsZSAqIGl0ZW0uZGF0YS5zdHlsZS5oZWlnaHQgKyAncHgsMCknXG4gICAgLy8gICAgIDogJydcbiAgICAvLyBub2RlLnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9IGluZGV4ID09PSAxXG4gICAgLy8gICAgID8gJ3RyYW5zbGF0ZTNEKDAsJyArIGNvbmZpZy5zY2FsZSAqIGl0ZW0uZGF0YS5zdHlsZS5oZWlnaHQgKyAncHgsMCknXG4gICAgLy8gICAgIDogJydcbiAgICBub2RlLnN0eWxlLnRyYW5zZm9ybSA9IGluZGV4ID09PSAxXG4gICAgICAgID8gJ3RyYW5zbGF0ZTNEKDAsJyArIHNlbGYuZGF0YS5zY2FsZSAqIHNlbGYuZGF0YS5zdHlsZS5oZWlnaHQgKyAncHgsMCknXG4gICAgICAgIDogJydcbiAgICBub2RlLnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9IGluZGV4ID09PSAxXG4gICAgICAgID8gJ3RyYW5zbGF0ZTNEKDAsJyArIHNlbGYuZGF0YS5zY2FsZSAqIHNlbGYuZGF0YS5zdHlsZS5oZWlnaHQgKyAncHgsMCknXG4gICAgICAgIDogJydcbiAgfSlcblxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAvLyByZXNldCBjdXJyZW50LCBuZXh0LCBpbmRleFxuICAgIHNlbGYuY3VycmVudEl0ZW0gPSBpdGVtc1swXVxuICAgIHNlbGYubmV4dEl0ZW0gPSBpdGVtc1sxXVxuICAgIHNlbGYuY3VycmVudEluZGV4ID0gMFxuXG4gICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSwgaW5kZXgpIHtcbiAgICAgIHZhciBub2RlID0gaXRlbS5ub2RlXG4gICAgICAvLyBzZXQgdHJhbnNpdGlvblxuICAgICAgbm9kZS5zdHlsZS50cmFuc2l0aW9uID0gJ3RyYW5zZm9ybSAnXG4gICAgICAgICAgKyBzZWxmLnRyYW5zaXRpb25EdXJhdGlvblxuICAgICAgICAgICsgJ21zIGVhc2UnXG4gICAgICBub2RlLnN0eWxlLndlYmtpdFRyYW5zaXRpb24gPSAnLXdlYmtpdC10cmFuc2Zvcm0gJ1xuICAgICAgICAgICsgc2VsZi50cmFuc2l0aW9uRHVyYXRpb25cbiAgICAgICAgICArICdtcyBlYXNlJ1xuICAgIH0pXG5cbiAgICBjbGVhclRpbWVvdXQoc2VsZi50aW1lcklkKVxuXG4gICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDEpIHtcbiAgICAgIHNlbGYudGltZXJJZCA9IHNldFRpbWVvdXQobG9vcCwgZGVsYXkgKyBpbnRlcnZhbClcbiAgICB9XG4gIH0sIDEzKVxuXG59XG5cbi8qKlxuICogbmV4dDpcbiAqIC0gY3VycmVudDoge3RyYW5zbGF0ZVk6IC1oZWlnaHR9XG4gKiAtIG5leHQ6IHt0cmFuc2xhdGVZOiAwfVxuICovXG5NYXJxdWVlLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAvLyAtIHVwZGF0ZSBzdGF0ZVxuICAvLyAgIC0gc2V0IGN1cnJlbnQgYW5kIG5leHQgdHJhbnNpdGlvblxuICAvLyAgIC0gaGlkZSBjdXJyZW50IHdoZW4gdHJhbnNpdGlvbiBlbmRcbiAgLy8gICAtIHNldCBuZXh0IHRvIGN1cnJlbnRcbiAgLy8gICAtIGZpbmQgbmV3IG5leHRcbiAgdmFyIG5leHQgPSB0aGlzLm5leHRJdGVtLm5vZGVcbiAgdmFyIGN1cnJlbnQgPSB0aGlzLmN1cnJlbnRJdGVtLm5vZGVcbiAgdGhpcy50cmFuc2l0aW9uSW5kZXggPSB0aGlzLmN1cnJlbnRJbmRleFxuXG4gIC8vIFVzZSBzZXRUaW1lb3V0IHRvIGZpeCB0aGUgcHJvYmxlbSB0aGF0IHdoZW4gdGhlXG4gIC8vIHBhZ2UgcmVjb3ZlciBmcm9tIGJhY2tzdGFnZSwgdGhlIHNsaWRlciB3aWxsXG4gIC8vIG5vdCB3b3JrIGFueSBsb25nZXIuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIG5leHQuc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZTNEKDAsMCwwKSdcbiAgICBuZXh0LnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9ICd0cmFuc2xhdGUzRCgwLDAsMCknXG4gICAgY3VycmVudC5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlM0QoMCwtJ1xuICAgICAgICArIHRoaXMuZGF0YS5zY2FsZSAqIHRoaXMuZGF0YS5zdHlsZS5oZWlnaHRcbiAgICAgICAgKyAncHgsMCknXG4gICAgY3VycmVudC5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSAndHJhbnNsYXRlM0QoMCwtJ1xuICAgICAgICArIHRoaXMuZGF0YS5zY2FsZSAqIHRoaXMuZGF0YS5zdHlsZS5oZWlnaHRcbiAgICAgICAgKyAncHgsMCknXG4gICAgdGhpcy5maXJlRXZlbnQoJ2NoYW5nZScpXG4gIH0uYmluZCh0aGlzKSwgMzAwKVxufVxuXG5NYXJxdWVlLnByb3RvdHlwZS5maXJlRXZlbnQgPSBmdW5jdGlvbiAodHlwZSkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5pdGVtcy5sZW5ndGhcbiAgdmFyIG5leHRJbmRleCA9ICh0aGlzLmN1cnJlbnRJbmRleCArIDEpICUgbGVuZ3RoXG4gIHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnSFRNTEV2ZW50cycpXG4gIGV2dC5pbml0RXZlbnQodHlwZSwgZmFsc2UsIGZhbHNlKVxuICBldnQuZGF0YSA9IHtcbiAgICBwcmV2SW5kZXg6IHRoaXMuY3VycmVudEluZGV4LFxuICAgIGluZGV4OiBuZXh0SW5kZXhcbiAgfVxuICB0aGlzLm5vZGUuZGlzcGF0Y2hFdmVudChldnQpXG59XG5cbi8qKlxuICogZW5kOlxuICogLSBvbGQgY3VycmVudDoge3Nob3duOiBmYWxzZX1cbiAqIC0gb2xkIGN1cnJlbnQ6IHt0cmFuc2xhdGVZOiAwfVxuICogLSBpbmRleCsrICUgbGVuZ3RoXG4gKiAtIG5ldyBjdXJyZW50ID0gb2xkIG5leHRcbiAqIC0gbmV3IG5leHQgPSBpdGVtc1tpbmRleCsxICUgbGVuZ3RoXVxuICogLSBuZXcgbmV4dDoge3RyYW5zbGF0ZVk6IGhlaWdodH1cbiAqIC0gbmV3IG5leHQ6IHtzaG93bjogdHJ1ZX1cbiAqL1xuTWFycXVlZS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKGUpIHtcbiAgdmFyIHRhcmdldCA9IGUudGFyZ2V0XG4gIHZhciBpdGVtcyA9IHRoaXMuaXRlbXNcbiAgdmFyIGxlbmd0aCA9IGl0ZW1zLmxlbmd0aFxuICB2YXIgY3VycmVudCwgbmV4dFxuICB2YXIgY3VycmVudEluZGV4LCBuZXh0SW5kZXhcblxuICBjdXJyZW50SW5kZXggPSB0aGlzLnRyYW5zaXRpb25JbmRleFxuXG4gIGlmIChpc05hTihjdXJyZW50SW5kZXgpKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgZGVsZXRlIHRoaXMudHJhbnNpdGlvbkluZGV4XG5cbiAgY3VycmVudCA9IHRoaXMuY3VycmVudEl0ZW0ubm9kZVxuICBjdXJyZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgY3VycmVudC5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSAnJ1xuXG4gIGN1cnJlbnRJbmRleCA9IChjdXJyZW50SW5kZXggKyAxKSAlIGxlbmd0aFxuICBuZXh0SW5kZXggPSAoY3VycmVudEluZGV4ICsgMSkgJSBsZW5ndGhcblxuICB0aGlzLmN1cnJlbnRJbmRleCA9IGN1cnJlbnRJbmRleFxuICB0aGlzLmN1cnJlbnRJdGVtID0gdGhpcy5uZXh0SXRlbVxuICB0aGlzLm5leHRJdGVtID0gaXRlbXNbbmV4dEluZGV4XVxuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIG5leHQgPSB0aGlzLm5leHRJdGVtLm5vZGVcbiAgICAvLyBUT0RPOiBpdCBzdXBwb3NlZCB0byB1c2UgdGhpcy5uZXh0SXRlbS5kYXRhLnN0eWxlXG4gICAgLy8gYnV0IHNvbWVob3cgdGhlIHN0eWxlIG9iamVjdCBpcyBlbXB0eS5cbiAgICAvLyBUaGlzIHByb2JsZW0gcmVsaWVzIG9uIGpzZnJhbWV3b3JrJ3MgYnVnZml4LlxuXG4gICAgbmV4dC5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSAndHJhbnNsYXRlM0QoMCwnXG4gICAgICAgICsgdGhpcy5kYXRhLnNjYWxlICogdGhpcy5kYXRhLnN0eWxlLmhlaWdodFxuICAgICAgICArICdweCwwKSdcbiAgICBuZXh0LnN0eWxlLmRpc3BsYXkgPSAnJ1xuICAgIExhenlMb2FkLmxvYWRJZk5lZWRlZChuZXh0KVxuICB9LmJpbmQodGhpcykpXG59XG5cbk1hcnF1ZWUucHJvdG90eXBlLmF0dHIgPSB7XG4gIGludGVydmFsOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLmludGVydmFsID0gdmFsdWVcbiAgfSxcbiAgdHJhbnNpdGlvbkR1cmF0aW9uOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbiA9IHZhbHVlXG4gIH0sXG4gIGRlbGF5OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLmRlbGF5ID0gdmFsdWVcbiAgfVxufVxuXG5NYXJxdWVlLnByb3RvdHlwZS5jbGVhckF0dHIgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuaW50ZXJ2YWwgPSA1ICogMTAwMFxuICB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbiA9IDUwMFxuICB0aGlzLmRlbGF5ID0gMFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcnF1ZWVcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvY29tcG9uZW50cy9tYXJxdWVlLmpzXG4gKiogbW9kdWxlIGlkID0gNDhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi4vdXRpbHMnKS5leHRlbmRcbnZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcnKVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoJy4vY29tcG9uZW50JylcbnZhciBDb21wb25lbnRNYW5hZ2VyID0gcmVxdWlyZSgnLi4vY29tcG9uZW50TWFuYWdlcicpXG52YXIgTGF6eUxvYWQgPSByZXF1aXJlKCcuLi9sYXp5TG9hZCcpXG5yZXF1aXJlKCdjYXJyb3VzZWwnKVxucmVxdWlyZSgnLi4vc3R5bGVzL3NsaWRlci5jc3MnKVxuXG52YXIgREVGQVVMVF9JTlRFUlZBTCA9IDMwMDBcblxuZnVuY3Rpb24gU2xpZGVyIChkYXRhKSB7XG4gIHRoaXMuYXV0b1BsYXkgPSBmYWxzZSAgLy8gZGVmYXVsdCB2YWx1ZSBpcyBmYWxzZS5cbiAgdGhpcy5pbnRlcnZhbCA9IERFRkFVTFRfSU5URVJWQUxcbiAgdGhpcy5kaXJlY3Rpb24gPSAncm93JyAvLyAnY29sdW1uJyBpcyBub3QgdGVtcG9yYXJpbHkgc3VwcG9ydGVkLlxuICB0aGlzLmNoaWxkcmVuID0gW11cbiAgdGhpcy5pc1BhZ2VTaG93ID0gdHJ1ZVxuICB0aGlzLmlzRG9tUmVuZGVyaW5nID0gdHJ1ZVxuXG4gIC8vIGJpbmQgZXZlbnQgJ3BhZ2VzaG93JyBhbmQgJ3BhZ2VoaWRlJyBvbiB3aW5kb3cuXG4gIHRoaXMuX2lkbGVXaGVuUGFnZURpc2FwcGVhcigpXG4gIC8vIGJpbmQgZXZlbnQgJ3JlbmRlckJlZ2luJyBhbmQgJ3JlbmRlckVuZCcgb24gd2luZG93LlxuICB0aGlzLl9pZGxlV2hlbkRvbVJlbmRlcmluZygpXG5cbiAgQ29tcG9uZW50LmNhbGwodGhpcywgZGF0YSlcbn1cblxuU2xpZGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ29tcG9uZW50LnByb3RvdHlwZSlcblxuU2xpZGVyLnByb3RvdHlwZS5faWRsZVdoZW5QYWdlRGlzYXBwZWFyID0gZnVuY3Rpb24gKCkge1xuICB2YXIgX3RoaXMgPSB0aGlzXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwYWdlc2hvdycsIGZ1bmN0aW9uICgpIHtcbiAgICBfdGhpcy5pc1BhZ2VTaG93ID0gdHJ1ZVxuICAgIF90aGlzLmF1dG9QbGF5ICYmICFfdGhpcy5pc0RvbVJlbmRlcmluZyAmJiBfdGhpcy5wbGF5KClcbiAgfSlcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BhZ2VoaWRlJywgZnVuY3Rpb24gKCkge1xuICAgIF90aGlzLmlzUGFnZVNob3cgPSBmYWxzZVxuICAgIF90aGlzLnN0b3AoKVxuICB9KVxufVxuXG5TbGlkZXIucHJvdG90eXBlLl9pZGxlV2hlbkRvbVJlbmRlcmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIF90aGlzID0gdGhpc1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVuZGVyZW5kJywgZnVuY3Rpb24gKCkge1xuICAgIF90aGlzLmlzRG9tUmVuZGVyaW5nID0gZmFsc2VcbiAgICBfdGhpcy5hdXRvUGxheSAmJiBfdGhpcy5pc1BhZ2VTaG93ICYmIF90aGlzLnBsYXkoKVxuICB9KVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVuZGVyYmVnaW4nLCBmdW5jdGlvbiAoKSB7XG4gICAgX3RoaXMuaXNEb21SZW5kZXJpbmcgPSB0cnVlXG4gICAgX3RoaXMuc3RvcCgpXG4gIH0pXG59XG5cblNsaWRlci5wcm90b3R5cGUuYXR0ciA9IHtcbiAgaW50ZXJ2YWw6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICB0aGlzLmludGVydmFsID0gcGFyc2VJbnQodmFsKSB8fCBERUZBVUxUX0lOVEVSVkFMXG4gICAgaWYgKHRoaXMuY2Fycm91c2VsKSB7XG4gICAgICB0aGlzLmNhcnJvdXNlbC5wbGF5SW50ZXJ2YWwgPSB0aGlzLmludGVydmFsXG4gICAgfVxuICB9LFxuXG4gIHBsYXlzdGF0dXM6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICB0aGlzLnBsYXlzdGF0dXMgPSB2YWwgJiYgdmFsICE9PSAnZmFsc2UnID8gdHJ1ZSA6IGZhbHNlXG4gICAgdGhpcy5hdXRvUGxheSA9IHRoaXMucGxheXN0YXR1c1xuICAgIGlmICh0aGlzLmNhcnJvdXNlbCkge1xuICAgICAgaWYgKHRoaXMucGxheXN0YXR1cykge1xuICAgICAgICB0aGlzLnBsYXkoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdG9wKClcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gc3VwcG9ydCBwbGF5c3RhdHVzJyBhbGlhcyBhdXRvLXBsYXkgZm9yIGNvbXBhdGliaWxpdHlcbiAgYXV0b1BsYXk6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICB0aGlzLmF0dHIucGxheXN0YXR1cy5jYWxsKHRoaXMsIHZhbClcbiAgfVxufVxuXG5TbGlkZXIucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBub2RlLmNsYXNzTGlzdC5hZGQoJ3NsaWRlcicpXG4gIG5vZGUuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnXG4gIG5vZGUuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJ1xuICByZXR1cm4gbm9kZVxufVxuXG5TbGlkZXIucHJvdG90eXBlLl9kb1JlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIF90aGlzID0gdGhpc1xuICBfdGhpcy5jcmVhdGVDaGlsZHJlbigpXG4gIF90aGlzLm9uQXBwZW5kKClcbn1cblxuU2xpZGVyLnByb3RvdHlwZS5yZW1vdmVDaGlsZCA9IGZ1bmN0aW9uIChjaGlsZCkge1xuICB2YXIgY2hpbGRyZW4gPSB0aGlzLmRhdGEuY2hpbGRyZW5cbiAgaWYgKGNoaWxkcmVuKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGNoaWxkLmRhdGEucmVmID09PSBjaGlsZHJlbltpXS5yZWYpIHtcbiAgICAgICAgY2hpbGRyZW4uc3BsaWNlKGksIDEpXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdGhpcy5fZG9SZW5kZXIoKVxufVxuXG5TbGlkZXIucHJvdG90eXBlLmluc2VydEJlZm9yZSA9IGZ1bmN0aW9uIChjaGlsZCwgYmVmb3JlKSB7XG4gIHZhciBjaGlsZHJlbiA9IHRoaXMuZGF0YS5jaGlsZHJlblxuICAvLyB2YXIgY2hpbGRJbmRleCA9IHRoaXMuY2hpbGRyZW4uaW5kZXhPZihiZWZvcmUuZGF0YSlcbiAgdmFyIGNoaWxkSW5kZXggPSAtMVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmIChjaGlsZHJlbltpXS5yZWYgPT09IGJlZm9yZS5kYXRhLnJlZikge1xuICAgICAgY2hpbGRJbmRleCA9IGlcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIGNoaWxkcmVuLnNwbGljZShjaGlsZEluZGV4LCAwLCBjaGlsZC5kYXRhKVxuXG4gIHRoaXMuX2RvUmVuZGVyKClcbiAgaWYgKHRoaXMuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkcmVuW3RoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgfVxufVxuXG5TbGlkZXIucHJvdG90eXBlLmFwcGVuZENoaWxkID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgdmFyIGNoaWxkcmVuID0gdGhpcy5kYXRhLmNoaWxkcmVuIHx8ICh0aGlzLmRhdGEuY2hpbGRyZW4gPSBbXSlcbiAgY2hpbGRyZW4ucHVzaChkYXRhKVxuICB0aGlzLl9kb1JlbmRlcigpXG4gIGlmICh0aGlzLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZHJlblt0aGlzLmNoaWxkcmVuLmxlbmd0aCAtIDFdXG4gIH1cbn1cblxuU2xpZGVyLnByb3RvdHlwZS5jcmVhdGVDaGlsZHJlbiA9IGZ1bmN0aW9uICgpIHtcblxuICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG5cbiAgLy8gcmVjcmVhdGUgc2xpZGVyIGNvbnRhaW5lci5cbiAgaWYgKHRoaXMuc2xpZGVyQ29udGFpbmVyKSB7XG4gICAgdGhpcy5ub2RlLnJlbW92ZUNoaWxkKHRoaXMuc2xpZGVyQ29udGFpbmVyKVxuICB9XG4gIGlmICh0aGlzLmluZGljYXRvcikge1xuICAgIHRoaXMuaW5kaWNhdG9yLm5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmluZGljYXRvci5ub2RlKVxuICB9XG4gIHRoaXMuY2hpbGRyZW4gPSBbXVxuXG4gIHZhciBzbGlkZXJDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpXG4gIHNsaWRlckNvbnRhaW5lci5zdHlsZS5saXN0U3R5bGUgPSAnbm9uZSdcbiAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKHNsaWRlckNvbnRhaW5lcilcbiAgdGhpcy5zbGlkZXJDb250YWluZXIgPSBzbGlkZXJDb250YWluZXJcblxuICB2YXIgY2hpbGRyZW4gPSB0aGlzLmRhdGEuY2hpbGRyZW5cbiAgdmFyIHNjYWxlID0gdGhpcy5kYXRhLnNjYWxlXG4gIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICB2YXIgaW5kaWNhdG9yRGF0YSwgd2lkdGgsIGhlaWdodFxuICB2YXIgY2hpbGRXaWR0aCA9IDBcbiAgdmFyIGNoaWxkSGVpZ2h0ID0gMFxuXG4gIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGRcbiAgICAgIGNoaWxkcmVuW2ldLnNjYWxlID0gdGhpcy5kYXRhLnNjYWxlXG4gICAgICBjaGlsZHJlbltpXS5pbnN0YW5jZUlkID0gdGhpcy5kYXRhLmluc3RhbmNlSWRcbiAgICAgIGlmIChjaGlsZHJlbltpXS50eXBlID09PSAnaW5kaWNhdG9yJykge1xuICAgICAgICBpbmRpY2F0b3JEYXRhID0gZXh0ZW5kKGNoaWxkcmVuW2ldLCB7XG4gICAgICAgICAgZXh0cmE6IHtcbiAgICAgICAgICAgIGFtb3VudDogY2hpbGRyZW4ubGVuZ3RoIC0gMSxcbiAgICAgICAgICAgIGluZGV4OiAwXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2hpbGQgPSBjb21wb25lbnRNYW5hZ2VyLmNyZWF0ZUVsZW1lbnQoY2hpbGRyZW5baV0sICdsaScpXG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZClcbiAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoY2hpbGQubm9kZSlcbiAgICAgICAgd2lkdGggPSBjaGlsZC5kYXRhLnN0eWxlLndpZHRoIHx8IDBcbiAgICAgICAgaGVpZ2h0ID0gY2hpbGQuZGF0YS5zdHlsZS5oZWlnaHQgfHwgMFxuICAgICAgICB3aWR0aCA+IGNoaWxkV2lkdGggJiYgKGNoaWxkV2lkdGggPSB3aWR0aClcbiAgICAgICAgaGVpZ2h0ID4gY2hpbGRIZWlnaHQgJiYgKGNoaWxkSGVpZ2h0ID0gaGVpZ2h0KVxuICAgICAgICBjaGlsZC5wYXJlbnRSZWYgPSB0aGlzLmRhdGEucmVmXG4gICAgICB9XG4gICAgfVxuICAgIC8vIGFwcGVuZCBpbmRpY2F0b3JcbiAgICBpZiAoaW5kaWNhdG9yRGF0YSkge1xuICAgICAgaW5kaWNhdG9yRGF0YS5leHRyYS53aWR0aCA9IHRoaXMuZGF0YS5zdHlsZS53aWR0aCB8fCBjaGlsZFdpZHRoXG4gICAgICBpbmRpY2F0b3JEYXRhLmV4dHJhLmhlaWdodCA9IHRoaXMuZGF0YS5zdHlsZS5oZWlnaHQgfHwgY2hpbGRIZWlnaHRcbiAgICAgIHRoaXMuaW5kaWNhdG9yID0gY29tcG9uZW50TWFuYWdlci5jcmVhdGVFbGVtZW50KGluZGljYXRvckRhdGEpXG4gICAgICB0aGlzLmluZGljYXRvci5wYXJlbnRSZWYgPSB0aGlzLmRhdGEucmVmXG4gICAgICB0aGlzLmluZGljYXRvci5zbGlkZXIgPSB0aGlzXG4gICAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQodGhpcy5pbmRpY2F0b3Iubm9kZSlcbiAgICB9XG5cbiAgICBzbGlkZXJDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gc2NhbGUgKiB0aGlzLmRhdGEuc3R5bGUuaGVpZ2h0ICsgJ3B4J1xuICAgIHNsaWRlckNvbnRhaW5lci5hcHBlbmRDaGlsZChmcmFnbWVudClcbiAgfVxufVxuXG5TbGlkZXIucHJvdG90eXBlLm9uQXBwZW5kID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5jYXJyb3VzZWwpIHtcbiAgICB0aGlzLmNhcnJvdXNlbC5yZW1vdmVFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLl9nZXRTbGlkZXJDaGFuZ2VIYW5kbGVyKCkpXG4gICAgdGhpcy5jYXJyb3VzZWwuc3RvcCgpXG4gICAgdGhpcy5jYXJyb3VzZWwgPSBudWxsXG4gIH1cbiAgdGhpcy5jYXJyb3VzZWwgPSBuZXcgbGliLmNhcnJvdXNlbCh0aGlzLnNsaWRlckNvbnRhaW5lciwge1xuICAgIGF1dG9wbGF5OiB0aGlzLmF1dG9QbGF5LFxuICAgIHVzZUdlc3R1cmU6IHRydWVcbiAgfSlcblxuICB0aGlzLmNhcnJvdXNlbC5wbGF5SW50ZXJ2YWwgPSB0aGlzLmludGVydmFsXG4gIHRoaXMuY2Fycm91c2VsLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMuX2dldFNsaWRlckNoYW5nZUhhbmRsZXIoKSlcbiAgdGhpcy5jdXJyZW50SW5kZXggPSAwXG5cbiAgLy8gcHJlbG9hZCBhbGwgaW1hZ2VzIGZvciBzbGlkZXJcbiAgLy8gYmVjYXVzZTpcbiAgLy8gMS4gbGliLWltZyBkb2Vzbid0IGxpc3RlbiB0byBldmVudCB0cmFuc2l0aW9uZW5kXG4gIC8vIDIuIGV2ZW4gaWYgd2UgZmlyZSBsYXp5IGxvYWQgaW4gc2xpZGVyJ3MgY2hhbmdlIGV2ZW50IGhhbmRsZXIsXG4gIC8vICAgIHRoZSBuZXh0IGltYWdlIHN0aWxsIHdvbid0IGJlIHByZWxvYWRlZCB1dGlsbCB0aGUgbW9tZW50IGl0XG4gIC8vICAgIHNsaWRlcyBpbnRvIHRoZSB2aWV3LCB3aGljaCBpcyB0b28gbGF0ZS5cbiAgaWYgKHRoaXMucHJlbG9hZEltZ3NUaW1lcikge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnByZWxvYWRJbWdzVGltZXIpXG4gIH1cbiAgLy8gVGhlIHRpbWUganVzdCBiZWZvcmUgdGhlIHNlY29uZCBzbGlkZSBhcHBlYXIgYW5kIGVub3VnaFxuICAvLyBmb3IgYWxsIGNoaWxkIGVsZW1lbnRzIHRvIGFwcGVuZCBpcyBvay5cbiAgdmFyIHByZWxvYWRUaW1lID0gMC44XG4gIHRoaXMucHJlbG9hZEltZ3NUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIHZhciBpbWdzID0gdGhpcy5jYXJyb3VzZWwuZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCcud2VleC1pbWcnKVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gaW1ncy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBpbWcgPSBpbWdzW2ldXG4gICAgICB2YXIgaUxhenlTcmMgPSBpbWcuZ2V0QXR0cmlidXRlKCdpLWxhenktc3JjJylcbiAgICAgIHZhciBpbWdTcmMgPSBpbWcuZ2V0QXR0cmlidXRlKCdpbWctc3JjJylcbiAgICAgIGlmIChpTGF6eVNyYykge1xuICAgICAgICBpbWcuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gJ3VybCgnICsgaUxhenlTcmMgKyAnKSdcbiAgICAgIH0gZWxzZSBpZiAoaW1nU3JjKSB7XG4gICAgICAgIGltZy5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAndXJsKCcgKyBpbWdTcmMgKyAnKSdcbiAgICAgIH1cbiAgICAgIGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2ktbGF6eS1zcmMnKVxuICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnaW1nLXNyYycpXG4gICAgfVxuICB9LmJpbmQodGhpcyksIHByZWxvYWRUaW1lICogMTAwMClcblxuICAvLyBhdm9pZCBwYWdlIHNjcm9sbCB3aGVuIHBhbm5pbmdcbiAgdmFyIHBhbm5pbmcgPSBmYWxzZVxuICB0aGlzLmNhcnJvdXNlbC5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BhbnN0YXJ0JywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoIWUuaXNWZXJ0aWNhbCkge1xuICAgICAgcGFubmluZyA9IHRydWVcbiAgICB9XG4gIH0pXG4gIHRoaXMuY2Fycm91c2VsLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncGFuZW5kJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoIWUuaXNWZXJ0aWNhbCkge1xuICAgICAgcGFubmluZyA9IGZhbHNlXG4gICAgfVxuICB9KVxuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHBhbm5pbmcpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH0uYmluZCh0aGlzKSlcblxufVxuXG5TbGlkZXIucHJvdG90eXBlLl91cGRhdGVJbmRpY2F0b3JzID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmluZGljYXRvciAmJiB0aGlzLmluZGljYXRvci5zZXRJbmRleCh0aGlzLmN1cnJlbnRJbmRleClcbn1cblxuU2xpZGVyLnByb3RvdHlwZS5fZ2V0U2xpZGVyQ2hhbmdlSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gIGlmICghdGhpcy5zbGlkZXJDaGFuZ2VIYW5kbGVyKSB7XG4gICAgdGhpcy5zbGlkZXJDaGFuZ2VIYW5kbGVyID0gKGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgaW5kZXggPSB0aGlzLmNhcnJvdXNlbC5pdGVtcy5pbmRleFxuICAgICAgdGhpcy5jdXJyZW50SW5kZXggPSBpbmRleFxuXG4gICAgICAvLyB1cGRhdGVJbmRpY2F0b3JzXG4gICAgICB0aGlzLl91cGRhdGVJbmRpY2F0b3JzKClcblxuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdjaGFuZ2UnLCB7IGluZGV4OiBpbmRleCB9KVxuICAgIH0pLmJpbmQodGhpcylcbiAgfVxuICByZXR1cm4gdGhpcy5zbGlkZXJDaGFuZ2VIYW5kbGVyXG59XG5cblNsaWRlci5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5jYXJyb3VzZWwucGxheSgpXG59XG5cblNsaWRlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5jYXJyb3VzZWwuc3RvcCgpXG59XG5cblNsaWRlci5wcm90b3R5cGUuc2xpZGVUbyA9IGZ1bmN0aW9uIChpbmRleCkge1xuICB2YXIgb2Zmc2V0ID0gaW5kZXggLSB0aGlzLmN1cnJlbnRJbmRleFxuICB0aGlzLmNhcnJvdXNlbC5pdGVtcy5zbGlkZShvZmZzZXQpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2xpZGVyXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvc2xpZGVyLmpzXG4gKiogbW9kdWxlIGlkID0gNDlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIih0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykgJiYgKHdpbmRvdyA9IHtjdHJsOiB7fSwgbGliOiB7fX0pOyF3aW5kb3cuY3RybCAmJiAod2luZG93LmN0cmwgPSB7fSk7IXdpbmRvdy5saWIgJiYgKHdpbmRvdy5saWIgPSB7fSk7cmVxdWlyZSgnYW5pbWF0aW9uanMnKTtyZXF1aXJlKCdjdWJpY2JlemllcicpO3JlcXVpcmUoJ2dlc3R1cmVqcycpOyFmdW5jdGlvbigpe3ZhciBhPVwiW2RhdGEtY3RybC1uYW1lPWNhcnJvdXNlbF17cG9zaXRpb246cmVsYXRpdmU7LXdlYmtpdC10cmFuc2Zvcm06dHJhbnNsYXRlWigxcHgpOy1tcy10cmFuc2Zvcm06dHJhbnNsYXRlWigxcHgpO3RyYW5zZm9ybTp0cmFuc2xhdGVaKDFweCl9XCIsYj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7aWYoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdLmFwcGVuZENoaWxkKGIpLGIuc3R5bGVTaGVldCliLnN0eWxlU2hlZXQuZGlzYWJsZWR8fChiLnN0eWxlU2hlZXQuY3NzVGV4dD1hKTtlbHNlIHRyeXtiLmlubmVySFRNTD1hfWNhdGNoKGMpe2IuaW5uZXJUZXh0PWF9fSgpOyFmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhKXt2YXIgYixjPXt4OjAseTowfSxkPWdldENvbXB1dGVkU3R5bGUoYSlbbCtcIlRyYW5zZm9ybVwiXTtyZXR1cm5cIm5vbmVcIiE9PWQmJihiPWQubWF0Y2goL15tYXRyaXgzZFxcKCg/OlstXFxkLl0rLFxccyopezEyfShbLVxcZC5dKyksXFxzKihbLVxcZC5dKykoPzosXFxzKlstXFxkLl0rKXsyfVxcKS8pfHxkLm1hdGNoKC9ebWF0cml4XFwoKD86Wy1cXGQuXSssXFxzKil7NH0oWy1cXGQuXSspLFxccyooWy1cXGQuXSspXFwpJC8pKSYmKGMueD1wYXJzZUZsb2F0KGJbMV0pfHwwLGMueT1wYXJzZUZsb2F0KGJbMl0pfHwwKSxjfWZ1bmN0aW9uIGUoYSxiKXtyZXR1cm4gYT1wYXJzZUZsb2F0KGEpLGI9cGFyc2VGbG9hdChiKSwwIT1hJiYoYSs9XCJweFwiKSwwIT1iJiYoYis9XCJweFwiKSxuP1widHJhbnNsYXRlM2QoXCIrYStcIiwgXCIrYitcIiwgMClcIjpcInRyYW5zbGF0ZShcIithK1wiLCBcIitiK1wiKVwifWZ1bmN0aW9uIGYoYSl7cmV0dXJuIG8uY2FsbChhKX1mdW5jdGlvbiBnKGEsYyl7ZnVuY3Rpb24gZyhhLGIpe3ZhciBjPWguY3JlYXRlRXZlbnQoXCJIVE1MRXZlbnRzXCIpO2lmKGMuaW5pdEV2ZW50KGEsITEsITEpLGIpZm9yKHZhciBkIGluIGIpY1tkXT1iW2RdO24uZGlzcGF0Y2hFdmVudChjKX1mdW5jdGlvbiBpKGEpe2Zvcig7MD5hOylhKz1yO2Zvcig7YT49cjspYS09cjtyZXR1cm4gYX1mdW5jdGlvbiBqKGEpe2lmKDAhPT1yKXt2YXIgYixjLGQ9cS5nZXQoYSk7cj4xJiYoYj1xLmdldChhLTEpLGM9Mj09PXI/cS5nZXRDbG9uZWQoYSsxKTpxLmdldChhKzEpLGQuc3R5bGUubGVmdD0tbytcInB4XCIsYi5zdHlsZS5sZWZ0PS1vLXMrXCJweFwiLGMuc3R5bGUubGVmdD0tbytzK1wicHhcIiksdD1kLmluZGV4LGcoXCJjaGFuZ2VcIix7cHJldkl0ZW06YixjdXJJdGVtOmQsbmV4dEl0ZW06Y30pfX12YXIgaz10aGlzLG09RGF0ZS5ub3coKStcIi1cIisgKytwLG49ZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpOzEhPT1hcmd1bWVudHMubGVuZ3RofHxhcmd1bWVudHNbMF1pbnN0YW5jZW9mIEhUTUxFbGVtZW50fHwoYz1hcmd1bWVudHNbMF0sYT1udWxsKSxhfHwoYT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIiksbi5hcHBlbmRDaGlsZChhKSksYz1jfHx7fSxhLnNldEF0dHJpYnV0ZShcImRhdGEtY3RybC1uYW1lXCIsXCJjYXJyb3VzZWxcIiksYS5zZXRBdHRyaWJ1dGUoXCJkYXRhLWN0cmwtaWRcIixtKSxhLnN0eWxlLnBvc2l0aW9uPVwicmVsYXRpdmVcIixhLnN0eWxlW2wrXCJUcmFuc2Zvcm1cIl09ZSgwLDApO3ZhciBvPTAscT17fSxyPTAscz1jLnN0ZXB8fGEuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGgsdD0wO3EuYWRkPWZ1bmN0aW9uKGIpe3ZhciBjPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtyZXR1cm4gYy5zdHlsZS5kaXNwbGF5PVwibm9uZVwiLGMuc3R5bGVbXCJmbG9hdFwiXT1cImxlZnRcIixjLmluZGV4PXIsXCJzdHJpbmdcIj09dHlwZW9mIGI/Yy5pbm5lckhUTUw9YjpiIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQmJmMuYXBwZW5kQ2hpbGQoYiksYS5hcHBlbmRDaGlsZChjKSxPYmplY3QuZGVmaW5lUHJvcGVydHkocSxyK1wiXCIse2dldDpmdW5jdGlvbigpe3JldHVybiBjfX0pLHIrKyxjfSxxLmdldD1mdW5jdGlvbihhKXtyZXR1cm4gcVtpKGEpXX0scS5nZXRDbG9uZWQ9ZnVuY3Rpb24oYil7ZnVuY3Rpb24gYyhhLGIsZCl7dmFyIGU9YS5fbGlzdGVuZXJzO2lmKGUpe2IuX2xpc3RlbmVycz1lO2Zvcih2YXIgZiBpbiBlKWIuYWRkRXZlbnRMaXN0ZW5lcihmLGVbZl0pfWlmKGQmJmEuY2hpbGRyZW4mJmEuY2hpbGRyZW4ubGVuZ3RoKWZvcih2YXIgZz0wLGg9YS5jaGlsZHJlbi5sZW5ndGg7aD5nO2crKyljKGEuY2hpbGRyZW5bZ10sYi5jaGlsZHJlbltnXSxkKX12YXIgYj1pKGIpLGQ9YS5xdWVyeVNlbGVjdG9yKCdbY2xvbmVkPVwiY2xvbmVkLScrYisnXCJdJyksZT1xW2JdO3JldHVybiBkfHwoZD1lLmNsb25lTm9kZSghMCksYyhlLGQsITApLGEuYXBwZW5kQ2hpbGQoZCksZC5zZXRBdHRyaWJ1dGUoXCJjbG9uZWRcIixcImNsb25lZC1cIitiKSxkLmluZGV4PWIpLGR9LHEuc2xpZGU9ZnVuY3Rpb24oYyl7aWYoMCE9PXIpezE9PT1yJiYoYz0wKTt2YXIgZj1kKGEpLngsZz1vK3MqLWMsaD1nLWY7aWYoMCE9PWgpe25ldyBiLmFuaW1hdGlvbig0MDAsYi5jdWJpY2Jlemllci5lYXNlLGZ1bmN0aW9uKGIsYyl7YS5zdHlsZVtsK1wiVHJhbnNmb3JtXCJdPWUoZitoKmMsMCl9KS5wbGF5KCkudGhlbihmdW5jdGlvbigpe289ZyxhLnN0eWxlW2wrXCJUcmFuc2Zvcm1cIl09ZShnLDApLGMmJmoodCtjKX0pfX19LHEubmV4dD1mdW5jdGlvbigpe3Euc2xpZGUoMSl9LHEucHJldj1mdW5jdGlvbigpe3Euc2xpZGUoLTEpfSxmKGEucXVlcnlTZWxlY3RvckFsbChcImxpXCIpKS5mb3JFYWNoKGZ1bmN0aW9uKGEpe2Euc3R5bGUucG9zaXRpb249XCJhYnNvbHV0ZVwiLGEuc3R5bGUudG9wPVwiMFwiLGEuc3R5bGUubGVmdD1yKnMrXCJweFwiLGEuc3R5bGVbXCJmbG9hdFwiXT1cImxlZnRcIixhLmluZGV4PXIsT2JqZWN0LmRlZmluZVByb3BlcnR5KHEscitcIlwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gYX19KSxyKyt9KSxPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcyxcIml0ZW1zXCIse2dldDpmdW5jdGlvbigpe3JldHVybiBxfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxLFwibGVuZ3RoXCIse2dldDpmdW5jdGlvbigpe3JldHVybiByfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShxLFwiaW5kZXhcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHR9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHEsXCJzdGVwXCIse2dldDpmdW5jdGlvbigpe3JldHVybiBzfSxzZXQ6ZnVuY3Rpb24oYSl7cz1hfX0pO3ZhciB1PSExLHY9ITEsdz0hMTt0aGlzLnBsYXk9ZnVuY3Rpb24oKXtyZXR1cm4gdT92b2lkKHZ8fCh2PXNldFRpbWVvdXQoZnVuY3Rpb24oKXt3PSEwLHEubmV4dCgpLHNldFRpbWVvdXQoZnVuY3Rpb24oKXt3PSExfSw1MDApLHY9c2V0VGltZW91dChhcmd1bWVudHMuY2FsbGVlLDQwMCt6KX0sNDAwK3opKSk6KHU9ITAsaigwKSl9LHRoaXMuc3RvcD1mdW5jdGlvbigpe3YmJihjbGVhclRpbWVvdXQodiksc2V0VGltZW91dChmdW5jdGlvbigpe3Y9ITF9LDUwMCkpfTt2YXIgeD0hMSx5PSExO09iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLFwiYXV0b3BsYXlcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHh9LHNldDpmdW5jdGlvbihhKXt4PSEhYSx5JiYoY2xlYXJUaW1lb3V0KHkpLHk9ITEpLHg/eT1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7ay5wbGF5KCl9LDJlMyk6ay5zdG9wKCl9fSksdGhpcy5hdXRvcGxheT0hIWMuYXV0b3BsYXk7dmFyIHo9MTUwMDtpZihPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcyxcInBsYXlJbnRlcnZhbFwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gen0sc2V0OmZ1bmN0aW9uKGEpe3o9YX19KSx0aGlzLnBsYXlJbnRlcnZhbD0hIWMucGxheUludGVydmFsfHwxNTAwLGMudXNlR2VzdHVyZSl7dmFyIEEsQj0hMTthLmFkZEV2ZW50TGlzdGVuZXIoXCJwYW5zdGFydFwiLGZ1bmN0aW9uKGEpe2EuaXNWZXJ0aWNhbHx8QiYmd3x8KGEucHJldmVudERlZmF1bHQoKSxhLnN0b3BQcm9wYWdhdGlvbigpLHgmJmsuc3RvcCgpLEE9MCxCPSEwKX0pLGEuYWRkRXZlbnRMaXN0ZW5lcihcInBhbm1vdmVcIixmdW5jdGlvbihiKXshYi5pc1ZlcnRpY2FsJiZCJiYoYi5wcmV2ZW50RGVmYXVsdCgpLGIuc3RvcFByb3BhZ2F0aW9uKCksQT1iLmRpc3BsYWNlbWVudFgsYS5zdHlsZVtsK1wiVHJhbnNmb3JtXCJdPWUobytBLDApKX0pLGEuYWRkRXZlbnRMaXN0ZW5lcihcInBhbmVuZFwiLGZ1bmN0aW9uKGEpeyFhLmlzVmVydGljYWwmJkImJihhLnByZXZlbnREZWZhdWx0KCksYS5zdG9wUHJvcGFnYXRpb24oKSxCPSExLGEuaXNmbGljaz8wPkE/cS5uZXh0KCk6cS5wcmV2KCk6TWF0aC5hYnMoQSk8cy8yP3Euc2xpZGUoMCk6cS5zbGlkZSgwPkE/MTotMSkseCYmc2V0VGltZW91dChmdW5jdGlvbigpe2sucGxheSgpfSwyZTMpKX0sITEpLGEuYWRkRXZlbnRMaXN0ZW5lcihcInN3aXBlXCIsZnVuY3Rpb24oYSl7YS5pc1ZlcnRpY2FsfHwoYS5wcmV2ZW50RGVmYXVsdCgpLGEuc3RvcFByb3BhZ2F0aW9uKCkpfSl9dGhpcy5hZGRFdmVudExpc3RlbmVyPWZ1bmN0aW9uKGEsYil7dGhpcy5yb290LmFkZEV2ZW50TGlzdGVuZXIoYSxiLCExKX0sdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyPWZ1bmN0aW9uKGEsYil7dGhpcy5yb290LnJlbW92ZUV2ZW50TGlzdGVuZXIoYSxiLCExKX0sdGhpcy5yb290PW4sdGhpcy5lbGVtZW50PWF9dmFyIGg9YS5kb2N1bWVudCxpPWEubmF2aWdhdG9yLnVzZXJBZ2VudCxqPSEhaS5tYXRjaCgvRmlyZWZveC9pKSxrPSEhaS5tYXRjaCgvSUVNb2JpbGUvaSksbD1qP1wiTW96XCI6az9cIm1zXCI6XCJ3ZWJraXRcIixtPWs/XCJNU0NTU01hdHJpeFwiOlwiV2ViS2l0Q1NTTWF0cml4XCIsbj0hIWp8fG0gaW4gYSYmXCJtMTFcImluIG5ldyBhW21dLG89QXJyYXkucHJvdG90eXBlLnNsaWNlLHA9MDtiLmNhcnJvdXNlbD1nfSh3aW5kb3csd2luZG93LmxpYix3aW5kb3cuY3RybHx8KHdpbmRvdy5jdHJsPXt9KSk7O21vZHVsZS5leHBvcnRzID0gd2luZG93LmxpYlsnY2Fycm91c2VsJ107XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY2Fycm91c2VsL2J1aWxkL2NhcnJvdXNlbC5jb21tb24uanNcbiAqKiBtb2R1bGUgaWQgPSA1MFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSAmJiAod2luZG93ID0ge2N0cmw6IHt9LCBsaWI6IHt9fSk7IXdpbmRvdy5jdHJsICYmICh3aW5kb3cuY3RybCA9IHt9KTshd2luZG93LmxpYiAmJiAod2luZG93LmxpYiA9IHt9KTshZnVuY3Rpb24oYSxiKXtmdW5jdGlvbiBjKGEpe3JldHVybiBzZXRUaW1lb3V0KGEsbCl9ZnVuY3Rpb24gZChhKXtjbGVhclRpbWVvdXQoYSl9ZnVuY3Rpb24gZSgpe3ZhciBhPXt9LGI9bmV3IG0oZnVuY3Rpb24oYixjKXthLnJlc29sdmU9YixhLnJlamVjdD1jfSk7cmV0dXJuIGEucHJvbWlzZT1iLGF9ZnVuY3Rpb24gZihhLGIpe3JldHVybltcInRoZW5cIixcImNhdGNoXCJdLmZvckVhY2goZnVuY3Rpb24oYyl7YltjXT1mdW5jdGlvbigpe3JldHVybiBhW2NdLmFwcGx5KGEsYXJndW1lbnRzKX19KSxifWZ1bmN0aW9uIGcoYil7dmFyIGMsZCxoPSExO3RoaXMucmVxdWVzdD1mdW5jdGlvbigpe2g9ITE7dmFyIGc9YXJndW1lbnRzO3JldHVybiBjPWUoKSxmKGMucHJvbWlzZSx0aGlzKSxkPW4oZnVuY3Rpb24oKXtofHxjJiZjLnJlc29sdmUoYi5hcHBseShhLGcpKX0pLHRoaXN9LHRoaXMuY2FuY2VsPWZ1bmN0aW9uKCl7cmV0dXJuIGQmJihoPSEwLG8oZCksYyYmYy5yZWplY3QoXCJDQU5DRUxcIikpLHRoaXN9LHRoaXMuY2xvbmU9ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IGcoYil9fWZ1bmN0aW9uIGgoYSxiKXtcImZ1bmN0aW9uXCI9PXR5cGVvZiBiJiYoYj17MDpifSk7Zm9yKHZhciBjPWEvbCxkPTEvYyxlPVtdLGY9T2JqZWN0LmtleXMoYikubWFwKGZ1bmN0aW9uKGEpe3JldHVybiBwYXJzZUludChhKX0pLGg9MDtjPmg7aCsrKXt2YXIgaT1mWzBdLGo9ZCpoO2lmKG51bGwhPWkmJjEwMCpqPj1pKXt2YXIgaz1iW1wiXCIraV07ayBpbnN0YW5jZW9mIGd8fChrPW5ldyBnKGspKSxlLnB1c2goayksZi5zaGlmdCgpfWVsc2UgZS5sZW5ndGgmJmUucHVzaChlW2UubGVuZ3RoLTFdLmNsb25lKCkpfXJldHVybiBlfWZ1bmN0aW9uIGkoYSl7dmFyIGM7cmV0dXJuXCJzdHJpbmdcIj09dHlwZW9mIGF8fGEgaW5zdGFuY2VvZiBBcnJheT9iLmN1YmljYmV6aWVyP1wic3RyaW5nXCI9PXR5cGVvZiBhP2IuY3ViaWNiZXppZXJbYV0mJihjPWIuY3ViaWNiZXppZXJbYV0pOmEgaW5zdGFuY2VvZiBBcnJheSYmND09PWEubGVuZ3RoJiYoYz1iLmN1YmljYmV6aWVyLmFwcGx5KGIuY3ViaWNiZXppZXIsYSkpOmNvbnNvbGUuZXJyb3IoXCJyZXF1aXJlIGxpYi5jdWJpY2JlemllclwiKTpcImZ1bmN0aW9uXCI9PXR5cGVvZiBhJiYoYz1hKSxjfWZ1bmN0aW9uIGooYSxiLGMpe3ZhciBkLGc9aChhLGMpLGo9MS8oYS9sKSxrPTAsbT1pKGIpO2lmKCFtKXRocm93IG5ldyBFcnJvcihcInVuZXhjZXB0IHRpbWluZyBmdW5jdGlvblwiKTt2YXIgbj0hMTt0aGlzLnBsYXk9ZnVuY3Rpb24oKXtmdW5jdGlvbiBhKCl7dmFyIGM9aiooaysxKS50b0ZpeGVkKDEwKSxlPWdba107ZS5yZXF1ZXN0KGMudG9GaXhlZCgxMCksYihjKS50b0ZpeGVkKDEwKSkudGhlbihmdW5jdGlvbigpe24mJihrPT09Zy5sZW5ndGgtMT8obj0hMSxkJiZkLnJlc29sdmUoXCJGSU5JU0hcIiksZD1udWxsKTooaysrLGEoKSkpfSxmdW5jdGlvbigpe30pfWlmKCFuKXJldHVybiBuPSEwLGR8fChkPWUoKSxmKGQucHJvbWlzZSx0aGlzKSksYSgpLHRoaXN9LHRoaXMuc3RvcD1mdW5jdGlvbigpe3JldHVybiBuPyhuPSExLGdba10mJmdba10uY2FuY2VsKCksdGhpcyk6dm9pZCAwfX12YXIgaz02MCxsPTFlMy9rLG09YS5Qcm9taXNlfHxiLnByb21pc2UmJmIucHJvbWlzZS5FUzZQcm9taXNlLG49d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZXx8d2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lfHx3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lfHx3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lfHxjLG89d2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lfHx3aW5kb3cubXNDYW5jZWxBbmltYXRpb25GcmFtZXx8d2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lfHx3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWV8fGQ7KG49PT1jfHxvPT09ZCkmJihuPWMsbz1kKSxiLmFuaW1hdGlvbj1mdW5jdGlvbihhLGIsYyl7cmV0dXJuIG5ldyBqKGEsYixjKX0sYi5hbmltYXRpb24uZnJhbWU9ZnVuY3Rpb24oYSl7cmV0dXJuIG5ldyBnKGEpfSxiLmFuaW1hdGlvbi5yZXF1ZXN0RnJhbWU9ZnVuY3Rpb24oYSl7dmFyIGI9bmV3IGcoYSk7cmV0dXJuIGIucmVxdWVzdCgpfX0od2luZG93LHdpbmRvdy5saWJ8fCh3aW5kb3cubGliPXt9KSk7O21vZHVsZS5leHBvcnRzID0gd2luZG93LmxpYlsnYW5pbWF0aW9uJ107XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vYW5pbWF0aW9uanMvYnVpbGQvYW5pbWF0aW9uLmNvbW1vbi5qc1xuICoqIG1vZHVsZSBpZCA9IDUxXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpICYmICh3aW5kb3cgPSB7Y3RybDoge30sIGxpYjoge319KTshd2luZG93LmN0cmwgJiYgKHdpbmRvdy5jdHJsID0ge30pOyF3aW5kb3cubGliICYmICh3aW5kb3cubGliID0ge30pOyFmdW5jdGlvbihhLGIpe2Z1bmN0aW9uIGMoYSxiLGMsZCl7ZnVuY3Rpb24gZShhKXtyZXR1cm4oMyprKmErMipsKSphK219ZnVuY3Rpb24gZihhKXtyZXR1cm4oKGsqYStsKSphK20pKmF9ZnVuY3Rpb24gZyhhKXtyZXR1cm4oKG4qYStvKSphK3ApKmF9ZnVuY3Rpb24gaChhKXtmb3IodmFyIGIsYyxkPWEsZz0wOzg+ZztnKyspe2lmKGM9ZihkKS1hLE1hdGguYWJzKGMpPGopcmV0dXJuIGQ7aWYoYj1lKGQpLE1hdGguYWJzKGIpPGopYnJlYWs7ZC09Yy9ifXZhciBoPTEsaT0wO2ZvcihkPWE7aD5pOyl7aWYoYz1mKGQpLWEsTWF0aC5hYnMoYyk8ailyZXR1cm4gZDtjPjA/aD1kOmk9ZCxkPShoK2kpLzJ9cmV0dXJuIGR9ZnVuY3Rpb24gaShhKXtyZXR1cm4gZyhoKGEpKX12YXIgaj0xZS02LGs9MyphLTMqYysxLGw9MypjLTYqYSxtPTMqYSxuPTMqYi0zKmQrMSxvPTMqZC02KmIscD0zKmI7cmV0dXJuIGl9Yi5jdWJpY2Jlemllcj1jLGIuY3ViaWNiZXppZXIubGluZWFyPWMoMCwwLDEsMSksYi5jdWJpY2Jlemllci5lYXNlPWMoLjI1LC4xLC4yNSwxKSxiLmN1YmljYmV6aWVyLmVhc2VJbj1jKC40MiwwLDEsMSksYi5jdWJpY2Jlemllci5lYXNlT3V0PWMoMCwwLC41OCwxKSxiLmN1YmljYmV6aWVyLmVhc2VJbk91dD1jKC40MiwwLC41OCwxKX0od2luZG93LHdpbmRvdy5saWJ8fCh3aW5kb3cubGliPXt9KSk7O21vZHVsZS5leHBvcnRzID0gd2luZG93LmxpYlsnY3ViaWNiZXppZXInXTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jdWJpY2Jlemllci9idWlsZC9jdWJpY2Jlemllci5jb21tb24uanNcbiAqKiBtb2R1bGUgaWQgPSA1MlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSAmJiAod2luZG93ID0ge2N0cmw6IHt9LCBsaWI6IHt9fSk7IXdpbmRvdy5jdHJsICYmICh3aW5kb3cuY3RybCA9IHt9KTshd2luZG93LmxpYiAmJiAod2luZG93LmxpYiA9IHt9KTshZnVuY3Rpb24oYSl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gYihhLGIpe2Zvcih2YXIgYz1hO2M7KXtpZihjLmNvbnRhaW5zKGIpfHxjPT1iKXJldHVybiBjO2M9Yy5wYXJlbnROb2RlfXJldHVybiBudWxsfWZ1bmN0aW9uIGMoYSxiLGMpe3ZhciBkPWkuY3JlYXRlRXZlbnQoXCJIVE1MRXZlbnRzXCIpO2lmKGQuaW5pdEV2ZW50KGIsITAsITApLFwib2JqZWN0XCI9PXR5cGVvZiBjKWZvcih2YXIgZSBpbiBjKWRbZV09Y1tlXTthLmRpc3BhdGNoRXZlbnQoZCl9ZnVuY3Rpb24gZChhLGIsYyxkLGUsZixnLGgpe3ZhciBpPU1hdGguYXRhbjIoaC1mLGctZSktTWF0aC5hdGFuMihkLWIsYy1hKSxqPU1hdGguc3FydCgoTWF0aC5wb3coaC1mLDIpK01hdGgucG93KGctZSwyKSkvKE1hdGgucG93KGQtYiwyKStNYXRoLnBvdyhjLWEsMikpKSxrPVtlLWoqYSpNYXRoLmNvcyhpKStqKmIqTWF0aC5zaW4oaSksZi1qKmIqTWF0aC5jb3MoaSktaiphKk1hdGguc2luKGkpXTtyZXR1cm57cm90YXRlOmksc2NhbGU6aix0cmFuc2xhdGU6ayxtYXRyaXg6W1tqKk1hdGguY29zKGkpLC1qKk1hdGguc2luKGkpLGtbMF1dLFtqKk1hdGguc2luKGkpLGoqTWF0aC5jb3MoaSksa1sxXV0sWzAsMCwxXV19fWZ1bmN0aW9uIGUoYSl7MD09PU9iamVjdC5rZXlzKGwpLmxlbmd0aCYmKGouYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLGYsITEpLGouYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsZywhMSksai5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hjYW5jZWxcIixoLCExKSk7Zm9yKHZhciBkPTA7ZDxhLmNoYW5nZWRUb3VjaGVzLmxlbmd0aDtkKyspe3ZhciBlPWEuY2hhbmdlZFRvdWNoZXNbZF0saT17fTtmb3IodmFyIG0gaW4gZSlpW21dPWVbbV07dmFyIG49e3N0YXJ0VG91Y2g6aSxzdGFydFRpbWU6RGF0ZS5ub3coKSxzdGF0dXM6XCJ0YXBwaW5nXCIsZWxlbWVudDphLnNyY0VsZW1lbnR8fGEudGFyZ2V0LHByZXNzaW5nSGFuZGxlcjpzZXRUaW1lb3V0KGZ1bmN0aW9uKGIsZCl7cmV0dXJuIGZ1bmN0aW9uKCl7XCJ0YXBwaW5nXCI9PT1uLnN0YXR1cyYmKG4uc3RhdHVzPVwicHJlc3NpbmdcIixjKGIsXCJsb25ncHJlc3NcIix7dG91Y2g6ZCx0b3VjaGVzOmEudG91Y2hlcyxjaGFuZ2VkVG91Y2hlczphLmNoYW5nZWRUb3VjaGVzLHRvdWNoRXZlbnQ6YX0pKSxjbGVhclRpbWVvdXQobi5wcmVzc2luZ0hhbmRsZXIpLG4ucHJlc3NpbmdIYW5kbGVyPW51bGx9fShhLnNyY0VsZW1lbnR8fGEudGFyZ2V0LGEuY2hhbmdlZFRvdWNoZXNbZF0pLDUwMCl9O2xbZS5pZGVudGlmaWVyXT1ufWlmKDI9PU9iamVjdC5rZXlzKGwpLmxlbmd0aCl7dmFyIG89W107Zm9yKHZhciBtIGluIGwpby5wdXNoKGxbbV0uZWxlbWVudCk7YyhiKG9bMF0sb1sxXSksXCJkdWFsdG91Y2hzdGFydFwiLHt0b3VjaGVzOmsuY2FsbChhLnRvdWNoZXMpLHRvdWNoRXZlbnQ6YX0pfX1mdW5jdGlvbiBmKGEpe2Zvcih2YXIgZT0wO2U8YS5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7ZSsrKXt2YXIgZj1hLmNoYW5nZWRUb3VjaGVzW2VdLGc9bFtmLmlkZW50aWZpZXJdO2lmKCFnKXJldHVybjtnLmxhc3RUb3VjaHx8KGcubGFzdFRvdWNoPWcuc3RhcnRUb3VjaCksZy5sYXN0VGltZXx8KGcubGFzdFRpbWU9Zy5zdGFydFRpbWUpLGcudmVsb2NpdHlYfHwoZy52ZWxvY2l0eVg9MCksZy52ZWxvY2l0eVl8fChnLnZlbG9jaXR5WT0wKSxnLmR1cmF0aW9ufHwoZy5kdXJhdGlvbj0wKTt2YXIgaD1EYXRlLm5vdygpLWcubGFzdFRpbWUsaT0oZi5jbGllbnRYLWcubGFzdFRvdWNoLmNsaWVudFgpL2gsaj0oZi5jbGllbnRZLWcubGFzdFRvdWNoLmNsaWVudFkpL2gsaz03MDtoPmsmJihoPWspLGcuZHVyYXRpb24raD5rJiYoZy5kdXJhdGlvbj1rLWgpLGcudmVsb2NpdHlYPShnLnZlbG9jaXR5WCpnLmR1cmF0aW9uK2kqaCkvKGcuZHVyYXRpb24raCksZy52ZWxvY2l0eVk9KGcudmVsb2NpdHlZKmcuZHVyYXRpb24raipoKS8oZy5kdXJhdGlvbitoKSxnLmR1cmF0aW9uKz1oLGcubGFzdFRvdWNoPXt9O2Zvcih2YXIgbSBpbiBmKWcubGFzdFRvdWNoW21dPWZbbV07Zy5sYXN0VGltZT1EYXRlLm5vdygpO3ZhciBuPWYuY2xpZW50WC1nLnN0YXJ0VG91Y2guY2xpZW50WCxvPWYuY2xpZW50WS1nLnN0YXJ0VG91Y2guY2xpZW50WSxwPU1hdGguc3FydChNYXRoLnBvdyhuLDIpK01hdGgucG93KG8sMikpOyhcInRhcHBpbmdcIj09PWcuc3RhdHVzfHxcInByZXNzaW5nXCI9PT1nLnN0YXR1cykmJnA+MTAmJihnLnN0YXR1cz1cInBhbm5pbmdcIixnLmlzVmVydGljYWw9IShNYXRoLmFicyhuKT5NYXRoLmFicyhvKSksYyhnLmVsZW1lbnQsXCJwYW5zdGFydFwiLHt0b3VjaDpmLHRvdWNoZXM6YS50b3VjaGVzLGNoYW5nZWRUb3VjaGVzOmEuY2hhbmdlZFRvdWNoZXMsdG91Y2hFdmVudDphLGlzVmVydGljYWw6Zy5pc1ZlcnRpY2FsfSksYyhnLmVsZW1lbnQsKGcuaXNWZXJ0aWNhbD9cInZlcnRpY2FsXCI6XCJob3Jpem9udGFsXCIpK1wicGFuc3RhcnRcIix7dG91Y2g6Zix0b3VjaEV2ZW50OmF9KSksXCJwYW5uaW5nXCI9PT1nLnN0YXR1cyYmKGcucGFuVGltZT1EYXRlLm5vdygpLGMoZy5lbGVtZW50LFwicGFubW92ZVwiLHtkaXNwbGFjZW1lbnRYOm4sZGlzcGxhY2VtZW50WTpvLHRvdWNoOmYsdG91Y2hlczphLnRvdWNoZXMsY2hhbmdlZFRvdWNoZXM6YS5jaGFuZ2VkVG91Y2hlcyx0b3VjaEV2ZW50OmEsaXNWZXJ0aWNhbDpnLmlzVmVydGljYWx9KSxnLmlzVmVydGljYWw/YyhnLmVsZW1lbnQsXCJ2ZXJ0aWNhbHBhbm1vdmVcIix7ZGlzcGxhY2VtZW50WTpvLHRvdWNoOmYsdG91Y2hFdmVudDphfSk6YyhnLmVsZW1lbnQsXCJob3Jpem9udGFscGFubW92ZVwiLHtkaXNwbGFjZW1lbnRYOm4sdG91Y2g6Zix0b3VjaEV2ZW50OmF9KSl9aWYoMj09T2JqZWN0LmtleXMobCkubGVuZ3RoKXtmb3IodmFyIHEscj1bXSxzPVtdLHQ9W10sZT0wO2U8YS50b3VjaGVzLmxlbmd0aDtlKyspe3ZhciBmPWEudG91Y2hlc1tlXSxnPWxbZi5pZGVudGlmaWVyXTtyLnB1c2goW2cuc3RhcnRUb3VjaC5jbGllbnRYLGcuc3RhcnRUb3VjaC5jbGllbnRZXSkscy5wdXNoKFtmLmNsaWVudFgsZi5jbGllbnRZXSl9Zm9yKHZhciBtIGluIGwpdC5wdXNoKGxbbV0uZWxlbWVudCk7cT1kKHJbMF1bMF0sclswXVsxXSxyWzFdWzBdLHJbMV1bMV0sc1swXVswXSxzWzBdWzFdLHNbMV1bMF0sc1sxXVsxXSksYyhiKHRbMF0sdFsxXSksXCJkdWFsdG91Y2hcIix7dHJhbnNmb3JtOnEsdG91Y2hlczphLnRvdWNoZXMsdG91Y2hFdmVudDphfSl9fWZ1bmN0aW9uIGcoYSl7aWYoMj09T2JqZWN0LmtleXMobCkubGVuZ3RoKXt2YXIgZD1bXTtmb3IodmFyIGUgaW4gbClkLnB1c2gobFtlXS5lbGVtZW50KTtjKGIoZFswXSxkWzFdKSxcImR1YWx0b3VjaGVuZFwiLHt0b3VjaGVzOmsuY2FsbChhLnRvdWNoZXMpLHRvdWNoRXZlbnQ6YX0pfWZvcih2YXIgaT0wO2k8YS5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7aSsrKXt2YXIgbj1hLmNoYW5nZWRUb3VjaGVzW2ldLG89bi5pZGVudGlmaWVyLHA9bFtvXTtpZihwKXtpZihwLnByZXNzaW5nSGFuZGxlciYmKGNsZWFyVGltZW91dChwLnByZXNzaW5nSGFuZGxlcikscC5wcmVzc2luZ0hhbmRsZXI9bnVsbCksXCJ0YXBwaW5nXCI9PT1wLnN0YXR1cyYmKHAudGltZXN0YW1wPURhdGUubm93KCksYyhwLmVsZW1lbnQsXCJ0YXBcIix7dG91Y2g6bix0b3VjaEV2ZW50OmF9KSxtJiZwLnRpbWVzdGFtcC1tLnRpbWVzdGFtcDwzMDAmJmMocC5lbGVtZW50LFwiZG91YmxldGFwXCIse3RvdWNoOm4sdG91Y2hFdmVudDphfSksbT1wKSxcInBhbm5pbmdcIj09PXAuc3RhdHVzKXt2YXIgcT1EYXRlLm5vdygpLHI9cS1wLnN0YXJ0VGltZSxzPSgobi5jbGllbnRYLXAuc3RhcnRUb3VjaC5jbGllbnRYKS9yLChuLmNsaWVudFktcC5zdGFydFRvdWNoLmNsaWVudFkpL3Isbi5jbGllbnRYLXAuc3RhcnRUb3VjaC5jbGllbnRYKSx0PW4uY2xpZW50WS1wLnN0YXJ0VG91Y2guY2xpZW50WSx1PU1hdGguc3FydChwLnZlbG9jaXR5WSpwLnZlbG9jaXR5WStwLnZlbG9jaXR5WCpwLnZlbG9jaXR5WCksdj11Pi41JiZxLXAubGFzdFRpbWU8MTAwLHc9e2R1cmF0aW9uOnIsaXNmbGljazp2LHZlbG9jaXR5WDpwLnZlbG9jaXR5WCx2ZWxvY2l0eVk6cC52ZWxvY2l0eVksZGlzcGxhY2VtZW50WDpzLGRpc3BsYWNlbWVudFk6dCx0b3VjaDpuLHRvdWNoZXM6YS50b3VjaGVzLGNoYW5nZWRUb3VjaGVzOmEuY2hhbmdlZFRvdWNoZXMsdG91Y2hFdmVudDphLGlzVmVydGljYWw6cC5pc1ZlcnRpY2FsfTtjKHAuZWxlbWVudCxcInBhbmVuZFwiLHcpLHYmJihjKHAuZWxlbWVudCxcInN3aXBlXCIsdykscC5pc1ZlcnRpY2FsP2MocC5lbGVtZW50LFwidmVydGljYWxzd2lwZVwiLHcpOmMocC5lbGVtZW50LFwiaG9yaXpvbnRhbHN3aXBlXCIsdykpfVwicHJlc3NpbmdcIj09PXAuc3RhdHVzJiZjKHAuZWxlbWVudCxcInByZXNzZW5kXCIse3RvdWNoOm4sdG91Y2hFdmVudDphfSksZGVsZXRlIGxbb119fTA9PT1PYmplY3Qua2V5cyhsKS5sZW5ndGgmJihqLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIixmLCExKSxqLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLGcsITEpLGoucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNoY2FuY2VsXCIsaCwhMSkpfWZ1bmN0aW9uIGgoYSl7aWYoMj09T2JqZWN0LmtleXMobCkubGVuZ3RoKXt2YXIgZD1bXTtmb3IodmFyIGUgaW4gbClkLnB1c2gobFtlXS5lbGVtZW50KTtjKGIoZFswXSxkWzFdKSxcImR1YWx0b3VjaGVuZFwiLHt0b3VjaGVzOmsuY2FsbChhLnRvdWNoZXMpLHRvdWNoRXZlbnQ6YX0pfWZvcih2YXIgaT0wO2k8YS5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7aSsrKXt2YXIgbT1hLmNoYW5nZWRUb3VjaGVzW2ldLG49bS5pZGVudGlmaWVyLG89bFtuXTtvJiYoby5wcmVzc2luZ0hhbmRsZXImJihjbGVhclRpbWVvdXQoby5wcmVzc2luZ0hhbmRsZXIpLG8ucHJlc3NpbmdIYW5kbGVyPW51bGwpLFwicGFubmluZ1wiPT09by5zdGF0dXMmJmMoby5lbGVtZW50LFwicGFuZW5kXCIse3RvdWNoOm0sdG91Y2hlczphLnRvdWNoZXMsY2hhbmdlZFRvdWNoZXM6YS5jaGFuZ2VkVG91Y2hlcyx0b3VjaEV2ZW50OmF9KSxcInByZXNzaW5nXCI9PT1vLnN0YXR1cyYmYyhvLmVsZW1lbnQsXCJwcmVzc2VuZFwiLHt0b3VjaDptLHRvdWNoRXZlbnQ6YX0pLGRlbGV0ZSBsW25dKX0wPT09T2JqZWN0LmtleXMobCkubGVuZ3RoJiYoai5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsZiwhMSksai5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIixnLCExKSxqLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaGNhbmNlbFwiLGgsITEpKX12YXIgaT1hLmRvY3VtZW50LGo9aS5kb2N1bWVudEVsZW1lbnQsaz1BcnJheS5wcm90b3R5cGUuc2xpY2UsbD17fSxtPW51bGw7ai5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLGUsITEpfSh3aW5kb3cpOzttb2R1bGUuZXhwb3J0cyA9IHdpbmRvdy5saWJbJ2dlc3R1cmVqcyddO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2NhcnJvdXNlbC9+L2dlc3R1cmVqcy9idWlsZC9nZXN0dXJlanMuY29tbW9uLmpzXG4gKiogbW9kdWxlIGlkID0gNTNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vc2xpZGVyLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9zbGlkZXIuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vc2xpZGVyLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9zdHlsZXMvc2xpZGVyLmNzc1xuICoqIG1vZHVsZSBpZCA9IDU0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5zbGlkZXIge1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbn1cXG5cXG4uc2xpZGVyIC5pbmRpY2F0b3ItY29udGFpbmVyIHtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIGRpc3BsYXk6IC13ZWJraXQtYm94O1xcbiAgZGlzcGxheTogLXdlYmtpdC1mbGV4O1xcbiAgZGlzcGxheTogZmxleDtcXG4gIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XFxuICBib3gtYWxpZ246IGNlbnRlcjtcXG4gIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcXG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XFxuICAtd2Via2l0LWJveC1wYWNrOiBjZW50ZXI7XFxuICBib3gtcGFjazogY2VudGVyO1xcbiAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xcbiAgZm9udC1zaXplOiAwO1xcbn1cXG4uc2xpZGVyIC5pbmRpY2F0b3ItY29udGFpbmVyIC5pbmRpY2F0b3Ige1xcbiAgYm9yZGVyLXJhZGl1czogNTAlO1xcbn1cXG4uc2xpZGVyIC5pbmRpY2F0b3ItY29udGFpbmVyLnJvdyB7XFxuICAtd2Via2l0LWJveC1vcmllbnQ6IGhvcml6b250YWw7XFxuICBib3gtb3JpZW50OiBob3Jpem9udGFsO1xcbiAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogcm93O1xcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcXG59XFxuLnNsaWRlciAuaW5kaWNhdG9yLWNvbnRhaW5lci5jb2x1bW4ge1xcbiAgLXdlYmtpdC1ib3gtb3JpZW50OiB2ZXJ0aWNhbDtcXG4gIGJveC1vcmllbnQ6IHZlcnRpY2FsO1xcbiAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL3NyYy9zdHlsZXMvc2xpZGVyLmNzc1xuICoqIG1vZHVsZSBpZCA9IDU1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4uL3V0aWxzJykuZXh0ZW5kXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJylcbnZhciBBdG9taWMgPSByZXF1aXJlKCcuL2F0b21pYycpXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9jb21wb25lbnQnKVxuXG5yZXF1aXJlKCcuLi9zdHlsZXMvaW5kaWNhdG9yLmNzcycpXG5cbnZhciBERUZBVUxUX0lURU1fQ09MT1IgPSAnIzk5OSdcbnZhciBERUZBVUxUX0lURU1fU0VMRUNURURfQ09MT1IgPSAnIzAwMDBmZidcbnZhciBERUZBVUxUX0lURU1fU0laRSA9IDIwXG52YXIgREVGQVVMVF9NQVJHSU5fU0laRSA9IDEwXG5cbi8vIFN0eWxlIHN1cHBvcnRlZDpcbi8vICAgcG9zaXRpb246IChkZWZhdWx0IC0gYWJzb2x1dGUpXG4vLyAgIGl0ZW1Db2xvcjogY29sb3Igb2YgaW5kaWNhdG9yIGRvdHNcbi8vICAgaXRlbVNlbGVjdGVkQ29sb3I6IGNvbG9yIG9mIHRoZSBzZWxlY3RlZCBpbmRpY2F0b3IgZG90XG4vLyAgIGl0ZW1TaXplOiBzaXplIG9mIGluZGljYXRvcnNcbi8vICAgb3RoZXIgbGF5b3V0IHN0eWxlc1xuZnVuY3Rpb24gSW5kaWNhdG9yIChkYXRhKSB7XG4gIHRoaXMuZGlyZWN0aW9uID0gJ3JvdycgLy8gJ2NvbHVtbicgaXMgbm90IHRlbXBvcmFyaWx5IHN1cHBvcnRlZC5cbiAgdGhpcy5hbW91bnQgPSBkYXRhLmV4dHJhLmFtb3VudFxuICB0aGlzLmluZGV4ID0gZGF0YS5leHRyYS5pbmRleFxuICB0aGlzLnNsaWRlcldpZHRoID0gZGF0YS5leHRyYS53aWR0aFxuICB0aGlzLnNsaWRlckhlaWdodCA9IGRhdGEuZXh0cmEuaGVpZ2h0XG4gIHZhciBzdHlsZXMgPSBkYXRhLnN0eWxlIHx8IHt9XG4gIHRoaXMuZGF0YSA9IGRhdGFcbiAgdGhpcy5zdHlsZS53aWR0aC5jYWxsKHRoaXMsIHN0eWxlcy53aWR0aClcbiAgdGhpcy5zdHlsZS5oZWlnaHQuY2FsbCh0aGlzLCBzdHlsZXMuaGVpZ2h0KVxuICB0aGlzLml0ZW1zID0gW11cbiAgQXRvbWljLmNhbGwodGhpcywgZGF0YSlcbn1cblxuSW5kaWNhdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQXRvbWljLnByb3RvdHlwZSlcblxuSW5kaWNhdG9yLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgbm9kZS5jbGFzc0xpc3QuYWRkKCd3ZWV4LWluZGljYXRvcnMnKVxuICBub2RlLmNsYXNzTGlzdC5hZGQoJ3dlZXgtZWxlbWVudCcpXG4gIG5vZGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gIHRoaXMubm9kZSA9IG5vZGVcbiAgdGhpcy5zdHlsZS5pdGVtU2l6ZS5jYWxsKHRoaXMsIDApXG4gIHRoaXMuaXRlbUNvbG9yID0gREVGQVVMVF9JVEVNX0NPTE9SXG4gIHRoaXMuaXRlbVNlbGVjdGVkQ29sb3IgPSBERUZBVUxUX0lURU1fU0VMRUNURURfQ09MT1JcbiAgdGhpcy51cGRhdGVTdHlsZSh7XG4gICAgbGVmdDogMCxcbiAgICB0b3A6IDAsXG4gICAgaXRlbVNpemU6IDBcbiAgfSlcbiAgcmV0dXJuIG5vZGVcbn1cblxuSW5kaWNhdG9yLnByb3RvdHlwZS5jcmVhdGVDaGlsZHJlbiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJvb3QgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFtb3VudDsgaSsrKSB7XG4gICAgdmFyIGluZGljYXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgaW5kaWNhdG9yLmNsYXNzTGlzdC5hZGQoJ3dlZXgtaW5kaWNhdG9yJylcbiAgICBpbmRpY2F0b3Iuc3R5bGUuYm94U2l6aW5nID0gJ2JvcmRlci1ib3gnXG4gICAgaW5kaWNhdG9yLnN0eWxlLm1hcmdpbiA9ICcwICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIChERUZBVUxUX01BUkdJTl9TSVpFICogdGhpcy5kYXRhLnNjYWxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ3B4J1xuICAgIGluZGljYXRvci5zdHlsZS53aWR0aCA9IHRoaXMuaXRlbVNpemUgKyAncHgnXG4gICAgaW5kaWNhdG9yLnN0eWxlLmhlaWdodCA9IHRoaXMuaXRlbVNpemUgKyAncHgnXG4gICAgaW5kaWNhdG9yLnNldEF0dHJpYnV0ZSgnaW5kZXgnLCBpKVxuICAgIGlmICh0aGlzLmluZGV4ID09PSBpKSB7XG4gICAgICBpbmRpY2F0b3Iuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5pdGVtU2VsZWN0ZWRDb2xvclxuICAgIH0gZWxzZSB7XG4gICAgICBpbmRpY2F0b3Iuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5pdGVtQ29sb3JcbiAgICB9XG4gICAgaW5kaWNhdG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fY2xpY2tIYW5kbGVyLmJpbmQodGhpcywgaSkpXG4gICAgdGhpcy5pdGVtc1tpXSA9IGluZGljYXRvclxuICAgIHJvb3QuYXBwZW5kQ2hpbGQoaW5kaWNhdG9yKVxuICB9XG4gIHRoaXMubm9kZS5hcHBlbmRDaGlsZChyb290KVxufVxuXG5JbmRpY2F0b3IucHJvdG90eXBlLnN0eWxlXG4gICAgPSBleHRlbmQoT2JqZWN0LmNyZWF0ZShBdG9taWMucHJvdG90eXBlLnN0eWxlKSwge1xuICBpdGVtQ29sb3I6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICB0aGlzLml0ZW1Db2xvciA9IHZhbCB8fCBERUZBVUxUX0lURU1fQ09MT1JcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuaXRlbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB0aGlzLml0ZW1zW2ldLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMuaXRlbUNvbG9yXG4gICAgfVxuICB9LFxuXG4gIGl0ZW1TZWxlY3RlZENvbG9yOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgdGhpcy5pdGVtU2VsZWN0ZWRDb2xvciA9IHZhbCB8fCBERUZBVUxUX0lURU1fU0VMRUNURURfQ09MT1JcbiAgICBpZiAodHlwZW9mIHRoaXMuaW5kZXggIT09ICd1bmRlZmluZWQnXG4gICAgICAgICYmIHRoaXMuaXRlbXMubGVuZ3RoID4gdGhpcy5pbmRleCkge1xuICAgICAgdGhpcy5pdGVtc1t0aGlzLmluZGV4XS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3JcbiAgICAgICAgICA9IHRoaXMuaXRlbVNlbGVjdGVkQ29sb3JcbiAgICB9XG4gIH0sXG5cbiAgaXRlbVNpemU6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICB2YWwgPSBwYXJzZUludCh2YWwpICogdGhpcy5kYXRhLnNjYWxlXG4gICAgICAgICAgfHwgREVGQVVMVF9JVEVNX1NJWkUgKiB0aGlzLmRhdGEuc2NhbGVcbiAgICB0aGlzLml0ZW1TaXplID0gdmFsXG4gICAgdGhpcy5ub2RlLnN0eWxlLmhlaWdodCA9IHZhbCArICdweCdcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuaXRlbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB0aGlzLml0ZW1zW2ldLnN0eWxlLndpZHRoID0gdmFsICsgJ3B4J1xuICAgICAgdGhpcy5pdGVtc1tpXS5zdHlsZS5oZWlnaHQgPSB2YWwgKyAncHgnXG4gICAgfVxuICB9LFxuXG4gIHdpZHRoOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgdmFsID0gcGFyc2VJbnQodmFsKSAqIHRoaXMuZGF0YS5zY2FsZSB8fCBwYXJzZUludCh0aGlzLnNsaWRlcldpZHRoKVxuICAgIHRoaXMudmlydHVhbFdyYXBwZXJXaWR0aCA9IHZhbFxuICB9LFxuXG4gIGhlaWdodDogZnVuY3Rpb24gKHZhbCkge1xuICAgIHZhbCA9IHBhcnNlSW50KHZhbCkgKiB0aGlzLmRhdGEuc2NhbGUgfHwgcGFyc2VJbnQodGhpcy5zbGlkZXJIZWlnaHQpXG4gICAgdGhpcy52aXJ0dWFsV3JhcHBlckhlaWdodCA9IHZhbFxuICB9LFxuXG4gIHRvcDogZnVuY3Rpb24gKHZhbCkge1xuICAgIHZhbCA9IHRoaXMudmlydHVhbFdyYXBwZXJIZWlnaHQgLyAyIC0gdGhpcy5pdGVtU2l6ZSAvIDJcbiAgICAgICAgKyB2YWwgKiB0aGlzLmRhdGEuc2NhbGVcbiAgICB0aGlzLm5vZGUuc3R5bGUuYm90dG9tID0gJydcbiAgICB0aGlzLm5vZGUuc3R5bGUudG9wID0gdmFsICsgJ3B4J1xuICB9LFxuXG4gIGJvdHRvbTogZnVuY3Rpb24gKHZhbCkge1xuICAgIHZhbCA9IHRoaXMudmlydHVhbFdyYXBwZXJIZWlnaHQgLyAyIC0gdGhpcy5pdGVtU2l6ZSAvIDJcbiAgICAgICAgKyB2YWwgKiB0aGlzLmRhdGEuc2NhbGVcbiAgICB0aGlzLm5vZGUuc3R5bGUudG9wID0gJydcbiAgICB0aGlzLm5vZGUuc3R5bGUuYm90dG9tID0gdmFsICsgJ3B4J1xuICB9LFxuXG4gIGxlZnQ6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICB2YWwgPSB0aGlzLnZpcnR1YWxXcmFwcGVyV2lkdGggLyAyXG4gICAgICAgICAgLSAodGhpcy5pdGVtU2l6ZSArIDIgKiBERUZBVUxUX01BUkdJTl9TSVpFICogdGhpcy5kYXRhLnNjYWxlKVxuICAgICAgICAgICAgICAqIHRoaXMuYW1vdW50IC8gMlxuICAgICAgICAgICsgdmFsICogdGhpcy5kYXRhLnNjYWxlXG4gICAgdGhpcy5ub2RlLnN0eWxlLnJpZ2h0ID0gJydcbiAgICB0aGlzLm5vZGUuc3R5bGUubGVmdCA9IHZhbCArICdweCdcbiAgfSxcblxuICByaWdodDogZnVuY3Rpb24gKHZhbCkge1xuICAgIHZhbCA9IHRoaXMudmlydHVhbFdyYXBwZXJXaWR0aCAvIDJcbiAgICAgICAgICAtICh0aGlzLml0ZW1TaXplICsgMiAqIERFRkFVTFRfTUFSR0lOX1NJWkUgKiB0aGlzLmRhdGEuc2NhbGUpXG4gICAgICAgICAgICAgICogdGhpcy5hbW91bnQgLyAyXG4gICAgICAgICAgKyB2YWwgKiB0aGlzLmRhdGEuc2NhbGVcbiAgICB0aGlzLm5vZGUuc3R5bGUubGVmdCA9ICcnXG4gICAgdGhpcy5ub2RlLnN0eWxlLnJpZ2h0ID0gdmFsICsgJ3B4J1xuICB9XG59KVxuXG5JbmRpY2F0b3IucHJvdG90eXBlLnNldEluZGV4ID0gZnVuY3Rpb24gKGlkeCkge1xuICBpZiAoaWR4ID49IHRoaXMuYW1vdW50KSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIHByZXYgPSB0aGlzLml0ZW1zW3RoaXMuaW5kZXhdXG4gIHZhciBjdXIgPSB0aGlzLml0ZW1zW2lkeF1cbiAgcHJldi5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKVxuICBwcmV2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMuaXRlbUNvbG9yXG4gIGN1ci5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKVxuICBjdXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5pdGVtU2VsZWN0ZWRDb2xvclxuICB0aGlzLmluZGV4ID0gaWR4XG59XG5cbkluZGljYXRvci5wcm90b3R5cGUuX2NsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChpZHgpIHtcbiAgdGhpcy5zbGlkZXIuc2xpZGVUbyhpZHgpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gSW5kaWNhdG9yXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvaW5kaWNhdG9yLmpzXG4gKiogbW9kdWxlIGlkID0gNTZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vaW5kaWNhdG9yLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9pbmRpY2F0b3IuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vaW5kaWNhdG9yLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9zdHlsZXMvaW5kaWNhdG9yLmNzc1xuICoqIG1vZHVsZSBpZCA9IDU3XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi53ZWV4LWluZGljYXRvcnMge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcXG59XFxuLndlZXgtaW5kaWNhdG9ycyAud2VleC1pbmRpY2F0b3Ige1xcbiAgZmxvYXQ6IGxlZnQ7XFxuICBib3JkZXItcmFkaXVzOiA1MCU7XFxufVxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9zcmMvc3R5bGVzL2luZGljYXRvci5jc3NcbiAqKiBtb2R1bGUgaWQgPSA1OFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBBdG9taWMgPSByZXF1aXJlKCcuL2F0b21pYycpXG52YXIgbXNnUXVldWUgPSByZXF1aXJlKCcuLi9tZXNzYWdlUXVldWUnKVxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpXG5cbi8vIFRPRE86IHJlZmFjdG9yIHRoaXMgc2NzcyBjb2RlIHNpbmNlIHRoaXMgaXMgc3Ryb25nbHlcbi8vIGRlcGVuZGVudCBvbiBsaWIuZmxleGlibGUgb3RoZXIgdGhhbiB0aGUgdmFsdWUgb2Zcbi8vIHNjYWxlLlxucmVxdWlyZSgnLi4vc3R5bGVzL3RhYmhlYWRlci5jc3MnKVxuXG5mdW5jdGlvbiBUYWJIZWFkZXIoZGF0YSkge1xuICBBdG9taWMuY2FsbCh0aGlzLCBkYXRhKVxufVxuXG52YXIgcHJvdG8gPSBUYWJIZWFkZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBdG9taWMucHJvdG90eXBlKVxuXG5wcm90by5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIG91dHNpZGUgY29udGFpbmVyLlxuICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIG5vZGUuY2xhc3NOYW1lID0gJ3RhYi1oZWFkZXInXG4gIC8vIHRpcCBvbiB0aGUgdG9wLlxuICB2YXIgYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgYmFyLmNsYXNzTmFtZSA9ICdoZWFkZXItYmFyJ1xuICBiYXIudGV4dENvbnRlbnQgPSAnQ0hBTkdFIEZMT09SJ1xuICAvLyBtaWRkbGUgbGF5ZXIuXG4gIHZhciBib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgYm9keS5jbGFzc05hbWUgPSAnaGVhZGVyLWJvZHknXG4gIHZhciBib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpXG4gIGJveC5jbGFzc05hbWUgPSAndGFiaGVhZGVyJ1xuXG4gIGJvZHkuYXBwZW5kQ2hpbGQoYm94KVxuICBub2RlLmFwcGVuZENoaWxkKGJhcilcbiAgbm9kZS5hcHBlbmRDaGlsZChib2R5KVxuICB0aGlzLl9iYXIgPSBiYXJcbiAgdGhpcy5fYm9keSA9IGJvZHlcbiAgdGhpcy5ib3ggPSBib3hcbiAgdGhpcy5ub2RlID0gbm9kZVxuICAvLyBpbml0IGV2ZW50cy5cbiAgdGhpcy5faW5pdEZvbGRCdG4oKVxuICB0aGlzLl9pbml0RXZlbnQoKVxuICByZXR1cm4gbm9kZVxufVxuXG5wcm90by5faW5pdEZvbGRCdG4gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBfdGhpcyA9IHRoaXNcbiAgdmFyIG5vZGUgPSB0aGlzLm5vZGVcbiAgdmFyIGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxuICBidG4uY2xhc3NOYW1lID0gJ2ZvbGQtdG9nZ2xlIGljb25mb250J1xuICBidG4uaW5uZXJIVE1MID0gJyYjeGU2NjE7J1xuICBub2RlLmFwcGVuZENoaWxkKGJ0bilcblxuICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKF90aGlzLnVuZm9sZGluZykge1xuICAgICAgX3RoaXMuX2ZvbGRpbmcoKVxuICAgIH0gZWxzZSB7XG4gICAgICBfdGhpcy5fdW5mb2xkaW5nKClcbiAgICB9XG4gIH0pXG59XG5cbnByb3RvLl9pbml0TWFzayA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1hc2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBtYXNrLmNsYXNzTmFtZSA9ICd0YWJoZWFkZXItbWFzaydcbiAgdGhpcy5tYXNrID0gbWFza1xuICAvLyBzdG9wIGRlZmF1bHQgYmVoYXZpb3I6IHBhZ2UgbW92aW5nLlxuICBtYXNrLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGZ1bmN0aW9uIChldnQpIHtcbiAgICBldnQucHJldmVudERlZmF1bHQoKVxuICB9KVxuICAvLyBjbGljayB0byB1bmZvbGQuXG4gIHZhciBfdGhpcyA9IHRoaXNcbiAgbWFzay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICBfdGhpcy5fZm9sZGluZygpXG4gIH0pXG5cbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtYXNrKVxufVxuXG5wcm90by5fdW5mb2xkaW5nID0gZnVuY3Rpb24gKCkge1xuICAvLyBtYXJrIHRoZSBpbml0aWFsIHBvc2lpdG9uIG9mIHRhYmhlYWRlclxuICBpZiAoIXRoaXMuZmxhZykge1xuICAgIHZhciBmbGFnID0gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgndGFiaGVhZGVyJylcbiAgICB0aGlzLmZsYWcgPSBmbGFnXG4gICAgdGhpcy5ub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGZsYWcsIHRoaXMubm9kZSlcbiAgfVxuICBpZiAoIXRoaXMubWFzaykge1xuICAgIHRoaXMuX2luaXRNYXNrKClcbiAgfVxuXG4gIC8vIHJlY29yZCB0aGUgc2Nyb2xsIHBvc2l0aW9uLlxuICB0aGlzLl9zY3JvbGxWYWwgPSB0aGlzLl9ib2R5LnNjcm9sbExlZnRcbiAgLy8gcmVjb3JkIHRoZSBwb3NpdGlvbiBpbiBkb2N1bWVudC5cbiAgdGhpcy5fdG9wVmFsID0gdGhpcy5ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICB0aGlzLl9zdHlsZVRvcCA9IHRoaXMubm9kZS5zdHlsZS50b3BcblxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMubm9kZSlcbiAgdGhpcy5ub2RlLmNsYXNzTGlzdC5hZGQoJ3VuZm9sZC1oZWFkZXInKVxuICB0aGlzLm5vZGUuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXG4gIC8vIHJlY2FsYyB0aGUgcG9zaXRpb24gd2hlbiBpdCBpcyB1bmZvbGRlZC5cbiAgdmFyIHRoSGVpZ2h0ID0gdGhpcy5ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodFxuICBpZiAodGhIZWlnaHQgKyB0aGlzLl90b3BWYWwgPiB3aW5kb3cuaW5uZXJIZWlnaHQpIHtcbiAgICB0aGlzLl90b3BWYWwgPSB0aGlzLl90b3BWYWxcbiAgICAgICAgKyAod2luZG93LmlubmVySGVpZ2h0IC0gdGhIZWlnaHQgLSB0aGlzLl90b3BWYWwpXG4gIH1cblxuICB0aGlzLm5vZGUuc3R5bGUudG9wID0gdGhpcy5fdG9wVmFsICsgJ3B4J1xuICAvLyBwcm9jZXNzIG1hc2sgc3R5bGVcbiAgdGhpcy5tYXNrLmNsYXNzTGlzdC5hZGQoJ3VuZm9sZC1oZWFkZXInKVxuICB0aGlzLm1hc2suc3R5bGUuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ICsgJ3B4J1xuICB0aGlzLnVuZm9sZGluZyA9IHRydWVcbn1cblxucHJvdG8uX2ZvbGRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLnVuZm9sZGluZyAhPT0gdHJ1ZSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgdGhpcy5tYXNrLmNsYXNzTGlzdC5yZW1vdmUoJ3VuZm9sZC1oZWFkZXInKVxuICB0aGlzLm5vZGUuY2xhc3NMaXN0LnJlbW92ZSgndW5mb2xkLWhlYWRlcicpXG5cbiAgdGhpcy5ub2RlLnN0eWxlLmhlaWdodCA9ICcnXG4gIHRoaXMubm9kZS5zdHlsZS50b3AgPSB0aGlzLl9zdHlsZVRvcFxuXG4gIC8vIHJlY292ZXIgdGhlIHBvc2l0aW9uIG9mIHRhYmhlYWRlci5cbiAgdGhpcy5mbGFnLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRoaXMubm9kZSwgdGhpcy5mbGFnKVxuICAvLyByZWNvdmVyIHRoZSBwb3NpdGlvbiBvZiBzY29sbGVyLlxuICB0aGlzLl9ib2R5LnNjcm9sbExlZnQgPSB0aGlzLl9zY3JvbGxWYWxcblxuICB0aGlzLl9zY3JvbGxUb1ZpZXcoKVxuICB0aGlzLnVuZm9sZGluZyA9IGZhbHNlXG59XG5cbnByb3RvLl9pbml0RXZlbnQgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuX2luaXRDbGlja0V2ZW50KClcbiAgdGhpcy5faW5pdFNlbGVjdEV2ZW50KClcbn1cblxuLy8gaW5pdCBldmVudHMuXG5wcm90by5faW5pdENsaWNrRXZlbnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBib3ggPSB0aGlzLmJveFxuICB2YXIgX3RoaXMgPSB0aGlzXG5cbiAgYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciB0YXJnZXQgPSBldnQudGFyZ2V0XG4gICAgaWYgKHRhcmdldC5ub2RlTmFtZSA9PT0gJ1VMJykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKHRhcmdldC5wYXJlbnROb2RlLm5vZGVOYW1lID09PSAnTEknKSB7XG4gICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZVxuICAgIH1cblxuICAgIHZhciBmbG9vciA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtZmxvb3InKVxuXG4gICAgaWYgKF90aGlzLmRhdGEuYXR0ci5zZWxlY3RlZEluZGV4ID09IGZsb29yKSB7XG4gICAgICAvLyBEdXBsaWNhdGVkIGNsaWNraW5nLCBub3QgdG8gdHJpZ2dlciBzZWxlY3QgZXZlbnQuXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBmaXJlRXZlbnQodGFyZ2V0LCAnc2VsZWN0Jywge2luZGV4OiAgZmxvb3J9KVxuICB9KVxufVxuXG5wcm90by5faW5pdFNlbGVjdEV2ZW50ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbm9kZSA9IHRoaXMubm9kZVxuICB2YXIgX3RoaXMgPSB0aGlzXG4gIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignc2VsZWN0JywgZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciBpbmRleFxuICAgIGlmIChldnQuaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgaW5kZXggPSBldnQuaW5kZXhcbiAgICB9IGVsc2UgaWYgKGV2dC5kYXRhICYmIGV2dC5kYXRhLmluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGluZGV4ID0gZXZ0LmRhdGEuaW5kZXhcbiAgICB9XG5cbiAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgX3RoaXMuYXR0ci5zZWxlY3RlZEluZGV4LmNhbGwoX3RoaXMsIGluZGV4KVxuICB9KVxufVxuXG5wcm90by5hdHRyID0ge1xuICBoaWdobGlnaHRJY29uOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUhpZ2hsaWdodEljb24oKVxuICB9LFxuICBkYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGF0dHIgPSB0aGlzLmRhdGEuYXR0clxuICAgIC8vIEVuc3VyZSB0aGVyZSBpcyBhIGRlZmF1bHQgc2VsZWN0ZWQgdmFsdWUuXG4gICAgaWYgKGF0dHIuc2VsZWN0ZWRJbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhdHRyLnNlbGVjdGVkSW5kZXggPSAwXG4gICAgfVxuXG4gICAgdmFyIGxpc3QgPSBhdHRyLmRhdGEgfHwgW11cbiAgICB2YXIgY3VySXRlbSA9IGF0dHIuc2VsZWN0ZWRJbmRleFxuXG4gICAgdmFyIHJldCA9IFtdXG4gICAgdmFyIGl0ZW1UbXBsID0gJzxsaSBjbGFzcz1cInRoLWl0ZW1cIiBkYXRhLWZsb29yPVwie3tmbG9vcn19XCI+J1xuICAgICAgICArICd7e2hsSWNvbn19e3tmbG9vck5hbWV9fTwvbGk+J1xuXG4gICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtLCBpZHgpIHtcbiAgICAgIHZhciBodG1sID0gaXRlbVRtcGwucmVwbGFjZSgne3tmbG9vcn19JywgaWR4KVxuICAgICAgaWYgKGN1ckl0ZW0gPT0gaWR4KSB7XG4gICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoJ3t7aGxJY29ufX0nLCBjcmVhdGVIaWdobGlnaHRJY29uKCkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKCd7e2hsSWNvbn19JywgJycpXG4gICAgICB9XG5cbiAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoJ3t7Zmxvb3JOYW1lfX0nLCBpdGVtKVxuXG4gICAgICByZXQucHVzaChodG1sKVxuICAgIH0sIHRoaXMpXG5cbiAgICB0aGlzLmJveC5pbm5lckhUTUwgPSByZXQuam9pbignJylcbiAgfSxcbiAgc2VsZWN0ZWRJbmRleDogZnVuY3Rpb24gKHZhbCkge1xuICAgIHZhciBhdHRyID0gdGhpcy5kYXRhLmF0dHJcblxuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdmFsID0gMFxuICAgIH1cblxuICAgIC8vIGlmICh2YWwgPT0gYXR0ci5zZWxlY3RlZEluZGV4KSB7XG4gICAgLy8gICByZXR1cm5cbiAgICAvLyB9XG5cbiAgICBhdHRyLnNlbGVjdGVkSW5kZXggPSB2YWxcblxuICAgIHRoaXMuYXR0ci5kYXRhLmNhbGwodGhpcylcblxuICAgIHRoaXMuX2ZvbGRpbmcoKVxuICAgIHRoaXMuc3R5bGUudGV4dEhpZ2hsaWdodENvbG9yLmNhbGwodGhpcywgdGhpcy50ZXh0SGlnaGxpZ2h0Q29sb3IpXG4gIH1cbn1cblxucHJvdG8uc3R5bGUgPSBPYmplY3QuY3JlYXRlKEF0b21pYy5wcm90b3R5cGUuc3R5bGUpXG5cbnByb3RvLnN0eWxlLm9wYWNpdHkgPSBmdW5jdGlvbiAodmFsKSB7XG4gIGlmICh2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPCAwIHx8IHZhbCA+IDEpIHtcbiAgICB2YWwgPSAxXG4gIH1cblxuICB0aGlzLm5vZGUuc3R5bGUub3BhY2l0eSA9IHZhbFxufVxuXG5wcm90by5zdHlsZS50ZXh0Q29sb3IgPSBmdW5jdGlvbiAodmFsKSB7XG4gIGlmICghaXNWYWxpZENvbG9yKHZhbCkpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHRoaXMubm9kZS5zdHlsZS5jb2xvciA9IHZhbFxufVxuXG5wcm90by5zdHlsZS50ZXh0SGlnaGxpZ2h0Q29sb3IgPSBmdW5jdGlvbiAodmFsKSB7XG4gIGlmICghaXNWYWxpZENvbG9yKHZhbCkpIHtcbiAgICByZXR1cm5cbiAgfVxuICB0aGlzLnRleHRIaWdobGlnaHRDb2xvciA9IHZhbFxuICB2YXIgYXR0ciA9IHRoaXMuZGF0YS5hdHRyXG5cbiAgdmFyIG5vZGUgPSB0aGlzLm5vZGUucXVlcnlTZWxlY3RvcignW2RhdGEtZmxvb3I9XCInXG4gICAgICArIGF0dHIuc2VsZWN0ZWRJbmRleCArICdcIl0nKVxuICBpZiAobm9kZSkge1xuICAgIG5vZGUuc3R5bGUuY29sb3IgPSB2YWxcbiAgICB0aGlzLl9zY3JvbGxUb1ZpZXcobm9kZSlcbiAgfVxufVxuXG5wcm90by5fc2Nyb2xsVG9WaWV3ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaWYgKCFub2RlKSB7XG4gICAgdmFyIGF0dHIgPSB0aGlzLmRhdGEuYXR0clxuICAgIG5vZGUgPSB0aGlzLm5vZGUucXVlcnlTZWxlY3RvcignW2RhdGEtZmxvb3I9XCInICsgYXR0ci5zZWxlY3RlZEluZGV4ICsgJ1wiXScpXG4gIH1cbiAgaWYgKCFub2RlKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB2YXIgZGVmYXVsdFZhbCA9IHRoaXMuX2JvZHkuc2Nyb2xsTGVmdFxuICB2YXIgbGVmdFZhbCA9IGRlZmF1bHRWYWwgIC0gbm9kZS5vZmZzZXRMZWZ0ICsgMzAwXG5cbiAgdmFyIHNjcm9sbFZhbCA9IGdldFNjcm9sbFZhbCh0aGlzLl9ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBub2RlKVxuICBkb1Njcm9sbCh0aGlzLl9ib2R5LCBzY3JvbGxWYWwpXG59XG5cbi8vIHNjcm9sbCB0aGUgdGFiaGVhZGVyLlxuLy8gcG9zaXRpdmUgdmFsIG1lYW5zIHRvIHNjcm9sbCByaWdodC5cbi8vIG5lZ2F0aXZlIHZhbCBtZWFucyB0byBzY3JvbGwgbGVmdC5cbmZ1bmN0aW9uIGRvU2Nyb2xsKG5vZGUsIHZhbCwgZmluaXNoKSB7XG4gIGlmICghdmFsKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKGZpbmlzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZmluaXNoID0gTWF0aC5hYnModmFsKVxuICB9XG5cbiAgaWYgKGZpbmlzaCA8PSAwKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodmFsID4gMCkge1xuICAgICAgbm9kZS5zY3JvbGxMZWZ0ICs9IDJcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5zY3JvbGxMZWZ0IC09IDJcbiAgICB9XG4gICAgZmluaXNoIC09IDJcblxuICAgIGRvU2Nyb2xsKG5vZGUsIHZhbCwgZmluaXNoKVxuICB9KVxufVxuXG4vLyBnZXQgc2Nyb2xsIGRpc3RhbmNlLlxuZnVuY3Rpb24gZ2V0U2Nyb2xsVmFsKHJlY3QsIG5vZGUpIHtcbiAgdmFyIGxlZnQgPSBub2RlLnByZXZpb3VzU2libGluZ1xuICB2YXIgcmlnaHQgPSBub2RlLm5leHRTaWJsaW5nXG4gIHZhciBzY3JvbGxWYWxcblxuICAvLyBwcm9jZXNzIGxlZnQtc2lkZSBlbGVtZW50IGZpcnN0LlxuICBpZiAobGVmdCkge1xuICAgIHZhciBsZWZ0UmVjdCA9IGxlZnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAvLyBvbmx5IG5lZWQgdG8gY29tcGFyZSB0aGUgdmFsdWUgb2YgbGVmdC5cbiAgICBpZiAobGVmdFJlY3QubGVmdCA8IHJlY3QubGVmdCkge1xuICAgICAgc2Nyb2xsVmFsID0gbGVmdFJlY3QubGVmdFxuICAgICAgcmV0dXJuIHNjcm9sbFZhbFxuICAgIH1cbiAgfVxuXG4gIGlmIChyaWdodCkge1xuICAgIHZhciByaWdodFJlY3QgPSByaWdodC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIC8vIGNvbXBhcmUgdGhlIHZhbHVlIG9mIHJpZ2h0LlxuICAgIGlmIChyaWdodFJlY3QucmlnaHQgPiByZWN0LnJpZ2h0KSB7XG4gICAgICBzY3JvbGxWYWwgPSByaWdodFJlY3QucmlnaHQgLSByZWN0LnJpZ2h0XG4gICAgICByZXR1cm4gc2Nyb2xsVmFsXG4gICAgfVxuICB9XG5cbiAgLy8gcHJvY2VzcyBjdXJyZW50IG5vZGUsIGZyb20gbGVmdCB0byByaWdodC5cbiAgdmFyIG5vZGVSZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICBpZiAobm9kZVJlY3QubGVmdCA8IHJlY3QubGVmdCkge1xuICAgIHNjcm9sbFZhbCA9IG5vZGVSZWN0LmxlZnRcbiAgfSBlbHNlIGlmIChub2RlUmVjdC5yaWdodCA+IHJlY3QucmlnaHQpIHtcbiAgICBzY3JvbGxWYWwgPSBub2RlUmVjdC5yaWdodCAtIHJlY3QucmlnaHRcbiAgfVxuXG4gIHJldHVybiBzY3JvbGxWYWxcbn1cblxuLy8gdHJpZ2dlciBhbmQgYnJvYWRjYXN0IGV2ZW50cy5cbmZ1bmN0aW9uIGZpcmVFdmVudChlbGVtZW50LCB0eXBlLCBkYXRhKSB7XG4gIHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKVxuICBldnQuZGF0YSA9IGRhdGFcbiAgdXRpbHMuZXh0ZW5kKGV2dCwgZGF0YSlcbiAgLy8gbmVlZCBidWJibGUuXG4gIGV2dC5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSlcblxuICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZ0KVxufVxuXG5mdW5jdGlvbiBjcmVhdGVIaWdobGlnaHRJY29uKGNvZGUpIHtcbiAgdmFyIGh0bWwgPSAnPGkgY2xhc3M9XCJobC1pY29uIGljb25mb250XCI+JyArICcmI3hlNjUwJyArICc8L2k+J1xuICByZXR1cm4gaHRtbFxufVxuXG5mdW5jdGlvbiBpc1ZhbGlkQ29sb3IoY29sb3IpIHtcbiAgaWYgKCFjb2xvcikge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgaWYgKGNvbG9yLmNoYXJBdCgwKSAhPT0gJyMnKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBpZiAoY29sb3IubGVuZ3RoICE9PSA3KSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICByZXR1cm4gdHJ1ZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRhYkhlYWRlclxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9jb21wb25lbnRzL3RhYmhlYWRlci5qc1xuICoqIG1vZHVsZSBpZCA9IDU5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJylcbnZhciBtZXNzYWdlUXVldWUgPSBbXVxuXG5mdW5jdGlvbiBmbHVzaE1lc3NhZ2UoKSB7XG4gIGlmICh0eXBlb2YgY2FsbEpTID09PSAnZnVuY3Rpb24nICYmIG1lc3NhZ2VRdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgY2FsbEpTKGNvbmZpZy5pbnN0YW5jZUlkLCBKU09OLnN0cmluZ2lmeShtZXNzYWdlUXVldWUpKVxuICAgIG1lc3NhZ2VRdWV1ZS5sZW5ndGggPSAwXG4gIH1cbn1cblxuZnVuY3Rpb24gcHVzaChtc2cpIHtcbiAgbWVzc2FnZVF1ZXVlLnB1c2gobXNnKVxufVxuXG4vKipcbiAqIFRvIGZpeCB0aGUgcHJvYmxlbSBvZiBjYWxsYXBwLCB0aGUgdHdvLXdheSB0aW1lIGxvb3AgbWVjaGFuaXNtIG11c3RcbiAqIGJlIHJlcGxhY2VkIGJ5IGRpcmVjdGx5IHByb2NlZHVyZSBjYWxsIGV4Y2VwdCB0aGUgc2l0dWF0aW9uIG9mXG4gKiBwYWdlIGxvYWRpbmcuXG4gKiAyMDE1LTExLTAzXG4gKi9cbmZ1bmN0aW9uIHB1c2hEaXJlY3RseShtc2cpIHtcbiAgY2FsbEpTKGNvbmZpZy5pbnN0YW5jZUlkLCBbbXNnXSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHB1c2g6IHB1c2hEaXJlY3RseVxufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9tZXNzYWdlUXVldWUuanNcbiAqKiBtb2R1bGUgaWQgPSA2MFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi90YWJoZWFkZXIuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL3RhYmhlYWRlci5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi90YWJoZWFkZXIuY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3N0eWxlcy90YWJoZWFkZXIuY3NzXG4gKiogbW9kdWxlIGlkID0gNjFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLnRhYi1oZWFkZXIge1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbiAgd2lkdGg6IDEwcmVtO1xcbiAgZm9udC1zaXplOiAxNHB4O1xcbiAgY29sb3I6ICMzMzM7XFxufVxcbi50YWItaGVhZGVyIC5oZWFkZXItYmFyIHtcXG4gIGhlaWdodDogMS4xN3JlbTtcXG4gIGxpbmUtaGVpZ2h0OiAxLjE3cmVtO1xcbiAgZGlzcGxheTogbm9uZTtcXG4gIGNvbG9yOiAjOTk5O1xcbiAgcGFkZGluZy1sZWZ0OiAwLjRyZW07XFxufVxcbi50YWItaGVhZGVyIC5oZWFkZXItYm9keSB7XFxuICBtYXJnaW4tcmlnaHQ6IDEuMDdyZW07XFxuICBvdmVyZmxvdy14OiBhdXRvO1xcbiAgb3ZlcmZsb3cteTogaGlkZGVuO1xcbn1cXG4udGFiLWhlYWRlciAuaGVhZGVyLWJvZHk6Oi13ZWJraXQtc2Nyb2xsYmFyIHtcXG4gIHdpZHRoOiAwO1xcbiAgaGVpZ2h0OiAwO1xcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcXG59XFxuLnRhYi1oZWFkZXIgLmZvbGQtdG9nZ2xlIHtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIHRvcDogMC41OXJlbTtcXG4gIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpO1xcbiAgcmlnaHQ6IDAuMjlyZW07XFxuICB3aWR0aDogMC40OHJlbTtcXG4gIGhlaWdodDogMC40OHJlbTtcXG4gIGxpbmUtaGVpZ2h0OiAwLjQ4cmVtO1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbiAgei1pbmRleDogOTk7XFxuICBmb250LXNpemU6IDE0cHg7XFxufVxcbi50YWItaGVhZGVyLnVuZm9sZC1oZWFkZXIge1xcbiAgcG9zaXRpb246IGZpeGVkICFpbXBvcnRhbnQ7XFxuICB0b3A6IDA7XFxuICBsZWZ0OiAwO1xcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcXG59XFxuXFxuLnRhYmhlYWRlciB7XFxuICBsaXN0LXN0eWxlOiBub25lO1xcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcXG4gIGhlaWdodDogMS4xN3JlbTtcXG4gIGxpbmUtaGVpZ2h0OiAxLjE3cmVtO1xcbn1cXG4udGFiaGVhZGVyIC50aC1pdGVtIHtcXG4gIHBhZGRpbmctbGVmdDogMC43MnJlbTtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG59XFxuLnRhYmhlYWRlciAuaGwtaWNvbiB7XFxuICB3aWR0aDogMC40cmVtO1xcbiAgaGVpZ2h0OiAwLjRyZW07XFxuICBsaW5lLWhlaWdodDogMC40cmVtO1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgdG9wOiA1MCU7XFxuICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKTtcXG4gIGxlZnQ6IDAuMjRyZW07XFxuICBmb250LXNpemU6IDE0cHg7XFxufVxcblxcbi51bmZvbGQtaGVhZGVyIC5oZWFkZXItYmFyIHtcXG4gIGRpc3BsYXk6IGJsb2NrO1xcbn1cXG4udW5mb2xkLWhlYWRlciAuZm9sZC10b2dnbGUge1xcbiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSkgcm90YXRlKDE4MGRlZyk7XFxufVxcbi51bmZvbGQtaGVhZGVyIC5oZWFkZXItYm9keSB7XFxuICBtYXJnaW4tcmlnaHQ6IDA7XFxuICBwYWRkaW5nOiAwLjI0cmVtO1xcbn1cXG4udW5mb2xkLWhlYWRlciAudGFiaGVhZGVyIHtcXG4gIGRpc3BsYXk6IGJsb2NrO1xcbiAgaGVpZ2h0OiBhdXRvO1xcbn1cXG4udW5mb2xkLWhlYWRlciAudGgtaXRlbSB7XFxuICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgZmxvYXQ6IGxlZnQ7XFxuICB3aWR0aDogMzMuMzMzMyU7XFxuICBoZWlnaHQ6IDEuMDFyZW07XFxuICBsaW5lLWhlaWdodDogMS4wMXJlbTtcXG59XFxuLnVuZm9sZC1oZWFkZXIgLmhsLWljb24ge1xcbiAgbWFyZ2luLXJpZ2h0OiAwO1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbn1cXG4udW5mb2xkLWhlYWRlci50YWJoZWFkZXItbWFzayB7XFxuICBkaXNwbGF5OiBibG9jaztcXG4gIHdpZHRoOiAxMDAlO1xcbiAgaGVpZ2h0OiAxMDAlO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjYpO1xcbn1cXG5cXG4udGFiaGVhZGVyLW1hc2sge1xcbiAgZGlzcGxheTogbm9uZTtcXG4gIHBvc2l0aW9uOiBmaXhlZDtcXG4gIGxlZnQ6IDA7XFxuICB0b3A6IDA7XFxufVxcblxcbkBmb250LWZhY2Uge1xcbiAgZm9udC1mYW1pbHk6IFxcXCJpY29uZm9udFxcXCI7XFxuICBzcmM6IHVybChcXFwiZGF0YTphcHBsaWNhdGlvbi94LWZvbnQtdHRmO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LEFBRUFBQUFQQUlBQUF3QndSa1pVVFhCRDk4VUFBQUQ4QUFBQUhFOVRMekpYTDF6SUFBQUJHQUFBQUdCamJXRndzNklIYmdBQUFYZ0FBQUZhWTNaMElBeVYvc3dBQUFwUUFBQUFKR1p3WjIwdzk1NlZBQUFLZEFBQUNaWm5ZWE53QUFBQUVBQUFDa2dBQUFBSVoyeDVadXhvUEZJQUFBTFVBQUFFV0dobFlXUUhBNWgzQUFBSExBQUFBRFpvYUdWaEJ6SURjZ0FBQjJRQUFBQWthRzEwZUFzMkFXMEFBQWVJQUFBQUdHeHZZMkVEY0FRZUFBQUhvQUFBQUJCdFlYaHdBU2tLS3dBQUI3QUFBQUFnYm1GdFpRbC8zaGdBQUFmUUFBQUNMbkJ2YzNUbTdmMGJBQUFLQUFBQUFFaHdjbVZ3cGJtK1pnQUFGQXdBQUFDVkFBQUFBUUFBQUFETVBhTFBBQUFBQU5JREtub0FBQUFBMGdNcWV3QUVBL29COUFBRkFBQUNtUUxNQUFBQWp3S1pBc3dBQUFIckFETUJDUUFBQWdBR0F3QUFBQUFBQUFBQUFBRVFBQUFBQUFBQUFBQUFBQUJRWmtWa0FNQUFlT2JlQXl6L0xBQmNBeGdBbEFBQUFBRUFBQUFBQXhnQUFBQUFBQ0FBQVFBQUFBTUFBQUFEQUFBQUhBQUJBQUFBQUFCVUFBTUFBUUFBQUJ3QUJBQTRBQUFBQ2dBSUFBSUFBZ0I0NWxEbVllYmUvLzhBQUFCNDVsRG1ZZWJlLy8vL2l4bTBHYVFaS0FBQkFBQUFBQUFBQUFBQUFBQUFBUVlBQUFFQUFBQUFBQUFBQVFJQUFBQUNBQUFBQUFBQUFBQUFBQUFBQUFBQUFRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBTUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFDQUNJQUFBRXlBcW9BQXdBSEFDbEFKZ0FBQUFNQ0FBTlhBQUlCQVFKTEFBSUNBVThFQVFFQ0FVTUFBQWNHQlFRQUF3QURFUVVQS3pNUklSRW5NeEVqSWdFUTdzek1BcXI5VmlJQ1pnQUFBQVVBTFAvaEE3d0RHQUFXQURBQU9nQlNBRjRCZDB1d0UxQllRRW9DQVFBTkRnMEFEbVlBQXc0QkRnTmVBQUVJQ0FGY0VBRUpDQW9HQ1Y0UkFRd0dCQVlNWGdBTEJBdHBEd0VJQUFZTUNBWllBQW9IQlFJRUN3b0VXUklCRGc0TlVRQU5EUW9PUWh0THNCZFFXRUJMQWdFQURRNE5BQTVtQUFNT0FRNERYZ0FCQ0FnQlhCQUJDUWdLQ0FrS1poRUJEQVlFQmd4ZUFBc0VDMmtQQVFnQUJnd0lCbGdBQ2djRkFnUUxDZ1JaRWdFT0RnMVJBQTBOQ2c1Q0cwdXdHRkJZUUV3Q0FRQU5EZzBBRG1ZQUF3NEJEZ05lQUFFSUNBRmNFQUVKQ0FvSUNRcG1FUUVNQmdRR0RBUm1BQXNFQzJrUEFRZ0FCZ3dJQmxnQUNnY0ZBZ1FMQ2dSWkVnRU9EZzFSQUEwTkNnNUNHMEJPQWdFQURRNE5BQTVtQUFNT0FRNERBV1lBQVFnT0FRaGtFQUVKQ0FvSUNRcG1FUUVNQmdRR0RBUm1BQXNFQzJrUEFRZ0FCZ3dJQmxnQUNnY0ZBZ1FMQ2dSWkVnRU9EZzFSQUEwTkNnNUNXVmxaUUNoVFV6czdNakVYRjFOZVUxNWJXRHRTTzFKTFF6YzFNVG95T2hjd0Z6QlJFVEVZRVNnVlFCTVdLd0VHS3dFaURnSWRBU0UxTkNZMU5DNENLd0VWSVFVVkZCWVVEZ0lqQmlZckFTY2hCeXNCSWljaUxnSTlBUmNpQmhRV016STJOQ1lYQmdjT0F4NEJPd1l5TmljdUFTY21Kd0UxTkQ0Q093RXlGaDBCQVJrYkdsTVNKUndTQTVBQkNoZ25Ib1grU2dLaUFSVWZJdzRPSHc0Z0xmNUpMQjBpRkJrWklCTUlkd3dTRWd3TkVoS01DQVlGQ3dRQ0JBOE9KVU5SVUVBa0Z4WUpCUWtGQlFiK3BBVVBHaFc4SHlrQ0h3RU1HU2NhVENrUUhBUU5JQnNTWVlnMEZ6bzZKUmNKQVFHQWdBRVRHeUFPcHo4UkdoRVJHaEY4R2hZVEpBNFFEUWdZR2cwakVSTVVBWGZrQ3hnVERCMG00d0FBQWdDZy8yd0RZQUxzQUJJQUdnQWhRQjRBQUFBREFnQURXUUFDQVFFQ1RRQUNBZ0ZSQUFFQ0FVVVRGamtRQkJJckFDQUdGUlFlQXhjV093RXlQd0VTTlRRQUlpWTBOaklXRkFLUy90ek9SRlZ2TVJBSkRnRU9DVzNiL3VLRVhsNkVYZ0xzenBJMWxYeUpOaEVLQzMwQkRJeVMvczVlaEY1ZWhBQUFBQUVBZ2dCSkE0UUI2QUFkQUJ0QUdCSVJBZ0VBQVVBRkFRQStBQUFCQUdnQUFRRmZFeDhDRUNzQkpnY0dCd2tCTGdFR0J3WVVGd0V3TXhjVkZqSTNBVDRETGdJRGVoRVdBd1ArdVA2MEJoRVFCZ29LQVdFQkFRb2FDUUZlQXdRQ0FRRUNCQUhoRWcwREF2NjFBVWtIQkFVR0NSc0ovcUlCQVFrSkFXSUNCd1lIQ0FZR0FBRUFmd0NMQTRFQ0p3QWhBQjFBR2hZUEFnRUFBVUFGQVFBK0FBQUJBR2dDQVFFQlh5UXVFd01SS3lVQk1DY2pOU1lIQmdjQkRnRVVGaGNlQWpNeU53a0JGak15TmpjK0FpNEJBM2YrbndFQkVoVUVBdjZpQlFVRkJRTUhDQVFPQ1FGSUFVd0tEUVlNQlFNRkFRRUZ3d0ZlQVFFUkRRSUQvcDhGREF3TUJBTUVBZ2tCUy82MkNRVUZBd29KQ2drQUFBRUFBQUFCQUFBTEl5bm9Ydzg4OVFBTEJBQUFBQUFBMGdNcWV3QUFBQURTQXlwN0FDTC9iQU84QXhnQUFBQUlBQUlBQUFBQUFBQUFBUUFBQXhqL2JBQmNCQUFBQUFBQUE3d0FBUUFBQUFBQUFBQUFBQUFBQUFBQUFBVUJkZ0FpQUFBQUFBRlZBQUFENlFBc0JBQUFvQUNDQUg4QUFBQW9BQ2dBS0FGa0FhSUI1QUlzQUFFQUFBQUhBRjhBQlFBQUFBQUFBZ0FtQURRQWJBQUFBSW9KbGdBQUFBQUFBQUFNQUpZQUFRQUFBQUFBQVFBSUFBQUFBUUFBQUFBQUFnQUdBQWdBQVFBQUFBQUFBd0FrQUE0QUFRQUFBQUFBQkFBSUFESUFBUUFBQUFBQUJRQkdBRG9BQVFBQUFBQUFCZ0FJQUlBQUF3QUJCQWtBQVFBUUFJZ0FBd0FCQkFrQUFnQU1BSmdBQXdBQkJBa0FBd0JJQUtRQUF3QUJCQWtBQkFBUUFPd0FBd0FCQkFrQUJRQ01BUHdBQXdBQkJBa0FCZ0FRQVlocFkyOXVabTl1ZEUxbFpHbDFiVVp2Ym5SR2IzSm5aU0F5TGpBZ09pQnBZMjl1Wm05dWRDQTZJREkyTFRndE1qQXhOV2xqYjI1bWIyNTBWbVZ5YzJsdmJpQXhMakFnT3lCMGRHWmhkWFJ2YUdsdWRDQW9kakF1T1RRcElDMXNJRGdnTFhJZ05UQWdMVWNnTWpBd0lDMTRJREUwSUMxM0lDSkhJaUF0WmlBdGMybGpiMjVtYjI1MEFHa0FZd0J2QUc0QVpnQnZBRzRBZEFCTkFHVUFaQUJwQUhVQWJRQkdBRzhBYmdCMEFFWUFid0J5QUdjQVpRQWdBRElBTGdBd0FDQUFPZ0FnQUdrQVl3QnZBRzRBWmdCdkFHNEFkQUFnQURvQUlBQXlBRFlBTFFBNEFDMEFNZ0F3QURFQU5RQnBBR01BYndCdUFHWUFid0J1QUhRQVZnQmxBSElBY3dCcEFHOEFiZ0FnQURFQUxnQXdBQ0FBT3dBZ0FIUUFkQUJtQUdFQWRRQjBBRzhBYUFCcEFHNEFkQUFnQUNnQWRnQXdBQzRBT1FBMEFDa0FJQUF0QUd3QUlBQTRBQ0FBTFFCeUFDQUFOUUF3QUNBQUxRQkhBQ0FBTWdBd0FEQUFJQUF0QUhnQUlBQXhBRFFBSUFBdEFIY0FJQUFpQUVjQUlnQWdBQzBBWmdBZ0FDMEFjd0JwQUdNQWJ3QnVBR1lBYndCdUFIUUFBQUFDQUFBQUFBQUEvNE1BTWdBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBY0FBQUFCQUFJQVd3RUNBUU1CQkFkMWJtbEZOalV3QjNWdWFVVTJOakVIZFc1cFJUWkVSUUFCQUFILy93QVBBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQXlBRElER1AvaEF4ai9iQU1ZLytFREdQOXNzQUFzc0NCZ1ppMndBU3dnWkNDd3dGQ3dCQ1phc0FSRlcxZ2hJeUViaWxnZ3NGQlFXQ0d3UUZrYklMQTRVRmdoc0RoWldTQ3dDa1ZoWkxBb1VGZ2hzQXBGSUxBd1VGZ2hzREJaR3lDd3dGQllJR1lnaW9waElMQUtVRmhnR3lDd0lGQllJYkFLWUJzZ3NEWlFXQ0d3Tm1BYllGbFpXUnV3QUN0WldTT3dBRkJZWlZsWkxiQUNMQ0JGSUxBRUpXRmtJTEFGUTFCWXNBVWpRckFHSTBJYklTRlpzQUZnTGJBRExDTWhJeUVnWkxFRllrSWdzQVlqUXJJS0FBSXFJU0N3QmtNZ2lpQ0tzQUFyc1RBRkpZcFJXR0JRRzJGU1dWZ2pXU0Vnc0VCVFdMQUFLeHNoc0VCWkk3QUFVRmhsV1Myd0JDeXdDQ05Dc0FjalFyQUFJMEt3QUVPd0IwTlJXTEFJUXl1eUFBRUFRMkJDc0JabEhGa3RzQVVzc0FCRElFVWdzQUpGWTdBQlJXSmdSQzJ3Qml5d0FFTWdSU0N3QUNzanNRUUVKV0FnUllvallTQmtJTEFnVUZnaHNBQWJzREJRV0xBZ0c3QkFXVmtqc0FCUVdHVlpzQU1sSTJGRVJDMndCeXl4QlFWRnNBRmhSQzJ3Q0N5d0FXQWdJTEFLUTBxd0FGQllJTEFLSTBKWnNBdERTckFBVWxnZ3NBc2pRbGt0c0Frc0lMZ0VBR0lndUFRQVk0b2pZYkFNUTJBZ2ltQWdzQXdqUWlNdHNBb3NTMVJZc1FjQlJGa2tzQTFsSTNndHNBc3NTMUZZUzFOWXNRY0JSRmtiSVZra3NCTmxJM2d0c0F3c3NRQU5RMVZZc1EwTlE3QUJZVUt3Q1N0WnNBQkRzQUlsUXJJQUFRQkRZRUt4Q2dJbFFyRUxBaVZDc0FFV0l5Q3dBeVZRV0xBQVE3QUVKVUtLaWlDS0kyR3dDQ29oSTdBQllTQ0tJMkd3Q0NvaEc3QUFRN0FDSlVLd0FpVmhzQWdxSVZtd0NrTkhzQXREUjJDd2dHSWdzQUpGWTdBQlJXSmdzUUFBRXlORXNBRkRzQUErc2dFQkFVTmdRaTJ3RFN5eEFBVkZWRmdBc0EwalFpQmdzQUZodFE0T0FRQU1BRUpDaW1DeERBUXJzR3NyR3lKWkxiQU9MTEVBRFNzdHNBOHNzUUVOS3kyd0VDeXhBZzByTGJBUkxMRUREU3N0c0JJc3NRUU5LeTJ3RXl5eEJRMHJMYkFVTExFR0RTc3RzQlVzc1FjTkt5MndGaXl4Q0EwckxiQVhMTEVKRFNzdHNCZ3NzQWNyc1FBRlJWUllBTEFOSTBJZ1lMQUJZYlVPRGdFQURBQkNRb3Bnc1F3RUs3QnJLeHNpV1Myd0dTeXhBQmdyTGJBYUxMRUJHQ3N0c0Jzc3NRSVlLeTJ3SEN5eEF4Z3JMYkFkTExFRUdDc3RzQjRzc1FVWUt5MndIeXl4QmhnckxiQWdMTEVIR0NzdHNDRXNzUWdZS3kyd0lpeXhDUmdyTGJBakxDQmdzQTVnSUVNanNBRmdRN0FDSmJBQ0pWRllJeUE4c0FGZ0k3QVNaUndiSVNGWkxiQWtMTEFqSzdBaktpMndKU3dnSUVjZ0lMQUNSV093QVVWaVlDTmhPQ01naWxWWUlFY2dJTEFDUldPd0FVVmlZQ05oT0JzaFdTMndKaXl4QUFWRlZGZ0FzQUVXc0NVcXNBRVZNQnNpV1Myd0p5eXdCeXV4QUFWRlZGZ0FzQUVXc0NVcXNBRVZNQnNpV1Myd0tDd2dOYkFCWUMyd0tTd0FzQU5GWTdBQlJXS3dBQ3V3QWtWanNBRkZZckFBSzdBQUZyUUFBQUFBQUVRK0l6aXhLQUVWS2kyd0tpd2dQQ0JISUxBQ1JXT3dBVVZpWUxBQVEyRTRMYkFyTEM0WFBDMndMQ3dnUENCSElMQUNSV093QVVWaVlMQUFRMkd3QVVOak9DMndMU3l4QWdBV0pTQXVJRWV3QUNOQ3NBSWxTWXFLUnlOSEkyRWdXR0liSVZtd0FTTkNzaXdCQVJVVUtpMndMaXl3QUJhd0JDV3dCQ1ZISTBjalliQUdSU3RsaWk0aklDQThpamd0c0M4c3NBQVdzQVFsc0FRbElDNUhJMGNqWVNDd0JDTkNzQVpGS3lDd1lGQllJTEJBVVZpekFpQURJQnV6QWlZREdsbENRaU1nc0FsRElJb2pSeU5ISTJFalJtQ3dCRU93Z0dKZ0lMQUFLeUNLaW1FZ3NBSkRZR1Fqc0FORFlXUlFXTEFDUTJFYnNBTkRZRm13QXlXd2dHSmhJeUFnc0FRbUkwWmhPQnNqc0FsRFJyQUNKYkFKUTBjalJ5TmhZQ0N3QkVPd2dHSmdJeUN3QUNzanNBUkRZTEFBSzdBRkpXR3dCU1d3Z0dLd0JDWmhJTEFFSldCa0k3QURKV0JrVUZnaEd5TWhXU01nSUxBRUppTkdZVGhaTGJBd0xMQUFGaUFnSUxBRkppQXVSeU5ISTJFalBEZ3RzREVzc0FBV0lMQUpJMElnSUNCR0kwZXdBQ3NqWVRndHNESXNzQUFXc0FNbHNBSWxSeU5ISTJHd0FGUllMaUE4SXlFYnNBSWxzQUlsUnlOSEkyRWdzQVVsc0FRbFJ5TkhJMkd3QmlXd0JTVkpzQUlsWWJBQlJXTWpJRmhpR3lGWlk3QUJSV0pnSXk0aklDQThpamdqSVZrdHNETXNzQUFXSUxBSlF5QXVSeU5ISTJFZ1lMQWdZR2F3Z0dJaklDQThpamd0c0RRc0l5QXVSckFDSlVaU1dDQThXUzZ4SkFFVUt5MndOU3dqSUM1R3NBSWxSbEJZSUR4WkxyRWtBUlFyTGJBMkxDTWdMa2F3QWlWR1VsZ2dQRmtqSUM1R3NBSWxSbEJZSUR4WkxyRWtBUlFyTGJBM0xMQXVLeU1nTGthd0FpVkdVbGdnUEZrdXNTUUJGQ3N0c0Rnc3NDOHJpaUFnUExBRUkwS0tPQ01nTGthd0FpVkdVbGdnUEZrdXNTUUJGQ3V3QkVNdXNDUXJMYkE1TExBQUZyQUVKYkFFSmlBdVJ5TkhJMkd3QmtVckl5QThJQzRqT0xFa0FSUXJMYkE2TExFSkJDVkNzQUFXc0FRbHNBUWxJQzVISTBjallTQ3dCQ05Dc0FaRkt5Q3dZRkJZSUxCQVVWaXpBaUFESUJ1ekFpWURHbGxDUWlNZ1I3QUVRN0NBWW1BZ3NBQXJJSXFLWVNDd0FrTmdaQ093QTBOaFpGQllzQUpEWVJ1d0EwTmdXYkFESmJDQVltR3dBaVZHWVRnaklEd2pPQnNoSUNCR0kwZXdBQ3NqWVRnaFdiRWtBUlFyTGJBN0xMQXVLeTZ4SkFFVUt5MndQQ3l3THlzaEl5QWdQTEFFSTBJak9MRWtBUlFyc0FSRExyQWtLeTJ3UFN5d0FCVWdSN0FBSTBLeUFBRUJGUlFUTHJBcUtpMndQaXl3QUJVZ1I3QUFJMEt5QUFFQkZSUVRMckFxS2kyd1B5eXhBQUVVRTdBcktpMndRQ3l3TFNvdHNFRXNzQUFXUlNNZ0xpQkdpaU5oT0xFa0FSUXJMYkJDTExBSkkwS3dRU3N0c0VNc3NnQUFPaXN0c0VRc3NnQUJPaXN0c0VVc3NnRUFPaXN0c0VZc3NnRUJPaXN0c0Vjc3NnQUFPeXN0c0Vnc3NnQUJPeXN0c0Vrc3NnRUFPeXN0c0Vvc3NnRUJPeXN0c0Vzc3NnQUFOeXN0c0V3c3NnQUJOeXN0c0Uwc3NnRUFOeXN0c0U0c3NnRUJOeXN0c0U4c3NnQUFPU3N0c0ZBc3NnQUJPU3N0c0ZFc3NnRUFPU3N0c0ZJc3NnRUJPU3N0c0ZNc3NnQUFQQ3N0c0ZRc3NnQUJQQ3N0c0ZVc3NnRUFQQ3N0c0ZZc3NnRUJQQ3N0c0Zjc3NnQUFPQ3N0c0Znc3NnQUJPQ3N0c0Zrc3NnRUFPQ3N0c0Zvc3NnRUJPQ3N0c0Zzc3NEQXJMckVrQVJRckxiQmNMTEF3SzdBMEt5MndYU3l3TUN1d05Tc3RzRjRzc0FBV3NEQXJzRFlyTGJCZkxMQXhLeTZ4SkFFVUt5MndZQ3l3TVN1d05Dc3RzR0Vzc0RFcnNEVXJMYkJpTExBeEs3QTJLeTJ3WXl5d01pc3VzU1FCRkNzdHNHUXNzRElyc0RRckxiQmxMTEF5SzdBMUt5MndaaXl3TWl1d05pc3RzR2Nzc0RNckxyRWtBUlFyTGJCb0xMQXpLN0EwS3kyd2FTeXdNeXV3TlNzdHNHb3NzRE1yc0RZckxiQnJMQ3V3Q0dXd0F5UlFlTEFCRlRBdEFBQkx1QURJVWxpeEFRR09XYmtJQUFnQVl5Q3dBU05FSUxBREkzQ3dEa1VnSUV1NEFBNVJTN0FHVTFwWXNEUWJzQ2haWUdZZ2lsVllzQUlsWWJBQlJXTWpZckFDSTBTekNna0ZCQ3V6Q2dzRkJDdXpEZzhGQkN0WnNnUW9DVVZTUkxNS0RRWUVLN0VHQVVTeEpBR0lVVml3UUloWXNRWURSTEVtQVloUldMZ0VBSWhZc1FZQlJGbFpXVm00QWYrRnNBU05zUVVBUkFBQUFBPT1cXFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIik7XFxufVxcbi5pY29uZm9udCB7XFxuICBmb250LWZhbWlseTogaWNvbmZvbnQgIWltcG9ydGFudDtcXG4gIGZvbnQtc2l6ZTogMTZweDtcXG4gIGZvbnQtc3R5bGU6IG5vcm1hbDtcXG4gIC13ZWJraXQtZm9udC1zbW9vdGhpbmc6IGFudGlhbGlhc2VkO1xcbiAgLXdlYmtpdC10ZXh0LXN0cm9rZS13aWR0aDogMC4ycHg7XFxuICAtbW96LW9zeC1mb250LXNtb290aGluZzogZ3JheXNjYWxlO1xcbn1cXG5cXG5bZGF0YS1kcHI9XFxcIjJcXFwiXSAudGFiLWhlYWRlciB7XFxuICBmb250LXNpemU6IDI4cHg7XFxufVxcblxcbltkYXRhLWRwcj1cXFwiM1xcXCJdIC50YWItaGVhZGVyIHtcXG4gIGZvbnQtc2l6ZTogNDJweDtcXG59XFxuXFxuW2RhdGEtZHByPVxcXCIyXFxcIl0gLnRhYmhlYWRlciAuaGwtaWNvbiB7XFxuICBmb250LXNpemU6IDI4cHg7XFxufVxcblxcbltkYXRhLWRwcj1cXFwiM1xcXCJdIC50YWJoZWFkZXIgLmhsLWljb24ge1xcbiAgZm9udC1zaXplOiA0MnB4O1xcbn1cXG5cXG5bZGF0YS1kcHI9XFxcIjJcXFwiXSAudGFiLWhlYWRlciAuZm9sZC10b2dnbGUge1xcbiAgZm9udC1zaXplOiAyOHB4O1xcbn1cXG5cXG5bZGF0YS1kcHI9XFxcIjNcXFwiXSAudGFiLWhlYWRlciAuZm9sZC10b2dnbGUge1xcbiAgZm9udC1zaXplOiA0MnB4O1xcbn1cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vc3JjL3N0eWxlcy90YWJoZWFkZXIuY3NzXG4gKiogbW9kdWxlIGlkID0gNjJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG5yZXF1aXJlKCcuLi9zdHlsZXMvc2Nyb2xsZXIuY3NzJylcbnJlcXVpcmUoJy4uL3Njcm9sbCcpXG5cbi8vIGxpYi5zY3JvbGwgZXZlbnRzOlxuLy8gIC0gc2Nyb2xsc3RhcnRcbi8vICAtIHNjcm9sbGluZ1xuLy8gIC0gcHVsbGRvd25lbmRcbi8vICAtIHB1bGx1cGVuZFxuLy8gIC0gcHVsbGxlZnRlbmRcbi8vICAtIHB1bGxyaWdodGVuZFxuLy8gIC0gcHVsbGRvd25cbi8vICAtIHB1bGx1cFxuLy8gIC0gcHVsbGxlZnRcbi8vICAtIHB1bGxyaWdodFxuLy8gIC0gY29udGVudHJlZnJlc2hcblxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoJy4vY29tcG9uZW50JylcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJylcblxudmFyIGRpcmVjdGlvbk1hcCA9IHtcbiAgaDogWydyb3cnLCAnaG9yaXpvbnRhbCcsICdoJywgJ3gnXSxcbiAgdjogWydjb2x1bW4nLCAndmVydGljYWwnLCAndicsICd5J11cbn1cblxudmFyIERFRkFVTFRfRElSRUNUSU9OID0gJ2NvbHVtbidcblxuLy8gYXR0cnM6XG4vLyAgLSBzY3JvbGwtZGlyZWNpdG9uOiBub25lfHZlcnRpY2FsfGhvcml6b250YWwgKGRlZmF1bHQgaXMgdmVydGljYWwpXG4vLyAgLSBzaG93LXNjcm9sbGJhcjogdHJ1ZXxmYWxzZSAoZGVmYXVsdCBpcyB0cnVlKVxuZnVuY3Rpb24gU2Nyb2xsZXIgKGRhdGEsIG5vZGVUeXBlKSB7XG4gIHZhciBhdHRycyA9IGRhdGEuYXR0ciB8fCB7fVxuICB2YXIgZGlyZWN0aW9uID0gYXR0cnMuc2Nyb2xsRGlyZWN0aW9uXG4gICAgfHwgYXR0cnMuZGlyZWN0aW9uXG4gICAgfHwgREVGQVVMVF9ESVJFQ1RJT05cbiAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb25NYXAuaC5pbmRleE9mKGRpcmVjdGlvbikgPT09IC0xXG4gICAgPyAndidcbiAgICA6ICdoJ1xuICB0aGlzLnNob3dTY3JvbGxiYXIgPSBhdHRycy5zaG93U2Nyb2xsYmFyIHx8IHRydWVcbiAgQ29tcG9uZW50LmNhbGwodGhpcywgZGF0YSwgbm9kZVR5cGUpXG59XG5cblNjcm9sbGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ29tcG9uZW50LnByb3RvdHlwZSlcblxuU2Nyb2xsZXIucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uIChub2RlVHlwZSkge1xuICB2YXIgU2Nyb2xsID0gbGliLnNjcm9sbFxuICB2YXIgbm9kZSA9IENvbXBvbmVudC5wcm90b3R5cGUuY3JlYXRlLmNhbGwodGhpcywgbm9kZVR5cGUpXG4gIG5vZGUuY2xhc3NMaXN0LmFkZCgnd2VleC1jb250YWluZXInLCAnc2Nyb2xsLXdyYXAnKVxuICB0aGlzLnNjcm9sbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICB0aGlzLnNjcm9sbEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcbiAgICAnd2VleC1jb250YWluZXInLFxuICAgICdzY3JvbGwtZWxlbWVudCcsXG4gICAgdGhpcy5kaXJlY3Rpb24gKyAnLXNjcm9sbGVyJ1xuICApXG5cbiAgLy8gRmxleCB3aWxsIGNhdXNlIGEgYnVnIHRvIHJlc2NhbGUgY2hpbGRyZW4ncyBzaXplIGlmIHRoZWlyIHRvdGFsXG4gIC8vIHNpemUgZXhjZWVkIHRoZSBsaW1pdCBvZiB0aGVpciBwYXJlbnQuIFNvIHRvIHVzZSBib3ggaW5zdGVhZC5cbiAgdGhpcy5zY3JvbGxFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnLXdlYmtpdC1ib3gnXG4gIHRoaXMuc2Nyb2xsRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2JveCdcbiAgdGhpcy5zY3JvbGxFbGVtZW50LnN0eWxlLndlYmtpdEJveE9yaWVudCA9IHRoaXMuZGlyZWN0aW9uID09PSAnaCdcbiAgICA/ICdob3Jpem9udGFsJ1xuICAgIDogJ3ZlcnRpY2FsJ1xuICB0aGlzLnNjcm9sbEVsZW1lbnQuc3R5bGUuYm94T3JpZW50ID0gdGhpcy5zY3JvbGxFbGVtZW50LnN0eWxlLndlYmtpdEJveE9yaWVudFxuXG4gIG5vZGUuYXBwZW5kQ2hpbGQodGhpcy5zY3JvbGxFbGVtZW50KVxuICB0aGlzLnNjcm9sbGVyID0gbmV3IFNjcm9sbCh7XG4gICAgLy8gaWYgdGhlIGRpcmVjdGlvbiBpcyB4LCB0aGVuIHRoZSBib3VuZGluZyByZWN0IG9mIHRoZSBzY3JvbGwgZWxlbWVudFxuICAgIC8vIHNob3VsZCBiZSBnb3QgYnkgdGhlICdSYW5nZScgQVBJIG90aGVyIHRoYW4gdGhlICdnZXRCb3VuZGluZ0NsaWVudFJlY3QnXG4gICAgLy8gQVBJLCBiZWNhdXNlIHRoZSB3aWR0aCBvdXRzaWRlIHRoZSB2aWV3cG9ydCB3b24ndCBiZSBjb3VudCBpbiBieVxuICAgIC8vICdnZXRCb3VuZGluZ0NsaWVudFJlY3QnLlxuICAgIC8vIE90aGVyd2lzZSBzaG91bGQgdXNlIHRoZSBlbGVtZW50IHJlY3QgaW4gY2FzZSB0aGVyZSBpcyBhIGNoaWxkIHNjcm9sbGVyXG4gICAgLy8gb3IgbGlzdCBpbiB0aGlzIHNjcm9sbGVyLiBJZiB1c2luZyAnUmFuZ2UnLCB0aGUgd2hvbGUgc2Nyb2xsIGVsZW1lbnRcbiAgICAvLyBpbmNsdWRpbmcgdGhlIGhpZGluZyBwYXJ0IHdpbGwgYmUgY291bnQgaW4gdGhlIHJlY3QuXG4gICAgdXNlRWxlbWVudFJlY3Q6IHRoaXMuZGlyZWN0aW9uID09PSAndicsXG4gICAgc2Nyb2xsRWxlbWVudDogdGhpcy5zY3JvbGxFbGVtZW50LFxuICAgIGRpcmVjdGlvbjogdGhpcy5kaXJlY3Rpb24gPT09ICdoJyA/ICd4JyA6ICd5J1xuICB9KVxuICB0aGlzLnNjcm9sbGVyLmluaXQoKVxuICB0aGlzLm9mZnNldCA9IDBcbiAgcmV0dXJuIG5vZGVcbn1cblxuU2Nyb2xsZXIucHJvdG90eXBlLmJpbmRFdmVudHMgPSBmdW5jdGlvbiAoZXZ0cykge1xuICBDb21wb25lbnQucHJvdG90eXBlLmJpbmRFdmVudHMuY2FsbCh0aGlzLCBldnRzKVxuICAvLyB0byBlbmFibGUgbGF6eWxvYWQgZm9yIEltYWdlc1xuICB0aGlzLnNjcm9sbGVyLmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbGluZycsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIHNvID0gZS5zY3JvbGxPYmpcbiAgICB2YXIgc2Nyb2xsVG9wID0gc28uZ2V0U2Nyb2xsVG9wKClcbiAgICB2YXIgc2Nyb2xsTGVmdCA9IHNvLmdldFNjcm9sbExlZnQoKVxuICAgIHZhciBvZmZzZXQgPSB0aGlzLmRpcmVjdGlvbiA9PT0gJ3YnID8gc2Nyb2xsVG9wIDogc2Nyb2xsTGVmdFxuICAgIHZhciBkaWZmID0gb2Zmc2V0IC0gdGhpcy5vZmZzZXRcbiAgICB2YXIgZGlyXG4gICAgaWYgKGRpZmYgPj0gMCkge1xuICAgICAgZGlyID0gdGhpcy5kaXJlY3Rpb24gPT09ICd2JyA/ICd1cCcgOiAnbGVmdCdcbiAgICB9IGVsc2Uge1xuICAgICAgZGlyID0gdGhpcy5kaXJlY3Rpb24gPT09ICd2JyA/ICdkb3duJyA6ICdyaWdodCdcbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdzY3JvbGwnLCB7XG4gICAgICBvcmlnaW5hbFR5cGU6ICdzY3JvbGxpbmcnLFxuICAgICAgc2Nyb2xsVG9wOiBzby5nZXRTY3JvbGxUb3AoKSxcbiAgICAgIHNjcm9sbExlZnQ6IHNvLmdldFNjcm9sbExlZnQoKSxcbiAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgZGlyZWN0aW9uOiBkaXJcbiAgICB9LCB7XG4gICAgICBidWJibGVzOiB0cnVlXG4gICAgfSlcbiAgICB0aGlzLm9mZnNldCA9IG9mZnNldFxuICB9LmJpbmQodGhpcykpXG5cbiAgdmFyIHB1bGxlbmRFdmVudCA9ICdwdWxsJ1xuICAgICsgKHsgdjogJ3VwJywgaDogJ2xlZnQnIH0pW3RoaXMuZGlyZWN0aW9uXVxuICAgICsgJ2VuZCdcbiAgdGhpcy5zY3JvbGxlci5hZGRFdmVudExpc3RlbmVyKHB1bGxlbmRFdmVudCwgZnVuY3Rpb24gKGUpIHtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ2xvYWRtb3JlJylcbiAgfS5iaW5kKHRoaXMpKVxufVxuXG5TY3JvbGxlci5wcm90b3R5cGUuY3JlYXRlQ2hpbGRyZW4gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBjaGlsZHJlbiA9IHRoaXMuZGF0YS5jaGlsZHJlblxuICB2YXIgcGFyZW50UmVmID0gdGhpcy5kYXRhLnJlZlxuICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcbiAgICB2YXIgaXNGbGV4ID0gZmFsc2VcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjaGlsZHJlbltpXS5pbnN0YW5jZUlkID0gdGhpcy5kYXRhLmluc3RhbmNlSWRcbiAgICAgIGNoaWxkcmVuW2ldLnNjYWxlID0gdGhpcy5kYXRhLnNjYWxlXG4gICAgICB2YXIgY2hpbGQgPSBjb21wb25lbnRNYW5hZ2VyLmNyZWF0ZUVsZW1lbnQoY2hpbGRyZW5baV0pXG4gICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChjaGlsZC5ub2RlKVxuICAgICAgY2hpbGQucGFyZW50UmVmID0gcGFyZW50UmVmXG4gICAgICBpZiAoIWlzRmxleFxuICAgICAgICAgICYmIGNoaWxkLmRhdGEuc3R5bGVcbiAgICAgICAgICAmJiBjaGlsZC5kYXRhLnN0eWxlLmhhc093blByb3BlcnR5KCdmbGV4JylcbiAgICAgICAgKSB7XG4gICAgICAgIGlzRmxleCA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zY3JvbGxFbGVtZW50LmFwcGVuZENoaWxkKGZyYWdtZW50KVxuICB9XG4gIC8vIHdhaXQgZm9yIGZyYWdtZW50IHRvIGFwcGVuZGVkIG9uIHNjcm9sbEVsZW1lbnQgb24gVUkgdGhyZWFkLlxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNjcm9sbGVyLnJlZnJlc2goKVxuICB9LmJpbmQodGhpcyksIDApXG59XG5cblNjcm9sbGVyLnByb3RvdHlwZS5hcHBlbmRDaGlsZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gIHZhciBjaGlsZHJlbiA9IHRoaXMuZGF0YS5jaGlsZHJlblxuICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gIHZhciBjaGlsZCA9IGNvbXBvbmVudE1hbmFnZXIuY3JlYXRlRWxlbWVudChkYXRhKVxuICB0aGlzLnNjcm9sbEVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGQubm9kZSlcblxuICAvLyB3YWl0IGZvciBVSSB0aHJlYWQgdG8gdXBkYXRlLlxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNjcm9sbGVyLnJlZnJlc2goKVxuICB9LmJpbmQodGhpcyksIDApXG5cbiAgLy8gdXBkYXRlIHRoaXMuZGF0YS5jaGlsZHJlblxuICBpZiAoIWNoaWxkcmVuIHx8ICFjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICB0aGlzLmRhdGEuY2hpbGRyZW4gPSBbZGF0YV1cbiAgfSBlbHNlIHtcbiAgICBjaGlsZHJlbi5wdXNoKGRhdGEpXG4gIH1cblxuICByZXR1cm4gY2hpbGRcbn1cblxuU2Nyb2xsZXIucHJvdG90eXBlLmluc2VydEJlZm9yZSA9IGZ1bmN0aW9uIChjaGlsZCwgYmVmb3JlKSB7XG4gIHZhciBjaGlsZHJlbiA9IHRoaXMuZGF0YS5jaGlsZHJlblxuICB2YXIgaSA9IDBcbiAgdmFyIGlzQXBwZW5kID0gZmFsc2VcblxuICAvLyB1cGRhdGUgdGhpcy5kYXRhLmNoaWxkcmVuXG4gIGlmICghY2hpbGRyZW4gfHwgIWNoaWxkcmVuLmxlbmd0aCB8fCAhYmVmb3JlKSB7XG4gICAgaXNBcHBlbmQgPSB0cnVlXG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKGNoaWxkcmVuW2ldLnJlZiA9PT0gYmVmb3JlLmRhdGEucmVmKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpID09PSBsKSB7XG4gICAgICBpc0FwcGVuZCA9IHRydWVcbiAgICB9XG4gIH1cblxuICBpZiAoaXNBcHBlbmQpIHtcbiAgICB0aGlzLnNjcm9sbEVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGQubm9kZSlcbiAgICBjaGlsZHJlbi5wdXNoKGNoaWxkLmRhdGEpXG4gIH0gZWxzZSB7XG4gICAgaWYgKGJlZm9yZS5maXhlZFBsYWNlaG9sZGVyKSB7XG4gICAgICB0aGlzLnNjcm9sbEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLm5vZGUsIGJlZm9yZS5maXhlZFBsYWNlaG9sZGVyKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNjcm9sbEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLm5vZGUsIGJlZm9yZS5ub2RlKVxuICAgIH1cbiAgICBjaGlsZHJlbi5zcGxpY2UoaSwgMCwgY2hpbGQuZGF0YSlcbiAgfVxuXG4gIC8vIHdhaXQgZm9yIFVJIHRocmVhZCB0byB1cGRhdGUuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2Nyb2xsZXIucmVmcmVzaCgpXG4gIH0uYmluZCh0aGlzKSwgMClcbn1cblxuU2Nyb2xsZXIucHJvdG90eXBlLnJlbW92ZUNoaWxkID0gZnVuY3Rpb24gKGNoaWxkKSB7XG4gIHZhciBjaGlsZHJlbiA9IHRoaXMuZGF0YS5jaGlsZHJlblxuICAvLyByZW1vdmUgZnJvbSB0aGlzLmRhdGEuY2hpbGRyZW5cbiAgdmFyIGkgPSAwXG4gIHZhciBjb21wb25lbnRNYW5hZ2VyID0gdGhpcy5nZXRDb21wb25lbnRNYW5hZ2VyKClcbiAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgIGZvciAodmFyIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChjaGlsZHJlbltpXS5yZWYgPT09IGNoaWxkLmRhdGEucmVmKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpIDwgbCkge1xuICAgICAgY2hpbGRyZW4uc3BsaWNlKGksIDEpXG4gICAgfVxuICB9XG4gIC8vIHJlbW92ZSBmcm9tIGNvbXBvbmVudE1hcCByZWN1cnNpdmVseVxuICBjb21wb25lbnRNYW5hZ2VyLnJlbW92ZUVsZW1lbnRCeVJlZihjaGlsZC5kYXRhLnJlZilcbiAgaWYgKGNoaWxkLmZpeGVkUGxhY2Vob2xkZXIpIHtcbiAgICB0aGlzLnNjcm9sbEVsZW1lbnQucmVtb3ZlQ2hpbGQoY2hpbGQuZml4ZWRQbGFjZWhvbGRlcilcbiAgfVxuICBjaGlsZC5ub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQubm9kZSlcblxuICAvLyB3YWl0IGZvciBVSSB0aHJlYWQgdG8gdXBkYXRlLlxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNjcm9sbGVyLnJlZnJlc2goKVxuICB9LmJpbmQodGhpcyksIDApXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2Nyb2xsZXJcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvY29tcG9uZW50cy9zY3JvbGxlci5qc1xuICoqIG1vZHVsZSBpZCA9IDYzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL3Njcm9sbGVyLmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2FkZFN0eWxlcy5qc1wiKShjb250ZW50LCB7fSk7XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcblx0Ly8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0aWYoIWNvbnRlbnQubG9jYWxzKSB7XG5cdFx0bW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9zY3JvbGxlci5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9zY3JvbGxlci5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvc3R5bGVzL3Njcm9sbGVyLmNzc1xuICoqIG1vZHVsZSBpZCA9IDY0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikoKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIi5zY3JvbGwtd3JhcCB7XFxuICBkaXNwbGF5OiBibG9jaztcXG4gIG92ZXJmbG93OiBoaWRkZW47XFxufVxcblxcbi5zY3JvbGwtZWxlbWVudC5ob3Jpem9udGFsIHtcXG4gIC13ZWJraXQtYm94LW9yaWVudDogaG9yaXpvbnRhbDtcXG4gIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IHJvdztcXG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XFxufVxcbi5zY3JvbGwtZWxlbWVudC52ZXJ0aWNhbCB7XFxuICAtd2Via2l0LWJveC1vcmllbnQ6IHZlcnRpY2FsO1xcbiAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL3NyYy9zdHlsZXMvc2Nyb2xsZXIuY3NzXG4gKiogbW9kdWxlIGlkID0gNjVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgQXRvbWljID0gcmVxdWlyZSgnLi9hdG9taWMnKVxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKVxuXG4vLyBhdHRyczpcbi8vICAgLSB0eXBlOiB0ZXh0fHBhc3N3b3JkfHRlbHxlbWFpbHx1cmxcbi8vICAgLSB2YWx1ZVxuLy8gICAtIHBsYWNlaG9sZGVyXG4vLyAgIC0gZGlzYWJsZWRcbi8vICAgLSBhdXRvZm9jdXNcbmZ1bmN0aW9uIElucHV0IChkYXRhKSB7XG4gIHZhciBhdHRycyA9IGRhdGEuYXR0ciB8fCB7fVxuICB0aGlzLnR5cGUgPSBhdHRycy50eXBlIHx8ICd0ZXh0J1xuICB0aGlzLnZhbHVlID0gYXR0cnMudmFsdWVcbiAgdGhpcy5wbGFjZWhvbGRlciA9IGF0dHJzLnBsYWNlaG9sZGVyXG4gIHRoaXMuYXV0b2ZvY3VzID0gYXR0cnMuYXV0b2ZvY3VzICYmIChhdHRycy5hdXRvZm9jdXMgIT09ICdmYWxzZScpXG4gICAgICAgICAgICAgICAgICAgID8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICA6IGZhbHNlXG4gIEF0b21pYy5jYWxsKHRoaXMsIGRhdGEpXG59XG5cbklucHV0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQXRvbWljLnByb3RvdHlwZSlcblxuSW5wdXQucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpXG4gIHZhciB1dWlkID0gTWF0aC5mbG9vcigxMDAwMDAwMDAwMDAwMCAqIE1hdGgucmFuZG9tKCkpICsgRGF0ZS5ub3coKVxuICB0aGlzLmNsYXNzTmFtZSA9ICd3ZWV4LWlwdC0nICsgdXVpZFxuICB0aGlzLnN0eWxlSWQgPSAnd2VleC1zdHlsZS0nICsgdXVpZFxuICBub2RlLmNsYXNzTGlzdC5hZGQodGhpcy5jbGFzc05hbWUpXG4gIG5vZGUuc2V0QXR0cmlidXRlKCd0eXBlJywgdGhpcy50eXBlKVxuICBub2RlLnR5cGUgPSB0aGlzLnR5cGVcbiAgLy8gRm9yIHRoZSBjb25zaXN0ZW5jeSBvZiBpbnB1dCBjb21wb25lbnQncyB3aWR0aC5cbiAgLy8gVGhlIGRhdGUgYW5kIHRpbWUgdHlwZSBvZiBpbnB1dCB3aWxsIGhhdmUgYSBiaWdnZXIgd2lkdGhcbiAgLy8gd2hlbiB0aGUgJ2JveC1zaXppbmcnIGlzIG5vdCBzZXQgdG8gJ2JvcmRlci1ib3gnXG4gIG5vZGUuY2xhc3NMaXN0LmFkZCgnd2VleC1lbGVtZW50JylcbiAgdGhpcy52YWx1ZSAmJiAobm9kZS52YWx1ZSA9IHRoaXMudmFsdWUpXG4gIHRoaXMucGxhY2Vob2xkZXIgJiYgKG5vZGUucGxhY2Vob2xkZXIgPSB0aGlzLnBsYWNlaG9sZGVyKVxuICByZXR1cm4gbm9kZVxufVxuXG5JbnB1dC5wcm90b3R5cGUudXBkYXRlU3R5bGUgPSBmdW5jdGlvbiAoc3R5bGUpIHtcbiAgQXRvbWljLnByb3RvdHlwZS51cGRhdGVTdHlsZS5jYWxsKHRoaXMsIHN0eWxlKVxuICBpZiAoc3R5bGUgJiYgc3R5bGUucGxhY2Vob2xkZXJDb2xvcikge1xuICAgIHRoaXMucGxhY2Vob2xkZXJDb2xvciA9IHN0eWxlLnBsYWNlaG9sZGVyQ29sb3JcbiAgICB0aGlzLnNldFBsYWNlaG9sZGVyQ29sb3IoKVxuICB9XG59XG5cbklucHV0LnByb3RvdHlwZS5hdHRyID0ge1xuICBkaXNhYmxlZDogZnVuY3Rpb24gKHZhbCkge1xuICAgIHRoaXMubm9kZS5kaXNhYmxlZCA9IHZhbCAmJiB2YWwgIT09ICdmYWxzZSdcbiAgICAgICAgICAgICAgICAgICAgPyB0cnVlXG4gICAgICAgICAgICAgICAgICAgIDogZmFsc2VcbiAgfVxufVxuXG5JbnB1dC5wcm90b3R5cGUuc2V0UGxhY2Vob2xkZXJDb2xvciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLnBsYWNlaG9sZGVyQ29sb3IpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgdmVuZG9ycyA9IFtcbiAgICAnOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyJyxcbiAgICAnOi1tb3otcGxhY2Vob2xkZXInLFxuICAgICc6Oi1tb3otcGxhY2Vob2xkZXInLFxuICAgICc6LW1zLWlucHV0LXBsYWNlaG9sZGVyJyxcbiAgICAnOnBsYWNlaG9sZGVyLXNob3duJ1xuICBdXG4gIHZhciBjc3MgPSAnJ1xuICB2YXIgY3NzUnVsZSA9ICdjb2xvcjogJyArIHRoaXMucGxhY2Vob2xkZXJDb2xvciArICc7J1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZlbmRvcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY3NzICs9ICcuJyArIHRoaXMuY2xhc3NOYW1lICsgdmVuZG9yc1tpXSArICd7J1xuICAgICAgICAgICArIGNzc1J1bGUgKyAnfSdcbiAgfVxuICB1dGlscy5hcHBlbmRTdHlsZShjc3MsIHRoaXMuc3R5bGVJZCwgdHJ1ZSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dFxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9jb21wb25lbnRzL2lucHV0LmpzXG4gKiogbW9kdWxlIGlkID0gNjZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgQXRvbWljID0gcmVxdWlyZSgnLi9jb21wb25lbnQnKVxudmFyIHNlbmRlciA9IHJlcXVpcmUoJy4uL2JyaWRnZS9zZW5kZXInKVxuXG4vLyBhdHRyczpcbi8vICAgLSBvcHRpb25zOiB0aGUgb3B0aW9ucyB0byBiZSBsaXN0ZWQsIGFzIGEgYXJyYXkgb2Ygc3RyaW5ncy5cbi8vICAgLSBzZWxlY3RlZEluZGV4OiB0aGUgc2VsZWN0ZWQgb3B0aW9ucycgaW5kZXggbnVtYmVyLlxuLy8gICAtIGRpc2FibGVkXG5mdW5jdGlvbiBTZWxlY3QgKGRhdGEpIHtcbiAgdmFyIGF0dHJzID0gZGF0YS5hdHRyIHx8IHt9XG4gIHRoaXMub3B0aW9ucyA9IFtdXG4gIHRoaXMuc2VsZWN0ZWRJbmRleCA9IDBcbiAgQXRvbWljLmNhbGwodGhpcywgZGF0YSlcbn1cblxuU2VsZWN0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQXRvbWljLnByb3RvdHlwZSlcblxuU2VsZWN0LnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0JylcbiAgdmFyIHV1aWQgPSBNYXRoLmZsb29yKDEwMDAwMDAwMDAwMDAwICogTWF0aC5yYW5kb20oKSkgKyBEYXRlLm5vdygpXG4gIHRoaXMuY2xhc3NOYW1lID0gJ3dlZXgtc2xjdC0nICsgdXVpZFxuICB0aGlzLnN0eWxlSWQgPSAnd2VleC1zdHlsZS0nICsgdXVpZFxuICBub2RlLmNsYXNzTGlzdC5hZGQodGhpcy5jbGFzc05hbWUpXG4gIC8vIEZvciB0aGUgY29uc2lzdGVuY3kgb2YgaW5wdXQgY29tcG9uZW50J3Mgd2lkdGguXG4gIC8vIFRoZSBkYXRlIGFuZCB0aW1lIHR5cGUgb2YgaW5wdXQgd2lsbCBoYXZlIGEgYmlnZ2VyIHdpZHRoXG4gIC8vIHdoZW4gdGhlICdib3gtc2l6aW5nJyBpcyBub3Qgc2V0IHRvICdib3JkZXItYm94J1xuICBub2RlLnN0eWxlWydib3gtc2l6aW5nJ10gPSAnYm9yZGVyLWJveCdcbiAgcmV0dXJuIG5vZGVcbn1cblxuU2VsZWN0LnByb3RvdHlwZS5hdHRyID0ge1xuICBkaXNhYmxlZDogZnVuY3Rpb24gKHZhbCkge1xuICAgIHRoaXMubm9kZS5kaXNhYmxlZCA9IHZhbCAmJiB2YWwgIT09ICdmYWxzZSdcbiAgICAgICAgICAgICAgICAgICAgPyB0cnVlXG4gICAgICAgICAgICAgICAgICAgIDogZmFsc2VcbiAgfSxcbiAgb3B0aW9uczogZnVuY3Rpb24gKHZhbCkge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsKSAhPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMub3B0aW9ucyA9IHZhbFxuICAgIHRoaXMubm9kZS5pbm5lckhUTUwgPSAnJ1xuICAgIHRoaXMuY3JlYXRlT3B0aW9ucyh2YWwpXG4gIH0sXG4gIHNlbGVjdGVkSW5kZXg6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICB2YWwgPSBwYXJzZUludCh2YWwpXG4gICAgaWYgKHR5cGVvZiB2YWwgIT09ICdudW1iZXInIHx8IHZhbCAhPT0gdmFsIHx8IHZhbCA+PSB0aGlzLm9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5ub2RlLnZhbHVlID0gdGhpcy5vcHRpb25zW3ZhbF1cbiAgfVxufVxuXG5TZWxlY3QucHJvdG90eXBlLmJpbmRFdmVudHMgPSBmdW5jdGlvbiAoZXZ0cykge1xuICB2YXIgaXNMaXN0ZW5Ub0NoYW5nZSA9IGZhbHNlXG4gIEF0b21pYy5wcm90b3R5cGUuYmluZEV2ZW50cy5jYWxsKFxuICAgICAgdGhpcyxcbiAgICAgIGV2dHMuZmlsdGVyKGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgdmFyIHBhc3MgPSB2YWwgIT09ICdjaGFuZ2UnXG4gICAgICAgICFwYXNzICYmIChpc0xpc3RlblRvQ2hhbmdlID0gdHJ1ZSlcbiAgICAgICAgcmV0dXJuIHBhc3NcbiAgICAgIH0pKVxuICBpZiAoaXNMaXN0ZW5Ub0NoYW5nZSkge1xuICAgIHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgZS5pbmRleCA9IHRoaXMub3B0aW9ucy5pbmRleE9mKHRoaXMubm9kZS52YWx1ZSlcbiAgICAgIHNlbmRlci5maXJlRXZlbnQodGhpcy5kYXRhLnJlZiwgJ2NoYW5nZScsIGUpXG4gICAgfS5iaW5kKHRoaXMpKVxuICB9XG59XG5cblNlbGVjdC5wcm90b3R5cGUuY3JlYXRlT3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gIHZhciBvcHREb2MgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcbiAgdmFyIG9wdFxuICBmb3IgKHZhciBpID0gMCwgbCA9IG9wdHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgb3B0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJylcbiAgICBvcHQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUob3B0c1tpXSkpXG4gICAgb3B0RG9jLmFwcGVuZENoaWxkKG9wdClcbiAgfVxuICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQob3B0RG9jKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdFxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9jb21wb25lbnRzL3NlbGVjdC5qc1xuICoqIG1vZHVsZSBpZCA9IDY3XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIEF0b21pYyA9IHJlcXVpcmUoJy4vYXRvbWljJylcblxuLy8gYXR0cnM6XG4vLyAgIC0gdmFsdWVcbi8vICAgLSBkaXNhYmxlZFxuZnVuY3Rpb24gRGF0ZXBpY2tlciAoZGF0YSkge1xuICBBdG9taWMuY2FsbCh0aGlzLCBkYXRhKVxufVxuXG5EYXRlcGlja2VyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQXRvbWljLnByb3RvdHlwZSlcblxuRGF0ZXBpY2tlci5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JylcbiAgdmFyIHV1aWQgPSBNYXRoLmZsb29yKDEwMDAwMDAwMDAwMDAwICogTWF0aC5yYW5kb20oKSkgKyBEYXRlLm5vdygpXG4gIHRoaXMuY2xhc3NOYW1lID0gJ3dlZXgtaXB0LScgKyB1dWlkXG4gIHRoaXMuc3R5bGVJZCA9ICd3ZWV4LXN0eWxlLScgKyB1dWlkXG4gIG5vZGUuY2xhc3NMaXN0LmFkZCh0aGlzLmNsYXNzTmFtZSlcbiAgbm9kZS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnZGF0ZScpXG4gIG5vZGUudHlwZSA9ICdkYXRlJ1xuICAvLyBGb3IgdGhlIGNvbnNpc3RlbmN5IG9mIGlucHV0IGNvbXBvbmVudCdzIHdpZHRoLlxuICAvLyBUaGUgZGF0ZSBhbmQgdGltZSB0eXBlIG9mIGlucHV0IHdpbGwgaGF2ZSBhIGJpZ2dlciB3aWR0aFxuICAvLyB3aGVuIHRoZSAnYm94LXNpemluZycgaXMgbm90IHNldCB0byAnYm9yZGVyLWJveCdcbiAgbm9kZS5jbGFzc0xpc3QuYWRkKCd3ZWV4LWVsZW1lbnQnKVxuICByZXR1cm4gbm9kZVxufVxuXG5EYXRlcGlja2VyLnByb3RvdHlwZS5hdHRyID0ge1xuICBkaXNhYmxlZDogZnVuY3Rpb24gKHZhbCkge1xuICAgIHRoaXMubm9kZS5kaXNhYmxlZCA9IHZhbCAmJiB2YWwgIT09ICdmYWxzZSdcbiAgICAgICAgICAgICAgICAgICAgPyB0cnVlXG4gICAgICAgICAgICAgICAgICAgIDogZmFsc2VcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGVwaWNrZXJcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvY29tcG9uZW50cy9kYXRlcGlja2VyLmpzXG4gKiogbW9kdWxlIGlkID0gNjhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgQXRvbWljID0gcmVxdWlyZSgnLi9hdG9taWMnKVxuXG4vLyBhdHRyczpcbi8vICAgLSB2YWx1ZVxuLy8gICAtIGRpc2FibGVkXG5mdW5jdGlvbiBUaW1lcGlja2VyIChkYXRhKSB7XG4gIEF0b21pYy5jYWxsKHRoaXMsIGRhdGEpXG59XG5cblRpbWVwaWNrZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBdG9taWMucHJvdG90eXBlKVxuXG5UaW1lcGlja2VyLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKVxuICB2YXIgdXVpZCA9IE1hdGguZmxvb3IoMTAwMDAwMDAwMDAwMDAgKiBNYXRoLnJhbmRvbSgpKSArIERhdGUubm93KClcbiAgdGhpcy5jbGFzc05hbWUgPSAnd2VleC1pcHQtJyArIHV1aWRcbiAgdGhpcy5zdHlsZUlkID0gJ3dlZXgtc3R5bGUtJyArIHV1aWRcbiAgbm9kZS5jbGFzc0xpc3QuYWRkKHRoaXMuY2xhc3NOYW1lKVxuICBub2RlLnNldEF0dHJpYnV0ZSgndHlwZScsICd0aW1lJylcbiAgbm9kZS50eXBlID0gJ3RpbWUnXG4gIC8vIEZvciB0aGUgY29uc2lzdGVuY3kgb2YgaW5wdXQgY29tcG9uZW50J3Mgd2lkdGguXG4gIC8vIFRoZSBkYXRlIGFuZCB0aW1lIHR5cGUgb2YgaW5wdXQgd2lsbCBoYXZlIGEgYmlnZ2VyIHdpZHRoXG4gIC8vIHdoZW4gdGhlICdib3gtc2l6aW5nJyBpcyBub3Qgc2V0IHRvICdib3JkZXItYm94J1xuICBub2RlLmNsYXNzTGlzdC5hZGQoJ3dlZXgtZWxlbWVudCcpXG4gIHJldHVybiBub2RlXG59XG5cblRpbWVwaWNrZXIucHJvdG90eXBlLmF0dHIgPSB7XG4gIGRpc2FibGVkOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgdGhpcy5ub2RlLmRpc2FibGVkID0gdmFsICYmIHZhbCAhPT0gJ2ZhbHNlJ1xuICAgICAgICAgICAgICAgICAgICA/IHRydWVcbiAgICAgICAgICAgICAgICAgICAgOiBmYWxzZVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVGltZXBpY2tlclxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9jb21wb25lbnRzL3RpbWVwaWNrZXIuanNcbiAqKiBtb2R1bGUgaWQgPSA2OVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBBdG9taWMgPSByZXF1aXJlKCcuL2F0b21pYycpXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpXG5yZXF1aXJlKCcuLi9zdHlsZXMvdmlkZW8uY3NzJylcblxuLy8gYXR0cnM6XG4vLyAgIC0gYXV0b1BsYXk6IHRydWUgfCBmYWxzZSAoZGVmYXVsdDogZmFsc2UpXG4vLyAgIC0gcGxheVN0YXR1czogcGxheSB8IHBhdXNlIHwgc3RvcFxuLy8gICAtIHNyYzoge3N0cmluZ31cbi8vICAgLSBwb3N0ZXI6IHtzdHJpbmd9XG4vLyAgIC0gbG9vcDogdHJ1ZSB8IGZhbHNlIChkZWZhdWx0OiBmYWxzZSlcbi8vICAgLSBtdXRlZDogdHJ1ZSB8IGZhbHNlIChkZWZhdWx0OiBmYWxzZSlcbi8vIGV2ZW50czpcbi8vICAgLSBzdGFydFxuLy8gICAtIHBhdXNlXG4vLyAgIC0gZmluaXNoXG4vLyAgIC0gZmFpbFxuZnVuY3Rpb24gVmlkZW8gKGRhdGEpIHtcbiAgdmFyIGF1dG9QbGF5ID0gZGF0YS5hdHRyLmF1dG9QbGF5XG4gIHZhciBwbGF5U3RhdHVzID0gZGF0YS5hdHRyLnBsYXlTdGF0dXNcbiAgdGhpcy5hdXRvUGxheSA9IGF1dG9QbGF5ID09PSB0cnVlIHx8IGF1dG9QbGF5ID09PSAndHJ1ZSdcbiAgaWYgKHBsYXlTdGF0dXMgIT09ICdwbGF5J1xuICAgICAgJiYgcGxheVN0YXR1cyAhPT0gJ3N0b3AnXG4gICAgICAmJiBwbGF5U3RhdHVzICE9PSAncGF1c2UnKSB7XG4gICAgdGhpcy5wbGF5U3RhdHVzID0gJ3BhdXNlJ1xuICB9IGVsc2Uge1xuICAgIHRoaXMucGxheVN0YXR1cyA9IHBsYXlTdGF0dXNcbiAgfVxuICBBdG9taWMuY2FsbCh0aGlzLCBkYXRhKVxufVxuXG5WaWRlby5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEF0b21pYy5wcm90b3R5cGUpXG5cblZpZGVvLnByb3RvdHlwZS5hdHRyID0ge1xuICBwbGF5U3RhdHVzOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgaWYgKHZhbCAhPT0gJ3BsYXknICYmIHZhbCAhPT0gJ3N0b3AnICYmIHZhbCAhPT0gJ3BhdXNlJykge1xuICAgICAgdmFsID0gJ3BhdXNlJ1xuICAgIH1cbiAgICBpZiAodGhpcy5wbGF5U3RhdHVzID09PSB2YWwpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLnBsYXlTdGF0dXMgPSB2YWxcbiAgICB0aGlzLm5vZGUuc2V0QXR0cmlidXRlKCdwbGF5LXN0YXR1cycsIHZhbClcbiAgICB0aGlzW3RoaXMucGxheVN0YXR1c10oKVxuICB9LFxuICBhdXRvUGxheTogZnVuY3Rpb24gKHZhbCkge1xuICAgIC8vIERPIE5PVEhJTkdcbiAgfVxufVxuXG5WaWRlby5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJylcbiAgbm9kZS5jbGFzc0xpc3QuYWRkKCd3ZWV4LXZpZGVvJywgJ3dlZXgtZWxlbWVudCcpXG4gIG5vZGUuY29udHJvbHMgPSB0cnVlXG4gIG5vZGUuYXV0b3BsYXkgPSB0aGlzLmF1dG9QbGF5XG4gIG5vZGUuc2V0QXR0cmlidXRlKCdwbGF5LXN0YXR1cycsIHRoaXMucGxheVN0YXR1cylcbiAgdGhpcy5ub2RlID0gbm9kZVxuICBpZiAodGhpcy5hdXRvUGxheSAmJiB0aGlzLnBsYXlTdGF0dXMgPT09ICdwbGF5Jykge1xuICAgIHRoaXMucGxheSgpXG4gIH1cbiAgcmV0dXJuIG5vZGVcbn1cblxuVmlkZW8ucHJvdG90eXBlLmJpbmRFdmVudHMgPSBmdW5jdGlvbiAoZXZ0cykge1xuICBBdG9taWMucHJvdG90eXBlLmJpbmRFdmVudHMuY2FsbCh0aGlzLCBldnRzKVxuXG4gIC8vIGNvbnZlcnQgdzNjLXZpZGVvIGV2ZW50cyB0byB3ZWV4LXZpZGVvIGV2ZW50cy5cbiAgdmFyIGV2dHNNYXAgPSB7XG4gICAgc3RhcnQ6ICdwbGF5JyxcbiAgICBmaW5pc2g6ICdlbmRlZCcsXG4gICAgZmFpbDogJ2Vycm9yJ1xuICB9XG4gIGZvciAodmFyIGV2dE5hbWUgaW4gZXZ0c01hcCkge1xuICAgIHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKGV2dHNNYXBbZXZ0TmFtZV0sIGZ1bmN0aW9uICh0eXBlLCBlKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQodHlwZSwgZS5kYXRhKVxuICAgIH0uYmluZCh0aGlzLCBldnROYW1lKSlcbiAgfVxufVxuXG5WaWRlby5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHNyYyA9IHRoaXMubm9kZS5nZXRBdHRyaWJ1dGUoJ3NyYycpXG4gIGlmICghc3JjKSB7XG4gICAgc3JjID0gdGhpcy5ub2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmMnKVxuICAgIHNyYyAmJiB0aGlzLm5vZGUuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpXG4gIH1cbiAgdGhpcy5ub2RlLnBsYXkoKVxufVxuXG5WaWRlby5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMubm9kZS5wYXVzZSgpXG59XG5cblZpZGVvLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLm5vZGUucGF1c2UoKVxuICB0aGlzLm5vZGUuYXV0b3BsYXkgPSBmYWxzZVxuICB0aGlzLm5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLXNyYycsIHRoaXMubm9kZS5zcmMpXG4gIHRoaXMubm9kZS5zcmMgPSAnJ1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZGVvXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvdmlkZW8uanNcbiAqKiBtb2R1bGUgaWQgPSA3MFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi92aWRlby5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vdmlkZW8uY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vdmlkZW8uY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3N0eWxlcy92aWRlby5jc3NcbiAqKiBtb2R1bGUgaWQgPSA3MVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIud2VleC12aWRlbyB7XFxuXFx0YmFja2dyb3VuZC1jb2xvcjogIzAwMDtcXG59XCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL3NyYy9zdHlsZXMvdmlkZW8uY3NzXG4gKiogbW9kdWxlIGlkID0gNzJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgQXRvbWljID0gcmVxdWlyZSgnLi9hdG9taWMnKVxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKVxucmVxdWlyZSgnLi4vc3R5bGVzL3N3aXRjaC5jc3MnKVxuXG52YXIgZGVmYXVsdHMgPSB7XG4gIGNvbG9yOiAnIzY0YmQ2MydcbiAgLCBzZWNvbmRhcnlDb2xvcjogJyNkZmRmZGYnXG4gICwgamFja0NvbG9yOiAnI2ZmZidcbiAgLCBqYWNrU2Vjb25kYXJ5Q29sb3I6IG51bGxcbiAgLCBjbGFzc05hbWU6ICd3ZWV4LXN3aXRjaCdcbiAgLCBkaXNhYmxlZE9wYWNpdHk6IDAuNVxuICAsIHNwZWVkOiAnMC40cydcbiAgLCB3aWR0aDogMTAwXG4gICwgaGVpZ2h0OiA2MFxuICAvLyBpcyB3aWR0aCBhbmQgaGVpZ2h0IHNjYWxhYmxlID9cbiAgLCBzY2FsYWJsZTogZmFsc2Vcbn1cblxuLy8gYXR0cnM6XG4vLyAgIC0gY2hlY2tlZDogaWYgaXMgY2hlY2tlZC5cbi8vICAgLSBkaXNhYmxlZDogaWYgdHJ1ZSwgdGhpcyBjb21wb25lbnQgaXMgbm90IGF2YWlsYWJsZSBmb3IgaW50ZXJhY3Rpb24uXG5mdW5jdGlvbiBTd2l0Y2ggKGRhdGEpIHtcbiAgdGhpcy5vcHRpb25zID0gdXRpbHMuZXh0ZW5kKHt9LCBkZWZhdWx0cylcbiAgdGhpcy5jaGVja2VkID0gZGF0YS5hdHRyLmNoZWNrZWRcbiAgICAgICYmIGRhdGEuYXR0ci5jaGVja2VkICE9PSAnZmFsc2UnID8gdHJ1ZSA6IGZhbHNlXG4gIHRoaXMuZGF0YSA9IGRhdGFcbiAgdGhpcy53aWR0aCA9IHRoaXMub3B0aW9ucy53aWR0aCAqIGRhdGEuc2NhbGVcbiAgdGhpcy5oZWlnaHQgPSB0aGlzLm9wdGlvbnMuaGVpZ2h0ICogZGF0YS5zY2FsZVxuICBBdG9taWMuY2FsbCh0aGlzLCBkYXRhKVxufVxuXG5Td2l0Y2gucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBdG9taWMucHJvdG90eXBlKVxuXG5Td2l0Y2gucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcbiAgdGhpcy5qYWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc21hbGwnKVxuICBub2RlLmFwcGVuZENoaWxkKHRoaXMuamFjaylcbiAgbm9kZS5jbGFzc05hbWUgPSB0aGlzLm9wdGlvbnMuY2xhc3NOYW1lXG4gIHRoaXMubm9kZSA9IG5vZGVcbiAgdGhpcy5hdHRyLmRpc2FibGVkLmNhbGwodGhpcywgdGhpcy5kYXRhLmF0dHIuZGlzYWJsZWQpXG4gIHJldHVybiBub2RlXG59XG5cblN3aXRjaC5wcm90b3R5cGUub25BcHBlbmQgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuc2V0U2l6ZSgpXG4gIHRoaXMuc2V0UG9zaXRpb24oKVxufVxuXG5Td2l0Y2gucHJvdG90eXBlLmF0dHIgPSB7XG4gIGRpc2FibGVkOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgdGhpcy5kaXNhYmxlZCA9IHZhbCAmJiB2YWwgIT09ICdmYWxzZSdcbiAgICAgICAgICAgICAgICAgICAgPyB0cnVlXG4gICAgICAgICAgICAgICAgICAgIDogZmFsc2VcbiAgICB0aGlzLmRpc2FibGVkID8gdGhpcy5kaXNhYmxlKCkgOiB0aGlzLmVuYWJsZSgpXG4gIH1cbn1cblxuU3dpdGNoLnByb3RvdHlwZS5zZXRTaXplID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWluID0gTWF0aC5taW4odGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpXG4gIHZhciBtYXggPSBNYXRoLm1heCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodClcbiAgdGhpcy5ub2RlLnN0eWxlLndpZHRoID0gbWF4ICsgJ3B4J1xuICB0aGlzLm5vZGUuc3R5bGUuaGVpZ2h0ID0gbWluICsgJ3B4J1xuICB0aGlzLm5vZGUuc3R5bGUuYm9yZGVyUmFkaXVzID0gbWluIC8gMiArICdweCdcbiAgdGhpcy5qYWNrLnN0eWxlLndpZHRoXG4gICAgICA9IHRoaXMuamFjay5zdHlsZS5oZWlnaHRcbiAgICAgID0gbWluICsgJ3B4J1xufVxuXG5Td2l0Y2gucHJvdG90eXBlLnNldFBvc2l0aW9uID0gZnVuY3Rpb24gKGNsaWNrZWQpIHtcbiAgdmFyIGNoZWNrZWQgPSB0aGlzLmNoZWNrZWRcbiAgdmFyIG5vZGUgPSB0aGlzLm5vZGVcbiAgdmFyIGphY2sgPSB0aGlzLmphY2tcblxuICBpZiAoY2xpY2tlZCAmJiBjaGVja2VkKSB7XG4gICAgY2hlY2tlZCA9IGZhbHNlXG4gIH0gZWxzZSBpZiAoY2xpY2tlZCAmJiAhY2hlY2tlZCkge1xuICAgIGNoZWNrZWQgPSB0cnVlXG4gIH1cblxuICBpZiAoY2hlY2tlZCA9PT0gdHJ1ZSkge1xuICAgIHRoaXMuY2hlY2tlZCA9IHRydWVcblxuICAgIGlmICh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSkge1xuICAgICAgamFjay5zdHlsZS5sZWZ0ID0gcGFyc2VJbnQod2luZG93LmdldENvbXB1dGVkU3R5bGUobm9kZSkud2lkdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAtIHBhcnNlSW50KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGphY2spLndpZHRoKSArICdweCdcbiAgICB9IGVsc2Uge1xuICAgICAgamFjay5zdHlsZS5sZWZ0ID0gcGFyc2VJbnQobm9kZS5jdXJyZW50U3R5bGVbJ3dpZHRoJ10pXG4gICAgICAgICAgICAgICAgICAgICAgICAtIHBhcnNlSW50KGphY2suY3VycmVudFN0eWxlWyd3aWR0aCddKSArICdweCdcbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuY29sb3IgJiYgdGhpcy5jb2xvcml6ZSgpXG4gICAgdGhpcy5zZXRTcGVlZCgpXG4gIH0gZWxzZSB7XG4gICAgdGhpcy5jaGVja2VkID0gZmFsc2VcbiAgICBqYWNrLnN0eWxlLmxlZnQgPSAwXG4gICAgbm9kZS5zdHlsZS5ib3hTaGFkb3cgPSAnaW5zZXQgMCAwIDAgMCAnICsgdGhpcy5vcHRpb25zLnNlY29uZGFyeUNvbG9yXG4gICAgbm9kZS5zdHlsZS5ib3JkZXJDb2xvciA9IHRoaXMub3B0aW9ucy5zZWNvbmRhcnlDb2xvclxuICAgIG5vZGUuc3R5bGUuYmFja2dyb3VuZENvbG9yXG4gICAgICAgID0gKHRoaXMub3B0aW9ucy5zZWNvbmRhcnlDb2xvciAhPT0gZGVmYXVsdHMuc2Vjb25kYXJ5Q29sb3IpXG4gICAgICAgICAgPyB0aGlzLm9wdGlvbnMuc2Vjb25kYXJ5Q29sb3JcbiAgICAgICAgICA6ICcjZmZmJ1xuICAgIGphY2suc3R5bGUuYmFja2dyb3VuZENvbG9yXG4gICAgICAgID0gKHRoaXMub3B0aW9ucy5qYWNrU2Vjb25kYXJ5Q29sb3IgIT09IHRoaXMub3B0aW9ucy5qYWNrQ29sb3IpXG4gICAgICAgICAgPyB0aGlzLm9wdGlvbnMuamFja1NlY29uZGFyeUNvbG9yXG4gICAgICAgICAgOiB0aGlzLm9wdGlvbnMuamFja0NvbG9yXG4gICAgdGhpcy5zZXRTcGVlZCgpXG4gIH1cbn1cblxuU3dpdGNoLnByb3RvdHlwZS5jb2xvcml6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGVIZWlnaHQgPSB0aGlzLm5vZGUub2Zmc2V0SGVpZ2h0IC8gMlxuXG4gIHRoaXMubm9kZS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuY29sb3JcbiAgdGhpcy5ub2RlLnN0eWxlLmJvcmRlckNvbG9yID0gdGhpcy5vcHRpb25zLmNvbG9yXG4gIHRoaXMubm9kZS5zdHlsZS5ib3hTaGFkb3cgPSAnaW5zZXQgMCAwIDAgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBub2RlSGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICArICdweCAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHRoaXMub3B0aW9ucy5jb2xvclxuICB0aGlzLmphY2suc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5vcHRpb25zLmphY2tDb2xvclxufVxuXG5Td2l0Y2gucHJvdG90eXBlLnNldFNwZWVkID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3dpdGNoZXJQcm9wID0ge31cbiAgdmFyIGphY2tQcm9wID0ge1xuICAgICAgJ2JhY2tncm91bmQtY29sb3InOiB0aGlzLm9wdGlvbnMuc3BlZWRcbiAgICAgICwgbGVmdDogdGhpcy5vcHRpb25zLnNwZWVkLnJlcGxhY2UoL1thLXpdLywgJycpIC8gMiArICdzJ1xuICAgIH1cblxuICBpZiAodGhpcy5jaGVja2VkKSB7XG4gICAgc3dpdGNoZXJQcm9wID0ge1xuICAgICAgYm9yZGVyOiB0aGlzLm9wdGlvbnMuc3BlZWRcbiAgICAgICwgJ2JveC1zaGFkb3cnOiB0aGlzLm9wdGlvbnMuc3BlZWRcbiAgICAgICwgJ2JhY2tncm91bmQtY29sb3InOiB0aGlzLm9wdGlvbnMuc3BlZWQucmVwbGFjZSgvW2Etel0vLCAnJykgKiAzICsgJ3MnXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHN3aXRjaGVyUHJvcCA9IHtcbiAgICAgIGJvcmRlcjogdGhpcy5vcHRpb25zLnNwZWVkXG4gICAgICAsICdib3gtc2hhZG93JzogdGhpcy5vcHRpb25zLnNwZWVkXG4gICAgfVxuICB9XG5cbiAgdXRpbHMudHJhbnNpdGlvbml6ZSh0aGlzLm5vZGUsIHN3aXRjaGVyUHJvcClcbiAgdXRpbHMudHJhbnNpdGlvbml6ZSh0aGlzLmphY2ssIGphY2tQcm9wKVxufVxuXG5Td2l0Y2gucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbiAoKSB7XG4gICF0aGlzLmRpc2FibGVkICYmICh0aGlzLmRpc2FibGVkID0gdHJ1ZSlcbiAgdGhpcy5ub2RlLnN0eWxlLm9wYWNpdHkgPSBkZWZhdWx0cy5kaXNhYmxlZE9wYWNpdHlcbiAgdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5nZXRDbGlja0hhbmRsZXIoKSlcbn1cblxuU3dpdGNoLnByb3RvdHlwZS5lbmFibGUgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZGlzYWJsZWQgJiYgKHRoaXMuZGlzYWJsZWQgPSBmYWxzZSlcbiAgdGhpcy5ub2RlLnN0eWxlLm9wYWNpdHkgPSAxXG4gIHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuZ2V0Q2xpY2tIYW5kbGVyKCkpXG59XG5cblN3aXRjaC5wcm90b3R5cGUuZ2V0Q2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuX2NsaWNrSGFuZGxlcikge1xuICAgIHRoaXMuX2NsaWNrSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIHZhciBwYXJlbnQgPSB0aGlzLm5vZGUucGFyZW50Tm9kZS50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgIC8vIHZhciBsYWJlbFBhcmVudCA9IChwYXJlbnQgPT09ICdsYWJlbCcpID8gZmFsc2UgOiB0cnVlXG4gICAgICB0aGlzLnNldFBvc2l0aW9uKHRydWUpXG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ2NoYW5nZScsIHtcbiAgICAgICAgY2hlY2tlZDogdGhpcy5jaGVja2VkXG4gICAgICB9KVxuICAgIH0uYmluZCh0aGlzKVxuICB9XG4gIHJldHVybiB0aGlzLl9jbGlja0hhbmRsZXJcbn1cblxuU3dpdGNoLnByb3RvdHlwZS5zdHlsZVxuICAgID0gdXRpbHMuZXh0ZW5kKE9iamVjdC5jcmVhdGUoQXRvbWljLnByb3RvdHlwZS5zdHlsZSksIHtcblxuICAgICAgd2lkdGg6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuc2NhbGFibGUpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB2YWwgPSBwYXJzZUZsb2F0KHZhbClcbiAgICAgICAgaWYgKHZhbCAhPT0gdmFsIHx8IHZhbCA8IDApIHsgLy8gTmFOXG4gICAgICAgICAgdmFsID0gdGhpcy5vcHRpb25zLndpZHRoXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53aWR0aCA9IHZhbCAqIHRoaXMuZGF0YS5zY2FsZVxuICAgICAgICB0aGlzLnNldFNpemUoKVxuICAgICAgfSxcblxuICAgICAgaGVpZ2h0OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLnNjYWxhYmxlKSB7XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgdmFsID0gcGFyc2VGbG9hdCh2YWwpXG4gICAgICAgIGlmICh2YWwgIT09IHZhbCB8fCB2YWwgPCAwKSB7IC8vIE5hTlxuICAgICAgICAgIHZhbCA9IHRoaXMub3B0aW9ucy5oZWlnaHRcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhlaWdodCA9IHZhbCAqIHRoaXMuZGF0YS5zY2FsZVxuICAgICAgICB0aGlzLnNldFNpemUoKVxuICAgICAgfVxuXG4gICAgfSlcblxubW9kdWxlLmV4cG9ydHMgPSBTd2l0Y2hcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvY29tcG9uZW50cy9zd2l0Y2guanNcbiAqKiBtb2R1bGUgaWQgPSA3M1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9zd2l0Y2guY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL3N3aXRjaC5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9zd2l0Y2guY3NzXCIpO1xuXHRcdFx0aWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG5cdFx0XHR1cGRhdGUobmV3Q29udGVudCk7XG5cdFx0fSk7XG5cdH1cblx0Ly8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuXHRtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3N0eWxlcy9zd2l0Y2guY3NzXG4gKiogbW9kdWxlIGlkID0gNzRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLyogc3dpdGNoIGRlZmF1bHRzLiAqL1xcbi53ZWV4LXN3aXRjaCB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xcbiAgYm9yZGVyOiAxcHggc29saWQgI2RmZGZkZjtcXG4gIGN1cnNvcjogcG9pbnRlcjtcXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG4gIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XFxuICAtbW96LXVzZXItc2VsZWN0OiBub25lO1xcbiAgLWtodG1sLXVzZXItc2VsZWN0OiBub25lO1xcbiAgLXdlYmtpdC11c2VyLXNlbGVjdDogbm9uZTtcXG4gIC1tcy11c2VyLXNlbGVjdDogbm9uZTtcXG4gIHVzZXItc2VsZWN0OiBub25lO1xcbiAgYm94LXNpemluZzogY29udGVudC1ib3g7XFxuICBiYWNrZ3JvdW5kLWNsaXA6IGNvbnRlbnQtYm94O1xcbn1cXG5cXG4ud2VleC1zd2l0Y2ggPiBzbWFsbCB7XFxuICBiYWNrZ3JvdW5kOiAjZmZmO1xcbiAgYm9yZGVyLXJhZGl1czogMTAwJTtcXG4gIGJveC1zaGFkb3c6IDAgMXB4IDNweCByZ2JhKDAsIDAsIDAsIDAuNCk7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICB0b3A6IDA7XFxufVxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9zcmMvc3R5bGVzL3N3aXRjaC5jc3NcbiAqKiBtb2R1bGUgaWQgPSA3NVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBsb2dnZXIgPSByZXF1aXJlKCcuLi9sb2dnZXInKVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoJy4vY29tcG9uZW50JylcblxuLy8gYXR0cnM6XG4vLyAgIC0gaHJlZlxuZnVuY3Rpb24gQSAoZGF0YSkge1xuICBDb21wb25lbnQuY2FsbCh0aGlzLCBkYXRhKVxufVxuXG5BLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ29tcG9uZW50LnByb3RvdHlwZSlcblxuQS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxuICBub2RlLmNsYXNzTGlzdC5hZGQoJ3dlZXgtY29udGFpbmVyJylcbiAgbm9kZS5zdHlsZS50ZXh0RGVjb3JhdGlvbiA9ICdub25lJ1xuICByZXR1cm4gbm9kZVxufVxuXG5BLnByb3RvdHlwZS5hdHRyID0ge1xuICBocmVmOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgaWYgKCF2YWwpIHtcbiAgICAgIHJldHVybiBsb2dnZXIud2FybignaHJlZiBvZiA8YT4gc2hvdWxkIG5vdCBiZSBhIG51bGwgdmFsdWUuJylcbiAgICB9XG4gICAgdGhpcy5ocmVmID0gdmFsXG4gICAgdGhpcy5ub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ocmVmJywgdmFsKVxuICB9XG59XG5cbkEucHJvdG90eXBlLmJpbmRFdmVudHMgPSBmdW5jdGlvbiAoZXZ0cykge1xuICAvLyBldmVudCBoYW5kbGVyIGZvciBjbGljayBldmVudCB3aWxsIGJlIHByb2Nlc3NlZFxuICAvLyBiZWZvcmUgdGhlIHVybCByZWRpcmVjdGlvbi5cbiAgQ29tcG9uZW50LnByb3RvdHlwZS5iaW5kRXZlbnRzLmNhbGwodGhpcywgZXZ0cylcbiAgdGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmIChldnQuX2FscmVhZHlGaXJlZCAmJiBldnQudGFyZ2V0ICE9PSB0aGlzLm5vZGUpIHtcbiAgICAgIC8vIGlmIHRoZSBldmVudCB0YXJnZXQgaXMgdGhpcy5ub2RlLCB0aGVuIHRoaXMgaXNcbiAgICAgIC8vIGp1c3QgYW5vdGhlciBjbGljayBldmVudCBoYW5kbGVyIGZvciB0aGUgc2FtZVxuICAgICAgLy8gdGFyZ2V0LCBub3QgYSBoYW5kbGVyIGZvciBhIGJ1YmJsaW5nIHVwIGV2ZW50LFxuICAgICAgLy8gb3RoZXJ3aXNlIGl0IGlzIGEgYnViYmxpbmcgdXAgZXZlbnQsIGFuZCBpdFxuICAgICAgLy8gc2hvdWxkIGJlIGRpc3JlZ2FyZGVkLlxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGV2dC5fYWxyZWFkeUZpcmVkID0gdHJ1ZVxuICAgIGxvY2F0aW9uLmhyZWYgPSB0aGlzLmhyZWZcbiAgfS5iaW5kKHRoaXMpKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvY29tcG9uZW50cy9hLmpzXG4gKiogbW9kdWxlIGlkID0gNzZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9jb21wb25lbnQnKVxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKVxuXG52YXIgSURfUFJFRklYID0gJ3dlZXhfZW1iZWRfJ1xuXG5mdW5jdGlvbiBfZ2VuZXJhdGVJZCgpIHtcbiAgcmV0dXJuIElEX1BSRUZJWCArIHV0aWxzLmdldFJhbmRvbSgxMClcbn1cblxuZnVuY3Rpb24gRW1iZWQgKGRhdGEsIG5vZGVUeXBlKSB7XG4gIHZhciBhdHRyID0gZGF0YS5hdHRyXG4gIGlmIChhdHRyKSB7XG4gICAgdGhpcy5zb3VyY2UgPSBhdHRyLnNyY1xuICAgIHRoaXMubG9hZGVyID0gYXR0ci5sb2FkZXIgfHwgJ3hocidcbiAgICB0aGlzLmpzb25wQ2FsbGJhY2sgPSBhdHRyLmpzb25wQ2FsbGJhY2tcbiAgfVxuICBDb21wb25lbnQuY2FsbCh0aGlzLCBkYXRhLCBub2RlVHlwZSlcbn1cblxuRW1iZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDb21wb25lbnQucHJvdG90eXBlKVxuXG5FbWJlZC5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIG5vZGUuaWQgPSB0aGlzLmlkXG4gIG5vZGUuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJ1xuICByZXR1cm4gbm9kZVxufVxuXG5FbWJlZC5wcm90b3R5cGUuaW5pdFdlZXggPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuaWQgPSBfZ2VuZXJhdGVJZCgpXG4gIHRoaXMubm9kZS5pZCA9IHRoaXMuaWRcbiAgdmFyIGNvbmZpZyA9IHtcbiAgICBhcHBJZDogdGhpcy5pZCxcbiAgICBzb3VyY2U6IHRoaXMuc291cmNlLFxuICAgIGJ1bmRsZVVybDogdGhpcy5zb3VyY2UsXG4gICAgbG9hZGVyOiB0aGlzLmxvYWRlcixcbiAgICBqc29ucENhbGxiYWNrOiB0aGlzLmpzb25wQ2FsbGJhY2ssXG4gICAgd2lkdGg6IHRoaXMubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCxcbiAgICByb290SWQ6IHRoaXMuaWQsXG4gICAgZW1iZWQ6IHRydWVcbiAgfVxuICB3aW5kb3cud2VleC5pbml0KGNvbmZpZylcbn1cblxuRW1iZWQucHJvdG90eXBlLmRlc3Ryb3lXZWV4ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmlkICYmIHdpbmRvdy5kZXN0cm95SW5zdGFuY2UodGhpcy5pZClcbiAgLy8gVE9ETzogdW5iaW5kIGV2ZW50cyBhbmQgY2xlYXIgZG9tcy5cbiAgdGhpcy5ub2RlLmlubmVySFRNTCA9ICcnXG59XG5cbkVtYmVkLnByb3RvdHlwZS5yZWxvYWRXZWV4ID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5pZCkge1xuICAgIHRoaXMuZGVzdHJveVdlZXgoKVxuICAgIHRoaXMuaWQgPSBudWxsXG4gICAgdGhpcy5ub2RlLmlkID0gbnVsbFxuICAgIHRoaXMubm9kZS5pbm5lckhUTUwgPSAnJ1xuICB9XG4gIHRoaXMuaW5pdFdlZXgoKVxufVxuXG4vLyBub3QgcmVjb21tZW5kZWQsIGJlY2F1c2Ugb2YgdGhlIGxlYWsgb2YgbWVtb3J5LlxuRW1iZWQucHJvdG90eXBlLmF0dHIgPSB7XG4gIHNyYzogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5zb3VyY2UgPSB2YWx1ZVxuICAgIHRoaXMucmVsb2FkV2VleCgpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFbWJlZFxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9jb21wb25lbnRzL2VtYmVkLmpzXG4gKiogbW9kdWxlIGlkID0gNzdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9jb21wb25lbnQnKVxuXG5yZXF1aXJlKCcuLi9zdHlsZXMvcmVmcmVzaC5jc3MnKVxuXG52YXIgcGFyZW50cyA9IFsnc2Nyb2xsZXInLCAnbGlzdCddXG5cbi8vIE9ubHkgaWYgcHVsbGRvd24gb2Zmc2V0IGlzIGxhcmdlciB0aGFuIHRoaXMgdmFsdWUgY2FuIHRoaXNcbi8vIGNvbXBvbmVudCB0cmlnZ2VyIHRoZSAncmVmcmVzaCcgZXZlbnQsIG90aGVyd2lzZSBqdXN0IHJlY292ZXJcbi8vIHRvIHRoZSBzdGFydCBwb2ludC5cbnZhciBDTEFNUCA9IDEzMFxuXG52YXIgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudFxudmFyIEZpcmVmb3ggPSAhIXVhLm1hdGNoKC9GaXJlZm94L2kpXG52YXIgSUVNb2JpbGUgPSAhIXVhLm1hdGNoKC9JRU1vYmlsZS9pKVxudmFyIGNzc1ByZWZpeCA9IEZpcmVmb3ggPyAnLW1vei0nIDogSUVNb2JpbGUgPyAnLW1zLScgOiAnLXdlYmtpdC0nXG5cbmZ1bmN0aW9uIFJlZnJlc2ggKGRhdGEpIHtcbiAgQ29tcG9uZW50LmNhbGwodGhpcywgZGF0YSlcbn1cblxuUmVmcmVzaC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKENvbXBvbmVudC5wcm90b3R5cGUpXG5cblJlZnJlc2gucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBub2RlLmNsYXNzTGlzdC5hZGQoJ3dlZXgtY29udGFpbmVyJywgJ3dlZXgtcmVmcmVzaCcpXG4gIHJldHVybiBub2RlXG59XG5cblJlZnJlc2gucHJvdG90eXBlLm9uQXBwZW5kID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcGFyZW50ID0gdGhpcy5nZXRQYXJlbnQoKVxuICB2YXIgc2VsZiA9IHRoaXNcbiAgaWYgKHBhcmVudHMuaW5kZXhPZihwYXJlbnQuZGF0YS50eXBlKSA9PT0gLTEpIHtcbiAgICByZXR1cm5cbiAgfVxuICBwYXJlbnQuc2Nyb2xsZXIuYWRkRXZlbnRMaXN0ZW5lcigncHVsbGRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgIHNlbGYuYWRqdXN0SGVpZ2h0KE1hdGguYWJzKGUuc2Nyb2xsT2JqLmdldFNjcm9sbFRvcCgpKSlcbiAgICBpZiAoIXRoaXMuZGlzcGxheSkge1xuICAgICAgc2VsZi5zaG93KClcbiAgICB9XG4gIH0pXG4gIHBhcmVudC5zY3JvbGxlci5hZGRFdmVudExpc3RlbmVyKCdwdWxsZG93bmVuZCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIHRvcCA9IE1hdGguYWJzKGUuc2Nyb2xsT2JqLmdldFNjcm9sbFRvcCgpKVxuICAgIGlmICh0b3AgPiBDTEFNUCkge1xuICAgICAgc2VsZi5oYW5kbGVSZWZyZXNoKGUpXG4gICAgfVxuICB9KVxufVxuXG5SZWZyZXNoLnByb3RvdHlwZS5hZGp1c3RIZWlnaHQgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHRoaXMubm9kZS5zdHlsZS5oZWlnaHQgPSB2YWwgKyAncHgnXG4gIHRoaXMubm9kZS5zdHlsZS50b3AgPSAtdmFsICsgJ3B4J1xufVxuXG5SZWZyZXNoLnByb3RvdHlwZS5oYW5kbGVSZWZyZXNoID0gZnVuY3Rpb24gKGUpIHtcbiAgdmFyIHNjcm9sbE9iaiA9IGUuc2Nyb2xsT2JqXG4gIHZhciBwYXJlbnQgPSB0aGlzLmdldFBhcmVudCgpXG4gIHZhciBzY3JvbGxFbGVtZW50ID0gcGFyZW50LnNjcm9sbEVsZW1lbnQgfHwgcGFyZW50Lmxpc3RFbGVtZW50XG4gIHRoaXMubm9kZS5zdHlsZS5oZWlnaHQgPSBDTEFNUCArICdweCdcbiAgdGhpcy5ub2RlLnN0eWxlLnRvcCA9IC1DTEFNUCArICdweCdcbiAgdmFyIHRyYW5zbGF0ZVN0ciA9ICd0cmFuc2xhdGUzZCgwcHgsJyArIENMQU1QICsgJ3B4LDBweCknXG4gIHNjcm9sbEVsZW1lbnQuc3R5bGVbY3NzUHJlZml4ICsgJ3RyYW5zZm9ybSddXG4gICAgPSBjc3NQcmVmaXggKyB0cmFuc2xhdGVTdHJcbiAgc2Nyb2xsRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSB0cmFuc2xhdGVTdHJcbiAgdGhpcy5kaXNwYXRjaEV2ZW50KCdyZWZyZXNoJylcbn1cblxuUmVmcmVzaC5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kaXNwbGF5ID0gdHJ1ZVxuICB0aGlzLm5vZGUuc3R5bGUuZGlzcGxheSA9ICctd2Via2l0LWJveCdcbiAgdGhpcy5ub2RlLnN0eWxlLmRpc3BsYXkgPSAnLXdlYmtpdC1mbGV4J1xuICB0aGlzLm5vZGUuc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xufVxuXG5SZWZyZXNoLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmRpc3BsYXkgPSBmYWxzZVxuICB2YXIgcGFyZW50ID0gdGhpcy5nZXRQYXJlbnQoKVxuICBpZiAocGFyZW50KSB7XG4gICAgdmFyIHNjcm9sbEVsZW1lbnQgPSBwYXJlbnQuc2Nyb2xsRWxlbWVudCB8fCBwYXJlbnQubGlzdEVsZW1lbnRcbiAgICB2YXIgdHJhbnNsYXRlU3RyID0gJ3RyYW5zbGF0ZTNkKDBweCwwcHgsMHB4KSdcbiAgICBzY3JvbGxFbGVtZW50LnN0eWxlW2Nzc1ByZWZpeCArICd0cmFuc2Zvcm0nXVxuICAgICAgPSBjc3NQcmVmaXggKyB0cmFuc2xhdGVTdHJcbiAgICBzY3JvbGxFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IHRyYW5zbGF0ZVN0clxuICB9XG4gIHRoaXMubm9kZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG59XG5cblJlZnJlc2gucHJvdG90eXBlLmF0dHIgPSB7XG4gIGRpc3BsYXk6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICBpZiAodmFsID09PSAnc2hvdycpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNob3coKVxuICAgICAgfS5iaW5kKHRoaXMpLCAwKVxuICAgIH0gZWxzZSBpZiAodmFsID09PSAnaGlkZScpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmhpZGUoKVxuICAgICAgfS5iaW5kKHRoaXMpLCAwKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPXG4gICAgICBjb25zb2xlLmVycm9yKCdoNXJlbmRlcjphdHRyaWJ1dGUgdmFsdWUgb2YgcmVmcmVzaCBcXCdkaXNwbGF5XFwnICdcbiAgICAgICAgICArIHZhbFxuICAgICAgICAgICsgJyBpcyBpbnZhbGlkLiBTaG91bGQgYmUgXFwnc2hvd1xcJyBvciBcXCdoaWRlXFwnJylcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWZyZXNoXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvcmVmcmVzaC5qc1xuICoqIG1vZHVsZSBpZCA9IDc4XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL3JlZnJlc2guY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL3JlZnJlc2guY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcmVmcmVzaC5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvc3R5bGVzL3JlZnJlc2guY3NzXG4gKiogbW9kdWxlIGlkID0gNzlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLndlZXgtcmVmcmVzaCB7XFxuICAvLyAtd2Via2l0LWJveC1hbGlnbjogY2VudGVyO1xcbiAgLy8gLXdlYmtpdC1hbGlnbi1pdGVtczogY2VudGVyO1xcbiAgLy8gYWxpZ24taXRlbXM6IGNlbnRlcjtcXG4gIC8vIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcXG4gIC8vIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBjZW50ZXI7XFxuICAvLyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXG4gIG92ZXJmbG93OiBoaWRkZW47XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICB0b3A6IDA7XFxuICBsZWZ0OiAwO1xcbiAgd2lkdGg6IDEwMCU7XFxuICBoZWlnaHQ6IDA7XFxufVwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9zcmMvc3R5bGVzL3JlZnJlc2guY3NzXG4gKiogbW9kdWxlIGlkID0gODBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9jb21wb25lbnQnKVxuXG5yZXF1aXJlKCcuLi9zdHlsZXMvbG9hZGluZy5jc3MnKVxuXG52YXIgcGFyZW50cyA9IFsnc2Nyb2xsZXInLCAnbGlzdCddXG5cbnZhciBERUZBVUxUX0hFSUdIVCA9IDEzMFxuXG52YXIgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudFxudmFyIEZpcmVmb3ggPSAhIXVhLm1hdGNoKC9GaXJlZm94L2kpXG52YXIgSUVNb2JpbGUgPSAhIXVhLm1hdGNoKC9JRU1vYmlsZS9pKVxudmFyIGNzc1ByZWZpeCA9IEZpcmVmb3ggPyAnLW1vei0nIDogSUVNb2JpbGUgPyAnLW1zLScgOiAnLXdlYmtpdC0nXG5cbmZ1bmN0aW9uIExvYWRpbmcgKGRhdGEpIHtcbiAgQ29tcG9uZW50LmNhbGwodGhpcywgZGF0YSlcbn1cblxuTG9hZGluZy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKENvbXBvbmVudC5wcm90b3R5cGUpXG5cbkxvYWRpbmcucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBub2RlLmNsYXNzTGlzdC5hZGQoJ3dlZXgtY29udGFpbmVyJywgJ3dlZXgtbG9hZGluZycpXG4gIHJldHVybiBub2RlXG59XG5cbkxvYWRpbmcucHJvdG90eXBlLm9uQXBwZW5kID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcGFyZW50ID0gdGhpcy5nZXRQYXJlbnQoKVxuICB2YXIgc2VsZiA9IHRoaXNcbiAgdmFyIHNjcm9sbFdyYXBIZWlnaHQgPSBwYXJlbnQubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgaWYgKHBhcmVudHMuaW5kZXhPZihwYXJlbnQuZGF0YS50eXBlKSA9PT0gLTEpIHtcbiAgICByZXR1cm5cbiAgfVxuICBwYXJlbnQuc2Nyb2xsZXIuYWRkRXZlbnRMaXN0ZW5lcigncHVsbHVwJywgZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgb2JqID0gZS5zY3JvbGxPYmpcbiAgICBzZWxmLmFkanVzdEhlaWdodChNYXRoLmFicyhcbiAgICAgIG9iai5nZXRTY3JvbGxIZWlnaHQoKSAtIG9iai5nZXRTY3JvbGxUb3AoKSAtIHNjcm9sbFdyYXBIZWlnaHQpKVxuICAgIGlmICghc2VsZi5kaXNwbGF5KSB7XG4gICAgICBzZWxmLnNob3coKVxuICAgIH1cbiAgfSlcbiAgcGFyZW50LnNjcm9sbGVyLmFkZEV2ZW50TGlzdGVuZXIoJ3B1bGx1cGVuZCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgc2VsZi5oYW5kbGVMb2FkaW5nKGUpXG4gIH0pXG59XG5cbkxvYWRpbmcucHJvdG90eXBlLmFkanVzdEhlaWdodCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgdGhpcy5ub2RlLnN0eWxlLmhlaWdodCA9IHZhbCArICdweCdcbiAgdGhpcy5ub2RlLnN0eWxlLmJvdHRvbSA9IC12YWwgKyAncHgnXG59XG5cbkxvYWRpbmcucHJvdG90eXBlLmhhbmRsZUxvYWRpbmcgPSBmdW5jdGlvbiAoZSkge1xuICB2YXIgcGFyZW50ID0gdGhpcy5nZXRQYXJlbnQoKVxuICB2YXIgc2Nyb2xsRWxlbWVudCA9IHBhcmVudC5zY3JvbGxFbGVtZW50IHx8IHBhcmVudC5saXN0RWxlbWVudFxuICB2YXIgb2Zmc2V0ID0gc2Nyb2xsRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgICAgICAgICAgIC0gcGFyZW50Lm5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0XG4gICAgICAgICAgICArIERFRkFVTFRfSEVJR0hUXG4gIHRoaXMubm9kZS5zdHlsZS5oZWlnaHQgPSBERUZBVUxUX0hFSUdIVCArICdweCdcbiAgdGhpcy5ub2RlLnN0eWxlLmJvdHRvbSA9IC1ERUZBVUxUX0hFSUdIVCArICdweCdcbiAgdmFyIHRyYW5zbGF0ZVN0ciA9ICd0cmFuc2xhdGUzZCgwcHgsLScgKyBvZmZzZXQgKyAncHgsMHB4KSdcbiAgc2Nyb2xsRWxlbWVudC5zdHlsZVtjc3NQcmVmaXggKyAndHJhbnNmb3JtJ11cbiAgICA9IGNzc1ByZWZpeCArIHRyYW5zbGF0ZVN0clxuICBzY3JvbGxFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IHRyYW5zbGF0ZVN0clxuICB0aGlzLmRpc3BhdGNoRXZlbnQoJ2xvYWRpbmcnKVxufVxuXG5Mb2FkaW5nLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmRpc3BsYXkgPSB0cnVlXG4gIHRoaXMubm9kZS5zdHlsZS5kaXNwbGF5ID0gJy13ZWJraXQtYm94J1xuICB0aGlzLm5vZGUuc3R5bGUuZGlzcGxheSA9ICctd2Via2l0LWZsZXgnXG4gIHRoaXMubm9kZS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnXG59XG5cbkxvYWRpbmcucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZGlzcGxheSA9IGZhbHNlXG4gIHZhciBwYXJlbnQgPSB0aGlzLmdldFBhcmVudCgpXG4gIGlmIChwYXJlbnQpIHtcbiAgICB2YXIgc2Nyb2xsRWxlbWVudCA9IHBhcmVudC5zY3JvbGxFbGVtZW50IHx8IHBhcmVudC5saXN0RWxlbWVudFxuICAgIHZhciBzY3JvbGxFbGVtZW50SGVpZ2h0ID0gc2Nyb2xsRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgICB2YXIgc2Nyb2xsV3JhcEhlaWdodCA9IHBhcmVudC5ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodFxuICAgIHZhciBsZWZ0ID0gc2Nyb2xsRWxlbWVudEhlaWdodFxuICAgICAgLSBwYXJlbnQuc2Nyb2xsZXIuZ2V0U2Nyb2xsVG9wKClcbiAgICAgIC0gc2Nyb2xsV3JhcEhlaWdodFxuICAgIGlmIChsZWZ0IDwgMCkge1xuICAgICAgdmFyIG9mZnNldCA9IHNjcm9sbEVsZW1lbnRIZWlnaHRcbiAgICAgICAgICAgICAgLSBwYXJlbnQubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgICAgIHZhciB0cmFuc2xhdGVTdHIgPSAndHJhbnNsYXRlM2QoMHB4LC0nICsgb2Zmc2V0ICsgJ3B4LDBweCknXG4gICAgICBzY3JvbGxFbGVtZW50LnN0eWxlW2Nzc1ByZWZpeCArICd0cmFuc2Zvcm0nXVxuICAgICAgICA9IGNzc1ByZWZpeCArIHRyYW5zbGF0ZVN0clxuICAgICAgc2Nyb2xsRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSB0cmFuc2xhdGVTdHJcbiAgICB9XG4gIH1cbiAgdGhpcy5ub2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbn1cblxuTG9hZGluZy5wcm90b3R5cGUuYXR0ciA9IHtcbiAgZGlzcGxheTogZnVuY3Rpb24gKHZhbCkge1xuICAgIGlmICh2YWwgPT09ICdzaG93Jykge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc2hvdygpXG4gICAgICB9LmJpbmQodGhpcyksIDApXG4gICAgfSBlbHNlIGlmICh2YWwgPT09ICdoaWRlJykge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaGlkZSgpXG4gICAgICB9LmJpbmQodGhpcyksIDApXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE9cbiAgICAgIGNvbnNvbGUuZXJyb3IoJ2g1cmVuZGVyOmF0dHJpYnV0ZSB2YWx1ZSBvZiByZWZyZXNoIFxcJ2Rpc3BsYXlcXCcgJ1xuICAgICAgICAgICsgdmFsXG4gICAgICAgICAgKyAnIGlzIGludmFsaWQuIFNob3VsZCBiZSBcXCdzaG93XFwnIG9yIFxcJ2hpZGVcXCcnKVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRpbmdcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvY29tcG9uZW50cy9sb2FkaW5nLmpzXG4gKiogbW9kdWxlIGlkID0gODFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vbG9hZGluZy5jc3NcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vbG9hZGluZy5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9sb2FkaW5nLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9zdHlsZXMvbG9hZGluZy5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4MlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIud2VleC1sb2FkaW5nIHtcXG4gIC8vIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XFxuICAvLyAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XFxuICAvLyBhbGlnbi1pdGVtczogY2VudGVyO1xcbiAgLy8gLXdlYmtpdC1ib3gtcGFjazogY2VudGVyO1xcbiAgLy8gLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXG4gIC8vIGp1c3RpZnktY29udGVudDogY2VudGVyO1xcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIGJvdHRvbTogMDtcXG4gIGxlZnQ6IDA7XFxuICB3aWR0aDogMTAwJTtcXG4gIGhlaWdodDogMDtcXG59XCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL3NyYy9zdHlsZXMvbG9hZGluZy5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4M1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBBdG9taWMgPSByZXF1aXJlKCcuL2F0b21pYycpXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpXG5cbnJlcXVpcmUoJy4uL3N0eWxlcy9zcGlubmVyLmNzcycpXG5cbmZ1bmN0aW9uIFNwaW5uZXIgKGRhdGEpIHtcbiAgQXRvbWljLmNhbGwodGhpcywgZGF0YSlcbn1cblxuU3Bpbm5lci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEF0b21pYy5wcm90b3R5cGUpXG5cblNwaW5uZXIucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBub2RlLmNsYXNzTGlzdC5hZGQoJ3dlZXgtY29udGFpbmVyJywgJ3dlZXgtc3Bpbm5lci13cmFwJylcbiAgdGhpcy5zcGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgdGhpcy5zcGlubmVyLmNsYXNzTGlzdC5hZGQoJ3dlZXgtZWxlbWVudCcsICd3ZWV4LXNwaW5uZXInKVxuICBub2RlLmFwcGVuZENoaWxkKHRoaXMuc3Bpbm5lcilcbiAgcmV0dXJuIG5vZGVcbn1cblxuU3Bpbm5lci5wcm90b3R5cGUudXBkYXRlU3R5bGUgPSBmdW5jdGlvbiAoc3R5bGUpIHtcbiAgQXRvbWljLnByb3RvdHlwZS51cGRhdGVTdHlsZS5jYWxsKHRoaXMsIHN0eWxlKVxuICBpZiAoc3R5bGUgJiYgc3R5bGUuY29sb3IpIHtcbiAgICB0aGlzLnNldEtleWZyYW1lQ29sb3IodXRpbHMuZ2V0UmdiKHRoaXMubm9kZS5zdHlsZS5jb2xvcikpXG4gIH1cbn1cblxuU3Bpbm5lci5wcm90b3R5cGUuZ2V0U3R5bGVTaGVldCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuc3R5bGVTaGVldCkge1xuICAgIHJldHVyblxuICB9XG4gIHZhciBzdHlsZXMgPSBkb2N1bWVudC5zdHlsZVNoZWV0c1xuICBvdXRlcjogZm9yICh2YXIgaSA9IDAsIGwgPSBzdHlsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIHJ1bGVzID0gc3R5bGVzW2ldLnJ1bGVzXG4gICAgZm9yICh2YXIgaiA9IDAsIG0gPSBydWxlcy5sZW5ndGg7IGogPCBtOyBqKyspIHtcbiAgICAgIHZhciBpdGVtID0gcnVsZXMuaXRlbShqKVxuICAgICAgaWYgKFxuICAgICAgICAoaXRlbS50eXBlID09PSBDU1NSdWxlLktFWUZSQU1FU19SVUxFXG4gICAgICAgICAgfHwgaXRlbS50eXBlID09PSBDU1NSdWxlLldFQktJVF9LRVlGUkFNRVNfUlVMRSlcbiAgICAgICAgJiYgaXRlbS5uYW1lID09PSAnc3Bpbm5lcicpIHtcbiAgICAgICAgYnJlYWsgb3V0ZXJcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdGhpcy5zdHlsZVNoZWV0ID0gc3R5bGVzW2ldXG59XG5cblNwaW5uZXIucHJvdG90eXBlLnNldEtleWZyYW1lQ29sb3IgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHRoaXMuZ2V0U3R5bGVTaGVldCgpXG4gIHZhciBrZXlmcmFtZVJ1bGVzID0gdGhpcy5jb21wdXRlS2V5RnJhbWVSdWxlcyh2YWwpXG4gIHZhciBydWxlcywgaXRlbSwgY3NzUnVsZXMsIGtleWZyYW1lXG4gIHJ1bGVzID0gdGhpcy5zdHlsZVNoZWV0LnJ1bGVzXG4gIGZvciAodmFyIGkgPSAwLCBsID0gcnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaXRlbSA9IHJ1bGVzLml0ZW0oaSlcbiAgICBpZiAoKGl0ZW0udHlwZSA9PT0gQ1NTUnVsZS5LRVlGUkFNRVNfUlVMRVxuICAgICAgICAgIHx8IGl0ZW0udHlwZSA9PT0gQ1NTUnVsZS5XRUJLSVRfS0VZRlJBTUVTX1JVTEUpXG4gICAgICAgICYmIGl0ZW0ubmFtZSA9PT0gJ3NwaW5uZXInKSB7XG4gICAgICBjc3NSdWxlcyA9IGl0ZW0uY3NzUnVsZXNcbiAgICAgIGZvciAodmFyIGogPSAwLCBtID0gY3NzUnVsZXMubGVuZ3RoOyBqIDwgbTsgaisrKSB7XG4gICAgICAgIGtleWZyYW1lID0gY3NzUnVsZXNbal1cbiAgICAgICAgaWYgKGtleWZyYW1lLnR5cGUgPT09IENTU1J1bGUuS0VZRlJBTUVfUlVMRVxuICAgICAgICAgIHx8IGtleWZyYW1lLnR5cGUgPT09IENTU1J1bGUuV0VCS0lUX0tFWUZSQU1FX1JVTEUpIHtcbiAgICAgICAgICBrZXlmcmFtZS5zdHlsZS5ib3hTaGFkb3cgPSBrZXlmcmFtZVJ1bGVzW2pdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuU3Bpbm5lci5wcm90b3R5cGUuY29tcHV0ZUtleUZyYW1lUnVsZXMgPSBmdW5jdGlvbiAocmdiKSB7XG4gIGlmICghcmdiKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIHNjYWxlQXJyID0gW1xuICAgICcwZW0gLTIuNmVtIDBlbSAwZW0nLFxuICAgICcxLjhlbSAtMS44ZW0gMCAwZW0nLFxuICAgICcyLjVlbSAwZW0gMCAwZW0nLFxuICAgICcxLjc1ZW0gMS43NWVtIDAgMGVtJyxcbiAgICAnMGVtIDIuNWVtIDAgMGVtJyxcbiAgICAnLTEuOGVtIDEuOGVtIDAgMGVtJyxcbiAgICAnLTIuNmVtIDBlbSAwIDBlbScsXG4gICAgJy0xLjhlbSAtMS44ZW0gMCAwZW0nXVxuICB2YXIgY29sb3JBcnIgPSBbXG4gICAgJzEnLFxuICAgICcwLjInLFxuICAgICcwLjInLFxuICAgICcwLjInLFxuICAgICcwLjInLFxuICAgICcwLjInLFxuICAgICcwLjUnLFxuICAgICcwLjcnXS5tYXAoZnVuY3Rpb24gKGUpIHtcbiAgICAgIHJldHVybiAncmdiYSgnICsgcmdiLnIgKyAnLCcgKyByZ2IuZyArICcsJyArIHJnYi5iICsgJywnICsgZSArICcpJ1xuICAgIH0pXG4gIHZhciBydWxlcyA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2NhbGVBcnIubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdG1wQ29sb3JBcnIgPSB1dGlscy5sb29wQXJyYXkoY29sb3JBcnIsIGksICdyJylcbiAgICBydWxlcy5wdXNoKHNjYWxlQXJyLm1hcChmdW5jdGlvbiAoc2NhbGVTdHIsIGkpIHtcbiAgICAgIHJldHVybiBzY2FsZVN0ciArICcgJyArIHRtcENvbG9yQXJyW2ldXG4gICAgfSkuam9pbignLCAnKSlcbiAgfVxuICByZXR1cm4gcnVsZXNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTcGlubmVyXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvc3Bpbm5lci5qc1xuICoqIG1vZHVsZSBpZCA9IDg0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL3NwaW5uZXIuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcyEuL3NwaW5uZXIuY3NzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzIS4vc3Bpbm5lci5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvc3R5bGVzL3NwaW5uZXIuY3NzXG4gKiogbW9kdWxlIGlkID0gODVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLndlZXgtc3Bpbm5lci13cmFwIHtcXG4gIHdpZHRoOiAxLjAxMzMzM3JlbTsgLyogNzZweCAqL1xcbiAgaGVpZ2h0OiAxLjAxMzMzM3JlbTtcXG4gIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XFxuICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XFxuICBhbGlnbi1pdGVtczogY2VudGVyO1xcbiAgLXdlYmtpdC1ib3gtcGFjazogY2VudGVyO1xcbiAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xcbiAgb3ZlcmZsb3c6IHZpc2libGU7XFxufVxcblxcbi53ZWV4LXNwaW5uZXIge1xcbiAgZm9udC1zaXplOiAwLjE2cmVtOyAvKiAxMnB4ICovXFxuICB3aWR0aDogMWVtO1xcbiAgaGVpZ2h0OiAxZW07XFxuICBib3JkZXItcmFkaXVzOiA1MCU7XFxuICBwb3NpdGlvbjogcmVsYXRpdmU7XFxuICB0ZXh0LWluZGVudDogLTk5OTllbTtcXG4gIC13ZWJraXQtYW5pbWF0aW9uOiBzcGlubmVyIDEuMXMgaW5maW5pdGUgZWFzZTtcXG4gIGFuaW1hdGlvbjogc3Bpbm5lciAxLjFzIGluZmluaXRlIGVhc2U7XFxuICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWigwKTtcXG4gIC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZVooMCk7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVooMCk7XFxufVxcbkAtd2Via2l0LWtleWZyYW1lcyBzcGlubmVyIHtcXG4gIDAlLFxcbiAgMTAwJSB7XFxuICAgIGJveC1zaGFkb3c6IDBlbSAtMi42ZW0gMGVtIDBlbSAjZmZmZmZmLCAxLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAyLjVlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjc1ZW0gMS43NWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgMGVtIDIuNWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTEuOGVtIDEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTIuNmVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNSksIC0xLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjcpO1xcbiAgfVxcbiAgMTIuNSUge1xcbiAgICBib3gtc2hhZG93OiAwZW0gLTIuNmVtIDBlbSAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjcpLCAxLjhlbSAtMS44ZW0gMCAwZW0gI2ZmZmZmZiwgMi41ZW0gMGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgMS43NWVtIDEuNzVlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDBlbSAyLjVlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0xLjhlbSAxLjhlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0yLjZlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAtMS44ZW0gLTEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KTtcXG4gIH1cXG4gIDI1JSB7XFxuICAgIGJveC1zaGFkb3c6IDBlbSAtMi42ZW0gMGVtIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNSksIDEuOGVtIC0xLjhlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNyksIDIuNWVtIDBlbSAwIDBlbSAjZmZmZmZmLCAxLjc1ZW0gMS43NWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgMGVtIDIuNWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTEuOGVtIDEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTIuNmVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0xLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xcbiAgfVxcbiAgMzcuNSUge1xcbiAgICBib3gtc2hhZG93OiAwZW0gLTIuNmVtIDBlbSAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjUpLCAyLjVlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjcpLCAxLjc1ZW0gMS43NWVtIDAgMGVtICNmZmZmZmYsIDBlbSAyLjVlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0xLjhlbSAxLjhlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0yLjZlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAtMS44ZW0gLTEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKTtcXG4gIH1cXG4gIDUwJSB7XFxuICAgIGJveC1zaGFkb3c6IDBlbSAtMi42ZW0gMGVtIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDEuOGVtIC0xLjhlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDIuNWVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNSksIDEuNzVlbSAxLjc1ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjcpLCAwZW0gMi41ZW0gMCAwZW0gI2ZmZmZmZiwgLTEuOGVtIDEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTIuNmVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0xLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xcbiAgfVxcbiAgNjIuNSUge1xcbiAgICBib3gtc2hhZG93OiAwZW0gLTIuNmVtIDBlbSAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAyLjVlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjc1ZW0gMS43NWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KSwgMGVtIDIuNWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC43KSwgLTEuOGVtIDEuOGVtIDAgMGVtICNmZmZmZmYsIC0yLjZlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAtMS44ZW0gLTEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKTtcXG4gIH1cXG4gIDc1JSB7XFxuICAgIGJveC1zaGFkb3c6IDBlbSAtMi42ZW0gMGVtIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDEuOGVtIC0xLjhlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDIuNWVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDEuNzVlbSAxLjc1ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAwZW0gMi41ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjUpLCAtMS44ZW0gMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjcpLCAtMi42ZW0gMGVtIDAgMGVtICNmZmZmZmYsIC0xLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xcbiAgfVxcbiAgODcuNSUge1xcbiAgICBib3gtc2hhZG93OiAwZW0gLTIuNmVtIDBlbSAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAyLjVlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjc1ZW0gMS43NWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgMGVtIDIuNWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTEuOGVtIDEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KSwgLTIuNmVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNyksIC0xLjhlbSAtMS44ZW0gMCAwZW0gI2ZmZmZmZjtcXG4gIH1cXG59XFxuQGtleWZyYW1lcyBzcGlubmVyIHtcXG4gIDAlLFxcbiAgMTAwJSB7XFxuICAgIGJveC1zaGFkb3c6IDBlbSAtMi42ZW0gMGVtIDBlbSAjZmZmZmZmLCAxLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAyLjVlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjc1ZW0gMS43NWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgMGVtIDIuNWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTEuOGVtIDEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTIuNmVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNSksIC0xLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjcpO1xcbiAgfVxcbiAgMTIuNSUge1xcbiAgICBib3gtc2hhZG93OiAwZW0gLTIuNmVtIDBlbSAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjcpLCAxLjhlbSAtMS44ZW0gMCAwZW0gI2ZmZmZmZiwgMi41ZW0gMGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgMS43NWVtIDEuNzVlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDBlbSAyLjVlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0xLjhlbSAxLjhlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0yLjZlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAtMS44ZW0gLTEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KTtcXG4gIH1cXG4gIDI1JSB7XFxuICAgIGJveC1zaGFkb3c6IDBlbSAtMi42ZW0gMGVtIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNSksIDEuOGVtIC0xLjhlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNyksIDIuNWVtIDBlbSAwIDBlbSAjZmZmZmZmLCAxLjc1ZW0gMS43NWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgMGVtIDIuNWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTEuOGVtIDEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTIuNmVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0xLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xcbiAgfVxcbiAgMzcuNSUge1xcbiAgICBib3gtc2hhZG93OiAwZW0gLTIuNmVtIDBlbSAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjUpLCAyLjVlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjcpLCAxLjc1ZW0gMS43NWVtIDAgMGVtICNmZmZmZmYsIDBlbSAyLjVlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0xLjhlbSAxLjhlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0yLjZlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAtMS44ZW0gLTEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKTtcXG4gIH1cXG4gIDUwJSB7XFxuICAgIGJveC1zaGFkb3c6IDBlbSAtMi42ZW0gMGVtIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDEuOGVtIC0xLjhlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDIuNWVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNSksIDEuNzVlbSAxLjc1ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjcpLCAwZW0gMi41ZW0gMCAwZW0gI2ZmZmZmZiwgLTEuOGVtIDEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTIuNmVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIC0xLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xcbiAgfVxcbiAgNjIuNSUge1xcbiAgICBib3gtc2hhZG93OiAwZW0gLTIuNmVtIDBlbSAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAyLjVlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjc1ZW0gMS43NWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KSwgMGVtIDIuNWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC43KSwgLTEuOGVtIDEuOGVtIDAgMGVtICNmZmZmZmYsIC0yLjZlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAtMS44ZW0gLTEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKTtcXG4gIH1cXG4gIDc1JSB7XFxuICAgIGJveC1zaGFkb3c6IDBlbSAtMi42ZW0gMGVtIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDEuOGVtIC0xLjhlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDIuNWVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiksIDEuNzVlbSAxLjc1ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAwZW0gMi41ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjUpLCAtMS44ZW0gMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjcpLCAtMi42ZW0gMGVtIDAgMGVtICNmZmZmZmYsIC0xLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xcbiAgfVxcbiAgODcuNSUge1xcbiAgICBib3gtc2hhZG93OiAwZW0gLTIuNmVtIDBlbSAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjhlbSAtMS44ZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAyLjVlbSAwZW0gMCAwZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpLCAxLjc1ZW0gMS43NWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgMGVtIDIuNWVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSwgLTEuOGVtIDEuOGVtIDAgMGVtIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KSwgLTIuNmVtIDBlbSAwIDBlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNyksIC0xLjhlbSAtMS44ZW0gMCAwZW0gI2ZmZmZmZjtcXG4gIH1cXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL3NyYy9zdHlsZXMvc3Bpbm5lci5jc3NcbiAqKiBtb2R1bGUgaWQgPSA4NlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBBdG9taWMgPSByZXF1aXJlKCcuL2F0b21pYycpXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpXG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi4vbG9nZ2VyJylcblxuLy8gQSBjb21wb25lbnQgdG8gaW1wb3J0IHdlYiBwYWdlcywgd2hpY2ggd29ya3MgbGlrZVxuLy8gYSBpZnJhbWUgZWxlbWVudCBvciBhIHdlYnZpZXcuXG4vLyBhdHRyczpcbi8vICAgLSBzcmNcbi8vIGV2ZW50czpcbi8vICAgLSBwYWdlc3RhcnRcbi8vICAgLSBwYWdlZmluaXNoXG4vLyAgIC0gZXJyb3JcbmZ1bmN0aW9uIFdlYiAoZGF0YSkge1xuICBBdG9taWMuY2FsbCh0aGlzLCBkYXRhKVxufVxuXG5XZWIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBdG9taWMucHJvdG90eXBlKVxuXG5XZWIucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgLy8gSWZyYW1lJ3MgZGVmZWN0OiBjYW4ndCB1c2UgcG9zaXRpb246YWJzb2x1dGUgYW5kIHRvcCwgbGVmdCwgcmlnaHQsXG4gIC8vIGJvdHRvbSBhbGwgc2V0dGluZyB0byB6ZXJvIGFuZCB1c2UgbWFyZ2luIHRvIGxlYXZlIHNwZWNpZmllZFxuICAvLyBoZWlnaHQgZm9yIGEgYmxhbmsgYXJlYSwgYW5kIGhhdmUgdG8gdXNlIDEwMCUgdG8gZmlsbCB0aGUgcGFyZW50XG4gIC8vIGNvbnRhaW5lciwgb3RoZXJ3aXNlIGl0IHdpbGwgdXNlIGEgdW53YW50ZWQgZGVmYXVsdCBzaXplIGluc3RlYWQuXG4gIC8vIFRoZXJlZm9yZSBhIGRpdiBhcyBhIGlmcmFtZSB3cmFwcGVyIGlzIG5lZWRlZCBoZXJlLlxuICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIG5vZGUuY2xhc3NMaXN0LmFkZCgnd2VleC1jb250YWluZXInKVxuICB0aGlzLndlYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpXG4gIG5vZGUuYXBwZW5kQ2hpbGQodGhpcy53ZWIpXG4gIHRoaXMud2ViLmNsYXNzTGlzdC5hZGQoJ3dlZXgtZWxlbWVudCcpXG4gIHRoaXMud2ViLnN0eWxlLndpZHRoID0gJzEwMCUnXG4gIHRoaXMud2ViLnN0eWxlLmhlaWdodCA9ICcxMDAlJ1xuICB0aGlzLndlYi5zdHlsZS5ib3JkZXIgPSAnbm9uZSdcbiAgcmV0dXJuIG5vZGVcbn1cblxuV2ViLnByb3RvdHlwZS5iaW5kRXZlbnRzID0gZnVuY3Rpb24gKGV2dHMpIHtcbiAgQXRvbWljLnByb3RvdHlwZS5iaW5kRXZlbnRzLmNhbGwodGhpcywgZXZ0cylcbiAgdmFyIHRoYXQgPSB0aGlzXG4gIHRoaXMud2ViLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoZSkge1xuICAgIHRoYXQuZGlzcGF0Y2hFdmVudCgncGFnZWZpbmlzaCcsIHV0aWxzLmV4dGVuZCh7XG4gICAgICB1cmw6IHRoYXQud2ViLnNyY1xuICAgIH0pKVxuICB9KVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMubXNnSGFuZGxlci5iaW5kKHRoaXMpKVxufVxuXG5XZWIucHJvdG90eXBlLm1zZ0hhbmRsZXIgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gIHZhciBtc2cgPSBldnQuZGF0YVxuICBpZiAodHlwZW9mIG1zZyA9PT0gJ3N0cmluZycpIHtcbiAgICB0cnkge1xuICAgICAgbXNnID0gSlNPTi5wYXJzZShtc2cpXG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuICBpZiAoIW1zZykge1xuICAgIHJldHVyblxuICB9XG4gIGlmIChtc2cudHlwZSA9PT0gJ3dlZXgnKSB7XG4gICAgaWYgKCF1dGlscy5pc0FycmF5KG1zZy5jb250ZW50KSkge1xuICAgICAgcmV0dXJuIGxvZ2dlci5lcnJvcignd2VleCBtc2cgcmVjZWl2ZWQgYnkgd2ViIGNvbXBvbmVudC4gbXNnLmNvbnRlbnQnXG4gICAgICAgICsgJyBzaG91bGQgYmUgYSBhcnJheTonLCBtc2cuY29udGVudClcbiAgICB9XG4gICAgY2FsbE5hdGl2ZSh0aGlzLmdldENvbXBvbmVudE1hbmFnZXIoKS5pbnN0YW5jZUlkLCBtc2cuY29udGVudClcbiAgfVxufVxuXG5XZWIucHJvdG90eXBlLmF0dHIgPSB7XG4gIHNyYzogZnVuY3Rpb24gKHZhbCkge1xuICAgIHRoaXMud2ViLnNyYyA9IHZhbFxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdwYWdlc3RhcnQnLCB7IHVybDogdmFsIH0pXG4gICAgfS5iaW5kKHRoaXMpLCAwKVxuICB9XG59XG5cbldlYi5wcm90b3R5cGUuZ29CYWNrID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLndlYi5jb250ZW50V2luZG93Lmhpc3RvcnkuYmFjaygpXG59XG5cbldlYi5wcm90b3R5cGUuZ29Gb3J3YXJkID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLndlYi5jb250ZW50V2luZG93Lmhpc3RvcnkuZm9yd2FyZCgpXG59XG5cbldlYi5wcm90b3R5cGUucmVsb2FkID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLndlYi5jb250ZW50V2luZG93LmxvY2F0aW9uLnJlbG9hZCgpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gV2ViXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbXBvbmVudHMvd2ViLmpzXG4gKiogbW9kdWxlIGlkID0gODdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBkb20gPSByZXF1aXJlKCcuL2RvbScpXG52YXIgZXZlbnQgPSByZXF1aXJlKCcuL2V2ZW50JylcbnZhciBwYWdlSW5mbyA9IHJlcXVpcmUoJy4vcGFnZUluZm8nKVxudmFyIHN0cmVhbSA9IHJlcXVpcmUoJy4vc3RyZWFtJylcbnZhciBtb2RhbCA9IHJlcXVpcmUoJy4vbW9kYWwnKVxudmFyIGFuaW1hdGlvbiA9IHJlcXVpcmUoJy4vYW5pbWF0aW9uJylcbnZhciB3ZWJ2aWV3ID0gcmVxdWlyZSgnLi93ZWJ2aWV3JylcbnZhciB0aW1lciA9IHJlcXVpcmUoJy4vdGltZXInKVxudmFyIG5hdmlnYXRvciA9IHJlcXVpcmUoJy4vbmF2aWdhdG9yJylcblxudmFyIGFwaSA9IHtcbiAgaW5pdDogZnVuY3Rpb24gKFdlZXgpIHtcbiAgICBXZWV4LnJlZ2lzdGVyQXBpTW9kdWxlKCdkb20nLCBkb20sIGRvbS5fbWV0YSlcbiAgICBXZWV4LnJlZ2lzdGVyQXBpTW9kdWxlKCdldmVudCcsIGV2ZW50LCBldmVudC5fbWV0YSlcbiAgICBXZWV4LnJlZ2lzdGVyQXBpTW9kdWxlKCdwYWdlSW5mbycsIHBhZ2VJbmZvLCBwYWdlSW5mby5fbWV0YSlcbiAgICBXZWV4LnJlZ2lzdGVyQXBpTW9kdWxlKCdzdHJlYW0nLCBzdHJlYW0sIHN0cmVhbS5fbWV0YSlcbiAgICBXZWV4LnJlZ2lzdGVyQXBpTW9kdWxlKCdtb2RhbCcsIG1vZGFsLCBtb2RhbC5fbWV0YSlcbiAgICBXZWV4LnJlZ2lzdGVyQXBpTW9kdWxlKCdhbmltYXRpb24nLCBhbmltYXRpb24sIGFuaW1hdGlvbi5fbWV0YSlcbiAgICBXZWV4LnJlZ2lzdGVyQXBpTW9kdWxlKCd3ZWJ2aWV3Jywgd2Vidmlldywgd2Vidmlldy5fbWV0YSlcbiAgICBXZWV4LnJlZ2lzdGVyQXBpTW9kdWxlKCd0aW1lcicsIHRpbWVyLCB0aW1lci5fbWV0YSlcbiAgICBXZWV4LnJlZ2lzdGVyQXBpTW9kdWxlKCduYXZpZ2F0b3InLCBuYXZpZ2F0b3IsIG5hdmlnYXRvci5fbWV0YSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFwaVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvYXBpL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gODhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgbWVzc2FnZVF1ZXVlID0gcmVxdWlyZSgnLi4vbWVzc2FnZVF1ZXVlJylcbnZhciBGcmFtZVVwZGF0ZXIgPSByZXF1aXJlKCcuLi9mcmFtZVVwZGF0ZXInKVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvY29tcG9uZW50JylcbnZhciBzY3JvbGwgPSByZXF1aXJlKCdzY3JvbGwtdG8nKVxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpXG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi4vbG9nZ2VyJylcblxudmFyIGRvbSA9IHtcblxuICAvKipcbiAgICogY3JlYXRlQm9keTogY3JlYXRlIHJvb3QgY29tcG9uZW50XG4gICAqIEBwYXJhbSAge29iamVjdH0gZWxlbWVudFxuICAgKiAgICBjb250YWluZXJ8bGlzdHZpZXd8c2Nyb2xsdmlld1xuICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgKi9cbiAgY3JlYXRlQm9keTogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gICAgZWxlbWVudC5zY2FsZSA9IHRoaXMuc2NhbGVcbiAgICBlbGVtZW50Lmluc3RhbmNlSWQgPSBjb21wb25lbnRNYW5hZ2VyLmluc3RhbmNlSWRcbiAgICByZXR1cm4gY29tcG9uZW50TWFuYWdlci5jcmVhdGVCb2R5KGVsZW1lbnQpXG4gIH0sXG5cbiAgYWRkRWxlbWVudDogZnVuY3Rpb24gKHBhcmVudFJlZiwgZWxlbWVudCwgaW5kZXgpIHtcbiAgICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gICAgZWxlbWVudC5zY2FsZSA9IHRoaXMuc2NhbGVcbiAgICBlbGVtZW50Lmluc3RhbmNlSWQgPSBjb21wb25lbnRNYW5hZ2VyLmluc3RhbmNlSWRcbiAgICByZXR1cm4gY29tcG9uZW50TWFuYWdlci5hZGRFbGVtZW50KHBhcmVudFJlZiwgZWxlbWVudCwgaW5kZXgpXG4gIH0sXG5cbiAgcmVtb3ZlRWxlbWVudDogZnVuY3Rpb24gKHJlZikge1xuICAgIHZhciBjb21wb25lbnRNYW5hZ2VyID0gdGhpcy5nZXRDb21wb25lbnRNYW5hZ2VyKClcbiAgICByZXR1cm4gY29tcG9uZW50TWFuYWdlci5yZW1vdmVFbGVtZW50KHJlZilcbiAgfSxcblxuICBtb3ZlRWxlbWVudDogZnVuY3Rpb24gKHJlZiwgcGFyZW50UmVmLCBpbmRleCkge1xuICAgIHZhciBjb21wb25lbnRNYW5hZ2VyID0gdGhpcy5nZXRDb21wb25lbnRNYW5hZ2VyKClcbiAgICByZXR1cm4gY29tcG9uZW50TWFuYWdlci5tb3ZlRWxlbWVudChyZWYsIHBhcmVudFJlZiwgaW5kZXgpXG4gIH0sXG5cbiAgYWRkRXZlbnQ6IGZ1bmN0aW9uIChyZWYsIHR5cGUpIHtcbiAgICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gICAgcmV0dXJuIGNvbXBvbmVudE1hbmFnZXIuYWRkRXZlbnQocmVmLCB0eXBlKVxuICB9LFxuXG4gIHJlbW92ZUV2ZW50OiBmdW5jdGlvbiAocmVmLCB0eXBlKSB7XG4gICAgdmFyIGNvbXBvbmVudE1hbmFnZXIgPSB0aGlzLmdldENvbXBvbmVudE1hbmFnZXIoKVxuICAgIHJldHVybiBjb21wb25lbnRNYW5hZ2VyLnJlbW92ZUV2ZW50KHJlZiwgdHlwZSlcbiAgfSxcblxuICAvKipcbiAgICogdXBkYXRlQXR0cnM6IHVwZGF0ZSBhdHRyaWJ1dGVzIG9mIGNvbXBvbmVudFxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHJlZlxuICAgKiBAcGFyYW0gIHtvYmp9IGF0dHJcbiAgICovXG4gIHVwZGF0ZUF0dHJzOiBmdW5jdGlvbiAocmVmLCBhdHRyKSB7XG4gICAgdmFyIGNvbXBvbmVudE1hbmFnZXIgPSB0aGlzLmdldENvbXBvbmVudE1hbmFnZXIoKVxuICAgIHJldHVybiBjb21wb25lbnRNYW5hZ2VyLnVwZGF0ZUF0dHJzKHJlZiwgYXR0cilcbiAgfSxcblxuICAvKipcbiAgICogdXBkYXRlU3R5bGU6IHVkcGF0ZSBzdHlsZSBvZiBjb21wb25lbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlZlxuICAgKiBAcGFyYW0ge29ian0gc3R5bGVcbiAgICovXG4gIHVwZGF0ZVN0eWxlOiBmdW5jdGlvbiAocmVmLCBzdHlsZSkge1xuICAgIHZhciBjb21wb25lbnRNYW5hZ2VyID0gdGhpcy5nZXRDb21wb25lbnRNYW5hZ2VyKClcbiAgICByZXR1cm4gY29tcG9uZW50TWFuYWdlci51cGRhdGVTdHlsZShyZWYsIHN0eWxlKVxuICB9LFxuXG4gIGNyZWF0ZUZpbmlzaDogZnVuY3Rpb24gKCkge1xuICAgIC8vIFRPRE9cbiAgICAvLyBGcmFtZVVwZGF0ZXIucGF1c2UoKVxuICB9LFxuXG4gIHJlZnJlc2hGaW5pc2g6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUT0RPXG4gIH0sXG5cbiAgLyoqXG4gICAqIHNjcm9sbFRvRWxlbWVudFxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHJlZlxuICAgKiBAcGFyYW0gIHtvYmp9IG9wdGlvbnMge29mZnNldDpOdW1iZXJ9XG4gICAqICAgcHM6IHNjcm9sbC10byBoYXMgJ2Vhc2UnIGFuZCAnZHVyYXRpb24nKG1zKSBhcyBvcHRpb25zLlxuICAgKi9cbiAgc2Nyb2xsVG9FbGVtZW50OiBmdW5jdGlvbiAocmVmLCBvcHRpb25zKSB7XG4gICAgIW9wdGlvbnMgJiYgKG9wdGlvbnMgPSB7fSlcbiAgICB2YXIgY29tcG9uZW50TWFuYWdlciA9IHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpXG4gICAgdmFyIGVsZW0gPSBjb21wb25lbnRNYW5hZ2VyLmdldEVsZW1lbnRCeVJlZihyZWYpXG4gICAgaWYgKCFlbGVtKSB7XG4gICAgICByZXR1cm4gbG9nZ2VyLmVycm9yKCdjb21wb25lbnQgb2YgcmVmICcgKyByZWYgKyAnIGRvZXNuXFwndCBleGlzdC4nKVxuICAgIH1cbiAgICB2YXIgcGFyZW50U2Nyb2xsZXIgPSBlbGVtLmdldFBhcmVudFNjcm9sbGVyKClcbiAgICBpZiAocGFyZW50U2Nyb2xsZXIpIHtcbiAgICAgIHBhcmVudFNjcm9sbGVyLnNjcm9sbGVyLnNjcm9sbFRvRWxlbWVudChlbGVtLm5vZGUsIHRydWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBvZmZzZXRUb3AgPSBlbGVtLm5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgICAgKyBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcFxuICAgICAgdmFyIG9mZnNldCA9IChOdW1iZXIob3B0aW9ucy5vZmZzZXQpIHx8IDApICogdGhpcy5zY2FsZVxuICAgICAgdmFyIHR3ZWVuID0gc2Nyb2xsKDAsIG9mZnNldFRvcCArIG9mZnNldCwgb3B0aW9ucylcbiAgICAgIHR3ZWVuLm9uKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxvZ2dlci5sb2coJ3Njcm9sbCBlbmQuJylcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbn1cblxuZG9tLl9tZXRhID0ge1xuICBkb206IFt7XG4gICAgbmFtZTogJ2NyZWF0ZUJvZHknLFxuICAgIGFyZ3M6IFsnb2JqZWN0J11cbiAgfSwge1xuICAgIG5hbWU6ICdhZGRFbGVtZW50JyxcbiAgICBhcmdzOiBbJ3N0cmluZycsICdvYmplY3QnLCAnbnVtYmVyJ11cbiAgfSwge1xuICAgIG5hbWU6ICdyZW1vdmVFbGVtZW50JyxcbiAgICBhcmdzOiBbJ3N0cmluZyddXG4gIH0sIHtcbiAgICBuYW1lOiAnbW92ZUVsZW1lbnQnLFxuICAgIGFyZ3M6IFsnc3RyaW5nJywgJ3N0cmluZycsICdudW1iZXInXVxuICB9LCB7XG4gICAgbmFtZTogJ2FkZEV2ZW50JyxcbiAgICBhcmdzOiBbJ3N0cmluZycsICdzdHJpbmcnXVxuICB9LCB7XG4gICAgbmFtZTogJ3JlbW92ZUV2ZW50JyxcbiAgICBhcmdzOiBbJ3N0cmluZycsICdzdHJpbmcnXVxuICB9LCB7XG4gICAgbmFtZTogJ3VwZGF0ZUF0dHJzJyxcbiAgICBhcmdzOiBbJ3N0cmluZycsICdvYmplY3QnXVxuICB9LCB7XG4gICAgbmFtZTogJ3VwZGF0ZVN0eWxlJyxcbiAgICBhcmdzOiBbJ3N0cmluZycsICdvYmplY3QnXVxuICB9LCB7XG4gICAgbmFtZTogJ2NyZWF0ZUZpbmlzaCcsXG4gICAgYXJnczogW11cbiAgfSwge1xuICAgIG5hbWU6ICdyZWZyZXNoRmluaXNoJyxcbiAgICBhcmdzOiBbXVxuICB9LCB7XG4gICAgbmFtZTogJ3Njcm9sbFRvRWxlbWVudCcsXG4gICAgYXJnczogWydzdHJpbmcnLCAnb2JqZWN0J11cbiAgfV1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkb21cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvYXBpL2RvbS5qc1xuICoqIG1vZHVsZSBpZCA9IDg5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIFR3ZWVuID0gcmVxdWlyZSgndHdlZW4nKTtcbnZhciByYWYgPSByZXF1aXJlKCdyYWYnKTtcblxuLyoqXG4gKiBFeHBvc2UgYHNjcm9sbFRvYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNjcm9sbFRvO1xuXG4vKipcbiAqIFNjcm9sbCB0byBgKHgsIHkpYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geFxuICogQHBhcmFtIHtOdW1iZXJ9IHlcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gc2Nyb2xsVG8oeCwgeSwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAvLyBzdGFydCBwb3NpdGlvblxuICB2YXIgc3RhcnQgPSBzY3JvbGwoKTtcblxuICAvLyBzZXR1cCB0d2VlblxuICB2YXIgdHdlZW4gPSBUd2VlbihzdGFydClcbiAgICAuZWFzZShvcHRpb25zLmVhc2UgfHwgJ291dC1jaXJjJylcbiAgICAudG8oeyB0b3A6IHksIGxlZnQ6IHggfSlcbiAgICAuZHVyYXRpb24ob3B0aW9ucy5kdXJhdGlvbiB8fCAxMDAwKTtcblxuICAvLyBzY3JvbGxcbiAgdHdlZW4udXBkYXRlKGZ1bmN0aW9uKG8pe1xuICAgIHdpbmRvdy5zY3JvbGxUbyhvLmxlZnQgfCAwLCBvLnRvcCB8IDApO1xuICB9KTtcblxuICAvLyBoYW5kbGUgZW5kXG4gIHR3ZWVuLm9uKCdlbmQnLCBmdW5jdGlvbigpe1xuICAgIGFuaW1hdGUgPSBmdW5jdGlvbigpe307XG4gIH0pO1xuXG4gIC8vIGFuaW1hdGVcbiAgZnVuY3Rpb24gYW5pbWF0ZSgpIHtcbiAgICByYWYoYW5pbWF0ZSk7XG4gICAgdHdlZW4udXBkYXRlKCk7XG4gIH1cblxuICBhbmltYXRlKCk7XG4gIFxuICByZXR1cm4gdHdlZW47XG59XG5cbi8qKlxuICogUmV0dXJuIHNjcm9sbCBwb3NpdGlvbi5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzY3JvbGwoKSB7XG4gIHZhciB5ID0gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3A7XG4gIHZhciB4ID0gd2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0O1xuICByZXR1cm4geyB0b3A6IHksIGxlZnQ6IHggfTtcbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3Njcm9sbC10by9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDkwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2VtaXR0ZXInKTtcbnZhciBjbG9uZSA9IHJlcXVpcmUoJ2Nsb25lJyk7XG52YXIgdHlwZSA9IHJlcXVpcmUoJ3R5cGUnKTtcbnZhciBlYXNlID0gcmVxdWlyZSgnZWFzZScpO1xuXG4vKipcbiAqIEV4cG9zZSBgVHdlZW5gLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gVHdlZW47XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgVHdlZW5gIHdpdGggYG9iamAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IG9ialxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBUd2VlbihvYmopIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFR3ZWVuKSkgcmV0dXJuIG5ldyBUd2VlbihvYmopO1xuICB0aGlzLl9mcm9tID0gb2JqO1xuICB0aGlzLmVhc2UoJ2xpbmVhcicpO1xuICB0aGlzLmR1cmF0aW9uKDUwMCk7XG59XG5cbi8qKlxuICogTWl4aW4gZW1pdHRlci5cbiAqL1xuXG5FbWl0dGVyKFR3ZWVuLnByb3RvdHlwZSk7XG5cbi8qKlxuICogUmVzZXQgdGhlIHR3ZWVuLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuVHdlZW4ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5pc0FycmF5ID0gJ2FycmF5JyA9PT0gdHlwZSh0aGlzLl9mcm9tKTtcbiAgdGhpcy5fY3VyciA9IGNsb25lKHRoaXMuX2Zyb20pO1xuICB0aGlzLl9kb25lID0gZmFsc2U7XG4gIHRoaXMuX3N0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFR3ZWVuIHRvIGBvYmpgIGFuZCByZXNldCBpbnRlcm5hbCBzdGF0ZS5cbiAqXG4gKiAgICB0d2Vlbi50byh7IHg6IDUwLCB5OiAxMDAgfSlcbiAqXG4gKiBAcGFyYW0ge09iamVjdHxBcnJheX0gb2JqXG4gKiBAcmV0dXJuIHtUd2Vlbn0gc2VsZlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Ud2Vlbi5wcm90b3R5cGUudG8gPSBmdW5jdGlvbihvYmope1xuICB0aGlzLnJlc2V0KCk7XG4gIHRoaXMuX3RvID0gb2JqO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IGR1cmF0aW9uIHRvIGBtc2AgWzUwMF0uXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtUd2Vlbn0gc2VsZlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Ud2Vlbi5wcm90b3R5cGUuZHVyYXRpb24gPSBmdW5jdGlvbihtcyl7XG4gIHRoaXMuX2R1cmF0aW9uID0gbXM7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgZWFzaW5nIGZ1bmN0aW9uIHRvIGBmbmAuXG4gKlxuICogICAgdHdlZW4uZWFzZSgnaW4tb3V0LXNpbmUnKVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBmblxuICogQHJldHVybiB7VHdlZW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblR3ZWVuLnByb3RvdHlwZS5lYXNlID0gZnVuY3Rpb24oZm4pe1xuICBmbiA9ICdmdW5jdGlvbicgPT0gdHlwZW9mIGZuID8gZm4gOiBlYXNlW2ZuXTtcbiAgaWYgKCFmbikgdGhyb3cgbmV3IFR5cGVFcnJvcignaW52YWxpZCBlYXNpbmcgZnVuY3Rpb24nKTtcbiAgdGhpcy5fZWFzZSA9IGZuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU3RvcCB0aGUgdHdlZW4gYW5kIGltbWVkaWF0ZWx5IGVtaXQgXCJzdG9wXCIgYW5kIFwiZW5kXCIuXG4gKlxuICogQHJldHVybiB7VHdlZW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblR3ZWVuLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5zdG9wcGVkID0gdHJ1ZTtcbiAgdGhpcy5fZG9uZSA9IHRydWU7XG4gIHRoaXMuZW1pdCgnc3RvcCcpO1xuICB0aGlzLmVtaXQoJ2VuZCcpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUGVyZm9ybSBhIHN0ZXAuXG4gKlxuICogQHJldHVybiB7VHdlZW59IHNlbGZcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblR3ZWVuLnByb3RvdHlwZS5zdGVwID0gZnVuY3Rpb24oKXtcbiAgaWYgKHRoaXMuX2RvbmUpIHJldHVybjtcblxuICAvLyBkdXJhdGlvblxuICB2YXIgZHVyYXRpb24gPSB0aGlzLl9kdXJhdGlvbjtcbiAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gIHZhciBkZWx0YSA9IG5vdyAtIHRoaXMuX3N0YXJ0O1xuICB2YXIgZG9uZSA9IGRlbHRhID49IGR1cmF0aW9uO1xuXG4gIC8vIGNvbXBsZXRlXG4gIGlmIChkb25lKSB7XG4gICAgdGhpcy5fZnJvbSA9IHRoaXMuX3RvO1xuICAgIHRoaXMuX3VwZGF0ZSh0aGlzLl90byk7XG4gICAgdGhpcy5fZG9uZSA9IHRydWU7XG4gICAgdGhpcy5lbWl0KCdlbmQnKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHR3ZWVuXG4gIHZhciBmcm9tID0gdGhpcy5fZnJvbTtcbiAgdmFyIHRvID0gdGhpcy5fdG87XG4gIHZhciBjdXJyID0gdGhpcy5fY3VycjtcbiAgdmFyIGZuID0gdGhpcy5fZWFzZTtcbiAgdmFyIHAgPSAobm93IC0gdGhpcy5fc3RhcnQpIC8gZHVyYXRpb247XG4gIHZhciBuID0gZm4ocCk7XG5cbiAgLy8gYXJyYXlcbiAgaWYgKHRoaXMuaXNBcnJheSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZnJvbS5sZW5ndGg7ICsraSkge1xuICAgICAgY3VycltpXSA9IGZyb21baV0gKyAodG9baV0gLSBmcm9tW2ldKSAqIG47XG4gICAgfVxuXG4gICAgdGhpcy5fdXBkYXRlKGN1cnIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gb2JqZWNoXG4gIGZvciAodmFyIGsgaW4gZnJvbSkge1xuICAgIGN1cnJba10gPSBmcm9tW2tdICsgKHRvW2tdIC0gZnJvbVtrXSkgKiBuO1xuICB9XG5cbiAgdGhpcy5fdXBkYXRlKGN1cnIpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IHVwZGF0ZSBmdW5jdGlvbiB0byBgZm5gIG9yXG4gKiB3aGVuIG5vIGFyZ3VtZW50IGlzIGdpdmVuIHRoaXMgcGVyZm9ybXNcbiAqIGEgXCJzdGVwXCIuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge1R3ZWVufSBzZWxmXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblR3ZWVuLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihmbil7XG4gIGlmICgwID09IGFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLnN0ZXAoKTtcbiAgdGhpcy5fdXBkYXRlID0gZm47XG4gIHJldHVybiB0aGlzO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9zY3JvbGwtdG8vfi9jb21wb25lbnQtdHdlZW4vaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSA5MVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiXG4vKipcbiAqIEV4cG9zZSBgRW1pdHRlcmAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYEVtaXR0ZXJgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gRW1pdHRlcihvYmopIHtcbiAgaWYgKG9iaikgcmV0dXJuIG1peGluKG9iaik7XG59O1xuXG4vKipcbiAqIE1peGluIHRoZSBlbWl0dGVyIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbWl4aW4ob2JqKSB7XG4gIGZvciAodmFyIGtleSBpbiBFbWl0dGVyLnByb3RvdHlwZSkge1xuICAgIG9ialtrZXldID0gRW1pdHRlci5wcm90b3R5cGVba2V5XTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIExpc3RlbiBvbiB0aGUgZ2l2ZW4gYGV2ZW50YCB3aXRoIGBmbmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub24gPVxuRW1pdHRlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgKHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdIHx8IFtdKVxuICAgIC5wdXNoKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZHMgYW4gYGV2ZW50YCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgaW52b2tlZCBhIHNpbmdsZVxuICogdGltZSB0aGVuIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgZnVuY3Rpb24gb24oKSB7XG4gICAgdGhpcy5vZmYoZXZlbnQsIG9uKTtcbiAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgb24uZm4gPSBmbjtcbiAgdGhpcy5vbihldmVudCwgb24pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgYGV2ZW50YCBvciBhbGxcbiAqIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9mZiA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcblxuICAvLyBhbGxcbiAgaWYgKDAgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gc3BlY2lmaWMgZXZlbnRcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF07XG4gIGlmICghY2FsbGJhY2tzKSByZXR1cm4gdGhpcztcblxuICAvLyByZW1vdmUgYWxsIGhhbmRsZXJzXG4gIGlmICgxID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHJlbW92ZSBzcGVjaWZpYyBoYW5kbGVyXG4gIHZhciBjYjtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBjYiA9IGNhbGxiYWNrc1tpXTtcbiAgICBpZiAoY2IgPT09IGZuIHx8IGNiLmZuID09PSBmbikge1xuICAgICAgY2FsbGJhY2tzLnNwbGljZShpLCAxKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge01peGVkfSAuLi5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICAgICwgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcblxuICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLnNsaWNlKDApO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjYWxsYmFja3MubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmV0dXJuIGFycmF5IG9mIGNhbGxiYWNrcyBmb3IgYGV2ZW50YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgcmV0dXJuIHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gfHwgW107XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHRoaXMgZW1pdHRlciBoYXMgYGV2ZW50YCBoYW5kbGVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmhhc0xpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgcmV0dXJuICEhIHRoaXMubGlzdGVuZXJzKGV2ZW50KS5sZW5ndGg7XG59O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vc2Nyb2xsLXRvL34vY29tcG9uZW50LXR3ZWVuL34vY29tcG9uZW50LWVtaXR0ZXIvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSA5MlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciB0eXBlO1xudHJ5IHtcbiAgdHlwZSA9IHJlcXVpcmUoJ2NvbXBvbmVudC10eXBlJyk7XG59IGNhdGNoIChfKSB7XG4gIHR5cGUgPSByZXF1aXJlKCd0eXBlJyk7XG59XG5cbi8qKlxuICogTW9kdWxlIGV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBjbG9uZTtcblxuLyoqXG4gKiBDbG9uZXMgb2JqZWN0cy5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSBhbnkgb2JqZWN0XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGNsb25lKG9iail7XG4gIHN3aXRjaCAodHlwZShvYmopKSB7XG4gICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgIHZhciBjb3B5ID0ge307XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIGNvcHlba2V5XSA9IGNsb25lKG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGNvcHk7XG5cbiAgICBjYXNlICdhcnJheSc6XG4gICAgICB2YXIgY29weSA9IG5ldyBBcnJheShvYmoubGVuZ3RoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBjb3B5W2ldID0gY2xvbmUob2JqW2ldKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb3B5O1xuXG4gICAgY2FzZSAncmVnZXhwJzpcbiAgICAgIC8vIGZyb20gbWlsbGVybWVkZWlyb3MvYW1kLXV0aWxzIC0gTUlUXG4gICAgICB2YXIgZmxhZ3MgPSAnJztcbiAgICAgIGZsYWdzICs9IG9iai5tdWx0aWxpbmUgPyAnbScgOiAnJztcbiAgICAgIGZsYWdzICs9IG9iai5nbG9iYWwgPyAnZycgOiAnJztcbiAgICAgIGZsYWdzICs9IG9iai5pZ25vcmVDYXNlID8gJ2knIDogJyc7XG4gICAgICByZXR1cm4gbmV3IFJlZ0V4cChvYmouc291cmNlLCBmbGFncyk7XG5cbiAgICBjYXNlICdkYXRlJzpcbiAgICAgIHJldHVybiBuZXcgRGF0ZShvYmouZ2V0VGltZSgpKTtcblxuICAgIGRlZmF1bHQ6IC8vIHN0cmluZywgbnVtYmVyLCBib29sZWFuLCDigKZcbiAgICAgIHJldHVybiBvYmo7XG4gIH1cbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3Njcm9sbC10by9+L2NvbXBvbmVudC10d2Vlbi9+L2NvbXBvbmVudC1jbG9uZS9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDkzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKipcbiAqIHRvU3RyaW5nIHJlZi5cbiAqL1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFJldHVybiB0aGUgdHlwZSBvZiBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwpe1xuICBzd2l0Y2ggKHRvU3RyaW5nLmNhbGwodmFsKSkge1xuICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOiByZXR1cm4gJ2RhdGUnO1xuICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6IHJldHVybiAncmVnZXhwJztcbiAgICBjYXNlICdbb2JqZWN0IEFyZ3VtZW50c10nOiByZXR1cm4gJ2FyZ3VtZW50cyc7XG4gICAgY2FzZSAnW29iamVjdCBBcnJheV0nOiByZXR1cm4gJ2FycmF5JztcbiAgICBjYXNlICdbb2JqZWN0IEVycm9yXSc6IHJldHVybiAnZXJyb3InO1xuICB9XG5cbiAgaWYgKHZhbCA9PT0gbnVsbCkgcmV0dXJuICdudWxsJztcbiAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gIGlmICh2YWwgIT09IHZhbCkgcmV0dXJuICduYW4nO1xuICBpZiAodmFsICYmIHZhbC5ub2RlVHlwZSA9PT0gMSkgcmV0dXJuICdlbGVtZW50JztcblxuICB2YWwgPSB2YWwudmFsdWVPZlxuICAgID8gdmFsLnZhbHVlT2YoKVxuICAgIDogT2JqZWN0LnByb3RvdHlwZS52YWx1ZU9mLmFwcGx5KHZhbClcblxuICByZXR1cm4gdHlwZW9mIHZhbDtcbn07XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9zY3JvbGwtdG8vfi9jb21wb25lbnQtdHdlZW4vfi9jb21wb25lbnQtdHlwZS9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDk0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcbi8vIGVhc2luZyBmdW5jdGlvbnMgZnJvbSBcIlR3ZWVuLmpzXCJcblxuZXhwb3J0cy5saW5lYXIgPSBmdW5jdGlvbihuKXtcbiAgcmV0dXJuIG47XG59O1xuXG5leHBvcnRzLmluUXVhZCA9IGZ1bmN0aW9uKG4pe1xuICByZXR1cm4gbiAqIG47XG59O1xuXG5leHBvcnRzLm91dFF1YWQgPSBmdW5jdGlvbihuKXtcbiAgcmV0dXJuIG4gKiAoMiAtIG4pO1xufTtcblxuZXhwb3J0cy5pbk91dFF1YWQgPSBmdW5jdGlvbihuKXtcbiAgbiAqPSAyO1xuICBpZiAobiA8IDEpIHJldHVybiAwLjUgKiBuICogbjtcbiAgcmV0dXJuIC0gMC41ICogKC0tbiAqIChuIC0gMikgLSAxKTtcbn07XG5cbmV4cG9ydHMuaW5DdWJlID0gZnVuY3Rpb24obil7XG4gIHJldHVybiBuICogbiAqIG47XG59O1xuXG5leHBvcnRzLm91dEN1YmUgPSBmdW5jdGlvbihuKXtcbiAgcmV0dXJuIC0tbiAqIG4gKiBuICsgMTtcbn07XG5cbmV4cG9ydHMuaW5PdXRDdWJlID0gZnVuY3Rpb24obil7XG4gIG4gKj0gMjtcbiAgaWYgKG4gPCAxKSByZXR1cm4gMC41ICogbiAqIG4gKiBuO1xuICByZXR1cm4gMC41ICogKChuIC09IDIgKSAqIG4gKiBuICsgMik7XG59O1xuXG5leHBvcnRzLmluUXVhcnQgPSBmdW5jdGlvbihuKXtcbiAgcmV0dXJuIG4gKiBuICogbiAqIG47XG59O1xuXG5leHBvcnRzLm91dFF1YXJ0ID0gZnVuY3Rpb24obil7XG4gIHJldHVybiAxIC0gKC0tbiAqIG4gKiBuICogbik7XG59O1xuXG5leHBvcnRzLmluT3V0UXVhcnQgPSBmdW5jdGlvbihuKXtcbiAgbiAqPSAyO1xuICBpZiAobiA8IDEpIHJldHVybiAwLjUgKiBuICogbiAqIG4gKiBuO1xuICByZXR1cm4gLTAuNSAqICgobiAtPSAyKSAqIG4gKiBuICogbiAtIDIpO1xufTtcblxuZXhwb3J0cy5pblF1aW50ID0gZnVuY3Rpb24obil7XG4gIHJldHVybiBuICogbiAqIG4gKiBuICogbjtcbn1cblxuZXhwb3J0cy5vdXRRdWludCA9IGZ1bmN0aW9uKG4pe1xuICByZXR1cm4gLS1uICogbiAqIG4gKiBuICogbiArIDE7XG59XG5cbmV4cG9ydHMuaW5PdXRRdWludCA9IGZ1bmN0aW9uKG4pe1xuICBuICo9IDI7XG4gIGlmIChuIDwgMSkgcmV0dXJuIDAuNSAqIG4gKiBuICogbiAqIG4gKiBuO1xuICByZXR1cm4gMC41ICogKChuIC09IDIpICogbiAqIG4gKiBuICogbiArIDIpO1xufTtcblxuZXhwb3J0cy5pblNpbmUgPSBmdW5jdGlvbihuKXtcbiAgcmV0dXJuIDEgLSBNYXRoLmNvcyhuICogTWF0aC5QSSAvIDIgKTtcbn07XG5cbmV4cG9ydHMub3V0U2luZSA9IGZ1bmN0aW9uKG4pe1xuICByZXR1cm4gTWF0aC5zaW4obiAqIE1hdGguUEkgLyAyKTtcbn07XG5cbmV4cG9ydHMuaW5PdXRTaW5lID0gZnVuY3Rpb24obil7XG4gIHJldHVybiAuNSAqICgxIC0gTWF0aC5jb3MoTWF0aC5QSSAqIG4pKTtcbn07XG5cbmV4cG9ydHMuaW5FeHBvID0gZnVuY3Rpb24obil7XG4gIHJldHVybiAwID09IG4gPyAwIDogTWF0aC5wb3coMTAyNCwgbiAtIDEpO1xufTtcblxuZXhwb3J0cy5vdXRFeHBvID0gZnVuY3Rpb24obil7XG4gIHJldHVybiAxID09IG4gPyBuIDogMSAtIE1hdGgucG93KDIsIC0xMCAqIG4pO1xufTtcblxuZXhwb3J0cy5pbk91dEV4cG8gPSBmdW5jdGlvbihuKXtcbiAgaWYgKDAgPT0gbikgcmV0dXJuIDA7XG4gIGlmICgxID09IG4pIHJldHVybiAxO1xuICBpZiAoKG4gKj0gMikgPCAxKSByZXR1cm4gLjUgKiBNYXRoLnBvdygxMDI0LCBuIC0gMSk7XG4gIHJldHVybiAuNSAqICgtTWF0aC5wb3coMiwgLTEwICogKG4gLSAxKSkgKyAyKTtcbn07XG5cbmV4cG9ydHMuaW5DaXJjID0gZnVuY3Rpb24obil7XG4gIHJldHVybiAxIC0gTWF0aC5zcXJ0KDEgLSBuICogbik7XG59O1xuXG5leHBvcnRzLm91dENpcmMgPSBmdW5jdGlvbihuKXtcbiAgcmV0dXJuIE1hdGguc3FydCgxIC0gKC0tbiAqIG4pKTtcbn07XG5cbmV4cG9ydHMuaW5PdXRDaXJjID0gZnVuY3Rpb24obil7XG4gIG4gKj0gMlxuICBpZiAobiA8IDEpIHJldHVybiAtMC41ICogKE1hdGguc3FydCgxIC0gbiAqIG4pIC0gMSk7XG4gIHJldHVybiAwLjUgKiAoTWF0aC5zcXJ0KDEgLSAobiAtPSAyKSAqIG4pICsgMSk7XG59O1xuXG5leHBvcnRzLmluQmFjayA9IGZ1bmN0aW9uKG4pe1xuICB2YXIgcyA9IDEuNzAxNTg7XG4gIHJldHVybiBuICogbiAqICgoIHMgKyAxICkgKiBuIC0gcyk7XG59O1xuXG5leHBvcnRzLm91dEJhY2sgPSBmdW5jdGlvbihuKXtcbiAgdmFyIHMgPSAxLjcwMTU4O1xuICByZXR1cm4gLS1uICogbiAqICgocyArIDEpICogbiArIHMpICsgMTtcbn07XG5cbmV4cG9ydHMuaW5PdXRCYWNrID0gZnVuY3Rpb24obil7XG4gIHZhciBzID0gMS43MDE1OCAqIDEuNTI1O1xuICBpZiAoICggbiAqPSAyICkgPCAxICkgcmV0dXJuIDAuNSAqICggbiAqIG4gKiAoICggcyArIDEgKSAqIG4gLSBzICkgKTtcbiAgcmV0dXJuIDAuNSAqICggKCBuIC09IDIgKSAqIG4gKiAoICggcyArIDEgKSAqIG4gKyBzICkgKyAyICk7XG59O1xuXG5leHBvcnRzLmluQm91bmNlID0gZnVuY3Rpb24obil7XG4gIHJldHVybiAxIC0gZXhwb3J0cy5vdXRCb3VuY2UoMSAtIG4pO1xufTtcblxuZXhwb3J0cy5vdXRCb3VuY2UgPSBmdW5jdGlvbihuKXtcbiAgaWYgKCBuIDwgKCAxIC8gMi43NSApICkge1xuICAgIHJldHVybiA3LjU2MjUgKiBuICogbjtcbiAgfSBlbHNlIGlmICggbiA8ICggMiAvIDIuNzUgKSApIHtcbiAgICByZXR1cm4gNy41NjI1ICogKCBuIC09ICggMS41IC8gMi43NSApICkgKiBuICsgMC43NTtcbiAgfSBlbHNlIGlmICggbiA8ICggMi41IC8gMi43NSApICkge1xuICAgIHJldHVybiA3LjU2MjUgKiAoIG4gLT0gKCAyLjI1IC8gMi43NSApICkgKiBuICsgMC45Mzc1O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiA3LjU2MjUgKiAoIG4gLT0gKCAyLjYyNSAvIDIuNzUgKSApICogbiArIDAuOTg0Mzc1O1xuICB9XG59O1xuXG5leHBvcnRzLmluT3V0Qm91bmNlID0gZnVuY3Rpb24obil7XG4gIGlmIChuIDwgLjUpIHJldHVybiBleHBvcnRzLmluQm91bmNlKG4gKiAyKSAqIC41O1xuICByZXR1cm4gZXhwb3J0cy5vdXRCb3VuY2UobiAqIDIgLSAxKSAqIC41ICsgLjU7XG59O1xuXG4vLyBhbGlhc2VzXG5cbmV4cG9ydHNbJ2luLXF1YWQnXSA9IGV4cG9ydHMuaW5RdWFkO1xuZXhwb3J0c1snb3V0LXF1YWQnXSA9IGV4cG9ydHMub3V0UXVhZDtcbmV4cG9ydHNbJ2luLW91dC1xdWFkJ10gPSBleHBvcnRzLmluT3V0UXVhZDtcbmV4cG9ydHNbJ2luLWN1YmUnXSA9IGV4cG9ydHMuaW5DdWJlO1xuZXhwb3J0c1snb3V0LWN1YmUnXSA9IGV4cG9ydHMub3V0Q3ViZTtcbmV4cG9ydHNbJ2luLW91dC1jdWJlJ10gPSBleHBvcnRzLmluT3V0Q3ViZTtcbmV4cG9ydHNbJ2luLXF1YXJ0J10gPSBleHBvcnRzLmluUXVhcnQ7XG5leHBvcnRzWydvdXQtcXVhcnQnXSA9IGV4cG9ydHMub3V0UXVhcnQ7XG5leHBvcnRzWydpbi1vdXQtcXVhcnQnXSA9IGV4cG9ydHMuaW5PdXRRdWFydDtcbmV4cG9ydHNbJ2luLXF1aW50J10gPSBleHBvcnRzLmluUXVpbnQ7XG5leHBvcnRzWydvdXQtcXVpbnQnXSA9IGV4cG9ydHMub3V0UXVpbnQ7XG5leHBvcnRzWydpbi1vdXQtcXVpbnQnXSA9IGV4cG9ydHMuaW5PdXRRdWludDtcbmV4cG9ydHNbJ2luLXNpbmUnXSA9IGV4cG9ydHMuaW5TaW5lO1xuZXhwb3J0c1snb3V0LXNpbmUnXSA9IGV4cG9ydHMub3V0U2luZTtcbmV4cG9ydHNbJ2luLW91dC1zaW5lJ10gPSBleHBvcnRzLmluT3V0U2luZTtcbmV4cG9ydHNbJ2luLWV4cG8nXSA9IGV4cG9ydHMuaW5FeHBvO1xuZXhwb3J0c1snb3V0LWV4cG8nXSA9IGV4cG9ydHMub3V0RXhwbztcbmV4cG9ydHNbJ2luLW91dC1leHBvJ10gPSBleHBvcnRzLmluT3V0RXhwbztcbmV4cG9ydHNbJ2luLWNpcmMnXSA9IGV4cG9ydHMuaW5DaXJjO1xuZXhwb3J0c1snb3V0LWNpcmMnXSA9IGV4cG9ydHMub3V0Q2lyYztcbmV4cG9ydHNbJ2luLW91dC1jaXJjJ10gPSBleHBvcnRzLmluT3V0Q2lyYztcbmV4cG9ydHNbJ2luLWJhY2snXSA9IGV4cG9ydHMuaW5CYWNrO1xuZXhwb3J0c1snb3V0LWJhY2snXSA9IGV4cG9ydHMub3V0QmFjaztcbmV4cG9ydHNbJ2luLW91dC1iYWNrJ10gPSBleHBvcnRzLmluT3V0QmFjaztcbmV4cG9ydHNbJ2luLWJvdW5jZSddID0gZXhwb3J0cy5pbkJvdW5jZTtcbmV4cG9ydHNbJ291dC1ib3VuY2UnXSA9IGV4cG9ydHMub3V0Qm91bmNlO1xuZXhwb3J0c1snaW4tb3V0LWJvdW5jZSddID0gZXhwb3J0cy5pbk91dEJvdW5jZTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3Njcm9sbC10by9+L2NvbXBvbmVudC10d2Vlbi9+L2Vhc2UtY29tcG9uZW50L2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gOTVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKlxuICogRXhwb3NlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKWAuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZVxuICB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgfHwgZmFsbGJhY2s7XG5cbi8qKlxuICogRmFsbGJhY2sgaW1wbGVtZW50YXRpb24uXG4gKi9cblxudmFyIHByZXYgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbmZ1bmN0aW9uIGZhbGxiYWNrKGZuKSB7XG4gIHZhciBjdXJyID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHZhciBtcyA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnIgLSBwcmV2KSk7XG4gIHZhciByZXEgPSBzZXRUaW1lb3V0KGZuLCBtcyk7XG4gIHByZXYgPSBjdXJyO1xuICByZXR1cm4gcmVxO1xufVxuXG4vKipcbiAqIENhbmNlbC5cbiAqL1xuXG52YXIgY2FuY2VsID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lXG4gIHx8IHdpbmRvdy53ZWJraXRDYW5jZWxBbmltYXRpb25GcmFtZVxuICB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWVcbiAgfHwgd2luZG93LmNsZWFyVGltZW91dDtcblxuZXhwb3J0cy5jYW5jZWwgPSBmdW5jdGlvbihpZCl7XG4gIGNhbmNlbC5jYWxsKHdpbmRvdywgaWQpO1xufTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3Njcm9sbC10by9+L2NvbXBvbmVudC1yYWYvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSA5NlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBldmVudCA9IHtcbiAgLyoqXG4gICAqIG9wZW5VcmxcbiAgICogQHBhcmFtICB7c3RyaW5nfSB1cmxcbiAgICovXG4gIG9wZW5VUkw6IGZ1bmN0aW9uICh1cmwpIHtcbiAgICBsb2NhdGlvbi5ocmVmID0gdXJsXG4gIH1cblxufVxuXG5ldmVudC5fbWV0YSA9IHtcbiAgZXZlbnQ6IFt7XG4gICAgbmFtZTogJ29wZW5VUkwnLFxuICAgIGFyZ3M6IFsnc3RyaW5nJ11cbiAgfV1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBldmVudFxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvYXBpL2V2ZW50LmpzXG4gKiogbW9kdWxlIGlkID0gOTdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgcGFnZUluZm8gPSB7XG5cbiAgc2V0VGl0bGU6IGZ1bmN0aW9uICh0aXRsZSkge1xuICAgIHRpdGxlID0gdGl0bGUgfHwgJ1dlZXggSFRNTDUnXG4gICAgdHJ5IHtcbiAgICAgIHRpdGxlID0gZGVjb2RlVVJJQ29tcG9uZW50KHRpdGxlKVxuICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZVxuICB9XG59XG5cbnBhZ2VJbmZvLl9tZXRhID0ge1xuICBwYWdlSW5mbzogW3tcbiAgICBuYW1lOiAnc2V0VGl0bGUnLFxuICAgIGFyZ3M6IFsnc3RyaW5nJ11cbiAgfV1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwYWdlSW5mb1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvYXBpL3BhZ2VJbmZvLmpzXG4gKiogbW9kdWxlIGlkID0gOThcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpXG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi4vbG9nZ2VyJylcblxucmVxdWlyZSgnaHR0cHVybCcpXG5cbnZhciBqc29ucENudCA9IDBcbnZhciBFUlJPUl9TVEFURSA9IC0xXG5cbmZ1bmN0aW9uIF9qc29ucChjb25maWcsIGNhbGxiYWNrLCBwcm9ncmVzc0NhbGxiYWNrKSB7XG4gIHZhciBjYk5hbWUgPSAnanNvbnBfJyArICgrK2pzb25wQ250KVxuICB2YXIgc2NyaXB0LCB1cmwsIGhlYWRcblxuICBpZiAoIWNvbmZpZy51cmwpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ2NvbmZpZy51cmwgc2hvdWxkIGJlIHNldCBpbiBfanNvbnAgZm9yIFxcJ2ZldGNoXFwnIEFQSS4nKVxuICB9XG5cbiAgZ2xvYmFsW2NiTmFtZV0gPSAoZnVuY3Rpb24gKGNiKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgY2FsbGJhY2socmVzcG9uc2UpXG4gICAgICBkZWxldGUgZ2xvYmFsW2NiXVxuICAgIH1cbiAgfSkoY2JOYW1lKVxuXG4gIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gIHRyeSB7XG4gICAgdXJsID0gbGliLmh0dHB1cmwoY29uZmlnLnVybClcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nZ2VyLmVycm9yKCdpbnZhbGlkIGNvbmZpZy51cmwgaW4gX2pzb25wIGZvciBcXCdmZXRjaFxcJyBBUEk6ICdcbiAgICAgICsgY29uZmlnLnVybClcbiAgfVxuICB1cmwucGFyYW1zLmNhbGxiYWNrID0gY2JOYW1lXG4gIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCdcbiAgc2NyaXB0LnNyYyA9IHVybC50b1N0cmluZygpXG4gIC8vIHNjcmlwdC5vbmVycm9yIGlzIG5vdCB3b3JraW5nIG9uIElFIG9yIHNhZmFyaS5cbiAgLy8gYnV0IHRoZXkgYXJlIG5vdCBjb25zaWRlcmVkIGhlcmUuXG4gIHNjcmlwdC5vbmVycm9yID0gKGZ1bmN0aW9uIChjYikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoJ3VuZXhwZWN0ZWQgZXJyb3IgaW4gX2pzb25wIGZvciBcXCdmZXRjaFxcJyBBUEknLCBlcnIpXG4gICAgICBjYWxsYmFjayhlcnIpXG4gICAgICBkZWxldGUgZ2xvYmFsW2NiXVxuICAgIH1cbiAgfSkoY2JOYW1lKVxuICBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXVxuICBoZWFkLmluc2VydEJlZm9yZShzY3JpcHQsIG51bGwpXG59XG5cbmZ1bmN0aW9uIF94aHIoY29uZmlnLCBjYWxsYmFjaywgcHJvZ3Jlc3NDYWxsYmFjaykge1xuICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcbiAgeGhyLnJlc3BvbnNlVHlwZSA9IGNvbmZpZy50eXBlXG4gIHhoci5vcGVuKGNvbmZpZy5tZXRob2QsIGNvbmZpZy51cmwsIHRydWUpXG5cbiAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uIChyZXMpIHtcbiAgICBjYWxsYmFjayh7XG4gICAgICBzdGF0dXM6IHhoci5zdGF0dXMsXG4gICAgICBvazogeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDMwMCxcbiAgICAgIHN0YXR1c1RleHQ6IHhoci5zdGF0dXNUZXh0LFxuICAgICAgZGF0YTogeGhyLnJlc3BvbnNlLFxuICAgICAgaGVhZGVyczogeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpLnNwbGl0KCdcXG4nKVxuICAgICAgICAucmVkdWNlKGZ1bmN0aW9uIChvYmosIGhlYWRlclN0cikge1xuICAgICAgICAgIHZhciBoZWFkZXJBcnIgPSBoZWFkZXJTdHIubWF0Y2goLyguKyk6ICguKykvKVxuICAgICAgICAgIGlmIChoZWFkZXJBcnIpIHtcbiAgICAgICAgICAgIG9ialtoZWFkZXJBcnJbMV1dID0gaGVhZGVyQXJyWzJdXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBvYmpcbiAgICAgICAgfSwge30pXG4gICAgfSlcbiAgfVxuXG4gIGlmIChwcm9ncmVzc0NhbGxiYWNrKSB7XG4gICAgeGhyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgcHJvZ3Jlc3NDYWxsYmFjayh7XG4gICAgICAgIHJlYWR5U3RhdGU6IHhoci5yZWFkeVN0YXRlLFxuICAgICAgICBzdGF0dXM6IHhoci5zdGF0dXMsXG4gICAgICAgIGxlbmd0aDogZS5sb2FkZWQsXG4gICAgICAgIHRvdGFsOiBlLnRvdGFsLFxuICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCxcbiAgICAgICAgaGVhZGVyczogeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpLnNwbGl0KCdcXG4nKVxuICAgICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKG9iaiwgaGVhZGVyU3RyKSB7XG4gICAgICAgICAgICB2YXIgaGVhZGVyQXJyID0gaGVhZGVyU3RyLm1hdGNoKC8oLispOiAoLispLylcbiAgICAgICAgICAgIGlmIChoZWFkZXJBcnIpIHtcbiAgICAgICAgICAgICAgb2JqW2hlYWRlckFyclsxXV0gPSBoZWFkZXJBcnJbMl1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvYmpcbiAgICAgICAgICB9LCB7fSlcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgbG9nZ2VyLmVycm9yKCd1bmV4cGVjdGVkIGVycm9yIGluIF94aHIgZm9yIFxcJ2ZldGNoXFwnIEFQSScsIGVycilcbiAgICBjYWxsYmFjayh7XG4gICAgICBzdGF0dXM6IEVSUk9SX1NUQVRFLFxuICAgICAgb2s6IGZhbHNlLFxuICAgICAgc3RhdHVzVGV4dDogJycsXG4gICAgICBkYXRhOiAnJyxcbiAgICAgIGhlYWRlcnM6IHt9XG4gICAgfSlcbiAgfVxuXG4gIHhoci5zZW5kKGNvbmZpZy5ib2R5KVxufVxuXG52YXIgc3RyZWFtID0ge1xuXG4gIC8qKlxuICAgKiBzZW5kSHR0cFxuICAgKiBOb3RlOiBUaGlzIEFQSSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIHN0cmVhbS5mZXRjaCBpbnN0ZWFkLlxuICAgKiBzZW5kIGEgaHR0cCByZXF1ZXN0IHRocm91Z2ggWEhSLlxuICAgKiBAZGVwcmVjYXRlZFxuICAgKiBAcGFyYW0gIHtvYmp9IHBhcmFtc1xuICAgKiAgLSBtZXRob2Q6ICdHRVQnIHwgJ1BPU1QnLFxuICAgKiAgLSB1cmw6IHVybCByZXF1ZXN0ZWRcbiAgICogQHBhcmFtICB7c3RyaW5nfSBjYWxsYmFja0lkXG4gICAqL1xuICBzZW5kSHR0cDogZnVuY3Rpb24gKHBhcmFtLCBjYWxsYmFja0lkKSB7XG4gICAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHBhcmFtID0gSlNPTi5wYXJzZShwYXJhbSlcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcGFyYW0gIT09ICdvYmplY3QnIHx8ICFwYXJhbS51cmwpIHtcbiAgICAgIHJldHVybiBsb2dnZXIuZXJyb3IoXG4gICAgICAgICdpbnZhbGlkIGNvbmZpZyBvciBpbnZhbGlkIGNvbmZpZy51cmwgZm9yIHNlbmRIdHRwIEFQSScpXG4gICAgfVxuXG4gICAgdmFyIHNlbmRlciA9IHRoaXMuc2VuZGVyXG4gICAgdmFyIG1ldGhvZCA9IHBhcmFtLm1ldGhvZCB8fCAnR0VUJ1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuICAgIHhoci5vcGVuKG1ldGhvZCwgcGFyYW0udXJsLCB0cnVlKVxuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBzZW5kZXIucGVyZm9ybUNhbGxiYWNrKGNhbGxiYWNrSWQsIHRoaXMucmVzcG9uc2VUZXh0KVxuICAgIH1cbiAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgcmV0dXJuIGxvZ2dlci5lcnJvcigndW5leHBlY3RlZCBlcnJvciBpbiBzZW5kSHR0cCBBUEknLCBlcnJvcilcbiAgICAgIHNlbmRlci5wZXJmb3JtQ2FsbGJhY2soXG4gICAgICAgIGNhbGxiYWNrSWQsXG4gICAgICAgIG5ldyBFcnJvcigndW5leHBlY3RlZCBlcnJvciBpbiBzZW5kSHR0cCBBUEknKVxuICAgICAgKVxuICAgIH1cbiAgICB4aHIuc2VuZCgpXG4gIH0sXG5cbiAgLyoqXG4gICAqIGZldGNoXG4gICAqIHVzZSBzdHJlYW0uZmV0Y2ggdG8gcmVxdWVzdCBmb3IgYSBqc29uIGZpbGUsIGEgcGxhaW4gdGV4dCBmaWxlIG9yXG4gICAqIGEgYXJyYXlidWZmZXIgZm9yIGEgZmlsZSBzdHJlYW0uIChZb3UgY2FuIHVzZSBCbG9iIGFuZCBGaWxlUmVhZGVyXG4gICAqIEFQSSBpbXBsZW1lbnRlZCBieSBtb3N0IG1vZGVybiBicm93c2VycyB0byByZWFkIGEgYXJyYXlidWZmZXIuKVxuICAgKiBAcGFyYW0gIHtvYmplY3R9IG9wdGlvbnMgY29uZmlnIG9wdGlvbnNcbiAgICogICAtIG1ldGhvZCB7c3RyaW5nfSAnR0VUJyB8ICdQT1NUJ1xuICAgKiAgIC0gaGVhZGVycyB7b2JqfVxuICAgKiAgIC0gdXJsIHtzdHJpbmd9XG4gICAqICAgLSBtb2RlIHtzdHJpbmd9ICdjb3JzJyB8ICduby1jb3JzJyB8ICdzYW1lLW9yaWdpbicgfCAnbmF2aWdhdGUnXG4gICAqICAgLSBib2R5XG4gICAqICAgLSB0eXBlIHtzdHJpbmd9ICdqc29uJyB8ICdqc29ucCcgfCAndGV4dCdcbiAgICogQHBhcmFtICB7c3RyaW5nfSBjYWxsYmFja0lkXG4gICAqIEBwYXJhbSAge3N0cmluZ30gcHJvZ3Jlc3NDYWxsYmFja0lkXG4gICAqL1xuICBmZXRjaDogZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrSWQsIHByb2dyZXNzQ2FsbGJhY2tJZCkge1xuXG4gICAgdmFyIERFRkFVTFRfTUVUSE9EID0gJ0dFVCdcbiAgICB2YXIgREVGQVVMVF9NT0RFID0gJ2NvcnMnXG4gICAgdmFyIERFRkFVTFRfVFlQRSA9ICd0ZXh0J1xuXG4gICAgdmFyIG1ldGhvZE9wdGlvbnMgPSBbJ0dFVCcsICdQT1NUJ11cbiAgICB2YXIgbW9kZU9wdGlvbnMgPSBbJ2NvcnMnLCAnbm8tY29ycycsICdzYW1lLW9yaWdpbicsICduYXZpZ2F0ZSddXG4gICAgdmFyIHR5cGVPcHRpb25zID0gWyd0ZXh0JywgJ2pzb24nLCAnanNvbnAnLCAnYXJyYXlidWZmZXInXVxuXG4gICAgdmFyIGZhbGxiYWNrID0gZmFsc2UgIC8vIGZhbGxiYWNrIGZyb20gJ2ZldGNoJyBBUEkgdG8gWEhSLlxuICAgIHZhciBzZW5kZXIgPSB0aGlzLnNlbmRlclxuXG4gICAgdmFyIGNvbmZpZyA9IHV0aWxzLmV4dGVuZCh7fSwgb3B0aW9ucylcblxuICAgIC8vIHZhbGlkYXRlIG9wdGlvbnMubWV0aG9kXG4gICAgaWYgKHR5cGVvZiBjb25maWcubWV0aG9kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uZmlnLm1ldGhvZCA9IERFRkFVTFRfTUVUSE9EXG4gICAgICBsb2dnZXIud2Fybignb3B0aW9ucy5tZXRob2QgZm9yIFxcJ2ZldGNoXFwnIEFQSSBoYXMgYmVlbiBzZXQgdG8gJ1xuICAgICAgICArICdkZWZhdWx0IHZhbHVlIFxcJycgKyBjb25maWcubWV0aG9kICsgJ1xcJycpXG4gICAgfSBlbHNlIGlmIChtZXRob2RPcHRpb25zLmluZGV4T2YoKGNvbmZpZy5tZXRob2QgKyAnJylcbiAgICAgICAgLnRvVXBwZXJDYXNlKCkpID09PSAtMSkge1xuICAgICAgcmV0dXJuIGxvZ2dlci5lcnJvcignb3B0aW9ucy5tZXRob2QgXFwnJ1xuICAgICAgICArIGNvbmZpZy5tZXRob2RcbiAgICAgICAgKyAnXFwnIGZvciBcXCdmZXRjaFxcJyBBUEkgc2hvdWxkIGJlIG9uZSBvZiAnXG4gICAgICAgICsgbWV0aG9kT3B0aW9ucyArICcuJylcbiAgICB9XG5cbiAgICAvLyB2YWxpZGF0ZSBvcHRpb25zLnVybFxuICAgIGlmICghY29uZmlnLnVybCkge1xuICAgICAgcmV0dXJuIGxvZ2dlci5lcnJvcignb3B0aW9ucy51cmwgc2hvdWxkIGJlIHNldCBmb3IgXFwnZmV0Y2hcXCcgQVBJLicpXG4gICAgfVxuXG4gICAgLy8gdmFsaWRhdGUgb3B0aW9ucy5tb2RlXG4gICAgaWYgKHR5cGVvZiBjb25maWcubW9kZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbmZpZy5tb2RlID0gREVGQVVMVF9NT0RFXG4gICAgfSBlbHNlIGlmIChtb2RlT3B0aW9ucy5pbmRleE9mKChjb25maWcubW9kZSArICcnKS50b0xvd2VyQ2FzZSgpKSA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBsb2dnZXIuZXJyb3IoJ29wdGlvbnMubW9kZSBcXCcnXG4gICAgICAgICsgY29uZmlnLm1vZGVcbiAgICAgICAgKyAnXFwnIGZvciBcXCdmZXRjaFxcJyBBUEkgc2hvdWxkIGJlIG9uZSBvZiAnXG4gICAgICAgICsgbW9kZU9wdGlvbnMgKyAnLicpXG4gICAgfVxuXG4gICAgLy8gdmFsaWRhdGUgb3B0aW9ucy50eXBlXG4gICAgaWYgKHR5cGVvZiBjb25maWcudHlwZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbmZpZy50eXBlID0gREVGQVVMVF9UWVBFXG4gICAgICBsb2dnZXIud2Fybignb3B0aW9ucy50eXBlIGZvciBcXCdmZXRjaFxcJyBBUEkgaGFzIGJlZW4gc2V0IHRvICdcbiAgICAgICAgKyAnZGVmYXVsdCB2YWx1ZSBcXCcnICsgY29uZmlnLnR5cGUgKyAnXFwnLicpXG4gICAgfSBlbHNlIGlmICh0eXBlT3B0aW9ucy5pbmRleE9mKChjb25maWcudHlwZSArICcnKS50b0xvd2VyQ2FzZSgpKSA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBsb2dnZXIuZXJyb3IoJ29wdGlvbnMudHlwZSBcXCcnXG4gICAgICAgICAgKyBjb25maWcudHlwZVxuICAgICAgICAgICsgJ1xcJyBmb3IgXFwnZmV0Y2hcXCcgQVBJIHNob3VsZCBiZSBvbmUgb2YgJ1xuICAgICAgICAgICsgdHlwZU9wdGlvbnMgKyAnLicpXG4gICAgfVxuXG4gICAgdmFyIF9jYWxsQXJncyA9IFtjb25maWcsIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIHNlbmRlci5wZXJmb3JtQ2FsbGJhY2soY2FsbGJhY2tJZCwgcmVzKVxuICAgIH1dXG4gICAgaWYgKHByb2dyZXNzQ2FsbGJhY2tJZCkge1xuICAgICAgX2NhbGxBcmdzLnB1c2goZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAvLyBTZXQgJ2tlZXBBbGl2ZScgdG8gdHJ1ZSBmb3Igc2VuZGluZyBjb250aW51b3VzIGNhbGxiYWNrc1xuICAgICAgICBzZW5kZXIucGVyZm9ybUNhbGxiYWNrKHByb2dyZXNzQ2FsbGJhY2tJZCwgcmVzLCB0cnVlKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdqc29ucCcpIHtcbiAgICAgIF9qc29ucC5hcHBseSh0aGlzLCBfY2FsbEFyZ3MpXG4gICAgfSBlbHNlIHtcbiAgICAgIF94aHIuYXBwbHkodGhpcywgX2NhbGxBcmdzKVxuICAgIH1cbiAgfVxuXG59XG5cbnN0cmVhbS5fbWV0YSA9IHtcbiAgc3RyZWFtOiBbe1xuICAgIG5hbWU6ICdzZW5kSHR0cCcsXG4gICAgYXJnczogWydvYmplY3QnLCAnZnVuY3Rpb24nXVxuICB9LCB7XG4gICAgbmFtZTogJ2ZldGNoJyxcbiAgICBhcmdzOiBbJ29iamVjdCcsICdmdW5jdGlvbicsICdmdW5jdGlvbiddXG4gIH1dXG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3RyZWFtXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9hcGkvc3RyZWFtLmpzXG4gKiogbW9kdWxlIGlkID0gOTlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIih0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykgJiYgKHdpbmRvdyA9IHtjdHJsOiB7fSwgbGliOiB7fX0pOyF3aW5kb3cuY3RybCAmJiAod2luZG93LmN0cmwgPSB7fSk7IXdpbmRvdy5saWIgJiYgKHdpbmRvdy5saWIgPSB7fSk7IWZ1bmN0aW9uKGEsYil7ZnVuY3Rpb24gYyhhKXt2YXIgYj17fTtPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcyxcInBhcmFtc1wiLHtzZXQ6ZnVuY3Rpb24oYSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGEpe2Zvcih2YXIgYyBpbiBiKWRlbGV0ZSBiW2NdO2Zvcih2YXIgYyBpbiBhKWJbY109YVtjXX19LGdldDpmdW5jdGlvbigpe3JldHVybiBifSxlbnVtZXJhYmxlOiEwfSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsXCJzZWFyY2hcIix7c2V0OmZ1bmN0aW9uKGEpe2lmKFwic3RyaW5nXCI9PXR5cGVvZiBhKXswPT09YS5pbmRleE9mKFwiP1wiKSYmKGE9YS5zdWJzdHIoMSkpO3ZhciBjPWEuc3BsaXQoXCImXCIpO2Zvcih2YXIgZCBpbiBiKWRlbGV0ZSBiW2RdO2Zvcih2YXIgZT0wO2U8Yy5sZW5ndGg7ZSsrKXt2YXIgZj1jW2VdLnNwbGl0KFwiPVwiKTtpZih2b2lkIDAhPT1mWzFdJiYoZlsxXT1mWzFdLnRvU3RyaW5nKCkpLGZbMF0pdHJ5e2JbZGVjb2RlVVJJQ29tcG9uZW50KGZbMF0pXT1kZWNvZGVVUklDb21wb25lbnQoZlsxXSl9Y2F0Y2goZyl7YltmWzBdXT1mWzFdfX19fSxnZXQ6ZnVuY3Rpb24oKXt2YXIgYT1bXTtmb3IodmFyIGMgaW4gYilpZih2b2lkIDAhPT1iW2NdKWlmKFwiXCIhPT1iW2NdKXRyeXthLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGMpK1wiPVwiK2VuY29kZVVSSUNvbXBvbmVudChiW2NdKSl9Y2F0Y2goZCl7YS5wdXNoKGMrXCI9XCIrYltjXSl9ZWxzZSB0cnl7YS5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChjKSl9Y2F0Y2goZCl7YS5wdXNoKGMpfXJldHVybiBhLmxlbmd0aD9cIj9cIithLmpvaW4oXCImXCIpOlwiXCJ9LGVudW1lcmFibGU6ITB9KTt2YXIgYztPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcyxcImhhc2hcIix7c2V0OmZ1bmN0aW9uKGEpe1wic3RyaW5nXCI9PXR5cGVvZiBhJiYoYSYmYS5pbmRleE9mKFwiI1wiKTwwJiYoYT1cIiNcIithKSxjPWF8fFwiXCIpfSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gY30sZW51bWVyYWJsZTohMH0pLHRoaXMuc2V0PWZ1bmN0aW9uKGEpe2E9YXx8XCJcIjt2YXIgYjtpZighKGI9YS5tYXRjaChuZXcgUmVnRXhwKFwiXihbYS16MC05LV0rOik/Wy9dezJ9KD86KFteQC86P10rKSg/OjooW15ALzpdKykpP0ApPyhbXjovPyNdKykoPzpbOl0oWzAtOV0rKSk/KFsvXVtePyM7XSopPyg/Ols/XShbXiNdKikpPyhbI11bXj9dKik/JFwiLFwiaVwiKSkpKXRocm93IG5ldyBFcnJvcihcIldyb25nIHVyaSBzY2hlbWUuXCIpO3RoaXMucHJvdG9jb2w9YlsxXXx8KFwib2JqZWN0XCI9PXR5cGVvZiBsb2NhdGlvbj9sb2NhdGlvbi5wcm90b2NvbDpcIlwiKSx0aGlzLnVzZXJuYW1lPWJbMl18fFwiXCIsdGhpcy5wYXNzd29yZD1iWzNdfHxcIlwiLHRoaXMuaG9zdG5hbWU9dGhpcy5ob3N0PWJbNF0sdGhpcy5wb3J0PWJbNV18fFwiXCIsdGhpcy5wYXRobmFtZT1iWzZdfHxcIi9cIix0aGlzLnNlYXJjaD1iWzddfHxcIlwiLHRoaXMuaGFzaD1iWzhdfHxcIlwiLHRoaXMub3JpZ2luPXRoaXMucHJvdG9jb2wrXCIvL1wiK3RoaXMuaG9zdG5hbWV9LHRoaXMudG9TdHJpbmc9ZnVuY3Rpb24oKXt2YXIgYT10aGlzLnByb3RvY29sK1wiLy9cIjtyZXR1cm4gdGhpcy51c2VybmFtZSYmKGErPXRoaXMudXNlcm5hbWUsdGhpcy5wYXNzd29yZCYmKGErPVwiOlwiK3RoaXMucGFzc3dvcmQpLGErPVwiQFwiKSxhKz10aGlzLmhvc3QsdGhpcy5wb3J0JiZcIjgwXCIhPT10aGlzLnBvcnQmJihhKz1cIjpcIit0aGlzLnBvcnQpLHRoaXMucGF0aG5hbWUmJihhKz10aGlzLnBhdGhuYW1lKSx0aGlzLnNlYXJjaCYmKGErPXRoaXMuc2VhcmNoKSx0aGlzLmhhc2gmJihhKz10aGlzLmhhc2gpLGF9LGEmJnRoaXMuc2V0KGEudG9TdHJpbmcoKSl9Yi5odHRwdXJsPWZ1bmN0aW9uKGEpe3JldHVybiBuZXcgYyhhKX19KHdpbmRvdyx3aW5kb3cubGlifHwod2luZG93LmxpYj17fSkpOzttb2R1bGUuZXhwb3J0cyA9IHdpbmRvdy5saWJbJ2h0dHB1cmwnXTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9odHRwdXJsL2J1aWxkL2h0dHB1cmwuY29tbW9uLmpzXG4gKiogbW9kdWxlIGlkID0gMTAwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIG1vZGFsID0gcmVxdWlyZSgnbW9kYWxzJylcblxudmFyIG1zZyA9IHtcblxuICAvLyBkdXJhdGlvbjogZGVmYXVsdCBpcyAwLjggc2Vjb25kcy5cbiAgdG9hc3Q6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICBtb2RhbC50b2FzdChjb25maWcubWVzc2FnZSwgY29uZmlnLmR1cmF0aW9uKVxuICB9LFxuXG4gIC8vIGNvbmZpZzpcbiAgLy8gIC0gbWVzc2FnZTogc3RyaW5nXG4gIC8vICAtIG9rVGl0bGU6IHRpdGxlIG9mIG9rIGJ1dHRvblxuICAvLyAgLSBjYWxsYmFja1xuICBhbGVydDogZnVuY3Rpb24gKGNvbmZpZywgY2FsbGJhY2tJZCkge1xuICAgIHZhciBzZW5kZXIgPSAgdGhpcy5zZW5kZXJcbiAgICBjb25maWcuY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBzZW5kZXIucGVyZm9ybUNhbGxiYWNrKGNhbGxiYWNrSWQpXG4gICAgfVxuICAgIG1vZGFsLmFsZXJ0KGNvbmZpZylcbiAgfSxcblxuICAvLyBjb25maWc6XG4gIC8vICAtIG1lc3NhZ2U6IHN0cmluZ1xuICAvLyAgLSBva1RpdGxlOiB0aXRsZSBvZiBvayBidXR0b25cbiAgLy8gIC0gY2FuY2VsVGl0bGU6IHRpdGxlIG9mIGNhbmNlbCBidXR0b25cbiAgLy8gIC0gY2FsbGJhY2tcbiAgY29uZmlybTogZnVuY3Rpb24gKGNvbmZpZywgY2FsbGJhY2tJZCkge1xuICAgIHZhciBzZW5kZXIgPSAgdGhpcy5zZW5kZXJcbiAgICBjb25maWcuY2FsbGJhY2sgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICBzZW5kZXIucGVyZm9ybUNhbGxiYWNrKGNhbGxiYWNrSWQsIHZhbClcbiAgICB9XG4gICAgbW9kYWwuY29uZmlybShjb25maWcpXG4gIH0sXG5cbiAgLy8gY29uZmlnOlxuICAvLyAgLSBtZXNzYWdlOiBzdHJpbmdcbiAgLy8gIC0gb2tUaXRsZTogdGl0bGUgb2Ygb2sgYnV0dG9uXG4gIC8vICAtIGNhbmNlbFRpdGxlOiB0aXRsZSBvZiBjYW5jZWwgYnV0dG9uXG4gIC8vICAtIGNhbGxiYWNrXG4gIHByb21wdDogZnVuY3Rpb24gKGNvbmZpZywgY2FsbGJhY2tJZCkge1xuICAgIHZhciBzZW5kZXIgPSAgdGhpcy5zZW5kZXJcbiAgICBjb25maWcuY2FsbGJhY2sgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICBzZW5kZXIucGVyZm9ybUNhbGxiYWNrKGNhbGxiYWNrSWQsIHZhbClcbiAgICB9XG4gICAgbW9kYWwucHJvbXB0KGNvbmZpZylcbiAgfVxuXG59XG5cbm1zZy5fbWV0YSA9IHtcbiAgbW9kYWw6IFt7XG4gICAgbmFtZTogJ3RvYXN0JyxcbiAgICBhcmdzOiBbJ29iamVjdCddXG4gIH0sIHtcbiAgICBuYW1lOiAnYWxlcnQnLFxuICAgIGFyZ3M6IFsnb2JqZWN0JywgJ3N0cmluZyddXG4gIH0sIHtcbiAgICBuYW1lOiAnY29uZmlybScsXG4gICAgYXJnczogWydvYmplY3QnLCAnc3RyaW5nJ11cbiAgfSwge1xuICAgIG5hbWU6ICdwcm9tcHQnLFxuICAgIGFyZ3M6IFsnb2JqZWN0JywgJ3N0cmluZyddXG4gIH1dXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbXNnXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2FwaS9tb2RhbC5qc1xuICoqIG1vZHVsZSBpZCA9IDEwMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBBbGVydCA9IHJlcXVpcmUoJy4vYWxlcnQnKVxudmFyIENvbmZpcm0gPSByZXF1aXJlKCcuL2NvbmZpcm0nKVxudmFyIFByb21wdCA9IHJlcXVpcmUoJy4vcHJvbXB0JylcbnZhciB0b2FzdCA9IHJlcXVpcmUoJy4vdG9hc3QnKVxuXG52YXIgbW9kYWwgPSB7XG5cbiAgdG9hc3Q6IGZ1bmN0aW9uIChtc2csIGR1cmF0aW9uKSB7XG4gICAgdG9hc3QucHVzaChtc2csIGR1cmF0aW9uKVxuICB9LFxuXG4gIGFsZXJ0OiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgbmV3IEFsZXJ0KGNvbmZpZykuc2hvdygpXG4gIH0sXG5cbiAgcHJvbXB0OiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgbmV3IFByb21wdChjb25maWcpLnNob3coKVxuICB9LFxuXG4gIGNvbmZpcm06IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICBuZXcgQ29uZmlybShjb25maWcpLnNob3coKVxuICB9XG5cbn1cblxuIXdpbmRvdy5saWIgJiYgKHdpbmRvdy5saWIgPSB7fSlcbndpbmRvdy5saWIubW9kYWwgPSBtb2RhbFxuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZGFsXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbW9kYWxzL3NyYy9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDEwMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBNb2RhbCA9IHJlcXVpcmUoJy4vbW9kYWwnKVxucmVxdWlyZSgnLi4vc3R5bGVzL2FsZXJ0LmNzcycpXG5cbnZhciBDT05URU5UX0NMQVNTID0gJ2NvbnRlbnQnXG52YXIgTVNHX0NMQVNTID0gJ2NvbnRlbnQtbXNnJ1xudmFyIEJVVFRPTl9HUk9VUF9DTEFTUyA9ICdidG4tZ3JvdXAnXG52YXIgQlVUVE9OX0NMQVNTID0gJ2J0bidcblxuZnVuY3Rpb24gQWxlcnQoY29uZmlnKSB7XG4gIHRoaXMubXNnID0gY29uZmlnLm1lc3NhZ2UgfHwgJydcbiAgdGhpcy5jYWxsYmFjayA9IGNvbmZpZy5jYWxsYmFja1xuICB0aGlzLm9rVGl0bGUgPSBjb25maWcub2tUaXRsZSB8fCAnT0snXG4gIE1vZGFsLmNhbGwodGhpcylcbiAgdGhpcy5ub2RlLmNsYXNzTGlzdC5hZGQoJ2FtZmUtYWxlcnQnKVxufVxuXG5BbGVydC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE1vZGFsLnByb3RvdHlwZSlcblxuQWxlcnQucHJvdG90eXBlLmNyZWF0ZU5vZGVDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIGNvbnRlbnQuY2xhc3NMaXN0LmFkZChDT05URU5UX0NMQVNTKVxuICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQoY29udGVudClcblxuICB2YXIgbXNnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgbXNnLmNsYXNzTGlzdC5hZGQoTVNHX0NMQVNTKVxuICBtc2cuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5tc2cpKVxuICBjb250ZW50LmFwcGVuZENoaWxkKG1zZylcblxuICB2YXIgYnV0dG9uR3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBidXR0b25Hcm91cC5jbGFzc0xpc3QuYWRkKEJVVFRPTl9HUk9VUF9DTEFTUylcbiAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKGJ1dHRvbkdyb3VwKVxuICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgYnV0dG9uLmNsYXNzTGlzdC5hZGQoQlVUVE9OX0NMQVNTLCAnYWxlcnQtb2snKVxuICBidXR0b24uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5va1RpdGxlKSlcbiAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQoYnV0dG9uKVxufVxuXG5BbGVydC5wcm90b3R5cGUuYmluZEV2ZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgTW9kYWwucHJvdG90eXBlLmJpbmRFdmVudHMuY2FsbCh0aGlzKVxuICB2YXIgYnV0dG9uID0gdGhpcy5ub2RlLnF1ZXJ5U2VsZWN0b3IoJy4nICsgQlVUVE9OX0NMQVNTKVxuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kZXN0cm95KClcbiAgICB0aGlzLmNhbGxiYWNrICYmIHRoaXMuY2FsbGJhY2soKVxuICB9LmJpbmQodGhpcykpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQWxlcnRcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L21vZGFscy9zcmMvYWxlcnQuanNcbiAqKiBtb2R1bGUgaWQgPSAxMDNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG5yZXF1aXJlKCcuLi9zdHlsZXMvbW9kYWwuY3NzJylcblxuLy8gdGhlcmUgd2lsbCBiZSBvbmx5IG9uZSBpbnN0YW5jZSBvZiBtb2RhbC5cbnZhciBNT0RBTF9XUkFQX0NMQVNTID0gJ2FtZmUtbW9kYWwtd3JhcCdcbnZhciBNT0RBTF9OT0RFX0NMQVNTID0gJ2FtZmUtbW9kYWwtbm9kZSdcblxuZnVuY3Rpb24gTW9kYWwoKSB7XG4gIHRoaXMud3JhcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoTU9EQUxfV1JBUF9DTEFTUylcbiAgdGhpcy5ub2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihNT0RBTF9OT0RFX0NMQVNTKVxuICBpZiAoIXRoaXMud3JhcCkge1xuICAgIHRoaXMuY3JlYXRlV3JhcCgpXG4gIH1cbiAgaWYgKCF0aGlzLm5vZGUpIHtcbiAgICB0aGlzLmNyZWF0ZU5vZGUoKVxuICB9XG4gIHRoaXMuY2xlYXJOb2RlKClcbiAgdGhpcy5jcmVhdGVOb2RlQ29udGVudCgpXG4gIHRoaXMuYmluZEV2ZW50cygpXG59XG5cbk1vZGFsLnByb3RvdHlwZSA9IHtcblxuICBzaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy53cmFwLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgdGhpcy5ub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGUnKVxuICB9LFxuXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRoaXMud3JhcClcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRoaXMubm9kZSlcbiAgICB0aGlzLndyYXAgPSBudWxsXG4gICAgdGhpcy5ub2RlID0gbnVsbFxuICB9LFxuXG4gIGNyZWF0ZVdyYXA6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLndyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHRoaXMud3JhcC5jbGFzc05hbWUgPSBNT0RBTF9XUkFQX0NMQVNTXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLndyYXApXG4gIH0sXG5cbiAgY3JlYXRlTm9kZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMubm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy5ub2RlLmNsYXNzTGlzdC5hZGQoTU9EQUxfTk9ERV9DTEFTUywgJ2hpZGUnKVxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5ub2RlKVxuICB9LFxuXG4gIGNsZWFyTm9kZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMubm9kZS5pbm5lckhUTUwgPSAnJ1xuICB9LFxuXG4gIGNyZWF0ZU5vZGVDb250ZW50OiBmdW5jdGlvbiAoKSB7XG5cbiAgICAvLyBkbyBub3RoaW5nLlxuICAgIC8vIGNoaWxkIGNsYXNzZXMgY2FuIG92ZXJyaWRlIHRoaXMgbWV0aG9kLlxuICB9LFxuXG4gIGJpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLndyYXAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgfSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGFsXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9tb2RhbHMvc3JjL21vZGFsLmpzXG4gKiogbW9kdWxlIGlkID0gMTA0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vbW9kYWwuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9tb2RhbC5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL21vZGFsLmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbW9kYWxzL3N0eWxlcy9tb2RhbC5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMDVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIuYW1mZS1tb2RhbC13cmFwIHtcXG4gIGRpc3BsYXk6IG5vbmU7XFxuICBwb3NpdGlvbjogZml4ZWQ7XFxuICB6LWluZGV4OiA5OTk5OTk5OTk7XFxuICB0b3A6IDA7XFxuICBsZWZ0OiAwO1xcbiAgd2lkdGg6IDEwMCU7XFxuICBoZWlnaHQ6IDEwMCU7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwO1xcbiAgb3BhY2l0eTogMC41O1xcbn1cXG5cXG4uYW1mZS1tb2RhbC1ub2RlIHtcXG4gIHBvc2l0aW9uOiBmaXhlZDtcXG4gIHotaW5kZXg6IDk5OTk5OTk5OTk7XFxuICB0b3A6IDUwJTtcXG4gIGxlZnQ6IDUwJTtcXG4gIHdpZHRoOiA2LjY2NjY2N3JlbTtcXG4gIG1pbi1oZWlnaHQ6IDIuNjY2NjY3cmVtO1xcbiAgYm9yZGVyLXJhZGl1czogMC4wNjY2NjdyZW07XFxuICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xcbn1cXG4uYW1mZS1tb2RhbC1ub2RlLmhpZGUge1xcbiAgZGlzcGxheTogbm9uZTtcXG59XFxuLmFtZmUtbW9kYWwtbm9kZSAuY29udGVudCB7XFxuICBkaXNwbGF5OiAtd2Via2l0LWJveDtcXG4gIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcXG4gIGRpc3BsYXk6IGZsZXg7XFxuICAtd2Via2l0LWJveC1vcmllbnQ6IHZlcnRpY2FsO1xcbiAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcXG4gIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XFxuICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XFxuICBhbGlnbi1pdGVtczogY2VudGVyO1xcbiAgLXdlYmtpdC1ib3gtcGFjazogY2VudGVyO1xcbiAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xcbiAgd2lkdGg6IDEwMCU7XFxuICBtaW4taGVpZ2h0OiAxLjg2NjY2N3JlbTtcXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICBmb250LXNpemU6IDAuMzJyZW07XFxuICBsaW5lLWhlaWdodDogMC40MjY2NjdyZW07XFxuICBwYWRkaW5nOiAwLjIxMzMzM3JlbTtcXG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZGRkO1xcbn1cXG4uYW1mZS1tb2RhbC1ub2RlIC5idG4tZ3JvdXAge1xcbiAgd2lkdGg6IDEwMCU7XFxuICBoZWlnaHQ6IDAuOHJlbTtcXG4gIGZvbnQtc2l6ZTogMC4zNzMzMzNyZW07XFxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxuICBtYXJnaW46IDA7XFxuICBwYWRkaW5nOiAwO1xcbiAgYm9yZGVyOiBub25lO1xcbn1cXG4uYW1mZS1tb2RhbC1ub2RlIC5idG4tZ3JvdXAgLmJ0biB7XFxuICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgaGVpZ2h0OiAwLjhyZW07XFxuICBsaW5lLWhlaWdodDogMC44cmVtO1xcbiAgbWFyZ2luOiAwO1xcbiAgcGFkZGluZzogMDtcXG4gIGJvcmRlcjogbm9uZTtcXG4gIGJhY2tncm91bmQ6IG5vbmU7XFxufVxcblwiLCBcIlwiXSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nzcy1sb2FkZXIhLi9+L21vZGFscy9zdHlsZXMvbW9kYWwuY3NzXG4gKiogbW9kdWxlIGlkID0gMTA2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vYWxlcnQuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9hbGVydC5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2FsZXJ0LmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbW9kYWxzL3N0eWxlcy9hbGVydC5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIuYW1mZS1hbGVydCAuYW1mZS1hbGVydC1vayB7XFxuICB3aWR0aDogMTAwJTtcXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vbW9kYWxzL3N0eWxlcy9hbGVydC5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMDhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgTW9kYWwgPSByZXF1aXJlKCcuL21vZGFsJylcbnJlcXVpcmUoJy4uL3N0eWxlcy9jb25maXJtLmNzcycpXG5cbnZhciBDT05URU5UX0NMQVNTID0gJ2NvbnRlbnQnXG52YXIgTVNHX0NMQVNTID0gJ2NvbnRlbnQtbXNnJ1xudmFyIEJVVFRPTl9HUk9VUF9DTEFTUyA9ICdidG4tZ3JvdXAnXG52YXIgQlVUVE9OX0NMQVNTID0gJ2J0bidcblxuZnVuY3Rpb24gQ29uZmlybShjb25maWcpIHtcbiAgdGhpcy5tc2cgPSBjb25maWcubWVzc2FnZSB8fCAnJ1xuICB0aGlzLmNhbGxiYWNrID0gY29uZmlnLmNhbGxiYWNrXG4gIHRoaXMub2tUaXRsZSA9IGNvbmZpZy5va1RpdGxlIHx8ICdPSydcbiAgdGhpcy5jYW5jZWxUaXRsZSA9IGNvbmZpZy5jYW5jZWxUaXRsZSB8fCAnQ2FuY2VsJ1xuICBNb2RhbC5jYWxsKHRoaXMpXG4gIHRoaXMubm9kZS5jbGFzc0xpc3QuYWRkKCdhbWZlLWNvbmZpcm0nKVxufVxuXG5Db25maXJtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTW9kYWwucHJvdG90eXBlKVxuXG5Db25maXJtLnByb3RvdHlwZS5jcmVhdGVOb2RlQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBjb250ZW50LmNsYXNzTGlzdC5hZGQoQ09OVEVOVF9DTEFTUylcbiAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKGNvbnRlbnQpXG5cbiAgdmFyIG1zZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIG1zZy5jbGFzc0xpc3QuYWRkKE1TR19DTEFTUylcbiAgbXNnLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMubXNnKSlcbiAgY29udGVudC5hcHBlbmRDaGlsZChtc2cpXG5cbiAgdmFyIGJ1dHRvbkdyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgYnV0dG9uR3JvdXAuY2xhc3NMaXN0LmFkZChCVVRUT05fR1JPVVBfQ0xBU1MpXG4gIHRoaXMubm9kZS5hcHBlbmRDaGlsZChidXR0b25Hcm91cClcbiAgdmFyIGJ0bk9rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgYnRuT2suYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5va1RpdGxlKSlcbiAgYnRuT2suY2xhc3NMaXN0LmFkZCgnYnRuLW9rJywgQlVUVE9OX0NMQVNTKVxuICB2YXIgYnRuQ2FuY2VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgYnRuQ2FuY2VsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuY2FuY2VsVGl0bGUpKVxuICBidG5DYW5jZWwuY2xhc3NMaXN0LmFkZCgnYnRuLWNhbmNlbCcsIEJVVFRPTl9DTEFTUylcbiAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQoYnRuT2spXG4gIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKGJ0bkNhbmNlbClcbiAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKGJ1dHRvbkdyb3VwKVxufVxuXG5Db25maXJtLnByb3RvdHlwZS5iaW5kRXZlbnRzID0gZnVuY3Rpb24gKCkge1xuICBNb2RhbC5wcm90b3R5cGUuYmluZEV2ZW50cy5jYWxsKHRoaXMpXG4gIHZhciBidG5PayA9IHRoaXMubm9kZS5xdWVyeVNlbGVjdG9yKCcuJyArIEJVVFRPTl9DTEFTUyArICcuYnRuLW9rJylcbiAgdmFyIGJ0bkNhbmNlbCA9IHRoaXMubm9kZS5xdWVyeVNlbGVjdG9yKCcuJyArIEJVVFRPTl9DTEFTUyArICcuYnRuLWNhbmNlbCcpXG4gIGJ0bk9rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZGVzdHJveSgpXG4gICAgdGhpcy5jYWxsYmFjayAmJiB0aGlzLmNhbGxiYWNrKHRoaXMub2tUaXRsZSlcbiAgfS5iaW5kKHRoaXMpKVxuICBidG5DYW5jZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kZXN0cm95KClcbiAgICB0aGlzLmNhbGxiYWNrICYmIHRoaXMuY2FsbGJhY2sodGhpcy5jYW5jZWxUaXRsZSlcbiAgfS5iaW5kKHRoaXMpKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbmZpcm1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L21vZGFscy9zcmMvY29uZmlybS5qc1xuICoqIG1vZHVsZSBpZCA9IDEwOVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL2NvbmZpcm0uY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi9jb25maXJtLmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vY29uZmlybS5jc3NcIik7XG5cdFx0XHRpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcblx0XHRcdHVwZGF0ZShuZXdDb250ZW50KTtcblx0XHR9KTtcblx0fVxuXHQvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L21vZGFscy9zdHlsZXMvY29uZmlybS5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMTBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIuYW1mZS1jb25maXJtIC5idG4tZ3JvdXAgLmJ0biB7XFxuICBmbG9hdDogbGVmdDtcXG4gIHdpZHRoOiA1MCU7XFxufVxcbi5hbWZlLWNvbmZpcm0gLmJ0bi1ncm91cCAuYnRuLmJ0bi1vayB7XFxuICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjZGRkO1xcbn1cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vfi9tb2RhbHMvc3R5bGVzL2NvbmZpcm0uY3NzXG4gKiogbW9kdWxlIGlkID0gMTExXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIE1vZGFsID0gcmVxdWlyZSgnLi9tb2RhbCcpXG5yZXF1aXJlKCcuLi9zdHlsZXMvcHJvbXB0LmNzcycpXG5cbnZhciBDT05URU5UX0NMQVNTID0gJ2NvbnRlbnQnXG52YXIgTVNHX0NMQVNTID0gJ2NvbnRlbnQtbXNnJ1xudmFyIEJVVFRPTl9HUk9VUF9DTEFTUyA9ICdidG4tZ3JvdXAnXG52YXIgQlVUVE9OX0NMQVNTID0gJ2J0bidcbnZhciBJTlBVVF9XUkFQX0NMQVNTID0gJ2lucHV0LXdyYXAnXG52YXIgSU5QVVRfQ0xBU1MgPSAnaW5wdXQnXG5cbmZ1bmN0aW9uIFByb21wdChjb25maWcpIHtcbiAgdGhpcy5tc2cgPSBjb25maWcubWVzc2FnZSB8fCAnJ1xuICB0aGlzLmRlZmF1bHRNc2cgPSBjb25maWcuZGVmYXVsdCB8fCAnJ1xuICB0aGlzLmNhbGxiYWNrID0gY29uZmlnLmNhbGxiYWNrXG4gIHRoaXMub2tUaXRsZSA9IGNvbmZpZy5va1RpdGxlIHx8ICdPSydcbiAgdGhpcy5jYW5jZWxUaXRsZSA9IGNvbmZpZy5jYW5jZWxUaXRsZSB8fCAnQ2FuY2VsJ1xuICBNb2RhbC5jYWxsKHRoaXMpXG4gIHRoaXMubm9kZS5jbGFzc0xpc3QuYWRkKCdhbWZlLXByb21wdCcpXG59XG5cblByb21wdC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE1vZGFsLnByb3RvdHlwZSlcblxuUHJvbXB0LnByb3RvdHlwZS5jcmVhdGVOb2RlQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcblxuICB2YXIgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIGNvbnRlbnQuY2xhc3NMaXN0LmFkZChDT05URU5UX0NMQVNTKVxuICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQoY29udGVudClcblxuICB2YXIgbXNnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgbXNnLmNsYXNzTGlzdC5hZGQoTVNHX0NMQVNTKVxuICBtc2cuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5tc2cpKVxuICBjb250ZW50LmFwcGVuZENoaWxkKG1zZylcblxuICB2YXIgaW5wdXRXcmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgaW5wdXRXcmFwLmNsYXNzTGlzdC5hZGQoSU5QVVRfV1JBUF9DTEFTUylcbiAgY29udGVudC5hcHBlbmRDaGlsZChpbnB1dFdyYXApXG4gIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JylcbiAgaW5wdXQuY2xhc3NMaXN0LmFkZChJTlBVVF9DTEFTUylcbiAgaW5wdXQudHlwZSA9ICd0ZXh0J1xuICBpbnB1dC5hdXRvZm9jdXMgPSB0cnVlXG4gIGlucHV0LnBsYWNlaG9sZGVyID0gdGhpcy5kZWZhdWx0TXNnXG4gIGlucHV0V3JhcC5hcHBlbmRDaGlsZChpbnB1dClcblxuICB2YXIgYnV0dG9uR3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBidXR0b25Hcm91cC5jbGFzc0xpc3QuYWRkKEJVVFRPTl9HUk9VUF9DTEFTUylcbiAgdmFyIGJ0bk9rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgYnRuT2suYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5va1RpdGxlKSlcbiAgYnRuT2suY2xhc3NMaXN0LmFkZCgnYnRuLW9rJywgQlVUVE9OX0NMQVNTKVxuICB2YXIgYnRuQ2FuY2VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgYnRuQ2FuY2VsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuY2FuY2VsVGl0bGUpKVxuICBidG5DYW5jZWwuY2xhc3NMaXN0LmFkZCgnYnRuLWNhbmNlbCcsIEJVVFRPTl9DTEFTUylcbiAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQoYnRuT2spXG4gIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKGJ0bkNhbmNlbClcbiAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKGJ1dHRvbkdyb3VwKVxufVxuXG5Qcm9tcHQucHJvdG90eXBlLmJpbmRFdmVudHMgPSBmdW5jdGlvbiAoKSB7XG4gIE1vZGFsLnByb3RvdHlwZS5iaW5kRXZlbnRzLmNhbGwodGhpcylcbiAgdmFyIGJ0bk9rID0gdGhpcy5ub2RlLnF1ZXJ5U2VsZWN0b3IoJy4nICsgQlVUVE9OX0NMQVNTICsgJy5idG4tb2snKVxuICB2YXIgYnRuQ2FuY2VsID0gdGhpcy5ub2RlLnF1ZXJ5U2VsZWN0b3IoJy4nICsgQlVUVE9OX0NMQVNTICsgJy5idG4tY2FuY2VsJylcbiAgdmFyIHRoYXQgPSB0aGlzXG4gIGJ0bk9rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIHZhciB2YWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpLnZhbHVlXG4gICAgdGhpcy5kZXN0cm95KClcbiAgICB0aGlzLmNhbGxiYWNrICYmIHRoaXMuY2FsbGJhY2soe1xuICAgICAgcmVzdWx0OiB0aGF0Lm9rVGl0bGUsXG4gICAgICBkYXRhOiB2YWxcbiAgICB9KVxuICB9LmJpbmQodGhpcykpXG4gIGJ0bkNhbmNlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdmFsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaW5wdXQnKS52YWx1ZVxuICAgIHRoaXMuZGVzdHJveSgpXG4gICAgdGhpcy5jYWxsYmFjayAmJiB0aGlzLmNhbGxiYWNrKHtcbiAgICAgIHJlc3VsdDogdGhhdC5jYW5jZWxUaXRsZSxcbiAgICAgIGRhdGE6IHZhbFxuICAgIH0pXG4gIH0uYmluZCh0aGlzKSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQcm9tcHRcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L21vZGFscy9zcmMvcHJvbXB0LmpzXG4gKiogbW9kdWxlIGlkID0gMTEyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcHJvbXB0LmNzc1wiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi8uLi8uLi9zdHlsZS1sb2FkZXIvYWRkU3R5bGVzLmpzXCIpKGNvbnRlbnQsIHt9KTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuXHQvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuXHRpZighY29udGVudC5sb2NhbHMpIHtcblx0XHRtb2R1bGUuaG90LmFjY2VwdChcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcHJvbXB0LmNzc1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vcHJvbXB0LmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbW9kYWxzL3N0eWxlcy9wcm9tcHQuY3NzXG4gKiogbW9kdWxlIGlkID0gMTEzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi8uLi8uLi9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSgpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLmFtZmUtcHJvbXB0IC5pbnB1dC13cmFwIHtcXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxuICB3aWR0aDogMTAwJTtcXG4gIG1hcmdpbi10b3A6IDAuMTMzMzMzcmVtO1xcbiAgLy8gcGFkZGluZzogMC4yNHJlbSAwLjIxMzMzM3JlbSAwLjIxMzMzM3JlbTtcXG4gIGhlaWdodDogMC45NnJlbTtcXG59XFxuLmFtZmUtcHJvbXB0IC5pbnB1dC13cmFwIC5pbnB1dCB7XFxuICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgd2lkdGg6IDEwMCU7XFxuICBoZWlnaHQ6IDAuNTZyZW07XFxuICBsaW5lLWhlaWdodDogMC41NnJlbTtcXG4gIGZvbnQtc2l6ZTogMC4zMnJlbTtcXG4gIGJvcmRlcjogMXB4IHNvbGlkICM5OTk7XFxufVxcbi5hbWZlLXByb21wdCAuYnRuLWdyb3VwIC5idG4ge1xcbiAgZmxvYXQ6IGxlZnQ7XFxuICB3aWR0aDogNTAlO1xcbn1cXG4uYW1mZS1wcm9tcHQgLmJ0bi1ncm91cCAuYnRuLmJ0bi1vayB7XFxuICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjZGRkO1xcbn1cXG5cIiwgXCJcIl0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9jc3MtbG9hZGVyIS4vfi9tb2RhbHMvc3R5bGVzL3Byb21wdC5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMTRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG5yZXF1aXJlKCcuLi9zdHlsZXMvdG9hc3QuY3NzJylcblxudmFyIHF1ZXVlID0gW11cbnZhciB0aW1lclxudmFyIGlzUHJvY2Vzc2luZyA9IGZhbHNlXG52YXIgdG9hc3RXaW5cbnZhciBUT0FTVF9XSU5fQ0xBU1NfTkFNRSA9ICdhbWZlLXRvYXN0J1xuXG52YXIgREVGQVVMVF9EVVJBVElPTiA9IDAuOFxuXG5mdW5jdGlvbiBzaG93VG9hc3RXaW5kb3cobXNnLCBjYWxsYmFjaykge1xuICB2YXIgaGFuZGxlVHJhbnNpdGlvbkVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0b2FzdFdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgaGFuZGxlVHJhbnNpdGlvbkVuZClcbiAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpXG4gIH1cbiAgaWYgKCF0b2FzdFdpbikge1xuICAgIHRvYXN0V2luID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0b2FzdFdpbi5jbGFzc0xpc3QuYWRkKFRPQVNUX1dJTl9DTEFTU19OQU1FLCAnaGlkZScpXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0b2FzdFdpbilcbiAgfVxuICB0b2FzdFdpbi5pbm5lckhUTUwgPSBtc2dcbiAgdG9hc3RXaW4uYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGhhbmRsZVRyYW5zaXRpb25FbmQpXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIHRvYXN0V2luLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGUnKVxuICB9LCAwKVxufVxuXG5mdW5jdGlvbiBoaWRlVG9hc3RXaW5kb3coY2FsbGJhY2spIHtcbiAgdmFyIGhhbmRsZVRyYW5zaXRpb25FbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdG9hc3RXaW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGhhbmRsZVRyYW5zaXRpb25FbmQpXG4gICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKVxuICB9XG4gIGlmICghdG9hc3RXaW4pIHtcbiAgICByZXR1cm5cbiAgfVxuICB0b2FzdFdpbi5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgaGFuZGxlVHJhbnNpdGlvbkVuZClcbiAgdG9hc3RXaW4uY2xhc3NMaXN0LmFkZCgnaGlkZScpXG59XG5cbnZhciB0b2FzdCA9IHtcblxuICBwdXNoOiBmdW5jdGlvbiAobXNnLCBkdXJhdGlvbikge1xuICAgIHF1ZXVlLnB1c2goe1xuICAgICAgbXNnOiBtc2csXG4gICAgICBkdXJhdGlvbjogZHVyYXRpb24gfHwgREVGQVVMVF9EVVJBVElPTlxuICAgIH0pXG4gICAgdGhpcy5zaG93KClcbiAgfSxcblxuICBzaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG5cbiAgICAvLyBBbGwgbWVzc2FnZXMgaGFkIGJlZW4gdG9hc3RlZCBhbHJlYWR5LCBzbyByZW1vdmUgdGhlIHRvYXN0IHdpbmRvdyxcbiAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuICAgICAgdG9hc3RXaW4gJiYgdG9hc3RXaW4ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0b2FzdFdpbilcbiAgICAgIHRvYXN0V2luID0gbnVsbFxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gdGhlIHByZXZpb3VzIHRvYXN0IGlzIG5vdCBlbmRlZCB5ZXQuXG4gICAgaWYgKGlzUHJvY2Vzc2luZykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlzUHJvY2Vzc2luZyA9IHRydWVcblxuICAgIHZhciB0b2FzdEluZm8gPSBxdWV1ZS5zaGlmdCgpXG4gICAgc2hvd1RvYXN0V2luZG93KHRvYXN0SW5mby5tc2csIGZ1bmN0aW9uICgpIHtcbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRpbWVyID0gbnVsbFxuICAgICAgICBoaWRlVG9hc3RXaW5kb3coZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlzUHJvY2Vzc2luZyA9IGZhbHNlXG4gICAgICAgICAgdGhhdC5zaG93KClcbiAgICAgICAgfSlcbiAgICAgIH0sIHRvYXN0SW5mby5kdXJhdGlvbiAqIDEwMDApXG4gICAgfSlcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwdXNoOiB0b2FzdC5wdXNoLmJpbmQodG9hc3QpXG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9tb2RhbHMvc3JjL3RvYXN0LmpzXG4gKiogbW9kdWxlIGlkID0gMTE1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi8uLi8uLi9jc3MtbG9hZGVyL2luZGV4LmpzIS4vdG9hc3QuY3NzXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLy4uLy4uL3N0eWxlLWxvYWRlci9hZGRTdHlsZXMuanNcIikoY29udGVudCwge30pO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG5cdC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG5cdGlmKCFjb250ZW50LmxvY2Fscykge1xuXHRcdG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLy4uLy4uL2Nzcy1sb2FkZXIvaW5kZXguanMhLi90b2FzdC5jc3NcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4vLi4vLi4vY3NzLWxvYWRlci9pbmRleC5qcyEuL3RvYXN0LmNzc1wiKTtcblx0XHRcdGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuXHRcdFx0dXBkYXRlKG5ld0NvbnRlbnQpO1xuXHRcdH0pO1xuXHR9XG5cdC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3Ncblx0bW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vbW9kYWxzL3N0eWxlcy90b2FzdC5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMTZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLy4uLy4uL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKCk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIuYW1mZS10b2FzdCB7XFxuICBmb250LXNpemU6IDAuMzJyZW07XFxuICBsaW5lLWhlaWdodDogMC40MjY2NjdyZW07XFxuICBwb3NpdGlvbjogZml4ZWQ7XFxuICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbiAgbWF4LXdpZHRoOiA4MCU7XFxuICBib3R0b206IDIuNjY2NjY3cmVtO1xcbiAgbGVmdDogNTAlO1xcbiAgcGFkZGluZzogMC4yMTMzMzNyZW07XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwO1xcbiAgY29sb3I6ICNmZmY7XFxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxuICBvcGFjaXR5OiAwLjY7XFxuICB0cmFuc2l0aW9uOiBhbGwgMC40cyBlYXNlLWluLW91dDtcXG4gIGJvcmRlci1yYWRpdXM6IDAuMDY2NjY3cmVtO1xcbiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XFxufVxcblxcbi5hbWZlLXRvYXN0LmhpZGUge1xcbiAgb3BhY2l0eTogMDtcXG59XFxuXCIsIFwiXCJdKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vY3NzLWxvYWRlciEuL34vbW9kYWxzL3N0eWxlcy90b2FzdC5jc3NcbiAqKiBtb2R1bGUgaWQgPSAxMTdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgU2VuZGVyID0gcmVxdWlyZSgnLi4vYnJpZGdlL3NlbmRlcicpXG5cbnZhciBfZGF0YSA9IHt9XG5cbnZhciBhbmltYXRpb24gPSB7XG5cbiAgLyoqXG4gICAqIHRyYW5zaXRpb25cbiAgICogQHBhcmFtICB7c3RyaW5nfSByZWYgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICogQHBhcmFtICB7b2JqfSBjb25maWcgICAgIFtkZXNjcmlwdGlvbl1cbiAgICogQHBhcmFtICB7c3RyaW5nfSBjYWxsYmFja0lkIFtkZXNjcmlwdGlvbl1cbiAgICovXG4gIHRyYW5zaXRpb246IGZ1bmN0aW9uIChyZWYsIGNvbmZpZywgY2FsbGJhY2tJZCkge1xuICAgIHZhciByZWZEYXRhID0gX2RhdGFbcmVmXVxuICAgIHZhciBzdHlsZXNLZXkgPSBKU09OLnN0cmluZ2lmeShjb25maWcuc3R5bGVzKVxuICAgIHZhciB3ZWV4SW5zdGFuY2UgPSB0aGlzXG4gICAgLy8gSWYgdGhlIHNhbWUgY29tcG9uZW50IHBlcmZvcm0gYSBhbmltYXRpb24gd2l0aCBleGFjdGx5IHRoZSBzYW1lXG4gICAgLy8gc3R5bGVzIGluIGEgc2VxdWVuY2Ugd2l0aCBzbyBzaG9ydCBpbnRlcnZhbCB0aGF0IHRoZSBwcmV2IGFuaW1hdGlvblxuICAgIC8vIGlzIHN0aWxsIGluIHBsYXlpbmcsIHRoZW4gdGhlIG5leHQgYW5pbWF0aW9uIHNob3VsZCBiZSBpZ25vcmVkLlxuICAgIGlmIChyZWZEYXRhICYmIHJlZkRhdGFbc3R5bGVzS2V5XSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICghcmVmRGF0YSkge1xuICAgICAgcmVmRGF0YSA9IF9kYXRhW3JlZl0gPSB7fVxuICAgIH1cbiAgICByZWZEYXRhW3N0eWxlc0tleV0gPSB0cnVlXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29tcG9uZW50TWFuYWdlcigpLnRyYW5zaXRpb24ocmVmLCBjb25maWcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFJlbW92ZSB0aGUgc3R5bGVzS2V5IGluIHJlZkRhdGEgc28gdGhhdCB0aGUgc2FtZSBhbmltYXRpb25cbiAgICAgIC8vIGNhbiBiZSBwbGF5ZWQgYWdhaW4gYWZ0ZXIgY3VycmVudCBhbmltYXRpb24gaXMgYWxyZWFkeSBmaW5pc2hlZC5cbiAgICAgIGRlbGV0ZSByZWZEYXRhW3N0eWxlc0tleV1cbiAgICAgIHdlZXhJbnN0YW5jZS5zZW5kZXIucGVyZm9ybUNhbGxiYWNrKGNhbGxiYWNrSWQpXG4gICAgfSlcbiAgfVxuXG59XG5cbmFuaW1hdGlvbi5fbWV0YSA9IHtcbiAgYW5pbWF0aW9uOiBbe1xuICAgIG5hbWU6ICd0cmFuc2l0aW9uJyxcbiAgICBhcmdzOiBbJ3N0cmluZycsICdvYmplY3QnLCAnc3RyaW5nJ11cbiAgfV1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhbmltYXRpb25cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvYXBpL2FuaW1hdGlvbi5qc1xuICoqIG1vZHVsZSBpZCA9IDExOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBzZW5kZXIgPSByZXF1aXJlKCcuLi9icmlkZ2Uvc2VuZGVyJylcblxudmFyIHdlYnZpZXcgPSB7XG5cbiAgLy8gcmVmOiByZWYgb2YgdGhlIHdlYiBjb21wb25lbnQuXG4gIGdvQmFjazogZnVuY3Rpb24gKHJlZikge1xuICAgIHZhciB3ZWJDb21wID0gdGhpcy5nZXRDb21wb25lbnRNYW5hZ2VyKCkuZ2V0RWxlbWVudEJ5UmVmKHJlZilcbiAgICBpZiAoIXdlYkNvbXAuZ29CYWNrKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdlcnJvcjogdGhlIHNwZWNpZmllZCBjb21wb25lbnQgaGFzIG5vIG1ldGhvZCBvZidcbiAgICAgICAgICArICcgZ29CYWNrLiBQbGVhc2UgbWFrZSBzdXJlIGl0IGlzIGEgd2VidmlldyBjb21wb25lbnQuJylcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB3ZWJDb21wLmdvQmFjaygpXG4gIH0sXG5cbiAgLy8gcmVmOiByZWYgb2YgdGhlIHdlYiBjb21wb25lbnQuXG4gIGdvRm9yd2FyZDogZnVuY3Rpb24gKHJlZikge1xuICAgIHZhciB3ZWJDb21wID0gdGhpcy5nZXRDb21wb25lbnRNYW5hZ2VyKCkuZ2V0RWxlbWVudEJ5UmVmKHJlZilcbiAgICBpZiAoIXdlYkNvbXAuZ29Gb3J3YXJkKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdlcnJvcjogdGhlIHNwZWNpZmllZCBjb21wb25lbnQgaGFzIG5vIG1ldGhvZCBvZidcbiAgICAgICAgICArICcgZ29Gb3J3YXJkLiBQbGVhc2UgbWFrZSBzdXJlIGl0IGlzIGEgd2VidmlldyBjb21wb25lbnQuJylcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB3ZWJDb21wLmdvRm9yd2FyZCgpXG4gIH0sXG5cbiAgLy8gcmVmOiByZWYgb2YgdGhlIHdlYiBjb21wb25lbnQuXG4gIHJlbG9hZDogZnVuY3Rpb24gKHJlZikge1xuICAgIHZhciB3ZWJDb21wID0gdGhpcy5nZXRDb21wb25lbnRNYW5hZ2VyKCkuZ2V0RWxlbWVudEJ5UmVmKHJlZilcbiAgICBpZiAoIXdlYkNvbXAucmVsb2FkKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdlcnJvcjogdGhlIHNwZWNpZmllZCBjb21wb25lbnQgaGFzIG5vIG1ldGhvZCBvZidcbiAgICAgICAgICArICcgcmVsb2FkLiBQbGVhc2UgbWFrZSBzdXJlIGl0IGlzIGEgd2VidmlldyBjb21wb25lbnQuJylcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB3ZWJDb21wLnJlbG9hZCgpXG4gIH1cblxufVxuXG53ZWJ2aWV3Ll9tZXRhID0ge1xuICB3ZWJ2aWV3OiBbe1xuICAgIG5hbWU6ICdnb0JhY2snLFxuICAgIGFyZ3M6IFsnc3RyaW5nJ11cbiAgfSwge1xuICAgIG5hbWU6ICdnb0ZvcndhcmQnLFxuICAgIGFyZ3M6IFsnc3RyaW5nJ11cbiAgfSwge1xuICAgIG5hbWU6ICdyZWxvYWQnLFxuICAgIGFyZ3M6IFsnc3RyaW5nJ11cbiAgfV1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB3ZWJ2aWV3XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2FwaS93ZWJ2aWV3LmpzXG4gKiogbW9kdWxlIGlkID0gMTE5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCdcblxudmFyIHRpbWVyID0ge1xuXG4gIHNldFRpbWVvdXQ6IGZ1bmN0aW9uICh0aW1lb3V0Q2FsbGJhY2tJZCwgZGVsYXkpIHtcbiAgICB2YXIgc2VuZGVyID0gdGhpcy5zZW5kZXJcbiAgICB2YXIgdGltZXJJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgc2VuZGVyLnBlcmZvcm1DYWxsYmFjayh0aW1lb3V0Q2FsbGJhY2tJZClcbiAgICB9LCBkZWxheSlcbiAgfSxcblxuICBjbGVhclRpbWVvdXQ6IGZ1bmN0aW9uICh0aW1lcklkKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVySWQpXG4gIH1cblxufVxuXG50aW1lci5fbWV0YSA9IHtcbiAgdGltZXI6IFt7XG4gICAgbmFtZTogJ3NldFRpbWVvdXQnLFxuICAgIGFyZ3M6IFsnZnVuY3Rpb24nLCAnbnVtYmVyJ11cbiAgfSwge1xuICAgIG5hbWU6ICdjbGVhclRpbWVvdXQnLFxuICAgIGFyZ3M6IFsnbnVtYmVyJ11cbiAgfV1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aW1lclxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9hcGkvdGltZXIuanNcbiAqKiBtb2R1bGUgaWQgPSAxMjBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0J1xuXG52YXIgbmF2aWdhdG9yID0ge1xuXG4gIC8vIGNvbmZpZ1xuICAvLyAgLSB1cmw6IHRoZSB1cmwgdG8gcHVzaFxuICAvLyAgLSBhbmltYXRlZDogdGhpcyBjb25maWd1cmF0aW9uIGl0ZW0gaXMgbmF0aXZlIG9ubHlcbiAgLy8gIGNhbGxiYWNrIGlzIG5vdCBjdXJyZW50bHkgc3VwcG9ydGVkXG4gIHB1c2g6IGZ1bmN0aW9uIChjb25maWcsIGNhbGxiYWNrSWQpIHtcbiAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGNvbmZpZy51cmxcbiAgICB0aGlzLnNlbmRlci5wZXJmb3JtQ2FsbGJhY2soY2FsbGJhY2tJZClcbiAgfSxcblxuICAvLyBjb25maWdcbiAgLy8gIC0gYW5pbWF0ZWQ6IHRoaXMgY29uZmlndXJhdGlvbiBpdGVtIGlzIG5hdGl2ZSBvbmx5XG4gIC8vICBjYWxsYmFjayBpcyBub3RlIGN1cnJlbnRseSBzdXBwb3J0ZWRcbiAgcG9wOiBmdW5jdGlvbiAoY29uZmlnLCBjYWxsYmFja0lkKSB7XG4gICAgd2luZG93Lmhpc3RvcnkuYmFjaygpXG4gICAgdGhpcy5zZW5kZXIucGVyZm9ybUNhbGxiYWNrKGNhbGxiYWNrSWQpXG4gIH1cblxufVxuXG5uYXZpZ2F0b3IuX21ldGEgPSB7XG4gIG5hdmlnYXRvcjogW3tcbiAgICBuYW1lOiAncHVzaCcsXG4gICAgYXJnczogWydvYmplY3QnLCAnZnVuY3Rpb24nXVxuICB9LCB7XG4gICAgbmFtZTogJ3BvcCcsXG4gICAgYXJnczogWydvYmplY3QnLCAnZnVuY3Rpb24nXVxuICB9XVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5hdmlnYXRvclxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9hcGkvbmF2aWdhdG9yLmpzXG4gKiogbW9kdWxlIGlkID0gMTIxXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpICYmICh3aW5kb3cgPSB7Y3RybDoge30sIGxpYjoge319KTshd2luZG93LmN0cmwgJiYgKHdpbmRvdy5jdHJsID0ge30pOyF3aW5kb3cubGliICYmICh3aW5kb3cubGliID0ge30pOyFmdW5jdGlvbihhLGIpe2Z1bmN0aW9uIGMoYSl7T2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsXCJ2YWxcIix7dmFsdWU6YS50b1N0cmluZygpLGVudW1lcmFibGU6ITB9KSx0aGlzLmd0PWZ1bmN0aW9uKGEpe3JldHVybiBjLmNvbXBhcmUodGhpcyxhKT4wfSx0aGlzLmd0ZT1mdW5jdGlvbihhKXtyZXR1cm4gYy5jb21wYXJlKHRoaXMsYSk+PTB9LHRoaXMubHQ9ZnVuY3Rpb24oYSl7cmV0dXJuIGMuY29tcGFyZSh0aGlzLGEpPDB9LHRoaXMubHRlPWZ1bmN0aW9uKGEpe3JldHVybiBjLmNvbXBhcmUodGhpcyxhKTw9MH0sdGhpcy5lcT1mdW5jdGlvbihhKXtyZXR1cm4gMD09PWMuY29tcGFyZSh0aGlzLGEpfX1iLmVudj1iLmVudnx8e30sYy5wcm90b3R5cGUudG9TdHJpbmc9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy52YWx9LGMucHJvdG90eXBlLnZhbHVlT2Y9ZnVuY3Rpb24oKXtmb3IodmFyIGE9dGhpcy52YWwuc3BsaXQoXCIuXCIpLGI9W10sYz0wO2M8YS5sZW5ndGg7YysrKXt2YXIgZD1wYXJzZUludChhW2NdLDEwKTtpc05hTihkKSYmKGQ9MCk7dmFyIGU9ZC50b1N0cmluZygpO2UubGVuZ3RoPDUmJihlPUFycmF5KDYtZS5sZW5ndGgpLmpvaW4oXCIwXCIpK2UpLGIucHVzaChlKSwxPT09Yi5sZW5ndGgmJmIucHVzaChcIi5cIil9cmV0dXJuIHBhcnNlRmxvYXQoYi5qb2luKFwiXCIpKX0sYy5jb21wYXJlPWZ1bmN0aW9uKGEsYil7YT1hLnRvU3RyaW5nKCkuc3BsaXQoXCIuXCIpLGI9Yi50b1N0cmluZygpLnNwbGl0KFwiLlwiKTtmb3IodmFyIGM9MDtjPGEubGVuZ3RofHxjPGIubGVuZ3RoO2MrKyl7dmFyIGQ9cGFyc2VJbnQoYVtjXSwxMCksZT1wYXJzZUludChiW2NdLDEwKTtpZih3aW5kb3cuaXNOYU4oZCkmJihkPTApLHdpbmRvdy5pc05hTihlKSYmKGU9MCksZT5kKXJldHVybi0xO2lmKGQ+ZSlyZXR1cm4gMX1yZXR1cm4gMH0sYi52ZXJzaW9uPWZ1bmN0aW9uKGEpe3JldHVybiBuZXcgYyhhKX19KHdpbmRvdyx3aW5kb3cubGlifHwod2luZG93LmxpYj17fSkpLGZ1bmN0aW9uKGEsYil7Yi5lbnY9Yi5lbnZ8fHt9O3ZhciBjPWEubG9jYXRpb24uc2VhcmNoLnJlcGxhY2UoL15cXD8vLFwiXCIpO2lmKGIuZW52LnBhcmFtcz17fSxjKWZvcih2YXIgZD1jLnNwbGl0KFwiJlwiKSxlPTA7ZTxkLmxlbmd0aDtlKyspe2RbZV09ZFtlXS5zcGxpdChcIj1cIik7dHJ5e2IuZW52LnBhcmFtc1tkW2VdWzBdXT1kZWNvZGVVUklDb21wb25lbnQoZFtlXVsxXSl9Y2F0Y2goZil7Yi5lbnYucGFyYW1zW2RbZV1bMF1dPWRbZV1bMV19fX0od2luZG93LHdpbmRvdy5saWJ8fCh3aW5kb3cubGliPXt9KSksZnVuY3Rpb24oYSxiKXtiLmVudj1iLmVudnx8e307dmFyIGMsZD1hLm5hdmlnYXRvci51c2VyQWdlbnQ7aWYoYz1kLm1hdGNoKC9XaW5kb3dzXFxzUGhvbmVcXHMoPzpPU1xccyk/KFtcXGRcXC5dKykvKSliLmVudi5vcz17bmFtZTpcIldpbmRvd3MgUGhvbmVcIixpc1dpbmRvd3NQaG9uZTohMCx2ZXJzaW9uOmNbMV19O2Vsc2UgaWYoZC5tYXRjaCgvU2FmYXJpLykmJihjPWQubWF0Y2goL0FuZHJvaWRbXFxzXFwvXShbXFxkXFwuXSspLykpKWIuZW52Lm9zPXt2ZXJzaW9uOmNbMV19LGQubWF0Y2goL01vYmlsZVxccytTYWZhcmkvKT8oYi5lbnYub3MubmFtZT1cIkFuZHJvaWRcIixiLmVudi5vcy5pc0FuZHJvaWQ9ITApOihiLmVudi5vcy5uYW1lPVwiQW5kcm9pZFBhZFwiLGIuZW52Lm9zLmlzQW5kcm9pZFBhZD0hMCk7ZWxzZSBpZihjPWQubWF0Y2goLyhpUGhvbmV8aVBhZHxpUG9kKS8pKXt2YXIgZT1jWzFdO2M9ZC5tYXRjaCgvT1MgKFtcXGRfXFwuXSspIGxpa2UgTWFjIE9TIFgvKSxiLmVudi5vcz17bmFtZTplLGlzSVBob25lOlwiaVBob25lXCI9PT1lfHxcImlQb2RcIj09PWUsaXNJUGFkOlwiaVBhZFwiPT09ZSxpc0lPUzohMCx2ZXJzaW9uOmNbMV0uc3BsaXQoXCJfXCIpLmpvaW4oXCIuXCIpfX1lbHNlIGIuZW52Lm9zPXtuYW1lOlwidW5rbm93blwiLHZlcnNpb246XCIwLjAuMFwifTtiLnZlcnNpb24mJihiLmVudi5vcy52ZXJzaW9uPWIudmVyc2lvbihiLmVudi5vcy52ZXJzaW9uKSl9KHdpbmRvdyx3aW5kb3cubGlifHwod2luZG93LmxpYj17fSkpLGZ1bmN0aW9uKGEsYil7Yi5lbnY9Yi5lbnZ8fHt9O3ZhciBjLGQ9YS5uYXZpZ2F0b3IudXNlckFnZW50OyhjPWQubWF0Y2goLyg/OlVDV0VCfFVDQnJvd3NlclxcLykoW1xcZFxcLl0rKS8pKT9iLmVudi5icm93c2VyPXtuYW1lOlwiVUNcIixpc1VDOiEwLHZlcnNpb246Y1sxXX06KGM9ZC5tYXRjaCgvTVFRQnJvd3NlclxcLyhbXFxkXFwuXSspLykpP2IuZW52LmJyb3dzZXI9e25hbWU6XCJRUVwiLGlzUVE6ITAsdmVyc2lvbjpjWzFdfTooYz1kLm1hdGNoKC9GaXJlZm94XFwvKFtcXGRcXC5dKykvKSk/Yi5lbnYuYnJvd3Nlcj17bmFtZTpcIkZpcmVmb3hcIixpc0ZpcmVmb3g6ITAsdmVyc2lvbjpjWzFdfTooYz1kLm1hdGNoKC9NU0lFXFxzKFtcXGRcXC5dKykvKSl8fChjPWQubWF0Y2goL0lFTW9iaWxlXFwvKFtcXGRcXC5dKykvKSk/KGIuZW52LmJyb3dzZXI9e3ZlcnNpb246Y1sxXX0sZC5tYXRjaCgvSUVNb2JpbGUvKT8oYi5lbnYuYnJvd3Nlci5uYW1lPVwiSUVNb2JpbGVcIixiLmVudi5icm93c2VyLmlzSUVNb2JpbGU9ITApOihiLmVudi5icm93c2VyLm5hbWU9XCJJRVwiLGIuZW52LmJyb3dzZXIuaXNJRT0hMCksZC5tYXRjaCgvQW5kcm9pZHxpUGhvbmUvKSYmKGIuZW52LmJyb3dzZXIuaXNJRUxpa2VXZWJraXQ9ITApKTooYz1kLm1hdGNoKC8oPzpDaHJvbWV8Q3JpT1MpXFwvKFtcXGRcXC5dKykvKSk/KGIuZW52LmJyb3dzZXI9e25hbWU6XCJDaHJvbWVcIixpc0Nocm9tZTohMCx2ZXJzaW9uOmNbMV19LGQubWF0Y2goL1ZlcnNpb25cXC9bXFxkK1xcLl0rXFxzKkNocm9tZS8pJiYoYi5lbnYuYnJvd3Nlci5uYW1lPVwiQ2hyb21lIFdlYnZpZXdcIixiLmVudi5icm93c2VyLmlzV2Vidmlldz0hMCkpOmQubWF0Y2goL1NhZmFyaS8pJiYoYz1kLm1hdGNoKC9BbmRyb2lkW1xcc1xcL10oW1xcZFxcLl0rKS8pKT9iLmVudi5icm93c2VyPXtuYW1lOlwiQW5kcm9pZFwiLGlzQW5kcm9pZDohMCx2ZXJzaW9uOmNbMV19OmQubWF0Y2goL2lQaG9uZXxpUGFkfGlQb2QvKT9kLm1hdGNoKC9TYWZhcmkvKT8oYz1kLm1hdGNoKC9WZXJzaW9uXFwvKFtcXGRcXC5dKykvKSxiLmVudi5icm93c2VyPXtuYW1lOlwiU2FmYXJpXCIsaXNTYWZhcmk6ITAsdmVyc2lvbjpjWzFdfSk6KGM9ZC5tYXRjaCgvT1MgKFtcXGRfXFwuXSspIGxpa2UgTWFjIE9TIFgvKSxiLmVudi5icm93c2VyPXtuYW1lOlwiaU9TIFdlYnZpZXdcIixpc1dlYnZpZXc6ITAsdmVyc2lvbjpjWzFdLnJlcGxhY2UoL1xcXy9nLFwiLlwiKX0pOmIuZW52LmJyb3dzZXI9e25hbWU6XCJ1bmtub3duXCIsdmVyc2lvbjpcIjAuMC4wXCJ9LGIudmVyc2lvbiYmKGIuZW52LmJyb3dzZXIudmVyc2lvbj1iLnZlcnNpb24oYi5lbnYuYnJvd3Nlci52ZXJzaW9uKSl9KHdpbmRvdyx3aW5kb3cubGlifHwod2luZG93LmxpYj17fSkpLGZ1bmN0aW9uKGEsYil7Yi5lbnY9Yi5lbnZ8fHt9O3ZhciBjPWEubmF2aWdhdG9yLnVzZXJBZ2VudDtjLm1hdGNoKC9XZWliby9pKT9iLmVudi50aGlyZGFwcD17YXBwbmFtZTpcIldlaWJvXCIsaXNXZWlibzohMH06Yy5tYXRjaCgvTWljcm9NZXNzZW5nZXIvaSk/Yi5lbnYudGhpcmRhcHA9e2FwcG5hbWU6XCJXZWl4aW5cIixpc1dlaXhpbjohMH06Yi5lbnYudGhpcmRhcHA9ITF9KHdpbmRvdyx3aW5kb3cubGlifHwod2luZG93LmxpYj17fSkpLGZ1bmN0aW9uKGEsYil7Yi5lbnY9Yi5lbnZ8fHt9O3ZhciBjLGQsZT1hLm5hdmlnYXRvci51c2VyQWdlbnQ7KGQ9ZS5tYXRjaCgvV2luZFZhbmVbXFwvXFxzXShbXFxkXFwuXFxfXSspLykpJiYoYz1kWzFdKTt2YXIgZj0hMSxnPVwiXCIsaD1cIlwiLGk9XCJcIjsoZD1lLm1hdGNoKC9BbGlBcHBcXCgoW0EtWlxcLV0rKVxcLyhbXFxkXFwuXSspXFwpL2kpKSYmKGY9ITAsZz1kWzFdLGk9ZFsyXSxoPWcuaW5kZXhPZihcIi1QRFwiKT4wP2IuZW52Lm9zLmlzSU9TP1wiaVBhZFwiOmIuZW52Lm9zLmlzQW5kcm9pZD9cIkFuZHJvaWRQYWRcIjpiLmVudi5vcy5uYW1lOmIuZW52Lm9zLm5hbWUpLCFnJiZlLmluZGV4T2YoXCJUQklPU1wiKT4wJiYoZz1cIlRCXCIpLGY/Yi5lbnYuYWxpYXBwPXt3aW5kdmFuZTpiLnZlcnNpb24oY3x8XCIwLjAuMFwiKSxhcHBuYW1lOmd8fFwidW5rb3duXCIsdmVyc2lvbjpiLnZlcnNpb24oaXx8XCIwLjAuMFwiKSxwbGF0Zm9ybTpofHxiLmVudi5vcy5uYW1lfTpiLmVudi5hbGlhcHA9ITEsYi5lbnYudGFvYmFvQXBwPWIuZW52LmFsaWFwcH0od2luZG93LHdpbmRvdy5saWJ8fCh3aW5kb3cubGliPXt9KSk7O21vZHVsZS5leHBvcnRzID0gd2luZG93LmxpYlsnZW52J107XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZW52ZC9idWlsZC9lbnZkLmNvbW1vbi5qc1xuICoqIG1vZHVsZSBpZCA9IDEyMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==