"use strict";
const mvc = require('cosjs.mvc');
//物品组（概率表）解析

class igroup{
    constructor(updater) {
        this.updater = updater;
    }

    add(id){
        let itype = this.updater.iTypes(id);
        let config = mvc.config(itype['config'],id);
        if(!config){
            return mvc.library("debug",'igroup not exist',id);
        }
        return this.updater.item.group(...arguments);
    }

}

module.exports = igroup;