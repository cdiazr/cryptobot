/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 11 may. 2021 - 11:44:21
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

'use strict';

class App {
    
    static _times = {};
    static _timesAnt = {};
    static _predetTime = 5000;
    static _clear = false;
    
// -----------------------------------------------------------------------------    
    
    static round (numero, decimales) {
        try {
            if ( !isNaN(numero) ) return parseFloat( numero.toFixed(decimales) );
            else return numero;            
        } catch (err) {
            return numero;
        }        
    };
    
// -----------------------------------------------------------------------------

    static initTime (index, time) {
        App._times[index] = time;
    };
    
// -----------------------------------------------------------------------------

    static showInTime (value, index, clear) {
        
        var now = Date.now();
        this._clear = clear;
        
        if ( typeof App._timesAnt[index] == 'undefined' ) {
            App._timesAnt[index] = now;
        }
        
        // si tiempo
        if ( now - App._timesAnt[index] >= App._times[index] ) {
            
            if ( this._clear ) console.clear();
            
            if ( typeof value == 'object' ) {
                console.log('showInTime: ' + index);
                console.dir(value);
            } else {
                console.log('showInTime: ' + index + ' - ' + value);
            }
            App._timesAnt[index] = now;
        }
        
        
    }; // show in time
    
// -----------------------------------------------------------------------------

    static empty (mixed_var) {
        // !No description available for empty. @php.js developers: Please update the function summary text file.
        // 
        // version: 1109.2015
        // discuss at: http://phpjs.org/functions/empty    // +   original by: Philippe Baumann
        // +      input by: Onno Marsman
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +      input by: LH
        // +   improved by: Onno Marsman    // +   improved by: Francesco
        // +   improved by: Marc Jansen
        // +   input by: Stoyan Kyosev (http://www.svest.org/)
        // *     example 1: empty(null);
        // *     returns 1: true    // *     example 2: empty(undefined);
        // *     returns 2: true
        // *     example 3: empty([]);
        // *     returns 3: true
        // *     example 4: empty({});    // *     returns 4: true
        // *     example 5: empty({'aFunc' : function () { alert('humpty'); } });
        // *     returns 5: false
        var key;

         if (mixed_var === "" || mixed_var === 0 || mixed_var === "0" || 
             mixed_var === null || mixed_var === false || typeof mixed_var === 'undefined' || 
             mixed_var == '') {
            return true;
        }

        if (typeof mixed_var == 'object') {        
                    for (key in mixed_var) {
                return false;
            }
            return true;
        } 
        return false;
    } // function empty
    
// -----------------------------------------------------------------------------

    static max (array) {
        
        if ( !array.length ) return 0;
        
        var max = 0;
        
        for ( var i = 0; i < array.length; i++ ) {
            if ( max < array[i] ) max = array[i];            
        }
        
        return max;
        
    }; // max
    
// -----------------------------------------------------------------------------

    static min (array) {
        
        if ( !array.length ) return 0;
        
        var min = 0;
        
        for ( var i = 0; i < array.length; i++ ) {
            if ( min == 0 || min > array[i] ) min = array[i];            
        }
        
        return min;
        
    }; // max
    
// -----------------------------------------------------------------------------

    
    
}