"use strict";
const mvc = require('cosjs.mvc');

class _class_base{
    constructor(updater,bag,name){
        this.bag        = bag;
        this.updater    = updater;

        this._acts    = [];
        this._update  = null;
        this._fields  = new Set();
        this._history = new Set();

        this.dataset = mvc.library("dataset");

        if(name){
            this.model = mvc.model.mongo(name, updater.sid, updater.uid);
        }
    }
    //判断一个KEY是否存在
    has(key,fields){
        if(fields){
            return this._fields.has(key);
        }
        else{
            return this._history.has(key);
        }
    }
    key(key){
        if(this.has(key) ){
            return false;
        }
        this._fields.add(key);
        this._history.add(key);
        this.updater.datagetter = false;
        return key;
    }
//获取缓存中数据,请确定已经从CACHE或者数据库中取出
    get(key) {
        return this.dataset.get(key);
    }
}


exports = module.exports = _class_base;