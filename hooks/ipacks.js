"use strict";
const mvc = require('cosjs.mvc');
//道具礼包解析,独立概率,礼包中的每一项"都有可能"获得

class ipacks{
    constructor(updater) {
        this.updater = updater;
    }

    add(id){
        let itype = this.updater.iTypes(id);
        let rows = mvc.config(itype['config'],id);
        if(!rows){
            return mvc.library("debug",'ipacks not exist',id);
        }
        else if(!Array.isArray(rows)){
            return mvc.library("debug",'ipacks not array',id);
        }
        for(let item of rows){
            if(mvc.library('random/Probability',item['val'])){
                this.updater.add(item['key'],item['num']);
            }
        }
    }
}

module.exports = ipacks;