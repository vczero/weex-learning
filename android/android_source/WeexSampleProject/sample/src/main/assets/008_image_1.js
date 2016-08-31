/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	;__weex_define__("@weex-component/8367b3e36cad509207a4f6298923f64d", [], function(__weex_require__, __weex_exports__, __weex_module__){

	;__weex_module__.exports.template = __weex_module__.exports.template || {}
	;Object.assign(__weex_module__.exports.template, {
	  "type": "div",
	  "children": [
	    {
	      "type": "text",
	      "attr": {
	        "value": "resize=stretch"
	      }
	    },
	    {
	      "type": "image",
	      "classList": [
	        "icon1"
	      ],
	      "attr": {
	        "src": "http://www.bz55.com/uploads1/allimg/120312/1_120312100435_8.jpg"
	      }
	    },
	    {
	      "type": "text",
	      "attr": {
	        "value": "resize=cover"
	      }
	    },
	    {
	      "type": "image",
	      "classList": [
	        "icon2"
	      ],
	      "attr": {
	        "src": "http://www.bz55.com/uploads1/allimg/120312/1_120312100435_8.jpg"
	      }
	    },
	    {
	      "type": "text",
	      "attr": {
	        "value": "resize=contain"
	      }
	    },
	    {
	      "type": "image",
	      "classList": [
	        "icon3"
	      ],
	      "attr": {
	        "src": "http://www.bz55.com/uploads1/allimg/120312/1_120312100435_8.jpg"
	      }
	    }
	  ]
	})
	;__weex_module__.exports.style = __weex_module__.exports.style || {}
	;Object.assign(__weex_module__.exports.style, {
	  "icon1": {
	    "width": 400,
	    "height": 200,
	    "resize": "stretch",
	    "top": 5
	  },
	  "icon2": {
	    "width": 400,
	    "height": 200,
	    "resize": "cover",
	    "top": 5
	  },
	  "icon3": {
	    "width": 400,
	    "height": 200,
	    "resize": "contain",
	    "top": 5
	  }
	})
	})
	;__weex_bootstrap__("@weex-component/8367b3e36cad509207a4f6298923f64d", {
	  "transformerVersion": "0.3.1"
	},undefined)

/***/ }
/******/ ]);