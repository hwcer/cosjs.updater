"use strict";

const mvc = require('cosjs.mvc');
const _dataset_table = require("../index").dataset("table");

class item extends _dataset_table{
    constructor(updater) {
        super(updater, 20, 'item');
        this.sort = 100;
        this.guid = mvc.library("guid",updater.uid,'item');
        this._insert_item_cache = [];
    }

    types(){
        let ty = {};
        if( typeof arguments[0] === 'number'){
            ty['id'] = arguments[0];
            let itype = this.updater.iTypes(ty['id']);
            ty['_id'] = this.guid.item(ty['id']);
            ty['bag'] = itype['bag'];
        }
        else{
            ty['_id'] = arguments[0];
            ty['id'] = this.guid.parse(ty['_id']);
            let itype = this.updater.iTypes(ty['id']);
            ty['bag'] = itype['bag'];
        }
        return ty;
    }
    //格式化NEWDATA
    format(item,act){
        item["bag"] = act.b;
        let it = this.updater.iTypes(act['id']);
        let ft = ( it["format"] && it["format"] !== 'item' ) ? ['item',it["format"] ] : 'item' ;
        item = mvc.format(ft,item,true);
        let ik = it['key'];
        if(ik !== 'item' && this.updater[ik] && typeof this.updater[ik]['format'] === 'function' ){
            return this.updater[ik]['format'](item,act);
        }
        else{
            return item;
        }
    }
    //id,key,val
    add(id){
        if(!id || !arguments[1]){
            return;
        }
        let itype = this.updater.iTypes(id);
        if(arguments.length <=2 ){
            this.act('add',id,'val',arguments[1],itype['bag']);
        }
        else if( typeof id !== 'number'){
            this.act('add',id,arguments[1],arguments[2],itype['bag']);
        }
        else{
            console.log('updater.item.add  arguments error',arguments);
        }
    }
    sub(id){
        let ty = this.types(id);
        this.act('sub',ty,arguments[1],arguments[2]);
    }
    set(id){
        let ty = this.types(id);
        this.act('set',ty,arguments[1],arguments[2]);
    }
    del(id){
        let ty = this.types(id);
        this.act('del',ty,arguments[1],arguments[2]);
    }

    verify(){
        if(this._insert_item_cache.length < 1){
            return super.verify();
        }
        return this.guid.get(this._insert_item_cache).then((ret)=>{
            while (this._insert_item_cache.length > 0){
                let id = this._insert_item_cache.shift();
                let _id = ret.shift();
                let itype = this.updater.iTypes(id);
                if(itype){
                    let ty = {"id":id,"_id":_id}
                    this.act("insert",ty,'val',1,itype['bag']);
                }
            }
            return super.verify();
        })
    }

    //物品组，id||array
    group(id){
        let {err,ret} = mvc.library('item/group',id,arguments[1],arguments[2]);
        if(!err) {
            if (Array.isArray(ret)) {
                for (let d of ret) {
                    this.updater.add(d.id, d.num);
                }
            }
            else if (ret) {
                this.updater.add(ret.id, ret.num);
            }
        }
        return mvc.library('promise/error',err,ret);
    }
    //道具查询
    find(query){
        query["uid"] = this.updater.uid;
        let option = {"multi":true,"dataType":"json"};
        return this.model.find(query,option).then(ret=>{
            if(ret){
                this.dataset.set(ret);
                for(let k in ret){
                    this._history.add(k);
                }
            }
            return ret;
        });
    }
    //创建不可叠加新道具
    insert(id){
        let val = arguments[1]||0;
        for(let i=1;i<=val;i++){
            this._insert_item_cache.push(id);
        }
    }
}

module.exports = item;