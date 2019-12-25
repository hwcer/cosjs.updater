"use strict";
const mvc = require("cosjs.mvc");
const inherits = require('util').inherits;
const EventEmitter = require('events').EventEmitter;

const debug             = console.debug;
const options           = {"loader":null,"iTypes":null,"iLength":2};


function updater(uid,sid){
    if (!(this instanceof updater)) {
        return new updater(uid,sid)
    }
    EventEmitter.call(this);

    if(!options.loader){
        throw new Error('updater not initialize');
    }

    this.uid  = uid;
    this.sid  = sid || mvc.library("guid/sid",uid);
    this.time = Date.now();
    this.data = updaterData.bind(this);
    this.save = updaterSave.bind(this);

    this.subverify  = true;                         //扣除道具时是否检查数量
    this.datagetter = false;                        //是否运行this.data

    this._update_cache    = [];                     //执行过程
    this._modules_cache   = {}                      //已经初始化对象列表
    this.setMaxListeners(200);
    options.loader.forEach((key)=>{
        let mk = key.substr(1);
        Object.defineProperty(this, mk, { enumerable: true,  configurable: false, get: set_module_instance.bind(this,key)  });
    });
};

inherits(updater, EventEmitter);

module.exports = updater;
module.exports.options = options;


updater.prototype.key = function(id){
    if( !id || typeof id !=='number'){
        return debug('updater.add arguments[id] type not number',id);
    }
    let mk = get_module_type.call(this,id);
    if (!mk) {
        return false;
    }
    if(!this[mk] || typeof this[mk]['key'] !== "function"){
        return debug('updater type not exist',"key",mk,id);
    }
    let mod = this[mk];
    return mod.key(id);
}
//id,val
updater.prototype.add = function(){
    if(Array.isArray(arguments[0])){
        for(let d of arguments[0]){
            this.add(d);
        }
    }
    else if( arguments[0] && typeof arguments[0] === 'object'){
        let isval = arguments[0].hasOwnProperty('val');
        if( isval && mvc.library("random/Probability",arguments[0]['val']) ){
            updater_add.call(this,arguments[0]['id'],arguments[0]['num']);
        }
        else if(!isval){
            updater_add.call(this,arguments[0]['id'],arguments[0]['num']);
        }
    }
    else {
        updater_add.call(this,arguments[0],arguments[1]);
    }
}

//role.key or item id
updater.prototype.sub = function(){
    if(Array.isArray(arguments[0])){
        for(let d of arguments[0]){
            updater_sub.call(this,d['id'],d['num']);
        }
    }
    else if( arguments[0] && typeof arguments[0] === 'object'){
        updater_sub.call(this,arguments[0]['id'],arguments[0]['num']);
    }
    else {
        updater_sub.call(this,arguments[0],arguments[1]);
    }
};

//item id
updater.prototype.get = function(id){
    if( !id || typeof id !== 'number'){
        return debug('updater.get id not number');
    }
    let mk = get_module_type.call(this,id);
    if (!mk) {
        return false;
    }
    if(!this[mk] || typeof this[mk]['get'] !== "function"){
        return debug('updater type not exist',"get",mk,id);
    }
    return this[mk]['get'](...arguments);
}


updater.prototype.cache = function(){
    if( Array.isArray( arguments[0] ) ){
        this._update_cache = this._update_cache.concat(arguments[0]);
    }
    return this._update_cache;
}

//获取道具配置
updater.prototype.iTypes = function(id) {
    let intType = String(id).substr(0,options.iLength);
    if(!options.iTypes[intType]){
        return debug('item['+id+'] type not exist');
    }
    else{
        return options.iTypes[intType];
    }
}



function updater_add(id,val){
    if( !id || typeof id !=='number'){
        return debug('updater.add arguments[id] type not number',id);
    }
    if(!val){
        return debug('updater.add arguments[val] empty',id);
    }
    let mk = get_module_type.call(this,id);
    if (!mk) {
        return false;
    }
    if(!this[mk] || typeof this[mk]['add'] !== "function"){
        return debug('updater type not exist',"add",mk,id);
    }
    let mod = this[mk];
    this.datagetter = false;
    return mod.add.apply(mod,arguments);
}

function updater_sub(id,val){
    if(typeof id !=='number'){
        return debug('updater.sub arguments[id] type not int',id);
    }
    if(!val){
        return debug('updater.sub arguments[val] empty',id);
    }
    let mk = get_module_type.call(this,id);
    if (!mk) {
        return false;
    }
    if(!this[mk] || typeof this[mk]['sub'] !== "function"){
        return debug('updater type not exist',"sub",mk,id);
    }
    let mod = this[mk];
    this.datagetter = false;
    return mod.sub.apply(mod,arguments );
}
//强制获取数据
function updaterData(){
    this.emit('data'); //开始拉取数据
    let arrModule = get_module_instance.call(this);
    let dataTask = mvc.library('multi',arrModule,dataWorker.bind(this));
    dataTask.breakOnError = true;
    return dataTask.start().then(()=>{
        this.datagetter = true;
        this.emit('work'); //开始工作
    })
}
//保存用户数据,beforeSave将在检查完数据,保持数据前调用
function updaterSave() {
    if(!this.datagetter){
        return this.data().then(()=>{
            return updaterSave.call(this);
        })
    }
    this.emit('verify'); //检查数据操作
    let arrModule = get_module_instance.call(this);
    //数据检查
    let verifyTask = mvc.library('multi',arrModule,verifyWorker.bind(this));
    verifyTask.breakOnError = true;
    return verifyTask.start().then(()=>{
        this.emit('save'); //保存数据库更改
        let saveTask = mvc.library('multi',arrModule,saveWorker.bind(this));
        saveTask.breakOnError = true;
        return saveTask.start();
    }).then((ret)=>{
        this.emit('finish'); //结束数据库操作
        return ret;
    })
}
////////////////////////////////////////////////////////////////////////
function dataWorker(mod){
    if( mod.model && typeof mod.data === 'function'){
        return mod.data();
    }
}

function verifyWorker(mod){
    if( typeof mod.verify === 'function'){
        return mod.verify();
    }
}


function saveWorker(mod){
    if( mod.model && typeof mod.save === 'function'){
        return mod.save().then(ret=>{
            if( Array.isArray(ret) ){
                this._update_cache = this._update_cache.concat(ret);
            }
        })
    }
}



function get_module_type(id){
    let iTypes = this.iTypes(id);
    if(!iTypes){
        return debug('updater.get_module_type item['+id+'] type not exist');
    }
    return iTypes["key"];
}
function set_module_instance(key){
    if(!this._modules_cache[key]){
        let fun = options.loader.require(key);
        this._modules_cache[key] = new fun(this);
    }
    return this._modules_cache[key];
}

function get_module_instance() {
    let arr = [];
    for(let k in this._modules_cache){
        arr.push(this._modules_cache[k]);
    }
    arr.sort(function(a,b){
        let as = a.sort||0,bs = b.sort||0;
        return bs - as;
    });
    return arr;
}