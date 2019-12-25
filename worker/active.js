"use strict";
///////////////////运营活动///////////////////
const mvc = require('cosjs.mvc');
const bag = mvc.config('updater.bag.active')||92;
const _dataset_table = require("../index").dataset("table");

class active extends _dataset_table {
    constructor(updater) {
        super(updater, bag, 'active');
        this.sort = 101;
    }
    fields(){
        for(let k of arguments){
            let rk = ['val',k].join('.');
            super.fields(rk);
        }
    }
    types(id){
        let ret;
        if(String(id).indexOf("-") < 0){
            ret = {"id":id,"_id":this.model.ObjectID(id)};
        }
        else{
            let arr = id.split("-");
            ret= {"id":arr[1],"_id":id};
        }
        return ret;
    }
    //设置配置信息
    format(item,act){
        item['ttl'] = act['ttl'];
        mvc.format("active",item,true);
        return item;
    }

    get(id){
        let d = super.get(id);
        if(!d || arguments.length <2 ){
            return d;
        }
        let k = arguments[1]||0;
        let v = d["val"]||{};
        return v[k]||0;
    }

    del(){
        return null
    };
    sub(){
        return null
    };

    add(){
        Array.prototype.unshift.call(arguments,"add");
        return this.act.apply(this,arguments)
    };

    set(){
        Array.prototype.unshift.call(arguments,"set");
        return this.act.apply(this,arguments)
    };
    //t,id,key,val,ttl
    act(t,id,key,val) {
        if(String(key).indexOf(".") < 0){
            key = ["val",key].join(".");
        }
        let ts = {"t":t,"ttl":arguments[4]||0};
        return super.act(ts,String(id),key,val);
    }
};

module.exports = active;