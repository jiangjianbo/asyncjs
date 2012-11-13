/**
    @fileoverview Lightweight Asynchronous Function Library.

    @author jiangjianbo
    @version 0.1
    
    <h2>Change Log:</h2>
    <ul>
        <li>2012-11-08 first edition completed
        <li>2012-11-08 change chain to thread, and add thread wait
        <li>2012-11-10 crate maven project for AFL
    </ul>
*/

/**
    @namespace default namespace
 */
(function(){

    /** @ignore  */
    var root = this;

    /** @ignore internal use, add more random */
    var __afl_forDemo = true;

    /** async while controller
        @name AsyncWhileController
        @class
     */

    /** start async while
        @name start
        @function
        @memberOf AsyncWhileController
     */

    /** abort async while
        @name abort
        @function
        @memberOf AsyncWhileController
     */

    /** async while callback function
        @name AsyncWhileCallback
        @function
        @returns {Boolean} exit when false, others continue
     */

    /** async while, repeat until fn return false
        @name asyncWhile
        @function
        @param {AsyncWhileCallback} fn callback
        @param {Number} [interval]
        @param {Boolean} [autoStart=true]
        @returns {AsyncWhileController} only if autoStart is false
     */
    root.asyncWhile = function (fn, interval, autoStart)
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

    /** parallel foreach
        @name asyncEach
        @function
        @param {Array} arr
        @param {Function} callback
     */
    root.asyncEach = function (arr, callback)
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

    /** async thread controller
        @name AsyncController
        @class
     */

    /** abort thread
        @name abort
        @function
        @memberOf AsyncController
     */

    /** sleep thread
        @name start
        @function
        @memberOf AsyncController
     */

    /** awake thread
        @name awake
        @function
        @memberOf AsyncController
     */

    /** async sequence foreach
        @name AsyncSeqEachCallback
        @function
        @param {Object} item element of arr
        @param {Number} itemIdx index of item
        @param {AsyncController} ctrl controller of the thread
        @returns {String} return SLEEP,REPEAT,ABORT to control thread state
     */

    /** asynchronous and one by one for each every element of arr
        @name asyncSeqEach
        @function
        @param {Array} arr array of objects
        @param {AsyncSeqEachCallback} callback
        @param {Boolean} [abortWhenError=false]

        @return {AsyncController} controller
     */
    root.asyncSeqEach = function (arr, callback, abortWhenError)
    {
        if( arr == null || arr.length <= 0 || typeof(callback) !== "function" )
            return null;

        var idx = 0, sleep = false, abort = false;
        var ctrl = {
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

    /** async sequence function
        @name AsyncSeqCallback
        @function
        @param {AsyncController} ctrl controller of the thread
        @returns {String} return SLEEP,REPEAT,ABORT to control thread state
     */

    /** asynchronous and sequenced call each function of funcArray in same queueName.
        @name asyncSeq
        @function
        @param {AsyncSeqCallback[]} funcArray functions will be executed one by one
        @param {String} [queueName] name of the execution queue
        @param {Boolean} [abortWhenError=false] abort when error
        @return {AsyncController} controller
     */
    root.asyncSeq = function (funcArray, queueName, abortWhenError)
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
                        sleep: false,
                        controller: {
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

    /** @ignore */
    var _signalMaps = {};

    /** signal handler function
     * @name SignalHandler
     * @function
     * @param sigName
     */

    /**
     * raise signal, and notify all registered handler
     * @param {String} sigName signal name
     */
    root.signal = function(sigName){
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
     * register signal handler
     * @param {String} sigName signal name
     * @param {SignalHandler} fnHandler signal event handler
     */
    root.onSignal = function(sigName, fnHandler){
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
     * create a stub waiting signal for asyncSeq and asyncSeqEach
     * @param sigName
     * @return {AsyncSeqCallback|AsyncSeqEachCallback}
     */
    root.waitSignal = function(sigName){
        var triggered = false;
        onSignal(sigName, function(sig){
            triggered = true;
        });
        return function(){
            return triggered ? "NEXT" : "REPEAT";
        };
    };

}).call(this);
