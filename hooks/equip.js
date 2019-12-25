"use strict";
//装备
const mvc   = require('cosjs.mvc');
const bag = mvc.config('updater.bag.equip')||30;
const _dataset_hook = require("../index").dataset("hook");

class equip extends _dataset_hook{
    constructor(updater) {
        super(updater, bag, 'item');
    }
    add(id){
        if(arguments.length > 2){
            return super.add(...arguments);
        }

        if(!arguments[1]){
            return ;
        }
        let itype = this.updater.iTypes(id);
        if(!itype){
            return debug('itype not exist','itype',id);
        }
        let config = mvc.config(itype['config'],id);
        if(!config){
            return debug('config not exist',itype['config'],id);
        }
        this.updater.item.insert(...arguments);
    }

    format(item,act){

        //格式化装备属性，已经被初始化过
        //console.debug("equip format",item,act);
        return item;
    }
}
module.exports = equip;