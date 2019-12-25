"use strict";
const mvc = require('cosjs.mvc');
const promise = mvc.library.require("promise");
const _class_base    = require("./_class_base");
const _dataset_hash  = require('./_dataset_hash');

class _class_hash  extends _class_base{
    constructor(updater,bag,name){
        super(updater,bag,name)
    }
    add(key,val){
        return this.act('add',key,val);
    }

    sub(key,val){
        return this.act('sub',key,val);
    }

    set(key,val){
        return this.act('set',key,val);
    }

    act(t,k,v){
        let act;
        if(arguments.length === 1){
            act = arguments[0]
        }
        else{
            act = {"t":t,"k":k,"v":v,"b":this.bag};
        }
        if(act.t!=="set" ){
            act.v = Number(act.v);
            if(!act.v){ return;  }
            this.key(act.k);
        }

        this._acts.push(act);
        if( this._update && typeof _dataset_hash[act.t] === 'function'){
            _dataset_hash[act.t].call(this,act);
        }
    }

    data(){
        if( this._fields.size < 1 ){
            return Promise.resolve(0);
        }
        let keys = Array.from(this._fields);
        return this.model.uget(keys).then(ret=>{
            this._fields.clear();
            this.dataset.set(ret);
            return ret;
        });
    }
    //自动执行
    verify(){
        this._update = {};
        let verifyTask = mvc.library('multi',this._acts,(act)=>{
            if(act.t === "sub"){
                let dv = this.get(act.k)||0;
                if( this.updater.subverify && act.v > dv){
                    this._update = null;
                    return promise.callback('item_not_enough', [act.k, act.v, dv].join(','));
                }
            }
            if( typeof _dataset_hash[act.t] === 'function'){
                return _dataset_hash[act.t].call(this,act);
            }
            else{
                return promise.callback('updater_act_error',["bag:"+this.bag,act.t].join(",") );
            }
        });
        verifyTask.breakOnError = true;
        return verifyTask.start();
    }

    save(){
        let update = this._update;
        return Promise.resolve().then(()=>{
            if( update && Object.keys(update).length > 0 ){
                return this.model.set(update);
            }
        }).then(()=>{
            let log = this._acts;
            this._acts = [];
            this._update = null;
            return log;
        })
    };
}

exports = module.exports = _class_hash;