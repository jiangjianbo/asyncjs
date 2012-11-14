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

            if(idx == 9){
                equal(result.length, arr.length, "result and arr are same length");
                for(var i = 0; i < 10; ++i)
                    equal(result[i], arr[i], "result[" + i + "] = " + result[i] + " == " + arr[i]);
                start();
            }
        });
    });

    test("test asyncSeqEach with controller", function () {
        stop();
        var result = [], arr = [];
        for(var i = 0; i < 10; ++i)
            arr.push(i);
        var ctrl = asyncSeqEach(arr, function(val, idx){
            equal(val, idx, " asyncSeqEach callback val " + val + " == " + idx);
            result.push(val);

            if( idx == 9 )
                setTimeout(function(){
                    equal(result.length, arr.length, "asyncSeqEach result and arr are same length");
                    for(var i = 0; i < 10; ++i)
                        equal(result[i], arr[i], "asyncSeqEach result[" + i + "] = " + result[i] + " == " + arr[i]);
                    start();
                }, 2000);
        }, false);
        ok(ctrl, "ctrl return null");
        ctrl.start();
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
            equal(result.length+1, arr.length, "result length < arr length");
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
        }, true, true);

        setTimeout(function(){
            equal(result.length, 3, "result length = 3");
            equal(result[2], 2, "result[2] == 2");
            start();
        }, 2000);
    });

    test("test signal", function () {
        stop();
        onSignal("test", function(sig){
            equal(sig, "test", "signal received");
            start();
        });

        signal("test");

    });

    test("test asyncSeq", function () {
        stop();
        var val = 0;
        asyncSeq([
            function(){ val += 1; },
            function(){ val += 2; },
            function(){ equal(val, 3, "asyncSeq sum 1 + 2 = 3")},
            function(){ val += 4; },
            function(){ equal(val, 7, "asyncSeq sum 1 + 2 + 4 = 7")},
            function(){ val += 8; },
            function(){ equal(val, 15, "asyncSeq sum 1 + 2 + 4 + 8 = 15")},
            function(){start();}
        ]);
    });

    test("test asyncSeq manual start", function () {
        stop();
        var val = 0;
        var ctrl = asyncSeq([
            function(){ val += 1; },
            function(){ val += 2; },
            function(){ equal(val, 3, "asyncSeq sum 1 + 2 = 3")},
            function(){ val += 4; },
            function(){ equal(val, 7, "asyncSeq sum 1 + 2 + 4 = 7")},
            function(){ val += 8; },
            function(){ equal(val, 15, "asyncSeq sum 1 + 2 + 4 + 8 = 15")},
            function(){start();}
        ], "queue", false);
        ok(ctrl, "controller is not null");
        ctrl.start();
    });

    test("test asyncSeq abort(default continue)", function () {
        stop();
        var val = 0;
        asyncSeq([
            function(){ val += 1; },
            function(){ val += 2; },
            function(){ equal(val, 3, "asyncSeq sum 1 + 2 = 3")},
            function(){ val += 4; },
            function(){ equal(val, 7, "asyncSeq sum 1 + 2 + 4 = 7")},
            function(){
                setTimeout(function(){
                    equal(val, 15, "asyncSeq last val = 15");
                    start();
                }, 2000);
                throw new Error("abort asyncSeq");
            },
            function(){ val += 8; },
            function(){ equal(val, 15, "asyncSeq sum 1 + 2 + 4 + 8 = 15")}
        ]);
    });

    test("test asyncSeq abortWhenError", function () {
        stop();
        var val = 0;
        asyncSeq([
            function(){ val += 1; },
            function(){ val += 2; },
            function(){ equal(val, 3, "asyncSeq sum 1 + 2 = 3")},
            function(){ val += 4; },
            function(){ equal(val, 7, "asyncSeq sum 1 + 2 + 4 = 7")},
            function(){
                setTimeout(function(){
                    equal(val, 7, "asyncSeq last val = 7, because error exit");
                    start();
                }, 2000);
                throw new Error("abort asyncSeq");
            },
            function(){ val += 8; },
            function(){ equal(val, 15, "asyncSeq sum 1 + 2 + 4 + 8 = 15")}
        ], "qq", true, true);
    });

