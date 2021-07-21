/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 24 jun. 2021 - 12:20:48
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

'use strict';

class EMA {
    
    _periodos = 9;
    _multiplicador = 0;
    _lastRow = false;
    _cache = [];
    _periodosTend = 14;
    _dec = 7;
    _tendVal = 0.02;
    _ultTend = false;
    
// -----------------------------------------------------------------------------

    constructor (periodos, periodosTend) {
        this._periodos = periodos;
        this._multiplicador = App.round( 2 / (this._periodos + 1), this._dec);
        this._periodosTend = periodosTend;
    }; // consturctor
    
// -----------------------------------------------------------------------------    
    
    setData (klines) {
        
        this._klines = klines;
        var start = 0;
        
        if ( this._klines.length < this._periodos ) return;
        
        if ( this._lastRow ) {
            start = this._klines.length - 2;
        }
        
        this._calc(start);
        
    }; // setData
    
// -----------------------------------------------------------------------------

    getData (precioActual) {
        
        return Object.assign({}, {
            // ema real time
            emart : App.round( (precioActual - this._lastRow.ema) * this._multiplicador + this._lastRow.ema, this._dec )
        }, this._lastRow);
        
    }; // getData
    
// -----------------------------------------------------------------------------

    _calc (start) {
        
        var k = this._klines;
        var len = k.length;
        var suma = 0;
        var EMA = 0;
        var row = {};
        
        for ( var i = start; i < len; i++  ) {
            
            if ( k[i].x == false || this._lastRow.t == k[i].t ) return;
            
            var c = parseFloat( k[i].c );
            var t = parseFloat( k[i].t );
            
            if ( i < this._periodos ) {
                
                suma += c;
                continue;
                
            } 
            
            else if ( i == this._periodos ) {
                
                EMA = App.round( suma / this._periodos, this._dec );
                
            } 
            
            else if ( k[i].x == true  ) { // vela cerrada
                
                EMA = App.round( (c - this._lastRow.ema) * this._multiplicador + this._lastRow.ema, this._dec );
            
            }
            
            row = {
                t: t,
                c: c,
                ema : EMA
            };
            
            this._cache.push( row );            
            
            if ( this._cache.length > this._periodosTend ) {
                Object.assign(row, this.getTendenciaEMA());
            }
            
            this._lastRow = row;
            
            if ( this._cache.length > this._periodos ) this._cache.shift();
            
        } // for i        
        
    }; // calc
    
// -----------------------------------------------------------------------------

    _calc_0 (start, precioActual) {
        
        var k = this._klines;
        var len = k.length;
        var suma = 0;
        var EMA = 0;
        var rowAnt = undefined;
        var row = null;
        
        precioActual = parseFloat(precioActual);
        
        for ( var i = start; i < len; i++  ) {
            
            if ( this._cache[ this._cache.length - 2 ] )
                rowAnt = this._cache[ this._cache.length - 2 ];
            
            var c = parseFloat( k[i].c );
            var cAnt = k[i-1] ? parseFloat( k[i-1].c ) : 0;
            var t = parseFloat( k[i].t );
            
            
            if ( i < this._periodos ) {
                
                suma += c;
                this._lastRow = {
                    t: t,
                    c: c
                };
                continue;
                
            } 
            
            else if ( i == this._periodos ) {
                
                EMA = suma / this._periodos;
                
            } 
            
            else if ( k[i].x == true && t == this._lastRow.t ) { // vela abierta y MISMA vela, recalcular EMA
                
                EMA = (cAnt - rowAnt.ema) * this._multiplicador + rowAnt.ema;
                
//                console.log('CORR CERRADO EMA '+this._periodos+' : ' + EMA + ' c: ' + c + ' e: ' + this._lastRow.ema + ' t: ' + t);
                
            } 
            
            else if ( k[i].x == false && t == this._lastRow.t ) { // vela abierta y MISMA vela, recalcular EMA
                
                EMA = (precioActual - rowAnt.ema) * this._multiplicador + rowAnt.ema;
//                console.log('ANTERIOR IGUAL: ' + rowAnt.ema);
//                console.log('abierto e IGUAL: ' + EMA);
                
            } 
            
            else if ( k[i].x == false && t > this._lastRow.t ) { // vela abierta y DIFERENTE, nueva EMA
                
//                console.dir({
//                    'k' : k[i],
//                    'last' : this._lastRow
//                });
                
                EMA = (cAnt - rowAnt.ema) * this._multiplicador + rowAnt.ema;
                this._lastRow.ema = EMA;
                this._lastRow.c = cAnt;
                this._cache[ this._cache.length - 1 ] = Object.assign({}, this._lastRow);
                
//                console.warn('EMA CORREGIDA '+this._periodos+' : ' + EMA + ' c: ' + cAnt + ' e: ' + rowAnt.ema + ' t: ' + rowAnt.t);
                
                EMA = (precioActual - this._lastRow.ema) * this._multiplicador + this._lastRow.ema;
//                console.log('ANTERIOR NUEVO: ' + rowAnt.ema);
//                console.log('abierto y NUEVO: ' + EMA);
                
            } 
            
            else if ( k[i].x == true && t > this._lastRow.t  ) { // vela cerrada
                
                EMA = (c - this._lastRow.ema) * this._multiplicador + this._lastRow.ema;
//                console.log('AGREGANDO EMA '+this._periodos+' : ' + EMA + ' c: ' + c + ' e: ' + this._lastRow.ema + ' t: ' + t);
            
            }
            
            row = {
                t: t,
                c: c,
                ema : EMA
            };
            
            if ( this._cache.length > this._periodosTend )
                Object.assign(row, this.getTendenciaEMA());
            
            if ( this._lastRow.t == t ) {
//                console.info('CACHE REPLACE EMA '+this._periodos+' : ' + EMA + ' c: ' + c + ' e: ' + this._lastRow.ema + ' t: ' + t);
                this._cache[ this._cache.length - 1 ] = row;
            } else {
//                console.info('CACHE AGREGANDO EMA '+this._periodos+' : ' + EMA + ' c: ' + c + ' e: ' + this._lastRow.ema + ' t: ' + t);
                this._cache.push( row );
            }
            
            this._lastRow = row;
            
            if ( this._cache.length > this._periodos ) this._cache.shift();
            
        } // for i        
        
        
        
    }; // calc
    
// -----------------------------------------------------------------------------


    getTendenciaEMA () {
        
        if ( this._periodosTend <= 3 ) return this._getTend3Periodos();
        else return this._getTendMayor3Periodos();
        
    }; // get tendencia sma
  
// -----------------------------------------------------------------------------

    _getTend3Periodos () {
        
        // fin de tendencia
        var minIdx = this._cache.length - this._periodosTend;
        var maxIdx = this._cache.length - 1;
        var pri = this._cache[minIdx].ema;
        var ult = this._cache[maxIdx].ema;
        var min = pri;
        var max = 0;
        
        for ( var i = minIdx; i <= maxIdx; i++ ) {
            
            if ( min > this._cache[i].ema ) min = this._cache[i].ema;
            if ( max < this._cache[i].ema ) max = this._cache[i].ema;
            
        }        
        
        var tend = (ult - pri) / pri * 100;
        
        return {
            ta  : Math.abs( tend ),
            tn  : tend,
            min : min,
            max : max
        };        
        
    }; // getTend3Periodos
    
// -----------------------------------------------------------------------------

    _getTendMayor3Periodos () {
        
        var suma1 = 0;
        var suma2 = 0;
        var tend = 0;
        var prom1 = 0;
        var prom2 = 0;
        
        // fin de tendencia
        var minIdx = this._cache.length - this._periodosTend;
        var maxIdx = this._cache.length - 1;
        var mitadIdx = minIdx + (this._periodosTend / 2);
        var pri = this._cache[minIdx].ema;
        var ult = this._cache[maxIdx].ema;
        var ult4 = this._cache[ this._cache.length - 4 ].ema;
        var min = pri; 
        var max = 0;
        var pMax = 0;
        var pMin = 0;
        var difPMax = 0;
        var difPMin = 0;
        var difMinPer = 2;
        var difMaxPer = this._periodosTend / 2;
        var ut = false; // ultima tendencia  - short o long
        
        for ( var i = minIdx; i <= maxIdx; i++ ) {
            
            if ( i < mitadIdx ) suma1 += this._cache[i].ema;
            else if ( i >= mitadIdx ) suma2 += this._cache[i].ema;
            
            if ( min > this._cache[i].ema ) {
                min = this._cache[i].ema;
                pMin = i;
            }
            
            if ( max < this._cache[i].ema ) {
                max = this._cache[i].ema;
                pMax = i;
            }
        }
        
        if ( this._cache.length < this._periodosTend ) {
            console.error('EMA: Error en this._cache != this._periodosTend');
            return 0;
        }
        
        prom1 = (suma1 / (this._periodosTend / 2));
        prom2 = (suma2 / (this._periodosTend / 2));
        
        tend = (prom2 - prom1) / prom1 * 100;
        
        // tendencia corta
        var tc = 'h';
        if ( ult > ult4 ) tc = 'l';
        else if ( ult < ult4 ) tc = 's';
        
        difPMax = i - pMax;
        difPMin = i - pMin;
        
        
                
        var res = {
            ta  : Math.abs( tend ),
            tn  : tend,
            tc : tc,
            fta : max > pri && 
                  max > ult && 
                  max - pri > max - ult && 
                  difPMax >= difMinPer &&
                  difPMax < difMaxPer ? true : false,
            ftb : min < pri && 
                  min < ult && 
                  pri - min > ult - min && 
                  difPMin >= difMinPer &&
                  difPMin < difMaxPer ? true : false,
            min : min,
            max : max,
            pri : pri,
            ult : ult,
            prom1 : prom1,
            prom2 : prom2,
            short : tend < this._tendVal * -1,
            long  : tend >= this._tendVal,
            lat   : Math.abs(tend) >= 0 && Math.abs(tend) < this._tendVal
        };        
        
        if ( res.short === true ) ut = 's';
        else if ( res.long === true ) ut = 'l';
        
        if ( this._lastRow.ut && this._lastRow.ut != ut && ut !== false ) res.ut = ut;
        else if ( this._lastRow.ut ) res.ut = this._lastRow.ut;
        else res.ut = ut;

        
        return res;
        
    }; // get tend mayor 3 periodos
    
};