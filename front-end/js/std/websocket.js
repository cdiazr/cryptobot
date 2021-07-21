/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 28 abr. 2021 - 22:56:11
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

'use strict';

WebSocket.testNet = {};
WebSocket.testNet.httpBaseApiUrl = 'https://testnet.binance.vision';
WebSocket.testNet.wsBaseApiUrl = 'wss://testnet.binance.vision/stream';
WebSocket.testNet.apiKey = 'Y6EdeO74QFhNYyfZ4blKt68gWFsHFsrYljxi39tNUG4rp3fGH1MDKZ9vEvCYUmjy';
WebSocket.testNet.secretKey = false;

WebSocket.realNet = {};
WebSocket.realNet.httpBaseApiUrl = 'https://api.binance.com';
WebSocket.realNet.wsBaseApiUrl = 'wss://stream.binance.com:9443/stream';
WebSocket.realNet.apiKey = 'Fnlo4cfYRQirDSFSDGCOP8uHnUOHgAokPlOFwIiMJ7gv8ZXt2NYMWxXwqA78SR36';
WebSocket.realNet.secretKey = 'CudiETQjI8IUBICjCXCisx9Cv5deG59FYi0DLk7ptiZOrp0e1jwUThs6xqtH26hP';

WebSocket.prototype.sendBasic = function (api, query, action, signed, method) {
    
    if ( typeof method == 'undefined' ) method = 'GET';
    if ( typeof query == 'undefined' ) query = {};
    if ( typeof action == 'undefined' ) action = 'http-request';
    var stream = action == 'subscribe' || action == 'unsubscribe' ?
        query : false;

    this.send( JSON.stringify({
        'action': action,
        'stream': stream,
        'signed': signed,
        'data': {
            'apiUrl' : WebSocket.realNet.httpBaseApiUrl,
            'wsUrl' : WebSocket.realNet.wsBaseApiUrl,
            'areaUrl' : api,
            'headers' : {
                'X-MBX-APIKEY' : WebSocket.realNet.apiKey
            },
            'query' : query,
            'secretKey' : WebSocket.realNet.secretKey,
            'method': method
        }
    }));                              

};
            
// -----------------------------------------------------------------------------

WebSocket.prototype.subscribe = function (api, stream) {
    this.sendBasic(api, stream, 'subscribe');
};
            
// -----------------------------------------------------------------------------

WebSocket.prototype.unsubscribe = function (api, stream) {
    this.sendBasic(api, stream, 'unsubscribe');
};

// -----------------------------------------------------------------------------

WebSocket.prototype.sendJSON = function (action, data) {
    this.send( JSON.stringify({
        'action': action,
        'data': data
    }));  
};
            

