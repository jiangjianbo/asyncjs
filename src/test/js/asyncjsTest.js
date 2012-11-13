    /*
    test( "a basic test example", function() {
        var value = "hello";
        equal( value, "hello", "We expect value to be hello" );
    });
    */

    test("test async while", function(){
        stop();
        var counter = 0;
        equal(null, asyncWhile(function(){
            counter++;
            return counter != 4;
        }, 1, true));
        setTimeout(function(){
            equal(counter,4, "while cycle 4 times" );
            start();
        }, 2000);
    });

    test("test async while without auto start", function () {
        stop();
        var counter = 0, ctrl;
        notEqual(null, ctrl = asyncWhile(function(){
            counter++;
            return counter != 4;
        }, 1, false));

        ctrl.start();
        setTimeout(function(){
            equal(counter,4, "while cycle 4 times" );
            start();
        }, 2000);
    });

    test("test asyncEach", function () {
        stop();
        var result = [], arr = [];
        for(var i = 0; i < 10; ++i)
            arr.push(i);
        asyncEach(arr, function(val, idx){
            equal(val, idx, "val " + val + " == " + idx);
            result.push(val);
        });
        setTimeout(function(){
            result.sort();
            for(var i = 0; i < 10; ++i)
                equal(result[i], arr[i], "result[" + i + "] = " + result[i] + " == " + arr[i]);
            start();
        }, 2000);
    });

    test("test asyncSeqEach", function () {
        stop();
        var result = [], arr = [];
        for(var i = 0; i < 10; ++i)
            arr.push(i);
        asyncSeqEach(arr, function(val, idx){
            equal(val, idx, "val " + val + " == " + idx);
            result.push(val);
        });
        setTimeout(function(){
            equal(result.length, arr.length, "result and arr are same length");
            for(var i = 0; i < 10; ++i)
                equal(result[i], arr[i], "result[" + i + "] = " + result[i] + " == " + arr[i]);
            start();
        }, 2000);
    });

    test("test asyncSeqEach with controller", function () {
        stop();
        var result = [], arr = [];
        for(var i = 0; i < 10; ++i)
            arr.push(i);
        var first = true;
        var ctrl = asyncSeqEach(arr, function(val, idx){
            if( first ){
                first = false;
                ctrl.sleep();
                result.push(val);
                return;
            }
            equal(val, idx, " val " + val + " == " + idx);
            result.push(val);
        });
        notEqual(ctrl, null, "ctrl return null");
        ctrl.awake();
        setTimeout(function(){
            equal(result.length, arr.length, "result and arr are same length");
            for(var i = 0; i < 10; ++i)
                equal(result[i], arr[i], "result[" + i + "] = " + result[i] + " == " + arr[i]);
            start();
        }, 2000);
    });

    test("test asyncSeqEach abort", function () {
        stop();
        var result = [], arr = [];
        for(var i = 0; i < 10; ++i)
            arr.push(i);
        var first = true;
        asyncSeqEach(arr, function(val, idx){
            if( idx == 3 )
                throw new Error("error when 3");
            result.push(val);   // when idx = 3, will skip by throw
        });

        setTimeout(function(){
            equal(result.length+1, arr.length, "result and arr are same length");
            equal(result[3], 4, "result[3] == 4 not 3");
            start();
        }, 2000);
    });

    test("test asyncSeqEach abort when error", function () {
        stop();
        var result = [], arr = [];
        for(var i = 0; i < 10; ++i)
            arr.push(i);
        var first = true;
        asyncSeqEach(arr, function(val, idx){
            if( idx == 3 )
                throw new Error("error when 3");
            result.push(val);   // when idx = 3, will skip by throw
        }, true);

        setTimeout(function(){
            equal(result.length, 3, "result length = 3");
            equal(result[2], 2, "result[2] == 2");
            start();
        }, 2000);
    });

    test("test signal", function () {
        stop();
        onSignal("test", function(sig){
            assert(sig, "test", "signal received");
            start();
        });

        signal("test");

    });

    function testAsync()
    {/*
        var a = [];
        for(var i = 0; i < 10; ++i)
            a.push("asyncEach - " + i);
            
        asyncEach(a, function(item){println(item);});

        var rep0 = 0;
        var ase = asyncSeqEach(a, function(item){
                                        println("SEQ - " + item);
                                        if( rep0 == 6 )
                                        {
                                            setTimeout(function(){
                                                ase.awake();    
                                            }, 500);
                                            rep0 ++;
                                            return "SLEEP";
                                        }
                                        else if( rep0 == 8 )
                                        {
                                            println("SEQ ABORT");
                                            return "ABORT";
                                        }
                                        else
                                            return rep0 ++ == 4 ? "REPEAT" : "NEXT";
                                    });
        
        var rep1 = 0;
        var aseq = asyncSeq([function(){println("aSyncSeq -0 ");}
            , function(){println("aSyncSeq -1 ");}
            , function(){println("aSyncSeq -2 ");}
            , function(){println("aSyncSeq -3 ");}
            , function(){println("aSyncSeq -4 ");}
            , function(){println("aSyncSeq -5 "); return rep1++ < 3? "REPEAT" : "NEXT";}
            , function(){println("aSyncSeq -6 ");}
            , function(){println("aSyncSeq -7 ");}
            , function(){
                    println("aSyncSeq -8 sleeping");
                    setTimeout(function(){
                            println("aSyncSeq -8 waking");
                            aseq.awake();
                        }, 600);
                    return "SLEEP";
                }
            , function(){println("aSyncSeq -9 ");}
            , function(){
                    println("aSyncSeq -10 ABORT before 11");
                    aseq.abort();
                }
            , function(){println("aSyncSeq -11 ");}
        ]);

        asyncSeq([function(){println("aSyncSeq test-chain -a0 ");}
            , function(){println("aSyncSeq test-chain -a1 ");}
            , function(){println("aSyncSeq test-chain -a2 ");}
            , function(){println("aSyncSeq test-chain -a3 ");}
            , function(){println("aSyncSeq test-chain -a4 ");}
            , function(){println("aSyncSeq test-chain -a5 ");}
            , function(){println("aSyncSeq test-chain -a6 ");}
            , function(){println("aSyncSeq test-chain -a7 ");}
            , function(){println("aSyncSeq test-chain -a8 ");}
        ], "test-chain");
*/
        var itNest = asyncSeqEach(["nest 1","nest 2","nest 3","nest 4"], function(item, i,ctrl){
            ctrl.sleep();
            println("--- " + item);
            asyncSeq([function(){println("nest aSyncSeq -a0 ");}
                , function(){println("nest aSyncSeq -a1 ");}
                , function(){println("nest aSyncSeq -a2 ");}
                , function(){println("nest aSyncSeq -a3 "); ctrl.awake();}
            ], "nest");
        });
    }

    var textArea = null;
    
    function println(text)
    {
        if( textArea == null )
        {
            textArea = document.getElementById("text");
            textArea.value = "";
        }
        
        textArea.value = textArea.value + text + "\r\n";
    }

