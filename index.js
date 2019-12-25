"use strict";

const mvc = require("cosjs.mvc");
const updater = require("./updater");
const dataset = require("./dataset/index");

module.exports = updater;

module.exports.dataset = function(k){
    if(arguments.length === 0){
        return dataset;
    }
    else if(dataset[k]){
        return dataset[k];
    }
}
//初始化updater
module.exports.initialize = function (iTypes,iLength) {
    let options = updater.options;
    options.iTypes = iTypes||{};
    options.iLength = iLength||2;
    for(let k in iTypes){
        let v = iTypes[k];
        let c = ['updater','bag',v['key']].join('.');
        mvc.config.set(c,v['bag']);
    }
    return mvc.adapter('updater',__dirname+ '/worker').then(loader=>{
        return options.loader = loader();
    }).then((loader)=>{
        loader.addPath(__dirname+ '/hooks');
    })
}


