/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 23 may. 2021 - 18:01:59
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

/* 
 
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
// agregado manualmente al historial, salvo las que vienen los ws
'x' // is this closed ?

*/

'use strict';

class Velas {
    
    _klines = false;
    _ultMax = 0;
    _ultMin = false;
    _ultKline = false;
    _periodosTend = 14;
    
// -----------------------------------------------------------------------------

    setData (klines, precioActual) {
        
        var maxIdx = klines.length - 1;
        this._klines = klines;
        
        if ( this._ultKline !== false && this._ultKline.t != this._klines[maxIdx].t ) {
            this.calcUltPrecioMax(precioActual);
        } else if ( this._ultMax == 0 && this._klines.length > 1 ) {
            this.calcUltPrecioMax(precioActual);   
        }
        
        this._ultKline = this._klines[maxIdx];
    }
    
// -----------------------------------------------------------------------------

    getUltPrecioMax () {
        return this._ultMax;
    } // get ult max
    
// -----------------------------------------------------------------------------

    getUltPrecioMin () {
        return this._ultMin;
    } // get ult min
    
// -----------------------------------------------------------------------------

    calcUltPrecioMax (precioActual) {
        
        var maxIdx = this._klines.length - 1;
        var lUltMax = false;
        
        //console.log('ult max: ' + this._ultMax);
        
        if ( App.empty(precioActual) ) return;
//        if ( this._ultMax === false ) this._ultMax = precioActual;
        
        for ( var i = maxIdx; i >= 0; i--  ) {
            
            if ( typeof this._klines[i] == 'undefined' ) {
                i--;
            }    
            
            // si no esta cerrada
            if ( this._klines[i].x == false ) continue;
            if ( this._klines[i].c < this._klines[i].o ) continue;
            
            if ( lUltMax === false ) lUltMax = precioActual;
            
            if ( this._klines[i].c >= lUltMax ) {
                lUltMax = this._klines[i].c;
            } else {
                
                if ( lUltMax > this._ultMax ) {
//                    console.log('ULT MAX');
//                    console.dir({
//                        'ult max' : this._ultMax
//                    });                    
                    this.calcUltPrecioMin();
                }
                
                this._ultMax = lUltMax;
                
//                console.log('ULT MAX CORRIDO');
//                console.dir({
//                    'ult max' : this._ultMax
//                });     
                    
                return this._ultMax;
                
            }
                
        }        
        
    }; // calc ult max

// -----------------------------------------------------------------------------

    calcUltPrecioMin () {
        
        var maxIdx = this._klines.length - 1;
        
        for ( var i = maxIdx; i >= 0; i--  ) {
            if ( typeof this._klines[i] == 'undefined' ) {
                i--;
            }    
            
            if ( this._klines[i].x == false ) {
                continue;
            }
            
            if (  this._klines[i].c >= this._klines[i].o ) continue;
            
            if ( this._klines[i].c < this._ultMax ) {
                
                this._ultMin = this._klines[i].c;
            
//                console.log('ULT MAX MIN');
//                console.dir({
//                    'ult min' : this._ultMin,
//                    'ult max' : this._ultMax
//                });
            
                return this._ultMin;
            }
                
        } // for              
        
    }; // calc ult min

// -----------------------------------------------------------------------------

    restartPrecioMax () {
        this._ultMax = false;
    }; // restart mas
    
// -----------------------------------------------------------------------------

    restartPrecioMin () {
        this._ultMin = false;
    }; // restart min
    
// -----------------------------------------------------------------------------

    getTendencia (precioActual, rango) {
        
        var maxIdx = this._klines.length - 1;
        var ult = 0;
        var prim = 0;
        var suma = 0;
        var porMargenDifTend = 0.14;
        var difTend = 0;
        
        var inicio = maxIdx - this._periodosTend;
        var mitad = inicio + (this._periodosTend / 2);
        
        for ( var i = maxIdx; i > inicio; i--  ) {
            if ( typeof this._klines[i] == 'undefined' ) {
                maxIdx--;
                i--;
                inicio = maxIdx - this._periodosTend;
                mitad = inicio + (this._periodosTend / 2);
            }         
            
            suma += i == maxIdx ? parseFloat( precioActual ) :
                parseFloat( this._klines[i].c );
            
            if ( i == mitad + 1 ) {
                ult = suma / (this._periodosTend / 2);
                suma = 0;
            } else if ( i == inicio + 1 ) {
                prim = suma / (this._periodosTend / 2);
            }
            
        } // each kline
        
        difTend = (ult - prim) / prim * 100;
        
        if ( typeof rango == 'object' ) {
            rango.prim = prim;
            rango.ult = ult;
            rango.dif = difTend;
            rango.tend = difTend >= porMargenDifTend ? 'u' : 'd';
        }
        
        return difTend >= porMargenDifTend ? 'u' : 'd';
        
        
    }; // get tendencia
    
}; // velas