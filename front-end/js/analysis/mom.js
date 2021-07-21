/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 20 jun. 2021 - 21:23:24
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

'use strict';

// Momemtum
class Mom {
    
    _klines = false;
    _lastRow = false;
    _cache = false;
    _periodosCache = 100;
    _periodos = 100;
    
// -----------------------------------------------------------------------------

    setData (klines, precioActual) {
        
        this._klines = klines;
        var start = 0;
        
        if ( this._klines.length < this._periodos ) return;
        
        if ( this._lastRow ) {
            start = this._klines.length - 1;
        }
        
        this._calcMF(start, precioActual);
        
    }; // setData
    
// -----------------------------------------------------------------------------
    
    getData () {
        
        return this._lastRow;
        
    }; // getData
    
    
// -----------------------------------------------------------------------------

    _calcMF (start, precioActual) {
        
        var k = this._klines;
        var len = k.length;
        var mf = 0; // momentum factor
        var mfAnt = this._lastRow.mf ? this._lastRow.mf : 0;
        
        for ( var i = start; i < len; i++  ) {
            
            if ( k[i - this._periodos] == undefined ) continue;
            
            if ( k[i].x == true ) { // cerrado
                mf = App.round( (k[i].c - k[i - this._periodos].c), 5);
            } else { // abierto
                mf = App.round( (precioActual - k[i - this._periodos].c), 5);      
            }
            
            this._lastRow = {
                t: k[i].t,
                mf: mf,
                mfAnt: mfAnt
            };
            
        } // for i
        
    }; // calcMF
    
    
    
} // Mom
