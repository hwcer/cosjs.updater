"use strict";
const mvc = require('cosjs.mvc');
const promise = mvc.library.require("promise");


/*****************************hash act parse*******************************/
exports.add = function(act){
    act.r = this.dataset.add(act.k,act.v);
    if(act.r===false){
        return promise.callback(`add[${this.bag}] error`,act);
    }
    this._update[act.k] = act.r;
}
exports.sub = function(act){
    act.r = this.dataset.sub(act.k,act.v);
    if(act.r===false){
        return promise.callback(`sub[${this.bag}] error`,act);
    }
    this._update[act.k] = act.r;
}
exports.set = function(act){
    act.r = this.dataset.set(act.k,act.v);
    if(act.r===false){
        return promise.callback(`set[${this.bag}] error`,act);
    }
    this._update[act.k] = act.r;
}


