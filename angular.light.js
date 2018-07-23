/*******************************************************************************************
 * @ Name : Angular Light binding
 * @ Author : Abbas Hosseini
 * @ Description : A simple library that support two way binding with angular syntax
 * @ Version : 2.0.0
 * @ Last update : Saturday - 2018 27 January
 ******************************************************************************************/


/**
 * @class Observer pattern
 * @description A way to otify changes to number of objects
 */
class Observer {
    constructor() {
        this.observers = [];
    }
    /**
     * Subscribe observer in observerList
     * 
     * @param {Object} obs is a observer object
     */
    subscribe(obs) {
        this.observers.push(obs)
    }
    /**
     * Notify a change to all subsribes objects
     * 
     * @param {Function} action is a change that notify to other objects
     */
    notify(action) {
        this.observers.forEach(obs => action.call(this, obs))
    }
}







var angular = (function () {

    /**
     * Controller scope class
     * 
     * @class {Scope}
     * @description binding part between the H(view) and (controller)
     */
    class Scope {
        constructor() {}
    }

    /**
     * Angular controller
     * 
     * @class {Module}
     */
    class Module {
        constructor(moduleName) {
            this.$rootScope = {
                name : '$rootScope',
                childs : {}
        };
            this.dom = document.querySelectorAll('[ng-app=' + moduleName + ']');
        }
    }

    /**
     * Angular module
     * 
     * @class {Controller}
     */
    class Controller {
        constructor(module) {
            this.$scope = new Scope(); 
            this.module = module;
        }

        getDom(ctrlName, ctrlFn) {
            this.name = ctrlName;
            this.module.$rootScope.childs[ctrlName] = this.$scope;
            this.dom = this.getController(this.module.dom, ctrlName);
            return this.dom
        }

        /**
         * Get module controllers
         * 
         * @param {String} ctrlName
         * @param {Object} moduleDom is dom object
         * @description Find target controller based on controller name
         */
        getController(moduleDom, ctrlName) {

            //Sample : <div ng-app="" ng-controller=""></div>
            if (moduleDom[0].getAttribute('ng-controller') == ctrlName) {
                return moduleDom[0]
            }

            var ctrls = moduleDom[0].querySelectorAll('[ng-controller]');
            for (var i = 0; i < ctrls.length; i++) {
                if (ctrls[i].getAttribute('ng-controller') == ctrlName) {
                    return ctrls[i];
                    break;
                }
            }
        }

    }

    /**
     * Angular class
     * 
     * @class {Angular}
     */
    class Angular {

        /**
         * Define angular module
         * 
         * @param {String} moduleName
         */
        module(moduleName) {
            var self = this;
            var module = new Module(moduleName);

            return {
                controller: function (ctrlName, ctrlFn) {
                    var ctrl = new Controller(module)
                    var crtlDom = ctrl.getDom(ctrlName, ctrlFn);
                    var ctrlScope = ctrl.$scope;
                    var moduleScope = module.$rootScope;

                    //Twoway data binding
                    var binding = new TwowayBind();
                    binding.initialize(crtlDom, ctrlFn, ctrlScope, moduleScope)
                }
            }
        }
    }

    /**
     * Twoway data binding module
     * 
     * @class {TwowayBind}
     */
    class TwowayBind {

        /**
         * Initial a angular controller with a unique scope
         */
        initialize(crtlDom, ctrlFn, ctrlScope, moduleScope) {
            var self = this;
            //Pass scope to controller callback
            ctrlFn.call(window, ctrlScope, moduleScope);
            //Use observer pattern
            this.observer = new Observer();
            this.watchList = {};
            //Define reactivity for biding model to ui
            self.traverseObject(ctrlScope)

            this.$scope = JSON.parse(JSON.stringify(ctrlScope));
            self.traveseDom(crtlDom, function (node) {
                self.compile(node);
            });
        }

        /** 
         * Backward literal
         * 
         * @param {String} str Is somthing like 'portal.user.name'
         * @returns {String} 'portal.user.name' => portal.user'
         * @description  A function for backward object literal string
         */
        backward(str) {
            var arr = str.split('.');
            //fix strings that have '.' in end => 'portal.user.'
            if (arr[arr.length - 1] == '') {
                arr.pop();
            }
            arr.pop();
            return arr.join('.') + '.';
        }

        /** 
         * Traversing object properties 
         * 
         * @param {Object} obj is literal object for traversing
         * @param {String} setProp is string like 'portal.user.name'
         */
        traverseObject(obj, setProp) {
            self = this;
            var setProp = setProp || '';
            for (let prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    setProp += prop;
                    //Define reactivity
                    self.defineReactive(obj, prop, obj[prop], setProp)
                    if (typeof obj[prop] == "object") {
                        setProp = setProp + '.'
                        self.traverseObject(obj[prop], setProp);
                    }
                };
                //Remove last prop after any iteration in loop
                setProp = self.backward(setProp)
            }
        }

        /** 
         * @param {Object} obj is scope coming from controller
         * @param {Object} prop is target to define reactivity
         * @param {Any} val is value for define for getter
         * @param {String} setProp is property literal 'portal.user.name'
         * @description : Define reactivity for properties coming from controller
         */
        defineReactive(obj, prop, val, setProp) {
            var self = this;
            Object.defineProperty(obj, prop, {
                enumerable: true,
                configurable: false,
                get: function () {
                    return val;
                },
                set: function (newVal) {
                    self.set(setProp, newVal)
                }
            });
        }

        /** 
         * Traversing dom nodes
         * 
         * @param {Object} node is a dom element
         * @param {Function} func is a callback that have node as argument 
         */
        traveseDom(node, func) {
            //Pass attr node as callback arg
            func(node);
            node = node.firstChild;
            while (node) {
                this.traveseDom(node, func);
                node = node.nextSibling;
            }
        }

        /** 
         * @param {String} node is a dom element
         * @description  Decide how to bind dom nodes 
         */
        compile(node) {
            //text node dont have outerHTML
            var nodeValue = node.outerHTML || node.nodeValue,
                childs = {
                    textNodes: [],
                    attrNodes: [],
                },
                reg = /{{[^}]*}}/gi,
                self = this,
                points = self.parse(nodeValue);
            if (points.hasInterpolate) {
                //text
                if (node.nodeType == 3) {
                    childs.textNodes.push({
                        node: node,
                        value: node.nodeValue
                    });
                }
                //attributes
                if (node.attributes != undefined) {
                    var attrs = node.attributes;
                    for (var i = 0; i < attrs.length; i++) {
                        if (reg.test(attrs[i].nodeValue)) {
                            childs.attrNodes.push({
                                node: attrs[i],
                                value: attrs[i].nodeValue
                            });
                        }
                    }
                };
                self.bindText(node, nodeValue, childs, points);
            } else {
                //input
                if (node.tagName == 'INPUT' && node.getAttribute("ng-model")) {
                    self.bindInput(node);
                }
            }
        }

        /** 
         * @param {String} string is innerHTML of parsing node
         * @returns {Object} object is {start:[] ,end:[] ,interpolate: false}
         * @description : Parse placeholder of {{expressions}} for interpolation
         */
        parse(string) {
            var reg = /{{[^}]*}}/gi,
                points = {
                    start: [],
                    end: [],
                    hasInterpolate: false
                },
                match;
            while (match = reg.exec(string)) {
                points.start.push(match.index);
                points.end.push(match.index + match[0].length);
                points.hasInterpolate = true;
            }
            return points;
        }

        /** 
         * @param {String} a sample for string '{{name}} {{family}}'
         * @returns {String} interpolated string 'abbas hosseini'
         * @description : interpolating string
         * @ - string interpolation is a process in programming
         * @ - that replace values with placeholders
         */
        interpolate(string) {
            var self = this;
            var points = self.parse(string);
            if (points.hasInterpolate) {
                var start = string.substring(0, points.start[0]);
                var prop = (string.substring(points.start[0] + 2, points.end[0] - 2).trim());
                var value = self.get(prop);
                var end = name + string.substring(points.end[0])
                string = start + value + end;
                return self.interpolate(string);
            } else {
                return string
            }
        }

        /** 
         * @param {Object} node is a dom object
         * @param {Any} nodeValue is value for current node
         * @param {Object} childs is childs = {textNodes: [], attrNodes: []}
         * @param {Object} points is interpolations indexs list
         * @ - points = {start: [], end: [], hasInterpolate: false}
         * @description : binding interpolation placeholders
         */
        bindText(node, nodeValue, childs, points) {
            //Add properties to watchList object
            for (let index in points.start) {
                var prop = nodeValue.substring(points.start[index] + 2, points.end[index] - 2).trim();
                if (this.watchList[prop]) {
                    this.watchList[prop].textNodes = this.watchList[prop].textNodes.concat(childs.textNodes);
                    this.watchList[prop].attrNodes = this.watchList[prop].attrNodes.concat(childs.attrNodes);
                } else {
                    this.watchList[prop] = {
                        textNodes: childs.textNodes,
                        attrNodes: childs.attrNodes,
                        inputNodes: [],
                        value: this.get(prop) || ''
                    };
                }
                this.watch(this.watchList[prop], prop);
            }
        }

        /** 
         * Making two way data binding beetween ui and model
         * 
         * @param {Object} node is a dom object
         * @description : binding inputs to binding model for
         */
        bindInput(node) {
            var prop = node.getAttribute("ng-model"),
                self = this;
            if (this.get(prop)) {
                node.value = this.get(prop);
            } else {
                this.set(prop, node.value);
            }
            if (this.watchList[prop]) {
                this.watchList[prop].inputNodes.push(node);
            } else {
                this.watchList[prop] = {
                    textNodes: [],
                    attrNodes: [],
                    inputNodes: [node],
                    value: this.get(prop) || ''
                };
            }
            node.addEventListener("input", function (e) {
                self.set(prop, e.target.value);
            });
        }

        /** 
         * Update changes dom elements
         * @param {Object} bind is {inputNodes:[], attrNodes:[],textNodes:[], value:'' }
         * @param {Object} key is binding property
         */
        watch(bind, key) {
            bind.value = this.get(key);
            var self = this;
            //watch text nodes
            for (var i = 0; i < bind.textNodes.length; i++) {
                bind.textNodes[i].node.nodeValue = self.interpolate(bind.textNodes[i].value);
            }
            //watch attrs
            for (var i = 0; i < bind.attrNodes.length; i++) {
                bind.attrNodes[i].node.nodeValue = self.interpolate(bind.attrNodes[i].value);
            }
            //watch inputs
            for (var j = 0; j < bind.inputNodes.length; j++) {
                bind.inputNodes[j].value = bind.value;
            }
        }

        /** 
         * Get object property value
         * 
         * @param {String} exp is property expression 'user.name'
         * @returns {Any} value of property
         */
        get(exp) {
            var val = this.$scope;
            exp = exp.split('.');
            exp.forEach(function (k) {
                val = val[k];
            });
            return val;
        }

        /** 
         * Set property to object
         * 
         * @param {String} exp is property expression 'user.name'
         * @param {Any} value anything to assign to property
         */
        set(exp, value) {
            var val = this.$scope;
            var propStr = exp;
            exp = exp.split('.');
            exp.forEach(function (k, i) {
                if (i < exp.length - 1) {
                    val = val[k];
                } else {
                    val[k] = value;
                }
            });
            // set function notify change to watcher
            if (this.watchList[propStr]) {
                this.watch(this.watchList[propStr], propStr)
            }
        }
    }

    var angular = new Angular();
    //Public Interface
    return {
        module: function (moduleName) {
            return angular.module(moduleName)
        },
    }
})()