/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 8 may. 2021 - 13:11:24
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

const COMPRA = 'compra';
const VENTA = 'venta';

const VIRTUAL = 'virtual';
const REAL = 'real';

const OP_COMPRA = 'BUY';
const OP_VENTA = 'SELL';

const ERR_001 = 'Precio de orden menor al precio mínimo';
const ERR_002 = 'Precio de orden mayor al precio maximo';
const ERR_003 = 'Cant. de orden menor al mínimo';
const ERR_004 = 'Cant. de orden mayor al maximo';

// orden estado estadu
const OE_INACTIVO = 'INACTIVO';
const OE_EJECUTANDO = 'EJECUTANDO';
const OE_EJECUCION_PARCIAL = 'EJECUCION PARCIAL';
const OE_COMPLETO = 'COMPLETADO';
const OE_RECHAZADO = 'RECHAZADO';
const OE_EXPIRADO = 'EXPIRADO';
const OE_CANCELADO = 'CANCELADO';
const OE_CANCELANDO = 'CANCELANDO';
const OE_ERROR = 'ERROR VERIFICAR STATUS';

//               <|+++++++++++++++++++++++++++++++++++++++|>                    
//                        OTM - ORDER TRADE METHOD
//               <|+++++++++++++++++++++++++++++++++++++++|>                    

// GTC (Good-Til-Canceled) orders are effective until they are executed or 
// canceled.
// 
// GTC: As the name says, your order will exist until you cancel it or if 
// someone takes your order.
const OTM_GTC = 'GTC';

// IOC (Immediate or Cancel) orders fills all or part of an order immediately 
// and cancels the remaining part of the order.
// 
// IOC: If you would buy an asset for an existing amount and price, and someone 
// is selling it for a similar price and a different amount, the exchange 
// would automatically take that order if the seller's amount is greater than 
// yours. But if the seller's amount is less than yours, the exchange would
// cancel the remaining amount. But the exchange would automatically cancel
// your entire order if no one is selling it at your price. Same goes if you
// are the seller.
const OTM_IOC = 'IOC';


// FOK (Fill or Kill) orders fills all in its entirety, otherwise, the entire 
// order will be cancelled
// 
// FOK: Similar as IOC, except for the fact that the someone must be selling 
// it at an amount greater than or equal to your amount. If no one is selling 
// it at that price and amount, your order would be immediately cancelled.
const OTM_FOK = 'FOK';
