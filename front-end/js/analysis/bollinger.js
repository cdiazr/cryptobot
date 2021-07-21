    /**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 11 may. 2021 - 03:14:17
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

'use strict';

class Bollinger {
    
    _klines = false;
    _periodos = 20;
    _periodosTend = 14;
    // t = tendencia de la media movil del centro, % con signo
    // ft = fin de t, se termina la tendencia
    // ftb y fta = finalizando tendencia bajista y fta = alcista
    // ta = tendencia absolta, en %
    _banda = {m:0, u:0, l:0, t:0, ta: 0, ftb: false, fta: false};
    _smaPer = [];
    
    _maxTend = 0;
    _minTend = 0;
    
// -----------------------------------------------------------------------------

    constructor () {
        
    }; // constructor
    
// -----------------------------------------------------------------------------

    setData ( klines ) {
        this._klines = klines;
        if ( this._klines.length < this._periodos ) return;
        this._banda = this._calcBanda();
        this._smaPer = this._calcSMAPer();
        Object.assign( this._banda, this.getTendenciaSMA() );
    }; // setData
    
// -----------------------------------------------------------------------------
    
    /**
     * Genera las bandas
     * @returns {Bollinger._calcBanda.band}
     */
    _calcBanda () {

        var SMA = this.getSMA();
        var stDev = this.getStDev(SMA);
        var band = {u: 0, m: 0, l: 0};
        
        band.m = SMA;
        band.u = SMA + ( stDev * 2 );
        band.l = SMA - ( stDev * 2 );
        
        return band;        
        
    };
    
// -----------------------------------------------------------------------------
    
    /**
     * Genera el array SMA para luego sacar promedio de periodos
     * @returns {Array}
     */
    _calcSMAPer () {
        
        var maxIdx = this._klines.length - 1;
        var aTend = [];
        var per = this._periodosTend - 1;

        for ( var i = maxIdx; i > maxIdx - this._periodosTend; i--  ) {
            if ( typeof this._klines[i] == 'undefined' ) {
                maxIdx--;
                i--;
            }  
            
            aTend[per] = this.getSMA(i);
            per--;                
            
        }
        
        return aTend;
        
    }; // calc sma per
    
// -----------------------------------------------------------------------------

    getData () {
        return this._banda;
    }; // getData
    
// -----------------------------------------------------------------------------
    
    /**
     * Devuelve la media movil simple del ult movimiento o del especificado
     * @param {type} _maxIdx vela sobre la cual generar
     * @returns {Number}
     */
    getSMA (_maxIdx) {
        
        var maxIdx = _maxIdx != undefined ? _maxIdx : this._klines.length - 1;
        var suma = 0;
        
        for ( var i = maxIdx; i > maxIdx - this._periodos; i--  ) {
            if ( typeof this._klines[i] == 'undefined' ) {
                maxIdx--;
                i--;
            }            
            suma += parseFloat( this._klines[i].c );
        }
        
        return suma / this._periodos;        
        
    }; // getSMA
    
// -----------------------------------------------------------------------------

    getStDev (SMA) {
      
        var maxIdx = this._klines.length - 1;
        var suma = 0;
        
        for ( var i = maxIdx; i > maxIdx - this._periodos; i--  ) {
            if ( typeof this._klines[i] == 'undefined' ) {
                maxIdx--;
                i--;
            }
            suma += Math.pow( parseFloat( this._klines[i].c ) - SMA, 2);
        }        
        
        return Math.sqrt( suma / (this._periodos - 1) );
        
    };
    
// -----------------------------------------------------------------------------

    getTendenciaSMA () {
        
        var suma1 = 0;
        var suma2 = 0;
        var tend = 0;
        var prom1 = 0;
        var prom2 = 0;
        this._periodosTend = 14;
        
        // fin de tendencia
        var pri = this._smaPer[0];
        var ult = this._smaPer[this._smaPer.length - 1];
        var min = pri; 
        var max = 0;
        var pMax = 0;
        var pMin = 0;
        var difPMax = 0;
        var difPMin = 0;
        var difMinPer = 2;
        var difMaxPer = this._periodosTend / 2;
        
        for ( var i = 0; i < this._smaPer.length; i++ ) {
            if ( i < this._periodosTend / 2 ) suma1 += this._smaPer[i];
            if ( i >= this._periodosTend / 2 ) suma2 += this._smaPer[i];
            if ( min > this._smaPer[i] ) {
                min = this._smaPer[i];
                pMin = i;
            }
            if ( max < this._smaPer[i] ) {
                max = this._smaPer[i];
                pMax = i;
            }
        }
        
        if ( this._smaPer.length < this._periodosTend ) {
            console.error('BOLLINGER: Error en this._smaPer != this._periodosTend');
            return 0;
        }
        
        prom1 = (suma1 / (this._periodosTend / 2));
        prom2 = (suma2 / (this._periodosTend / 2));
        
        tend = (prom2 - prom1) / prom1 * 100;
        
        difPMax = i - pMax;
        difPMin = i - pMin;
        
        return {
            ta  : Math.abs( tend ),
            t   : tend ,
            fta : max > pri && 
                  max > ult && 
                  max - pri > max - ult && 
                  difPMax >= difMinPer &&
                  difPMax < difMaxPer ? true : false,
            ftb : min < pri && 
                  min < ult && 
                  pri - min > ult - min && 
                  difPMin >= difMinPer &&
                  difPMin < difMaxPer ? true : false
        };
        
    }; // get tendencia sma

    
// *****************************************************************************    
}; // Bolllinger