"use strict";

const mvc = require('cosjs.mvc');
const bag = mvc.config('updater.bag.role')||10;
const _dataset_hash = require("../index").dataset("hash");


class role extends _dataset_hash{
    constructor(updater) {
        super(updater, bag, 'role');
        this.sort = 99999;
        this._event_update_cache = new Map();
        updater.on("data",on_before_data.bind(this));
        updater.on("save",on_before_save.bind(this));
    }
    key(){
        if(arguments.length > 1){
            for(let k of arguments){
                this.key(k);
            }
        }
        else if(Array.isArray(arguments[0])){
            for(let k of arguments[0]){
                this.key(k);
            }
        }
        else {
            let k = get_role_key_from_item_id.call(this, arguments[0]);
            if (k) {
                return super.key(k);
            }
        }
    }
    act(t,k,v){
        let key = get_role_key_from_item_id.call(this,k);
        if(!key){
            return false;
        }
        return super.act(t,key,v)
    }
    data(){
        if( this._fields.size < 1 ){
            return null;
        }
        return super.data().then(ret=>{
            if(!ret){
                return mvc.library('promise/callback','user_not_exist',this.updater.uid);
            }
        })
    };
}

module.exports = role;


function get_role_key_from_item_id(id){
    if(typeof id !== 'number'){
        return id;
    }
    let iTypes = this.updater.iTypes(id);
    if(!iTypes){
        return debug("iTypes not exist","role",id);
    }
    let item = mvc.config(iTypes['config'],id)
    if(!item){
        return debug("config not exist","item",id);
    }
    if(!item["key"]){
        return debug("item.key empty","item",id);
    }
    return item["key"];
}


function on_before_data(){
    let upgrade = mvc.config("upgrade") ||{};
    for(let k in upgrade){
        if(this.has(k,true)){
            this.key(upgrade[k]["key"]);
            this._event_update_cache.set(k,upgrade[k])
        }
    }
}

function on_before_save(){
    if(this._event_update_cache.size < 1){
        return;
    }
    this._event_update_cache.forEach(sum_level_update_num,this)
    this._event_update_cache.clear();
}


//添加经验后检查是否升级
function sum_level_update_num(opt){
    let lv = opt["key"],exp = opt['id'];

    let level   = mvc.config('level'),
        update  = this._update ||{},
        maxLv   = opt['max'],
        usrLv   = this.get(lv) || 1,
        usrExp  = update[exp] || 0;


    if(!level[maxLv]){
        delete update[exp]
        return false;
    }
    if(usrLv >= maxLv){
        if(!opt['surpass']){
            delete update[exp];
        }
        return false;
    }

    let maxExp = level[maxLv][exp];
    if( !opt['surpass'] && usrExp > maxExp ){
        usrExp = maxExp;
    }

    //检查升级
    let tmpLv = opt['lower'] ? 0 : usrLv;
    let newLv = tmpLv;
    for(let i=tmpLv;i<=maxLv;i++){
        if( !level[i] || usrExp < level[i][exp] ){
            break;
        }
        else{
            newLv = Math.max(newLv,i);
        }
    }

    let addLv = newLv - usrLv;
    if( addLv !== 0 ){
        this.act('add',lv,addLv);
        this.updater.emit("upgrade",lv,addLv,newLv)
    }
    return addLv;
}
