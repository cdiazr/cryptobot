/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <robert@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 7 may. 2021 - 16:59:34
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

class QueryFilter {
    
    static filter_accountInfo () {
        
        return {
            'recvWindow' : 10000,
            'timestamp' : Date.now()
        };
        
    }; // account info
    
// -----------------------------------------------------------------------------    
    
    static filter_openOrders () {
        
        return {
            'recvWindow' : 10000,
            'timestamp' : Date.now()
        };
        
    }; // account info
    
// -----------------------------------------------------------------------------    
  
// *****************************************************************************    
}; // query filter