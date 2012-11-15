/**
    @fileoverview Lightweight Asynchronous Function Library.
    轻量级的异步运行函数库

    @author jiangjianbo
    @version 0.1
*/

/**
    @namespace default namespace
 */
(function(){

    /** 此时 root 指向window或global对象
     * @ignore  */
    var root = this;

    /**
     * 内部使用，增加随机性
     * @ignore  */
    var __afl_forDemo = true;

    /**
     * asyncWhile的运行控制对象
        @name AsyncWhileController
        @class
     */

    /** 启动
        @name start
        @function
        @memberOf AsyncWhileController
     */

    /** 终止
        @name abort
        @function
        @memberOf AsyncWhileController
     */

    /** 异步循环的回调函数
        @name AsyncWhileCallback
        @function
        @returns {Boolean} 返回false退出循环，否则继续
     */

    /** 异步循环，直到回调函数返回false才退出
        @name asyncWhile
        @function
        @param {AsyncWhileCallback} fn 回调函数
        @param {Number} [interval] 每次循环间隔时间
        @param {Boolean} [autoStart=true] 自动启动循环
        @returns {AsyncWhileController|null} 在autoStart=true的时候返回循环的运行控制对象，否则返回null
     */
    var asyncWhile = root.asyncWhile = function (fn, interval, autoStart)
    {
        if( fn == null || typeof(fn) !== "function" )
            return null;

        var abort = false;
        var wrapper = function()
        {
            if( abort ) return;
            if( fn() !== false )
                setTimeout(wrapper, interval == null? 1: interval);
        };

        if( autoStart !== false )
        {
            wrapper();
            return null;
        }
        else
            return {
                    start : function(){
                        if(autoStart === false) setTimeout(wrapper, 1);
                    },
                    abort : function(){abort = true;}
                };
    };

    /**
     * 并发遍历数组元素
        @name asyncEach
        @function
        @param {Array} arr 要遍历的数组
        @param {Function} callback 回调函数
     */
    var asyncEach = root.asyncEach = function (arr, callback)
    {
        if( arr == null || arr.length === 0 || typeof(callback) !== "function" )
            return;

        var idx = 0;
        var wrapper = function(item, itemIdx){
                return function(){
                    callback(item, itemIdx);
                };
            };
            
        while( idx < arr.length )
        {
            setTimeout(wrapper(arr[idx],idx), 1 + (__afl_forDemo ? Math.random()*100 : 0)); // 为了调试和演示的原因加了随机数
            idx ++;
        }
    };

    /**
     * 异步运行控制器
        @name AsyncController
        @class
     */

    /**
     * 启动异步运行
     @name start
     @function
     @memberOf AsyncController
     */

    /**
     * 终止异步运行
        @name abort
        @function
        @memberOf AsyncController
     */

    /**
     * 暂停异步运行
        @name sleep
        @function
        @memberOf AsyncController
     */

    /**
     * 继续运行
        @name awake
        @function
        @memberOf AsyncController
     */

    /**
     * 异步且顺序遍历数组的回调函数
        @name AsyncSeqEachCallback
        @function
        @param {Object} item 当前的数组元素
        @param {Number} itemIdx 当前的下标位置
        @param {AsyncController} controller 异步循环控制器
        @returns {String} 返回控制状态值 SLEEP,REPEAT,ABORT
     */

    /**
     * 异步并且顺序地遍历数组中的每个元素
        @name asyncSeqEach
        @function
        @param {Array} arr 对象数组
        @param {AsyncSeqEachCallback} callback 回调函数
        @param {Boolean} [autoStart=true] 是否自动启动
        @param {Boolean} [abortWhenError=false] 是否忽略运行时异常

        @return {AsyncController} controller 遍历的运行状态控制器
     */
    var asyncSeqEach = root.asyncSeqEach = function (arr, callback, autoStart, abortWhenError)
    {
        if( arr == null || arr.length <= 0 || typeof(callback) !== "function" )
            return null;

        var idx = 0, sleep = false === autoStart, abort = false;
        var ctrl = {
                start : function(){sleep = false;},
                awake : function(){sleep = false;},
                sleep : function(){sleep = true;},
                abort : function(){sleep = true;}
            };

        asyncWhile(function(){
            if( idx < arr.length )
            {
                if( abort ) return false; // 如果终止，则直接返回并退出
                if( sleep ) return true; // 如果休眠，则直接返回

                try{
                    var stat = callback(arr[idx], idx, ctrl);
                    if( stat === "REPEAT" )
                        return true;
                    else if( stat === "ABORT" )
                        return false;
                    else if( stat === "SLEEP" )
                        sleep = true;
                }catch(e){
                    if( abortWhenError === true )
                        return false;
                }
                ++ idx;
                return true;
            }
            else
                return false;
        });

        return ctrl;
    };

    /**
     * 异步且顺序执行的回调函数
        @name AsyncSeqCallback
        @function
        @param {AsyncController} controller 运行队列的控制器
        @returns {String} 返回运行队列的控制状态 SLEEP,REPEAT,ABORT
     */

    /**
       所有在同一个运行队列中的函数会被异步且顺序地调用执行
        @name asyncSeq
        @function
        @param {AsyncSeqCallback[]} funcArray 回调函数数组
        @param {String} [queueName] 队列名称
        @param {Boolean} [autoStart=true] 是否自动启动
        @param {Boolean} [abortWhenError=false] 是否忽略运行时异常
        @return {AsyncController} 返回运行时控制器
     */
    var asyncSeq = root.asyncSeq = function (funcArray, queueName, autoStart, abortWhenError)
    {
        if( typeof(funcArray) === "function" )
            return asyncSeq([funcArray], queueName, abortWhenError);

        if( funcArray == null || funcArray.length == 0 )
            return null;

        if( queueName == null || queueName.length == 0 || /^\s*$/.test(queueName) ) queueName = "__default_seq_chain__";
        var qInfos = asyncSeq.queueInfos = asyncSeq.queueInfos || {};
        if( qInfos[queueName] == null )
            qInfos[queueName] = {
                        name : queueName,
                        count : 0,
                        currentIndex : -1,
                        abort : false,
                        sleep: false === autoStart,
                        controller: {
                                start : function(){qInfos[queueName].sleep = false;},
                                awake : function(){qInfos[queueName].sleep = false;},
                                sleep : function(){qInfos[queueName].sleep = true;},
                                abort : function(){qInfos[queueName].abort = true;}
                            }
                    };
        var i, inf = qInfos[queueName];
        var wrapper = function(item, tIndex){
            return function(){
                if( inf.abort ) return false;
                if( inf.sleep ) return true;

                if( inf.currentIndex < tIndex )
                    return true;
                else if( inf.currentIndex == tIndex )
                {
                    try{
                        var stat = item(inf.controller);
                        if( "REPEAT" === stat )
                            return true;
                        else if( "SLEEP" === stat )
                            inf.sleep = true;
                        else if( "ABORT" === stat )
                        {
                            inf.abort = true;
                            return false;
                        }
                    }catch(e){
                        if( abortWhenError === true ) inf.abort = true;
                    }
                    inf.currentIndex ++;
                }
                else
                {
                    if( abortWhenError === true ) inf.abort = true;
                }
                return false;
            };
        };

        for(i = 0; i < funcArray.length; ++i)
        {
            asyncWhile(wrapper(funcArray[i], inf.count ++));
        }

        setTimeout(function(){
            if( inf.count > 0 && inf.currentIndex == -1 )
                inf.currentIndex = 0;
        },1 + (__afl_forDemo ? Math.random()*100 : 0)); // 为了调试和演示的原因，加了延迟启动

        return inf.controller;
    };

    /**
     * 信号量响应函数
     * @name SignalHandler
     * @function
     * @param {String} sigName 信号量的名称
     */

    /** @ignore */
    var _signalMaps = {};

    /**
     * 产生一个信号，并且通知所有注册了该信号的回调函数
     * @function
     * @param {String} sigName 信号名称
     */
    var signal = root.signal = function(sigName){
        if( sigName == null || sigName.length == 0 || /^\s*$/.test(sigName) )
            return new TypeError("empty sigName");

        var list = _signalMaps[sigName];
        if(  list && list.length > 0 ){
            root.asyncEach(list, function(fn){
                fn(sigName);
            });
        }
    };

    /**
     * 注册信号处理函数
     * @function
     * @param {String} sigName 信号名称
     * @param {SignalHandler} fnHandler 信号处理函数
     */
    var onSignal = root.onSignal = function(sigName, fnHandler){
        if( sigName == null || sigName.length == 0 || /^\s*$/.test(sigName) )
            return new TypeError("empty sigName");

        if( fnHandler == null || typeof(fnHandler) !== "function" )
            return new TypeError("fnHandler must be function");

        var list = _signalMaps[sigName] = _signalMaps[sigName] || [];
        // find duplicate
        var i = 0;
        while( i < list.length ){
            if( list[i++] === fnHandler )
                return;
        }

        list.push(fnHandler);
    };

    /**
     * 为 @see asyncSeq 和 @see asyncSeqEach 注册等待信号的处理函数
     * @function
     * @param sigName 要等待的信号量
     * @return {AsyncSeqCallback|AsyncSeqEachCallback} 对应回调函数的封装
     */
    var waitSignal = root.waitSignal = function(sigName){
        var triggered = false;
        onSignal(sigName, function(sig){
            triggered = true;
        });
        return function(){
            return triggered ? "NEXT" : "REPEAT";
        };
    };

}).call(this);
