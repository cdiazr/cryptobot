/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 28 abr. 2021 - 22:26:08
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

class Manager  {
    
    static _serverPort = 8000;
    static _serverUrl = 'ws://127.0.0.1';
    static _serverQuery = 'starter';
    static starter = false;
    static symbol = false;
    static contenido = false;
    static _portCount = 0;
    static mainWs = false;
    
// -----------------------------------------------------------------------------
    
    static init () {
        
       Manager.symbol = $('#txtSymbol').val();
       Manager.contenido = $('#contenido');
       Manager._portCount = Manager._serverPort;
       Manager.starter = Manager._serverUrl+':'+Manager._serverPort+'/'+Manager._serverQuery;
        
    }

// -----------------------------------------------------------------------------

    static getDivId (ctrl) {
        var id = ctrl.attr('id');
        return id.replace(/chk/, 'div');
    };
    
// -----------------------------------------------------------------------------

    static getStream (ctrl) {
        var stream = ctrl.data('stream');
        return Manager.symbol+'@'+stream;
    }

// -----------------------------------------------------------------------------

    static getTituloDiv (ctrl) {
        var titulo = ctrl.data('creator') ? ctrl.data('creator') :
                ctrl.data('stream');
        return String.prototype.toUpperCase.call ( titulo );
    }

// -----------------------------------------------------------------------------

    static getCreatorName (ctrl) {
        var name = ctrl.data('creator') ? ctrl.data('creator') :
                ctrl.data('stream');        
        return 'create_'+name;
    }

// -----------------------------------------------------------------------------

    static getFilterName (ctrl) {
        var name = ctrl.data('creator');        
        return 'filter_'+name;
    }

// -----------------------------------------------------------------------------

    static getAreaUrl (ctrl) {
        var res = ctrl.data('areaurl');
        return res;
    }    

// -----------------------------------------------------------------------------
    
    static pre_iniciar (url, message, subscribe, query, signed, initPort) {
        
        var dfd = new $.Deferred();
        
        Manager.getFreePort().then(
            (port) => {
                
                Manager._portCount = port;
                
                console.log('CONECTANDO AL PORT: ' + port);

                var ws = new WebSocket(Manager.starter);
                
                ws.onerror = function (error) {
                    console.warn('ERROR AL INICIAR CONEXION CON EL SERVIDOR: ');
                    console.dir(error);
                    dfd.reject();
                };  

                ws.onopen = function (error) {
                    ws.send( JSON.stringify({
                        'action': 'http-request',
                        'data': {
                            'port' : port
                        }
                    }));    
                    
                    dfd.resolve(ws);
                    
                };  

                ws.onmessage = function (msg) {

                    var payload = JSON.parse(msg.data); 
                    var port = payload.data.port_1;

//                    console.log('pre iniciar');
//                    console.dir(payload);

                    if ( subscribe === false ) {
                        message(payload, ws, port);
                    } else if ( subscribe === true ) {
                        var ws = Manager.iniciar(port, function () {
                            ws.subscribe(false,url);
                        }, message);                                    
                    } else { // info controls
                        var ws = Manager.iniciar(port, function () {
                            ws.sendBasic(url, query, undefined, signed);
                        }, message);                
                    }

                };    

                window.onbeforeunload = function () {
                    ws.close();
                    return true;
                };                  
                
            },
            () => {
                console.error('FALLO AL OBTENER PUERTO LIBRE');
            }
        );
        
        return dfd.promise();
        
    } // pre_iniciar    
    
// -----------------------------------------------------------------------------

    static iniciar (port, success, message) {

        var ws = new WebSocket('ws://127.0.0.1:'+port+'/binancehttp');

        ws.onerror = function (error) {
            console.warn('ERROR AL INICIAR STREAM EN '+port+': ');
            console.dir(error);
        };  

        ws.onopen = function (error) {
            success();
        };  

        ws.onmessage = function (msg) {

            var payload = JSON.parse(msg.data); 
            //console.info('respuesta: ');
            //console.dir(payload);
            //contenido.html(payload.data.body);
            
            if ( Manager.verify_error(payload) ) {
                ws.close();
                return;
            }
            
            var area = payload.stream ? payload.stream : 
                    payload.data.areaUrl;
            
            message(payload, area);
            
        }; // on message
        
        window.onbeforeunload = function () {
            ws.close();
            return true;
        };                  

        return ws;            
            
//            switch ( area ) {
//                
//                case 'dogeusdt@miniTicker':
//                    divMiniTicker = crear_div( divMiniTicker, 'MINI TICKER');
//                    create_miniTicker(divMiniTicker, payload);
//                    break;                
//                
//                case '/api/v3/ping':
//                    divPing = crear_div(divPing, 'PING');
//                    divPing.html('Ping Ok');
//                    break;
//                case '/api/v3/time':
//                    divTime = crear_div( divTime, 'SERVER TIME');
//                    var m = moment(payload.data.body.serverTime);
//                    divTime.html( m.format('YYYY-MM-DD HH:mm:ss') );
//                    break;
//
//                case 'dogeusdt@depth5@100ms':
//                    divPartialBook = crear_div( divPartialBook, 'PARTIAL BOOK');
//                    create_partialBook(divPartialBook, payload);
//                    break;
//                case 'dogeusdt@bookTicker':
//                    divBookTicker = crear_div( divBookTicker, 'PARTIAL BOOK');
//                    create_bookTicker(divBookTicker, payload);
//                    break;
//                case '/api/v3/exchangeInfo':
//                    if ( !divExInfo )
//                    divExInfo = crear_div('SERVER TIME', 'time');
//                    var m = moment(payload.data.body.serverTime);
//                    divExInfo.html( m.format('YYYY-MM-DD HH:mm:ss') );
//                    break;
//
//
//
//            } // switch
//
//




    } // iniciar    

// -----------------------------------------------------------------------------
    
    static getFreePort () {
        
        var dfd = new $.Deferred();
        var ws = new WebSocket(Manager.starter);

        ws.onerror = function (error) {
            dfd.reject();
            console.warn('ERROR AL INICIAR CONEXION CON EL SERVIDOR: ');
            console.dir(error);
        };  

        ws.onopen = function (error) {
            ws.send( JSON.stringify({
                'action': 'free-port',
                'data': false
            }));                     
        };  

        ws.onmessage = function (msg) {
            var payload = JSON.parse(msg.data); 
            dfd.resolve(payload.data.port);
        };         
        
        return dfd.promise();
        
    }; // getFreePorts
    
// -----------------------------------------------------------------------------

    static verify_error (payload) {
        
        if ( payload.data.code == undefined ) return false;
        
        console.error( "BINANCE API ERROR: " + payload.data.body.msg );
        return payload.data.code;
        
    }
    

// -----------------------------------------------------------------------------
    
} // Manager

