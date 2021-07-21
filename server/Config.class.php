<?php

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <roberot@sysmovil.com>
 * @descripción: Archivo de configuracion
 * @version 1.0 - 20 jul. 2021 - 23:28:52
 * 
 * #############################################################################
 * 
 * @titulo: 
 * @tipo:
 * @modulo: 
 * @categoria: 
 * @programa: 
 * 
 * ----------------------------------------------------------------------------
 * OPCIONALES
 * 
 * @url-amigable: 
 * @generico:
 * @depende-de:
 * @permisos:
 * @oculto:
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

Class Config {
    
    private static $_data = array();
    
// -----------------------------------------------------------------------------    
    
    /**
     * Carga la configuración desde el archivo config.json
     */
    public static function load () {
        self::$_data = json_decode( file_get_contents(__DIR__.'/config.json'), true );
    } // load
    
// -----------------------------------------------------------------------------

    public static function get ( $key ) {
        return self::$_data[$key];
    } // get
    
// -----------------------------------------------------------------------------

    public static function set ( $key, $value ) {
        return self::$_data[$key] = $value;
    } // get
    
}


?>