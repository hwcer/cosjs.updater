"use strict";
const mvc = require('cosjs.mvc');
const promise = mvc.library.require("promise");

const _class_base    = require("./_class_base");
const _dataset_table  = require('./_dataset_table');


class _class_table  extends _class_base{
    constructor(updater,bag,name){
        super(updater,bag,name);
        this._table_fields = new Set();
    }
    fields(){
        for(let k of arguments){
            if(k){
                this._table_fields.add(k);
            }
        }
    }
    //解析_id,每个模块需要自己重写这个方法
    types(id){
        if(this.model && this.model['ObjectID'] && typeof this.model['ObjectID']['parse'] === 'function'){
            return this.model['ObjectID']['parse'](this.updater.uid,id);
        }
        else {
            throw new Error('dataset.types error');
        }
    }

    data(){
        if( this._fields.size < 1 ){
            return Promise.resolve(0);
        }
        let keys = Array.from(this._fields);
        return Promise.resolve().then(()=>{
            if(this._table_fields.size > 0 ){
                return this.model.uget(keys,Array.from(this._table_fields));
            }
            else{
                return this.model.uget(keys);
            }
        }).then(ret=>{
            //console.log('dataset data',JSON.stringify(ret))
            this._fields.clear();
            this.dataset.set(ret);
            return ret;
        });
    }

    key(id){
        if(Array.isArray(id)){
            let ret = [];
            for(let k of id){
                let t = this.key(k);
                ret.push(t);
            }
            return ret;
        }
        else if(id) {
            let types = typeof id === 'object' ? id : this.types(id);
            let r = super.key(types['_id']);
            return types;
        }
    }
    get(id,...fields) {
        let types = typeof id === 'object' ? id : this.types(id);
        fields.unshift(types['_id']);
        return super.get(fields.join('.'));
    }
    add(){
        Array.prototype.unshift.call(arguments,"add");
        return this.act.apply(this,arguments);
    };

    sub(){
        Array.prototype.unshift.call(arguments,"sub");
        return this.act.apply(this,arguments);
    };

    set(){
        Array.prototype.unshift.call(arguments,"set");
        return this.act.apply(this,arguments);
    };
    del(id){
        return this.act("del",id,"*",0);
    };
    //t,id,k,v,bag
    act(){
        let ty = typeof arguments[1] === "object" ? arguments[1] :this.types(arguments[1]);
        if(!ty){
            return false;
        }
        let act ;
        if(typeof arguments[0] === 'object'){
            act = arguments[0];
        }
        else {
            act = {"t":arguments[0]};
        }

        let t=act["t"],id=ty["id"],_id = ty["_id"],k=arguments[2],v=arguments[3],bag = arguments[4]||ty['bag']||this.bag;

        if(t!=="del" && t!=="insert") {
            this.key(_id);
        }
        if(typeof k === "object"){
            k = "*",v=arguments[2];
        }
        else if(k===undefined || typeof k === "number"){
            k = "val",v=arguments[2]||0;
        }
        Object.assign(act,{"k":k,"v":v,"b":bag,"id":String(id),"_id":_id})
        this._acts.push(act);
        return ty;
    }

    //自动执行
    verify(){
        this._update = [];
        let verifyTask = mvc.library('multi',this._acts,(act)=>{
            //console.log("verify act",JSON.stringify(act))
            if( typeof _dataset_table[act.t] === 'function'){
                return _dataset_table[act.t].call(this,act);
            }
            else{
                return promise.callback('updater_act_error',["bag:"+this.bag,act.t].join(",") );
            }
        })
        verifyTask.breakOnError = true;
        return verifyTask.start();
    }

    save(){
        if(this._update.length < 1 ){
            this._update = null;
            return promise.callback();
        }
        let model = this.model.multi();
        for(let opt of this._update){
            let cmd = opt.shift();
            if(model[cmd]) {
                model[cmd].apply(model, opt);
            }
            else{
                console.log('updater.item error','cmd['+cmd+'] error');
            }
        }
        return model.save().then((ret)=>{
            let log = this._acts;
            this._acts = [];
            this._update = null;
            return log;
        });
    }
}

exports = module.exports = _class_table;