"use strict";
/*
门票系统
 */

const mvc = require('cosjs.mvc');
const bag = mvc.config('updater.bag.ticket')||12;
const _dataset_hook = require("../index").dataset("hook");

class ticket extends _dataset_hook{
    constructor(updater) {
        super(updater, bag, 'item');
        this._ticket_upsert = new Map();
        updater.on("work",_updater_on_work.bind(this));
    }

    add(id){
        return this.act('add',id,'val',arguments[1],this.bag);
    }
    sub(id){
        return this.act('sub',id,'val',arguments[1],this.bag);
    }
    set(id){
        return this.act('set',id,'val',arguments[1],this.bag);
    }
    //t,id,k,v,bag
    act(t,id,k,v,b){
        if(!id){
            return ;
        }
        if( !v && t!=='set'){
            return ;
        }
        let ty = this.updater.item.types(id);
        let ticket = mvc.config("ticket",ty['id']);
        if(!ticket || this._ticket_upsert.has(ty['_id']) ){
            return ;
        }
        this._ticket_upsert.set(ty['_id'],ticket);
        if(ticket['limit'][0]){
            this.updater.key(ticket['limit'][0]);
        }
        return this.updater.item.act(t,ty,k,v,b);
    }

}

module.exports = ticket;


function _updater_on_work(){
    if(this._ticket_upsert.size === 0){
        return;
    }
    for (let [_id,opt] of this._ticket_upsert){
        sum_ticket_timer.call(this,_id,opt);
    }
    this._ticket_upsert.clear();
}



//计算门票钥匙
function sum_ticket_timer(_id,opt){
    //重置,加点
    let data      = this.get(_id) || {"_id":_id,"id":opt["id"]},
        today     = mvc.library("time/today"),
        nowtime   = this.updater.time,
        powerNum  = data['val']||0,
        powerTime = data['ums']||0,
        powerMax  = opt["limit"][2];

        if(opt["limit"][0]) {
            let v = this.updater.get(opt["limit"][0])||0;
            powerMax += Math.floor( v * opt["limit"][1] );
        }
    //console.log("sum_ticket_timer opt",JSON.stringify(opt))
    //console.log("sum_ticket_timer data",JSON.stringify(data))
    //console.log("sum_ticket_timer args",powerMax,powerNum,powerTime)
    if(powerNum >= powerMax){
        //已满只更新时间
        this.hook._acts.unshift({"t":"set","k":"ums","v":nowtime,"id":data["id"],"_id":data["_id"],"b":this.bag})
    }
    else if( !powerTime || (opt["day"] && powerTime < today) ){
        //每日回满
        this.hook._acts.unshift({"t":"set","k":"*","v":{"ums":nowtime,"val":powerMax},"id":data["id"],"_id":data["_id"],"b":this.bag})
    }
    else if(nowtime > powerTime){
        //结算时间点数
        let dotnum = opt['dot'][0] * 1000;
        let diffTime = nowtime - powerTime;
        let retnum = Math.floor(diffTime / dotnum) * opt['dot'][1] ;
        //console.log("sum_ticket_timer rets",diffTime,dotnum,retnum)
        if(retnum>0){
            powerNum = Math.min( powerNum + retnum,powerMax);
            powerTime += retnum * dotnum;
            this.hook._acts.unshift({"t":"set","k":"*","v":{"ums":powerTime,"val":powerNum},"id":data["id"],"_id":data["_id"],"b":this.bag})
        }
    }
}
