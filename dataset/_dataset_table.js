"use strict";
const mvc = require('cosjs.mvc');
const promise = mvc.library.require("promise");


exports.add = function(act){
    if(!act.v){
        return;
    }
    if(typeof act.k === 'object' || act.k === "*"){
        return promise.callback("dataset_add_error","k not string");
    }
    let _id = act["_id"];
    if( !this.dataset.has(_id) ){
        return create_table_data.call(this,act);
    }
    else {
        let arr = table_dataset_key(_id,act.k);
        act.r = this.dataset.add(arr, act.v);
        if (act.r === false) {
            return promise.callback(`add[${this.bag}] error`, act);
        }
        this._update.push(['incr', _id, act.k, act.v]);
    }
}

exports.set = function(act){
    let _id = act["_id"];
    if( !this.dataset.has(_id) ){
        return create_table_data.call(this,act);
    }
    else if(act.k === '*'){
        this.dataset.set(_id,act.v);
        this._update.push(['set',_id , act.v]);
        act.r = act.v ;
    }
    else{
        let arr = table_dataset_key(_id,act.k);
        act.r = this.dataset.set(arr, act.v);
        if (act.r === false) {
            return promise.callback(`set[${this.bag}] error`, act);
        }
        this._update.push(['set',_id ,act.k, act.v]);
    }
}

exports.sub = function(act){
    if(!act.v){
        return;
    }
    if(typeof act.k === 'object' || act.k === "*"){
        return promise.callback("dataset_sub_error","k not string");
    }
    let _id = act["_id"];
    if( this.updater.subverify && !this.dataset.has(_id) ){
        return promise.callback('item_not_enough',[act.id,act.v,0].join(',') );
    }
    let arr = table_dataset_key(_id,act.k);
    act.r = this.dataset.sub(arr, act.v);
    if( this.updater.subverify && act.r < 0 ){
        return promise.callback('item_not_enough',[act.id,act.v,act.v + act.r].join(',') );
    }
    let iType = this.updater.iTypes(act["id"]);
    if( iType['clear'] > 0 && act.r === 0 && act.k === "val"){
        this.dataset.del(_id);
        this._update.push(['del',_id]);
    }
    else{
        this._update.push(['incr',_id ,act.k, act.v * -1]);
    }
}

exports.del = function(act){
    let _id = act["_id"];
    this.dataset.del(_id);
    this._update.push(['del',_id]);
    act.r = 0;
}

exports.insert = create_table_data;



function table_dataset_key(id,key) {
    let arr = String(key).split('.');
    arr.unshift(id);
    return arr;
}

/****************************publish function*****************************/
function create_table_data(act){
    let item = {"_id":act._id, "id":act.id,"uid":this.updater.uid};
    this.dataset.set(act._id, item);

    let arr = [act._id];
    if(act.k !== "*"){
        arr.push(act.k)
    }
    this.dataset.set(arr.join('.'),act.v);

    return Promise.resolve().then(()=>{
        if( typeof this.format === 'function'){
            return this.format(item,act);
        }
        else{
            return item;
        }
    }).then(ret=>{
        let r = Object.assign({},ret);
        this._update.push(['insert',r]);
        act['t'] = 'insert';
        act['r'] = r;
    })
}