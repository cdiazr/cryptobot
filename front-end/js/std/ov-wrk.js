/* global COMPRA, VENTA, REAL, OP_COMPRA, OE_CANCELADO, OE_EJECUCION_PARCIAL, OE_EJECUTANDO, OE_COMPLETO, OE_RECHAZADO, OE_CANCELANDO, OE_ERROR, OE_EXPIRADO, OP_VENTA, OTM_GTC, Ex, ERR_002, ERR_001, ERR_004, ERR_003, tnis, VIRTUAL, App */

/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 2 may. 2021 - 11:20:37
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

'use strict';

importScripts('app.js');
importScripts('main-defs.js');
importScripts('Ex.js');
importScripts('websocket.js');

importScripts('../analysis/bollinger.js');
importScripts('../analysis/velvar.js');
importScripts('../analysis/velas.js');
importScripts('../analysis/adx.js');
importScripts('../analysis/parabolic-sar.js');
importScripts('../analysis/mom.js');
importScripts('../analysis/ema.js');

var wrk = false;

// -----------------------------------------------------------------------------

class OvWrk {
    
//               <|+++++++++++++++++++++++++++++++++++++++|>                    
//                          INDICADORES    
//               <|+++++++++++++++++++++++++++++++++++++++|>                        
    
    // por = porcentaje
    // ind = indicador
    // desc = descenso
    
    // VARIABLES DE ESTADO CON MODIFICACION AUTOMATICA
    // ================================================
    
    _precioCompra = 0; // precio que se ha compra ult vez
    _precioVenta = 0; // reservado
    _precioMin = 0; // precio min antes de la compra
    _precioMax = 0; // precio max alcanzado
    _precioActual = 0;
    _precioUlt = 0; // ult precio antes del actual, para saber si hay suba o baja
    
    _precioBaseIndVenta = 0; // compra + margen de venta
    _precioTopeIndVenta = 0; // preciomax - margen descenso
    
    // cuanto mas, esta bajo el precio, sobre el limite de descenso
    _difPorIndDesc = 0; 

    // precio indicador de venta de la diferencia entre el precio de compra
    // y el precio max
    _precioIndVenta = 0; 
    
    _precioIndDesc = 0; // precio indicador de descenso con relacion al precio max
    _porIndDesc = 0; // porcentaje de descenso del precio actual con relacion al precio max    
    
    // porcentaje incremento precio max
    _porIncPrecioMax = 0;
    _porIncPrecioActual = 0;
    _porIncPrecioIndVenta = 0;
    _porIncPrecioCompra = 0;
    _porIncPrecioMin = 0;
    
    _porIncPerdida = 0;
    
    // datos ult compra y venta
    _datosUltCompra = false;
    _datosUltVenta = false;
    
    _cantPar1 = 0;
    _cantPar2 = 0;
    
    _cantInicCompra = 0;
    _cantInicVenta = 0;
    
    _profitTaked = 0;
    
    _bookTickerTime = 0;
    
    // VARIABLES DE CONFIGURACION
    // ===========================
    
 
    
//               <|+++++++++++++++++++++++++++++++++++++++|>                        
//                          VARIABLES DE CLASE
//               <|+++++++++++++++++++++++++++++++++++++++|>                        
    
    _ops = {};
    
    static _predetOps = {
        
        // no vienen de la interfce
        stream          : false,
        // --------------
        
        modo            : COMPRA,
        streamName      : 'bookTicker',        
        port            : 0,
        port2           : 0,
        
        
        // margen = %
        limMargenCompra : 0.5, // % a subri sobre precio min para que se compre
        limMargenPerdida : 0.5, // % bajo el precio de compra para que se venta
        limMargenDescenso : 0.31, // % de desc sobre el precio max
        limMargenVenta : 0.5, // Vender cuando el magen llegue al 0.5%
        
        // % sobre precio compra para que se ective el  indicador de venta
        limMargenActivIndVenta : 1, 

        // porcentaje del indicador de venta con respecto a la diferencia de precio max
        // posicion que ocupa el indicador de venta en la barra 
        porIndVenta : 50,

        // proporcion de acercamiento de indicador de venta el precio actual
        // para ejecucion de orden de venta
        // el acercamiento ocurre cuando se sobrepasa el nivel maximo de descenso
        // con relacion el precio maximo
        propAcercIndVenta : 1,

        // porcentaje de proporcion orden de venta
        // la proporcion sobre el precio actual, que se utilzara para realizar 
        // la orden de venta
        propOV : 0.998,
        // porcentaje propocion orden de compra
        propOC : 1.002,

        cantInicial : 1000,
        porCantVenta : 99.8,
        
        precioActualManual : 0,
        
        // simbolo del par de la izquierda
        symbolPar1 : false,
        // par de la derecha
        symbolPar2 : false,
        
        precioCompra : 0, // precio de compra inicial
        
        tradeMode : VIRTUAL,
        
        
        orderTradeMethod : OTM_GTC,
        takeProfit : false,
        orderMaxExecTime : 600, // segundos
        limCompraCantPar : true,
        limMargenMin : 0.25,
        comision : 0.1,
        
        depurar : false,
        
        backTest : false
        
    }; // preder ops
    
    _propOC = 0;
    _propOV = 0;
    
//               <|+++++++++++++++++++++++++++++++++++++++|>                    
    
    _symbol = false;
    
    // indicador relativo a la posicion del indicador de venta
    // para determinar su posicion en el deslizador
    _indRelPosIndVenta = '';
    
    // indicador base para calcular la posicion del indicador de venta
    _indBasePosIndVenta = '';
    
    _ws = false;
    _wsTrade = false;
    
    // orden en proceso
    _ordenEnProc = false;
    
    _pqtesRecibidos = 0;
    _pqtesProcesados = 0;
    _tAnt = performance.now();
    _tAct = 0;
    
    // tiempo maximo para que se procese la orden de compra/venta
    // luego se cancela
    _recvWindow = 5000;
    
    _apis = {
        'binance' : {
            'order' : {
                'api'   : '/api/v3/order',
                'signed': true
            },
            'order_status' : {
                'api'   : '/api/v3/order',
                'signed': true
            },
            'cancel_order' : {
                'api'   : '/api/v3/order',
                'signed': true
            },
            'exchange_info' : {
                'api'   : '/api/v3/exchangeInfo',
                'signed': false
            },
            'klines_history' : {
                'api'   : '/api/v3/klines',
                'signed': false
            }
        }
    };
    
//               <|+++++++++++++++++++++++++++++++++++++++|>                    
//                  ESPECIFICACIONES DE LOS SIMBOLOS    
//               <|+++++++++++++++++++++++++++++++++++++++|>                        
    
    _parSpecs = false;
    _orderInProcess = false;
    _lastOrderStatus = false;
    _debugOrderStatus = false;
    // tiempo de inicio de ejecucuion de ultima orden
    _orderStartExecTimeStamp = 0;
    
    // trades pausados
    _tradesPaused = false;

//               <|+++++++++++++++++++++++++++++++++++++++|>                    
//                          VELAS, BOLLINGER Y RSI
//               <|+++++++++++++++++++++++++++++++++++++++|>                    
    
    _startRemoteTime = 0;
    _startLocalTime = 0;
    _klines = [];
    _kline = {};
    _klinesLoaded = false;
    // maximo de velas en el array
    _klineArrayMax = 500;
    _vls = false;
    
    // Bollinger
    _bll = false;
    
    // velocidad de variacion
    _vlv = false;
    _timeAnt = 0;
    
    // VERIFICACION DE COMPRA
    
    _busyBuy = false;
    _oCompraOk = {
        'bollinger'     : false,
        'vela'          : false,
        'margen'        : false,
        'tendencia'     : false,
        'precio'        : false,
        'dmi'           : false,
        'apr1'          : false,
        'parabolic_sar' : false,
        'momentum'      : false
    };
    
    _verifOrderTimeout = false;
    
    _adx = false;
    
    _dbgBuffer = {};
    
    _parSAR = false;
    
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                                REGULADORES DE COMPRA Y VENTA
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    // de compra sobre banda media o inferior
    _bllMinL = 0.01;
    // max de compra s/ banda media o inferior
    _bllMaxL = 0.15;

    // de compra sobre banda media o superior
    _bllMinM = 0.01;
    // max de compra s/ banda media o superior
    _bllMaxM = 0.25;           
    
    // limite volatilidad bollinger
    _bllLimLowUp = 0.8;     
    
    _bllDifLowUp = 0;
    _bllDifL = 0;
    _bllDifM = 0;
    _bllDifU = 0;
    
    _bllTocaBandaInf = false;
    _bllTocaBandaMed = false;
    _bllTocaBandaSup = false;
    _bllPasaLimLowUp = false;
    
    _bllTendLateral = false;
    
    _vlsTendUp = false;
    _vlsUp = false;
    _vlsRangoTend = false;
    
    _dataDMI = false;
    _dataSAR = false;
    _dataBLL = false;
    
    _ultPrecioMax = 0;
    _ultPrecioMin = 0;
    
    // momentum
    _mom = false;
    _dataMom = false;
    
    // EMA
    
    _ema9 = {};
    _dataEma9 = {};
    
    _ema50 = {};
    _dataEma50 = {};
    
    _ema200 = {};
    _dataEma200 = {};
    
    _ema25 = {};
    _dataEma25 = {};
    
    _dbgInicio = false;
    
    _compraEma25 = 0;
    _compraEma25Time = false;
    _adx20 = false;

    _ultPrecios = [];
    _precioControlAnt = 0;
    
    _compraAdx20Riesgo = false;
    _compraBajoEma200 = false;
    
    
//               <|+++++++++++++++++++++++++++++++++++++++|>                    
//                          PARA VENTAS
//               <|+++++++++++++++++++++++++++++++++++++++|>                    


    

        
    
    
// -----------------------------------------------------------------------------

    constructor (ops) {
        
        App.initTime('_VAR_TIME', 5000);
        App.initTime('_VOL_TIME', 5000);
        App.initTime('_COMPRA_TIME', 2000);
        App.initTime('_VENTA_TIME', 5000);
        App.initTime('_DEBUG_TIME', 2000);
        
        var ob = this;
        this._ops = Object.assign({}, OvWrk._predetOps, ops);
        
        this._bll = new Bollinger();
        this._vlv = new Velvar();
        this._vls = new Velas();
        this._adx = new Adx();
        this._parSAR = new ParabolicSAR();
        this._mom = new Mom();
        
        this._ema9 = new EMA(9,8);
        this._ema50 = new EMA(50,14);
        this._ema200 = new EMA(200,14);
        this._ema25 = new EMA(25,14);
        
        
        this._symbol = this._ops.symbolPar1 + this._ops.symbolPar2;
        this._ops.stream = [
            this._symbol + '@' + this._ops.streamName,
            this._symbol + '@' + 'kline_1m'
        ];
        
        if ( this._ops.modo == COMPRA ) {
            this._cantInicCompra = this._cantPar2 = parseFloat( this._ops.cantInicial );
        } else if ( this._ops.modo == VENTA ) {
            this._config_precio_compra( this._ops.precioCompra );
        }

        
        if ( this._ops.backTest === true ) {
            
            this._startBackTest();
            
        } else {
        
            // abre y mantiene abierta una conexion para ordenes de compra/venta
            this.startWsTrade().then(() => {
                // abrir la configuracion de symbolos
                // y velas
                ob._loadParSpecs();
            });

            // iniciar el flujo de informaion webSocket
            this.start().then(() => {
                ob._loadKlines();
            });
        
        }
        
        
    }; // construct    
    
    
// -----------------------------------------------------------------------------
    
    /**
     * Establece el precio actual
     * @param {float} bid precio de venta mas alto
     * @param {float} ask precio de compra mas bajo
     * @param {bool} auto
     * @returns {undefined}
     */
    setPrecioActual (bid, ask, auto) {
        
        var precio = 0;
        
        if ( auto === true ) {
            precio = bid;
        } else {
            precio = this._ops.modo == COMPRA ? ask : bid;            
        }
        
        this._precioActual = parseFloat( precio );
        
        this._recalcular();
        
//        this._pqtesProcesados++;
//        this._tAct = performance.now();
//        if ( this._tAct - this._tAnt > 10000 ) {
//            console.dir({
//               recibidos : this._pqtesRecibidos,
//               procesados : this._pqtesProcesados
//            });
//            this._tAnt = this._tAct;
//        }
        
    }; // setData
    
// -----------------------------------------------------------------------------

    _recalcular () {
        
        if ( this._precioActual == 0 ) {
            console.warn('Precio Actual es 0. No se puede recalcular !');
            return;
        }
        
        // si las velas no estan cargadas aun salir
        if ( !this._klinesLoaded ) {
            console.warn('Velas aún no cargadas para recalcular. Esperando ...');
            return;
        }
        
//        var exceso = 0;
//        this._vlv.setPrice( this._precioActual, exceso );
        
//               <|+++++++++++++++++++++++++++++++++++++++|>                    
//                  DEPURACION
        
        var auxDate = new Date( this._bookTickerTime );
        var _b = this._getIndexDateTime(auxDate);

        this._ultPrecioMax = this._vls.getUltPrecioMax();
        this._ultPrecioMin = this._vls.getUltPrecioMin();

        this._dataBLL = this._bll.getData();
        this._bllDifL = (this._precioActual - this._dataBLL.l) / this._dataBLL.l * 100;
        this._bllDifM = (this._precioActual - this._dataBLL.m) / this._dataBLL.m * 100;
        this._bllDifU = (this._precioActual - this._dataBLL.u) / this._dataBLL.u * 100;
        this._bllDifLowUp = (this._dataBLL.u - this._dataBLL.l) / this._dataBLL.l * 100;  

        this._bllTocaBandaInf = this._bllDifL >= this._bllMinL && this._bllDifL <= this._bllMaxL;
        this._bllTocaBandaMed = this._bllDifM >= this._bllMinM && this._bllDifM <= this._bllMaxM;
        this._bllTocaBandaSup = this._bllDifU >= this._bllMinM && this._bllDifU <= this._bllMaxM;
        this._bllPasaLimLowUp = this._bllDifLowUp >= this._bllLimLowUp;  
        this._bllTendLateral = this._dataBLL.ta < 0.2 && !this._bllPasaLimLowUp;

        this._vlsRangoTend = {prim: 0, ult: 0, dif: 0, tend: false};
        this._vlsTendUp = this._vls.getTendencia(this._precioActual, this._vlsRangoTend) == 'u' ? true : false;
        this._vlsUp = this._precioActual > this._kline.o ? true : false;

         this._dataDMI = this._adx.getDMI();
         this._dataSAR = this._parSAR.getData();
         this._dataMom = this._mom.getData();

         this._dataEma9 = this._ema9.getData(this._precioActual);
         this._dataEma50 = this._ema50.getData(this._precioActual);
         this._dataEma200 = this._ema200.getData(this._precioActual);
         this._dataEma25 = this._ema25.getData(this._precioActual);

        if ( this._precioActual >= this._dataEma200.ema && this._dataDMI.adx >= 20.5 ) 
            this._adx20 = true;
        else if ( this._precioActual < this._dataEma200.ema && this._dataEma9.ema < this._dataEma200.ema ) {
            this._adx20 = false;
        }

        this._ultPrecios.push(this._precioActual);
        if ( this._ultPrecios.length > 1 ) this._ultPrecios.shift();
         
        var dif_ema_9_25 = (this._dataEma9.ema - this._dataEma25.ema) / this._dataEma25.ema * 100;
        
        this._ema9_toca_ema25 = dif_ema_9_25 > 0 && dif_ema_9_25 < 0.115;
        this._precioControl = this._precioActual;
        this._difCompraEma25 =this._compraEma25 > 0 ? 
            Math.abs((this._precioActual - this._compraEma25) / this._compraEma25 * 100) : 0;
        
        
        var d = [];
        
        if ( this._dataEma200.short ) d.push('EMA 200 SHORT');
        else if ( this._dataEma200.long ) d.push('EMA 200 LONG');
        else if ( this._dataEma200.lat ) d.push('EMA 200 LAT');
        
        if ( this._dataEma50.short ) d.push('EMA 50 SHORT');
        else if ( this._dataEma50.long ) d.push('EMA 50 LONG');
        else if ( this._dataEma50.lat ) d.push('EMA 50 LAT');
        
        if ( this._dataEma50.ema >= this._dataEma200.ema ) d.push('EMA 50 >= EMA 200');
        if ( this._dataEma50.ema < this._dataEma200.ema ) d.push('EMA 50 < EMA 200');
        
        if ( this._dataEma9.tc == 'l' ) d.push('EMA 9 TC LONG');
        else d.push('EMA 9 TC SHORT');
        
        if ( this._dataEma25.tc == 'l' ) d.push('EMA 25 TC LONG');
        else d.push('EMA 25 TC SHORT');
        d.push( 'VALOR ADX: ' + this._dataDMI.adx );
        d.push( 'VALOR MF: ' + this._dataMom.mf );
        d.push( 'EMA 9 TOCA 25: ' + this._ema9_toca_ema25 );
        d.push( 'ADX 20: ' + this._adx20 );
        
        
        
        var obLog = {
            'A BOOK' : auxDate.toString(),
            'P ACTUAL' : this._precioActual,
            'P APERTURA' : this._kline.o,
            'P COMPRA' : this._precioCompra,
            'P ULT MAX' : this._ultPrecioMax,
            'DIF LOW' : this._bllDifL,
            'DIF MEDIA' : this._bllDifM,
            'DIF LOW UP' : this._bllDifLowUp,
            'TOCA B INF' : this._bllTocaBandaInf,
            'TOCA B MED' : this._bllTocaBandaMed,
            'TOCA B SUP' : this._bllTocaBandaSup,
            'DET TEND.' : this._vlsRangoTend,
            'DET DMI' : this._dataDMI,
            'DET BANDAS' : this._dataBLL,
            'TEND VELAS' : this._vlsTendUp,
            'PAR SAR' : this._dataSAR,
            'PSAR LIM LOW UP' : this._bllPasaLimLowUp,
            'TEND LATERAL' : this._bllTendLateral,
            'MOMENTUM' : this._dataMom.mf,
            'EMA 9' : this._dataEma9,
            'EMA 50' : this._dataEma50,
            'EMA 200' : this._dataEma200,
            'EMA 25' : this._dataEma25,
            'COMP EMA 25' : this._compraEma25,
            'ADX 20' : this._adx20,
            'ULT PRECIOS' : this._ultPrecios,
            'D' : d
        }; 
        
        this._dbgBuffer[_b] = obLog;
        
        if ( this._ops.depurar ) {
            App.showInTime( obLog, '_DEBUG_TIME');        
        }        
        
        if ( this._ops.backTest && !this._dbgInicio ) {
            var dat = new Date( this._klines[0].t ).toString();
            console.log('INICIO: ' + auxDate.toString());
            console.log('PRIMERA VELA: ' + dat);
            this._dbgInicio = true;
        }
        
//               <|+++++++++++++++++++++++++++++++++++++++|>                             
        
        if ( this._ops.modo == VENTA ) {
            this._calc_venta_2();
        } else if ( this._ops.modo == COMPRA ) {
            this._calc_compra();
        }
        
    } // recalcular    
    
// -----------------------------------------------------------------------------

    _calc_compra () {
        
        if ( !this._klines.length ) return;
        
        // precio min
        if ( this._precioActual < this._precioMin || this._precioMin == 0 )
            this._precioMin = this._precioActual;        
        
        this._porIncPrecioActual = (this._precioActual - this._precioMin) / this._precioMin * 100;
        //this._precioCompra = this._kline.o * ( 1 + this._ops.limMargenCompra / 100 );
        //this._precioCompra = this._precioMin * ( 1 + this._ops.limMargenCompra / 100 );        
        
        // ORDEN DE COMPRA
       if ( this.canBuy_alg_5() ) {
            this.__procOC(this._precioCompra);    
       } // si se puede comprar
        
//               <|+++++++++++++++++++++++++++++++++++++++|>                            
        
        // precio max
        if ( this._precioActual > this._precioMax  )
            this._precioMax = this._precioActual;
        
       this._porIncPrecioMax = (this._precioMax - this._precioMin) / this._precioMin * 100;
        
       this._porIncPrecioCompra = (this._precioCompra - this._precioMin) / this._precioMin * 100;
       
    }; // compra

// -----------------------------------------------------------------------------
    
    _calc_venta_2 () {
        
        var rangoRelIndVenta = 0;
        var precioBaseRelIndVenta = 0;
        var tipoVenta = false;
        
        if ( this._precioActual == 0 ) return;
        
        this._porIncPrecioActual = this._precioCompra > 0 ? 
            (this._precioActual - this._precioCompra) / this._precioCompra * 100 : 0;
        
        // precio max
        if ( this._precioActual > this._precioMax  ) {
            this._precioMax = this._precioActual;
        }
        
        this._porIncPrecioMax = this._precioCompra > 0 ? 
            (this._precioMax - this._precioCompra) / this._precioCompra * 100 : 0;
        
        // precio min
        if ( this._precioActual < this._precioMin ) {
            this._precioMin = this._precioActual;
        }
        
        // base precio venta y tope precio max
        this._precioBaseIndVenta = (this._precioCompra * ( 1 + this._ops.limMargenActivIndVenta / 100 ) );
        this._precioTopeIndVenta = this._precioMax * (100 - this._ops.limMargenDescenso) / 100;
        
        // indicador de descenso (no visible)
        this._precioIndDesc = this._precioMax - this._precioActual;
        this._porIndDesc = this._precioIndDesc / this._precioMax * 100;
        
        // precio ind de venta normal - IND VENTA 1
        if ( this._precioActual >= this._precioCompra ) {
            this._precioIndVenta = this._precioCompra + (this._precioActual - this._precioCompra) *
                this._ops.porIndVenta / 100 ;  
            // posicion
            this._indRelPosIndVenta = 'precio';
            this._indBasePosIndVenta = 'compra';
            // rango relativo
            rangoRelIndVenta = this._precioActual - this._precioCompra;
            precioBaseRelIndVenta = this._precioCompra;
        } 
        // PERDIDA
        else {
            this._precioIndVenta = this._precioCompra * ( (100 - this._ops.limMargenPerdida) / 100 );
            // posicion
            this._indRelPosIndVenta = 'compra';
            this._indBasePosIndVenta = 'precio-min';  
            // rango relativo
            rangoRelIndVenta = this._precioIndVenta / this._ops.limMargenPerdida * 100 * -1;
            precioBaseRelIndVenta = 0;
        }

        // DESCENSO ACELERADO DE PRECIO DE VENTA - IND VENTA 2
        if ( this._porIndDesc >= this._ops.limMargenDescenso && this._precioActual >= this._precioCompra ) {
            
            this._difPorIndDesc = this._porIndDesc - this._ops.limMargenDescenso;
            // ajuste para suba de indicador de venta, si precioActual desciende
            this._precioIndVenta = this._precioCompra + (this._precioMax - this._precioCompra) *
            ( (this._ops.porIndVenta * this._ops.propAcercIndVenta ) + this._porIndDesc )/ 100;
            // posicion
            this._indRelPosIndVenta = 'precio';
            this._indBasePosIndVenta = 'compra';      
            // rango relativo
            rangoRelIndVenta = this._precioActual - this._precioCompra;
            precioBaseRelIndVenta = this._precioCompra;
            
        }
       
        // % de incremento del indicador de venta
        this._porIncPrecioIndVenta = (this._precioIndVenta - precioBaseRelIndVenta) / rangoRelIndVenta * 100;
        this._porIncPerdida = (this._precioCompra - this._precioActual) / this._precioCompra * 100;
        

        tipoVenta = this.canSell_alg_2();
        
        if ( tipoVenta !== false ) {
            this.__procOV(this._precioActual, tipoVenta);
        }
        
    }; // calc venta 2

// -----------------------------------------------------------------------------

    _calc_venta () {
        
        var rangoRelIndVenta = 0;
        var precioBaseRelIndVenta = 0;
        
        if ( this._precioActual == 0 ) return;
        
        this._porIncPrecioActual = this._precioCompra > 0 ? 
            (this._precioActual - this._precioCompra) / this._precioCompra * 100 : 0;
        
        // VENTA LIM MARGEN
        if ( this._ops.limMargenVenta > 0 && this._porIncPrecioActual >= this._ops.limMargenVenta ) {
            this.__procOV(this._precioActual, 'M.L.VENTA');
            return;
        }
        
        // precio max
        if ( this._precioActual > this._precioMax  ) {
            this._precioMax = this._precioActual;
        }
        
        this._porIncPrecioMax = this._precioCompra > 0 ? 
            (this._precioMax - this._precioCompra) / this._precioCompra * 100 : 0;
        
        // precio min
        if ( this._precioActual < this._precioMin ) {
            this._precioMin = this._precioActual;
        }
        
        // base precio venta y tope precio max
        this._precioBaseIndVenta = (this._precioCompra * ( 1 + this._ops.limMargenActivIndVenta / 100 ) );
        this._precioTopeIndVenta = this._precioMax * (100 - this._ops.limMargenDescenso) / 100;
        
        // indicador de descenso (no visible)
        this._precioIndDesc = this._precioMax - this._precioActual;
        this._porIndDesc = this._precioIndDesc / this._precioMax * 100;
        
        // precio ind de venta normal - IND VENTA 1
        if ( this._precioActual >= this._precioCompra ) {
            this._precioIndVenta = this._precioCompra + (this._precioActual - this._precioCompra) *
                this._ops.porIndVenta / 100 ;  
            // posicion
            this._indRelPosIndVenta = 'precio';
            this._indBasePosIndVenta = 'compra';
            // rango relativo
            rangoRelIndVenta = this._precioActual - this._precioCompra;
            precioBaseRelIndVenta = this._precioCompra;
        } 
        // PERDIDA
        else {
            this._precioIndVenta = this._precioCompra * ( (100 - this._ops.limMargenPerdida) / 100 );
            // posicion
            this._indRelPosIndVenta = 'compra';
            this._indBasePosIndVenta = 'precio-min';  
            // rango relativo
            rangoRelIndVenta = this._precioIndVenta / this._ops.limMargenPerdida * 100 * -1;
            precioBaseRelIndVenta = 0;
        }

        // DESCENSO ACELERADO DE PRECIO DE VENTA - IND VENTA 2
        if ( this._porIndDesc >= this._ops.limMargenDescenso && this._precioActual >= this._precioCompra ) {
            
            this._difPorIndDesc = this._porIndDesc - this._ops.limMargenDescenso;
            // ajuste para suba de indicador de venta, si precioActual desciende
            this._precioIndVenta = this._precioCompra + (this._precioMax - this._precioCompra) *
            ( (this._ops.porIndVenta * this._ops.propAcercIndVenta ) + this._porIndDesc )/ 100;
            // posicion
            this._indRelPosIndVenta = 'precio';
            this._indBasePosIndVenta = 'compra';      
            // rango relativo
            rangoRelIndVenta = this._precioActual - this._precioCompra;
            precioBaseRelIndVenta = this._precioCompra;
            
        }
       
        // % de incremento del indicador de venta
        this._porIncPrecioIndVenta = (this._precioIndVenta - precioBaseRelIndVenta) / rangoRelIndVenta * 100;
        this._porIncPerdida = (this._precioCompra - this._precioActual) / this._precioCompra * 100;
        
        // orden venta por contacto entre el precio actual y el indicador de precio venta
        // para venta sobre el costo
        if ( this._porIndDesc >= this._ops.limMargenDescenso && 
             this._precioIndVenta >= this._precioActual &&
             this._precioActual > this._precioCompra ) {
            this.__procOV(this._precioActual, 'M.P.DESC');
        } else if ( this._porIncPerdida >= this._ops.limMargenPerdida  ) {
            this.__procOV(this._precioActual, 'PERDIDA');
        }        
        
    }; // venta
    
// -----------------------------------------------------------------------------

    setModo (modo) {
        
        this._ops.modo = modo;
        
        if ( this._ops.modo == COMPRA ) {
            this._precioMin = this._precioActual;
        } else if ( this._ops.modo == VENTA ) {
            this._precioMax = this._precioActual;
        }
        
    }; // setModo    

// -----------------------------------------------------------------------------

    __procOV (precioActual, tipo) {
        
        if ( this._orderInProcess === true || this._tradesPaused ) return;
        
        this._orderInProcess = true;

        console.log('GENERANDO ORDEN DE VENTA ' + this._ops.tradeMode.toUpperCase() );
        console.dir(this.getData());
        
        var precio = parseFloat( precioActual * this._propOV );
        var now = Date.now();
        var cant = this._cantPar1 * this._ops.porCantVenta / 100;        
        
        console.dir({
            'precio actual' : precioActual,
            'cant par 1' : this._cantPar1,
            'cant par 2' : this._cantPar2,
            'precio' : precio,
            'cant' : cant
        });
        
        var filData = this._filter_order(cant, precio);
        
        this._datosUltVenta = {
            'idCompra' : this._datosUltCompra.fechaCompra,
            'moneda' : this._ops.symbolPar1,
            'precioCompra' : this._datosUltCompra.precioCompra,
            'precioVenta' : filData.precio,
            'precioMargen' : filData.precio - this._datosUltCompra.precioCompra,
            'tipoVenta' : tipo,
            'fechaCompra' : this._datosUltCompra.fechaCompra,
            'fechaVenta' : this._bookTickerTime,
            'fechaDif' : this._bookTickerTime - this._datosUltCompra.fechaCompra,
            'porIncCompra' : this._datosUltCompra.porIncCompra,
            'porIncVenta' : this._porIncPrecioActual,
            'porTotalMargen' : (this._datosUltCompra.cantCompra * filData.precio - this._datosUltCompra.totalCompra) / this._datosUltCompra.totalCompra * 100,
            'totalMargen' : this._datosUltCompra.cantCompra * filData.precio - this._datosUltCompra.totalCompra,
            'porDescenso' : this._porIndDesc,
            'cantCompra' : this._datosUltCompra.cantCompra,
            'cantVenta' : filData.cant,
            'totalCompra' : this._datosUltCompra.totalCompra,
            'totalVenta' : filData.cant * filData.precio
        };        
        
        if ( this._ops.tradeMode == REAL ) {
        
            var order = {
                'symbol'            : String.prototype.toUpperCase.call(this._symbol),
                'side'              : OP_VENTA,
                'type'              : 'LIMIT',
                'quantity'          : filData.cant,
                'price'             : filData.precio,
                'newOrderRespType'  : 'FULL',
                'recvWindow'        : this._recvWindow,
                'timestamp'         : Date.now(),
                'timeInForce'       : this._ops.orderTradeMethod
            };
            
            console.log('SELL ORDER PARAMS');
            console.dir(order);
            
            this._tradeOrder(order);
        
        } else if ( this._ops.tradeMode == VIRTUAL ) {
            
            var upData = {
                executedQty : filData.cant,
                cummulativeQuoteQty : filData.cant * filData.precio,
                side : OP_VENTA
            };
            
            this.__update_qty_pars(upData);
            
            console.dir({
                'precio actual' : precioActual,
                'cant par 1' : this._cantPar1,
                'cant par 2' : this._cantPar2,
                'precio' : precio,
                'cant' : cant,
                'updata' : upData
            });                  
            
            this.__update_finalized_order_status();
            
        }        
        
//        OvWrk.sendBrowser( VENTA, this._datosUltVenta );
//        //console.log('WORKER VENTA: Tipo: '+tipo+' - A: ' + precio );        
//        
//        this.setModo(COMPRA);
        
    }; // proc OV
    
// -----------------------------------------------------------------------------

    __procOC (precioActual) {
        
        if ( this._orderInProcess === true || this._tradesPaused ) return;
        this._orderInProcess = true;
        
        console.log('GENERANDO ORDEN DE COMPRA ' + this._ops.tradeMode.toUpperCase() );
        
        // verifica si se extrae la utilidad
        if ( this._ops.takeProfit && this._cantInicCompra > 0 && this._cantPar2 > this._cantInicCompra ) {
            this._profitTaked += parseFloat( this._cantPar2 - this._cantInicCompra );
            this._cantPar2 = this._cantInicCompra;
        }
        
        var ob = this;
        var precio = parseFloat( precioActual * this._propOC );
        var now = Date.now();
        var cant = this._cantPar2 / precio;
        
        var filData = this._filter_order(cant, precio);
        
        this._datosUltCompra = {
            'idCompra' : this._bookTickerTime,
            'moneda' : this._ops.symbolPar1,
            'precioCompra' : filData.precio,
            'precioVenta' : 0,
            'precioMargen' : 0,
            'tipoVenta' : null,
            'fechaCompra' : this._bookTickerTime,
            'fechaVenta' : null,
            'fechaDif' : null,
            'porIncCompra' : this._porIncPrecioCompra,
            'porIncVenta' : 0,
            'porTotalMargen' : 0, // sobre los totales (precio * cant)
            'totalMargen' : 0,
            'porDescenso' : 0,
            'cantCompra' : filData.cant,
            'cantVenta' : 0,
            'totalCompra' : filData.cant * filData.precio,
            'totalVenta' : 0
        };
        
        if ( this._ops.tradeMode == REAL ) {
        
            var order = {
                'symbol'            : String.prototype.toUpperCase.call(this._symbol),
                'side'              : OP_COMPRA,
                'type'              : 'LIMIT',
                'quantity'          : filData.cant,
                'price'             : filData.precio,
                'newOrderRespType'  : 'FULL',
                'recvWindow'        : this._recvWindow,
                'timestamp'         : Date.now(),
                'timeInForce'       : this._ops.orderTradeMethod
            };
            
            console.log('BUY ORDER PARAMS');
            console.dir(order);
            
            this._tradeOrder(order);
        
        } else if ( this._ops.tradeMode == VIRTUAL ) {
            
            var upData = {
                executedQty : filData.cant,
                cummulativeQuoteQty : filData.cant * filData.precio,
                side : OP_COMPRA
            };
            
            this.__update_qty_pars(upData);
            
            console.dir({
                'precio actual' : precioActual,
                'cant par 1' : this._cantPar1,
                'cant par 2' : this._cantPar2,
                'precio' : precio,
                'fil precio' : filData.precio,
                'cant' : cant,
                'updata' : upData
            });                  
            
            this.__update_finalized_order_status();
            
        }
        

        
    }; // proc OC
    
// -----------------------------------------------------------------------------
    
    start () {
        
        var ob = this;
        
        return new Promise( (resolve, reject) => {
           
            ob._ws = new WebSocket('ws://127.0.0.1:'+ob._ops.port+'/binancehttp');
            var idx = 0;
            var resolved = false;

            ob._ws.onerror = function (error) {
                console.warn('WS WORKER ERROR : ');
                console.dir(error);
                reject();
            };  

            ob._ws.onmessage = function (msg) {

                var payload = JSON.parse(msg.data); 

                // stream precio cryptos
                if ( payload.stream == ob._ops.stream[0] ) {

                    
                    ob.setPrecioActual(payload.data.b, payload.data.a);    
                    
                // stream klines
                } else if ( payload.stream == ob._ops.stream[1] ) {

                    idx = ob._klines.length - 1;
                    
                    ob._bookTickerTime = payload.data.E;
                    
                    // misma vela - actualizar
                    if ( idx > 0 && ob._klines[idx].t == payload.data.k.t ) {
                        
                        ob._klines[idx] = payload.data.k;
                        
                    } else { // nueva vela - agregar
                        
                        // cerrar si no se copio en el intervalo de cierre
                        if ( typeof ob._klines[idx] != 'undefined' && 
                             ob._klines[idx].x == false ) ob._klines[idx].x = true;
                        
                        ob._klines.push( payload.data.k );
                        if ( ob._klineArrayMax > 0 && ob._klines.length > ob._klineArrayMax ) ob._klines.shift();
                        
                        ob._parSAR.setData( ob._klines );
                        
                        ob._ema9.setData( ob._klines );
                        ob._ema50.setData( ob._klines );
                        ob._ema200.setData( ob._klines );                        
                        ob._ema25.setData( ob._klines );                        
                        
//                        console.log('PARABOLIC SAR');
//                        console.dir( ob._parSAR.getData() );
                        
//                        ob._adx.setData( ob._klines );
//                        console.log('1M ADX');
//                        console.dir( ob._adx.getData() );
                        
                    }
                    
                    ob._kline = payload.data.k;
                    
                    // cargar objetos
                    ob._vls.setData( ob._klines, ob._precioActual );     
                    ob._bll.setData( ob._klines );
                    ob._adx.setData( ob._klines );
                    ob._mom.setData( ob._klines, ob._precioActual );
                    
                    if ( !resolved ) {
                        resolve();
                        resolved = true;
                    }   
                    
//                    App.showInTime({
//                        'CANT COMPRAS' : payload.data.k.v,
//                        'CANT VENTAS' : payload.data.k.V
//                    }, '_VOL_TIME');

                } // VELAS
                


            }; // on message

            ob._ws.onopen = function (error) {
                
                if ( ob._ops.backTest === true ) {
                    ob._ws.sendBasic(false, 'stopOnOpenKlines', 'ws-backtest');    
                } else {
                    ob._ws.subscribe(false,ob._ops.stream);
                }
                
            }; // onOpen                 
            
        });
        
     

    }; // iniciar   
    
// -----------------------------------------------------------------------------
    
    startWsTrade () {
        
        //console.dir(this._ops);
        
        var ob = this;
        
        return new Promise( (resolve, reject) => {

            ob._wsTrade = new WebSocket('ws://127.0.0.1:'+ob._ops.port2+'/binancehttp');

            ob._wsTrade.onerror = function (error) {
                console.warn('WS WORKER ERROR : ');
                console.dir(error);
                reject();
            };  

            ob._wsTrade.onmessage = function (msg) {

                var payload = JSON.parse(msg.data); 
                
                try {
                    
//                    console.log('PAYLOAD');
//                    console.dir(payload);
                    
                    if ( payload.data.code && payload.data.code != 200 ) {
                        console.log('WS TRADE REPLY ERROR');
                        console.dir(payload);
                        throw new Ex(payload.data.body.code, payload.data.body.msg);
                    }
                    
                    switch ( payload.data.areaUrl ) {

                        case ob._apis.binance.order.api:
                        case ob._apis.binance.order_status.api:
                            ob._resultTradeOrder(payload.data);
                            break;

                        case ob._apis.binance.exchange_info.api:
                            ob._loadParSpecs(payload.data);
                            break;

                        case ob._apis.binance.klines_history.api:
                            ob._loadKlines(payload.data);
                            break;


                    } // switch area url                    
                    
                } catch ( ex ) {
                    console.error( ex instanceof Ex ? ex.getCode()+' - '+ex.getMessage() : ex );
                }
                


                //console.dir(payload);

            }; // on message

            ob._wsTrade.onopen = function (error) {
                resolve();
            };              
            
            
        }); // promise
        
    } // iniciar   
    
// -----------------------------------------------------------------------------
    
    /**
     * Genera una orden de compra o venta en spot
     * @param {Object} data dato a enviar al servidor
     * @returns {undefined}
     */
    _tradeOrder (data) {
        this._orderStartExecTimeStamp = Date.now();
        this._wsTrade.sendBasic(this._apis.binance.order.api, data, undefined, this._apis.binance.order.signed, 'POST');
    }; // trader order
    
// -----------------------------------------------------------------------------

    /**
     * recibe los estado de la orden desde el servidor y tomas las acciones
     * necesarias de acuerdo al estado de las mismas
     * @param {type} data
     * @returns {undefined}
     */
    _resultTradeOrder (data) {
        
//        console.info('RESPUESTA RESULT TRADE ORDER');
//        console.dir(data);     
        
        if ( this._orderInProcess === false ) return;
        
        this._lastOrderStatus = data.body;
        var timeStamp = Date.now();
        
        // si el tiempo de la orden ha superado el maximo
        if ( timeStamp - this._orderStartExecTimeStamp >= this._ops.orderMaxExecTime * 1000
             && this._debugOrderStatus != OE_CANCELANDO ) {
            this._cancel_order();
        }
        
        console.log('UPDATING STATUS: ' + data.body.status);
        
        switch ( data.body.status ) {
            
            case 'NEW':
                this._debugOrderStatus = OE_EJECUTANDO;
                this.__reverify_order_status();
                break;
            case 'PARTIALLY_FILLED':
                // reverificar status
                this._debugOrderStatus = OE_EJECUCION_PARCIAL;
                this.__reverify_order_status();
                break;
            case 'FILLED':
                this._debugOrderStatus = OE_COMPLETO;
                this.__update_qty_pars( this._lastOrderStatus );
                this.__update_finalized_order_status();
                this._orderInProcess = false;
                break;
            case 'CANCELED':
                this._debugOrderStatus = OE_CANCELADO;
                console.dir(this._lastOrderStatus);
                this.__update_qty_pars( this._lastOrderStatus );
                this.__update_finalized_order_status();
                OvWrk.sendBrowser( 'pause', false );                
                this._orderInProcess = false;
                break;
            case 'PENDING_CANCEL':
                this._debugOrderStatus = OE_CANCELANDO;
                this.__reverify_order_status();
                break;
            case 'REJECTED':
                this._debugOrderStatus = OE_RECHAZADO;
                this._orderInProcess = false;
                break;
            case 'EXPIRED':
                this._debugOrderStatus = OE_EXPIRADO;
                this._orderInProcess = false;
                break;
            default:
                this._debugOrderStatus = OE_ERROR;
                console.warn('ERROR RESULT TRADE STATUS. DETENIENDO BOT ...');
                console.dir(this._lastOrderStatus);
                OvWrk.sendBrowser('stop', false);
        } // switch
        
        
        
    }; // result trade order
    
// -----------------------------------------------------------------------------

    __reverify_order_status () {
        
        var ob = this;
        
        var orderData = {
            'symbol' : this._lastOrderStatus.symbol,
            'orderId' : this._lastOrderStatus.orderId,
            'origClientOrderId' : this._lastOrderStatus.clientOrderId,
            'recvWindow' : this._recvWindow,
            'timestamp' : Date.now()
        };
        
        console.log('VERIFICANDO ORDEN');
        console.dir(orderData);
        console.dir(this._lastOrderStatus);
        
        this._verifOrderTimeout = setTimeout(() => {
            ob._wsTrade.sendBasic(ob._apis.binance.order_status.api, orderData, undefined, ob._apis.binance.order.signed);            
        }, 2000);
        
        
        
    }; // reverify order status
    
// -----------------------------------------------------------------------------
    
    /**
     * actualiza las cantidades compradas o vendidas para la prox compra/venta
     * @param {type} data
     * @returns {undefined}
     */
    __update_qty_pars (data) {
        
        var cant = parseFloat( data.executedQty );
        var importe = parseFloat( data.cummulativeQuoteQty );
        var com = parseFloat( this._ops.comision );
        
        if ( data.side == OP_COMPRA ) {
            
            cant -= cant * com / 100;
            
            this._cantPar1 += cant;
            this._cantPar2 -= importe;
            this._datosUltCompra.cantCompra = cant;
            this._datosUltCompra.totalCompra = importe;
            
        } else if ( data.side == OP_VENTA ) {
            
            importe -= importe * com / 100;
            
            this._cantPar1 -= cant; 
            this._cantPar2 += importe;
            this._datosUltVenta.cantVenta = cant;
            this._datosUltVenta.totalVenta = importe;            
            
        }
        
        
    }; // update pars
    
// -----------------------------------------------------------------------------
    
    /**
     * Envia a la interface la informacion de la orden finalizada como
     * exitosa
     * @returns {undefined}
     */
    __update_finalized_order_status () {
        
        if ( this._ops.modo == COMPRA ) {

            if ( this._datosUltCompra.cantCompra == 0 ) return;

            OvWrk.sendBrowser( COMPRA, this._datosUltCompra );

            this._precioCompra = this._datosUltCompra.precioCompra;
            this.setModo(VENTA);   
            
            this._vls.restartPrecioMax();
            
        } else if ( this._ops.modo == VENTA ) {

            if ( this._datosUltVenta.cantVenta == 0 ) return;

            OvWrk.sendBrowser( VENTA, this._datosUltVenta );

            this._precioVenta = this._datosUltVenta.precioVenta;
            this.setModo(COMPRA);                                
            
            this._vls.restartPrecioMin();
            
        }
        
        this._orderInProcess = false;
        
    };
    
    
// -----------------------------------------------------------------------------

    _loadParSpecs (data) {
        
        if ( typeof data != 'undefined' ) {
            
            // server time
            this._startRemoteTime = data.body.serverTime;
            this._startLocalTime = Date.now();
            
            var symbol = String.prototype.toUpperCase.call( this._ops.symbolPar1 + this._ops.symbolPar2  );
            var symbols = data.body.symbols;
            
            for ( var i in symbols ) {
                if ( symbols[i].symbol == symbol ) {
                    this._parSpecs = symbols[i];
                }
            }
            
        } else {
            //console.log('load specs');
            this._wsTrade.sendBasic(this._apis.binance.exchange_info.api);    
        }
        
        
        
    }; // load pair specs
    
// -----------------------------------------------------------------------------

    _loadKlines ( data ) {
        
        if ( typeof data != 'undefined' ) {
            
            var tmp = [];
            var idx = 0;
            var idxK = 0;
            var auxMax = this._klineArrayMax;
            this._klineArrayMax = 0;
            
            // convertir formato a los klines nuevos
            var aTmp = [
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
            
//            var buffer = 'OPEN;HIGH;LOW;CLOSE;TIME;CLOSED;\n';
//            var buffer2 = '';
            
            // generar el array para sincronizar
            data.body.forEach(function (e,i,a) {
                
//                buffer += e[1]+';'+e[2]+';'+e[3]+';'+e[4]+';'+e[0]+';true;\n';
//                buffer2 += '{t:'+e[0]+',o:'+e[1]+',h:'+e[2]+',l:'+e[3]+',c:'+e[4]+',x:true},\n';
                
                var row = {};
                
                aTmp.forEach(function (e1,i1,a1) {
                    row[e1] = e[i1];
                });
                row['x'] = true;
                
                tmp.push( row );
                
            });
            
//            console.log(buffer);
//            console.log(buffer2);
            
            // // sincronizar con el array de subscripcion
            
            idx = tmp.length - 1;
            
            this._klines.every(function (e,i,a) {
                
                if ( tmp[idx].t == e.t ) {
                    idxK = i;
                    return false;
                }
                return true;
                
            });
            
            for ( var i = idxK; i < this._klines.length; i++ ) {
                if ( tmp[idx].t == this._klines[i].t )
                    tmp[idx] = this._klines[i];
                else tmp.push( this._klines[i] );
            }
            
            this._klines = tmp;
            
            
            // verificar diferencias
            var eAnt = false;
            var lenK = this._klines.length;
            
            for ( var i = lenK - 5; i < lenK; i++ ) {
                if ( !eAnt ) eAnt = this._klines[i].t;
                else {
                    if ( this._klines[i].t - eAnt != 60000 ) {
                        console.error('ERROR DE TIEMPO EN ARRAY DE VELAS');
                        console.dir(this._klines[i]);
                        console.dir(eAnt);
                        return false;
                    } else eAnt = this._klines[i].t;
                }
            };
            
            this._klineArrayMax = auxMax;
            
            // cargar objetos
            this._bll.setData(this._klines);
            this._vls.setData(this._klines, this._precioActual);
            
            this._adx.setData(this._klines);
            this._parSAR.setData(this._klines);
            this._mom.setData(this._klines, this._precioActual);
            
            this._ema9.setData(this._klines);
            this._ema50.setData(this._klines);
            this._ema200.setData(this._klines);
            this._ema25.setData(this._klines);
            
            
            
            this._klinesLoaded = true;
            console.log('-- VELAS CARGADAS --');
            
            if ( this._ops.backTest == true ) 
                this._ws.sendBasic(false, false, 'ws-backtest');        
            
            console.log('-- INICIO EXITOSO --');
            
        } else {
            
            data = {
                symbol: String.prototype.toUpperCase.call( this._symbol ),
                interval: '1m',
                startTime: this._startRemoteTime - ( this._klineArrayMax * 60 * 1000 )
            };
            
            this._wsTrade.sendBasic(this._apis.binance.klines_history.api, data);    
        }        
        
    }; // load klines
    
// -----------------------------------------------------------------------------
    
    _filter_order (cant, precio) {
        
        
        try {
            
            // primero redondear el precio y cantidad
            precio = this._round( precio, this._parSpecs.quoteAssetPrecision );
            cant = this._round( cant, this._parSpecs.baseAssetPrecision );
            
//            console.log('PRECIO ANTES');
//            console.dir({
//               'precio' : precio, 
//               'cant' : cant, 
//            });

            
            this._parSpecs.filters.forEach(function (e,i,a) {

                switch ( e.filterType ) {

                    case 'PRICE_FILTER':
                        
//                        console.dir(e);
                        
                        var mP = parseFloat(e.minPrice);
                        var xP = parseFloat(e.maxPrice);
                        var tS = parseFloat(e.tickSize);
                        var rs = (precio - mP) % tS;
                        
                        if ( precio < mP ) throw new Ex('001', ERR_001);
                        else if ( precio > xP ) throw new Ex('002', ERR_002);
                        else if ( rs > 0 ) precio -= rs;
                        
//                        console.log('precio rs: ' + rs);
                        
                        break;
                        
                    case 'LOT_SIZE':
                        
                        var mC = parseFloat(e.minQty);
                        var xC = parseFloat(e.maxQty);
                        var tS = parseFloat(e.stepSize);
                        var rs = (cant - mC) % tS;
                        
                        if ( cant < mC ) throw new Ex('003', ERR_003);
                        else if ( cant > xC ) throw new Ex('004', ERR_004);
                        else if ( rs > 0 ) cant -= rs;
                        
//                        console.log('cant rs: ' + rs);
                        
                        break;

                } // switch

            }); // each filter
            
//            console.log('PRECIO DESPUES');
//            console.dir({
//               'precio' : precio, 
//               'cant' : cant, 
//            });            
            
            return {
              cant: cant,
              precio: precio
            };
            
        } catch ( ex ) {
            console.error( ex instanceof Ex ? ex.getMessage() : ex );
            console.dir({
              cant: cant,
              precio: precio
            });
        } 

        
    }; // filter order

// -----------------------------------------------------------------------------

    stop () {
        if ( this._ws ) this._ws.close();
        if ( this._wsTrade ) this._wsTrade.close();
    }; // stop
    
// -----------------------------------------------------------------------------

    pause () {
        this._tradesPaused = true;
        OvWrk.sendBrowser('pause', false);
    }
    
// -----------------------------------------------------------------------------

    resume () {
        this._tradesPaused = false;
        OvWrk.sendBrowser('resume', false);
    }
    
// -----------------------------------------------------------------------------

    getData () {
        
        var data = {};
        for ( var i in this ) {
            if ( this.hasOwnProperty(i) && /^(_precio|_dif|_por|_ind|_debug|_cantPar|_profit)/.test(i) )
                data[i] = this[i];
        }
        
        return data;
        
    } // get data
    
// -----------------------------------------------------------------------------

    setData (data) {
        for ( var i in data ) {
            this[i] = data[i];
        }
        this._recalcular();
    }
    
// -----------------------------------------------------------------------------

    setOptions (data) {
        
//        console.log('UPDATE WORKER OPS');
//        console.dir(data);
        
        for ( var i in data ) {
            
            this._ops[i] = data[i];
            
            if ( i == 'modo' ) this.setModo(this._ops[i]);
            else if ( i == 'precioActualManual' && this._ops[i] > 0 )
                this._precioActual = parseFloat( this._ops[i] );
            else if ( i == 'precioCompra' && this._ops[i] > 0 )
                this._config_precio_compra( this._ops[i] );
            
        } // each data
        
        this._recalcular();
    }
    
// -----------------------------------------------------------------------------

    getOptions () {
        return this._ops;
    }

// -----------------------------------------------------------------------------

    _round (numero, decimales) {
        try {
            if ( !isNaN(numero) ) return parseFloat( numero.toFixed(decimales) );
            else return numero;            
        } catch (err) {
            return numero;
        }

    }; 
    
// -----------------------------------------------------------------------------
    
    _cancel_order () {
        
        var orderData = {
            'symbol' : this._lastOrderStatus.symbol,
            'orderId' : this._lastOrderStatus.orderId,
            'origClientOrderId' : this._lastOrderStatus.clientOrderId,
            'recvWindow' : this._recvWindow,
            'timestamp' : Date.now()
        };
        
        this._debugOrderStatus = OE_CANCELANDO;
        
        this._wsTrade.sendBasic(this._apis.binance.cancel_order.api, orderData, undefined, this._apis.binance.order.signed, 'DELETE');
        
    }; // cancel orden
    
// -----------------------------------------------------------------------------

    static sendBrowser (action, data) {
        postMessage({
            'action' : action,
            'data' : data
        });          
    }; // postMss
    
// -----------------------------------------------------------------------------
    
    /**
     * @deprecated 
     */
    canBuy_alg_3 () {
        
        if ( this._orderInProcess === true ) return;
        
        var auxDate = new Date();
        var _b = this._getIndexDateTime(auxDate);
        
        var dbgCompra = {};
        var condCompra = ['tendencia', 'dmi', 'parabolic_sar', 'momentum'];
        condCompra.forEach((e,i,a) => {
            this._oCompraOk[e] = false;
            dbgCompra[e] = false;
        }, this);                
        
        if ( this._ultPrecioMax == false ) return false;  
        
        if ( this._dataBLL.ta < 0.3 ) this._propOC = 1.0001;
        else this._propOC = this._ops.propOC;
        
        // TENDENCIA
        // ============
        
        // tendencia subiendo y lateralizacion
        if ( this._bllTendLateral ) {
            dbgCompra.tendencia = 'REGLA 1 (LATERALIZACION)';
            this._oCompraOk.tendencia = true;
        } 
        // bajada y curva que dobla para subir
        else if ( this._dataBLL.t < -0.1 ) {
            dbgCompra.tendencia = 'REGLA 2 ( TERM TEND BAJISTA )';
            this._oCompraOk.tendencia = true;            
        } 
        // tendencia alcista que no sea fin de dicha tendencia
        else if ( this._dataBLL.t >= -0.1  ) {
            dbgCompra.tendencia = 'REGLA 3 ( CAMBIO A TEND ALCISTA )';
            this._oCompraOk.tendencia = true;                        
        }
        

        // DMI
        // =========
        
        // +DI sobre -DI
        if ( this._dataDMI.dip >= this._dataDMI.dim && this._dataDMI.absDifDI < 15 ) {
            dbgCompra.dmi = 'REGLA 1 ( +DI >= -DI )';
            this._oCompraOk.dmi = true;                                                
        } else if ( this._dataDMI.absDifDI < 15 ) {
            dbgCompra.dmi = 'REGLA 2 ( dif DI < 15 )';
            this._oCompraOk.dmi = true;                      
        } else if ( this._bllTendLateral && this._bllTocaBandaInf ) {
            dbgCompra.dmi = 'REGLA 3 ( Tend Lateral )';
            this._oCompraOk.dmi = true;                      
        }
        
        // PARABOLIC SAR
        // ==============
        
        // +DI sobre -DI
        if ( this._dataSAR.tend == 'l' && this._dataSAR.contTend <= 4 ) {
            dbgCompra.parabolic_sar = 'REGLA 1 ( LONG VELA <= 4 )';
            this._oCompraOk.parabolic_sar = true;                                                
        } else if ( this._bllTendLateral && this._bllTocaBandaInf ) {
            dbgCompra.parabolic_sar = 'REGLA 2 ( Tend Lateral )';
            this._oCompraOk.parabolic_sar = true;                      
        }
        
        // MOMENTUM
        // ==========
        
        if ( this._dataMom.mf > 0 ) {
            dbgCompra.momentum = 'REGLA 1 ( MOMENTUM > 0 )';
            this._oCompraOk.momentum = true;                                                
        } else if ( this._bllTendLateral && this._bllTocaBandaInf ) {
            dbgCompra.momentum = 'REGLA 2 ( Tend Lateral )';
            this._oCompraOk.momentum = true;                      
        }
        
        
//               <|+++++++++++++++++++++++++++++++++++++++|>                            
        
        // DEBUG
        var muestraCond = {};
        condCompra.forEach((e,i,a) => {
            muestraCond[e] = this._oCompraOk[e];
        }, this);
        
        var obLog = Object.assign( {
                'A BOOK' : (new Date( this._bookTickerTime )).toString(),
                'P ACTUAL' : this._precioActual,
                'P APERTURA' : this._kline.o,
                'P COMPRA' : this._precioCompra,
                'P ULT MAX' : this._ultPrecioMax,
                'DIF LOW' : this._bllDifL,
                'DIF MEDIA' : this._bllDifM,
                'DIF LOW UP' : this._bllDifLowUp,
                'TOCA B INF' : this._bllTocaBandaInf,
                'TOCA B MED' : this._bllTocaBandaMed,
                'TOCA B SUP' : this._bllTocaBandaSup,
                'DET TEND.' : this._vlsRangoTend,
                'DET DMI' : this._dataDMI,
                'DET BANDAS' : this._dataBLL,
                'TEND VELAS' : this._vlsTendUp,
                'PAR SAR' : this._dataSAR,
                'PSAR LIM LOW UP' : this._bllPasaLimLowUp,
                'TEND LATERAL' : this._bllTendLateral,
                'MOMENTUM' : this._dataMom,
                'EMA 9' : this._dataEma9,
                'EMA 50' : this._dataEma50,
                'EMA 200' : this._dataEma200
            }, dbgCompra);
            
        this._dbgBuffer[_b] = Object.assign({}, obLog);
        
        if ( this._ops.depurar ) {
            App.showInTime( obLog, '_COMPRA_TIME');        
        }
        
        var resEver = condCompra.every((e,i,a) => {
            if ( this._oCompraOk[e] == false )
                return false;
            return true;
        }, this);
        

        
//        else if ( resEver ) {
//            
//            
//        
//            console.warn('ORDEN DE COMPRA 1');
//            console.dir(obLog);
//
//            return true;        
//        
//        }
        
        
        
    }; // can buy alg 2
    
// -----------------------------------------------------------------------------
    /**
     * 
     * @deprecated 
     */
    canBuy_alg_4 () {
        
        if ( this._orderInProcess === true ) return;
        
        var auxDate = new Date();
        var _b = this._getIndexDateTime(auxDate);
        
        if ( this._ultPrecioMax == false ) return false;  
        
        if ( this._dataBLL.ta < 0.3 ) this._propOC = 1.0001;
        else this._propOC = this._ops.propOC;
        
        var resEver = false;
        var difAcerc = 30;
        
        var dif50 = (this._dataEma50.ema - this._dataEma9.min) * difAcerc / 100;
        var dif200 = (this._dataEma200.ema - this._dataEma9.min) * difAcerc / 100;
        var regla = '';
        
        if ( 
            this._dataEma50.ema < this._dataEma200.ema &&
            this._dataEma9.ema < this._dataEma50.ema &&
            this._dataEma9.ult > this._dataEma9.min &&
            this._precioActual >= this._dataEma9.min + dif50 ) 
        {
            regla = 'REGLA 1';
            resEver = true;
        } 
        else if ( 
            this._dataEma50.ema >= this._dataEma200.ema &&
            this._dataEma9.ema < this._dataEma200.ema &&
            this._dataEma9.ult > this._dataEma9.min &&
            this._precioActuala >= this._dataEma9.min + dif200 ) 
        {
            regla = 'REGLA 2';
            resEver = true;
        }
        else if ( 
            this._dataEma50.ema >= this._dataEma200.ema &&
            this._dataEma50.ema >= this._dataEma9.ema &&
            this._dataEma9.ema >= this._dataEma200.ema &&
            this._dataEma9.ult > this._dataEma9.min &&
            this._precioActual >= this._dataEma9.min + dif50 ) 
        {
            regla = 'REGLA 3';
            resEver = true;
        }
        
        
//               <|+++++++++++++++++++++++++++++++++++++++|>                            
        
        var obLog = Object.assign( {
                'A BOOK' : (new Date( this._bookTickerTime )).toString(),
                'P ACTUAL' : this._precioActual,
                'P APERTURA' : this._kline.o,
                'P COMPRA' : this._precioCompra,
                'P ULT MAX' : this._ultPrecioMax,
                'DIF LOW' : this._bllDifL,
                'DIF MEDIA' : this._bllDifM,
                'DIF LOW UP' : this._bllDifLowUp,
                'TOCA B INF' : this._bllTocaBandaInf,
                'TOCA B MED' : this._bllTocaBandaMed,
                'TOCA B SUP' : this._bllTocaBandaSup,
                'DET TEND.' : this._vlsRangoTend,
                'DET DMI' : this._dataDMI,
                'DET BANDAS' : this._dataBLL,
                'TEND VELAS' : this._vlsTendUp,
                'PAR SAR' : this._dataSAR,
                'PSAR LIM LOW UP' : this._bllPasaLimLowUp,
                'TEND LATERAL' : this._bllTendLateral,
                'MOMENTUM' : this._dataMom,
                'EMA 9' : this._dataEma9,
                'EMA 50' : this._dataEma50,
                'EMA 200' : this._dataEma200,
                'REGLA' : regla
            },{});
            
        this._dbgBuffer[_b] = Object.assign({}, obLog);
        
        if ( this._ops.depurar ) {
            App.showInTime( obLog, '_COMPRA_TIME');        
        }
        
        if ( resEver ) {
            
            console.warn('ORDEN DE COMPRA 1');
            console.dir(obLog);

            return true;        
        
        }        
        
        return resEver;
        
    }; // can buy alg 2
    
// -----------------------------------------------------------------------------

    canBuy_alg_5 () {
        
        if ( this._orderInProcess === true ) return;
        
        var auxDate = new Date( this._bookTickerTime );
        var _b = this._getIndexDateTime(auxDate);
        
        if ( this._ultPrecioMax == false ) return false;  
        
        if ( this._dataBLL.ta < 0.3 ) this._propOC = 1.0001;
        else this._propOC = this._ops.propOC;
        
        var resEver = false;
        var regla = '';
        
        // EMA 200
        var ema200 = this._dataEma200.ema;
        
        var ema200_short = this._dataEma200.short;
        var ema200_long = this._dataEma200.long;
        var ema200_lat = this._dataEma200.lat;
        
        // EMA 50
        var ema50 = this._dataEma50.ema;
        
        var ema50_short = this._dataEma50.short;
        var ema50_long = this._dataEma50.long;
        var ema50_lat = this._dataEma50.lat;
        
        // EMA 9
        var ema9 = this._dataEma9.ema;
        
        var ema9_short = this._dataEma9.short;
        var ema9_long = this._dataEma9.long;
        var ema9_lat = this._dataEma9.lat;
        
        var ema9_tc_short = this._dataEma9.tc == 's' || this._dataEma9.tc == 'h';
        var ema9_tc_long = this._dataEma9.tc == 'l';

        // EMA 25
        var ema25 = this._dataEma25.ema;
        
        var ema25_short = this._dataEma25.short;
        var ema25_long = this._dataEma25.long;
        var ema25_lat = this._dataEma25.lat;

        var ema25_tc_short = this._dataEma25.tc == 's' || this._dataEma25.tc == 'h';
        var ema25_tc_long = this._dataEma25.tc == 'l';
        
        var adx = parseFloat( this._dataDMI.adx );
        var mf = parseFloat( this._dataMom.mf );
        
        // 200 SHORT
        if ( ema200_short || ema200_lat ) {
            if ( ema50_short || ema50_lat ) {
                if ( ema50 >= ema200 ) {
                    /*NADA*/
                }
                else if ( ema50 < ema200 ) {
                    if ( adx < 20 && mf > 0 && ema9_tc_long && this._vlsUp ) {
                        this._compraBajoEma200 = true;
                        resEver = true;
                        regla = 'REGLA 1';
                    }
//                    else if ( ema25_tc_long && ema9_tc_long && this._ema9_toca_ema25 && 
//                         this._precioControl >= ema25  ) {
//                        resEver = true;
//                        this._compraEma25 = this._precioControl;
//                        this._compraEma25Time = this._kline.t;
//                        regla = 'REGLA 1 (COMPRA EMA 25)';
//                    }
                } // ema 50 < ema 200
            } // 50 short
            else if ( ema50_long ) {
                if ( ema50 < ema200 ) {
                    if ( adx < 24 && mf > 0 && ema9 < ema200 && ema9_tc_long && this._vlsUp ) {
                        this._compraBajoEma200 = true;
                        resEver = true;
                        regla = 'REGLA 2';
                    }
                }
            } // ema 50 long 
        } // 200 SHORT
        else if ( ema200_long ) {
            if ( ema50_long ) {
                if ( ema50 >= ema200 ) {
                    if ( adx < 20.5 && mf > 0 && ema9_tc_long == true && 
                         !this._adx20 && this._vlsUp ) {
                        resEver = true;
                        regla = 'REGLA 3';
                        if  ( this._adx20 ) this._compraAdx20Riesgo = true;
                    }
                } else if ( ema50 < ema200 ) { 
                    if ( adx < 20.5 && mf > 0 && ema9_tc_long == true && this._vlsUp ) {
                        resEver = true;
                        regla = 'REGLA 4';
                        this._compraBajoEma200 = true;
                    }                
                }
            } // ema 50 long
            else if ( ema50_short || ema50_lat ) {
                // NADA - NO COMPRAR PORQUE ESTARIA BAJANDO EL PRECIO
            }
        } // ema 200 long
        else if ( ema200_lat ) {

            
        } // ema200 lat
        
        
//               <|+++++++++++++++++++++++++++++++++++++++|>                            
        
        var obLog = {
            'REGLA' : regla
        };
            
        if ( this._ops.depurar ) {
            App.showInTime( obLog, '_COMPRA_TIME');        
        }
        
        if ( resEver ) {
            
            this._precioCompra = this._precioControl;
            
            Object.assign(this._dbgBuffer[_b], obLog);
            
            console.warn('ORDEN DE COMPRA 1');
            console.dir(obLog);

        } else {
            
            this._precioControlAnt = this._precioControl;
            
        }
        
        return resEver;
        
    }; // can buy alg 2
    
// -----------------------------------------------------------------------------
    
    /**
     * 
     * @returns {undefined|Boolean}
     * @deprecated description
     */
    canBuy_alg_2 () {
        
        if ( this._orderInProcess === true ) return;
        
        var auxDate = new Date();
        var _b = '_' +
                 auxDate.getFullYear() + '_' + 
                 (auxDate.getMonth() + 1) +  '_' +
                 auxDate.getDate()  +  '_' +
                 auxDate.getHours() +  '_' +
                 auxDate.getMinutes();
        
        var dbgCompra = {};
        var condCompra = ['tendencia', 'vela', 'precio', 'dmi', 'apr1'];
        condCompra.forEach((e,i,a) => {
            this._oCompraOk[e] = false;
            dbgCompra[e] = false;
        }, this);                
        
        var dmi = this._adx.getDMI();
        var ultMax = this._vls.getUltPrecioMax();
        if ( ultMax == false ) return false;  
        
        var porMargenMin = 1;
        
//        var porRangoCompra = 0.02;
//        var rangoCompra = Math.abs( (this._precioActual - this._precioCompra) / this._precioCompra * 100 );
//        var enRangoCompra = rangoCompra <= porRangoCompra ? true : false;
        
        // de compra sobre banda media o inferior
        var minL = 0.01;
        // max de compra s/ banda media o inferior
        var maxL = 0.15;
        
        // de compra sobre banda media o inferior
        var minM = 0.01;
        // max de compra s/ banda media o inferior
        var maxM = 0.25;        
        
        var band = this._bll.getData();
        var difL = (this._precioActual - band.l) / band.l * 100;
        var difM = (this._precioActual - band.m) / band.m * 100;
        var difLowUp = (band.u - band.l) / band.l * 100;
        var limLowUp = 0.8; // limite volatilidad bollinger
        
        var tocaBandaInf = difL >= minL && difL <= maxL;
        var tocaBandaMed = difM >= minM && difM <= maxM;
        var pasaLimLowUp = difLowUp >= limLowUp;
        

        
        var rangoTend = {prim: 0, ult: 0, dif: 0, tend: false};
        
        if ( band.ta < 0.3 ) this._propOC = 1.0001;
        else this._propOC = this._ops.propOC;
        
        // TENDENCIA
        // ============
        
        var tendVelas = this._vls.getTendencia(this._precioActual, rangoTend) == 'u' ? true : false;
        
        // tendencia subiendo y lateralizacion
        if ( band.ta < 0.1 && !pasaLimLowUp ) {
            dbgCompra.tendencia = 'REGLA 1 (LATERALIZACION)';
            this._oCompraOk.tendencia = true;
        } 
        // bajada y curva que dobla para subir
        else if ( band.t < -0.35 && band.ftb ) {
            dbgCompra.tendencia = 'REGLA 2 (FTB)';
            this._oCompraOk.tendencia = true;            
        } 
        // tendencia alcista que no sea fin de dicha tendencia
        else if ( band.t >= 0.1 && !band.fta && tendVelas ) {
            dbgCompra.tendencia = 'REGLA 3 (TEND ALCISTA QUE NO SEA FTA, CON AUXTEND)';
            this._oCompraOk.tendencia = true;                        
        }
        

        // VELAS 
        // =========
        
        // compra con apertura positiva - velas
        if ( this._precioActual >= parseFloat( this._kline.o ) ) {
            dbgCompra.vela = 'REGLA 1 (VELA ALCISTA)';
            this._oCompraOk.vela = true;
        }
        
        // PRECIO
        // =========

        if ( this._precioActual >= this._precioCompra && 
            this._precioActual >= ultMax ) {
            dbgCompra.precio = 'REGLA 1 (S/ ULT MAX)';
            this._oCompraOk.precio = true;            
        } else if ( tocaBandaInf )  {
            dbgCompra.precio = 'REGLA 2 (BANDA BAJA)';
            this._oCompraOk.precio = true;                        
        } 
        else if ( tocaBandaMed ) {
            dbgCompra.precio = 'REGLA 3 (BANDA MEDIA)';
            this._oCompraOk.precio = true;                                    
        }
        
        // MARGEN
        // =========
        
        
        // BOLLINGER
        // =============

//        this._oCompraOk.bollinger = 
//            ( difL >= min && difL <= max ) ||
//            ( difM >= min && difM <= max )
//        ? true : false;            
        
        // ADX
        // =========
        
        // si adx < 20 y esta en banda inferior    
        if ( dmi.adx <= 20 && tocaBandaInf ) {
            dbgCompra.dmi = 'REGLA 1 (ADX < 20 BANDA INFERIOR)';
            this._oCompraOk.dmi = true;                                                
        } 
        // si tendencia < 25 y estamos en banda media o baja
        else if ( dmi.adx > 15 && dmi.adx < 25 && ( tocaBandaInf || tocaBandaMed ) && pasaLimLowUp ) {
            dbgCompra.dmi = 'REGLA 2 (ADX 15-25 BANDAs y > LIM BANDAS)';
            this._oCompraOk.dmi = true;                                                            
        } 
        // si la tendencia va hacia arriba con la volatilidad necesaria
        else if ( dmi.adx >= 25 && pasaLimLowUp ) {
            dbgCompra.dmi = 'REGLA 3 (ADX >= 25 > LIM BANDAS)';
            this._oCompraOk.dmi = true;                                                                        
        }
        else if ( dmi.adx >= 25 && !pasaLimLowUp && tocaBandaInf ) {
            dbgCompra.dmi = 'REGLA 4 (ADX >= 25 < LIM BANDAS EN BANDAS)';
            this._oCompraOk.dmi = true;                                                                                    
        }
        
        // REGLA 1 
        // ==========
        
        // si la diferencia en la banda media y el tope con respeto al margen minimo de ganancia
        // supera el 20%, aprobar
        var porDifUpPrecio = (band.u - this._precioActual) / this._precioActual + 100;
        var porDifUpMargen = (porDifUpPrecio - porMargenMin) / porMargenMin * 100;
        
        // Tendencia debil y banda media, debe pasar el margen minimos para que se compre, un 20%
        if ( band.t < 1 && tocaBandaMed ) {
            dbgCompra.apr1 = 'REGLA 1 (TEND DEBIL, BANDA MEDIA)';
            this._oCompraOk.apr1 = true;                                                                                                
        } 
        // tendencia debil y banda baja
        else if ( band.t < 1 && tocaBandaInf ) {
            dbgCompra.apr1 = 'REGLA 2 (TEND DEBIL, BANDA BAJA)';
            this._oCompraOk.apr1 = true;                                                                                                
        } 
        // tendencia media o fuerte
        else if ( band.t >= 1 ) {
            dbgCompra.apr1 = 'REGLA 3 (TEND >= MEDIA)';
            this._oCompraOk.apr1 = true;                                                                                                            
        }
        
        // DEBUG
        var muestraCond = {};
        condCompra.forEach((e,i,a) => {
            muestraCond[e] = this._oCompraOk[e];
        }, this);
        
        var obLog = Object.assign( {
                'A TIME' : auxDate.toString(),
                'P ACTUAL' : this._precioActual,
                'P APERTURA' : this._kline.o,
                'P COMPRA' : this._precioCompra,
                'P ULT MAX' : ultMax,
                'DIF LOW' : difL,
                'DIF MEDIA' : difM,
                'DIF LOW UP' : difLowUp,
                'TOCA B INF' : tocaBandaInf,
                'TOCA B MED' : tocaBandaMed,
                'DET TEND.' : rangoTend,
                'DET DMI' : dmi,
                'DET BANDAS' : band,
                'TEND VELAS' : tendVelas
            }, dbgCompra);
            
        this._dbgBuffer[_b] = Object.assign({}, obLog);
        
        if ( this._ops.depurar ) {
            App.showInTime( obLog, '_COMPRA_TIME');        
        }
        
        var resEver = condCompra.every((e,i,a) => {
            if ( this._oCompraOk[e] == false )
                return false;
            return true;
        }, this);
        
        if ( !resEver ) return false;
        
        console.warn('ORDEN DE COMPRA');
        console.dir(obLog);
        
        return true;        
        
    }; // can buy alg 2

// -----------------------------------------------------------------------------
    
    /**
     * 
     * @returns {Boolean}
     * @deprecated description
     */
    canBuy_alg_1 () {
        
        var band = this._bll.getData();
        var difL = (this._precioActual - band.l) / band.l * 100;
        var difM = (this._precioActual - band.m) / band.m * 100;
        var difU = (this._precioActual - band.u) / band.u * 100;
        var difLowUp = (band.u - band.l) / band.l * 100;
        var margenTotal = this._ops.limMargenCompra + this._ops.limMargenVenta;
        // de compra sobre banda media o inferior
        var min = 0.05;
        // max de compra s/ banda media o inferior
        var max = 0.2;
        this._oCompraOk.tendencia = this._vls.getTendencia() == 'u' ? true : false;
        
        // Zona de compra - bollinger
        if ( 
            ( difL >= min && difL <= max ) ||
            ( difM >= min && difM <= max )
        ) this._oCompraOk.bollinger = true; 
        
        // compra con apertura positiva - velas
        if ( this._kline.o && this._precioActual >= this._kline.o )
            this._oCompraOk.vela = true;
        
        // diferencia - margen
        if ( difLowUp > margenTotal || 
             difU >= 0
        ) {
            this._oCompraOk.margen = true;
        }
        
        this._oCompraOk.precio = this._precioActual >= this._precioCompra ? true : false;
        
//        App.showInTime({
//            'difL' : difL,
//            'difM' : difM,    
//            'difU' : difU,    
//            'difLowUp' : difLowUp,
//            'tendencia' : auxTend,
//            'precioActual' : this._precioActual,
//            'precioMin' : this._precioMin,
//            'precioCompra' : this._precioCompra,
//            'band'  : band,
//            'COMPRA_BLL' : compraBllOk,
//            'COMPRA_VELA' : compraVelaOk,
//            'COMPRA_MARGEN' : compraMargenOk,
//            'COMPRA_TENDENCIA' : compraTendOk
//        }, '_COMPRA_TIME', true);        
        
        for ( var i in this._oCompraOk ) {
            if ( this._oCompraOk[i] == false )
                return false;
        }
        
        return true;
        
    }; // can buy
    
// -----------------------------------------------------------------------------

    /**
     * 
     * @deprecated 
     */
    canSell_alg_1 () {
        
        if ( this._orderInProcess === true ) return;

        // si llega a este porcentaje tratar de retener de este para arriba
        // regulando el retroceso
        var retener = 2; 
        // descuento inicial, si precio > retener iria bajando
        var porTolDesc = 62;
        // % inc topoe para descuentos cuado el descenso sobre el precio max
        // llege porTolDesc
        var porIncTopeDesc = 1;  
        // si llega a este valor vender
        var limMargenVenta = 0;
        
        var tipo = false;
        var difMax = this._precioMax - this._precioCompra;
        var difAct = this._precioMax - this._precioActual;
        var descDif = difAct / difMax * 100;
        var auxTope = porIncTopeDesc;

        // bollinger apretado, tendencia muy baja
        if ( this._dataBLL.t < 0.3 ) {
            this._propOV = 1.0001;
        } else {
            this._propOV = this._ops.propOV;                
        }
        
        // cuando diferencia de bandas es menor al minimo
//        if ( difLowUp <= limLowUp ) {
//            limMargenVenta = difLowUp * 90 / 100;
//        }
        

        
        if ( this._porIncPrecioMax >= retener ) {
            porTolDesc = 38;
        } 
        
//               <|+++++++++++++++++++++++++++++++++++++++|>                    
//                          VENDER SI:
        
        // margen minimo de ganancia cuando banda apretada
//        if ( this._precioActual > this._precioCompra &&
//             limMargenVenta > 0 &&
//             this._porIncPrecioActual >= limMargenVenta
//        ) {
//            tipo = 'M MIN'; 
//        } 
        
//        // descuento precio minimo
//        else if ( this._precioActual > this._precioCompra && 
//             this._precioActual < ultPrecioMin
//        ) {
//            tipo = 'D PM'; 
//        } 
        
        // DESCUENTO PORENTAJE DE RETROCESO
        if ( this._precioActual > this._precioCompra && 
                    this._porIncPrecioMax >= auxTope &&
                    descDif >= porTolDesc
        ) {
            tipo = 'D %RET'; 
        } 
        
        // PERDIDA
        else if ( this._porIncPerdida >= this._ops.limMargenPerdida  ) {
            tipo = 'PERDIDA';
        }     
        
        if ( tipo !== false ) {
            
            console.warn('DATOS DE VENTA');
            console.dir({
                'A BOOK' : (new Date( this._bookTickerTime )).toString(),
                'difMax' : difMax,
                'difAct' : difAct,
                'descDif' : descDif,
                'auxTope' : auxTope,
                'difLowUp' : this._bllDifLowUp,
                'tol descuento' : porTolDesc,
                'ult precio max' : this._ultPrecioMax,
                'ult precio min' : this._ultPrecioMin,
                'inc precio max' : this._porIncPrecioMax,
                'inc perdida' : this._porIncPerdida
            });            
            
        }
        
        return tipo;
        
    }; // can sell
// -----------------------------------------------------------------------------

    canSell_alg_2 () {
        
        if ( this._orderInProcess === true ) return;

        var auxDate = new Date( this._bookTickerTime );
        var _b = this._getIndexDateTime(auxDate);

        // si llega a este porcentaje tratar de retener de este para arriba
        // regulando el retroceso
        var retener = 2; 
        // descuento inicial, si precio > retener iria bajando
        var porTolDesc = 62;
        // % inc topoe para descuentos cuado el descenso sobre el precio max
        // llege porTolDesc
        var porIncTopeDesc = 1;  
        var porIncTopeDescEma25 = 0.2;  
        
        var tipo = false;
        var difMax = this._precioMax - this._precioCompra;
        var difAct = this._precioMax - this._precioActual;
        var descDif = difAct / difMax * 100;
        var auxTope = porIncTopeDesc;

        // bollinger apretado, tendencia muy baja
        if ( this._dataBLL.t < 0.3 ) {
            this._propOV = 1.0001;
        } else {
            this._propOV = this._ops.propOV;                
        }
        
        
        if ( this._porIncPrecioMax >= retener ) {
            porTolDesc = 20;
        } 
        
        var ema9_short = this._dataEma9.tc == 's' ? true : false;
        var margenPerdida = this._compraAdx20Riesgo === true ? 0.7 : this._ops.limMargenPerdida;
        
        // DESCUENTO PORENTAJE DE RETROCESO - TRADICIONAL
        if ( this._precioActual > this._precioCompra && 
                    this._porIncPrecioMax >= auxTope &&
                    descDif >= porTolDesc &&
                    ema9_short &&
                    !this._compraEma25
        ) {
            tipo = 'D %RET'; 
        } 
        
//        // DESCUENTO PORENTAJE DE RETROCESO
//        if ( this._precioActual > this._precioCompra && 
//             this._porIncPrecioMax >= auxTope &&
//             descDif >= porTolDesc &&
//             ema9_short &&
//             this._compraBajoEma200
//             this._dataDMI.adx >= 25
//        ) {
//            tipo = 'D %RET MAX'; 
//        } 
        
        
        // VENTA CON EMA25 - SIN EFECTO POR EL MOMENTO
        else if ( this._difCompraEma25 >= 0.5 && this._precioActual < this._dataEma50.ema &&
                this._compraEma25Time < this._kline.t ) {
            tipo = 'P < EMA50';
        } 
        
        // PERDIDA
        else if ( this._porIncPerdida >= margenPerdida  ) {
            tipo = 'PERDIDA';
        }     
        
        var obLog = {
            'descDif' : descDif,
            'auxTope' : auxTope,
            'tol descuento' : porTolDesc,
            'ult precio max' : this._ultPrecioMax,
            'ult precio min' : this._ultPrecioMin,
            'inc precio max' : this._porIncPrecioMax,
            'inc perdida' : this._porIncPerdida
        };        
        
        Object.assign(this._dbgBuffer[_b], obLog);
        
        if ( tipo !== false ) {
            
            console.warn('DATOS DE VENTA');
            console.dir(this._dbgBuffer[_b]);   
            
            this._compraEma25 = 0;
            this._compraAdx20Riesgo = false;
            
        }
        
        return tipo;
        
    }; // can sell
    
// -----------------------------------------------------------------------------
    
    /**
     * Para iniciar en modo venta, configura los parametros de compra
     * IMPORTANTE: primero se debe configurar la cantidad inicial
     * @param {type} precioCompra
     * @returns {undefined}
     */
    _config_precio_compra ( precioCompra ) {
        
        this._precioCompra = parseFloat( precioCompra );
        var now = Date.now();
        var cant = parseFloat( this._ops.cantInicial );
        var total = cant * this._precioCompra;
        
        this._datosUltCompra = {
            'idCompra' : now,
            'moneda' : this._ops.symbolPar1,
            'precioCompra' : this._precioCompra,
            'precioVenta' : 0,
            'precioMargen' : 0,
            'tipoVenta' : null,
            'fechaCompra' : now,
            'fechaVenta' : null,
            'fechaDif' : null,
            'porIncCompra' : 0,
            'porIncVenta' : 0,
            'porTotalMargen' : 0, // sobre los totales (precio * cant)
            'totalMargen' : 0,
            'porDescenso' : 0,
            'cantCompra' : cant,
            'cantVenta' : 0,
            'totalCompra' : total,
            'totalVenta' : 0
        };        
        
        this._cantPar2 = total;
        this._cantInicCompra = total;
        
        var upData = {
            executedQty : cant,
            cummulativeQuoteQty : total,
            side : OP_COMPRA
        };
        
        this.__update_qty_pars(upData);     
        
        OvWrk.sendBrowser( COMPRA, this._datosUltCompra );
        
    }; // confir precio compra
    
// -----------------------------------------------------------------------------

    getDebug (data) {
        
        var fecha = '_' + data.data.fecha.toString().replace(/\s/g, '_');
        
        if ( typeof this._dbgBuffer[fecha] != 'undefined' )
            return this._dbgBuffer[fecha];
        else return '';
        
    }; // get debug
    
// -----------------------------------------------------------------------------

    _getIndexDateTime (auxDate) {
        return '_' +
                 auxDate.getFullYear() + '_' + 
                 (auxDate.getMonth() + 1) +  '_' +
                 auxDate.getDate()  +  '_' +
                 auxDate.getHours() +  '_' +
                 auxDate.getMinutes() +  '_' +
                 auxDate.getSeconds();
    }; // getDateTime
    
// -----------------------------------------------------------------------------
//                              BACK TEST
// -----------------------------------------------------------------------------    
    
    _startBackTest () {
        
        var ob = this;
        
        this.startWsTrade().then(() => {
            
            ob.start().then(() => {
                ob._wsTrade.sendBasic(false, false, 'http-backtest');    
            }); 
            
        });        
        
                   
        
    }; // start back test
    
    
// *****************************************************************************
} // OvWrk


// -----------------------------------------------------------------------------

onmessage = function (e) {
    
    if ( e.data.action != 'getData' ) {
        console.log('recibiendo:');
        console.dir(e.data);
    }
    
    if ( e.data.action == 'start' ) {
        if ( !wrk )
            wrk = new OvWrk(e.data.data);
        else console.warn('NO SE PUEDE START 2 VECES');
    } else if ( e.data.action == 'reconnect' ) {
        wrk.start();
    } else if ( e.data.action == 'pause' ) {
        wrk.pause();
    } else if ( e.data.action == 'resume' ) {
        wrk.resume();
    } else if ( e.data.action == 'stop' ) {
        wrk.stop();
        close();
    } else if ( e.data.action == 'getData' ) {
        OvWrk.sendBrowser( 'getData', wrk.getData() );
    } else if ( e.data.action == 'setData' ) {
        wrk.setData(e.data.data);
    } else if ( e.data.action == 'setOptions' ) {
        wrk.setOptions(e.data.data);
    } else if ( e.data.action == 'getOptions' ) {
        OvWrk.sendBrowser( 'getOptions', wrk.getOptions() );
    } else if ( e.data.action == 'getDebug' ) {
        OvWrk.sendBrowser( 'getDebug', wrk.getDebug(e.data) );
    }

};

