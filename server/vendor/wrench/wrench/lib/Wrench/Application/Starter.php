<?php

namespace Wrench\Application;

use Wrench\Connection;

class Starter extends Application
{
    protected $_clients = array();
    protected $_serverPath = __DIR__.'/../../../../../../init-server.php';
    protected $_clientsRes = array();
    protected $_portCount = 0;
    protected $_portStep = 2;
    

// -----------------------------------------------------------------------------    
    
    public function __construct () {
        $this->_portCount = \Config::get('serverPort');
    } // __construct
    
    
    /**
     * @param Connection $client
     */
    public function onConnect($client)
    {
        $id = $client->getId();
        $this->_clients[$id] = $client;
        echo "\n STARTER CLIENTE CONNECTADO \n";
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
        echo "\n CLIENTE DESCONECTADO \n";
    }
    
// -----------------------------------------------------------------------------    

    public function onData($data, $client) {
        
        $this->_log($data->getPayload(), 'RECIBIENDO DATA');
        
        $decodedData = $this->_decodeData($data);
        $clientId = $client->getId();
        $debugFolder = \Config::get('serverDebugFolder');
        
        if ($decodedData === false) {
            // @todo: invalid request trigger error...
        } else if ( $decodedData['action'] == 'free-port' ) {
            
            $this->_portCount += $this->_portStep;
            
            $sendData = array(
                'port' => $this->_portCount - 1
            );
            
            $this->_sendToBrowser( $sendData, $clientId );              
            
        } else if ( $decodedData['action'] == 'http-request' ) {
            
            $descriptorSpec = array (
                0 => array('pipe', 'r'),
                1 => array('pipe', 'w'),
                2 => array('pipe', 'w')
            );              
            $pipes = array();
            $port = $decodedData['data']['port'] - 1;
            
            for ( $i = 1; $i <= 2; $i++ ) {
                
                $port++;
                $pipes = array();
                $file = 'php -f '.$this->_serverPath.' '.$port." > $debugFolder/_$port.txt";
                
                $this->_clientsRes[$clientId][$port] = array();
                $this->_clientsRes[$clientId][$port]['proc'] = proc_open($file, $descriptorSpec, $pipes);
                $this->_clientsRes[$clientId][$port]['pipe'] = &$pipes;                
                
                $status = proc_get_status( $this->_clientsRes[$clientId][$port]['proc'] );
                
                $this->_log($file, "ABRIENDO PROCESO EN PORT: $port PID: $status[pid] RUN: $status[running]");
                
            } // each por
            
            $sendData = array(
                'port_1' => $port - 1,
                'port_2' => $port
            );
            
            $this->_sendToBrowser( $sendData, $clientId );            
           
            
        } else if ( $decodedData['action'] == 'close-ws-server' ) {
            
            $ports = $decodedData['data']['ports'];
            
            foreach ( $ports as $k => $port ) {
                
                $status = proc_get_status( $this->_clientsRes[$clientId][$port]['proc'] );
                $infoProc = "PROC: ".($k+1)." PORT: $port PID: $status[pid]";
                
                if ( !isset($this->_clientsRes[$clientId][$port]) ) {
                    $this->_log(false, "NO HAY PROCESO CON PUERTO $port ABIERTO");
                }
                
//                $this->_log(false, "CERRANDO TUBERIAS $infoProc");
//    
//                for ( $i = 0; $i <= 2; $i++ ) {
//                    @fclose($this->_clientsRes[$clientId][$port]['pipe'][$i]);
//                    $this->_log(false, "CERRANDO PIPE $i");
//                }
                
                $this->_log(false, "CERRANDO $infoProc");
                $resClose = proc_terminate( $this->_clientsRes[$clientId][$port]['proc'] );

                if ( $resClose == 1 ) $this->_log(false, "CIERRE OK $infoProc");
                else $this->_log(false, "FALLO CIERRE $infoProc: $resClose");
                
                unset($this->_clientsRes[$clientId][$port]);                
                
            } // each port

        } // action
        
    } // onData
    
// -----------------------------------------------------------------------------

    private function _sendToBrowser($data, $clientId = false) {
        
        $encodedData = $this->_encodeData('response', $data);
        
        if ( $clientId ) {
            $this->_clients[$clientId]->send($encodedData);
        } else {
            foreach ($this->_clients as $sendto) {
                $sendto->send($encodedData);
            }            
        }
        
    }    

} // Starter
