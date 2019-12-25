"use strict";
///////////////////历史数据///////////////////
const mvc = require('cosjs.mvc');
const bag = mvc.config('updater.bag.record')||93;
const _dataset_table = require("../index").dataset("table");

class record extends _dataset_table{
    constructor(updater) {
        super(updater, bag, 'record');
        this.sort = sort;
        this._Math_Act = [];  //max min
    }
    types(id){
        let ret,str = String(id);
        if(str.indexOf("-") < 0){
            ret = {"id":str,"_id":this.model.ObjectID(id)};
        }
        else{
            let arr = str.split("-");
            ret= {"id":Number(arr[1]),"_id":str};
        }
        return ret;
    }

    format(item,act){
        return mvc.format("record",item,true);
    }

    get(id){
        let d = super.get(id)||{};
        return d["val"]||0;
    }
    //插入一个最大值
    max(id,val){
        let ty = this.key(id);
        ty['v'] = val;
        ty['t'] = 1;
        this._Math_Act.push(ty);
    }
    //插入一个最小值
    min(id,val){
        let ty = this.key(id);
        ty['v'] = val;
        ty['t'] = -1;
        this._Math_Act.push(ty);
    }
    del(){
        return null
    };
    sub(){
        return null
    };

    add(id,val){
        return this.act('add',id,'val',val)
    };

    set(id,val){
        return this.act('set',id,'val',val);
    };

    verify(){
        //预处理 min，max
        for(let d of this._Math_Act){
            let v = this.get(d)||0;
            if( (d['t'] > 0 && d['v'] > v) || (d['t'] < 0 && d['v'] < v) ){
                this.set(d,d['v']);
            }
        }
        //进入正常流程
        return super.verify();
    }

};

module.exports = record;