/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 7 jun. 2021 - 04:13:01
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

class ParabolicSAR {
    
    _klines = false;
    _lastRow = false;
    _cache = [];
    _dbgBuffer = [];
    _perAnalisisTend = 14;
    _tendencia = 'l'; // l = long, s = short
    _sumAF = 0.02;
    _maxAF = 0.2;
    
    _ultMin = 0;
    _ultMax = 0;
    _ultPrecioMax = false;
    _ultPrecioMin = false;
    _contTend = 0;
    
    _busy = false;
    
    
// -----------------------------------------------------------------------------    
    
    setData (klines) {
        
        if ( this._busy ) {
            console.warn('PAR SAR: OCUPADO, RETURN');
            return;
        }
        this._busy = true;
        
        var datosTend = false;
        var start = 0;
        this._klines = klines;
        
        if ( this._klines.length < this._perAnalisisTend ) {
            this._busy = false;
            return;
        }
        
        if ( !this._lastRow ) {
            datosTend = this._getTendencia();
            this._lastRow = this._getNewRow();
            this._lastRow.tend = datosTend.tend;
            this._lastRow.sar = datosTend.sar;
            this._contTend = 1;
            start = datosTend.index + 1;
        } else {
            start = this._klines.length - 2;
        }        
        
        this._calcSar(start);
        
//        if ( start == 14 ) {
//            
//            var buffer = 'OPEN;HIGH;LOW;CLOSE;SAR;EP;AF;TEND;ULT MIN;ULT MAX\n';
//            for ( var i = 0; i < this._cache.length; i++ ) {
//                buffer += this._dbgBuffer[i].join(';')+'\n';
//            }
//
//            console.log(buffer);
//        
//        }
        
        this._busy = false;
        
    }; // setData
    
// -----------------------------------------------------------------------------

    _calcSar (start) {
        
        var k = this._klines;
        
        var tend = false;
        var SAR = false;
        var EP = false;
        var AF = 0;
        var calcAF = 0;
        var row = null;

        SAR = this._lastRow.sar;
        EP = this._lastRow.ep;
        AF = this._lastRow.af;
        tend = this._lastRow.tend;                    
        
//        if ( k.length > 245 ) {
//            console.log('K');
//            console.dir( Array.prototype.slice.call(k, 244) );
//        }
        
        for ( var i = start; i < k.length; i++ ) {
            
            if ( k[i].x == false ) break;
            
            // ANALISIS SAR CAMBIO DE TENDENCIA
            // =================================================
            // 
            // Importante: el SAR que se recalcula en este punto es el SAR
            // de la vela anterior, por lo tanto el _lastRow debe ser 
            // actualizado
            
            if ( tend == 'l' ) { // long a short
                if ( SAR > k[i].l ) {
                    tend = 's';
                    SAR = this._ultMax;
                    AF = 0;
                    this._ultMax = false;
                    this._ultMin = false;
                    this._contTend = 1;                
                } else if ( SAR > k[i-1].l ) { // correccion s/ el minimo
                    SAR = k[i-1].l;
                }
            } else { // short a long
                if ( SAR < k[i].h ) {
                    tend = 'l';
                    SAR = this._ultMin;
                    AF = 0;
                    this._ultMax = false;
                    this._ultMin = false;
                    this._contTend = 1;                
                } else if ( SAR < k[i-1].h ) { // correccion s/ maximo
                    SAR = k[i-1].h;
                }                
            }
            
            this._lastRow.nuevo_sar = SAR;
            
            // CALCULO DE TENDENCIA
            // =====================
            
            if ( tend == 'l' ) {

                if ( EP == 0 || EP < k[i].h ) {
                    EP = k[i].h;
                    if ( AF < this._maxAF ) AF += this._sumAF;
                }
                
                calcAF = ( AF * ( Math.abs( EP - SAR ) ) );
                
            } else {
               
                if ( EP == 0 || EP > k[i].l ) {
                    EP = k[i].l;
                    if ( AF < this._maxAF ) AF += this._sumAF;
                }
                
                calcAF = ( AF * ( Math.abs( EP - SAR ) ) ) * -1;
                
            }
            
            // NUEVO SAR PARA LA VELA SIGUIENTE
            SAR = SAR + calcAF;
            
            row = {
                t   : k[i].t,
                sar : SAR,
                ep : EP,
                af : AF,
                tend : tend,
                contTend : ++this._contTend,
                ultMax : this._ultMax,
                ultMin : this._ultMin
            };
            
            Object.assign(row, k[i]);
            
            this._lastRow = row;
//            this._cache.push( this._lastRow );
            
            if ( this._ultMin == 0 || this._ultMin > k[i].l )
                this._ultMin = k[i].l;

            if ( this._ultMax == 0 || this._ultMax < k[i].h )
                this._ultMax = k[i].h;               
            
//            if ( this._cache.length > 30 ) 
//                this._cache.shift();
            
//            this._dbgBuffer.push([
//                k[i].o,
//                k[i].h,
//                k[i].l,
//                k[i].c,
//                this._lastRow.sar,
//                this._lastRow.ep,
//                this._lastRow.af,
//                this._lastRow.tend,
//                this._ultMin,
//                this._ultMax
//            ]);
            
        } // each kline
        
//        if ( k.length >= 249 ) {
//            console.log('SERIE CACHE');
//            console.dir( this._cache );
//        }        
        
    }; // calcSar
    
// -----------------------------------------------------------------------------

    _getTendencia () {
        
        var k = this._klines;
        var pri = 0;
        var ult = 0;
        var ultMin = false;
        var ultMax = false;
        var datos = {
            'tend' : 'l',
            'sar' : 0,
            'index' : this._perAnalisisTend - 1
        };
        
        for ( var i = 0; i < this._perAnalisisTend; i++ ) {        
            if ( i < this._perAnalisisTend / 2  ) pri += k[i].c;
            else ult += k[i].c;
            if ( ultMin === false || ultMin > k[i].l ) ultMin = k[i].l;
            if ( ultMax === false || ultMax < k[i].h ) ultMax = k[i].h;
        }
        
        if ( ult / this._perAnalisisTend >= pri / this._perAnalisisTend ) { // long
            datos.sar = ultMin;
        } else {
            datos.tend = 's';
            datos.sar = ultMax;
        }
        
        return datos;
        
    }; // calc tendencia
    
// -----------------------------------------------------------------------------

    getData () {
        return this._lastRow;
    };
    
// -----------------------------------------------------------------------------

    _getNewRow () {
        return {
            'sar'   : 0,
            'ep'    : 0,
            'af'    : 0,
            'tend'  : 'l'
        };
    };
    
// -----------------------------------------------------------------------------    
    
} // Sar