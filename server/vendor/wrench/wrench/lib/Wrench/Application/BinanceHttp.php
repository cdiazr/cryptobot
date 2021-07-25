<?php

namespace Wrench\Application;
use Wrench\Connection;

class BinanceHttp extends Application
{
    protected $_clients           = array();
    protected $_serverClients     = array();
    protected $_serverInfo        = array();
    protected $_serverClientCount = 0;
    
    protected $_subscribers = array();
    protected $_lastSuscId = 1;
    protected $_cantSubscribers = 0;
    
    protected $_wsClient = false;
    //protected $_wsApi = 'wss://testnet.binance.vision/stream';
    //protected $_wsApi = 'wss://stream.binance.com:9443/stream';
    
    protected $_hilos = array();
    protected $_stopWsLoop = false;
    
    protected $_pongTime = 180; // segundos
    protected $_lastPong = 0;
    
    protected $_resWsFile = false;
    protected $_resHttpFile = false;
    
    protected $_resWsFileRead = false;
    
    protected $_wsNetworkTrafficPath = false;
    protected $_httpNetworkTrafficPath = false;
    
    protected $_saveStream = true;
    

// -----------------------------------------------------------------------------    
    
    public function __construct () {
        
        $this->_wsNetworkTrafficPath = \Config::get('wsNetworkTrafficPath');
        $this->_httpNetworkTrafficPath = \Config::get('httpNetworkTrafficPath');
        
        \Unirest\Request::verifyPeer(false);
        
        $this->_lastPong = microtime(true);
        
        register_shutdown_function(array($this, 'close_resources'));        
        
        
    } // __construct
    
// -----------------------------------------------------------------------------    
    
    public function close_resources () {
    
        if ( is_resource($this->_resWsFile) )
            @fclose($this->_resWsFile);
    
        if ( is_resource($this->_resHttpFile) )
            @fclose($this->_resHttpFile);
        
    } // close_resources
    
// -----------------------------------------------------------------------------    
    
    /**
     * @param Connection $client
     */
    public function onConnect($client)
    {
        $id = $client->getId();
        $this->_clients[$id] = $client;
        echo "\n CLIENTE CONNECTADO \n";
        //$this->_sendServerinfo($client);
    }

// -----------------------------------------------------------------------------    
    
    /**
     * @param Connection $client
     */
    public function onDisconnect($client)
    {
        $id = $client->getId();
        unset($this->_clients[$id]);
        $this->_wsUnsubscribe($id);
        echo "\n CLIENTE DESCONECTADO \n";
        die();
    }
    
// -----------------------------------------------------------------------------    

    public function onData($data, $client) {
        
        $this->_log($data, 'RECIBIENDO DATA');
        
        $decodedData = $this->_decodeData($data);
        
        $clientId = $client->getId();
        
        if ($decodedData === false) {
            // @todo: invalid request trigger error...
        } else if ( $decodedData['action'] == 'http-request' ) {
            
            $area = $decodedData['data']['areaUrl'];
            $query = isset($decodedData['data']['query']) ? $decodedData['data']['query'] : array() ;
            $signed = isset($decodedData['signed']);
            $secretKey = isset($decodedData['data']['secretKey']) ? $decodedData['data']['secretKey'] : false;
            
            if ( count($query) && $decodedData['data']['method'] == 'GET' || $signed ) {
                $query = self::array_url( $query );
            } else if ( $decodedData['data']['method'] == 'GET' ) $query = '';
            
            if ( $secretKey && $signed ) {
                $signature = hash_hmac('sha256', $query, $secretKey, false);
                $query .= "&signature=$signature";
            } else if ( $signed ) {
                $privKey = file_get_contents(__DIR__.'/test-prv-key.pem');
                $signature = urlencode( self::_signRequest($query, $privKey) );
                $query .= "&signature=$signature";
            }
            
            $decodedData['data']['query'] = $query;
            
            //$this->_log($decodedData['data']['query'], 'QUERY');
            
            $res = $this->sendHttpRequest($decodedData['data']);
            $res['areaUrl'] = $area;
            $this->_sendToBrowser($res);
            
        } else if ( $decodedData['action'] == 'subscribe' ) {
            
            if ( !is_resource( $this->_resWsFile ) )
                $this->_resWsFile = fopen($this->_wsNetworkTrafficPath, 'w');
            
            $stream = $decodedData['stream'];
            //$clientId = $client->getId();
            $wsUrl = $decodedData['data']['wsUrl'];
            
            
            //ConnWrap::addConn($client, $clientId);
//            $hilo = Hilo::call(array($this, 'getClient'), $clientId, $stream);
//            $this->_hilos[$clientId][$stream] = $hilo;
            
//            $bw = new BinanceWs($client, $clientId);
//            $bw->subscribe($clientId, $stream);
            
            $this->_wsSubscribe($clientId, $stream, $wsUrl);
            
        } else if ( $decodedData['action'] == 'unsubscribe' ) {
            
            $stream = $decodedData['stream'];
            //$clientId = $client->getId();
            
//            $bw = new BinanceWs($client, $clientId);
//            $bw->unsubscribe($clientId, $stream);
            
            $this->_log(false, 'action: unsubscribe');
            $this->_wsUnsubscribe($clientId, $stream);
            
        } else if ( $decodedData['action'] == 'order' ) {
            
            $area = $decodedData['data']['areaUrl'];
            $query = self::array_url( $decodedData['data']['query'] );
            $privKey = file_get_contents(__DIR__.'/test-prv-key.pem');
            
            $signature = urlencode( self::_signRequest($query, $privKey) );
            $query .= "&signature=$signature";
            //$query = urlencode( $query );
            $decodedData['data']['query'] = $query;
            
            $this->_log($query, 'QUERY');
            
            $res = $this->sendHttpRequest($decodedData['data']);
            $res['areaUrl'] = $area;
            $this->_sendToBrowser($res);            
            
            
        } else if ( $decodedData['action'] == 'http-backtest' ) {
            
            $r = fopen($this->_httpNetworkTrafficPath, 'r');
            $a = array();
            $c = false;
            $cad = '';
            
            while (true) {
                
                $c = fgetc($r);
                
                if ( $c === false || $c == '|' ) { // enviar
                    $a = unserialize($cad);
                    
                    foreach ($this->_clients as $sendto) {
                        $sendto->send($a);
                    }
                    $cad = '';
                } else {
                    $cad .= $c;
                }
                
                if ( $c === false ) break;
                
            } // while
            
        } else if ( $decodedData['action'] == 'ws-backtest' ) {
        
            $a = array();
            $c = false;
            $cad = '';            
            
            if ( !is_resource($this->_resWsFileRead) )
                $this->_resWsFileRead = fopen($this->_wsNetworkTrafficPath, 'r');
            
            while (true) {
                
                $c = fgetc($this->_resWsFileRead);
                
                if ( $c === false || $c == '|' ) { // enviar
                    
                    //usleep(1);
                    
                    $a = unserialize($cad);
                    foreach ($this->_clients as $sendto) {
                        $sendto->send($a);
                    }
                    $cad = '';
                    
                    if ( $decodedData['data']['query'] == 'stopOnOpenKlines' &&
                         strpos($a['stream'], '@kline') !== false ) {
                        break;
                    }                                    
                    
                } else {
                    $cad .= $c;
                }
                
                if ( $c === false ) break;
                

                
                
            } // while
            
//            $client = $this->_clients[$clientId];
//            $client->close();                 
            
        } // ws backtest
        
    } // onData
    
// -----------------------------------------------------------------------------
    
    public function getClient ( $clientId ) {
    
        return $this->_clients[$clientId];
        
    } // getClient
    
// -----------------------------------------------------------------------------    
    
    public function onWsData ($data) {
        
        
        $decodedData = json_decode($data, true);
        
        if ( is_array($decodedData) && array_key_exists('result', $decodedData) ) {
            if ( is_null($decodedData['result']) ) {
                $this->_log(false, 'SUSCRIPCION ACEPTADA');
            } else {
                $this->_log( $decodedData['result'], 'SUSCRIPCIÓN RECHAZADA' );
            }
        } else if ( is_array($decodedData) && array_key_exists('code', $decodedData) ) {
            $this->_log($decodedData, 'ERROR EN WS');
        } else if ( !is_array($decodedData) ) {
            $this->_log($decodedData, 'NO SE PUDO DECODIFICAR');
        }
        
        
        
        if ( isset($decodedData['stream']) ) {
            $this->sendAllSubscribers($decodedData);
        }
        
    } // on_ws_data
    
// -----------------------------------------------------------------------------

    protected function sendHttpRequest ( $data ) {
        
        if ( $data['method'] == 'GET' ) {
            $query = isset($data['query']) ? "?$data[query]" : '';
            $response = \Unirest\Request::get($data['apiUrl'].$data['areaUrl'].$query, 
                $data['headers'], null);            
        } 
        else if ( $data['method'] == 'DELETE' ) {
            $response = \Unirest\Request::delete($data['apiUrl'].$data['areaUrl'], 
                $data['headers'], $data['query']);            
        }
        else if ( $data['method'] == 'POST' ) {
            $response = \Unirest\Request::post($data['apiUrl'].$data['areaUrl'], 
                $data['headers'], $data['query']);            
        }
        else if ( $data['method'] == 'PUT' ) {
            $response = \Unirest\Request::put($data['apiUrl'].$data['areaUrl'], 
                $data['headers'], $data['query']);            
        }
        
        $res = array(
            'code' => $response->code,
            'body' => $response->body,
            'headers' => $response->headers,
        );
        
        return $res;
        
    } // sendHttpRequest  
    
// -----------------------------------------------------------------------------
    
    protected function sendWsRequest ( $data, $wsUrl, $reconnect = false ) {
        
        if ( !$this->_wsClient || $reconnect ) {
            $this->_wsClient = new \Wrench\Client($wsUrl, 
                'http://localhost', array(
                'on_data_callback' => array($this, 'onWsData')
            ));
        }
        
        $this->_wsClient->connect();
        
        $this->_log($data, 'SENDING WS DATA');
        
        try {
            
            $this->_wsClient->sendData( json_encode( $data ) );
            //$this->_wsClient->receive();

            while ( true ) {

                if ( !$this->_cantSubscribers ) break;

                $time = microtime(true);
                if ( $time - $this->_lastPong > $this->_pongTime ) {
                    $this->_log(false, 'SENDING PONG');
                    $this->_wsClient->sendData( json_encode( array( round( microtime(true), 0) ) ), \Wrench\Protocol\Protocol::TYPE_PONG );
                    $this->_lastPong = $time;
                }


    //            usleep(100000);                        
                if ( !$this->_wsClient->isConnected() ) {
                    $this->_log(false, 'API SERVER DISCONNECTED');
                    break;
                } else {
                    $this->_wsClient->receive();    
                }

            }            
            
        } catch (Exception $ex) {
            $this->_log(false, 'ERROR DE RED INTENTANDO RECONECTAR ...');
        }
        

        
        if ( $this->_cantSubscribers ) {
            $this->_log(false, 'API SERVER RECONECTING ...');
            $this->sendWsRequest($data, $wsUrl, true);
        }
        
//        echo "\n --- RESPONSE -- \n";
//        print_r($response);
        
        //$this->_wsClient->disconnect();        
        
    } // sendWsRequest    
    
// -----------------------------------------------------------------------------    
    
    
    
// -----------------------------------------------------------------------------

    private function _sendToBrowser($data) {
        $encodedData = $this->_encodeData('response', $data);
        
        try {
            
            if ( $this->_saveStream ) {

                if ( !is_resource($this->_resHttpFile) ) {
                    if ( file_exists($this->_httpNetworkTrafficPath) ) 
                        unlink($this->_httpNetworkTrafficPath);
                    $this->_resHttpFile = fopen($this->_httpNetworkTrafficPath, 'w');
                }

                fwrite($this->_resHttpFile, serialize($encodedData).'|');
            
            }
            
        } catch ( Error $err ) {
            $this->_saveStream = false;
        } catch ( Exception $ex ) {
            $this->_saveStream = false;
        }
        
        foreach ($this->_clients as $sendto) {
            $sendto->send($encodedData);
        }
    }    
    
// -----------------------------------------------------------------------------

    private function _sendAll($encodedData, $subscribers = false) {
        
        if (count($this->_clients) < 1) {
            return false;
        }

        foreach ($this->_clients as $sendto) {
            $sendto->send($encodedData);
        }
        
    } // _sendAll    
    
// -----------------------------------------------------------------------------

    public function sendAllSubscribers ($decodedData) {
        
        if ( !is_array($decodedData) ) return;
        if ( !count($this->_subscribers) ) return;
        
        try {
            
            if ( $this->_saveStream ) {
            
                if ( !is_resource( $this->_resWsFile ) ) {
                    if ( file_exists($this->_wsNetworkTrafficPath) ) 
                        unlink($this->_wsNetworkTrafficPath);
                    $this->_resWsFile = fopen($this->_wsNetworkTrafficPath, 'w');
                }

                fwrite($this->_resWsFile, serialize($decodedData).'|');            
            
            }
            
        } catch ( Error $err ) {
            $this->_saveStream = false;            
        } catch (Exception $ex) {
            $this->_saveStream = false;
        }

        
        $client;
        $clientId;
        
        try {

            foreach ( $this->_subscribers as $clientId => $streams ) {
                
                $client = $this->_clients[$clientId];
                $client->send($decodedData);                
                
            } // eah subs

//            foreach ( $this->_subscribers as $clientId => $streams ) {
//                foreach ( $streams as $row ) {
//                    if ( $decodedData['stream'] == $row['stream'] ) {
//                        $client = $this->_clients[$clientId];
//                        $client->send($decodedData);
//                    }
//                }
//            } // eah subs
            
        } catch (\Exception $ex) {
            echo "\n ERROR AL RESPONDER WS DATA \n";
            if ( $ex->getCode() == 8 ) {
                unset($this->_subscribers[$clientId]);
                $this->_cantSubscribers = count($this->_subscribers);
                $client->close();
                $this->_wsUnsubscribe($clientId);
            } else throw $ex;
            print_r(array(
                'code' => $ex->getCode(),
                'error' => $ex->getMessage(),
            ));
//            throw $ex;
        }
        
    } // _sendAllSubscribers
    
// -----------------------------------------------------------------------------
    
    protected function _wsSubscribe ( $clientId, $stream, $wsUrl ) {
    
        $subscId = $this->_lastSuscId++;

        $this->_subscribers[$clientId][] = array(
            'id' => $subscId,
            'stream' => $stream
        );
        
        $aStreams = is_array($stream) ? $stream : array( $stream );
        
        $sendData = array(
            'method' => 'SUBSCRIBE',
            'params' => $aStreams,
            'id' => $subscId
        );
        
        $this->_cantSubscribers = count($this->_subscribers);
        $this->sendWsRequest($sendData, $wsUrl);        
        
    } // wsSubscribe
    
// -----------------------------------------------------------------------------
    
    /**
     * Desubscribirse
     * @param int $clientId
     * @param string $stream si es falso se desubscribe de todos los servicios
     * @return 
     */
    protected function _wsUnsubscribe ($clientId, $stream = false) {
    
        if ( !array_key_exists($clientId, $this->_subscribers) )
            return;

        foreach ( $this->_subscribers[$clientId] as $k => $row ) {
            
            $aStreams = is_array($row['stream']) ? $row['stream'] : array( $row['stream'] );

            $sendData = array(
                'method' => 'UNSUBSCRIBE',
                'params' => $aStreams,
                'id' => $row['id']
            );

            $this->_log($sendData, 'DESUBSCRIBIENDO');
                
            $this->_stopWsLoop = false;
            $this->sendWsRequest($sendData, false);

            unset( $this->_subscribers[$clientId][$k] );
            $this->_cantSubscribers = count($this->_subscribers);
            
        } // each subs   
        
    } // wsUnsubscribe
    
// -----------------------------------------------------------------------------    

    private static function _signRequest ( $data, $privKey ) {
        $signature = '';
        openssl_sign($data, $signature, $privKey, OPENSSL_ALGO_SHA256);
        return base64_encode($signature);
    } // _sign_request    

// -----------------------------------------------------------------------------

    private static function array_url ($array, $ex = array()) {
        
        $a = array();

        foreach($array as $k => $v) {
            if (!in_array($k, $ex)) $a[] = "$k=$v";
        }

        return implode('&', $a);

    } //functio array_url    
    
    
}
