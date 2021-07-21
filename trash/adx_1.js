/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 25 may. 2021 - 18:13:12
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

'use strict';

class Adx {
    
    _klines = false;
    _periodos = 40;
    _periodosADX = 14;
    _cache = [];
    _perVelas = 60000;
    _lastRow = false;
    _perTotales = false;
    
// -----------------------------------------------------------------------------    
    
    constructor () {
        this._perTotales = this._periodos * 2 + 2;
    }; // constructor
    
// -----------------------------------------------------------------------------    
    
    setData (klines) {
        
        var maxCIndex = 0;
        var maxKIndex = 0;
        var cIndex = 0;
        var rowAnt = false;
        
        this._klines = klines;

        if ( typeof this._klines == 'undefined' || this._klines.length < this._perTotales ) return;
        
//        console.log('CACHE: ' + this._cache.length);
//        console.log('KLINES: ' + this._klines.length);
        
        if ( this._lastRow ) {
            
            maxKIndex = this._klines.length - 1;
            
//            console.dir({
//                maxKIndex: maxKIndex
//            });
            
            if ( this._klines[maxKIndex].t >= this._lastRow.t &&
                 this._klines[maxKIndex].t - this._lastRow.t >= 0   
            ) {
        
                cIndex = maxKIndex;
                rowAnt = this._klines[maxKIndex].t == this._lastRow.t ?
                    Object.assign( {}, this._cache[ this._cache.length - 2 ] ) :
                    Object.assign( {}, this._lastRow );
                
            } else {
                console.error('ERROR AL SINCRONIZAR CACHE ADX CON VELAS');
                console.dir({
                    'maxKIndex' : maxKIndex,
                    'maxCIndex' : maxCIndex,
                    'kline' : this._klines[maxKIndex],
                    'lastRow' : this._lastRow
                });
            }
            
        } // cache > 0
        
        
        this._load_cache( cIndex, rowAnt );
        
    }; // set data
    
// -----------------------------------------------------------------------------

    
    
// -----------------------------------------------------------------------------

    /**
     * Retorna los siguientes datos
     * 
     * t  : tiempo
     * TR : true value
     * DMp : movimiento direccional
     * DMm :
     * DM14p : suma de movimiento de direccionar de n periodos
     * DM14m :
     * TR14 : suma de tr de n periodos
     * DI14p : indicador direccional de n periodos
     * DI14m :
     * DX : indice direccioal
     * ADX : promedio de indice direccional       

     * @returns {Array|Boolean}
     */
    getData () {
        return this._lastRow;
    }; // get Data

// -----------------------------------------------------------------------------

    getDMI () {
        
        if ( !this._lastRow ) return 0;
        
        var difDI = (this._lastRow.DI14p - this._lastRow.DI14m) / this._lastRow.DI14m * 100;
        
        return {
            'adx'       : this._cache[ this._cache.length - 2 ].ADX,
            'dip'       : this._lastRow.DI14p,
            'dim'       : this._lastRow.DI14m,
            'atr'       : this._lastRow.ATR,
            'difDI'     : difDI,
            'absDifDI'  : Math.abs(difDI)
        };
        
    }; // getDmi
    
// -----------------------------------------------------------------------------
    
    getADX () {
        if ( !this._lastRow ) return 0;
        this._lastRow.ADX;
    }; // getADX
    
// -----------------------------------------------------------------------------

    getATR () {
        if ( !this._lastRow ) return 0;
        this._lastRow.ATR;        
    }; // getATR
    
// -----------------------------------------------------------------------------    
    
    _load_cache ( start, rowAnt ) {
        
        var k = this._klines;
        var row = null;
        
        var sumDM14p = 0;
        var sumDM14m = 0;
        var sumTR14 = 0;
        var sumDX = 0;
        
        if ( !rowAnt ) {
            k[start] = Adx.castFloat(k[start]);
            start++;
        }
        
//        console.log('ANALISIS K start: ' + start + ' k: ' + k .length);
//        console.dir(k[start - 1]);
//        console.dir(k[start]);
        
        for ( var i = start; i < k.length; i++ ) {
            
            //if ( k[i].x == false ) break;
            
            k[i] = Adx.castFloat(k[i]);
            
            row = Adx._newRow( k[i].t );
            
            // TR / DM
            Object.assign( row, this._calcBase1(k[i], k[i-1]) );
            
            // Si no se llego al periodo, acumular
            if ( i <= this._periodos ) { // FASE 1 - hasta el 14
                
                sumDM14p += row.DMp;
                row.DM14p = sumDM14p;
                
                sumDM14m += row.DMm;
                row.DM14m = sumDM14m;
                
                sumTR14 += row.TR;
                row.TR14 = sumTR14;
                
                row.ATR = row.TR14 / this._periodos;
                
//                console.log('SUMANDO DM14');
//                console.dir(row);
                
            } else { // FASE 2 - a partir de 15
                
                // DM14 / DI14 / DX
                Object.assign( row, this._calcBase2(row, rowAnt) );

//                console.log('BASE 2 FUERA FUNCION');
//                console.dir(row);                
                
                // mientra i < 28, acumular hasta llegar a los 13 periodos
                if ( i < this._periodos * 2 ) { // hasta el 27 (suma de 14 periodos)
                    sumDX += row.DX;
                } 
                // legado al 28 calcular primer promedio ADX
                else if ( i == this._periodos * 2 ) { 
                    sumDX += row.DX;
                    row.ADX = sumDX / this._periodos;
                } 
                // a partir del 29, calcular normal el ADX
                else { 
                    
                    // ADX
                    Object.assign( row, this._calcBase3(row, rowAnt));
                    
//                    if ( i == 29 ) {
//                        console.log('ADX 29');
//                        console.dir(row);
//                    }
                    
                }
                
            } // periodos 14
            
            rowAnt = Object.assign({}, row);
            
            if ( this._lastRow && this._lastRow.t == row.t ) {
                this._cache[ this._cache.length - 1 ] = row;
            } else if ( !this._lastRow || row.t > this._lastRow.t ) {
                this._cache.push( Object.assign({}, row) );
            }
            
            
            if ( this._cache.length > this._perTotales ) this._cache.shift();
            
        } // for eahc klines        
        
        this._lastRow = Object.assign({}, row);
        //this._lastRow = this._cache[ this._cache.length - 1 ];
        
//        console.log('1M ROW AGREGADO');
//        console.dir(this._lastRow);        
        
    }; // load cache

// -----------------------------------------------------------------------------

    static _max (array) {
        
        if ( !array.length ) return 0;
        
        var max = 0;
        
        for ( var i = 0; i < array.length; i++ ) {
            if ( max < array[i] ) max = array[i];            
        }
        
        return max;
        
    }; // getMax
    
// -----------------------------------------------------------------------------

    static _newRow (openTime) {
        
        return {

            t : openTime,

            TR : 0,
            ATR: 0,

            DMp : 0,
            DMm : 0,

            DM14p : 0,
            DM14m : 0,
            TR14 : 0,

            DI14p : 0,
            DI14m : 0,

            DX : 0,
            ADX : 0

        };        
        
    }; // newRow
    
// -----------------------------------------------------------------------------

    _calcBase1 (k, kAnt) {
        
        var row = {};
        var TRHighLow = Math.abs( k.h - k.l );
        var TRHighCloseY = Math.abs( k.h - kAnt.c );
        var TRCloseYLow = Math.abs( kAnt.c - k.l );
        
        // TR
        row.TR = Adx._max( [ TRHighLow, TRHighCloseY, TRCloseYLow ] );        
        
        var difH = k.h - kAnt.h;
        var difL = kAnt.l - k.l; // atencion: low ant  - low actual
        
        // DM +
        if ( difH > 0 && difH > difL  ) {
            row.DMp = difH;
        } 
        // DM -
        else if ( difL > 0 && difL > difH ) {
            row.DMm = difL;                
        }                 
        
//        console.log('BAES 1');
//        console.dir(k[i-1]);
//        console.dir(k[i]);
//        console.dir(row);
        
        return row;
        
    }; // calc base 1
    
// -----------------------------------------------------------------------------

    _calcBase2 (row, rowAnt) {
        
        // DM 14

        row.DM14p = rowAnt.DM14p - (rowAnt.DM14p / this._periodos) + row.DMp;
        row.DM14m = rowAnt.DM14m - (rowAnt.DM14m / this._periodos) + row.DMm;
        row.TR14 = rowAnt.TR14 - (rowAnt.TR14 / this._periodos) + row.TR;

        // DI 14

        row.DI14p = row.DM14p / row.TR14 * 100;
        row.DI14m = row.DM14m / row.TR14 * 100;

        // DX

        row.DX = Math.abs( row.DI14p - row.DI14m ) / (row.DI14p + row.DI14m) * 100;  
        
        // ATR
        
        row.ATR = (rowAnt.ATR * (this._periodos - 1) + row.TR) / this._periodos;
        
        return row;
        
    }; // calc base 2
    
// -----------------------------------------------------------------------------

    _calcBase3 (row, rowAnt) {
        
        row.ADX = (rowAnt.ADX * (this._periodos - 1) + row.DX) / this._periodos;
        return row;
        
    }; // calc base 3
    
// -----------------------------------------------------------------------------
    
    /**
     * No implementado
     * @returns {Boolean}
     */
    _calc_tend_adx () {
        
        var pri = this._cache[0].adx;
        var ult = this._cache[ this._cache.length - 1 ];
        var max = 0;
        var min = 0;
        
        var DMp = 0;
        var DMm = 0;
        
        for ( var i = this._cache.length; i > this._cache.length - this._periodos; i-- ) {
            if ( max < this._cache[i] ) max = this._cache[i];
            if ( min > this._cache[i] ) min = this._cache[i];
        } // each cache
        
        if ( max > ult ) return true;
        
        
    }; // calc tendencia adx
    
// -----------------------------------------------------------------------------

    static castFloat (row) {
        
        var idx = [
            't', // open time 0
            'o', // open price 1 
            'h', // high price 2
            'l', // low price 3 
            'c', // close price 4
            'v', // base asset volume (cantidad) 5
            'T', // close time 6
            'q', // quote asset volume (cant * precio) 7
            'n', // number of trades 8
            'V', // Taker buy base asset volume 9
            'Q' // Taker buy quote asset volume 10
        ];
        
        for ( var i in idx ) {
            row[idx[i]] = parseFloat( row[idx[i]] );
        }
        
        return row;
        
    }; // cast float
    
// *****************************************************************************    
}; // ADx