/*******************************************************************************************
 * @ Name : Angular Light 
 * @ Author : Abbas Hosseini
 * @ Description : A simple library that support two way binding with angular syntax
 * @ Version : 1.0.0
 * @ Last update : Saturday - 2018 27 January
 ******************************************************************************************/

//IFFE
var angular = (function () {
    /** 
     * @ {scope} is unique object for any controller
     */
    function scope() { }
    /** 
     * @ param {Object} moduleDom is dom object of <div ng-app="">
     * @ param {String} name of controller that user defined <div ng-controller="defaultController">
     * @ returns {Object} dom object of controller element
     * @ description : find current controller dom object
     */
    function getController(moduleDom, ctrlName) {
        var ctrls = moduleDom[0].querySelectorAll('[ng-controller]');
        for (var i = 0; i < ctrls.length; i++) {
            if (ctrls[i].getAttribute('ng-controller') == ctrlName) {
                return ctrls[i];
                break;
            }
        }
    }
    /** 
     * @ param {String} moduleName is the name defined by user like ng-app="myApp"
     * @ returns {Object} a object with controller function
     * @ description : create module for application
     */
    function module(moduleName) {
        var moduleDom = document.querySelectorAll('[ng-app=' + moduleName + ']');
        return {
            controller: function controller(ctrlName, ctrlFn) {
                var crtlDom = getController(moduleDom, ctrlName);
                new model(crtlDom, ctrlFn);
            }
        }
    }
    /** 
     * @ {model} is binding class name
     * @ param {Object} crtlDom is controller dom object
     * @ param {Function} ctrlFn is a callback defined in controller that get $scopeas parameter   
     * @ returns {Nothing}
     */
    function model(crtlDom, ctrlFn) {
        //create scope for this controller
        var $scope = new scope();
        //run controller callback
        ctrlFn($scope);
        var self = this;
        this.$scope = {};
        //copy scope from cntroller to binding model
        self.copyObject($scope, self.$scope);
        //traversing controller scope and define reactivity for nested object
        self.traverseObject($scope)
        this.watchList = {};
        this.controller = crtlDom;
        this.init();
    }
    model.prototype = {
        /** 
         * @ param {Nothing}
         * @ returns {Nothing} 
         * @ description : initilize controller dom for collect watchers
         */
        init: function () {
            var self = this;
            self.traveseDom(self.controller, function (node) {
                self.compile(node);
            });
        },
        /** 
         * @ param {String} str is somthing like 'portal.user.name'
         * @ returns {String} 'portal.user.name' => portal.user'
         * @ description : a function for backward object literal string
         */
        backward: function (str) { 
            var arr = str.split('.');
            //fix strings that have '.' in end => 'portal.user.'
            if (arr[arr.length - 1] == '') {
                arr.pop();
            }
            arr.pop();
            return arr.join('.') + '.';
        },
        /** 
         * @ param {Object} literal object for traversing
         * @ param {String} setProp is string like 'portal.user.name'
         * @ returns {Nothing} 
         * @ description : traversing object properties 
         */
        traverseObject: function (obj, setProp) {
            self = this;
            var setProp = setProp || '';
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    setProp += prop;
                    //define reactivity
                    self.defineReactive(obj, prop, obj[prop], setProp)
                    if (typeof obj[prop] == "object") {
                        setProp = setProp + '.'
                        self.traverseObject(obj[prop], setProp);
                    }
                };
                //remove last prop after any iteration in loop
                setProp = self.backward(setProp)
            }
        },
        /** 
         * @ param {Object} obj is scope coming from controller
         * @ param {Object} prop target to define reactivity
         * @ param {Any} val is value for define for getter
         * @ param {String} setProp is property literal 'portal.user.name'
         * @ returns {Nothing}
         * @ description : define reactivity for properties coming from controller
         */
        defineReactive: function (obj, prop, val, setProp) {
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
        },
        /** 
         * @ param {Object} source 
         * @ param {Object} des
         * @ returns {Nothing}
         * @ description : copy object propeties into other obejct
         */
        copyObject: function (source, des) {
            var immutable = JSON.parse(JSON.stringify(source));
            for (prop in immutable) {
                des[prop] = immutable[prop]
            };
        },
        /** 
         * @ param {Object} node is a dom element
         * @ param {Function} func is a callback that have node as argument 
         * @ returns {Nothing}
         * @ description : traversing dom nodes
         */
        traveseDom: function (node, func) {
            //pass attr node as callback arg
            func(node);
            node = node.firstChild;
            while (node) {
                this.traveseDom(node, func);
                node = node.nextSibling;
            }
        },
        /** 
         * @ param {String} node is a dom element
         * @ returns {Nothing}
         * @ description : decide how to bind dom nodes
         */
        compile: function (node) {
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
        },
        /** 
         * @ param {String} string is innerHTML of parsing node
         * @ returns {Object} object is {start:[] ,end:[] ,interpolate: false}
         * @ description : parse placeholder of {{expressions}} for interpolation
         */
        parse: function (string) {
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
        },
        /** 
         * @ param {String} a sample for string '{{name}} {{family}}'
         * @ returns {String} interpolated string 'abbas hosseini'
         * @ description : interpolating string
         * @ - string interpolation is a process in programming
         * @ - that replace values with placeholders
         */
        interpolate: function (string) {
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
        },
        /** 
         * @ param {Object} node is a dom object
         * @ param {Any} nodeValue is value for current node
         * @ param {Object} childs is childs = {textNodes: [], attrNodes: []}
         * @ param {Object} points is interpolations indexs list
         * @ - points = {start: [], end: [], hasInterpolate: false}
         * @ returns {Nothing}
         * @ description : binding interpolation placeholders
         */
        bindText: function (node, nodeValue, childs, points) {
            //Add properties to watchList object
            for (var index in points.start) {
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
        },
        /** 
         * @ param {Object} node is a dom object
         * @ returns {Nothing}
         * @ description : binding inputs to binding model for
         * @ making two way data binding beetween ui and model
         */
        bindInput: function (node) {
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
        },
        /** 
         * @ param {Object} bind is {inputNodes:[], attrNodes:[],textNodes:[], value:'' }
         * @ param {Object} key is binding property
         * @ returns {Nothing} 
         * @ description : update changes dom elements
         */
        watch: function (bind, key) {
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
        },
        /** 
         * @ param {String} exp is property expression 'user.name'
         * @ returns {Any} value of property
         * @ description : get object property value
         */
        get: function (exp) {
            var val = this.$scope;
            exp = exp.split('.');
            exp.forEach(function (k) {
                val = val[k];
            });
            return val;
        },
        /** 
         * @ param {String} exp is property expression 'user.name'
         * @ param {Any} value anything to assign to property
         * @ returns {Nothing} 
         * @ description : set property to object
         */
        set: function (exp, value) {
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
        },
    }
    //Public api -> angular.module()
    return {
        module: module,
    }
})(); //END IFFE
