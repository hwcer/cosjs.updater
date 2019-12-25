"use strict";
/*
依赖于现有dataset仅做特殊处理，如装备需要随机属性
 */

class _class_hook{
    constructor(updater,bag) {
        let hook = typeof arguments[2] === 'object' ? arguments[2] : updater[arguments[2]];
        this.bag = bag;
        this.hook    = hook;
        this.model   = hook.model;
        this.updater = updater;
    }
    has(){
        return this.hook.has(...arguments);
    }
    key(){
        return this.hook.key(...arguments);
    }

    get(){
        return this.hook.get(...arguments);
    }
    add(id){
        return this.hook.add(...arguments);
    }
    sub(id){
        return this.hook.sub(...arguments);
    }
    set(){
        return this.hook.set(...arguments);
    }
    del(){
        return this.hook.del(...arguments);
    }
    //t,id,k,v,bag
    act(){
        return this.updater.item.act(...arguments);
    }

}

module.exports = _class_hook;
