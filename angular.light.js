/*******************************************************************************************
 * @ Name : Angular Light 
 * @ Author : Abbas Hosseini
 * @ Description : A simple library that support two way binding with angular syntax
 * @ Version : 1.0.0
 * @ Last watch : 2018 05 January
 ******************************************************************************************/

/**
 * @ param {String} ctrlName is controller name
 * @ param {function ($scope)} ctrlFn is a callback
 * @ returns {nothing}
 * @ description : A function for set controller
 */
//IFFE
var angular = (function () {
    /** 
     * @ {scope} is calss for $scope objecgt
     */
    function scope() {}
    /** 
     * @ param {Obvject} moduleDom is dom object of ng-app
     * @ param {String} name of controller that user defined
     * @ returns {Object} module object of controller element
     * @ description : search and find current controller
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
     * @ param {String} moduleName module name
     * @ returns {Object} return controller function
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
     * @ {{model}} is binding class name
     */
    function model(crtlDom, ctrlFn) {
        var $scope = new scope();
        ctrlFn($scope);
        var self = this;
        this.$scope = {};
        self.copyObject($scope, self.$scope);
        for (prop in $scope) {
            self.defineReactive($scope, prop)
        }
        this.watchList = {};
        this.controller = crtlDom;
        this.init();
    }
    model.prototype = {
        /** 
         * @ param {Nothing}
         * @ returns {Nothing} 
         * @ description : initilize controller module for watchList
         */
        init: function () {
            var self = this;
            self.traveseDom(self.controller, function (node) {
                self.compile(node);
            });
        },
        /** 
         * @ param {Object} $scope is scope coming from controller
         * @ returns {Nothing}
         * @ description : define reactivity for properties coming from controller
         */
        defineReactive: function (obj, prop) {
            var self = this;
            Object.defineProperty(obj, prop, {
                set: function (newVal) {
                    self.set(prop, newVal)
                }
            });
        },
        /** 
         * @ param {Object}
         * @ param {Object}
         * @ returns {Nothing}
         * @ description : copy on object propeties into other obejct
         */
        copyObject: function (source, des) {
            for (prop in source) {
                des[prop] = source[prop]
            };
        },
        /** 
         * @ param {Object} node is a module element
         * @ param {Function} func is a callback that have node as argument 
         * @ returns {Nothing}
         * @ description : traversing module nodes
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
         * @ param {String} node is a module element
         * @ returns {Nothing}
         * @ description : decide how to bind module node
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
         * @ description : parse placeholder of {{expressions}}
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
         * @ string interpolation is a process in programming
         * @ that replace values with placeholders
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
         * @ param {Object} node is a module object
         * @ param {String} points is interpolations indexs list
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
         * @ param {Object} node is a module object
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
         * @ param {Object} bind is bind object
         * @ param {Object} key is binding property
         * @ returns {Nothing} 
         * @ description : update changes on model or inputes
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
         * @ param {String} key is property name
         * @ returns {Nothing} 
         * @ description : get object property
         */
        get: function (prop) {
            return this.$scope[prop];
        },
        /** 
         * @ param {String} prop is property name 
         * @ param {Any} value anything to assign to property
         * @ returns {Nothing} 
         * @ description : set property to object
         */
        set: function (prop, value) {
            this.$scope[prop] = value;
            // set function notify change to watcher
            if (this.watchList[prop]) {
                this.watch(this.watchList[prop], prop)
            }
        },
    }
    //Public api -> angular.module()
    return {
        module: module,
    }
})(); //END IFFE