    /*
    test( "a basic test example", function() {
        var value = "hello";
        equal( value, "hello", "We expect value to be hello" );
    });
    */

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

