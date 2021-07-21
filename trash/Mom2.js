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

// Momemtum
class Mom2 {
    
    _klines = false;
    _lastRow = false;
    _cache = false;
    _periodosCache = 60;
    _periodos = 5;
    _xTarget = 2;
    
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
        var kAnt = false;
        var len = k.length;
        var row = {
            MF: 0, // momentum factor
            TR: 0, // true value
            XBAR: 0,  // x bar
            TBP : 0, // tend balance point
            TEND: 'L', // tendencia
            STOP: 0, // stop
            TARGET: 0 // target
        }; // momentum factor
        
        for ( var i = start; i < len; i++  ) {
            
            if ( k[i - this._periodos] == undefined ) continue;
            if ( !kAnt ) kAnt = k[i];
            
            if ( k[i].x == true ) { // cerrado
                row.MF = App.round( (k[i].c - k[i - this._periodos].c), 5);
            } else { // abierto
                row.MF = App.round( (precioActual - k[i - this._periodos].c), 5);      
            }
            
            var TRHighLow = Math.abs( k.h - k.l );
            var TRHighCloseY = Math.abs( k.h - kAnt.c );
            var TRCloseYLow = Math.abs( kAnt.c - k.l );

            // TR
            row.TR = Adx._max( [ TRHighLow, TRHighCloseY, TRCloseYLow ] );                    
            
            // X BAR
            row.XBAR = (k.h + k.l + k.c) / 3;
            
            // TBP - TOMORROW
            row.TBP = k[i - this._periodos] + this._getEPForTBP(i, row.TEND);
            
            if ( row.TEND == 'L' ) {
                row.STOP = row.XBAR - row.TR;
                row.TARGET = (row.XBAR * this._xTarget) - k[i].l;
            } else {
                row.STOP = row.XBAR + row.TR;
                row.TARGET = (row.XBAR * this._xTarget) - k[i].h;
            }
            
            
            row.t = k[i].t;
            
            this._lastRow = row;
            this._cache[0] = row;
            
            kAnt = k[i];
            
        } // for i
        
    }; // calcMF
    
// -----------------------------------------------------------------------------
    
    /**
     * Extreme price for TBP
     */
    _getEPForTBP (iAct, tend) {
        
        var k = this._klines;
        var baseI = iAct - this._periodos;
        var min = 0;
        var max = 0;
        
        for ( var i = iAct; i >= baseI; i-- ) {
            if ( k[i].c < max ) max = k[i].c;
            if ( min == 0 || min > k[i].c ) min = k[i].c;
        }
        
        return tend == 'L' ? min : max;
        
    };
    
    
} // Mom
