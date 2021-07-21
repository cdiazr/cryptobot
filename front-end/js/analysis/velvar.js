/* global App */

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 11 may. 2021 - 05:12:45
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

'use strict';

class Velvar {
    
    _timeStamp = false;
    _suma = 0;
    _cant = 0;
    _maxDiv = 1000000000;
    _maxSuma = 2000000000;
    _timeVar = 1000; // milisegundos
    _ultPrecio = false;
    _porAlertaVar = 100;
    
    _lastVar = 0;
    
    _lastProms = [];
    _maxCantProms = 30;
    _sumLastProms = 0;
    
// -----------------------------------------------------------------------------    
    
    setPrice (price, exceso) {
        
        var dif = 0;
        var difTime = 0;
        var cantTime = 0;
        
        price = parseFloat(price);
        
        if ( !this._timeStamp ) {
            this._timeStamp = Date.now();
        }
        
        if ( this._ultPrecio === false ) this._ultPrecio = price;
        
        difTime = Date.now() - this._timeStamp;
        
        if ( difTime >= this._timeVar ) {
            
            cantTime = difTime / this._timeVar;
            
            this._timeStamp = Date.now();
            
            dif = Math.abs( (price - this._ultPrecio) / this._ultPrecio * 100 );
            
            if ( dif > 0 ) {
                
                exceso = this._verifExcesoSubida(dif);
                
                this._suma += dif;
                this._cant += cantTime; 
                this._ultPrecio = price;
                
                // verificar que las cantidad no se agranden mucho y pasen de 32 bits
                if ( this._suma >= this._maxSuma ) {
                    this._suma /= this._maxDiv;
                    this._cant /= this._maxDiv;
                }
                
                // ultimos 10 promedios
                // -------------------------
                
                if ( this._lastProms.length == this._maxCantProms ) {
                    this._sumLastProms -= this._lastProms[0];
                    this._lastProms.shift();
                } 

                this._lastProms.push(dif);
                this._sumLastProms += dif;                
                
                // -------------------------------------                
                
            } // dif

        }
        
    }; // setprice

// -----------------------------------------------------------------------------

    getProm () {
        return this._suma / this._cant;
    }; // get prom
    
// -----------------------------------------------------------------------------

    _verifExcesoSubida (dif) {
        
        var prom = this.getLastProms();
        var act = Math.abs( (dif - prom) / prom * 100 );
        if ( act > this._porAlertaVar ) {
            console.warn('SUBIDA EXCESIVA') ;
            console.dir({
                'dif' : dif,
                'prom' : prom,
                'act' : act,
                'sum' : this._sumLastProms
            });            
            console.dir(this._lastProms);            
        }
        
        return act;
        
        
    };
    
// -----------------------------------------------------------------------------

    getLastProms () {
        return this._sumLastProms / this._lastProms.length;
    }; // get last proms
    
} // Vervar