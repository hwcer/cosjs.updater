"use strict";
/*
货币系统
 */

const mvc = require('cosjs.mvc');
const bag = mvc.config('updater.bag.money')||11;
const _dataset_hook = require("../index").dataset("hook");

class money extends _dataset_hook{
    constructor(updater) {
        super(updater, bag, 'item');
    }
}

module.exports = money;