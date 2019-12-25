"use strict";
const mvc   = require('cosjs.mvc');
const bag = mvc.config('updater.bag.hero')||50;
const debug = console.debug;
const _dataset_hook = require("../index").dataset("hook");

class hero extends _dataset_hook{
    constructor(updater) {
        super(updater, bag, 'item');
        this._insert_hero_soul = new Map();
        updater.on("verify",_updater_on_verify.bind(this));
    }
    add(id){
        if(arguments.length > 2){
            return super.add(...arguments);
        }
        let num = parseInt(arguments[1]);
        if(!num){
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
        //不可以堆叠，装备模式
        let soul = mvc.config.get("hero.soul");
        if(!soul){
            return this.updater.item.insert(...arguments);
        }
        //碎片模式
        if(!this._insert_hero_soul.has(id)){
            this._insert_hero_soul.set(id,{"id":id,"num":num,"soul":config["soul"],"resolve":config["resolve"]})
        }
        else{
            let _insert_hero_soul = this._insert_hero_soul.has(id);
            _insert_hero_soul['num'] += num;
        }
        this.key(id);
        this.key(config["soul"]);
    }
}
module.exports = hero;


function _updater_on_verify(){
    if(this._insert_hero_soul.size === 0){
        return;
    }
    for(let [id,config] of this._insert_hero_soul){
        let ty = this.updater.item.types(id);
        let hd = this.updater.item.get(ty);
        if( !hd ){
            this.updater.item.act('add',ty['id'],'val',1,ty['bag']);
            config['num'] -= 1;
        }
        if(config['num'] > 0 && config["soul"] && config["resolve"]){
            this.updater.add(config["soul"],config['num'] * config["resolve"]);
        }
    }
    this._insert_hero_soul.clear();
}