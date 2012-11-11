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
        @param {AsyncWhileCallback} fn
        @param {Number} [interval]
        @param {Boolean} [autoStart=true]
        @returns {AsyncWhileController} only if autoStart is false
     */
    function asyncWhile(fn, interval, autoStart)
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
    }

    /** parallel foreach
        @name asyncEach
        @function
        @param {Array} arr
        @param {Function} callback
     */
    function asyncEach(arr, callback)
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
    }

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
    function asyncSeqEach(arr, callback, abortWhenError)
    {
        if( arr == null || arr.length <= 0 || typeof(callback) !== "function" )
            return {awake: function(){}, sleep: function(){}, abort: function(){}};

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
    }

    /** async sequence function
        @name AsyncSeqCallback
        @function
        @param {AsyncController} ctrl controller of the thread
        @returns {String} return SLEEP,REPEAT,ABORT to control thread state
     */

    /** asynchronous and sequenced call each function of funcArray in same chainName.
        @name asyncSeq
        @function
        @param {AsyncSeqCallback[]} funcArray
        @param {String} [chainName]
        @param {Boolean} [abortWhenError=false]
        @return {AsyncController} controller
     */
    function asyncSeq(funcArray, chainName, abortWhenError)
    {
        if( typeof(funcArray) === "function" )
            return asyncSeq([funcArray], chainName, abortWhenError);

        if( funcArray == null || funcArray.length == 0 )
            return null;

        if( chainName == null || chainName.length == 0 || /^\s*$/.test(chainName) ) chainName = "__default_seq_chain__";
        var tInfos = asyncSeq.chainInfos = asyncSeq.chainInfos || {};
        if( tInfos[chainName] == null )
            tInfos[chainName] = {
                        name : chainName,
                        count : 0,
                        currentIndex : -1,
                        abort : false,
                        sleep: false,
                        controller: {
                                awake : function(){tInfos[chainName].sleep = false;},
                                sleep : function(){tInfos[chainName].sleep = true;},
                                abort : function(){tInfos[chainName].abort = true;}
                            }
                    };
        var i, tInfo = tInfos[chainName];
        var wrapper = function(item, tIndex){
            return function(){
                if( tInfo.abort ) return false;
                if( tInfo.sleep ) return true;

                if( tInfo.currentIndex < tIndex )
                    return true;
                else if( tInfo.currentIndex == tIndex )
                {
                    try{
                        var stat = item(tInfo.controller);
                        if( "REPEAT" === stat )
                            return true;
                        else if( "SLEEP" === stat )
                            tInfo.sleep = true;
                        else if( "ABORT" === stat )
                        {
                            tInfo.abort = true;
                            return false;
                        }
                    }catch(e){
                        if( abortWhenError === true ) tInfo.abort = true;
                    }
                    tInfo.currentIndex ++;
                }
                else
                {
                    if( abortWhenError === true ) tInfo.abort = true;
                }
                return false;
            };
        };

        for(i = 0; i < funcArray.length; ++i)
        {
            asyncWhile(wrapper(funcArray[i], tInfo.count ++));
        }

        setTimeout(function(){
            if( tInfo.count > 0 && tInfo.currentIndex == -1 )
                tInfo.currentIndex = 0;
        },1 + (__afl_forDemo ? Math.random()*100 : 0)); // 为了调试和演示的原因，加了延迟启动

        return tInfo.controller;
    }

}).call(this);
