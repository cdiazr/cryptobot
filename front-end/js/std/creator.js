/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 28 abr. 2021 - 22:52:40
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

class Creator {
 
    static create_miniTicker (div, data) {

        var row = data.data;
        var m = moment(row.E);

        div.html(
            '<table>'+

            '<tr>'+
            '<td>Date</td>'+
            '<td>Open</td>'+
            '<td>High Price</td>'+
            '<td>Total Qty.</td>'+
            '</tr>'+

            '<tr>'+
            '<td>'+m.format('DD/MM/YYYY HH:mm')+'</td>'+
            '<td>'+row.o+'</td>'+
            '<td>'+row.h+'</td>'+
            '<td>'+row.v+'</td>'+
            '</tr>'+

            '<tr>'+
            '<td>Symbol</td>'+
            '<td>Close</td>'+
            '<td>Low Price</td>'+
            '<td>Total Symbol</td>'+
            '</tr>'+

            '<tr>'+
            '<td>'+row.s+'</td>'+
            '<td>'+row.c+'</td>'+
            '<td>'+row.l+'</td>'+
            '<td>'+row.q+'</td>'+
            '</tr>'+

            '</table>'
        );

    } // create miniticker    
    
// -----------------------------------------------------------------------------

    static create_partialBook (div, data) {

        var row = data.data;
        var lenBD = row.bids.length;
        var tr = '';

        for ( var i = 0; i < lenBD; i++ ) {
            tr +=
            '<tr>'+
            '<td>'+row.bids[i][0]+'</td>'+
            '<td>'+row.bids[i][1]+'</td>'+
            '<td>'+row.asks[i][0]+'</td>'+
            '<td>'+row.asks[i][1]+'</td>'+
            '</tr>';
        }

        div.html(
            '<table>'+
            '<tr>'+
            '<td colspan="2">BID</td>'+
            '<td colspan="2">ASK</td>'+
            '</tr>'+tr+
            '</table>'
        );

    } // create partialbook
    
// -----------------------------------------------------------------------------

    static create_bookTicker (div, data) {

        var row = data.data;

        div.html(
            '<table>'+

            '<tr>'+
            '<td>Symbol</td>'+
            '<td class="bid">BID Price</td>'+
            '<td class="bid">BID Qty</td>'+
            '<td class="ask">ASK Price</td>'+
            '<td class="ask">ASK Qty</td>'+
            '</tr>'+

            '<tr>'+
            '<td class="bid">'+row.s+'</td>'+
            '<td class="bid">'+row.b+'</td>'+
            '<td class="bid">'+row.B+'</td>'+
            '<td class="ask">'+row.a+'</td>'+
            '<td class="ask">'+row.A+'</td>'+
            '</tr>'+

            '</table>'
        );

    } // create miniticker    
    
// -----------------------------------------------------------------------------

    static create_exchangeInfo (div, data) {

        var row = data.data;

        div.html();
        
        console.dir(data);

    } // create miniticker    
    
// -----------------------------------------------------------------------------

    static create_accountInfo (div, data) {

        var row = data.data;
        var balances = row.body.balances;
        var lenB = balances.length;
        var tr = '';

        for ( var i = 0; i < lenB; i++ ) {
            tr +=
            '<tr>'+
            '<td>'+balances[i].asset+'</td>'+
            '<td>'+balances[i].free+'</td>'+
            '<td>'+balances[i].locked+'</td>'+
            '</tr>';
        }

        div.html(
            '<table>'+
            '<tr>'+
            '<td >ASSET</td>'+
            '<td >FREE</td>'+
            '<td >LOCKED</td>'+
            '</tr>'+tr+
            '</table>'
        );

        //console.dir(data);

    } // create miniticker    
    
// -----------------------------------------------------------------------------

    static create_openOrders (div, data) {
        
        var row = data.data;
        var orders = row.body;
        var lenB = orders.length;
        var tr = '';

        if ( !orders.length ) {
            div.html('SIN ORDENES ABIERTAS');
            return;
        }

        for ( var i = 0; i < lenB; i++ ) {
            
            tr +=
            '<tr>'+
            '<td>'+orders[i].symbol+'</td>'+
            '<td>'+orders[i].price+'</td>'+
            '<td>'+orders[i].origQty+'</td>'+
            '<td>'+orders[i].executedQty+'</td>'+
            '<td>'+orders[i].status+'</td>'+
            '<td>'+orders[i].type+'</td>'+
            '<td>'+orders[i].side+'</td>'+
            '<td>'+
                '<button '+
                    'data-symbol="'+orders[i].symbol+'" '+
                    'data-orderId="'+orders[i].orderId+'" '+
                    'data-clientOrderId="'+orders[i].clientOrderId+'" '+
                    'class="btnCancelOrder" >'+
                        'CANCEL'+
                '</button> '+
            '</td>'+
            '</tr>';
        }

        div.html(
            '<table>'+
            '<tr>'+
            '<td >SYMBOL</td>'+
            '<td >PRICE</td>'+
            '<td >ORIG QRY</td>'+
            '<td >EXEC QRY</td>'+
            '<td >STATUS</td>'+
            '<td >TYPE</td>'+
            '<td >SIDE</td>'+
            '<td >CANCEL</td>'+
            '</tr>'+tr+
            '</table>'
        );
        
        $(div).find('.btnCancelOrder').off().click(function () {
            
            var ctrl = $(this);
            var data = {
                'symbol' : ctrl.attr('data-symbol'),
                'orderId' : ctrl.attr('data-orderId'),
                'origClientOrderId' : ctrl.attr('data-clientOrderId')
            };
            
            Manager.pre_iniciar(false, function (payload, ws, port) {
                
                var ws1 = Manager.iniciar(port, 
                    function () {
                        data.timestamp = Date.now();
                        ws1.sendBasic('/api/v3/order', data, undefined, true, 'DELETE');
                    }, function (payload, area) {
                        if ( payload.data.code != 200 ) {
                            console.warn('No se pudo cancelar la orden: ' + data.orderId);
                            console.dir(payload);
                        }
                    });                  
                
            }, false);
            
        });

    } // create miniticker       
    
// -----------------------------------------------------------------------------

    static create_div ( div, titulo ) {
        if ( !div.length ) {
            Manager.contenido.append( 
                $('<div>').attr({
                    'class' : 'win'
                }).append(
                    $('<div>').attr({
                        'class' : 'titulo'
                    }).html(titulo),
                    div = $('<div>').attr({
                        'class' : 'body' 
                    }),
                )
            );
        }
        return div;
    } // crear_div   
    
// -----------------------------------------------------------------------------

    static init_div ( divId ) {
        
        if ( typeof Creator[divId] == 'undefined' ) {
            Creator[divId] = {};
        } 
        
        return Creator[divId];
        
    }
    
} // Creator