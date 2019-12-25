"use strict";
const mvc = require('cosjs.mvc');
const bag = mvc.config('updater.bag.daily')||91;
const _dataset_hash = require("../index").dataset("hash");

class daily extends _dataset_hash {
    constructor(updater) {
        super(updater, bag, 'daily');
        this.sort = bag;
        this.sort = 102;
    }
};

module.exports = daily;